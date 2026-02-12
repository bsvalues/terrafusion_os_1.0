import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interface for plugin configuration
 */
interface PluginConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  tools: string[];
  hooks: {
    [key: string]: string[];
  };
  commands: string[];
  tags: string[];
  dependencies: string[];
  repository?: string;
  settings?: {
    [key: string]: any;
  };
}

/**
 * Plugin Configuration Wizard
 * Provides an interactive wizard for setting up plugin configurations
 */
export class PluginConfigWizard {
  private pluginsDir: string;

  constructor(pluginsDir: string) {
    this.pluginsDir = pluginsDir;
  }

  /**
   * Start the configuration wizard
   * @param pluginName Optional plugin name to edit an existing plugin
   */
  async startWizard(pluginName?: string): Promise<void> {
    console.log(chalk.blue.bold('\n📦 Plugin Configuration Wizard'));
    console.log(chalk.blue('─────────────────────────────\n'));

    const isEditing = !!pluginName;
    let pluginDir: string;
    let existingConfig: PluginConfig | null = null;

    if (isEditing) {
      // Edit an existing plugin
      pluginDir = path.join(this.pluginsDir, pluginName);

      if (!fs.existsSync(pluginDir)) {
        console.log(chalk.red(`Plugin '${pluginName}' not found.`));
        return;
      }

      // Load existing configuration
      const manifestPath = path.join(pluginDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifestContent = fs.readFileSync(manifestPath, 'utf8');
          existingConfig = JSON.parse(manifestContent) as PluginConfig;
          console.log(
            chalk.green(`Editing plugin: ${existingConfig.name} v${existingConfig.version}`)
          );
        } catch (error) {
          console.error(chalk.red(`Error loading plugin manifest: ${error.message}`));
          return;
        }
      } else {
        console.log(
          chalk.yellow(`Warning: Plugin '${pluginName}' exists but has no manifest.json`)
        );
      }
    } else {
      // Create a new plugin
      const { newPluginName } = await inquirer.prompt({
        type: 'input',
        name: 'newPluginName',
        message: 'Plugin name:',
        validate: input => {
          if (!input.trim()) return 'Plugin name is required';
          if (!/^[a-z0-9-_]+$/.test(input))
            return 'Plugin name must contain only lowercase letters, numbers, hyphens, and underscores';
          return true;
        },
      });

      pluginName = newPluginName;
      pluginDir = path.join(this.pluginsDir, pluginName);

      // Check if plugin already exists
      if (fs.existsSync(pluginDir)) {
        const { overwrite } = await inquirer.prompt({
          type: 'confirm',
          name: 'overwrite',
          message: `Plugin '${pluginName}' already exists. Overwrite?`,
          default: false,
        });

        if (!overwrite) {
          console.log(chalk.yellow('Plugin creation cancelled.'));
          return;
        }
      }
    }

    // Get the plugin configuration through a series of prompts
    const config = await this.promptForConfiguration(existingConfig);

    // Set the name from the input or existing config
    config.name = pluginName;

    // Create or update the plugin
    await this.createOrUpdatePlugin(pluginDir, config);

    console.log(chalk.green.bold('\n✅ Plugin configuration completed successfully!'));
    console.log(chalk.green(`Plugin directory: ${pluginDir}`));
  }

  /**
   * Prompt for plugin configuration
   * @param existingConfig Optional existing configuration
   * @returns The plugin configuration
   */
  private async promptForConfiguration(existingConfig: PluginConfig | null): Promise<PluginConfig> {
    // Start with default or existing config
    const config: PluginConfig = existingConfig || {
      name: '',
      version: '1.0.0',
      description: '',
      author: '',
      tools: [],
      hooks: {},
      commands: [],
      tags: [],
      dependencies: [],
      settings: {},
    };

    // Basic information
    const basicInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: config.version,
        validate: input => {
          if (!/^\\d+\\.\\d+\\.\\d+$/.test(input))
            return 'Version must be in semver format (e.g., 1.0.0)';
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: config.description,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: config.author,
      },
      {
        type: 'input',
        name: 'repository',
        message: 'Repository URL (optional):',
        default: config.repository || '',
      },
    ]);

    Object.assign(config, basicInfo);

    // Tags
    const { tagsInput } = await inquirer.prompt({
      type: 'input',
      name: 'tagsInput',
      message: 'Tags (comma-separated):',
      default: config.tags.join(', '),
    });

    config.tags = tagsInput
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag);

    // Let's ask about features to include
    const { features } = await inquirer.prompt({
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        {
          name: 'Tools (extend agent capabilities)',
          value: 'tools',
          checked: config.tools.length > 0,
        },
        {
          name: 'Hooks (run code at specific lifecycle events)',
          value: 'hooks',
          checked: Object.keys(config.hooks).length > 0,
        },
        {
          name: 'Commands (add new CLI commands)',
          value: 'commands',
          checked: config.commands.length > 0,
        },
        {
          name: 'Settings (configurable plugin options)',
          value: 'settings',
          checked: !!config.settings && Object.keys(config.settings).length > 0,
        },
      ],
    });

    // Configure tools
    if (features.includes('tools')) {
      await this.configureFolderPrompt(
        config,
        'tools',
        'tools',
        'Tools',
        'Enter tool filename (without path, e.g., myTool.js):'
      );
    }

    // Configure hooks
    if (features.includes('hooks')) {
      const hookTypes = ['beforeCommand', 'afterCommand', 'beforePluginLoad', 'afterPluginLoad'];
      const { selectedHooks } = await inquirer.prompt({
        type: 'checkbox',
        name: 'selectedHooks',
        message: 'Select hook types to include:',
        choices: hookTypes.map(hook => ({
          name: hook,
          value: hook,
          checked: config.hooks && config.hooks[hook] && config.hooks[hook].length > 0,
        })),
      });

      // Initialize hooks object if it doesn't exist
      if (!config.hooks) {
        config.hooks = {};
      }

      // Configure each selected hook type
      for (const hookType of selectedHooks) {
        await this.configureFolderPrompt(
          config,
          hookType,
          'hooks',
          `Hooks for ${hookType}`,
          `Enter hook filename for ${hookType} (without path, e.g., myHook.js):`,
          'hooks'
        );
      }

      // Remove hook types that weren't selected
      for (const hookType of hookTypes) {
        if (!selectedHooks.includes(hookType) && config.hooks[hookType]) {
          delete config.hooks[hookType];
        }
      }
    }

    // Configure commands
    if (features.includes('commands')) {
      await this.configureFolderPrompt(
        config,
        'commands',
        'commands',
        'Commands',
        'Enter command filename (without path, e.g., myCommand.js):'
      );
    }

    // Configure settings
    if (features.includes('settings')) {
      await this.configureSettings(config);
    }

    // Dependencies
    const { depsInput } = await inquirer.prompt({
      type: 'input',
      name: 'depsInput',
      message: 'Dependencies (comma-separated npm packages):',
      default: config.dependencies.join(', '),
    });

    config.dependencies = depsInput
      .split(',')
      .map((dep: string) => dep.trim())
      .filter((dep: string) => dep);

    return config;
  }

  /**
   * Configure files in a specific folder
   * @param config The plugin configuration
   * @param configKey The key in the config to store files
   * @param folderName The folder name
   * @param displayName The display name for the folder
   * @param promptMessage The message to prompt for files
   * @param parentKey For nested config like hooks, the parent key
   */
  private async configureFolderPrompt(
    config: PluginConfig,
    configKey: string,
    folderName: string,
    displayName: string,
    promptMessage: string,
    parentKey?: string
  ): Promise<void> {
    console.log(chalk.cyan(`\n📂 ${displayName} Configuration`));

    // Get current files
    let currentFiles: string[] = [];

    if (parentKey) {
      // For nested config like hooks
      if (config[parentKey] && config[parentKey][configKey]) {
        currentFiles = config[parentKey][configKey];
      }
    } else {
      // For top-level config
      if (config[configKey]) {
        currentFiles = config[configKey];
      }
    }

    // Display current files if any
    if (currentFiles.length > 0) {
      console.log(chalk.yellow('Current files:'));
      currentFiles.forEach((file /* , index */) => {
        console.log(`  ${index + 1}. ${file}`);
      });
    }

    // Prompt for how to handle files
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: `How would you like to configure ${displayName.toLowerCase()}?`,
      choices: [
        { name: 'Add new files', value: 'add' },
        { name: 'Replace all files', value: 'replace' },
        { name: 'Remove specific files', value: 'remove', disabled: currentFiles.length === 0 },
        { name: 'Skip (keep current configuration)', value: 'skip' },
      ],
    });

    if (action === 'skip') {
      return;
    }

    let newFiles: string[] = [...currentFiles];

    if (action === 'replace') {
      newFiles = [];
    }

    if (action === 'add' || action === 'replace') {
      let addMore = true;

      while (addMore) {
        const { file } = await inquirer.prompt({
          type: 'input',
          name: 'file',
          message: promptMessage,
        });

        if (file.trim()) {
          // Add folder name to the path
          const filePath = path.join(folderName, file.trim());
          newFiles.push(filePath);

          console.log(chalk.green(`Added: ${filePath}`));
        }

        const { continue: continueAdding } = await inquirer.prompt({
          type: 'confirm',
          name: 'continue',
          message: 'Add another file?',
          default: false,
        });

        addMore = continueAdding;
      }
    } else if (action === 'remove') {
      const { filesToRemove } = await inquirer.prompt({
        type: 'checkbox',
        name: 'filesToRemove',
        message: 'Select files to remove:',
        choices: currentFiles.map(file => ({ name: file, value: file })),
      });

      newFiles = currentFiles.filter(file => !filesToRemove.includes(file));
    }

    // Update the configuration
    if (parentKey) {
      // For nested config like hooks
      if (!config[parentKey]) {
        config[parentKey] = {};
      }
      config[parentKey][configKey] = newFiles;
    } else {
      // For top-level config
      config[configKey] = newFiles;
    }
  }

  /**
   * Configure plugin settings
   * @param config The plugin configuration
   */
  private async configureSettings(config: PluginConfig): Promise<void> {
    console.log(chalk.cyan('\n⚙️ Plugin Settings Configuration'));

    if (!config.settings) {
      config.settings = {};
    }

    // Display current settings if any
    const currentSettings = config.settings;
    if (Object.keys(currentSettings).length > 0) {
      console.log(chalk.yellow('Current settings:'));
      Object.entries(currentSettings).forEach(([key, value] /* , index */) => {
        console.log(`  ${index + 1}. ${key}: ${JSON.stringify(value)}`);
      });
    }

    // Prompt for how to handle settings
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'How would you like to configure settings?',
      choices: [
        { name: 'Add new settings', value: 'add' },
        { name: 'Replace all settings', value: 'replace' },
        {
          name: 'Remove specific settings',
          value: 'remove',
          disabled: Object.keys(currentSettings).length === 0,
        },
        { name: 'Skip (keep current settings)', value: 'skip' },
      ],
    });

    if (action === 'skip') {
      return;
    }

    let newSettings = { ...currentSettings };

    if (action === 'replace') {
      newSettings = {};
    }

    if (action === 'add' || action === 'replace') {
      let addMore = true;

      while (addMore) {
        const { key } = await inquirer.prompt({
          type: 'input',
          name: 'key',
          message: 'Setting key:',
          validate: input => {
            if (!input.trim()) return 'Setting key is required';
            return true;
          },
        });

        const { valueType } = await inquirer.prompt({
          type: 'list',
          name: 'valueType',
          message: 'Value type:',
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

        newSettings[key] = value;
        console.log(chalk.green(`Added setting: ${key} = ${JSON.stringify(value)}`));

        const { continue: continueAdding } = await inquirer.prompt({
          type: 'confirm',
          name: 'continue',
          message: 'Add another setting?',
          default: false,
        });

        addMore = continueAdding;
      }
    } else if (action === 'remove') {
      const { keysToRemove } = await inquirer.prompt({
        type: 'checkbox',
        name: 'keysToRemove',
        message: 'Select settings to remove:',
        choices: Object.keys(currentSettings).map(key => ({ name: key, value: key })),
      });

      for (const key of keysToRemove) {
        delete newSettings[key];
      }
    }

    // Update the configuration
    config.settings = newSettings;
  }

  /**
   * Create or update a plugin with the given configuration
   * @param pluginDir The plugin directory
   * @param config The plugin configuration
   */
  private async createOrUpdatePlugin(pluginDir: string, config: PluginConfig): Promise<void> {
    const spinner = ora('Creating plugin structure...').start();

    try {
      // Create the plugin directory if it doesn't exist
      if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
      }

      // Create necessary subdirectories
      const directories = ['tools', 'hooks', 'commands'];
      for (const dir of directories) {
        const dirPath = path.join(pluginDir, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      // Write the manifest.json file
      const manifestPath = path.join(pluginDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(config, null, 2));

      // Create README.md if it doesn't exist
      const readmePath = path.join(pluginDir, 'README.md');
      if (!fs.existsSync(readmePath)) {
        const readmeContent = this.generateReadme(config);
        fs.writeFileSync(readmePath, readmeContent);
      }

      // Create template files for tools, hooks, and commands
      await this.createTemplateFiles(pluginDir, config);

      spinner.succeed('Plugin structure created successfully!');
    } catch (error) {
      spinner.fail(`Error creating plugin structure: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create template files for tools, hooks, and commands
   * @param pluginDir The plugin directory
   * @param config The plugin configuration
   */
  private async createTemplateFiles(pluginDir: string, config: PluginConfig): Promise<void> {
    // Create template files for tools
    for (const toolPath of config.tools) {
      const fullPath = path.join(pluginDir, toolPath);

      // Only create if the file doesn't exist
      if (!fs.existsSync(fullPath)) {
        const toolName = path.basename(toolPath, path.extname(toolPath));

        // Generate camelCase and PascalCase versions of the tool name
        const camelCase = toolName.replace(/-([a-z])/g, g => g[1].toUpperCase());
        const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);

        const toolTemplate = `import { BaseTool } from '../../../src/tools/types.js';

/**
 * ${pascalCase} Tool 
 */
export class ${pascalCase} extends BaseTool {
  constructor() {
    super(
      '${config.name}_${camelCase}',
      'A tool for ${config.name}',
      {
        input: {
          name: 'input',
          description: 'Input for the tool',
          type: 'string',
          required: true
        },
        option: {
          name: 'option',
          description: 'Optional parameter',
          type: 'string',
          required: false,
          default: 'default value'
        }
      },
      ['${config.name}', '${camelCase}']
    );
  }
  
  async execute(args) {
    try {
      const { input, option = 'default value' } = args;
      
      // Your tool logic here
      const output = \`Processed \${input} with option \${option}\`;
      
      return {
        success: true,
        output,
        data: { input, option, processed: true }
      };
    } catch (error) {
      return {
        success: false,
        output: \`Error executing ${camelCase}: \${error.message}\`,
        error
      };
    }
  }
}

// Export an instance of the tool
export default new ${pascalCase}();`;

        fs.writeFileSync(fullPath, toolTemplate);
      }
    }

    // Create template files for hooks
    for (const [hookType, hookPaths] of Object.entries(config.hooks)) {
      for (const hookPath of hookPaths) {
        const fullPath = path.join(pluginDir, hookPath);

        // Only create if the file doesn't exist
        if (!fs.existsSync(fullPath)) {
          let hookTemplate = '';

          switch (hookType) {
            case 'beforeCommand':
              hookTemplate = `/**
 * This hook runs before a command is executed
 * 
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command being executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @returns {Promise<void>}
 */
export default async function beforeCommand(context) {
  console.log(\`[${config.name}] Before executing command: \${context.command}\`);
  
  // Your hook logic here
  // You can modify the context object to affect the command execution
}`;
              break;

            case 'afterCommand':
              hookTemplate = `/**
 * This hook runs after a command is executed
 * 
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command that was executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @param {Object} context.result - The command result
 * @returns {Promise<void>}
 */
export default async function afterCommand(context) {
  console.log(\`[${config.name}] After executing command: \${context.command}\`);
  
  // Your hook logic here
  // You can perform additional actions based on the command result
}`;
              break;

            case 'beforePluginLoad':
              hookTemplate = `/**
 * This hook runs before the plugin is loaded
 * 
 * @param {Object} context - The plugin load context
 * @param {Object} context.pluginConfig - The plugin configuration
 * @param {Object} context.pluginPath - The plugin path
 * @returns {Promise<void>}
 */
export default async function beforePluginLoad(context) {
  console.log(\`[${config.name}] Before plugin load\`);
  
  // Your hook logic here
  // You can perform setup operations before the plugin is loaded
}`;
              break;

            case 'afterPluginLoad':
              hookTemplate = `/**
 * This hook runs after the plugin is loaded
 * 
 * @param {Object} context - The plugin load context
 * @param {Object} context.pluginConfig - The plugin configuration
 * @param {Object} context.pluginPath - The plugin path
 * @param {Object} context.pluginInstance - The loaded plugin instance
 * @returns {Promise<void>}
 */
export default async function afterPluginLoad(context) {
  console.log(\`[${config.name}] After plugin load\`);
  
  // Your hook logic here
  // You can perform additional setup operations after the plugin is loaded
}`;
              break;
          }

          fs.writeFileSync(fullPath, hookTemplate);
        }
      }
    }

    // Create template files for commands
    for (const commandPath of config.commands) {
      const fullPath = path.join(pluginDir, commandPath);

      // Only create if the file doesn't exist
      if (!fs.existsSync(fullPath)) {
        const commandName = path.basename(commandPath, path.extname(commandPath));

        // Generate camelCase version of the command name
        const camelCase = commandName.replace(/-([a-z])/g, g => g[1].toUpperCase());

        const commandTemplate = `import { Command } from 'commander';

/**
 * Register the ${camelCase} command
 */
export function register(program) {
  program
    .command('${camelCase}')
    .description('A command for ${config.name}')
    .option('-o, --option <value>', 'An option for the command')
    .action(async (options) => {
      console.log(\`Executing ${camelCase} command with options: \${JSON.stringify(options)}\`);
      
      // Your command logic here
      
      console.log('Command completed successfully!');
    });
}`;

        fs.writeFileSync(fullPath, commandTemplate);
      }
    }
  }

  /**
   * Generate a README.md file for the plugin
   * @param config The plugin configuration
   * @returns The README content
   */
  private generateReadme(config: PluginConfig): string {
    return `# ${config.name}

${config.description}

## Installation

\`\`\`bash
codeagent plugin --install /path/to/${config.name}
\`\`\`

${config.repository ? `## Repository\n\n${config.repository}\n` : ''}

## Features

${config.tools.length > 0 ? '- Custom tools\n' : ''}${Object.keys(config.hooks).length > 0 ? '- Command hooks\n' : ''}${config.commands.length > 0 ? '- Custom commands\n' : ''}${config.settings && Object.keys(config.settings).length > 0 ? '- Configurable settings\n' : ''}

${config.tools.length > 0 ? `## Tools\n\n${config.tools.map(tool => `- \`${path.basename(tool, path.extname(tool))}\`: A tool for ${config.name}`).join('\n')}\n` : ''}

${
  Object.keys(config.hooks).length > 0
    ? `## Hooks\n\n${Object.entries(config.hooks)
        .map(
          ([hookType, hooks]) =>
            `### ${hookType}\n\n${hooks.map(hook => `- \`${path.basename(hook, path.extname(hook))}\``).join('\n')}`
        )
        .join('\n\n')}\n`
    : ''
}

${config.commands.length > 0 ? `## Commands\n\n${config.commands.map(command => `- \`${path.basename(command, path.extname(command))}\`: A command for ${config.name}`).join('\n')}\n` : ''}

${
  config.settings && Object.keys(config.settings).length > 0
    ? `## Settings\n\n${Object.entries(config.settings)
        .map(([key, value]) => `- \`${key}\`: ${JSON.stringify(value)}`)
        .join('\n')}\n`
    : ''
}

## Development

This plugin was created with the CodeAgent Plugin Configuration Wizard.

To modify this plugin, edit the files in this directory and reinstall it:

\`\`\`bash
codeagent plugin --install /path/to/${config.name}
\`\`\`

## Author

${config.author}
`;
  }
}
