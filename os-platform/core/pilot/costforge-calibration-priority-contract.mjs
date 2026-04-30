#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'costforge-calibration-priority-contract.latest.json');
const mdOut = path.join(evidenceDir, 'costforge-calibration-priority-contract.latest.md');

const contractId = 'costforge_calibration_priority_v1';
const triagePath = 'frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx';
const auditPath = 'os-platform/core/pilot/contract-adoption-audit.json';
const registryPath = 'os-platform/core/pilot/terrafusion-suite-contracts.json';

function full(relPath) {
  return path.join(repoRoot, relPath);
}

function readText(relPath) {
  return readFileSync(full(relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function check(id, passed, proof, note) {
  return { id, passed, proof, note };
}

function findSurface(audit, surfaceName) {
  return audit.surfaces.find((surface) => surface.surface === surfaceName);
}

const triageExists = existsSync(full(triagePath));
const triageText = triageExists ? readText(triagePath) : '';
const registry = readJson(registryPath);
const audit = readJson(auditPath);
const contract = registry.contracts.find((row) => row.id === contractId);
const triageSurface = findSurface(audit, 'CostForge triage tab');

const expectedPatterns = [
  'COSTFORGE_TRIAGE_CONTRACT_CLASSIFICATION',
  "contractId: 'costforge_calibration_priority_v1'",
  'COSTFORGE_CALIBRATION_PRIORITY_FORMULA',
  'codWeight: 2',
  'ratioWeight: 100',
  'prbWeight: 50',
  'criticalThreshold: 20',
  'watchThreshold: 5',
  'minSales: 3',
  'data-contract-id',
];

const missingPatterns = expectedPatterns.filter((pattern) => !triageText.includes(pattern));

const checks = [
  check(
    'contract-registered',
    Boolean(contract),
    [registryPath],
    'CostForge calibration priority contract is present in the suite registry.',
  ),
  check(
    'contract-required',
    registry.requiredContracts.includes(contractId),
    registry.requiredContracts,
    'Contract is part of the required suite contract list.',
  ),
  check(
    'triage-runtime-echo',
    triageExists && missingPatterns.length === 0,
    missingPatterns.length === 0 ? [triagePath] : missingPatterns,
    'Triage runtime declares contract id, formula constants, thresholds, and UI contract echo.',
  ),
  check(
    'audit-adopted',
    triageSurface?.status === 'pass'
      && triageSurface?.contractBacked === true
      && triageSurface?.contractIds?.includes(contractId)
      && triageSurface?.migrationNeeded === false,
    [auditPath],
    'Contract adoption audit treats CostForge triage as contract-backed instead of advisory/out-of-scope.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'costforge-calibration-priority-contract',
  status: failures.length > 0 ? 'FAIL' : 'PASS',
  decision: failures.length > 0
    ? 'COSTFORGE_CALIBRATION_PRIORITY_CONTRACT_INVALID'
    : 'COSTFORGE_CALIBRATION_PRIORITY_CONTRACT_REGISTERED_AND_ECHOED',
  contractId,
  formula: {
    score: '(max(0, COD - 15) * 2 + abs(medianRatio - 1.0) * 100 + abs(PRB) * 50) * sqrt(max(1, saleCount))',
    criticalThreshold: 20,
    watchThreshold: 5,
    minSales: 3,
  },
  population: contract?.population ?? 'missing',
  readPath: contract?.readPath ?? 'missing',
  trustPosture: contract?.trustPosture ?? [],
  checks,
  failures,
};

function markdown() {
  const rows = checks.map((row) =>
    `| ${row.id} | ${row.passed ? 'PASS' : 'FAIL'} | ${row.proof.map((item) => `\`${item}\``).join('<br>')} | ${row.note} |`,
  );
  const failureRows = failures.length === 0
    ? ['- None.']
    : failures.map((row) => `- ${row.id}: ${row.note}`);

  return `${[
    '# CostForge Calibration Priority Contract',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    `Contract: \`${contractId}\``,
    `Population: ${report.population}`,
    `Read path: ${report.readPath}`,
    '',
    '## Formula',
    '',
    `- Score: ${report.formula.score}`,
    `- Critical threshold: ${report.formula.criticalThreshold}`,
    `- Watch threshold: ${report.formula.watchThreshold}`,
    `- Minimum sales: ${report.formula.minSales}`,
    '',
    '## Checks',
    '',
    '| Check | Result | Proof | Note |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    '## Failures',
    '',
    ...failureRows,
    '',
  ].join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdOut, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  contractId,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/costforge-calibration-priority-contract.latest.json',
    'os-platform/core/pilot/evidence/costforge-calibration-priority-contract.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
