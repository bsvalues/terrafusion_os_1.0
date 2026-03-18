/**
 * wave2-hooks.contract.test.ts
 *
 * Wave 2 hook layer gate suite (A/B/C/D).
 *
 * A: useGPTConversation static contract
 * B: useRAGDatasets static contract
 * C: resolveGptActor failure modes (pure function, no mocks)
 * D: Wave 1 non-regression invariants
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { resolveGptActor } from '@/services/gptActorBridge';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

// ============================================================================
// Gate A: useGPTConversation static contract
// ============================================================================

describe('Gate A — useGPTConversation static contract', () => {
  const src = readSrc('hooks/useGPTConversation.ts');

  it('imports resolveGptActor from @/services/gptActorBridge', () => {
    expect(src).toContain('gptActorBridge');
  });

  it('imports gptAPI from @/services/gptAPI', () => {
    expect(src).toContain('gptAPI');
  });

  it('imports useAuthContext from @/auth/useAuthContext', () => {
    expect(src).toContain('useAuthContext');
  });

  it('exports useGPTConversation function', () => {
    expect(src).toMatch(/export function useGPTConversation/);
  });

  it('exposes actorError typed failure surface', () => {
    expect(src).toContain('actorError');
  });

  it('exposes sendMessage function', () => {
    expect(src).toContain('sendMessage');
  });
});

// ============================================================================
// Gate B: useRAGDatasets static contract
// ============================================================================

describe('Gate B — useRAGDatasets static contract', () => {
  const src = readSrc('hooks/useRAGDatasets.ts');

  it('imports resolveGptActor from @/services/gptActorBridge', () => {
    expect(src).toContain('gptActorBridge');
  });

  it('imports ragAPI from @/services/ragAPI', () => {
    expect(src).toContain('ragAPI');
  });

  it('imports useAuthContext from @/auth/useAuthContext', () => {
    expect(src).toContain('useAuthContext');
  });

  it('exports useRAGDatasets function', () => {
    expect(src).toMatch(/export function useRAGDatasets/);
  });

  it('exposes actorError typed failure surface', () => {
    expect(src).toContain('actorError');
  });

  it('exposes createDataset function', () => {
    expect(src).toContain('createDataset');
  });
});

// ============================================================================
// Gate C: resolveGptActor failure modes (pure function, no mocks)
// ============================================================================

describe('Gate C — resolveGptActor failure modes', () => {
  it('null actor → unauthenticated', () => {
    const r = resolveGptActor(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('unauthenticated');
  });

  it('empty countyId → missing_county', () => {
    const r = resolveGptActor({ userId: 'u1', countyId: '', roles: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('missing_county');
  });

  it('non-numeric countyId → missing_county with userId', () => {
    const r = resolveGptActor({ userId: 'u1', countyId: 'benton', roles: [] });
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === 'missing_county') expect(r.error.userId).toBe('u1');
  });

  it('leading-numeric countyId "30abc" → missing_county (not silently ok)', () => {
    const r = resolveGptActor({ userId: 'u1', countyId: '30abc', roles: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('missing_county');
  });

  it('valid actor → ok with numeric countyId', () => {
    const r = resolveGptActor({ userId: 'appraiser-001', countyId: '30', roles: ['appraiser'] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.countyIdNumeric).toBe(30);
      expect(r.data.actor.userId).toBe('appraiser-001');
    }
  });

  it('ok result has exactly {actor, countyIdNumeric}', () => {
    const r = resolveGptActor({ userId: 'u1', countyId: '30', roles: [] });
    if (r.ok) expect(new Set(Object.keys(r.data))).toEqual(new Set(['actor', 'countyIdNumeric']));
  });
});

// ============================================================================
// Gate D: Wave 1 non-regression invariants
// ============================================================================

describe('Gate D — Wave 1 non-regression invariants', () => {
  it('gptActorBridge does NOT couple to osActions', () => {
    const src = readSrc('services/gptActorBridge.ts');
    expect(src).not.toContain('osActions');
  });

  it('useAuthContext still exports toOsActor (Wave 1 contract intact)', () => {
    const src = readSrc('auth/useAuthContext.ts');
    expect(src).toMatch(/export function toOsActor/);
  });

  it('osActions still imports OsActor from useAuthContext', () => {
    const src = readSrc('services/osActions.ts');
    expect(src).toContain('useAuthContext');
    expect(src).toContain('OsActor');
  });
});
