/**
 * TDC Portal Commands
 * Manage TerraFusion Command Portal (Rust IDE backend + React UI)
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import fetch from 'node-fetch';
import ora from 'ora';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PortalStatus {
  frontend: {
    url: string;
    healthy: boolean;
    responseTime?: number;
  };
  backend: {
    url: string;
    healthy: boolean;
    responseTime?: number;
    version?: string;
  };
}

/**
 * Check Portal health status
 */
export async function statusPortal(): Promise<void> {
  const spinner = ora('Checking Portal status...').start();

  try {
    const status = await getPortalStatus();
    spinner.stop();

    console.log(chalk.bold('\n🎨 TerraFusion Command Portal Status\n'));

    // Frontend status
    const frontendIcon = status.frontend.healthy ? '✅' : '❌';
    console.log(
      `${frontendIcon} Frontend: ${status.frontend.url} ${
        status.frontend.responseTime ? chalk.gray(`(${status.frontend.responseTime}ms)`) : ''
      }`
    );

    // Backend status
    const backendIcon = status.backend.healthy ? '✅' : '❌';
    console.log(
      `${backendIcon} Backend:  ${status.backend.url} ${
        status.backend.responseTime ? chalk.gray(`(${status.backend.responseTime}ms)`) : ''
      }`
    );

    if (status.backend.version) {
      console.log(chalk.gray(`   Version: ${status.backend.version}`));
    }

    // Overall status
    const allHealthy = status.frontend.healthy && status.backend.healthy;
    console.log(
      `\n${allHealthy ? chalk.green('● Portal is healthy') : chalk.red('● Portal has issues')}\n`
    );

    if (!allHealthy) {
      console.log(
        chalk.yellow('💡 Tip: Run'),
        chalk.cyan('tdc portal:launch'),
        chalk.yellow('to start the Portal')
      );
    }
  } catch (error) {
    spinner.fail('Failed to check Portal status');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Launch Portal full-stack environment
 */
export async function launchPortal(): Promise<void> {
  console.log(chalk.bold('🚀 Launching TerraFusion Command Portal\n'));

  const spinner = ora('Starting Portal services...').start();

  try {
    const portalPath = '/workspaces/terrafusion_os_1.0/tools/command-portal';

    // Check if portal directory exists
    try {
      await execAsync(`test -d ${portalPath}`);
    } catch {
      spinner.fail('Portal directory not found');
      console.error(chalk.red(`\nError: Portal not found at ${portalPath}`));
      console.log(chalk.yellow('\n💡 The Command Portal may need to be set up first.'));
      process.exit(1);
    }

    spinner.text = 'Launching Portal stack...';

    // Launch using docker-compose or start script
    await execAsync(`cd ${portalPath} && docker-compose -f docker-compose.full-stack.yml up -d`, {
      cwd: portalPath,
    });

    spinner.succeed('Portal services started');

    // Wait for services to be ready
    const waitSpinner = ora('Waiting for services to be ready...').start();
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const status = await getPortalStatus();
      if (status.frontend.healthy && status.backend.healthy) {
        waitSpinner.succeed('All services ready');
        break;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (attempts >= maxAttempts) {
      waitSpinner.fail('Services did not become ready in time');
      console.log(
        chalk.yellow('\n💡 Run'),
        chalk.cyan('tdc portal:status'),
        chalk.yellow('to check detailed status')
      );
    }

    console.log(chalk.bold('\n✨ Portal is running!\n'));
    console.log(`${chalk.cyan('Frontend:')} http://localhost:5173`);
    console.log(`${chalk.cyan('Backend:')}  http://localhost:8787`);
    console.log(chalk.gray('\nRun'), chalk.white('tdc portal:logs'), chalk.gray('to view logs'));
  } catch (error) {
    spinner.fail('Failed to launch Portal');
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Show Portal logs
 */
export async function logsPortal(options: { follow?: boolean } = {}): Promise<void> {
  console.log(chalk.bold('📋 Portal Logs\n'));

  try {
    const portalPath = '/workspaces/terrafusion_os_1.0/tools/command-portal';
    const followFlag = options.follow ? '-f' : '';

    // Stream logs from docker-compose
    const { stdout } = await execAsync(
      `cd ${portalPath} && docker-compose -f docker-compose.full-stack.yml logs ${followFlag}`,
      { cwd: portalPath }
    );

    console.log(stdout);
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Stop Portal services
 */
export async function stopPortal(): Promise<void> {
  const spinner = ora('Stopping Portal services...').start();

  try {
    const portalPath = '/workspaces/terrafusion_os_1.0/tools/command-portal';

    await execAsync(`cd ${portalPath} && docker-compose -f docker-compose.full-stack.yml down`, {
      cwd: portalPath,
    });

    spinner.succeed('Portal services stopped');
  } catch (error) {
    spinner.fail('Failed to stop Portal');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Get Portal status (internal helper)
 */
async function getPortalStatus(): Promise<PortalStatus> {
  const frontendUrl = 'http://localhost:5173';
  const backendUrl = 'http://localhost:8787';

  const status: PortalStatus = {
    frontend: { url: frontendUrl, healthy: false },
    backend: { url: backendUrl, healthy: false },
  };

  // Check frontend
  try {
    const start = Date.now();
    const response = await fetch(frontendUrl, { timeout: 2000 });
    status.frontend.healthy = response.ok;
    status.frontend.responseTime = Date.now() - start;
  } catch {
    // Frontend not available
  }

  // Check backend
  try {
    const start = Date.now();
    const response = await fetch(`${backendUrl}/api/health`, { timeout: 2000 });
    status.backend.healthy = response.ok;
    status.backend.responseTime = Date.now() - start;

    if (response.ok) {
      const data = (await response.json()) as { version?: string };
      status.backend.version = data.version;
    }
  } catch {
    // Backend not available
  }

  return status;
}
