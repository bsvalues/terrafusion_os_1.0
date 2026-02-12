import fs from 'fs';
import path from 'path';
import { ToolRegistry } from '../tools/toolRegistry.js';
import { BaseTool } from '../tools/types.js';

interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tools?: string[];
  commands?: string[];
  hooks?: {
    beforeCommand?: string[];
    afterCommand?: string[];
  };
}

/**
 * Plugin Manager to handle loading and activation of plugins
 */
export class PluginLoader {
  private pluginsDir: string;
  private loadedPlugins: Map<string, any> = new Map();
  private toolRegistry: ToolRegistry;

  constructor(userHomeDir: string, toolRegistry: ToolRegistry) {
    this.pluginsDir = path.join(userHomeDir, '.codeagent', 'plugins');
    this.toolRegistry = toolRegistry;
  }

  /**
   * Load all available plugins
   */
  async loadPlugins(): Promise<string[]> {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
      return [];
    }

    const pluginDirs = fs
      .readdirSync(this.pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const loadedPlugins: string[] = [];

    for (const pluginDir of pluginDirs) {
      const pluginPath = path.join(this.pluginsDir, pluginDir);
      const manifest = this.loadManifest(pluginPath);

      if (!manifest) {
        console.warn(`Invalid plugin at ${pluginPath}: missing or invalid manifest.json`);
        continue;
      }

      try {
        await this.loadPlugin(pluginPath, manifest);
        loadedPlugins.push(manifest.name);
      } catch (error) {
        console.error(`Error loading plugin ${manifest.name}:`, error);
      }
    }

    return loadedPlugins;
  }

  /**
   * Load a specific plugin
   */
  private async loadPlugin(pluginPath: string, manifest: PluginManifest): Promise<void> {
    // Load and register tools
    if (manifest.tools && manifest.tools.length > 0) {
      for (const toolFile of manifest.tools) {
        try {
          const toolPath = path.join(pluginPath, toolFile);
          const toolModule = await import(toolPath);

          // Register each exported tool that extends BaseTool
          for (const exportKey of Object.keys(toolModule)) {
            const exported = toolModule[exportKey];

            // Check if the exported value is a class that extends BaseTool
            if (typeof exported === 'function' && exported.prototype instanceof BaseTool) {
              const tool = new exported();
              this.toolRegistry.registerTool(tool);
              console.log(`Registered tool: ${tool.name} from plugin ${manifest.name}`);
            }
          }
        } catch (error) {
          console.error(`Error loading tool ${toolFile} from plugin ${manifest.name}:`, error);
        }
      }
    }

    // Store the loaded plugin
    this.loadedPlugins.set(manifest.name, {
      manifest,
      path: pluginPath,
    });
  }

  /**
   * Load the plugin manifest
   */
  private loadManifest(pluginPath: string): PluginManifest | null {
    const manifestPath = path.join(pluginPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      return JSON.parse(manifestContent);
    } catch (error) {
      console.error(`Error parsing manifest for plugin at ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Get hook implementations for a specific hook point
   */
  getHooks(hookPoint: 'beforeCommand' | 'afterCommand'): Array<{
    pluginName: string;
    hookFile: string;
  }> {
    const hooks: Array<{
      pluginName: string;
      hookFile: string;
    }> = [];

    for (const [pluginName, plugin] of this.loadedPlugins.entries()) {
      const manifest = plugin.manifest as PluginManifest;

      if (manifest.hooks && manifest.hooks[hookPoint] && Array.isArray(manifest.hooks[hookPoint])) {
        for (const hookFile of manifest.hooks[hookPoint]) {
          hooks.push({
            pluginName,
            hookFile: path.join(plugin.path, hookFile),
          });
        }
      }
    }

    return hooks;
  }

  /**
   * Execute hooks for a specific hook point
   */
  async executeHooks(hookPoint: 'beforeCommand' | 'afterCommand', context: any): Promise<void> {
    const hooks = this.getHooks(hookPoint);

    for (const hook of hooks) {
      try {
        const hookModule = await import(hook.hookFile);

        if (typeof hookModule.default === 'function') {
          await hookModule.default(context);
        } else if (typeof hookModule.execute === 'function') {
          await hookModule.execute(context);
        }
      } catch (error) {
        console.error(`Error executing ${hookPoint} hook from plugin ${hook.pluginName}:`, error);
      }
    }
  }

  /**
   * Get information about loaded plugins
   */
  getLoadedPlugins(): Array<{
    name: string;
    version: string;
    description: string;
    path: string;
  }> {
    return Array.from(this.loadedPlugins.entries()).map(([name, plugin]) => ({
      name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      path: plugin.path,
    }));
  }
}
