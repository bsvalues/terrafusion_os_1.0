import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ObjectInspector } from '../components/ObjectInspector';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
  default: vi.fn(),
}));

const MOCK_SEG = {
  segmentId: 's1', segmentSetId: 'ss1', name: 'West Richland R1',
  segmentType: 'Residential', parcelCount: 412, medianRatio: 0.97,
  cod: 14.2, prd: 1.01, stabilityScore: 72, riskScore: 35,
  exceptionCount: 8, geographyRef: null,
};

function setup() {
  act(() => {
    useCountyStudioStore.getState().setStudy({
      studyId: 'study-1', countyId: 'benton', taxYear: 2026,
      studyType: 'RatioStudy', status: 'Active', baselineVersion: null,
      activeSegmentSetId: null, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
    });
    useCountyStudioStore.getState().setSegments([MOCK_SEG]);
    useCountyStudioStore.getState().selectSegment('s1');
  });
}

describe('ObjectInspector', () => {
  beforeEach(() => {
    setup();
    mockNavigate.mockClear();
  });

  it('shows Open in Atlas button when a segment is selected', () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /open in atlas/i })).toBeInTheDocument();
  });

  it('Open in Atlas navigates to atlas-live with studyId and segmentId', () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /open in atlas/i }));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/forge/atlas-live?studyId=study-1&segmentId=s1'
    );
  });

  it('shows Find Parcels in Workbench button', () => {
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /find parcels/i })).toBeInTheDocument();
  });

  it('shows nothing when no segment is selected', () => {
    act(() => { useCountyStudioStore.getState().selectSegment(null); });
    render(<MemoryRouter><ObjectInspector /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: /open in atlas/i })).not.toBeInTheDocument();
  });
});
