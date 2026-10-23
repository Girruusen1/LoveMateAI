import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { FALLBACK_BETA, MAX_TEXT_CHARS, anthropicModel, compatProvider, useFallbacks } from './config.ts';
import { GenAIError } from './errors.ts';
import { withFailover } from './failover.ts';
import { compatRunTask, compatStreamChat } from './openaiCompat.ts';
import { PERSONALITIES, SYSTEM_PROMPT, languageLabel } from './prompts.ts';
import { TASKS, type TaskName } from './tasks.ts';

export { GenAIError };

/** Minimal surface of the SDK client we use, so tests can inject a stub. */
export type LLMClient = Pick<Anthropic, 'beta'>;

let client: LLMClient | null = null;
export function setClient(c: LLMClient | null) {
  client = c;
}
function getClient(): LLMClient {
  // The zero-arg constructor resolves ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / an `ant auth login` profile.
  if (!client) client = new Anthropic();
  return client;
}

/** The shared system prompt, marked for prompt caching (it is identical on every request). */
const SYSTEM_BLOCK: Anthropic.Beta.BetaTextBlockParam = { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } };

const fallbackParams = (): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: 'default' } =>
  useFallbacks() ? { betas: [FALLBACK_BETA], fallbacks: 'default' } : {};

/** Translate SDK errors into stable codes; most specific class first. */
function mapError(err: unknown): GenAIError {
  if (err instanceof GenAIError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new GenAIError('not_configured', 'The AI service is not configured correctly on the server.', 503);
  }
  if (err instanceof Anthropic.RateLimitError) return new GenAIError('rate_limited', 'The AI is busy right now. Please try again in a moment.', 429);
  if (err instanceof Anthropic.BadRequestError) return new GenAIError('bad_request', 'That request could not be processed.', 400);
  if (err instanceof Anthropic.APIError) return new GenAIError('upstream', 'The AI service had a problem. Please try again.', 502);
  if (err instanceof Anthropic.APIConnectionError) return new GenAIError('upstream', 'Could not reach the AI service.', 502);
  console.error('[genai] unexpected error:', err);
  return new GenAIError('upstream', 'Something went wrong while generating a response.', 500);
}

function checkStop(stop: string | null | undefined) {
  if (stop === 'refusal') throw new GenAIError('refused', "LoveMate can't help with that request.", 422);
  if (stop === 'max_tokens') throw new GenAIError('truncated', 'The answer was too long and got cut off. Please try a shorter request.', 502);
}

/** Run one structured task and return the schema-validated object. */
export async function runTask(name: TaskName, input: Record<string, unknown>): Promise<unknown> {
  return withFailover((id) => (id === 'anthropic' ? claudeRunTask(name, input) : compatRunTask(compatProvider(id), name, input)));
}

async function claudeRunTask(name: TaskName, input: Record<string, unknown>): Promise<unknown> {
  try {
    const task = TASKS[name];
    const res = await getClient().beta.messages.parse({
      model: anthropicModel(),
      max_tokens: 16000,
      ...fallbackParams(),
      system: [SYSTEM_BLOCK],
      output_config: { effort: task.effort, format: betaZodOutputFormat(task.schema) },
      messages: [{ role: 'user', content: task.build(input) }],
    });
    checkStop(res.stop_reason);
    if (res.parsed_output == null) throw new GenAIError('invalid_output', 'The AI returned an unexpected answer. Please try again.', 502);
    return res.parsed_output;
  } catch (err) {
    throw mapError(err);
  }
}

export interface ChatInput {
  message: string;
  history: { role: string; content: string }[];
  personality?: string;
  language?: string;
  memories?: string[];
  userName?: string;
  partnerName?: string;
}

/** Build a valid alternating message list: drop leading assistant turns (e.g. the UI welcome), cap length. */
function toTurns(history: ChatInput['history'], message: string): { role: 'user' | 'assistant'; content: string }[] {
  const turns = (Array.isArray(history) ? history : [])
    .filter((h) => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string' && h.content.trim())
    .slice(-30)
    .map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content.slice(0, MAX_TEXT_CHARS) }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return [...turns, { role: 'user', content: message.slice(0, MAX_TEXT_CHARS) }];
}

function chatContext(input: ChatInput): string {
  const persona = PERSONALITIES[String(input.personality)] ?? PERSONALITIES.wingman;
  const memories = (input.memories ?? []).filter((m) => typeof m === 'string').slice(0, 12);
  return [
    `Your style for this conversation: ${persona}`,
    `Reply in ${languageLabel(input.language)}.`,
    input.userName ? `The user's name is ${input.userName.slice(0, 60)}.` : '',
    input.partnerName ? `Their partner or crush is ${input.partnerName.slice(0, 60)}.` : '',
    memories.length ? `Things the user has shared before (use only when relevant, never recite them):\n- ${memories.join('\n- ')}` : '',
    'Keep replies conversational: usually 2-5 short sentences, ask a follow-up question when you need more context.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Stream a chat reply. Calls onText for each delta and resolves with the full text. */
export async function streamChat(input: ChatInput, onText: (delta: string) => void, signal?: AbortSignal): Promise<string> {
  const context = chatContext(input);
  const turns = toTurns(input.history, input.message);
  let started = false;
  const emit = (delta: string) => {
    started = true;
    onText(delta);
  };
  // Switch providers only while nothing has been shown to the user yet.
  return withFailover(
    (id) => (id === 'anthropic' ? claudeStreamChat(context, turns, emit, signal) : compatStreamChat(compatProvider(id), context, turns, emit, signal)),
    () => !started && !signal?.aborted
  );
}

async function claudeStreamChat(
  context: string,
  turns: { role: 'user' | 'assistant'; content: string }[],
  onText: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  try {
    // Per-conversation context sits in a second, uncached system block so the shared prefix stays cacheable.
    const stream = getClient().beta.messages.stream(
      {
        model: anthropicModel(),
        max_tokens: 16000,
        ...fallbackParams(),
        system: [SYSTEM_BLOCK, { type: 'text', text: context }],
        output_config: { effort: 'low' },
        messages: turns,
      },
      { signal }
    );
    stream.on('text', (delta) => onText(delta));
    const final = await stream.finalMessage();
    checkStop(final.stop_reason);
    return final.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  } catch (err) {
    throw mapError(err);
  }
}
