import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../..');

interface CountyInfo {
  id: string;
  name: string;
  parcels: number;
  pacs: string;
  status: string;
}

const KNOWN_COUNTIES: CountyInfo[] = [
  { id: 'benton', name: 'Benton County', parcels: 89247, pacs: 'Harris 9.0', status: 'production' },
  { id: 'clark', name: 'Clark County', parcels: 180000, pacs: 'Tyler Vision', status: 'planned' },
  { id: 'spokane', name: 'Spokane County', parcels: 250000, pacs: 'Aumentum', status: 'planned' },
  { id: 'king', name: 'King County', parcels: 750000, pacs: 'Custom', status: 'planned' },
];

export const countyCommand = new Command('county')
  .alias('ct')
  .description('🏛️ County deployment management')
  .addCommand(
    new Command('status')
      .description('Show county deployment status')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        const spinner = ora('Checking county deployments...').start();

        try {
          // Check for county-specific configs
          const configDir = join(REPO_ROOT, 'backend', 'config', 'sdui');
          const counties = KNOWN_COUNTIES.map(c => ({
            ...c,
            hasConfig: existsSync(join(configDir, c.id)),
            hasAppsettings: existsSync(join(REPO_ROOT, 'backend', `appsettings.${c.name.split(' ')[0]}County.json`)),
          }));

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify({ counties, timestamp: new Date().toISOString() }, null, 2));
            return;
          }

          console.log(chalk.cyan('\n🏛️ TerraFusion County Deployments\n'));
          console.log(chalk.gray('─'.repeat(75)));
          console.log(`  ${chalk.white('County'.padEnd(18))} ${chalk.white('Parcels'.padStart(10))} ${chalk.white('PACS'.padEnd(16))} ${chalk.white('Status'.padEnd(12))} ${chalk.white('Config')}`);
          console.log(chalk.gray('─'.repeat(75)));

          for (const county of counties) {
            const statusColor = county.status === 'production' ? chalk.green :
                               county.status === 'configured' ? chalk.cyan :
                               chalk.gray;
            const configIcon = county.hasAppsettings ? chalk.green('✅') : chalk.gray('--');

            console.log(`  ${chalk.white(county.name.padEnd(18))} ${chalk.cyan(county.parcels.toLocaleString().padStart(10))} ${chalk.gray(county.pacs.padEnd(16))} ${statusColor(county.status.padEnd(12))} ${configIcon}`);
          }

          console.log(chalk.gray('\n─'.repeat(75)));
          const deployed = counties.filter(c => c.status === 'production').length;
          console.log(`  ${chalk.green(`${deployed} deployed`)} | ${counties.length - deployed} planned | ${counties.reduce((s, c) => s + c.parcels, 0).toLocaleString()} total parcels`);
          console.log();
        } catch (error) {
          spinner.fail('Failed to check county status');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('info')
      .description('Show detailed county information')
      .argument('<countyId>', 'county identifier')
      .option('-j, --json', 'output as JSON')
      .action(async (countyId: string, options) => {
        const county = KNOWN_COUNTIES.find(c => c.id === countyId);
        if (!county) {
          console.log(chalk.red(`County not found: ${countyId}`));
          console.log(chalk.gray('Available: ' + KNOWN_COUNTIES.map(c => c.id).join(', ')));
          process.exit(1);
        }

        const hasAppsettings = existsSync(join(REPO_ROOT, 'backend', `appsettings.${county.name.split(' ')[0]}County.json`));
        const hasData = existsSync(join(REPO_ROOT, 'backend', 'src', 'TerraFusion.Data'));

        if (options.json) {
          console.log(JSON.stringify({ county, hasAppsettings, hasData }, null, 2));
          return;
        }

        console.log(chalk.cyan(`\n🏛️ ${county.name}\n`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`  ${chalk.white('ID:')}       ${chalk.yellow(county.id)}`);
        console.log(`  ${chalk.white('Parcels:')}  ${chalk.cyan(county.parcels.toLocaleString())}`);
        console.log(`  ${chalk.white('PACS:')}     ${chalk.gray(county.pacs)}`);
        console.log(`  ${chalk.white('Status:')}   ${county.status === 'production' ? chalk.green(county.status) : chalk.gray(county.status)}`);
        console.log(`  ${chalk.white('Config:')}   ${hasAppsettings ? chalk.green('Present') : chalk.gray('Not configured')}`);
        console.log(`  ${chalk.white('Data:')}     ${hasData ? chalk.green('Data layer present') : chalk.gray('Not configured')}`);
        console.log();
      })
  );
