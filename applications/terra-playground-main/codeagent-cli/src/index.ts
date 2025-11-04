#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create a new Command instance
const program = new Command();

// Set basic program metadata
program
  .name('codeagent')
  .description(
    'CodeAgent CLI - An advanced geospatial intelligence platform with a modular CLI agent system'
  )
  .version(packageJson.version);

// Register commands
async function registerCommands() {
  try {
    // Import and register the voice command
    const { register: registerVoice } = await import('./commands/voice.js');
    registerVoice(program);

    // Import and register the plugin command
    const { register: registerPlugin } = await import('./commands/plugin.js');
    registerPlugin(program);

    // Import and register the plugin-settings command
    const { register: registerPluginSettings } = await import('./commands/plugin-settings.js');
    registerPluginSettings(program);

    // Import and register the reset command
    const { register: registerReset } = await import('./commands/reset.js');
    registerReset(program);

    // Import and register the snippet command
    const { register: registerSnippet } = await import('./commands/snippet.js');
    registerSnippet(program);

    // Import and register the share command
    const { register: registerShare } = await import('./commands/share.js');
    registerShare(program);

    // Add more commands as they are developed
    // ...

    // Add a default command for when no command is specified
    program.action(() => {
      console.log(chalk.blue.bold('\nCodeAgent CLI'));
      console.log(chalk.blue('─────────────\n'));
      console.log('Welcome to CodeAgent CLI!');
      console.log('Run `codeagent --help` to see available commands.\n');

      // Show some common commands as examples
      console.log(chalk.green('Common commands:'));
      console.log(`  ${chalk.yellow('codeagent voice')}               - Start voice command mode`);
      console.log(`  ${chalk.yellow('codeagent plugin --list')}       - List installed plugins`);
      console.log(`  ${chalk.yellow('codeagent plugin --wizard')}     - Create a new plugin`);
      console.log(
        `  ${chalk.yellow('codeagent voice --keyword')}     - Start voice mode with wake word detection`
      );
      console.log(
        `  ${chalk.yellow('codeagent reset')}               - Reset your environment to a clean state`
      );
      console.log(
        `  ${chalk.yellow('codeagent reset --list-resetable')} - List all items that can be reset`
      );
      console.log(
        `  ${chalk.yellow('codeagent snippet suggest')}     - Suggest snippets based on current context`
      );
      console.log(`  ${chalk.yellow('codeagent snippet create')}      - Create a new code snippet`);
      console.log(
        `  ${chalk.yellow('codeagent share code')}          - Share code directly with a link`
      );
      console.log(
        `  ${chalk.yellow('codeagent share snippet <id>')}  - Share a snippet from your library`
      );
      console.log('');
    });

    // Parse command line arguments
    program.parse();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error loading commands: ${error.message}`));
    } else {
      console.error(chalk.red(`Error loading commands: ${String(error)}`));
    }
    process.exit(1);
  }
}

// Execute the main function
registerCommands();
