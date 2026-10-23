/**
 * OpenAI-compatible providers (Groq, OpenRouter): free tiers running open models such as Llama.
 * Structured tasks use JSON mode plus the task's JSON Schema in the prompt, and every answer
 * is validated against the same Zod schema used for Claude, with one repair retry.
 */
import { z } from 'zod';
import type { CompatProvider } from './config.ts';
import { GenAIError } from './errors.ts';
import { SYSTEM_PROMPT } from './prompts.ts';
import { TASKS, type TaskName } from './tasks.ts';

type OAIContent = string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];
interface OAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: OAIContent;
}

/** How long to wait for a provider before failing over (override with LOVEMATE_AI_TIMEOUT_MS). */
const taskTimeoutMs = () => Number(process.env.LOVEMATE_AI_TIMEOUT_MS || 45_000);
const firstTokenTimeoutMs = () => Math.min(20_000, taskTimeoutMs());

/** Model fields for a request, with the provider's own fallback models when it has them. */
function modelParams(p: CompatProvider, vision: boolean) {
  const model = vision ? p.visionModel : p.model;
  const models = [...new Set([model, ...((vision ? p.visionFallbackModels : p.fallbackModels) ?? [])])].slice(0, 3);
  return { model, ...(models.length > 1 ? { models } : {}), ...p.extraBody?.(model) };
}

async function call(p: CompatProvider, body: Record<string, unknown>, signal: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${p.apiKey}`, 'Content-Type': 'application/json', ...p.headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new GenAIError('upstream', `Could not reach ${p.label}.`, 502);
  }
  if (res.ok) return res;
  const detail = (await res.text().catch(() => '')).slice(0, 300);
  console.error(`[genai/${p.id}] HTTP ${res.status}: ${detail}`);
  if (res.status === 401 || res.status === 403) throw new GenAIError('not_configured', 'The AI service is not configured correctly on the server.', 503);
  if (res.status === 429) throw new GenAIError('rate_limited', 'The free AI quota is busy right now. Please try again in a minute.', 429);
  // Groq rejects replies that are not valid JSON itself; treat that like any other bad answer.
  if (res.status === 400 && detail.includes('json_validate_failed')) throw new GenAIError('invalid_output', 'The AI returned an unexpected answer. Please try again.', 502);
  if (res.status === 400 || res.status === 413 || res.status === 422) throw new GenAIError('bad_request', 'That request could not be processed.', 400);
  throw new GenAIError('upstream', 'The AI service had a problem. Please try again.', 502);
}

/** Convert a task's user content (Claude block format) into OpenAI-style content. */
function toOAI(content: ReturnType<(typeof TASKS)[TaskName]['build']>): { content: OAIContent; hasImage: boolean } {
  if (typeof content === 'string') return { content, hasImage: false };
  const parts: Exclude<OAIContent, string> = [];
  let hasImage = false;
  for (const block of content) {
    if (block.type === 'text') parts.push({ type: 'text', text: block.text });
    if (block.type === 'image' && block.source.type === 'base64') {
      hasImage = true;
      parts.push({ type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } });
    }
  }
  return { content: parts, hasImage };
}

const schemaCache = new Map<TaskName, string>();
function schemaText(name: TaskName): string {
  let s = schemaCache.get(name);
  if (!s) {
    s = JSON.stringify(z.toJSONSchema(TASKS[name].schema, { unrepresentable: 'any' }));
    schemaCache.set(name, s);
  }
  return s;
}

export async function compatRunTask(p: CompatProvider, name: TaskName, input: Record<string, unknown>): Promise<unknown> {
  const task = TASKS[name];
  const { content, hasImage } = toOAI(task.build(input));
  const system = `${SYSTEM_PROMPT}\n\nReturn ONLY one JSON object that matches this JSON Schema. Use exactly these property names. No markdown fences, no commentary.\n${schemaText(name)}`;
  const messages: OAIMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await call(
      p,
      { ...modelParams(p, hasImage), messages, response_format: { type: 'json_object' }, max_tokens: 4096 },
      AbortSignal.timeout(taskTimeoutMs())
    );
    let body: { choices?: { message?: { content?: string }; finish_reason?: string }[] };
    try {
      body = (await res.json()) as typeof body;
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
      throw new GenAIError('upstream', timedOut ? `${p.label} did not answer in time.` : `${p.label} sent an unreadable reply.`, 502);
    }
    const choice = body.choices?.[0];
    if (choice?.finish_reason === 'length') throw new GenAIError('truncated', 'The answer was too long and got cut off. Please try a shorter request.', 502);
    const raw = choice?.message?.content ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    } catch {
      parsed = undefined;
    }
    const result = parsed === undefined ? null : task.schema.safeParse(parsed);
    if (result?.success) return result.data;

    // One repair attempt: show the model what was wrong.
    const problem = result ? z.prettifyError(result.error).slice(0, 800) : 'The reply was not valid JSON.';
    messages.push({ role: 'assistant', content: raw.slice(0, 4000) }, { role: 'user', content: `That JSON did not match the schema:\n${problem}\nReturn the corrected JSON object only.` });
  }
  throw new GenAIError('invalid_output', 'The AI returned an unexpected answer. Please try again.', 502);
}

/**
 * Stream a chat reply. Throws before any text is emitted if the provider is unavailable
 * (so the caller can fail over); once text has started, errors are final.
 */
export async function compatStreamChat(
  p: CompatProvider,
  context: string,
  turns: { role: 'user' | 'assistant'; content: string }[],
  onText: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const ctrl = new AbortController();
  signal?.addEventListener('abort', () => ctrl.abort(), { once: true });
  const firstTokenTimer = setTimeout(() => ctrl.abort(), firstTokenTimeoutMs());

  try {
    const res = await call(
      p,
      { ...modelParams(p, false), stream: true, max_tokens: 2048, messages: [{ role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` }, ...turns] },
      ctrl.signal
    );
    if (!res.body) throw new GenAIError('upstream', `${p.label} returned no reply.`, 502);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    for (;;) {
      let chunk: Awaited<ReturnType<typeof reader.read>>;
      try {
        chunk = await reader.read();
      } catch {
        if (signal?.aborted) return full;
        throw new GenAIError('upstream', `${p.label} stopped responding.`, 502);
      }
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const evt = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; error?: { message?: string } };
          if (evt.error && !full) throw new GenAIError('upstream', `${p.label}: ${evt.error.message ?? 'stream error'}`, 502);
          const delta = evt.choices?.[0]?.delta?.content;
          if (delta) {
            if (!full) clearTimeout(firstTokenTimer);
            full += delta;
            onText(delta);
          }
        } catch (e) {
          if (e instanceof GenAIError) throw e;
          /* ignore keep-alive comments or partial frames */
        }
      }
    }
    if (!full) throw new GenAIError('upstream', `${p.label} returned an empty reply.`, 502);
    return full;
  } finally {
    clearTimeout(firstTokenTimer);
  }
}
