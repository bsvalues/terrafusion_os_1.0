/**
 * Deterministic unit tests for TerraTrace read-only projection feed.
 * No git, no db — store + rbac injected.
 */

import { describe, expect, it } from 'vitest';
import {
  createTraceFeedHandler,
  redactPiiFromString,
  sanitizeUnknown,
  type Rbac,
  type TraceStore,
} from './trace-feed';

const fixedNow = () => '2026-02-23T23:59:59.000Z';

describe('TerraTrace read-only projection feed', () => {
  it('redacts common PII in strings', () => {
    const s = 'Email bob@example.com SSN 123-45-6789 phone (555) 123-4567';
    const out = redactPiiFromString(s);
    expect(out).not.toMatch(/bob@example\.com/);
    expect(out).not.toMatch(/123-45-6789/);
    expect(out).not.toMatch(/555/);
    expect(out).toContain('[REDACTED_EMAIL]');
    expect(out).toContain('[REDACTED_SSN]');
    expect(out).toContain('[REDACTED_PHONE]');
  });

  it('sanitizes nested payloads deeply', () => {
    const payload = {
      owner: 'alice@example.com',
      phones: ['555-111-2222', '555-333-4444'],
      nested: { ssn: '123-45-6789' },
    };
    const out = sanitizeUnknown(payload) as Record<string, unknown>;
    expect(out.owner).toBe('[REDACTED_EMAIL]');
    expect((out.phones as string[])[0]).toBe('[REDACTED_PHONE]');
    expect((out.nested as Record<string, unknown>).ssn).toBe('[REDACTED_SSN]');
  });

  it('requires actor header + countyId', async () => {
    const store: TraceStore = { listEvents: async () => [] };
    const rbac: Rbac = { canReadTrace: async () => true };
    const handler = createTraceFeedHandler({ store, rbac, nowIso: fixedNow });

    const r1 = await handler(
      new Request('https://x/trace?countyId=KING', { method: 'GET' }),
    );
    expect(r1.status).toBe(401);

    const r2 = await handler(
      new Request('https://x/trace', { method: 'GET', headers: { 'x-actor-id': 'u1' } }),
    );
    expect(r2.status).toBe(400);
  });

  it('rejects non-GET methods', async () => {
    const store: TraceStore = { listEvents: async () => [] };
    const rbac: Rbac = { canReadTrace: async () => true };
    const handler = createTraceFeedHandler({ store, rbac, nowIso: fixedNow });

    const res = await handler(
      new Request('https://x/trace?countyId=X', {
        method: 'POST',
        headers: { 'x-actor-id': 'u1' },
      }),
    );
    expect(res.status).toBe(405);
  });

  it('enforces RBAC and returns 403 if forbidden', async () => {
    const store: TraceStore = {
      listEvents: async () => [
        { id: 'e1', ts: fixedNow(), countyId: 'X', actorId: 'svc', kind: 'audit' },
      ],
    };
    const rbac: Rbac = { canReadTrace: async () => false };
    const handler = createTraceFeedHandler({ store, rbac, nowIso: fixedNow });

    const res = await handler(
      new Request('https://x/trace?countyId=X', {
        method: 'GET',
        headers: { 'x-actor-id': 'u2' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('returns sanitized projections and clamps limit', async () => {
    const store: TraceStore = {
      listEvents: async () =>
        Array.from({ length: 5 }).map((_, i) => ({
          id: `e${i}`,
          ts: fixedNow(),
          countyId: 'C',
          actorId: 'u',
          kind: 'invoke',
          message: 'contact me at bob@example.com',
          payload: { phone: '555-123-4567', ssn: '123-45-6789' },
        })),
    };
    const rbac: Rbac = { canReadTrace: async () => true };
    const handler = createTraceFeedHandler({ store, rbac, nowIso: fixedNow, maxLimit: 3 });

    const res = await handler(
      new Request('https://x/trace?countyId=C&limit=999', {
        method: 'GET',
        headers: { 'x-actor-id': 'u3' },
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      query: { limit: number };
      events: Array<{
        message: string;
        projectionPayload: { phone: string; ssn: string };
      }>;
    };
    expect(body.ok).toBe(true);
    expect(body.query.limit).toBe(3);
    expect(body.events).toHaveLength(3);

    expect(body.events[0].message).toBe('contact me at [REDACTED_EMAIL]');
    expect(body.events[0].projectionPayload.phone).toBe('[REDACTED_PHONE]');
    expect(body.events[0].projectionPayload.ssn).toBe('[REDACTED_SSN]');
  });
});
