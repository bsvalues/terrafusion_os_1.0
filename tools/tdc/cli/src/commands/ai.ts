/**
 * TDC AI Commands
 * Monitor and trace AI agent activity via Transparency Engine
 */

import type { AgentAction } from '@terrafusion/transparency-engine';
import { DefaultTransparencyBus } from '@terrafusion/transparency-engine';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';

interface TraceOptions {
  limit?: number;
  service?: string;
  workspace?: string;
  phase?: string;
  json?: boolean;
}

/**
 * Trace recent AI agent activity
 */
export async function traceAgents(options: TraceOptions = {}): Promise<void> {
  const spinner = ora('Fetching agent activity...').start();

  try {
    // Collect actions from the bus
    const actions: AgentAction[] = [];
    const unsubscribe = DefaultTransparencyBus.subscribe(action => {
      actions.push(action);
    });

    // Simulate collecting recent actions (in real impl, bus would have history)
    await new Promise(resolve => setTimeout(resolve, 100));
    unsubscribe();

    spinner.stop();

    if (actions.length === 0) {
      console.log(chalk.yellow('No recent agent activity detected.\n'));
      console.log(chalk.gray('💡 Tip: Agents publish activity when services are running.'));
      return;
    }

    // Apply filters
    let filtered = actions;

    if (options.service) {
      filtered = filtered.filter(a => a.service === options.service);
    }

    if (options.workspace) {
      filtered = filtered.filter(a => a.workspace === options.workspace);
    }

    if (options.phase) {
      filtered = filtered.filter(a => a.phase === options.phase);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    // Output format
    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    // Table format
    console.log(chalk.bold('\n🤖 AI Agent Activity Trace\n'));

    const table = new Table({
      head: [
        chalk.cyan('Time'),
        chalk.cyan('Agent'),
        chalk.cyan('Service'),
        chalk.cyan('Phase'),
        chalk.cyan('Summary'),
      ],
      colWidths: [12, 20, 15, 12, 50],
      wordWrap: true,
    });

    for (const action of filtered) {
      const time = new Date(action.timestamp).toLocaleTimeString();
      const phaseColor = getPhaseColor(action.phase);

      table.push([
        chalk.gray(time),
        action.agentRole,
        action.service,
        phaseColor(action.phase),
        action.summary,
      ]);
    }

    console.log(table.toString());
    console.log(chalk.gray(`\nTotal: ${filtered.length} actions\n`));
  } catch (error) {
    spinner.fail('Failed to trace agents');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Show live AI agent activity stream
 */
export async function activityStream(options: { json?: boolean } = {}): Promise<void> {
  console.log(chalk.bold('🔴 Live AI Agent Activity Stream\n'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  const unsubscribe = DefaultTransparencyBus.subscribe(action => {
    if (options.json) {
      console.log(JSON.stringify(action));
    } else {
      const time = new Date(action.timestamp).toLocaleTimeString();
      const phaseColor = getPhaseColor(action.phase);

      console.log(
        `${chalk.gray(time)} ${chalk.cyan(action.service.padEnd(15))} ${phaseColor(
          action.phase.padEnd(10)
        )} ${action.summary}`
      );
    }
  });

  // Keep process alive
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nStopping activity stream...'));
    unsubscribe();
    process.exit(0);
  });

  // Prevent exit
  await new Promise(() => {});
}

/**
 * Show agent activity statistics
 */
export async function agentStats(): Promise<void> {
  const spinner = ora('Calculating agent statistics...').start();

  try {
    // Collect actions
    const actions: AgentAction[] = [];
    const unsubscribe = DefaultTransparencyBus.subscribe(action => {
      actions.push(action);
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    unsubscribe();

    spinner.stop();

    if (actions.length === 0) {
      console.log(chalk.yellow('No agent activity to analyze.\n'));
      return;
    }

    console.log(chalk.bold('\n📊 Agent Activity Statistics\n'));

    // Group by service
    const byService: Record<string, number> = {};
    const byPhase: Record<string, number> = {};
    const byWorkspace: Record<string, number> = {};

    for (const action of actions) {
      byService[action.service] = (byService[action.service] || 0) + 1;
      byPhase[action.phase] = (byPhase[action.phase] || 0) + 1;
      byWorkspace[action.workspace] = (byWorkspace[action.workspace] || 0) + 1;
    }

    // Service breakdown
    console.log(chalk.cyan('By Service:'));
    const serviceTable = new Table({
      head: [chalk.cyan('Service'), chalk.cyan('Actions')],
      colWidths: [30, 10],
    });

    for (const [service, count] of Object.entries(byService).sort((a, b) => b[1] - a[1])) {
      serviceTable.push([service, count.toString()]);
    }
    console.log(serviceTable.toString());

    // Phase breakdown
    console.log(chalk.cyan('\nBy Phase:'));
    const phaseTable = new Table({
      head: [chalk.cyan('Phase'), chalk.cyan('Actions')],
      colWidths: [30, 10],
    });

    for (const [phase, count] of Object.entries(byPhase).sort((a, b) => b[1] - a[1])) {
      const phaseColor = getPhaseColor(phase as AgentAction['phase']);
      phaseTable.push([phaseColor(phase), count.toString()]);
    }
    console.log(phaseTable.toString());

    // Workspace breakdown
    console.log(chalk.cyan('\nBy Workspace:'));
    const workspaceTable = new Table({
      head: [chalk.cyan('Workspace'), chalk.cyan('Actions')],
      colWidths: [30, 10],
    });

    for (const [workspace, count] of Object.entries(byWorkspace).sort((a, b) => b[1] - a[1])) {
      workspaceTable.push([workspace, count.toString()]);
    }
    console.log(workspaceTable.toString());

    console.log(chalk.gray(`\nTotal Actions: ${actions.length}\n`));
  } catch (error) {
    spinner.fail('Failed to calculate statistics');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Get color for agent phase
 */
function getPhaseColor(phase: string): (text: string) => string {
  switch (phase) {
    case 'planning':
      return chalk.blue;
    case 'executing':
      return chalk.yellow;
    case 'waiting':
      return chalk.gray;
    case 'error':
      return chalk.red;
    case 'complete':
      return chalk.green;
    default:
      return chalk.white;
  }
}
