let stableIdSequence = 0;

function nextSequence(): string {
  stableIdSequence = (stableIdSequence + 1) % Number.MAX_SAFE_INTEGER;
  return stableIdSequence.toString(36);
}

export function createStableId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;

  return `${prefix}-${Date.now().toString(36)}-${nextSequence()}`;
}

