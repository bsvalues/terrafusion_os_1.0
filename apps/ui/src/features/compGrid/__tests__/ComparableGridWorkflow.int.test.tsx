import React from 'react';
import {screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderWithProviders} from '../../../../tests/utils/renderWithProviders';
import ComparableGrid from '../ComparableGrid';
import {server} from '../../../../tests/msw/server';
import {http, HttpResponse} from 'msw';

describe('Comparable Grid Workflow', () => {it('happy path: add comparable, edit row, see score summary update', async () => {
    renderWithProviders(<ComparableGrid parcelId="P-10001" />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /add comparable/i}));
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/sale price/i), '425000');
    await user.click(screen.getByRole('button', {name: /save/i}));

    const row = await screen.findByRole('row', {name: /123 main st/i});
    await user.dblClick(within(row).getByRole('cell', {name: /sale price/i}));
    await user.clear(within(row).getByRole('spinbutton'));
    await user.type(within(row).getByRole('spinbutton'), '430000');
    await user.keyboard('{Enter}');

    // Score summary derived from store selectors
    expect(await screen.findByTestId('score-summary')).toHaveTextContent(/score: \d+/i);
  });

  it('optimistic update rolls back on 409', async () => {server.use(
      http.post('/api/comp-grid/rows', async () =>
        HttpResponse.json({ error: 'Conflict'}, {status: 409})
      )
    );

    renderWithProviders(<ComparableGrid parcelId="P-10001" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', {name: /add comparable/i}));
    await user.type(screen.getByLabelText(/address/i), '456 River Rd');
    await user.type(screen.getByLabelText(/sale price/i), '399000');
    await user.click(screen.getByRole('button', {name: /save/i}));

    // Temporary optimistic row appears…
    const temp = await screen.findByRole('row', {name: /456 river rd/i});
    expect(temp).toBeInTheDocument();

    // …but rolls back on conflict
    expect(await screen.findByText(/could not save comparable/i)).toBeInTheDocument();
  });
});
