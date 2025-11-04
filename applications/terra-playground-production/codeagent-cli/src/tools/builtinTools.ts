import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolRegistry } from './toolRegistry';
import { BaseTool, ToolResult, ToolParameter } from './types';

const execAsync = promisify(exec);

/**
 * FileReadTool - Reads content from files
 */
class FileReadTool extends BaseTool {
  constructor() {
    super(
      'file_read',
      'Reads content from a file',
      {
        filePath: {
          name: 'filePath',
          description: 'Path to the file to read',
          type: 'string',
          required: true,
        },
        encoding: {
          name: 'encoding',
          description: 'File encoding',
          type: 'string',
          required: false,
          default: 'utf8',
        },
      },
      ['filesystem']
    );
  }

  async execute(args: { filePath: string; encoding?: string }): Promise<ToolResult> {
    try {
      // Ensure the file exists
      if (!fs.existsSync(args.filePath)) {
        return {
          success: false,
          output: `File not found: ${args.filePath}`,
        };
      }

      // Check if it's a directory
      const stats = fs.statSync(args.filePath);
      if (stats.isDirectory()) {
        // List directory contents instead
        const files = fs.readdirSync(args.filePath);
        return {
          success: true,
          output: `Directory listing for ${args.filePath}:\n${files.join('\n')}`,
          data: { isDirectory: true, files },
        };
      }

      // Read the file
      const content = fs.readFileSync(args.filePath, args.encoding || 'utf8');

      return {
        success: true,
        output: `Successfully read file: ${args.filePath}`,
        data: { content, filePath: args.filePath },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error reading file: ${error.message}`,
        error,
      };
    }
  }
}

/**
 * FileWriteTool - Writes content to files
 */
class FileWriteTool extends BaseTool {
  constructor() {
    super(
      'file_write',
      'Writes content to a file',
      {
        filePath: {
          name: 'filePath',
          description: 'Path to the file to write',
          type: 'string',
          required: true,
        },
        content: {
          name: 'content',
          description: 'Content to write to the file',
          type: 'string',
          required: true,
        },
        encoding: {
          name: 'encoding',
          description: 'File encoding',
          type: 'string',
          required: false,
          default: 'utf8',
        },
        mode: {
          name: 'mode',
          description: 'Write mode: "overwrite" or "append"',
          type: 'string',
          required: false,
          default: 'overwrite',
          enum: ['overwrite', 'append'],
        },
      },
      ['filesystem']
    );
  }

  async execute(args: {
    filePath: string;
    content: string;
    encoding?: string;
    mode?: 'overwrite' | 'append';
  }): Promise<ToolResult> {
    try {
      // Ensure directory exists
      const dir = path.dirname(args.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Determine write mode
      const flag = args.mode === 'append' ? 'a' : 'w';

      // Write to the file
      fs.writeFileSync(args.filePath, args.content, {
        encoding: args.encoding || 'utf8',
        flag,
      });

      return {
        success: true,
        output: `Successfully ${args.mode === 'append' ? 'appended to' : 'wrote'} file: ${args.filePath}`,
        data: { filePath: args.filePath },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error writing to file: ${error.message}`,
        error,
      };
    }
  }
}

/**
 * CommandExecutionTool - Executes shell commands
 */
class CommandExecutionTool extends BaseTool {
  constructor() {
    super(
      'command_exec',
      'Executes a shell command',
      {
        command: {
          name: 'command',
          description: 'Command to execute',
          type: 'string',
          required: true,
        },
        cwd: {
          name: 'cwd',
          description: 'Working directory for the command',
          type: 'string',
          required: false,
        },
        timeout: {
          name: 'timeout',
          description: 'Timeout in milliseconds',
          type: 'number',
          required: false,
          default: 30000,
        },
      },
      ['system']
    );
  }

  async execute(args: { command: string; cwd?: string; timeout?: number }): Promise<ToolResult> {
    try {
      // Execute the command
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: args.cwd,
        timeout: args.timeout || 30000,
      });

      // Handle the result
      const output = stdout.trim();
      const error = stderr.trim();

      if (error) {
        return {
          success: true,
          output: `Command executed with warnings or errors:\n${error}\n\nOutput:\n${output}`,
          data: { stdout: output, stderr: error },
        };
      }

      return {
        success: true,
        output,
        data: { stdout: output, stderr: error },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error executing command: ${error.message}`,
        error,
      };
    }
  }
}

/**
 * GitOperationTool - Performs git operations
 */
class GitOperationTool extends BaseTool {
  constructor() {
    super(
      'git_op',
      'Performs Git operations',
      {
        operation: {
          name: 'operation',
          description: 'Git operation to perform',
          type: 'string',
          required: true,
          enum: ['status', 'add', 'commit', 'push', 'pull', 'clone', 'checkout', 'branch', 'log'],
        },
        args: {
          name: 'args',
          description: 'Arguments for the git operation',
          type: 'string',
          required: false,
          default: '',
        },
        repoPath: {
          name: 'repoPath',
          description: 'Path to the repository',
          type: 'string',
          required: false,
          default: '.',
        },
      },
      ['git', 'version-control']
    );
  }

  async execute(args: {
    operation: string;
    args?: string;
    repoPath?: string;
  }): Promise<ToolResult> {
    try {
      const repoPath = args.repoPath || '.';
      const gitArgs = args.args || '';

      // Build the git command
      const command = `git ${args.operation} ${gitArgs}`;

      // Execute the command
      const { stdout, stderr } = await execAsync(command, {
        cwd: repoPath,
      });

      // Handle the result
      const output = stdout.trim();
      const error = stderr.trim();

      if (error && !output) {
        return {
          success: false,
          output: `Git operation failed: ${error}`,
          data: { stdout: output, stderr: error },
        };
      }

      return {
        success: true,
        output: output || 'Git operation completed successfully',
        data: { stdout: output, stderr: error },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error executing git operation: ${error.message}`,
        error,
      };
    }
  }
}

/**
 * DependencyTool - Manages project dependencies
 */
class DependencyTool extends BaseTool {
  constructor() {
    super(
      'dependency',
      'Manages project dependencies',
      {
        operation: {
          name: 'operation',
          description: 'Dependency operation to perform',
          type: 'string',
          required: true,
          enum: ['install', 'remove', 'update', 'list', 'search'],
        },
        packageManager: {
          name: 'packageManager',
          description: 'Package manager to use',
          type: 'string',
          required: true,
          enum: ['npm', 'yarn', 'pnpm', 'pip', 'cargo', 'go'],
        },
        packages: {
          name: 'packages',
          description: 'Packages to operate on',
          type: 'string',
          required: false,
          default: '',
        },
        options: {
          name: 'options',
          description: 'Additional options for the package manager',
          type: 'string',
          required: false,
          default: '',
        },
        cwd: {
          name: 'cwd',
          description: 'Working directory',
          type: 'string',
          required: false,
          default: '.',
        },
      },
      ['dependencies', 'package-management']
    );
  }

  async execute(args: {
    operation: string;
    packageManager: string;
    packages?: string;
    options?: string;
    cwd?: string;
  }): Promise<ToolResult> {
    try {
      const cwd = args.cwd || '.';
      const packages = args.packages || '';
      const options = args.options || '';

      // Build the command based on package manager
      let command = '';

      switch (args.packageManager) {
        case 'npm':
          if (args.operation === 'install') {
            command = `npm install ${packages} ${options}`;
          } else if (args.operation === 'remove') {
            command = `npm uninstall ${packages} ${options}`;
          } else if (args.operation === 'update') {
            command = `npm update ${packages} ${options}`;
          } else if (args.operation === 'list') {
            command = `npm list ${packages} ${options}`;
          } else if (args.operation === 'search') {
            command = `npm search ${packages} ${options}`;
          }
          break;

        case 'yarn':
          if (args.operation === 'install') {
            command = `yarn add ${packages} ${options}`;
          } else if (args.operation === 'remove') {
            command = `yarn remove ${packages} ${options}`;
          } else if (args.operation === 'update') {
            command = `yarn upgrade ${packages} ${options}`;
          } else if (args.operation === 'list') {
            command = `yarn list ${packages} ${options}`;
          } else if (args.operation === 'search') {
            command = `yarn info ${packages} ${options}`;
          }
          break;

        case 'pip':
          if (args.operation === 'install') {
            command = `pip install ${packages} ${options}`;
          } else if (args.operation === 'remove') {
            command = `pip uninstall -y ${packages} ${options}`;
          } else if (args.operation === 'update') {
            command = `pip install --upgrade ${packages} ${options}`;
          } else if (args.operation === 'list') {
            command = `pip list ${options}`;
          } else if (args.operation === 'search') {
            command = `pip search ${packages} ${options}`;
          }
          break;

        // Add more package managers as needed

        default:
          return {
            success: false,
            output: `Unsupported package manager: ${args.packageManager}`,
          };
      }

      if (!command) {
        return {
          success: false,
          output: `Unsupported operation: ${args.operation} for package manager: ${args.packageManager}`,
        };
      }

      // Execute the command
      const { stdout, stderr } = await execAsync(command, { cwd });

      // Handle the result
      const output = stdout.trim();
      const error = stderr.trim();

      if (error && !output) {
        return {
          success: false,
          output: `Dependency operation failed: ${error}`,
          data: { stdout: output, stderr: error },
        };
      }

      return {
        success: true,
        output: output || 'Dependency operation completed successfully',
        data: { stdout: output, stderr: error },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error executing dependency operation: ${error.message}`,
        error,
      };
    }
  }
}

/**
 * CodeAnalysisTool - Analyzes code for issues or patterns
 */
class CodeAnalysisTool extends BaseTool {
  constructor() {
    super(
      'code_analysis',
      'Analyzes code for issues or patterns',
      {
        filePath: {
          name: 'filePath',
          description: 'Path to the file to analyze',
          type: 'string',
          required: true,
        },
        operation: {
          name: 'operation',
          description: 'Analysis operation to perform',
          type: 'string',
          required: true,
          enum: ['lint', 'complexity', 'dependencies', 'security', 'summary'],
        },
        options: {
          name: 'options',
          description: 'Additional options for the analysis',
          type: 'string',
          required: false,
          default: '',
        },
      },
      ['code-analysis']
    );
  }

  async execute(args: {
    filePath: string;
    operation: string;
    options?: string;
  }): Promise<ToolResult> {
    try {
      // Ensure the file exists
      if (!fs.existsSync(args.filePath)) {
        return {
          success: false,
          output: `File not found: ${args.filePath}`,
        };
      }

      // Get file extension
      const ext = path.extname(args.filePath);

      // Get file content
      const content = fs.readFileSync(args.filePath, 'utf8');

      // A simple code analysis
      let output = '';

      switch (args.operation) {
        case 'summary':
          const lineCount = content.split('\n').length;
          const charCount = content.length;
          const functions = (content.match(/function\s+\w+\s*\(/g) || []).length;
          const classes = (content.match(/class\s+\w+/g) || []).length;
          const imports = (content.match(/import\s+.+from/g) || []).length;

          output = `Code Summary for ${args.filePath}:
- Lines: ${lineCount}
- Characters: ${charCount}
- Functions: ${functions}
- Classes: ${classes}
- Imports: ${imports}`;
          break;

        case 'complexity':
          // This is a very simplified complexity analysis
          // In a real implementation, you'd use a proper static analysis tool
          const lines = content.split('\n');
          const nestingLevels = lines.map(line => {
            const indentation = line.search(/\S|$/);
            return Math.floor(indentation / 2); // Assuming 2-space indentation
          });

          const maxNestingLevel = Math.max(...nestingLevels);
          const avgNestingLevel = nestingLevels.reduce((a, b) => a + b, 0) / nestingLevels.length;

          output = `Complexity Analysis for ${args.filePath}:
- Maximum nesting level: ${maxNestingLevel}
- Average nesting level: ${avgNestingLevel.toFixed(2)}`;
          break;

        case 'dependencies':
          // Extract imports/requires
          const importMatches = content.match(/import\s+.+from\s+['"]([^'"]+)['"]/g) || [];
          const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];

          const imports = [...importMatches, ...requireMatches];

          output = `Dependency Analysis for ${args.filePath}:
Found ${imports.length} imports/requires:
${imports.join('\n')}`;
          break;

        // Add more analyses as needed

        default:
          return {
            success: false,
            output: `Unsupported analysis operation: ${args.operation}`,
          };
      }

      return {
        success: true,
        output,
        data: { filePath: args.filePath, operation: args.operation },
      };
    } catch (error) {
      return {
        success: false,
        output: `Error analyzing code: ${error.message}`,
        error,
      };
    }
  }
}

/**
 * Register all built-in tools with the registry
 */
export function registerBuiltinTools(registry: ToolRegistry): void {
  // File operations
  registry.registerTool(new FileReadTool());
  registry.registerTool(new FileWriteTool());

  // System operations
  registry.registerTool(new CommandExecutionTool());

  // Version control
  registry.registerTool(new GitOperationTool());

  // Package management
  registry.registerTool(new DependencyTool());

  // Code analysis
  registry.registerTool(new CodeAnalysisTool());

  // Additional tools can be added here
}
