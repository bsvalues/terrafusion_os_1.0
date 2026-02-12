import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AIService } from '../ai/aiService';

/**
 * Register the ask command
 */
export function register(program: Command): void {
  program
    .command('ask')
    .description('Ask the coding agent a question or request help with a task')
    .argument('[query]', 'The question or request')
    .option('-i, --interactive', 'Start an interactive session', false)
    .option('-c, --context <files>', 'Comma-separated list of files to include as context')
    .option('-t, --tools <tools>', 'Comma-separated list of tools to enable')
    .action(async (query, options, command) => {
      const { contextManager, toolRegistry, learningManager, config } = program.context;

      // Create the AI service
      const aiService = new AIService(config, toolRegistry, contextManager);

      // Parse context files if provided
      let contextItems: string[] = [];
      if (options.context) {
        const contextFiles = options.context.split(',').map(f => f.trim());
        contextItems = await loadContextFiles(contextManager, contextFiles);
      }

      // Parse tools if provided
      let enabledTools: string[] = [];
      if (options.tools) {
        enabledTools = options.tools.split(',').map(t => t.trim());

        // Validate tools
        for (const tool of enabledTools) {
          if (!toolRegistry.hasTool(tool)) {
            console.warn(chalk.yellow(`Warning: Tool "${tool}" not found and will be ignored.`));
          }
        }

        // Filter to only valid tools
        enabledTools = enabledTools.filter(tool => toolRegistry.hasTool(tool));
      }

      // Start interactive mode if requested or if no query provided
      if (options.interactive || !query) {
        await startInteractiveSession(
          aiService,
          contextManager,
          contextItems,
          enabledTools,
          learningManager
        );
        return;
      }

      // Single query mode
      await processSingleQuery(query, aiService, contextItems, enabledTools, learningManager);
    });
}

/**
 * Process a single query
 */
async function processSingleQuery(
  query: string,
  aiService: AIService,
  contextItems: string[],
  enabledTools: string[],
  learningManager: any
): Promise<void> {
  const spinner = ora('Processing your request...').start();

  try {
    // Get the response
    const response = await aiService.executeConversation(query, contextItems, enabledTools);

    spinner.succeed('Response received:');

    // Print the response
    console.log('\n' + formatResponse(response) + '\n');

    // Store the interaction for learning
    if (learningManager) {
      await learningManager.learnFromCodeFix(
        query,
        response,
        enabledTools,
        contextItems.join('\n'),
        []
      );
    }
  } catch (error) {
    spinner.fail('Error processing your request');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Start an interactive conversation session
 */
async function startInteractiveSession(
  aiService: AIService,
  contextManager: any,
  initialContextItems: string[],
  enabledTools: string[],
  learningManager: any
): Promise<void> {
  console.log(chalk.blue.bold('Interactive CodeAgent Session'));
  console.log(chalk.gray('Type "exit" or press Ctrl+C to end the session.'));
  console.log(chalk.gray('Type "context <file1,file2,...>" to add files to the context.'));
  console.log(chalk.gray('Type "tools <tool1,tool2,...>" to enable specific tools.'));
  console.log('');

  let contextItems = [...initialContextItems];
  let activeTools = [...enabledTools];

  // Continue the conversation until exit
  let conversationActive = true;

  while (conversationActive) {
    // Show current context and tools
    if (contextItems.length > 0) {
      console.log(chalk.cyan(`Context: ${contextItems.length} items`));
    }

    if (activeTools.length > 0) {
      console.log(chalk.cyan(`Enabled tools: ${activeTools.join(', ')}`));
    }

    // Get the query
    const { query } = await inquirer.prompt({
      type: 'input',
      name: 'query',
      message: 'What can I help you with?',
      prefix: '🤖',
    });

    // Check for special commands
    if (query.toLowerCase() === 'exit') {
      conversationActive = false;
      console.log(chalk.blue('Ending session. Goodbye!'));
      continue;
    }

    // Add context files
    if (query.toLowerCase().startsWith('context ')) {
      const files = query
        .substring('context '.length)
        .split(',')
        .map(f => f.trim());
      const newContextItems = await loadContextFiles(contextManager, files);
      contextItems = [...contextItems, ...newContextItems];
      continue;
    }

    // Set tools
    if (query.toLowerCase().startsWith('tools ')) {
      const tools = query
        .substring('tools '.length)
        .split(',')
        .map(t => t.trim());
      activeTools = tools;
      console.log(chalk.green(`Tools set to: ${activeTools.join(', ')}`));
      continue;
    }

    // Process the query
    const spinner = ora('Processing your request...').start();

    try {
      // Get the response
      const response = await aiService.executeConversation(query, contextItems, activeTools);

      spinner.succeed('Response received:');

      // Print the response
      console.log('\n' + formatResponse(response) + '\n');

      // Store the interaction for learning
      if (learningManager) {
        await learningManager.learnFromCodeFix(
          query,
          response,
          activeTools,
          contextItems.join('\n'),
          []
        );
      }
    } catch (error) {
      spinner.fail('Error processing your request');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}

/**
 * Load context from files
 */
async function loadContextFiles(contextManager: any, files: string[]): Promise<string[]> {
  const contextItems: string[] = [];

  for (const file of files) {
    try {
      const filePath = file.startsWith('/') ? file : `${contextManager.getProjectPath()}/${file}`;

      // Use the file_read tool to get the content
      const fileContent = await readFile(filePath);

      if (fileContent) {
        contextItems.push(`File: ${file}\n${fileContent}`);
        console.log(chalk.green(`Added ${file} to context`));
      }
    } catch (error) {
      console.error(chalk.red(`Error loading file ${file}: ${error.message}`));
    }
  }

  return contextItems;
}

/**
 * Read a file's content
 */
async function readFile(filePath: string): Promise<string | null> {
  try {
    const fs = await import('fs');

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`File not found: ${filePath}`));
      return null;
    }

    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(chalk.red(`Error reading file: ${error.message}`));
    return null;
  }
}

/**
 * Format the AI response for display
 */
function formatResponse(response: string): string {
  // Highlight code blocks
  return response.replace(/```([\s\S]*?)```/g, (match, code) => {
    return chalk.bgBlack(chalk.white(code));
  });
}
