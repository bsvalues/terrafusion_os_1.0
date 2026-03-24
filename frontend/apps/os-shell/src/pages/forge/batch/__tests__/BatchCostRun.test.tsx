import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BatchCostRun } from '../BatchCostRun';

describe('BatchCostRun', () => {
  it('discloses fixture-backed history on first render', () => {
    render(<BatchCostRun />);

    expect(screen.getByText(/DEMO DATA/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Batch Cost Run is displaying sample fixtures, not live county data/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Source: Fixture-backed run history; preview and apply use workspace batch valuation APIs when available'
      )
    ).toBeInTheDocument();
  });

  it('uses preview and applied labels instead of a live history badge', () => {
    render(<BatchCostRun />);

    fireEvent.click(screen.getByRole('button', { name: 'Run History' }));

    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Live$/)).not.toBeInTheDocument();
  });
});