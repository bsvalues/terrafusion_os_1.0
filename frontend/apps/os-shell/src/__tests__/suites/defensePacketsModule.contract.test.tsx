import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import DefensePacketsModule from '../../pages/suites/modules/DefensePacketsModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

describe('DefensePacketsModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockImplementation(async ({ toolId }: { toolId: string }) => {
      if (toolId === 'open_appeal_packet') {
        return {
          success: true,
          correlationId: 'corr-defense-001',
          result: {
            output: JSON.stringify({
              appealId: 'BOE-2025-001',
              packetRef: 'packet:boe-2025-001',
              payloadRef: 'payload:boe-2025-001',
              sections: ['summary', 'evidence'],
              chainOfCustody: ['entry-1', 'entry-2'],
            }),
          },
        };
      }

      if (toolId === 'export_equalization_package') {
        return {
          success: true,
          correlationId: 'corr-equal-001',
          result: {
            output: JSON.stringify({
              payloadRef: 'payload:equalization',
              packageRef: 'package:equalization',
              artifactCount: 5,
              checklist: ['packet', 'trace'],
            }),
          },
        };
      }

      return {
        success: false,
        correlationId: 'corr-error-001',
        error: { message: 'Unexpected tool' },
      };
    });
  });

  it('renders governed defense readiness surface', () => {
    render(<DefensePacketsModule />);

    expect(screen.getByTestId('defense-packets-governed-brief')).toBeInTheDocument();
    expect(screen.getByText('Governed Defense Readiness')).toBeInTheDocument();
  });

  it('opens governed packet posture and shows returned refs', async () => {
    render(<DefensePacketsModule />);

    // The Open Packet Posture button is disabled until an appealId is
    // populated. Type a fixture id into the Appeal id input so the click
    // actually fires handleOpenAppealPacket.
    const appealInput = screen.getByLabelText(/appeal id/i) as HTMLInputElement;
    fireEvent.change(appealInput, { target: { value: 'BOE-2025-001' } });

    fireEvent.click(screen.getByRole('button', { name: /open packet posture/i }));

    await waitFor(() => {
      expect(screen.getByText(/packet:boe-2025-001/i)).toBeInTheDocument();
      expect(screen.getByText(/corr-defense-001/i)).toBeInTheDocument();
    });
  });
});
