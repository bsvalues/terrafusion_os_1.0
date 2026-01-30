/**
 * IPC Types Test Suite
 * Tests for TerraFusion OS Inter-Process Communication protocol types and guards
 * 
 * @module ipc/__tests__/ipcTypes.test
 */

import { describe, it, expect } from 'vitest';
import {
  TF_PROTOCOL_VERSION,
  TF_MESSAGE_TYPES,
  isTfIpcEnvelope,
  isTfSystemLogPayload,
  isTfOpenAppPayload,
  isTfSetBadgePayload,
  isTfSystemLog,
  isTfOpenApp,
  isTfSetBadge,
  type TfIpcEnvelope,
  type TfSystemLogPayload,
  type TfOpenAppPayload,
  type TfSetBadgePayload,
} from '../ipcTypes';

describe('IPC Protocol Types', () => {
  describe('TF_PROTOCOL_VERSION', () => {
    it('should be version 1', () => {
      expect(TF_PROTOCOL_VERSION).toBe(1);
    });
  });

  describe('isTfIpcEnvelope', () => {
    it('should return true for valid envelope with required fields', () => {
      const valid: TfIpcEnvelope = {
        tf: 1,
        type: 'TF_SYSTEM_LOG',
        payload: { level: 'info', message: 'test' },
      };
      expect(isTfIpcEnvelope(valid)).toBe(true);
    });

    it('should return true for envelope with all optional fields', () => {
      const valid: TfIpcEnvelope = {
        tf: 1,
        type: 'TF_SYSTEM_LOG',
        id: 'msg-123',
        ts: Date.now(),
        source: { appId: 'terraforge' },
        payload: { level: 'info', message: 'test' },
      };
      expect(isTfIpcEnvelope(valid)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isTfIpcEnvelope(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTfIpcEnvelope(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isTfIpcEnvelope('string')).toBe(false);
      expect(isTfIpcEnvelope(123)).toBe(false);
      expect(isTfIpcEnvelope([])).toBe(false);
    });

    it('should return false for wrong protocol version', () => {
      const wrongVersion = { tf: 2, type: 'TF_SYSTEM_LOG', payload: {} };
      expect(isTfIpcEnvelope(wrongVersion)).toBe(false);
    });

    it('should return false for missing tf field', () => {
      const missingTf = { type: 'TF_SYSTEM_LOG', payload: {} };
      expect(isTfIpcEnvelope(missingTf)).toBe(false);
    });

    it('should return false for missing type field', () => {
      const missingType = { tf: 1, payload: {} };
      expect(isTfIpcEnvelope(missingType)).toBe(false);
    });

    it('should return false for non-string type', () => {
      const wrongType = { tf: 1, type: 123, payload: {} };
      expect(isTfIpcEnvelope(wrongType)).toBe(false);
    });

    it('should return false for missing payload', () => {
      const missingPayload = { tf: 1, type: 'TF_SYSTEM_LOG' };
      expect(isTfIpcEnvelope(missingPayload)).toBe(false);
    });
  });

  describe('isTfSystemLogPayload', () => {
    it('should return true for valid log payload with required fields', () => {
      const valid: TfSystemLogPayload = {
        level: 'info',
        message: 'Test message',
      };
      expect(isTfSystemLogPayload(valid)).toBe(true);
    });

    it('should return true for all log levels', () => {
      const levels = ['debug', 'info', 'warn', 'error'] as const;
      levels.forEach((level) => {
        expect(isTfSystemLogPayload({ level, message: 'test' })).toBe(true);
      });
    });

    it('should return true with optional topic', () => {
      const valid: TfSystemLogPayload = {
        level: 'info',
        message: 'Test',
        topic: 'boot',
      };
      expect(isTfSystemLogPayload(valid)).toBe(true);
    });

    it('should return true with optional data', () => {
      const valid: TfSystemLogPayload = {
        level: 'info',
        message: 'Test',
        data: { foo: 'bar', count: 42 },
      };
      expect(isTfSystemLogPayload(valid)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isTfSystemLogPayload(null)).toBe(false);
    });

    it('should return false for missing level', () => {
      expect(isTfSystemLogPayload({ message: 'test' })).toBe(false);
    });

    it('should return false for missing message', () => {
      expect(isTfSystemLogPayload({ level: 'info' })).toBe(false);
    });

    it('should return false for invalid level', () => {
      expect(isTfSystemLogPayload({ level: 'fatal', message: 'test' })).toBe(false);
    });

    it('should return false for non-string message', () => {
      expect(isTfSystemLogPayload({ level: 'info', message: 123 })).toBe(false);
    });
  });

  describe('isTfOpenAppPayload', () => {
    it('should return true for valid open app payload', () => {
      const valid: TfOpenAppPayload = {
        appId: 'terra-levy',
      };
      expect(isTfOpenAppPayload(valid)).toBe(true);
    });

    it('should return true with optional focus', () => {
      const valid: TfOpenAppPayload = {
        appId: 'terra-levy',
        focus: true,
      };
      expect(isTfOpenAppPayload(valid)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isTfOpenAppPayload(null)).toBe(false);
    });

    it('should return false for missing appId', () => {
      expect(isTfOpenAppPayload({})).toBe(false);
    });

    it('should return false for non-string appId', () => {
      expect(isTfOpenAppPayload({ appId: 123 })).toBe(false);
    });

    it('should return false for empty string appId', () => {
      expect(isTfOpenAppPayload({ appId: '' })).toBe(false);
    });
  });

  describe('isTfSetBadgePayload', () => {
    it('should return true for valid badge payload', () => {
      const valid: TfSetBadgePayload = {
        state: 'idle',
      };
      expect(isTfSetBadgePayload(valid)).toBe(true);
    });

    it('should return true for all badge states', () => {
      const states = ['idle', 'busy', 'warn', 'error'] as const;
      states.forEach((state) => {
        expect(isTfSetBadgePayload({ state })).toBe(true);
      });
    });

    it('should return true with optional label', () => {
      const valid: TfSetBadgePayload = {
        state: 'busy',
        label: 'Processing...',
      };
      expect(isTfSetBadgePayload(valid)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isTfSetBadgePayload(null)).toBe(false);
    });

    it('should return false for missing state', () => {
      expect(isTfSetBadgePayload({})).toBe(false);
    });

    it('should return false for invalid state', () => {
      expect(isTfSetBadgePayload({ state: 'loading' })).toBe(false);
    });
  });

  // ==========================================================================
  // Full Message Type Guards (envelope + payload)
  // ==========================================================================

  describe('isTfSystemLog', () => {
    it('should return true for valid complete message', () => {
      const valid = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.SYSTEM_LOG,
        payload: { level: 'info', message: 'Boot complete' },
      };
      expect(isTfSystemLog(valid)).toBe(true);
    });

    it('should return false for wrong message type', () => {
      const wrong = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.OPEN_APP,
        payload: { level: 'info', message: 'test' },
      };
      expect(isTfSystemLog(wrong)).toBe(false);
    });

    it('should return false for invalid envelope', () => {
      const invalid = {
        type: TF_MESSAGE_TYPES.SYSTEM_LOG,
        payload: { level: 'info', message: 'test' },
      };
      expect(isTfSystemLog(invalid)).toBe(false);
    });

    it('should return false for invalid payload', () => {
      const invalid = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.SYSTEM_LOG,
        payload: { level: 'fatal', message: 'test' },
      };
      expect(isTfSystemLog(invalid)).toBe(false);
    });
  });

  describe('isTfOpenApp', () => {
    it('should return true for valid complete message', () => {
      const valid = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.OPEN_APP,
        payload: { appId: 'terra-levy' },
      };
      expect(isTfOpenApp(valid)).toBe(true);
    });

    it('should return false for wrong message type', () => {
      const wrong = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.SYSTEM_LOG,
        payload: { appId: 'terra-levy' },
      };
      expect(isTfOpenApp(wrong)).toBe(false);
    });
  });

  describe('isTfSetBadge', () => {
    it('should return true for valid complete message', () => {
      const valid = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.SET_BADGE,
        payload: { state: 'busy' },
      };
      expect(isTfSetBadge(valid)).toBe(true);
    });

    it('should return false for wrong message type', () => {
      const wrong = {
        tf: TF_PROTOCOL_VERSION,
        type: TF_MESSAGE_TYPES.SYSTEM_LOG,
        payload: { state: 'busy' },
      };
      expect(isTfSetBadge(wrong)).toBe(false);
    });
  });
});
