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
import { DataImportService } from './data-import-service';
import { IStorage } from '../storage';

// Define configuration interface for FTP connections
interface FtpConfig {
  host: string;
  user: string;
  password: string;
  secure: boolean;
  port?: number;
}

// Default connection options for the SpatialEst FTP server
const DEFAULT_FTP_CONFIG: FtpConfig = {
  host: 'ftp.spatialest.com',
  user: process.env.FTP_USERNAME || '',
  password: process.env.FTP_PASSWORD || '',
  secure: true, // Use FTPS (FTP over TLS)
  port: 21,
};

export interface FtpImportResult {
  filename: string;
  importResult: {
    total: number;
    successfulImports: number;
    failedImports: number;
    errors?: string[];
  };
}

export interface FtpExportResult {
  filename: string;
  recordCount: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * FTP Service for handling data transfers with SpatialEst FTP server
 */
export class FtpService {
  private config: FtpConfig;
  private importService: DataImportService;

  constructor(
    private storage: IStorage,
    config?: Partial<FtpConfig>
  ) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_FTP_CONFIG,
      ...config,
    };

    this.importService = new DataImportService(storage);
  }

  /**
   * Tests the FTP connection to ensure credentials are valid
   * and the server is accessible
   */
  async testConnection(): Promise<boolean> {
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
          rejectUnauthorized: false, // Accept self-signed certificates
        },
      });

      return true;
    } catch (error: any) {
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
  async listFiles(remoteDir: string = '/'): Promise<ftp.FileInfo[]> {
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
          rejectUnauthorized: false, // Accept self-signed certificates
        },
      });

      return await client.list(remoteDir);
    } catch (error: any) {
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
  async downloadFile(remoteFilePath: string, localFilePath: string): Promise<boolean> {
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
          rejectUnauthorized: false, // Accept self-signed certificates
        },
      });

      // Ensure the local directory exists
      const localDir = path.dirname(localFilePath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      await client.downloadTo(localFilePath, remoteFilePath);
      return true;
    } catch (error: any) {
      console.error(`Failed to download ${remoteFilePath}:`, error);
      return false;
    } finally {
      client.close();
    }
  }

  /**
   * Uploads a file to the FTP server
   * @param localFilePath Path to the local file
   * @param remoteFilePath Path where the file should be saved on the FTP server
   * @returns True if upload was successful
   */
  async uploadFile(localFilePath: string, remoteFilePath: string): Promise<boolean> {
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
          rejectUnauthorized: false, // Accept self-signed certificates
        },
      });

      // Ensure the remote directory exists
      const remoteDir = path.dirname(remoteFilePath);
      try {
        await client.ensureDir(remoteDir);
      } catch (error: any) {
        // Directory creation might fail due to permissions or if it already exists
        console.warn(`Warning ensuring directory ${remoteDir}:`, error);
      }

      await client.uploadFrom(localFilePath, remoteFilePath);
      return true;
    } catch (error: any) {
      console.error(`Failed to upload ${localFilePath}:`, error);
      return false;
    } finally {
      client.close();
    }
  }

  /**
   * Imports property data from a CSV file on the FTP server
   * @param remoteFilePath Path to the CSV file on the FTP server
   * @returns Import result
   */
  async importPropertiesFromFtp(remoteFilePath: string): Promise<FtpImportResult> {
    // Create a temporary local file path
    const tempDir = './uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = path.basename(remoteFilePath);
    const localFilePath = path.join(tempDir, filename);

    try {
      // Download the file
      const downloadSuccess = await this.downloadFile(remoteFilePath, localFilePath);
      if (!downloadSuccess) {
        throw new Error(`Failed to download file from ${remoteFilePath}`);
      }

      // Import the CSV file
      const importResult = await this.importService.importPropertiesFromCSV(localFilePath);

      return {
        filename,
        importResult,
      };
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }

  /**
   * Stages property data from a CSV file on the FTP server for review
   * @param remoteFilePath Path to the CSV file on the FTP server
   * @returns Staging result
   */
  async stagePropertiesFromFtp(remoteFilePath: string): Promise<any> {
    // Create a temporary local file path
    const tempDir = './uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = path.basename(remoteFilePath);
    const localFilePath = path.join(tempDir, filename);

    try {
      // Download the file
      const downloadSuccess = await this.downloadFile(remoteFilePath, localFilePath);
      if (!downloadSuccess) {
        throw new Error(`Failed to download file from ${remoteFilePath}`);
      }

      // Stage the CSV file
      const stagingResult = await this.importService.stagePropertiesFromCSV(localFilePath);

      return {
        filename,
        stagingResult,
      };
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }

  /**
   * Exports properties to a CSV file and uploads it to the FTP server
   * @param remoteFilePath Path where the file should be saved on the FTP server
   * @param propertyIds Optional array of property IDs to export (if not provided, exports all)
   * @returns Export result
   */
  async exportPropertiesToFtp(
    remoteFilePath: string,
    propertyIds?: string[]
  ): Promise<FtpExportResult> {
    // Create a temporary local file path
    const tempDir = './uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = path.basename(remoteFilePath);
    const localFilePath = path.join(tempDir, filename);

    try {
      // Get properties to export
      const properties = propertyIds
        ? await Promise.all(propertyIds.map(id => this.storage.getProperty(parseInt(id))))
        : await this.storage.getAllProperties();

      // Filter out undefined properties (in case some IDs don't exist)
      const validProperties = properties.filter((p: any) => p !== undefined);

      // Create CSV content
      const csvContent = this.generateCsvContent(validProperties);

      // Write to temporary file
      fs.writeFileSync(localFilePath, csvContent);

      // Upload the file
      const uploadSuccess = await this.uploadFile(localFilePath, remoteFilePath);
      if (!uploadSuccess) {
        throw new Error(`Failed to upload file to ${remoteFilePath}`);
      }

      return {
        filename,
        recordCount: validProperties.length,
        success: true,
      };
    } catch (error: any) {
      return {
        filename,
        recordCount: 0,
        success: false,
        errorMessage: error.message,
      };
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }

  /**
   * Generates CSV content from property data
   * @param properties Array of property objects
   * @returns CSV string
   */
  private generateCsvContent(properties: any[]): string {
    if (properties.length === 0) {
      return 'propertyId,address,parcelNumber,propertyType,status,acres,value\n';
    }

    // Gather all possible columns from the properties and their extraFields
    const standardColumns = [
      'propertyId',
      'address',
      'parcelNumber',
      'propertyType',
      'status',
      'acres',
      'value',
    ];
    const extraFieldsSet = new Set<string>();

    // Collect all extraFields keys
    properties.forEach(property => {
      if (property.extraFields) {
        Object.keys(property.extraFields).forEach(key => extraFieldsSet.add(key));
      }
    });

    const extraFieldsColumns = Array.from(extraFieldsSet);
    const allColumns = [...standardColumns, ...extraFieldsColumns];

    // Generate the header row
    let csv = allColumns.join(',') + '\n';

    // Generate each data row
    properties.forEach(property => {
      const row = allColumns.map(column => {
        if (standardColumns.includes(column)) {
          // Handle standard fields
          return property[column] !== null && property[column] !== undefined
            ? `"${String(property[column]).replace(/"/g, '""')}"`
            : '';
        } else {
          // Handle extraFields
          const value = property.extraFields && property.extraFields[column];
          return value !== null && value !== undefined
            ? `"${String(value).replace(/"/g, '""')}"`
            : '';
        }
      });

      csv += row.join(',') + '\n';
    });

    return csv;
  }
}
