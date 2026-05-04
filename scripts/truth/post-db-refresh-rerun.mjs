#!/usr/bin/env node

/**
 * Post-DB-Refresh Rerun Gate
 *
 * Runs the fast TerraFusion DB/data proof sequence after the Sync/DB lane
 * refreshes the product runtime database. This script does not mutate data,
 * inspect upstream systems, or start the API.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'post-db-refresh-rerun.json');
const outMd = path.join(truthDir, 'post-db-refresh-rerun.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const commandTimeoutMs = Number.parseInt(process.env.TF_POST_DB_REFRESH_TIMEOUT_MS ?? '180000', 10);
const preflightTimeoutMs = Number.parseInt(
  process.env.TF_POST_DB_REFRESH_PREFLIGHT_TIMEOUT_MS ?? '8000',
  10
);
const continueOnFailure = process.env.TF_POST_DB_REFRESH_CONTINUE_ON_FAILURE === '1';

const defaultCommands = [
  {
    name: 'Runtime DB identity',
    command: 'pnpm',
    args: ['run', 'truth:runtime-db-identity'],
  },
  {
    name: 'Runtime DB content',
    command: 'pnpm',
    args: ['run', 'truth:runtime-db-content'],
  },
  {
    name: 'Product load ledger',
    command: 'pnpm',
    args: ['run', 'truth:terrafusion-db-product-load-ledger'],
  },
  {
    name: 'Benton parcel count sanity',
    command: 'pnpm',
    args: ['run', 'truth:benton-parcel-count-sanity'],
  },
  {
    name: 'Runtime source lineage',
    command: 'pnpm',
    args: ['run', 'truth:runtime-source-lineage'],
  },
  {
    name: 'Runtime sale qualification',
    command: 'pnpm',
    args: ['run', 'truth:runtime-sale-qualification'],
  },
  {
    name: 'Benton runtime pilot closure',
    command: 'pnpm',
    args: ['run', 'truth:benton-runtime-pilot-closure'],
  },
  {
    name: 'June 10 readiness packet',
    command: 'pnpm',
    args: ['run', 'truth:june10-readiness-packet'],
  },
];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function quoteForCmd(value) {
  const text = String(value);
  if (text.length === 0) return '""';
  if (/^[A-Za-z0-9_./:=+\-\\]+$/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function commandInvocation(command, args) {
  if (process.platform === 'win32' && (command === 'pnpm' || command === 'npm')) {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', [command, ...args.map(quoteForCmd)].join(' ')],
    };
  }

  return { command, args };
}

function loadCommands() {
  const override = process.env.TF_POST_DB_REFRESH_COMMANDS_JSON;
  if (!override) return defaultCommands;

  const parsed = JSON.parse(override);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('TF_POST_DB_REFRESH_COMMANDS_JSON must be a non-empty command array.');
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Command override at index ${index} is not an object.`);
    }
    if (!entry.command || !Array.isArray(entry.args)) {
      throw new Error(`Command override at index ${index} requires command and args.`);
    }
    return {
      name: entry.name ?? `${entry.command} ${entry.args.join(' ')}`,
      command: entry.command,
      args: entry.args,
      cwd: entry.cwd,
    };
  });
}

async function preflightRuntime() {
  if (process.env.TF_POST_DB_REFRESH_SKIP_PREFLIGHT === '1') {
    return {
      skipped: true,
      endpoint: null,
      status: null,
      ok: true,
      error: null,
    };
  }

  const endpoint = new URL('/api/runtime/truth/db-identity', runtimeBaseUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), preflightTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    return {
      skipped: false,
      endpoint,
      status: response.status,
      ok: response.status === 200,
      error: null,
    };
  } catch (error) {
    return {
      skipped: false,
      endpoint,
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function runCommand(entry) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const cwd = entry.cwd ? path.resolve(repoRoot, entry.cwd) : repoRoot;
  const invocation = commandInvocation(entry.command, entry.args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    timeout: commandTimeoutMs,
    env: process.env,
  });

  const timedOut = result.error?.code === 'ETIMEDOUT';
  const exitCode = result.status ?? (result.error ? 1 : 0);
  return {
    name: entry.name,
    command: [entry.command, ...entry.args].join(' '),
    cwd: rel(cwd),
    startedAt,
    durationMs: Date.now() - started,
    exitCode,
    status: exitCode === 0 && !timedOut ? 'PASS' : 'FAIL',
    timedOut,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.error ? String(result.error.message ?? result.error) : result.stderr),
  };
}

function tail(value, max = 3000) {
  const text = String(value ?? '').trim();
  if (text.length <= max) return text;
  return text.slice(text.length - max);
}

function renderMarkdown(report) {
  const failedResults = report.results.filter(result => result.status === 'FAIL');
  return [
    '# Post-DB-Refresh Rerun',
    '',
    `Generated: ${report.generatedAt}`,
    `Runtime base URL: \`${report.runtimeBaseUrl}\``,
    '',
    '## Status',
    '',
    `- Result: ${report.status}`,
    `- Continue on failure: ${report.continueOnFailure ? 'yes' : 'no'}`,
    `- Commands passed: ${report.summary.commandsPassed}`,
    `- Commands failed: ${report.summary.commandsFailed}`,
    `- Commands skipped: ${report.summary.commandsSkipped}`,
    '',
    '## Planned Command Sequence',
    '',
    '| Step | Name | Command |',
    '|---|---|---|',
    ...report.plannedCommands.map(item =>
      [String(item.order), item.name, `\`${item.command}\``].join(' | ')
    ),
    '',
    '## Runtime Preflight',
    '',
    `- Skipped: ${report.preflight.skipped ? 'yes' : 'no'}`,
    `- Endpoint: ${report.preflight.endpoint ? `\`${report.preflight.endpoint}\`` : '-'}`,
    `- Status: ${report.preflight.status ?? '-'}`,
    `- OK: ${report.preflight.ok ? 'yes' : 'no'}`,
    `- Error: ${report.preflight.error ?? '-'}`,
    '',
    '## Command Results',
    '',
    '| Step | Status | Command | Duration |',
    '|---|---|---|---:|',
    ...report.results.map((result, index) =>
      [String(index + 1), result.status, `\`${result.command}\``, String(result.durationMs)].join(
        ' | '
      )
    ),
    '',
    '## Blockers',
    '',
    ...(report.blockers.length ? report.blockers.map(item => `- ${item}`) : ['- none']),
    '',
    '## Failed Command Output',
    '',
    ...(failedResults.length
      ? failedResults.flatMap(result => [
          `### ${result.name}`,
          '',
          `- Command: \`${result.command}\``,
          `- Exit code: ${result.exitCode}`,
          `- Timed out: ${result.timedOut ? 'yes' : 'no'}`,
          '',
          '```text',
          result.stderrTail || result.stdoutTail || 'No output captured.',
          '```',
          '',
        ])
      : ['- none']),
  ].join('\n');
}

async function main() {
  let commands;
  try {
    commands = loadCommands();
  } catch (error) {
    commands = [];
    const message = error instanceof Error ? error.message : String(error);
    const report = buildReport({
      preflight: {
        skipped: true,
        endpoint: null,
        status: null,
        ok: false,
        error: message,
      },
      commands,
      results: [],
      blockers: [message],
    });
    writeReport(report);
    process.exitCode = 1;
    return;
  }

  const preflight = await preflightRuntime();
  const blockers = [];
  const results = [];

  if (!preflight.ok) {
    blockers.push(
      `Runtime API preflight failed for ${preflight.endpoint ?? runtimeBaseUrl}; status ${preflight.status ?? 'unreachable'}.`
    );
    if (preflight.error) blockers.push(`Runtime API preflight error: ${preflight.error}`);
  } else {
    for (const command of commands) {
      const result = runCommand(command);
      results.push(result);
      if (result.status !== 'PASS') {
        blockers.push(`${result.name} failed with exit code ${result.exitCode}.`);
        if (!continueOnFailure) {
          blockers.push(
            `Skipped ${commands.length - results.length} remaining command(s) after first failure. Set TF_POST_DB_REFRESH_CONTINUE_ON_FAILURE=1 to continue.`
          );
          break;
        }
      }
    }
  }

  const report = buildReport({ preflight, commands, results, blockers });
  writeReport(report);
  if (report.status === 'FAIL') process.exitCode = 1;
}

function buildReport({ preflight, commands, results, blockers }) {
  const commandsSkipped = preflight.ok ? commands.length - results.length : commands.length;
  return {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    status: blockers.length === 0 ? 'PASS' : 'FAIL',
    continueOnFailure,
    plannedCommands: commands.map((command, index) => ({
      order: index + 1,
      name: command.name,
      command: [command.command, ...command.args].join(' '),
      cwd: command.cwd ? rel(path.resolve(repoRoot, command.cwd)) : '.',
    })),
    preflight,
    summary: {
      commandsPlanned: commands.length,
      commandsPassed: results.filter(result => result.status === 'PASS').length,
      commandsFailed: results.filter(result => result.status === 'FAIL').length,
      commandsSkipped,
    },
    results,
    blockers,
  };
}

function writeReport(report) {
  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(
    JSON.stringify(
      {
        status: report.status,
        commandsPassed: report.summary.commandsPassed,
        commandsFailed: report.summary.commandsFailed,
        commandsSkipped: report.summary.commandsSkipped,
      },
      null,
      2
    )
  );
}

main();
