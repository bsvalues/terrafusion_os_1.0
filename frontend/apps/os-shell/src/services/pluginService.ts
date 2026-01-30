import { useModuleRegistryStore } from '../stores/moduleRegistryStore';
import { PluginManifest, usePluginStore } from '../stores/pluginStore';
import { useStartMenuStore } from '../stores/startMenuStore';

class PluginService {
  /**
   * Simulates fetching a plugin manifest from a remote registry
   */
  async fetchPluginManifest(url: string): Promise<PluginManifest> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock response
    return {
      id: `plugin-${Date.now()}`,
      name: 'External Plugin',
      version: '1.0.0',
      description: 'A dynamically loaded plugin',
      author: 'Third Party',
      entryPoint: url,
      icon: '🧩',
    };
  }

  /**
   * Installs and registers a plugin
   */
  async install(url: string) {
    try {
      const manifest = await this.fetchPluginManifest(url);
      usePluginStore.getState().installPlugin(manifest);
      return manifest;
    } catch (error) {
      console.error('Failed to install plugin:', error);
      throw error;
    }
  }

  /**
   * Enables a plugin and registers it as a module in the OS
   */
  enable(pluginId: string) {
    const plugin = usePluginStore.getState().installedPlugins.find((p) => p.id === pluginId);
    if (!plugin) return;

    usePluginStore.getState().enablePlugin(pluginId);

    // Register as a module
    useModuleRegistryStore.getState().registerModule({
      id: plugin.id,
      displayName: plugin.name,
      description: plugin.description,
      icon: plugin.icon || '🧩',
      category: 'Plugins',
      status: 'active',
      isCore: false,
      component: 'PluginContainer', // This would be a generic container that loads the entryPoint
      config: {
        url: plugin.entryPoint,
      },
    });

    // Add to Start Menu
    useStartMenuStore.getState().setAllApps([
      ...useStartMenuStore.getState().allApps,
      {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        icon: plugin.icon || '🧩',
        category: 'Plugins',
        status: 'active',
      },
    ]);
  }

  /**
   * Disables a plugin and removes it from the OS registry
   */
  disable(pluginId: string) {
    usePluginStore.getState().disablePlugin(pluginId);

    // We currently don't have a 'unregisterModule' in moduleRegistryStore
    // But we can filter it out of the Start Menu
    const currentApps = useStartMenuStore.getState().allApps;
    useStartMenuStore.getState().setAllApps(currentApps.filter((app) => app.id !== pluginId));
  }
}

export const pluginService = new PluginService();
