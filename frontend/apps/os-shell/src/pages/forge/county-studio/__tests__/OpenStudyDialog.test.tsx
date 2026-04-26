import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { act } from 'react';
import { OpenStudyDialog } from '../components/OpenStudyDialog';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  studyApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../countyStudyScope', () => ({
  getCountyStudyScope: () => ({
    countyId: 'benton',
    headers: { 'x-county-id': 'benton' },
    isolated: true,
  }),
}));

import { studyApi } from '../countyStudyApi';

const MOCK_STUDIES = [
  {
    studyId: 'study-1',
    countyId: 'benton',
    countyName: 'Benton County',
    taxYear: 2026,
    studyType: 'RatioStudy',
    status: 'Active',
    baselineVersion: null,
    activeSegmentSetId: 'ss-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedBy: 'admin',
  },
];

describe('OpenStudyDialog', () => {
  beforeEach(() => {
    vi.mocked(studyApi.list).mockResolvedValue(MOCK_STUDIES);
    act(() => { useCountyStudioStore.getState().setStudy(null); });
  });

  it('renders the dialog when open=true', () => {
    render(<OpenStudyDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/open study/i)).toBeInTheDocument();
  });

  it('lists existing studies', async () => {
    render(<OpenStudyDialog open={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('2026 RatioStudy')).toBeInTheDocument();
    });
  });

  it('selecting a study sets it in the store and calls onClose', async () => {
    const onClose = vi.fn();
    render(<OpenStudyDialog open={true} onClose={onClose} />);
    await waitFor(() => screen.getByText('2026 RatioStudy'));
    fireEvent.click(screen.getByText('2026 RatioStudy'));
    expect(useCountyStudioStore.getState().activeStudy?.studyId).toBe('study-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when open=false', () => {
    render(<OpenStudyDialog open={false} onClose={() => {}} />);
    expect(screen.queryByText(/open study/i)).not.toBeInTheDocument();
  });
});
