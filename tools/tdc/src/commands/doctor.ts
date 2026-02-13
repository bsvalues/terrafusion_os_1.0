import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const REPO_ROOT = resolve(__dirname, '../../../..');

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'skip';
  message: string;
  details?: string;
}

export const doctorCommand = new Command('doctor')
  .alias('dr')
  .description('🩺 Comprehensive workspace health check')
  .option('-j, --json', 'output as JSON')
  .option('-v, --verbose', 'show detailed check information')
  .option('--fix', 'attempt to auto-fix issues')
  .action(async (options) => {
    const spinner = ora('Running workspace health checks...').start();
    const results: CheckResult[] = [];

    try {
      // 1. Git health
      spinner.text = 'Checking git status...';
      try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
        const dirty = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
        results.push({
          name: 'Git Repository',
          status: 'pass',
          message: `Branch: ${branch}${dirty ? ` (${dirty.split('\n').length} uncommitted)` : ' (clean)'}`,
        });
      } catch {
        results.push({ name: 'Git Repository', status: 'fail', message: 'Not a git repository' });
      }

      // 2. Node.js
      spinner.text = 'Checking Node.js...';
      try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        const major = parseInt(nodeVersion.replace('v', ''));
        results.push({
          name: 'Node.js',
          status: major >= 20 ? 'pass' : 'warn',
          message: `${nodeVersion}${major < 20 ? ' (v20+ recommended)' : ''}`,
        });
      } catch {
        results.push({ name: 'Node.js', status: 'fail', message: 'Not installed' });
      }

      // 3. pnpm
      spinner.text = 'Checking pnpm...';
      try {
        const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
        results.push({ name: 'pnpm', status: 'pass', message: `v${pnpmVersion}` });
      } catch {
        results.push({ name: 'pnpm', status: 'warn', message: 'Not installed (npm available as fallback)' });
      }

      // 4. Context Pack
      spinner.text = 'Checking Context Pack...';
      const contextPath = join(REPO_ROOT, '.terrafusion', 'context', 'latest.json');
      if (existsSync(contextPath)) {
        try {
          const context = JSON.parse(await readFile(contextPath, 'utf8'));
          const age = Date.now() - new Date(context.generated).getTime();
          const ageHours = Math.round(age / (1000 * 60 * 60));
          results.push({
            name: 'Context Pack',
            status: ageHours < 24 ? 'pass' : 'warn',
            message: `v${context.version} | Generated ${ageHours}h ago | Health: ${context.health?.overallHealth || 'unknown'}`,
          });
        } catch {
          results.push({ name: 'Context Pack', status: 'warn', message: 'Exists but unreadable' });
        }
      } else {
        results.push({ name: 'Context Pack', status: 'warn', message: 'Not generated yet. Run: tdc context regenerate' });
      }

      // 5. Skills Registry
      spinner.text = 'Checking Skills Registry...';
      const registryPath = join(REPO_ROOT, 'tools', 'dx', 'skills', 'registry.json');
      if (existsSync(registryPath)) {
        try {
          const registry = JSON.parse(await readFile(registryPath, 'utf8'));
          const total = registry.skills.length;
          const active = registry.skills.filter((s: any) => s.status === 'active').length;

          // Validate each skill has required files
          let missing = 0;
          for (const skill of registry.skills) {
            const skillMd = join(REPO_ROOT, skill.path, 'SKILL.md');
            const contract = join(REPO_ROOT, skill.contract);
            if (!existsSync(skillMd) || !existsSync(contract)) missing++;
          }

          results.push({
            name: 'Skills Registry',
            status: missing === 0 ? 'pass' : 'warn',
            message: `${active}/${total} active${missing > 0 ? ` | ${missing} missing files` : ''}`,
          });
        } catch {
          results.push({ name: 'Skills Registry', status: 'warn', message: 'Exists but malformed' });
        }
      } else {
        results.push({ name: 'Skills Registry', status: 'fail', message: 'Not found' });
      }

      // 6. Command Contracts
      spinner.text = 'Checking Command Contracts...';
      const contractsDir = join(REPO_ROOT, 'tools', 'dx', 'command-contracts');
      if (existsSync(contractsDir)) {
        try {
          const { readdirSync } = await import('node:fs');
          const contracts = readdirSync(contractsDir).filter((f: string) => f.endsWith('.contract.json'));
          results.push({
            name: 'Command Contracts',
            status: 'pass',
            message: `${contracts.length} contracts registered`,
          });
        } catch {
          results.push({ name: 'Command Contracts', status: 'warn', message: 'Directory exists but unreadable' });
        }
      } else {
        results.push({ name: 'Command Contracts', status: 'fail', message: 'Not found' });
      }

      // 7. Evidence Pack
      spinner.text = 'Checking Evidence Pack...';
      const evidencePath = join(REPO_ROOT, '.terrafusion', 'evidence', 'latest-receipt.json');
      if (existsSync(evidencePath)) {
        try {
          const receipt = JSON.parse(await readFile(evidencePath, 'utf8'));
          results.push({
            name: 'Evidence Pack',
            status: receipt.verdict === 'pass' ? 'pass' : 'warn',
            message: `Verdict: ${receipt.verdict} | CID: ${receipt.cid?.slice(0, 20)}...`,
          });
        } catch {
          results.push({ name: 'Evidence Pack', status: 'warn', message: 'Receipt unreadable' });
        }
      } else {
        results.push({ name: 'Evidence Pack', status: 'skip', message: 'Not built yet. Run: tdc evidence build' });
      }

      // 8. Schemas
      spinner.text = 'Checking JSON Schemas...';
      const schemasDir = join(REPO_ROOT, 'tools', 'dx', 'schemas');
      if (existsSync(schemasDir)) {
        const { readdirSync } = await import('node:fs');
        const schemas = readdirSync(schemasDir).filter((f: string) => f.endsWith('.json'));
        results.push({ name: 'JSON Schemas', status: 'pass', message: `${schemas.length} schemas available` });
      } else {
        results.push({ name: 'JSON Schemas', status: 'warn', message: 'Not found' });
      }

      // 9. Audit Log
      spinner.text = 'Checking Audit Log...';
      const auditPath = join(REPO_ROOT, '.terrafusion', 'audit.log');
      if (existsSync(auditPath)) {
        const { statSync } = await import('node:fs');
        const stats = statSync(auditPath);
        const sizeKB = Math.round(stats.size / 1024);
        results.push({ name: 'Audit Log', status: 'pass', message: `${sizeKB}KB | Immutable JSONL` });
      } else {
        results.push({ name: 'Audit Log', status: 'warn', message: 'Not initialized' });
      }

      // 10. DX Hooks
      spinner.text = 'Checking DX Hooks...';
      const hookPath = join(REPO_ROOT, '.git', 'hooks', 'pre-commit');
      const hookSrc = join(REPO_ROOT, 'tools', 'dx', 'hooks', 'pre-commit-context-pack.sh');
      if (existsSync(hookSrc)) {
        if (existsSync(hookPath)) {
          results.push({ name: 'Pre-Commit Hook', status: 'pass', message: 'Installed' });
        } else {
          results.push({
            name: 'Pre-Commit Hook',
            status: 'warn',
            message: 'Available but not installed. Run: cp tools/dx/hooks/pre-commit-context-pack.sh .git/hooks/pre-commit',
          });

          if (options.fix) {
            try {
              const { copyFileSync, chmodSync } = await import('node:fs');
              copyFileSync(hookSrc, hookPath);
              chmodSync(hookPath, '755');
              results[results.length - 1] = { name: 'Pre-Commit Hook', status: 'pass', message: 'Auto-installed by --fix' };
            } catch {
              // non-fatal
            }
          }
        }
      } else {
        results.push({ name: 'Pre-Commit Hook', status: 'skip', message: 'Hook source not found' });
      }

      spinner.stop();

      // Output
      if (options.json) {
        const passes = results.filter(r => r.status === 'pass').length;
        const warns = results.filter(r => r.status === 'warn').length;
        const fails = results.filter(r => r.status === 'fail').length;
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          results,
          summary: { total: results.length, pass: passes, warn: warns, fail: fails },
          healthy: fails === 0,
        }, null, 2));
        return;
      }

      // Human-readable output
      console.log(chalk.cyan('\n🩺 TerraFusion Workspace Doctor\n'));
      console.log(chalk.gray('─'.repeat(65)));

      for (const result of results) {
        let icon: string;
        let color: (s: string) => string;
        switch (result.status) {
          case 'pass': icon = '✅'; color = chalk.green; break;
          case 'warn': icon = '⚠️ '; color = chalk.yellow; break;
          case 'fail': icon = '❌'; color = chalk.red; break;
          case 'skip': icon = '⏭️ '; color = chalk.gray; break;
          default: icon = '?'; color = chalk.gray;
        }
        console.log(`  ${icon} ${chalk.white(result.name.padEnd(20))} ${color(result.message)}`);
      }

      const passes = results.filter(r => r.status === 'pass').length;
      const warns = results.filter(r => r.status === 'warn').length;
      const fails = results.filter(r => r.status === 'fail').length;

      console.log(chalk.gray('\n─'.repeat(65)));
      console.log(`  ${chalk.green(`${passes} pass`)} | ${chalk.yellow(`${warns} warn`)} | ${chalk.red(`${fails} fail`)} | ${results.length} total`);

      if (fails === 0 && warns === 0) {
        console.log(chalk.green('\n  🏛️ Workspace is healthy. Ready to govern.\n'));
      } else if (fails === 0) {
        console.log(chalk.yellow('\n  ⚠️  Workspace operational with warnings.\n'));
      } else {
        console.log(chalk.red('\n  ❌ Workspace has issues that need attention.\n'));
      }

    } catch (error) {
      spinner.fail('Doctor check failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
