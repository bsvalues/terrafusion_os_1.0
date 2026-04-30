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
    'canonical-statistics-studio-remains-specialist-entry',
    /'statistics-studio'/.test(moduleComponents)
      && /case 'statistics-studio'/.test(moduleComponents)
      && /<StatisticsStudio \/>/.test(moduleComponents),
    [
      ref(moduleComponentsPath, /'statistics-studio'/),
      ref(moduleComponentsPath, /case 'statistics-studio'/),
    ],
    'The canonical Statistics Studio module remains launchable for specialist legacy use.',
  ),
  check(
    'forge-suite-labels-statistics-studio-as-legacy-specialist',
    /chipLabel:\s*'Legacy specialist'/.test(forgeSuiteHome)
      && /Specialist legacy shell for standalone statistics access and ad hoc VEI tax-year exploration/.test(forgeSuiteHome),
    [
      ref(forgeSuiteHomePath, /chipLabel:\s*'Legacy specialist'/),
      ref(forgeSuiteHomePath, /Specialist legacy shell/),
    ],
    'Statistics Studio is no longer described as parity evidence or the default analytics workflow.',
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
    'retirement-gap-audit-supports-demotion-not-full-retirement',
    retirementAudit?.status === 'PASS_WITH_PRODUCT_GAPS'
      && retirementAudit?.summary?.missing === 0
      && retirementAudit?.summary?.keepTemporarily === 2,
    [retirementAuditPath],
    'The prior audit still supports demotion: analytics are covered, but standalone shell and VEI exploration remain product distinctions.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-studio-demotion-and-county-studio-default-analytics',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  decision:
    failures.length === 0
      ? 'COUNTY_STUDIO_DEFAULT_ANALYTICS_STATISTICS_STUDIO_DEMOTED_TO_LEGACY_SPECIALIST'
      : 'DEMOTION_POSTURE_INCOMPLETE',
  checks,
  failures,
  nextClosure: [
    'Decide whether ad hoc VEI tax-year exploration belongs inside County Studio.',
    'If VEI exploration is migrated or intentionally retired, remove the standalone Statistics Studio shell.',
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
