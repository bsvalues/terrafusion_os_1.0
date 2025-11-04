import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './testServer';
import { renderWithProviders } from './testHelpers';
import { LevyCalculatorView } from '../components/LevyCalculatorView';

describe('LevyCalculatorView error handling', () => {
  it('shows a Notice on calculate failure (no success toast)', async () => {
    // Force the calculate endpoint to fail
    server.use(
      http.post('http://localhost:5000/levy/calculate', async () => {
        return new HttpResponse('Internal Error', { status: 500 });
      })
    );

    renderWithProviders(<LevyCalculatorView />, { initialEntries: ['/calculate'] });

    const measureInput = await screen.findByTitle(/measure id/i);
    await userEvent.type(measureInput, 'm1');

    const rateInput = await screen.findByTitle(/proposed rate/i);
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '1.10');

    const calcBtn = await screen.findByRole('button', { name: /calculate optimal rate/i });
    await userEvent.click(calcBtn);

    // Expect an error notice within the view
    await screen.findByText(/API Error: 500 - Internal Error/i);

    // Ensure no success toast appears
    expect(screen.queryByText(/calculated optimal rate/i)).not.toBeInTheDocument();
  });
});
