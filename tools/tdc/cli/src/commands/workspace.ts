/**
 * TDC Workspace Commands
 * Manage VS Code workspace contexts
 */

import chalk from 'chalk';
import { readdir } from 'fs/promises';
import ora from 'ora';

const WORKSPACES_DIR = '/workspaces/terrafusion_os_1.0/workspaces';

export async function listWorkspaces(): Promise<void> {
  const spinner = ora('Loading workspaces...').start();

  try {
    const files = await readdir(WORKSPACES_DIR);
    const workspaceFiles = files.filter(f => f.endsWith('.code-workspace'));

    spinner.stop();

    console.log(chalk.bold('\n📁 Available Workspaces\n'));

    for (const file of workspaceFiles.sort()) {
      const name = file.replace('.code-workspace', '');
      console.log(`  ${chalk.cyan('○')} ${name}`);
    }

    console.log(chalk.gray(`\nTotal: ${workspaceFiles.length} workspaces\n`));
  } catch (error) {
    spinner.fail('Failed to list workspaces');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

export async function showWorkspaceContext(): Promise<void> {
  console.log(chalk.bold('\n🎯 Current Workspace Context\n'));

  const cwd = process.cwd();
  console.log(`${chalk.cyan('Working Directory:')} ${cwd}`);

  // Determine which workspace we're in based on path
  if (cwd.includes('/backend')) {
    console.log(`${chalk.cyan('Workspace:')} Backend (.NET Microservices)`);
  } else if (cwd.includes('/frontend')) {
    console.log(`${chalk.cyan('Workspace:')} Frontend (React 18 PWA)`);
  } else if (cwd.includes('/tools/tdc')) {
    console.log(`${chalk.cyan('Workspace:')} TDC (Developer Console)`);
  } else if (cwd.includes('/tools/command-portal')) {
    console.log(`${chalk.cyan('Workspace:')} Portal (Command Portal UI)`);
  } else {
    console.log(`${chalk.cyan('Workspace:')} Root (TerraFusion OS)`);
  }

  console.log();
}
