/**
 * TerraFusion IPC Bridge Tests
 * 
 * @module ipc/__tests__/ipcBridge.test
 * @see SUCCESS CRITERIA SC-6.2: Shell Receiver
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getModuleByOrigin } from '../ipcBridge';

// Mock the generated modules
vi.mock('../../config/generatedModules', () => ({
  GENERATED_MODULES: [
    {
      id: 'terraforge',
      displayName: 'TerraForge',
      intent: 'gen2',
      entry: { type: 'url', url: 'http://localhost:4201/' },
    },
    {
      id: 'terra-dossier',
      displayName: 'TerraDossier',
      intent: 'gen2',
      entry: { type: 'url', url: 'http://localhost:3007/' },
    },
    {
      id: 'terra-levy',
      displayName: 'Terra Levy',
      intent: 'legacy',
      entry: { type: 'url', url: 'http://localhost:5177/' },
    },
    {
      id: 'terra-flow',
      displayName: 'Terra Flow',
      intent: 'legacy',
      entry: { type: 'route', route: '/flow' },
    },
  ],
}));

describe('ipcBridge', () => {
  describe('getModuleByOrigin', () => {
    it('should return module for exact origin match', () => {
      const result = getModuleByOrigin('http://localhost:4201');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('terraforge');
    });

    it('should match origin with trailing slash in entry URL', () => {
      // Entry URL is http://localhost:4201/ but origin is http://localhost:4201
      const result = getModuleByOrigin('http://localhost:4201');
      expect(result?.id).toBe('terraforge');
    });

    it('should return null for unknown origin', () => {
      const result = getModuleByOrigin('http://localhost:9999');
      expect(result).toBeNull();
    });

    it('should return null for non-localhost origins', () => {
      const result = getModuleByOrigin('https://malicious-site.com');
      expect(result).toBeNull();
    });

    it('should return null for empty origin', () => {
      const result = getModuleByOrigin('');
      expect(result).toBeNull();
    });

    it('should return null for null origin', () => {
      const result = getModuleByOrigin('null');
      expect(result).toBeNull();
    });

    it('should handle modules with route entries (no URL)', () => {
      // terra-flow uses route entry, not URL
      const result = getModuleByOrigin('http://localhost:5183');
      expect(result).toBeNull();
    });

    it('should find TerraDossier by origin', () => {
      const result = getModuleByOrigin('http://localhost:3007');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('terra-dossier');
    });

    it('should find legacy modules too', () => {
      const result = getModuleByOrigin('http://localhost:5177');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('terra-levy');
    });
  });
});
