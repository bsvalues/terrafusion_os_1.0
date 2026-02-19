import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import type {
  TokenAuditScope,
  UiTokenBaseline,
  UiTokenComplianceContract,
} from '../contracts/ui-token-compliance.contract';
import { printTokenReport } from '../ui/printTokenReport';
import { computeScopeHash, runTokenAudit } from '../ui/tokenAudit';

// ── Config loader ────────────────────────────────────────────────

interface TdcConfig {
  ui?: {
    tokens?: {
      include?: string[];
      exclude?: string[];
    };
  };
}

function loadTdcConfig(root: string): TdcConfig | null {
  const p = path.resolve(root, 'tdc.config.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// ── Baseline ratchet ─────────────────────────────────────────────

function handleBaseline(
  root: string,
  baselineFile: string,
  contract: UiTokenComplianceContract,
  scope?: TokenAuditScope
): number {
  const baselinePath = path.resolve(root, baselineFile);
  const scopeHash = computeScopeHash(scope);

  let existing: UiTokenBaseline | null = null;
  try {
    existing = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  } catch {
    /* first run */
  }

  let exitCode = 0;

  if (existing && existing.scopeHash === scopeHash) {
    if (contract.violationCount > existing.violationCount) {
      console.error(
        chalk.red(
          `\nRatchet FAILED: ${contract.violationCount} violations > baseline ${existing.violationCount}`
        )
      );
      return 1; // don't update baseline on regression
    }

    const delta = existing.violationCount - contract.violationCount;
    if (delta > 0) {
      console.log(
        chalk.green(
          `\nRatchet OK: ${contract.violationCount} <= baseline ${existing.violationCount} (improved by ${delta})`
        )
      );
    } else {
      console.log(
        chalk.green(
          `\nRatchet OK: ${contract.violationCount} = baseline ${existing.violationCount}`
        )
      );
    }
  } else if (existing) {
    console.log(
      chalk.yellow(
        `\nScope changed — re-baselining at ${contract.violationCount} violations.`
      )
    );
  } else {
    console.log(
      chalk.cyan(`\nNo baseline found — creating at ${contract.violationCount} violations.`)
    );
  }

  // Write/update baseline (only reaches here on non-regression)
  const baseline: UiTokenBaseline = {
    contract: 'ui-token-baseline.json',
    version: 'v1',
    scopeHash,
    violationCount: contract.violationCount,
    generatedAtIso: new Date().toISOString(),
  };
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');

  return exitCode;
}

// ── CLI command ──────────────────────────────────────────────────

const auditCommand = new Command('audit')
  .description('Run UI audits and emit contract JSON')
  .option('--tokens', 'Audit for token compliance (no raw colors)')
  .option('--out <file>', 'Output contract file', 'ui-token-compliance.contract.json')
  .option('--root <dir>', 'Repo root directory', process.cwd())
  .option('--all', 'Bypass tdc.config.json and scan entire repo')
  .option('--baseline <file>', 'Ratchet baseline file (fail only if violations increase)')
  .action(
    async (opts: {
      tokens?: boolean;
      out: string;
      root: string;
      all?: boolean;
      baseline?: string;
    }) => {
      if (!opts.tokens) {
        console.error(chalk.red('No audit selected. Try: tdc ui audit --tokens'));
        process.exitCode = 2;
        return;
      }

      const spinner = ora('Scanning for token compliance violations...').start();

      try {
        // 1. Determine scope
        let scope: TokenAuditScope | undefined;
        if (!opts.all) {
          const cfg = loadTdcConfig(opts.root);
          if (cfg?.ui?.tokens?.include?.length) {
            scope = {
              include: cfg.ui.tokens.include,
              exclude: cfg.ui.tokens.exclude,
            };
            spinner.text = `Scanning (scoped: ${scope.include!.length} include patterns)...`;
          }
        }

        // 2. Run audit
        const contract = runTokenAudit(opts.root, scope);
        const outPath = path.resolve(opts.root, opts.out);
        fs.writeFileSync(outPath, JSON.stringify(contract, null, 2), 'utf8');
        spinner.stop();

        // 3. Print report if violations exist
        if (!contract.ok) {
          console.error(printTokenReport(outPath));

          const shown = contract.violations.slice(0, 10);
          for (const v of shown) {
            console.error(
              chalk.gray(`  ${v.file}:${v.line}:${v.column}`) +
                chalk.yellow(` [${v.kind}]`) +
                chalk.white(` ${v.excerpt.slice(0, 80)}`)
            );
          }
          if (contract.violationCount > 10) {
            console.error(
              chalk.gray(`  ... and ${contract.violationCount - 10} more. See ${opts.out}`)
            );
          }
        }

        // 4. Determine exit code
        if (opts.baseline) {
          process.exitCode = handleBaseline(opts.root, opts.baseline, contract, scope);
          return;
        }

        // Non-ratchet: fail on any violations
        if (!contract.ok) {
          process.exitCode = 1;
          return;
        }

        console.log(
          chalk.green(
            `\nToken audit OK (${contract.scannedFileCount} files${scope ? ', scoped' : ''}). Contract written: ${opts.out}`
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
    }
  );

export const uiCommand = new Command('ui')
  .description('🎨 UI governance commands (Lumin design system enforcement)')
  .addCommand(auditCommand);
