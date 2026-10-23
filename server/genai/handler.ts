/**
 * HTTP routes for the GenAI gateway. Framework-free (node:http) so the same handler runs
 * inside the Vite dev server and in the production server.
 *
 *   GET  /api/ai/status          -> { enabled, model }
 *   POST /api/ai/task/:name      -> { data }        (structured output, schema-validated)
 *   POST /api/ai/chat            -> text/event-stream of {type:"delta"|"done"|"error"}
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { MAX_BODY_BYTES, isConfigured, rateLimitPerMinute } from './config.ts';
import { providerHealth } from './failover.ts';
import { GenAIError, runTask, streamChat, type ChatInput } from './llm.ts';
import { isTaskName } from './tasks.ts';

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > rateLimitPerMinute();
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function sendError(res: ServerResponse, err: GenAIError) {
  send(res, err.status, { error: { code: err.code, message: err.message } });
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new GenAIError('bad_request', 'Request is too large.', 413);
    chunks.push(chunk as Buffer);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new GenAIError('bad_request', 'Request body must be JSON.', 400);
  }
}

/** Returns true when the request was handled (so callers can fall through otherwise). */
export async function handleGenAI(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/ai/')) return false;

  if (req.method === 'GET' && url.pathname === '/api/ai/status') {
    const providers = providerHealth();
    const primary = providers.find((p) => p.healthy) ?? providers[0];
    send(res, 200, { enabled: providers.length > 0, provider: primary?.id ?? null, model: primary?.model ?? null, providers });
    return true;
  }

  if (req.method !== 'POST') {
    send(res, 405, { error: { code: 'bad_request', message: 'Method not allowed.' } });
    return true;
  }

  if (!isConfigured()) {
    sendError(res, new GenAIError('not_configured', 'AI is not configured on this server. Set GROQ_API_KEY and/or OPENROUTER_API_KEY (both free) and restart.', 503));
    return true;
  }

  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    sendError(res, new GenAIError('rate_limited', 'Too many requests. Please slow down for a minute.', 429));
    return true;
  }

  try {
    const body = await readJson(req);

    const taskMatch = /^\/api\/ai\/task\/([a-zA-Z]+)$/.exec(url.pathname);
    if (taskMatch) {
      const name = taskMatch[1];
      if (!isTaskName(name)) throw new GenAIError('bad_request', `Unknown task "${name}".`, 404);
      const data = await runTask(name, body);
      send(res, 200, { data });
      return true;
    }

    if (url.pathname === '/api/ai/chat') {
      const input = body as unknown as ChatInput;
      if (typeof input.message !== 'string' || !input.message.trim()) throw new GenAIError('bad_request', 'Message is required.', 400);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Connection', 'keep-alive');
      const abort = new AbortController();
      res.on('close', () => abort.abort());
      const event = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
      try {
        const text = await streamChat(input, (delta) => event({ type: 'delta', text: delta }), abort.signal);
        event({ type: 'done', text });
      } catch (err) {
        const e = err instanceof GenAIError ? err : new GenAIError('upstream', 'Something went wrong.', 500);
        if (!abort.signal.aborted) event({ type: 'error', code: e.code, message: e.message });
      }
      res.end();
      return true;
    }

    throw new GenAIError('bad_request', 'Unknown endpoint.', 404);
  } catch (err) {
    const e = err instanceof GenAIError ? err : new GenAIError('upstream', 'Something went wrong.', 500);
    if (e.status >= 500) console.error(`[genai] ${url.pathname} failed:`, err instanceof Error ? err.message : err);
    if (!res.headersSent) sendError(res, e);
    else res.end();
    return true;
  }
}
