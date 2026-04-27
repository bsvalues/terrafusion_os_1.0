import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { ScenarioWorksheet } from '../components/ScenarioWorksheet';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  scenarioApi: {
    create:  vi.fn(),
    preview: vi.fn(),
    save:    vi.fn(),
    promote: vi.fn(),
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

const MOCK_HEALTH = {
  studyId: 'study-1',
  countyId: 'benton',
  taxYear: 2026,
  parcelCount: 128784,
  ratioCount: 6014,
  medianRatio: 0.921,
  cod: 39.5,
  prd: 1.369,
  stabilityScore: 41,
  riskScore: 86,
  exceptionCount: 867,
  complianceStatus: 'NonCompliant' as const,
  topAlerts: [],
  criticalCount: 114,
  warningCount: 93,
  healthyCount: 1198,
  derivedAt: '2026-04-26T00:00:00Z',
};

const MOCK_DRAFT = {
  scenarioId: 'sc-draft', studyId: 'study-1', cohortId: 'c1',
  adjustmentType: 'PercentageIncrease' as const, parameters: {}, rationale: '',
  status: 'Draft' as const, createdAt: '',
};

const MOCK_PREVIEW = {
  scenarioId: 'sc-draft', totalParcelsAffected: 412,
  estimatedMedianRatioDelta: 0.038, estimatedCodDelta: -1.2, estimatedPrdDelta: 0.02,
  deltas: [
    {
      segmentId: 'seg-1',
      segmentName: 'NBHD-K1 · R1 · STANDARD',
      beforeRatio: 0.94,
      afterRatio: 0.979,
      beforeCod: 17.2,
      afterCod: 15.8,
      deltaPercent: 4.1,
    },
  ],
};

function setup() {
  act(() => {
    useCountyStudioStore.getState().setStudy(MOCK_STUDY);
    useCountyStudioStore.getState().setCohorts([MOCK_COHORT]);
    useCountyStudioStore.getState().setScenarios([]);
    useCountyStudioStore.getState().setHealthSummary(MOCK_HEALTH);
    useCountyStudioStore.getState().setActiveCohort(null);
    useCountyStudioStore.getState().setActiveScenario(null);
    useCountyStudioStore.getState().setScenarioPreview(null);
    useCountyStudioStore.getState().drillToCounty();
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

  it('renders live study context above the form', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByTestId('scenario-worksheet-context')).toHaveTextContent(/2026/);
    expect(screen.getByTestId('scenario-worksheet-context')).toHaveTextContent(/RatioStudy/);
    expect(screen.getByTestId('scenario-worksheet-scope')).toHaveTextContent(/benton/i);
    expect(screen.getByTestId('scenario-worksheet-context')).toHaveTextContent(/no active preview yet/i);
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
      expect(screen.getByTestId('scenario-preview-county-impact')).toHaveTextContent(/412 parcels/i);
    });
    expect(screen.getByTestId('scenario-preview-county-impact')).toHaveTextContent('0.921 → 0.959');
    expect(screen.getByTestId('scenario-preview-county-impact')).toHaveTextContent('39.5 → 38.3');
    expect(screen.getByTestId('scenario-preview-county-impact')).toHaveTextContent('1.369 → 1.389');
    expect(screen.getByTestId('scenario-preview-county-impact')).toHaveTextContent(/Neighborhood NBHD-K1 · R1 · STANDARD/i);
  });

  it('Save Scenario calls scenarioApi.save with the draft id', async () => {
    render(<ScenarioWorksheet />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /preview impact/i }));
    await waitFor(() => screen.getByTestId('scenario-preview-county-impact'));
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

  it('does not render Saved Scenarios section when store has no scenarios', () => {
    render(<ScenarioWorksheet />);
    expect(screen.queryByText(/saved scenarios/i)).toBeNull();
  });

  it('clears shared scenario preview when the draft is discarded', async () => {
    render(<ScenarioWorksheet />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /preview impact/i }));
    await waitFor(() => screen.getByTestId('scenario-preview-county-impact'));
    expect(useCountyStudioStore.getState().scenarioPreview).toEqual(MOCK_PREVIEW);
    fireEvent.click(screen.getByText('Discard'));
    expect(useCountyStudioStore.getState().scenarioPreview).toBeNull();
    expect(screen.getByTestId('scenario-worksheet-context')).toHaveTextContent(/no active preview yet/i);
  });

  it('uses the store active cohort as the default selection', () => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort('c1');
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1', 2);
    });
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/cohort/i)).toHaveValue('c1');
    expect(screen.getByTestId('scenario-worksheet-scope')).toHaveTextContent(/Neighborhood NBHD-K1 · Reval 2/i);
  });

  it('renders Saved Scenarios section with promote button when store has Saved scenarios', () => {
    act(() => {
      useCountyStudioStore.getState().setScenarios([
        { ...MOCK_DRAFT, scenarioId: 'sc-saved', status: 'Saved' },
      ]);
    });
    render(<ScenarioWorksheet />);
    expect(screen.getByText(/saved scenarios/i)).toBeInTheDocument();
    expect(screen.getByTestId('promote-btn-sc-saved')).toBeInTheDocument();
  });

  it('Promote button calls scenarioApi.promote with correct payload', async () => {
    vi.mocked(scenarioApi.promote).mockResolvedValueOnce(undefined);
    act(() => {
      useCountyStudioStore.getState().setScenarios([
        { ...MOCK_DRAFT, scenarioId: 'sc-saved', status: 'Saved' },
      ]);
    });
    render(<ScenarioWorksheet />);
    fireEvent.click(screen.getByTestId('promote-btn-sc-saved'));
    await waitFor(() => {
      const promoteCall = vi.mocked(scenarioApi.promote).mock.calls[0][0];
      expect(promoteCall.scenarioId).toBe('sc-saved');
      const scope = JSON.parse(promoteCall.effectiveScope) as Record<string, unknown>;
      expect(scope.cohortId).toBe('c1');
      expect('scenarioId' in scope).toBe(false);
      expect(screen.getByTestId('sw-promote-success')).toBeInTheDocument();
    });
  });

  it('does not show Promote button on Draft scenarios', () => {
    act(() => {
      useCountyStudioStore.getState().setScenarios([
        { ...MOCK_DRAFT, scenarioId: 'sc-draft-2', status: 'Draft' },
      ]);
    });
    render(<ScenarioWorksheet />);
    expect(screen.queryByTestId('promote-btn-sc-draft-2')).toBeNull();
  });
});
