import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TerraSketchModule from '../../pages/suites/modules/TerraSketchModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

describe('TerraSketchModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-sketch-001',
      result: {
        output: JSON.stringify({
          narrative: 'Geometry reviewed — vertex C proximity warning noted; ROW encroachment requires surveyor confirmation.',
          boundaryNote: 'One vertex within 1ft of right-of-way boundary — flag for field verification.',
          routingNote: 'Hold save pending surveyor sign-off on ROW boundary.',
        }),
      },
    });
  });

  it('renders governed geometry audit surface', async () => {
    render(<TerraSketchModule />);

    expect(await screen.findByTestId('terrasketch-governed-brief')).toBeInTheDocument();
  });

  it('analyzes sketch geometry and shows routing guidance', async () => {
    render(<TerraSketchModule />);

    fireEvent.click(await screen.findByRole('button', { name: /analyze geometry/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Geometry reviewed — vertex C proximity warning noted/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Hold save pending surveyor sign-off on ROW boundary\./i),
      ).toBeInTheDocument();
      expect(screen.getByText(/corr-sketch-001/i)).toBeInTheDocument();
    });
  });
});
