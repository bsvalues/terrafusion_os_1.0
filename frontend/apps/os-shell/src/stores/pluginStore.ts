import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  entryPoint: string; // URL or path to the module
  icon?: string;
  permissions?: string[];
}

export interface PluginState {
  installedPlugins: PluginManifest[];
  enabledPlugins: string[]; // List of plugin IDs

  installPlugin: (manifest: PluginManifest) => void;
  uninstallPlugin: (pluginId: string) => void;
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  isPluginEnabled: (pluginId: string) => boolean;
}

export const usePluginStore = create<PluginState>()(
  devtools(
    (set, get) => ({
      installedPlugins: [],
      enabledPlugins: [],

      installPlugin: (manifest) => {
        set((state) => {
          if (state.installedPlugins.some((p) => p.id === manifest.id)) {
            return state; // Already installed
          }
          return {
            installedPlugins: [...state.installedPlugins, manifest],
          };
        });
        // Persist?
      },

      uninstallPlugin: (pluginId) => {
        set((state) => ({
          installedPlugins: state.installedPlugins.filter((p) => p.id !== pluginId),
          enabledPlugins: state.enabledPlugins.filter((id) => id !== pluginId),
        }));
        // Also need to unregister from module registry if it was active
      },

      enablePlugin: (pluginId) => {
        set((state) => {
          if (state.enabledPlugins.includes(pluginId)) return state;
          return { enabledPlugins: [...state.enabledPlugins, pluginId] };
        });
      },

      disablePlugin: (pluginId) => {
        set((state) => ({
          enabledPlugins: state.enabledPlugins.filter((id) => id !== pluginId),
        }));
      },

      isPluginEnabled: (pluginId) => {
        return get().enabledPlugins.includes(pluginId);
      },
    }),
    { name: 'TerraFusion-Plugin-Store' }
  )
);
