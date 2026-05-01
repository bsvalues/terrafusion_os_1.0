import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ExceptionQueuePanel } from '../components/ExceptionQueuePanel';
import { exceptionApi } from '../countyStudyApi';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { useDownstreamClosureReceiptStore } from '@/pages/suites/downstreamClosureReceiptStore';

const createWorkflowDraftMock = vi.hoisted(() => vi.fn());
const createEvidenceDraftMock = vi.hoisted(() => vi.fn());
const clearWorkflowDraftMock = vi.hoisted(() => vi.fn());
const clearEvidenceDraftMock = vi.hoisted(() => vi.fn());

vi.mock('../countyStudyApi', () => ({
  exceptionApi: {
    list: vi.fn(),
    listDownstreamReceipts: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
    addNote: vi.fn(),
    recordDownstreamReceipt: vi.fn(),
    updateDownstreamReceiptStatus: vi.fn(),
    dispatch: vi.fn(),
  },
}));

vi.mock('@/stores/countyStudioStore', () => ({
  useCountyStudioStore: vi.fn(),
}));

vi.mock('@/pages/suites/segmentWorkflowDraftStore', () => ({
  useSegmentWorkflowDraftStore: vi.fn((selector) => selector({
    activeDraft: null,
    createDraft: createWorkflowDraftMock,
    clearDraft: clearWorkflowDraftMock,
  })),
}));

vi.mock('@/pages/suites/segmentEvidenceDraftStore', () => ({
  useSegmentEvidenceDraftStore: vi.fn((selector) => selector({
    activeDraft: null,
    createDraft: createEvidenceDraftMock,
    clearDraft: clearEvidenceDraftMock,
  })),
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
  act(() => {
    useDownstreamClosureReceiptStore.getState().clearReceipt('exc-1');
    useDownstreamClosureReceiptStore.getState().clearReceipt('exc-2');
    useDownstreamClosureReceiptStore.getState().clearReceipt('exc-3');
  });
  (useCountyStudioStore as ReturnType<typeof vi.fn>).mockReturnValue({ activeStudyId: 'study-1', selectedSegmentId: null });
  (exceptionApi.list as ReturnType<typeof vi.fn>).mockResolvedValue([
    mockException,
    mockDispatchedException,
    mockResolvedException,
  ]);
  (exceptionApi.listDownstreamReceipts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (exceptionApi.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, status: 'Dispatched' });
  (exceptionApi.assign as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, assignedTo: 'Jane' });
  (exceptionApi.addNote as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, notes: '[2026-04-24 12:00 system] Test note' });
  (exceptionApi.recordDownstreamReceipt as ReturnType<typeof vi.fn>).mockResolvedValue({
    receiptId: 'receipt-1',
    exceptionSetId: 'exc-1',
    studyId: 'study-1',
    countyId: 'county-1',
    destination: 'Dais',
    template: 'SegmentReview',
    segmentId: 'sc-1',
    segmentLabel: 'Exception: Low Sample',
    status: 'Drafted',
    draftedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  });
  (exceptionApi.updateDownstreamReceiptStatus as ReturnType<typeof vi.fn>).mockResolvedValue(null);
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
    expect(screen.getByTestId('exception-routing-closure-exc-1')).toHaveTextContent('Ready for Dais handoff');
    expect(screen.getByTestId('exception-routing-closure-exc-1')).toHaveTextContent('Not dispatched');
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

  test('selected segment scopes the queue and next action counts', async () => {
    (useCountyStudioStore as ReturnType<typeof vi.fn>).mockReturnValue({
      activeStudyId: 'study-1',
      selectedSegmentId: 'sc-1',
    });
    (exceptionApi.list as ReturnType<typeof vi.fn>).mockResolvedValue([
      mockException,
      { ...mockDispatchedException, sourceScenarioId: 'other-segment' },
    ]);

    await act(async () => { renderPanel(); });

    expect(screen.getByTestId('exception-queue-segment-scope')).toHaveTextContent('sc-1');
    expect(screen.getByTestId('exception-queue-command-strip')).toHaveTextContent('Open');
    expect(screen.getByText(/Low Sample/i)).toBeTruthy();
    expect(screen.queryByText(/Outlier/i)).toBeNull();
  });

  test('expanding row shows Dispatch button for Dais destination', async () => {
    const user = userEvent.setup();
    await act(async () => { renderPanel(); });
    // Click the row header to expand
    const lowSampleEl = screen.getByText(/Low Sample/i);
    await act(async () => { await user.click(lowSampleEl); });
    expect(screen.getByText(/Dispatch → Dais/i)).toBeTruthy();
  });

  test('dispatch routes a Dais exception into a workflow draft and records closure posture', async () => {
    const user = userEvent.setup();
    await act(async () => { renderPanel(); });

    await act(async () => { await user.click(screen.getByText(/Low Sample/i)); });
    await act(async () => { await user.click(screen.getByRole('button', { name: /Dispatch → Dais/i })); });

    expect(exceptionApi.updateStatus).toHaveBeenCalledWith('exc-1', 'Dispatched');
    expect(exceptionApi.recordDownstreamReceipt).toHaveBeenCalledWith(
      'exc-1',
      expect.objectContaining({
        destination: 'Dais',
        template: 'SegmentReview',
        segmentId: 'sc-1',
        status: 'Drafted',
      }),
    );
    expect(createWorkflowDraftMock).toHaveBeenCalledWith(
      'SegmentReview',
      'sc-1',
      'Exception: Low Sample',
      expect.objectContaining({
        exceptionSetId: 'exc-1',
        destination: 'Dais',
        studyId: 'study-1',
      }),
    );
    expect(screen.getByTestId('exception-routing-closure-exc-1')).toHaveTextContent('Draft saved for Dais');
    expect(screen.getByTestId('exception-routing-closure-exc-1')).toHaveTextContent('Awaiting return');
  });

  test('dispatched row can reopen its routed Dais handoff without changing status again', async () => {
    const user = userEvent.setup();
    await act(async () => { renderPanel(); });

    await act(async () => { await user.click(screen.getByText(/Outlier/i)); });
    expect(screen.getByTestId('exception-routing-closure-exc-2')).toHaveTextContent('Routed to Dais');
    await act(async () => { await user.click(screen.getByRole('button', { name: /Open Dais/i })); });

    expect(exceptionApi.updateStatus).not.toHaveBeenCalled();
    expect(exceptionApi.recordDownstreamReceipt).toHaveBeenCalledWith(
      'exc-2',
      expect.objectContaining({
        destination: 'Dais',
        template: 'SegmentReview',
        segmentId: 'sc-1',
      }),
    );
    expect(createWorkflowDraftMock).toHaveBeenCalledWith(
      'SegmentReview',
      'sc-1',
      'Exception: Outlier',
      expect.objectContaining({
        exceptionSetId: 'exc-2',
        destination: 'Dais',
        studyId: 'study-1',
      }),
    );
  });

  test('returned downstream receipt exposes artifact and evidence closure detail', async () => {
    const user = userEvent.setup();
    (exceptionApi.listDownstreamReceipts as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        receiptId: 'receipt-returned',
        exceptionSetId: 'exc-2',
        studyId: 'study-1',
        countyId: 'county-1',
        sourceType: 'ExceptionQueue',
        destination: 'Dais',
        template: 'SegmentReview',
        segmentId: 'sc-1',
        segmentLabel: 'Exception: Outlier',
        status: 'Returned',
        downstreamEntityId: 'dais-return:sc-1',
        evidenceRef: 'dais-return-receipt:sc-1',
        notes: 'Returned from Dais segment workflow with downstream action receipt.',
        draftedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'dais',
      },
    ]);

    await act(async () => { renderPanel(); });
    await act(async () => { await user.click(screen.getByText(/Outlier/i)); });

    expect(screen.getByTestId('exception-next-action-exc-2')).toHaveTextContent('Close returned work');
    expect(screen.getByTestId('exception-routing-closure-exc-2')).toHaveTextContent('Returned from Dais');
    expect(screen.getByTestId('exception-routing-closure-exc-2')).toHaveTextContent('Requires County Studio closure');
    expect(screen.getByTestId('exception-receipt-details-exc-2')).toHaveTextContent('dais-return:sc-1');
    expect(screen.getByTestId('exception-receipt-details-exc-2')).toHaveTextContent('dais-return-receipt:sc-1');
  });
});
