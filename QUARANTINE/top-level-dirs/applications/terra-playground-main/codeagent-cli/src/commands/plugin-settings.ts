import { Command } from 'commander';
import chalk from 'chalk';
import { PluginSettingsManager } from '../plugins/pluginSettingsManager.js';

/**
 * Register the plugin-settings command
 */
export function register(program: Command): void {
  program
    .command('plugin-settings')
    .alias('ps')
    .description('Manage plugin settings')
    .option('-l, --list', 'List all plugins with settings')
    .option('-e, --edit <name>', 'Edit settings for a specific plugin')
    .option('-r, --reset <name>', 'Reset settings for a specific plugin to defaults')
    .option('-p, --path <path>', 'Path for plugin operations')
    .action(async (options, command) => {
      // Get the plugins directory
      const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
      const pluginsDir = options.path || `${homeDir}/.codeagent/plugins`;

      // Create settings manager
      const settingsManager = new PluginSettingsManager(pluginsDir);

      // Handle list option
      if (options.list) {
        await settingsManager.listPluginsWithSettings();
        return;
      }

      // Handle edit option
      if (options.edit) {
        await settingsManager.editSettings(options.edit);
        return;
      }

      // Handle reset option
      if (options.reset) {
        // Get the plugin manifest
        const fs = await import('fs');
        const path = await import('path');

        const pluginPath = path.join(pluginsDir, options.reset);
        const manifestPath = path.join(pluginPath, 'manifest.json');

        if (!fs.existsSync(manifestPath)) {
          console.log(chalk.red(`Plugin '${options.reset}' not found.`));
          return;
        }

        try {
          const manifestContent = fs.readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestContent);

          if (!manifest.settings || Object.keys(manifest.settings).length === 0) {
            console.log(chalk.yellow(`No default settings found for plugin '${options.reset}'.`));
            return;
          }

          console.log(
            chalk.yellow(`Resetting settings for plugin '${options.reset}' to defaults...`)
          );
          settingsManager.saveSettings(options.reset, { ...manifest.settings });
          console.log(chalk.green('Settings reset to defaults successfully!'));
        } catch (error) {
          console.error(chalk.red(`Error resetting settings: ${error.message}`));
        }

        return;
      }

      // Default to listing plugins with settings
      await settingsManager.listPluginsWithSettings();
    });
}
