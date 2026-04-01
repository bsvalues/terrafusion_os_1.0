/**
 * Extension System Interface Definitions
 * 
 * This file defines the core interfaces for the extension system,
 * including extension metadata, contexts, and event handling.
 */

import { IStorage } from '../storage';

/**
 * Extension setting type definitions
 */
export type ExtensionSettingType = 'string' | 'number' | 'boolean' | 'select' | 'multiselect';

/**
 * Extension setting option (for select and multiselect types)
 */
export interface ExtensionSettingOption {
  label: string;
  value: string;
}

/**
 * Extension setting definition
 */
export interface ExtensionSetting {
  id: string;
  label: string;
  description: string;
  type: ExtensionSettingType;
  default: any;
  options?: ExtensionSettingOption[];
}

/**
 * Extension metadata
 */
export interface ExtensionMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  authorUrl?: string;
  homepage?: string;
  category: string;
  requiredPermissions: string[];
  settings?: ExtensionSetting[];
}

/**
 * Extension menu item
 */
export interface ExtensionMenuItem {
  id: string;
  label: string;
  icon?: string;
  parent?: string;
  command?: string;
  position?: number;
}

/**
 * Extension webview panel
 */
export interface WebviewPanel {
  id: string;
  title: string;
  content: string;
}

/**
 * Extension logger
 */
export interface ExtensionLogger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

/**
 * Command registration
 */
export interface CommandRegistration {
  extensionId: string;
  callback: (...args: any[]) => any;
}

/**
 * Extension context
 * Provides services and utilities to extensions
 */
export interface ExtensionContext {
  readonly extensionId: string;
  readonly storage: IStorage;
  readonly logger: ExtensionLogger;
  readonly settings: Record<string, any>;
  
  registerCommand(command: string, callback: (...args: any[]) => any): void;
  registerWebviewPanel(id: string, title: string, content: string): void;
  registerMenuItem(item: ExtensionMenuItem): void;
}

/**
 * Extension interface
 * Defines the contract for extensions
 */
export interface IExtension {
  readonly metadata: ExtensionMetadata;
  
  activate(context: ExtensionContext): Promise<void>;
  deactivate(): Promise<void>;
}