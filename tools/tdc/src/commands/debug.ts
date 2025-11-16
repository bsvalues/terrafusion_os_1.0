import chalk from 'chalk';
import { spawn } from 'child_process';
import { Command } from 'commander';
import ora from 'ora';
import path from 'path';

export const debugCommand = new Command('debug')
  .description('🔧 TerraFusion debugging utilities')
  .addCommand(
    new Command('health-check')
      .alias('hc')
      .description('run legacy health check script')
      .action(async () => {
        const spinner = ora('Running health check...').start();

        try {
          const scriptPath = path.join(process.cwd(), 'scripts', 'health-check.sh');

          const childProcess = spawn('bash', [scriptPath], {
            stdio: 'pipe',
            cwd: process.cwd(),
          });

          let output = '';
          let errorOutput = '';

          childProcess.stdout?.on('data', (data: Buffer) => {
            output += data.toString();
          });

          childProcess.stderr?.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });

          await new Promise((resolve, reject) => {
            childProcess.on('close', (code: number | null) => {
              if (code === 0) {
                resolve(code);
              } else {
                reject(new Error(`Health check failed with code ${code}`));
              }
            });
          });

          spinner.succeed('Health check completed');

          if (output) {
            console.log('\n' + output);
          }
        } catch (error) {
          spinner.fail('Health check failed');
          console.error(
            chalk.red('Error:'),
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      })
  )
  .addCommand(
    new Command('workspace-doctor')
      .alias('wd')
      .description('run workspace diagnostics')
      .action(async () => {
        const spinner = ora('Running workspace diagnostics...').start();

        try {
          const scriptPath = path.join(process.cwd(), 'scripts', 'workspace-doctor.sh');

          const workspaceProcess = spawn('bash', [scriptPath], {
            stdio: 'inherit',
            cwd: process.cwd(),
          });

          await new Promise((resolve, reject) => {
            workspaceProcess.on('close', (code: number | null) => {
              if (code === 0) {
                resolve(code);
              } else {
                reject(new Error(`Workspace doctor failed with code ${code}`));
              }
            });
          });

          spinner.succeed('Workspace diagnostics completed');
        } catch (error) {
          spinner.fail('Workspace diagnostics failed');
          console.error(
            chalk.red('Error:'),
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      })
  );
