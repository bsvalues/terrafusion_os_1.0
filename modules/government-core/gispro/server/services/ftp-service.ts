/**
 * FTP Service for data migration with spatial data
 * 
 * This service provides functionalities to connect to FTP servers,
 * upload/download files, and manage the FTP connection lifecycle.
 */
import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

/**
 * FTP Connection Configuration
 */
export interface FtpConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  secure?: boolean;
  secureOptions?: {
    rejectUnauthorized?: boolean;
  };
  timeout?: number;
}

/**
 * Available file types for upload/download
 */
export enum FileType {
  SHAPEFILE = 'shapefile',
  GEOJSON = 'geojson',
  CSV = 'csv',
  XML = 'xml',
  KML = 'kml',
  PARCEL_DATA = 'parcel_data',
  DOCUMENT = 'document',
  IMAGE = 'image',
  OTHER = 'other'
}

/**
 * File transfer status
 */
export interface FileTransferStatus {
  filename: string;
  bytesTransferred: number;
  totalBytes: number;
  percentComplete: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  type: FileType;
  direction: 'upload' | 'download';
  startTime: Date;
  endTime?: Date;
}

/**
 * FTP Service Class
 */
export class FtpService {
  private client: ftp.Client;
  private config: FtpConfig | null = null;
  private isConnected: boolean = false;
  private transfersInProgress: Map<string, FileTransferStatus> = new Map();
  
  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = false; // Set to true for debugging
  }
  
  /**
   * Connect to FTP server
   */
  async connect(config: FtpConfig): Promise<boolean> {
    try {
      this.config = config;
      
      // Configure client
      this.client.ftp.verbose = process.env.NODE_ENV !== 'production';
      
      const ftpConfig: ftp.AccessOptions = {
        host: config.host,
        port: config.port || 21,
        user: config.user,
        password: config.password,
        secure: config.secure || false,
        secureOptions: config.secureOptions,
      };
      
      logger.info(`Connecting to FTP server: ${config.host}`);
      await this.client.access(ftpConfig);
      
      this.isConnected = true;
      logger.info(`Connected to FTP server: ${config.host}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to connect to FTP server: ${error instanceof Error ? error.message : String(error)}`);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Check if connected to FTP server
   */
  async checkConnection(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }
    
    try {
      // Try a simple command to check if connection is still active
      await this.client.pwd();
      return true;
    } catch (error) {
      logger.error(`FTP connection check failed: ${error instanceof Error ? error.message : String(error)}`);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Reconnect to the FTP server if the connection was lost
   */
  async reconnect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }
    
    if (!this.config) {
      logger.error('Cannot reconnect: No previous connection configuration found');
      return false;
    }
    
    try {
      // Close any existing connection
      await this.disconnect();
      
      // Try to reconnect with the saved configuration
      return await this.connect(this.config);
    } catch (error) {
      logger.error(`Failed to reconnect to FTP server: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Disconnect from FTP server
   */
  async disconnect(): Promise<void> {
    try {
      this.client.close();
      this.isConnected = false;
      logger.info('Disconnected from FTP server');
    } catch (error) {
      logger.error(`Error disconnecting from FTP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List files in directory
   */
  async listFiles(remotePath: string = '/'): Promise<ftp.FileInfo[]> {
    try {
      await this.ensureConnected();
      
      logger.info(`Listing files in directory: ${remotePath}`);
      const list = await this.client.list(remotePath);
      
      return list;
    } catch (error) {
      logger.error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Upload a file to the FTP server
   */
  async uploadFile(
    localFilePath: string, 
    remoteFilePath: string, 
    fileType: FileType = FileType.OTHER
  ): Promise<FileTransferStatus> {
    const filename = path.basename(localFilePath);
    const transferId = `upload_${filename}_${Date.now()}`;
    
    // Initialize transfer status
    const status: FileTransferStatus = {
      filename,
      bytesTransferred: 0,
      totalBytes: 0,
      percentComplete: 0,
      status: 'pending',
      type: fileType,
      direction: 'upload',
      startTime: new Date()
    };
    
    this.transfersInProgress.set(transferId, status);
    
    try {
      await this.ensureConnected();
      
      // Get file size
      const stats = fs.statSync(localFilePath);
      status.totalBytes = stats.size;
      status.status = 'in_progress';
      this.transfersInProgress.set(transferId, {...status});
      
      // Set up progress tracking
      this.client.trackProgress(info => {
        status.bytesTransferred = info.bytes;
        status.percentComplete = info.bytes / status.totalBytes * 100;
        this.transfersInProgress.set(transferId, {...status});
      });
      
      logger.info(`Uploading file: ${localFilePath} to ${remoteFilePath}`);
      await this.client.uploadFrom(localFilePath, remoteFilePath);
      
      // Clear progress tracking
      this.client.trackProgress();
      
      // Update status
      status.status = 'completed';
      status.endTime = new Date();
      status.percentComplete = 100;
      this.transfersInProgress.set(transferId, {...status});
      
      logger.info(`Upload completed: ${filename}`);
      return status;
    } catch (error) {
      logger.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Clear progress tracking
      this.client.trackProgress();
      
      // Update status
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : String(error);
      status.endTime = new Date();
      this.transfersInProgress.set(transferId, {...status});
      
      throw error;
    }
  }
  
  /**
   * Download a file from the FTP server
   */
  async downloadFile(
    remoteFilePath: string, 
    localFilePath: string, 
    fileType: FileType = FileType.OTHER
  ): Promise<FileTransferStatus> {
    const filename = path.basename(remoteFilePath);
    const transferId = `download_${filename}_${Date.now()}`;
    
    // Initialize transfer status
    const status: FileTransferStatus = {
      filename,
      bytesTransferred: 0,
      totalBytes: 0,
      percentComplete: 0,
      status: 'pending',
      type: fileType,
      direction: 'download',
      startTime: new Date()
    };
    
    this.transfersInProgress.set(transferId, status);
    
    try {
      await this.ensureConnected();
      
      // Get file size
      const fileInfo = await this.client.size(remoteFilePath);
      status.totalBytes = fileInfo;
      status.status = 'in_progress';
      this.transfersInProgress.set(transferId, {...status});
      
      // Set up progress tracking
      this.client.trackProgress(info => {
        status.bytesTransferred = info.bytes;
        status.percentComplete = info.bytes / status.totalBytes * 100;
        this.transfersInProgress.set(transferId, {...status});
      });
      
      logger.info(`Downloading file: ${remoteFilePath} to ${localFilePath}`);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await this.client.downloadTo(localFilePath, remoteFilePath);
      
      // Clear progress tracking
      this.client.trackProgress();
      
      // Update status
      status.status = 'completed';
      status.endTime = new Date();
      status.percentComplete = 100;
      this.transfersInProgress.set(transferId, {...status});
      
      logger.info(`Download completed: ${filename}`);
      return status;
    } catch (error) {
      logger.error(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Clear progress tracking
      this.client.trackProgress();
      
      // Update status
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : String(error);
      status.endTime = new Date();
      this.transfersInProgress.set(transferId, {...status});
      
      throw error;
    }
  }
  
  /**
   * Get all transfer statuses
   */
  getTransferStatuses(): FileTransferStatus[] {
    return Array.from(this.transfersInProgress.values());
  }
  
  /**
   * Get active transfer statuses (pending or in_progress)
   */
  getActiveTransfers(): FileTransferStatus[] {
    return Array.from(this.transfersInProgress.values())
      .filter(transfer => transfer.status === 'pending' || transfer.status === 'in_progress');
  }
  
  /**
   * Create directory on FTP server
   */
  async createDirectory(remotePath: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      
      logger.info(`Creating directory: ${remotePath}`);
      await this.client.ensureDir(remotePath);
      
      return true;
    } catch (error) {
      logger.error(`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Delete file on FTP server
   */
  async deleteFile(remotePath: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      
      logger.info(`Deleting file: ${remotePath}`);
      await this.client.remove(remotePath);
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Rename file on FTP server
   */
  async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      
      logger.info(`Renaming file: ${oldPath} to ${newPath}`);
      await this.client.rename(oldPath, newPath);
      
      return true;
    } catch (error) {
      logger.error(`Failed to rename file: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Check if file exists on FTP server
   */
  async fileExists(remotePath: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      
      const directory = path.dirname(remotePath);
      const filename = path.basename(remotePath);
      
      const files = await this.client.list(directory);
      return files.some(file => file.name === filename);
    } catch (error) {
      logger.error(`Failed to check if file exists: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Ensure connected to FTP server
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      const reconnected = await this.reconnect();
      if (!reconnected) {
        throw new Error('Not connected to FTP server and reconnection failed');
      }
    }
  }
}

// Create and export a singleton instance
export const ftpService = new FtpService();