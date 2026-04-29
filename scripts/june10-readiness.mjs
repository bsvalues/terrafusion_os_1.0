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

warnIfPresent(
  'Benton-certified reference posture remains',
  String.raw`BentonCountyId|Benton County|\bbenton\b|/benton`,
  [
    'backend/src/TerraFusion.API/Controllers/CostForgeController.cs',
    'backend/src/TerraFusion.API/Controllers/AIModulesController.cs',
    'frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts',
    'frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx',
  ],
  'Benton-certified CostForge/AI/map compatibility data may be valid for Benton proof, but it must not be claimed as statewide readiness.'
);

failIfPresent(
  'Statistics Studio is not the primary Forge metrics workflow',
  String.raw`id:\s*["']statistics-studio["']|moduleId:\s*["']statistics-studio["']|label:\s*["']Statistics Studio["']|Open Statistics Studio`,
  ['frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx'],
  'County Studio has the June 10 metrics workflow; Statistics Studio may remain routable internally, but not as primary launcher posture.'
);

warnIfMissingFile(
  'County Studio statistics parity proof present',
  [
    'os-platform/core/pilot/evidence/county-studio-statistics-parity.latest.json',
    'docs/proof/county-studio-statistics-parity.latest.md',
  ],
  'County Studio must carry the June 10 IAAO/statistics workflow before Statistics Studio is hidden from the primary launcher.'
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
