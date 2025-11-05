/**
 * TerraFusion MIT PhD Systems Agent - Platform Integration Layer
 * Connects to all TerraFusion services, databases, and orchestration systems
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ServiceEndpoint {
  name: string;
  url: string;
  port: number;
  health_endpoint: string;
  status: 'online' | 'offline' | 'unknown';
}

interface TerraFusionContext {
  workspace_root: string;
  backend_path: string;
  config_path: string;
  sdk_path: string;
  services: ServiceEndpoint[];
  county_configs: string[];
  database_connections: {
    sqlite: string;
    postgresql?: string;
  };
}

export class PlatformIntegration {
  private context: TerraFusionContext;

  constructor(workspaceRoot: string) {
    this.context = {
      workspace_root: workspaceRoot,
      backend_path: path.join(workspaceRoot, 'backend'),
      config_path: path.join(workspaceRoot, 'config'),
      sdk_path: path.join(workspaceRoot, 'SDK'),
      services: [
        {
          name: 'TerraFusion.API',
          url: 'http://localhost',
          port: 5000,
          health_endpoint: '/health',
          status: 'unknown'
        },
        {
          name: 'TerraFusion.Consciousness',
          url: 'http://localhost',
          port: 3004,
          health_endpoint: '/health',
          status: 'unknown'
        }
      ],
      county_configs: [],
      database_connections: {
        sqlite: path.join(workspaceRoot, 'backend/terrafusion.db'),
        postgresql: process.env.LEVY_DATABASE_URL
      }
    };

    this.loadCountyConfigs();
  }

  /**
   * Initialize platform connection
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing TerraFusion platform integration...\n');

    await this.verifyWorkspaceStructure();
    await this.checkServiceStatus();
    await this.verifyDatabaseConnections();
    this.loadEnvironmentVariables();

    console.log('✅ Platform integration initialized\n');
  }

  /**
   * Get current platform context
   */
  getContext(): TerraFusionContext {
    return this.context;
  }

  /**
   * Execute backend service command
   */
  async executeServiceCommand(
    service: string,
    command: string,
    args: string[] = []
  ): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const servicePath = path.join(this.context.backend_path, service);

      if (!fs.existsSync(servicePath)) {
        return {
          success: false,
          output: '',
          error: `Service ${service} not found at ${servicePath}`
        };
      }

      const fullCommand = `dotnet ${command} ${args.join(' ')}`;
      console.log(`🔧 Executing: ${fullCommand} in ${service}`);

      const result = await execAsync(fullCommand, {
        cwd: servicePath,
        timeout: 60000
      });

      return {
        success: true,
        output: result.stdout + result.stderr
      };

    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.message
      };
    }
  }

  /**
   * Build specific service
   */
  async buildService(service: string): Promise<boolean> {
    console.log(`🔨 Building ${service}...`);
    const result = await this.executeServiceCommand(service, 'build');

    if (result.success) {
      console.log(`✅ ${service} built successfully`);
      return true;
    } else {
      console.error(`❌ Failed to build ${service}: ${result.error}`);
      return false;
    }
  }

  /**
   * Start a service
   */
  async startService(service: string, additionalArgs: string[] = []): Promise<void> {
    console.log(`🚀 Starting ${service}...`);

    const args = ['run', ...additionalArgs];
    const result = await this.executeServiceCommand(service, '', args);

    if (!result.success) {
      throw new Error(`Failed to start ${service}: ${result.error}`);
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.context.services.find(s => s.name === serviceName);
    if (!service) {
      console.warn(`Service ${serviceName} not found in configuration`);
      return false;
    }

    try {
      const url = `${service.url}:${service.port}${service.health_endpoint}`;
      const response = await fetch(url);
      const healthy = response.ok;

      service.status = healthy ? 'online' : 'offline';
      return healthy;
    } catch (error) {
      service.status = 'offline';
      return false;
    }
  }

  /**
   * Query database
   */
  async queryDatabase(
    database: 'sqlite' | 'postgresql',
    query: string
  ): Promise<any[]> {
    if (database === 'sqlite') {
      return await this.querySQLite(query);
    } else {
      return await this.queryPostgreSQL(query);
    }
  }

  /**
   * Load county configuration
   */
  async loadCountyConfig(countyCode: string): Promise<any> {
    const configFile = path.join(
      this.context.config_path,
      `tenant.${countyCode.toLowerCase()}.yaml`
    );

    if (!fs.existsSync(configFile)) {
      throw new Error(`County configuration not found: ${configFile}`);
    }

    // For YAML parsing, you'd typically use a library like 'js-yaml'
    // For now, we'll just read the file
    const content = fs.readFileSync(configFile, 'utf-8');
    return { raw: content };
  }

  /**
   * Get AI system prompts
   */
  async getAISystemPrompts(): Promise<any> {
    const promptsFile = path.join(
      this.context.config_path,
      'ai/ai-system-prompts.json'
    );

    if (!fs.existsSync(promptsFile)) {
      throw new Error('AI system prompts not found');
    }

    const content = fs.readFileSync(promptsFile, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Execute SDK tool
   */
  async executeSDKTool(toolPath: string, args: string[] = []): Promise<any> {
    const fullPath = path.join(this.context.sdk_path, toolPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`SDK tool not found: ${fullPath}`);
    }

    let command: string;
    if (fullPath.endsWith('.py')) {
      command = `python3 ${fullPath} ${args.join(' ')}`;
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      command = `node ${fullPath} ${args.join(' ')}`;
    } else if (fullPath.endsWith('.sh')) {
      command = `bash ${fullPath} ${args.join(' ')}`;
    } else {
      throw new Error(`Unsupported SDK tool type: ${fullPath}`);
    }

    console.log(`🛠️  Executing SDK tool: ${command}`);

    try {
      const result = await execAsync(command, {
        cwd: this.context.sdk_path,
        timeout: 120000
      });

      return {
        success: true,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.message
      };
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(context: string = 'TerraFusionDbContext'): Promise<boolean> {
    console.log(`🔄 Running database migrations for ${context}...`);

    const dataProject = 'TerraFusion.Data';
    const result = await this.executeServiceCommand(
      dataProject,
      'ef',
      ['database', 'update', '--context', context]
    );

    if (result.success) {
      console.log('✅ Migrations completed successfully');
      return true;
    } else {
      console.error(`❌ Migration failed: ${result.error}`);
      return false;
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(service: string, lines: number = 100): Promise<string[]> {
    // This would integrate with actual logging infrastructure
    // For now, return placeholder
    return [
      `Log entries for ${service} (last ${lines} lines)`,
      'Integration with logging system required'
    ];
  }

  /**
   * Monitor AI swarm status
   */
  async getSwarmStatus(): Promise<any> {
    // This would query the Consciousness service
    const service = this.context.services.find(s => s.name === 'TerraFusion.Consciousness');

    if (!service || service.status !== 'online') {
      return {
        status: 'offline',
        message: 'Consciousness service not available'
      };
    }

    try {
      const url = `${service.url}:${service.port}/api/swarm/status`;
      const response = await fetch(url);
      return await response.json();
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // Private methods

  private async verifyWorkspaceStructure(): Promise<void> {
    const requiredPaths = [
      this.context.backend_path,
      this.context.config_path,
      this.context.sdk_path
    ];

    for (const requiredPath of requiredPaths) {
      if (!fs.existsSync(requiredPath)) {
        throw new Error(`Required path not found: ${requiredPath}`);
      }
    }

    console.log('✅ Workspace structure verified');
  }

  private async checkServiceStatus(): Promise<void> {
    console.log('🔍 Checking service status...');

    for (const service of this.context.services) {
      const healthy = await this.checkServiceHealth(service.name);
      console.log(`  ${service.name}: ${healthy ? '✅ Online' : '⚠️  Offline'}`);
    }
  }

  private async verifyDatabaseConnections(): Promise<void> {
    console.log('🗄️  Verifying database connections...');

    // Check SQLite
    if (fs.existsSync(this.context.database_connections.sqlite)) {
      console.log('  ✅ SQLite database found');
    } else {
      console.log('  ⚠️  SQLite database not found (may need initialization)');
    }

    // Check PostgreSQL
    if (this.context.database_connections.postgresql) {
      console.log('  ✅ PostgreSQL connection configured');
    } else {
      console.log('  ⚠️  PostgreSQL connection not configured');
    }
  }

  private loadEnvironmentVariables(): void {
    const envVars = [
      'LEVY_DATABASE_URL',
      'TF_ELITE_MODE',
      'TF_CONSCIOUSNESS_PORT'
    ];

    console.log('🔐 Environment variables:');
    for (const envVar of envVars) {
      const value = process.env[envVar];
      console.log(`  ${envVar}: ${value ? '✅ Set' : '⚠️  Not set'}`);
    }
  }

  private loadCountyConfigs(): void {
    if (!fs.existsSync(this.context.config_path)) {
      return;
    }

    this.context.county_configs = fs.readdirSync(this.context.config_path)
      .filter(f => f.startsWith('tenant.') && f.endsWith('.yaml'))
      .map(f => f.replace('tenant.', '').replace('.yaml', ''));
  }

  private async querySQLite(query: string): Promise<any[]> {
    const dbPath = this.context.database_connections.sqlite;

    try {
      const result = await execAsync(`sqlite3 "${dbPath}" "${query}"`);
      return result.stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error: any) {
      throw new Error(`SQLite query failed: ${error.message}`);
    }
  }

  private async queryPostgreSQL(query: string): Promise<any[]> {
    const connectionString = this.context.database_connections.postgresql;

    if (!connectionString) {
      throw new Error('PostgreSQL connection not configured');
    }

    // This would use a proper PostgreSQL client
    // For now, throw error indicating implementation needed
    throw new Error('PostgreSQL query implementation required');
  }
}

export default PlatformIntegration;
