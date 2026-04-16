import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TerraQueryModule from '../../pages/suites/modules/TerraQueryModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

describe('TerraQueryModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-query-001',
      result: {
        output: JSON.stringify({
          narrative: 'Query results indicate a governed Benton zoning signal that needs GIS verification before any valuation adjustment.',
          hotspotCount: 5,
          recommendedAction: 'Route zoning conflicts to Atlas or Workbench first, and only escalate verified county patterns to TerraForge.',
        }),
      },
    });
  });

  it('renders governed query audit strip', () => {
    render(<TerraQueryModule />);

    expect(screen.getByTestId('terraquery-governed-brief')).toBeInTheDocument();
  });

  it('analyzes query signal and shows routing guidance', async () => {
    render(<TerraQueryModule />);

    fireEvent.click(screen.getByRole('button', { name: /Explain Query Signal/i }));

    await waitFor(() => {
      expect(screen.getByText(/governed Benton zoning signal/i)).toBeInTheDocument();
      expect(screen.getByText(/Route zoning conflicts to Atlas or Workbench first, and only escalate verified county patterns to TerraForge\./i)).toBeInTheDocument();
      expect(screen.getByText(/corr-query-001/i)).toBeInTheDocument();
    });
  });
});
