import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildPilotContext, buildExplainRequest } from '@/services/pilotBridge';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

// Gate 1: PilotBridge service contract
describe('Gate 1 — PilotBridge service', () => {
  const src = readSrc('services/pilotBridge.ts');
  it('exports buildPilotContext', () => { expect(src).toMatch(/export function buildPilotContext/); });
  it('exports buildExplainRequest', () => { expect(src).toMatch(/export function buildExplainRequest/); });
  it('imports OsActor from auth', () => { expect(src).toContain('OsActor'); });
  it('has PilotContext interface', () => { expect(src).toContain('PilotContext'); });
  it('has PilotExplainRequest with AI_PILOT source', () => { expect(src).toContain("'AI_PILOT'"); });
});

// Gate 2: TerraPilotPanel component
describe('Gate 2 — TerraPilotPanel component', () => {
  const src = readSrc('components/pilot/TerraPilotPanel.tsx');
  it('exports TerraPilotPanel', () => { expect(src).toMatch(/export function TerraPilotPanel/); });
  it('imports pilotBridge', () => { expect(src).toContain('pilotBridge'); });
  it('imports canonical tool trace helpers from terraTrace', () => {
    expect(src).toContain('emitToolInvoked');
    expect(src).toContain('emitToolSucceeded');
    expect(src).toContain('emitToolFailed');
    expect(src).toContain('generateCorrelationId');
  });
  it('has data-testid for panel', () => { expect(src).toContain('terra-pilot-panel'); });
  it('has unauthenticated state', () => { expect(src).toContain('pilot-unauthenticated'); });
  it('has no-parcel state', () => { expect(src).toContain('pilot-no-parcel'); });
  it('has explain button', () => { expect(src).toContain('pilot-explain-button'); });
});

// Gate 3: PilotBridge runtime — buildPilotContext
describe('Gate 3 — buildPilotContext runtime', () => {
  it('returns null for null actor', () => {
    expect(buildPilotContext(null, 'p1')).toBeNull();
  });
  it('returns context with actor fields', () => {
    const ctx = buildPilotContext({ userId: 'u1', countyId: '30', roles: ['appraiser'] }, 'p1');
    expect(ctx).not.toBeNull();
    expect(ctx!.countyId).toBe('30');
    expect(ctx!.actorId).toBe('u1');
    expect(ctx!.parcelId).toBe('p1');
  });
  it('handles null parcelId', () => {
    const ctx = buildPilotContext({ userId: 'u1', countyId: '30', roles: [] }, null);
    expect(ctx!.parcelId).toBeNull();
  });
});

// Gate 4: buildExplainRequest runtime
describe('Gate 4 — buildExplainRequest runtime', () => {
  it('builds request with AI_PILOT source', () => {
    const ctx = buildPilotContext({ userId: 'u1', countyId: '30', roles: [] }, 'p1')!;
    const req = buildExplainRequest('Why is this value high?', ctx);
    expect(req.source).toBe('AI_PILOT');
    expect(req.query).toBe('Why is this value high?');
    expect(req.context.countyId).toBe('30');
  });
});

// Gate 5: No mutation endpoints in TerraPilotPanel
describe('Gate 5 — Muse Mode is read-only', () => {
  const src = readSrc('components/pilot/TerraPilotPanel.tsx');
  it('does not import executeOsAction', () => { expect(src).not.toContain('executeOsAction'); });
  it('does not use legacy intent/result trace helpers', () => {
    expect(src).not.toContain('emitIntent');
    expect(src).not.toContain('emitResult');
  });
  it('does not import gptAPI mutation methods', () => {
    expect(src).not.toContain('createConversation');
    expect(src).not.toContain('sendMessage');
  });
  it('does not import any delete/update/create API calls', () => {
    expect(src).not.toContain('deleteDataset');
    expect(src).not.toContain('createDataset');
    expect(src).not.toContain('updateValue');
  });
});
