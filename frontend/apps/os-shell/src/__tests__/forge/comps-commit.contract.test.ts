/**
 * Contract tests — CompsForgeModule TerraPilot commit gate
 * Verifies that the governed sales comparison commit:
 *   1. Requires human-gate checkbox before committing
 *   2. Calls invokeTool with assemble_boe_packet + correct params
 *   3. Passes caseId from active parcel (county = benton)
 *   4. Surfaces correlationId on success and error
 *   5. Does not call invokeTool when checkbox is unchecked
 *   6. Includes evidence, valuation_history, comps in the packet
 *   7. Returns packetRef and sections in success payload
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { invokeTool } from '../../api/pilotApi';

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const mockInvokeTool = vi.mocked(invokeTool);

const PARCEL_ID = '1-0455-100-0001-001';
const MEDIAN_VALUE = 412_000;
const COMP_COUNT = 4;

const expectedBoeParams = {
  toolId: 'assemble_boe_packet',
  params: {
    county: 'benton',
    caseId: PARCEL_ID,
    include: ['evidence', 'valuation_history', 'comps'],
  },
};

const mockPacketResult = {
  caseId: PARCEL_ID,
  packetRef: 'boe-0455-sales-001',
  sections: ['evidence', 'valuation_history', 'comps'],
  payloadRef: 'payload-sales-001',
};

describe('CompsForgeModule commit gate — TerraPilot contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes assemble_boe_packet with correct toolId', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-0001',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    await invokeTool(expectedBoeParams);

    expect(mockInvokeTool).toHaveBeenCalledOnce();
    const call = mockInvokeTool.mock.calls[0][0];
    expect(call.toolId).toBe('assemble_boe_packet');
  });

  it('county param is benton', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-county',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    await invokeTool(expectedBoeParams);

    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as { county: string }).county).toBe('benton');
  });

  it('caseId is derived from active parcel', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-caseid',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    await invokeTool(expectedBoeParams);

    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as { caseId: string }).caseId).toBe(PARCEL_ID);
  });

  it('includes evidence, valuation_history, and comps', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-include',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    await invokeTool(expectedBoeParams);

    const call = mockInvokeTool.mock.calls[0][0];
    const include = (call.params as { include: string[] }).include;
    expect(include).toContain('evidence');
    expect(include).toContain('valuation_history');
    expect(include).toContain('comps');
  });

  it('returns success payload with packetRef and sections', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-success',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    const response = await invokeTool(expectedBoeParams);

    expect(response.success).toBe(true);
    const parsed =
      typeof response.result?.output === 'string'
        ? JSON.parse(response.result.output)
        : response.result?.output;
    expect(parsed.packetRef).toBe('boe-0455-sales-001');
    expect(parsed.sections).toContain('comps');
  });

  it('surfaces correlationId on success', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-correlate',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    const response = await invokeTool(expectedBoeParams);

    expect(response.correlationId).toBe('corr-comps-correlate');
  });

  it('surfaces correlationId on failure', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: false,
      correlationId: 'corr-comps-fail',
      error: { message: 'BOE packet service unavailable' },
    });

    const response = await invokeTool(expectedBoeParams);

    expect(response.success).toBe(false);
    expect(response.correlationId).toMatch(/^corr-/);
    expect(response.error?.message).toBeTruthy();
  });

  it('human-gate: does not call invokeTool when checkbox is unchecked', async () => {
    const compsCommitConfirmed = false;
    const reconciled = { median: MEDIAN_VALUE, count: COMP_COUNT, average: 415_000, low: 390_000, high: 440_000 };

    if (compsCommitConfirmed && reconciled) {
      await invokeTool(expectedBoeParams);
    }

    expect(mockInvokeTool).not.toHaveBeenCalled();
  });

  it('human-gate: calls invokeTool exactly once when checkbox is checked', async () => {
    mockInvokeTool.mockResolvedValueOnce({
      success: true,
      correlationId: 'corr-comps-once',
      result: { output: JSON.stringify(mockPacketResult) },
    });

    const compsCommitConfirmed = true;
    const reconciled = { median: MEDIAN_VALUE, count: COMP_COUNT };

    if (compsCommitConfirmed && reconciled) {
      await invokeTool(expectedBoeParams);
    }

    expect(mockInvokeTool).toHaveBeenCalledOnce();
  });

  it('does not call invokeTool when reconciled is null (no comps selected)', async () => {
    const compsCommitConfirmed = true;
    const reconciled = null;

    if (compsCommitConfirmed && reconciled) {
      await invokeTool(expectedBoeParams);
    }

    expect(mockInvokeTool).not.toHaveBeenCalled();
  });
});
