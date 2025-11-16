import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import path from 'path';
import { HealthChecker } from '../lib/health-checker';
import { ProcessManager, ServiceConfig } from '../lib/process-manager';

const BACKEND_ROOT = path.join(process.cwd(), 'backend');

const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    name: 'api',
    command: 'dotnet',
    args: ['run', '--project', 'TerraFusion.API', '--urls', 'http://localhost:5000'],
    options: {
      cwd: BACKEND_ROOT,
      stdio: 'pipe',
    },
    healthCheckUrl: 'http://localhost:5000',
  },
  {
    name: 'consciousness',
    command: 'dotnet',
    args: ['run', '--project', 'TerraFusion.Consciousness', '--urls', 'http://localhost:3004'],
    options: {
      cwd: BACKEND_ROOT,
      stdio: 'pipe',
    },
    healthCheckUrl: 'http://localhost:3004',
  },
  {
    name: 'experiments',
    command: 'dotnet',
    args: ['run', '--project', 'TerraFusion.Experiments', '--urls', 'http://localhost:5010'],
    options: {
      cwd: BACKEND_ROOT,
      stdio: 'pipe',
    },
    healthCheckUrl: 'http://localhost:5010',
  },
];

export const launchCommand = new Command('launch-backend')
  .alias('launch')
  .description('🚀 Launch TerraFusion backend services')
  .option('-d, --degraded', 'launch in degraded mode (skip health checks)')
  .option('-s, --service <name>', 'launch specific service only')
  .option('-v, --verbose', 'show service output')
  .action(async options => {
    const processManager = new ProcessManager();
    const healthChecker = new HealthChecker();

    // Configure degraded mode
    if (options.degraded) {
      for (const config of SERVICE_CONFIGS) {
        if (config.options) {
          config.options.env = {
            ...config.options.env,
            TF_SKIP_DB_HEALTH: 'true',
          };
        }
      }
    }

    // Filter services if specific service requested
    const servicesToLaunch = options.service
      ? SERVICE_CONFIGS.filter(s => s.name === options.service)
      : SERVICE_CONFIGS;

    if (servicesToLaunch.length === 0) {
      console.error(chalk.red(`❌ Service '${options.service}' not found`));
      console.log(chalk.gray('Available services:'), SERVICE_CONFIGS.map(s => s.name).join(', '));
      process.exit(1);
    }

    console.log(chalk.cyan('🏛️ TerraFusion Backend Launch Sequence'));
    console.log(chalk.gray(`Services: ${servicesToLaunch.map(s => s.name).join(', ')}`));
    if (options.degraded) {
      console.log(chalk.yellow('⚠️  Degraded Mode: Skipping health checks'));
    }
    console.log('');

    // Launch services sequentially
    for (const config of servicesToLaunch) {
      const spinner = ora(`Starting ${config.name}...`).start();

      try {
        const childProcess = await processManager.startService(config);

        // Handle process output
        if (options.verbose) {
          processManager.on('stdout', (name, data) => {
            if (name === config.name) {
              console.log(chalk.gray(`[${name}]`), data.trim());
            }
          });

          processManager.on('stderr', (name, data) => {
            if (name === config.name) {
              console.log(chalk.red(`[${name}]`), data.trim());
            }
          });
        }

        processManager.on('error', (name, error) => {
          if (name === config.name) {
            spinner.fail(`Failed to start ${name}: ${error.message}`);
          }
        });

        processManager.on('exit', (name, code) => {
          if (name === config.name && code !== 0) {
            console.log(chalk.red(`❌ ${name} exited with code ${code}`));
          }
        });

        spinner.succeed(`${config.name} started (PID: ${childProcess.pid})`);

        // Wait for service to be healthy (unless in degraded mode)
        if (!options.degraded && config.healthCheckUrl) {
          const healthSpinner = ora(`Waiting for ${config.name} to be healthy...`).start();

          let healthy = false;
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds

          while (!healthy && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const health = await healthChecker.checkService(config.name, config.healthCheckUrl);
            healthy = health.status === 'healthy';
            attempts++;
          }

          if (healthy) {
            healthSpinner.succeed(`${config.name} is healthy`);
          } else {
            healthSpinner.warn(`${config.name} may not be fully ready`);
          }
        }
      } catch (error) {
        spinner.fail(`Failed to start ${config.name}`);
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    }

    console.log(chalk.green('\n✅ Backend services launched successfully'));
    console.log(chalk.gray('Use "tdc status" to check service health'));
    console.log(chalk.gray('Use Ctrl+C to stop all services'));

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down services...'));
      await processManager.stopAllServices();
      console.log(chalk.gray('All services stopped'));
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {}); // Infinite wait
  });
