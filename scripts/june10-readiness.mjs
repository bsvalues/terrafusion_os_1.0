#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const checks = [];
const MAX_OUTPUT = 4_000;
const EXCLUDED_DIRS = new Set([
  '.git',
  '.codex',
  '.claude',
  '.terrafusion',
  'bin',
  'obj',
  'node_modules',
  'target',
  'dist',
  'build',
]);

function truncate(value) {
  const text = (value ?? '').trim();
  return text.length > MAX_OUTPUT ? `${text.slice(0, MAX_OUTPUT)}\n...<truncated>` : text;
}

function pushCheck(check) {
  checks.push({
    ...check,
    stdout: truncate(check.stdout),
    stderr: truncate(check.stderr),
  });
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

function run(name, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const invocation = commandInvocation(command, args);
  const cwd = options.cwd ? resolveRepoPath(options.cwd) : repoRoot;
  const result = spawnSync(invocation.command, invocation.args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    timeout: options.timeout ?? 180_000,
    env: { ...process.env, ...(options.env ?? {}) },
  });

  const status = result.error || result.status !== 0 ? 'FAIL' : 'PASS';
  pushCheck({
    name,
    status,
    kind: 'command',
    command: [command, ...args].join(' '),
    cwd: path.relative(repoRoot, cwd).replaceAll('\\', '/') || '.',
    startedAt,
    durationMs: Date.now() - startMs,
    stdout: result.stdout,
    stderr: result.error ? String(result.error.message ?? result.error) : result.stderr,
  });
}

function resolveRepoPath(target) {
  return path.resolve(repoRoot, target);
}

function listFiles(targets) {
  const files = [];

  function walk(absPath) {
    if (!existsSync(absPath)) return;
    const stat = statSync(absPath);
    if (stat.isFile()) {
      files.push(absPath);
      return;
    }
    if (!stat.isDirectory()) return;

    const base = path.basename(absPath);
    if (EXCLUDED_DIRS.has(base)) return;

    for (const entry of readdirSync(absPath)) {
      walk(path.join(absPath, entry));
    }
  }

  for (const target of targets) {
    walk(resolveRepoPath(target));
  }

  return files;
}

function readText(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function scanPattern(name, pattern, targets, options = {}) {
  const regex = new RegExp(pattern, options.flags ?? 'i');
  const files = listFiles(targets);
  const matches = [];

  for (const file of files) {
    const rel = path.relative(repoRoot, file).replaceAll('\\', '/');
    const text = readText(file);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        matches.push(`${rel}:${index + 1}:${line.trim()}`);
      }
    });
  }

  return { files, matches };
}

function failIfPresent(name, pattern, targets, detail) {
  const { files, matches } = scanPattern(name, pattern, targets);
  pushCheck({
    name,
    status: matches.length === 0 ? 'PASS' : 'FAIL',
    kind: 'grep_absent',
    command: `scan absent /${pattern}/ in ${targets.join(' ')}`,
    stdout:
      matches.length === 0 ? `Pattern absent across ${files.length} file(s).` : matches.join('\n'),
    stderr: matches.length === 0 ? '' : detail,
  });
}

function failIfMissingPattern(name, pattern, targets, detail) {
  const { files, matches } = scanPattern(name, pattern, targets);
  pushCheck({
    name,
    status: matches.length === 0 ? 'FAIL' : 'PASS',
    kind: 'grep_required',
    command: `scan required /${pattern}/ in ${targets.join(' ')}`,
    stdout:
      matches.length === 0 ? `Pattern missing across ${files.length} file(s).` : matches.join('\n'),
    stderr: matches.length === 0 ? detail : '',
  });
}

function warnIfPresent(name, pattern, targets, detail) {
  const { files, matches } = scanPattern(name, pattern, targets);
  pushCheck({
    name,
    status: matches.length > 0 ? 'WARN' : 'PASS',
    kind: 'grep_warn',
    command: `scan warn /${pattern}/ in ${targets.join(' ')}`,
    stdout:
      matches.length > 0
        ? matches.join('\n')
        : `No warning pattern found across ${files.length} file(s).`,
    stderr: matches.length > 0 ? detail : '',
  });
}

function warnIfMissingFile(name, targets, detail) {
  const existing = targets.filter(target => existsSync(resolveRepoPath(target)));
  pushCheck({
    name,
    status: existing.length === 0 ? 'WARN' : 'PASS',
    kind: 'file_presence_warn',
    command: `check file exists ${targets.join(' ')}`,
    stdout:
      existing.length === 0 ? 'No matching evidence file found.' : `Found: ${existing.join(', ')}`,
    stderr: existing.length === 0 ? detail : '',
  });
}

function summarizeStatus(failures, warnings) {
  if (failures.length > 0) return 'FAIL';
  if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
  return 'PASS';
}

run(
  'Backend API restore',
  'dotnet',
  ['restore', 'backend/src/TerraFusion.API/TerraFusion.API.csproj'],
  { timeout: 300_000 }
);

run(
  'Backend API tests restore',
  'dotnet',
  ['restore', 'backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj'],
  { timeout: 300_000 }
);

run(
  'Backend unit tests restore',
  'dotnet',
  ['restore', 'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj'],
  { timeout: 300_000 }
);

run('Workspace JS dependencies', 'pnpm', ['install', '--frozen-lockfile'], { timeout: 600_000 });

run(
  'Backend API build',
  'dotnet',
  [
    'build',
    'backend/src/TerraFusion.API/TerraFusion.API.csproj',
    '--no-restore',
    '--no-incremental',
  ],
  { timeout: 240_000 }
);

run('Frontend TypeScript', 'pnpm', ['--dir', 'frontend', 'exec', 'tsc', '--noEmit'], {
  timeout: 180_000,
});

run('Rust kernel release build', 'cargo', ['build', '--release'], {
  cwd: 'packages/terrabuild/kernels',
  env: { CARGO_TARGET_DIR: resolveRepoPath('packages/terrabuild/kernels/target') },
  timeout: 240_000,
});

run('Rust kernel smoke', 'node', ['scripts/terraforge-kernel-smoke.mjs'], { timeout: 120_000 });

run(
  'County Studio backend governance tests',
  'dotnet',
  [
    'test',
    'backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj',
    '--no-restore',
    '--filter',
    'FullyQualifiedName~CountyStudy|FullyQualifiedName~Sovereign',
  ],
  { timeout: 180_000 }
);

run(
  'Sync active-workbook tests',
  'dotnet',
  [
    'test',
    'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj',
    '--no-restore',
    '--filter',
    'FullyQualifiedName~SyncControllerActiveWorkbookTests|FullyQualifiedName~SyncControllerCompsEligibleTests|FullyQualifiedName~R2Wave44SyncControllerTests',
  ],
  { timeout: 180_000 }
);

run(
  'CostForge certified reference guard tests',
  'dotnet',
  [
    'test',
    'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj',
    '--no-restore',
    '--filter',
    'FullyQualifiedName~R1Week5Cx19D2CostForgeGetCountyIsolationIntegrationTests',
  ],
  { timeout: 180_000 }
);

run(
  'County Studio / Atlas / Forge launcher frontend tests',
  'pnpm',
  [
    'exec',
    'vitest',
    '--root',
    'frontend',
    '--config',
    'vitest.config.ts',
    'run',
    'apps/os-shell/src/pages/forge/county-studio',
    'apps/os-shell/src/pages/forge/atlas-live',
    'apps/os-shell/src/pages/suites',
  ],
  { timeout: 180_000 }
);

run('Runtime candidate set', 'pnpm', ['run', 'truth:runtime-candidate-set'], {
  timeout: 180_000,
});

run(
  'Washington 39-county data crosswalk',
  'pnpm',
  ['run', 'truth:washington-39-county-data-crosswalk'],
  {
    timeout: 180_000,
  }
);

run('Runtime TerraFusion DB identity', 'pnpm', ['run', 'truth:runtime-db-identity'], {
  timeout: 180_000,
});

run('Runtime TerraFusion DB content audit', 'pnpm', ['run', 'truth:runtime-db-content'], {
  timeout: 180_000,
});

run(
  'TerraFusion DB product load ledger',
  'pnpm',
  ['run', 'truth:terrafusion-db-product-load-ledger'],
  {
    timeout: 180_000,
  }
);

run('Benton parcel count sanity', 'pnpm', ['run', 'truth:benton-parcel-count-sanity'], {
  timeout: 180_000,
});

run('Benton runtime pilot closure', 'pnpm', ['run', 'truth:benton-runtime-pilot-closure'], {
  timeout: 180_000,
});

failIfPresent(
  'Old County Studio hub path removed',
  String.raw`/api/hubs/county-study`,
  ['frontend/apps/os-shell/src/pages/forge'],
  'Frontend must call /hubs/county-study, not the old /api/hubs/county-study path.'
);

failIfPresent(
  'Standalone GeoForge/Atlas launcher posture removed',
  String.raw`id:\s*["'](?:geoforge|atlas-live)["']|moduleId:\s*["'](?:geoforge|atlas-live)["']|label:\s*["'](?:GeoForge|Atlas Live View)["']|title:\s*["'](?:GeoForge|Atlas Live View)["']|Launch Atlas|standalone Atlas|forge-gis-applications`,
  ['frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx'],
  'Forge launcher must not present GeoForge or standalone Atlas as primary products.'
);

failIfPresent(
  'County Studio does not transition into Published or RolledBack',
  String.raw`Approved\s*,\s*AdjustmentSetApprovalState\.Published|Published\s*,\s*AdjustmentSetApprovalState\.RolledBack|state:\s*['"]Published['"]|state:\s*['"]RolledBack['"]`,
  [
    'backend/src/TerraFusion.Core/Services/CountyStudyService.cs',
    'frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx',
  ],
  'County Studio active workflow must stop at Approved.'
);

failIfPresent(
  'Rust kernels remain Redis-free',
  String.raw`Redis|redis|StackExchange|IDistributedCache`,
  ['packages/terrabuild/kernels'],
  'Rust kernels must remain deterministic stdin/stdout engines without Redis/runtime cache coupling.'
);

failIfPresent(
  'Active TerraForge sales endpoints have no Benton county fallback',
  String.raw`BentonCountyId|hardcoded sovereign|falls back to Benton|CountyId\s*==\s*Benton`,
  [
    'backend/src/TerraFusion.API/Controllers/TerraForgeController.cs',
    'backend/src/TerraFusion.API/Controllers/SalesAuditController.cs',
  ],
  'Active TerraForge/SalesAudit endpoints must require explicit county scope and must not default to Benton.'
);

failIfMissingPattern(
  'County Studio embeds the full Statistics Studio surface',
  String.raw`CountyStatisticsWorkbenchPanel|embeddedInCountyStudio|Full Statistics Lab`,
  [
    'frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx',
    'frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx',
    'frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx',
  ],
  'County Studio must contain Statistics Studio functionality as a workbench mode, not merely claim a reduced IAAO subset.'
);

failIfMissingPattern(
  'County Studio full statistics superset proof present',
  String.raw`PASS_FULL_STATISTICS_SUPERSET|fullStatisticsSuperset["']?\s*:\s*true`,
  [
    'os-platform/core/pilot/evidence/county-studio-statistics-parity.latest.json',
    'docs/proof/county-studio-statistics-parity.latest.md',
  ],
  'The old weak IAAO-only parity proof is not enough. County Studio must prove it embeds or implements every Statistics Studio tab/capability.'
);

warnIfMissingFile(
  'CostForge certified reference posture proof present',
  [
    'os-platform/core/pilot/evidence/costforge-certified-reference-posture.latest.json',
    'docs/proof/costforge-certified-reference-posture.latest.md',
  ],
  'Benton-certified CostForge/AI/map compatibility data requires proof that non-Benton county scope fails honestly instead of receiving Benton reference data.'
);

warnIfMissingFile(
  'Browser smoke proof evidence present',
  [
    'os-platform/core/pilot/evidence/june10-browser-smoke.latest.json',
    'docs/proof/june10-browser-smoke.latest.md',
  ],
  'No browser smoke artifact was found. Command readiness is not a substitute for manual workflow proof.'
);

warnIfMissingFile(
  'Statewide 39-county coverage proof present',
  [
    'os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json',
    'docs/proof/washington-39-county-coverage.latest.md',
  ],
  'Statewide data coverage remains unproven unless a dedicated 39-county proof artifact exists.'
);

const failures = checks.filter(check => check.status === 'FAIL');
const warnings = checks.filter(check => check.status === 'WARN');
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'June 10 TerraForge Readiness Gate',
  status: summarizeStatus(failures, warnings),
  failures: failures.length,
  warnings: warnings.length,
  checks,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
