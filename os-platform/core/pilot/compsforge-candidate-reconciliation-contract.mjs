#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'compsforge-candidate-reconciliation-contract.latest.json');
const mdOut = path.join(evidenceDir, 'compsforge-candidate-reconciliation-contract.latest.md');

const contractId = 'compsforge_candidate_reconciliation_v1';
const modulePath = 'frontend/apps/os-shell/src/pages/suites/modules/CompsForgeModule.tsx';
const servicePath = 'frontend/apps/os-shell/src/services/comparableSalesService.ts';
const testPath = 'frontend/apps/os-shell/src/pages/suites/modules/__tests__/CompsForgeModule.deeplink.test.tsx';
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

const moduleExists = existsSync(full(modulePath));
const serviceExists = existsSync(full(servicePath));
const testExists = existsSync(full(testPath));
const moduleText = moduleExists ? readText(modulePath) : '';
const serviceText = serviceExists ? readText(servicePath) : '';
const testText = testExists ? readText(testPath) : '';
const registry = readJson(registryPath);
const audit = readJson(auditPath);
const contract = registry.contracts.find((row) => row.id === contractId);
const compsSurface = findSurface(audit, 'CompsForge module');

const requiredModulePatterns = [
  'COMPSFORGE_CANDIDATE_RECONCILIATION_CONTRACT',
  "contractId: 'compsforge_candidate_reconciliation_v1'",
  'qualifiedOnlyDefault: true',
  'saleWindowDefault: INITIAL_SALE_WINDOW',
  'maxCandidates: 30',
  'defaultSelectedCandidates: 3',
  "governedAdjustmentCountyCode: '005'",
  'findCompsForSubject',
  'adjustComp',
  'reconcileComps',
  'compsforge-contract-classification',
  'data-contract-id',
];

const requiredServicePatterns = [
  'filterComps',
  'saleDateRange',
  'qualifiedOnly',
  'scoreSimilarity',
  'findCompsForSubject',
  'supportsGovernedComparableAdjustments',
  'adjustComp',
  'reconcileComps',
  '/api/costforge',
];

const requiredTestPatterns = [
  'declares the candidate reconciliation contract posture',
  'compsforge-contract-classification',
  'compsforge_candidate_reconciliation_v1',
  'governed adjustment and reconciliation remain Benton-certified',
];

const missingModulePatterns = requiredModulePatterns.filter((pattern) => !moduleText.includes(pattern));
const missingServicePatterns = requiredServicePatterns.filter((pattern) => !serviceText.includes(pattern));
const missingTestPatterns = requiredTestPatterns.filter((pattern) => !testText.includes(pattern));

const checks = [
  check(
    'contract-registered',
    Boolean(contract),
    [registryPath],
    'CompsForge candidate/reconciliation contract is present in the suite registry.',
  ),
  check(
    'contract-required',
    registry.requiredContracts.includes(contractId),
    registry.requiredContracts,
    'Contract is part of the required suite contract list.',
  ),
  check(
    'module-runtime-echo',
    moduleExists && missingModulePatterns.length === 0,
    missingModulePatterns.length === 0 ? [modulePath] : missingModulePatterns,
    'CompsForge module declares contract id, candidate policy, Benton-only governed adjustment posture, and UI contract echo.',
  ),
  check(
    'service-selection-and-reconciliation-boundary',
    serviceExists && missingServicePatterns.length === 0,
    missingServicePatterns.length === 0 ? [servicePath] : missingServicePatterns,
    'Comparable sales service contains the filter, score, candidate selection, CostForge adjustment, and reconciliation boundaries.',
  ),
  check(
    'ui-contract-test',
    testExists && missingTestPatterns.length === 0,
    missingTestPatterns.length === 0 ? [testPath] : missingTestPatterns,
    'Focused CompsForge test proves the contract posture is visible in the module.',
  ),
  check(
    'audit-adopted',
    compsSurface?.status === 'pass'
      && compsSurface?.contractBacked === true
      && compsSurface?.contractIds?.includes(contractId)
      && compsSurface?.migrationNeeded === false,
    [auditPath],
    'Contract adoption audit treats CompsForge as contract-backed instead of future out-of-scope work.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'compsforge-candidate-reconciliation-contract',
  status: failures.length > 0 ? 'FAIL' : 'PASS',
  decision: failures.length > 0
    ? 'COMPSFORGE_CANDIDATE_RECONCILIATION_CONTRACT_INVALID'
    : 'COMPSFORGE_CANDIDATE_RECONCILIATION_CONTRACT_REGISTERED_AND_ECHOED',
  contractId,
  policy: {
    qualifiedOnlyDefault: true,
    saleWindowDefault: {
      start: '2016-01-01',
      end: '2026-12-31',
    },
    maxCandidates: 30,
    defaultSelectedCandidates: 3,
    governedAdjustmentCountyCode: '005',
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
    '# CompsForge Candidate Reconciliation Contract',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    `Contract: \`${contractId}\``,
    `Population: ${report.population}`,
    `Read path: ${report.readPath}`,
    '',
    '## Policy',
    '',
    `- Qualified-only default: ${report.policy.qualifiedOnlyDefault}`,
    `- Sale window: ${report.policy.saleWindowDefault.start} through ${report.policy.saleWindowDefault.end}`,
    `- Candidate cap: ${report.policy.maxCandidates}`,
    `- Default selected candidates: ${report.policy.defaultSelectedCandidates}`,
    `- Governed adjustment county: ${report.policy.governedAdjustmentCountyCode}`,
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
    'os-platform/core/pilot/evidence/compsforge-candidate-reconciliation-contract.latest.json',
    'os-platform/core/pilot/evidence/compsforge-candidate-reconciliation-contract.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
