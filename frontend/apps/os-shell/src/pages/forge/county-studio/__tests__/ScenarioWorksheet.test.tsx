import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { ScenarioWorksheet } from '../components/ScenarioWorksheet';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  scenarioApi: {
    create: vi.fn(),
    preview: vi.fn(),
    save: vi.fn(),
  },
}));

import { scenarioApi } from '../countyStudyApi';

const MOCK_STUDY = {
  studyId: 'study-1', countyId: 'benton', taxYear: 2026,
  studyType: 'RatioStudy' as const, status: 'Active' as const,
  baselineVersion: null, activeSegmentSetId: null,
  createdAt: '', updatedAt: '', createdBy: '', updatedBy: '',
};

const MOCK_COHORT = {
  cohortId: 'c1', studyId: 'study-1', name: 'West Side',
  selectionType: 'Visual' as const, parcelCount: 80, isHybrid: false, createdAt: '',
};

const MOCK_DRAFT = {
  scenarioId: 'sc-draft', studyId: 'study-1', cohortId: 'c1',
  adjustmentType: 'PercentageIncrease' as const, parameters: {}, rationale: '',
  status: 'Draft' as const, createdAt: '',
};

const MOCK_PREVIEW = {
  scenarioId: 'sc-draft', totalParcelsAffected: 412,
  estimatedMedianRatioDelta: 0.038, estimatedCodDelta: -1.2, estimatedPrdDelta: 0.02,
  deltas: [],
};

function setup() {
  act(() => {
    useCountyStudioStore.getState().setStudy(MOCK_STUDY);
    useCountyStudioStore.getState().setCohorts([MOCK_COHORT]);
    useCountyStudioStore.getState().setScenarios([]);
    useCountyStudioStore.getState().setScenarioPreview(null);
  });
  vi.mocked(scenarioApi.create).mockResolvedValue(MOCK_DRAFT);
  vi.mocked(scenarioApi.preview).mockResolvedValue(MOCK_PREVIEW);
  vi.mocked(scenarioApi.save).mockResolvedValue({ ...MOCK_DRAFT, status: 'Saved' });
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/cohort/i), { target: { value: 'c1' } });
  fireEvent.change(screen.getByLabelText(/magnitude/i), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(/rationale/i), { target: { value: 'Market trend' } });
}

describe('ScenarioWorksheet', () => {
  beforeEach(() => {
    setup();
    vi.clearAllMocks();
    vi.mocked(scenarioApi.create).mockResolvedValue(MOCK_DRAFT);
    vi.mocked(scenarioApi.preview).mockResolvedValue(MOCK_PREVIEW);
    vi.mocked(scenarioApi.save).mockResolvedValue({ ...MOCK_DRAFT, status: 'Saved' });
  });

  it('renders the New Scenario form', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByText(/new scenario/i)).toBeInTheDocument();
  });

  it('shows Preview Impact button when form is complete', () => {
    render(<ScenarioWorksheet />);
    fillForm();
    expect(screen.getByRole('button', { name: /preview impact/i })).toBeInTheDocument();
  });

  it('calls scenarioApi.create then scenarioApi.preview on Preview click', async () => {
    render(<ScenarioWorksheet />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /preview impact/i }));
    await waitFor(() => {
      expect(vi.mocked(scenarioApi.create)).toHaveBeenCalledOnce();
      expect(vi.mocked(scenarioApi.preview)).toHaveBeenCalledWith('sc-draft');
    });
  });

  it('shows preview stats after successful preview', async () => {
    render(<ScenarioWorksheet />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /preview impact/i }));
    await waitFor(() => {
      expect(screen.getByText(/412 parcels/i)).toBeInTheDocument();
    });
  });

  it('Save Scenario calls scenarioApi.save with the draft id', async () => {
    render(<ScenarioWorksheet />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /preview impact/i }));
    await waitFor(() => screen.getByText(/412 parcels/i));
    fireEvent.click(screen.getByRole('button', { name: /save scenario/i }));
    await waitFor(() => {
      expect(vi.mocked(scenarioApi.save)).toHaveBeenCalledWith('sc-draft');
    });
  });

  it('Save Scenario is disabled until preview is run', () => {
    render(<ScenarioWorksheet />);
    fillForm();
    const saveBtn = screen.getByRole('button', { name: /save scenario/i });
    expect(saveBtn).toBeDisabled();
  });
});
