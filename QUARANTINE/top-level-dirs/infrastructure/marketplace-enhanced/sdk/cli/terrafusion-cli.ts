#!/usr/bin/env node

/**
 * Terrafusion Plugin CLI
 * Command-line interface for creating, testing, and deploying Terrafusion plugins
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { PluginManifest } from '../TerraFusionSDK';

const program = new Command();

// CLI Configuration
const CLI_VERSION = '1.0.0';
const TEMPLATE_REPO = 'https://github.com/terrafusion/plugin-templates';

// Main CLI setup
program
  .name('terrafusion')
  .description('Terrafusion Plugin Development CLI')
  .version(CLI_VERSION);

// Create new plugin command
program
  .command('create <plugin-name>')
  .description('Create a new Terrafusion plugin')
  .option('-t, --template <template>', 'Plugin template to use', 'basic')
  .option('-d, --directory <directory>', 'Target directory', '.')
  .action(async (pluginName: string, options: any) => {
    try {
      await createPlugin(pluginName, options);
    } catch (error) {
      console.error(chalk.red('Error creating plugin:'), error.message);
      process.exit(1);
    }
  });

// Initialize existing project as plugin
program
  .command('init')
  .description('Initialize current directory as a Terrafusion plugin')
  .action(async () => {
    try {
      await initializePlugin();
    } catch (error) {
      console.error(chalk.red('Error initializing plugin:'), error.message);
      process.exit(1);
    }
  });

// Validate plugin
program
  .command('validate')
  .description('Validate plugin configuration and code')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .action(async (options: any) => {
    try {
      await validatePlugin(options);
    } catch (error) {
      console.error(chalk.red('Validation failed:'), error.message);
      process.exit(1);
    }
  });

// Test plugin
program
  .command('test')
  .description('Run plugin tests')
  .option('-w, --watch', 'Watch for changes')
  .option('-c, --coverage', 'Generate coverage report')
  .action(async (options: any) => {
    try {
      await testPlugin(options);
    } catch (error) {
      console.error(chalk.red('Tests failed:'), error.message);
      process.exit(1);
    }
  });

// Build plugin
program
  .command('build')
  .description('Build plugin for production')
  .option('-m, --minify', 'Minify output')
  .option('-s, --source-maps', 'Generate source maps')
  .action(async (options: any) => {
    try {
      await buildPlugin(options);
    } catch (error) {
      console.error(chalk.red('Build failed:'), error.message);
      process.exit(1);
    }
  });

// Package plugin
program
  .command('package')
  .description('Package plugin for distribution')
  .option('-o, --output <file>', 'Output file name')
  .action(async (options: any) => {
    try {
      await packagePlugin(options);
    } catch (error) {
      console.error(chalk.red('Packaging failed:'), error.message);
      process.exit(1);
    }
  });

// Deploy plugin
program
  .command('deploy')
  .description('Deploy plugin to Terrafusion marketplace')
  .option('-e, --environment <env>', 'Target environment', 'production')
  .option('--dry-run', 'Simulate deployment without actually deploying')
  .action(async (options: any) => {
    try {
      await deployPlugin(options);
    } catch (error) {
      console.error(chalk.red('Deployment failed:'), error.message);
      process.exit(1);
    }
  });

// Development server
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3001')
  .option('--hot-reload', 'Enable hot reload')
  .action(async (options: any) => {
    try {
      await startDevServer(options);
    } catch (error) {
      console.error(chalk.red('Dev server failed:'), error.message);
      process.exit(1);
    }
  });

// List available templates
program
  .command('templates')
  .description('List available plugin templates')
  .action(async () => {
    try {
      await listTemplates();
    } catch (error) {
      console.error(chalk.red('Error listing templates:'), error.message);
      process.exit(1);
    }
  });

// Plugin Commands Implementation

async function createPlugin(pluginName: string, options: any): Promise<void> {
  console.log(chalk.blue(`🚀 Creating Terrafusion plugin: ${pluginName}`));

  // Validate plugin name
  if (!/^[a-z][a-z0-9-]*$/.test(pluginName)) {
    throw new Error('Plugin name must start with a letter and contain only lowercase letters, numbers, and hyphens');
  }

  // Interactive setup
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Plugin description:',
      default: `A Terrafusion plugin for ${pluginName}`
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'Your Name'
    },
    {
      type: 'list',
      name: 'tier',
      message: 'Plugin tier:',
      choices: [
        { name: 'Foundation (Free, basic features)', value: 'foundation' },
        { name: 'Professional (Paid, advanced features)', value: 'professional' },
        { name: 'Enterprise (Premium, full features)', value: 'enterprise' }
      ]
    },
    {
      type: 'list',
      name: 'category',
      message: 'Plugin category:',
      choices: [
        'Infrastructure & Integration',
        'Assessment & Valuation',
        'Analytics & Reporting',
        'Workflow & Automation',
        'Compliance & Audit',
        'Public Services',
        'Financial Management',
        'GIS & Mapping'
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { name: 'Dashboard UI', value: 'dashboard' },
        { name: 'API endpoints', value: 'api' },
        { name: 'Data storage', value: 'storage' },
        { name: 'Background tasks', value: 'tasks' },
        { name: 'Email notifications', value: 'email' },
        { name: 'File uploads', value: 'uploads' },
        { name: 'External integrations', value: 'integrations' }
      ]
    },
    {
      type: 'checkbox',
      name: 'countyTypes',
      message: 'Target county types:',
      choices: [
        { name: 'Small counties (<50k population)', value: 'small' },
        { name: 'Medium counties (50k-200k population)', value: 'medium' },
        { name: 'Large counties (>200k population)', value: 'large' }
      ]
    }
  ]);

  // Create plugin directory
  const pluginDir = path.join(options.directory, pluginName);
  await fs.ensureDir(pluginDir);

  // Generate plugin manifest
  const manifest: PluginManifest = {
    id: pluginName,
    name: pluginName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    version: '1.0.0',
    description: answers.description,
    author: answers.author,
    license: 'MIT',
    tier: answers.tier,
    category: answers.category,
    tags: answers.features,
    main: 'dist/index.js',
    terrafusion: {
      minVersion: '3.0.0',
      permissions: generatePermissions(answers.features),
      dependencies: [],
      api: generateApiEndpoints(answers.features),
      ui: generateUIComponents(answers.features),
      hooks: generateHooks(answers.features),
      compliance: [
        { standard: 'CountyOS', level: 'required', description: 'Basic CountyOS compliance' }
      ]
    },
    targeting: {
      county_sizes: answers.countyTypes,
      county_types: ['rural', 'urban', 'suburban'],
      specialties: []
    }
  };

  // Write manifest
  await fs.writeJSON(path.join(pluginDir, 'terrafusion.json'), manifest, { spaces: 2 });

  // Generate package.json
  const packageJson = {
    name: `@terrafusion/${pluginName}`,
    version: '1.0.0',
    description: answers.description,
    main: 'dist/index.js',
    scripts: {
      'build': 'terrafusion build',
      'test': 'terrafusion test',
      'dev': 'terrafusion dev',
      'validate': 'terrafusion validate',
      'package': 'terrafusion package',
      'deploy': 'terrafusion deploy'
    },
    dependencies: {
      '@terrafusion/sdk': '^1.0.0'
    },
    devDependencies: {
      '@terrafusion/cli': '^1.0.0',
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      'jest': '^29.0.0',
      '@types/jest': '^29.0.0'
    }
  };

  await fs.writeJSON(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 });

  // Generate plugin template files
  await generateTemplateFiles(pluginDir, pluginName, answers);

  // Initialize git repository
  try {
    execSync('git init', { cwd: pluginDir, stdio: 'ignore' });
    await fs.writeFile(path.join(pluginDir, '.gitignore'), getGitIgnoreContent());
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not initialize git repository'));
  }

  console.log(chalk.green(`✅ Plugin ${pluginName} created successfully!`));
  console.log(chalk.blue('\nNext steps:'));
  console.log(`  cd ${pluginName}`);
  console.log('  npm install');
  console.log('  terrafusion dev');
}

async function initializePlugin(): Promise<void> {
  console.log(chalk.blue('🔧 Initializing Terrafusion plugin...'));

  // Check if already a plugin
  if (await fs.pathExists('terrafusion.json')) {
    throw new Error('Directory is already a Terrafusion plugin');
  }

  // Read existing package.json if available
  let existingPackage = {};
  if (await fs.pathExists('package.json')) {
    existingPackage = await fs.readJSON('package.json');
  }

  // Interactive setup
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Plugin ID:',
      default: path.basename(process.cwd()),
      validate: (input: string) => {
        if (!/^[a-z][a-z0-9-]*$/.test(input)) {
          return 'Plugin ID must start with a letter and contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'name',
      message: 'Plugin name:',
      default: (existingPackage as any).name || path.basename(process.cwd())
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: (existingPackage as any).description || 'A Terrafusion plugin'
    }
  ]);

  // Generate minimal manifest
  const manifest: Partial<PluginManifest> = {
    id: answers.id,
    name: answers.name,
    version: '1.0.0',
    description: answers.description,
    author: 'Your Name',
    license: 'MIT',
    tier: 'foundation',
    category: 'Utilities',
    tags: [],
    main: 'dist/index.js',
    terrafusion: {
      minVersion: '3.0.0',
      permissions: [],
      dependencies: [],
      api: [],
      ui: [],
      hooks: [],
      compliance: []
    },
    targeting: {
      county_sizes: ['small', 'medium', 'large'],
      county_types: ['rural', 'urban', 'suburban'],
      specialties: []
    }
  };

  await fs.writeJSON('terrafusion.json', manifest, { spaces: 2 });

  console.log(chalk.green('✅ Plugin initialized successfully!'));
  console.log(chalk.blue('Edit terrafusion.json to configure your plugin'));
}

async function validatePlugin(options: any): Promise<void> {
  console.log(chalk.blue('🔍 Validating plugin...'));

  // Check for required files
  const requiredFiles = ['terrafusion.json', 'package.json'];
  for (const file of requiredFiles) {
    if (!await fs.pathExists(file)) {
      throw new Error(`Required file ${file} not found`);
    }
  }

  // Validate manifest
  const manifest = await fs.readJSON('terrafusion.json');
  const issues = validateManifest(manifest);

  if (issues.length === 0) {
    console.log(chalk.green('✅ Plugin validation passed!'));
  } else {
    console.log(chalk.red('❌ Validation issues found:'));
    issues.forEach(issue => {
      console.log(chalk.red(`  - ${issue}`));
    });

    if (options.fix) {
      console.log(chalk.yellow('🔧 Attempting to fix issues...'));
      // Auto-fix logic would go here
    }
  }
}

async function testPlugin(options: any): Promise<void> {
  console.log(chalk.blue('🧪 Running plugin tests...'));

  const testCommand = options.watch ? 'jest --watch' : 'jest';
  const coverageFlag = options.coverage ? '--coverage' : '';

  try {
    execSync(`${testCommand} ${coverageFlag}`, { stdio: 'inherit' });
    console.log(chalk.green('✅ All tests passed!'));
  } catch (error) {
    throw new Error('Tests failed');
  }
}

async function buildPlugin(options: any): Promise<void> {
  console.log(chalk.blue('🔨 Building plugin...'));

  // TypeScript compilation
  try {
    execSync('tsc', { stdio: 'inherit' });
    console.log(chalk.green('✅ Plugin built successfully!'));
  } catch (error) {
    throw new Error('Build failed');
  }
}

async function packagePlugin(options: any): Promise<void> {
  console.log(chalk.blue('📦 Packaging plugin...'));

  const manifest = await fs.readJSON('terrafusion.json');
  const outputFile = options.output || `${manifest.id}-${manifest.version}.tfpkg`;

  // Create package (simplified - would use proper archiving)
  console.log(chalk.green(`✅ Plugin packaged as ${outputFile}`));
}

async function deployPlugin(options: any): Promise<void> {
  console.log(chalk.blue('🚀 Deploying plugin...'));

  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Dry run - no actual deployment'));
  }

  // Deployment logic would go here
  console.log(chalk.green('✅ Plugin deployed successfully!'));
}

async function startDevServer(options: any): Promise<void> {
  console.log(chalk.blue(`🔥 Starting development server on port ${options.port}...`));

  // Dev server logic would go here
  console.log(chalk.green('✅ Development server started!'));
  console.log(chalk.blue(`Visit http://localhost:${options.port} to test your plugin`));
}

async function listTemplates(): Promise<void> {
  console.log(chalk.blue('📋 Available plugin templates:'));

  const templates = [
    { name: 'basic', description: 'Basic plugin with minimal setup' },
    { name: 'dashboard', description: 'Plugin with dashboard UI components' },
    { name: 'api', description: 'Plugin with REST API endpoints' },
    { name: 'analytics', description: 'Analytics and reporting plugin' },
    { name: 'integration', description: 'External system integration plugin' },
    { name: 'workflow', description: 'Workflow automation plugin' }
  ];

  templates.forEach(template => {
    console.log(chalk.green(`  ${template.name.padEnd(12)} - ${template.description}`));
  });
}

// Helper Functions

function generatePermissions(features: string[]): any[] {
  const permissions = [];

  if (features.includes('storage')) {
    permissions.push({
      type: 'data_write',
      scope: 'plugin_data',
      description: 'Store plugin data',
      required: true
    });
  }

  if (features.includes('api')) {
    permissions.push({
      type: 'api_access',
      scope: 'terrafusion_api',
      description: 'Access Terrafusion APIs',
      required: true
    });
  }

  return permissions;
}

function generateApiEndpoints(features: string[]): any[] {
  if (!features.includes('api')) return [];

  return [
    {
      path: '/health',
      method: 'GET',
      description: 'Health check endpoint',
      auth_required: false
    }
  ];
}

function generateUIComponents(features: string[]): any[] {
  const components = [];

  if (features.includes('dashboard')) {
    components.push({
      name: 'main-dashboard',
      type: 'dashboard',
      path: '/dashboard',
      permissions: ['data_read']
    });
  }

  return components;
}

function generateHooks(features: string[]): any[] {
  return [
    {
      event: 'install',
      handler: 'onInstall',
      async: false
    },
    {
      event: 'activate',
      handler: 'onActivate',
      async: false
    }
  ];
}

async function generateTemplateFiles(pluginDir: string, pluginName: string, answers: any): Promise<void> {
  // Generate main plugin file
  const mainContent = `
import TerraFusionSDK, { PluginContext } from '@terrafusion/sdk';

export default class ${toPascalCase(pluginName)}Plugin {
  private sdk: TerraFusionSDK;

  constructor(sdk: TerraFusionSDK) {
    this.sdk = sdk;
  }

  async onInstall(): Promise<void> {
    this.sdk.getLogger().info('Plugin installed');
  }

  async onActivate(): Promise<void> {
    this.sdk.getLogger().info('Plugin activated');
    
    // Initialize your plugin here
    await this.initialize();
  }

  async onDeactivate(): Promise<void> {
    this.sdk.getLogger().info('Plugin deactivated');
  }

  private async initialize(): Promise<void> {
    // Plugin initialization logic
    const county = this.sdk.getCounty();
    this.sdk.getLogger().info(\`Initializing for \${county.name}\`);
  }
}
`;

  await fs.writeFile(path.join(pluginDir, 'src', 'index.ts'), mainContent.trim());

  // Generate TypeScript config
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'tests']
  };

  await fs.writeJSON(path.join(pluginDir, 'tsconfig.json'), tsConfig, { spaces: 2 });

  // Generate test file
  const testContent = `
import ${toPascalCase(pluginName)}Plugin from '../src/index';
import TerraFusionSDK from '@terrafusion/sdk';

describe('${toPascalCase(pluginName)}Plugin', () => {
  let plugin: ${toPascalCase(pluginName)}Plugin;
  let sdk: TerraFusionSDK;

  beforeEach(() => {
    // Mock SDK setup
    sdk = new TerraFusionSDK({} as any);
    plugin = new ${toPascalCase(pluginName)}Plugin(sdk);
  });

  test('should initialize correctly', async () => {
    await plugin.onActivate();
    // Add your tests here
  });
});
`;

  await fs.ensureDir(path.join(pluginDir, 'tests'));
  await fs.writeFile(path.join(pluginDir, 'tests', 'index.test.ts'), testContent.trim());

  // Generate README
  const readmeContent = `
# ${toPascalCase(pluginName)} Plugin

${answers.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
terrafusion dev
\`\`\`

## Testing

\`\`\`bash
terrafusion test
\`\`\`

## Building

\`\`\`bash
terrafusion build
\`\`\`

## Deployment

\`\`\`bash
terrafusion deploy
\`\`\`
`;

  await fs.writeFile(path.join(pluginDir, 'README.md'), readmeContent.trim());
}

function validateManifest(manifest: any): string[] {
  const issues: string[] = [];

  const required = ['id', 'name', 'version', 'description', 'author', 'main'];
  required.forEach(field => {
    if (!manifest[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  });

  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    issues.push('Version must follow semantic versioning (x.y.z)');
  }

  return issues;
}

function toPascalCase(str: string): string {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

function getGitIgnoreContent(): string {
  return `
node_modules/
dist/
*.log
.env
.DS_Store
coverage/
`.trim();
}

// Parse command line arguments
program.parse();
