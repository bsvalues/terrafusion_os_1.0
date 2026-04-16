import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TerraExportModule from '../../pages/suites/modules/TerraExportModule';

const mockInvokeTool = vi.fn();

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

describe('TerraExportModule contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockImplementation(async ({ toolId }: { toolId: string }) => {
      if (toolId === 'export_audit_bundle') {
        return {
          result: {
            payloadRef: 'payload:atlas-audit',
            bundleRef: 'bundle:atlas-audit',
            artifactCount: 7,
            traceRef: 'trace:atlas-audit',
          },
          correlationId: 'corr-export-001',
        };
      }

      if (toolId === 'export_equalization_package') {
        return {
          result: {
            payloadRef: 'payload:eq',
            packageRef: 'package:eq',
            artifactCount: 5,
            checklist: ['ratio-study'],
          },
          correlationId: 'corr-eq-001',
        };
      }

      throw new Error(`Unexpected tool: ${toolId}`);
    });
  });

  const renderModule = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TerraExportModule />
      </QueryClientProvider>
    );
  };

  it('renders governed export posture surface', () => {
    renderModule();

    expect(screen.getByTestId('terraexport-governed-brief')).toBeInTheDocument();
  });

  it('exports a governed audit bundle and shows trace refs', async () => {
    renderModule();

    fireEvent.click(screen.getByRole('button', { name: /Export Audit Bundle/i }));

    await waitFor(() => {
      expect(screen.getByText(/Audit bundle assembled/i)).toBeInTheDocument();
      expect(screen.getByText(/bundle:atlas-audit/i)).toBeInTheDocument();
      expect(screen.getByText(/trace:atlas-audit/i)).toBeInTheDocument();
      expect(screen.getByText(/corr-export-001/i)).toBeInTheDocument();
    });
  });
});
