import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Register the config command
 */
export function register(program: Command): void {
  program
    .command('config')
    .description('Configure CodeAgent settings')
    .option('-l, --list', 'List all configuration settings')
    .option('-g, --get <key>', 'Get a specific configuration value')
    .option('-s, --set <key>', 'Set a specific configuration value')
    .option('-d, --delete <key>', 'Delete a specific configuration key')
    .option('-i, --interactive', 'Start interactive configuration mode')
    .option('-p, --profile <name>', 'Use a specific configuration profile')
    .action(async (options, command) => {
      // Get the config path
      const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
      const configDir = path.join(homeDir, '.codeagent');
      const configPath = path.join(configDir, 'config.json');

      // Create the config directory if it doesn't exist
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Load the existing config file
      let config: any = {};
      if (fs.existsSync(configPath)) {
        try {
          const configFile = fs.readFileSync(configPath, 'utf8');
          config = JSON.parse(configFile);
        } catch (error) {
          console.error(chalk.red(`Error loading config file: ${error.message}`));

          // If the file exists but is invalid, create a backup
          const backupPath = path.join(configDir, `config.backup-${Date.now()}.json`);
          fs.copyFileSync(configPath, backupPath);
          console.log(chalk.yellow(`Created backup of invalid config file at ${backupPath}`));

          // Reset config
          config = {};
        }
      }

      // Get the active profile name
      const profile = options.profile || 'default';

      // Make sure the profile exists
      if (!config[profile]) {
        config[profile] = {};
      }

      // Handle interactive mode
      if (options.interactive) {
        await interactiveConfig(config, profile, configPath);
        return;
      }

      // Handle list option
      if (options.list) {
        listConfig(config, profile);
        return;
      }

      // Handle get option
      if (options.get) {
        getConfigValue(config, profile, options.get);
        return;
      }

      // Handle set option
      if (options.set) {
        const { value } = await inquirer.prompt({
          type: 'input',
          name: 'value',
          message: `Enter value for ${options.set}:`,
        });

        setConfigValue(config, profile, options.set, value, configPath);
        return;
      }

      // Handle delete option
      if (options.delete) {
        deleteConfigValue(config, profile, options.delete, configPath);
        return;
      }

      // Default to list if no options provided
      listConfig(config, profile);
    });
}

/**
 * Interactive configuration mode
 */
async function interactiveConfig(config: any, profile: string, configPath: string): Promise<void> {
  console.log(chalk.blue.bold(`Interactive Configuration (Profile: ${profile})`));

  // Define the configuration categories and options
  const categories = [
    {
      name: 'General Settings',
      options: [
        {
          key: 'model',
          name: 'AI Model',
          type: 'list',
          default: 'gpt-4o',
          choices: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        },
        { key: 'temperature', name: 'Temperature', type: 'number', default: 0.7 },
        { key: 'maxTokens', name: 'Max Tokens', type: 'number', default: 8192 },
      ],
    },
    {
      name: 'User Preferences',
      options: [
        {
          key: 'userPreferences.codeStyle',
          name: 'Code Style',
          type: 'list',
          default: 'standard',
          choices: ['standard', 'google', 'airbnb'],
        },
        {
          key: 'userPreferences.indentation',
          name: 'Indentation',
          type: 'list',
          default: '2spaces',
          choices: ['tabs', '2spaces', '4spaces'],
        },
        {
          key: 'userPreferences.commentStyle',
          name: 'Comment Style',
          type: 'list',
          default: 'moderate',
          choices: ['minimal', 'moderate', 'verbose'],
        },
      ],
    },
    {
      name: 'Tool Settings',
      options: [
        {
          key: 'toolSettings.defaultTools',
          name: 'Default Tools',
          type: 'checkbox',
          default: ['file_read', 'file_write', 'command_exec'],
          choices: [
            'file_read',
            'file_write',
            'command_exec',
            'git_op',
            'dependency',
            'code_analysis',
          ],
        },
      ],
    },
  ];

  // Select a category
  const { category } = await inquirer.prompt({
    type: 'list',
    name: 'category',
    message: 'Select a configuration category:',
    choices: categories.map(cat => cat.name).concat(['Save and Exit']),
  });

  if (category === 'Save and Exit') {
    saveConfig(config, configPath);
    return;
  }

  // Find the selected category
  const selectedCategory = categories.find(cat => cat.name === category);

  if (selectedCategory) {
    // Show the options for the selected category
    for (const option of selectedCategory.options) {
      // Get the current value and default
      const currentValue = getNestedValue(config[profile], option.key) ?? option.default;

      // Prompt for the new value
      let newValue;

      if (option.type === 'list') {
        const { value } = await inquirer.prompt({
          type: 'list',
          name: 'value',
          message: `${option.name} (${option.key}):`,
          default: currentValue,
          choices: option.choices,
        });

        newValue = value;
      } else if (option.type === 'checkbox') {
        const { value } = await inquirer.prompt({
          type: 'checkbox',
          name: 'value',
          message: `${option.name} (${option.key}):`,
          default: currentValue,
          choices: option.choices,
        });

        newValue = value;
      } else if (option.type === 'number') {
        const { value } = await inquirer.prompt({
          type: 'number',
          name: 'value',
          message: `${option.name} (${option.key}):`,
          default: currentValue,
        });

        newValue = value;
      } else {
        const { value } = await inquirer.prompt({
          type: 'input',
          name: 'value',
          message: `${option.name} (${option.key}):`,
          default: currentValue,
        });

        newValue = value;
      }

      // Set the new value
      setNestedValue(config[profile], option.key, newValue);
    }
  }

  // Save and go back to the category selection
  saveConfig(config, configPath);
  console.log(chalk.green('Configuration saved successfully!'));

  // Continue with the interactive mode
  await interactiveConfig(config, profile, configPath);
}

/**
 * List all configuration settings
 */
function listConfig(config: any, profile: string): void {
  console.log(chalk.blue.bold(`Configuration for profile '${profile}':`));

  if (Object.keys(config[profile]).length === 0) {
    console.log(chalk.yellow('No configuration settings found.'));
    return;
  }

  // Format and display the configuration
  const formatConfig = (obj: any, prefix: string = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(chalk.cyan(`${fullKey}:`));
        formatConfig(value, fullKey);
      } else {
        console.log(`${chalk.green(fullKey)}: ${formatValue(value)}`);
      }
    }
  };

  formatConfig(config[profile]);
}

/**
 * Get a specific configuration value
 */
function getConfigValue(config: any, profile: string, key: string): void {
  const value = getNestedValue(config[profile], key);

  if (value === undefined) {
    console.log(chalk.yellow(`Configuration key '${key}' not found.`));
    return;
  }

  console.log(`${chalk.green(key)}: ${formatValue(value)}`);
}

/**
 * Set a specific configuration value
 */
function setConfigValue(
  config: any,
  profile: string,
  key: string,
  value: string,
  configPath: string
): void {
  // Convert the value to the appropriate type
  let typedValue: any;

  // Try to parse as number
  if (!isNaN(Number(value))) {
    typedValue = Number(value);
  }
  // Try to parse as boolean
  else if (value.toLowerCase() === 'true') {
    typedValue = true;
  } else if (value.toLowerCase() === 'false') {
    typedValue = false;
  }
  // Try to parse as array
  else if (value.startsWith('[') && value.endsWith(']')) {
    try {
      typedValue = JSON.parse(value);
    } catch (e) {
      typedValue = value;
    }
  }
  // Try to parse as object
  else if (value.startsWith('{') && value.endsWith('}')) {
    try {
      typedValue = JSON.parse(value);
    } catch (e) {
      typedValue = value;
    }
  }
  // Default to string
  else {
    typedValue = value;
  }

  // Set the value
  setNestedValue(config[profile], key, typedValue);

  // Save the config
  saveConfig(config, configPath);

  console.log(chalk.green(`Configuration key '${key}' set to '${formatValue(typedValue)}'.`));
}

/**
 * Delete a specific configuration value
 */
function deleteConfigValue(config: any, profile: string, key: string, configPath: string): void {
  const parts = key.split('.');
  let current = config[profile];

  // Navigate to the parent object
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) {
      console.log(chalk.yellow(`Configuration key '${key}' not found.`));
      return;
    }

    current = current[parts[i]];
  }

  // Check if the key exists
  const lastPart = parts[parts.length - 1];
  if (current[lastPart] === undefined) {
    console.log(chalk.yellow(`Configuration key '${key}' not found.`));
    return;
  }

  // Delete the key
  delete current[lastPart];

  // Save the config
  saveConfig(config, configPath);

  console.log(chalk.green(`Configuration key '${key}' deleted.`));
}

/**
 * Save the configuration to the file
 */
function saveConfig(config: any, configPath: string): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red(`Error saving configuration: ${error.message}`));
  }
}

/**
 * Format a value for display
 */
function formatValue(value: any): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Get a nested value from an object
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

/**
 * Set a nested value in an object
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;

  // Create nested objects if they don't exist
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) {
      current[parts[i]] = {};
    }

    current = current[parts[i]];
  }

  // Set the value
  current[parts[parts.length - 1]] = value;
}
