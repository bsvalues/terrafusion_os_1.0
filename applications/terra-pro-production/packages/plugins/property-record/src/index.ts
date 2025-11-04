import { Plugin } from "../../../../packages/core/src/plugins/types";
import { registerSchemaExtension } from "../../../../packages/core/src/api/schema";
import { registerApiExtension } from "../../../../packages/core/src/api";
import { propertyRoutes } from "./routes";
import { propertySchema, propertyResolvers } from "./schema";

/**
 * Property Record Plugin
 *
 * This plugin provides core functionality for managing property records,
 * including storage, validation, and access control.
 */
export class PropertyRecordPlugin implements Plugin {
  id = "property-record";
  name = "Property Record";
  version = "1.0.0";
  description = "Core property record management functionality";

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    console.log("Initializing Property Record plugin...");
  }

  /**
   * Register the plugin with the application
   * @param app The Express application
   */
  async register(app: any): Promise<void> {
    console.log("Registering Property Record plugin...");

    // Register GraphQL schema extension
    registerSchemaExtension("property-record", propertySchema, propertyResolvers);

    // Register REST API routes
    registerApiExtension("property-record-api", "/api/properties", propertyRoutes);
  }

  /**
   * Activate the plugin
   */
  async activate(): Promise<void> {
    console.log("Activating Property Record plugin...");
  }

  /**
   * Deactivate the plugin
   */
  async deactivate(): Promise<void> {
    console.log("Deactivating Property Record plugin...");
  }

  /**
   * Uninstall the plugin
   */
  async uninstall(): Promise<void> {
    console.log("Uninstalling Property Record plugin...");
  }
}

// Export the plugin class as the default export
export default PropertyRecordPlugin;
