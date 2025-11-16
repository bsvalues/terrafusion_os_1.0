/**
 * TDC Debug Command
 * Show debug information for troubleshooting
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import ora from 'ora';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function debugInfo(): Promise<void> {
  const spinner = ora('Collecting debug information...').start();

  try {
    console.log(chalk.bold('\n🔍 TerraFusion Debug Information\n'));

    // Node version
    const nodeVersion = process.version;
    console.log(`${chalk.cyan('Node Version:')} ${nodeVersion}`);

    // npm version
    const { stdout: npmVersion } = await execAsync('npm --version');
    console.log(`${chalk.cyan('npm Version:')} ${npmVersion.trim()}`);

    // .NET version
    try {
      const { stdout: dotnetVersion } = await execAsync('dotnet --version');
      console.log(`${chalk.cyan('.NET Version:')} ${dotnetVersion.trim()}`);
    } catch {
      console.log(`${chalk.cyan('.NET Version:')} ${chalk.red('Not installed')}`);
    }

    // Docker version
    try {
      const { stdout: dockerVersion } = await execAsync('docker --version');
      console.log(`${chalk.cyan('Docker Version:')} ${dockerVersion.trim()}`);
    } catch {
      console.log(`${chalk.cyan('Docker Version:')} ${chalk.red('Not installed')}`);
    }

    // Working directory
    console.log(`${chalk.cyan('Working Directory:')} ${process.cwd()}`);

    // Environment
    const env = process.env.NODE_ENV || 'development';
    console.log(`${chalk.cyan('Environment:')} ${env}`);

    spinner.stop();
    console.log();
  } catch (error) {
    spinner.fail('Failed to collect debug information');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
