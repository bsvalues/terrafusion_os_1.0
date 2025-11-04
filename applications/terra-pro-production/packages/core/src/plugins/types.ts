import { Request, Response, NextFunction, Router } from "express";

/**
 * Base plugin interface that all plugins must implement
 */
export interface Plugin {
  /**
   * Unique identifier for the plugin
   */
  id: string;

  /**
   * Name of the plugin
   */
  name: string;

  /**
   * Version of the plugin
   */
  version: string;

  /**
   * Description of the plugin
   */
  description: string;

  /**
   * Initialize the plugin
   */
  initialize(): Promise<void>;

  /**
   * Register the plugin with the application
   * @param app The Express application
   */
  register(app: any): Promise<void>;

  /**
   * Activate the plugin
   */
  activate(): Promise<void>;

  /**
   * Deactivate the plugin
   */
  deactivate(): Promise<void>;

  /**
   * Uninstall the plugin
   */
  uninstall(): Promise<void>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /**
   * Called before the plugin is initialized
   */
  beforeInitialize?: () => Promise<void>;

  /**
   * Called after the plugin is initialized
   */
  afterInitialize?: () => Promise<void>;

  /**
   * Called before the plugin is activated
   */
  beforeActivate?: () => Promise<void>;

  /**
   * Called after the plugin is activated
   */
  afterActivate?: () => Promise<void>;

  /**
   * Called before the plugin is deactivated
   */
  beforeDeactivate?: () => Promise<void>;

  /**
   * Called after the plugin is deactivated
   */
  afterDeactivate?: () => Promise<void>;

  /**
   * Called before the plugin is uninstalled
   */
  beforeUninstall?: () => Promise<void>;

  /**
   * Called after the plugin is uninstalled
   */
  afterUninstall?: () => Promise<void>;
}

/**
 * Extension point types
 */
export enum ExtensionPointType {
  API = "api",
  UI = "ui",
  WORKFLOW = "workflow",
  SCHEMA = "schema",
  VALIDATOR = "validator",
  FORMATTER = "formatter",
  PARSER = "parser",
  EXPORTER = "exporter",
  IMPORTER = "importer",
  REPORT = "report",
  DASHBOARD = "dashboard",
  SERVICE = "service",
  MIDDLEWARE = "middleware",
}

/**
 * Extension point interface
 */
export interface ExtensionPoint<T = any> {
  /**
   * Unique identifier for the extension point
   */
  id: string;

  /**
   * Type of extension point
   */
  type: ExtensionPointType;

  /**
   * Description of the extension point
   */
  description: string;

  /**
   * Register an extension for this extension point
   * @param extension The extension to register
   */
  register(extension: T): void;

  /**
   * Get all registered extensions for this extension point
   */
  getExtensions(): T[];

  /**
   * Get an extension by ID
   * @param id The ID of the extension to get
   */
  getExtension(id: string): T | undefined;

  /**
   * Remove an extension by ID
   * @param id The ID of the extension to remove
   */
  removeExtension(id: string): boolean;
}

/**
 * API extension interface
 */
export interface ApiExtension {
  /**
   * Unique identifier for the extension
   */
  id: string;

  /**
   * Router to register with the API
   */
  router: Router;

  /**
   * Base path for the router
   */
  basePath: string;

  /**
   * Middleware to apply to all routes
   */
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

/**
 * UI extension interface
 */
export interface UiExtension {
  /**
   * Unique identifier for the extension
   */
  id: string;

  /**
   * Extension point in the UI
   */
  extensionPoint: string;

  /**
   * React component or component path
   */
  component: any;

  /**
   * Priority for rendering (lower number = higher priority)
   */
  priority?: number;

  /**
   * Metadata for the extension
   */
  metadata?: Record<string, any>;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  /**
   * Plugin ID
   */
  id: string;

  /**
   * Plugin name
   */
  name: string;

  /**
   * Plugin version
   */
  version: string;

  /**
   * Plugin description
   */
  description?: string;

  /**
   * Path to the entry point
   */
  entryPoint: string;

  /**
   * Plugin dependencies
   */
  dependencies?: string[];

  /**
   * Plugin settings
   */
  settings?: Record<string, any>;
}
