/**
 * Provider failover. Tries each configured provider in order; if one is down, slow,
 * misconfigured or over its free quota, the next one handles the request.
 * A provider that just failed is put on a short cooldown so later requests skip it
 * instead of waiting for it to fail again. Safety refusals are final (no failover).
 */
import { modelFor, providerChain, type ProviderId } from './config.ts';
import { GenAIError } from './errors.ts';

const COOLDOWN_MS: Partial<Record<GenAIError['code'], number>> = {
  rate_limited: 60_000,
  upstream: 30_000,
  not_configured: 10 * 60_000,
};

const cooldownUntil = new Map<ProviderId, number>();
const lastError = new Map<ProviderId, string>();

const cooling = (id: ProviderId) => (cooldownUntil.get(id) ?? 0) > Date.now();

/** Configured providers, healthy ones first (keeping configured order), cooling ones last. */
export function orderedProviders(): ProviderId[] {
  const chain = providerChain();
  return [...chain.filter((id) => !cooling(id)), ...chain.filter(cooling)];
}

export function providerHealth() {
  return providerChain().map((id) => ({
    id,
    model: modelFor(id),
    healthy: !cooling(id),
    ...(cooling(id) ? { retryInSeconds: Math.ceil(((cooldownUntil.get(id) ?? 0) - Date.now()) / 1000), lastError: lastError.get(id) } : {}),
  }));
}

/** Test hook. */
export function resetHealth() {
  cooldownUntil.clear();
  lastError.clear();
}

function record(id: ProviderId, err: GenAIError) {
  const ms = COOLDOWN_MS[err.code];
  if (ms) cooldownUntil.set(id, Date.now() + ms);
  lastError.set(id, err.code);
  console.warn(`[genai] ${id} failed (${err.code}: ${err.message})`);
}

/**
 * Run `op` on the first provider that succeeds.
 * `canFailover()` lets streaming callers stop switching once text has reached the user.
 */
export async function withFailover<T>(op: (id: ProviderId) => Promise<T>, canFailover: () => boolean = () => true): Promise<T> {
  const providers = orderedProviders();
  if (!providers.length) throw new GenAIError('not_configured', 'AI is not configured on this server.', 503);
  let last: GenAIError | null = null;
  for (const id of providers) {
    try {
      const result = await op(id);
      cooldownUntil.delete(id);
      return result;
    } catch (e) {
      const err = e instanceof GenAIError ? e : new GenAIError('upstream', 'Something went wrong while generating a response.', 500);
      if (err.code === 'refused') throw err;
      record(id, err);
      last = err;
      if (!canFailover()) throw err;
    }
  }
  throw last ?? new GenAIError('upstream', 'All AI providers are unavailable right now. Please try again shortly.', 503);
}
