/**
 * TDC Launch Backend Command
 * Launch TerraFusion backend services (.NET)
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import ora from 'ora';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LaunchOptions {
  mode?: 'api' | 'consciousness' | 'both';
  degraded?: boolean;
}

export async function launchBackend(options: LaunchOptions = {}): Promise<void> {
  const mode = options.mode || 'both';
  const degraded = options.degraded || false;

  console.log(chalk.bold('🚀 Launching TerraFusion Backend\n'));

  if (degraded) {
    console.log(chalk.yellow('⚠️  Degraded mode: skipping health checks\n'));
  }

  const backendPath = '/workspaces/terrafusion_os_1.0/backend';

  if (mode === 'api' || mode === 'both') {
    const apiSpinner = ora('Starting TerraFusion API (port 5000)...').start();

    try {
      const env = degraded ? { TF_SKIP_DB_HEALTH: 'true' } : {};

      // Start API in background
      exec(`dotnet run --no-build --project TerraFusion.API --urls "http://localhost:5000"`, {
        cwd: backendPath,
        env: { ...process.env, ...env },
      });

      apiSpinner.succeed('TerraFusion API starting...');
    } catch (error) {
      apiSpinner.fail('Failed to start API');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  if (mode === 'consciousness' || mode === 'both') {
    const consciousnessSpinner = ora('Starting Consciousness Engine (port 3004)...').start();

    try {
      const env = degraded ? { TF_SKIP_DB_HEALTH: 'true' } : {};

      // Start Consciousness in background
      exec(
        `dotnet run --no-build --project TerraFusion.Consciousness --urls "http://localhost:3004"`,
        {
          cwd: backendPath,
          env: { ...process.env, ...env },
        }
      );

      consciousnessSpinner.succeed('Consciousness Engine starting...');
    } catch (error) {
      consciousnessSpinner.fail('Failed to start Consciousness Engine');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  console.log(chalk.bold('\n✨ Backend services launching!\n'));
  console.log(chalk.gray('Run'), chalk.cyan('tdc status'), chalk.gray('to check health\n'));
}
