/**
 * Plugin Loader
 *
 * Handles loading, unloading, and managing plugins.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { EventEmitter } from 'events';
import { PluginManifest, validateManifest } from './manifest-schema';
import { PluginVerifier, VerificationParams, VerificationResult } from './verification';

/**
 * Plugin loader configuration
 */
export interface PluginLoaderConfig {
  /**
   * Directory to load plugins from
   */
  pluginsDir: string;

  /**
   * Current core version for compatibility checking
   */
  coreVersion: string;

  /**
   * Whether to verify plugin signatures
   */
  verifySignatures?: boolean;

  /**
   * Public key for signature verification
   */
  publicKey?: string;

  /**
   * Path to cosign executable
   */
  cosignPath?: string;

  /**
   * Whether to load plugins in sandboxed environments
   */
  useSandbox?: boolean;

  /**
   * Plugin lifecycle hooks
   */
  hooks?: {
    beforeLoad?: (manifest: PluginManifest) => Promise<boolean>;
    afterLoad?: (plugin: Plugin) => Promise<void>;
    beforeUnload?: (plugin: Plugin) => Promise<boolean>;
    afterUnload?: (pluginId: string) => Promise<void>;
  };
}

/**
 * Plugin execution context
 */
export interface PluginContext {
  /**
   * Plugin ID
   */
  id: string;

  /**
   * Plugin manifest
   */
  manifest: PluginManifest;

  /**
   * Core API methods exposed to the plugin
   */
  api: Record<string, any>;

  /**
   * Plugin configuration
   */
  config: Record<string, any>;

  /**
   * Logger instance for the plugin
   */
  logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
}

/**
 * Loaded plugin instance
 */
export interface Plugin {
  /**
   * Plugin ID
   */
  id: string;

  /**
   * Plugin manifest
   */
  manifest: PluginManifest;

  /**
   * Plugin exports
   */
  exports: Record<string, any>;

  /**
   * Plugin context
   */
  context: PluginContext;

  /**
   * Plugin verification result
   */
  verification: VerificationResult;

  /**
   * Whether the plugin is enabled
   */
  enabled: boolean;
}

/**
 * Plugin loader class
 */
export class PluginLoader extends EventEmitter {
  private config: PluginLoaderConfig;
  private plugins: Map<string, Plugin> = new Map();
  private sandboxes: Map<string, vm.Context> = new Map();
  private pluginDirectory: Map<string, string> = new Map();

  constructor(config: PluginLoaderConfig) {
    super();
    this.config = config;
  }

  /**
   * Load all plugins from configured directory
   */
  public async loadAllPlugins(): Promise<Plugin[]> {
    const pluginsDir = this.config.pluginsDir;

    if (!fs.existsSync(pluginsDir)) {
      throw new Error(`Plugins directory does not exist: ${pluginsDir}`);
    }

    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    const pluginDirs = entries.filter(entry => entry.isDirectory());

    const loadPromises = pluginDirs.map(async dir => {
      const pluginPath = path.join(pluginsDir, dir.name);
      return this.loadPlugin(pluginPath);
    });

    const results = await Promise.allSettled(loadPromises);
    const loadedPlugins: Plugin[] = [];

    results.forEach((result /* , index */) => {
      if (result.status === 'fulfilled') {
        loadedPlugins.push(result.value);
      } else {
        this.emit(
          'error',
          new Error(`Failed to load plugin at ${pluginDirs[index].name}: ${result.reason}`)
        );
      }
    });

    return loadedPlugins;
  }

  /**
   * Load a plugin from a directory
   */
  public async loadPlugin(pluginPath: string): Promise<Plugin> {
    // Load and validate manifest
    const manifestPath = path.join(pluginPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Plugin manifest not found: ${manifestPath}`);
    }

    let manifestJson: any;
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifestJson = JSON.parse(manifestContent);
    } catch (error) {
      throw new Error(`Invalid plugin manifest: ${error}`);
    }

    // Validate manifest
    const validation = validateManifest(manifestJson);
    if (!validation.valid) {
      throw new Error(`Invalid plugin manifest: ${JSON.stringify(validation.errors)}`);
    }

    const manifest = manifestJson as PluginManifest;

    // Check if plugin is already loaded
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin already loaded: ${manifest.id}`);
    }

    // Verify plugin
    const verificationParams: VerificationParams = {
      coreVersion: this.config.coreVersion,
      pluginPath,
      skipSignatureCheck: !this.config.verifySignatures,
      publicKey: this.config.publicKey,
      cosignPath: this.config.cosignPath,
    };

    const verification = PluginVerifier.verify(manifest, verificationParams);

    if (!verification.verified) {
      throw new Error(`Plugin verification failed: ${verification.error}`);
    }

    // Run before load hook
    if (this.config.hooks?.beforeLoad) {
      const shouldContinue = await this.config.hooks.beforeLoad(manifest);
      if (!shouldContinue) {
        throw new Error(`Plugin load cancelled by beforeLoad hook: ${manifest.id}`);
      }
    }

    // Create plugin context
    const context = this.createPluginContext(manifest);

    // Load plugin code
    const mainPath = path.join(pluginPath, manifest.main);

    if (!fs.existsSync(mainPath)) {
      throw new Error(`Plugin main file not found: ${mainPath}`);
    }

    const pluginCode = fs.readFileSync(mainPath, 'utf-8');

    // Execute plugin code
    let pluginExports: Record<string, any>;

    if (this.config.useSandbox) {
      pluginExports = this.executeInSandbox(manifest.id, pluginCode, context);
    } else {
      pluginExports = this.executeDirectly(pluginCode, context);
    }

    // Create plugin instance
    const plugin: Plugin = {
      id: manifest.id,
      manifest,
      exports: pluginExports,
      context,
      verification,
      enabled: true,
    };

    // Store plugin
    this.plugins.set(manifest.id, plugin);
    this.pluginDirectory.set(manifest.id, pluginPath);

    // Run after load hook
    if (this.config.hooks?.afterLoad) {
      await this.config.hooks.afterLoad(plugin);
    }

    // Emit load event
    this.emit('pluginLoaded', plugin);

    return plugin;
  }

  /**
   * Unload a plugin
   */
  public async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      return false;
    }

    // Run before unload hook
    if (this.config.hooks?.beforeUnload) {
      const shouldContinue = await this.config.hooks.beforeUnload(plugin);
      if (!shouldContinue) {
        return false;
      }
    }

    // Call unload method if exists
    if (typeof plugin.exports.unload === 'function') {
      try {
        await plugin.exports.unload();
      } catch (error) {
        this.emit('error', new Error(`Error unloading plugin ${pluginId}: ${error}`));
      }
    }

    // Clean up sandbox if used
    if (this.config.useSandbox) {
      this.sandboxes.delete(pluginId);
    }

    // Remove plugin
    this.plugins.delete(pluginId);
    this.pluginDirectory.delete(pluginId);

    // Run after unload hook
    if (this.config.hooks?.afterUnload) {
      await this.config.hooks.afterUnload(pluginId);
    }

    // Emit unload event
    this.emit('pluginUnloaded', pluginId);

    return true;
  }

  /**
   * Enable a plugin
   */
  public async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);

    if (!plugin || plugin.enabled) {
      return false;
    }

    // Call enable method if exists
    if (typeof plugin.exports.enable === 'function') {
      try {
        await plugin.exports.enable();
      } catch (error) {
        this.emit('error', new Error(`Error enabling plugin ${pluginId}: ${error}`));
        return false;
      }
    }

    // Update plugin state
    plugin.enabled = true;

    // Emit enable event
    this.emit('pluginEnabled', pluginId);

    return true;
  }

  /**
   * Disable a plugin
   */
  public async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);

    if (!plugin || !plugin.enabled) {
      return false;
    }

    // Call disable method if exists
    if (typeof plugin.exports.disable === 'function') {
      try {
        await plugin.exports.disable();
      } catch (error) {
        this.emit('error', new Error(`Error disabling plugin ${pluginId}: ${error}`));
        return false;
      }
    }

    // Update plugin state
    plugin.enabled = false;

    // Emit disable event
    this.emit('pluginDisabled', pluginId);

    return true;
  }

  /**
   * Get a plugin by ID
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  public isPluginLoaded(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Create a plugin context
   */
  private createPluginContext(manifest: PluginManifest): PluginContext {
    // Create plugin API
    const api = this.createPluginApi(manifest);

    // Create plugin config
    const config = {};

    // Create logger
    const logger = {
      info: (message: string, ...args: any[]) => {
        console.info(`[Plugin:${manifest.id}] ${message}`, ...args);
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[Plugin:${manifest.id}] ${message}`, ...args);
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[Plugin:${manifest.id}] ${message}`, ...args);
      },
      debug: (message: string, ...args: any[]) => {
        console.debug(`[Plugin:${manifest.id}] ${message}`, ...args);
      },
    };

    return {
      id: manifest.id,
      manifest,
      api,
      config,
      logger,
    };
  }

  /**
   * Create the API object exposed to plugins
   */
  private createPluginApi(manifest: PluginManifest): Record<string, any> {
    // Basic API available to all plugins
    const api: Record<string, any> = {
      version: this.config.coreVersion,
      events: new EventEmitter(),
      storage: {
        get: async (key: string) => {
          // In a real implementation, this would use a plugin-specific storage
          return null;
        },
        set: async (key: string, value: any) => {
          // In a real implementation, this would use a plugin-specific storage
          return true;
        },
        remove: async (key: string) => {
          // In a real implementation, this would use a plugin-specific storage
          return true;
        },
      },
    };

    // Add capability-specific APIs
    if (manifest.capabilities.includes('map-layer')) {
      api.map = {
        addLayer: () => {}, // Placeholder
        removeLayer: () => {}, // Placeholder
      };
    }

    if (manifest.capabilities.includes('data-source')) {
      api.data = {
        registerSource: () => {}, // Placeholder
        query: async () => {}, // Placeholder
      };
    }

    // Add more capability-specific APIs as needed

    return api;
  }

  /**
   * Execute a plugin in a sandbox
   */
  private executeInSandbox(
    pluginId: string,
    code: string,
    context: PluginContext
  ): Record<string, any> {
    // Create sandbox context
    const sandbox = {
      console: {
        log: (...args: any[]) => context.logger.info(...args),
        info: (...args: any[]) => context.logger.info(...args),
        warn: (...args: any[]) => context.logger.warn(...args),
        error: (...args: any[]) => context.logger.error(...args),
        debug: (...args: any[]) => context.logger.debug(...args),
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      context,
      exports: {},
      module: {
        exports: {},
      },
      require: (id: string) => {
        // In a real implementation, this would handle require access control
        if (id === '@terrafusion/api') {
          return context.api;
        }
        throw new Error(`Module access denied: ${id}`);
      },
    };

    // Create VM context
    const vmContext = vm.createContext(sandbox);
    this.sandboxes.set(pluginId, vmContext);

    // Execute code
    const script = new vm.Script(code, { filename: `plugin:${pluginId}` });
    script.runInContext(vmContext);

    // Return exports
    return sandbox.module.exports;
  }

  /**
   * Execute a plugin directly (without sandbox)
   */
  private executeDirectly(code: string, context: PluginContext): Record<string, any> {
    // Create execution context
    const sandbox = {
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      context,
      exports: {},
      module: {
        exports: {},
      },
      require: (id: string) => {
        // In a real implementation, this would handle require access control
        if (id === '@terrafusion/api') {
          return context.api;
        }
        return require(id);
      },
    };

    // Execute code with Function constructor (less secure but simpler)
    const fn = new Function(
      'console',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'context',
      'exports',
      'module',
      'require',
      code
    );

    fn(
      sandbox.console,
      sandbox.setTimeout,
      sandbox.clearTimeout,
      sandbox.setInterval,
      sandbox.clearInterval,
      sandbox.context,
      sandbox.exports,
      sandbox.module,
      sandbox.require
    );

    // Return exports
    return sandbox.module.exports;
  }
}
