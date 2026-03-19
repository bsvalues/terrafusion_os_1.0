/**
 * Phase 7 — CP-W4-1: TerraTrace Append-Only Proof Wall
 *
 * Verifies that the canonical TerraTrace write API (emitCanonTrace + helpers):
 *
 * GATE 1  — append-only: every emit is a POST, never PATCH/PUT/DELETE
 * GATE 2  — tool_invoked emitted with correct type
 * GATE 3  — tool_succeeded emitted with correct type + correlationId pairing
 * GATE 4  — tool_failed emitted with correct type + correlationId pairing
 * GATE 5  — mode_switched emitted with correct type
 * GATE 6  — permission_denied emitted with correct type
 * GATE 7  — artifact_created emitted with correct type
 * GATE 8  — artifact_published emitted with correct type
 * GATE 9  — county-scoped: every event carries a non-empty countyId
 * GATE 10 — correlationId pairing: tool_invoked and tool_succeeded share same id
 * GATE 11 — no PII in payloads (no SSN / phone / email patterns)
 * GATE 12 — multiple emits produce multiple separate POSTs (no batching / mutation)
 *
 * Required event types per Constitution v1.0 / TerraTrace Spec v3.1:
 *   tool_invoked · tool_succeeded · tool_failed · mode_switched ·
 *   permission_denied · artifact_created · artifact_published
 */

import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest';
import {
  initTraceContext,
  generateCorrelationId,
  emitCanonTrace,
  emitToolInvoked,
  emitToolSucceeded,
  emitToolFailed,
  emitModeSwitched,
  emitPermissionDenied,
  emitArtifactCreated,
  emitArtifactPublished,
} from '../../services/terraTrace';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capturedBodies(fetchMock: MockInstance): unknown[] {
  return (fetchMock.mock.calls as [string | URL | Request, RequestInit | undefined][]).map(
    ([, opts]) => JSON.parse((opts as RequestInit).body as string),
  );
}

function capturedMethods(fetchMock: MockInstance): string[] {
  return (fetchMock.mock.calls as [string | URL | Request, RequestInit | undefined][]).map(
    ([, opts]) => (opts as RequestInit).method ?? 'GET',
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe('TerraTrace Canonical Proof Wall (CP-W4-1)', () => {
  let fetchMock: MockInstance;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    initTraceContext('benton', 'appraiser-jones');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 1 — Append-only: every emit is a POST, never PATCH/PUT/DELETE
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 1 — emitCanonTrace fires exactly one POST and never PATCH/PUT/DELETE', () => {
    const cid = generateCorrelationId();
    emitCanonTrace({
      type: 'tool_invoked',
      countyId: 'benton',
      correlationId: cid,
      suite: 'pilot',
      actor: { userId: 'appraiser-jones' },
      classification: 'CONFIDENTIAL',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const methods = capturedMethods(fetchMock);
    expect(methods[0]).toBe('POST');
    // Proof: no PATCH, PUT, or DELETE used
    expect(methods).not.toContain('PATCH');
    expect(methods).not.toContain('PUT');
    expect(methods).not.toContain('DELETE');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 2 — tool_invoked
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 2 — emitToolInvoked posts type: "tool_invoked"', () => {
    const cid = generateCorrelationId();
    emitToolInvoked({
      suite: 'forge',
      correlationId: cid,
      inputSummary: 'run income valuation',
      risk: 'write_low',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('tool_invoked');
    expect((body as Record<string, unknown>).correlationId).toBe(cid);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 3 — tool_succeeded + correlationId pairing
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 3 — emitToolSucceeded posts type: "tool_succeeded" with matching correlationId', () => {
    const cid = generateCorrelationId();
    emitToolSucceeded({
      suite: 'forge',
      correlationId: cid,
      outputSummary: 'income valuation completed',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('tool_succeeded');
    expect((body as Record<string, unknown>).correlationId).toBe(cid);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 4 — tool_failed + correlationId pairing
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 4 — emitToolFailed posts type: "tool_failed" with matching correlationId', () => {
    const cid = generateCorrelationId();
    emitToolFailed({
      suite: 'forge',
      correlationId: cid,
      outputSummary: 'income valuation data fetch error',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('tool_failed');
    expect((body as Record<string, unknown>).correlationId).toBe(cid);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 5 — mode_switched
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 5 — emitModeSwitched posts type: "mode_switched"', () => {
    const cid = generateCorrelationId();
    emitModeSwitched({
      suite: 'pilot',
      correlationId: cid,
      inputSummary: 'pilot → muse',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('mode_switched');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 6 — permission_denied
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 6 — emitPermissionDenied posts type: "permission_denied"', () => {
    const cid = generateCorrelationId();
    emitPermissionDenied({
      suite: 'dossier',
      correlationId: cid,
      inputSummary: 'delete_evidence denied — write_high without approval',
      risk: 'write_high',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('permission_denied');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 7 — artifact_created
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 7 — emitArtifactCreated posts type: "artifact_created"', () => {
    const cid = generateCorrelationId();
    emitArtifactCreated({
      suite: 'dossier',
      correlationId: cid,
      parcelId: 'P-001001',
      outputSummary: 'evidence packet created',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('artifact_created');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 8 — artifact_published
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 8 — emitArtifactPublished posts type: "artifact_published"', () => {
    const cid = generateCorrelationId();
    emitArtifactPublished({
      suite: 'dossier',
      correlationId: cid,
      parcelId: 'P-001001',
      outputSummary: 'evidence packet published to record',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [body] = capturedBodies(fetchMock);
    expect((body as Record<string, unknown>).type).toBe('artifact_published');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 9 — County-scoped: every event carries a non-empty countyId
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 9 — every emitted event is county-scoped (non-empty countyId)', () => {
    const cid = generateCorrelationId();
    // initTraceContext was called with 'benton' in beforeEach
    emitToolInvoked({ suite: 'forge', correlationId: cid });

    const [body] = capturedBodies(fetchMock);
    const countyId = (body as Record<string, unknown>).countyId;
    expect(countyId).toBeTruthy();
    expect(typeof countyId).toBe('string');
    expect((countyId as string).length).toBeGreaterThan(0);
    expect(countyId).not.toBe('unknown');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 10 — correlationId pairing: invoke + succeeded share same id
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 10 — tool_invoked and tool_succeeded share the same correlationId', () => {
    const cid = generateCorrelationId();

    emitToolInvoked({ suite: 'atlas', correlationId: cid, inputSummary: 'run map layer query' });
    emitToolSucceeded({ suite: 'atlas', correlationId: cid, outputSummary: 'layer query returned 42 parcels' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const bodies = capturedBodies(fetchMock) as Record<string, unknown>[];

    expect(bodies[0].type).toBe('tool_invoked');
    expect(bodies[1].type).toBe('tool_succeeded');
    // The correlation chain is intact
    expect(bodies[0].correlationId).toBe(cid);
    expect(bodies[1].correlationId).toBe(cid);
    expect(bodies[0].correlationId).toBe(bodies[1].correlationId);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 11 — No PII in payloads
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 11 — no SSN, phone number, or email address pattern in serialized trace payload', () => {
    const cid = generateCorrelationId();
    emitToolInvoked({
      suite: 'forge',
      correlationId: cid,
      inputSummary: 'run income valuation for parcel P-001001',
      actor: { userId: 'appraiser-jones', displayName: 'A. Jones' },
    });

    const rawBody = (fetchMock.mock.calls[0][1] as RequestInit).body as string;

    // SSN pattern: 3-2-4 or 9-digit group
    expect(rawBody).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
    // US phone patterns
    expect(rawBody).not.toMatch(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/);
    // Email address
    expect(rawBody).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GATE 12 — Multiple emits → multiple separate POSTs (no batching / mutation)
  // ─────────────────────────────────────────────────────────────────────────
  it('GATE 12 — three sequential emits produce three independent POSTs with distinct ids', () => {
    const cid = generateCorrelationId();

    emitToolInvoked({ suite: 'dais', correlationId: cid, inputSummary: 'approve exemption' });
    emitToolSucceeded({ suite: 'dais', correlationId: cid, outputSummary: 'exemption approved' });
    emitArtifactCreated({ suite: 'dais', correlationId: cid, outputSummary: 'exemption record created' });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const bodies = capturedBodies(fetchMock) as Record<string, unknown>[];
    const ids = bodies.map(b => b.id as string);

    // Each event gets a unique id — no reuse or mutation of previous events
    expect(new Set(ids).size).toBe(3);

    // All are POSTs (append-only proof)
    const methods = capturedMethods(fetchMock);
    expect(methods.every(m => m === 'POST')).toBe(true);
  });
});
