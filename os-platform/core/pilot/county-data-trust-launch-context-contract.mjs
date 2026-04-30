#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'county-data-trust-launch-context-contract.latest.json');
const mdOut = path.join(evidenceDir, 'county-data-trust-launch-context-contract.latest.md');

const contractId = 'county_data_trust_launch_context_v1';
const apiPath = 'frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts';
const pagePath = 'frontend/apps/os-shell/src/pages/forge/atlas-live/AtlasLivePage.tsx';
const auditPath = 'os-platform/core/pilot/contract-adoption-audit.json';
const registryPath = 'os-platform/core/pilot/terrafusion-suite-contracts.json';
const trustTierPath = 'os-platform/core/pilot/county-data-trust-tiers.json';

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

const apiText = existsSync(full(apiPath)) ? readText(apiPath) : '';
const pageText = existsSync(full(pagePath)) ? readText(pagePath) : '';
const registry = readJson(registryPath);
const audit = readJson(auditPath);
const trustTiers = readJson(trustTierPath);
const contract = registry.contracts.find((row) => row.id === contractId);
const atlasContext = audit.surfaces.find((surface) => surface.surface === 'Atlas Live county context');

const requiredApiPatterns = [
  'ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID',
  'county_data_trust_launch_context_v1',
  'buildCountyTrustContext',
  'production_provisional',
  'reference_demo',
  'TerraFusion.Benton.Operational',
  'TerraFusion.Reference39.Demo',
  'productionClaimAllowed',
  'dataTrustMessage',
];
const missingApiPatterns = requiredApiPatterns.filter((pattern) => !apiText.includes(pattern));

const checks = [
  check(
    'contract-registered',
    Boolean(contract),
    [registryPath],
    'County data-trust launch-context contract is registered.',
  ),
  check(
    'contract-required',
    registry.requiredContracts.includes(contractId),
    registry.requiredContracts,
    'Contract is included in the required suite contract list.',
  ),
  check(
    'trust-tier-source-present',
    Boolean(
      trustTiers.tiers?.production_provisional
      && trustTiers.tiers?.reference_demo
      && trustTiers.databasePosture?.['TerraFusion.Benton.Operational']
      && trustTiers.databasePosture?.['TerraFusion.Reference39.Demo'],
    ),
    [trustTierPath],
    'Contract depends on explicit Benton operational/provisional and 39-county reference/demo posture.',
  ),
  check(
    'atlas-api-runtime-echo',
    missingApiPatterns.length === 0,
    missingApiPatterns.length === 0 ? [apiPath] : missingApiPatterns,
    'Atlas county context API emits contract id, trust tier, DB posture, and production-claim posture.',
  ),
  check(
    'atlas-ui-exposes-posture',
    pageText.includes('atlas-county-trust-posture')
      && pageText.includes('data-contract-id')
      && pageText.includes('data-trust-tier')
      && pageText.includes('dataTrustBadges'),
    [pagePath],
    'Atlas Live county context card exposes trust posture and contract id.',
  ),
  check(
    'adoption-audit-promoted',
    atlasContext?.status === 'pass'
      && atlasContext?.contractBacked === true
      && atlasContext?.contractIds?.includes(contractId)
      && atlasContext?.migrationNeeded === false,
    [auditPath],
    'Contract adoption audit treats Atlas county context as contract-backed.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'county-data-trust-launch-context-contract',
  status: failures.length > 0 ? 'FAIL' : 'PASS',
  decision: failures.length > 0
    ? 'COUNTY_DATA_TRUST_LAUNCH_CONTEXT_CONTRACT_INVALID'
    : 'COUNTY_DATA_TRUST_LAUNCH_CONTEXT_CONTRACT_REGISTERED_AND_ECHOED',
  contractId,
  population: contract?.population ?? 'missing',
  readPath: contract?.readPath ?? 'missing',
  trustPosture: contract?.trustPosture ?? [],
  tierRules: {
    benton: 'production_provisional + sync_derived + converted_legacy_sensitive',
    washingtonReferenceDefault: 'reference_demo',
  },
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
    '# County Data Trust Launch Context Contract',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    `Contract: \`${contractId}\``,
    `Population: ${report.population}`,
    `Read path: ${report.readPath}`,
    '',
    '## Tier Rules',
    '',
    `- Benton: ${report.tierRules.benton}`,
    `- Washington reference default: ${report.tierRules.washingtonReferenceDefault}`,
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
    'os-platform/core/pilot/evidence/county-data-trust-launch-context-contract.latest.json',
    'os-platform/core/pilot/evidence/county-data-trust-launch-context-contract.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
