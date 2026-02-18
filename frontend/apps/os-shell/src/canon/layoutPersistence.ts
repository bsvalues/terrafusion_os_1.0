export const CANON_LAYOUT_STORAGE_KEY = 'tf.canon.layout.v1';

export interface CanonLayoutV1 {
  leftPaneWidth: number;
  rightPaneWidth: number;
  inspectorOpen: boolean;
}

interface LayoutEnvelopeV1 {
  version: 1;
  layout: CanonLayoutV1;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isCanonLayoutV1(v: unknown): v is CanonLayoutV1 {
  if (!isObject(v)) return false;
  return (
    typeof v.leftPaneWidth === 'number' &&
    Number.isFinite(v.leftPaneWidth) &&
    typeof v.rightPaneWidth === 'number' &&
    Number.isFinite(v.rightPaneWidth) &&
    typeof v.inspectorOpen === 'boolean'
  );
}

function isLayoutEnvelopeV1(v: unknown): v is LayoutEnvelopeV1 {
  if (!isObject(v)) return false;
  if (v.version !== 1) return false;
  if (!isCanonLayoutV1(v.layout)) return false;
  return true;
}

export function defaultCanonLayoutV1(): CanonLayoutV1 {
  return {
    leftPaneWidth: 240,
    rightPaneWidth: 320,
    inspectorOpen: true,
  };
}

export function serializeLayoutEnvelopeV1(layout: CanonLayoutV1): string {
  return JSON.stringify({
    version: 1,
    layout,
  } satisfies LayoutEnvelopeV1);
}

export function loadCanonLayout(): CanonLayoutV1 {
  const fallback = defaultCanonLayoutV1();
  try {
    const raw = localStorage.getItem(CANON_LAYOUT_STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (!isLayoutEnvelopeV1(parsed)) {
      localStorage.removeItem(CANON_LAYOUT_STORAGE_KEY);
      return fallback;
    }
    return parsed.layout;
  } catch {
    localStorage.removeItem(CANON_LAYOUT_STORAGE_KEY);
    return fallback;
  }
}

export function saveCanonLayout(layout: CanonLayoutV1): void {
  localStorage.setItem(CANON_LAYOUT_STORAGE_KEY, serializeLayoutEnvelopeV1(layout));
}
