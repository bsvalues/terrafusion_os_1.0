import chalk from 'chalk';
import { spawn } from 'child_process';
import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';

const WORKSPACES = {
  master: 'Complete TerraFusion OS (all folders)',
  backend: '.NET 8 microservices development',
  frontend: 'React 18 + Quantum UI development',
  sdk: 'Module and plugin development',
  'terrabuild-modernization': 'Property assessment system',
  'government-edition': 'Government application suite',
  consciousness: 'AI agent swarm coordination',
  security: 'FISMA-High security focus',
};

export const workspaceCommand = new Command('workspace')
  .alias('ws')
  .description('🖥️  Manage VS Code workspaces')
  .option('-l, --list', 'list available workspaces')
  .option('-o, --open <name>', 'open specific workspace')
  .action(async options => {
    if (options.list) {
      console.log(chalk.cyan('\n🖥️  Available TerraFusion Workspaces:\n'));

      for (const [key, description] of Object.entries(WORKSPACES)) {
        console.log(`${chalk.yellow(key.padEnd(25))} ${chalk.gray(description)}`);
      }

      console.log(chalk.gray('\nUsage: tdc workspace --open <name>'));
      return;
    }

    if (options.open) {
      await openWorkspace(options.open);
      return;
    }

    // Interactive workspace selector
    const { workspace } = await inquirer.prompt([
      {
        type: 'list',
        name: 'workspace',
        message: 'Select workspace to open:',
        choices: Object.entries(WORKSPACES).map(([key, description]) => ({
          name: `${key} - ${description}`,
          value: key,
        })),
      },
    ]);

    await openWorkspace(workspace);
  });

async function openWorkspace(name: string): Promise<void> {
  if (!WORKSPACES[name as keyof typeof WORKSPACES]) {
    console.error(chalk.red(`❌ Workspace '${name}' not found`));
    console.log(chalk.gray('Available workspaces:'), Object.keys(WORKSPACES).join(', '));
    process.exit(1);
  }

  const workspacePath = path.join(process.cwd(), 'workspaces', `${name}.code-workspace`);

  console.log(chalk.cyan(`🖥️  Opening ${name} workspace...`));

  try {
    const vscode = spawn('code', [workspacePath], {
      stdio: 'inherit',
      detached: true,
    });

    vscode.on('error', error => {
      console.error(chalk.red('❌ Failed to open VS Code:'), error.message);
      console.log(chalk.gray('Make sure VS Code is installed and "code" command is in PATH'));
    });

    vscode.on('spawn', () => {
      console.log(chalk.green(`✅ ${name} workspace opened in VS Code`));
    });
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to open workspace:'),
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}
