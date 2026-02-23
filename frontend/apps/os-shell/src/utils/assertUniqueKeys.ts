/**
 * DEV-only guard: throws if any two items in `items` resolve to the same key.
 * Use at array-build sites so duplicate-key bugs surface immediately.
 */
export function assertUniqueKeys<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  label: string
): void {
  const seen = new Map<string, number>();
  const dups: string[] = [];

  for (const item of items) {
    const k = getKey(item);
    const count = (seen.get(k) ?? 0) + 1;
    seen.set(k, count);
    if (count === 2) dups.push(k);
  }

  if (dups.length > 0) {
    const details = dups.map((k) => `${k} (x${seen.get(k)})`).join(', ');
    throw new Error(`[${label}] Duplicate keys detected: ${details}`);
  }
}
