#!/usr/bin/env node

/**
 * June 10 Readiness Packet
 *
 * Summarizes the generated truth artifacts into one operator-readable packet.
 * This script does not repair data, mutate DB state, or contact upstream systems.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'june10-readiness-packet.json');
const outMd = path.join(truthDir, 'june10-readiness-packet.md');

const artifacts = {
  crosswalk: 'washington-39-county-data-crosswalk.json',
  countyRuntimeContract: 'county-runtime-contract.json',
  dbIdentity: 'runtime-db-identity.json',
  dbContent: 'runtime-db-content-audit.json',
  productLoadLedger: 'terrafusion-db-product-load-ledger.json',
  bentonParcelSanity: 'benton-parcel-count-sanity.json',
  saleQualification: 'runtime-sale-qualification-lineage-proof.json',
  bentonPilotClosure: 'benton-runtime-pilot-closure.json',
};

const blockerRunbook = {
  crosswalk: {
    ownerLane: 'Codex',
    nextCommand: 'pnpm run truth:washington-39-county-data-crosswalk',
    requiredResolution:
      'Keep 39-county runtime claims prohibited unless every promoted county has TerraFusion DB runtime proof.',
  },
  countyRuntimeContract: {
    ownerLane: 'Codex after TerraFusion DB receipts',
    nextCommand: 'pnpm run truth:county-runtime-contract',
    requiredResolution:
      'Each runtime county must pass identity, active/current semantics, product-load receipt, no fallback, and no PII projection checks.',
  },
  dbIdentity: {
    ownerLane: 'Claude Code / Sync DB, audited by Codex',
    nextCommand: 'pnpm run truth:runtime-db-identity',
    requiredResolution:
      'Prove the running API is connected to the intended TerraFusion DB before any row count can support readiness.',
  },
  dbContent: {
    ownerLane: 'Claude Code / Sync DB, audited by Codex',
    nextCommand: 'pnpm run truth:runtime-db-content',
    requiredResolution:
      'Prove product runtime tables and row shapes exist inside TerraFusion DB only.',
  },
  productLoadLedger: {
    ownerLane: 'Claude Code / Sync DB, audited by Codex',
    nextCommand: 'pnpm run truth:terrafusion-db-product-load-ledger',
    requiredResolution:
      'Emit/read product-load receipts proving TerraFusion DB table rows were loaded through the approved ingestion path.',
  },
  bentonParcelSanity: {
    ownerLane: 'Codex after TerraFusion DB content is refreshed',
    nextCommand: 'pnpm run truth:benton-parcel-count-sanity',
    requiredResolution:
      'Prove Benton parcel endpoint counts active/current distinct parcels, not raw historical or duplicate property rows.',
  },
  saleQualification: {
    ownerLane: 'Codex after TerraFusion DB sales/qualification tables are refreshed',
    nextCommand: 'pnpm run truth:runtime-sale-qualification',
    requiredResolution:
      'Prove Benton sales qualification lineage from TerraFusion DB runtime tables, with no source-system dependency in product runtime.',
  },
  bentonPilotClosure: {
    ownerLane: 'Codex after all Benton data gates are green',
    nextCommand: 'pnpm run truth:benton-runtime-pilot-closure',
    requiredResolution:
      'Prove Benton runtime pilot closure only after DB identity, content, load receipts, parcel sanity, and sale qualification pass.',
  },
};

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function readArtifact(name) {
  const filePath = path.join(truthDir, artifacts[name]);
  if (!fs.existsSync(filePath)) {
    return {
      name,
      path: rel(filePath),
      present: false,
      value: null,
    };
  }

  try {
    return {
      name,
      path: rel(filePath),
      present: true,
      value: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    };
  } catch (error) {
    return {
      name,
      path: rel(filePath),
      present: true,
      value: null,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function blocker(blockers, source, message) {
  blockers.push({ source, message });
}

function collectBlockers(loaded) {
  const blockers = [];
  const warnings = [];

  for (const artifact of Object.values(loaded)) {
    if (!artifact.present) {
      blocker(blockers, artifact.name, `Required artifact is missing: ${artifact.path}.`);
    }
    if (artifact.parseError) {
      blocker(blockers, artifact.name, `Artifact could not be parsed: ${artifact.parseError}.`);
    }
  }

  const crosswalk = loaded.crosswalk.value;
  const countyRuntimeContract = loaded.countyRuntimeContract.value;
  const dbIdentity = loaded.dbIdentity.value;
  const dbContent = loaded.dbContent.value;
  const productLoadLedger = loaded.productLoadLedger.value;
  const bentonParcelSanity = loaded.bentonParcelSanity.value;
  const saleQualification = loaded.saleQualification.value;
  const bentonPilotClosure = loaded.bentonPilotClosure.value;

  if (crosswalk?.summary?.prohibit39CountyRuntimeClaim !== true) {
    blocker(blockers, 'crosswalk', '39-county runtime claim is not explicitly prohibited.');
  }

  if (
    Number(crosswalk?.summary?.runtimeProven ?? 0) >
    Number(countyRuntimeContract?.summary?.runtimeContractPass ?? 0)
  ) {
    warnings.push({
      source: 'crosswalk',
      message: `Crosswalk reports ${crosswalk.summary.runtimeProven} runtime-proven counties; confirm county runtime contract also passes them.`,
    });
  }

  if (loaded.countyRuntimeContract.present && countyRuntimeContract?.passed !== true) {
    blocker(blockers, 'countyRuntimeContract', 'County-neutral runtime contract is not passing.');
  }

  if (loaded.dbIdentity.present && dbIdentity?.passed !== true) {
    blocker(blockers, 'dbIdentity', 'Running API TerraFusion DB identity is not proven.');
  }

  if (loaded.dbContent.present && dbContent?.passed !== true) {
    blocker(blockers, 'dbContent', 'Runtime TerraFusion DB content audit is not passing.');
  }

  if (loaded.productLoadLedger.present && productLoadLedger?.passed !== true) {
    blocker(
      blockers,
      'productLoadLedger',
      'TerraFusion DB product load ledger is not lineage-proven.'
    );
  }

  if (loaded.bentonParcelSanity.present && bentonParcelSanity?.passed !== true) {
    blocker(
      blockers,
      'bentonParcelSanity',
      'Benton active/current parcel count sanity is not proven.'
    );
  }

  if (
    loaded.saleQualification.present &&
    saleQualification?.passed !== true &&
    saleQualification?.status !== 'PASS'
  ) {
    blocker(blockers, 'saleQualification', 'Benton sale qualification lineage is not passing.');
  }

  if (
    loaded.bentonPilotClosure.present &&
    bentonPilotClosure?.status !== 'PASS' &&
    bentonPilotClosure?.status !== 'PASS_WITH_WARNINGS'
  ) {
    blocker(blockers, 'bentonPilotClosure', 'Benton runtime pilot closure is not passing.');
  }

  return { blockers, warnings };
}

function buildDomainSummary(loaded) {
  const crosswalkSummary = loaded.crosswalk.value?.summary ?? {};
  const contractSummary = loaded.countyRuntimeContract.value?.summary ?? {};
  const loadSummary = loaded.productLoadLedger.value?.summary ?? {};

  return {
    countyScope: {
      countiesChecked: crosswalkSummary.countiesChecked ?? 0,
      runtimeProven: crosswalkSummary.runtimeProven ?? 0,
      publicSourceSeed: crosswalkSummary.publicSourceSeed ?? 0,
      provenanceInventoryOnly:
        crosswalkSummary.provenanceInventoryOnly ?? crosswalkSummary.referenceDemo ?? 0,
      prohibit39CountyRuntimeClaim: crosswalkSummary.prohibit39CountyRuntimeClaim === true,
    },
    runtimeContract: {
      runtimeContractPass: contractSummary.runtimeContractPass ?? 0,
      runtimeContractBlocked: contractSummary.runtimeContractBlocked ?? 0,
      prohibit39CountyRuntimeClaim: contractSummary.prohibit39CountyRuntimeClaim === true,
    },
    terraFusionDb: {
      dbIdentityPassed: loaded.dbIdentity.value?.passed === true,
      dbContentPassed: loaded.dbContent.value?.passed === true,
      productLoadLedgerPassed: loaded.productLoadLedger.value?.passed === true,
      productTablesChecked: loadSummary.productTablesChecked ?? 0,
      lineageProven: loadSummary.lineageProven ?? 0,
      rowsExistLineageUnproven: loadSummary.rowsExistLineageUnproven ?? 0,
      emptyTables: loadSummary.emptyTables ?? 0,
    },
    bentonPilot: {
      parcelSanityPassed: loaded.bentonParcelSanity.value?.passed === true,
      saleQualificationStatus:
        loaded.saleQualification.value?.status ??
        (loaded.saleQualification.value?.passed === true ? 'PASS' : 'UNKNOWN'),
      pilotClosureStatus: loaded.bentonPilotClosure.value?.status ?? 'UNKNOWN',
    },
  };
}

function buildExecutionQueue(blockers) {
  const seen = new Set();

  return blockers
    .filter(item => !seen.has(item.source) && seen.add(item.source))
    .map(item => {
      const runbook = blockerRunbook[item.source] ?? {
        ownerLane: 'Codex',
        nextCommand: 'pnpm run readiness:june10',
        requiredResolution: 'Investigate and clear this readiness blocker.',
      };

      return {
        source: item.source,
        ownerLane: runbook.ownerLane,
        nextCommand: runbook.nextCommand,
        requiredResolution: runbook.requiredResolution,
      };
    });
}

function artifactBlockers(value) {
  const direct = Array.isArray(value?.blockers) ? value.blockers : [];
  const summary = Array.isArray(value?.summary?.blockers) ? value.summary.blockers : [];
  const rowBlockers = Array.isArray(value?.rows)
    ? value.rows.flatMap(row =>
        (Array.isArray(row?.blockers) ? row.blockers : []).map(
          item => `${row?.tableName ?? row?.county ?? 'row'}: ${item}`
        )
      )
    : [];
  const proofBlockers = Array.isArray(value?.proofs)
    ? value.proofs.flatMap(proof =>
        (Array.isArray(proof?.blockers) ? proof.blockers : []).map(
          item => `${proof?.county ?? 'proof'}: ${item}`
        )
      )
    : [];

  return [...new Set([...direct, ...summary, ...rowBlockers, ...proofBlockers])].map(item =>
    String(item)
  );
}

function artifactWarnings(value) {
  const direct = Array.isArray(value?.warnings) ? value.warnings : [];
  const summary = Array.isArray(value?.summary?.warnings) ? value.summary.warnings : [];
  const rowWarnings = Array.isArray(value?.rows)
    ? value.rows.flatMap(row =>
        (Array.isArray(row?.warnings) ? row.warnings : []).map(
          item => `${row?.tableName ?? row?.county ?? 'row'}: ${item}`
        )
      )
    : [];

  return [...new Set([...direct, ...summary, ...rowWarnings])].map(item => String(item));
}

function capList(items, limit = 20) {
  return {
    items: items.slice(0, limit),
    omitted: Math.max(0, items.length - limit),
  };
}

function buildArtifactDetails(loaded, blockers) {
  const sources = new Set(blockers.map(item => item.source));
  return Object.fromEntries(
    Object.entries(loaded)
      .filter(([name]) => sources.has(name))
      .map(([name, artifact]) => [
        name,
        {
          present: artifact.present,
          blockers: capList(artifactBlockers(artifact.value)),
          warnings: capList(artifactWarnings(artifact.value)),
        },
      ])
  );
}

function renderMarkdown(report) {
  return [
    '# June 10 Readiness Packet',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Status',
    '',
    `- Result: ${report.status}`,
    `- Ship blockers: ${report.shipBlockers.length}`,
    `- Warnings: ${report.warnings.length}`,
    '',
    '## Source Of Truth Boundary',
    '',
    '- TerraFusion DB is the application/product source of truth.',
    '- Legacy/public systems are upstream inputs only.',
    '- Product runtime must read TerraFusion DB through TerraFusion API.',
    '',
    '## County Scope',
    '',
    `- Counties checked: ${report.summary.countyScope.countiesChecked}`,
    `- Runtime proven by crosswalk: ${report.summary.countyScope.runtimeProven}`,
    `- Public-source seed: ${report.summary.countyScope.publicSourceSeed}`,
    `- Provenance inventory only: ${report.summary.countyScope.provenanceInventoryOnly}`,
    `- 39-county runtime claim prohibited: ${report.summary.countyScope.prohibit39CountyRuntimeClaim ? 'yes' : 'no'}`,
    '',
    '## TerraFusion DB',
    '',
    `- DB identity passed: ${report.summary.terraFusionDb.dbIdentityPassed ? 'yes' : 'no'}`,
    `- DB content passed: ${report.summary.terraFusionDb.dbContentPassed ? 'yes' : 'no'}`,
    `- Product load ledger passed: ${report.summary.terraFusionDb.productLoadLedgerPassed ? 'yes' : 'no'}`,
    `- Product tables checked: ${report.summary.terraFusionDb.productTablesChecked}`,
    `- Lineage proven tables: ${report.summary.terraFusionDb.lineageProven}`,
    `- Rows exist with lineage unproven: ${report.summary.terraFusionDb.rowsExistLineageUnproven}`,
    `- Empty product tables: ${report.summary.terraFusionDb.emptyTables}`,
    '',
    '## Benton Pilot',
    '',
    `- Parcel sanity passed: ${report.summary.bentonPilot.parcelSanityPassed ? 'yes' : 'no'}`,
    `- Sale qualification status: ${report.summary.bentonPilot.saleQualificationStatus}`,
    `- Pilot closure status: ${report.summary.bentonPilot.pilotClosureStatus}`,
    '',
    '## Ship Blockers',
    '',
    ...(report.shipBlockers.length
      ? report.shipBlockers.map(item => `- ${item.source}: ${item.message}`)
      : ['- none']),
    '',
    '## Next Execution Queue',
    '',
    ...(report.executionQueue.length
      ? report.executionQueue.map(
          item =>
            `- ${item.source}: ${item.ownerLane}; run \`${item.nextCommand}\`; ${item.requiredResolution}`
        )
      : ['- none']),
    '',
    '## Artifact Blocker Details',
    '',
    ...Object.entries(report.artifactDetails).flatMap(([name, detail]) => {
      if (!detail.present) return [`- ${name}: artifact missing`];
      if (detail.blockers.items.length === 0) return [`- ${name}: none`];
      const lines = detail.blockers.items.map(blocker => `- ${name}: ${blocker}`);
      if (detail.blockers.omitted > 0) {
        lines.push(`- ${name}: ${detail.blockers.omitted} additional blocker(s) omitted`);
      }
      return lines;
    }),
    '',
    '## Warnings',
    '',
    ...(report.warnings.length
      ? report.warnings.map(item => `- ${item.source}: ${item.message}`)
      : ['- none']),
    '',
    '## Artifact Inputs',
    '',
    ...Object.values(report.artifacts).map(
      artifact =>
        `- ${artifact.name}: ${artifact.present ? artifact.path : `missing (${artifact.path})`}`
    ),
  ].join('\n');
}

function main() {
  const loaded = Object.fromEntries(Object.keys(artifacts).map(name => [name, readArtifact(name)]));
  const { blockers, warnings } = collectBlockers(loaded);
  const executionQueue = buildExecutionQueue(blockers);
  const report = {
    generatedAt: new Date().toISOString(),
    status: blockers.length === 0 ? (warnings.length ? 'PASS_WITH_WARNINGS' : 'PASS') : 'FAIL',
    artifacts: Object.fromEntries(
      Object.entries(loaded).map(([name, artifact]) => [
        name,
        {
          name: artifact.name,
          path: artifact.path,
          present: artifact.present,
          parseError: artifact.parseError ?? null,
        },
      ])
    ),
    summary: buildDomainSummary(loaded),
    shipBlockers: blockers,
    executionQueue,
    artifactDetails: buildArtifactDetails(loaded, blockers),
    warnings,
  };

  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(
    JSON.stringify(
      {
        status: report.status,
        shipBlockers: report.shipBlockers.length,
        warnings: report.warnings.length,
      },
      null,
      2
    )
  );

  if (report.status === 'FAIL') process.exitCode = 1;
}

main();
