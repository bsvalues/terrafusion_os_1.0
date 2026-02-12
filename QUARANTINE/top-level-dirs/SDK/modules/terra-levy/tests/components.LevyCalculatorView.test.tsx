import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testHelpers';
import { LevyCalculatorView } from '../components/LevyCalculatorView';

describe('LevyCalculatorView', () => {
  it('calculates optimal rate and shows compliance feedback', async () => {
    renderWithProviders(<LevyCalculatorView />, { initialEntries: ['/calculate'] });

    const measureInput = await screen.findByTitle(/measure id/i);
    await userEvent.type(measureInput, 'm1');

    const rateInput = await screen.findByTitle(/proposed rate/i);
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '1.10');

    const calcBtn = await screen.findByRole('button', { name: /calculate optimal rate/i });
    await userEvent.click(calcBtn);

    // Success toast for calculation
    await screen.findByText(/calculated optimal rate/i);

    // Results rendered
    await waitFor(() => {
      expect(screen.getByText(/calculated rate/i)).toBeInTheDocument();
      expect(screen.getByText(/ai optimal rate/i)).toBeInTheDocument();
      expect(screen.getByText(/levy amount/i)).toBeInTheDocument();
    });

    // Compliance section present and shows YES/NO depending on handler
    await screen.findByText(/compliance/i);
    expect(screen.getByText(/max allowed/i)).toBeInTheDocument();
  });
});
