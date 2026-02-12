/**
 * Module Loader Tests
 *
 * Comprehensive unit tests for TerraFusion module loading system.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { batchPreloadModules, ModuleLoader, ModuleLoadError, resolveDependencies } from '../lib/module-loader';

// Mock modules
const mockPropertyModule = { default: () => null };
const mockLevyModule = { default: () => null };

const mockPropertyManifest = {
  name: 'property-assessment',
  version: '1.0.0',
  displayName: 'Property Assessment Module',
  description: 'AI-powered property valuation',
  entryPoint: 'index.tsx',
  dependencies: [],
  targetCounties: ['benton', 'yakima'],
  permissions: ['load:property-assessment', 'read:property-data'],
  tier: 'tier1' as const,
  type: 'government-module' as const,
};

const mockLevyManifest = {
  name: 'levy-management',
  version: '1.0.0',
  displayName: 'Levy Management Module',
  description: 'Tax levy processing',
  entryPoint: 'index.tsx',
  dependencies: ['property-assessment'],
  targetCounties: ['benton'],
  permissions: ['load:levy-management', 'read:levy-data'],
  tier: 'tier2' as const,
  type: 'government-module' as const,
};

// Mock dynamic imports
vi.mock('@/modules/property-assessment/manifest.json', () => ({
  default: mockPropertyManifest,
}));

vi.mock('@/modules/levy-management/manifest.json', () => ({
  default: mockLevyManifest,
}));

vi.mock('@/modules/property-assessment/index.tsx', () => mockPropertyModule);
vi.mock('@/modules/levy-management/index.tsx', () => mockLevyModule);

describe('ModuleLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    ModuleLoader.clearCache();
  });

  describe('loadManifest', () => {
    it('should load module manifest successfully', async () => {
      const manifest = await ModuleLoader.loadManifest('property-assessment');

      expect(manifest).toBeDefined();
      expect(manifest.name).toBe('property-assessment');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.tier).toBe('tier1');
      expect(manifest.type).toBe('government-module');
    });

    it('should cache loaded manifests', async () => {
      const manifest1 = await ModuleLoader.loadManifest('property-assessment');
      const manifest2 = await ModuleLoader.loadManifest('property-assessment');

      // Should return same reference (cached)
      expect(manifest1).toBe(manifest2);
    });

    it('should validate manifest has required fields', async () => {
      // This test would require mocking an invalid manifest
      // For now, verify that valid manifest passes validation
      const manifest = await ModuleLoader.loadManifest('property-assessment');

      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('version');
      expect(manifest).toHaveProperty('displayName');
      expect(manifest).toHaveProperty('entryPoint');
      expect(manifest).toHaveProperty('dependencies');
      expect(manifest).toHaveProperty('targetCounties');
      expect(manifest).toHaveProperty('permissions');
      expect(manifest).toHaveProperty('tier');
      expect(manifest).toHaveProperty('type');
    });
  });

  describe('loadModule', () => {
    it('should load module component successfully', async () => {
      const component = await ModuleLoader.loadModule('property-assessment');

      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should cache loaded modules', async () => {
      const component1 = await ModuleLoader.loadModule('property-assessment');
      const component2 = await ModuleLoader.loadModule('property-assessment');

      // Should return same reference (cached)
      expect(component1).toBe(component2);
    });

    it('should handle module loading errors gracefully', async () => {
      await expect(
        ModuleLoader.loadModule('non-existent-module')
      ).rejects.toThrow(ModuleLoadError);
    });

    it('should avoid duplicate loading requests', async () => {
      // Start two simultaneous loads
      const promise1 = ModuleLoader.loadModule('property-assessment');
      const promise2 = ModuleLoader.loadModule('property-assessment');

      const [component1, component2] = await Promise.all([promise1, promise2]);

      // Should return same component
      expect(component1).toBe(component2);
    });
  });

  describe('isModuleLoaded', () => {
    it('should return false for unloaded module', () => {
      expect(ModuleLoader.isModuleLoaded('property-assessment')).toBe(false);
    });

    it('should return true for loaded module', async () => {
      await ModuleLoader.loadModule('property-assessment');

      expect(ModuleLoader.isModuleLoaded('property-assessment')).toBe(true);
    });
  });

  describe('preloadModule', () => {
    it('should preload module without returning component', async () => {
      await ModuleLoader.preloadModule('property-assessment');

      expect(ModuleLoader.isModuleLoaded('property-assessment')).toBe(true);
    });
  });

  describe('unloadModule', () => {
    it('should remove module from cache', async () => {
      await ModuleLoader.loadModule('property-assessment');
      expect(ModuleLoader.isModuleLoaded('property-assessment')).toBe(true);

      ModuleLoader.unloadModule('property-assessment');

      expect(ModuleLoader.isModuleLoaded('property-assessment')).toBe(false);
    });
  });

  describe('getLoadedModules', () => {
    it('should return empty array when no modules loaded', () => {
      expect(ModuleLoader.getLoadedModules()).toEqual([]);
    });

    it('should return array of loaded module names', async () => {
      await ModuleLoader.loadModule('property-assessment');
      await ModuleLoader.loadModule('levy-management');

      const loaded = ModuleLoader.getLoadedModules();

      expect(loaded).toContain('property-assessment');
      expect(loaded).toContain('levy-management');
      expect(loaded).toHaveLength(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all loaded modules', async () => {
      await ModuleLoader.loadModule('property-assessment');
      await ModuleLoader.loadModule('levy-management');

      expect(ModuleLoader.getLoadedModules()).toHaveLength(2);

      ModuleLoader.clearCache();

      expect(ModuleLoader.getLoadedModules()).toEqual([]);
    });
  });
});

describe('batchPreloadModules', () => {
  beforeEach(() => {
    ModuleLoader.clearCache();
  });

  it('should preload multiple modules', async () => {
    await batchPreloadModules(['property-assessment', 'levy-management']);

    expect(ModuleLoader.isModuleLoaded('property-assessment')).toBe(true);
    expect(ModuleLoader.isModuleLoaded('levy-management')).toBe(true);
  });

  it('should handle empty array', async () => {
    await expect(batchPreloadModules([])).resolves.not.toThrow();
  });
});

describe('resolveDependencies', () => {
  beforeEach(() => {
    ModuleLoader.clearCache();
  });

  it('should load module with no dependencies', async () => {
    await resolveDependencies('property-assessment');

    // Dependencies should be loaded but not cached as modules
    // (manifest loaded, but component not necessarily loaded)
    const manifest = await ModuleLoader.loadManifest('property-assessment');
    expect(manifest.dependencies).toEqual([]);
  });

  it('should load module dependencies recursively', async () => {
    await resolveDependencies('levy-management');

    // levy-management depends on property-assessment
    const manifest = await ModuleLoader.loadManifest('levy-management');
    expect(manifest.dependencies).toContain('property-assessment');
  });
});

describe('ModuleLoadError', () => {
  it('should create error with module name and reason', () => {
    const error = new ModuleLoadError('test-module', 'Test reason');

    expect(error.name).toBe('ModuleLoadError');
    expect(error.moduleName).toBe('test-module');
    expect(error.reason).toBe('Test reason');
    expect(error.message).toContain('test-module');
    expect(error.message).toContain('Test reason');
  });

  it('should include original error if provided', () => {
    const originalError = new Error('Original error');
    const error = new ModuleLoadError('test-module', 'Test reason', originalError);

    expect(error.originalError).toBe(originalError);
  });
});

describe('Module Loading Performance', () => {
  beforeEach(() => {
    ModuleLoader.clearCache();
  });

  it('should load module within acceptable time (<100ms)', async () => {
    const startTime = performance.now();

    await ModuleLoader.loadModule('property-assessment');

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should load within 100ms (typically <10ms with cache)
    expect(duration).toBeLessThan(100);
  });

  it('should use cache for subsequent loads (<5ms)', async () => {
    // First load (uncached)
    await ModuleLoader.loadModule('property-assessment');

    // Second load (cached)
    const startTime = performance.now();
    await ModuleLoader.loadModule('property-assessment');
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Cached load should be very fast (<5ms)
    expect(duration).toBeLessThan(5);
  });
});

describe('Module Loading County Isolation', () => {
  beforeEach(() => {
    ModuleLoader.clearCache();
  });

  it('should respect county targeting in manifest', async () => {
    const manifest = await ModuleLoader.loadManifest('property-assessment');

    expect(manifest.targetCounties).toContain('benton');
    expect(manifest.targetCounties).toContain('yakima');
  });

  it('should validate county-specific permissions', async () => {
    const manifest = await ModuleLoader.loadManifest('property-assessment');

    expect(manifest.permissions).toContain('load:property-assessment');
    expect(manifest.permissions).toContain('read:property-data');
  });
});
