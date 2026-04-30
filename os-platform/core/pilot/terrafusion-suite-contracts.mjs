#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const registryPath = 'os-platform/core/pilot/terrafusion-suite-contracts.json';
const trustTierPath = 'os-platform/core/pilot/county-data-trust-tiers.json';
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'terrafusion-suite-contracts.latest.json');
const mdOut = path.join(evidenceDir, 'terrafusion-suite-contracts.latest.md');

function full(relPath) {
  return path.join(repoRoot, relPath);
}

function readText(relPath) {
  return readFileSync(full(relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
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

function patternFromLiteral(literal) {
  return new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

function check(id, passed, proof, note) {
  return { id, passed, proof, note };
}

const registry = readJson(registryPath);
const trustTiers = readJson(trustTierPath);

const requiredFields = [
  'id',
  'version',
  'status',
  'population',
  'purpose',
  'owner',
  'readPath',
  'sourceOfTruth',
  'metrics',
  'trustPosture',
  'proofArtifacts',
  'forbiddenUses',
  'implementationAnchors',
];

const ids = registry.contracts.map((contract) => contract.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const missingRequiredContracts = registry.requiredContracts.filter((id) => !ids.includes(id));

function validateContractShape(contract) {
  const missingFields = requiredFields.filter((field) => {
    const value = contract[field];
    return value == null || (Array.isArray(value) && value.length === 0) || value === '';
  });
  return {
    id: contract.id,
    passed: missingFields.length === 0,
    missingFields,
  };
}

function validateAnchors(contract) {
  return contract.implementationAnchors.flatMap((anchor) => {
    const fileExists = existsSync(full(anchor.path));
    if (!fileExists) {
      return [{
        contractId: contract.id,
        path: anchor.path,
        passed: false,
        missingPatterns: anchor.patterns,
        proof: [anchor.path],
      }];
    }

    const text = readText(anchor.path);
    const missingPatterns = anchor.patterns.filter((pattern) => !patternFromLiteral(pattern).test(text));
    return [{
      contractId: contract.id,
      path: anchor.path,
      passed: missingPatterns.length === 0,
      missingPatterns,
      proof: anchor.patterns
        .filter((pattern) => !missingPatterns.includes(pattern))
        .map((pattern) => ref(anchor.path, patternFromLiteral(pattern))),
    }];
  });
}

function validateProofArtifacts(contract) {
  return contract.proofArtifacts.map((artifact) => ({
    contractId: contract.id,
    path: artifact,
    exists: existsSync(full(artifact)),
  }));
}

function classifyContract(contract) {
  if (contract.status === 'codified') return 'codified';
  if (contract.status === 'registered_implicit_source') return 'registered-needs-runtime-contract-id';
  return contract.status;
}

const shapeChecks = registry.contracts.map(validateContractShape);
const anchorChecks = registry.contracts.flatMap(validateAnchors);
const proofArtifactChecks = registry.contracts.flatMap(validateProofArtifacts);

const checks = [
  check(
    'registry-has-required-contracts',
    missingRequiredContracts.length === 0,
    missingRequiredContracts.length === 0 ? registry.requiredContracts : missingRequiredContracts,
    'The first four suite population contracts are registered.',
  ),
  check(
    'registry-contract-ids-are-unique',
    duplicateIds.length === 0,
    duplicateIds.length === 0 ? ids : duplicateIds,
    'Contract IDs must not fork.',
  ),
  check(
    'county-trust-tier-model-present',
    trustTiers?.tiers?.production_provisional
      && trustTiers?.tiers?.reference_demo
      && trustTiers?.databasePosture?.['TerraFusion.Benton.Operational']
      && trustTiers?.databasePosture?.['TerraFusion.Reference39.Demo'],
    [trustTierPath],
    'Contract proof depends on explicit Benton operational/provisional and 39-county demo/reference posture.',
  ),
  check(
    'all-contracts-have-required-fields',
    shapeChecks.every((row) => row.passed),
    shapeChecks.map((row) => `${row.id}${row.passed ? '' : ` missing ${row.missingFields.join(',')}`}`),
    'Every contract must declare owner, population, read path, metrics, trust posture, proofs, and forbidden uses.',
  ),
  check(
    'implementation-anchors-resolve',
    anchorChecks.every((row) => row.passed),
    anchorChecks.flatMap((row) => row.proof.length > 0 ? row.proof : [`${row.path} missing ${row.missingPatterns.join(',')}`]),
    'Registered contracts must point at real implementation anchors instead of prose-only intent.',
  ),
  check(
    'proof-artifacts-are-attached',
    proofArtifactChecks.every((row) => row.exists),
    proofArtifactChecks.map((row) => `${row.path}${row.exists ? '' : ' missing'}`),
    'Every contract must cite at least one proof artifact already in the repo.',
  ),
  check(
    'agent-enforcement-is-explicit',
    Array.isArray(registry.agentEnforcement?.mustReport)
      && registry.agentEnforcement.mustReport.includes('contract id')
      && registry.agentEnforcement.mustReport.includes('population')
      && registry.agentEnforcement.mustReport.includes('trust posture')
      && Array.isArray(registry.agentEnforcement?.rejectWhen)
      && registry.agentEnforcement.rejectWhen.some((rule) => /metric logic has no registered contract/.test(rule)),
    [registryPath],
    'The AI agent is required to report contract id, population, trust posture, and reject undocumented metric logic.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const migrationGaps = registry.contracts
  .filter((contract) => contract.status !== 'codified')
  .map((contract) => ({
    id: contract.id,
    status: contract.status,
    requiredClosure: 'Echo contractId from runtime DTO/API and make consumers use the registry id directly.',
  }));

const report = {
  checkedAt: new Date().toISOString(),
  slice: 'terrafusion-suite-contract-layer',
  status: failures.length > 0 ? 'FAIL' : migrationGaps.length > 0 ? 'PASS_WITH_MIGRATION_GAPS' : 'PASS',
  decision:
    failures.length > 0
      ? 'SUITE_CONTRACT_REGISTRY_INVALID'
      : migrationGaps.length > 0
        ? 'SUITE_CONTRACTS_REGISTERED_RUNTIME_IDS_STILL_MIGRATING'
        : 'SUITE_CONTRACTS_REGISTERED_AND_CODIFIED',
  doctrine: registry.doctrine,
  requiredContracts: registry.requiredContracts,
  summary: {
    contracts: registry.contracts.length,
    codified: registry.contracts.filter((contract) => contract.status === 'codified').length,
    registeredImplicit: registry.contracts.filter((contract) => contract.status === 'registered_implicit_source').length,
    proofArtifacts: proofArtifactChecks.length,
    missingProofArtifacts: proofArtifactChecks.filter((row) => !row.exists).length,
  },
  checks,
  failures,
  contracts: registry.contracts.map((contract) => ({
    id: contract.id,
    status: contract.status,
    state: classifyContract(contract),
    implementationContractId: contract.implementationContractId ?? null,
    population: contract.population,
    owner: contract.owner,
    readPath: contract.readPath,
    trustPosture: contract.trustPosture,
    proofArtifacts: contract.proofArtifacts,
    forbiddenUses: contract.forbiddenUses,
  })),
  anchorChecks,
  proofArtifactChecks,
  migrationGaps,
  nextClosure: [
    'Add runtime contractId echo fields for registered_implicit_source contracts.',
    'Move remaining TerraForge ratio-study helper endpoints onto the statistics compat contract instead of copy/paste population filters.',
    'Make future AI summaries cite the contract id, population, trust tier, and proof artifact before making metric claims.',
  ],
};

function markdown() {
  const contractRows = report.contracts.map((contract) =>
    `| ${contract.id} | ${contract.status} | ${contract.population} | ${contract.readPath} | ${contract.trustPosture.join('<br>')} |`,
  );
  const checkRows = checks.map((row) =>
    `| ${row.id} | ${row.passed ? 'PASS' : 'FAIL'} | ${row.proof.map((item) => `\`${item}\``).join('<br>')} | ${row.note} |`,
  );
  const gapRows = migrationGaps.length === 0
    ? ['- None.']
    : migrationGaps.map((gap) => `- \`${gap.id}\`: ${gap.requiredClosure}`);

  return `${[
    '# TerraFusion Suite Contracts',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Doctrine',
    '',
    `- Operational record: ${report.doctrine.operationalRecord}`,
    `- Legacy role: ${report.doctrine.legacyRole}`,
    `- Sync role: ${report.doctrine.syncRole}`,
    `- Demo role: ${report.doctrine.demoRole}`,
    `- Solo-dev rule: ${report.doctrine.soloDevRule}`,
    '',
    '## Contract Registry',
    '',
    '| Contract | Status | Population | Read path | Trust posture |',
    '| --- | --- | --- | --- | --- |',
    ...contractRows,
    '',
    '## Checks',
    '',
    '| Check | Result | Proof | Note |',
    '| --- | --- | --- | --- |',
    ...checkRows,
    '',
    '## Migration Gaps',
    '',
    ...gapRows,
    '',
    '## Next Closure',
    '',
    ...report.nextClosure.map((item) => `- ${item}`),
    '',
  ].join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdOut, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  contracts: report.summary.contracts,
  codified: report.summary.codified,
  registeredImplicit: report.summary.registeredImplicit,
  failures: failures.length,
  migrationGaps: migrationGaps.length,
  evidence: [
    'os-platform/core/pilot/evidence/terrafusion-suite-contracts.latest.json',
    'os-platform/core/pilot/evidence/terrafusion-suite-contracts.latest.md'
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
