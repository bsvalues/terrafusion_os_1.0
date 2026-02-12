import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testHelpers';
import { ScenariosListView } from '../components/ScenariosListView';

describe('ScenariosListView', () => {
  it('allows selection and compare', async () => {
    renderWithProviders(<ScenariosListView />);

    // Wait for rows to render
    await waitFor(() => expect(screen.getByText(/Levy Scenarios/i)).toBeInTheDocument());

    // Choose a measure to trigger scenarios query
    const measureSelect = await screen.findByTitle(/filter scenarios by levy measure/i);
    await userEvent.selectOptions(measureSelect, 'm1');

    // Select two rows by toggling their checkboxes
    const checkboxes = await screen.findAllByRole('checkbox');
    // First is select-all; pick next two
    await userEvent.click(checkboxes[1]);
    await userEvent.click(checkboxes[2]);

    // Click compare
    const compareBtn = await screen.findByRole('button', { name: /compare/i });
    await userEvent.click(compareBtn);

    // Expect toast to show "Comparison ready" (text presence)
    await waitFor(() => expect(screen.getByText(/Comparison ready/i)).toBeInTheDocument());
  });
});
