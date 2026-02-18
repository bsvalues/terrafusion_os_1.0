'use strict';
const LAYOUT_ENVELOPE_VERSION = 1;
function isValidLayoutV1(v) {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  if (typeof v.panels !== 'object' || v.panels === null) return false;
  const keys = Object.keys(v.panels);
  if (keys.length !== 3) return false;
  for (const k of ['leftNav', 'main', 'rightInspector']) {
    const p = v.panels[k];
    if (typeof p !== 'object' || p === null) return false;
    if (typeof p.visible !== 'boolean') return false;
    if (typeof p.size !== 'number' || !Number.isFinite(p.size)) return false;
  }
  return true;
}
function isValidLayoutEnvelopeV1(v) {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== 3) return false;
  if (v.v !== LAYOUT_ENVELOPE_VERSION) return false;
  if (typeof v.ts !== 'number' || !Number.isFinite(v.ts) || v.ts <= 0) return false;
  if (!isValidLayoutV1(v.layout)) return false;
  return true;
}
function serializeLayoutEnvelopeV1(layout, nowMs) {
  if (nowMs === undefined) nowMs = Date.now();
  return JSON.stringify({ v: LAYOUT_ENVELOPE_VERSION, layout: layout, ts: nowMs });
}
function parseLayoutEnvelopeV1(raw) {
  try { const obj = JSON.parse(raw); if (!isValidLayoutEnvelopeV1(obj)) return null; return obj; }
  catch (_e) { return null; }
}
function defaultLayoutV1() {
  return { panels: { leftNav: { visible: true, size: 240 }, main: { visible: true, size: 600 }, rightInspector: { visible: true, size: 300 } } };
}
module.exports = { LAYOUT_ENVELOPE_VERSION, isValidLayoutV1, isValidLayoutEnvelopeV1, serializeLayoutEnvelopeV1, parseLayoutEnvelopeV1, defaultLayoutV1 };
