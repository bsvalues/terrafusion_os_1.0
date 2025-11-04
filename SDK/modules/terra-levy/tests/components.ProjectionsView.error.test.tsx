import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './testServer';
import { renderWithProviders } from './testHelpers';
import { ProjectionsView } from '../components/ProjectionsView';

describe('ProjectionsView error handling', () => {
  it('shows a Notice on generate failure, without duplicate toasts', async () => {
    // Force the generate endpoint to fail
    server.use(
      http.post('http://localhost:5000/levy/projections/generate', async () => {
        return new HttpResponse('Internal Error', { status: 500 });
      })
    );

    renderWithProviders(<ProjectionsView />, { initialEntries: ['/projections'] });

    const scenarioInput = await screen.findByPlaceholderText(/enter scenario id/i);
    await userEvent.type(scenarioInput, 's-err');

    const generateBtn = await screen.findByRole('button', { name: /generate projections/i });
    await userEvent.click(generateBtn);

    // Expect an error notice within the view (content differs from toast to avoid duplication)
    await screen.findByText(/API Error: 500 - Internal Error/i);
  });
});
