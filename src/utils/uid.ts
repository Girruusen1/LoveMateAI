let counter = 0;
/** Collision-safe id: prefix + time + counter + random. */
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1000000;
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}_${rand}`;
}
