#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const countyWorkbenchPath = 'frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx';
const countyWorkbenchTestPath = 'frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CountyStatisticsWorkbenchPanel.test.tsx';
const retirementAuditPath = 'os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.json';

function readText(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
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

const workbench = readText(countyWorkbenchPath);
const workbenchTest = readText(countyWorkbenchTestPath);

const checks = [
  check(
    'county-studio-owns-vei-tax-year-state',
    /const \[veiTaxYear, setVeiTaxYear\] = useState\(taxYear\)/.test(workbench)
      && /setVeiTaxYear\(taxYear\)/.test(workbench),
    [
      ref(countyWorkbenchPath, /const \[veiTaxYear, setVeiTaxYear\]/),
      ref(countyWorkbenchPath, /setVeiTaxYear\(taxYear\)/),
    ],
    'VEI exploration state lives in County Studio and resets when the active study changes.',
  ),
  check(
    'vei-query-uses-exploration-tax-year',
    /county-studio-neighborhood-snapshots-equity', veiTaxYear/.test(workbench)
      && /comparison-snapshots\?taxYear=\$\{veiTaxYear\}/.test(workbench),
    [
      ref(countyWorkbenchPath, /county-studio-neighborhood-snapshots-equity', veiTaxYear/),
      ref(countyWorkbenchPath, /comparison-snapshots\?taxYear=\$\{veiTaxYear\}/),
    ],
    'Only the VEI neighborhood snapshot query moves with the exploration tax year.',
  ),
  check(
    'vei-selector-is-not-noop',
    /selectedTaxYear=\{veiTaxYear\}/.test(workbench)
      && /onTaxYearChange=\{setVeiTaxYear\}/.test(workbench)
      && !/onTaxYearChange=\{\(\) => \{\}\}/.test(workbench),
    [
      ref(countyWorkbenchPath, /selectedTaxYear=\{veiTaxYear\}/),
      ref(countyWorkbenchPath, /onTaxYearChange=\{setVeiTaxYear\}/),
    ],
    'County Studio VEI tax-year selector is interactive rather than pinned/no-op.',
  ),
  check(
    'study-statistics-remain-anchored',
    /setStudyFilter\(\{ taxYear, countyId: activeStudy\.countyId \}\)/.test(workbench)
      && /county-studio-ratio-study-trends', taxYear/.test(workbench),
    [
      ref(countyWorkbenchPath, /setStudyFilter\(\{ taxYear, countyId: activeStudy\.countyId \}\)/),
      ref(countyWorkbenchPath, /county-studio-ratio-study-trends', taxYear/),
    ],
    'Non-VEI statistics stay anchored to the active study tax year.',
  ),
  check(
    'ui-test-covers-vei-exploration-without-study-filter-mutation',
    /lets County Studio VEI explore another tax year/.test(workbenchTest)
      && /taxYear: 2025/.test(workbenchTest)
      && /not\.toHaveBeenCalledWith/.test(workbenchTest),
    [
      ref(countyWorkbenchTestPath, /lets County Studio VEI explore another tax year/),
      ref(countyWorkbenchTestPath, /taxYear: 2025/),
    ],
    'The regression test proves VEI exploration does not rewrite the study-scoped statistics filter.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'county-studio-vei-ad-hoc-exploration',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  decision:
    failures.length === 0
      ? 'VEI_AD_HOC_EXPLORATION_MIGRATED_TO_COUNTY_STUDIO'
      : 'VEI_AD_HOC_EXPLORATION_STILL_BLOCKED',
  checks,
  failures,
  retirementAuditPath,
  nextClosure: [
    'Rerun the Statistics Studio retirement gap audit after migration.',
    'If the audit reports standalone shell only, remove or hide the Statistics Studio entrypoint in a separate slice.',
  ],
};

function markdown() {
  const lines = [
    '# County Studio VEI Ad Hoc Exploration',
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
const jsonPath = path.join(evidenceDir, 'county-studio-vei-ad-hoc-exploration.latest.json');
const mdPath = path.join(evidenceDir, 'county-studio-vei-ad-hoc-exploration.latest.md');
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/county-studio-vei-ad-hoc-exploration.latest.json',
    'os-platform/core/pilot/evidence/county-studio-vei-ad-hoc-exploration.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
