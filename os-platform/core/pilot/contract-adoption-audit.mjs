#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const auditPath = 'os-platform/core/pilot/contract-adoption-audit.json';
const registryPath = 'os-platform/core/pilot/terrafusion-suite-contracts.json';
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'contract-adoption-audit.latest.json');
const mdOut = path.join(evidenceDir, 'contract-adoption-audit.latest.md');

function full(relPath) {
  return path.join(repoRoot, relPath);
}

function readJson(relPath) {
  return JSON.parse(readFileSync(full(relPath), 'utf8'));
}

function statusRank(status) {
  return {
    pass: 0,
    partial: 1,
    gap: 2,
    outOfScope: 3,
  }[status] ?? 99;
}

const audit = readJson(auditPath);
const registry = readJson(registryPath);
const registeredIds = new Set(registry.contracts.map((contract) => contract.id));
const registeredImplementationIds = new Set(
  registry.contracts
    .map((contract) => contract.implementationContractId)
    .filter(Boolean),
);

const missingRequiredContracts = audit.requiredContracts.filter((id) => !registeredIds.has(id));
const missingSurfacePaths = audit.surfaces
  .filter((surface) => !existsSync(full(surface.path)))
  .map((surface) => surface.path);
const unknownContractIds = audit.surfaces.flatMap((surface) =>
  surface.contractIds
    .filter((id) => !registeredIds.has(id) && !registeredImplementationIds.has(id))
    .map((id) => ({ surface: surface.surface, id })),
);

const counts = audit.surfaces.reduce((acc, surface) => {
  acc[surface.status] = (acc[surface.status] ?? 0) + 1;
  return acc;
}, {});

const migrationGaps = audit.surfaces
  .filter((surface) => surface.migrationNeeded)
  .sort((left, right) => statusRank(left.status) - statusRank(right.status));

const failures = [
  ...missingRequiredContracts.map((id) => ({
    id: 'missing-required-contract',
    proof: id,
    note: 'Audit references a required contract that is not registered.',
  })),
  ...missingSurfacePaths.map((surfacePath) => ({
    id: 'missing-surface-path',
    proof: surfacePath,
    note: 'Audit references a surface file that does not exist.',
  })),
  ...unknownContractIds.map((row) => ({
    id: 'unknown-contract-id',
    proof: `${row.surface}: ${row.id}`,
    note: 'Audit references a contract id that is neither registered nor an implementation alias.',
  })),
];

const report = {
  checkedAt: new Date().toISOString(),
  slice: audit.slice,
  status: failures.length > 0
    ? 'FAIL'
    : migrationGaps.length > 0
      ? 'PASS_WITH_ADOPTION_GAPS'
      : 'PASS',
  decision: failures.length > 0
    ? 'CONTRACT_ADOPTION_AUDIT_INVALID'
    : migrationGaps.length > 0
      ? 'CONTRACT_LAYER_LIVE_ADOPTION_GAPS_FOUND'
      : 'ALL_AUDITED_SURFACES_CONTRACT_ADOPTED',
  baselineContractRegistry: audit.baselineContractRegistry,
  requiredContracts: audit.requiredContracts,
  statusDoctrine: audit.statusDoctrine,
  summary: {
    surfaces: audit.surfaces.length,
    pass: counts.pass ?? 0,
    partial: counts.partial ?? 0,
    gap: counts.gap ?? 0,
    outOfScope: counts.outOfScope ?? 0,
    migrationNeeded: migrationGaps.length,
    failures: failures.length,
  },
  failures,
  surfaces: audit.surfaces,
  migrationGaps,
  nextClosures: audit.nextClosures,
};

function bool(value) {
  return value ? 'yes' : 'no';
}

function contractList(surface) {
  return surface.contractIds.length > 0
    ? surface.contractIds.map((id) => `\`${id}\``).join('<br>')
    : 'none';
}

function markdown() {
  const rows = report.surfaces.map((surface) =>
    `| ${surface.surface} | ${surface.metricBehavior} | ${bool(surface.contractBacked)} | ${contractList(surface)} | ${surface.trustPostureExposed} | ${bool(surface.migrationNeeded)} | ${surface.status} | ${surface.notes} |`,
  );
  const gapRows = report.migrationGaps.map((surface) =>
    `| ${surface.surface} | ${surface.status} | ${surface.path} | ${surface.notes} |`,
  );
  const failureRows = report.failures.length === 0
    ? ['- None.']
    : report.failures.map((failure) => `- ${failure.id}: ${failure.proof} - ${failure.note}`);

  return `${[
    '# Contract Adoption Audit',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Summary',
    '',
    `- Surfaces audited: ${report.summary.surfaces}`,
    `- Pass: ${report.summary.pass}`,
    `- Partial: ${report.summary.partial}`,
    `- Gap: ${report.summary.gap}`,
    `- Out of scope for current four contracts: ${report.summary.outOfScope}`,
    `- Migration needed: ${report.summary.migrationNeeded}`,
    '',
    '## Matrix',
    '',
    '| Surface | Metric/Behavior | Contract-backed | Contract ID | Trust posture exposed | Migration needed | Status | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Migration Gaps',
    '',
    gapRows.length > 0
      ? '| Surface | Status | Path | Notes |\n| --- | --- | --- | --- |\n' + gapRows.join('\n')
      : '- None.',
    '',
    '## Validation Failures',
    '',
    ...failureRows,
    '',
    '## Next Closures',
    '',
    ...report.nextClosures.map((item) => `- ${item}`),
    '',
  ].join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdOut, markdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  surfaces: report.summary.surfaces,
  pass: report.summary.pass,
  partial: report.summary.partial,
  gap: report.summary.gap,
  outOfScope: report.summary.outOfScope,
  migrationNeeded: report.summary.migrationNeeded,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/contract-adoption-audit.latest.json',
    'os-platform/core/pilot/evidence/contract-adoption-audit.latest.md'
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
