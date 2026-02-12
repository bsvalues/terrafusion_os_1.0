#!/usr/bin/env node

/**
 * TerraFusion MIT PhD Systems Agent - CLI Entry Point
 * Command-line interface for agent operations
 */

const { program } = require('commander');
const path = require('path');

const workspaceRoot = process.env.WORKSPACE_ROOT || '/workspaces/terrafusion_os_1.0';

program
  .name('terrafusion-agent')
  .description('TerraFusion MIT PhD Systems Agent - Elite evidence-based engineering')
  .version('1.0.0');

// Diagnostic command
program
  .command('diagnostic')
  .description('Run comprehensive system diagnostic')
  .action(async () => {
    const SystemDiagnosticTool = require('./dist/tools/system-diagnostic').default;
    const tool = new SystemDiagnosticTool(workspaceRoot);

    try {
      const report = await tool.runFullDiagnostic();
      tool.printReport(report);
      process.exit(report.overall_status === 'critical' ? 1 : 0);
    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
      process.exit(1);
    }
  });

// Validation command
program
  .command('validate')
  .description('Run multi-layer validation framework')
  .action(async () => {
    const ValidationFramework = require('./dist/tools/validation-framework').default;
    const framework = new ValidationFramework(workspaceRoot);

    try {
      const results = await framework.validateAll();
      const hasFailed = results.some(r => !r.passed);
      process.exit(hasFailed ? 1 : 0);
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  });

// Performance report command
program
  .command('performance')
  .description('Generate performance telemetry report')
  .option('-h, --hours <hours>', 'Hours of history to analyze', '24')
  .action(async (options) => {
    const PerformanceTelemetry = require('./dist/frameworks/performance-telemetry').default;
    const telemetry = new PerformanceTelemetry(workspaceRoot);

    try {
      const report = telemetry.generateReport(parseInt(options.hours));
      telemetry.printReport(report);
    } catch (error) {
      console.error('❌ Performance report failed:', error.message);
      process.exit(1);
    }
  });

// Decision list command
program
  .command('decisions')
  .description('List all decision records')
  .action(async () => {
    const DecisionTracker = require('./dist/frameworks/decision-tracking').DecisionTracker;
    const tracker = new DecisionTracker(workspaceRoot);

    try {
      const decisions = tracker.listDecisions();
      console.log('\n📋 Decision Records:\n');
      decisions.forEach(d => {
        console.log(`${d.id} [${d.category}] - ${d.problem}`);
        console.log(`  Timestamp: ${d.timestamp}\n`);
      });
    } catch (error) {
      console.error('❌ Decision list failed:', error.message);
      process.exit(1);
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize agent and verify platform connectivity')
  .action(async () => {
    const QualityFirstEngine = require('./dist/engine/quality-first-engine').default;
    const engine = new QualityFirstEngine(workspaceRoot);

    try {
      await engine.initialize();
      console.log('✅ Agent initialized successfully');
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    }
  });

// Execute task command
program
  .command('execute')
  .description('Execute a task with full quality enforcement')
  .requiredOption('-i, --id <id>', 'Task ID')
  .requiredOption('-c, --category <category>', 'Task category (architecture|implementation|debugging|optimization|compliance|documentation)')
  .requiredOption('-d, --description <description>', 'Task description')
  .requiredOption('-s, --scope <scope>', 'Task scope')
  .option('--county <county>', 'County code (if county-specific)')
  .action(async (options) => {
    const QualityFirstEngine = require('./dist/engine/quality-first-engine').default;
    const engine = new QualityFirstEngine(workspaceRoot);

    try {
      await engine.initialize();      const task = {
        id: options.id,
        category: options.category,
        description: options.description,
        scope: options.scope,
        success_criteria: ['Implementation complete', 'Tests pass', 'Documentation updated'],
        constraints: ['Follow TerraFusion patterns', 'Maintain performance targets'],
        county_specific: options.county
      };

      const result = await engine.executeTask(task);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`Task Execution Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`Phases: ${result.phases_completed}/${result.total_phases}`);
      console.log(`Duration: ${result.duration_minutes.toFixed(2)} minutes`);
      console.log(`${'='.repeat(80)}\n`);

      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Task execution failed:', error.message);
      process.exit(1);
    }
  });

// Platform status command
program
  .command('status')
  .description('Check TerraFusion platform status')
  .action(async () => {
    const PlatformIntegration = require('./dist/integrations/platform-integration').default;
    const platform = new PlatformIntegration(workspaceRoot);

    try {
      await platform.initialize();
      const context = platform.getContext();

      console.log('\n📊 TerraFusion Platform Status\n');
      console.log(`Workspace: ${context.workspace_root}`);
      console.log(`Backend: ${context.backend_path}`);
      console.log(`Config: ${context.config_path}`);
      console.log(`SDK: ${context.sdk_path}\n`);

      console.log('Services:');
      context.services.forEach(s => {
        const emoji = s.status === 'online' ? '✅' : s.status === 'offline' ? '❌' : '❓';
        console.log(`  ${emoji} ${s.name} (${s.url}:${s.port})`);
      });

      console.log(`\nCounty Configurations: ${context.county_configs.length}`);
      console.log(`SQLite DB: ${context.database_connections.sqlite}`);
      console.log(`PostgreSQL: ${context.database_connections.postgresql || 'Not configured'}\n`);

    } catch (error) {
      console.error('❌ Platform status check failed:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
