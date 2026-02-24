/**
 * Phase 48: Layout Envelope v1 Contract Tests
 *
 * Validates the versioned layout persistence envelope:
 * - Strict shape validation (panels, version, timestamp)
 * - Fail-closed parsing (malformed → null)
 * - Serialization round-trip
 * - Panel ID strictness (no unknown panels)
 * - Default layout correctness
 *
 * Run with: node --test os-platform/core/tests/layoutEnvelope.contract.test.mjs
 *
 * @see Phase 48: TerraCanon Core Contracts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LAYOUT_ENVELOPE_VERSION,
  defaultLayoutV1,
  isValidLayoutEnvelopeV1,
  isValidLayoutV1,
  parseLayoutEnvelopeV1,
  serializeLayoutEnvelopeV1,
} from '../canon/layoutEnvelope.mjs';

describe('Layout Envelope v1 – Version Constant', () => {
  it('LAYOUT_ENVELOPE_VERSION is exactly 1', () => {
    assert.equal(LAYOUT_ENVELOPE_VERSION, 1);
  });
});

describe('Layout Envelope v1 – Valid Parsing (LE1)', () => {
  it('LE1a — parses a valid layout envelope v1', () => {
    const layout = defaultLayoutV1();
    const raw = serializeLayoutEnvelopeV1(layout, 1700000000000);
    const parsed = parseLayoutEnvelopeV1(raw);
    assert.ok(parsed);
    assert.equal(parsed.v, 1);
    assert.equal(parsed.ts, 1700000000000);
    assert.deepEqual(parsed.layout, layout);
  });

  it('LE1b — validates a well-formed envelope object', () => {
    const env = { v: 1, layout: defaultLayoutV1(), ts: 1700000000000 };
    assert.ok(isValidLayoutEnvelopeV1(env));
  });

  it('LE1c — validates default layout shape', () => {
    assert.ok(isValidLayoutV1(defaultLayoutV1()));
  });
});

describe('Layout Envelope v1 – Version Rejection (LE2)', () => {
  it('LE2a — rejects v:99', () => {
    const raw = JSON.stringify({ v: 99, layout: defaultLayoutV1(), ts: 1 });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });

  it('LE2b — rejects v:0', () => {
    const raw = JSON.stringify({ v: 0, layout: defaultLayoutV1(), ts: 1 });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });

  it('LE2c — rejects v:"1" (string)', () => {
    const raw = JSON.stringify({ v: '1', layout: defaultLayoutV1(), ts: 1 });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });
});

describe('Layout Envelope v1 – Timestamp Validation (LE3)', () => {
  it('LE3a — rejects missing ts', () => {
    const raw = JSON.stringify({ v: 1, layout: defaultLayoutV1() });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });

  it('LE3b — rejects ts:0', () => {
    const raw = JSON.stringify({ v: 1, layout: defaultLayoutV1(), ts: 0 });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });

  it('LE3c — rejects ts:-1', () => {
    const raw = JSON.stringify({ v: 1, layout: defaultLayoutV1(), ts: -1 });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });

  it('LE3d — rejects ts:NaN', () => {
    assert.equal(isValidLayoutEnvelopeV1({ v: 1, layout: defaultLayoutV1(), ts: NaN }), false);
  });

  it('LE3e — rejects ts:Infinity', () => {
    assert.equal(isValidLayoutEnvelopeV1({ v: 1, layout: defaultLayoutV1(), ts: Infinity }), false);
  });
});

describe('Layout Envelope v1 – Strict Envelope Shape (LE4)', () => {
  it('LE4a — rejects extra keys at envelope level', () => {
    const raw = JSON.stringify({ v: 1, layout: defaultLayoutV1(), ts: 1, extra: true });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });

  it('LE4b — rejects envelope with only 2 keys', () => {
    const raw = JSON.stringify({ v: 1, layout: defaultLayoutV1() });
    assert.equal(parseLayoutEnvelopeV1(raw), null);
  });
});

describe('Layout Envelope v1 – Malformed JSON (LE5)', () => {
  it('LE5a — returns null for malformed JSON', () => {
    assert.equal(parseLayoutEnvelopeV1('{bad json'), null);
  });

  it('LE5b — returns null for empty string', () => {
    assert.equal(parseLayoutEnvelopeV1(''), null);
  });

  it('LE5c — returns null for bare string', () => {
    assert.equal(parseLayoutEnvelopeV1('"hello"'), null);
  });

  it('LE5d — returns null for null literal', () => {
    assert.equal(parseLayoutEnvelopeV1('null'), null);
  });
});

describe('Layout Envelope v1 – Panel Strictness (LE6)', () => {
  it('LE6a — rejects missing panel id (rightInspector missing)', () => {
    const bad = {
      v: 1,
      ts: 1,
      layout: {
        panels: {
          leftNav: { visible: true, size: 1 },
          main: { visible: true, size: 1 },
        },
      },
    };
    assert.equal(parseLayoutEnvelopeV1(JSON.stringify(bad)), null);
  });

  it('LE6b — rejects unknown panel id', () => {
    const bad = {
      v: 1,
      ts: 1,
      layout: {
        panels: {
          leftNav: { visible: true, size: 1 },
          main: { visible: true, size: 1 },
          rightInspector: { visible: true, size: 1 },
          chaos: { visible: true, size: 1 },
        },
      },
    };
    assert.equal(parseLayoutEnvelopeV1(JSON.stringify(bad)), null);
  });

  it('LE6c — rejects panel with extra keys', () => {
    const bad = {
      v: 1,
      ts: 1,
      layout: {
        panels: {
          leftNav: { visible: true, size: 1, extra: 'no' },
          main: { visible: true, size: 1 },
          rightInspector: { visible: true, size: 1 },
        },
      },
    };
    assert.equal(parseLayoutEnvelopeV1(JSON.stringify(bad)), null);
  });

  it('LE6d — rejects panel with negative size', () => {
    const bad = {
      v: 1,
      ts: 1,
      layout: {
        panels: {
          leftNav: { visible: true, size: -10 },
          main: { visible: true, size: 1 },
          rightInspector: { visible: true, size: 1 },
        },
      },
    };
    assert.equal(parseLayoutEnvelopeV1(JSON.stringify(bad)), null);
  });

  it('LE6e — accepts panel with size 0', () => {
    const ok = {
      v: 1,
      ts: 1,
      layout: {
        panels: {
          leftNav: { visible: false, size: 0 },
          main: { visible: true, size: 1 },
          rightInspector: { visible: false, size: 0 },
        },
      },
    };
    const parsed = parseLayoutEnvelopeV1(JSON.stringify(ok));
    assert.ok(parsed);
    assert.equal(parsed.layout.panels.leftNav.size, 0);
  });
});

describe('Layout Envelope v1 – Serialization (LE7)', () => {
  it('LE7a — serialize produces valid v1 envelope JSON', () => {
    const layout = defaultLayoutV1();
    const raw = serializeLayoutEnvelopeV1(layout, 1700000000000);
    const parsed = JSON.parse(raw);
    assert.equal(parsed.v, 1);
    assert.equal(parsed.ts, 1700000000000);
    assert.deepEqual(parsed.layout, layout);
  });

  it('LE7b — serialized envelope round-trips through parse', () => {
    const layout = defaultLayoutV1();
    const raw = serializeLayoutEnvelopeV1(layout);
    const parsed = parseLayoutEnvelopeV1(raw);
    assert.ok(parsed);
    assert.deepEqual(parsed.layout, layout);
    assert.equal(parsed.v, 1);
    assert.equal(typeof parsed.ts, 'number');
    assert.ok(parsed.ts > 0);
  });

  it('LE7c — serialize throws on invalid layout', () => {
    assert.throws(() => serializeLayoutEnvelopeV1({ panels: {} }), /invalid layout/i);
  });

  it('LE7d — serialize throws on layout with extra keys', () => {
    const bad = { ...defaultLayoutV1(), extra: true };
    assert.throws(() => serializeLayoutEnvelopeV1(bad), /invalid layout/i);
  });
});

describe('Layout Envelope v1 – Default Layout (LE8)', () => {
  it('LE8a — default layout has all three panels', () => {
    const layout = defaultLayoutV1();
    assert.ok(layout.panels.leftNav);
    assert.ok(layout.panels.main);
    assert.ok(layout.panels.rightInspector);
  });

  it('LE8b — default layout panels are all visible', () => {
    const layout = defaultLayoutV1();
    assert.equal(layout.panels.leftNav.visible, true);
    assert.equal(layout.panels.main.visible, true);
    assert.equal(layout.panels.rightInspector.visible, true);
  });

  it('LE8c — default layout validates as LayoutV1', () => {
    assert.ok(isValidLayoutV1(defaultLayoutV1()));
  });
});

console.log('Layout Envelope v1 Contract Suite');
console.log('=================================');
console.log(
  'Run with: node --test os-platform/core/tests/layoutEnvelope.contract.test.mjs'
);
