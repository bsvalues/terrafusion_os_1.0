/**
 * ModuleRunner Unit Tests
 *
 * Validates registry loading and module invocation.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { ModuleRunner } from '../src/module-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ModuleRunner', () => {
  const suiteRoot = path.resolve(__dirname, '../..');
  const modulesDir = path.join(suiteRoot, 'modules');
  const registryPath = path.join(suiteRoot, 'registry.json');

  describe('initialization', () => {
    it('should load registry successfully', () => {
      const runner = new ModuleRunner(modulesDir, registryPath);

      expect(runner.getRegisteredModules()).toContain('terraforge.kernel.cost');
      expect(runner.getRegisteredModules()).toContain('terraforge.kernel.valuation');
      expect(runner.getRegisteredModules()).toContain('terraforge.studio.defense');
    });

    it('should throw if registry not found', () => {
      expect(() => new ModuleRunner(modulesDir, '/nonexistent/registry.json')).toThrow(
        /Registry not found/
      );
    });
  });

  describe('getModuleDefinition', () => {
    it('should return module definition for registered module', () => {
      const runner = new ModuleRunner(modulesDir, registryPath);
      const costDef = runner.getModuleDefinition('terraforge.kernel.cost');

      expect(costDef).toBeDefined();
      expect(costDef!.name).toBe('TerraForge Cost Kernel');
      expect(costDef!.type).toBe('executable');
      expect(costDef!.actions).toContain('calculate_cost');
    });

    it('should return undefined for unregistered module', () => {
      const runner = new ModuleRunner(modulesDir, registryPath);
      const def = runner.getModuleDefinition('nonexistent.module');

      expect(def).toBeUndefined();
    });
  });

  describe('invoke', () => {
    it('should reject unregistered modules', async () => {
      const runner = new ModuleRunner(modulesDir, registryPath);

      const response = await runner.invoke('nonexistent.module', {
        action: 'test',
        payload: {},
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Module not registered');
    });

    it('should reject unsupported actions', async () => {
      const runner = new ModuleRunner(modulesDir, registryPath);

      const response = await runner.invoke('terraforge.kernel.cost', {
        action: 'unsupported_action',
        payload: {},
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('not supported');
    });

    it('should invoke stub modules successfully', async () => {
      const runner = new ModuleRunner(modulesDir, registryPath);

      // Defense studio is a stub module
      const response = await runner.invoke('terraforge.studio.defense', {
        action: 'generate_packet',
        payload: { test: 'data' },
      });

      expect(response.success).toBe(true);
      expect(response.auditEvent).toBeDefined();
      expect(response.auditEvent!.module).toBe('terraforge.studio.defense');
    });
  });
});
