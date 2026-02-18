export const CANON_LAYOUT_STORAGE_KEY = 'tf.canon.layout.v1';

export interface PanelConfig {
  visible: boolean;
  size: number;
}

export interface LayoutV1 {
  panels: {
    leftNav: PanelConfig;
    main: PanelConfig;
    rightInspector: PanelConfig;
  };
}

export type PanelId = 'leftNav' | 'main' | 'rightInspector';

type EnvelopeV1 = {
  v: 1;
  layout: LayoutV1;
  ts: number;
};

function hasExactKeys(obj: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(obj);
  if (actual.length !== keys.length) return false;
  return keys.every((k) => Object.prototype.hasOwnProperty.call(obj, k));
}

function isPanelConfig(v: unknown): v is PanelConfig {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    hasExactKeys(o, ['visible', 'size']) &&
    typeof o.visible === 'boolean' &&
    typeof o.size === 'number' &&
    Number.isFinite(o.size)
  );
}

function isLayoutV1(v: unknown): v is LayoutV1 {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (!hasExactKeys(o, ['panels'])) return false;

  const panels = o.panels;
  if (!panels || typeof panels !== 'object' || Array.isArray(panels)) return false;

  const p = panels as Record<string, unknown>;
  if (!hasExactKeys(p, ['leftNav', 'main', 'rightInspector'])) return false;

  return isPanelConfig(p.leftNav) && isPanelConfig(p.main) && isPanelConfig(p.rightInspector);
}

function parseLayoutEnvelopeV1(raw: string): EnvelopeV1 | null {
  try {
    const parsed = JSON.parse(raw) as EnvelopeV1;
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as unknown as Record<string, unknown>;
    if (!hasExactKeys(o, ['v', 'layout', 'ts'])) return null;
    if (parsed.v !== 1) return null;
    if (typeof parsed.ts !== 'number' || !Number.isFinite(parsed.ts)) return null;
    if (!isLayoutV1(parsed.layout)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function serializeLayoutEnvelopeV1(layout: LayoutV1): string {
  return JSON.stringify({
    v: 1,
    layout,
    ts: Date.now(),
  } satisfies EnvelopeV1);
}

export function defaultCanonLayoutV1(): LayoutV1 {
  return {
    panels: {
      leftNav: { visible: true, size: 280 },
      main: { visible: true, size: 1 },
      rightInspector: { visible: true, size: 360 },
    },
  };
}

export function loadCanonLayout(storage: Storage = localStorage): LayoutV1 {
  const raw = storage.getItem(CANON_LAYOUT_STORAGE_KEY);
  if (raw === null) return defaultCanonLayoutV1();

  const parsed = parseLayoutEnvelopeV1(raw);
  if (!parsed) {
    storage.removeItem(CANON_LAYOUT_STORAGE_KEY);
    return defaultCanonLayoutV1();
  }

  return parsed.layout;
}

export function saveCanonLayout(layout: LayoutV1, storage: Storage = localStorage): void {
  storage.setItem(CANON_LAYOUT_STORAGE_KEY, serializeLayoutEnvelopeV1(layout));
}
