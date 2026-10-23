/**
 * Server-side configuration for the LoveMate GenAI gateway.
 * API keys never reach the browser: only this server talks to AI providers.
 *
 * Everything is read at request time (functions, not constants) so values loaded
 * from .env / .env.local after this module is imported still take effect.
 *
 * Providers (any combination; each one with a key joins the failover chain):
 *   ANTHROPIC_API_KEY   -> Claude (paid, best quality)
 *   GROQ_API_KEY        -> Groq (free tier)
 *   OPENROUTER_API_KEY  -> OpenRouter free models (free tier)
 * Default order: anthropic, groq, openrouter. Override with LOVEMATE_AI_PROVIDERS=groq,openrouter
 * If a provider is down, slow or over its limit, the next one is used automatically.
 */

export type ProviderId = 'anthropic' | 'groq' | 'openrouter';
const ALL: ProviderId[] = ['anthropic', 'groq', 'openrouter'];

/** Settings for an OpenAI-compatible provider. */
export interface CompatProvider {
  id: 'groq' | 'openrouter';
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  visionModel: string;
  headers: Record<string, string>;
  /** Models the provider itself switches to when the chosen one is busy (OpenRouter `models` routing). */
  fallbackModels?: string[];
  visionFallbackModels?: string[];
  /** Extra provider- or model-specific request fields. */
  extraBody?: (model: string) => Record<string, unknown>;
}

const env = (k: string) => process.env[k]?.trim() || '';
const hasKey = (id: ProviderId) =>
  id === 'anthropic'
    ? Boolean(env('ANTHROPIC_API_KEY') || env('ANTHROPIC_AUTH_TOKEN') || env('ANTHROPIC_PROFILE'))
    : id === 'groq'
      ? Boolean(env('GROQ_API_KEY'))
      : Boolean(env('OPENROUTER_API_KEY'));

/** Providers with keys, in failover order. */
export function providerChain(): ProviderId[] {
  const custom = env('LOVEMATE_AI_PROVIDERS') || env('LOVEMATE_AI_PROVIDER');
  const order = custom
    ? custom
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s): s is ProviderId => (ALL as string[]).includes(s))
    : ALL;
  // Configured providers missing from a custom list still go at the end as a safety net.
  const full = [...new Set([...order, ...ALL])];
  return full.filter(hasKey);
}

export const isConfigured = () => providerChain().length > 0;

/** Claude model. Override with LOVEMATE_MODEL (e.g. claude-haiku-5-5 for lowest cost). */
export const anthropicModel = () => env('LOVEMATE_MODEL') || 'claude-opus-5-5';

export function compatProvider(id: 'groq' | 'openrouter'): CompatProvider {
  if (id === 'groq') {
    return {
      id,
      label: 'Groq',
      baseUrl: (env('GROQ_BASE_URL') || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
      apiKey: env('GROQ_API_KEY'),
      model: env('GROQ_MODEL') || 'openai/gpt-oss-120b',
      visionModel: env('GROQ_VISION_MODEL') || 'qwen/qwen3.8-27b',
      headers: {},
      // Short thinking keeps answers fast and inside the free per-minute token limit.
      // Qwen must not think at all, or it answers in prose instead of the requested JSON.
      extraBody: (model) =>
        model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : model.startsWith('qwen/qwen3') ? { reasoning_effort: 'none' } : {},
    };
  }
  return {
    id,
    label: 'OpenRouter',
    baseUrl: (env('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    apiKey: env('OPENROUTER_API_KEY'),
    model: env('OPENROUTER_MODEL') || 'nvidia/nemotron-3-ultra-550b-a55b:free',
    visionModel: env('OPENROUTER_VISION_MODEL') || 'google/gemma-4-31b-it:free',
    // Free models are often busy, so OpenRouter tries these next. ("openrouter/free" is avoided:
    // it can route to safety classifiers or tiny models that ignore the task.)
    fallbackModels: ['google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free'],
    visionFallbackModels: ['google/gemma-4-26b-a4b-it:free', 'nvidia/nemotron-3.5-super-vl:free'],
    // Some free models think before answering; keep that short so the answer fits in max_tokens.
    extraBody: () => ({ reasoning: { effort: 'low', exclude: true } }),
    // OpenRouter asks apps to identify themselves; both headers are optional.
    headers: { 'HTTP-Referer': env('LOVEMATE_PUBLIC_URL') || 'http://localhost:5173', 'X-Title': 'LoveMate' },
  };
}

export function modelFor(id: ProviderId): string {
  return id === 'anthropic' ? anthropicModel() : compatProvider(id).model;
}

/**
 * Claude models that accept the server-side refusal fallback (`fallbacks: "default"`).
 * Haiku has no server-side fallback, so the parameter is only sent for these.
 */
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);
export const useFallbacks = () => FALLBACK_MODELS.has(anthropicModel());
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01' as const;

/** Basic abuse protection for a public proxy: requests per IP per minute. */
export const rateLimitPerMinute = () => Number(process.env.LOVEMATE_RATE_LIMIT || 30);

/** Largest accepted request body (images are base64 inside JSON). */
export const MAX_BODY_BYTES = 6 * 1024 * 1024;

/** Longest free-text field accepted from the browser. */
export const MAX_TEXT_CHARS = 6000;
