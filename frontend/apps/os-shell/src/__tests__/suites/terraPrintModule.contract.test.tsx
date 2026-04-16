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
      correlationId: 'corr-print-001',
      result: {
        payloadRef: 'payload:print-packet',
        bundleRef: 'bundle:print-packet',
        artifactCount: 4,
        traceRef: 'trace:print-packet',
      },
    });
  });

  it('renders governed print audit surface', async () => {
    render(<TerraPrintModule />);

    expect(await screen.findByTestId('terraprint-governed-brief')).toBeInTheDocument();
  });

  it('assembles a governed print packet and shows trace refs', async () => {
    render(<TerraPrintModule />);

    fireEvent.click(await screen.findByRole('button', { name: /generate governed print packet/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Print evidence packet assembled for county GIS review/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/bundle:print-packet/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/trace:print-packet/i)).toBeInTheDocument();
      expect(screen.getByText(/corr-print-001/i)).toBeInTheDocument();
    });
  });
});
