import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';
import { usePluginStore } from '../../stores/pluginStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { pluginService } from '../pluginService';

// Mock manifest that would come from a real plugin registry
const MOCK_MANIFEST = {
  id: 'test-plugin-1',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test Author',
  entryPoint: 'http://example.com/plugin.js',
  icon: '🧪',
};

describe('PluginService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    usePluginStore.setState({ installedPlugins: [], enabledPlugins: [] });
    useModuleRegistryStore.setState({ modules: new Map(), loadStates: new Map() });
    useStartMenuStore.setState({ allApps: [] });

    // Mock fetch to return a valid manifest
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_MANIFEST),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should install a plugin', async () => {
    const manifest = await pluginService.install('http://example.com/plugin.json');

    const installed = usePluginStore.getState().installedPlugins;
    expect(installed).toHaveLength(1);
    expect(installed[0].id).toBe(manifest.id);
  });

  it('should enable a plugin and register it as a module', async () => {
    // 1. Install
    const manifest = await pluginService.install('http://example.com/plugin.json');

    // 2. Enable
    pluginService.enable(manifest.id);

    // 3. Verify Plugin Store
    expect(usePluginStore.getState().enabledPlugins).toContain(manifest.id);

    // 4. Verify Module Registry
    const module = useModuleRegistryStore.getState().getModuleById(manifest.id);
    expect(module).toBeDefined();
    expect(module?.displayName).toBe('Test Plugin');

    // 5. Verify Start Menu
    const apps = useStartMenuStore.getState().allApps;
    expect(apps.some((a) => a.id === manifest.id)).toBe(true);
  });

  it('should disable a plugin and remove from start menu', async () => {
    // Setup
    const manifest = await pluginService.install('http://example.com/plugin.json');
    pluginService.enable(manifest.id);

    // Verify it's there
    expect(useStartMenuStore.getState().allApps).toHaveLength(1);

    // Disable
    pluginService.disable(manifest.id);

    // Verify Plugin Store
    expect(usePluginStore.getState().enabledPlugins).not.toContain(manifest.id);

    // Verify Start Menu (should be gone)
    expect(useStartMenuStore.getState().allApps).toHaveLength(0);
  });

  it('should throw on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(pluginService.install('http://example.com/missing.json'))
      .rejects.toThrow('Plugin manifest fetch failed');
  });

  it('should throw on invalid manifest', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: 'incomplete' }), // Missing id, version, entryPoint
    });

    await expect(pluginService.install('http://example.com/bad.json'))
      .rejects.toThrow('Invalid plugin manifest');
  });
});
