import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { AIService } from '../ai/aiService';

/**
 * Register the generate command
 */
export function register(program: Command): void {
  program
    .command('generate')
    .description('Generate code based on a description or transform existing code')
    .argument('[description]', 'Description of the code to generate')
    .option(
      '-l, --language <language>',
      'Programming language for the generated code',
      'javascript'
    )
    .option('-i, --input <path>', 'Input file to transform')
    .option('-o, --output <path>', 'Output file for the generated code')
    .option('-t, --type <type>', 'Type of generation (new, transform, refactor, optimize)', 'new')
    .option('-c, --context <files>', 'Comma-separated list of context files')
    .option('-p, --prompts', 'Use interactive prompts for generation', false)
    .action(async (description, options, command) => {
      const { contextManager, toolRegistry, learningManager, config } = program.context;

      // Create the AI service
      const aiService = new AIService(config, toolRegistry, contextManager);

      // Handle interactive mode
      if (options.prompts || (!description && !options.input)) {
        await interactiveGeneration(aiService, options, learningManager);
        return;
      }

      // Load context if specified
      let contextItems: string[] = [];
      if (options.context) {
        const contextFiles = options.context.split(',').map(f => f.trim());
        contextItems = await loadContextFiles(contextManager, contextFiles);
      }

      // Determine if we're generating new code or transforming existing
      if (options.type === 'new') {
        // Generate new code
        if (!description) {
          console.error(chalk.red('Error: Description is required for new code generation'));
          return;
        }

        await generateNewCode(description, options, aiService, contextItems, learningManager);
      } else {
        // Transform existing code
        if (!options.input) {
          console.error(chalk.red('Error: Input file is required for code transformation'));
          return;
        }

        await transformCode(
          options.input,
          description || '',
          options,
          aiService,
          contextItems,
          learningManager
        );
      }
    });
}

/**
 * Generate new code based on description
 */
async function generateNewCode(
  description: string,
  options: any,
  aiService: AIService,
  contextItems: string[],
  learningManager: any
): Promise<void> {
  const spinner = ora('Generating code...').start();

  try {
    // Generate the code
    const code = await aiService.generateCode(description, options.language, contextItems);

    spinner.succeed('Code generated successfully');

    // Output the code
    if (options.output) {
      // Ensure directory exists
      const dir = path.dirname(options.output);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(options.output, code);
      console.log(chalk.green(`Code written to ${options.output}`));
    } else {
      console.log('\n' + chalk.cyan('Generated Code:') + '\n');
      console.log(code);
    }

    // Store for learning
    if (learningManager) {
      await learningManager.learnFromCodeFix(description, code, [], contextItems.join('\n'), [
        options.language,
        'generation',
      ]);
    }
  } catch (error) {
    spinner.fail('Error generating code');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Transform existing code
 */
async function transformCode(
  inputFile: string,
  description: string,
  options: any,
  aiService: AIService,
  contextItems: string[],
  learningManager: any
): Promise<void> {
  // Validate input file
  if (!fs.existsSync(inputFile)) {
    console.error(chalk.red(`Error: Input file does not exist: ${inputFile}`));
    return;
  }

  const spinner = ora(`Transforming code from ${inputFile}...`).start();

  try {
    // Read the input file
    const content = fs.readFileSync(inputFile, 'utf8');

    // Determine the language based on file extension
    const language = options.language || getLanguageFromExtension(path.extname(inputFile));

    // Build the transformation prompt
    let prompt = '';
    switch (options.type) {
      case 'refactor':
        prompt = `Refactor the following ${language} code to improve its structure and readability:`;
        break;
      case 'optimize':
        prompt = `Optimize the following ${language} code for better performance:`;
        break;
      case 'transform':
      default:
        prompt = `Transform the following ${language} code: ${description}`;
    }

    prompt += `\n\n\`\`\`${language}\n${content}\n\`\`\``;

    // Generate the transformed code
    const transformedCode = await aiService.generateCode(prompt, language, contextItems);

    spinner.succeed('Code transformed successfully');

    // Output the transformed code
    if (options.output) {
      // Ensure directory exists
      const dir = path.dirname(options.output);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(options.output, transformedCode);
      console.log(chalk.green(`Transformed code written to ${options.output}`));
    } else {
      console.log('\n' + chalk.cyan('Transformed Code:') + '\n');
      console.log(transformedCode);
    }

    // Store for learning
    if (learningManager) {
      await learningManager.learnFromCodeFix(prompt, transformedCode, [], content, [
        language,
        'transformation',
        options.type,
      ]);
    }
  } catch (error) {
    spinner.fail('Error transforming code');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Interactive code generation
 */
async function interactiveGeneration(
  aiService: AIService,
  options: any,
  learningManager: any
): Promise<void> {
  console.log(chalk.blue.bold('Interactive Code Generation'));

  // Get generation type
  const { generationType } = await inquirer.prompt({
    type: 'list',
    name: 'generationType',
    message: 'What type of code generation would you like?',
    choices: [
      { name: 'Generate new code', value: 'new' },
      { name: 'Transform existing code', value: 'transform' },
      { name: 'Refactor existing code', value: 'refactor' },
      { name: 'Optimize existing code', value: 'optimize' },
    ],
  });

  // Get language
  const { language } = await inquirer.prompt({
    type: 'list',
    name: 'language',
    message: 'Select programming language:',
    choices: [
      'javascript',
      'typescript',
      'python',
      'java',
      'c',
      'cpp',
      'csharp',
      'go',
      'rust',
      'swift',
      'ruby',
      'php',
      'kotlin',
      'other',
    ],
    default: options.language || 'javascript',
  });

  // Get custom language if 'other' was selected
  let finalLanguage = language;
  if (language === 'other') {
    const { customLanguage } = await inquirer.prompt({
      type: 'input',
      name: 'customLanguage',
      message: 'Enter the language name:',
    });
    finalLanguage = customLanguage;
  }

  // Handle based on generation type
  if (generationType === 'new') {
    // Get description
    const { description } = await inquirer.prompt({
      type: 'input',
      name: 'description',
      message: 'Describe the code you want to generate:',
    });

    // Get output path
    const { outputPath } = await inquirer.prompt({
      type: 'input',
      name: 'outputPath',
      message: 'Enter output file path (leave empty to print to console):',
      default: options.output || '',
    });

    // Generate the code
    await generateNewCode(
      description,
      { ...options, language: finalLanguage, output: outputPath || undefined },
      aiService,
      [],
      learningManager
    );
  } else {
    // Get input file
    const { inputPath } = await inquirer.prompt({
      type: 'input',
      name: 'inputPath',
      message: 'Enter input file path:',
      default: options.input || '',
      validate: input => {
        if (!input) return 'Input file is required';
        if (!fs.existsSync(input)) return `File does not exist: ${input}`;
        return true;
      },
    });

    // Get output path
    const { outputPath } = await inquirer.prompt({
      type: 'input',
      name: 'outputPath',
      message: 'Enter output file path (leave empty to print to console):',
      default: options.output || '',
    });

    // Get description if needed
    let description = '';
    if (generationType === 'transform') {
      const { desc } = await inquirer.prompt({
        type: 'input',
        name: 'desc',
        message: 'Describe how you want to transform the code:',
      });
      description = desc;
    }

    // Transform the code
    await transformCode(
      inputPath,
      description,
      {
        ...options,
        language: finalLanguage,
        output: outputPath || undefined,
        type: generationType,
      },
      aiService,
      [],
      learningManager
    );
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

      // Read the file
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        contextItems.push(`File: ${file}\n${content}`);
      } else {
        console.warn(chalk.yellow(`Warning: Context file not found: ${filePath}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error loading file ${file}: ${error.message}`));
    }
  }

  return contextItems;
}

/**
 * Get the language name from file extension
 */
function getLanguageFromExtension(extension: string): string {
  const extensionMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.rb': 'ruby',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.sh': 'bash',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
  };

  return extensionMap[extension.toLowerCase()] || 'text';
}
