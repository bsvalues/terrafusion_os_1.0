/**
 * Data Context Hook
 *
 * This hook runs before a command is executed and adds data context
 * to the command execution environment if data-related commands are detected.
 *
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command being executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @returns {Promise<void>}
 */
export default async function dataContextHook(context) {
  // Get data-related keywords
  const dataKeywords = ['csv', 'json', 'xml', 'data', 'parse', 'transform', 'file'];

  // Check if command or args contain data-related keywords
  const commandText = context.command.toLowerCase();
  const argsText = context.args ? context.args.toString().toLowerCase() : '';

  const isDataRelated = dataKeywords.some(
    keyword => commandText.includes(keyword) || argsText.includes(keyword)
  );

  if (isDataRelated) {
    console.log(`[data-processor] Adding data context to command: ${context.command}`);

    try {
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

      // Add data context to the command
      context.dataContext = {
        plugin: 'data-processor',
        allowedFormats: settings.allowedFormats || ['csv', 'json', 'xml'],
        outputFormat: settings.outputFormat || 'json',
        maxFileSize: settings.maxFileSize || 10485760,
        settings,
      };

      // Scan for data files in current directory if running locally
      if (context.options && context.options.path) {
        const fs = await import('fs');
        const path = await import('path');

        const directory = context.options.path;

        if (fs.existsSync(directory) && fs.statSync(directory).isDirectory()) {
          // Find data files with supported extensions
          const dataFiles = fs
            .readdirSync(directory)
            .filter(file => {
              const ext = path.extname(file).toLowerCase().substring(1);
              return settings.allowedFormats.includes(ext);
            })
            .map(file => path.join(directory, file));

          // Add to context if found
          if (dataFiles.length > 0) {
            context.dataContext.availableFiles = dataFiles;
            console.log(`[data-processor] Found ${dataFiles.length} data files in ${directory}`);
          }
        }
      }

      console.log(`[data-processor] Data context added successfully`);
    } catch (error) {
      console.error(`[data-processor] Error adding data context: ${error.message}`);
    }
  }
}
