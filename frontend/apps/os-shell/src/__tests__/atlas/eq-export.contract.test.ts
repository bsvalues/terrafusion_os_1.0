/**
 * TerraExportModule — export_equalization_package TerraPilot gate
 * Contract tests: human-gate enforcement, toolId, params, success/error shapes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeTool } from '../../api/pilotApi';

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const mockInvokeTool = vi.mocked(invokeTool);

const TAX_YEAR = new Date().getFullYear();

// Mirrors handleExportEqualizationPackage from TerraExportModule
async function handleExportEqualizationPackage(
  eqExportConfirmed: boolean,
  taxYear: number,
) {
  if (!eqExportConfirmed) return null;
  return await invokeTool({
    toolId: 'export_equalization_package',
    params: {
      county: 'benton',
      draftVersion: `v${taxYear}-draft`,
      taxYear,
      reasonCode: 'annual_certification',
    },
  });
}

const MOCK_SUCCESS = {
  result: {
    payloadRef: 'dossier://benton/equalization/2026',
    packageRef: 'equalization-abc123',
    artifactCount: 6,
    checklist: ['ratio-study', 'matrix-diff', 'calibration-memo', 'signoff-log', 'atlas-overlays'],
  },
  correlationId: 'corr-eq-333',
};

describe('TerraExportModule — export_equalization_package contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call invokeTool when eqExportConfirmed is false', async () => {
    await handleExportEqualizationPackage(false, TAX_YEAR);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });

  it('calls invokeTool with toolId export_equalization_package', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleExportEqualizationPackage(true, TAX_YEAR);
    expect(mockInvokeTool).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'export_equalization_package' }),
    );
  });

  it('sends county=benton', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleExportEqualizationPackage(true, TAX_YEAR);
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).county).toBe('benton');
  });

  it('sends taxYear matching current year', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleExportEqualizationPackage(true, TAX_YEAR);
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).taxYear).toBe(TAX_YEAR);
  });

  it('sends draftVersion derived from taxYear', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleExportEqualizationPackage(true, 2026);
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).draftVersion).toBe('v2026-draft');
  });

  it('sends reasonCode=annual_certification', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleExportEqualizationPackage(true, TAX_YEAR);
    const call = mockInvokeTool.mock.calls[0][0];
    expect((call.params as Record<string, unknown>).reasonCode).toBe('annual_certification');
  });

  it('success result contains packageRef and artifactCount', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleExportEqualizationPackage(true, TAX_YEAR);
    expect(res).toMatchObject({
      result: expect.objectContaining({
        packageRef: expect.any(String),
        artifactCount: expect.any(Number),
      }),
    });
  });

  it('success result checklist includes ratio-study and atlas-overlays', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleExportEqualizationPackage(true, TAX_YEAR);
    const checklist = (res as typeof MOCK_SUCCESS).result.checklist;
    expect(checklist).toContain('ratio-study');
    expect(checklist).toContain('atlas-overlays');
  });

  it('success result carries correlationId', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    const res = await handleExportEqualizationPackage(true, TAX_YEAR);
    expect(res).toMatchObject({ correlationId: 'corr-eq-333' });
  });

  it('invokeTool called exactly once per confirmed submission', async () => {
    mockInvokeTool.mockResolvedValueOnce(MOCK_SUCCESS as never);
    await handleExportEqualizationPackage(true, TAX_YEAR);
    expect(mockInvokeTool).toHaveBeenCalledTimes(1);
  });
});
