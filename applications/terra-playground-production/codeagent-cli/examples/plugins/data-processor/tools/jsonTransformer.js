import { BaseTool } from '../../../../src/tools/types.js';
import fs from 'fs';

/**
 * JSON Transformer Tool
 * Transforms JSON data using JavaScript expressions
 */
export class JsonTransformer extends BaseTool {
  constructor() {
    super(
      'data_processor_json_transformer',
      'Transform JSON data using JavaScript expressions',
      {
        input: {
          name: 'input',
          description: 'JSON string or path to JSON file',
          type: 'string',
          required: true,
        },
        transform: {
          name: 'transform',
          description:
            'JavaScript transform expression (e.g., "item => ({ ...item, processed: true })")',
          type: 'string',
          required: true,
        },
        filter: {
          name: 'filter',
          description: 'JavaScript filter expression (e.g., "item => item.value > 10")',
          type: 'string',
          required: false,
        },
        output: {
          name: 'output',
          description: 'Output file path (optional)',
          type: 'string',
          required: false,
        },
      },
      ['data-processor', 'json', 'transform']
    );
  }

  async execute(args) {
    try {
      const { input, transform, filter, output } = args;

      // Get settings
      const settingsManager = await this.getSettingsManager();
      const settings = settingsManager.getSettings('data-processor');

      // Parse input - either from file or directly as JSON string
      let data;
      if (fs.existsSync(input) && fs.statSync(input).isFile()) {
        // Check file size
        const stats = fs.statSync(input);
        const fileSize = stats.size;
        const maxFileSize = settings.maxFileSize || 10485760; // Default 10MB

        if (fileSize > maxFileSize) {
          return {
            success: false,
            output: `Error: File size (${fileSize} bytes) exceeds maximum allowed size (${maxFileSize} bytes)`,
            error: new Error(`File size exceeds maximum allowed size`),
          };
        }

        // Read from file
        const fileContent = fs.readFileSync(input, 'utf8');
        data = JSON.parse(fileContent);
      } else {
        // Parse as JSON string
        try {
          data = JSON.parse(input);
        } catch (e) {
          return {
            success: false,
            output: `Error parsing input as JSON: ${e.message}`,
            error: e,
          };
        }
      }

      // Validate the data is an array or object
      if (typeof data !== 'object') {
        return {
          success: false,
          output: 'Input must be an array or object',
          error: new Error('Input must be an array or object'),
        };
      }

      // Apply filter if provided
      let filtered = Array.isArray(data) ? data : [data];

      if (filter) {
        try {
          // Safely evaluate the filter expression
          const filterFn = new Function('item', `return (${filter})(item);`);
          filtered = filtered.filter(item => filterFn(item));
        } catch (e) {
          return {
            success: false,
            output: `Error in filter expression: ${e.message}`,
            error: e,
          };
        }
      }

      // Apply transform
      let transformed;
      try {
        // Safely evaluate the transform expression
        const transformFn = new Function('item', `return (${transform})(item);`);
        transformed = filtered.map(item => transformFn(item));
      } catch (e) {
        return {
          success: false,
          output: `Error in transform expression: ${e.message}`,
          error: e,
        };
      }

      // If input wasn't an array, convert result back to single object
      if (!Array.isArray(data) && transformed.length === 1) {
        transformed = transformed[0];
      }

      // Write to output file if specified
      if (output) {
        fs.writeFileSync(output, JSON.stringify(transformed, null, 2));
      }

      // Statistics for the operations
      const stats = {
        originalLength: Array.isArray(data) ? data.length : 1,
        filteredLength: filtered.length,
        transformedLength: Array.isArray(transformed) ? transformed.length : 1,
        outputFile: output,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        output: `JSON transformation completed successfully. ${stats.filteredLength} items processed.${output ? ` Output written to ${output}.` : ''}`,
        data: {
          records: transformed,
          summary: stats,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error transforming JSON: ${error.message}`,
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
export default new JsonTransformer();
