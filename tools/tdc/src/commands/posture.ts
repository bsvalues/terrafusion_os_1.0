import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../..');
const POSTURE_FILE = join(REPO_ROOT, '.terrafusion', 'posture', 'latest.json');

export const postureCommand = new Command('posture')
  .alias('ps')
  .description('📊 Governance posture tracking across all lanes')
  .addCommand(
    new Command('check')
      .description('Run posture check across all governance lanes')
      .option('-j, --json', 'output as JSON')
      .option('-l, --lane <lane>', 'filter by specific lane')
      .action(async (options) => {
        const spinner = ora('Collecting posture signals...').start();

        try {
          const busPath = join(REPO_ROOT, 'tools', 'dx', 'posture-bus', 'bus.mjs');

          let report;
          try {
            const bus = await import(busPath);
            const signals = await bus.collectDefaultSignals();
            report = bus.calculatePosture(signals);
            await bus.savePosture(report);
          } catch {
            report = buildFallbackPosture();
          }

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(report, null, 2));
            return;
          }

          renderPostureReport(report, options.lane);
        } catch (error) {
          spinner.fail('Posture check failed');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('report')
      .description('Show the latest posture report')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        if (!existsSync(POSTURE_FILE)) {
          console.log(chalk.yellow('No posture report found. Run `tdc posture check` first.'));
          process.exit(1);
        }

        const report = JSON.parse(await readFile(POSTURE_FILE, 'utf8'));

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        renderPostureReport(report);
      })
  );

function renderPostureReport(report: any, filterLane?: string) {
  const scoreColor = report.overallScore >= 90 ? chalk.green :
                     report.overallScore >= 70 ? chalk.cyan :
                     report.overallScore >= 50 ? chalk.yellow : chalk.red;

  const statusIcon = report.overallStatus === 'excellent' ? '🏛️' :
                     report.overallStatus === 'good' ? '✅' :
                     report.overallStatus === 'warning' ? '⚠️' : '❌';

  console.log(chalk.cyan('\n📊 TerraFusion Governance Posture\n'));
  console.log(chalk.gray('─'.repeat(65)));

  // Overall score bar
  const barWidth = 40;
  const filled = Math.round((report.overallScore / 100) * barWidth);
  const bar = scoreColor('█'.repeat(filled)) + chalk.gray('░'.repeat(barWidth - filled));
  console.log(`  ${statusIcon} Overall: ${bar} ${scoreColor(report.overallScore + '%')} ${chalk.gray(`(${report.overallStatus})`)}`);

  console.log(chalk.gray('\n─ Lane Scores ─'.padEnd(65, '─')));

  const laneIcons: Record<string, string> = {
    dev: '💻', governance: '🏛️', security: '🔒', ops: '⚙️', data: '📊',
  };

  const laneOrder = ['dev', 'governance', 'security', 'ops', 'data'];

  for (const lane of laneOrder) {
    if (filterLane && lane !== filterLane) continue;

    const info = report.lanes[lane];
    if (!info) continue;

    const icon = laneIcons[lane] || '?';
    const laneScore = info.score;
    const laneFilled = Math.round((laneScore / 100) * 30);
    const laneBar = (laneScore >= 70 ? chalk.green : laneScore >= 50 ? chalk.yellow : chalk.red)(
      '█'.repeat(laneFilled)
    ) + chalk.gray('░'.repeat(30 - laneFilled));

    const statusLabel = info.status === 'pass' ? chalk.green(info.status) :
                        info.status === 'warn' ? chalk.yellow(info.status) :
                        info.status === 'fail' ? chalk.red(info.status) :
                        chalk.gray(info.status);

    console.log(`  ${icon} ${chalk.white(lane.padEnd(12))} ${laneBar} ${chalk.white(laneScore.toString().padStart(5))}% ${statusLabel} ${chalk.gray(`(${info.signalCount} signals)`)}`);
  }

  // Show signals
  if (report.signals && report.signals.length > 0) {
    console.log(chalk.gray('\n─ Signals ─'.padEnd(65, '─')));
    const signalsToShow = filterLane
      ? report.signals.filter((s: any) => s.lane === filterLane)
      : report.signals;

    for (const signal of signalsToShow) {
      const sIcon = signal.status === 'pass' ? chalk.green('✓') :
                    signal.status === 'warn' ? chalk.yellow('⚠') :
                    chalk.red('✗');
      console.log(`  ${sIcon} ${chalk.gray(signal.lane.padEnd(12))} ${chalk.white(signal.source.padEnd(22))} ${signal.score}% ${chalk.gray(signal.message)}`);
    }
  }

  console.log(chalk.gray('\n─'.repeat(65)));
  console.log(`  ${chalk.gray('Generated:')} ${report.generatedAt}`);
  console.log();
}

function buildFallbackPosture() {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    overallScore: 0,
    overallStatus: 'critical',
    lanes: {
      dev: { score: 0, status: 'unknown', signalCount: 0 },
      governance: { score: 0, status: 'unknown', signalCount: 0 },
      security: { score: 0, status: 'unknown', signalCount: 0 },
      ops: { score: 0, status: 'unknown', signalCount: 0 },
      data: { score: 0, status: 'unknown', signalCount: 0 },
    },
    signals: [],
    hash: '',
  };
}
