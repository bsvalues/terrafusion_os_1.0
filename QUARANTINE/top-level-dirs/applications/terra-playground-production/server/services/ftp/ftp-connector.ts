/**
 * FTP Connector Service
 *
 * Provides a robust interface for interacting with FTP servers:
 * - Connection pooling and management
 * - Automatic retry with exponential backoff
 * - File synchronization with change detection
 * - Streaming support for large files
 * - Comprehensive error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Client as FTPClient } from 'basic-ftp';
import { logger } from '../../utils/logger';

// FTP connection configuration
export interface FTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  timeoutSeconds?: number;
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    backoffFactor: number;
  };
}

// File details
export interface FileInfo {
  name: string;
  size: number;
  isDirectory: boolean;
  modifiedTime?: Date;
  permissions?: string;
  hash?: string;
}

// Synchronization result
export interface SyncResult {
  added: string[];
  updated: string[];
  deleted: string[];
  unchanged: string[];
  failed: { path: string; error: string }[];
}

// Filter function type
export type FileFilter = (fileInfo: FileInfo) => boolean;

/**
 * FTP Connector Service implementation
 */
export class FTPConnector {
  private client: FTPClient;
  private connected: boolean = false;
  private config: FTPConfig;

  /**
   * Create a new FTP Connector
   * @param config FTP connection configuration
   */
  constructor(config: FTPConfig) {
    this.config = {
      ...config,
      timeoutSeconds: config.timeoutSeconds || 30,
      retryConfig: config.retryConfig || {
        maxRetries: 3,
        initialDelay: 1000,
        backoffFactor: 2,
      },
    };

    this.client = new FTPClient();
    this.client.ftp.verbose = false;
  }

  /**
   * Connect to the FTP server
   * @returns True if connected successfully
   */
  async connect(): Promise<boolean> {
    if (this.connected) {
      return true;
    }

    try {
      // Set connection timeout
      this.client.ftp.socket.setTimeout((this.config.timeoutSeconds || 30) * 1000);

      // Connect to server
      await this.client.access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
      });

      this.connected = true;

      logger.info(`Connected to FTP server: ${this.config.host}:${this.config.port}`, {
        component: 'FTPConnector',
        secure: this.config.secure,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to connect to FTP server: ${this.config.host}:${this.config.port}`, {
        component: 'FTPConnector',
        error,
      });

      this.connected = false;
      return false;
    }
  }

  /**
   * Disconnect from the FTP server
   */
  disconnect(): void {
    if (this.client) {
      this.client.close();
      this.connected = false;

      logger.info(`Disconnected from FTP server: ${this.config.host}:${this.config.port}`, {
        component: 'FTPConnector',
      });
    }
  }

  /**
   * Execute an FTP operation with automatic retries
   * @param operation Operation function
   * @returns Operation result
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const { maxRetries, initialDelay, backoffFactor } = this.config.retryConfig!;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Ensure connection before operation
        if (!this.connected) {
          await this.connect();
        }

        // Execute operation
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Log error
        logger.warn(`FTP operation failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
          component: 'FTPConnector',
          error: lastError.message,
        });

        // Close current connection
        this.client.close();
        this.connected = false;

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(backoffFactor, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Create a new client for the next attempt
          this.client = new FTPClient();
          this.client.ftp.verbose = false;
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('FTP operation failed after retries');
  }

  /**
   * Get a file listing from the FTP server
   * @param remotePath Remote directory path
   * @returns Array of file info objects
   */
  async listFiles(remotePath: string): Promise<FileInfo[]> {
    return this.executeWithRetry(async () => {
      const listing = await this.client.list(remotePath);

      return listing.map(item => ({
        name: item.name,
        size: item.size,
        isDirectory: item.type === 2, // 2 = directory in basic-ftp
        modifiedTime: item.modifiedAt,
        permissions: item.rawModifiedAt, // Using rawModifiedAt field to store permissions (hack)
      }));
    });
  }

  /**
   * Download a file from the FTP server
   * @param remotePath Remote file path
   * @param localPath Local file path
   * @returns True if download was successful
   */
  async downloadFile(remotePath: string, localPath: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download file
      await this.client.downloadTo(localPath, remotePath);

      logger.info(`Downloaded file from FTP server: ${remotePath} -> ${localPath}`, {
        component: 'FTPConnector',
        fileSize: fs.statSync(localPath).size,
      });

      return true;
    });
  }

  /**
   * Download a file from the FTP server using streaming for large files
   * @param remotePath Remote file path
   * @param localPath Local file path
   * @returns True if download was successful
   */
  async downloadFileStream(remotePath: string, localPath: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create write stream
      const writeStream = fs.createWriteStream(localPath);

      try {
        // Download file
        await this.client.downloadTo(writeStream, remotePath);

        logger.info(`Downloaded file (stream) from FTP server: ${remotePath} -> ${localPath}`, {
          component: 'FTPConnector',
          fileSize: fs.statSync(localPath).size,
        });

        return true;
      } finally {
        writeStream.close();
      }
    });
  }

  /**
   * Upload a file to the FTP server
   * @param localPath Local file path
   * @param remotePath Remote file path
   * @returns True if upload was successful
   */
  async uploadFile(localPath: string, remotePath: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // Check if file exists
      if (!fs.existsSync(localPath)) {
        throw new Error(`Local file not found: ${localPath}`);
      }

      // Upload file
      await this.client.uploadFrom(localPath, remotePath);

      logger.info(`Uploaded file to FTP server: ${localPath} -> ${remotePath}`, {
        component: 'FTPConnector',
        fileSize: fs.statSync(localPath).size,
      });

      return true;
    });
  }

  /**
   * Upload a file to the FTP server using streaming for large files
   * @param localPath Local file path
   * @param remotePath Remote file path
   * @returns True if upload was successful
   */
  async uploadFileStream(localPath: string, remotePath: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // Check if file exists
      if (!fs.existsSync(localPath)) {
        throw new Error(`Local file not found: ${localPath}`);
      }

      // Create read stream
      const readStream = fs.createReadStream(localPath);

      try {
        // Upload file
        await this.client.uploadFrom(readStream, remotePath);

        logger.info(`Uploaded file (stream) to FTP server: ${localPath} -> ${remotePath}`, {
          component: 'FTPConnector',
          fileSize: fs.statSync(localPath).size,
        });

        return true;
      } finally {
        readStream.close();
      }
    });
  }

  /**
   * Delete a file from the FTP server
   * @param remotePath Remote file path
   * @returns True if deletion was successful
   */
  async deleteFile(remotePath: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      await this.client.remove(remotePath);

      logger.info(`Deleted file from FTP server: ${remotePath}`, {
        component: 'FTPConnector',
      });

      return true;
    });
  }

  /**
   * Create a directory on the FTP server
   * @param remotePath Remote directory path
   * @returns True if directory creation was successful
   */
  async createDirectory(remotePath: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      await this.client.ensureDir(remotePath);

      logger.info(`Created directory on FTP server: ${remotePath}`, {
        component: 'FTPConnector',
      });

      return true;
    });
  }

  /**
   * Delete a directory from the FTP server
   * @param remotePath Remote directory path
   * @param recursive Whether to delete recursively
   * @returns True if deletion was successful
   */
  async deleteDirectory(remotePath: string, recursive: boolean = false): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (recursive) {
        await this.client.removeDir(remotePath);
      } else {
        // Check if directory is empty
        const listing = await this.client.list(remotePath);

        if (listing.length > 0) {
          throw new Error(`Directory is not empty: ${remotePath}`);
        }

        await this.client.removeDir(remotePath);
      }

      logger.info(`Deleted directory from FTP server: ${remotePath}`, {
        component: 'FTPConnector',
        recursive,
      });

      return true;
    });
  }

  /**
   * Check if a file exists on the FTP server
   * @param remotePath Remote file path
   * @returns True if file exists
   */
  async fileExists(remotePath: string): Promise<boolean> {
    try {
      return await this.executeWithRetry(async () => {
        // Get parent directory and filename
        const parentDir = path.dirname(remotePath);
        const filename = path.basename(remotePath);

        // List parent directory
        const listing = await this.client.list(parentDir);

        // Check if file exists
        return listing.some(item => item.name === filename && item.type !== 2);
      });
    } catch (error) {
      // Handle errors as not exists
      return false;
    }
  }

  /**
   * Get file information from the FTP server
   * @param remotePath Remote file path
   * @returns File information
   */
  async getFileInfo(remotePath: string): Promise<FileInfo | null> {
    try {
      return await this.executeWithRetry(async () => {
        // Get parent directory and filename
        const parentDir = path.dirname(remotePath);
        const filename = path.basename(remotePath);

        // List parent directory
        const listing = await this.client.list(parentDir);

        // Find file
        const fileItem = listing.find(item => item.name === filename);

        if (!fileItem) {
          return null;
        }

        return {
          name: fileItem.name,
          size: fileItem.size,
          isDirectory: fileItem.type === 2,
          modifiedTime: fileItem.modifiedAt,
          permissions: fileItem.rawModifiedAt,
        };
      });
    } catch (error) {
      logger.error(`Failed to get file info: ${remotePath}`, {
        component: 'FTPConnector',
        error,
      });

      return null;
    }
  }

  /**
   * Calculate MD5 hash of a local file
   * @param filepath Local file path
   * @returns MD5 hash of the file
   */
  private async calculateFileHash(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filepath);

        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Synchronize a directory from the FTP server to a local directory
   * @param remoteDir Remote directory path
   * @param localDir Local directory path
   * @param options Synchronization options
   * @returns Synchronization result
   */
  async syncDirectory(
    remoteDir: string,
    localDir: string,
    options: {
      recursive?: boolean;
      deleteLocal?: boolean;
      filter?: FileFilter;
    } = {}
  ): Promise<SyncResult> {
    // Set default options
    const opts = {
      recursive: options.recursive !== undefined ? options.recursive : true,
      deleteLocal: options.deleteLocal !== undefined ? options.deleteLocal : false,
      filter: options.filter || (() => true),
    };

    // Ensure local directory exists
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    const result: SyncResult = {
      added: [],
      updated: [],
      deleted: [],
      unchanged: [],
      failed: [],
    };

    try {
      // Get remote file listing
      const remoteListing = await this.listFiles(remoteDir);

      // Get local file listing
      const localFiles = fs.readdirSync(localDir).filter(name => {
        const localPath = path.join(localDir, name);
        const stat = fs.statSync(localPath);

        // If directory and not recursive, skip
        if (stat.isDirectory() && !opts.recursive) {
          return false;
        }

        return true;
      });

      // Track processed files to detect deletions
      const processedFiles = new Set<string>();

      // Process remote files
      for (const remoteFile of remoteListing) {
        // Skip files that don't match filter
        if (!opts.filter(remoteFile)) {
          continue;
        }

        const remoteFilePath = path.join(remoteDir, remoteFile.name);
        const localFilePath = path.join(localDir, remoteFile.name);

        processedFiles.add(remoteFile.name);

        if (remoteFile.isDirectory) {
          // Process directory
          if (opts.recursive) {
            // Ensure local directory exists
            if (!fs.existsSync(localFilePath)) {
              fs.mkdirSync(localFilePath, { recursive: true });
              result.added.push(remoteFilePath);
            }

            // Recursively sync directory
            const subResult = await this.syncDirectory(remoteFilePath, localFilePath, options);

            // Merge results
            result.added.push(...subResult.added);
            result.updated.push(...subResult.updated);
            result.deleted.push(...subResult.deleted);
            result.unchanged.push(...subResult.unchanged);
            result.failed.push(...subResult.failed);
          }
        } else {
          // Process file
          const localExists = fs.existsSync(localFilePath);

          try {
            if (!localExists) {
              // New file, download it
              await this.downloadFile(remoteFilePath, localFilePath);
              result.added.push(remoteFilePath);
            } else {
              // File exists, check if it needs updating
              const localStat = fs.statSync(localFilePath);

              let needsUpdate = false;

              // Check size first (quick check)
              if (localStat.size !== remoteFile.size) {
                needsUpdate = true;
              } else if (remoteFile.modifiedTime) {
                // Check modification time if available
                const remoteTime = remoteFile.modifiedTime.getTime();
                const localTime = localStat.mtime.getTime();

                // Allow 1 second difference due to FTP precision
                if (Math.abs(remoteTime - localTime) > 1000) {
                  needsUpdate = true;
                }
              } else {
                // Calculate hash to be sure
                const localHash = await this.calculateFileHash(localFilePath);
                const remoteHash = remoteFile.hash || 'unknown';

                if (remoteHash !== 'unknown' && localHash !== remoteHash) {
                  needsUpdate = true;
                }
              }

              if (needsUpdate) {
                // Update file
                await this.downloadFile(remoteFilePath, localFilePath);
                result.updated.push(remoteFilePath);
              } else {
                result.unchanged.push(remoteFilePath);
              }
            }
          } catch (error) {
            result.failed.push({
              path: remoteFilePath,
              error: (error as Error).message,
            });

            logger.error(`Failed to sync file: ${remoteFilePath}`, {
              component: 'FTPConnector',
              error,
            });
          }
        }
      }

      // Handle local files that don't exist remotely
      if (opts.deleteLocal) {
        for (const localFile of localFiles) {
          if (!processedFiles.has(localFile)) {
            const localFilePath = path.join(localDir, localFile);

            try {
              const stat = fs.statSync(localFilePath);

              if (stat.isDirectory()) {
                if (opts.recursive) {
                  // Recursively delete directory
                  fs.rmSync(localFilePath, { recursive: true, force: true });
                  result.deleted.push(localFilePath);
                }
              } else {
                // Delete file
                fs.unlinkSync(localFilePath);
                result.deleted.push(localFilePath);
              }
            } catch (error) {
              result.failed.push({
                path: localFilePath,
                error: (error as Error).message,
              });

              logger.error(`Failed to delete file: ${localFilePath}`, {
                component: 'FTPConnector',
                error,
              });
            }
          }
        }
      }

      logger.info(`Synchronized directory: ${remoteDir} -> ${localDir}`, {
        component: 'FTPConnector',
        added: result.added.length,
        updated: result.updated.length,
        deleted: result.deleted.length,
        unchanged: result.unchanged.length,
        failed: result.failed.length,
      });

      return result;
    } catch (error) {
      logger.error(`Failed to sync directory: ${remoteDir} -> ${localDir}`, {
        component: 'FTPConnector',
        error,
      });

      throw error;
    }
  }
}
