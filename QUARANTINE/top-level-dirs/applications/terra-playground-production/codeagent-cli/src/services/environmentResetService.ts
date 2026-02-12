import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import { EventEmitter } from 'events';

/**
 * Reset options interface
 */
export interface ResetOptions {
  force?: boolean;
  keepPlugins?: boolean;
  cleanDeps?: boolean;
  resetServices?: boolean;
  resetOnly?: string[];
  configPath?: string;
  backupDir?: string;
}

/**
 * Reset result interface
 */
export interface ResetResult {
  success: boolean;
  backupDir?: string;
  resetPaths: string[];
  errors: { path: string; error: string }[];
  summary: string;
}

/**
 * Environment Reset Service
 * Handles environment reset operations with progress tracking
 */
export class EnvironmentResetService extends EventEmitter {
  // Default configuration paths to reset
  private defaultConfigPaths = [
    'config',
    '.config',
    'settings',
    '.settings',
    '.env',
    '.env.local',
    '.cache',
    'node_modules',
    'dist',
    'build',
    'tmp',
    '.tmp',
  ];

  // Default plugin configuration path
  private defaultPluginConfigPath = path.join(os.homedir(), '.codeagent', 'plugins');

  // Default service files
  private defaultServiceFiles = [
    path.join(os.homedir(), '.codeagent', 'credentials'),
    path.join(os.homedir(), '.codeagent', 'logs'),
    path.join(os.homedir(), '.codeagent', 'cache'),
  ];

  /**
   * Reset the environment based on the provided options
   */
  async reset(options: ResetOptions): Promise<ResetResult> {
    const result: ResetResult = {
      success: true,
      resetPaths: [],
      errors: [],
      summary: '',
    };

    try {
      // Collect paths to reset
      const pathsToReset: string[] = [];

      // If resetOnly is provided, only reset those paths
      if (options.resetOnly?.length) {
        pathsToReset.push(...options.resetOnly);
      } else {
        // Add default config paths
        pathsToReset.push(...this.defaultConfigPaths);

        // Add plugin configs if not keeping them
        if (!options.keepPlugins) {
          pathsToReset.push(options.configPath || this.defaultPluginConfigPath);
        }

        // Add service files if requested
        if (options.resetServices) {
          pathsToReset.push(...this.defaultServiceFiles);
        }
      }

      // Create backup directory
      const backupDir = options.backupDir || path.join(process.cwd(), '.backup-' + Date.now());
      await fs.mkdir(backupDir, { recursive: true });
      result.backupDir = backupDir;

      this.emit('progress', { message: `Created backup directory: ${backupDir}` });

      // Process each path
      for (const pathToReset of pathsToReset) {
        try {
          // Check if path exists
          await fs.access(pathToReset);

          // Create backup
          const backupPath = path.join(backupDir, path.basename(pathToReset));
          await fs.cp(pathToReset, backupPath, { recursive: true });
          this.emit('progress', { message: `Backed up ${pathToReset}` });

          // Delete the original
          if (fs.rm) {
            // Use fs.rm if available (Node.js >= 14.14.0)
            await fs.rm(pathToReset, { recursive: true, force: true });
          } else {
            // Fallback for older Node.js versions
            if ((await fs.stat(pathToReset)).isDirectory()) {
              execSync(`rm -rf "${pathToReset}"`);
            } else {
              await fs.unlink(pathToReset);
            }
          }

          result.resetPaths.push(pathToReset);
          this.emit('progress', { message: `Reset ${pathToReset}` });
        } catch (error) {
          // Skip if the path doesn't exist
          if (error.code === 'ENOENT') {
            this.emit('progress', {
              message: `${pathToReset} does not exist, skipping`,
              type: 'warning',
            });
          } else {
            result.errors.push({ path: pathToReset, error: error.message });
            this.emit('progress', {
              message: `Error processing ${pathToReset}: ${error.message}`,
              type: 'error',
            });
          }
        }
      }

      // Clean dependencies if requested
      if (options.cleanDeps) {
        this.emit('progress', { message: 'Cleaning dependencies...', type: 'info' });

        // Check if package.json exists
        try {
          await fs.access('package.json');

          // Execute npm commands
          this.emit('progress', { message: 'Cleaning npm cache...', type: 'info' });
          execSync('npm cache clean --force');

          this.emit('progress', { message: 'Reinstalling dependencies...', type: 'info' });
          execSync('npm install');

          this.emit('progress', { message: 'Dependencies cleaned successfully', type: 'success' });
        } catch (error) {
          if (error.code === 'ENOENT') {
            this.emit('progress', {
              message: 'No package.json found, skipping dependency cleaning',
              type: 'warning',
            });
          } else {
            result.errors.push({ path: 'package.json', error: error.message });
            this.emit('progress', {
              message: `Error cleaning dependencies: ${error.message}`,
              type: 'error',
            });
          }
        }
      }

      // Create summary
      result.summary = `Reset ${result.resetPaths.length} configuration items, created backup at ${result.backupDir}`;
      if (options.cleanDeps) {
        result.summary += ', cleaned and reinstalled dependencies';
      }

      this.emit('complete', result);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push({ path: 'global', error: error.message });
      this.emit('error', { message: `Failed to reset environment: ${error.message}` });

      return result;
    }
  }

  /**
   * Get a list of detectable environment items that can be reset
   * This helps users see what can be reset before confirming
   */
  async detectResetableItems(): Promise<string[]> {
    const items: string[] = [];

    // Check for default config paths
    for (const configPath of this.defaultConfigPaths) {
      try {
        await fs.access(configPath);
        items.push(configPath);
      } catch {
        // Skip if not found
      }
    }

    // Check for plugin config path
    try {
      await fs.access(this.defaultPluginConfigPath);
      items.push(this.defaultPluginConfigPath);
    } catch {
      // Skip if not found
    }

    // Check for service files
    for (const servicePath of this.defaultServiceFiles) {
      try {
        await fs.access(servicePath);
        items.push(servicePath);
      } catch {
        // Skip if not found
      }
    }

    return items;
  }

  /**
   * Restore from a backup
   */
  async restoreFromBackup(backupDir: string, pathsToRestore?: string[]): Promise<boolean> {
    try {
      // Get all backup items
      const backupItems = await fs.readdir(backupDir);

      // Filter items to restore if specified
      const itemsToRestore = pathsToRestore
        ? backupItems.filter(item => pathsToRestore.includes(item))
        : backupItems;

      for (const item of itemsToRestore) {
        const backupItemPath = path.join(backupDir, item);
        const originalPath = path.join(process.cwd(), item);

        // Copy from backup to original location
        await fs.cp(backupItemPath, originalPath, { recursive: true });
        this.emit('progress', { message: `Restored ${item}` });
      }

      this.emit('complete', { message: `Restored ${itemsToRestore.length} items from backup` });
      return true;
    } catch (error) {
      this.emit('error', { message: `Failed to restore from backup: ${error.message}` });
      return false;
    }
  }
}
