import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { runTokenAudit } from '../ui/tokenAudit';

const auditCommand = new Command('audit')
  .description('Run UI audits and emit contract JSON')
  .option('--tokens', 'Audit for token compliance (no raw colors)')
  .option('--out <file>', 'Output contract file', 'ui-token-compliance.contract.json')
  .option('--root <dir>', 'Repo root directory', process.cwd())
  .action(async (opts: { tokens?: boolean; out: string; root: string }) => {
    if (!opts.tokens) {
      console.error(chalk.red('No audit selected. Try: tdc ui audit --tokens'));
      process.exitCode = 2;
      return;
    }

    const spinner = ora('Scanning for token compliance violations...').start();

    try {
      const contract = runTokenAudit(opts.root);
      const outPath = path.resolve(opts.root, opts.out);
      fs.writeFileSync(outPath, JSON.stringify(contract, null, 2), 'utf8');

      spinner.stop();

      if (!contract.ok) {
        console.error(
          chalk.red(
            `\nToken audit FAILED: ${contract.violationCount} violations (contract: ${opts.out}).`
          )
        );

        // Show first 10 violations
        const shown = contract.violations.slice(0, 10);
        for (const v of shown) {
          console.error(
            chalk.gray(`  ${v.file}:${v.line}:${v.column}`) +
              chalk.yellow(` [${v.kind}]`) +
              chalk.white(` ${v.excerpt.slice(0, 80)}`)
          );
        }
        if (contract.violationCount > 10) {
          console.error(chalk.gray(`  ... and ${contract.violationCount - 10} more. See ${opts.out}`));
        }

        process.exitCode = 1;
        return;
      }

      console.log(
        chalk.green(
          `\nToken audit OK (${contract.scannedFileCount} files). Contract written: ${opts.out}`
        )
      );
    } catch (error) {
      spinner.fail('Token audit failed');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exitCode = 1;
    }
  });

export const uiCommand = new Command('ui')
  .description('🎨 UI governance commands (Lumin design system enforcement)')
  .addCommand(auditCommand);
