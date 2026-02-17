/**
 * Phase 48: Layout Persistence Envelope (Core)
 *
 * Versioned envelope + strict validation + fail-closed parsing
 * for TerraCanon layout state. Same discipline as Phase 47
 * lastClosedEnvelope — strict shape, fail-closed, no crash.
 *
 * @module canon/layoutEnvelope
 * @see Phase 48: TerraCanon Core Contracts
 */

/** @typedef {"leftNav" | "main" | "rightInspector"} PanelId */

const PANEL_IDS = /** @type {const} */ (['leftNav', 'main', 'rightInspector']);

/**
 * @param {unknown} v
 * @returns {v is Record<string, unknown>}
 */
function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * @param {Record<string, unknown>} obj
 * @param {readonly string[]} keys
 * @returns {boolean}
 */
function hasExactKeys(obj, keys) {
  const actual = Object.keys(obj);
  if (actual.length !== keys.length) return false;
  for (const k of actual) if (!keys.includes(k)) return false;
  return true;
}

/**
 * @param {unknown} n
 * @returns {n is number}
 */
function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * @param {unknown} s
 * @returns {s is PanelId}
 */
function isPanelId(s) {
  return typeof s === 'string' && PANEL_IDS.includes(/** @type {any} */ (s));
}

/**
 * @param {unknown} v
 * @returns {boolean}
 */
function isValidPanelConfig(v) {
  if (!isPlainObject(v)) return false;
  if (!hasExactKeys(/** @type {Record<string, unknown>} */ (v), ['visible', 'size'])) return false;
  const obj = /** @type {Record<string, unknown>} */ (v);
  return typeof obj.visible === 'boolean' && isFiniteNumber(obj.size) && /** @type {number} */ (obj.size) >= 0;
}

/**
 * Validate a LayoutV1 shape.
 * @param {unknown} v
 * @returns {boolean}
 */
export function isValidLayoutV1(v) {
  if (!isPlainObject(v)) return false;
  const obj = /** @type {Record<string, unknown>} */ (v);
  if (!hasExactKeys(obj, ['panels'])) return false;

  const panels = obj.panels;
  if (!isPlainObject(panels)) return false;
  const panelsObj = /** @type {Record<string, unknown>} */ (panels);

  // Strictly require exactly the three known panel IDs
  const keys = Object.keys(panelsObj);
  if (keys.length !== 3) return false;
  for (const k of keys) if (!isPanelId(k)) return false;

  return (
    isValidPanelConfig(panelsObj.leftNav) &&
    isValidPanelConfig(panelsObj.main) &&
    isValidPanelConfig(panelsObj.rightInspector)
  );
}

/**
 * Validate a LayoutEnvelopeV1 shape.
 * @param {unknown} v
 * @returns {boolean}
 */
export function isValidLayoutEnvelopeV1(v) {
  if (!isPlainObject(v)) return false;
  const obj = /** @type {Record<string, unknown>} */ (v);
  if (!hasExactKeys(obj, ['v', 'layout', 'ts'])) return false;
  if (obj.v !== 1) return false;
  if (!isValidLayoutV1(obj.layout)) return false;
  return isFiniteNumber(obj.ts) && /** @type {number} */ (obj.ts) > 0;
}

/**
 * Serialize a LayoutV1 into a versioned envelope JSON string.
 * @param {object} layout - A valid LayoutV1
 * @param {number} [nowMs] - Timestamp override (default: Date.now())
 * @returns {string}
 */
export function serializeLayoutEnvelopeV1(layout, nowMs = Date.now()) {
  if (!isValidLayoutV1(layout)) {
    throw new Error('Cannot serialize invalid layout into v1 envelope');
  }
  return JSON.stringify({ v: 1, layout, ts: nowMs });
}

/**
 * Strict parse. Returns null if invalid/malformed.
 * Caller should fail-close (clear key / fallback layout).
 * @param {string} raw
 * @returns {{ v: 1, layout: object, ts: number } | null}
 */
export function parseLayoutEnvelopeV1(raw) {
  try {
    const parsed = JSON.parse(raw);
    return isValidLayoutEnvelopeV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Default layout for TerraCanon workspace.
 * @returns {{ panels: { leftNav: { visible: boolean, size: number }, main: { visible: boolean, size: number }, rightInspector: { visible: boolean, size: number } } }}
 */
export function defaultLayoutV1() {
  return {
    panels: {
      leftNav: { visible: true, size: 280 },
      main: { visible: true, size: 1 },
      rightInspector: { visible: true, size: 360 },
    },
  };
}

export const LAYOUT_ENVELOPE_VERSION = 1;
