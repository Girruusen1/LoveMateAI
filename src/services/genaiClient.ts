/**
 * Browser client for the server-side GenAI gateway (/api/ai/*).
 * The browser never sees an API key; it only names a task and sends inputs.
 */

export interface GenAIStatus {
  enabled: boolean;
  model: string | null;
}

export type GenAIErrorCode = 'not_configured' | 'refused' | 'truncated' | 'invalid_output' | 'rate_limited' | 'upstream' | 'bad_request' | 'network';

/** Error from the real model. `reported` means the user has already been told (see AI_ERROR_EVENT). */
export class GenAIClientError extends Error {
  readonly code: GenAIErrorCode;
  readonly reported = true;
  constructor(code: GenAIErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** Fired on window for every GenAI failure; the app context shows it as a toast. */
export const AI_ERROR_EVENT = 'lovemate:ai-error';
export const AI_STATUS_EVENT = 'lovemate:ai-status';

function report(err: GenAIClientError): GenAIClientError {
  window.dispatchEvent(new CustomEvent(AI_ERROR_EVENT, { detail: { code: err.code, message: err.message } }));
  return err;
}

let statusPromise: Promise<GenAIStatus> | null = null;
let lastStatus: GenAIStatus | null = null;

/** Cached server status. Returns disabled when the gateway is unreachable (e.g. static hosting). */
export function getGenAIStatus(refresh = false): Promise<GenAIStatus> {
  if (!statusPromise || refresh) {
    statusPromise = fetch('/api/ai/status', { headers: { Accept: 'application/json' } })
      .then(async (r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? ((await r.json()) as GenAIStatus) : { enabled: false, model: null }))
      .catch(() => ({ enabled: false, model: null }))
      .then((s) => {
        lastStatus = s;
        window.dispatchEvent(new CustomEvent(AI_STATUS_EVENT, { detail: s }));
        return s;
      });
  }
  return statusPromise;
}

export function cachedGenAIStatus(): GenAIStatus | null {
  return lastStatus;
}

async function toError(res: Response): Promise<GenAIClientError> {
  try {
    const body = (await res.json()) as { error?: { code?: GenAIErrorCode; message?: string } };
    return new GenAIClientError(body.error?.code ?? 'upstream', body.error?.message ?? 'The AI request failed.');
  } catch {
    return new GenAIClientError('upstream', `The AI request failed (${res.status}).`);
  }
}

/** Run a structured task on the server and return its schema-validated result. */
export async function runTask<T>(name: string, input: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/ai/task/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw report(new GenAIClientError('network', 'Could not reach the AI server. Check your connection.'));
  }
  if (!res.ok) throw report(await toError(res));
  const body = (await res.json()) as { data: T };
  return body.data;
}

export interface ChatRequest {
  message: string;
  history: { role: string; content: string }[];
  personality?: string;
  language?: string;
  memories?: string[];
  userName?: string;
  partnerName?: string;
}

/** Stream a chat reply. `onDelta` receives text as it is generated; resolves with the full reply. */
export async function streamChat(req: ChatRequest, onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(req),
      signal,
    });
  } catch {
    throw report(new GenAIClientError('network', 'Could not reach the AI server. Check your connection.'));
  }
  if (!res.ok || !res.body) throw report(await toError(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = frame.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const evt = JSON.parse(line.slice(6)) as { type: string; text?: string; code?: GenAIErrorCode; message?: string };
      if (evt.type === 'delta' && evt.text) {
        full += evt.text;
        onDelta?.(evt.text);
      } else if (evt.type === 'done') {
        return evt.text ?? full;
      } else if (evt.type === 'error') {
        throw report(new GenAIClientError(evt.code ?? 'upstream', evt.message ?? 'The AI reply failed.'));
      }
    }
  }
  return full;
}
