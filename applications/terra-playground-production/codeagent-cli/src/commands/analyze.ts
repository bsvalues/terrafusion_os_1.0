import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { AIService } from '../ai/aiService';

/**
 * Register the analyze command
 */
export function register(program: Command): void {
  program
    .command('analyze')
    .description('Analyze code for issues, patterns, or potential improvements')
    .argument('<path>', 'Path to file or directory to analyze')
    .option(
      '-t, --type <type>',
      'Type of analysis (bugs, performance, security, style, general)',
      'general'
    )
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .option('-o, --output <path>', 'Path to output file (default: stdout)')
    .option('-d, --depth <number>', 'Depth of directory traversal for analysis (default: 1)', '1')
    .option('-p, --pattern <pattern>', 'File pattern to match (e.g., "*.ts")', '*.*')
    .action(async (targetPath, options, command) => {
      const { contextManager, toolRegistry, config } = program.context;

      // Create the AI service
      const aiService = new AIService(config, toolRegistry, contextManager);

      // Validate the path
      if (!fs.existsSync(targetPath)) {
        console.error(chalk.red(`Error: Path does not exist: ${targetPath}`));
        return;
      }

      // Determine if it's a file or directory
      const isDirectory = fs.statSync(targetPath).isDirectory();

      if (isDirectory) {
        await analyzeDirectory(targetPath, options, aiService);
      } else {
        await analyzeFile(targetPath, options, aiService);
      }
    });
}

/**
 * Analyze a single file
 */
async function analyzeFile(filePath: string, options: any, aiService: AIService): Promise<void> {
  const spinner = ora(`Analyzing ${filePath}...`).start();

  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');

    // Determine the language based on file extension
    const language = getLanguageFromExtension(path.extname(filePath));

    // Perform the analysis
    const analysis = await aiService.analyzeCode(content, language, options.type);

    spinner.succeed(`Analysis of ${filePath} complete`);

    // Output the results
    if (options.output) {
      fs.writeFileSync(options.output, formatOutput(analysis, options.format));
      console.log(chalk.green(`Analysis written to ${options.output}`));
    } else {
      console.log('\n' + formatAnalysisOutput(analysis, filePath) + '\n');
    }
  } catch (error) {
    spinner.fail(`Error analyzing ${filePath}`);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Analyze a directory of files
 */
async function analyzeDirectory(
  dirPath: string,
  options: any,
  aiService: AIService
): Promise<void> {
  const spinner = ora(`Analyzing directory ${dirPath}...`).start();

  try {
    // Find files to analyze
    const files = await findFilesInDirectory(dirPath, options.pattern, parseInt(options.depth, 10));

    if (files.length === 0) {
      spinner.info('No matching files found for analysis');
      return;
    }

    spinner.text = `Found ${files.length} files to analyze`;

    // Analyze each file
    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      spinner.text = `Analyzing file ${i + 1}/${files.length}: ${path.basename(filePath)}`;

      // Read the file
      const content = fs.readFileSync(filePath, 'utf8');

      // Determine the language based on file extension
      const language = getLanguageFromExtension(path.extname(filePath));

      // Perform the analysis
      const analysis = await aiService.analyzeCode(content, language, options.type);

      results.push({
        file: filePath,
        analysis,
      });
    }

    spinner.succeed(`Analysis of ${files.length} files complete`);

    // Output the results
    if (options.output) {
      fs.writeFileSync(options.output, formatOutput(results, options.format));
      console.log(chalk.green(`Analysis written to ${options.output}`));
    } else {
      for (const result of results) {
        console.log('\n' + formatAnalysisOutput(result.analysis, result.file) + '\n');
        console.log(chalk.gray('-'.repeat(80)) + '\n');
      }
    }
  } catch (error) {
    spinner.fail(`Error analyzing directory ${dirPath}`);
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Find files in a directory recursively
 */
async function findFilesInDirectory(
  dirPath: string,
  pattern: string,
  depth: number
): Promise<string[]> {
  const results: string[] = [];

  // Convert the pattern to a regex
  const patternRegex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);

  // Helper function to recursively find files
  const findFiles = (currentPath: string, currentDepth: number) => {
    if (currentDepth > depth) return;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        findFiles(entryPath, currentDepth + 1);
      } else if (patternRegex.test(entry.name)) {
        results.push(entryPath);
      }
    }
  };

  findFiles(dirPath, 0);

  return results;
}

/**
 * Format the analysis output
 */
function formatAnalysisOutput(analysis: string, filePath: string): string {
  return `${chalk.cyan.bold('Analysis of:')} ${chalk.yellow(filePath)}\n\n${analysis}`;
}

/**
 * Format output based on the requested format
 */
function formatOutput(data: any, format: string): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // Default to text format
  if (Array.isArray(data)) {
    return data.map(item => `File: ${item.file}\n\n${item.analysis}`).join('\n\n---\n\n');
  }

  return data;
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
