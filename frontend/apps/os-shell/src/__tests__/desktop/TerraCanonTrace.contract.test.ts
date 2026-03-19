/**
 * Phase 35-E — CP-35-E-1: TerraCanon File Service Trace Contract
 *
 * Verifies that the canonical TerraTrace helpers are wired into every
 * TerraCanon file action in canonFs.ts, following the service-layer
 * pattern established in pilotApi.ts (CP-W9-1).
 *
 * GATE 1  — canon.read success: tool_invoked + tool_succeeded emitted
 * GATE 2  — canon.read 403:     tool_invoked + tool_failed emitted
 * GATE 3  — canon.write success: tool_invoked + tool_succeeded emitted
 * GATE 4  — canon.write 413:    tool_invoked + tool_failed emitted
 * GATE 5  — canon.create success: tool_invoked + tool_succeeded + artifact_created emitted
 * GATE 6  — canon.create 409:   tool_invoked + tool_failed emitted
 * GATE 7  — canon.delete success: tool_invoked + tool_succeeded emitted
 * GATE 8  — canon.rename success: tool_invoked + tool_succeeded emitted
 * GATE 9  — all trace events carry suite: 'os'
 * GATE 10 — correlationId is consistent across invoked→result pairs
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mock terraTrace before importing canonFs ─────────────────────────────────
const emitToolInvokedMock = vi.fn();
const emitToolSucceededMock = vi.fn();
const emitToolFailedMock = vi.fn();
const emitArtifactCreatedMock = vi.fn();
let mockCorrelationId = 'test-cid-1';

vi.mock('../../services/terraTrace', () => ({
  generateCorrelationId: () => mockCorrelationId,
  emitToolInvoked: (...args: unknown[]) => emitToolInvokedMock(...args),
  emitToolSucceeded: (...args: unknown[]) => emitToolSucceededMock(...args),
  emitToolFailed: (...args: unknown[]) => emitToolFailedMock(...args),
  emitArtifactCreated: (...args: unknown[]) => emitArtifactCreatedMock(...args),
  getTraceContext: () => ({ countyId: 'benton', actor: 'appraiser-test' }),
}));

// Import after mock is set up
import {
  fetchReadFile,
  writeCanonFile,
  createCanonFile,
  deleteCanonFile,
  renameCanonFile,
} from '../../api/canonFs';

// ── Mock fetch responses ──────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function forbiddenResponse(message = 'Forbidden'): Response {
  return new Response(JSON.stringify({ message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

function conflictResponse(message = 'File already exists'): Response {
  return new Response(JSON.stringify({ message }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' },
  });
}

function tooLargeResponse(message = 'File too large'): Response {
  return new Response(JSON.stringify({ message }), {
    status: 413,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('TerraCanon File Service Trace Contract (CP-35-E-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCorrelationId = 'cid-canon-test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 1 — canon.read success: tool_invoked + tool_succeeded
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 1 — fetchReadFile success emits tool_invoked then tool_succeeded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ filePath: '/src/app.ts', content: 'const x = 1;', size: 13, language: 'typescript' })
    );

    await fetchReadFile('/src/app.ts');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolInvokedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        countyId: 'benton',
        inputSummary: 'canon.read:/src/app.ts',
      })
    );
    expect(emitToolSucceededMock).toHaveBeenCalledTimes(1);
    expect(emitToolSucceededMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        outputSummary: 'opened:/src/app.ts',
      })
    );
    expect(emitToolFailedMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 2 — canon.read 403: tool_invoked + tool_failed
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 2 — fetchReadFile 403 emits tool_invoked then tool_failed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(forbiddenResponse('Access denied'));

    await fetchReadFile('/restricted/file.ts');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolFailedMock).toHaveBeenCalledTimes(1);
    expect(emitToolFailedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        outputSummary: 'Access denied',
      })
    );
    expect(emitToolSucceededMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 3 — canon.write success: tool_invoked + tool_succeeded
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 3 — writeCanonFile success emits tool_invoked then tool_succeeded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ filePath: '/src/app.ts', size: 20, writtenAt: '2026-03-19T00:00:00Z' })
    );

    await writeCanonFile('/src/app.ts', 'const x = 2;');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolInvokedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        inputSummary: 'canon.write:/src/app.ts',
      })
    );
    expect(emitToolSucceededMock).toHaveBeenCalledTimes(1);
    expect(emitToolSucceededMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        outputSummary: 'saved:/src/app.ts',
      })
    );
    expect(emitToolFailedMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 4 — canon.write 413: tool_invoked + tool_failed
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 4 — writeCanonFile 413 emits tool_invoked then tool_failed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(tooLargeResponse('File too large'));

    await writeCanonFile('/src/huge.ts', 'x'.repeat(10_000));

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolFailedMock).toHaveBeenCalledTimes(1);
    expect(emitToolFailedMock).toHaveBeenCalledWith(
      expect.objectContaining({ suite: 'os', outputSummary: 'File too large' })
    );
    expect(emitToolSucceededMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 5 — canon.create success: tool_invoked + tool_succeeded + artifact_created
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 5 — createCanonFile success emits tool_invoked + tool_succeeded + artifact_created', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ filePath: '/src/new.ts', size: 0, createdAt: '2026-03-19T00:00:00Z' })
    );

    await createCanonFile('/src/new.ts', '');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolInvokedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        inputSummary: 'canon.create:/src/new.ts',
      })
    );
    expect(emitToolSucceededMock).toHaveBeenCalledTimes(1);
    expect(emitToolSucceededMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        outputSummary: 'created:/src/new.ts',
      })
    );
    expect(emitArtifactCreatedMock).toHaveBeenCalledTimes(1);
    expect(emitArtifactCreatedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        outputSummary: 'canon.file:/src/new.ts',
      })
    );
    expect(emitToolFailedMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 6 — canon.create 409: tool_invoked + tool_failed
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 6 — createCanonFile 409 emits tool_invoked then tool_failed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(conflictResponse('File already exists'));

    await createCanonFile('/src/existing.ts', '');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolFailedMock).toHaveBeenCalledTimes(1);
    expect(emitToolFailedMock).toHaveBeenCalledWith(
      expect.objectContaining({ suite: 'os', outputSummary: 'File already exists' })
    );
    expect(emitToolSucceededMock).not.toHaveBeenCalled();
    expect(emitArtifactCreatedMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 7 — canon.delete success: tool_invoked + tool_succeeded
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 7 — deleteCanonFile success emits tool_invoked then tool_succeeded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ filePath: '/src/old.ts', deletedAt: '2026-03-19T00:00:00Z' })
    );

    await deleteCanonFile('/src/old.ts');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolInvokedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        inputSummary: 'canon.delete:/src/old.ts',
      })
    );
    expect(emitToolSucceededMock).toHaveBeenCalledTimes(1);
    expect(emitToolSucceededMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        outputSummary: 'deleted:/src/old.ts',
      })
    );
    expect(emitToolFailedMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 8 — canon.rename success: tool_invoked + tool_succeeded
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 8 — renameCanonFile success emits tool_invoked then tool_succeeded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ oldPath: '/src/a.ts', newPath: '/src/b.ts', renamedAt: '2026-03-19T00:00:00Z' })
    );

    await renameCanonFile('/src/a.ts', '/src/b.ts');

    expect(emitToolInvokedMock).toHaveBeenCalledTimes(1);
    expect(emitToolInvokedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        correlationId: 'cid-canon-test',
        inputSummary: 'canon.rename:/src/a.ts',
      })
    );
    expect(emitToolSucceededMock).toHaveBeenCalledTimes(1);
    expect(emitToolSucceededMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'os',
        outputSummary: 'renamed:/src/a.ts',
      })
    );
    expect(emitToolFailedMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 9 — suite: 'os' on all emitted events
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 9 — every emitted trace event carries suite: "os"', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ filePath: '/test.ts', content: '', size: 0, language: 'plaintext' })
    );

    await fetchReadFile('/test.ts');

    for (const call of [...emitToolInvokedMock.mock.calls, ...emitToolSucceededMock.mock.calls, ...emitToolFailedMock.mock.calls]) {
      expect((call[0] as Record<string, unknown>).suite).toBe('os');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GATE 10 — correlationId consistent across invoked → result pair
  // ──────────────────────────────────────────────────────────────────────────
  it('GATE 10 — correlationId is shared between tool_invoked and tool_succeeded', async () => {
    mockCorrelationId = 'cid-pair-check';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ filePath: '/src/app.ts', content: 'x', size: 1, language: 'typescript' })
    );

    await fetchReadFile('/src/app.ts');

    const invokedCid = (emitToolInvokedMock.mock.calls[0]?.[0] as Record<string, unknown>)?.correlationId;
    const succeededCid = (emitToolSucceededMock.mock.calls[0]?.[0] as Record<string, unknown>)?.correlationId;
    expect(invokedCid).toBe('cid-pair-check');
    expect(succeededCid).toBe('cid-pair-check');
    expect(invokedCid).toBe(succeededCid);
  });
});
