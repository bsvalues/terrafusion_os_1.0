/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ERROR PIPELINE INTEGRATION TESTS
 * Phase 1 Day 2: End-to-End Error Flow Verification
 *
 * Tests correlationId flows correctly through:
 * - API failures → pilotApi → ErrorInfo → ErrorDisplay
 * - React errors → ErrorBoundary → ErrorInfo → ErrorDisplay
 * - Retry logic preserving correlationId
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import {
    normalizeNetworkError,
    normalizePilotError,
    PilotInvokeResponse,
} from '../../api/pilotApi';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { ErrorProvider } from '../../contexts/ErrorContext';

// Mock component that throws
const ThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>No error</div>;
};

describe('Error Pipeline Integration', () => {
  describe('ErrorBoundary → ErrorDisplay Flow', () => {
    it('catches React errors and generates correlationId', async () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should display error with correlationId
      await waitFor(() => {
        expect(screen.getByText(/Test component error/i)).toBeInTheDocument();
      });

      // CorrelationId should be visible
      const correlationCode = screen.getByText(/ebnd-/i);
      expect(correlationCode).toBeInTheDocument();
      expect(correlationCode.textContent).toMatch(/^ebnd-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('provides reset capability', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Test component error/i)).toBeInTheDocument();
      });

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('shows stack trace in dev mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Stack Trace/i)).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('hides stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Test component error/i)).toBeInTheDocument();
      });

      // Stack trace should not be visible
      expect(screen.queryByText(/Stack Trace/i)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('PilotAPI Error Normalization', () => {
    it('normalizes backend errors with correlationId', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-test-001',
        error: 'Confirmation required before execution',
        errorCode: 'CONFIRMATION_REQUIRED',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.correlationId).toBe('corr-test-001');
      expect(errorInfo.message).toBe('Confirmation required before execution');
      expect(errorInfo.context?.errorCode).toBe('CONFIRMATION_REQUIRED');
      expect(errorInfo.context?.severity).toBe('medium');
    });

    it('assigns high severity to write lane mismatches', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-test-002',
        error: 'Write lane must match suite',
        errorCode: 'WRITE_LANE_MISMATCH',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.context?.severity).toBe('high');
    });

    it('assigns critical severity to execution failures', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-test-003',
        error: 'Tool handler crashed',
        errorCode: 'EXECUTION_FAILED',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.context?.severity).toBe('critical');
    });

    it('generates correlationId for network errors', () => {
      const mockError = new Error('Network request failed');

      const errorInfo = normalizeNetworkError(mockError, { endpoint: '/pilot/invoke' });

      expect(errorInfo.correlationId).toMatch(/^net-/);
      expect(errorInfo.message).toBe('Network request failed');
      expect(errorInfo.context?.errorCode).toBe('NETWORK_ERROR');
      expect(errorInfo.context?.severity).toBe('high');
    });

    it('includes additional context in normalized errors', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-test-004',
        error: 'Operation failed',
        errorCode: 'HANDLER_ERROR',
      };

      const errorInfo = normalizePilotError(mockResponse, {
        toolId: 'test-tool',
        userId: 'user-123',
      });

      expect(errorInfo.context?.toolId).toBe('test-tool');
      expect(errorInfo.context?.userId).toBe('user-123');
    });
  });

  describe('Error Context Integration', () => {
    it('reports errors with correlationId to ErrorProvider', () => {
      const handleError = vi.fn();

      render(
        <ErrorProvider>
          <ErrorBoundary onError={handleError}>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </ErrorProvider>
      );

      // ErrorBoundary should call onError with ErrorInfo containing correlationId
      expect(handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: expect.stringMatching(/^ebnd-/),
          message: 'Test component error',
        })
      );
    });
  });

  describe('Retry Logic with CorrelationId', () => {
    it('preserves correlationId across retry attempts', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-retry-001',
        error: 'Transient failure',
        errorCode: 'EXECUTION_FAILED',
      };

      // First attempt
      const errorInfo1 = normalizePilotError(mockResponse, { attempt: 1 });

      // Second attempt (retry) - same correlationId
      const errorInfo2 = normalizePilotError(mockResponse, { attempt: 2 });

      expect(errorInfo1.correlationId).toBe('corr-retry-001');
      expect(errorInfo2.correlationId).toBe('corr-retry-001');
      expect(errorInfo1.correlationId).toBe(errorInfo2.correlationId);
    });
  });

  describe('CorrelationId Format Validation', () => {
    it('ErrorBoundary generates valid correlationId format', async () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        const correlationElement = screen.getByText(/ebnd-/i);
        expect(correlationElement.textContent).toMatch(/^ebnd-[a-z0-9]+-[a-z0-9]+$/);
      });
    });

    it('Network errors generate valid correlationId format', () => {
      const errorInfo = normalizeNetworkError(new Error('Test'));

      expect(errorInfo.correlationId).toMatch(/^net-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('Backend correlationIds pass through unchanged', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-backend-12345',
        error: 'Test',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.correlationId).toBe('corr-backend-12345');
    });
  });
});
