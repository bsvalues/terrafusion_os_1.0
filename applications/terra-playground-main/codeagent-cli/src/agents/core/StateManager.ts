/**
 * StateManager.ts
 *
 * Manages persisting and retrieving agent state
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { LogService } from './LogService';

/**
 * Storage provider interface
 */
export interface StorageProvider {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  listKeys(prefix?: string): Promise<string[]>;
}

/**
 * File system storage provider
 */
export class FileSystemStorageProvider implements StorageProvider {
  private basePath: string;
  private logger: LogService;

  /**
   * Constructor
   * @param basePath Base path for storage
   */
  constructor(basePath: string) {
    this.basePath = basePath;
    this.logger = new LogService('FileSystemStorage');

    // Ensure directory exists
    this.ensureDirectory();
  }

  /**
   * Ensure base directory exists
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      this.logger.error(
        `Error creating directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get full path for a key
   * @param key Storage key
   */
  private getFullPath(key: string): string {
    // Sanitize key to prevent directory traversal
    const safeKey = key.replace(/\.\./g, '').replace(/[/\\]/g, '_');
    return join(this.basePath, `${safeKey}.json`);
  }

  /**
   * Save data to storage
   * @param key Storage key
   * @param data Data to save
   */
  public async save(key: string, data: any): Promise<void> {
    try {
      const path = this.getFullPath(key);
      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(path, json, 'utf-8');
    } catch (error) {
      this.logger.error(
        `Error saving data: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Load data from storage
   * @param key Storage key
   */
  public async load(key: string): Promise<any> {
    try {
      const path = this.getFullPath(key);
      const json = await fs.readFile(path, 'utf-8');
      return JSON.parse(json);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      this.logger.error(
        `Error loading data: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Delete data from storage
   * @param key Storage key
   */
  public async delete(key: string): Promise<boolean> {
    try {
      const path = this.getFullPath(key);
      await fs.unlink(path);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      this.logger.error(
        `Error deleting data: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Check if key exists in storage
   * @param key Storage key
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const path = this.getFullPath(key);
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List keys in storage
   * @param prefix Optional prefix to filter by
   */
  public async listKeys(prefix?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.slice(0, -5)) // Remove .json extension
        .filter(key => !prefix || key.startsWith(prefix));
    } catch (error) {
      this.logger.error(
        `Error listing keys: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}

/**
 * Memory storage provider (for testing or non-persistent storage)
 */
export class MemoryStorageProvider implements StorageProvider {
  private storage: Map<string, any>;
  private logger: LogService;

  /**
   * Constructor
   */
  constructor() {
    this.storage = new Map<string, any>();
    this.logger = new LogService('MemoryStorage');
  }

  /**
   * Save data to storage
   * @param key Storage key
   * @param data Data to save
   */
  public async save(key: string, data: any): Promise<void> {
    this.storage.set(key, JSON.parse(JSON.stringify(data)));
  }

  /**
   * Load data from storage
   * @param key Storage key
   */
  public async load(key: string): Promise<any> {
    const data = this.storage.get(key);
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  /**
   * Delete data from storage
   * @param key Storage key
   */
  public async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  /**
   * Check if key exists in storage
   * @param key Storage key
   */
  public async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  /**
   * List keys in storage
   * @param prefix Optional prefix to filter by
   */
  public async listKeys(prefix?: string): Promise<string[]> {
    return Array.from(this.storage.keys()).filter(key => !prefix || key.startsWith(prefix));
  }
}

/**
 * State manager class
 */
export class StateManager {
  private static instance: StateManager;
  private provider: StorageProvider;
  private logger: LogService;

  /**
   * Private constructor (use getInstance)
   */
  private constructor(provider: StorageProvider) {
    this.provider = provider;
    this.logger = new LogService('StateManager');
  }

  /**
   * Get singleton instance
   * @param provider Optional storage provider
   */
  public static getInstance(provider?: StorageProvider): StateManager {
    if (!StateManager.instance) {
      // Default to file system storage
      const defaultProvider =
        provider || new FileSystemStorageProvider(join(process.cwd(), '.codeagent', 'state'));
      StateManager.instance = new StateManager(defaultProvider);
    }
    return StateManager.instance;
  }

  /**
   * Change storage provider
   * @param provider New storage provider
   */
  public setProvider(provider: StorageProvider): void {
    this.provider = provider;
    this.logger.info('Storage provider changed');
  }

  /**
   * Save agent state
   * @param agentId Agent ID
   * @param state State to save
   */
  public async saveAgentState(agentId: string, state: any): Promise<void> {
    const key = `agent:${agentId}:state`;
    await this.provider.save(key, {
      timestamp: new Date().toISOString(),
      agentId,
      state,
    });
    this.logger.debug(`Saved state for agent ${agentId}`);
  }

  /**
   * Load agent state
   * @param agentId Agent ID
   */
  public async loadAgentState(agentId: string): Promise<any> {
    const key = `agent:${agentId}:state`;
    const data = await this.provider.load(key);
    return data?.state || null;
  }

  /**
   * Delete agent state
   * @param agentId Agent ID
   */
  public async deleteAgentState(agentId: string): Promise<boolean> {
    const key = `agent:${agentId}:state`;
    return await this.provider.delete(key);
  }

  /**
   * Save task result
   * @param taskId Task ID
   * @param result Task result
   */
  public async saveTaskResult(taskId: string, result: any): Promise<void> {
    const key = `task:${taskId}:result`;
    await this.provider.save(key, {
      timestamp: new Date().toISOString(),
      taskId,
      result,
    });
    this.logger.debug(`Saved result for task ${taskId}`);
  }

  /**
   * Load task result
   * @param taskId Task ID
   */
  public async loadTaskResult(taskId: string): Promise<any> {
    const key = `task:${taskId}:result`;
    const data = await this.provider.load(key);
    return data?.result || null;
  }

  /**
   * Delete task result
   * @param taskId Task ID
   */
  public async deleteTaskResult(taskId: string): Promise<boolean> {
    const key = `task:${taskId}:result`;
    return await this.provider.delete(key);
  }

  /**
   * Save custom data
   * @param namespace Namespace
   * @param key Key within namespace
   * @param data Data to save
   */
  public async saveData(namespace: string, key: string, data: any): Promise<void> {
    const storageKey = `data:${namespace}:${key}`;
    await this.provider.save(storageKey, {
      timestamp: new Date().toISOString(),
      namespace,
      key,
      data,
    });
    this.logger.debug(`Saved data for ${namespace}:${key}`);
  }

  /**
   * Load custom data
   * @param namespace Namespace
   * @param key Key within namespace
   */
  public async loadData(namespace: string, key: string): Promise<any> {
    const storageKey = `data:${namespace}:${key}`;
    const stored = await this.provider.load(storageKey);
    return stored?.data || null;
  }

  /**
   * Delete custom data
   * @param namespace Namespace
   * @param key Key within namespace
   */
  public async deleteData(namespace: string, key: string): Promise<boolean> {
    const storageKey = `data:${namespace}:${key}`;
    return await this.provider.delete(storageKey);
  }

  /**
   * List all saved states for an agent
   * @param agentId Agent ID
   */
  public async listAgentData(agentId: string): Promise<string[]> {
    const prefix = `agent:${agentId}:`;
    const keys = await this.provider.listKeys(prefix);
    // Strip prefix from keys
    return keys.map(key => key.substring(prefix.length));
  }

  /**
   * List all saved data in a namespace
   * @param namespace Namespace
   */
  public async listNamespaceData(namespace: string): Promise<string[]> {
    const prefix = `data:${namespace}:`;
    const keys = await this.provider.listKeys(prefix);
    // Strip prefix from keys
    return keys.map(key => key.substring(prefix.length));
  }
}
