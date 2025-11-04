import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import clipboard from 'clipboardy';

import {
  CodeSnippetService,
  CodeSnippet,
  CreateSnippetInput,
  UpdateSnippetInput,
  SearchOptions,
} from '../services/codeSnippetService.js';
import { ContextDetectorService } from '../services/contextDetectorService.js';

// Initialize services
const snippetService = new CodeSnippetService();
const contextDetector = new ContextDetectorService();

/**
 * Create a new snippet
 */
async function createSnippet() {
  console.log(chalk.blue.bold('Create Snippet'));
  console.log(chalk.blue('─────────────\n'));

  // Detect context to prepopulate fields
  const spinner = ora('Detecting development context...').start();
  const context = await contextDetector.detectContext();
  spinner.succeed('Context detected');

  // Prompt for snippet details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Snippet name:',
      validate: input => (input.trim() !== '' ? true : 'Name is required'),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
    },
    {
      type: 'input',
      name: 'language',
      message: 'Language:',
      default: context.language || 'javascript',
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma separated):',
      default: context.tags.join(', '),
      filter: input =>
        input
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
    },
    {
      type: 'confirm',
      name: 'useClipboard',
      message: 'Use code from clipboard?',
      default: true,
    },
    {
      type: 'editor',
      name: 'code',
      message: 'Enter code:',
      when: answers => !answers.useClipboard,
      validate: input => (input.trim() !== '' ? true : 'Code is required'),
    },
    {
      type: 'confirm',
      name: 'addContext',
      message: 'Add current context to snippet?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'favorite',
      message: 'Mark as favorite?',
      default: false,
    },
  ]);

  try {
    // Initialize the service
    await snippetService.initialize();

    // Get code from clipboard if requested
    let code = answers.code;
    if (answers.useClipboard) {
      try {
        code = await clipboard.read();
        console.log(chalk.green('Code read from clipboard:'));
        console.log(chalk.gray('─────────────────────────'));
        console.log(code);
        console.log(chalk.gray('─────────────────────────'));

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Use this code?',
            default: true,
          },
        ]);

        if (!confirm) {
          const { manualCode } = await inquirer.prompt([
            {
              type: 'editor',
              name: 'manualCode',
              message: 'Enter code:',
              validate: input => (input.trim() !== '' ? true : 'Code is required'),
            },
          ]);

          code = manualCode;
        }
      } catch (error) {
        console.error(chalk.red('Failed to read clipboard. Please enter code manually.'));

        const { manualCode } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'manualCode',
            message: 'Enter code:',
            validate: input => (input.trim() !== '' ? true : 'Code is required'),
          },
        ]);

        code = manualCode;
      }
    }

    // Create the snippet
    const input: CreateSnippetInput = {
      name: answers.name,
      description: answers.description,
      language: answers.language,
      tags: answers.tags,
      code,
      context: answers.addContext ? context.tags : [],
      favorite: answers.favorite,
    };

    const spinner = ora('Creating snippet...').start();
    const snippet = await snippetService.createSnippet(input);
    spinner.succeed('Snippet created successfully');

    console.log(chalk.green(`\nSnippet "${snippet.name}" created with ID: ${snippet.id}`));
  } catch (error) {
    console.error(chalk.red(`Failed to create snippet: ${(error as Error).message}`));
  }
}

/**
 * List all snippets
 */
async function listSnippets(options: {
  tags?: string[];
  language?: string;
  favorite?: boolean;
  query?: string;
  context?: boolean;
}) {
  console.log(chalk.blue.bold('Snippets'));
  console.log(chalk.blue('────────\n'));

  try {
    // Initialize the service
    await snippetService.initialize();

    // Get current context if needed
    let contextTags: string[] = [];
    if (options.context) {
      const spinner = ora('Detecting development context...').start();
      const context = await contextDetector.detectContext();
      contextTags = context.tags;
      spinner.succeed('Context detected');
    }

    // Set up search options
    const searchOptions: SearchOptions = {
      query: options.query,
      language: options.language,
      tags: options.tags,
      favorite: options.favorite,
      context: options.context ? contextTags : undefined,
    };

    // Get snippets
    const spinner = ora('Loading snippets...').start();
    const snippets = await snippetService.searchSnippets(searchOptions);
    spinner.succeed(`Found ${snippets.length} snippets`);

    if (snippets.length === 0) {
      console.log(chalk.yellow('No snippets found.'));
      return;
    }

    // Print snippets
    snippets.forEach((snippet /* , index */) => {
      console.log(
        chalk.white(
          `${index + 1}. ${chalk.bold(snippet.name)} ${snippet.favorite ? chalk.yellow('★') : ''}`
        )
      );
      console.log(chalk.gray(`   ID: ${snippet.id}`));
      console.log(chalk.gray(`   Language: ${snippet.language}`));
      console.log(chalk.gray(`   Tags: ${snippet.tags.join(', ')}`));
      console.log(chalk.gray(`   Usage Count: ${snippet.usageCount}`));
      console.log(chalk.gray(`   Description: ${snippet.description}`));
      console.log('');
    });
  } catch (error) {
    console.error(chalk.red(`Failed to list snippets: ${(error as Error).message}`));
  }
}

/**
 * View a specific snippet
 */
async function viewSnippet(id: string) {
  console.log(chalk.blue.bold('View Snippet'));
  console.log(chalk.blue('────────────\n'));

  try {
    // Initialize the service
    await snippetService.initialize();

    // Get the snippet
    const spinner = ora('Loading snippet...').start();
    const snippet = await snippetService.getSnippet(id);

    if (!snippet) {
      spinner.fail(`Snippet with ID ${id} not found`);
      return;
    }

    spinner.succeed('Snippet loaded');

    // Print snippet details
    console.log(chalk.bold(`${snippet.name} ${snippet.favorite ? chalk.yellow('★') : ''}`));
    console.log(chalk.gray(`ID: ${snippet.id}`));
    console.log(chalk.gray(`Language: ${snippet.language}`));
    console.log(chalk.gray(`Tags: ${snippet.tags.join(', ')}`));
    console.log(chalk.gray(`Usage Count: ${snippet.usageCount}`));
    console.log(chalk.gray(`Created: ${new Date(snippet.created).toLocaleString()}`));
    console.log(chalk.gray(`Updated: ${new Date(snippet.updated).toLocaleString()}`));
    console.log(chalk.gray(`Description: ${snippet.description}`));

    if (snippet.context && snippet.context.length > 0) {
      console.log(chalk.gray(`Context: ${snippet.context.join(', ')}`));
    }

    console.log(chalk.white('\nCode:'));
    console.log(chalk.gray('──────────────────────────────────────'));
    console.log(snippet.code);
    console.log(chalk.gray('──────────────────────────────────────'));

    // Ask if user wants to copy to clipboard
    const { copy } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'copy',
        message: 'Copy to clipboard?',
        default: false,
      },
    ]);

    if (copy) {
      await clipboard.write(snippet.code);
      console.log(chalk.green('Code copied to clipboard'));

      // Increment usage count
      await snippetService.incrementUsageCount(id);
    }
  } catch (error) {
    console.error(chalk.red(`Failed to view snippet: ${(error as Error).message}`));
  }
}

/**
 * Edit a snippet
 */
async function editSnippet(id: string) {
  console.log(chalk.blue.bold('Edit Snippet'));
  console.log(chalk.blue('────────────\n'));

  try {
    // Initialize the service
    await snippetService.initialize();

    // Get the snippet
    const spinner = ora('Loading snippet...').start();
    const snippet = await snippetService.getSnippet(id);

    if (!snippet) {
      spinner.fail(`Snippet with ID ${id} not found`);
      return;
    }

    spinner.succeed('Snippet loaded');

    // Prompt for updated details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Snippet name:',
        default: snippet.name,
        validate: input => (input.trim() !== '' ? true : 'Name is required'),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: snippet.description,
      },
      {
        type: 'input',
        name: 'language',
        message: 'Language:',
        default: snippet.language,
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma separated):',
        default: snippet.tags.join(', '),
        filter: input =>
          input
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean),
      },
      {
        type: 'confirm',
        name: 'editCode',
        message: 'Edit code?',
        default: false,
      },
      {
        type: 'editor',
        name: 'code',
        message: 'Edit code:',
        default: snippet.code,
        when: answers => answers.editCode,
        validate: input => (input.trim() !== '' ? true : 'Code is required'),
      },
      {
        type: 'confirm',
        name: 'updateContext',
        message: 'Update context with current development context?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'favorite',
        message: 'Mark as favorite?',
        default: snippet.favorite,
      },
    ]);

    // Get current context if needed
    let contextTags: string[] | undefined;
    if (answers.updateContext) {
      spinner.text = 'Detecting development context...';
      spinner.start();
      const context = await contextDetector.detectContext();
      contextTags = context.tags;
      spinner.succeed('Context detected');
    }

    // Update the snippet
    const input: UpdateSnippetInput = {
      name: answers.name,
      description: answers.description,
      language: answers.language,
      tags: answers.tags,
      favorite: answers.favorite,
    };

    if (answers.editCode) {
      input.code = answers.code;
    }

    if (answers.updateContext) {
      input.context = contextTags;
    }

    spinner.text = 'Updating snippet...';
    spinner.start();
    const updatedSnippet = await snippetService.updateSnippet(id, input);

    if (!updatedSnippet) {
      spinner.fail(`Failed to update snippet with ID ${id}`);
      return;
    }

    spinner.succeed('Snippet updated successfully');
  } catch (error) {
    console.error(chalk.red(`Failed to edit snippet: ${(error as Error).message}`));
  }
}

/**
 * Delete a snippet
 */
async function deleteSnippet(id: string) {
  console.log(chalk.blue.bold('Delete Snippet'));
  console.log(chalk.blue('──────────────\n'));

  try {
    // Initialize the service
    await snippetService.initialize();

    // Get the snippet to confirm
    const spinner = ora('Loading snippet...').start();
    const snippet = await snippetService.getSnippet(id);

    if (!snippet) {
      spinner.fail(`Snippet with ID ${id} not found`);
      return;
    }

    spinner.succeed('Snippet loaded');

    // Display snippet to confirm
    console.log(chalk.yellow(`Are you sure you want to delete the following snippet?`));
    console.log(chalk.white(`Name: ${chalk.bold(snippet.name)}`));
    console.log(chalk.white(`Description: ${snippet.description}`));
    console.log(chalk.white(`Language: ${snippet.language}`));
    console.log(chalk.white(`Tags: ${snippet.tags.join(', ')}`));

    // Confirm deletion
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Delete this snippet?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Deletion cancelled'));
      return;
    }

    // Delete the snippet
    spinner.text = 'Deleting snippet...';
    spinner.start();
    const success = await snippetService.deleteSnippet(id);

    if (!success) {
      spinner.fail(`Failed to delete snippet with ID ${id}`);
      return;
    }

    spinner.succeed('Snippet deleted successfully');
  } catch (error) {
    console.error(chalk.red(`Failed to delete snippet: ${(error as Error).message}`));
  }
}

/**
 * Import snippets from a file
 */
async function importSnippets(filePath: string) {
  console.log(chalk.blue.bold('Import Snippets'));
  console.log(chalk.blue('───────────────\n'));

  try {
    // Read the file
    const spinner = ora(`Reading file ${filePath}...`).start();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    spinner.succeed('File read successfully');

    // Initialize the service
    await snippetService.initialize();

    // Import snippets
    spinner.text = 'Importing snippets...';
    spinner.start();
    const count = await snippetService.importSnippets(fileContent);
    spinner.succeed(`${count} snippets imported successfully`);
  } catch (error) {
    console.error(chalk.red(`Failed to import snippets: ${(error as Error).message}`));
  }
}

/**
 * Export snippets to a file
 */
async function exportSnippets(filePath: string) {
  console.log(chalk.blue.bold('Export Snippets'));
  console.log(chalk.blue('───────────────\n'));

  try {
    // Initialize the service
    await snippetService.initialize();

    // Export snippets
    const spinner = ora('Exporting snippets...').start();
    const jsonData = await snippetService.exportSnippets();

    // Write to file
    await fs.writeFile(filePath, jsonData, 'utf-8');
    spinner.succeed(`Snippets exported to ${filePath}`);
  } catch (error) {
    console.error(chalk.red(`Failed to export snippets: ${(error as Error).message}`));
  }
}

/**
 * Suggest snippets based on context
 */
async function suggestSnippets(options: { limit?: number }) {
  console.log(chalk.blue.bold('Snippet Suggestions'));
  console.log(chalk.blue('───────────────────\n'));

  try {
    // Initialize the service
    await snippetService.initialize();

    // Get current context
    const spinner = ora('Detecting development context...').start();
    const context = await contextDetector.detectContext();
    spinner.succeed(`Context detected: ${context.tags.join(', ')}`);

    // Get snippet suggestions
    spinner.text = 'Finding relevant snippets...';
    spinner.start();
    const snippets = await snippetService.getSuggestions(context.tags, options.limit || 5);

    if (snippets.length === 0) {
      spinner.info('No relevant snippets found for current context');
      return;
    }

    spinner.succeed(`Found ${snippets.length} relevant snippets`);

    // Display snippets
    snippets.forEach((snippet /* , index */) => {
      console.log(
        chalk.white(
          `${index + 1}. ${chalk.bold(snippet.name)} ${snippet.favorite ? chalk.yellow('★') : ''}`
        )
      );
      console.log(chalk.gray(`   ID: ${snippet.id}`));
      console.log(chalk.gray(`   Language: ${snippet.language}`));
      console.log(chalk.gray(`   Description: ${snippet.description}`));
      console.log('');
    });

    // Ask if user wants to view a snippet
    const { viewId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'viewId',
        message: 'View a snippet?',
        choices: [
          ...snippets.map((snippet /* , index */) => ({
            name: `${index + 1}. ${snippet.name}`,
            value: snippet.id,
          })),
          { name: 'None', value: 'none' },
        ],
      },
    ]);

    if (viewId !== 'none') {
      await viewSnippet(viewId);
    }
  } catch (error) {
    console.error(chalk.red(`Failed to suggest snippets: ${(error as Error).message}`));
  }
}

/**
 * Register the command with the CLI
 */
export function register(program: Command) {
  const snippetCommand = program.command('snippet').description('Manage code snippets');

  // Create snippet
  snippetCommand.command('create').description('Create a new snippet').action(createSnippet);

  // List snippets
  snippetCommand
    .command('list')
    .description('List all snippets')
    .option('-t, --tags <tags...>', 'Filter by tags')
    .option('-l, --language <language>', 'Filter by language')
    .option('-f, --favorite', 'Show only favorites')
    .option('-q, --query <query>', 'Search query')
    .option('-c, --context', 'Filter by current context')
    .action(listSnippets);

  // View snippet
  snippetCommand.command('view <id>').description('View a specific snippet').action(viewSnippet);

  // Edit snippet
  snippetCommand.command('edit <id>').description('Edit a snippet').action(editSnippet);

  // Delete snippet
  snippetCommand.command('delete <id>').description('Delete a snippet').action(deleteSnippet);

  // Import snippets
  snippetCommand
    .command('import <file>')
    .description('Import snippets from a JSON file')
    .action(importSnippets);

  // Export snippets
  snippetCommand
    .command('export <file>')
    .description('Export snippets to a JSON file')
    .action(exportSnippets);

  // Suggest snippets
  snippetCommand
    .command('suggest')
    .description('Suggest snippets based on current context')
    .option('-n, --limit <number>', 'Limit the number of suggestions', value => parseInt(value, 10))
    .action(suggestSnippets);

  return snippetCommand;
}
