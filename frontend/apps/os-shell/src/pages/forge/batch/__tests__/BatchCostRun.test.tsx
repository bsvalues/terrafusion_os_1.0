import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BatchCostRun } from '../BatchCostRun';

describe('BatchCostRun', () => {
  it('renders an explicit governed unavailable state instead of demo fixtures', () => {
    render(<BatchCostRun />);

    expect(screen.getByTestId('batch-cost-run-unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/Governed batch cost run unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Source: No governed batch valuation engine is currently wired for this module.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/DEMO DATA/i)).not.toBeInTheDocument();
  });

  it('lists the blocked preview, apply, and history lanes', () => {
    render(<BatchCostRun />);

    expect(screen.getByText('Preview Engine')).toBeInTheDocument();
    expect(screen.getByText('Apply Endpoint')).toBeInTheDocument();
    expect(screen.getByText('Run History')).toBeInTheDocument();
    expect(
      screen.getByText(/Use Cost Manual for certified county schedule review where available/i)
    ).toBeInTheDocument();
  });
});
