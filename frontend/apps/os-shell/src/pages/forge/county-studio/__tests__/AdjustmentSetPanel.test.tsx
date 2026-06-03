// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createStore, useStore } from 'zustand';
import { AdjustmentSetPanel } from '../components/AdjustmentSetPanel';
import { adjustmentSetApi } from '../countyStudyApi';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountyAdjustmentSetDto } from '../types/countyStudio.types';
import { useAdjustmentApplyHandoffStore } from '@/pages/suites/adjustmentApplyHandoffStore';

const activateModuleMock = vi.hoisted(() => vi.fn());

vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

vi.mock('../countyStudyApi', () => ({
  adjustmentSetApi: {
    list:                         vi.fn(),
    listApplyHandoffReceipts:     vi.fn(),
    updateApprovalState:          vi.fn(),
    recordApplyHandoffReceipt:    vi.fn(),
    updateApplyHandoffReceiptStatus: vi.fn(),
  },
}));

vi.mock('@/stores/countyStudioStore', () => ({
  useCountyStudioStore: vi.fn(),
}));

const mockList              = adjustmentSetApi.list              as ReturnType<typeof vi.fn>;
const mockListReceipts      = adjustmentSetApi.listApplyHandoffReceipts as ReturnType<typeof vi.fn>;
const mockUpdateState       = adjustmentSetApi.updateApprovalState as ReturnType<typeof vi.fn>;
const mockRecordApplyReceipt = adjustmentSetApi.recordApplyHandoffReceipt as ReturnType<typeof vi.fn>;
const mockStore             = useCountyStudioStore as ReturnType<typeof vi.fn>;

const STUDY_ID = 'study-aaa';

function makeAdj(overrides: Partial<CountyAdjustmentSetDto> = {}): CountyAdjustmentSetDto {
  return {
    adjustmentSetId: 'adj-001',
    studyId:         STUDY_ID,
    scenarioId:      'scen-001',
    effectiveScope:  '{}',
    approvalState:   'Proposed',
    approvedBy:      null,
    publishedAt:     null,
    rollbackReason:  null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useAdjustmentApplyHandoffStore.getState().clearHandoff('adj-001');
    useAdjustmentApplyHandoffStore.getState().clearHandoff('adj-002');
  });
  mockStore.mockReturnValue({ activeStudy: { studyId: STUDY_ID } });
  mockListReceipts.mockResolvedValue([]);
  mockRecordApplyReceipt.mockResolvedValue({
    receiptId: 'receipt-001',
    adjustmentSetId: 'adj-001',
    studyId: STUDY_ID,
    countyId: 'county-001',
    scenarioId: 'scen-001',
    template: 'AdjustmentApplyPacket',
    status: 'Prepared',
    preparedAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    evidenceRef: null,
    notes: null,
    updatedBy: 'tester',
  });
});

describe('AdjustmentSetPanel', () => {
  test('renders empty state when no adjustment sets exist', async () => {
    mockList.mockResolvedValueOnce([]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel-empty');
    expect(screen.getByTestId('adj-panel-empty')).toBeInTheDocument();
  });

  test('renders loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AdjustmentSetPanel />);
    expect(screen.getByTestId('adj-panel-loading')).toBeInTheDocument();
  });

  test('renders error state and retry button when list fails', async () => {
    mockList.mockRejectedValueOnce(new Error('Network down'));
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel-error');
    expect(screen.getByTestId('adj-panel-error')).toHaveTextContent('Network down');
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('renders no-study state when activeStudy is null', () => {
    mockStore.mockReturnValue({ activeStudy: null });
    render(<AdjustmentSetPanel />);
    expect(screen.getByTestId('adj-panel-no-study')).toBeInTheDocument();
  });

  test('renders Proposed set with Submit button', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Proposed' })]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('state-badge-Proposed')).toBeInTheDocument();
    expect(screen.getByTestId('btn-ReadyForApproval-adj-001')).toBeInTheDocument();
  });

  test('Submit for Approval button calls updateApprovalState correctly', async () => {
    const updated = makeAdj({ approvalState: 'ReadyForApproval' });
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Proposed' })]);
    mockUpdateState.mockResolvedValueOnce(updated);

    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-ReadyForApproval-adj-001');
    await user.click(screen.getByTestId('btn-ReadyForApproval-adj-001'));

    expect(mockUpdateState).toHaveBeenCalledWith('adj-001', 'ReadyForApproval', undefined);

    await waitFor(() =>
      expect(screen.getByTestId('state-badge-ReadyForApproval')).toBeInTheDocument()
    );
  });

  test('ReadyForApproval set shows Approve and Send Back buttons', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'ReadyForApproval' })]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('btn-Approved-adj-001')).toBeInTheDocument();
    expect(screen.getByTestId('btn-Proposed-adj-001')).toBeInTheDocument();
  });

  test('Approved set is terminal in County Studio and does not show Publish action', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('state-badge-Approved')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-Published-adj-001')).toBeNull();
    expect(screen.queryByTestId('btn-RolledBack-adj-001')).toBeNull();
    expect(screen.getByTestId('apply-posture-adj-001')).toHaveTextContent('Ready for apply handoff');
    expect(screen.getByTestId('btn-PrepareApply-adj-001')).toBeInTheDocument();
  });

  test('Approved set can prepare an explicit apply handoff without publishing values', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-PrepareApply-adj-001');

    await user.click(screen.getByTestId('btn-PrepareApply-adj-001'));

    expect(useAdjustmentApplyHandoffStore.getState().handoffs['adj-001']).toMatchObject({
      adjustmentSetId: 'adj-001',
      scenarioId: 'scen-001',
      studyId: STUDY_ID,
      status: 'Prepared',
    });
    expect(mockRecordApplyReceipt).toHaveBeenCalledWith(
      'adj-001',
      expect.objectContaining({
        status: 'Prepared',
        template: 'AdjustmentApplyPacket',
      }),
    );
    expect(activateModuleMock).toHaveBeenCalledWith(
      'suite-dossier',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({
          applyTemplate: 'AdjustmentApplyPacket',
          adjustmentSetId: 'adj-001',
          scenarioId: 'scen-001',
          studyId: STUDY_ID,
        }),
      }),
    );
    expect(screen.getByTestId('apply-posture-adj-001')).toHaveTextContent('Handed off for apply');
  });

  test('Apply handoff metadata carries valuation scope without city-primary keys', async () => {
    mockList.mockResolvedValueOnce([
      makeAdj({
        approvalState: 'Approved',
        effectiveScope: JSON.stringify({
          cohortId: 'cohort-007',
          rollupScope: 'city',
          city: 'Kennewick',
          cityName: 'Kennewick',
          selectedCity: 'Kennewick',
          municipality: 'Kennewick',
          neighborhoodCode: 'NBHD-420',
          revalArea: 2026,
          modelGroup: 'MG-12',
          valueTier: 'Upper',
          nested: {
            city: 'Kennewick',
            segmentId: 'seg-420',
          },
        }),
      }),
    ]);
    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-PrepareApply-adj-001');

    await user.click(screen.getByTestId('btn-PrepareApply-adj-001'));

    await waitFor(() => expect(activateModuleMock).toHaveBeenCalled());
    const metadata = activateModuleMock.mock.calls[0]?.[1].metadata as Record<string, unknown>;
    expect(metadata).toMatchObject({
      applyTemplate: 'AdjustmentApplyPacket',
      adjustmentSetId: 'adj-001',
      scenarioId: 'scen-001',
      studyId: STUDY_ID,
      effectiveScope: {
        cohortId: 'cohort-007',
        neighborhoodCode: 'NBHD-420',
        revalArea: 2026,
        modelGroup: 'MG-12',
        valueTier: 'Upper',
        nested: {
          segmentId: 'seg-420',
        },
      },
    });
    expect(metadata.effectiveScope).not.toMatchObject({
      city: expect.anything(),
      cityName: expect.anything(),
      selectedCity: expect.anything(),
      municipality: expect.anything(),
      rollupScope: 'city',
    });
    expect((metadata.effectiveScope as { nested: Record<string, unknown> }).nested).not.toHaveProperty('city');
  });

  test('loads durable apply handoff receipts from the backend', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
    mockListReceipts.mockResolvedValueOnce([{
      receiptId: 'receipt-001',
      adjustmentSetId: 'adj-001',
      studyId: STUDY_ID,
      countyId: 'county-001',
      scenarioId: 'scen-001',
      template: 'AdjustmentApplyPacket',
      status: 'Opened',
      preparedAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:05:00.000Z',
      evidenceRef: null,
      notes: null,
      updatedBy: 'dossier',
    }]);

    render(<AdjustmentSetPanel />);

    await screen.findByTestId('apply-receipt-adj-001');
    expect(screen.getByTestId('apply-posture-adj-001')).toHaveTextContent('Handed off for apply');
    expect(screen.getByTestId('apply-receipt-adj-001')).toHaveTextContent('Receipt: Opened');
  });

  test('legacy Published set is read-only', async () => {
    mockList.mockResolvedValueOnce([
      makeAdj({ approvalState: 'Published', publishedAt: '2026-04-24T00:00:00Z' }),
    ]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('state-badge-Published')).toBeInTheDocument();
    expect(screen.getByTestId('apply-posture-adj-001')).toHaveTextContent('Applied externally');
    expect(screen.queryByTestId('btn-RolledBack-adj-001')).toBeNull();
    expect(screen.queryByTestId('btn-Approved-adj-001')).toBeNull();
  });

  test('RolledBack set shows no action buttons', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'RolledBack' })]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('state-badge-RolledBack')).toBeInTheDocument();
    expect(screen.getByTestId('apply-posture-adj-001')).toHaveTextContent('Rolled back');
    // No action buttons
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('shows error inline when updateApprovalState rejects', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Proposed' })]);
    mockUpdateState.mockRejectedValueOnce(new Error('Illegal transition'));

    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-ReadyForApproval-adj-001');
    await user.click(screen.getByTestId('btn-ReadyForApproval-adj-001'));

    await screen.findByTestId('adj-panel-error');
    expect(screen.getByTestId('adj-panel-error')).toHaveTextContent('Illegal transition');
  });

  test('re-fetches adjustment sets when store lastPromotedAt changes', async () => {
    const firstSet  = makeAdj({ approvalState: 'Proposed', adjustmentSetId: 'adj-001' });
    const secondSet = makeAdj({ approvalState: 'Proposed', adjustmentSetId: 'adj-002' });

    // First fetch returns one set.
    mockList.mockResolvedValueOnce([firstSet]);
    // Second fetch (triggered by lastPromotedAt change) returns two sets.
    mockList.mockResolvedValueOnce([firstSet, secondSet]);

    // Back the mock with a real reactive Zustand store so subscription-based
    // re-renders fire when setLastPromotion updates lastPromotedAt.
    type TestState = {
      activeStudy: { studyId: string };
      lastPromotedAt: number | null;
      setLastPromotion: () => void;
    };
    const testStore = createStore<TestState>()((set) => ({
      activeStudy: { studyId: STUDY_ID },
      lastPromotedAt: null,
      setLastPromotion: () => set({ lastPromotedAt: Date.now() }),
    }));
    mockStore.mockImplementation((selector?: (s: TestState) => unknown) =>
      useStore(testStore, selector ?? ((s) => s))
    );
    (useCountyStudioStore as any).getState = testStore.getState;

    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-row-adj-001');
    expect(screen.queryByTestId('adj-row-adj-002')).not.toBeInTheDocument();

    // Simulate a promote completing elsewhere.
    act(() => {
      useCountyStudioStore.getState().setLastPromotion();
    });

    await screen.findByTestId('adj-row-adj-002');
    expect(screen.getByTestId('adj-row-adj-001')).toBeInTheDocument();
    expect(screen.getByTestId('adj-row-adj-002')).toBeInTheDocument();
  });
});
