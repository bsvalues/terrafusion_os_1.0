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
  createdAt: new Date().toISOString(),
  createdBy: 'system',
};

const renderPanel = () =>
  render(<MemoryRouter><ExceptionQueuePanel /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  (useCountyStudioStore as ReturnType<typeof vi.fn>).mockReturnValue({ activeStudyId: 'study-1' });
  (exceptionApi.list as ReturnType<typeof vi.fn>).mockResolvedValue([mockException]);
  (exceptionApi.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, status: 'Dispatched' });
  (exceptionApi.assign as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, assignedTo: 'Jane' });
  (exceptionApi.addNote as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockException, notes: '[2026-04-24 12:00 system] Test note' });
});

describe('ExceptionQueuePanel', () => {
  test('renders exception row with reason code and parcel count', async () => {
    await act(async () => { renderPanel(); });
    expect(screen.getByText(/Low Sample/i)).toBeTruthy();
    expect(screen.getByText(/n=12/i)).toBeTruthy();
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
