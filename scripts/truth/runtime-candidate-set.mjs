#!/usr/bin/env node

/**
 * Track 1F - Runtime Candidate Set
 *
 * Recomputes the June 10 runtime candidate set from the data-source inventory
 * and live runtime registration ledger. This script does not load data or
 * repair endpoints. It only prevents county-name or 39-county wording from
 * implying runtime readiness without evidence.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const outDir = path.join(repoRoot, 'generated', 'truth');
const inventoryPath = path.join(outDir, 'data-source-truth-inventory.json');
const ledgerPath = path.join(outDir, 'county-runtime-registration-ledger.json');
const outJson = path.join(outDir, 'runtime-candidate-set.json');
const outMd = path.join(outDir, 'runtime-candidate-set.md');

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${rel(filePath)}.`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeCounty(value) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return normalized.endsWith('county') ? normalized.slice(0, -'county'.length) : normalized;
}

function summarizeInventory(row) {
  const costForge = row?.costForge ?? {};

  return {
    rowsLanded: Number(row?.rowsLanded ?? 0),
    evidenceCount: Number(row?.evidenceCount ?? 0),
    dbTableTargetExists: Boolean(row?.dbTableTargetExists),
    runtimeApiConsumesIt: Boolean(row?.runtimeApiConsumesIt),
    scraperOrAdapterExists: Boolean(row?.scraperOrAdapterExists),
    trustTier: row?.trustTier ?? 'unknown_untrusted',
    classification: row?.classification ?? 'unknown_untrusted',
    costForgeReadinessTier: costForge.costForgeReadinessTier ?? 'CF0_no_runtime_data',
    costForgeCountyMode: costForge.costForgeCountyMode ?? 'not_available',
  };
}

function hasEvidenceBackedPromotionPath(inventory) {
  return (
    inventory.rowsLanded > 0 &&
    inventory.dbTableTargetExists &&
    inventory.runtimeApiConsumesIt &&
    !['demo_artifact', 'stub_incomplete', 'obsolete'].includes(inventory.classification)
  );
}

function classifyRuntimeCandidate(row, inventory) {
  if (row.silentBentonFallbackDetected) {
    return {
      runtimeCandidateClass: 'blocked_fallback_violation',
      june10Action: 'ship_blocker',
      blockers: ['Silent Benton fallback detected.'],
    };
  }

  if (row.readinessClass === 'runtime_proven') {
    return {
      runtimeCandidateClass: 'runtime_proven',
      june10Action: 'ship_runtime_scope',
      blockers: [],
    };
  }

  if (row.readinessClass === 'registered_empty') {
    return {
      runtimeCandidateClass: 'registered_empty',
      june10Action: 'needs_data_load_before_runtime_claim',
      blockers: ['County is registered but returns zero runtime rows.'],
    };
  }

  if (row.readinessClass === 'endpoint_error') {
    return {
      runtimeCandidateClass: 'endpoint_error',
      june10Action: 'ship_blocker',
      blockers: ['County runtime endpoint returned an error.'],
    };
  }

  if (row.readinessClass === 'not_registered' && hasEvidenceBackedPromotionPath(inventory)) {
    return {
      runtimeCandidateClass: 'evidence_backed_load_candidate',
      june10Action: 'may_promote_after_registration',
      blockers: ['County has inventory evidence but is not registered in runtime.'],
    };
  }

  return {
    runtimeCandidateClass: 'downgraded_no_runtime_evidence',
    june10Action: 'provenance_inventory_only',
    blockers: ['County lacks the inventory evidence required for runtime promotion.'],
  };
}

function buildRows(inventoryReport, ledgerReport) {
  const inventoryByCounty = new Map(
    (inventoryReport.rows ?? []).map(row => [normalizeCounty(row.county), summarizeInventory(row)])
  );

  return (ledgerReport.rows ?? []).map(row => {
    const inventory =
      inventoryByCounty.get(normalizeCounty(row.county)) ?? summarizeInventory(null);
    const classification = classifyRuntimeCandidate(row, inventory);

    return {
      county: row.county,
      countyToken: row.countyToken,
      parcelStatus: row.parcels?.status ?? null,
      parcelRows: row.parcels?.runtimeRows ?? 0,
      readinessClass: row.readinessClass,
      ledgerRecommendedAction: row.recommendedAction,
      inventory,
      evidenceBackedPromotionPath: hasEvidenceBackedPromotionPath(inventory),
      ...classification,
    };
  });
}

function summarize(rows) {
  const count = runtimeCandidateClass =>
    rows.filter(row => row.runtimeCandidateClass === runtimeCandidateClass).length;
  const actionCount = june10Action => rows.filter(row => row.june10Action === june10Action).length;
  const runtimeProvenRows = rows.filter(row => row.runtimeCandidateClass === 'runtime_proven');
  const evidenceBackedLoadCandidates = rows.filter(
    row => row.runtimeCandidateClass === 'evidence_backed_load_candidate'
  );
  const shipBlockers = rows.filter(row => row.june10Action === 'ship_blocker');

  const bentonOnlyRuntimePilot =
    runtimeProvenRows.length === 1 &&
    normalizeCounty(runtimeProvenRows[0].county) === 'benton' &&
    evidenceBackedLoadCandidates.length === 0 &&
    shipBlockers.length === 0;

  return {
    countiesChecked: rows.length,
    runtimeProven: count('runtime_proven'),
    evidenceBackedLoadCandidates: count('evidence_backed_load_candidate'),
    registeredEmpty: count('registered_empty'),
    endpointErrors: count('endpoint_error'),
    fallbackViolations: count('blocked_fallback_violation'),
    downgradedNoRuntimeEvidence: count('downgraded_no_runtime_evidence'),
    shipRuntimeScope: actionCount('ship_runtime_scope'),
    mayPromoteAfterRegistration: actionCount('may_promote_after_registration'),
    provenanceInventoryOnly: actionCount('provenance_inventory_only'),
    needsDataLoadBeforeRuntimeClaim: actionCount('needs_data_load_before_runtime_claim'),
    shipBlockers: actionCount('ship_blocker'),
    june10RuntimeScope: bentonOnlyRuntimePilot
      ? 'benton_only_runtime_pilot'
      : 'runtime_scope_requires_review',
    prohibit39CountyRuntimeClaim: true,
    allowedRuntimeClaim: bentonOnlyRuntimePilot
      ? 'Benton runtime pilot only; 39-county data remains provenance/inventory, not runtime readiness.'
      : 'Runtime scope requires review before any June 10 runtime claim.',
  };
}

function renderMarkdown(report) {
  const rows = report.rows.map(row =>
    [
      row.county,
      row.parcelStatus ?? '-',
      row.parcelRows,
      row.inventory.rowsLanded,
      row.inventory.dbTableTargetExists ? 'yes' : 'no',
      row.inventory.runtimeApiConsumesIt ? 'yes' : 'no',
      row.inventory.classification,
      row.inventory.costForgeReadinessTier,
      row.runtimeCandidateClass,
      row.june10Action,
      row.blockers.length ? row.blockers.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# Runtime Candidate Set',
    '',
    `Generated: ${report.generatedAt}`,
    `Inventory: \`${report.inputs.inventoryPath}\``,
    `Ledger: \`${report.inputs.ledgerPath}\``,
    '',
    '## Summary',
    '',
    `- Counties checked: ${report.summary.countiesChecked}`,
    `- Runtime proven: ${report.summary.runtimeProven}`,
    `- Evidence-backed load candidates: ${report.summary.evidenceBackedLoadCandidates}`,
    `- Registered empty: ${report.summary.registeredEmpty}`,
    `- Endpoint errors: ${report.summary.endpointErrors}`,
    `- Fallback violations: ${report.summary.fallbackViolations}`,
    `- Downgraded no-runtime-evidence: ${report.summary.downgradedNoRuntimeEvidence}`,
    `- June 10 runtime scope: ${report.summary.june10RuntimeScope}`,
    `- 39-county runtime claim prohibited: ${report.summary.prohibit39CountyRuntimeClaim ? 'yes' : 'no'}`,
    `- Allowed runtime claim: ${report.summary.allowedRuntimeClaim}`,
    '',
    '## Candidate Ledger',
    '',
    '| County | Parcel Status | Parcel Rows | Inventory Rows | DB Target | Runtime API Evidence | Inventory Class | CostForge Tier | Runtime Candidate Class | June 10 Action | Blockers |',
    '|---|---:|---:|---:|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Scope Rule',
    '',
    'A county may not be described as runtime-ready unless it is runtime-proven or has evidence-backed promotion work remaining. County names, public-data coverage docs, CostForge input fragments, and provenance inventory alone do not create runtime status.',
  ].join('\n');
}

function main() {
  const inventoryReport = readJson(inventoryPath, 'Data source inventory');
  const ledgerReport = readJson(ledgerPath, 'County runtime registration ledger');
  const rows = buildRows(inventoryReport, ledgerReport);
  const report = {
    generatedAt: new Date().toISOString(),
    inputs: {
      inventoryPath: rel(inventoryPath),
      ledgerPath: rel(ledgerPath),
    },
    summary: summarize(rows),
    rows,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(report.summary, null, 2));

  if (report.summary.shipBlockers > 0) {
    process.exitCode = 1;
  }
}

main();
