import { useModuleRegistryStore } from '../stores/moduleRegistryStore';
import { PluginManifest, usePluginStore } from '../stores/pluginStore';
import { useStartMenuStore } from '../stores/startMenuStore';

class PluginService {
  /**
   * Fetches a plugin manifest from a remote registry.
   *
   * R2 HONESTY: Replaced mock response with real fetch.
   * Returns parsed manifest or throws on failure.
   */
  async fetchPluginManifest(url: string): Promise<PluginManifest> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Plugin manifest fetch failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    // Validate required manifest fields
    if (!data.id || !data.name || !data.version || !data.entryPoint) {
      throw new Error('Invalid plugin manifest: missing required fields (id, name, version, entryPoint)');
    }

    return {
      id: data.id,
      name: data.name,
      version: data.version,
      description: data.description ?? '',
      author: data.author ?? 'Unknown',
      entryPoint: data.entryPoint,
      icon: data.icon ?? '🧩',
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
