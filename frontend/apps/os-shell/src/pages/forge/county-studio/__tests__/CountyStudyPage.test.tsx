import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { CountyStudyPage } from '../CountyStudyPage';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto } from '../types/countyStudio.types';

vi.mock('../hooks/useCountyStudyHub', () => ({ useCountyStudyHub: () => ({}) }));
vi.mock('../hooks/useStudyData', () => ({ useStudyData: () => {} }));
vi.mock('../components/CohortCreationDialog', () => ({ CohortCreationDialog: () => null }));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

const MOCK_SEG: CountySegmentDto = {
  segmentId: 's1', segmentSetId: 'ss1', name: 'West Richland R1',
  segmentType: 'Residential', parcelCount: 412, medianRatio: 0.97,
  cod: 14.2, prd: 1.01, stabilityScore: 72, riskScore: 35,
  exceptionCount: 5, geographyRef: null,
};

const FAILING_SEG: CountySegmentDto = {
  segmentId: 's2', segmentSetId: 'ss1', name: 'Bad Segment',
  segmentType: 'Commercial', parcelCount: 89, medianRatio: 0.84,
  cod: 22.8, prd: 1.06, stabilityScore: 48, riskScore: 78,
  exceptionCount: 22, geographyRef: null,
};

describe('CountyStudyPage', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setStudy(null);
      useCountyStudioStore.getState().setSegments([]);
    });
  });

  it('renders the studio header', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByText(/TerraForge County Studio/i)).toBeInTheDocument();
  });

  it('shows "Open Study" button when no study is active', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /open study/i })).toBeInTheDocument();
  });

  it('does NOT show the Atlas button when no study is active', () => {
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: /atlas/i })).not.toBeInTheDocument();
  });

  it('shows the Atlas button when a study is active', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1', countyId: 'benton', taxYear: 2026,
        studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
        activeSegmentSetId: null, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
      });
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /atlas/i })).toBeInTheDocument();
  });

  it('Exceptions tab filters to segments with exceptionCount > 0', () => {
    const noExc = { ...MOCK_SEG, segmentId: 'sx', exceptionCount: 0, name: 'NoExcSeg' };
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, noExc]);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /^Exceptions$/i }));
    expect(screen.getByText('West Richland R1')).toBeInTheDocument();
    expect(screen.queryByText('NoExcSeg')).not.toBeInTheDocument();
  });

  it('Compliance tab filters to segments failing IAAO thresholds', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([MOCK_SEG, FAILING_SEG]);
    });
    render(<CountyStudyPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /^Compliance$/i }));
    // FAILING_SEG: cod=22.8 (>20) → fails compliance
    expect(screen.getByText('Bad Segment')).toBeInTheDocument();
    // MOCK_SEG: cod=14.2, prd=1.01 → passes
    expect(screen.queryByText('West Richland R1')).not.toBeInTheDocument();
  });
});
