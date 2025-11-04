import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import clipboard from 'clipboardy';
import open from 'open';

import { CodeSnippetService, CodeSnippet } from '../services/codeSnippetService.js';
import {
  SnippetSharingService,
  ShareOptions,
  SharedSnippet,
} from '../services/snippetSharingService.js';

// Initialize services
const snippetService = new CodeSnippetService();
const sharingService = new SnippetSharingService();

/**
 * Share a snippet from the snippet library
 */
async function shareExistingSnippet(
  id: string,
  options: {
    expiry?: number;
    maxAccess?: number;
    password?: boolean;
    tags?: boolean;
    context?: boolean;
    qrcode?: boolean;
    open?: boolean;
  }
) {
  console.log(chalk.blue.bold('Share Snippet'));
  console.log(chalk.blue('─────────────\n'));

  try {
    // Initialize services
    await snippetService.initialize();
    await sharingService.initialize();

    // Get the snippet
    const spinner = ora('Loading snippet...').start();
    const snippet = await snippetService.getSnippet(id);

    if (!snippet) {
      spinner.fail(`Snippet with ID ${id} not found`);
      return;
    }

    spinner.succeed('Snippet loaded');

    // Print snippet details
    console.log(chalk.white(`Name: ${chalk.bold(snippet.name)}`));
    console.log(chalk.white(`Description: ${snippet.description}`));
    console.log(chalk.white(`Language: ${snippet.language}`));

    // Configure sharing options
    const shareOptions: ShareOptions = {
      expiryHours: options.expiry,
      maxAccesses: options.maxAccess,
      includeTags: options.tags !== false,
      includeContext: options.context !== false,
    };

    // Ask for password if --password is specified
    if (options.password) {
      const { password } = await inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Enter a password to protect this snippet:',
        validate: input => (input.trim() !== '' ? true : 'Password is required'),
      });

      shareOptions.password = password;
    }

    // Share the snippet
    spinner.text = 'Sharing snippet...';
    spinner.start();
    const sharedSnippet = await sharingService.shareSnippet(snippet, shareOptions);

    // Upload to the sharing server
    spinner.text = 'Uploading to sharing server...';
    const { url } = await sharingService.uploadSharedSnippet(sharedSnippet.shareId);

    spinner.succeed('Snippet shared successfully');

    // Generate QR code if requested
    let qrCodePath: string | undefined;
    if (options.qrcode) {
      spinner.text = 'Generating QR code...';
      spinner.start();
      qrCodePath = await sharingService.generateQrCode(sharedSnippet.shareId);
      spinner.succeed(`QR code generated at ${qrCodePath}`);
    }

    // Display sharing information
    console.log(chalk.green('\nSnippet Sharing Information:'));
    console.log(chalk.white(`Share ID: ${chalk.bold(sharedSnippet.shareId)}`));
    console.log(chalk.white(`Share URL: ${chalk.bold(url)}`));

    if (shareOptions.expiryHours) {
      console.log(chalk.white(`Expires: ${chalk.bold(sharedSnippet.expiresAt?.toLocaleString())}`));
    }

    if (shareOptions.password) {
      console.log(chalk.white(`Password Protected: ${chalk.bold('Yes')}`));
    }

    // Copy URL to clipboard
    await clipboard.write(url);
    console.log(chalk.green('Share URL copied to clipboard!'));

    // Open URL in browser if requested
    if (options.open) {
      console.log(chalk.green('Opening in browser...'));
      await open(String(url));
    }

    if (qrCodePath) {
      console.log(
        chalk.green('QR Code generated. Scan it with your device to access the snippet.')
      );
    }
  } catch (error) {
    console.error(chalk.red(`Failed to share snippet: ${(error as Error).message}`));
  }
}

/**
 * Share code directly from file or clipboard
 */
async function shareDirectSnippet(options: {
  file?: string;
  name?: string;
  description?: string;
  language?: string;
  expiry?: number;
  maxAccess?: number;
  password?: boolean;
  qrcode?: boolean;
  open?: boolean;
}) {
  console.log(chalk.blue.bold('Share Code Directly'));
  console.log(chalk.blue('──────────────────\n'));

  try {
    // Initialize services
    await snippetService.initialize();
    await sharingService.initialize();

    let code = '';

    // Get code from file if specified
    if (options.file) {
      const spinner = ora(`Reading file ${options.file}...`).start();
      try {
        code = await fs.readFile(options.file, 'utf-8');
        spinner.succeed('File read successfully');
      } catch (error) {
        spinner.fail(`Failed to read file: ${(error as Error).message}`);
        return;
      }
    } else {
      // Try to get code from clipboard
      try {
        code = await clipboard.read();
        console.log(chalk.green('Code read from clipboard:'));
        console.log(chalk.gray('─────────────────────────'));
        console.log(code);
        console.log(chalk.gray('─────────────────────────'));

        const { confirm } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirm',
          message: 'Use this code?',
          default: true,
        });

        if (!confirm) {
          const { manualCode } = await inquirer.prompt({
            type: 'editor',
            name: 'manualCode',
            message: 'Enter code:',
            validate: input => (input.trim() !== '' ? true : 'Code is required'),
          });

          code = manualCode;
        }
      } catch (error) {
        console.error(chalk.red('Failed to read clipboard. Please enter code manually.'));

        const { manualCode } = await inquirer.prompt({
          type: 'editor',
          name: 'manualCode',
          message: 'Enter code:',
          validate: input => (input.trim() !== '' ? true : 'Code is required'),
        });

        code = manualCode;
      }
    }

    // If required options not provided, prompt for them
    const nameAnswer = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'Name:',
      default: options.name || path.basename(options.file || '', path.extname(options.file || '')),
      validate: input => (input.trim() !== '' ? true : 'Name is required'),
    });

    const descriptionAnswer = await inquirer.prompt({
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: options.description || '',
    });

    const languageAnswer = await inquirer.prompt({
      type: 'input',
      name: 'language',
      message: 'Language:',
      default: options.language || path.extname(options.file || '').slice(1) || 'text',
    });

    const answers = {
      name: nameAnswer.name,
      description: descriptionAnswer.description,
      language: languageAnswer.language,
    };

    // Create a temporary snippet
    const now = new Date().toISOString();
    const tempSnippet: CodeSnippet = {
      id: `temp_${Date.now()}`,
      name: answers.name,
      description: answers.description,
      language: answers.language,
      tags: [],
      code,
      created: now,
      updated: now,
      usageCount: 0,
      favorite: false,
    };

    // Configure sharing options
    const shareOptions: ShareOptions = {
      expiryHours: options.expiry,
      maxAccesses: options.maxAccess,
    };

    // Ask for password if --password is specified
    if (options.password) {
      const { password } = await inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Enter a password to protect this code:',
        validate: input => (input.trim() !== '' ? true : 'Password is required'),
      });

      shareOptions.password = password;
    }

    // Share the snippet
    const spinner = ora('Sharing code...').start();
    const sharedSnippet = await sharingService.shareSnippet(tempSnippet, shareOptions);

    // Upload to the sharing server
    spinner.text = 'Uploading to sharing server...';
    const { url } = await sharingService.uploadSharedSnippet(sharedSnippet.shareId);

    spinner.succeed('Code shared successfully');

    // Generate QR code if requested
    let qrCodePath: string | undefined;
    if (options.qrcode) {
      spinner.text = 'Generating QR code...';
      spinner.start();
      qrCodePath = await sharingService.generateQrCode(sharedSnippet.shareId);
      spinner.succeed(`QR code generated at ${qrCodePath}`);
    }

    // Display sharing information
    console.log(chalk.green('\nCode Sharing Information:'));
    console.log(chalk.white(`Share ID: ${chalk.bold(sharedSnippet.shareId)}`));
    console.log(chalk.white(`Share URL: ${chalk.bold(url)}`));

    if (shareOptions.expiryHours) {
      console.log(chalk.white(`Expires: ${chalk.bold(sharedSnippet.expiresAt?.toLocaleString())}`));
    }

    if (shareOptions.password) {
      console.log(chalk.white(`Password Protected: ${chalk.bold('Yes')}`));
    }

    // Ask if user wants to save as a permanent snippet
    const { saveSnippet } = await inquirer.prompt({
      type: 'confirm',
      name: 'saveSnippet',
      message: 'Save this code as a permanent snippet in your library?',
      default: false,
    });

    if (saveSnippet) {
      const { tags } = await inquirer.prompt({
        type: 'input',
        name: 'tags',
        message: 'Tags (comma separated):',
        filter: input =>
          input
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean),
      });

      // Create a permanent snippet
      const createSpinner = ora('Saving snippet...').start();
      await snippetService.createSnippet({
        name: tempSnippet.name,
        description: tempSnippet.description,
        language: tempSnippet.language,
        tags,
        code: tempSnippet.code,
      });

      createSpinner.succeed('Snippet saved to your library');
    }

    // Copy URL to clipboard
    await clipboard.write(url);
    console.log(chalk.green('Share URL copied to clipboard!'));

    // Open URL in browser if requested
    if (options.open) {
      console.log(chalk.green('Opening in browser...'));
      await open(String(url));
    }

    if (qrCodePath) {
      console.log(
        chalk.green('QR Code generated. Scan it with your device to access the snippet.')
      );
    }
  } catch (error) {
    console.error(chalk.red(`Failed to share code: ${(error as Error).message}`));
  }
}

/**
 * List shared snippets
 */
async function listSharedSnippets() {
  console.log(chalk.blue.bold('Shared Snippets'));
  console.log(chalk.blue('───────────────\n'));

  try {
    // Initialize service
    await sharingService.initialize();

    // Get shared snippets
    const spinner = ora('Loading shared snippets...').start();
    const sharedSnippets = await sharingService.listSharedSnippets();

    if (sharedSnippets.length === 0) {
      spinner.info('No shared snippets found');
      return;
    }

    spinner.succeed(`Found ${sharedSnippets.length} shared snippets`);

    // Get stats
    const stats = await sharingService.getShareStats();
    console.log(chalk.green(`Total Shares: ${stats.totalShares}`));
    console.log(chalk.green(`Active Shares: ${stats.activeShares}`));
    console.log(chalk.green(`Total Accesses: ${stats.totalAccesses}`));
    console.log(chalk.green(`Password Protected: ${stats.passwordProtected}\n`));

    // Print shared snippets
    sharedSnippets.forEach((sharedSnippet /* , index */) => {
      const isExpired = sharedSnippet.expiresAt && sharedSnippet.expiresAt < new Date();

      console.log(
        chalk.white(
          `${index + 1}. ${chalk.bold(sharedSnippet.snippet.name)} ${isExpired ? chalk.red('(Expired)') : ''}`
        )
      );
      console.log(chalk.gray(`   Share ID: ${sharedSnippet.shareId}`));
      console.log(chalk.gray(`   URL: ${sharedSnippet.shortLink}`));
      console.log(chalk.gray(`   Language: ${sharedSnippet.snippet.language}`));
      console.log(chalk.gray(`   Created: ${new Date(sharedSnippet.created).toLocaleString()}`));

      if (sharedSnippet.expiresAt) {
        console.log(
          chalk.gray(`   Expires: ${new Date(sharedSnippet.expiresAt).toLocaleString()}`)
        );
      }

      console.log(chalk.gray(`   Access Count: ${sharedSnippet.accessCount}`));
      console.log(chalk.gray(`   Password Protected: ${sharedSnippet.password ? 'Yes' : 'No'}`));
      console.log('');
    });

    // Ask if user wants to perform an action on a shared snippet
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Copy a share URL to clipboard', value: 'copy' },
        { name: 'Revoke a share', value: 'revoke' },
        { name: 'Generate a QR code', value: 'qrcode' },
        { name: 'Nothing', value: 'nothing' },
      ],
    });

    if (action === 'nothing') {
      return;
    }

    // Get the share ID
    const { shareIndex } = await inquirer.prompt({
      type: 'input',
      name: 'shareIndex',
      message: 'Enter the number of the share:',
      validate: (input: string) => {
        const num = parseInt(input);
        return !isNaN(num) && num > 0 && num <= sharedSnippets.length
          ? true
          : `Please enter a number between 1 and ${sharedSnippets.length}`;
      },
    });

    const selectedSnippet = sharedSnippets[shareIndex - 1];

    if (action === 'copy') {
      await clipboard.write(selectedSnippet.shortLink);
      console.log(chalk.green('Share URL copied to clipboard!'));
    } else if (action === 'revoke') {
      const { confirm } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to revoke the share for "${selectedSnippet.snippet.name}"?`,
        default: false,
      });

      if (confirm) {
        const revokeSpinner = ora('Revoking share...').start();
        await sharingService.revokeSharedSnippet(selectedSnippet.shareId);
        revokeSpinner.succeed('Share revoked successfully');
      }
    } else if (action === 'qrcode') {
      const qrSpinner = ora('Generating QR code...').start();
      const qrCodePath = await sharingService.generateQrCode(selectedSnippet.shareId);
      qrSpinner.succeed(`QR code generated at ${qrCodePath}`);

      console.log(
        chalk.green('QR Code generated. Scan it with your device to access the snippet.')
      );
    }
  } catch (error) {
    console.error(chalk.red(`Failed to list shared snippets: ${(error as Error).message}`));
  }
}

/**
 * Revoke a shared snippet
 */
async function revokeSharedSnippet(shareId: string) {
  console.log(chalk.blue.bold('Revoke Shared Snippet'));
  console.log(chalk.blue('─────────────────────\n'));

  try {
    // Initialize service
    await sharingService.initialize();

    // Get the shared snippet
    const spinner = ora('Loading shared snippet...').start();
    const sharedSnippet = await sharingService.getSharedSnippet(shareId);

    if (!sharedSnippet) {
      spinner.fail(`Shared snippet with ID ${shareId} not found`);
      return;
    }

    spinner.succeed('Shared snippet loaded');

    // Display snippet details
    console.log(chalk.white(`Name: ${chalk.bold(sharedSnippet.snippet.name)}`));
    console.log(chalk.white(`Share ID: ${chalk.bold(sharedSnippet.shareId)}`));
    console.log(chalk.white(`URL: ${chalk.bold(sharedSnippet.shortLink)}`));
    console.log(
      chalk.white(`Created: ${chalk.bold(new Date(sharedSnippet.created).toLocaleString())}`)
    );

    if (sharedSnippet.expiresAt) {
      console.log(
        chalk.white(`Expires: ${chalk.bold(new Date(sharedSnippet.expiresAt).toLocaleString())}`)
      );
    }

    console.log(chalk.white(`Access Count: ${chalk.bold(String(sharedSnippet.accessCount))}`));

    // Confirm revocation
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to revoke this shared snippet?',
      default: false,
    });

    if (!confirm) {
      console.log(chalk.yellow('Revocation cancelled'));
      return;
    }

    // Revoke the shared snippet
    spinner.text = 'Revoking shared snippet...';
    spinner.start();
    const success = await sharingService.revokeSharedSnippet(shareId);

    if (!success) {
      spinner.fail(`Failed to revoke shared snippet with ID ${shareId}`);
      return;
    }

    spinner.succeed('Shared snippet revoked successfully');
  } catch (error) {
    console.error(chalk.red(`Failed to revoke shared snippet: ${(error as Error).message}`));
  }
}

/**
 * Clean up expired shared snippets
 */
async function cleanupExpiredSnippets(options: { force?: boolean }) {
  console.log(chalk.blue.bold('Clean Up Expired Snippets'));
  console.log(chalk.blue('─────────────────────────\n'));

  try {
    // Initialize service
    await sharingService.initialize();

    // Get stats before cleanup
    const spinner = ora('Analyzing shared snippets...').start();
    const stats = await sharingService.getShareStats();

    const expiredCount = stats.totalShares - stats.activeShares;
    spinner.succeed(`Found ${expiredCount} expired shared snippets`);

    if (expiredCount === 0) {
      console.log(chalk.green('No expired shared snippets to clean up'));
      return;
    }

    // Confirm cleanup if not forced
    if (!options.force) {
      const { confirm } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to clean up ${expiredCount} expired shared snippets?`,
        default: false,
      });

      if (!confirm) {
        console.log(chalk.yellow('Cleanup cancelled'));
        return;
      }
    }

    // Clean up expired snippets
    spinner.text = 'Cleaning up expired snippets...';
    spinner.start();
    const count = await sharingService.cleanupExpiredSnippets();

    spinner.succeed(`Successfully cleaned up ${count} expired shared snippets`);
  } catch (error) {
    console.error(chalk.red(`Failed to clean up expired snippets: ${(error as Error).message}`));
  }
}

/**
 * Register the command with the CLI
 */
export function register(program: Command) {
  const shareCommand = program.command('share').description('Share code snippets with others');

  // Share existing snippet
  shareCommand
    .command('snippet <id>')
    .description('Share a snippet from your library')
    .option('-e, --expiry <hours>', 'Set an expiry time in hours', value => parseInt(value, 10))
    .option('-m, --max-access <count>', 'Set maximum number of accesses', value =>
      parseInt(value, 10)
    )
    .option('-p, --password', 'Protect with a password', false)
    .option('--no-tags', 'Do not include tags', true)
    .option('--no-context', 'Do not include context', true)
    .option('-q, --qrcode', 'Generate a QR code', false)
    .option('-o, --open', 'Open in browser after sharing', false)
    .action(shareExistingSnippet);

  // Share code directly
  shareCommand
    .command('code')
    .description('Share code directly from file or clipboard')
    .option('-f, --file <path>', 'Read code from file')
    .option('-n, --name <name>', 'Set a name for the shared code')
    .option('-d, --description <description>', 'Set a description')
    .option('-l, --language <language>', 'Set the language')
    .option('-e, --expiry <hours>', 'Set an expiry time in hours', value => parseInt(value, 10))
    .option('-m, --max-access <count>', 'Set maximum number of accesses', value =>
      parseInt(value, 10)
    )
    .option('-p, --password', 'Protect with a password', false)
    .option('-q, --qrcode', 'Generate a QR code', false)
    .option('-o, --open', 'Open in browser after sharing', false)
    .action(shareDirectSnippet);

  // List shared snippets
  shareCommand.command('list').description('List all shared snippets').action(listSharedSnippets);

  // Revoke shared snippet
  shareCommand
    .command('revoke <id>')
    .description('Revoke a shared snippet')
    .action(revokeSharedSnippet);

  // Clean up expired snippets
  shareCommand
    .command('cleanup')
    .description('Clean up expired shared snippets')
    .option('-f, --force', 'Skip confirmation', false)
    .action(cleanupExpiredSnippets);

  return shareCommand;
}
