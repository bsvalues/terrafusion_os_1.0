import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import { PluginConfigWizard } from '../plugins/pluginConfigWizard.js';

const execAsync = promisify(exec);

/**
 * Register the plugin command
 */
export function register(program: Command): void {
  program
    .command('plugin')
    .description('Manage CodeAgent plugins')
    .option('-l, --list', 'List all installed plugins')
    .option(
      '-i, --install <source>',
      'Install a plugin from a directory, git repository, or npm package'
    )
    .option('-u, --uninstall <name>', 'Uninstall a plugin')
    .option('-e, --enable <name>', 'Enable a plugin')
    .option('-d, --disable <name>', 'Disable a plugin')
    .option('-c, --create <name>', 'Create a new plugin template')
    .option(
      '-w, --wizard [name]',
      'Start the plugin configuration wizard (optionally with a plugin name to edit)'
    )
    .option('-p, --path <path>', 'Path for plugin operations', getUserPluginsDir())
    .action(async (options, command) => {
      const pluginsDir = options.path;

      // Create the plugins directory if it doesn't exist
      if (!fs.existsSync(pluginsDir)) {
        fs.mkdirSync(pluginsDir, { recursive: true });
      }

      // Handle list option
      if (options.list) {
        listPlugins(pluginsDir);
        return;
      }

      // Handle install option
      if (options.install) {
        await installPlugin(options.install, pluginsDir);
        return;
      }

      // Handle uninstall option
      if (options.uninstall) {
        await uninstallPlugin(options.uninstall, pluginsDir);
        return;
      }

      // Handle enable option
      if (options.enable) {
        await enablePlugin(options.enable, pluginsDir);
        return;
      }

      // Handle disable option
      if (options.disable) {
        await disablePlugin(options.disable, pluginsDir);
        return;
      }

      // Handle create option
      if (options.create) {
        await createPluginTemplate(options.create, pluginsDir);
        return;
      }

      // Handle wizard option
      if (options.wizard !== undefined) {
        const pluginName = typeof options.wizard === 'string' ? options.wizard : undefined;
        const wizard = new PluginConfigWizard(pluginsDir);
        await wizard.startWizard(pluginName);
        return;
      }

      // Default to list if no options provided
      listPlugins(pluginsDir);
    });
}

/**
 * Get the user's plugins directory
 */
function getUserPluginsDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
  return path.join(homeDir, '.codeagent', 'plugins');
}

/**
 * List all installed plugins
 */
function listPlugins(pluginsDir: string): void {
  console.log(chalk.blue.bold('Installed Plugins:'));

  // Check if the plugins directory exists
  if (!fs.existsSync(pluginsDir)) {
    console.log(chalk.yellow('No plugins directory found.'));
    return;
  }

  // Get all subdirectories in the plugins directory
  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (pluginDirs.length === 0) {
    console.log(chalk.yellow('No plugins found.'));
    return;
  }

  // Get information about each plugin
  for (const pluginDir of pluginDirs) {
    const pluginPath = path.join(pluginsDir, pluginDir);
    const manifestPath = path.join(pluginPath, 'manifest.json');

    if (fs.existsSync(manifestPath)) {
      try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        // Check if the plugin is disabled
        const disabledPath = path.join(pluginPath, '.disabled');
        const isDisabled = fs.existsSync(disabledPath);

        // Display plugin information
        console.log(
          `${chalk.green(manifest.name)} ${chalk.gray(`v${manifest.version}`)} ${isDisabled ? chalk.red('[Disabled]') : chalk.green('[Enabled]')}`
        );
        console.log(`  ${manifest.description}`);

        // Display author if available
        if (manifest.author) {
          console.log(`  Author: ${manifest.author}`);
        }

        // Display tools if available
        if (manifest.tools && manifest.tools.length > 0) {
          console.log(`  Tools: ${manifest.tools.length}`);
        }

        // Display hooks if available
        if (manifest.hooks) {
          const hookCount = Object.values(manifest.hooks).reduce(
            (sum, hooks) => sum + (hooks as any[]).length,
            0
          );
          if (hookCount > 0) {
            console.log(`  Hooks: ${hookCount}`);
          }
        }

        console.log('');
      } catch (error) {
        console.log(`${chalk.red(pluginDir)} ${chalk.red('[Invalid manifest]')}`);
      }
    } else {
      console.log(`${chalk.red(pluginDir)} ${chalk.red('[Invalid plugin: no manifest]')}`);
    }
  }
}

/**
 * Install a plugin from a directory, git repository, or npm package
 */
async function installPlugin(source: string, pluginsDir: string): Promise<void> {
  const spinner = ora(`Installing plugin from ${source}...`).start();

  try {
    // Determine the source type
    if (source.startsWith('git+') || source.includes('.git')) {
      // Git repository
      await installPluginFromGit(source, pluginsDir);
    } else if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
      // Local directory
      await installPluginFromDirectory(source, pluginsDir);
    } else if (source.startsWith('@') || !source.includes('/')) {
      // npm package
      await installPluginFromNpm(source, pluginsDir);
    } else {
      // Assume it's a local directory
      await installPluginFromDirectory(source, pluginsDir);
    }

    spinner.succeed(`Plugin installed successfully.`);
  } catch (error) {
    spinner.fail(`Error installing plugin: ${error.message}`);
  }
}

/**
 * Install a plugin from a git repository
 */
async function installPluginFromGit(gitUrl: string, pluginsDir: string): Promise<void> {
  // Create a temporary directory
  const tempDir = path.join(pluginsDir, `.temp-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Clone the repository
    await execAsync(`git clone ${gitUrl} ${tempDir}`);

    // Check if it's a valid plugin
    const manifestPath = path.join(tempDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Invalid plugin: no manifest.json found');
    }

    // Read the manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Create the plugin directory
    const pluginDir = path.join(pluginsDir, manifest.name);

    // Remove the existing plugin directory if it exists
    if (fs.existsSync(pluginDir)) {
      await fs.promises.rm(pluginDir, { recursive: true, force: true });
    }

    // Move the plugin to the plugins directory
    await fs.promises.rename(tempDir, pluginDir);

    console.log(chalk.green(`Plugin ${manifest.name} installed successfully.`));
  } catch (error) {
    // Clean up the temporary directory
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }

    throw error;
  }
}

/**
 * Install a plugin from a local directory
 */
async function installPluginFromDirectory(sourcePath: string, pluginsDir: string): Promise<void> {
  // Resolve the source path
  const resolvedSourcePath = path.resolve(sourcePath);

  // Check if it's a valid plugin
  const manifestPath = path.join(resolvedSourcePath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Invalid plugin: no manifest.json found');
  }

  // Read the manifest
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  // Create the plugin directory
  const pluginDir = path.join(pluginsDir, manifest.name);

  // Remove the existing plugin directory if it exists
  if (fs.existsSync(pluginDir)) {
    await fs.promises.rm(pluginDir, { recursive: true, force: true });
  }

  // Copy the plugin to the plugins directory
  await copyDirectory(resolvedSourcePath, pluginDir);

  console.log(chalk.green(`Plugin ${manifest.name} installed successfully.`));
}

/**
 * Install a plugin from an npm package
 */
async function installPluginFromNpm(packageName: string, pluginsDir: string): Promise<void> {
  // Create a temporary directory
  const tempDir = path.join(pluginsDir, `.temp-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Install the package
    await execAsync(`npm install ${packageName} --prefix ${tempDir}`);

    // Find the package directory
    const packageDir = path.join(
      tempDir,
      'node_modules',
      packageName.split('/').pop() || packageName
    );

    // Check if it's a valid plugin
    const manifestPath = path.join(packageDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Invalid plugin: no manifest.json found');
    }

    // Read the manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Create the plugin directory
    const pluginDir = path.join(pluginsDir, manifest.name);

    // Remove the existing plugin directory if it exists
    if (fs.existsSync(pluginDir)) {
      await fs.promises.rm(pluginDir, { recursive: true, force: true });
    }

    // Copy the plugin to the plugins directory
    await copyDirectory(packageDir, pluginDir);

    // Clean up the temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });

    console.log(chalk.green(`Plugin ${manifest.name} installed successfully.`));
  } catch (error) {
    // Clean up the temporary directory
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }

    throw error;
  }
}

/**
 * Uninstall a plugin
 */
async function uninstallPlugin(pluginName: string, pluginsDir: string): Promise<void> {
  const pluginDir = path.join(pluginsDir, pluginName);

  // Check if the plugin exists
  if (!fs.existsSync(pluginDir)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' not found.`));
    return;
  }

  // Confirm the uninstallation
  const { confirm } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Are you sure you want to uninstall the plugin '${pluginName}'?`,
    default: false,
  });

  if (!confirm) {
    console.log(chalk.yellow('Uninstallation cancelled.'));
    return;
  }

  try {
    // Remove the plugin directory
    await fs.promises.rm(pluginDir, { recursive: true, force: true });

    console.log(chalk.green(`Plugin '${pluginName}' uninstalled successfully.`));
  } catch (error) {
    console.error(chalk.red(`Error uninstalling plugin: ${error.message}`));
  }
}

/**
 * Enable a plugin
 */
async function enablePlugin(pluginName: string, pluginsDir: string): Promise<void> {
  const pluginDir = path.join(pluginsDir, pluginName);
  const disabledPath = path.join(pluginDir, '.disabled');

  // Check if the plugin exists
  if (!fs.existsSync(pluginDir)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' not found.`));
    return;
  }

  // Check if the plugin is already enabled
  if (!fs.existsSync(disabledPath)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' is already enabled.`));
    return;
  }

  try {
    // Remove the .disabled file
    fs.unlinkSync(disabledPath);

    console.log(chalk.green(`Plugin '${pluginName}' enabled successfully.`));
  } catch (error) {
    console.error(chalk.red(`Error enabling plugin: ${error.message}`));
  }
}

/**
 * Disable a plugin
 */
async function disablePlugin(pluginName: string, pluginsDir: string): Promise<void> {
  const pluginDir = path.join(pluginsDir, pluginName);
  const disabledPath = path.join(pluginDir, '.disabled');

  // Check if the plugin exists
  if (!fs.existsSync(pluginDir)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' not found.`));
    return;
  }

  // Check if the plugin is already disabled
  if (fs.existsSync(disabledPath)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' is already disabled.`));
    return;
  }

  try {
    // Create the .disabled file
    fs.writeFileSync(disabledPath, '');

    console.log(chalk.green(`Plugin '${pluginName}' disabled successfully.`));
  } catch (error) {
    console.error(chalk.red(`Error disabling plugin: ${error.message}`));
  }
}

/**
 * Create a new plugin template
 */
async function createPluginTemplate(pluginName: string, pluginsDir: string): Promise<void> {
  // Prompt for plugin details
  const { description, author } = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Enter a description for your plugin:',
      default: `A plugin for CodeAgent`,
    },
    {
      type: 'input',
      name: 'author',
      message: 'Enter the author name:',
    },
  ]);

  // Prompt for tool types
  const { includeTools } = await inquirer.prompt({
    type: 'confirm',
    name: 'includeTools',
    message: 'Do you want to include sample tools in your plugin?',
    default: true,
  });

  // Prompt for hook types
  const { includeHooks } = await inquirer.prompt({
    type: 'confirm',
    name: 'includeHooks',
    message: 'Do you want to include sample hooks in your plugin?',
    default: true,
  });

  // Create the plugin directory structure
  const pluginDir = path.join(pluginsDir, pluginName);

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

    // Remove the existing plugin directory
    await fs.promises.rm(pluginDir, { recursive: true, force: true });
  }

  // Create the directory structure
  fs.mkdirSync(pluginDir, { recursive: true });

  if (includeTools) {
    fs.mkdirSync(path.join(pluginDir, 'tools'), { recursive: true });
  }

  if (includeHooks) {
    fs.mkdirSync(path.join(pluginDir, 'hooks'), { recursive: true });
  }

  // Create the manifest.json
  const manifest = {
    name: pluginName,
    version: '1.0.0',
    description,
    author,
    tools: includeTools ? ['tools/sampleTool.js'] : [],
    hooks: includeHooks
      ? {
          beforeCommand: ['hooks/beforeCommand.js'],
          afterCommand: ['hooks/afterCommand.js'],
        }
      : undefined,
  };

  fs.writeFileSync(path.join(pluginDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Create sample tools if requested
  if (includeTools) {
    fs.writeFileSync(
      path.join(pluginDir, 'tools', 'sampleTool.js'),
      `import { BaseTool } from '../../../../src/tools/types.js';

/**
 * Sample Tool 
 */
export class SampleTool extends BaseTool {
  constructor() {
    super(
      '${pluginName}_sample',
      'A sample tool for ${pluginName}',
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
      ['${pluginName}', 'sample']
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
        output: \`Error executing sample tool: \${error.message}\`,
        error
      };
    }
  }
}

// Export an instance of the tool
export default new SampleTool();`
    );
  }

  // Create sample hooks if requested
  if (includeHooks) {
    fs.writeFileSync(
      path.join(pluginDir, 'hooks', 'beforeCommand.js'),
      `/**
 * This hook runs before a command is executed
 * 
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command being executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @returns {Promise<void>}
 */
export default async function beforeCommand(context) {
  console.log(\`[${pluginName}] Before executing command: \${context.command}\`);
  
  // Your hook logic here
  // You can modify the context object to affect the command execution
}`
    );

    fs.writeFileSync(
      path.join(pluginDir, 'hooks', 'afterCommand.js'),
      `/**
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
  console.log(\`[${pluginName}] After executing command: \${context.command}\`);
  
  // Your hook logic here
  // You can perform additional actions based on the command result
}`
    );
  }

  // Create a README.md
  fs.writeFileSync(
    path.join(pluginDir, 'README.md'),
    `# ${pluginName}

${description}

## Installation

\`\`\`bash
codeagent plugin --install <path-to-this-directory>
\`\`\`

## Features

${includeTools ? '- Provides custom tools\n' : ''}${includeHooks ? '- Provides command hooks\n' : ''}

## Usage

${
  includeTools
    ? `
### Tools

This plugin provides the following tools:

- \`${pluginName}_sample\`: A sample tool that processes input.

Example:

\`\`\`bash
codeagent ask "Use the ${pluginName}_sample tool with input 'hello world'"
\`\`\`
`
    : ''
}

## Development

To modify this plugin, edit the files in this directory and reinstall it.
`
  );

  console.log(chalk.green(`Plugin '${pluginName}' created successfully at ${pluginDir}`));
}

/**
 * Copy a directory recursively
 */
async function copyDirectory(source: string, destination: string): Promise<void> {
  // Create the destination directory
  fs.mkdirSync(destination, { recursive: true });

  // Get all files and subdirectories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      await copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}
