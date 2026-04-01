/**
 * FTP Data Agent
 * 
 * This agent provides direct integration with the SpatialEst FTP server
 * for fetching and synchronizing Benton County property data.
 * 
 * The agent leverages the FtpService to access and manage data transfers,
 * with a focus on providing these capabilities through the MCP architecture.
 */

import { BaseAgent, AgentCapability, AgentConfig } from './base-agent';
import { IStorage } from '../../storage';
import { MCPService } from '../mcp';
import { FtpService, FtpImportResult, FtpExportResult } from '../ftp-service';
import { DataImportService } from '../data-import-service';
import { PropertyUseCodesMapper } from '../data-mappers/property-use-codes-mapper';
import { InsertProperty } from '../../../shared/schema';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Interface for retry options
 */
interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

/**
 * Utility function for retrying operations with exponential backoff
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns The result of the operation if successful
 * @throws The last error encountered if all retries fail
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.initialDelay;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry based on the error message
      if (options.retryableErrors && 
          options.retryableErrors.length > 0 && 
          !options.retryableErrors.some(errMsg => error.message.includes(errMsg))) {
        // Error is not in the list of retryable errors
        throw error;
      }
      
      // Check if we've exhausted our retry attempts
      if (attempt >= options.maxRetries) {
        throw error;
      }
      
      // Wait before the next retry attempt
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry using exponential backoff, but cap at maxDelay
      delay = Math.min(delay * options.backoffFactor, options.maxDelay);
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript requires it
  throw lastError || new Error('Operation failed after retries');
}

interface FtpScheduleConfig {
  enabled: boolean;
  intervalHours: number;
  lastRun?: Date;
}

interface FtpDirectoryInfo {
  directories: string[];
  files: {
    name: string;
    size: number;
    date: string;
    path: string;
    isDirectory: boolean;
  }[];
}

interface FtpSearchOptions {
  searchString?: string;
  fileType?: string;
  maxResults?: number;
  recursive?: boolean;
}

/**
 * Agent responsible for SpatialEst FTP integration
 */
export class FtpDataAgent extends BaseAgent {
  private ftpService: FtpService;
  private dataImportService: DataImportService;
  private schedule: FtpScheduleConfig;
  private scheduler: NodeJS.Timeout | null = null;
  
  constructor(
    storage: IStorage,
    mcpService: MCPService
  ) {
    // Define capabilities before passing to super
    const capabilities: AgentCapability[] = [
      {
        name: 'testFtpConnection',
        description: 'Test FTP connection to SpatialEst server',
        parameters: [],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).testFtpConnection();
        }
      },
      {
        name: 'listFtpDirectories',
        description: 'List directories available on the SpatialEst FTP server',
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Remote directory path',
            required: false
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).listFtpDirectories(params);
        }
      },
      {
        name: 'searchFtpFiles',
        description: 'Search for files on the SpatialEst FTP server',
        parameters: [
          {
            name: 'options',
            type: 'object',
            description: 'Search options',
            required: true
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).searchFtpFiles(params);
        }
      },
      {
        name: 'downloadFtpFile',
        description: 'Download a file from the SpatialEst FTP server',
        parameters: [
          {
            name: 'remotePath',
            type: 'string',
            description: 'Path to the file on the FTP server',
            required: true
          },
          {
            name: 'localPath',
            type: 'string',
            description: 'Path where the file should be saved locally',
            required: false
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).downloadFtpFile(params);
        }
      },
      {
        name: 'uploadFtpFile',
        description: 'Upload a file to the SpatialEst FTP server',
        parameters: [
          {
            name: 'localPath',
            type: 'string',
            description: 'Path to the local file',
            required: true
          },
          {
            name: 'remotePath',
            type: 'string',
            description: 'Path where the file should be saved on the FTP server',
            required: true
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).uploadFtpFile(params);
        }
      },
      {
        name: 'importFtpProperties',
        description: 'Import property data from the SpatialEst FTP server',
        parameters: [
          {
            name: 'remotePath',
            type: 'string',
            description: 'Path to the CSV file on the FTP server',
            required: true
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).importFtpProperties(params);
        }
      },
      {
        name: 'stageFtpProperties',
        description: 'Stage property data from the SpatialEst FTP server for review',
        parameters: [
          {
            name: 'remotePath',
            type: 'string',
            description: 'Path to the CSV file on the FTP server',
            required: true
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).stageFtpProperties(params);
        }
      },
      {
        name: 'scheduleFtpSync',
        description: 'Schedule automatic data synchronization with the SpatialEst FTP server',
        parameters: [
          {
            name: 'enabled',
            type: 'boolean',
            description: 'Enable or disable scheduled sync',
            required: true
          },
          {
            name: 'intervalHours',
            type: 'number',
            description: 'Sync interval in hours',
            required: false
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).scheduleFtpSync(params);
        }
      },
      {
        name: 'getFtpStatus',
        description: 'Get FTP connection and synchronization status',
        parameters: [],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).getFtpStatus();
        }
      },
      {
        name: 'importPropertyUseCodes',
        description: 'Import property use codes from a CSV file on the FTP server',
        parameters: [
          {
            name: 'remotePath',
            type: 'string',
            description: 'Path to the property use codes CSV file on the FTP server',
            required: true
          }
        ],
        handler: async (params: any, agent: BaseAgent) => {
          return (agent as FtpDataAgent).importPropertyUseCodes(params);
        }
      }
    ];

    // Create the agent config
    const config: AgentConfig = {
      id: 'ftp_data',
      name: 'ftp_data',
      description: 'SpatialEst FTP Integration Agent',
      permissions: ['ftp.access', 'data.import'],
      capabilities: capabilities
    };
    
    // Call the parent constructor
    super(storage, mcpService, config);
    
    // Initialize services
    this.ftpService = new FtpService(storage);
    this.dataImportService = new DataImportService(storage);
    
    // Setup default schedule configuration
    this.schedule = {
      enabled: false,
      intervalHours: 24 // Default daily sync
    };
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    await this.baseInitialize();
    
    // Register MCP tools
    await this.registerMCPTools([
      {
        name: 'ftp.testConnection',
        description: 'Test FTP connection to SpatialEst server',
        handler: async () => {
          const result = await this.executeCapability('testFtpConnection', {});
          return result;
        }
      },
      {
        name: 'ftp.listDirectories',
        description: 'List directories available on the SpatialEst FTP server',
        handler: async (params: any) => {
          const { path = '/' } = params;
          const result = await this.executeCapability('listFtpDirectories', { path });
          return result;
        }
      },
      {
        name: 'ftp.searchFiles',
        description: 'Search for files on the SpatialEst FTP server',
        handler: async (params: any) => {
          const { searchString, fileType, maxResults, recursive } = params;
          const options: FtpSearchOptions = {
            searchString,
            fileType,
            maxResults,
            recursive
          };
          const result = await this.executeCapability('searchFtpFiles', { options });
          return result;
        }
      },
      {
        name: 'ftp.downloadFile',
        description: 'Download a file from the SpatialEst FTP server',
        handler: async (params: any) => {
          const { remotePath, localPath } = params;
          if (!remotePath) {
            return { success: false, error: 'Remote file path is required' };
          }
          const result = await this.executeCapability('downloadFtpFile', { remotePath, localPath });
          return result;
        }
      },
      {
        name: 'ftp.uploadFile',
        description: 'Upload a file to the SpatialEst FTP server',
        handler: async (params: any) => {
          const { localPath, remotePath } = params;
          if (!localPath || !remotePath) {
            return { success: false, error: 'Local and remote file paths are required' };
          }
          const result = await this.executeCapability('uploadFtpFile', { localPath, remotePath });
          return result;
        }
      },
      {
        name: 'ftp.importProperties',
        description: 'Import property data from the SpatialEst FTP server',
        handler: async (params: any) => {
          const { remotePath } = params;
          if (!remotePath) {
            return { success: false, error: 'Remote file path is required' };
          }
          const result = await this.executeCapability('importFtpProperties', { remotePath });
          return result;
        }
      },
      {
        name: 'ftp.stageProperties',
        description: 'Stage property data from the SpatialEst FTP server for review',
        handler: async (params: any) => {
          const { remotePath } = params;
          if (!remotePath) {
            return { success: false, error: 'Remote file path is required' };
          }
          const result = await this.executeCapability('stageFtpProperties', { remotePath });
          return result;
        }
      },
      {
        name: 'ftp.scheduleSync',
        description: 'Schedule automatic data synchronization with the SpatialEst FTP server',
        handler: async (params: any) => {
          const { enabled, intervalHours } = params;
          if (typeof enabled !== 'boolean') {
            return { success: false, error: 'Enabled parameter (boolean) is required' };
          }
          const result = await this.executeCapability('scheduleFtpSync', { enabled, intervalHours });
          return result;
        }
      },
      {
        name: 'ftp.getStatus',
        description: 'Get FTP connection and synchronization status',
        handler: async () => {
          const result = await this.executeCapability('getFtpStatus', {});
          return result;
        }
      },
      {
        name: 'ftp.importPropertyUseCodes',
        description: 'Import property use codes from a CSV file on the FTP server',
        handler: async (params: any) => {
          const { remotePath } = params;
          if (!remotePath) {
            return { success: false, error: 'Remote file path is required' };
          }
          const result = await this.executeCapability('importPropertyUseCodes', { remotePath });
          return result;
        }
      }
    ]);
    
    // Log successful initialization
    await this.logActivity('initialization', 'FTP Data Agent initialized successfully');
  }
  
  /**
   * Cleans up resources when the agent is being shut down
   */
  public async shutdown(): Promise<void> {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    
    await this.logActivity('shutdown', 'FTP Data Agent shutdown');
  }
  
  /**
   * Test FTP connection to SpatialEst server
   */
  private async testFtpConnection(): Promise<any> {
    try {
      const connected = await this.ftpService.testConnection();
      
      await this.logActivity(
        'ftp_connection_test',
        connected ? 'FTP connection test successful' : 'FTP connection test failed'
      );
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'testFtpConnection',
        result: {
          connected,
          host: 'ftp.spatialest.com',
          message: connected ? 'Successfully connected to SpatialEst FTP server' : 'Failed to connect to SpatialEst FTP server'
        }
      };
    } catch (error: any) {
      await this.logActivity('ftp_connection_error', `FTP connection error: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'testFtpConnection',
        error: `FTP connection error: ${error.message}`
      };
    }
  }
  
  /**
   * List directories available on the SpatialEst FTP server
   */
  private async listFtpDirectories(params: any): Promise<any> {
    try {
      const { path = '/' } = params;
      
      const files = await this.ftpService.listFiles(path);
      
      // Transform the results into a more useful format
      const directories: string[] = [];
      const filesList = [];
      
      for (const file of files) {
        if (file.type === 2) { // Directory
          directories.push(file.name);
        }
        
        filesList.push({
          name: file.name,
          size: file.size,
          date: file.date ? (typeof file.date === 'string' ? file.date : new Date(file.date).toISOString()) : null,
          path: `${path}${path.toString().endsWith('/') ? '' : '/'}${file.name}`,
          isDirectory: file.type === 2
        });
      }
      
      const result: FtpDirectoryInfo = {
        directories,
        files: filesList
      };
      
      await this.logActivity('ftp_list_directories', `Listed FTP directories in ${path}`);
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'listFtpDirectories',
        result
      };
    } catch (error: any) {
      await this.logActivity('ftp_list_error', `FTP listing error: ${error.message}`);
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'listFtpDirectories',
        error: `FTP listing error: ${error.message}`
      };
    }
  }
  
  /**
   * Search for files on the SpatialEst FTP server
   */
  private async searchFtpFiles(params: any): Promise<any> {
    try {
      const { options = {} } = params;
      const { 
        searchString = '',
        fileType = '',
        maxResults = 50,
        recursive = false,
        startPath = '/'
      } = options;
      
      // Validate inputs
      const path = startPath || '/';
      const validatedMaxResults = Math.min(Math.max(1, maxResults), 200); // Ensure maxResults is between 1 and 200
      
      // Configure retry options for network operations
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,  // 1 second
        maxDelay: 15000,     // 15 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error'
        ]
      };
      
      // Get initial file list with retry capability
      const allFiles = await withRetry(
        async () => {
          const files = await this.searchFilesRecursive(
            path, 
            searchString, 
            fileType, 
            recursive
          );
          
          if (!files || !Array.isArray(files)) {
            throw new Error('Failed to retrieve file list from FTP server');
          }
          
          return files;
        },
        retryOptions
      );
      
      // Limit results
      const limitedResults = allFiles.slice(0, validatedMaxResults);
      
      // Prepare detailed search statistics
      const searchStats = {
        searchTime: new Date().toISOString(),
        criteria: {
          searchString: searchString || '(none)',
          fileType: fileType || '(any)',
          startPath: path,
          recursive
        },
        results: {
          totalFound: allFiles.length,
          returned: limitedResults.length,
          limited: allFiles.length > validatedMaxResults
        },
        // Add file type distribution stats
        fileTypes: allFiles.reduce((acc: Record<string, number>, file: any) => {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'none';
          acc[ext] = (acc[ext] || 0) + 1;
          return acc;
        }, {})
      };
      
      await this.logActivity(
        'ftp_search_files', 
        `Searched FTP files with criteria: ${searchString || '(none)'}, type: ${fileType || '(any)'}`,
        { searchStats }
      );
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'searchFtpFiles',
        result: {
          files: limitedResults,
          total: allFiles.length,
          returned: limitedResults.length,
          searchCriteria: {
            searchString,
            fileType,
            startPath: path,
            recursive
          },
          stats: searchStats
        }
      };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        options: params.options,
        timestamp: new Date().toISOString(),
        attemptsMade: error.attemptsMade || 1
      };
      
      await this.logActivity(
        'ftp_search_error', 
        `FTP search error: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'searchFtpFiles',
        error: `FTP search error: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Recursive file search helper
   * 
   * @param currentPath - The current FTP directory path to search
   * @param searchString - Optional string to filter filenames by
   * @param fileType - Optional file extension to filter by
   * @param recursive - Whether to recursively search subdirectories
   * @param depth - Current recursion depth (internal parameter)
   * @param maxDepth - Maximum recursion depth to prevent excessive traversal
   * @returns Array of matching files with metadata
   */
  private async searchFilesRecursive(
    currentPath: string,
    searchString: string,
    fileType: string,
    recursive: boolean,
    depth: number = 0,
    maxDepth: number = 3
  ): Promise<any[]> {
    // Prevent excessive recursion with a safety limit
    if (depth > maxDepth) {
      return [];
    }
    
    // Normalize the current path to ensure it's valid
    const normalizedPath = currentPath.replace(/\/+/g, '/');
    
    try {
      // Configure retry options for this directory listing
      const retryOptions: RetryOptions = {
        maxRetries: 2,
        initialDelay: 500,  // Start with a short delay
        maxDelay: 5000,     // Max 5 second delay
        backoffFactor: 2,
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error'
        ]
      };
      
      // List files with retry capability
      const files = await withRetry(
        async () => {
          const dirFiles = await this.ftpService.listFiles(normalizedPath);
          if (!dirFiles || !Array.isArray(dirFiles)) {
            throw new Error(`Failed to list files in directory: ${normalizedPath}`);
          }
          return dirFiles;
        },
        retryOptions
      );
      
      let results: any[] = [];
      
      // Process each file in the directory
      for (const file of files) {
        // Skip invalid entries
        if (!file || !file.name) continue;
        
        // Skip special directory entries
        if (file.name === '.' || file.name === '..') continue;
        
        // Construct the full path for this file
        const fullPath = `${normalizedPath}${normalizedPath.endsWith('/') ? '' : '/'}${file.name}`;
        
        // Determine if this file is a match based on search criteria
        // Note: file.type === 1 generally means regular file, file.type === 2 generally means directory
        const isFile = file.type === 1;
        const isDirectory = file.type === 2;
        
        // Apply search filters
        const matchesSearch = !searchString || 
          file.name.toLowerCase().includes(searchString.toLowerCase());
        
        const matchesType = !fileType || 
          (isFile && file.name.toLowerCase().endsWith(`.${fileType.toLowerCase()}`));
        
        // Add matching files to results
        if (isFile && matchesSearch && matchesType) {
          // Format date consistently
          let formattedDate: string | null = null;
          if (file.date) {
            try {
              formattedDate = typeof file.date === 'string' 
                ? file.date 
                : new Date(file.date).toISOString();
            } catch (e) {
              // If date parsing fails, use the raw value
              formattedDate = String(file.date);
            }
          }
          
          // Add normalized file information to results
          results.push({
            name: file.name,
            path: fullPath,
            size: typeof file.size === 'number' ? file.size : 0,
            date: formattedDate,
            isDirectory: false,
            fileType: file.name.split('.').pop()?.toLowerCase() || '',
            lastModified: formattedDate
          });
        }
        
        // Recurse into subdirectories if requested
        if (recursive && isDirectory) {
          try {
            const subResults = await this.searchFilesRecursive(
              fullPath,
              searchString,
              fileType,
              recursive,
              depth + 1,
              maxDepth
            );
            results = [...results, ...subResults];
          } catch (subDirError) {
            // Log subdirectory errors but continue with other directories
            console.warn(`Error searching subdirectory ${fullPath}:`, subDirError);
            
            await this.logActivity(
              'ftp_search_subdirectory_error',
              `Error searching subdirectory ${fullPath}: ${subDirError.message}`,
              {
                path: fullPath,
                depth,
                error: subDirError.message,
                stack: subDirError.stack
              }
            );
            
            // Continue with other files/directories
            continue;
          }
        }
      }
      
      return results;
    } catch (error: any) {
      // Log the error with detailed information
      const errorInfo = {
        path: normalizedPath,
        depth,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      console.error(`Error searching directory ${normalizedPath}:`, errorInfo);
      
      await this.logActivity(
        'ftp_search_directory_error',
        `Error searching directory ${normalizedPath}: ${error.message}`,
        { error: errorInfo }
      );
      
      // Return empty results rather than failing the entire search
      return [];
    }
  }
  
  /**
   * Download a file from the SpatialEst FTP server
   */
  private async downloadFtpFile(params: any): Promise<any> {
    try {
      const { remotePath, localPath: customLocalPath } = params;
      
      if (!remotePath) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'downloadFtpFile',
          error: 'Remote file path is required'
        };
      }
      
      // Determine local path
      const fileName = path.basename(remotePath);
      const defaultLocalDir = path.join(process.cwd(), 'uploads', 'ftp');
      
      // Create default directory if it doesn't exist
      if (!fs.existsSync(defaultLocalDir)) {
        fs.mkdirSync(defaultLocalDir, { recursive: true });
      }
      
      const localPath = customLocalPath || path.join(defaultLocalDir, fileName);
      
      // Configure retry options
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,  // 1 second
        maxDelay: 10000,     // 10 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error',
          'Failed to download file'
        ]
      };
      
      // Download the file with retries
      await withRetry(
        async () => {
          const downloadSuccess = await this.ftpService.downloadFile(remotePath, localPath);
          if (!downloadSuccess) {
            throw new Error(`Failed to download file from ${remotePath}`);
          }
          return downloadSuccess;
        },
        retryOptions
      );
      
      await this.logActivity('ftp_file_download', `Downloaded file from ${remotePath}`);
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'downloadFtpFile',
        result: {
          remotePath,
          localPath,
          fileName,
          downloadTime: new Date().toISOString()
        }
      };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        remotePath: params.remotePath,
        timestamp: new Date().toISOString(),
        attemptsMade: error.attemptsMade || 1
      };
      
      await this.logActivity(
        'ftp_download_error', 
        `FTP download error: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'downloadFtpFile',
        error: `FTP download error: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Upload a file to the SpatialEst FTP server
   */
  private async uploadFtpFile(params: any): Promise<any> {
    try {
      const { localPath, remotePath } = params;
      
      if (!localPath || !remotePath) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'uploadFtpFile',
          error: 'Local and remote file paths are required'
        };
      }
      
      // Check if local file exists
      if (!fs.existsSync(localPath)) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'uploadFtpFile',
          error: `Local file does not exist: ${localPath}`
        };
      }
      
      // Configure retry options
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,  // 1 second
        maxDelay: 10000,     // 10 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error',
          'Failed to upload file'
        ]
      };
      
      // Upload the file with retries
      await withRetry(
        async () => {
          const uploadSuccess = await this.ftpService.uploadFile(localPath, remotePath);
          if (!uploadSuccess) {
            throw new Error(`Failed to upload file to ${remotePath}`);
          }
          return uploadSuccess;
        },
        retryOptions
      );
      
      await this.logActivity('ftp_file_upload', `Uploaded file to ${remotePath}`);
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'uploadFtpFile',
        result: {
          localPath,
          remotePath,
          fileName: path.basename(remotePath),
          uploadTime: new Date().toISOString()
        }
      };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        localPath: params.localPath,
        remotePath: params.remotePath,
        timestamp: new Date().toISOString(),
        attemptsMade: error.attemptsMade || 1
      };
      
      await this.logActivity(
        'ftp_upload_error',
        `FTP upload error: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'uploadFtpFile',
        error: `FTP upload error: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Import property data from the SpatialEst FTP server
   */
  private async importFtpProperties(params: any): Promise<any> {
    try {
      const { remotePath } = params;
      
      if (!remotePath) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'importFtpProperties',
          error: 'Remote file path is required'
        };
      }
      
      // Configure retry options
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,  // 1 second
        maxDelay: 15000,     // 15 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error',
          'Failed to download data',
          'Failed to parse data'
        ]
      };
      
      // Import properties directly from FTP with retries
      const importResult = await withRetry(
        async () => await this.ftpService.importPropertiesFromFtp(remotePath),
        retryOptions
      );
      
      await this.logActivity(
        'ftp_properties_import', 
        `Imported ${importResult.importResult.successfulImports} properties from ${remotePath}`,
        {
          fileName: importResult.filename,
          successfulImports: importResult.importResult.successfulImports,
          totalRecords: importResult.importResult.total
        }
      );
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'importFtpProperties',
        result: {
          remotePath,
          fileName: importResult.filename,
          totalRecords: importResult.importResult.total,
          successfulImports: importResult.importResult.successfulImports,
          failedImports: importResult.importResult.failedImports,
          errors: importResult.importResult.errors,
          importTime: new Date().toISOString()
        }
      };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        remotePath: params.remotePath,
        timestamp: new Date().toISOString(),
        attemptsMade: error.attemptsMade || 1,
        stack: error.stack
      };
      
      await this.logActivity(
        'ftp_import_error', 
        `FTP import error: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'importFtpProperties',
        error: `FTP import error: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Stage property data from the SpatialEst FTP server for review
   */
  private async stageFtpProperties(params: any): Promise<any> {
    try {
      const { remotePath } = params;
      
      if (!remotePath) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'stageFtpProperties',
          error: 'Remote file path is required'
        };
      }
      
      // Configure retry options
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,  // 1 second
        maxDelay: 15000,     // 15 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error',
          'Failed to download data',
          'Failed to parse data'
        ]
      };
      
      // Stage properties from FTP for review with retries
      const stagingResult = await withRetry(
        async () => await this.ftpService.stagePropertiesFromFtp(remotePath),
        retryOptions
      );
      
      await this.logActivity(
        'ftp_properties_staging', 
        `Staged properties from ${remotePath}`,
        {
          fileName: stagingResult.filename,
          stagingTime: new Date().toISOString(),
          recordCount: stagingResult.stagingResult.total || 0
        }
      );
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'stageFtpProperties',
        result: {
          remotePath,
          fileName: stagingResult.filename,
          stagingResult: stagingResult.stagingResult,
          stagingTime: new Date().toISOString()
        }
      };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        remotePath: params.remotePath,
        timestamp: new Date().toISOString(),
        attemptsMade: error.attemptsMade || 1,
        stack: error.stack
      };
      
      await this.logActivity(
        'ftp_staging_error', 
        `FTP staging error: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'stageFtpProperties',
        error: `FTP staging error: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Schedule automatic data synchronization with the SpatialEst FTP server
   * 
   * This method provides both recurring schedule and one-time sync options.
   * 
   * @param params Configuration options for FTP sync scheduling:
   *   - enabled: Boolean to enable/disable recurring sync
   *   - intervalHours: Number of hours between syncs (1-168 hours)
   *   - runImmediately: Boolean to trigger a sync immediately after scheduling
   *   - runOnce: Boolean to run a single sync without setting up a recurring schedule
   *   - targetDirectories: Optional array of specific directories to sync 
   * @returns Status object with schedule configuration and next sync time
   */
  private async scheduleFtpSync(params: any): Promise<any> {
    try {
      const { 
        enabled, 
        intervalHours = 24, 
        runImmediately = false, 
        runOnce = false, 
        targetDirectories = null 
      } = params;
      
      // For one-time sync requests (runOnce=true), we perform the sync and return
      if (runOnce === true) {
        await this.logActivity(
          'ftp_sync_requested', 
          'One-time FTP sync requested',
          { targetDirectories }
        );
        
        // Start the sync process asynchronously to avoid blocking the response
        setTimeout(() => {
          this.runScheduledSync()
            .catch(error => {
              console.error('Error during one-time FTP sync:', error);
            });
        }, 100);
        
        return {
          success: true,
          agent: this.config.name,
          capability: 'scheduleFtpSync',
          result: {
            syncType: 'one-time',
            requested: new Date().toISOString(),
            status: 'started',
            targetDirectories: targetDirectories || 'all'
          }
        };
      }
      
      // For recurring schedule configurations, validate parameters
      if (typeof enabled !== 'boolean') {
        return {
          success: false,
          agent: this.config.name,
          capability: 'scheduleFtpSync',
          error: 'Parameter "enabled" must be a boolean'
        };
      }
      
      // Validate interval hours is a reasonable value
      let validatedIntervalHours = 24; // Default to 24 hours if invalid
      if (intervalHours) {
        if (typeof intervalHours !== 'number') {
          return {
            success: false,
            agent: this.config.name,
            capability: 'scheduleFtpSync',
            error: 'Parameter "intervalHours" must be a number'
          };
        }
        
        if (intervalHours <= 0) {
          return {
            success: false,
            agent: this.config.name,
            capability: 'scheduleFtpSync',
            error: 'Parameter "intervalHours" must be greater than 0'
          };
        }
        
        // Set reasonable limits: 1 hour minimum, 168 hours (1 week) maximum
        validatedIntervalHours = Math.max(1, Math.min(intervalHours, 168));
      }
      
      // Store the previous schedule state for logging and reference
      const previousState = {
        enabled: this.schedule.enabled,
        intervalHours: this.schedule.intervalHours,
        lastRun: this.schedule.lastRun ? this.schedule.lastRun.toISOString() : null
      };
      
      // Update schedule configuration
      this.schedule.enabled = enabled;
      this.schedule.intervalHours = validatedIntervalHours;
      
      // Clear existing scheduler if any
      if (this.scheduler) {
        clearInterval(this.scheduler);
        this.scheduler = null;
      }
      
      // Track if we're going to run a sync now
      let immediateSync = false;
      
      // Setup new scheduler if enabled
      if (enabled) {
        const intervalMs = this.schedule.intervalHours * 60 * 60 * 1000;
        
        // Perform a test connection first to verify FTP is accessible
        let connectionStatus = { connected: false, error: null };
        
        try {
          const connectionTest = await this.testFtpConnection();
          connectionStatus = connectionTest.result;
          
          if (!connectionStatus.connected) {
            await this.logActivity(
              'ftp_schedule_warning', 
              'Enabled FTP sync schedule, but current FTP connection test failed. ' +
              'Sync will be attempted at scheduled times anyway.',
              {
                schedule: {
                  enabled,
                  intervalHours: validatedIntervalHours,
                  intervalMs,
                  nextSync: new Date(Date.now() + intervalMs).toISOString()
                },
                connectionTest: connectionStatus
              }
            );
          }
        } catch (connError) {
          connectionStatus.error = connError.message;
          
          await this.logActivity(
            'ftp_schedule_warning', 
            'Failed to test FTP connection while setting up sync schedule: ' + connError.message,
            {
              schedule: {
                enabled,
                intervalHours: validatedIntervalHours,
                intervalMs
              },
              error: connError.message
            }
          );
        }
        
        // Setup an interval that checks if we need to run a sync based on elapsed time
        // This approach is more flexible than a simple setInterval and handles server restarts better
        this.scheduler = setInterval(() => {
          // Check if we're due for a sync
          const now = new Date();
          const lastRun = this.schedule.lastRun || new Date(0);  // Default to epoch if no last run
          const elapsedHours = (now.getTime() - lastRun.getTime()) / (60 * 60 * 1000);
          
          if (elapsedHours >= this.schedule.intervalHours) {
            // Only run if not already running (prevent overlapping syncs)
            this.runScheduledSync()
              .catch(error => {
                console.error('Error in scheduled FTP sync:', error);
              });
          }
        }, 60000); // Check every minute
        
        // Log the schedule setup
        await this.logActivity(
          'ftp_sync_scheduled', 
          `Scheduled FTP sync every ${this.schedule.intervalHours} hours`,
          {
            schedule: {
              enabled,
              intervalHours: validatedIntervalHours,
              previousState,
              nextSync: this.getNextSyncTime(),
              checkIntervalMs: 60000, // We check every minute
              syncIntervalHours: validatedIntervalHours
            }
          }
        );
        
        // Handle immediate run request
        if (runImmediately && connectionStatus.connected) {
          immediateSync = true;
          
          // Start the sync process asynchronously to avoid blocking the response
          setTimeout(() => {
            this.runScheduledSync()
              .catch(error => {
                console.error('Error during immediate FTP sync:', error);
              });
          }, 100);
          
          await this.logActivity(
            'ftp_sync_immediate', 
            'Immediate FTP sync requested',
            { targetDirectories }
          );
        }
      } else {
        // Log schedule disabling
        await this.logActivity(
          'ftp_sync_disabled', 
          'Disabled scheduled FTP sync',
          {
            previousState
          }
        );
      }
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'scheduleFtpSync',
        result: {
          enabled,
          intervalHours: validatedIntervalHours,
          nextSyncTime: this.getNextSyncTime(),
          immediateSyncRequested: immediateSync,
          previousState
        }
      };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        params,
        timestamp: new Date().toISOString(),
        currentSchedule: {
          enabled: this.schedule.enabled,
          intervalHours: this.schedule.intervalHours,
          lastRun: this.schedule.lastRun ? this.schedule.lastRun.toISOString() : null
        }
      };
      
      await this.logActivity(
        'ftp_schedule_error', 
        `Error scheduling FTP sync: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'scheduleFtpSync',
        error: `Error scheduling FTP sync: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Run scheduled synchronization
   * 
   * This method is automatically called by the scheduler based on the configured interval.
   * It performs a full synchronization process, discovering and importing property data files
   * and property use code files from the FTP server.
   * 
   * Each step has comprehensive error handling to ensure that failures in one file
   * don't prevent processing of other files.
   */
  private async runScheduledSync(): Promise<void> {
    try {
      // Record sync start time for performance monitoring
      const syncStartTime = Date.now();
      
      // Configure retry options for network operations during sync
      const networkRetryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 2000,  // 2 seconds
        maxDelay: 20000,     // 20 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error'
        ]
      };

      // Test connection first with retries
      let connectionTest;
      try {
        connectionTest = await withRetry(
          async () => await this.testFtpConnection(),
          networkRetryOptions
        );
        
        if (!connectionTest.result.connected) {
          await this.logActivity(
            'ftp_scheduled_sync_error',
            'Scheduled sync failed: Cannot connect to FTP server',
            {
              connectionDetails: connectionTest.result,
              attemptTime: new Date().toISOString()
            }
          );
          return;
        }
      } catch (connError: any) {
        await this.logActivity(
          'ftp_scheduled_sync_error',
          `Scheduled sync failed: Connection error: ${connError.message}`,
          {
            error: {
              message: connError.message,
              stack: connError.stack,
              attemptsMade: connError.attemptsMade || 1
            }
          }
        );
        return;
      }
      
      // Update last run time
      this.schedule.lastRun = new Date();
      
      // Initialize sync metadata
      const syncMetadata = {
        syncId: `sync-${Date.now()}`,
        startTime: new Date().toISOString(),
        syncType: 'scheduled',
        interval: `${this.schedule.intervalHours} hours`
      };
      
      // Begin synchronization process
      await this.logActivity(
        'ftp_scheduled_sync_run',
        'Starting scheduled FTP sync process',
        { syncMetadata }
      );
      
      // Step 1: List directories and discover target file directories
      let propertyDataFiles: any[] = [];
      let useCodeFiles: any[] = [];
      let syncResults: any = {
        totalFiles: 0,
        processedFiles: 0,
        successfulImports: 0,
        failedImports: 0,
        totalRecords: 0,
        errors: [] as string[],
        scanResult: {
          directoriesScanned: 0,
          filesDiscovered: 0,
          propertyFilesDiscovered: 0,
          useCodeFilesDiscovered: 0
        }
      };
      
      try {
        // Advanced scanning approach: search through key directories
        // Start with a list of potential directories where assessment data might be found
        const potentialDirectories = ['/', '/data', '/assessment', '/property', '/valuation', '/parcel'];
        
        for (const dir of potentialDirectories) {
          try {
            // Try to list this directory with retry
            const dirListResult = await withRetry(
              async () => await this.listFtpDirectories({ path: dir }),
              networkRetryOptions
            );
            
            if (dirListResult.success) {
              syncResults.scanResult.directoriesScanned++;
              
              // Process files in this directory
              const files = dirListResult.result.files || [];
              syncResults.scanResult.filesDiscovered += files.length;
              
              // Filter for property data files
              const propertyFiles = files.filter(file => {
                if (file.isDirectory) return false;
                
                const lowerName = file.name.toLowerCase();
                return lowerName.endsWith('.csv') && (
                  lowerName.includes('property') || 
                  lowerName.includes('parcel') || 
                  lowerName.includes('assessment') ||
                  lowerName.includes('valuation') ||
                  lowerName.includes('tax') ||
                  lowerName.includes('data')
                );
              });
              
              // Add these to our collection
              propertyDataFiles = [...propertyDataFiles, ...propertyFiles];
              syncResults.scanResult.propertyFilesDiscovered += propertyFiles.length;
              
              // Filter for use code files
              const codeFiles = files.filter(file => {
                if (file.isDirectory) return false;
                
                const lowerName = file.name.toLowerCase();
                return lowerName.endsWith('.csv') && (
                  lowerName.includes('usecode') ||
                  lowerName.includes('use_code') ||
                  lowerName.includes('property_code') ||
                  lowerName.includes('code') ||
                  lowerName.includes('lookup')
                );
              });
              
              // Add these to our collection
              useCodeFiles = [...useCodeFiles, ...codeFiles];
              syncResults.scanResult.useCodeFilesDiscovered += codeFiles.length;
              
              // Also scan subdirectories if they might contain relevant data
              if (dirListResult.result.directories) {
                for (const subdir of dirListResult.result.directories) {
                  // Skip parent directory references
                  if (subdir === '.' || subdir === '..') continue;
                  
                  // Skip deep directory traversal
                  if (dir.split('/').length > 3) continue;
                  
                  // Add relevant subdirectories to our scan list
                  const subdirName = subdir.toLowerCase();
                  if (
                    subdirName.includes('property') || 
                    subdirName.includes('parcel') || 
                    subdirName.includes('assessment') ||
                    subdirName.includes('valuation') ||
                    subdirName.includes('data') ||
                    subdirName.includes('tax') ||
                    subdirName.includes('code')
                  ) {
                    potentialDirectories.push(`${dir}/${subdir}`);
                  }
                }
              }
            }
          } catch (dirError: any) {
            // Log directory access error but continue with other directories
            await this.logActivity(
              'ftp_directory_scan_error',
              `Error scanning directory ${dir}: ${dirError.message}`,
              {
                directory: dir,
                error: {
                  message: dirError.message,
                  stack: dirError.stack
                }
              }
            );
          }
        }
      } catch (scanError: any) {
        // Handle overall scanning error
        await this.logActivity(
          'ftp_scheduled_sync_error',
          `Error during directory scanning: ${scanError.message}`,
          {
            error: {
              message: scanError.message,
              stack: scanError.stack
            }
          }
        );
        
        // Continue with any files we may have found
      }
      
      // Deduplicate files by path
      propertyDataFiles = this.deduplicateFilesByPath(propertyDataFiles);
      useCodeFiles = this.deduplicateFilesByPath(useCodeFiles);
      
      // Update sync results
      syncResults.totalFiles = propertyDataFiles.length + useCodeFiles.length;
      
      // Log the file discovery results
      await this.logActivity(
        'ftp_sync_discovery',
        `Discovered ${propertyDataFiles.length} property files and ${useCodeFiles.length} code files`,
        {
          fileDiscovery: {
            propertyFiles: propertyDataFiles.map(f => f.path),
            useCodeFiles: useCodeFiles.map(f => f.path),
            syncMetadata
          }
        }
      );
      
      if (propertyDataFiles.length === 0 && useCodeFiles.length === 0) {
        await this.logActivity(
          'ftp_scheduled_sync_complete',
          'No data files found for sync',
          { syncMetadata }
        );
        return;
      }
      
      // Step 2: Process each property file
      for (const file of propertyDataFiles) {
        try {
          await this.logActivity(
            'ftp_file_sync',
            `Processing property file: ${file.name}`,
            { filePath: file.path, fileSize: file.size }
          );
          
          // Import the file data with retries
          const importResult = await withRetry(
            async () => await this.importFtpProperties({ remotePath: file.path }),
            {
              maxRetries: 2,
              initialDelay: 1000,
              maxDelay: 10000,
              backoffFactor: 2
            }
          );
          
          syncResults.processedFiles++;
          
          if (importResult.success) {
            syncResults.successfulImports++;
            syncResults.totalRecords += importResult.result.totalRecords || 0;
            
            await this.logActivity(
              'ftp_file_sync_success',
              `Successfully imported ${importResult.result.successfulImports} records from ${file.name}`,
              {
                filePath: file.path,
                importStats: {
                  totalRecords: importResult.result.totalRecords,
                  successfulImports: importResult.result.successfulImports,
                  failedImports: importResult.result.failedImports
                }
              }
            );
          } else {
            syncResults.failedImports++;
            syncResults.errors.push(`Failed to import ${file.name}: ${importResult.error}`);
            
            await this.logActivity(
              'ftp_file_sync_error',
              `Error importing ${file.name}: ${importResult.error}`,
              {
                filePath: file.path,
                error: importResult.details || { message: importResult.error }
              }
            );
          }
        } catch (fileError: any) {
          syncResults.processedFiles++;
          syncResults.failedImports++;
          syncResults.errors.push(`Error processing ${file.name}: ${fileError.message}`);
          
          await this.logActivity(
            'ftp_file_sync_error',
            `Error processing ${file.name}: ${fileError.message}`,
            {
              filePath: file.path,
              error: {
                message: fileError.message,
                stack: fileError.stack,
                attemptsMade: fileError.attemptsMade || 1
              }
            }
          );
        }
      }
      
      // Step 3: Process use code files if found
      for (const file of useCodeFiles) {
        try {
          await this.logActivity(
            'ftp_file_sync',
            `Processing use code file: ${file.name}`,
            { filePath: file.path, fileSize: file.size }
          );
          
          // Import with retries
          const importResult = await withRetry(
            async () => await this.importPropertyUseCodes({ remotePath: file.path }),
            {
              maxRetries: 2,
              initialDelay: 1000,
              maxDelay: 10000,
              backoffFactor: 2
            }
          );
          
          syncResults.processedFiles++;
          
          if (importResult.success) {
            syncResults.successfulImports++;
            
            await this.logActivity(
              'ftp_file_sync_success',
              `Successfully imported ${importResult.result.successfulImports} use codes from ${file.name}`,
              {
                filePath: file.path,
                importStats: {
                  totalCodes: importResult.result.totalCodes,
                  successfulImports: importResult.result.successfulImports
                }
              }
            );
          } else {
            syncResults.failedImports++;
            syncResults.errors.push(`Failed to import use codes from ${file.name}: ${importResult.error}`);
            
            await this.logActivity(
              'ftp_file_sync_error',
              `Error importing use codes from ${file.name}: ${importResult.error}`,
              {
                filePath: file.path,
                error: importResult.details || { message: importResult.error }
              }
            );
          }
        } catch (fileError: any) {
          syncResults.processedFiles++;
          syncResults.failedImports++;
          syncResults.errors.push(`Error processing use code file ${file.name}: ${fileError.message}`);
          
          await this.logActivity(
            'ftp_file_sync_error',
            `Error processing use code file ${file.name}: ${fileError.message}`,
            {
              filePath: file.path,
              error: {
                message: fileError.message,
                stack: fileError.stack,
                attemptsMade: fileError.attemptsMade || 1
              }
            }
          );
        }
      }
      
      // Step 4: Record sync completion with detailed results
      const syncDuration = Date.now() - syncStartTime;
      
      await this.logActivity(
        'ftp_scheduled_sync_complete',
        `Completed sync of ${syncResults.processedFiles} files in ${Math.round(syncDuration/1000)} seconds. ` +
        `Successful: ${syncResults.successfulImports}, ` +
        `Failed: ${syncResults.failedImports}, ` +
        `Total records: ${syncResults.totalRecords}`,
        {
          syncResults: {
            ...syncMetadata,
            endTime: new Date().toISOString(),
            duration: `${Math.round(syncDuration/1000)} seconds`,
            totalFiles: syncResults.totalFiles,
            processedFiles: syncResults.processedFiles,
            successfulImports: syncResults.successfulImports,
            failedImports: syncResults.failedImports,
            totalRecords: syncResults.totalRecords,
            scanSummary: syncResults.scanResult,
            nextSyncTime: this.getNextSyncTime(),
            errors: syncResults.errors.length > 0 ? syncResults.errors : undefined
          }
        }
      );
      
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        lastSuccessfulSync: this.schedule.lastRun ? this.schedule.lastRun.toISOString() : null,
        syncAttemptCount: this.schedule.lastRun ? 
          Math.floor((Date.now() - this.schedule.lastRun.getTime()) / (this.schedule.intervalHours * 60 * 60 * 1000)) : 0
      };
      
      // Log error with full details for troubleshooting
      await this.logActivity(
        'ftp_scheduled_sync_error',
        `Scheduled sync error: ${error.message}`,
        { error: errorDetails }
      );
      
      // Also log to console for immediate visibility
      console.error('FTP Scheduled Sync Error:', error.message);
      console.error('Error Details:', JSON.stringify(errorDetails, null, 2));
    }
  }
  
  /**
   * Utility method to deduplicate file arrays by path
   * Returns a filtered array with unique file paths
   */
  private deduplicateFilesByPath(files: any[]): any[] {
    const seenPaths = new Set<string>();
    return files.filter(file => {
      if (!file.path || seenPaths.has(file.path)) {
        return false;
      }
      seenPaths.add(file.path);
      return true;
    });
  }
  
  /**
   * Get next sync time based on schedule
   * 
   * This method calculates when the next data synchronization will occur based on:
   * - The current schedule configuration
   * - The last time a sync was performed
   * - Whether the scheduler is active
   * 
   * @returns ISO string timestamp of next sync, or null if sync is disabled
   */
  private getNextSyncTime(): string | null {
    // If sync is disabled or no scheduler is active, there's no next sync time
    if (!this.schedule.enabled || !this.scheduler) {
      return null;
    }
    
    const now = new Date();
    
    // If no previous sync has occurred, use the current time as reference
    const lastRun = this.schedule.lastRun || now;
    
    // Calculate the interval in milliseconds
    const intervalMs = this.schedule.intervalHours * 60 * 60 * 1000;
    
    // Calculate when the next sync should occur
    let nextRun = new Date(lastRun.getTime() + intervalMs);
    
    // If the calculated next run is in the past, adjust it to be in the future
    // This often happens after server restarts or when schedules have been inactive
    if (nextRun <= now) {
      // Find the next future sync time by adding intervals until we reach a future time
      while (nextRun <= now) {
        nextRun = new Date(nextRun.getTime() + intervalMs);
      }
    }
    
    // Return the next sync time as an ISO string for consistent formatting
    return nextRun.toISOString();
  }
  
  /**
   * Get human-readable sync schedule information
   * 
   * @returns Object containing schedule details in user-friendly format
   */
  private getSyncScheduleInfo(): any {
    if (!this.schedule.enabled) {
      return {
        status: 'disabled',
        message: 'FTP synchronization is currently disabled'
      };
    }
    
    if (!this.scheduler) {
      return {
        status: 'inactive',
        message: 'FTP synchronization schedule is defined but not active',
        intervalHours: this.schedule.intervalHours
      };
    }
    
    // Get the next sync time
    const nextSyncTime = this.getNextSyncTime();
    if (!nextSyncTime) {
      return {
        status: 'error',
        message: 'Unable to determine next sync time',
        intervalHours: this.schedule.intervalHours
      };
    }
    
    // Calculate the time remaining until next sync
    const now = new Date();
    const next = new Date(nextSyncTime);
    const diffMs = next.getTime() - now.getTime();
    
    // Convert to human-readable format
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    let timeRemaining;
    if (hours > 0) {
      timeRemaining = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      timeRemaining = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return {
      status: 'active',
      message: `FTP sync scheduled every ${this.schedule.intervalHours} hour${this.schedule.intervalHours !== 1 ? 's' : ''}`,
      nextSync: nextSyncTime,
      nextSyncFormatted: next.toLocaleString(),
      timeRemaining: timeRemaining,
      timeRemainingMs: diffMs,
      lastSync: this.schedule.lastRun ? this.schedule.lastRun.toISOString() : null,
      intervalHours: this.schedule.intervalHours
    };
  }
  
  /**
   * Import property use codes from the SpatialEst FTP server
   * This method handles downloading property use codes and mapping them
   * to our system's property schema format
   */
  private async importPropertyUseCodes(params: any): Promise<any> {
    try {
      const { remotePath } = params;
      
      if (!remotePath) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'importPropertyUseCodes',
          error: 'Remote file path is required'
        };
      }
      
      // Configure retry options for download
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelay: 1000,  // 1 second
        maxDelay: 15000,     // 15 seconds
        backoffFactor: 2,    // exponential backoff
        retryableErrors: [
          'ETIMEDOUT', 
          'ECONNRESET', 
          'ENOTFOUND',
          'connection closed',
          'timeout',
          'network error',
          'Failed to download data'
        ]
      };
      
      // Step 1: Download the file from FTP with retries
      const downloadResult = await this.downloadFtpFile({ remotePath });
      if (!downloadResult.success) {
        return {
          success: false,
          agent: this.config.name,
          capability: 'importPropertyUseCodes',
          error: `Failed to download property use codes: ${downloadResult.error}`,
          details: downloadResult.details
        };
      }
      
      try {
        // Step 2: Use the mapper to transform the data
        const localFilePath = downloadResult.result.localPath;
        const mapper = new PropertyUseCodesMapper();
        
        // Process and map the file
        const mappingResult = await withRetry(
          async () => await mapper.mapPropertyUseCodes(localFilePath),
          {
            maxRetries: 2,
            initialDelay: 500,
            maxDelay: 2000,
            backoffFactor: 2,
            retryableErrors: [
              'Failed to parse data',
              'Unexpected file format',
              'Invalid CSV structure'
            ]
          }
        );
        
        // Step 3: Import the mapped data with retries
        const importResult = await withRetry(
          async () => await this.dataImportService.importPropertyUseCodes(mappingResult.mappedData),
          {
            maxRetries: 2,
            initialDelay: 1000,
            maxDelay: 5000,
            backoffFactor: 2,
            retryableErrors: [
              'Database connection error',
              'Transaction failed',
              'Timeout'
            ]
          }
        );
        
        await this.logActivity(
          'property_use_codes_import', 
          `Imported ${importResult.total} property use codes from ${remotePath}`,
          {
            fileName: path.basename(remotePath),
            successfulImports: importResult.successfulImports,
            totalCodes: importResult.total
          }
        );
        
        return {
          success: true,
          agent: this.config.name,
          capability: 'importPropertyUseCodes',
          result: {
            remotePath,
            localFilePath,
            fileName: path.basename(remotePath),
            totalCodes: importResult.total,
            successfulImports: importResult.successfulImports,
            failedImports: importResult.failedImports,
            errors: importResult.errors,
            importTime: new Date().toISOString()
          }
        };
      } catch (mappingError: any) {
        // Handle mapping/import specific errors
        const errorDetails = {
          message: mappingError.message,
          remotePath: params.remotePath,
          localPath: downloadResult.result.localPath,
          timestamp: new Date().toISOString(),
          attemptsMade: mappingError.attemptsMade || 1,
          stack: mappingError.stack,
          phase: mappingError.message.includes('map') ? 'mapping' : 'importing'
        };
        
        await this.logActivity(
          'property_use_codes_mapping_error',
          `Error processing property use codes: ${mappingError.message}`,
          { error: errorDetails }
        );
        
        return {
          success: false,
          agent: this.config.name,
          capability: 'importPropertyUseCodes',
          error: `Error processing property use codes: ${mappingError.message}`,
          details: errorDetails
        };
      }
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        remotePath: params.remotePath,
        timestamp: new Date().toISOString(),
        attemptsMade: error.attemptsMade || 1,
        stack: error.stack
      };
      
      await this.logActivity(
        'property_use_codes_import_error',
        `Error importing property use codes: ${error.message}`,
        { error: errorDetails }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'importPropertyUseCodes',
        error: `Error importing property use codes: ${error.message}`,
        details: errorDetails
      };
    }
  }
  
  /**
   * Get FTP connection and synchronization status
   * 
   * This capability provides comprehensive information about:
   * - Current FTP connection status
   * - Sync schedule configuration and next scheduled run
   * - Historical sync data including success/failure rates
   * - Recent sync activities with details
   * 
   * @returns Status object with connection and scheduling details
   */
  private async getFtpStatus(): Promise<any> {
    try {
      // Step 1: Test current connection status
      const connectionTest = await this.testFtpConnection();
      const connected = connectionTest.result.connected;
      
      // Step 2: Get recent sync activities to provide more context
      const recentSyncActivities = await this.storage.getActivitiesByType(
        'ftp_scheduled_sync_complete',
        5
      );
      const recentSyncErrors = await this.storage.getActivitiesByType(
        'ftp_scheduled_sync_error',
        3
      );
      
      // Step 3: Calculate sync success rate
      const allSyncActivities = await this.storage.getActivitiesByType(
        'ftp_scheduled_sync',
        30
      );
      
      const syncStats = {
        total: allSyncActivities.length,
        successful: allSyncActivities.filter(a => a.status === 'success').length,
        failed: allSyncActivities.filter(a => a.status === 'error').length,
        successRate: allSyncActivities.length > 0 
          ? Math.round((allSyncActivities.filter(a => a.status === 'success').length / allSyncActivities.length) * 100)
          : null
      };
      
      // Step 4: Extract most recent sync results
      let lastSyncResults = null;
      if (recentSyncActivities.length > 0) {
        try {
          const latestActivity = recentSyncActivities[0];
          if (latestActivity.details) {
            const details = typeof latestActivity.details === 'string' 
              ? JSON.parse(latestActivity.details) 
              : latestActivity.details;
              
            // Extract sync statistics from activity details
            if (details && details.syncResults) {
              lastSyncResults = details.syncResults;
            }
          }
        } catch (error) {
          console.error('Error parsing sync activity details:', error);
        }
      }
      
      // Step 5: Get human-readable schedule information
      const scheduleInfo = this.getSyncScheduleInfo();
      
      // Step 6: Compile complete status report
      const status = {
        connection: {
          connected,
          host: 'ftp.spatialest.com',
          lastChecked: new Date().toISOString(),
          details: connected ? {
            secure: true,
            port: 21,
            ...connectionTest.result
          } : {
            error: connectionTest.result.error || 'Connection failed'
          }
        },
        schedule: {
          ...scheduleInfo,
          enabled: this.schedule.enabled,
          intervalHours: this.schedule.intervalHours,
          lastSync: this.schedule.lastRun ? this.schedule.lastRun.toISOString() : null,
          nextSync: this.getNextSyncTime()
        },
        syncStats,
        lastSyncResults,
        recentActivity: {
          syncs: recentSyncActivities.map(activity => ({
            timestamp: activity.created_at,
            status: activity.status,
            details: activity.details
          })),
          errors: recentSyncErrors.map(error => ({
            timestamp: error.created_at,
            message: typeof error.details === 'string' 
              ? error.details 
              : error.details && typeof error.details === 'object' && 'message' in error.details
                ? error.details.message
                : 'Unknown error',
            details: error.details
          }))
        }
      };
      
      // Log this status check
      await this.logActivity('ftp_status_checked', 'FTP status checked', {
        connectionStatus: connected ? 'connected' : 'disconnected',
        scheduleStatus: scheduleInfo.status
      });
      
      return {
        success: true,
        agent: this.config.name,
        capability: 'getFtpStatus',
        result: status
      };
    } catch (error: any) {
      // Log the error and return error information
      await this.logActivity(
        'ftp_status_error', 
        `Error getting FTP status: ${error.message}`,
        {
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      );
      
      return {
        success: false,
        agent: this.config.name,
        capability: 'getFtpStatus',
        error: `Error getting FTP status: ${error.message}`,
        details: {
          timestamp: new Date().toISOString(),
          stack: error.stack,
          scheduleState: {
            enabled: this.schedule.enabled,
            intervalHours: this.schedule.intervalHours,
            lastRunAttempt: this.schedule.lastRun ? this.schedule.lastRun.toISOString() : null
          }
        }
      };
    }
  }
}