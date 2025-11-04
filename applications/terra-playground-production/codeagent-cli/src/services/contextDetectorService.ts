import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Context detection result
 */
export interface ContextInfo {
  language: string;
  framework: string[];
  dependencies: string[];
  fileType: string;
  project: string;
  currentFile?: string;
  currentFunction?: string;
  gitBranch?: string;
  tags: string[];
}

/**
 * Detects the current development context
 */
export class ContextDetectorService {
  /**
   * Detect context for the current directory
   */
  async detectContext(filePath?: string): Promise<ContextInfo> {
    // Start with empty context
    const context: ContextInfo = {
      language: '',
      framework: [],
      dependencies: [],
      fileType: '',
      project: '',
      tags: [],
    };

    // Get current working directory
    const cwd = process.cwd();

    // Check if path exists
    const targetPath = filePath ? path.resolve(cwd, filePath) : cwd;

    try {
      // If a file path is provided, get info about that file
      if (filePath) {
        const stats = await fs.stat(targetPath);
        if (stats.isFile()) {
          context.currentFile = targetPath;
          context.fileType = path.extname(targetPath).slice(1);
          context.language = this.detectLanguageFromExtension(context.fileType);

          // Try to detect current function if it's a code file
          if (this.isCodeFile(context.fileType)) {
            context.currentFunction = await this.detectCurrentFunction(targetPath);
          }
        }
      }

      // Detect project information
      const projectInfo = await this.detectProjectInfo(cwd);
      context.project = projectInfo.name;
      context.language = context.language || projectInfo.language;
      context.dependencies = projectInfo.dependencies;
      context.framework = projectInfo.frameworks;

      // Try to get Git branch
      context.gitBranch = await this.detectGitBranch(cwd);

      // Generate tags based on all the information we gathered
      context.tags = this.generateContextualTags(context);

      return context;
    } catch (error) {
      console.error('Error detecting context:', error);
      return context;
    }
  }

  /**
   * Detect language from file extension
   */
  private detectLanguageFromExtension(extension: string): string {
    const extensionMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      php: 'php',
      go: 'go',
      rs: 'rust',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      sh: 'shell',
      sql: 'sql',
    };

    return extensionMap[extension.toLowerCase()] || '';
  }

  /**
   * Check if a file is a code file
   */
  private isCodeFile(extension: string): boolean {
    const codeExtensions = [
      'js',
      'jsx',
      'ts',
      'tsx',
      'py',
      'rb',
      'java',
      'php',
      'go',
      'rs',
      'c',
      'cpp',
      'cs',
      'swift',
      'kt',
      'scala',
    ];

    return codeExtensions.includes(extension.toLowerCase());
  }

  /**
   * Detect project information
   */
  private async detectProjectInfo(directory: string): Promise<{
    name: string;
    language: string;
    dependencies: string[];
    frameworks: string[];
  }> {
    const result = {
      name: path.basename(directory),
      language: '',
      dependencies: [] as string[],
      frameworks: [] as string[],
    };

    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(directory, 'package.json');
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        result.language = 'javascript';
        result.name = packageJson.name || result.name;

        if (packageJson.dependencies) {
          result.dependencies = Object.keys(packageJson.dependencies);

          // Detect frameworks
          if (packageJson.dependencies.react) result.frameworks.push('react');
          if (packageJson.dependencies.vue) result.frameworks.push('vue');
          if (packageJson.dependencies.angular) result.frameworks.push('angular');
          if (packageJson.dependencies.express) result.frameworks.push('express');
          if (packageJson.dependencies.next) result.frameworks.push('nextjs');
          if (packageJson.dependencies.gatsby) result.frameworks.push('gatsby');
        }

        if (packageJson.devDependencies) {
          result.dependencies = [
            ...result.dependencies,
            ...Object.keys(packageJson.devDependencies),
          ];
        }
      } catch (error) {
        // No package.json, continue with other detection
      }

      // Check for requirements.txt (Python)
      const requirementsTxtPath = path.join(directory, 'requirements.txt');
      try {
        const requirementsContent = await fs.readFile(requirementsTxtPath, 'utf-8');
        const requirements = requirementsContent
          .split('\n')
          .map(line => line.trim().split('==')[0].split('>=')[0].trim())
          .filter(Boolean);

        result.language = 'python';
        result.dependencies = requirements;

        // Detect frameworks
        if (requirements.includes('django')) result.frameworks.push('django');
        if (requirements.includes('flask')) result.frameworks.push('flask');
        if (requirements.includes('fastapi')) result.frameworks.push('fastapi');
      } catch (error) {
        // No requirements.txt, continue with other detection
      }

      // Check for Cargo.toml (Rust)
      const cargoTomlPath = path.join(directory, 'Cargo.toml');
      try {
        await fs.access(cargoTomlPath);
        result.language = 'rust';

        // Could parse TOML here to get dependencies, but keeping it simple for now
      } catch (error) {
        // No Cargo.toml, continue with other detection
      }

      // Check for pom.xml (Java/Maven)
      const pomXmlPath = path.join(directory, 'pom.xml');
      try {
        await fs.access(pomXmlPath);
        result.language = 'java';
        result.frameworks.push('maven');
      } catch (error) {
        // No pom.xml, continue with other detection
      }

      // Check for Gemfile (Ruby)
      const gemfilePath = path.join(directory, 'Gemfile');
      try {
        await fs.access(gemfilePath);
        result.language = 'ruby';

        const gemfileContent = await fs.readFile(gemfilePath, 'utf-8');
        if (gemfileContent.includes('rails')) result.frameworks.push('rails');
      } catch (error) {
        // No Gemfile, continue with other detection
      }

      return result;
    } catch (error) {
      // Return default info in case of error
      return result;
    }
  }

  /**
   * Detect the current function from a file (simple version)
   * A more sophisticated implementation would use an AST parser
   */
  private async detectCurrentFunction(filePath: string): Promise<string | undefined> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const extension = path.extname(filePath).slice(1).toLowerCase();

      // Very simple implementation for JavaScript/TypeScript
      if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) {
        const lines = fileContent.split('\n');
        const currentLineIndex = await this.getCurrentCursorLine();

        if (currentLineIndex === -1) return undefined;

        // Scan backward to find function declaration
        for (let i = currentLineIndex; i >= 0; i--) {
          const line = lines[i];

          // Look for function declarations
          const functionMatch = line.match(/function\s+(\w+)/);
          if (functionMatch) return functionMatch[1];

          // Look for method declarations
          const methodMatch = line.match(/(\w+)\s*\([^)]*\)\s*{/);
          if (methodMatch) return methodMatch[1];

          // Look for arrow functions
          const arrowMatch = line.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
          if (arrowMatch) return arrowMatch[1];
        }
      }

      // For Python
      if (extension === 'py') {
        const lines = fileContent.split('\n');
        const currentLineIndex = await this.getCurrentCursorLine();

        if (currentLineIndex === -1) return undefined;

        // Scan backward to find function declaration
        for (let i = currentLineIndex; i >= 0; i--) {
          const line = lines[i];

          // Look for function declarations
          const functionMatch = line.match(/def\s+(\w+)/);
          if (functionMatch) return functionMatch[1];

          // Look for class declarations
          const classMatch = line.match(/class\s+(\w+)/);
          if (classMatch) return classMatch[1];
        }
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Try to detect current cursor line (returns -1 if not available)
   * This would depend on editor integration in a real implementation
   */
  private async getCurrentCursorLine(): Promise<number> {
    return -1; // Not implemented in this basic version
  }

  /**
   * Detect Git branch
   */
  private async detectGitBranch(directory: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: directory });
      return stdout.trim();
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Generate contextual tags from all the information gathered
   */
  private generateContextualTags(context: ContextInfo): string[] {
    const tags: Set<string> = new Set();

    // Add language
    if (context.language) tags.add(context.language);

    // Add frameworks
    context.framework.forEach(fw => tags.add(fw));

    // Add file type
    if (context.fileType) tags.add(context.fileType);

    // Add git branch with prefix
    if (context.gitBranch) tags.add(`branch:${context.gitBranch}`);

    // Add current function with prefix
    if (context.currentFunction) tags.add(`function:${context.currentFunction}`);

    // Add some key dependencies (limited to avoid too many tags)
    const keyDependencies = context.dependencies.slice(0, 5);
    keyDependencies.forEach(dep => tags.add(`dep:${dep}`));

    return Array.from(tags);
  }
}
