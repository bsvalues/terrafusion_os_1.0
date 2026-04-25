import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ScenarioCompareGrid } from '../components/ScenarioCompareGrid';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('../countyStudyApi', () => ({
  scenarioApi: {
    compare: vi.fn(),
  },
}));

import { scenarioApi } from '../countyStudyApi';

const MOCK_SCENARIOS = [
  {
    scenarioId: 'sc-1', studyId: 'study-1', cohortId: 'c1',
    adjustmentType: 'PercentageIncrease' as const, parameters: { magnitude: 3 },
    rationale: 'A', status: 'Saved' as const, createdAt: '2026-01-01', createdBy: 'test',
  },
  {
    scenarioId: 'sc-2', studyId: 'study-1', cohortId: 'c1',
    adjustmentType: 'PercentageIncrease' as const, parameters: { magnitude: 5 },
    rationale: 'B', status: 'Saved' as const, createdAt: '2026-01-02', createdBy: 'test',
  },
];

const MOCK_COMPARE = {
  scenarioA: MOCK_SCENARIOS[0],
  scenarioB: MOCK_SCENARIOS[1],
  rows: [
    { metricLabel: 'Median Ratio', baseline: 0.98, afterA: 1.00, afterB: 1.01, deltaAMinusB: -0.01, winner: 'A' as const },
    { metricLabel: 'COD', baseline: 14.2, afterA: 12.4, afterB: 11.8, deltaAMinusB: 0.6, winner: 'B' as const },
    { metricLabel: 'PRD', baseline: 1.01, afterA: 0.99, afterB: 1.00, deltaAMinusB: -0.01, winner: 'A' as const },
    { metricLabel: 'Exceptions', baseline: 8, afterA: 5, afterB: 3, deltaAMinusB: 2, winner: 'B' as const },
  ],
};

describe('ScenarioCompareGrid', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setScenarios(MOCK_SCENARIOS);
    });
    vi.mocked(scenarioApi.compare).mockResolvedValue(MOCK_COMPARE);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders Compare button', () => {
    render(<ScenarioCompareGrid />);
    expect(screen.getByText('Compare')).toBeTruthy();
  });

  test('shows no-scenarios message when list is empty', () => {
    act(() => {
      useCountyStudioStore.getState().setScenarios([]);
    });
    render(<ScenarioCompareGrid />);
    expect(screen.getByText(/No scenarios/i)).toBeTruthy();
  });

  test('calls compare API and shows result table', async () => {
    const user = userEvent.setup();
    render(<ScenarioCompareGrid />);

    // Select A and B
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'sc-1');
    await user.selectOptions(selects[1], 'sc-2');

    await user.click(screen.getByText('Compare'));

    await waitFor(() => {
      expect(screen.getByText('Median Ratio')).toBeTruthy();
    });
    expect(screen.getByText('COD')).toBeTruthy();
    expect(screen.getByText(/Scenario A leads|Scenario B leads|evenly matched/i)).toBeTruthy();
    expect(vi.mocked(scenarioApi.compare)).toHaveBeenCalledWith('sc-1', 'sc-2');
  });

  test('Compare button is disabled when same scenario selected for A and B', async () => {
    const user = userEvent.setup();
    render(<ScenarioCompareGrid />);

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'sc-1');
    // sc-1 is filtered out from B's list, so can't select same; verify button stays disabled with no B selected
    const btn = screen.getByText('Compare') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
