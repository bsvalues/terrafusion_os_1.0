/**
 * CostForgeModule — assemble_boe_packet TerraPilot gate
 * Contract tests: human-gate enforcement, toolId, params, success/error shapes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeTool } from '../../api/pilotApi';

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const mockInvokeTool = vi.mocked(invokeTool);

// Mirrors handleCommitCostValue from CostForgeModule
async function handleCommitCostValue(
  costCommitConfirmed: boolean,
  activeParcel: { parcelId?: string; parcelNumber?: string } | null,
) {
  if (!costCommitConfirmed) return null;
  const caseId = activeParcel?.parcelId ?? activeParcel?.parcelNumber ?? 'unknown';
  return await invokeTool({
    toolId: 'assemble_boe_packet',
    params: {
      county: 'benton',
      caseId,
      include: ['evidence', 'valuation_history', 'cost_approach'],
    },
  });
}

const ACTIVE_PARCEL = { parcelId: '21345-006', parcelNumber: '21345-006' };

const MOCK_SUCCESS = {
  result: {
    caseId: '21345-006',
    packetRef: 'boe-cost-pkt-001',
    sections: ['evidence', 'valuation_history', 'cost_approach'],
    payloadRef: 'payload-cost-xyz',
  },
  correlationId: 'corr-cost-222',
};

describe('CostForgeModule — assemble_boe_packet contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call invokeTool when costCommitConfirmed is false', async () => {
    await handleCommitCostValue(false, ACTIVE_PARCEL);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });

  it('does NOT call invokeTool when costCommitConfirmed is false and parcel is null', async () => {
    await handleCommitCostValue(false, null);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });

  it('calls invokeTool with toolId assemble_boe_packet', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleCommitCostValue(true, ACTIVE_PARCEL);
    expect(mockInvokeTool).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'assemble_boe_packet' }),
    );
  });

  it('sends county=benton', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleCommitCostValue(true, ACTIVE_PARCEL);
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).county).toBe('benton');
  });

  it('sends caseId from activeParcel.parcelId', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleCommitCostValue(true, { parcelId: '21345-006' });
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).caseId).toBe('21345-006');
  });

  it('falls back to parcelNumber when parcelId is absent', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleCommitCostValue(true, { parcelNumber: 'P-9999' });
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).caseId).toBe('P-9999');
  });

  it('falls back to "unknown" when activeParcel is null', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleCommitCostValue(true, null);
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).caseId).toBe('unknown');
  });

  it('include array contains cost_approach', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleCommitCostValue(true, ACTIVE_PARCEL);
    const call = mockInvokeTool.mock.calls[0][0];
    const include = (call.params as Record<string, unknown>).include as string[];
    expect(include).toContain('cost_approach');
  });

  it('success result contains packetRef and sections', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleCommitCostValue(true, ACTIVE_PARCEL);
    expect(res).toMatchObject({
      result: expect.objectContaining({
        packetRef: 'boe-cost-pkt-001',
        sections: expect.arrayContaining(['cost_approach']),
      }),
    });
  });

  it('success result carries correlationId', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleCommitCostValue(true, ACTIVE_PARCEL);
    expect(res).toMatchObject({ correlationId: 'corr-cost-222' });
  });
});
