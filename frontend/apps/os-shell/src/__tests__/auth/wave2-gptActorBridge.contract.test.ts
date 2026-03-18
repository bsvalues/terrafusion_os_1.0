import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

describe('Gate 1 — gptActorBridge exports resolveGptActor', () => {
  const src = readSrc('services/gptActorBridge.ts');
  it('exports resolveGptActor function', () => {
    expect(src).toMatch(/export function resolveGptActor/);
  });
  it('imports OsActor from useAuthContext', () => {
    expect(src).toMatch(/import type \{[^}]*OsActor[^}]*\} from ['"]@\/auth\/useAuthContext['"]/);
  });
});

describe('Gate 2 — GptActorError union is complete', () => {
  const src = readSrc('services/gptActorBridge.ts');
  it("has 'unauthenticated' kind", () => { expect(src).toContain("'unauthenticated'"); });
  it("has 'missing_county' kind", () => { expect(src).toContain("'missing_county'"); });
  it("has 'api_error' kind", () => { expect(src).toContain("'api_error'"); });
  it("has 'timeout' kind", () => { expect(src).toContain("'timeout'"); });
  it('exports GptActorResult generic', () => { expect(src).toMatch(/GptActorResult<T>/); });
});

describe('Gate 3 — resolveGptActor runtime: null actor', () => {
  it('returns unauthenticated for null actor', async () => {
    const { resolveGptActor } = await import('@/services/gptActorBridge');
    const r = resolveGptActor(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('unauthenticated');
  });
});

describe('Gate 4 — resolveGptActor runtime: valid actor', () => {
  it('returns ok with numeric countyId', async () => {
    const { resolveGptActor } = await import('@/services/gptActorBridge');
    const r = resolveGptActor({ userId: 'u1', countyId: '30', roles: ['appraiser'] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.countyIdNumeric).toBe(30);
      expect(r.data.actor.userId).toBe('u1');
    }
  });
  it('returns missing_county for non-numeric countyId', async () => {
    const { resolveGptActor } = await import('@/services/gptActorBridge');
    const r = resolveGptActor({ userId: 'u1', countyId: '', roles: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('missing_county');
  });
});
