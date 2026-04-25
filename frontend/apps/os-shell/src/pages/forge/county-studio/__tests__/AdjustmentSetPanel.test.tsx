// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/AdjustmentSetPanel.test.tsx
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
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

    expect(mockUpdateState).toHaveBeenCalledWith('adj-001', 'ReadyForApproval');

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

  test('Published set shows Rollback button only', async () => {
    mockList.mockResolvedValueOnce([
      makeAdj({ approvalState: 'Published', publishedAt: '2026-04-24T00:00:00Z' }),
    ]);
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('adj-panel');
    expect(screen.getByTestId('btn-RolledBack-adj-001')).toBeInTheDocument();
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

  test('clicking Publish shows confirmation prompt, not immediately calling updateApprovalState', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-Published-adj-001');

    await user.click(screen.getByTestId('btn-Published-adj-001'));

    // Must NOT have called the API yet — confirmation step required first.
    expect(mockUpdateState).not.toHaveBeenCalled();
    // Confirm prompt must be visible.
    expect(screen.getByTestId('confirm-Published-adj-001')).toBeInTheDocument();
  });

  test('clicking Yes in Publish confirm calls updateApprovalState', async () => {
    const updated = makeAdj({ approvalState: 'Published' });
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
    mockUpdateState.mockResolvedValueOnce(updated);
    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-Published-adj-001');

    await user.click(screen.getByTestId('btn-Published-adj-001'));
    await user.click(screen.getByTestId('confirm-yes-adj-001'));

    expect(mockUpdateState).toHaveBeenCalledWith('adj-001', 'Published');
    await waitFor(() =>
      expect(screen.getByTestId('state-badge-Published')).toBeInTheDocument()
    );
  });

  test('clicking Cancel in Publish confirm restores original buttons', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Approved' })]);
    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-Published-adj-001');

    await user.click(screen.getByTestId('btn-Published-adj-001'));
    expect(screen.getByTestId('confirm-Published-adj-001')).toBeInTheDocument();

    await user.click(screen.getByTestId('confirm-cancel-adj-001'));

    expect(mockUpdateState).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-Published-adj-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-Published-adj-001')).toBeInTheDocument();
  });

  test('clicking Rollback shows confirmation prompt with reason input', async () => {
    mockList.mockResolvedValueOnce([makeAdj({ approvalState: 'Published' })]);
    const user = userEvent.setup();
    render(<AdjustmentSetPanel />);
    await screen.findByTestId('btn-RolledBack-adj-001');

    await user.click(screen.getByTestId('btn-RolledBack-adj-001'));

    expect(mockUpdateState).not.toHaveBeenCalled();
    expect(screen.getByTestId('confirm-RolledBack-adj-001')).toBeInTheDocument();
    expect(screen.getByTestId('rollback-reason-adj-001')).toBeInTheDocument();
  });
});
