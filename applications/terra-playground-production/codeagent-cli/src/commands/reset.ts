import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ora from 'ora';

import {
  EnvironmentResetService,
  ResetOptions,
  ResetResult,
} from '../services/environmentResetService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reset command implementation
 */
export async function reset(options: ResetOptions) {
  console.log(chalk.blue.bold('Environment Reset'));
  console.log(chalk.blue('─────────────────\n'));

  const resetService = new EnvironmentResetService();

  // Detect resetable items
  const detectableItems = await resetService.detectResetableItems();

  // Show what will be reset
  console.log(chalk.blue('The following items will be reset:'));

  // If specific paths are provided, show them
  if (options.resetOnly && options.resetOnly.length > 0) {
    options.resetOnly.forEach(item => {
      console.log(chalk.yellow(`  - ${item}`));
    });
  } else {
    // Otherwise show detectable items
    if (detectableItems.length === 0) {
      console.log(chalk.yellow('  No detectable items found'));
    } else {
      detectableItems.forEach(item => {
        console.log(chalk.yellow(`  - ${item}`));
      });
    }

    // Show service cleanup info if applicable
    if (options.resetServices) {
      console.log(chalk.yellow('  - Service credentials and logs'));
    }

    // Show dependency cleanup info if applicable
    if (options.cleanDeps) {
      console.log(chalk.yellow('  - Node dependencies will be cleaned and reinstalled'));
    }
  }

  // If not forced, confirm the reset
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will reset your environment. Are you sure you want to continue?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Reset cancelled'));
      return;
    }
  }

  // Set up spinner
  const spinner = ora('Resetting environment...').start();

  // Setup event handlers for progress
  resetService.on('progress', data => {
    if (data.type === 'error') {
      spinner.fail(data.message);
      spinner.start();
    } else if (data.type === 'warning') {
      spinner.warn(data.message);
      spinner.start();
    } else if (data.type === 'success') {
      spinner.succeed(data.message);
      spinner.start();
    } else if (data.type === 'info') {
      spinner.info(data.message);
      spinner.start();
    } else {
      spinner.text = data.message;
    }
  });

  try {
    // Perform the reset
    const result = await resetService.reset(options);

    spinner.stop();

    // Show summary
    console.log(chalk.blue('\nReset Summary:'));

    if (result.success) {
      console.log(chalk.green(`✓ Reset ${result.resetPaths.length} configuration items`));
      console.log(chalk.green(`✓ Created backup at ${result.backupDir}`));

      if (options.cleanDeps) {
        console.log(chalk.green('✓ Cleaned and reinstalled dependencies'));
      }

      console.log(chalk.blue('\nEnvironment has been reset successfully'));
      console.log(chalk.yellow('To restore from backup, use:'));
      console.log(chalk.yellow(`  codeagent reset --restore ${result.backupDir}`));
    } else {
      console.log(chalk.red('Reset completed with errors:'));

      result.errors.forEach(error => {
        console.log(chalk.red(`  - ${error.path}: ${error.error}`));
      });
    }
  } catch (error) {
    spinner.fail(`Failed to reset environment: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Restore from backup command
 */
export async function restoreFromBackup(backupDir: string, pathsToRestore?: string[]) {
  console.log(chalk.blue.bold('Environment Restore'));
  console.log(chalk.blue('─────────────────\n'));

  const resetService = new EnvironmentResetService();
  const spinner = ora('Restoring from backup...').start();

  // Setup event handlers
  resetService.on('progress', data => {
    spinner.text = data.message;
  });

  resetService.on('error', data => {
    spinner.fail(data.message);
  });

  resetService.on('complete', data => {
    spinner.succeed(data.message);
  });

  try {
    // Perform the restore
    const success = await resetService.restoreFromBackup(backupDir, pathsToRestore);

    spinner.stop();

    if (success) {
      console.log(chalk.green('\nRestore completed successfully'));
    } else {
      console.log(chalk.red('\nRestore completed with errors'));
    }
  } catch (error) {
    spinner.fail(`Failed to restore from backup: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Register the command with the CLI
 */
export function register(program: Command) {
  program
    .command('reset')
    .description('Reset your environment to a clean state')
    .option('-f, --force', 'Force reset without confirmation', false)
    .option('-k, --keep-plugins', 'Keep plugin configurations', false)
    .option('-d, --clean-deps', 'Clean and reinstall dependencies', false)
    .option('-s, --reset-services', 'Reset service configurations and credentials', false)
    .option('-o, --reset-only <paths...>', 'Only reset specified paths')
    .option('-c, --config-path <path>', 'Specify custom plugin config path')
    .option('-r, --restore <backupDir>', 'Restore from a previous backup')
    .option('-i, --restore-items <paths...>', 'Only restore specified items from backup')
    .option('-l, --list-resetable', 'List all resetable items without performing reset')
    .action(async options => {
      // If restore option is provided, restore from backup
      if (options.restore) {
        await restoreFromBackup(options.restore, options.restoreItems);
        return;
      }

      // If list-resetable option is provided, just list items
      if (options.listResetable) {
        const resetService = new EnvironmentResetService();
        const items = await resetService.detectResetableItems();

        console.log(chalk.blue('Detected resetable items:'));

        if (items.length === 0) {
          console.log(chalk.yellow('  No resetable items detected'));
        } else {
          items.forEach(item => {
            console.log(chalk.yellow(`  - ${item}`));
          });
        }

        return;
      }

      // Otherwise perform the reset
      await reset(options);
    });
}
