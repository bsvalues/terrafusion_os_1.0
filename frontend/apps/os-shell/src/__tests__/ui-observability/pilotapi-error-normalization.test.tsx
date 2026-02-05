/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - PILOT API ERROR NORMALIZATION TESTS
 * Phase 1 Day 2: CorrelationId Flow Through API Layer
 *
 * Tests correlationId flows correctly through:
 * - Backend errors → normalizePilotError → ErrorInfo
 * - Network errors → normalizeNetworkError → ErrorInfo
 * - Retry attempts preserving correlationId
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import '@testing-library/jest-dom';

import {
    normalizeNetworkError,
    normalizePilotError,
    PilotInvokeResponse,
} from '../../api/pilotApi';

describe('PilotAPI Error Normalization - CorrelationId Flow', () => {
  describe('Backend Error Normalization', () => {
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
      expect(errorInfo.context?.component).toBe('PilotAPI');
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
      expect(errorInfo.correlationId).toBe('corr-test-002');
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

    it('handles missing errorCode gracefully', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-test-005',
        error: 'Unknown error',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.correlationId).toBe('corr-test-005');
      expect(errorInfo.context?.severity).toBe('medium'); // default
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
      expect(errorInfo.correlationId).toBe('corr-test-004');
    });

    it('passes through backend correlationIds unchanged', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-backend-abcd1234',
        error: 'Test error',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.correlationId).toBe('corr-backend-abcd1234');
    });
  });

  describe('Network Error Normalization', () => {
    it('generates correlationId for network errors', () => {
      const mockError = new Error('Network request failed');

      const errorInfo = normalizeNetworkError(mockError, { endpoint: '/pilot/invoke' });

      expect(errorInfo.correlationId).toMatch(/^net-[a-z0-9]+-[a-z0-9]+$/);
      expect(errorInfo.message).toBe('Network request failed');
      expect(errorInfo.context?.errorCode).toBe('NETWORK_ERROR');
      expect(errorInfo.context?.severity).toBe('high');
      expect(errorInfo.context?.component).toBe('PilotAPI');
    });

    it('includes context in network errors', () => {
      const mockError = new Error('Connection timeout');

      const errorInfo = normalizeNetworkError(mockError, {
        endpoint: '/pilot/tools/test-tool',
        attempt: 2,
      });

      expect(errorInfo.context?.endpoint).toBe('/pilot/tools/test-tool');
      expect(errorInfo.context?.attempt).toBe(2);
    });

    it('generates unique correlationIds for different errors', () => {
      const error1 = normalizeNetworkError(new Error('Error 1'));
      const error2 = normalizeNetworkError(new Error('Error 2'));

      expect(error1.correlationId).not.toBe(error2.correlationId);
      expect(error1.correlationId).toMatch(/^net-/);
      expect(error2.correlationId).toMatch(/^net-/);
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

    it('includes attempt number in context', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-retry-002',
        error: 'Retry test',
      };

      const errorInfo = normalizePilotError(mockResponse, { attempt: 3, maxRetries: 5 });

      expect(errorInfo.context?.attempt).toBe(3);
      expect(errorInfo.context?.maxRetries).toBe(5);
      expect(errorInfo.correlationId).toBe('corr-retry-002');
    });
  });

  describe('ErrorInfo Structure Validation', () => {
    it('produces valid ErrorInfo structure', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-structure-test',
        error: 'Validation test',
        errorCode: 'TEST_ERROR',
      };

      const errorInfo = normalizePilotError(mockResponse);

      // Verify ErrorInfo structure
      expect(errorInfo).toHaveProperty('message');
      expect(errorInfo).toHaveProperty('timestamp');
      expect(errorInfo).toHaveProperty('errorId');
      expect(errorInfo).toHaveProperty('correlationId');
      expect(errorInfo).toHaveProperty('context');

      expect(typeof errorInfo.message).toBe('string');
      expect(typeof errorInfo.timestamp).toBe('string');
      expect(typeof errorInfo.errorId).toBe('string');
      expect(typeof errorInfo.correlationId).toBe('string');
      expect(typeof errorInfo.context).toBe('object');
    });

    it('timestamp is in ISO 8601 format', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-timestamp-test',
        error: 'Test',
      };

      const errorInfo = normalizePilotError(mockResponse);

      // ISO 8601 format check
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(errorInfo.timestamp).toMatch(isoPattern);
    });

    it('errorId format is valid', () => {
      const mockResponse: PilotInvokeResponse = {
        ok: false,
        correlationId: 'corr-errorid-test',
        error: 'Test',
      };

      const errorInfo = normalizePilotError(mockResponse);

      expect(errorInfo.errorId).toMatch(/^pilot-\d+-[a-z0-9]+$/);
    });
  });

  describe('Severity Classification', () => {
    const severityTests = [
      { errorCode: 'EXECUTION_FAILED', expected: 'critical' },
      { errorCode: 'HANDLER_ERROR', expected: 'critical' },
      { errorCode: 'WRITE_LANE_MISMATCH', expected: 'high' },
      { errorCode: 'SUPERVISOR_APPROVAL_REQUIRED', expected: 'high' },
      { errorCode: 'REJECTED_PII', expected: 'high' },
      { errorCode: 'CONFIRMATION_REQUIRED', expected: 'medium' },
      { errorCode: 'REASON_CODE_REQUIRED', expected: 'medium' },
      { errorCode: 'REJECTED_MISSING_EVIDENCE', expected: 'medium' },
      { errorCode: undefined, expected: 'medium' },
    ];

    severityTests.forEach(({ errorCode, expected }) => {
      it(`assigns ${expected} severity to ${errorCode || 'undefined errorCode'}`, () => {
        const mockResponse: PilotInvokeResponse = {
          ok: false,
          correlationId: `corr-severity-${errorCode}`,
          error: 'Test',
          errorCode,
        };

        const errorInfo = normalizePilotError(mockResponse);
        expect(errorInfo.context?.severity).toBe(expected);
      });
    });
  });
});
