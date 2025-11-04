export * from "./types";
export * from "./registry";
export * from "./extension-point";

import { PluginRegistry } from "./registry";
import { ExtensionPointManager } from "./extension-point";
import { ExtensionPointType } from "./types";

/**
 * Initialize the plugin system
 */
export async function initializePluginSystem(): Promise<void> {
  console.log("Initializing plugin system...");

  // Initialize the plugin registry
  const pluginRegistry = PluginRegistry.getInstance();
  await pluginRegistry.initialize();

  // Initialize the extension point manager
  const extensionPointManager = ExtensionPointManager.getInstance();

  // Register core extension points
  extensionPointManager.createExtensionPoint(
    "core.api",
    ExtensionPointType.API,
    "Core API extension point for registering API routes"
  );

  extensionPointManager.createExtensionPoint(
    "core.ui.dashboard",
    ExtensionPointType.UI,
    "Dashboard UI extension point for adding dashboard widgets"
  );

  extensionPointManager.createExtensionPoint(
    "core.ui.navigation",
    ExtensionPointType.UI,
    "Navigation UI extension point for adding navigation items"
  );

  extensionPointManager.createExtensionPoint(
    "core.workflow",
    ExtensionPointType.WORKFLOW,
    "Workflow extension point for customizing business processes"
  );

  extensionPointManager.createExtensionPoint(
    "core.schema",
    ExtensionPointType.SCHEMA,
    "Schema extension point for extending data models"
  );

  console.log("Plugin system initialized");
}
