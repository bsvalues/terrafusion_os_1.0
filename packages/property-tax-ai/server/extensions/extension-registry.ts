/**
 * Extension Registry
 * 
 * This class manages the registration, activation, and deactivation of extensions.
 * It serves as the central hub for all extension-related functionality.
 */

import { BaseExtension, CommandRegistration, WebviewPanel } from './base-extension';
import { logger } from '../utils/logger';

export class ExtensionRegistry {
  private static instance: ExtensionRegistry;
  private extensions: Map<string, BaseExtension> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the ExtensionRegistry
   */
  public static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    
    return ExtensionRegistry.instance;
  }
  
  /**
   * Register an extension with the registry
   */
  public registerExtension(extension: BaseExtension): void {
    const metadata = extension.getMetadata();
    
    if (this.extensions.has(metadata.id)) {
      throw new Error(`Extension with ID '${metadata.id}' is already registered.`);
    }
    
    this.extensions.set(metadata.id, extension);
    logger.info(`Extension registered: ${metadata.name} (${metadata.id})`);
  }
  
  /**
   * Get all registered extensions
   */
  public getExtensions(): BaseExtension[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get a specific extension by ID
   */
  public getExtension(id: string): BaseExtension | undefined {
    return this.extensions.get(id);
  }
  
  /**
   * Activate an extension
   */
  public async activateExtension(id: string): Promise<void> {
    const extension = this.extensions.get(id);
    
    if (!extension) {
      throw new Error(`Extension with ID '${id}' not found.`);
    }
    
    if (extension.isActive()) {
      logger.warn(`Extension ${id} is already active.`);
      return;
    }
    
    try {
      await extension.activate();
      extension.setActive(true);
      logger.info(`Extension activated: ${extension.getMetadata().name} (${id})`);
    } catch (error) {
      logger.error(`Failed to activate extension ${id}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Deactivate an extension
   */
  public async deactivateExtension(id: string): Promise<void> {
    const extension = this.extensions.get(id);
    
    if (!extension) {
      throw new Error(`Extension with ID '${id}' not found.`);
    }
    
    if (!extension.isActive()) {
      logger.warn(`Extension ${id} is not active.`);
      return;
    }
    
    try {
      await extension.deactivate();
      extension.setActive(false);
      logger.info(`Extension deactivated: ${extension.getMetadata().name} (${id})`);
    } catch (error) {
      logger.error(`Failed to deactivate extension ${id}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get all registered commands from all active extensions
   */
  public getAllCommands(): CommandRegistration[] {
    const commands: CommandRegistration[] = [];
    
    for (const extension of this.extensions.values()) {
      if (extension.isActive()) {
        commands.push(...extension.getCommands());
      }
    }
    
    return commands;
  }
  
  /**
   * Get all registered webviews from all active extensions
   */
  public getAllWebviews(): WebviewPanel[] {
    const webviews: WebviewPanel[] = [];
    
    for (const extension of this.extensions.values()) {
      if (extension.isActive()) {
        webviews.push(...extension.getWebviews());
      }
    }
    
    return webviews;
  }
  
  /**
   * Get a specific webview by ID
   */
  public getWebview(id: string): WebviewPanel | undefined {
    for (const extension of this.extensions.values()) {
      if (extension.isActive()) {
        const webview = extension.getWebview(id);
        if (webview) {
          return webview;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Initialize the extension registry by registering and activating default extensions
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing extension registry...');
    
    // Import and register sample extensions
    try {
      const { PropertyComparisonExtension } = await import('./samples/property-comparison-extension');
      
      const comparisonExt = new PropertyComparisonExtension();
      this.registerExtension(comparisonExt);
      await this.activateExtension(comparisonExt.getMetadata().id);
      
      logger.info('Extension registry initialized successfully.');
    } catch (error) {
      logger.error(`Failed to initialize extension registry: ${error}`);
      throw error;
    }
  }
  
  /**
   * Send a message to an extension
   */
  public async sendMessageToExtension(extensionId: string, message: any): Promise<any> {
    const extension = this.extensions.get(extensionId);
    
    if (!extension) {
      throw new Error(`Extension with ID '${extensionId}' not found.`);
    }
    
    if (!extension.isActive()) {
      throw new Error(`Extension ${extensionId} is not active.`);
    }
    
    try {
      return await extension.onMessage(message);
    } catch (error) {
      logger.error(`Error processing message for extension ${extensionId}: ${error}`);
      throw error;
    }
  }
}