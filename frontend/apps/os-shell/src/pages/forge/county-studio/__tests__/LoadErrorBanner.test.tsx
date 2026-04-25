// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/LoadErrorBanner.test.tsx
//
// Unit tests for LoadErrorBanner.
// Covers: no-render when all resources are OK, banner appears when one resource
// fails, error message displayed, Retry button fires onRetry prop,
// multiple simultaneous failures listed together.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoadErrorBanner } from '../components/LoadErrorBanner';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

function setResourceError(resource: 'segments' | 'cohorts' | 'scenarios', message: string) {
  act(() => {
    useCountyStudioStore.getState().setLoadStatus(resource, 'error', message);
  });
}

function clearErrors() {
  act(() => {
    useCountyStudioStore.getState().setLoadStatus('segments',  'idle', null);
    useCountyStudioStore.getState().setLoadStatus('cohorts',   'idle', null);
    useCountyStudioStore.getState().setLoadStatus('scenarios', 'idle', null);
  });
}

beforeEach(() => {
  clearErrors();
});

describe('LoadErrorBanner', () => {
  it('renders nothing when all resources are OK', () => {
    const { container } = render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('cs-load-error-banner')).not.toBeInTheDocument();
  });

  it('shows banner when segments resource fails', () => {
    setResourceError('segments', 'HTTP 503');
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(screen.getByTestId('cs-load-error-banner')).toBeInTheDocument();
  });

  it('shows banner when cohorts resource fails', () => {
    setResourceError('cohorts', 'Network timeout');
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(screen.getByTestId('cs-load-error-banner')).toBeInTheDocument();
  });

  it('shows banner when scenarios resource fails', () => {
    setResourceError('scenarios', 'Not found');
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(screen.getByTestId('cs-load-error-banner')).toBeInTheDocument();
  });

  it('displays the error message for the failing resource', () => {
    setResourceError('segments', 'Service unavailable');
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(screen.getByTestId('cs-load-error-banner')).toHaveTextContent('Service unavailable');
  });

  it('Retry button fires the onRetry prop', () => {
    setResourceError('segments', 'HTTP 500');
    const onRetry = vi.fn();
    render(<LoadErrorBanner onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows both failed resources when two fail simultaneously', () => {
    setResourceError('segments',  'HTTP 503');
    setResourceError('scenarios', 'Network error');
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    const banner = screen.getByTestId('cs-load-error-banner');
    expect(banner).toHaveTextContent('segments');
    expect(banner).toHaveTextContent('scenarios');
  });

  it('shows "Unknown error" fallback when error message is null', () => {
    // setLoadStatus with null message — banner should still show
    act(() => {
      useCountyStudioStore.getState().setLoadStatus('cohorts', 'error', null);
    });
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(screen.getByTestId('cs-load-error-banner')).toHaveTextContent('Unknown error');
  });

  it('has role="alert" for accessibility', () => {
    setResourceError('segments', 'Error');
    render(<LoadErrorBanner onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
