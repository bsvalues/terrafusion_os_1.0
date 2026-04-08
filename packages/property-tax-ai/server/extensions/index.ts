/**
 * Extension System
 * 
 * This module initializes the extension system and exports
 * the necessary utilities to interact with it.
 */

import { IStorage } from '../storage';
import { ExtensionRegistry } from './extension-registry';
import { BaseExtension } from './base-extension';
import extensionRoutes from './extension-routes';

/**
 * Initialize the extension system
 */
export function initializeExtensionSystem(storage: IStorage): ExtensionRegistry {
  try {
    // Get the registry instance
    const registry = ExtensionRegistry.getInstance();
    
    // Initialize the registry
    registry.initialize()
      .then(() => {
        console.log('Extension system initialized successfully');
      })
      .catch(error => {
        console.error('Failed to initialize extension system:', error);
      });
    
    return registry;
  } catch (error) {
    console.error('Error initializing extension system:', error);
    throw error;
  }
}

// Export core extension classes and types
export { ExtensionRegistry, BaseExtension, extensionRoutes };
export type { ExtensionMetadata, WebviewPanel, CommandRegistration } from './base-extension';