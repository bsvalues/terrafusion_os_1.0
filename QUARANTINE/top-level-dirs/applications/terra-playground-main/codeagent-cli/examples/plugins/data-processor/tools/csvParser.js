import { BaseTool } from '../../../../src/tools/types.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * CSV Parser Tool
 * Parses CSV files and converts them to structured data
 */
export class CsvParser extends BaseTool {
  constructor() {
    super(
      'data_processor_csv_parser',
      'Parse CSV files into structured data',
      {
        file: {
          name: 'file',
          description: 'Path to the CSV file',
          type: 'string',
          required: true,
        },
        delimiter: {
          name: 'delimiter',
          description: 'CSV delimiter character',
          type: 'string',
          required: false,
          default: ',',
        },
        headers: {
          name: 'headers',
          description: 'Whether the CSV has headers',
          type: 'boolean',
          required: false,
          default: true,
        },
        outputFormat: {
          name: 'outputFormat',
          description: 'Output format (json or array)',
          type: 'string',
          required: false,
          default: 'json',
          enum: ['json', 'array'],
        },
      },
      ['data-processor', 'csv', 'parser']
    );
  }

  async execute(args) {
    try {
      const { file, delimiter = ',', headers = true, outputFormat = 'json' } = args;

      // Check if file exists
      if (!fs.existsSync(file)) {
        return {
          success: false,
          output: `Error: File not found: ${file}`,
          error: new Error(`File not found: ${file}`),
        };
      }

      // Get file size
      const stats = fs.statSync(file);
      const fileSize = stats.size;

      // Get settings
      const settingsManager = await this.getSettingsManager();
      const settings = settingsManager.getSettings('data-processor');
      const maxFileSize = settings.maxFileSize || 10485760; // Default 10MB

      // Check file size
      if (fileSize > maxFileSize) {
        return {
          success: false,
          output: `Error: File size (${fileSize} bytes) exceeds maximum allowed size (${maxFileSize} bytes)`,
          error: new Error(`File size exceeds maximum allowed size`),
        };
      }

      // Read and parse the CSV file
      const fileContent = fs.readFileSync(file, 'utf8');
      const records = parse(fileContent, {
        delimiter,
        columns: headers,
        skip_empty_lines: true,
      });

      // Format output
      let result;
      if (outputFormat === 'json') {
        result = records;
      } else {
        result = Array.isArray(records) ? records : [records];
      }

      // Summarize the data
      const recordCount = records.length;
      const fields = headers ? Object.keys(records[0] || {}) : [];

      return {
        success: true,
        output: `Successfully parsed CSV file with ${recordCount} records${headers ? ` and ${fields.length} fields` : ''}`,
        data: {
          records: result,
          summary: {
            recordCount,
            fields,
            fileSize,
            delimiter,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error parsing CSV: ${error.message}`,
        error,
      };
    }
  }

  /**
   * Get the settings manager
   * This is a helper method to load the settings manager
   */
  async getSettingsManager() {
    // Dynamic import to avoid circular dependencies
    const { PluginSettingsManager } = await import(
      '../../../../src/plugins/pluginSettingsManager.js'
    );

    // Get the plugins directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    const pluginsDir = `${homeDir}/.codeagent/plugins`;

    return new PluginSettingsManager(pluginsDir);
  }
}

// Export an instance of the tool
export default new CsvParser();
