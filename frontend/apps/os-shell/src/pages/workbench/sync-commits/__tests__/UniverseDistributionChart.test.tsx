/**
 * SYNC-UX-1B: UniverseDistributionChart unit tests.
 *
 * The chart is purely presentational — given a parsed
 * UniverseDistribution, it must render exactly 7 cells with the
 * correct labels and counts.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UniverseDistributionChart from '../UniverseDistributionChart';
import { UNIVERSE_KEYS, type UniverseDistribution } from '@/api/syncCommits';

const sampleDistribution: UniverseDistribution = {
  REAL_RESIDENTIAL: 209,
  REAL_COMMERCIAL: 4,
  MOBILE_HOME: 0,
  AG_CURRENT_USE: 28,
  PERSONAL_PROPERTY: 0,
  CONVERSION_LEGACY: 0,
  UNKNOWN: 0,
};

describe('UniverseDistributionChart', () => {
  it('renders all 7 universe cells', () => {
    render(<UniverseDistributionChart distribution={sampleDistribution} />);
    for (const k of UNIVERSE_KEYS) {
      expect(screen.getByTestId(`universe-cell-${k}`)).toBeInTheDocument();
    }
  });

  it('renders each cell with the correct count', () => {
    render(<UniverseDistributionChart distribution={sampleDistribution} />);
    expect(screen.getByTestId('universe-cell-REAL_RESIDENTIAL').dataset.count).toBe('209');
    expect(screen.getByTestId('universe-cell-AG_CURRENT_USE').dataset.count).toBe('28');
    expect(screen.getByTestId('universe-cell-REAL_COMMERCIAL').dataset.count).toBe('4');
    expect(screen.getByTestId('universe-cell-MOBILE_HOME').dataset.count).toBe('0');
  });

  it('renders the panel total in the header', () => {
    render(<UniverseDistributionChart distribution={sampleDistribution} />);
    // total = 209 + 4 + 0 + 28 + 0 + 0 + 0 = 241
    expect(
      screen.getByLabelText('Universe distribution snapshot'),
    ).toHaveTextContent('241 truth rows');
  });
});
