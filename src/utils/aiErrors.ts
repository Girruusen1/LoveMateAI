/**
 * True when the user has already been told about this AI failure, so a view should just
 * stop its loading state and not show a second error:
 * - the free monthly limit was reached (the context shows a toast and the Pro modal), or
 * - a real-model error from the GenAI gateway (the context shows its message as a toast).
 */
export function isAiLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message === 'AI_LIMIT_REACHED' || (err as { reported?: boolean }).reported === true;
}
