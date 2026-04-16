import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TerraPrintModule from '../../pages/suites/modules/TerraPrintModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

describe('TerraPrintModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-print-001',
      result: {
        output: JSON.stringify({
          narrative: 'Print layout reviewed — letter portrait selected, all sections within page margin tolerance.',
          formatRecommendation: 'Current format suitable for field inspection use.',
          routingNote: 'Ready for print queue — no supervisor review required.',
        }),
      },
    });
  });

  it('renders governed print audit surface', async () => {
    render(<TerraPrintModule />);

    expect(await screen.findByTestId('terraprint-governed-brief')).toBeInTheDocument();
  });

  it('analyzes print layout and shows routing guidance', async () => {
    render(<TerraPrintModule />);

    fireEvent.click(await screen.findByRole('button', { name: /analyze print layout/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Print layout reviewed — letter portrait selected/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Ready for print queue — no supervisor review required\./i),
      ).toBeInTheDocument();
      expect(screen.getByText(/corr-print-001/i)).toBeInTheDocument();
    });
  });
});
