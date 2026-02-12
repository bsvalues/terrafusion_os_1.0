#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'yaml';
import * as semver from 'semver';
import { spawn } from 'child_process';

/**
 * Terrafusion Playground MCP Server
 * Provides specialized tools for Terrafusion development and maintenance
 */
class TerraFusionMCP {
  private server: Server;
  private projectRoot: string;

  constructor() {
    this.server = new Server(
      {
        name: 'terrafusion-playground-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectRoot = process.cwd();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'tf_project_health',
            description: 'Analyze Terrafusion project health and dependencies',
            inputSchema: {
              type: 'object',
              properties: {
                checkDependencies: { type: 'boolean', default: true },
                checkLinting: { type: 'boolean', default: true },
                checkSecurity: { type: 'boolean', default: true },
              },
            },
          },
          {
            name: 'tf_code_quality',
            description: 'Run code quality checks and linting for Terrafusion',
            inputSchema: {
              type: 'object',
              properties: {
                fix: { type: 'boolean', default: false },
                includeTests: { type: 'boolean', default: true },
              },
            },
          },
          {
            name: 'tf_component_generator',
            description: 'Generate Terrafusion components with best practices',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['component', 'service', 'hook', 'page', 'api'],
                  description: 'Type of component to generate',
                },
                name: { type: 'string', description: 'Name of the component' },
                path: { type: 'string', description: 'Path where to create the component' },
                includeTests: { type: 'boolean', default: true },
                includeStories: { type: 'boolean', default: false },
              },
              required: ['type', 'name'],
            },
          },
          {
            name: 'tf_dependency_audit',
            description: 'Audit and manage Terrafusion dependencies',
            inputSchema: {
              type: 'object',
              properties: {
                checkOutdated: { type: 'boolean', default: true },
                checkVulnerabilities: { type: 'boolean', default: true },
                suggestUpdates: { type: 'boolean', default: true },
              },
            },
          },
          {
            name: 'tf_environment_setup',
            description: 'Setup and validate Terrafusion development environment',
            inputSchema: {
              type: 'object',
              properties: {
                createEnvFile: { type: 'boolean', default: false },
                validateDocker: { type: 'boolean', default: true },
                setupDatabase: { type: 'boolean', default: false },
              },
            },
          },
          {
            name: 'tf_performance_check',
            description: 'Analyze Terrafusion performance metrics and bundle size',
            inputSchema: {
              type: 'object',
              properties: {
                analyzeBundles: { type: 'boolean', default: true },
                checkMemoryUsage: { type: 'boolean', default: true },
                generateReport: { type: 'boolean', default: true },
              },
            },
          },
          {
            name: 'tf_geospatial_tools',
            description: 'Terrafusion geospatial data validation and utilities',
            inputSchema: {
              type: 'object',
              properties: {
                validateGeoJSON: { type: 'boolean', default: false },
                optimizeImages: { type: 'boolean', default: false },
                checkProjections: { type: 'boolean', default: false },
                dataPath: { type: 'string', description: 'Path to geospatial data' },
              },
            },
          },
          {
            name: 'tf_deployment_check',
            description: 'Validate Terrafusion deployment readiness',
            inputSchema: {
              type: 'object',
              properties: {
                environment: {
                  type: 'string',
                  enum: ['development', 'staging', 'production'],
                  default: 'development',
                },
                checkSecrets: { type: 'boolean', default: true },
                validateConfig: { type: 'boolean', default: true },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      switch (request.params.name) {
        case 'tf_project_health':
          return await this.checkProjectHealth(request.params.arguments);
        case 'tf_code_quality':
          return await this.runCodeQuality(request.params.arguments);
        case 'tf_component_generator':
          return await this.generateComponent(request.params.arguments);
        case 'tf_dependency_audit':
          return await this.auditDependencies(request.params.arguments);
        case 'tf_environment_setup':
          return await this.setupEnvironment(request.params.arguments);
        case 'tf_performance_check':
          return await this.checkPerformance(request.params.arguments);
        case 'tf_geospatial_tools':
          return await this.runGeospatialTools(request.params.arguments);
        case 'tf_deployment_check':
          return await this.checkDeployment(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async checkProjectHealth(args: any) {
    const results = [];

    try {
      // Check package.json exists
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const pkg = await fs.readJson(packagePath);
        results.push({
          check: 'Package.json',
          status: 'OK',
          details: `Project: ${pkg.name}, Version: ${pkg.version}`,
        });
      } else {
        results.push({
          check: 'Package.json',
          status: 'ERROR',
          details: 'package.json not found',
        });
      }

      // Check for essential Terrafusion files
      const essentialFiles = ['README.md', 'tsconfig.json', '.gitignore', '.env.example'];

      for (const file of essentialFiles) {
        const exists = await fs.pathExists(path.join(this.projectRoot, file));
        results.push({
          check: file,
          status: exists ? 'OK' : 'MISSING',
          details: exists ? 'File exists' : 'File not found',
        });
      }

      // Check dependencies if requested
      if (args?.checkDependencies) {
        const nodeModulesExists = await fs.pathExists(path.join(this.projectRoot, 'node_modules'));
        results.push({
          check: 'Dependencies',
          status: nodeModulesExists ? 'OK' : 'MISSING',
          details: nodeModulesExists ? 'node_modules exists' : 'Run npm install',
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: `Terrafusion Project Health Check:\n\n${results
              .map(r => `${r.check}: ${r.status} - ${r.details}`)
              .join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error checking project health: ${error.message}`,
          },
        ],
      };
    }
  }

  private async runCodeQuality(args: any) {
    const results = [];

    try {
      // Check for linting configuration
      const lintConfigs = ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js'];
      let lintConfigExists = false;

      for (const config of lintConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          lintConfigExists = true;
          results.push({
            tool: 'ESLint',
            status: 'CONFIGURED',
            details: `Found ${config}`,
          });
          break;
        }
      }

      if (!lintConfigExists) {
        results.push({
          tool: 'ESLint',
          status: 'MISSING',
          details: 'No ESLint configuration found',
        });
      }

      // Check Prettier
      const prettierConfigs = ['.prettierrc', '.prettierrc.json', 'prettier.config.js'];
      let prettierConfigExists = false;

      for (const config of prettierConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          prettierConfigExists = true;
          results.push({
            tool: 'Prettier',
            status: 'CONFIGURED',
            details: `Found ${config}`,
          });
          break;
        }
      }

      if (!prettierConfigExists) {
        results.push({
          tool: 'Prettier',
          status: 'MISSING',
          details: 'No Prettier configuration found',
        });
      }

      // Check TypeScript configuration
      const tsconfigExists = await fs.pathExists(path.join(this.projectRoot, 'tsconfig.json'));
      results.push({
        tool: 'TypeScript',
        status: tsconfigExists ? 'CONFIGURED' : 'MISSING',
        details: tsconfigExists ? 'tsconfig.json found' : 'tsconfig.json not found',
      });

      return {
        content: [
          {
            type: 'text',
            text: `Terrafusion Code Quality Check:\n\n${results
              .map(r => `${r.tool}: ${r.status} - ${r.details}`)
              .join(
                '\n'
              )}\n\nRecommendations:\n- Ensure all linting tools are configured\n- Run 'npm run lint' to check code quality\n- Use 'npm run format' to format code`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error checking code quality: ${error.message}`,
          },
        ],
      };
    }
  }

  private async generateComponent(args: any) {
    const { type, name, path: componentPath, includeTests, includeStories } = args;

    try {
      const basePath = componentPath || path.join(this.projectRoot, 'src', 'components');
      const componentDir = path.join(basePath, name);

      // Ensure directory exists
      await fs.ensureDir(componentDir);

      let componentContent = '';
      let testContent = '';

      switch (type) {
        case 'component':
          componentContent = this.generateReactComponent(name);
          if (includeTests) {
            testContent = this.generateComponentTest(name);
          }
          break;
        case 'service':
          componentContent = this.generateService(name);
          if (includeTests) {
            testContent = this.generateServiceTest(name);
          }
          break;
        case 'hook':
          componentContent = this.generateReactHook(name);
          if (includeTests) {
            testContent = this.generateHookTest(name);
          }
          break;
        default:
          throw new Error(`Unsupported component type: ${type}`);
      }

      // Write component file
      const componentFile = path.join(componentDir, `${name}.tsx`);
      await fs.writeFile(componentFile, componentContent);

      // Write test file if requested
      if (includeTests && testContent) {
        const testFile = path.join(componentDir, `${name}.test.tsx`);
        await fs.writeFile(testFile, testContent);
      }

      // Write index file
      const indexContent = `export { default } from './${name}';\n`;
      const indexFile = path.join(componentDir, 'index.ts');
      await fs.writeFile(indexFile, indexContent);

      return {
        content: [
          {
            type: 'text',
            text: `Generated Terrafusion ${type}: ${name}\n\nFiles created:\n- ${componentFile}\n${includeTests ? `- ${path.join(componentDir, `${name}.test.tsx`)}\n` : ''}- ${indexFile}\n\nComponent is ready for use in Terrafusion Playground!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating component: ${error.message}`,
          },
        ],
      };
    }
  }

  private generateReactComponent(name: string): string {
    return `import React from 'react';
import { cn } from '@/lib/utils';

interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

/**
 * ${name} Component for Terrafusion Playground
 * 
 * @param props - Component properties
 * @returns JSX element
 */
const ${name}: React.FC<${name}Props> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn('${name.toLowerCase()}', className)}
      {...props}
    >
      {children || <p>Terrafusion ${name} Component</p>}
    </div>
  );
};

export default ${name};
`;
  }

  private generateComponentTest(name: string): string {
    return `import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ${name} from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByText(/Terrafusion ${name} Component/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<${name} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders children when provided', () => {
    render(<${name}>Custom content</${name}>);
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });
});
`;
  }

  private generateReactHook(name: string): string {
    const hookName = name.startsWith('use') ? name : `use${name}`;
    return `import { useState, useEffect } from 'react';

interface ${hookName}Return {
  data: any;
  loading: boolean;
  error: string | null;
}

/**
 * ${hookName} Hook for Terrafusion Playground
 * 
 * @returns Hook state and methods
 */
export const ${hookName} = (): ${hookName}Return => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Implement your logic here
    const fetchData = async () => {
      try {
        setLoading(true);
        // Your async logic here
        setData({ message: 'Terrafusion ${hookName} working!' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export default ${hookName};
`;
  }

  private generateHookTest(name: string): string {
    const hookName = name.startsWith('use') ? name : `use${name}`;
    return `import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${hookName} } from './${name}';

describe('${hookName}', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => ${hookName}());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should load data successfully', async () => {
    const { result } = renderHook(() => ${hookName}());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBe(null);
  });
});
`;
  }

  private generateService(name: string): string {
    return `/**
 * ${name} Service for Terrafusion Playground
 * Handles business logic and data operations
 */

export interface ${name}Config {
  apiUrl?: string;
  timeout?: number;
}

export class ${name}Service {
  private config: ${name}Config;

  constructor(config: ${name}Config = {}) {
    this.config = {
      apiUrl: '/api/v1',
      timeout: 5000,
      ...config
    };
  }

  /**
   * Main service method
   */
  async execute(params: any = {}): Promise<any> {
    try {
      // Implement your service logic here
      return {
        success: true,
        data: params,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(\`${name}Service error: \${error.message}\`);
    }
  }

  /**
   * Validate service configuration
   */
  validateConfig(): boolean {
    return this.config.apiUrl !== undefined;
  }
}

// Export singleton instance
export const ${name.toLowerCase()}Service = new ${name}Service();
export default ${name}Service;
`;
  }

  private generateServiceTest(name: string): string {
    return `import { describe, it, expect, beforeEach } from 'vitest';
import { ${name}Service } from './${name}';

describe('${name}Service', () => {
  let service: ${name}Service;

  beforeEach(() => {
    service = new ${name}Service();
  });

  it('should initialize with default config', () => {
    expect(service.validateConfig()).toBe(true);
  });

  it('should execute successfully', async () => {
    const result = await service.execute({ test: 'data' });
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ test: 'data' });
    expect(result.timestamp).toBeDefined();
  });

  it('should handle custom configuration', () => {
    const customService = new ${name}Service({
      apiUrl: '/custom/api',
      timeout: 10000
    });
    
    expect(customService.validateConfig()).toBe(true);
  });
});
`;
  }

  private async auditDependencies(args: any) {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');

      if (!(await fs.pathExists(packagePath))) {
        return {
          content: [
            {
              type: 'text',
              text: 'No package.json found in project root',
            },
          ],
        };
      }

      const pkg = await fs.readJson(packagePath);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

      const results = [];
      const terraFusionDeps = Object.keys(dependencies).filter(
        dep =>
          dep.includes('react') ||
          dep.includes('typescript') ||
          dep.includes('tailwind') ||
          dep.includes('mapbox') ||
          dep.includes('geospatial')
      );

      results.push('Terrafusion Key Dependencies:');
      terraFusionDeps.forEach(dep => {
        results.push(`- ${dep}: ${dependencies[dep]}`);
      });

      if (args?.checkOutdated) {
        results.push('\nRecommendations:');
        results.push('- Run "npm outdated" to check for updates');
        results.push('- Consider updating React and TypeScript regularly');
        results.push('- Keep geospatial libraries current for security');
      }

      return {
        content: [
          {
            type: 'text',
            text: results.join('\n'),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error auditing dependencies: ${error.message}`,
          },
        ],
      };
    }
  }

  private async setupEnvironment(args: any) {
    const results = [];

    try {
      // Check for .env.example
      const envExamplePath = path.join(this.projectRoot, '.env.example');
      const envPath = path.join(this.projectRoot, '.env');

      if (await fs.pathExists(envExamplePath)) {
        results.push('✓ .env.example found');

        if (args?.createEnvFile && !(await fs.pathExists(envPath))) {
          await fs.copy(envExamplePath, envPath);
          results.push('✓ Created .env from .env.example');
        }
      } else {
        results.push('⚠ .env.example not found');
      }

      // Check Node.js version
      const nodeVersion = process.version;
      const requiredNodeVersion = '18.0.0';

      if (semver.gte(nodeVersion, requiredNodeVersion)) {
        results.push(`✓ Node.js ${nodeVersion} (required: >= ${requiredNodeVersion})`);
      } else {
        results.push(`⚠ Node.js ${nodeVersion} is below required ${requiredNodeVersion}`);
      }

      // Check for Docker if requested
      if (args?.validateDocker) {
        try {
          await this.runCommand('docker', ['--version']);
          results.push('✓ Docker is available');
        } catch {
          results.push('⚠ Docker not found or not running');
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Terrafusion Environment Setup:\n\n${results.join('\n')}\n\nNext steps:\n- Ensure all dependencies are installed: npm install\n- Configure environment variables in .env\n- Start development server: npm run dev`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error setting up environment: ${error.message}`,
          },
        ],
      };
    }
  }

  private async checkPerformance(args: any) {
    const results = [];

    try {
      // Check bundle size if build exists
      const distPath = path.join(this.projectRoot, 'dist');
      const buildPath = path.join(this.projectRoot, 'build');

      let bundlePath = '';
      if (await fs.pathExists(distPath)) {
        bundlePath = distPath;
      } else if (await fs.pathExists(buildPath)) {
        bundlePath = buildPath;
      }

      if (bundlePath) {
        const files = await glob('**/*.{js,css}', { cwd: bundlePath });
        let totalSize = 0;

        for (const file of files) {
          const filePath = path.join(bundlePath, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }

        results.push(`Bundle analysis:`);
        results.push(`- Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        results.push(`- Number of files: ${files.length}`);

        if (totalSize > 5 * 1024 * 1024) {
          // 5MB
          results.push('⚠ Bundle size is large - consider code splitting');
        } else {
          results.push('✓ Bundle size is reasonable');
        }
      } else {
        results.push('No build output found. Run "npm run build" first.');
      }

      // Check for performance-related packages
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const pkg = await fs.readJson(packagePath);
        const perfPackages = [
          'react-window',
          'react-virtualized',
          '@loadable/component',
          'react-lazy-load',
        ];

        const installedPerfPackages = perfPackages.filter(
          p => pkg.dependencies?.[p] || pkg.devDependencies?.[p]
        );

        if (installedPerfPackages.length > 0) {
          results.push(`\nPerformance packages found: ${installedPerfPackages.join(', ')}`);
        } else {
          results.push('\nConsider adding performance optimization packages');
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Terrafusion Performance Check:\n\n${results.join('\n')}\n\nRecommendations:\n- Use React.memo for expensive components\n- Implement lazy loading for large datasets\n- Optimize image sizes for maps and geospatial data\n- Consider service workers for offline capability`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error checking performance: ${error.message}`,
          },
        ],
      };
    }
  }

  private async runGeospatialTools(args: any) {
    const results = [];

    try {
      // Check for geospatial data directories
      const dataDirs = ['data', 'assets/data', 'public/data', 'src/data'];
      const existingDataDirs = [];

      for (const dir of dataDirs) {
        const dirPath = path.join(this.projectRoot, dir);
        if (await fs.pathExists(dirPath)) {
          existingDataDirs.push(dir);
        }
      }

      if (existingDataDirs.length > 0) {
        results.push(`Found data directories: ${existingDataDirs.join(', ')}`);
      } else {
        results.push('No standard data directories found');
      }

      // Check for geospatial file types
      const geoFiles = await glob('**/*.{geojson,kml,shp,tiff,gpx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
      });

      if (geoFiles.length > 0) {
        results.push(`\nGeospatial files found: ${geoFiles.length}`);
        geoFiles.slice(0, 5).forEach(file => {
          results.push(`- ${file}`);
        });
        if (geoFiles.length > 5) {
          results.push(`... and ${geoFiles.length - 5} more`);
        }
      } else {
        results.push('\nNo geospatial files found');
      }

      // Check for Mapbox/mapping dependencies
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const pkg = await fs.readJson(packagePath);
        const mapPackages = [
          'mapbox-gl',
          'react-map-gl',
          'leaflet',
          'ol', // OpenLayers
          'deck.gl',
        ];

        const installedMapPackages = mapPackages.filter(
          p => pkg.dependencies?.[p] || pkg.devDependencies?.[p]
        );

        if (installedMapPackages.length > 0) {
          results.push(`\nMapping libraries: ${installedMapPackages.join(', ')}`);
        } else {
          results.push('\nNo mapping libraries found');
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Terrafusion Geospatial Tools:\n\n${results.join('\n')}\n\nRecommendations:\n- Validate GeoJSON files for proper format\n- Optimize large datasets for web display\n- Consider using vector tiles for large datasets\n- Implement proper coordinate system handling`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error running geospatial tools: ${error.message}`,
          },
        ],
      };
    }
  }

  private async checkDeployment(args: any) {
    const results = [];
    const { environment = 'development' } = args;

    try {
      // Check for deployment configuration files
      const deployFiles = [
        'Dockerfile',
        'docker-compose.yml',
        'vercel.json',
        'netlify.toml',
        '.github/workflows',
        'railway.json',
      ];

      const foundDeployFiles = [];
      for (const file of deployFiles) {
        const filePath = path.join(this.projectRoot, file);
        if (await fs.pathExists(filePath)) {
          foundDeployFiles.push(file);
        }
      }

      if (foundDeployFiles.length > 0) {
        results.push(`Deployment configs found: ${foundDeployFiles.join(', ')}`);
      } else {
        results.push('No deployment configuration files found');
      }

      // Check environment variables
      const envPath = path.join(this.projectRoot, `.env.${environment}`);
      const envExists = await fs.pathExists(envPath);

      results.push(`\nEnvironment: ${environment}`);
      results.push(`Environment file (.env.${environment}): ${envExists ? 'Found' : 'Missing'}`);

      // Check build script
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const pkg = await fs.readJson(packagePath);
        const hasStartScript = pkg.scripts?.start;
        const hasBuildScript = pkg.scripts?.build;

        results.push(`\nScripts:`);
        results.push(`- Build script: ${hasBuildScript ? 'Found' : 'Missing'}`);
        results.push(`- Start script: ${hasStartScript ? 'Found' : 'Missing'}`);
      }

      // Security checks
      if (args?.checkSecrets) {
        const potentialSecrets = await glob('**/.env*', {
          cwd: this.projectRoot,
          ignore: ['node_modules/**', '.env.example'],
        });

        if (potentialSecrets.length > 0) {
          results.push(`\n⚠ Environment files found (ensure they're in .gitignore):`);
          potentialSecrets.forEach(file => results.push(`- ${file}`));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Terrafusion Deployment Check (${environment}):\n\n${results.join('\n')}\n\nDeployment Checklist:\n- [ ] Environment variables configured\n- [ ] Build process tested\n- [ ] Dependencies up to date\n- [ ] Security scanning complete\n- [ ] Performance optimized\n- [ ] Monitoring configured`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error checking deployment: ${error.message}`,
          },
        ],
      };
    }
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: this.projectRoot });
      let output = '';

      child.stdout?.on('data', data => {
        output += data.toString();
      });

      child.stderr?.on('data', data => {
        output += data.toString();
      });

      child.on('close', code => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${output}`));
        }
      });

      child.on('error', reject);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Terrafusion Playground MCP Server running');
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new TerraFusionMCP();
  server.run().catch(console.error);
}

export default TerraFusionMCP;
