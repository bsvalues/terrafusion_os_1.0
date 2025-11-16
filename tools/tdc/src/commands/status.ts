import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { HealthChecker } from '../lib/health-checker';

export const statusCommand = new Command('status')
  .alias('st')
  .description('🔍 Check TerraFusion OS system status')
  .option('-j, --json', 'output as JSON')
  .option('-v, --verbose', 'detailed health information')
  .action(async options => {
    const spinner = ora('Checking TerraFusion OS status...').start();

    try {
      const healthChecker = new HealthChecker();
      const services = await healthChecker.checkAllServices();

      spinner.stop();

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              services,
              overall: services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
            },
            null,
            2
          )
        );
        return;
      }

      // Visual status display
      console.log(chalk.cyan('\n🏛️ TerraFusion OS - System Status\n'));

      for (const service of services) {
        const icon = service.status === 'healthy' ? '✅' : '❌';
        const color = service.status === 'healthy' ? chalk.green : chalk.red;
        const responseInfo = service.responseTime ? chalk.gray(` (${service.responseTime}ms)`) : '';

        console.log(`${icon} ${color(service.name.toUpperCase())}${responseInfo}`);

        if (options.verbose) {
          console.log(chalk.gray(`   URL: ${service.url}`));
          if (service.error) {
            console.log(chalk.red(`   Error: ${service.error}`));
          }
        }
      }

      const healthyCount = services.filter(s => s.status === 'healthy').length;
      const overallStatus = healthyCount === services.length ? 'OPERATIONAL' : 'DEGRADED';
      const statusColor = healthyCount === services.length ? chalk.green : chalk.yellow;

      console.log(
        `\n${statusColor('Overall Status:')} ${statusColor(overallStatus)} (${healthyCount}/${services.length} services healthy)`
      );

      if (healthyCount < services.length) {
        console.log(chalk.yellow('\n💡 To start missing services: tdc launch-backend'));
      }
    } catch (error) {
      spinner.fail('Failed to check system status');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
