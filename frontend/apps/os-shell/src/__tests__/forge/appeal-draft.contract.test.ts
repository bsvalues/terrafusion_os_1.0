/**
 * AppealForgeModule — draft_appeal_response TerraPilot gate
 * Contract tests: human-gate enforcement, toolId, params, success/error shapes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeTool } from '../../api/pilotApi';

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const mockInvokeTool = vi.mocked(invokeTool);

// Mirrors the callback logic from AppealForgeModule.handleDraftAppealResponse
async function handleDraftAppealResponse(
  activeAppeal: { parcelId: string; id: string; evidence: unknown[] } | null,
  draftConfirmed: boolean,
  draftPosition: 'uphold' | 'adjust' | 'partial',
) {
  if (!activeAppeal || !draftConfirmed) return null;
  return await invokeTool({
    toolId: 'draft_appeal_response',
    params: {
      parcelId: activeAppeal.parcelId,
      appealId: activeAppeal.id,
      position: draftPosition,
      tone: 'formal',
      includeEvidenceRefs: true,
    },
  });
}

const ACTIVE_APPEAL = {
  parcelId: '12345-678',
  id: 'appeal-abc-001',
  evidence: [{ id: 'ev-1' }, { id: 'ev-2' }],
};

const MOCK_SUCCESS = {
  result: {
    appealId: 'appeal-abc-001',
    payloadRef: 'draft-ref-xyz',
    draftSummary: 'Appraiser position upholds the assessed value based on market evidence.',
    wordCount: 248,
    position: 'uphold',
  },
  correlationId: 'corr-draft-111',
};

describe('AppealForgeModule — draft_appeal_response contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call invokeTool when draftConfirmed is false', async () => {
    await handleDraftAppealResponse(ACTIVE_APPEAL, false, 'uphold');
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });

  it('does NOT call invokeTool when activeAppeal is null', async () => {
    await handleDraftAppealResponse(null, true, 'uphold');
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });

  it('calls invokeTool with toolId draft_appeal_response', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    expect(mockInvokeTool).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'draft_appeal_response' }),
    );
  });

  it('passes correct parcelId from activeAppeal', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).parcelId).toBe('12345-678');
  });

  it('passes correct appealId from activeAppeal.id', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).appealId).toBe('appeal-abc-001');
  });

  it('passes selected draftPosition to params', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'adjust');
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).position).toBe('adjust');
  });

  it('sends tone=formal and includeEvidenceRefs=true', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'partial');
    const call = mockInvokeTool.mock.calls[0][0];
    const params = call.params as Record<string, unknown>;
    expect(params.tone).toBe('formal');
    expect(params.includeEvidenceRefs).toBe(true);
  });

  it('success result contains draftSummary and wordCount', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    expect(res).toMatchObject({
      result: expect.objectContaining({
        draftSummary: expect.any(String),
        wordCount: expect.any(Number),
      }),
    });
  });

  it('success result contains payloadRef and position', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    expect(res).toMatchObject({
      result: expect.objectContaining({
        payloadRef: 'draft-ref-xyz',
        position: 'uphold',
      }),
    });
  });

  it('success result carries correlationId', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    expect(res).toMatchObject({ correlationId: 'corr-draft-111' });
  });

  it('invokeTool called exactly once per confirmed submission', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleDraftAppealResponse(ACTIVE_APPEAL, true, 'uphold');
    expect(mockInvokeTool).toHaveBeenCalledTimes(1);
  });
});
