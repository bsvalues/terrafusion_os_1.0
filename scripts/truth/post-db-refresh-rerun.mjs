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
import { postDbRefreshPlan } from './post-db-refresh-plan.mjs';

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
const skipPreflight = process.env.TF_POST_DB_REFRESH_SKIP_PREFLIGHT === '1';
const dryRun = process.env.TF_POST_DB_REFRESH_DRY_RUN === '1' || process.argv.includes('--dry-run');
const commandSource = process.env.TF_POST_DB_REFRESH_COMMANDS_JSON ? 'env_override' : 'default';

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
  if (!override) return postDbRefreshPlan;

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
      expectedArtifacts: Array.isArray(entry.expectedArtifacts) ? entry.expectedArtifacts : [],
    };
  });
}

async function preflightRuntime() {
  if (skipPreflight) {
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
    artifactOutputs: inspectArtifacts(entry.expectedArtifacts ?? [], started),
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.error ? String(result.error.message ?? result.error) : result.stderr),
  };
}

function inspectArtifacts(expectedArtifacts, commandStartedMs) {
  return expectedArtifacts.map(relativePath => {
    const filePath = path.resolve(repoRoot, relativePath);
    let exists = false;
    let mtimeMs = null;
    let artifactStatus = null;
    let artifactPassed = null;
    let warningCount = 0;
    let parseError = null;
    let artifactFailureReasons = [];

    try {
      const stat = fs.statSync(filePath);
      exists = stat.isFile();
      mtimeMs = exists ? stat.mtimeMs : null;
      if (exists && filePath.toLowerCase().endsWith('.json')) {
        const posture = inspectJsonArtifactPosture(filePath);
        artifactStatus = posture.status;
        artifactPassed = posture.passed;
        warningCount = posture.warningCount;
        parseError = posture.parseError;
        artifactFailureReasons = posture.failureReasons;
      }
    } catch {
      exists = false;
    }

    return {
      path: rel(filePath),
      exists,
      refreshed: exists && mtimeMs !== null && mtimeMs >= commandStartedMs,
      mtime: mtimeMs === null ? null : new Date(mtimeMs).toISOString(),
      artifactStatus,
      artifactPassed,
      warningCount,
      parseError,
      artifactFailureReasons,
    };
  });
}

function inspectJsonArtifactPosture(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!isJsonProofObject(parsed)) {
      return {
        status: null,
        passed: null,
        warningCount: 0,
        parseError: null,
        failureReasons: ['JSON artifact root must be an object'],
      };
    }
    return {
      status: typeof parsed?.status === 'string' ? parsed.status : null,
      passed: typeof parsed?.passed === 'boolean' ? parsed.passed : null,
      warningCount: countArtifactWarnings(parsed),
      parseError: null,
      failureReasons: nestedArtifactFailureReasons(parsed),
    };
  } catch (error) {
    return {
      status: null,
      passed: null,
      warningCount: 0,
      parseError: error instanceof Error ? error.message : String(error),
      failureReasons: [],
    };
  }
}

function isJsonProofObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function artifactFailureReason(artifact) {
  if (artifact.artifactPassed === false) return 'top-level passed is false';
  if (typeof artifact.artifactStatus === 'string') {
    if (!isAllowedPassingStatus(artifact.artifactStatus)) {
      return `top-level status is ${artifact.artifactStatus}`;
    }
  }
  if (
    Array.isArray(artifact.artifactFailureReasons) &&
    artifact.artifactFailureReasons.length > 0
  ) {
    return artifact.artifactFailureReasons.join('; ');
  }
  return null;
}

function nestedArtifactFailureReasons(value) {
  return [
    ...booleanFailureReasons(value, 'artifact'),
    ...collectionFailureReasons(value, 'artifact'),
    ...summaryFailureReasons(value?.summary),
    ...receiptEvidenceFailureReasons(value?.receiptEvidence),
    ...nestedRecordFailureReasons(value?.rows, 'row'),
    ...nestedRecordFailureReasons(value?.proofs, 'proof'),
  ];
}

function receiptEvidenceFailureReasons(receiptEvidence) {
  if (!receiptEvidence || typeof receiptEvidence !== 'object') return [];
  const reasons = [
    ...booleanFailureReasons(receiptEvidence, 'receiptEvidence'),
    ...collectionFailureReasons(receiptEvidence, 'receiptEvidence'),
    ...summaryFailureReasons(receiptEvidence.summary, 'receiptEvidence.summary'),
    ...nestedRecordFailureReasons(receiptEvidence.rows, 'receiptEvidence.row'),
    ...nestedRecordFailureReasons(receiptEvidence.proofs, 'receiptEvidence.proof'),
  ];
  if (receiptEvidence.passed === false) reasons.push('receiptEvidence.passed is false');
  if (typeof receiptEvidence.status === 'string') {
    if (!isAllowedPassingStatus(receiptEvidence.status)) {
      reasons.push(`receiptEvidence.status is ${receiptEvidence.status}`);
    }
  }
  return reasons;
}

function summaryFailureReasons(summary, label = 'summary') {
  if (!summary || typeof summary !== 'object') return [];
  const reasons = [
    ...booleanFailureReasons(summary, label),
    ...collectionFailureReasons(summary, label),
  ];
  if (summary.passed === false) reasons.push(`${label}.passed is false`);
  if (typeof summary.status === 'string') {
    if (!isAllowedPassingStatus(summary.status)) {
      reasons.push(`${label}.status is ${summary.status}`);
    }
  }
  return reasons;
}

function booleanFailureReasons(value, label) {
  if (!value || typeof value !== 'object') return [];
  const reasons = [];
  for (const key of ['success', 'ok']) {
    if (value[key] === false) reasons.push(`${label}.${key} is false`);
  }
  for (const [key, fieldValue] of Object.entries(value)) {
    if (key !== 'passed' && key.endsWith('Passed') && fieldValue === false) {
      reasons.push(`${label}.${key} is false`);
    }
  }
  return reasons;
}

function collectionFailureReasons(value, label) {
  if (!value || typeof value !== 'object') return [];
  const reasons = [];
  for (const key of [
    'blocker',
    'blockers',
    'shipBlockers',
    'error',
    'errors',
    'failure',
    'failures',
  ]) {
    const entries = value[key];
    if (Array.isArray(entries) && entries.length > 0) {
      reasons.push(`${label}.${key} has ${entries.length} item(s)`);
    } else if (entries && typeof entries === 'object') {
      const count = Object.keys(entries).length;
      if (count > 0) reasons.push(`${label}.${key} has ${count} object key(s)`);
    } else if (typeof entries === 'string' && entries.trim().length > 0) {
      reasons.push(`${label}.${key} is set`);
    } else {
      const count = Number(entries);
      if (Number.isFinite(count) && count > 0) {
        reasons.push(`${label}.${key} is ${count}`);
      }
    }
  }
  for (const key of [
    'failed',
    'failureCount',
    'errorCount',
    'blockerCount',
    'artifactFailures',
    'commandsFailed',
  ]) {
    const count = Number(value[key]);
    if (Number.isFinite(count) && count > 0) {
      reasons.push(`${label}.${key} is ${count}`);
    }
  }
  return reasons;
}

function nestedRecordFailureReasons(records, label) {
  if (!Array.isArray(records)) return [];
  return records.flatMap(record => {
    const subject = `${record?.tableName ?? record?.county ?? label} ${label}`;
    const reasons = [
      ...booleanFailureReasons(record, subject),
      ...collectionFailureReasons(record, subject),
    ];
    if (record?.passed === false) reasons.push(`${subject} passed is false`);
    if (typeof record?.status === 'string') {
      if (!isAllowedPassingStatus(record.status)) {
        reasons.push(`${subject} status is ${record.status}`);
      }
    }
    for (const reason of summaryFailureReasons(record?.summary)) {
      reasons.push(`${subject} ${reason}`);
    }
    return reasons;
  });
}

function isAllowedPassingStatus(status) {
  return new Set(['PASS', 'PASS_WITH_WARNINGS', 'runtime_contract_pass']).has(status);
}

function countArtifactWarnings(value) {
  const warningValues = [
    value?.warning,
    value?.warnings,
    value?.summary?.warning,
    value?.summary?.warnings,
    value?.warningCount,
    value?.summary?.warningCount,
    value?.receiptEvidence?.warning,
    value?.receiptEvidence?.warnings,
    value?.receiptEvidence?.warningCount,
    value?.receiptEvidence?.summary?.warning,
    value?.receiptEvidence?.summary?.warnings,
    value?.receiptEvidence?.summary?.warningCount,
  ];

  let count = 0;
  for (const warningValue of warningValues) {
    count += countWarningValue(warningValue);
  }
  count += countStatusWarning(value?.summary?.status);
  count += countStatusWarning(value?.receiptEvidence?.status);
  count += countStatusWarning(value?.receiptEvidence?.summary?.status);

  if (Array.isArray(value?.rows)) {
    count += value.rows.reduce(
      (sum, row) =>
        sum +
        countStatusWarning(row?.status) +
        countWarningValue(row?.warning) +
        countWarningValue(row?.warnings) +
        countWarningValue(row?.warningCount) +
        countStatusWarning(row?.summary?.status) +
        countWarningValue(row?.summary?.warning) +
        countWarningValue(row?.summary?.warningCount),
      0
    );
  }

  if (Array.isArray(value?.proofs)) {
    count += value.proofs.reduce(
      (sum, proof) =>
        sum +
        countStatusWarning(proof?.status) +
        countWarningValue(proof?.warning) +
        countWarningValue(proof?.warnings) +
        countWarningValue(proof?.warningCount) +
        countStatusWarning(proof?.summary?.status) +
        countWarningValue(proof?.summary?.warning) +
        countWarningValue(proof?.summary?.warningCount),
      0
    );
  }

  return count;
}

function countStatusWarning(status) {
  return status === 'PASS_WITH_WARNINGS' ? 1 : 0;
}

function countWarningValue(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string') return value.trim().length > 0 ? 1 : 0;
  if (value && typeof value === 'object') return Object.keys(value).length;
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
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
    '## Next Action',
    '',
    `- Code: ${report.nextAction.code}`,
    `- Command: ${report.nextAction.command ? `\`${report.nextAction.command}\`` : '-'}`,
    `- Reason: ${report.nextAction.reason}`,
    '',
    '## Configuration',
    '',
    `- Repository root: \`${report.configuration.repoRoot}\``,
    `- Command source: ${report.configuration.commandSource}`,
    `- Command timeout: ${report.configuration.commandTimeoutMs}ms`,
    `- Preflight timeout: ${report.configuration.preflightTimeoutMs}ms`,
    `- Skip preflight: ${report.configuration.skipPreflight ? 'yes' : 'no'}`,
    `- Dry run: ${report.configuration.dryRun ? 'yes' : 'no'}`,
    `- Continue on failure: ${report.configuration.continueOnFailure ? 'yes' : 'no'}`,
    `- Node: ${report.configuration.nodeVersion}`,
    `- Platform: ${report.configuration.platform}`,
    '',
    '## Status',
    '',
    `- Result: ${report.status}`,
    `- Continue on failure: ${report.continueOnFailure ? 'yes' : 'no'}`,
    `- Commands passed: ${report.summary.commandsPassed}`,
    `- Commands failed: ${report.summary.commandsFailed}`,
    `- Commands skipped: ${report.summary.commandsSkipped}`,
    `- Expected artifacts: ${report.summary.expectedArtifacts}`,
    `- Refreshed artifacts: ${report.summary.refreshedArtifacts}`,
    `- Stale or missing artifacts: ${report.summary.staleOrMissingArtifacts}`,
    `- Artifact warnings: ${report.summary.artifactWarnings}`,
    `- Artifacts PASS_WITH_WARNINGS: ${report.summary.artifactsPassWithWarnings}`,
    `- Artifact parse errors: ${report.summary.artifactParseErrors}`,
    `- Artifact failures: ${report.summary.artifactFailures}`,
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
    '## Artifact Outputs',
    '',
    ...(report.results.some(result => result.artifactOutputs.length > 0)
      ? report.results.flatMap(result => [
          `### ${result.name}`,
          '',
          '| Artifact | Exists | Refreshed | Status | Passed | Warnings | Modified |',
          '|---|---|---|---|---|---:|---|',
          ...result.artifactOutputs.map(artifact =>
            [
              `\`${artifact.path}\``,
              artifact.exists ? 'yes' : 'no',
              artifact.refreshed ? 'yes' : 'no',
              artifact.artifactStatus ?? '-',
              artifact.artifactPassed == null ? '-' : String(artifact.artifactPassed),
              String(artifact.warningCount ?? 0),
              artifact.mtime ?? '-',
            ].join(' | ')
          ),
          '',
        ])
      : ['- none']),
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

  const preflight = dryRun
    ? {
        skipped: true,
        endpoint: null,
        status: null,
        ok: true,
        error: null,
      }
    : await preflightRuntime();
  const blockers = [];
  const results = [];

  if (dryRun) {
    // Dry run intentionally records the plan/configuration without probing or executing.
  } else if (!preflight.ok) {
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
      const artifactBlockers = [];
      for (const artifact of result.artifactOutputs ?? []) {
        if (!artifact.exists) {
          artifactBlockers.push(`${result.name} did not write expected artifact ${artifact.path}.`);
        } else if (!artifact.refreshed) {
          artifactBlockers.push(`${result.name} left expected artifact stale: ${artifact.path}.`);
        } else if (artifact.parseError) {
          artifactBlockers.push(
            `${result.name} wrote malformed JSON artifact ${artifact.path}: ${artifact.parseError}.`
          );
        } else {
          const failureReason = artifactFailureReason(artifact);
          if (failureReason) {
            artifactBlockers.push(
              `${result.name} wrote failing JSON proof artifact ${artifact.path}: ${failureReason}.`
            );
          }
        }
      }
      blockers.push(...artifactBlockers);
      if (artifactBlockers.length > 0 && !continueOnFailure) {
        blockers.push(
          `Skipped ${commands.length - results.length} remaining command(s) after missing, stale, malformed, or failing artifact output. Set TF_POST_DB_REFRESH_CONTINUE_ON_FAILURE=1 to continue.`
        );
        break;
      }
    }
  }

  const report = buildReport({ preflight, commands, results, blockers });
  writeReport(report);
  if (report.status === 'FAIL' || report.status === 'DRY_RUN') process.exitCode = 1;
}

function buildReport({ preflight, commands, results, blockers }) {
  const commandsSkipped =
    dryRun || !preflight.ok ? commands.length : commands.length - results.length;
  const artifactOutputs = results.flatMap(result => result.artifactOutputs ?? []);
  const artifactWarnings = artifactOutputs.reduce(
    (sum, artifact) => sum + Number(artifact.warningCount ?? 0),
    0
  );
  const artifactsPassWithWarnings = artifactOutputs.filter(
    artifact => artifact.artifactStatus === 'PASS_WITH_WARNINGS'
  ).length;
  const hasWarningPosture = artifactWarnings > 0 || artifactsPassWithWarnings > 0;
  const report = {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    status: dryRun
      ? 'DRY_RUN'
      : blockers.length === 0
        ? hasWarningPosture
          ? 'PASS_WITH_WARNINGS'
          : 'PASS'
        : 'FAIL',
    continueOnFailure,
    configuration: {
      repoRoot,
      commandSource,
      commandTimeoutMs,
      preflightTimeoutMs,
      skipPreflight,
      dryRun,
      continueOnFailure,
      nodeVersion: process.version,
      platform: `${process.platform}/${process.arch}`,
    },
    plannedCommands: commands.map((command, index) => ({
      order: index + 1,
      name: command.name,
      command: [command.command, ...command.args].join(' '),
      cwd: command.cwd ? rel(path.resolve(repoRoot, command.cwd)) : '.',
      expectedArtifacts: command.expectedArtifacts ?? [],
    })),
    preflight,
    summary: {
      commandsPlanned: commands.length,
      commandsPassed: results.filter(result => result.status === 'PASS').length,
      commandsFailed: results.filter(result => result.status === 'FAIL').length,
      commandsSkipped,
      expectedArtifacts: artifactOutputs.length,
      refreshedArtifacts: artifactOutputs.filter(artifact => artifact.refreshed).length,
      staleOrMissingArtifacts: artifactOutputs.filter(
        artifact => !artifact.exists || !artifact.refreshed
      ).length,
      artifactWarnings,
      artifactsPassWithWarnings,
      artifactParseErrors: artifactOutputs.filter(artifact => artifact.parseError).length,
      artifactFailures: artifactOutputs.filter(artifact => artifactFailureReason(artifact)).length,
    },
    results,
    blockers,
  };

  return {
    ...report,
    nextAction: deriveNextAction(report),
  };
}

function deriveNextAction(report) {
  if (report.status === 'DRY_RUN') {
    return {
      code: 'run_live_fast_gate',
      command: 'pnpm run truth:post-db-refresh-rerun',
      reason: 'Dry run only recorded the plan; run the fast gate against the live TerraFusion API.',
    };
  }

  if (!report.preflight.ok) {
    return {
      code: 'start_or_fix_runtime_api',
      command: 'pnpm run truth:post-db-refresh-rerun',
      reason: 'Runtime API preflight failed before DB/data proofs could run.',
    };
  }

  const failedCommand = report.results.find(result => result.status === 'FAIL');
  if (failedCommand) {
    return {
      code: 'fix_failed_proof',
      command: failedCommand.command,
      reason: `${failedCommand.name} failed before the post-DB-refresh sequence could complete.`,
    };
  }

  const malformedResult = report.results.find(result =>
    (result.artifactOutputs ?? []).some(artifact => artifact.parseError)
  );
  if (malformedResult) {
    return {
      code: 'fix_malformed_artifact',
      command: malformedResult.command,
      reason: `${malformedResult.name} wrote at least one malformed JSON proof artifact.`,
    };
  }

  const failedArtifactResult = report.results.find(result =>
    (result.artifactOutputs ?? []).some(artifact => artifactFailureReason(artifact))
  );
  if (failedArtifactResult) {
    return {
      code: 'fix_failed_artifact',
      command: failedArtifactResult.command,
      reason: `${failedArtifactResult.name} wrote at least one failing JSON proof artifact.`,
    };
  }

  const staleResult = report.results.find(result =>
    (result.artifactOutputs ?? []).some(artifact => !artifact.exists || !artifact.refreshed)
  );
  if (staleResult) {
    return {
      code: 'fix_stale_or_missing_artifact',
      command: staleResult.command,
      reason: `${staleResult.name} did not refresh every expected proof artifact.`,
    };
  }

  if (report.status === 'PASS') {
    return {
      code: 'run_full_readiness_gate',
      command: 'pnpm run readiness:june10',
      reason: 'Fast DB/data proofs passed; run the full build/test readiness gate next.',
    };
  }

  if (report.status === 'PASS_WITH_WARNINGS') {
    return {
      code: 'review_warnings_then_run_full_readiness_gate',
      command: 'pnpm run readiness:june10',
      reason:
        'Fast DB/data proofs passed with artifact warnings; review warnings and run the full build/test readiness gate.',
    };
  }

  return {
    code: 'investigate_blockers',
    command: null,
    reason: 'The report failed without a more specific next action classification.',
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
        nextAction: report.nextAction,
      },
      null,
      2
    )
  );
}

main();
