/**
 * Throws if any duplicate keys are found.
 * Intended for DEV-time invariants and unit tests.
 *
 * Solo-dev rule: prevent silent UI identity bugs (React key collisions).
 */
export function assertUniqueBy<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  label: string,
): void {
  const counts = new Map<string, number>();
  const duplicates: string[] = [];

  for (const item of items) {
    const key = getKey(item);
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    if (next === 2) duplicates.push(key);
  }

  if (duplicates.length > 0) {
    const detail = duplicates
      .map((k) => `${k} (x${counts.get(k)})`)
      .join(", ");
    throw new Error(`[${label}] Duplicate keys detected: ${detail}`);
  }
}
