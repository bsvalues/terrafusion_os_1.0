/**
 * Data Summary Hook
 *
 * This hook runs after a command is executed and provides a summary
 * of data processing operations if data-related results are detected.
 *
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command that was executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @param {Object} context.result - The command result
 * @returns {Promise<void>}
 */
export default async function dataSummaryHook(context) {
  // Check if the command had data context added by the beforeCommand hook
  if (context.dataContext && context.result) {
    console.log(`[data-processor] Generating data summary for command: ${context.command}`);

    try {
      // Try to extract data-related information from the result
      const result = context.result;

      // Check if the result contains data processing information
      let processedData = null;

      if (result.data && result.data.records) {
        // Direct data records found
        processedData = result.data;
      } else if (typeof result === 'object') {
        // Try to find nested data records
        const findRecords = (obj, depth = 0) => {
          if (depth > 3) return null; // Limit search depth

          if (obj && obj.records && Array.isArray(obj.records)) {
            return obj;
          }

          if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
              if (typeof obj[key] === 'object') {
                const found = findRecords(obj[key], depth + 1);
                if (found) return found;
              }
            }
          }

          return null;
        };

        processedData = findRecords(result);
      }

      // Generate and display summary if data was found
      if (processedData) {
        // Get the settings manager
        const { PluginSettingsManager } = await import(
          '../../../../src/plugins/pluginSettingsManager.js'
        );

        // Get the plugins directory
        const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
        const pluginsDir = `${homeDir}/.codeagent/plugins`;

        // Get plugin settings
        const settingsManager = new PluginSettingsManager(pluginsDir);
        const settings = settingsManager.getSettings('data-processor');

        // Generate summary based on settings verbosity
        const verbose = settings.verbose || false;

        // Basic summary
        console.log('\n====== Data Processing Summary ======');

        if (processedData.summary) {
          console.log(`Records processed: ${processedData.summary.recordCount || 'N/A'}`);

          if (processedData.summary.fields && processedData.summary.fields.length > 0) {
            console.log(`Fields: ${processedData.summary.fields.join(', ')}`);
          }

          if (processedData.summary.fileSize) {
            console.log(`File size: ${Math.round(processedData.summary.fileSize / 1024)} KB`);
          }
        } else {
          console.log(
            `Records processed: ${Array.isArray(processedData.records) ? processedData.records.length : 'N/A'}`
          );
        }

        // Add verbose information if enabled
        if (verbose && Array.isArray(processedData.records) && processedData.records.length > 0) {
          console.log('\nData Sample:');

          // Show first record as sample
          const sampleRecord = processedData.records[0];

          if (typeof sampleRecord === 'object') {
            // For object records, show key-value pairs
            Object.entries(sampleRecord).forEach(([key, value]) => {
              console.log(`  ${key}: ${typeof value === 'object' ? '[Object]' : value}`);
            });
          } else {
            // For non-object records, show the value
            console.log(`  ${sampleRecord}`);
          }

          // Show data statistics if there are multiple records
          if (processedData.records.length > 1) {
            console.log('\nStatistics:');

            // Try to calculate basic statistics for numeric fields
            if (typeof sampleRecord === 'object') {
              for (const key in sampleRecord) {
                if (typeof sampleRecord[key] === 'number') {
                  // Calculate min, max, avg for numeric fields
                  const values = processedData.records
                    .map(record => record[key])
                    .filter(v => typeof v === 'number');

                  if (values.length > 0) {
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

                    console.log(`  ${key}: min=${min}, max=${max}, avg=${avg.toFixed(2)}`);
                  }
                }
              }
            }
          }
        }

        console.log('====================================\n');
      }
    } catch (error) {
      console.error(`[data-processor] Error generating data summary: ${error.message}`);
    }
  }
}
