/**
 * Data Ingestion Agent
 * 
 * This agent specializes in ingesting data from various sources into the system.
 * It handles import validation, transformation, and loading of property data
 * from external systems like PACS and other databases.
 */

import { BaseAgent, AgentConfig, AgentCapability } from './base-agent';
import { IStorage } from '../../storage';
import { MCPService } from '../mcp';
import { FTPService } from '../ftp-service';
import { parse } from 'csv-parse/sync';
import { InsertProperty, InsertImprovement, InsertLandRecord, Property } from '../../../shared/schema';

export class IngestionAgent extends BaseAgent {
  private ftpService: FTPService;
  
  constructor(storage: IStorage, mcpService: MCPService, ftpService: FTPService) {
    // Define agent configuration
    const config: AgentConfig = {
      id: 2, // Assuming ID 2 for this agent
      name: 'Data Ingestion Agent',
      description: 'Specializes in importing and validating data from external sources',
      permissions: [
        'authenticated',
        'property.read',
        'property.write',
        'pacs.read',
        'improvement.write',
        'landrecord.write',
        'import.write'
      ],
      capabilities: [
        // Define core capabilities
        {
          name: 'importFromFTP',
          description: 'Import data from a configured FTP server',
          parameters: {
            remotePath: 'string',
            dataType: 'string'
          },
          handler: async (parameters, agent) => await this.importFromFTP(parameters.remotePath, parameters.dataType)
        },
        {
          name: 'validateImportData',
          description: 'Validate imported data before loading into the system',
          parameters: {
            importId: 'string'
          },
          handler: async (parameters, agent) => await this.validateImportData(parameters.importId)
        },
        {
          name: 'loadValidatedData',
          description: 'Load validated data into the system',
          parameters: {
            importId: 'string',
            options: 'object?'
          },
          handler: async (parameters, agent) => await this.loadValidatedData(parameters.importId, parameters.options)
        },
        {
          name: 'exportToFTP',
          description: 'Export data to a configured FTP server',
          parameters: {
            dataType: 'string',
            filter: 'object?',
            remotePath: 'string?'
          },
          handler: async (parameters, agent) => await this.exportToFTP(parameters.dataType, parameters.filter, parameters.remotePath)
        },
        {
          name: 'checkImportStatus',
          description: 'Check the status of a data import process',
          parameters: {
            importId: 'string'
          },
          handler: async (parameters, agent) => await this.checkImportStatus(parameters.importId)
        },
        {
          name: 'importPacsModules',
          description: 'Import PACS module definitions and metadata',
          parameters: {
            csvPath: 'string?'
          },
          handler: async (parameters, agent) => await this.importPacsModules(parameters.csvPath)
        }
      ]
    };
    
    super(storage, mcpService, config);
    this.ftpService = ftpService;
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Log initialization
    await this.logActivity('agent_initialization', 'Data Ingestion Agent initializing');
    
    // Check for required MCP tools
    const availableTools = await this.getAvailableMCPTools();
    const requiredTools = [
      'property.create',
      'improvement.create',
      'landRecord.create',
      'import.create',
      'import.update'
    ];
    
    // Verify all required tools are available
    for (const tool of requiredTools) {
      if (!availableTools.find(t => t.name === tool)) {
        throw new Error(`Required MCP tool '${tool}' not available`);
      }
    }
    
    // Test FTP connection
    try {
      await this.ftpService.testConnection();
      await this.logActivity('ftp_connection', 'FTP connection test successful');
    } catch (error) {
      await this.logActivity('ftp_connection_error', `FTP connection test failed: ${error.message}`);
      // Don't throw here, as FTP might not be available yet but could be configured later
    }
    
    await this.logActivity('agent_initialization', 'Data Ingestion Agent initialized successfully');
  }
  
  /**
   * Import data from FTP
   */
  private async importFromFTP(remotePath: string, dataType: string): Promise<any> {
    try {
      // Log the import request
      await this.logActivity('ftp_import', `Starting import of ${dataType} from FTP: ${remotePath}`);
      
      // Create an import record
      const importId = `import-${Date.now()}`;
      const importRecord = await this.executeMCPTool('import.create', {
        importId,
        source: 'ftp',
        dataType,
        status: 'starting',
        details: {
          remotePath,
          startTime: new Date().toISOString()
        }
      });
      
      if (!importRecord.success) {
        throw new Error(`Failed to create import record: ${importRecord.error}`);
      }
      
      // Download the file from FTP
      await this.logActivity('ftp_download', `Downloading file from ${remotePath}`);
      const fileContent = await this.ftpService.downloadFile(remotePath);
      
      if (!fileContent || fileContent.length === 0) {
        throw new Error(`Empty or missing file at ${remotePath}`);
      }
      
      // Update import record
      await this.executeMCPTool('import.update', {
        importId,
        status: 'downloaded',
        details: {
          fileSize: fileContent.length,
          downloadTime: new Date().toISOString()
        }
      });
      
      // Parse the data based on the dataType
      let parsedData;
      let importDetails = {};
      
      switch (dataType) {
        case 'properties':
          parsedData = this.parseCSV(fileContent);
          importDetails = {
            rowCount: parsedData.length,
            columns: Object.keys(parsedData[0] || {}).join(', ')
          };
          break;
          
        case 'improvements':
          parsedData = this.parseCSV(fileContent);
          importDetails = {
            rowCount: parsedData.length,
            columns: Object.keys(parsedData[0] || {}).join(', ')
          };
          break;
          
        case 'landRecords':
          parsedData = this.parseCSV(fileContent);
          importDetails = {
            rowCount: parsedData.length,
            columns: Object.keys(parsedData[0] || {}).join(', ')
          };
          break;
          
        case 'pacsModules':
          parsedData = this.parseCSV(fileContent);
          importDetails = {
            rowCount: parsedData.length,
            moduleNames: parsedData.map(m => m.module_name || m.moduleName).join(', ')
          };
          break;
          
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
      
      // Store the parsed data in the import_staging table
      await this.executeMCPTool('import.update', {
        importId,
        status: 'parsed',
        details: {
          ...importDetails,
          parseTime: new Date().toISOString()
        },
        data: parsedData
      });
      
      await this.logActivity('ftp_import', `Successfully imported ${dataType} from FTP`, {
        rowCount: parsedData.length,
        importId
      });
      
      return {
        importId,
        status: 'parsed',
        rowCount: parsedData.length,
        dataType
      };
    } catch (error) {
      await this.logActivity('ftp_import_error', `Error importing ${dataType} from FTP: ${error.message}`);
      
      // Update import record with error status
      try {
        const importId = `import-${Date.now()}`;
        await this.executeMCPTool('import.update', {
          importId,
          status: 'error',
          details: {
            error: error.message,
            errorTime: new Date().toISOString()
          }
        });
      } catch (updateError) {
        // Log but don't throw - we want to throw the original error
        await this.logActivity('import_update_error', `Failed to update import record with error: ${updateError.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Parse CSV data
   */
  private parseCSV(csvContent: string): any[] {
    try {
      // Parse the CSV content
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      return records;
    } catch (error) {
      throw new Error(`CSV parse error: ${error.message}`);
    }
  }
  
  /**
   * Validate imported data
   */
  private async validateImportData(importId: string): Promise<any> {
    try {
      // Log the validation request
      await this.logActivity('import_validation', `Validating import data for ${importId}`);
      
      // Get the import record
      const importResult = await this.executeMCPTool('import.getById', { importId });
      
      if (!importResult.success || !importResult.result) {
        throw new Error(`Import record ${importId} not found`);
      }
      
      const importRecord = importResult.result;
      
      if (importRecord.status !== 'parsed') {
        throw new Error(`Import ${importId} is not in 'parsed' state (current: ${importRecord.status})`);
      }
      
      // Get the data from the import record
      const data = importRecord.data;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error(`No data found in import ${importId}`);
      }
      
      // Validate the data based on type
      const validationResults = {
        valid: [],
        invalid: [],
        warnings: []
      };
      
      switch (importRecord.dataType) {
        case 'properties':
          // Validate property data
          for (const [index, row] of data.entries()) {
            try {
              // Basic required field validation
              if (!row.propertyId) {
                validationResults.invalid.push({
                  row: index,
                  message: 'Missing required field: propertyId',
                  data: row
                });
                continue;
              }
              
              // Type validations
              const numericFields = ['value', 'acres'];
              for (const field of numericFields) {
                if (row[field] && isNaN(parseFloat(row[field]))) {
                  validationResults.invalid.push({
                    row: index,
                    message: `Invalid numeric value for ${field}: ${row[field]}`,
                    data: row
                  });
                  continue;
                }
              }
              
              // Warning for potentially duplicate property IDs
              const propertyExists = await this.executeMCPTool('property.exists', { 
                propertyId: row.propertyId 
              });
              
              if (propertyExists.success && propertyExists.result) {
                validationResults.warnings.push({
                  row: index,
                  message: `Property ID ${row.propertyId} already exists in the system`,
                  data: row
                });
              }
              
              // If we made it here, the row is valid
              validationResults.valid.push({
                row: index,
                data: row
              });
            } catch (error) {
              validationResults.invalid.push({
                row: index,
                message: `Validation error: ${error.message}`,
                data: row
              });
            }
          }
          break;
          
        case 'improvements':
          // Validate improvement data
          for (const [index, row] of data.entries()) {
            try {
              // Basic required field validation
              if (!row.propertyId) {
                validationResults.invalid.push({
                  row: index,
                  message: 'Missing required field: propertyId',
                  data: row
                });
                continue;
              }
              
              // Property must exist
              const propertyExists = await this.executeMCPTool('property.exists', { 
                propertyId: row.propertyId 
              });
              
              if (!propertyExists.success || !propertyExists.result) {
                validationResults.warnings.push({
                  row: index,
                  message: `Property ID ${row.propertyId} does not exist in the system`,
                  data: row
                });
              }
              
              // Type validations for numeric fields
              const numericFields = ['squareFeet', 'value'];
              for (const field of numericFields) {
                if (row[field] && isNaN(parseFloat(row[field]))) {
                  validationResults.invalid.push({
                    row: index,
                    message: `Invalid numeric value for ${field}: ${row[field]}`,
                    data: row
                  });
                  continue;
                }
              }
              
              // If we made it here, the row is valid
              validationResults.valid.push({
                row: index,
                data: row
              });
            } catch (error) {
              validationResults.invalid.push({
                row: index,
                message: `Validation error: ${error.message}`,
                data: row
              });
            }
          }
          break;
          
        // Add more data type validations as needed
          
        default:
          // Basic validation for other types
          validationResults.valid = data.map((row, index) => ({ row: index, data: row }));
      }
      
      // Update the import record with validation results
      await this.executeMCPTool('import.update', {
        importId,
        status: 'validated',
        details: {
          validCount: validationResults.valid.length,
          invalidCount: validationResults.invalid.length,
          warningCount: validationResults.warnings.length,
          validationTime: new Date().toISOString()
        },
        validationResults
      });
      
      // Log validation completion
      await this.logActivity('import_validation', `Validated import ${importId}`, {
        validCount: validationResults.valid.length,
        invalidCount: validationResults.invalid.length,
        warningCount: validationResults.warnings.length
      });
      
      return {
        importId,
        status: 'validated',
        summary: {
          total: data.length,
          valid: validationResults.valid.length,
          invalid: validationResults.invalid.length,
          warnings: validationResults.warnings.length
        },
        validationResults
      };
    } catch (error) {
      await this.logActivity('import_validation_error', `Error validating import ${importId}: ${error.message}`);
      
      // Update import record with error status
      try {
        await this.executeMCPTool('import.update', {
          importId,
          status: 'validation_error',
          details: {
            error: error.message,
            errorTime: new Date().toISOString()
          }
        });
      } catch (updateError) {
        // Log but don't throw - we want to throw the original error
        await this.logActivity('import_update_error', `Failed to update import record with error: ${updateError.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Load validated data into the system
   */
  private async loadValidatedData(importId: string, options: any = {}): Promise<any> {
    try {
      // Log the load request
      await this.logActivity('import_load', `Loading validated data for import ${importId}`);
      
      // Get the import record
      const importResult = await this.executeMCPTool('import.getById', { importId });
      
      if (!importResult.success || !importResult.result) {
        throw new Error(`Import record ${importId} not found`);
      }
      
      const importRecord = importResult.result;
      
      if (importRecord.status !== 'validated') {
        throw new Error(`Import ${importId} is not in 'validated' state (current: ${importRecord.status})`);
      }
      
      // Get the validation results
      const validationResults = importRecord.validationResults;
      
      if (!validationResults || !validationResults.valid || validationResults.valid.length === 0) {
        throw new Error(`No valid data to load from import ${importId}`);
      }
      
      // Configuration options for the load
      const skipExisting = options.skipExisting !== undefined ? options.skipExisting : true;
      const updateExisting = options.updateExisting !== undefined ? options.updateExisting : false;
      
      if (skipExisting && updateExisting) {
        throw new Error('Cannot both skip and update existing records');
      }
      
      // Load data based on the data type
      const results = {
        loaded: 0,
        skipped: 0,
        updated: 0,
        errors: []
      };
      
      switch (importRecord.dataType) {
        case 'properties':
          // Load property data
          for (const item of validationResults.valid) {
            try {
              const row = item.data;
              
              // Check if property exists
              const propertyExists = await this.executeMCPTool('property.exists', { 
                propertyId: row.propertyId 
              });
              
              if (propertyExists.success && propertyExists.result) {
                if (skipExisting) {
                  results.skipped++;
                  continue;
                } else if (updateExisting) {
                  // Update existing property
                  const updateResult = await this.executeMCPTool('property.update', { 
                    propertyId: row.propertyId,
                    updates: row
                  });
                  
                  if (updateResult.success) {
                    results.updated++;
                  } else {
                    results.errors.push({
                      row: item.row,
                      message: `Failed to update property: ${updateResult.error}`,
                      data: row
                    });
                  }
                }
              } else {
                // Create new property
                const propertyData: InsertProperty = {
                  propertyId: row.propertyId,
                  propertyType: row.propertyType || 'residential',
                  value: parseFloat(row.value) || 0,
                  acres: parseFloat(row.acres) || 0,
                  zoningCode: row.zoningCode || null,
                  address: row.address || null,
                  city: row.city || null,
                  state: row.state || null,
                  zip: row.zip || null,
                  county: row.county || 'Benton',
                  status: row.status || 'active',
                  lastAssessmentDate: row.lastAssessmentDate ? new Date(row.lastAssessmentDate) : new Date(),
                  extraFields: {}
                };
                
                // Add any extra fields that aren't part of the standard schema
                const standardFields = [
                  'propertyId', 'propertyType', 'value', 'acres', 'zoningCode',
                  'address', 'city', 'state', 'zip', 'county', 'status', 'lastAssessmentDate'
                ];
                
                for (const [key, value] of Object.entries(row)) {
                  if (!standardFields.includes(key)) {
                    propertyData.extraFields[key] = value;
                  }
                }
                
                const createResult = await this.executeMCPTool('property.create', propertyData);
                
                if (createResult.success) {
                  results.loaded++;
                } else {
                  results.errors.push({
                    row: item.row,
                    message: `Failed to create property: ${createResult.error}`,
                    data: row
                  });
                }
              }
            } catch (error) {
              results.errors.push({
                row: item.row,
                message: `Error processing row: ${error.message}`,
                data: item.data
              });
            }
          }
          break;
          
        case 'improvements':
          // Load improvement data
          for (const item of validationResults.valid) {
            try {
              const row = item.data;
              
              // Create the improvement
              const improvementData: InsertImprovement = {
                propertyId: row.propertyId,
                improvementType: row.improvementType || 'building',
                description: row.description || null,
                yearBuilt: parseInt(row.yearBuilt) || null,
                squareFeet: parseFloat(row.squareFeet) || null,
                value: parseFloat(row.value) || 0,
                condition: row.condition || null,
                extraFields: {}
              };
              
              // Add any extra fields
              const standardFields = [
                'propertyId', 'improvementType', 'description', 'yearBuilt', 
                'squareFeet', 'value', 'condition'
              ];
              
              for (const [key, value] of Object.entries(row)) {
                if (!standardFields.includes(key)) {
                  improvementData.extraFields[key] = value;
                }
              }
              
              const createResult = await this.executeMCPTool('improvement.create', improvementData);
              
              if (createResult.success) {
                results.loaded++;
              } else {
                results.errors.push({
                  row: item.row,
                  message: `Failed to create improvement: ${createResult.error}`,
                  data: row
                });
              }
            } catch (error) {
              results.errors.push({
                row: item.row,
                message: `Error processing row: ${error.message}`,
                data: item.data
              });
            }
          }
          break;
          
        case 'landRecords':
          // Load land record data
          for (const item of validationResults.valid) {
            try {
              const row = item.data;
              
              // Create the land record
              const landRecordData: InsertLandRecord = {
                propertyId: row.propertyId,
                landUseCode: row.landUseCode || null,
                soilType: row.soilType || null,
                acres: parseFloat(row.acres) || 0,
                valuePerAcre: parseFloat(row.valuePerAcre) || 0,
                zoningCode: row.zoningCode || null,
                extraFields: {}
              };
              
              // Add any extra fields
              const standardFields = [
                'propertyId', 'landUseCode', 'soilType', 'acres', 
                'valuePerAcre', 'zoningCode'
              ];
              
              for (const [key, value] of Object.entries(row)) {
                if (!standardFields.includes(key)) {
                  landRecordData.extraFields[key] = value;
                }
              }
              
              const createResult = await this.executeMCPTool('landRecord.create', landRecordData);
              
              if (createResult.success) {
                results.loaded++;
              } else {
                results.errors.push({
                  row: item.row,
                  message: `Failed to create land record: ${createResult.error}`,
                  data: row
                });
              }
            } catch (error) {
              results.errors.push({
                row: item.row,
                message: `Error processing row: ${error.message}`,
                data: item.data
              });
            }
          }
          break;
          
        // Add more data type handling as needed
          
        default:
          throw new Error(`Unsupported data type for loading: ${importRecord.dataType}`);
      }
      
      // Update the import record with load results
      await this.executeMCPTool('import.update', {
        importId,
        status: 'loaded',
        details: {
          loadedCount: results.loaded,
          skippedCount: results.skipped,
          updatedCount: results.updated,
          errorCount: results.errors.length,
          loadTime: new Date().toISOString()
        },
        loadResults: results
      });
      
      // Log load completion
      await this.logActivity('import_load', `Loaded data for import ${importId}`, {
        loaded: results.loaded,
        skipped: results.skipped,
        updated: results.updated,
        errors: results.errors.length
      });
      
      return {
        importId,
        status: 'loaded',
        summary: {
          loaded: results.loaded,
          skipped: results.skipped,
          updated: results.updated,
          errors: results.errors.length
        },
        errors: results.errors
      };
    } catch (error) {
      await this.logActivity('import_load_error', `Error loading data for import ${importId}: ${error.message}`);
      
      // Update import record with error status
      try {
        await this.executeMCPTool('import.update', {
          importId,
          status: 'load_error',
          details: {
            error: error.message,
            errorTime: new Date().toISOString()
          }
        });
      } catch (updateError) {
        // Log but don't throw - we want to throw the original error
        await this.logActivity('import_update_error', `Failed to update import record with error: ${updateError.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Export data to FTP
   */
  private async exportToFTP(dataType: string, filter: any = {}, remotePath?: string): Promise<any> {
    try {
      // Log the export request
      await this.logActivity('ftp_export', `Starting export of ${dataType} to FTP`);
      
      // Generate a default remote path if not provided
      if (!remotePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        remotePath = `exports/${dataType}_${timestamp}.csv`;
      }
      
      // Create an export record
      const exportId = `export-${Date.now()}`;
      const exportRecord = await this.executeMCPTool('export.create', {
        exportId,
        destination: 'ftp',
        dataType,
        status: 'starting',
        details: {
          remotePath,
          filter,
          startTime: new Date().toISOString()
        }
      });
      
      if (!exportRecord.success) {
        throw new Error(`Failed to create export record: ${exportRecord.error}`);
      }
      
      // Fetch the data to export based on type
      let data: any[] = [];
      let headers: string[] = [];
      
      switch (dataType) {
        case 'properties':
          // Get properties with optional filtering
          const propertiesResult = await this.executeMCPTool('property.getAll', filter);
          
          if (!propertiesResult.success) {
            throw new Error(`Failed to retrieve properties: ${propertiesResult.error}`);
          }
          
          data = propertiesResult.result;
          
          // Convert property data to CSV format
          // First determine all possible headers from the data
          const propertyHeaders = new Set<string>();
          for (const property of data) {
            Object.keys(property).forEach(key => propertyHeaders.add(key));
            
            // Also add keys from extraFields if they exist
            if (property.extraFields) {
              Object.keys(property.extraFields).forEach(key => propertyHeaders.add(key));
            }
          }
          
          headers = Array.from(propertyHeaders);
          
          // Flatten the data
          data = data.map((property: Property) => {
            const flattenedProperty = { ...property };
            
            // Flatten extraFields
            if (property.extraFields) {
              Object.entries(property.extraFields).forEach(([key, value]) => {
                flattenedProperty[key] = value;
              });
            }
            
            delete flattenedProperty.extraFields;
            return flattenedProperty;
          });
          break;
          
        // Add more data type handling as needed
          
        default:
          throw new Error(`Unsupported data type for export: ${dataType}`);
      }
      
      // Convert data to CSV
      const csvRows = [];
      
      // Add header row
      csvRows.push(headers.join(','));
      
      // Add data rows
      for (const row of data) {
        const csvRow = headers.map(header => {
          // Get the value for this header
          let value = row[header];
          
          // Handle special cases
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'object') {
            return JSON.stringify(value).replace(/"/g, '""');
          } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          } else {
            return String(value);
          }
        });
        
        csvRows.push(csvRow.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      
      // Update export record with data count
      await this.executeMCPTool('export.update', {
        exportId,
        status: 'prepared',
        details: {
          recordCount: data.length,
          fileSize: csvContent.length,
          prepareTime: new Date().toISOString()
        }
      });
      
      // Upload to FTP
      await this.ftpService.uploadFile(remotePath, csvContent);
      
      // Update export record with completion
      await this.executeMCPTool('export.update', {
        exportId,
        status: 'completed',
        details: {
          completeTime: new Date().toISOString()
        }
      });
      
      // Log export completion
      await this.logActivity('ftp_export', `Successfully exported ${dataType} to FTP: ${remotePath}`, {
        recordCount: data.length,
        fileSize: csvContent.length
      });
      
      return {
        exportId,
        status: 'completed',
        dataType,
        remotePath,
        recordCount: data.length,
        fileSize: csvContent.length
      };
    } catch (error) {
      await this.logActivity('ftp_export_error', `Error exporting ${dataType} to FTP: ${error.message}`);
      
      // Update export record with error status
      try {
        const exportId = `export-${Date.now()}`;
        await this.executeMCPTool('export.update', {
          exportId,
          status: 'error',
          details: {
            error: error.message,
            errorTime: new Date().toISOString()
          }
        });
      } catch (updateError) {
        // Log but don't throw - we want to throw the original error
        await this.logActivity('export_update_error', `Failed to update export record with error: ${updateError.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Check import status
   */
  private async checkImportStatus(importId: string): Promise<any> {
    try {
      // Get the import record
      const importResult = await this.executeMCPTool('import.getById', { importId });
      
      if (!importResult.success || !importResult.result) {
        throw new Error(`Import record ${importId} not found`);
      }
      
      const importRecord = importResult.result;
      
      // Log the status check
      await this.logActivity('import_status_check', `Checked status of import ${importId}: ${importRecord.status}`);
      
      return {
        importId,
        status: importRecord.status,
        dataType: importRecord.dataType,
        details: importRecord.details,
        createdAt: importRecord.createdAt,
        updatedAt: importRecord.updatedAt
      };
    } catch (error) {
      await this.logActivity('import_status_error', `Error checking import status for ${importId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Import PACS modules
   */
  private async importPacsModules(csvPath?: string): Promise<any> {
    try {
      let modulesData;
      
      if (csvPath) {
        // Import from a specific CSV file
        await this.logActivity('pacs_modules_import', `Importing PACS modules from ${csvPath}`);
        
        // Try to get the file from FTP
        try {
          const fileContent = await this.ftpService.downloadFile(csvPath);
          modulesData = this.parseCSV(fileContent);
        } catch (ftpError) {
          await this.logActivity('pacs_modules_ftp_error', `Error downloading PACS modules from FTP: ${ftpError.message}`);
          throw ftpError;
        }
      } else {
        // Use default module data from the attached asset
        await this.logActivity('pacs_modules_import', 'Importing PACS modules from default source');
        
        // Attempt to read the CSV file from the local filesystem
        try {
          const { readFileSync } = require('fs');
          const defaultPath = './attached_assets/PACS_Agent_Module_Map.csv';
          const fileContent = readFileSync(defaultPath, 'utf8');
          modulesData = this.parseCSV(fileContent);
        } catch (fsError) {
          await this.logActivity('pacs_modules_file_error', `Error reading default PACS modules file: ${fsError.message}`);
          
          // Fallback to a minimal set of modules
          modulesData = [
            {
              module_name: 'Property Data',
              source: 'PACS WA',
              integration: 'rest_api',
              description: 'Core property data including parcel information and valuation',
              category: 'Property'
            },
            {
              module_name: 'Land Data',
              source: 'PACS WA',
              integration: 'rest_api',
              description: 'Land information including acreage, usage, and soil types',
              category: 'Property'
            },
            {
              module_name: 'Improvements',
              source: 'PACS WA',
              integration: 'rest_api',
              description: 'Building and structure improvements on properties',
              category: 'Property'
            },
            {
              module_name: 'Appeals',
              source: 'PACS WA',
              integration: 'rest_api',
              description: 'Taxpayer appeals and resolution process',
              category: 'Administration'
            },
            {
              module_name: 'GIS Integration',
              source: 'PACS WA',
              integration: 'gis_api',
              description: 'Geographic Information System integration',
              category: 'GIS'
            }
          ];
        }
      }
      
      if (!modulesData || !Array.isArray(modulesData) || modulesData.length === 0) {
        throw new Error('No PACS module data found or empty data set');
      }
      
      // Process each module
      const results = {
        imported: 0,
        updated: 0,
        errors: []
      };
      
      for (const [index, module] of modulesData.entries()) {
        try {
          // Normalize field names
          const moduleName = module.module_name || module.moduleName || null;
          
          if (!moduleName) {
            results.errors.push({
              index,
              message: 'Missing module name',
              data: module
            });
            continue;
          }
          
          // Create or update the module
          const upsertResult = await this.executeMCPTool('pacsModule.upsert', {
            moduleName,
            source: module.source || 'PACS WA',
            integration: module.integration || 'pending',
            description: module.description || null,
            category: module.category || null,
            apiEndpoints: module.api_endpoints || module.apiEndpoints || null,
            dataSchema: module.data_schema || module.dataSchema || null
          });
          
          if (upsertResult.success) {
            if (upsertResult.result.wasUpdated) {
              results.updated++;
            } else {
              results.imported++;
            }
          } else {
            results.errors.push({
              index,
              message: `Failed to upsert module: ${upsertResult.error}`,
              data: module
            });
          }
        } catch (error) {
          results.errors.push({
            index,
            message: `Error processing module: ${error.message}`,
            data: module
          });
        }
      }
      
      // Log import results
      await this.logActivity('pacs_modules_import', `PACS modules import complete`, {
        imported: results.imported,
        updated: results.updated,
        errors: results.errors.length
      });
      
      return {
        status: 'completed',
        summary: {
          total: modulesData.length,
          imported: results.imported,
          updated: results.updated,
          errors: results.errors.length
        },
        errors: results.errors
      };
    } catch (error) {
      await this.logActivity('pacs_modules_import_error', `Error importing PACS modules: ${error.message}`);
      throw error;
    }
  }
}