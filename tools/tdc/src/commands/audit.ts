import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../..');
const AUDIT_LOG = join(REPO_ROOT, '.terrafusion', 'audit.log');

interface AuditEntry {
  auditId: string;
  timestamp: string;
  event: string;
  actor: string;
  serverId?: string;
  scope?: string;
  riskLevel?: string;
  approvalArtifact?: string;
  [key: string]: unknown;
}

export const auditCommand = new Command('audit')
  .alias('au')
  .description('📋 Browse and query the governance audit trail')
  .addCommand(
    new Command('tail')
      .description('Show the most recent audit entries')
      .option('-n, --lines <count>', 'number of entries to show', '10')
      .option('-j, --json', 'output as JSON')
      .option('-e, --event <type>', 'filter by event type')
      .option('-a, --actor <actor>', 'filter by actor')
      .action(async (options) => {
        if (!existsSync(AUDIT_LOG)) {
          console.log(chalk.yellow('No audit log found at .terrafusion/audit.log'));
          process.exit(1);
        }

        const spinner = ora('Reading audit trail...').start();

        try {
          const content = await readFile(AUDIT_LOG, 'utf8');
          const lines = content.trim().split('\n').filter(Boolean);

          let entries: AuditEntry[] = [];
          for (const line of lines) {
            try {
              entries.push(JSON.parse(line));
            } catch {
              // Skip malformed lines
            }
          }

          // Apply filters
          if (options.event) {
            entries = entries.filter(e => e.event.includes(options.event));
          }
          if (options.actor) {
            entries = entries.filter(e => e.actor?.includes(options.actor));
          }

          // Take the last N entries
          const limit = parseInt(options.lines, 10);
          entries = entries.slice(-limit);

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(entries, null, 2));
            return;
          }

          console.log(chalk.cyan(`\n📋 Audit Trail (last ${entries.length} entries)\n`));
          console.log(chalk.gray('─'.repeat(90)));

          for (const entry of entries) {
            const time = new Date(entry.timestamp).toLocaleString();
            const riskColor = entry.riskLevel === 'read' ? chalk.green :
                             entry.riskLevel === 'write-safe' ? chalk.blue :
                             entry.riskLevel === 'write-remote' ? chalk.magenta :
                             chalk.yellow;

            console.log(`  ${chalk.gray(time)} ${chalk.cyan(entry.event.padEnd(30))} ${chalk.white(entry.actor || '—')}`);
            if (entry.serverId) {
              console.log(`    ${chalk.gray('Server:')} ${entry.serverId} ${chalk.gray('Scope:')} ${entry.scope || '—'} ${chalk.gray('Risk:')} ${riskColor(entry.riskLevel || '—')}`);
            }
          }

          console.log(chalk.gray('\n─'.repeat(90)));
          console.log(`  ${chalk.gray(`Total entries in log: ${lines.length}`)}`);
          console.log();
        } catch (error) {
          spinner.fail('Failed to read audit trail');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('stats')
      .description('Show audit trail statistics')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        if (!existsSync(AUDIT_LOG)) {
          console.log(chalk.yellow('No audit log found.'));
          process.exit(1);
        }

        const spinner = ora('Analyzing audit trail...').start();

        try {
          const content = await readFile(AUDIT_LOG, 'utf8');
          const lines = content.trim().split('\n').filter(Boolean);
          const entries: AuditEntry[] = [];

          for (const line of lines) {
            try { entries.push(JSON.parse(line)); } catch { /* skip */ }
          }

          const eventCounts: Record<string, number> = {};
          const actorCounts: Record<string, number> = {};
          const riskCounts: Record<string, number> = {};

          for (const e of entries) {
            eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
            if (e.actor) actorCounts[e.actor] = (actorCounts[e.actor] || 0) + 1;
            if (e.riskLevel) riskCounts[e.riskLevel] = (riskCounts[e.riskLevel] || 0) + 1;
          }

          const stats = {
            totalEntries: entries.length,
            dateRange: entries.length > 0 ? {
              first: entries[0].timestamp,
              last: entries[entries.length - 1].timestamp,
            } : null,
            events: eventCounts,
            actors: actorCounts,
            riskLevels: riskCounts,
          };

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(stats, null, 2));
            return;
          }

          console.log(chalk.cyan('\n📊 Audit Trail Statistics\n'));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(`  ${chalk.white('Total Entries:')} ${chalk.cyan(stats.totalEntries.toString())}`);
          if (stats.dateRange) {
            console.log(`  ${chalk.white('First Entry:')}  ${chalk.gray(stats.dateRange.first)}`);
            console.log(`  ${chalk.white('Last Entry:')}   ${chalk.gray(stats.dateRange.last)}`);
          }

          console.log(chalk.gray('\n─ Events ─'.padEnd(60, '─')));
          for (const [event, count] of Object.entries(eventCounts).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${chalk.white(event.padEnd(35))} ${chalk.cyan(count.toString())}`);
          }

          if (Object.keys(actorCounts).length > 0) {
            console.log(chalk.gray('\n─ Actors ─'.padEnd(60, '─')));
            for (const [actor, count] of Object.entries(actorCounts).sort((a, b) => b[1] - a[1])) {
              console.log(`  ${chalk.white(actor.padEnd(35))} ${chalk.cyan(count.toString())}`);
            }
          }

          console.log();
        } catch (error) {
          spinner.fail('Failed to analyze audit trail');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  );
