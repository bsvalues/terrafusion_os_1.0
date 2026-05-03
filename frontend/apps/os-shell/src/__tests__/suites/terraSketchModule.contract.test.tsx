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

  it('shows analyze geometry button disabled when no active parcel boundary is loaded', async () => {
    // TerraSketchModule requires real parcel boundary geometry (vertices) before
    // analysis can proceed. In isolation (no property store / no loaded geometry),
    // the button is disabled and guidance text is shown.
    render(<TerraSketchModule />);

    const analyzeBtn = await screen.findByRole('button', { name: /analyze geometry/i });
    expect(analyzeBtn).toBeDisabled();
    expect(
      screen.getByText(/Geometry analysis opens after active parcel boundary evidence is present/i),
    ).toBeInTheDocument();
    // invokeTool must NOT be called when the guard blocks analysis
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });
});
