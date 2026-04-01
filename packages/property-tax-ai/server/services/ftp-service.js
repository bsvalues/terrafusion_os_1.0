/**
 * FTP Service
 * 
 * This service handles data transfers to and from the SpatialEst FTP server.
 * It provides functionality for downloading from and uploading to the FTP site,
 * specifically targeting ftp.spatialest.com for property data imports and exports.
 */

import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

// Default connection options for the SpatialEst FTP server
const DEFAULT_FTP_CONFIG = {
  host: 'ftp.spatialest.com',
  user: process.env.FTP_USERNAME || '',
  password: process.env.FTP_PASSWORD || '',
  secure: true, // Use FTPS (FTP over TLS)
  port: 21
};

/**
 * FTP Service for handling data transfers with SpatialEst FTP server
 */
export class FtpService {
  constructor(config = {}) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_FTP_CONFIG,
      ...config
    };
    
    // Note: importService is not included in this JS version since it's only
    // needed for the full implementation
  }
  
  /**
   * Tests the FTP connection to ensure credentials are valid
   * and the server is accessible
   */
  async testConnection() {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    
    try {
      // The basic-ftp library handles SSL/TLS connections
      // Use secureOptions to accept self-signed certificates
      await client.access({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
        port: this.config.port,
        secureOptions: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });
      
      console.log('FTP Connection successful');
      return true;
    } catch (error) {
      console.error('FTP Connection failed:', error);
      return false;
    } finally {
      client.close();
    }
  }
  
  /**
   * Lists files in a specific directory on the FTP server
   * @param remoteDir Directory path on the FTP server
   * @returns Array of file listings
   */
  async listFiles(remoteDir = '/') {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
        port: this.config.port,
        secureOptions: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });
      
      return await client.list(remoteDir);
    } catch (error) {
      console.error(`Failed to list files in ${remoteDir}:`, error);
      throw new Error(`Failed to list files: ${error.message}`);
    } finally {
      client.close();
    }
  }
  
  /**
   * Downloads a file from the FTP server
   * @param remoteFilePath Path to the file on the FTP server
   * @param localFilePath Path where the file should be saved locally
   * @returns True if download was successful
   */
  async downloadFile(remoteFilePath, localFilePath) {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
        port: this.config.port,
        secureOptions: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });
      
      // Ensure the local directory exists
      const localDir = path.dirname(localFilePath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      
      await client.downloadTo(localFilePath, remoteFilePath);
      console.log(`Downloaded ${remoteFilePath} to ${localFilePath}`);
      return true;
    } catch (error) {
      console.error(`Failed to download ${remoteFilePath}:`, error);
      return false;
    } finally {
      client.close();
    }
  }
  
  /**
   * Initializes the FTP service
   */
  async initialize() {
    console.log("FTP Service initialized");
    return true;
  }
  
  /**
   * Connects to the FTP server
   */
  async connect() {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
        port: this.config.port,
        secureOptions: {
          rejectUnauthorized: false
        }
      });
      
      console.log('Connected to FTP server');
      this.client = client;
      return true;
    } catch (error) {
      console.error('FTP Connection failed:', error);
      throw error;
    }
  }
  
  /**
   * Disconnects from the FTP server
   */
  async disconnect() {
    if (this.client) {
      this.client.close();
      console.log('Disconnected from FTP server');
    }
  }
  
  /**
   * Synchronizes a directory from the FTP server to local storage
   * @param remoteDir Remote directory path
   * @param options Synchronization options
   * @returns Synchronization result
   */
  async syncDirectory(remoteDir, options = {}) {
    console.log(`Syncing directory ${remoteDir} with options:`, options);
    
    // Mock implementation for testing
    return {
      filesDownloaded: 5,
      totalSizeBytes: 1024 * 1024, // 1 MB
      skippedFiles: [],
      failedFiles: []
    };
  }
}