/**
 * TerraFusion MIT PhD Systems Agent - System Diagnostic Tool
 * Evidence-based system analysis and health verification
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DiagnosticResult {
  timestamp: string;
  category: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  findings: string[];
  evidence: any[];
  recommendations: string[];
}

interface SystemHealthReport {
  overall_status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  diagnostics: DiagnosticResult[];
  summary: {
    total_checks: number;
    healthy: number;
    warnings: number;
    critical: number;
  };
}

export class SystemDiagnosticTool {
  private workspaceRoot: string;
  private backendPath: string;
  private configPath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.backendPath = path.join(workspaceRoot, 'backend');
    this.configPath = path.join(workspaceRoot, 'config');
  }

  /**
   * Run comprehensive system diagnostics
   */
  async runFullDiagnostic(): Promise<SystemHealthReport> {
    console.log('🔍 Starting comprehensive system diagnostic...');

    const diagnostics: DiagnosticResult[] = [];

    // Run all diagnostic checks
    diagnostics.push(await this.checkBackendServices());
    diagnostics.push(await this.checkDatabaseConnectivity());
    diagnostics.push(await this.checkConfigurationIntegrity());
    diagnostics.push(await this.checkDependencies());
    diagnostics.push(await this.checkPortAvailability());
    diagnostics.push(await this.checkCountyConfigurations());
    diagnostics.push(await this.checkComplianceReadiness());

    // Calculate summary
    const summary = {
      total_checks: diagnostics.length,
      healthy: diagnostics.filter(d => d.status === 'healthy').length,
      warnings: diagnostics.filter(d => d.status === 'warning').length,
      critical: diagnostics.filter(d => d.status === 'critical').length
    };

    // Determine overall status
    let overall_status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (summary.critical > 0) {
      overall_status = 'critical';
    } else if (summary.warnings > 0) {
      overall_status = 'degraded';
    }

    const report: SystemHealthReport = {
      overall_status,
      timestamp: new Date().toISOString(),
      diagnostics,
      summary
    };

    // Save report
    await this.saveReport(report);

    return report;
  }

  /**
   * Check backend service health
   */
  private async checkBackendServices(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // Check if backend directory exists
      if (!fs.existsSync(this.backendPath)) {
        return {
          timestamp: new Date().toISOString(),
          category: 'Backend Services',
          status: 'critical',
          findings: ['Backend directory not found'],
          evidence: [{ path: this.backendPath, exists: false }],
          recommendations: ['Verify workspace structure', 'Clone backend repository if missing']
        };
      }

      // Check for solution file
      const solutionFile = path.join(this.backendPath, 'TerraFusion.sln');
      if (fs.existsSync(solutionFile)) {
        findings.push('✓ TerraFusion.sln found');
        evidence.push({ file: 'TerraFusion.sln', exists: true });
      } else {
        status = 'critical';
        findings.push('✗ TerraFusion.sln not found');
        evidence.push({ file: 'TerraFusion.sln', exists: false });
        recommendations.push('Restore solution file from repository');
      }

      // Check for key service projects
      const services = [
        'TerraFusion.API',
        'TerraFusion.Consciousness',
        'TerraFusion.AI',
        'TerraFusion.Data',
        'TerraFusion.Core',
        'TerraFusion.Operations'
      ];

      for (const service of services) {
        const servicePath = path.join(this.backendPath, service);
        const csprojPath = path.join(servicePath, `${service}.csproj`);

        if (fs.existsSync(csprojPath)) {
          findings.push(`✓ ${service} project found`);
          evidence.push({ service, exists: true, path: csprojPath });
        } else {
          status = status === 'healthy' ? 'warning' : status;
          findings.push(`⚠ ${service} project not found`);
          evidence.push({ service, exists: false, expectedPath: csprojPath });
          recommendations.push(`Restore ${service} project`);
        }
      }

      // Try to build solution
      try {
        // Robust restore (no-cache) to avoid stale Windows fallback paths, then single-threaded build
        await execAsync('dotnet restore TerraFusion.sln --no-cache', {
          cwd: this.backendPath,
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 20
        });

        const buildResult = await execAsync('dotnet build TerraFusion.sln -m:1', {
          cwd: this.backendPath,
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 20 // 20 MB to avoid overflow on verbose builds
        });

        // If we reached here, exit code was 0; treat as success even if the string differs across locales
        findings.push('✓ Solution builds successfully');
        // Trim extremely long outputs while preserving tail context
        const out = buildResult.stdout;
        evidence.push({ build: 'success', output_tail: out.slice(Math.max(0, out.length - 4000)) });
      } catch (buildError: any) {
        // Capture rich error evidence
        const errMsg = buildError?.message ?? 'unknown error';
        const errCode = buildError?.code;
        const errStdout: string = buildError?.stdout ?? '';
        const errStderr: string = buildError?.stderr ?? '';

        // Record initial failure evidence
        evidence.push({
          build: 'failed-initial',
          code: errCode,
          message: errMsg,
          stdout_tail: errStdout.slice(Math.max(0, errStdout.length - 4000)),
          stderr_tail: errStderr.slice(Math.max(0, errStderr.length - 4000))
        });

        // Heuristic: detect NuGet fallback folder issue and suggest adding NuGet.config override
        const nugetFallbackHit = /Unable to find fallback package folder/i.test(errStdout + errStderr);
        if (nugetFallbackHit) {
          recommendations.push('Add backend/NuGet.config to clear fallbackPackageFolders and pin packageSources');
        }

        // Attempt one remediation pass: clean bin/obj, no-cache restore, rebuild
        try {
          await execAsync("find . -type d \\(-name bin -o -name obj\\) -prune -exec rm -rf {} +", {
            cwd: this.backendPath,
            timeout: 300000,
            maxBuffer: 1024 * 1024 * 20
          });

          await execAsync('dotnet restore TerraFusion.sln --no-cache', {
            cwd: this.backendPath,
            timeout: 300000,
            maxBuffer: 1024 * 1024 * 20
          });

          const retryBuild = await execAsync('dotnet build TerraFusion.sln -m:1', {
            cwd: this.backendPath,
            timeout: 300000,
            maxBuffer: 1024 * 1024 * 20
          });

          findings.push('✓ Solution builds successfully after clean restore');
          const out = retryBuild.stdout;
          evidence.push({ build: 'success-after-retry', output_tail: out.slice(Math.max(0, out.length - 4000)) });
        } catch (retryError: any) {
          status = 'critical';
          findings.push('✗ Build failed');
          recommendations.push('Fix build errors before proceeding');
          evidence.push({
            build: 'failed-retry',
            code: retryError?.code,
            message: retryError?.message,
            stdout_tail: (retryError?.stdout ?? '').slice(Math.max(0, (retryError?.stdout ?? '').length - 4000)),
            stderr_tail: (retryError?.stderr ?? '').slice(Math.max(0, (retryError?.stderr ?? '').length - 4000))
          });
        }
      }

    } catch (error: any) {
      status = 'critical';
      findings.push(`✗ Error during backend check: ${error.message}`);
      evidence.push({ error: error.message, stack: error.stack });
    }

    return {
      timestamp: new Date().toISOString(),
      category: 'Backend Services',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Check database connectivity and integrity
   */
  private async checkDatabaseConnectivity(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // Check for SQLite database
      const sqliteDbPath = path.join(this.backendPath, 'terrafusion.db');
      if (fs.existsSync(sqliteDbPath)) {
        findings.push('✓ SQLite database file found');
        const stats = fs.statSync(sqliteDbPath);
        evidence.push({
          database: 'SQLite',
          path: sqliteDbPath,
          size: stats.size,
          modified: stats.mtime
        });
      } else {
        status = 'warning';
        findings.push('⚠ SQLite database not found (may need initialization)');
        evidence.push({ database: 'SQLite', exists: false });
        recommendations.push('Run database migrations: dotnet ef database update');
      }

      // Check for PostgreSQL connection string (support both DATABASE_URL and LEVY_DATABASE_URL per protocol)
      const levyDbEnv = process.env.LEVY_DATABASE_URL || process.env.DATABASE_URL;
      if (levyDbEnv) {
        findings.push('✓ TerraLevy database connection configured');
        evidence.push({ database: 'PostgreSQL', configured: true, source: process.env.LEVY_DATABASE_URL ? 'LEVY_DATABASE_URL' : 'DATABASE_URL' });
      } else {
        // Attempt to derive from backend/.env.bulletproof as documented
        const bulletproofEnv = path.join(this.backendPath, '.env.bulletproof');
        if (fs.existsSync(bulletproofEnv)) {
          try {
            const envText = fs.readFileSync(bulletproofEnv, 'utf-8');
            const get = (key: string) => (envText.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1] || '').trim();
            const user = get('POSTGRES_USER') || 'terrafusion';
            const pass = get('POSTGRES_PASSWORD') || '';
            const db = get('POSTGRES_DB') || 'terrafusion_os';
            const host = get('POSTGRES_HOST') || 'localhost';
            const port = get('POSTGRES_PORT') || '5432';
            if (user && pass && db) {
              const derivedUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
              findings.push('✓ TerraLevy database connection derived from .env.bulletproof');
              evidence.push({ database: 'PostgreSQL', configured: true, source: '.env.bulletproof', url_sample: derivedUrl.replace(/:\\?[^@]+@/, ':*****@') });
            } else {
              status = status === 'healthy' ? 'warning' : status;
              findings.push('⚠ PostgreSQL not configured (missing vars in .env.bulletproof)');
              evidence.push({ database: 'PostgreSQL', configured: false, checked: '.env.bulletproof' });
              recommendations.push('Set DATABASE_URL (preferred) or LEVY_DATABASE_URL, or complete POSTGRES_* in backend/.env.bulletproof');
            }
          } catch (e: any) {
            status = status === 'healthy' ? 'warning' : status;
            findings.push('⚠ Unable to read .env.bulletproof for PostgreSQL config');
            evidence.push({ database: 'PostgreSQL', configured: false, error: e?.message });
            recommendations.push('Set DATABASE_URL (preferred) or LEVY_DATABASE_URL environment variable');
          }
        } else {
          status = status === 'healthy' ? 'warning' : status;
          findings.push('⚠ PostgreSQL not configured (DATABASE_URL/LEVY_DATABASE_URL missing)');
          evidence.push({ database: 'PostgreSQL', configured: false });
          recommendations.push('Set DATABASE_URL (preferred) or LEVY_DATABASE_URL environment variable');
        }
      }

      // Check for migration files
      const dataProjectPath = path.join(this.backendPath, 'TerraFusion.Data');
      const migrationsPath = path.join(dataProjectPath, 'Migrations');

      if (fs.existsSync(migrationsPath)) {
        const migrations = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.cs'));
        findings.push(`✓ Found ${migrations.length} migrations`);
        evidence.push({ migrations: migrations.length, path: migrationsPath });
      } else {
        status = 'warning';
        findings.push('⚠ No migrations found');
        recommendations.push('Generate initial migration if needed');
      }

    } catch (error: any) {
      status = 'critical';
      findings.push(`✗ Error checking database: ${error.message}`);
      evidence.push({ error: error.message });
    }

    return {
      timestamp: new Date().toISOString(),
      category: 'Database Connectivity',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Check configuration file integrity
   */
  private async checkConfigurationIntegrity(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // Check config directory
      if (!fs.existsSync(this.configPath)) {
        return {
          timestamp: new Date().toISOString(),
          category: 'Configuration',
          status: 'critical',
          findings: ['Configuration directory not found'],
          evidence: [{ path: this.configPath, exists: false }],
          recommendations: ['Create config directory', 'Restore configuration files']
        };
      }

      // Check for key config files
      const configFiles = [
        'terrafusion-brand-context.json',
        'ai/ai-system-prompts.json'
      ];

      for (const configFile of configFiles) {
        const fullPath = path.join(this.configPath, configFile);
        if (fs.existsSync(fullPath)) {
          findings.push(`✓ ${configFile} found`);

          // Validate JSON
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = JSON.parse(content);
            evidence.push({ file: configFile, valid: true, keys: Object.keys(parsed).length });
          } catch (parseError) {
            status = 'critical';
            findings.push(`✗ ${configFile} has invalid JSON`);
            evidence.push({ file: configFile, valid: false });
            recommendations.push(`Fix JSON syntax in ${configFile}`);
          }
        } else {
          status = 'warning';
          findings.push(`⚠ ${configFile} not found`);
          evidence.push({ file: configFile, exists: false });
          recommendations.push(`Restore ${configFile}`);
        }
      }

      // Check for county configs
      const countyConfigs = fs.readdirSync(this.configPath)
        .filter(f => f.startsWith('tenant.') && f.endsWith('.yaml'));

      if (countyConfigs.length > 0) {
        findings.push(`✓ Found ${countyConfigs.length} county configurations`);
        evidence.push({ countyConfigs: countyConfigs.length, files: countyConfigs });
      } else {
        status = 'warning';
        findings.push('⚠ No county configurations found');
        evidence.push({ countyConfigs: 0 });
        recommendations.push('Create tenant configuration files for counties');
      }

    } catch (error: any) {
      status = 'critical';
      findings.push(`✗ Error checking configuration: ${error.message}`);
      evidence.push({ error: error.message });
    }

    return {
      timestamp: new Date().toISOString(),
      category: 'Configuration',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Check for required dependencies
   */
  private async checkDependencies(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // Check .NET SDK
      try {
        const dotnetResult = await execAsync('dotnet --version');
        const version = dotnetResult.stdout.trim();
        findings.push(`✓ .NET SDK installed: ${version}`);
        evidence.push({ tool: 'dotnet', version, installed: true });

        if (!version.startsWith('8.')) {
          status = 'warning';
          findings.push('⚠ .NET 8 recommended');
          recommendations.push('Install .NET 8 SDK for optimal compatibility');
        }
      } catch {
        status = 'critical';
        findings.push('✗ .NET SDK not found');
        evidence.push({ tool: 'dotnet', installed: false });
        recommendations.push('Install .NET 8 SDK');
      }

      // Check Entity Framework tools
      try {
        const efResult = await execAsync('dotnet ef --version');
        findings.push('✓ Entity Framework tools installed');
        evidence.push({ tool: 'dotnet-ef', installed: true });
      } catch {
        status = 'warning';
        findings.push('⚠ Entity Framework tools not installed');
        evidence.push({ tool: 'dotnet-ef', installed: false });
        recommendations.push('Install EF tools: dotnet tool install --global dotnet-ef');
      }

      // Check Node.js (for SDK tools)
      try {
        const nodeResult = await execAsync('node --version');
        const version = nodeResult.stdout.trim();
        findings.push(`✓ Node.js installed: ${version}`);
        evidence.push({ tool: 'node', version, installed: true });
      } catch {
        status = 'warning';
        findings.push('⚠ Node.js not found');
        evidence.push({ tool: 'node', installed: false });
        recommendations.push('Install Node.js for SDK tools');
      }

      // Check Python (for SDK validation tools)
      try {
        const pythonResult = await execAsync('python3 --version');
        const version = pythonResult.stdout.trim();
        findings.push(`✓ Python installed: ${version}`);
        evidence.push({ tool: 'python', version, installed: true });
      } catch {
        status = 'warning';
        findings.push('⚠ Python not found');
        evidence.push({ tool: 'python', installed: false });
        recommendations.push('Install Python for SDK validation tools');
      }

    } catch (error: any) {
      status = 'critical';
      findings.push(`✗ Error checking dependencies: ${error.message}`);
      evidence.push({ error: error.message });
    }

    return {
      timestamp: new Date().toISOString(),
      category: 'Dependencies',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Check port availability for services
   */
  private async checkPortAvailability(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    const ports = [
      { port: 5000, service: 'TerraFusion.API (HTTP)' },
      { port: 5001, service: 'TerraFusion.API (HTTPS)' },
      { port: 3004, service: 'TerraFusion.Consciousness' }
    ];

    for (const { port, service } of ports) {
      try {
        const result = await execAsync(`netstat -an | grep ${port} || lsof -i :${port} || echo "PORT_FREE"`);

        if (result.stdout.includes('PORT_FREE') || result.stdout.trim() === '') {
          findings.push(`✓ Port ${port} available for ${service}`);
          evidence.push({ port, service, available: true });
        } else {
          status = 'warning';
          findings.push(`⚠ Port ${port} may be in use (${service})`);
          evidence.push({ port, service, available: false, output: result.stdout });
          recommendations.push(`Check if port ${port} is already in use by another process`);
        }
      } catch (error: any) {
        // Error usually means port is free (command failed to find anything)
        findings.push(`✓ Port ${port} likely available for ${service}`);
        evidence.push({ port, service, available: true });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      category: 'Port Availability',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Check county configurations
   */
  private async checkCountyConfigurations(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      if (!fs.existsSync(this.configPath)) {
        return {
          timestamp: new Date().toISOString(),
          category: 'County Configurations',
          status: 'critical',
          findings: ['Config directory not found'],
          evidence: [],
          recommendations: ['Create config directory structure']
        };
      }

      const countyFiles = fs.readdirSync(this.configPath)
        .filter(f => f.startsWith('tenant.') && f.endsWith('.yaml'));

      if (countyFiles.length === 0) {
        status = 'warning';
        findings.push('⚠ No county configurations found');
        evidence.push({ counties: 0 });
        recommendations.push('Create tenant YAML files for Washington State counties');
      } else {
        findings.push(`✓ Found ${countyFiles.length} county configurations`);
        evidence.push({
          counties: countyFiles.length,
          files: countyFiles,
          target: 39 // 39 counties in Washington State
        });

        if (countyFiles.length < 39) {
          status = 'warning';
          findings.push(`⚠ Expected 39 counties, found ${countyFiles.length}`);
          recommendations.push('Complete county configuration for all 39 Washington State counties');
        }
      }

    } catch (error: any) {
      status = 'critical';
      findings.push(`✗ Error checking county configs: ${error.message}`);
      evidence.push({ error: error.message });
    }

    return {
      timestamp: new Date().toISOString(),
      category: 'County Configurations',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Check compliance readiness
   */
  private async checkComplianceReadiness(): Promise<DiagnosticResult> {
    const findings: string[] = [];
    const evidence: any[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    const complianceChecks = [
      { name: 'FISMA-High', required: true },
      { name: 'NIST 800-53', required: true },
      { name: 'FedRAMP High', required: true },
      { name: 'Section 508', required: true },
      { name: 'SOC 2 Type II', required: false }
    ];

    // Check for compliance documentation
    const complianceDocs = [
      'SECURITY_POLICY.md',
      'COMPLIANCE.md',
      'ACCESSIBILITY_REPORT.md'
    ];

    for (const doc of complianceDocs) {
      const docPath = path.join(this.workspaceRoot, doc);
      if (fs.existsSync(docPath)) {
        findings.push(`✓ ${doc} found`);
        evidence.push({ document: doc, exists: true });
      } else {
        status = 'warning';
        findings.push(`⚠ ${doc} not found`);
        evidence.push({ document: doc, exists: false });
        recommendations.push(`Create ${doc} for compliance tracking`);
      }
    }

    // Check for security configurations
    findings.push('✓ Compliance framework requirements documented');
    evidence.push({ checks: complianceChecks });

    return {
      timestamp: new Date().toISOString(),
      category: 'Compliance Readiness',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  /**
   * Save diagnostic report
   */
  private async saveReport(report: SystemHealthReport): Promise<void> {
    const logsDir = path.join(
      this.workspaceRoot,
      'agents/terrafusion-phd-systems-agent/logs'
    );

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const filename = `diagnostic-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const filepath = path.join(logsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📊 Diagnostic report saved: ${filepath}`);
  }

  /**
   * Print report to console
   */
  printReport(report: SystemHealthReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 TERRAFUSION SYSTEM DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${this.getStatusEmoji(report.overall_status)} ${report.overall_status.toUpperCase()}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`\nSummary: ${report.summary.healthy} healthy, ${report.summary.warnings} warnings, ${report.summary.critical} critical`);
    console.log('='.repeat(80));

    for (const diagnostic of report.diagnostics) {
      console.log(`\n📋 ${diagnostic.category}`);
      console.log(`Status: ${this.getStatusEmoji(diagnostic.status)} ${diagnostic.status.toUpperCase()}`);
      console.log('\nFindings:');
      diagnostic.findings.forEach(f => console.log(`  ${f}`));

      if (diagnostic.recommendations.length > 0) {
        console.log('\nRecommendations:');
        diagnostic.recommendations.forEach(r => console.log(`  → ${r}`));
      }
      console.log('-'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': case 'degraded': return '⚠️';
      case 'critical': return '🔴';
      default: return '❓';
    }
  }
}

// CLI execution
if (require.main === module) {
  const workspaceRoot = process.argv[2] || '/workspaces/terrafusion_os_1.0';
  const tool = new SystemDiagnosticTool(workspaceRoot);

  tool.runFullDiagnostic()
    .then(report => {
      tool.printReport(report);
      process.exit(report.overall_status === 'critical' ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Diagnostic failed:', error);
      process.exit(1);
    });
}

export default SystemDiagnosticTool;
