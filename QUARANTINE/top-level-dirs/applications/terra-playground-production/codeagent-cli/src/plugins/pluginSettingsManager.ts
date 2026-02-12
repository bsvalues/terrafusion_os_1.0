import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interface for plugin settings
 */
interface PluginSettings {
  [key: string]: any;
}

/**
 * Plugin Settings Manager
 * Manages and persists plugin-specific settings
 */
export class PluginSettingsManager {
  private pluginsDir: string;
  private settingsDir: string;

  constructor(pluginsDir: string) {
    this.pluginsDir = pluginsDir;

    // Settings are stored in ~/.codeagent/settings
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.settingsDir = path.join(homeDir, '.codeagent', 'settings');

    // Create the settings directory if it doesn't exist
    if (!fs.existsSync(this.settingsDir)) {
      fs.mkdirSync(this.settingsDir, { recursive: true });
    }
  }

  /**
   * Get settings for a plugin
   * @param pluginName The name of the plugin
   * @returns The plugin settings
   */
  getSettings(pluginName: string): PluginSettings {
    const settingsPath = path.join(this.settingsDir, `${pluginName}.json`);

    // If settings file exists, read it
    if (fs.existsSync(settingsPath)) {
      try {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(settingsContent);
      } catch (error) {
        console.error(
          chalk.red(`Error reading settings for plugin '${pluginName}': ${error.message}`)
        );
        return {};
      }
    }

    // If not, check the plugin manifest for default settings
    const pluginPath = path.join(this.pluginsDir, pluginName);
    const manifestPath = path.join(pluginPath, 'manifest.json');

    if (fs.existsSync(manifestPath)) {
      try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        // Use settings from manifest as defaults
        if (manifest.settings) {
          return { ...manifest.settings };
        }
      } catch (error) {
        console.error(
          chalk.red(`Error reading manifest for plugin '${pluginName}': ${error.message}`)
        );
      }
    }

    // Return empty settings if nothing found
    return {};
  }

  /**
   * Save settings for a plugin
   * @param pluginName The name of the plugin
   * @param settings The settings to save
   */
  saveSettings(pluginName: string, settings: PluginSettings): void {
    const settingsPath = path.join(this.settingsDir, `${pluginName}.json`);

    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log(chalk.green(`Settings for plugin '${pluginName}' saved successfully.`));
    } catch (error) {
      console.error(
        chalk.red(`Error saving settings for plugin '${pluginName}': ${error.message}`)
      );
    }
  }

  /**
   * Edit settings for a plugin interactively
   * @param pluginName The name of the plugin
   */
  async editSettings(pluginName: string): Promise<void> {
    // Check if the plugin exists
    const pluginPath = path.join(this.pluginsDir, pluginName);
    if (!fs.existsSync(pluginPath)) {
      console.log(chalk.red(`Plugin '${pluginName}' not found.`));
      return;
    }

    // Get current settings
    const currentSettings = this.getSettings(pluginName);

    // Get plugin manifest to check for setting definitions
    const manifestPath = path.join(pluginPath, 'manifest.json');
    let settingDefinitions: Record<string, any> = {};

    if (fs.existsSync(manifestPath)) {
      try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        // Use settings from manifest as definitions
        if (manifest.settings) {
          settingDefinitions = manifest.settings;
        }
      } catch (error) {
        console.error(
          chalk.red(`Error reading manifest for plugin '${pluginName}': ${error.message}`)
        );
      }
    }

    console.log(chalk.blue.bold(`\n⚙️ Settings for plugin '${pluginName}'`));
    console.log(chalk.blue('───────────────────────────────────────\n'));

    // Display current settings if any
    if (Object.keys(currentSettings).length > 0) {
      console.log(chalk.yellow('Current settings:'));
      Object.entries(currentSettings).forEach(([key, value] /* , index */) => {
        console.log(`  ${index + 1}. ${key}: ${JSON.stringify(value)}`);
      });
      console.log('');
    } else {
      console.log(chalk.yellow('No settings configured yet.\n'));
    }

    // Choose action
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Edit existing settings',
          value: 'edit',
          disabled: Object.keys(currentSettings).length === 0,
        },
        { name: 'Add new settings', value: 'add' },
        {
          name: 'Delete settings',
          value: 'delete',
          disabled: Object.keys(currentSettings).length === 0,
        },
        {
          name: 'Reset to defaults',
          value: 'reset',
          disabled: Object.keys(settingDefinitions).length === 0,
        },
        { name: 'Exit', value: 'exit' },
      ],
    });

    if (action === 'exit') {
      return;
    }

    if (action === 'edit') {
      await this.editExistingSettings(pluginName, currentSettings);
    } else if (action === 'add') {
      await this.addNewSettings(pluginName, currentSettings, settingDefinitions);
    } else if (action === 'delete') {
      await this.deleteSettings(pluginName, currentSettings);
    } else if (action === 'reset') {
      await this.resetSettings(pluginName, settingDefinitions);
    }
  }

  /**
   * Edit existing settings
   * @param pluginName The name of the plugin
   * @param currentSettings The current settings
   */
  private async editExistingSettings(
    pluginName: string,
    currentSettings: PluginSettings
  ): Promise<void> {
    const settingKeys = Object.keys(currentSettings);

    // Choose setting to edit
    const { key } = await inquirer.prompt({
      type: 'list',
      name: 'key',
      message: 'Select a setting to edit:',
      choices: settingKeys.map(key => ({
        name: `${key}: ${JSON.stringify(currentSettings[key])}`,
        value: key,
      })),
    });

    // Get current value type
    const currentValue = currentSettings[key];
    const valueType = typeof currentValue;

    if (valueType === 'string') {
      const { newValue } = await inquirer.prompt({
        type: 'input',
        name: 'newValue',
        message: `Enter new value for '${key}':`,
        default: currentValue,
      });

      currentSettings[key] = newValue;
    } else if (valueType === 'number') {
      const { newValue } = await inquirer.prompt({
        type: 'number',
        name: 'newValue',
        message: `Enter new value for '${key}':`,
        default: currentValue,
      });

      currentSettings[key] = newValue;
    } else if (valueType === 'boolean') {
      const { newValue } = await inquirer.prompt({
        type: 'confirm',
        name: 'newValue',
        message: `Enter new value for '${key}':`,
        default: currentValue,
      });

      currentSettings[key] = newValue;
    } else if (Array.isArray(currentValue)) {
      const { newValue } = await inquirer.prompt({
        type: 'input',
        name: 'newValue',
        message: `Enter new comma-separated values for '${key}':`,
        default: currentValue.join(', '),
      });

      currentSettings[key] = newValue.split(',').map(item => item.trim());
    } else if (valueType === 'object') {
      console.log(chalk.yellow('Enter a valid JSON object:'));
      try {
        const { newValue } = await inquirer.prompt({
          type: 'input',
          name: 'newValue',
          message: `Enter new value for '${key}' (as JSON):`,
          default: JSON.stringify(currentValue),
          validate: input => {
            try {
              JSON.parse(input);
              return true;
            } catch (error) {
              return 'Please enter a valid JSON object';
            }
          },
        });

        currentSettings[key] = JSON.parse(newValue);
      } catch (error) {
        console.error(chalk.red(`Invalid JSON: ${error.message}`));
      }
    }

    // Save settings
    this.saveSettings(pluginName, currentSettings);

    // Offer to edit another setting
    const { another } = await inquirer.prompt({
      type: 'confirm',
      name: 'another',
      message: 'Edit another setting?',
      default: false,
    });

    if (another) {
      await this.editSettings(pluginName);
    }
  }

  /**
   * Add new settings
   * @param pluginName The name of the plugin
   * @param currentSettings The current settings
   * @param defaultSettings Default settings from manifest
   */
  private async addNewSettings(
    pluginName: string,
    currentSettings: PluginSettings,
    defaultSettings: Record<string, any>
  ): Promise<void> {
    // First, let's check for defined settings in the manifest that aren't set yet
    const definedKeys = Object.keys(defaultSettings);
    const unsetDefinedKeys = definedKeys.filter(key => !(key in currentSettings));

    let settingsToAdd: Record<string, string> = {};

    if (unsetDefinedKeys.length > 0) {
      // Ask if the user wants to use predefined settings
      const { usePredefined } = await inquirer.prompt({
        type: 'confirm',
        name: 'usePredefined',
        message: `There are ${unsetDefinedKeys.length} predefined settings not yet configured. Use these?`,
        default: true,
      });

      if (usePredefined) {
        const { selectedKeys } = await inquirer.prompt({
          type: 'checkbox',
          name: 'selectedKeys',
          message: 'Select predefined settings to add:',
          choices: unsetDefinedKeys.map(key => ({
            name: `${key}: ${JSON.stringify(defaultSettings[key])}`,
            value: key,
            checked: true,
          })),
        });

        // Add selected predefined settings
        for (const key of selectedKeys) {
          currentSettings[key] = defaultSettings[key];
        }

        // Save settings
        this.saveSettings(pluginName, currentSettings);

        console.log(chalk.green('Predefined settings added successfully!'));

        // Ask if user wants to add custom settings too
        const { addCustom } = await inquirer.prompt({
          type: 'confirm',
          name: 'addCustom',
          message: 'Add custom settings too?',
          default: false,
        });

        if (!addCustom) {
          return;
        }
      }
    }

    // Add custom settings
    const { key } = await inquirer.prompt({
      type: 'input',
      name: 'key',
      message: 'Enter setting key:',
      validate: input => {
        if (!input.trim()) return 'Setting key is required';
        return true;
      },
    });

    const { valueType } = await inquirer.prompt({
      type: 'list',
      name: 'valueType',
      message: 'Select value type:',
      choices: [
        { name: 'String', value: 'string' },
        { name: 'Number', value: 'number' },
        { name: 'Boolean', value: 'boolean' },
        { name: 'Array', value: 'array' },
        { name: 'Object', value: 'object' },
      ],
    });

    let value: any;

    switch (valueType) {
      case 'string':
        const { stringValue } = await inquirer.prompt({
          type: 'input',
          name: 'stringValue',
          message: 'Value:',
        });
        value = stringValue;
        break;

      case 'number':
        const { numberValue } = await inquirer.prompt({
          type: 'number',
          name: 'numberValue',
          message: 'Value:',
          validate: input => {
            if (isNaN(input)) return 'Please enter a valid number';
            return true;
          },
        });
        value = numberValue;
        break;

      case 'boolean':
        const { booleanValue } = await inquirer.prompt({
          type: 'confirm',
          name: 'booleanValue',
          message: 'Value:',
          default: false,
        });
        value = booleanValue;
        break;

      case 'array':
        const { arrayValue } = await inquirer.prompt({
          type: 'input',
          name: 'arrayValue',
          message: 'Enter comma-separated values:',
        });
        value = arrayValue.split(',').map((item: string) => item.trim());
        break;

      case 'object':
        console.log(chalk.yellow('Enter a valid JSON object:'));
        try {
          const { objectValue } = await inquirer.prompt({
            type: 'input',
            name: 'objectValue',
            message: 'Value (as JSON):',
            validate: input => {
              try {
                JSON.parse(input);
                return true;
              } catch (error) {
                return 'Please enter a valid JSON object';
              }
            },
          });
          value = JSON.parse(objectValue);
        } catch (error) {
          console.error(chalk.red(`Invalid JSON: ${error.message}`));
          value = {};
        }
        break;
    }

    // Add the new setting
    currentSettings[key] = value;

    // Save settings
    this.saveSettings(pluginName, currentSettings);

    // Offer to add another setting
    const { another } = await inquirer.prompt({
      type: 'confirm',
      name: 'another',
      message: 'Add another setting?',
      default: false,
    });

    if (another) {
      await this.addNewSettings(pluginName, currentSettings, defaultSettings);
    }
  }

  /**
   * Delete settings
   * @param pluginName The name of the plugin
   * @param currentSettings The current settings
   */
  private async deleteSettings(pluginName: string, currentSettings: PluginSettings): Promise<void> {
    const { keysToDelete } = await inquirer.prompt({
      type: 'checkbox',
      name: 'keysToDelete',
      message: 'Select settings to delete:',
      choices: Object.keys(currentSettings).map(key => ({
        name: `${key}: ${JSON.stringify(currentSettings[key])}`,
        value: key,
      })),
    });

    if (keysToDelete.length === 0) {
      console.log(chalk.yellow('No settings selected for deletion.'));
      return;
    }

    // Delete selected settings
    for (const key of keysToDelete) {
      delete currentSettings[key];
    }

    // Save settings
    this.saveSettings(pluginName, currentSettings);

    console.log(chalk.green(`${keysToDelete.length} setting(s) deleted successfully!`));
  }

  /**
   * Reset settings to defaults
   * @param pluginName The name of the plugin
   * @param defaultSettings Default settings from manifest
   */
  private async resetSettings(
    pluginName: string,
    defaultSettings: Record<string, any>
  ): Promise<void> {
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all settings to defaults?',
      default: false,
    });

    if (!confirm) {
      console.log(chalk.yellow('Reset cancelled.'));
      return;
    }

    // Reset to defaults
    this.saveSettings(pluginName, { ...defaultSettings });

    console.log(chalk.green('Settings reset to defaults successfully!'));
  }

  /**
   * List all plugins with settings
   */
  async listPluginsWithSettings(): Promise<void> {
    console.log(chalk.blue.bold('\n⚙️ Plugins with Settings'));
    console.log(chalk.blue('───────────────────────\n'));

    // Get all plugins
    const pluginDirs = fs
      .readdirSync(this.pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (pluginDirs.length === 0) {
      console.log(chalk.yellow('No plugins found.'));
      return;
    }

    // Get all settings files
    const settingsFiles = fs
      .readdirSync(this.settingsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    // Find plugins with settings
    const pluginsWithSettings: string[] = [];

    for (const pluginName of pluginDirs) {
      // Check if plugin has settings file
      if (settingsFiles.includes(pluginName)) {
        pluginsWithSettings.push(pluginName);
        continue;
      }

      // Check if plugin has settings in manifest
      const manifestPath = path.join(this.pluginsDir, pluginName, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifestContent = fs.readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestContent);

          if (manifest.settings && Object.keys(manifest.settings).length > 0) {
            pluginsWithSettings.push(pluginName);
          }
        } catch (error) {
          // Ignore errors
        }
      }
    }

    if (pluginsWithSettings.length === 0) {
      console.log(chalk.yellow('No plugins with settings found.'));
      return;
    }

    // Display plugins with settings
    console.log(chalk.green(`Found ${pluginsWithSettings.length} plugin(s) with settings:`));

    for (const pluginName of pluginsWithSettings) {
      const settings = this.getSettings(pluginName);
      const settingCount = Object.keys(settings).length;

      console.log(`${chalk.green(pluginName)} (${settingCount} setting(s))`);

      // Show first few settings as preview
      const previewKeys = Object.keys(settings).slice(0, 3);
      if (previewKeys.length > 0) {
        for (const key of previewKeys) {
          console.log(`  ${key}: ${JSON.stringify(settings[key])}`);
        }

        if (Object.keys(settings).length > 3) {
          console.log(`  ${chalk.gray('...')}`);
        }

        console.log('');
      }
    }

    // Ask which plugin to edit
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: "Edit a plugin's settings", value: 'edit' },
        { name: 'Exit', value: 'exit' },
      ],
    });

    if (action === 'exit') {
      return;
    }

    const { pluginName } = await inquirer.prompt({
      type: 'list',
      name: 'pluginName',
      message: 'Select a plugin to edit:',
      choices: pluginsWithSettings.map(name => ({ name, value: name })),
    });

    await this.editSettings(pluginName);
  }
}
