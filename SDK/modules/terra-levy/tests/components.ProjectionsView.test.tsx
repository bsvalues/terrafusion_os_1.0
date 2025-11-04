import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testHelpers';
import { ProjectionsView } from '../components/ProjectionsView';

describe('ProjectionsView', () => {
  beforeEach(() => {
    // jsdom doesn't implement ResizeObserver; silence optional warnings if component uses it
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it('generates and displays projections, surfacing a success toast', async () => {
    renderWithProviders(<ProjectionsView />, { initialEntries: ['/projections'] });

    const scenarioInput = await screen.findByPlaceholderText(/enter scenario id/i);
    await userEvent.clear(scenarioInput);
    await userEvent.type(scenarioInput, 's-100');

    const generateBtn = await screen.findByRole('button', { name: /generate projections/i });
    await userEvent.click(generateBtn);

    // Expect success toast
    await screen.findByText(/projections generated/i);

    // Expect the summary list to render items for fiscal years
    await waitFor(() => {
      expect(screen.getByText(/fy 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/fy 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/fy 2027/i)).toBeInTheDocument();
    });
  });
});
