/**
 * FTP Data Processor Service
 * 
 * This service helps process and transform data files that have been downloaded
 * from the FTP server. It handles various formats commonly used in property assessment
 * systems, including CSV, fixed-width formats, and XML files.
 */

import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { logger } from '../utils/logger';
import { IStorage } from '../storage';

// Define interfaces for processor
interface ProcessingOptions {
  sourceFormat?: 'csv' | 'fixed-width' | 'xml' | 'json';
  targetFormat?: 'json' | 'db';
  schema?: any;
  delimiter?: string;
  headerRow?: boolean;
  mappings?: Record<string, string>;
  dateFormat?: string;
  fixedWidthConfig?: FixedWidthConfig[];
  tableName?: string;
  batchSize?: number;
}

interface FixedWidthConfig {
  field: string;
  start: number;
  length: number;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

interface ProcessingResult {
  recordsProcessed: number;
  recordsSkipped: number;
  errors: string[];
  duration: number;
  outputPath?: string;
}

/**
 * FTP Data Processor Service
 * 
 * This service provides utilities for processing various data formats
 * commonly used in property assessment and tax data.
 */
export class FtpDataProcessor {
  private storage: IStorage;
  private downloadDir: string;
  private outputDir: string;

  /**
   * Constructor
   * 
   * @param storage Storage interface
   * @param downloadDir Directory where FTP files are downloaded to
   * @param outputDir Directory where processed files will be saved
   */
  constructor(storage: IStorage, downloadDir: string = '', outputDir: string = '') {
    this.storage = storage;
    this.downloadDir = downloadDir || path.join(process.cwd(), 'downloads');
    this.outputDir = outputDir || path.join(process.cwd(), 'downloads', 'processed');

    // Ensure directories exist
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Process a file from the downloads directory
   * 
   * @param filePath Relative path to the file in the downloads directory
   * @param options Processing options
   * @returns Processing results
   */
  public async processFile(filePath: string, options: ProcessingOptions = {}): Promise<ProcessingResult> {
    const startTime = Date.now();
    const fullPath = path.join(this.downloadDir, filePath);
    const result: ProcessingResult = {
      recordsProcessed: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0
    };

    // Verify file exists
    if (!fs.existsSync(fullPath)) {
      result.errors.push(`File not found: ${fullPath}`);
      return result;
    }

    try {
      // Determine source format if not specified
      if (!options.sourceFormat) {
        options.sourceFormat = this.detectFileFormat(fullPath);
      }

      // Process based on format
      let processedData: any[] = [];

      switch (options.sourceFormat) {
        case 'csv':
          processedData = await this.processCsvFile(fullPath, options);
          break;

        case 'fixed-width':
          processedData = await this.processFixedWidthFile(fullPath, options);
          break;

        case 'xml':
          processedData = await this.processXmlFile(fullPath, options);
          break;

        case 'json':
          processedData = await this.processJsonFile(fullPath, options);
          break;

        default:
          result.errors.push(`Unsupported file format: ${options.sourceFormat}`);
          return result;
      }

      // Apply any custom mappings
      if (options.mappings && Object.keys(options.mappings).length > 0) {
        processedData = this.applyFieldMappings(processedData, options.mappings);
      }

      // Save or store the processed data
      const targetFormat = options.targetFormat || 'json';
      result.recordsProcessed = processedData.length;

      if (targetFormat === 'json') {
        // Save to JSON file
        const outputFileName = `${path.basename(filePath, path.extname(filePath))}.json`;
        const outputPath = path.join(this.outputDir, outputFileName);

        fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
        result.outputPath = outputPath;

      } else if (targetFormat === 'db') {
        // Store directly in database
        if (!options.tableName) {
          result.errors.push('Table name must be specified for database storage');
        } else {
          await this.storeInDatabase(processedData, options.tableName, options.batchSize || 100);
        }
      }

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error processing FTP data:', { error: errorMessage, context: { file: filePath, timestamp: new Date().toISOString() }});

      // Emit error event for monitoring
      //this.emit('processingError', { //this.emit is not defined in this class
      //  error: errorMessage,
      //  file: filePath,
      //  timestamp: new Date().toISOString()
      //});

      throw new Error(`FTP data processing failed: ${errorMessage}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Detect the format of a file based on its content and extension
   * 
   * @param filePath Path to the file
   * @returns Detected format
   */
  private detectFileFormat(filePath: string): 'csv' | 'fixed-width' | 'xml' | 'json' {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
      return 'csv';
    } else if (ext === '.xml') {
      return 'xml';
    } else if (ext === '.json') {
      return 'json';
    } else if (ext === '.txt' || ext === '.dat') {
      // Try to determine if it's a fixed-width file
      const sample = fs.readFileSync(filePath, 'utf8').split('\n').slice(0, 5).join('\n');

      // Check if all lines have the same length (common for fixed-width)
      const lines = sample.split('\n').filter(line => line.trim().length > 0);
      const allSameLength = lines.every(line => line.length === lines[0].length);

      // Check for delimiters common in CSV
      const hasCommas = sample.includes(',');
      const hasTabs = sample.includes('\t');
      const hasSemicolons = sample.includes(';');

      if (allSameLength && !hasCommas && !hasTabs && !hasSemicolons) {
        return 'fixed-width';
      } else {
        return 'csv'; // Default to CSV for text files with delimiters
      }
    }

    // Default to CSV as it's most common
    return 'csv';
  }

  /**
   * Process a CSV file
   * 
   * @param filePath Path to the CSV file
   * @param options Processing options
   * @returns Processed data as array of objects
   */
  private async processCsvFile(filePath: string, options: ProcessingOptions): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const delimiter = options.delimiter || ',';
    const hasHeaderRow = options.headerRow !== false; // Default to true

    // Parse CSV
    const parseOptions = {
      delimiter,
      columns: hasHeaderRow,
      skip_empty_lines: true,
      trim: true
    };

    const records = csvParse(fileContent, parseOptions);
    return records;
  }

  /**
   * Process a fixed-width file
   * 
   * @param filePath Path to the fixed-width file
   * @param options Processing options
   * @returns Processed data as array of objects
   */
  private async processFixedWidthFile(filePath: string, options: ProcessingOptions): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
    const result: any[] = [];

    // Require fixed width configuration
    if (!options.fixedWidthConfig || options.fixedWidthConfig.length === 0) {
      throw new Error('Fixed width configuration is required for fixed-width files');
    }

    // Process each line
    for (const line of lines) {
      const record: Record<string, any> = {};

      for (const field of options.fixedWidthConfig) {
        const value = line.substring(field.start, field.start + field.length).trim();

        // Convert value based on type
        if (field.type === 'number') {
          record[field.field] = parseFloat(value) || 0;
        } else if (field.type === 'date') {
          record[field.field] = new Date(value);
        } else if (field.type === 'boolean') {
          record[field.field] = value === 'Y' || value === 'T' || value === '1';
        } else {
          record[field.field] = value;
        }
      }

      result.push(record);
    }

    return result;
  }

  /**
   * Process an XML file
   * 
   * @param filePath Path to the XML file
   * @param options Processing options
   * @returns Processed data as array of objects
   */
  private async processXmlFile(filePath: string, options: ProcessingOptions): Promise<any[]> {
    // Note: Using a simple approach for now
    // For production, would use a more robust XML parser
    const fileContent = fs.readFileSync(filePath, 'utf8');

    try {
      // Basic XML parsing - in real implementation, use a proper XML parser
      const result: any[] = [];

      // Very simplistic XML parsing that looks for elements
      const regex = /<([\w]+)>(.*?)<\/\1>/g;
      let matches;
      let currentRecord: Record<string, any> = {};

      while ((matches = regex.exec(fileContent)) !== null) {
        const [_, tag, value] = matches;

        // Special handling for record boundaries
        if (tag === 'record' || tag === 'item' || tag === 'property') {
          if (Object.keys(currentRecord).length > 0) {
            result.push(currentRecord);
            currentRecord = {};
          }
        } else {
          currentRecord[tag] = value.trim();
        }
      }

      // Add the last record if not empty
      if (Object.keys(currentRecord).length > 0) {
        result.push(currentRecord);
      }

      return result;
    } catch (error) {
      logger.error('Error parsing XML:', error);
      throw new Error('Failed to parse XML file');
    }
  }

  /**
   * Process a JSON file
   * 
   * @param filePath Path to the JSON file
   * @param options Processing options
   * @returns Processed data as array of objects
   */
  private async processJsonFile(filePath: string, options: ProcessingOptions): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    try {
      const data = JSON.parse(fileContent);

      // Handle both array and object formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // Look for common array properties in JSON responses
        for (const key of ['data', 'records', 'items', 'properties', 'results']) {
          if (Array.isArray(data[key])) {
            return data[key];
          }
        }

        // If no array found, convert the object to an array
        return [data];
      }

      return [];
    } catch (error) {
      logger.error('Error parsing JSON:', error);
      throw new Error('Failed to parse JSON file');
    }
  }

  /**
   * Apply field mappings to transform data
   * 
   * @param data Array of data records
   * @param mappings Field mappings
   * @returns Transformed data
   */
  private applyFieldMappings(data: any[], mappings: Record<string, string>): any[] {
    return data.map(record => {
      const mappedRecord: Record<string, any> = {};

      for (const [sourceField, targetField] of Object.entries(mappings)) {
        if (record[sourceField] !== undefined) {
          mappedRecord[targetField] = record[sourceField];
        }
      }

      return mappedRecord;
    });
  }

  /**
   * Store processed data in the database
   * 
   * @param data Data to store
   * @param tableName Target table name
   * @param batchSize Batch size for bulk inserts
   */
  private async storeInDatabase(data: any[], tableName: string, batchSize: number = 100): Promise<void> {
    try {
      // Process in batches to avoid memory issues with large datasets
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        // This would use the appropriate storage method depending on the table
        // For simplicity, just logging the operation for now
        logger.info(`Storing batch of ${batch.length} records in table ${tableName}`);

        // Example of how this might work - implementation would depend on the storage interface
        // await this.storage.bulkInsert(tableName, batch);
      }
    } catch (error) {
      logger.error('Error storing data in database:', error);
      throw new Error('Failed to store data in database');
    }
  }

  /**
   * Process all files in a directory
   * 
   * @param dirPath Relative path to directory in the downloads folder
   * @param options Processing options
   * @returns Array of processing results
   */
  public async processDirectory(dirPath: string, options: ProcessingOptions = {}): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const fullDirPath = path.join(this.downloadDir, dirPath);

    if (!fs.existsSync(fullDirPath)) {
      const result: ProcessingResult = {
        recordsProcessed: 0,
        recordsSkipped: 0,
        errors: [`Directory not found: ${fullDirPath}`],
        duration: 0
      };
      return [result];
    }

    const files = fs.readdirSync(fullDirPath)
      .filter(file => fs.statSync(path.join(fullDirPath, file)).isFile());

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const result = await this.processFile(filePath, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Get a summary of files in the downloads directory
   * 
   * @param dirPath Optional subdirectory
   * @returns Summary of files by type and size
   */
  public async getFilesSummary(dirPath: string = ''): Promise<any> {
    const fullPath = path.join(this.downloadDir, dirPath);

    if (!fs.existsSync(fullPath)) {
      return { error: 'Directory not found' };
    }

    const summary = {
      totalFiles: 0,
      totalSize: 0,
      byExtension: {} as Record<string, { count: number, size: number }>,
      byType: {
        csv: 0,
        xml: 0,
        json: 0,
        text: 0,
        other: 0
      },
      recentFiles: [] as Array<{ name: string, path: string, size: number, modified: Date }>
    };

    const processDirectory = (dirPath: string) => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          processDirectory(itemPath);
        } else if (stats.isFile()) {
          summary.totalFiles++;
          summary.totalSize += stats.size;

          const ext = path.extname(item).toLowerCase() || '.none';

          if (!summary.byExtension[ext]) {
            summary.byExtension[ext] = { count: 0, size: 0 };
          }

          summary.byExtension[ext].count++;
          summary.byExtension[ext].size += stats.size;

          // Categorize by type
          if (['.csv', '.tsv'].includes(ext)) {
            summary.byType.csv++;
          } else if (['.xml'].includes(ext)) {
            summary.byType.xml++;
          } else if (['.json'].includes(ext)) {
            summary.byType.json++;
          } else if (['.txt', '.dat', '.log'].includes(ext)) {
            summary.byType.text++;
          } else {
            summary.byType.other++;
          }

          // Track recent files (last 10 modified)
          summary.recentFiles.push({
            name: item,
            path: itemPath.replace(this.downloadDir, '').replace(/\\/g, '/'),
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    };

    processDirectory(fullPath);

    // Sort recent files by modification date (newest first) and limit to 10
    summary.recentFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    summary.recentFiles = summary.recentFiles.slice(0, 10);

    return summary;
  }
}