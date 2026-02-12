import { db } from "../database";
import { plugins as pluginsTable, Plugin as PluginModel } from "../../../../shared/schema";
import { Plugin, PluginConfig } from "./types";
import { eq } from "drizzle-orm";

/**
 * Plugin Registry
 *
 * Manages the installation, activation, and uninstallation of plugins.
 * Provides methods to query plugin information and status.
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, Plugin> = new Map();
  private pluginConfigs: Map<string, PluginConfig> = new Map();

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Initialize the plugin registry
   */
  public async initialize(): Promise<void> {
    await this.loadPlugins();
  }

  /**
   * Load all registered plugins from the database
   */
  private async loadPlugins(): Promise<void> {
    try {
      const dbPlugins = await db.select().from(pluginsTable);

      for (const dbPlugin of dbPlugins) {
        // Only load active plugins
        if (dbPlugin.status === "active") {
          await this.loadPlugin(dbPlugin);
        }

        // Store plugin configuration
        this.pluginConfigs.set(dbPlugin.name, {
          id: dbPlugin.name,
          name: dbPlugin.name,
          version: dbPlugin.version,
          description: dbPlugin.description || undefined,
          entryPoint: dbPlugin.entrypoint,
          dependencies: (dbPlugin.dependencies as string[]) || [],
          settings: (dbPlugin.config as Record<string, any>) || {},
        });
      }

      console.log(`Loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error("Failed to load plugins from database:", error);
      throw error;
    }
  }

  /**
   * Load a plugin from the database
   * @param dbPlugin Plugin data from the database
   */
  private async loadPlugin(dbPlugin: PluginModel): Promise<void> {
    try {
      // In a production environment, this would dynamically import the plugin
      // For now, we'll log that we're loading the plugin
      console.log(`Loading plugin: ${dbPlugin.name} (${dbPlugin.version})`);

      // In reality, this would be:
      // const pluginModule = await import(dbPlugin.entrypoint);
      // const plugin = new pluginModule.default() as Plugin;

      // For this implementation, we'll just create a mock plugin
      const plugin: Plugin = {
        id: dbPlugin.name,
        name: dbPlugin.name,
        version: dbPlugin.version,
        description: dbPlugin.description || "",
        initialize: async () => console.log(`Initializing plugin: ${dbPlugin.name}`),
        register: async (app) => console.log(`Registering plugin: ${dbPlugin.name}`),
        activate: async () => console.log(`Activating plugin: ${dbPlugin.name}`),
        deactivate: async () => console.log(`Deactivating plugin: ${dbPlugin.name}`),
        uninstall: async () => console.log(`Uninstalling plugin: ${dbPlugin.name}`),
      };

      this.plugins.set(plugin.id, plugin);
    } catch (error) {
      console.error(`Failed to load plugin ${dbPlugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Register a new plugin
   * @param pluginConfig Plugin configuration
   */
  public async registerPlugin(pluginConfig: PluginConfig): Promise<string> {
    try {
      // Check if the plugin already exists
      const existingPlugin = await db
        .select()
        .from(pluginsTable)
        .where(eq(pluginsTable.name, pluginConfig.id));

      if (existingPlugin.length > 0) {
        throw new Error(`Plugin ${pluginConfig.id} already exists`);
      }

      // Insert the plugin into the database
      const [newPlugin] = await db
        .insert(pluginsTable)
        .values({
          name: pluginConfig.id,
          version: pluginConfig.version,
          description: pluginConfig.description || null,
          entrypoint: pluginConfig.entryPoint,
          status: "inactive",
          config: pluginConfig.settings || {},
          dependencies: pluginConfig.dependencies || [],
        })
        .returning();

      // Store plugin configuration
      this.pluginConfigs.set(pluginConfig.id, pluginConfig);

      return newPlugin.id.toString();
    } catch (error) {
      console.error(`Failed to register plugin ${pluginConfig.id}:`, error);
      throw error;
    }
  }

  /**
   * Activate a plugin
   * @param pluginId Plugin ID
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    try {
      // Get the plugin from the database
      const [dbPlugin] = await db
        .select()
        .from(pluginsTable)
        .where(eq(pluginsTable.name, pluginId));

      if (!dbPlugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      // Check if the plugin is already active
      if (dbPlugin.status === "active") {
        console.log(`Plugin ${pluginId} is already active`);
        return;
      }

      // Load the plugin
      await this.loadPlugin(dbPlugin);

      // Get the plugin
      const plugin = this.plugins.get(pluginId);

      if (!plugin) {
        throw new Error(`Failed to load plugin ${pluginId}`);
      }

      // Initialize and activate the plugin
      await plugin.initialize();
      await plugin.activate();

      // Update the plugin status in the database
      await db
        .update(pluginsTable)
        .set({ status: "active" })
        .where(eq(pluginsTable.name, pluginId));

      console.log(`Activated plugin: ${pluginId}`);
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   * @param pluginId Plugin ID
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    try {
      // Get the plugin
      const plugin = this.plugins.get(pluginId);

      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found or not loaded`);
      }

      // Deactivate the plugin
      await plugin.deactivate();

      // Remove the plugin from memory
      this.plugins.delete(pluginId);

      // Update the plugin status in the database
      await db
        .update(pluginsTable)
        .set({ status: "inactive" })
        .where(eq(pluginsTable.name, pluginId));

      console.log(`Deactivated plugin: ${pluginId}`);
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   * @param pluginId Plugin ID
   */
  public async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      // Get the plugin
      const plugin = this.plugins.get(pluginId);

      // If the plugin is loaded, deactivate and uninstall it
      if (plugin) {
        await plugin.deactivate();
        await plugin.uninstall();
        this.plugins.delete(pluginId);
      }

      // Remove the plugin configuration
      this.pluginConfigs.delete(pluginId);

      // Delete the plugin from the database
      await db.delete(pluginsTable).where(eq(pluginsTable.name, pluginId));

      console.log(`Uninstalled plugin: ${pluginId}`);
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  public getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a plugin by ID
   * @param pluginId Plugin ID
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugin configurations
   */
  public getPluginConfigs(): PluginConfig[] {
    return Array.from(this.pluginConfigs.values());
  }

  /**
   * Get a plugin configuration by ID
   * @param pluginId Plugin ID
   */
  public getPluginConfig(pluginId: string): PluginConfig | undefined {
    return this.pluginConfigs.get(pluginId);
  }
}
