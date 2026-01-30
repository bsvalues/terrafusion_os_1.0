/**
 * IPC Listener Test Suite
 * Tests for Shell IPC message receiver and router
 *
 * @module ipc/__tests__/ipcListener.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getModuleIdByOrigin, isOriginAllowed } from '../ipcOrigin';
import { routeIpcMessage, type IpcRouterDeps } from '../ipcRouter';
import { TF_MESSAGE_TYPES, TF_PROTOCOL_VERSION } from '../ipcTypes';

// ============================================================================
// Origin Validation Tests
// ============================================================================

describe('IPC Origin Validation', () => {
  describe('isOriginAllowed', () => {
    const allowedOrigins = [
      'http://localhost:3007',
      'http://localhost:4201',
      'http://localhost:5173',
    ];

    it('should return true for exact match', () => {
      expect(isOriginAllowed('http://localhost:3007', allowedOrigins)).toBe(true);
      expect(isOriginAllowed('http://localhost:4201', allowedOrigins)).toBe(true);
    });

    it('should return false for non-allowed origin', () => {
      expect(isOriginAllowed('http://localhost:9999', allowedOrigins)).toBe(false);
      expect(isOriginAllowed('http://evil.com', allowedOrigins)).toBe(false);
    });

    it('should return false for similar but different origins', () => {
      // Different port
      expect(isOriginAllowed('http://localhost:3008', allowedOrigins)).toBe(false);
      // Different protocol
      expect(isOriginAllowed('https://localhost:3007', allowedOrigins)).toBe(false);
    });

    it('should return false for empty origin', () => {
      expect(isOriginAllowed('', allowedOrigins)).toBe(false);
    });

    it('should return false for null origin', () => {
      expect(isOriginAllowed('null', allowedOrigins)).toBe(false);
    });

    it('should return false when allowlist is empty', () => {
      expect(isOriginAllowed('http://localhost:3007', [])).toBe(false);
    });
  });

  describe('getModuleIdByOrigin', () => {
    const moduleOriginMap: Record<string, string> = {
      'http://localhost:3007': 'terra-dossier',
      'http://localhost:4201': 'terraforge',
    };

    it('should return module ID for known origin', () => {
      expect(getModuleIdByOrigin('http://localhost:3007', moduleOriginMap)).toBe('terra-dossier');
      expect(getModuleIdByOrigin('http://localhost:4201', moduleOriginMap)).toBe('terraforge');
    });

    it('should return null for unknown origin', () => {
      expect(getModuleIdByOrigin('http://localhost:9999', moduleOriginMap)).toBeNull();
      expect(getModuleIdByOrigin('http://evil.com', moduleOriginMap)).toBeNull();
    });
  });
});

// ============================================================================
// IPC Router Tests
// ============================================================================

describe('IPC Router', () => {
  let mockDeps: IpcRouterDeps;

  beforeEach(() => {
    mockDeps = {
      pushTelemetry: vi.fn(),
      openApp: vi.fn(),
      setAppBadge: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('routeIpcMessage', () => {
    it('should reject messages without tf field', () => {
      const msg = { type: 'TF_SYSTEM_LOG', payload: {} };
      const result = routeIpcMessage(msg, 'terraforge', mockDeps);

      expect(result.routed).toBe(false);
      expect(result.reason).toBe('invalid_envelope');
      expect(mockDeps.pushTelemetry).not.toHaveBeenCalled();
    });

    it('should reject messages with wrong protocol version', () => {
      const msg = { tf: 2, type: 'TF_SYSTEM_LOG', payload: {} };
      const result = routeIpcMessage(msg, 'terraforge', mockDeps);

      expect(result.routed).toBe(false);
      expect(result.reason).toBe('invalid_envelope');
    });

    it('should reject unknown message types', () => {
      const msg = { tf: TF_PROTOCOL_VERSION, type: 'TF_UNKNOWN', payload: {} };
      const result = routeIpcMessage(msg, 'terraforge', mockDeps);

      expect(result.routed).toBe(false);
      expect(result.reason).toBe('unknown_type');
    });

    describe('TF_SYSTEM_LOG', () => {
      it('should route valid log message to pushTelemetry', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.SYSTEM_LOG,
          payload: {
            level: 'info',
            message: 'Test message',
            topic: 'boot',
          },
        };

        const result = routeIpcMessage(msg, 'terraforge', mockDeps);

        expect(result.routed).toBe(true);
        expect(mockDeps.pushTelemetry).toHaveBeenCalledTimes(1);

        const call = (mockDeps.pushTelemetry as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(call.agent).toBe('terraforge');
        expect(call.level).toBe('Info');
        expect(call.message).toBe('Test message');
        expect(call.topic).toBe('boot');
      });

      it('should reject log message with invalid payload', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.SYSTEM_LOG,
          payload: { level: 'fatal', message: 'test' }, // invalid level
        };

        const result = routeIpcMessage(msg, 'terraforge', mockDeps);

        expect(result.routed).toBe(false);
        expect(result.reason).toBe('invalid_payload');
        expect(mockDeps.pushTelemetry).not.toHaveBeenCalled();
      });

      it('should use verified appId, not sender-provided', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.SYSTEM_LOG,
          source: { appId: 'malicious-app' }, // Should be ignored
          payload: { level: 'info', message: 'test' },
        };

        routeIpcMessage(msg, 'terraforge', mockDeps);

        const call = (mockDeps.pushTelemetry as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(call.agent).toBe('terraforge'); // Uses verified appId
      });
    });

    describe('TF_OPEN_APP', () => {
      it('should route valid open app message to openApp', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.OPEN_APP,
          payload: { appId: 'terra-levy', focus: true },
        };

        const result = routeIpcMessage(msg, 'terraforge', mockDeps);

        expect(result.routed).toBe(true);
        expect(mockDeps.openApp).toHaveBeenCalledWith('terra-levy');
      });

      it('should reject open app with invalid payload', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.OPEN_APP,
          payload: { appId: '' }, // empty appId
        };

        const result = routeIpcMessage(msg, 'terraforge', mockDeps);

        expect(result.routed).toBe(false);
        expect(result.reason).toBe('invalid_payload');
        expect(mockDeps.openApp).not.toHaveBeenCalled();
      });
    });

    describe('TF_SET_BADGE', () => {
      it('should route valid badge message to setAppBadge', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.SET_BADGE,
          payload: { state: 'busy', label: 'Processing' },
        };

        const result = routeIpcMessage(msg, 'terraforge', mockDeps);

        expect(result.routed).toBe(true);
        expect(mockDeps.setAppBadge).toHaveBeenCalledWith('terraforge', {
          state: 'busy',
          label: 'Processing',
        });
      });

      it('should handle missing setAppBadge gracefully', () => {
        const depsWithoutBadge: IpcRouterDeps = {
          pushTelemetry: vi.fn(),
          openApp: vi.fn(),
          // setAppBadge is optional and not provided
        };

        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.SET_BADGE,
          payload: { state: 'busy' },
        };

        const result = routeIpcMessage(msg, 'terraforge', depsWithoutBadge);

        expect(result.routed).toBe(true);
        expect(result.reason).toBe('no_handler');
      });

      it('should reject badge with invalid payload', () => {
        const msg = {
          tf: TF_PROTOCOL_VERSION,
          type: TF_MESSAGE_TYPES.SET_BADGE,
          payload: { state: 'loading' }, // invalid state
        };

        const result = routeIpcMessage(msg, 'terraforge', mockDeps);

        expect(result.routed).toBe(false);
        expect(result.reason).toBe('invalid_payload');
      });
    });
  });
});
