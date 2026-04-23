import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { LeftRail } from '../components/LeftRail';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountyCohortDto, CountyScenarioDto } from '../types/countyStudio.types';

const MOCK_COHORT: CountyCohortDto = {
  cohortId: 'c1', studyId: 'study-1', name: 'West Side',
  selectionType: 'Visual', parcelCount: 80, isHybrid: false, createdAt: '',
};

const MOCK_SCENARIO: CountyScenarioDto = {
  scenarioId: 'sc1', studyId: 'study-1', cohortId: 'c1',
  adjustmentType: 'PercentageIncrease', parameters: {}, rationale: '',
  status: 'Draft', createdAt: '',
};

describe('LeftRail', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setCohorts([MOCK_COHORT]);
      useCountyStudioStore.getState().setScenarios([MOCK_SCENARIO]);
      useCountyStudioStore.getState().setActiveCohort(null);
      useCountyStudioStore.getState().setActiveScenario(null);
    });
  });

  it('clicking a cohort sets activeCohortId in the store', () => {
    render(<LeftRail />);
    fireEvent.click(screen.getByText('West Side'));
    expect(useCountyStudioStore.getState().activeCohortId).toBe('c1');
  });

  it('highlights the active cohort', () => {
    act(() => { useCountyStudioStore.getState().setActiveCohort('c1'); });
    render(<LeftRail />);
    // The active cohort item should have active styling
    const btn = screen.getByText('West Side').closest('button');
    expect(btn).not.toBeNull();
    // Active items have non-transparent background (implementation detail OK to check via data-active)
    expect(btn?.getAttribute('data-active')).toBe('true');
  });

  it('clicking a scenario sets activeScenario in the store', () => {
    render(<LeftRail />);
    fireEvent.click(screen.getByText('PercentageIncrease'));
    expect(useCountyStudioStore.getState().activeScenario?.scenarioId).toBe('sc1');
  });

  // ── Follow-up: loading + error states ───────────────────────────────

  it('renders cohorts skeleton while loadStatus.cohorts is loading', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'loading', scenarios: 'idle' },
      });
    });
    render(<LeftRail />);
    expect(screen.getByTestId('left-rail-cohorts-loading')).toBeInTheDocument();
    // Real cohort item is NOT rendered during loading.
    expect(screen.queryByText('West Side')).not.toBeInTheDocument();
  });

  it('renders scenarios skeleton while loadStatus.scenarios is loading', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'idle', scenarios: 'loading' },
      });
    });
    render(<LeftRail />);
    expect(screen.getByTestId('left-rail-scenarios-loading')).toBeInTheDocument();
    expect(screen.queryByText('PercentageIncrease')).not.toBeInTheDocument();
  });

  it('renders inline error when cohorts load fails', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'idle', cohorts: 'error', scenarios: 'idle' },
        loadErrors: { segments: null, cohorts: 'backend 500', scenarios: null },
      });
    });
    render(<LeftRail />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveAttribute('title', 'backend 500');
  });
});
