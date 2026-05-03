#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const moduleComponentsPath = 'frontend/apps/os-shell/src/config/moduleComponents.tsx';
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
const forgeSuiteHome = readText(forgeSuiteHomePath);
const retirementAudit = readJson(retirementAuditPath);

const checks = [
  check(
    'generic-statistics-aliases-route-to-county-studio',
    /stats:\s*'county-studio'/.test(moduleComponents)
      && /statistics:\s*'county-studio'/.test(moduleComponents),
    [
      ref(moduleComponentsPath, /stats:\s*'county-studio'/),
      ref(moduleComponentsPath, /statistics:\s*'county-studio'/),
    ],
    'Normal analytics aliases now open County Studio instead of the standalone Statistics Studio shell.',
  ),
  check(
    'canonical-statistics-studio-now-resolves-to-county-studio',
    /'statistics-studio': 'county-studio'/.test(moduleComponents)
      && !/case 'statistics-studio'/.test(moduleComponents),
    [
      ref(moduleComponentsPath, /'statistics-studio': 'county-studio'/),
    ],
    'The legacy Statistics Studio id now resolves into County Studio instead of launching a separate shell.',
  ),
  check(
    'forge-suite-does-not-list-statistics-studio',
    !/id:\s*'statistics-studio'/.test(forgeSuiteHome)
      && !/Legacy specialist/.test(forgeSuiteHome),
    [forgeSuiteHomePath],
    'Statistics Studio is no longer shown as a Forge suite card.',
  ),
  check(
    'county-studio-is-default-analytics-workbench',
    /Default analytics workbench/.test(forgeSuiteHome)
      && /Operational Health, Statistics Compat/.test(forgeSuiteHome),
    [
      ref(forgeSuiteHomePath, /Default analytics workbench/),
      ref(forgeSuiteHomePath, /Operational Health, Statistics Compat/),
    ],
    'Forge now presents County Studio as the normal study-anchored analytics path.',
  ),
  check(
    'retirement-gap-audit-supports-full-shell-retirement',
    retirementAudit?.status === 'PASS'
      && retirementAudit?.decision === 'RETIRE_STATISTICS_STUDIO'
      && retirementAudit?.summary?.missing === 0
      && retirementAudit?.summary?.keepTemporarily === 0,
    [retirementAuditPath],
    'The audit now supports full shell retirement: analytics and VEI exploration are covered by County Studio.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-studio-demotion-and-county-studio-default-analytics',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  decision:
    failures.length === 0
      ? 'COUNTY_STUDIO_DEFAULT_ANALYTICS_STATISTICS_STUDIO_SHELL_RETIRED'
      : 'DEMOTION_POSTURE_INCOMPLETE',
  checks,
  failures,
  nextClosure: [
    'Keep shared statistics panels in place; County Studio imports them as native workbench capabilities.',
    'Treat StatisticsStudio.tsx source removal as a separate import-graph cleanup, not a product-gate blocker.',
  ],
};

function markdown() {
  const lines = [
    '# Statistics Studio Demotion And County Studio Default Analytics',
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
    '',
  ];
  return `${lines.join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
const jsonPath = path.join(evidenceDir, 'statistics-studio-demotion-and-county-studio-default-analytics.latest.json');
const mdPath = path.join(evidenceDir, 'statistics-studio-demotion-and-county-studio-default-analytics.latest.md');
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/statistics-studio-demotion-and-county-studio-default-analytics.latest.json',
    'os-platform/core/pilot/evidence/statistics-studio-demotion-and-county-studio-default-analytics.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
