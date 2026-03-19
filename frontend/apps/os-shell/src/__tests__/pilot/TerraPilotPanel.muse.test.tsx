import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pilotBridge from '@/services/pilotBridge';
import { TerraPilotPanel } from '@/components/pilot/TerraPilotPanel';

const useAuthContextMock = vi.fn();
const toOsActorMock = vi.fn();
const generateCorrelationIdMock = vi.fn();
const emitToolInvokedMock = vi.fn();
const emitToolSucceededMock = vi.fn();
const emitToolFailedMock = vi.fn();

vi.mock('@/auth/useAuthContext', () => ({
  useAuthContext: () => useAuthContextMock(),
  toOsActor: (...args: unknown[]) => toOsActorMock(...args),
}));

vi.mock('@/services/terraTrace', () => ({
  generateCorrelationId: () => generateCorrelationIdMock(),
  emitToolInvoked: (...args: unknown[]) => emitToolInvokedMock(...args),
  emitToolSucceeded: (...args: unknown[]) => emitToolSucceededMock(...args),
  emitToolFailed: (...args: unknown[]) => emitToolFailedMock(...args),
}));

describe('TerraPilotPanel Muse lane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContextMock.mockReturnValue({
      isAuthenticated: true,
      userId: 'u-1',
      countyId: '037',
      roles: ['appraiser'],
      token: 'token',
    });
    toOsActorMock.mockReturnValue({
      userId: 'u-1',
      countyId: '037',
      roles: ['appraiser'],
    });
    generateCorrelationIdMock.mockReturnValue('cid-test-123');
  });

  it('shows unauthenticated state when actor identity is unavailable', () => {
    toOsActorMock.mockReturnValue(null);

    render(<TerraPilotPanel parcelId='P-100' parcelData={{ assessedValue: 1000 }} />);

    expect(screen.getByTestId('pilot-unauthenticated')).toBeInTheDocument();
  });

  it('shows no-parcel state when parcel context is absent', () => {
    render(<TerraPilotPanel parcelId={null} />);

    expect(screen.getByTestId('pilot-no-parcel')).toBeInTheDocument();
  });

  it('emits canonical trace events for a successful explain request', async () => {
    render(<TerraPilotPanel parcelId='P-100' parcelData={{ assessedValue: 1000 }} />);

    fireEvent.change(screen.getByTestId('pilot-query-input'), {
      target: { value: 'Why is this value high?' },
    });
    fireEvent.click(screen.getByTestId('pilot-explain-button'));

    await waitFor(() => {
      expect(emitToolInvokedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          suite: 'pilot',
          correlationId: 'cid-test-123',
          countyId: '037',
          parcelId: 'P-100',
          risk: 'read_only',
        }),
      );
    });

    expect(emitToolSucceededMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suite: 'pilot',
        correlationId: 'cid-test-123',
        countyId: '037',
        parcelId: 'P-100',
      }),
    );
    expect(emitToolFailedMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('pilot-trace-id')).toHaveTextContent('cid-test-123');
  });

  it('emits canonical failure trace when explain request assembly throws', async () => {
    vi.spyOn(pilotBridge, 'buildExplainRequest').mockImplementation(() => {
      throw new Error('Request assembly failed');
    });

    render(<TerraPilotPanel parcelId='P-100' parcelData={{ assessedValue: 1000 }} />);

    fireEvent.change(screen.getByTestId('pilot-query-input'), {
      target: { value: 'Explain the parcel history' },
    });
    fireEvent.click(screen.getByTestId('pilot-explain-button'));

    await waitFor(() => {
      expect(emitToolFailedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          suite: 'pilot',
          correlationId: 'cid-test-123',
          countyId: '037',
          parcelId: 'P-100',
          outputSummary: 'Request assembly failed',
        }),
      );
    });

    expect(emitToolSucceededMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('pilot-error')).toHaveTextContent('Request assembly failed');
  });
});
