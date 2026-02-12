#!/usr/bin/env node

/**
 * TerraFusion Workspace Explorer
 * AI-Powered Interactive Navigation Tool
 * 
 * THE TERRAFUSION WAY:
 * - Beautiful terminal UI
 * - AI-powered semantic search
 * - Quick actions for everything
 * - Zero friction navigation
 */

const { Command } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { mainMenu } = require('./ui/menu');
const { displayWelcome } = require('./ui/welcome');
const { loadWorkspaceData } = require('./search/workspace-loader');

const program = new Command();

// Package info
const packageInfo = require('../package.json');

// Configure CLI
program
  .name('tf-explore')
  .description('AI-Powered Interactive Navigation Tool for TerraFusion OS 1.0')
  .version(packageInfo.version, '-v, --version', 'Display version number')
  .option('-s, --search <query>', 'Search workspace directly')
  .option('-q, --quick', 'Skip welcome, jump to menu')
  .option('--no-color', 'Disable colors')
  .option('--debug', 'Enable debug output');

// Parse arguments
program.parse(process.argv);
const options = program.opts();

/**
 * Main entry point
 */
async function main() {
  try {
    // Enable debug mode if requested
    if (options.debug) {
      process.env.TF_EXPLORER_DEBUG = 'true';
    }

    // Display welcome banner (unless --quick)
    if (!options.quick) {
      displayWelcome();
    }

    // Load workspace data
    console.log(chalk.cyan('\n📦 Loading workspace data...\n'));
    const workspaceData = await loadWorkspaceData();
    
    if (!workspaceData) {
      console.error(chalk.red('❌ Failed to load workspace data'));
      console.error(chalk.yellow('💡 Make sure .workspace-map.json exists in the workspace root'));
      process.exit(1);
    }

    console.log(chalk.green(`✅ Loaded ${workspaceData.packages.length} packages\n`));

    // Handle direct search
    if (options.search) {
      const { searchWorkspace } = require('./search/search-engine');
      const results = await searchWorkspace(workspaceData, options.search);
      
      if (results.length === 0) {
        console.log(chalk.yellow(`No results found for: ${options.search}`));
      } else {
        console.log(chalk.green(`\n🔍 Found ${results.length} results:\n`));
        results.forEach((result, index) => {
          console.log(chalk.cyan(`${index + 1}. ${result.name}`) + chalk.gray(` (${result.path})`));
          if (result.description) {
            console.log(chalk.dim(`   ${result.description}`));
          }
          console.log();
        });
      }
      return;
    }

    // Launch interactive menu
    await mainMenu(workspaceData);

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    
    if (options.debug) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Uncaught Exception:'), error.message);
  if (options.debug) {
    console.error(chalk.dim(error.stack));
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Unhandled Rejection:'), reason);
  if (options.debug) {
    console.error(chalk.dim(reason.stack));
  }
  process.exit(1);
});

// Run!
main();
