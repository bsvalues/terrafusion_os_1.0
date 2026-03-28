import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CoefficientPreview } from '../CoefficientPreview';

describe('CoefficientPreview', () => {
  it('discloses fixture data instead of surfacing production wording', () => {
    render(<CoefficientPreview />);

    expect(screen.getByText(/DEMO DATA/i)).toBeInTheDocument();
    expect(screen.getByText(/Coefficient Preview is displaying sample fixtures, not live county data/i)).toBeInTheDocument();
    expect(screen.getByText('Current (Baseline)')).toBeInTheDocument();
    expect(screen.getByText('Proposed (Candidate)')).toBeInTheDocument();
    expect(screen.queryByText('Current (Production)')).not.toBeInTheDocument();
    expect(screen.queryByText(/Residential OLS 2024 \(Production\)/i)).not.toBeInTheDocument();
  });

  it('keeps apply-state messaging away from production-model claims', async () => {
    render(<CoefficientPreview />);

    fireEvent.click(screen.getByTestId('coeff-preview-btn'));
    // handlePreview is async; wait for the apply button to appear (preview state settled)
    await waitFor(() => screen.getByTestId('coeff-apply-btn'));
    fireEvent.click(screen.getByTestId('coeff-apply-btn'));

    expect(screen.getByTestId('coeff-apply-mode')).toHaveTextContent(
      'Mode: Apply Blocked — backend capability not available. Request recorded.'
    );
    expect(screen.queryByText(/production model/i)).not.toBeInTheDocument();
  });
});