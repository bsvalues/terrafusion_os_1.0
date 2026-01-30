import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';
import { usePluginStore } from '../../stores/pluginStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { pluginService } from '../pluginService';

describe('PluginService', () => {
  beforeEach(() => {
    usePluginStore.setState({ installedPlugins: [], enabledPlugins: [] });
    useModuleRegistryStore.setState({ modules: new Map(), loadStates: new Map() });
    useStartMenuStore.setState({ allApps: [] });
  });

  it('should install a plugin', async () => {
    const manifest = await pluginService.install('http://example.com/plugin.js');

    const installed = usePluginStore.getState().installedPlugins;
    expect(installed).toHaveLength(1);
    expect(installed[0].id).toBe(manifest.id);
  });

  it('should enable a plugin and register it as a module', async () => {
    // 1. Install
    const manifest = await pluginService.install('http://example.com/plugin.js');

    // 2. Enable
    pluginService.enable(manifest.id);

    // 3. Verify Plugin Store
    expect(usePluginStore.getState().enabledPlugins).toContain(manifest.id);

    // 4. Verify Module Registry
    const module = useModuleRegistryStore.getState().getModuleById(manifest.id);
    expect(module).toBeDefined();
    expect(module?.displayName).toBe('External Plugin');

    // 5. Verify Start Menu
    const apps = useStartMenuStore.getState().allApps;
    expect(apps.some((a) => a.id === manifest.id)).toBe(true);
  });

  it('should disable a plugin and remove from start menu', async () => {
    // Setup
    const manifest = await pluginService.install('http://example.com/plugin.js');
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
});
