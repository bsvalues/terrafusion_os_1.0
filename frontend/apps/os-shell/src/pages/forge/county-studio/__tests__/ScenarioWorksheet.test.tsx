import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { ScenarioWorksheet } from '../components/ScenarioWorksheet';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  scenarioApi: {
    create: vi.fn().mockResolvedValue({
      scenarioId: 'sc-new',
      studyId: 'study-1',
      cohortId: 'cohort-1',
      adjustmentType: 'PercentageIncrease',
      parameters: {},
      rationale: 'Test',
      status: 'Draft',
      createdAt: '2026-04-21T00:00:00Z',
    }),
  },
}));

describe('ScenarioWorksheet', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.setState({
        activeStudy: {
          studyId: 'study-1',
          countyId: 'benton',
          taxYear: 2026,
          studyType: 'RatioStudy',
          status: 'Active',
          baselineVersion: null,
          activeSegmentSetId: null,
          createdAt: '2026-04-21T00:00:00Z',
          updatedAt: '2026-04-21T00:00:00Z',
          createdBy: 'user',
          updatedBy: 'user',
        },
        cohorts: [
          {
            cohortId: 'cohort-1',
            studyId: 'study-1',
            name: 'West Richland R1',
            selectionType: 'Visual',
            parcelCount: 412,
            isHybrid: false,
            createdAt: '2026-04-21T00:00:00Z',
          },
        ],
      });
    });
  });

  it('renders adjustment type selector', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/adjustment type/i)).toBeInTheDocument();
  });

  it('renders magnitude input', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/magnitude/i)).toBeInTheDocument();
  });

  it('renders rationale textarea', () => {
    render(<ScenarioWorksheet />);
    expect(screen.getByLabelText(/rationale/i)).toBeInTheDocument();
  });

  it('Save button is disabled when no cohort selected', () => {
    act(() => {
      useCountyStudioStore.setState({ cohorts: [] });
    });
    render(<ScenarioWorksheet />);
    expect(screen.getByRole('button', { name: /save scenario/i })).toBeDisabled();
  });
});
