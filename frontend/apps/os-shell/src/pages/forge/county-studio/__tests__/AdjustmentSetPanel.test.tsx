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

vi.mock('../countyStudyApi', () => ({
  adjustmentSetApi: {
    list:               vi.fn(),
    updateApprovalState: vi.fn(),
  },
}));

vi.mock('@/stores/countyStudioStore', () => ({
  useCountyStudioStore: vi.fn(),
}));

const mockList              = adjustmentSetApi.list              as ReturnType<typeof vi.fn>;
const mockUpdateState       = adjustmentSetApi.updateApprovalState as ReturnType<typeof vi.fn>;
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
  mockStore.mockReturnValue({ activeStudy: { studyId: STUDY_ID } });
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
  });

  test('legacy Published set is read-only', async () => {
    mockList.mockResolvedValueOnce([
      makeAdj({ approvalState: 'Published', publishedAt: '2026-04-24T00:00:00Z' }),
    ]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('state-badge-Published')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-RolledBack-adj-001')).toBeNull();
    expect(screen.queryByTestId('btn-Approved-adj-001')).toBeNull();
  });

  test('RolledBack set shows no action buttons', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'RolledBack' })]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('state-badge-RolledBack')).toBeInTheDocument();
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
