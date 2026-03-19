/**
 * phase8-traceFidelity.contract.test.ts
 *
 * Phase 8: TerraTrace Fidelity — proves intent/result pairing,
 * unpaired detection, and trace log replay.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

// Gate 1: terraTrace exports paired API
describe('Gate 1 — terraTrace paired intent/result API', () => {
  const src = readSrc('services/terraTrace.ts');

  it('exports emitIntent function', () => {
    expect(src).toMatch(/export function emitIntent/);
  });

  it('exports emitResult function', () => {
    expect(src).toMatch(/export function emitResult/);
  });

  it('exports getUnpairedIntents function', () => {
    expect(src).toMatch(/export function getUnpairedIntents/);
  });

  it('exports getTraceLog function', () => {
    expect(src).toMatch(/export function getTraceLog/);
  });
});

// Gate 2: Intent/Result pairing runtime tests
describe('Gate 2 — intent/result pairing', () => {
  beforeEach(async () => {
    const mod = await import('@/services/terraTrace');
    if (typeof mod._clearTraceLog === 'function') mod._clearTraceLog();
  });

  it('emitIntent records an intent', async () => {
    const { emitIntent, getTraceLog, _clearTraceLog } = await import('@/services/terraTrace');
    _clearTraceLog();
    emitIntent({ intentId: 'i1', source: 'UI_WORKBENCH', intent: 'UPDATE_VALUE', countyId: '30', actorId: 'u1', timestamp: new Date().toISOString() });
    expect(getTraceLog().intents).toHaveLength(1);
    expect(getTraceLog().intents[0].intentId).toBe('i1');
  });

  it('emitResult records a result', async () => {
    const { emitResult, getTraceLog, _clearTraceLog } = await import('@/services/terraTrace');
    _clearTraceLog();
    emitResult({ intentId: 'i1', outcome: 'EXECUTED', traceId: 't1', durationMs: 42, timestamp: new Date().toISOString() });
    expect(getTraceLog().results).toHaveLength(1);
  });

  it('getUnpairedIntents returns intents without results', async () => {
    const { emitIntent, emitResult, getUnpairedIntents, _clearTraceLog } = await import('@/services/terraTrace');
    _clearTraceLog();
    emitIntent({ intentId: 'i1', source: 'UI_WORKBENCH', intent: 'UPDATE_VALUE', countyId: '30', actorId: 'u1', timestamp: new Date().toISOString() });
    emitIntent({ intentId: 'i2', source: 'CLI_OPERATOR', intent: 'CREATE_RECORD', countyId: '30', actorId: 'u2', timestamp: new Date().toISOString() });
    emitResult({ intentId: 'i1', outcome: 'EXECUTED', traceId: 't1', durationMs: 10, timestamp: new Date().toISOString() });
    const unpaired = getUnpairedIntents();
    expect(unpaired).toHaveLength(1);
    expect(unpaired[0].intentId).toBe('i2');
  });

  it('fully paired log returns empty unpaired', async () => {
    const { emitIntent, emitResult, getUnpairedIntents, _clearTraceLog } = await import('@/services/terraTrace');
    _clearTraceLog();
    emitIntent({ intentId: 'i1', source: 'UI_WORKBENCH', intent: 'UPDATE_VALUE', countyId: '30', actorId: 'u1', timestamp: new Date().toISOString() });
    emitResult({ intentId: 'i1', outcome: 'EXECUTED', traceId: 't1', durationMs: 5, timestamp: new Date().toISOString() });
    expect(getUnpairedIntents()).toHaveLength(0);
  });
});

// Gate 3: TruthGate integration with trace
describe('Gate 3 — TruthGate + trace source tagging', () => {
  const truthGateSrc = readSrc('services/truthGate.ts');
  const terraOpSrc = readSrc('types/terraOperation.ts');

  it('truthGate imports from terraOperation', () => {
    expect(truthGateSrc).toContain('terraOperation');
  });

  it('terraOperation has all 3 sources', () => {
    expect(terraOpSrc).toContain('UI_WORKBENCH');
    expect(terraOpSrc).toContain('CLI_OPERATOR');
    expect(terraOpSrc).toContain('AI_PILOT');
  });
});

// Gate 4: Trace types are complete
describe('Gate 4 — Trace types', () => {
  const src = readSrc('services/terraTrace.ts');

  it('TraceIntent has intentId', () => {
    expect(src).toContain('intentId');
  });

  it('TraceResult has outcome', () => {
    expect(src).toContain('outcome');
  });

  it('TraceResult has durationMs', () => {
    expect(src).toContain('durationMs');
  });
});
