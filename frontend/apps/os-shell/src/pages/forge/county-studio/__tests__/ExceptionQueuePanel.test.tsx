import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ExceptionQueuePanel } from '../components/ExceptionQueuePanel';
import { exceptionApi } from '../countyStudyApi';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  exceptionApi: {
    list: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
    addNote: vi.fn(),
    dispatch: vi.fn(),
  },
}));

vi.mock('@/stores/countyStudioStore', () => ({
  useCountyStudioStore: vi.fn(),
}));

vi.mock('@/pages/suites/segmentWorkflowDraftStore', () => ({
  useSegmentWorkflowDraftStore: vi.fn(() => ({ createDraft: vi.fn() })),
}));

vi.mock('@/pages/suites/segmentEvidenceDraftStore', () => ({
  useSegmentEvidenceDraftStore: vi.fn(() => ({ createDraft: vi.fn() })),
}));

const mockException = {
  exceptionSetId: 'exc-1',
  studyId: 'study-1',
  sourceScenarioId: 'sc-1',
  reasonCode: 'LowSample',
  parcelCount: 12,
  destination: 'Dais',
  status: 'Created',
  assignedTo: null,
  notes: null,
  createdAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
  createdBy: 'system',
};

const mockDispatchedException = {
  ...mockException,
  exceptionSetId: 'exc-2',
  reasonCode: 'Outlier',
  status: 'Dispatched',
  assignedTo: 'Jane',
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
};

const mockResolvedException = {
  ...mockException,
  exceptionSetId: 'exc-3',
  reasonCode: 'ManualFlag',
  status: 'Resolved',
  assignedTo: 'Sam',
  createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
};

const renderPanel = () =>
  render(<MemoryRouter><ExceptionQueuePanel /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  (useCountyStudioStore as ReturnType<typeof vi.fn>).mockReturnValue({ activeStudyId: 'study-1' });
  (exceptionApi.list as ReturnType<typeof vi.fn>).mockResolvedValue([
    mockException,
    mockDispatchedException,
    mockResolvedException,
  ]);
  (exceptionApi.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, status: 'Dispatched' });
  (exceptionApi.assign as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, assignedTo: 'Jane' });
  (exceptionApi.addNote as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, notes: '[2026-04-24 12:00 system] Test note' });
});

describe('ExceptionQueuePanel', () => {
  test('renders exception row with reason code and parcel count', async () => {
    await act(async () => { renderPanel(); });
    expect(screen.getByText(/Low Sample/i)).toBeTruthy();
    expect(screen.getAllByText(/n=12/i).length).toBeGreaterThan(0);
  });

  test('renders queue command strip with ownership and aging posture', async () => {
    await act(async () => { renderPanel(); });
    expect(screen.getByTestId('exception-queue-command-strip')).toHaveTextContent('Open');
    expect(screen.getByTestId('exception-queue-command-strip')).toHaveTextContent('Unassigned');
    expect(screen.getByTestId('exception-queue-command-strip')).toHaveTextContent('Dispatched');
    expect(screen.getByTestId('exception-queue-command-strip')).toHaveTextContent('Overdue');
    expect(screen.getByTestId('exception-queue-next-action')).toHaveTextContent('Assign unowned exceptions');
  });

  test('expanded row shows lifecycle and next action', async () => {
    const user = userEvent.setup();
    await act(async () => { renderPanel(); });

    await act(async () => { await user.click(screen.getByText(/Low Sample/i)); });

    expect(screen.getByTestId('exception-lifecycle-exc-1')).toHaveTextContent('Created');
    expect(screen.getByTestId('exception-lifecycle-exc-1')).toHaveTextContent('Assigned');
    expect(screen.getByTestId('exception-next-action-exc-1')).toHaveTextContent('Assign owner');
    expect(screen.getByTestId('exception-next-action-exc-1')).toHaveTextContent('Age: 4d');
  });

  test('assigns an owner from the row lifecycle controls', async () => {
    const user = userEvent.setup();
    await act(async () => { renderPanel(); });

    await act(async () => { await user.click(screen.getByText(/Low Sample/i)); });
    await act(async () => { await user.type(screen.getByPlaceholderText(/Assign to/i), 'Jane'); });
    await act(async () => { await user.click(screen.getByRole('button', { name: 'Assign' })); });

    expect(exceptionApi.assign).toHaveBeenCalledWith('exc-1', 'Jane');
  });

  test('no-study state shows prompt', () => {
    (useCountyStudioStore as ReturnType<typeof vi.fn>).mockReturnValue({ activeStudyId: null });
    renderPanel();
    expect(screen.getByText(/No active study/i)).toBeTruthy();
  });

  test('empty open filter shows no-exceptions message', async () => {
    (exceptionApi.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await act(async () => { renderPanel(); });
    expect(screen.getByText(/No open exceptions/i)).toBeTruthy();
  });

  test('expanding row shows Dispatch button for Dais destination', async () => {
    const user = userEvent.setup();
    await act(async () => { renderPanel(); });
    // Click the row header to expand
    const lowSampleEl = screen.getByText(/Low Sample/i);
    await act(async () => { await user.click(lowSampleEl); });
    expect(screen.getByText(/Dispatch → Dais/i)).toBeTruthy();
  });
});
