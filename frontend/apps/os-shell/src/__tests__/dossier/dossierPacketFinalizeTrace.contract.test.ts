// Append-only committed audits are asserted in the real backend tests. Browsers must not forge duplicate success.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { finalizePacketModel, revisePacket, checkFinalizedMutability, checkSectionDrift, buildCoverSheet } from '../../services/suites/dossierPacketFinalization';
import { prepareAppealHandoff } from '../../services/suites/dossierAppealHandoff';
import { finalizeWorkflowPacket, reviseWorkflowPacket, prepareWorkflowHandoff } from '../../services/dossierPacketWorkflowService';

const context = { countyId: '11111111-1111-4111-8111-111111111111', taxYear: 2026, parcelId: 'SYNTHETIC', token: 'synthetic-token' };
const packetId = '22222222-2222-4222-8222-222222222222';
const revision = 'a'.repeat(64);
const signal = () => new AbortController().signal;
const snapshot = { parcelId: context.parcelId, packetId, title: 'Synthetic packet', packetType: 'boe_appeal',
  status: 'finalized' as const, finalizedBy: 'synthetic', finalizedAt: '2026-03-15T10:00:00Z',
  sectionCount: 2, totalItems: 3, frozen: true, narrativeSummary: 'Synthetic evidence narrative.' };
const input = { ...snapshot, sections: [{ sectionType: 'documents', itemIds: ['synthetic-document'] }] };
const envelope = { schemaVersion: '1.0.0', contractId: 'dossier.appeal-handoff',
  handoffId: '33333333-3333-4333-8333-333333333333', countyId: context.countyId, taxYear: 2026, parcelId: context.parcelId,
  packetId, packetType: 'boe_appeal', packetRevision: revision, finalizationId: '44444444-4444-4444-8444-444444444444',
  finalizedAt: '2026-03-15T10:00:00Z', finalizedBy: 'synthetic', narrative: { content: 'Synthetic evidence narrative.', revision, contentHash: revision },
  evidence: [{ evidenceId: '55555555-5555-4555-8555-555555555555', revision, contentHash: revision, countyId: context.countyId, taxYear: 2026, parcelId: context.parcelId }],
  preparedAt: '2026-03-15T11:00:00Z', preparedBy: 'synthetic',
  provenance: { suiteCommit: '8f58a6b989641a6fde063afa3dda68bd18062c63', artifactSha256: 'd4f29a599c96499f567c065274127b5c6943955b6366bd5959166ac5abf55c01', contractVersion: '1.0.0', traceId: 'prepare' } };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

vi.mock('../../services/terraTrace', () => ({ emitTraceEvent: vi.fn() }));
import { emitTraceEvent } from '../../services/terraTrace';
describe('Dossier finalization trace authority', () => {
  it('does not emit a success trace for browser-local finalization', () => {
    expect(finalizePacketModel(input).success).toBe(false); expect(emitTraceEvent).not.toHaveBeenCalled();
  });
  it('does not mint a canonical blocked trace for local guessed rules', () => {
    expect(finalizePacketModel({ ...input, sections: [] }).success).toBe(false); expect(emitTraceEvent).not.toHaveBeenCalled();
  });
  it('cannot mint a revision trace or mutate a seal locally', () => {
    expect(() => revisePacket(snapshot, 'browser', 'Reason')).toThrow(/server/i); expect(emitTraceEvent).not.toHaveBeenCalled();
  });
  it('leaves successful mutation audit ownership with the server', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ finalizationId: packetId })));
    await finalizeWorkflowPacket(context, packetId, revision, 'seal-1', signal());
    expect(emitTraceEvent).not.toHaveBeenCalled();
  });
});
