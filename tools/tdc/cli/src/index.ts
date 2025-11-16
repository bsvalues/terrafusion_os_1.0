#!/usr/bin/env node

/**
 * TerraFusion Developer Console (TDC)
 * Unified CLI for TerraFusion OS workspace orchestration
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { activityStream, agentStats, traceAgents } from './commands/ai';
import { debugInfo } from './commands/debug';
import { launchBackend } from './commands/launch-backend';
import { launchPortal, logsPortal, statusPortal, stopPortal } from './commands/portal';
import { statusCommand } from './commands/status';
import { listWorkspaces, showWorkspaceContext } from './commands/workspace';

const program = new Command();

program
  .name('tdc')
  .description('TerraFusion Developer Console - Unified OS workspace orchestration')
  .version('1.0.0');

// ============================================================================
// CORE COMMANDS
// ============================================================================

program
  .command('status')
  .description('Show status of all TerraFusion services')
  .action(statusCommand);

program
  .command('launch:backend')
  .description('Launch TerraFusion backend services')
  .option('--mode <mode>', 'Launch mode: api, consciousness, or both', 'both')
  .option('--degraded', 'Launch in degraded mode (skip health checks)')
  .action(launchBackend);

program
  .command('debug')
  .description('Show debug information for troubleshooting')
  .action(debugInfo);

// ============================================================================
// WORKSPACE COMMANDS
// ============================================================================

const workspace = program.command('ws').description('Workspace management commands');

workspace.command('list').description('List all available workspaces').action(listWorkspaces);

workspace
  .command('context')
  .description('Show current workspace context')
  .action(showWorkspaceContext);

// ============================================================================
// PORTAL COMMANDS
// ============================================================================

const portal = program.command('portal').description('Command Portal management');

portal.command('status').description('Check Command Portal health').action(statusPortal);

portal
  .command('launch')
  .description('Launch Command Portal full-stack environment')
  .action(launchPortal);

portal
  .command('logs')
  .description('Show Portal logs')
  .option('-f, --follow', 'Follow log output')
  .action(logsPortal);

portal.command('stop').description('Stop Portal services').action(stopPortal);

// ============================================================================
// AI/TRANSPARENCY COMMANDS
// ============================================================================

const ai = program.command('ai').description('AI agent monitoring and transparency');

ai.command('trace')
  .description('Trace recent AI agent activity')
  .option('-l, --limit <number>', 'Limit number of actions to show', '50')
  .option('-s, --service <service>', 'Filter by service')
  .option('-w, --workspace <workspace>', 'Filter by workspace')
  .option('-p, --phase <phase>', 'Filter by phase')
  .option('--json', 'Output as JSON')
  .action(options => {
    traceAgents({
      ...options,
      limit: options.limit ? parseInt(options.limit, 10) : undefined,
    });
  });

ai.command('activity')
  .description('Show live AI agent activity stream')
  .option('--json', 'Output as JSON')
  .action(activityStream);

ai.command('stats').description('Show AI agent activity statistics').action(agentStats);

// ============================================================================
// ERROR HANDLING & EXECUTION
// ============================================================================

program.on('command:*', () => {
  console.error(chalk.red(`\nError: Invalid command '${program.args.join(' ')}'`));
  console.log(
    chalk.yellow('\nRun'),
    chalk.cyan('tdc --help'),
    chalk.yellow('to see available commands.\n')
  );
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
