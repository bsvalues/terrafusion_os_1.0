import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const REPO_ROOT = resolve(__dirname, '../../../..');
const TEST_RESULTS_DIR = join(REPO_ROOT, '.terrafusion', 'test-results');
const COVERAGE_DIR = join(REPO_ROOT, 'coverage');

interface TestTier {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  runner?: string;
  command?: string;
}

interface TestResults {
  generatedAt: string;
  tiers: Record<string, TestTier>;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  healthScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface CoverageData {
  line: number;
  branch: number;
  function: number;
  statement: number;
  meetsThreshold: boolean;
  target: number;
}

export const testCommand = new Command('test')
  .alias('t')
  .description('🧪 Test orchestration - run and monitor 716+ tests across 5 tiers')
  .addCommand(
    new Command('run')
      .description('Run test suites across specified tiers')
      .option('-t, --tier <tier>', 'test tier to run (spine|unit|integration|e2e|compliance|all)', 'all')
      .option('-v, --verbose', 'verbose output with detailed test results')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        const spinner = ora('Initializing test orchestration...').start();

        try {
          const tier = options.tier.toLowerCase();
          const tiers = tier === 'all'
            ? ['spine', 'unit', 'integration', 'e2e', 'compliance']
            : [tier];

          const results: TestResults = {
            generatedAt: new Date().toISOString(),
            tiers: {},
            totalTests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            healthScore: 0,
            status: 'good',
          };

          for (const t of tiers) {
            spinner.text = `Running ${t} tests...`;

            const tierResult = await runTestTier(t, options.verbose);
            results.tiers[t] = tierResult;
            results.totalTests += tierResult.total;
            results.passed += tierResult.passed;
            results.failed += tierResult.failed;
            results.skipped += tierResult.skipped;
          }

          // Calculate health score
          results.healthScore = results.totalTests > 0
            ? Math.round((results.passed / results.totalTests) * 100)
            : 0;

          // Determine status
          if (results.healthScore >= 90) results.status = 'excellent';
          else if (results.healthScore >= 75) results.status = 'good';
          else if (results.healthScore >= 50) results.status = 'warning';
          else results.status = 'critical';

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(results, null, 2));
            return;
          }

          renderTestRunResults(results);
        } catch (error) {
          spinner.fail('Test run failed');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show test health dashboard')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        try {
          const resultsFile = join(TEST_RESULTS_DIR, 'latest.json');

          let results: TestResults;
          if (existsSync(resultsFile)) {
            results = JSON.parse(await readFile(resultsFile, 'utf8'));
          } else {
            // Build fallback status from known test locations
            results = await buildTestStatusFallback();
          }

          if (options.json) {
            console.log(JSON.stringify(results, null, 2));
            return;
          }

          renderTestStatus(results);
        } catch (error) {
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('coverage')
      .description('Show coverage summary')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        try {
          const coverageData = await readCoverageData();

          if (options.json) {
            console.log(JSON.stringify(coverageData, null, 2));
            return;
          }

          renderCoverage(coverageData);
        } catch (error) {
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  );

async function runTestTier(tier: string, verbose: boolean): Promise<TestTier> {
  const tierConfig: Record<string, { runner: string; command: string; expectedTests: number }> = {
    spine: {
      runner: 'node',
      command: 'node tools/dx/spine-smoke.mjs',
      expectedTests: 101,
    },
    unit: {
      runner: 'dotnet',
      command: 'dotnet test --filter Category=Unit',
      expectedTests: 250,
    },
    integration: {
      runner: 'dotnet',
      command: 'dotnet test --filter Category=Integration',
      expectedTests: 180,
    },
    e2e: {
      runner: 'npm',
      command: 'cd frontend && npm run test:e2e',
      expectedTests: 85,
    },
    compliance: {
      runner: 'npm',
      command: 'npm run test:compliance',
      expectedTests: 100,
    },
  };

  const config = tierConfig[tier];
  if (!config) {
    return {
      name: tier,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      runner: 'unknown',
    };
  }

  // Check if runner is available
  const runnerAvailable = checkRunnerAvailable(config.runner);
  if (!runnerAvailable) {
    return {
      name: tier,
      total: config.expectedTests,
      passed: 0,
      failed: 0,
      skipped: config.expectedTests,
      runner: config.runner,
      command: config.command,
    };
  }

  try {
    const output = execSync(config.command, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
    });

    // Parse output for test results (basic parsing, can be enhanced)
    const result = parseTestOutput(output, tier, config.expectedTests);
    result.runner = config.runner;
    result.command = config.command;
    return result;
  } catch (error) {
    // Test command failed
    return {
      name: tier,
      total: config.expectedTests,
      passed: 0,
      failed: config.expectedTests,
      skipped: 0,
      runner: config.runner,
      command: config.command,
    };
  }
}

function checkRunnerAvailable(runner: string): boolean {
  try {
    if (runner === 'node') {
      execSync('node --version', { stdio: 'ignore' });
      return true;
    } else if (runner === 'dotnet') {
      execSync('dotnet --version', { stdio: 'ignore' });
      return true;
    } else if (runner === 'npm') {
      execSync('npm --version', { stdio: 'ignore' });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function parseTestOutput(output: string, tier: string, expectedTests: number): TestTier {
  // Basic test output parsing - can be enhanced based on actual output format
  const lines = output.split('\n');

  // Look for common test result patterns
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let total = expectedTests;

  // Try to parse dotnet test output
  const dotnetMatch = output.match(/Passed!\s+-\s+Failed:\s+(\d+),\s+Passed:\s+(\d+),\s+Skipped:\s+(\d+),\s+Total:\s+(\d+)/);
  if (dotnetMatch) {
    failed = parseInt(dotnetMatch[1], 10);
    passed = parseInt(dotnetMatch[2], 10);
    skipped = parseInt(dotnetMatch[3], 10);
    total = parseInt(dotnetMatch[4], 10);
  }

  // Try to parse Jest/Vitest output
  const jestMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (jestMatch) {
    failed = parseInt(jestMatch[1], 10);
    passed = parseInt(jestMatch[2], 10);
    total = parseInt(jestMatch[3], 10);
  }

  // Try to parse Playwright output
  const playwrightMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed/);
  if (playwrightMatch) {
    passed = parseInt(playwrightMatch[1], 10);
    failed = parseInt(playwrightMatch[2], 10);
    total = passed + failed;
  }

  // Spine smoke test output
  if (tier === 'spine' && output.includes('✓')) {
    const passedLines = output.split('\n').filter(line => line.includes('✓')).length;
    passed = passedLines;
    total = passedLines;
  }

  return {
    name: tier,
    total,
    passed,
    failed,
    skipped,
  };
}

async function buildTestStatusFallback(): Promise<TestResults> {
  // Fallback: try to determine test status from file system
  const tiers: Record<string, TestTier> = {
    spine: { name: 'spine', total: 101, passed: 0, failed: 0, skipped: 101, runner: 'node' },
    unit: { name: 'unit', total: 250, passed: 0, failed: 0, skipped: 250, runner: 'dotnet' },
    integration: { name: 'integration', total: 180, passed: 0, failed: 0, skipped: 180, runner: 'dotnet' },
    e2e: { name: 'e2e', total: 85, passed: 0, failed: 0, skipped: 85, runner: 'npm' },
    compliance: { name: 'compliance', total: 100, passed: 0, failed: 0, skipped: 100, runner: 'npm' },
  };

  return {
    generatedAt: new Date().toISOString(),
    tiers,
    totalTests: 716,
    passed: 0,
    failed: 0,
    skipped: 716,
    healthScore: 0,
    status: 'warning',
  };
}

async function readCoverageData(): Promise<CoverageData> {
  const coverageSummaryPath = join(COVERAGE_DIR, 'coverage-summary.json');

  if (!existsSync(coverageSummaryPath)) {
    // Try backend coverage
    const backendCoveragePath = join(REPO_ROOT, 'backend', 'coverage', 'coverage-summary.json');
    if (!existsSync(backendCoveragePath)) {
      return {
        line: 0,
        branch: 0,
        function: 0,
        statement: 0,
        meetsThreshold: false,
        target: 97,
      };
    }
  }

  try {
    const summary = JSON.parse(await readFile(coverageSummaryPath, 'utf8'));
    const total = summary.total || {};

    const linePercent = total.lines?.pct || 0;
    const branchPercent = total.branches?.pct || 0;
    const functionPercent = total.functions?.pct || 0;
    const statementPercent = total.statements?.pct || 0;

    return {
      line: linePercent,
      branch: branchPercent,
      function: functionPercent,
      statement: statementPercent,
      meetsThreshold: linePercent >= 97,
      target: 97,
    };
  } catch {
    return {
      line: 0,
      branch: 0,
      function: 0,
      statement: 0,
      meetsThreshold: false,
      target: 97,
    };
  }
}

function renderTestRunResults(results: TestResults) {
  const statusColor = results.status === 'excellent' ? chalk.green :
                      results.status === 'good' ? chalk.cyan :
                      results.status === 'warning' ? chalk.yellow : chalk.red;

  const statusIcon = results.status === 'excellent' ? '✅' :
                     results.status === 'good' ? '🟢' :
                     results.status === 'warning' ? '⚠️' : '❌';

  console.log(chalk.cyan('\n🧪 TerraFusion Test Orchestration\n'));
  console.log(chalk.gray('─'.repeat(70)));

  // Overall summary
  console.log(`  ${statusIcon} Overall Health: ${statusColor(results.healthScore + '%')} ${chalk.gray(`(${results.status})`)}`);
  console.log(`  ${chalk.white('Total Tests:')}   ${results.totalTests}`);
  console.log(`  ${chalk.green('✓ Passed:')}     ${results.passed}`);
  console.log(`  ${chalk.red('✗ Failed:')}     ${results.failed}`);
  console.log(`  ${chalk.gray('⊝ Skipped:')}    ${results.skipped}`);

  console.log(chalk.gray('\n─ Test Tiers ─'.padEnd(70, '─')));

  const tierIcons: Record<string, string> = {
    spine: '🌀', unit: '🔬', integration: '🔗', e2e: '🎭', compliance: '📋',
  };

  for (const [tierName, tier] of Object.entries(results.tiers)) {
    const icon = tierIcons[tierName] || '🧪';
    const passRate = tier.total > 0 ? Math.round((tier.passed / tier.total) * 100) : 0;
    const tierStatus = passRate >= 90 ? chalk.green('PASS') :
                       passRate >= 75 ? chalk.yellow('WARN') : chalk.red('FAIL');

    const tierBar = renderProgressBar(passRate, 30);

    console.log(`  ${icon} ${chalk.white(tierName.padEnd(15))} ${tierBar} ${chalk.white(passRate.toString().padStart(3))}% ${tierStatus}`);
    console.log(`     ${chalk.gray(`${tier.passed}/${tier.total} passed, ${tier.failed} failed, ${tier.skipped} skipped`)}`);
  }

  console.log(chalk.gray('\n─'.repeat(70)));
  console.log(`  ${chalk.gray('Generated:')} ${results.generatedAt}`);
  console.log();
}

function renderTestStatus(results: TestResults) {
  const statusColor = results.status === 'excellent' ? chalk.green :
                      results.status === 'good' ? chalk.cyan :
                      results.status === 'warning' ? chalk.yellow : chalk.red;

  console.log(chalk.cyan('\n🧪 Test Health Dashboard\n'));
  console.log(chalk.gray('─'.repeat(70)));

  console.log(`  ${chalk.white('Health Score:')} ${statusColor(results.healthScore + '%')} ${chalk.gray(`(${results.status})`)}`);
  console.log(`  ${chalk.white('Total Tests:')}  ${results.totalTests}`);
  console.log(`  ${chalk.white('Last Run:')}     ${chalk.gray(results.generatedAt)}`);

  console.log(chalk.gray('\n─ Tier Breakdown ─'.padEnd(70, '─')));

  const tierInfo: Record<string, { icon: string; description: string }> = {
    spine: { icon: '🌀', description: 'DX Spine smoke tests' },
    unit: { icon: '🔬', description: 'Unit tests (.NET + JS)' },
    integration: { icon: '🔗', description: 'Integration tests' },
    e2e: { icon: '🎭', description: 'End-to-end tests' },
    compliance: { icon: '📋', description: 'Compliance tests' },
  };

  for (const [tierName, tier] of Object.entries(results.tiers)) {
    const info = tierInfo[tierName] || { icon: '🧪', description: tierName };
    const passRate = tier.total > 0 ? Math.round((tier.passed / tier.total) * 100) : 0;
    const tierColor = passRate >= 90 ? chalk.green : passRate >= 75 ? chalk.yellow : chalk.red;
    const tierBar = renderProgressBar(passRate, 30);

    console.log(`  ${info.icon} ${chalk.white(tierName.padEnd(15))} ${tierBar} ${tierColor(passRate.toString().padStart(3) + '%')}`);
    console.log(`     ${chalk.gray(info.description)} ${chalk.gray(`- ${tier.total} tests`)}`);
  }

  console.log(chalk.gray('\n─'.repeat(70)));
  console.log();
}

function renderCoverage(coverage: CoverageData) {
  const lineColor = coverage.line >= 97 ? chalk.green :
                    coverage.line >= 85 ? chalk.yellow : chalk.red;

  console.log(chalk.cyan('\n📊 Code Coverage Summary\n'));
  console.log(chalk.gray('─'.repeat(70)));

  const meetsTarget = coverage.meetsThreshold ? chalk.green('✅ MEETS TARGET') : chalk.red('❌ BELOW TARGET');
  console.log(`  ${chalk.white('Target:')}      ${coverage.target}%`);
  console.log(`  ${chalk.white('Status:')}      ${meetsTarget}`);

  console.log(chalk.gray('\n─ Coverage Metrics ─'.padEnd(70, '─')));

  const metrics = [
    { name: 'Line Coverage', value: coverage.line },
    { name: 'Branch Coverage', value: coverage.branch },
    { name: 'Function Coverage', value: coverage.function },
    { name: 'Statement Coverage', value: coverage.statement },
  ];

  for (const metric of metrics) {
    const color = metric.value >= 97 ? chalk.green :
                  metric.value >= 85 ? chalk.yellow : chalk.red;
    const bar = renderProgressBar(metric.value, 40);
    console.log(`  ${chalk.white(metric.name.padEnd(20))} ${bar} ${color(metric.value.toFixed(1) + '%')}`);
  }

  console.log(chalk.gray('\n─'.repeat(70)));
  console.log();
}

function renderProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const color = percentage >= 90 ? chalk.green :
                percentage >= 75 ? chalk.cyan :
                percentage >= 50 ? chalk.yellow : chalk.red;

  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
}
