#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'costforge-cost-value-contract.latest.json');
const mdOut = path.join(evidenceDir, 'costforge-cost-value-contract.latest.md');

const contractId = 'costforge_cost_value_v1';
const modulePath = 'frontend/apps/os-shell/src/pages/suites/modules/CostForgeModule.tsx';
const servicePath = 'frontend/apps/os-shell/src/services/forgeService.ts';
const testPath = 'frontend/apps/os-shell/src/pages/suites/modules/__tests__/CostForgeModule.contracts.test.tsx';
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
const costSurface = findSurface(audit, 'CostForge calculator module');

const requiredModulePatterns = [
  'COSTFORGE_COST_VALUE_CONTRACT',
  "contractId: 'costforge_cost_value_v1'",
  'matrixYear: 2025',
  'buildingTypeCount: 14',
  'regionCount: 3',
  'parcelBoundRequired: true',
  "apiVerificationPath: '/costforge/calculate'",
  "commitToolId: 'assemble_boe_packet'",
  'calculateCost',
  'verifyViaApi',
  'handleCommitCostValue',
  'costforge-cost-value-contract-classification',
  'data-contract-id',
];

const requiredServicePatterns = [
  'COST_MATRIX',
  'Matrix Year 2025',
  'DEPRECIATION_CONFIG',
  'calculateCost',
  'rcnNew',
  'depreciation',
  'rcnld',
  'matrixSource',
];

const requiredTestPatterns = [
  'CostForgeModule contract classification',
  'costforge-cost-value-contract-classification',
  'costforge_cost_value_v1',
  'local RCNLD is a preview until API verification',
];

const missingModulePatterns = requiredModulePatterns.filter((pattern) => !moduleText.includes(pattern));
const missingServicePatterns = requiredServicePatterns.filter((pattern) => !serviceText.includes(pattern));
const missingTestPatterns = requiredTestPatterns.filter((pattern) => !testText.includes(pattern));

const checks = [
  check(
    'contract-registered',
    Boolean(contract),
    [registryPath],
    'CostForge cost-value contract is present in the suite registry.',
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
    'CostForge module declares contract id, matrix policy, API verification path, commit tool, and UI contract echo.',
  ),
  check(
    'cost-engine-boundary',
    serviceExists && missingServicePatterns.length === 0,
    missingServicePatterns.length === 0 ? [servicePath] : missingServicePatterns,
    'Forge service contains cost matrix, depreciation, RCN, RCNLD, and matrix-source calculation boundary.',
  ),
  check(
    'ui-contract-test',
    testExists && missingTestPatterns.length === 0,
    missingTestPatterns.length === 0 ? [testPath] : missingTestPatterns,
    'Focused CostForge module test proves the contract posture is visible in the module.',
  ),
  check(
    'audit-adopted',
    costSurface?.status === 'pass'
      && costSurface?.contractBacked === true
      && costSurface?.contractIds?.includes(contractId)
      && costSurface?.migrationNeeded === false,
    [auditPath],
    'Contract adoption audit treats CostForge calculator output as contract-backed instead of future out-of-scope work.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'costforge-cost-value-contract',
  status: failures.length > 0 ? 'FAIL' : 'PASS',
  decision: failures.length > 0
    ? 'COSTFORGE_COST_VALUE_CONTRACT_INVALID'
    : 'COSTFORGE_COST_VALUE_CONTRACT_REGISTERED_AND_ECHOED',
  contractId,
  policy: {
    matrixYear: 2025,
    buildingTypeCount: 14,
    regionCount: 3,
    parcelBoundRequired: true,
    apiVerificationPath: '/costforge/calculate',
    commitToolId: 'assemble_boe_packet',
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
    '# CostForge Cost Value Contract',
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
    `- Matrix year: ${report.policy.matrixYear}`,
    `- Building types: ${report.policy.buildingTypeCount}`,
    `- Regions: ${report.policy.regionCount}`,
    `- Parcel-bound required: ${report.policy.parcelBoundRequired}`,
    `- API verification path: ${report.policy.apiVerificationPath}`,
    `- Commit tool: ${report.policy.commitToolId}`,
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
    'os-platform/core/pilot/evidence/costforge-cost-value-contract.latest.json',
    'os-platform/core/pilot/evidence/costforge-cost-value-contract.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
