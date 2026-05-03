#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const moduleComponentsPath = 'frontend/apps/os-shell/src/config/moduleComponents.tsx';
const modulesPath = 'frontend/apps/os-shell/src/config/modules.ts';
const forgeSuiteHomePath = 'frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx';
const retirementAuditPath = 'os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.json';

function readText(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function readJson(relPath) {
  const fullPath = path.join(repoRoot, relPath);
  return existsSync(fullPath) ? JSON.parse(readFileSync(fullPath, 'utf8')) : null;
}

function lineOf(relPath, pattern) {
  const lines = readText(relPath).split(/\r?\n/);
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

function ref(relPath, pattern) {
  const line = lineOf(relPath, pattern);
  return line ? `${relPath}:${line}` : relPath;
}

function check(id, passed, proof, note) {
  return { id, passed, proof, note };
}

const moduleComponents = readText(moduleComponentsPath);
const modules = readText(modulesPath);
const forgeSuiteHome = readText(forgeSuiteHomePath);
const retirementAudit = readJson(retirementAuditPath);

const checks = [
  check(
    'direct-statistics-studio-launch-resolves-to-county-studio',
    /'statistics-studio': 'county-studio'/.test(moduleComponents),
    [ref(moduleComponentsPath, /'statistics-studio': 'county-studio'/)],
    'Direct legacy launch IDs now normalize into County Studio.',
  ),
  check(
    'statistics-studio-renderer-shell-removed',
    !/case 'statistics-studio'/.test(moduleComponents)
      && !/const StatisticsStudio = lazy/.test(moduleComponents)
      && !/Loading Statistics Studio/.test(moduleComponents),
    [moduleComponentsPath],
    'ModuleRenderer no longer has a standalone Statistics Studio shell path.',
  ),
  check(
    'statistics-studio-hidden-from-default-gen2-modules',
    /RETIRED_STANDALONE_MODULE_IDS = new Set\(\['statistics-studio'\]\)/.test(modules)
      && /!RETIRED_STANDALONE_MODULE_IDS\.has\(m\.id\)/.test(modules),
    [
      ref(modulesPath, /RETIRED_STANDALONE_MODULE_IDS/),
      ref(modulesPath, /!RETIRED_STANDALONE_MODULE_IDS\.has\(m\.id\)/),
    ],
    'Generated catalog metadata remains, but the retired shell is filtered out of default Gen2 modules.',
  ),
  check(
    'forge-suite-no-longer-lists-statistics-studio',
    !/id: 'statistics-studio'/.test(forgeSuiteHome)
      && !/label: 'Statistics Studio'/.test(forgeSuiteHome)
      && !/Legacy specialist/.test(forgeSuiteHome),
    [forgeSuiteHomePath],
    'Forge suite no longer presents Statistics Studio as a user-selectable specialist card.',
  ),
  check(
    'retirement-audit-is-green',
    retirementAudit?.status === 'PASS'
      && retirementAudit?.decision === 'RETIRE_STATISTICS_STUDIO'
      && retirementAudit?.summary?.keepTemporarily === 0,
    [retirementAuditPath],
    'Retirement matrix has no remaining analytical or product gap requiring the shell.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-studio-standalone-shell-closure',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  decision:
    failures.length === 0
      ? 'STATISTICS_STUDIO_STANDALONE_SHELL_RETIRED_COUNTY_STUDIO_IS_DEFAULT_ANALYTICS'
      : 'STATISTICS_STUDIO_STANDALONE_SHELL_STILL_LAUNCHABLE',
  checks,
  failures,
  nextClosure: [
    'Do not remove shared statistics components; County Studio owns and imports them.',
    'Keep StatisticsStudio.tsx source deletion as a separate cleanup only after import graph verification.',
  ],
};

function markdown() {
  const lines = [
    '# Statistics Studio Standalone Shell Closure',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Checks',
    '',
    '| Check | Result | Proof | Note |',
    '| --- | --- | --- | --- |',
    ...checks.map((row) =>
      `| ${row.id} | ${row.passed ? 'PASS' : 'FAIL'} | ${row.proof.map((item) => `\`${item}\``).join('<br>')} | ${row.note} |`,
    ),
    '',
    '## Next Closure',
    '',
    ...report.nextClosure.map((item) => `- ${item}`),
  ];
  return `${lines.join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
const jsonPath = path.join(evidenceDir, 'statistics-studio-standalone-shell-closure.latest.json');
const mdPath = path.join(evidenceDir, 'statistics-studio-standalone-shell-closure.latest.md');
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/statistics-studio-standalone-shell-closure.latest.json',
    'os-platform/core/pilot/evidence/statistics-studio-standalone-shell-closure.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
