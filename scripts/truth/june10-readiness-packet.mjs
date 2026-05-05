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
import {
  postDbRefreshChecklist,
  postDbRefreshFullReadinessCommand,
  postDbRefreshQuickCommand,
} from './post-db-refresh-plan.mjs';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'june10-readiness-packet.json');
const outMd = path.join(truthDir, 'june10-readiness-packet.md');

const artifacts = {
  crosswalk: 'washington-39-county-data-crosswalk.json',
  runtimeCandidateSet: 'runtime-candidate-set.json',
  countyRuntimeContract: 'county-runtime-contract.json',
  dbIdentity: 'runtime-db-identity.json',
  dbContent: 'runtime-db-content-audit.json',
  runtimeRowPath: 'runtime-row-path-proof.json',
  productLoadLedger: 'terrafusion-db-product-load-ledger.json',
  bentonParcelSanity: 'benton-parcel-count-sanity.json',
  sourceLineage: 'runtime-row-source-lineage-proof.json',
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
  runtimeCandidateSet: {
    ownerLane: 'Codex after runtime registration ledger refresh',
    nextCommand: 'pnpm run truth:runtime-candidate-set',
    requiredResolution:
      'Keep June 10 scope locked to Benton runtime pilot unless evidence-backed county promotion is deliberately completed.',
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
  runtimeRowPath: {
    ownerLane: 'Codex after TerraFusion DB content is refreshed',
    nextCommand: 'pnpm run truth:runtime-row-path-proof',
    requiredResolution:
      'Prove county runtime endpoints return rows, echo county identity, and have no Benton fallback.',
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
  sourceLineage: {
    ownerLane: 'Codex after TerraFusion DB content is refreshed',
    nextCommand: 'pnpm run truth:runtime-source-lineage',
    requiredResolution:
      'Prove runtime row lineage stays inside TerraFusion DB/API boundaries and exposes counts-only, no-fallback posture.',
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

const postDbRefreshRerunChecklist = postDbRefreshChecklist();

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
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const shapeError = isJsonProofObject(value) ? null : 'Artifact JSON root must be an object.';
    return {
      name,
      path: rel(filePath),
      present: true,
      value,
      shapeError,
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

function isJsonProofObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function blocker(blockers, source, message) {
  blockers.push({ source, message });
}

function warning(warnings, source, message) {
  if (!warnings.some(item => item.source === source && item.message === message)) {
    warnings.push({ source, message });
  }
}

function normalizeCounty(value) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return normalized.endsWith('county') ? normalized.slice(0, -'county'.length) : normalized;
}

function passingProofCounties(artifact) {
  return (artifact?.proofs ?? [])
    .filter(proof => proof?.passed === true)
    .map(proof => normalizeCounty(proof.county))
    .filter(Boolean);
}

function hasExactlyBentonPassingProof(artifact) {
  const counties = passingProofCounties(artifact);
  return counties.length === 1 && counties[0] === 'benton';
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
    if (artifact.shapeError) {
      blocker(blockers, artifact.name, artifact.shapeError);
    }
    if (artifact.present && !artifact.parseError && !artifact.shapeError) {
      for (const artifactWarning of artifactWarnings(artifact.value)) {
        warning(warnings, artifact.name, artifactWarning);
      }
      const failurePostures = artifactFailurePostures(artifact.value);
      for (const failurePosture of failurePostures) {
        blocker(
          blockers,
          artifact.name,
          `Artifact reports failed proof posture: ${failurePosture}.`
        );
      }
      for (const artifactBlocker of artifactBlockerMessages(artifact.value)) {
        blocker(blockers, artifact.name, artifactBlocker);
      }
    }
  }

  const crosswalk = loaded.crosswalk.value;
  const runtimeCandidateSet = loaded.runtimeCandidateSet.value;
  const countyRuntimeContract = loaded.countyRuntimeContract.value;
  const dbIdentity = loaded.dbIdentity.value;
  const dbContent = loaded.dbContent.value;
  const runtimeRowPath = loaded.runtimeRowPath.value;
  const productLoadLedger = loaded.productLoadLedger.value;
  const bentonParcelSanity = loaded.bentonParcelSanity.value;
  const sourceLineage = loaded.sourceLineage.value;
  const saleQualification = loaded.saleQualification.value;
  const bentonPilotClosure = loaded.bentonPilotClosure.value;

  if (crosswalk?.summary?.prohibit39CountyRuntimeClaim !== true) {
    blocker(blockers, 'crosswalk', '39-county runtime claim is not explicitly prohibited.');
  }

  if (
    loaded.crosswalk.present &&
    loaded.runtimeCandidateSet.present &&
    Number(crosswalk?.summary?.runtimeProven ?? -1) !==
      Number(runtimeCandidateSet?.summary?.runtimeProven ?? -2)
  ) {
    blocker(
      blockers,
      'crosswalk',
      'Crosswalk runtime-proven count does not match runtime candidate set.'
    );
  }

  if (
    loaded.runtimeCandidateSet.present &&
    (runtimeCandidateSet?.summary?.june10RuntimeScope !== 'benton_only_runtime_pilot' ||
      runtimeCandidateSet?.summary?.prohibit39CountyRuntimeClaim !== true ||
      Number(runtimeCandidateSet?.summary?.runtimeProven ?? 0) !== 1 ||
      Number(runtimeCandidateSet?.summary?.evidenceBackedLoadCandidates ?? 0) !== 0 ||
      Number(runtimeCandidateSet?.summary?.shipBlockers ?? 0) !== 0)
  ) {
    blocker(
      blockers,
      'runtimeCandidateSet',
      'Runtime candidate set does not prove Benton-only June 10 scope.'
    );
  }

  if (
    Number(crosswalk?.summary?.runtimeProven ?? 0) >
    Number(countyRuntimeContract?.summary?.runtimeContractPass ?? 0)
  ) {
    warning(
      warnings,
      'crosswalk',
      `Crosswalk reports ${crosswalk.summary.runtimeProven} runtime-proven counties; confirm county runtime contract also passes them.`
    );
  }

  if (
    loaded.runtimeCandidateSet.present &&
    loaded.countyRuntimeContract.present &&
    Number(runtimeCandidateSet?.summary?.runtimeProven ?? -1) !==
      Number(countyRuntimeContract?.summary?.runtimeContractPass ?? -2)
  ) {
    blocker(
      blockers,
      'countyRuntimeContract',
      'County runtime contract pass count does not match runtime candidate set.'
    );
  }

  if (
    loaded.countyRuntimeContract.present &&
    countyRuntimeContract?.summary?.prohibit39CountyRuntimeClaim !== true
  ) {
    blocker(
      blockers,
      'countyRuntimeContract',
      'County runtime contract does not explicitly prohibit 39-county runtime claim.'
    );
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

  if (
    loaded.runtimeRowPath.present &&
    (Number(runtimeRowPath?.summary?.candidatesChecked ?? 0) <= 0 ||
      Number(runtimeRowPath?.summary?.passed ?? 0) !== 1 ||
      Number(runtimeRowPath?.summary?.failed ?? 1) > 0 ||
      Number(runtimeRowPath?.summary?.silentBentonFallbacks ?? 0) > 0 ||
      Number(runtimeRowPath?.summary?.zeroRowRuntimeResponses ?? 0) > 0 ||
      runtimeRowPath?.summary?.runtimeDbIdentityPassed !== true ||
      !hasExactlyBentonPassingProof(runtimeRowPath))
  ) {
    blocker(blockers, 'runtimeRowPath', 'Runtime row path proof is not passing for Benton only.');
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
    loaded.sourceLineage.present &&
    (Number(sourceLineage?.summary?.candidatesChecked ?? 0) <= 0 ||
      Number(sourceLineage?.summary?.passed ?? 0) !== 1 ||
      Number(sourceLineage?.summary?.failed ?? 1) > 0 ||
      !hasExactlyBentonPassingProof(sourceLineage))
  ) {
    blocker(
      blockers,
      'sourceLineage',
      'Runtime source lineage proof is not passing for Benton only.'
    );
  }

  if (
    loaded.saleQualification.present &&
    (saleQualification?.status !== 'PASS' ||
      Number(saleQualification?.summary?.candidatesChecked ?? 0) !== 1 ||
      Number(saleQualification?.summary?.passed ?? 0) !== 1 ||
      Number(saleQualification?.summary?.failed ?? 1) !== 0 ||
      Number(saleQualification?.summary?.canonicalLandingBacked ?? 0) !== 1 ||
      Number(saleQualification?.summary?.recommendationBackedCanonicalMissing ?? 0) !== 0 ||
      !hasExactlyBentonPassingProof(saleQualification))
  ) {
    blocker(
      blockers,
      'saleQualification',
      'Benton canonical sale qualification lineage is not passing.'
    );
  }

  if (
    loaded.bentonPilotClosure.present &&
    bentonPilotClosure?.status !== 'PASS' &&
    bentonPilotClosure?.status !== 'PASS_WITH_WARNINGS'
  ) {
    blocker(blockers, 'bentonPilotClosure', 'Benton runtime pilot closure is not passing.');
  }

  if (
    loaded.bentonPilotClosure.present &&
    (Number(bentonPilotClosure?.countyScope?.runtimeProven ?? 0) !== 1 ||
      Number(bentonPilotClosure?.countyScope?.evidenceBackedLoadCandidates ?? 0) !== 0 ||
      Number(bentonPilotClosure?.countyScope?.provenanceInventoryOnly ?? 0) !== 38 ||
      bentonPilotClosure?.countyScope?.prohibit39CountyRuntimeClaim !== true ||
      bentonPilotClosure?.benton?.saleQualificationClassification !== 'canonical_landing_backed' ||
      Number(bentonPilotClosure?.benton?.canonicalSaleQualifications ?? 0) <= 0 ||
      Number(bentonPilotClosure?.benton?.ratioStudyDecisionQualified ?? 0) <= 0)
  ) {
    blocker(
      blockers,
      'bentonPilotClosure',
      'Benton runtime pilot closure does not prove canonical sale qualification and Benton-only scope.'
    );
  }

  return { blockers, warnings };
}

function buildDomainSummary(loaded) {
  const crosswalkSummary = loaded.crosswalk.value?.summary ?? {};
  const runtimeCandidateSummary = loaded.runtimeCandidateSet.value?.summary ?? {};
  const contractSummary = loaded.countyRuntimeContract.value?.summary ?? {};
  const runtimeRowPath = loaded.runtimeRowPath.value;
  const runtimeRowPathSummary = runtimeRowPath?.summary ?? {};
  const sourceLineage = loaded.sourceLineage.value;
  const sourceLineageSummary = sourceLineage?.summary ?? {};
  const saleQualification = loaded.saleQualification.value;
  const saleQualificationSummary = saleQualification?.summary ?? {};
  const bentonPilotClosure = loaded.bentonPilotClosure.value;
  const loadSummary = loaded.productLoadLedger.value?.summary ?? {};
  const identityStatus = loaded.dbIdentity.value?.endpointStatus ?? null;
  const contentStatus = loaded.dbContent.value?.endpointStatus ?? null;
  const runtimeStatuses = [identityStatus, contentStatus].filter(status => status !== null);
  const liveRuntimeReachability =
    identityStatus === null || contentStatus === null
      ? 'api_unavailable_or_not_probed'
      : runtimeStatuses.every(status => status === 200)
        ? 'api_reachable'
        : 'api_reachable_with_endpoint_errors';

  return {
    countyScope: {
      countiesChecked: crosswalkSummary.countiesChecked ?? 0,
      runtimeProven: crosswalkSummary.runtimeProven ?? 0,
      publicSourceSeed: crosswalkSummary.publicSourceSeed ?? 0,
      provenanceInventoryOnly:
        crosswalkSummary.provenanceInventoryOnly ?? crosswalkSummary.referenceDemo ?? 0,
      prohibit39CountyRuntimeClaim: crosswalkSummary.prohibit39CountyRuntimeClaim === true,
      runtimeCandidateScope: runtimeCandidateSummary.june10RuntimeScope ?? 'unknown',
      runtimeCandidateProven: runtimeCandidateSummary.runtimeProven ?? 0,
      evidenceBackedLoadCandidates: runtimeCandidateSummary.evidenceBackedLoadCandidates ?? 0,
      runtimeCandidateShipBlockers: runtimeCandidateSummary.shipBlockers ?? 0,
      runtimeCandidateSetPassed:
        runtimeCandidateSummary.june10RuntimeScope === 'benton_only_runtime_pilot' &&
        runtimeCandidateSummary.prohibit39CountyRuntimeClaim === true &&
        Number(runtimeCandidateSummary.runtimeProven ?? 0) === 1 &&
        Number(runtimeCandidateSummary.evidenceBackedLoadCandidates ?? 0) === 0 &&
        Number(runtimeCandidateSummary.shipBlockers ?? 0) === 0,
    },
    runtimeContract: {
      runtimeContractPass: contractSummary.runtimeContractPass ?? 0,
      runtimeContractBlocked: contractSummary.runtimeContractBlocked ?? 0,
      prohibit39CountyRuntimeClaim: contractSummary.prohibit39CountyRuntimeClaim === true,
    },
    terraFusionDb: {
      liveRuntimeReachability,
      dbIdentityEndpointStatus: identityStatus,
      dbContentEndpointStatus: contentStatus,
      dbIdentityPassed: loaded.dbIdentity.value?.passed === true,
      dbContentPassed: loaded.dbContent.value?.passed === true,
      runtimeRowPathPassed:
        Number(runtimeRowPathSummary.candidatesChecked ?? 0) > 0 &&
        Number(runtimeRowPathSummary.passed ?? 0) === 1 &&
        Number(runtimeRowPathSummary.failed ?? 1) === 0 &&
        Number(runtimeRowPathSummary.silentBentonFallbacks ?? 1) === 0 &&
        Number(runtimeRowPathSummary.zeroRowRuntimeResponses ?? 1) === 0 &&
        runtimeRowPathSummary.runtimeDbIdentityPassed === true &&
        hasExactlyBentonPassingProof(runtimeRowPath),
      productLoadLedgerPassed: loaded.productLoadLedger.value?.passed === true,
      sourceLineagePassed:
        Number(sourceLineageSummary.candidatesChecked ?? 0) > 0 &&
        Number(sourceLineageSummary.passed ?? 0) === 1 &&
        Number(sourceLineageSummary.failed ?? 1) === 0 &&
        hasExactlyBentonPassingProof(sourceLineage),
      productTablesChecked: loadSummary.productTablesChecked ?? 0,
      lineageProven: loadSummary.lineageProven ?? 0,
      rowsExistLineageUnproven: loadSummary.rowsExistLineageUnproven ?? 0,
      emptyTables: loadSummary.emptyTables ?? 0,
    },
    bentonPilot: {
      parcelSanityPassed: loaded.bentonParcelSanity.value?.passed === true,
      saleQualificationStatus:
        saleQualification?.status ?? (saleQualification?.passed === true ? 'PASS' : 'UNKNOWN'),
      saleQualificationCanonicalBacked:
        saleQualification?.status === 'PASS' &&
        Number(saleQualificationSummary.candidatesChecked ?? 0) === 1 &&
        Number(saleQualificationSummary.passed ?? 0) === 1 &&
        Number(saleQualificationSummary.failed ?? 1) === 0 &&
        Number(saleQualificationSummary.canonicalLandingBacked ?? 0) === 1 &&
        Number(saleQualificationSummary.recommendationBackedCanonicalMissing ?? 0) === 0 &&
        hasExactlyBentonPassingProof(saleQualification),
      pilotClosureStatus: bentonPilotClosure?.status ?? 'UNKNOWN',
      pilotClosureProofDetailPassed:
        (bentonPilotClosure?.status === 'PASS' ||
          bentonPilotClosure?.status === 'PASS_WITH_WARNINGS') &&
        Number(bentonPilotClosure?.countyScope?.runtimeProven ?? 0) === 1 &&
        Number(bentonPilotClosure?.countyScope?.evidenceBackedLoadCandidates ?? 0) === 0 &&
        Number(bentonPilotClosure?.countyScope?.provenanceInventoryOnly ?? 0) === 38 &&
        bentonPilotClosure?.countyScope?.prohibit39CountyRuntimeClaim === true &&
        bentonPilotClosure?.benton?.saleQualificationClassification ===
          'canonical_landing_backed' &&
        Number(bentonPilotClosure?.benton?.canonicalSaleQualifications ?? 0) > 0 &&
        Number(bentonPilotClosure?.benton?.ratioStudyDecisionQualified ?? 0) > 0,
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

function artifactFailurePosture(value) {
  if (value?.passed === false) return 'top-level passed is false';
  if (typeof value?.status === 'string') {
    if (!isAllowedPassingStatus(value.status)) {
      return `top-level status is ${value.status}`;
    }
  }
  return null;
}

function artifactFailurePostures(value) {
  return [
    artifactFailurePosture(value),
    ...collectionFailurePostures(value, 'artifact'),
    ...summaryFailurePostures(value?.summary),
    ...receiptEvidenceFailurePostures(value?.receiptEvidence),
    ...nestedRecordFailurePostures(value?.rows, 'row'),
    ...nestedRecordFailurePostures(value?.proofs, 'proof'),
  ].filter(Boolean);
}

function receiptEvidenceFailurePostures(receiptEvidence) {
  if (!receiptEvidence || typeof receiptEvidence !== 'object') return [];
  const postures = [
    ...collectionFailurePostures(receiptEvidence, 'receiptEvidence'),
    ...summaryFailurePostures(receiptEvidence.summary, 'receiptEvidence.summary'),
  ];
  if (receiptEvidence.passed === false) postures.push('receiptEvidence.passed is false');
  if (typeof receiptEvidence.status === 'string') {
    if (!isAllowedPassingStatus(receiptEvidence.status)) {
      postures.push(`receiptEvidence.status is ${receiptEvidence.status}`);
    }
  }
  return postures;
}

function summaryFailurePostures(summary, label = 'summary') {
  if (!summary || typeof summary !== 'object') return [];
  const postures = collectionFailurePostures(summary, label);
  if (summary.passed === false) postures.push(`${label}.passed is false`);
  if (typeof summary.status === 'string') {
    if (!isAllowedPassingStatus(summary.status)) {
      postures.push(`${label}.status is ${summary.status}`);
    }
  }
  return postures;
}

function collectionFailurePostures(value, label) {
  if (!value || typeof value !== 'object') return [];
  const postures = [];
  for (const key of ['shipBlockers', 'error', 'errors', 'failure', 'failures']) {
    const entries = value[key];
    if (Array.isArray(entries) && entries.length > 0) {
      postures.push(`${label}.${key} has ${entries.length} item(s)`);
    } else if (entries && typeof entries === 'object') {
      const count = Object.keys(entries).length;
      if (count > 0) postures.push(`${label}.${key} has ${count} object key(s)`);
    } else if (typeof entries === 'string' && entries.trim().length > 0) {
      postures.push(`${label}.${key} is set`);
    } else {
      const count = Number(entries);
      if (Number.isFinite(count) && count > 0) {
        postures.push(`${label}.${key} is ${count}`);
      }
    }
  }
  for (const key of [
    'failed',
    'failureCount',
    'errorCount',
    'blockerCount',
    'artifactFailures',
    'commandsFailed',
  ]) {
    const count = Number(value[key]);
    if (Number.isFinite(count) && count > 0) {
      postures.push(`${label}.${key} is ${count}`);
    }
  }
  return postures;
}

function nestedRecordFailurePostures(records, label) {
  if (!Array.isArray(records)) return [];
  return records.flatMap(record => {
    const subject = `${record?.tableName ?? record?.county ?? label} ${label}`;
    const postures = collectionFailurePostures(record, subject);
    if (record?.passed === false) postures.push(`${subject} passed is false`);
    if (typeof record?.status === 'string') {
      if (!isAllowedPassingStatus(record.status)) {
        postures.push(`${subject} status is ${record.status}`);
      }
    }
    for (const posture of summaryFailurePostures(record?.summary)) {
      postures.push(`${subject} ${posture}`);
    }
    return postures;
  });
}

function isAllowedPassingStatus(status) {
  return new Set(['PASS', 'PASS_WITH_WARNINGS', 'runtime_contract_pass']).has(status);
}

function artifactBlockers(value) {
  const posture = artifactFailurePostures(value).map(
    failurePosture => `Artifact reports failed proof posture: ${failurePosture}.`
  );
  return [...new Set([...posture, ...artifactBlockerMessages(value)])].map(item => String(item));
}

function artifactBlockerMessages(value) {
  const direct = blockerMessages(value, 'artifact');
  const summary = blockerMessages(value?.summary, 'summary');
  const receiptBlockers = blockerMessages(value?.receiptEvidence, 'receiptEvidence');
  const receiptSummaryBlockers = blockerMessages(
    value?.receiptEvidence?.summary,
    'receiptEvidence.summary'
  );
  const rowBlockers = Array.isArray(value?.rows)
    ? value.rows.flatMap(row => blockerMessages(row, `${row?.tableName ?? row?.county ?? 'row'}`))
    : [];
  const proofBlockers = Array.isArray(value?.proofs)
    ? value.proofs.flatMap(proof => blockerMessages(proof, `${proof?.county ?? 'proof'}`))
    : [];

  return [
    ...new Set([
      ...direct,
      ...summary,
      ...receiptBlockers,
      ...receiptSummaryBlockers,
      ...rowBlockers,
      ...proofBlockers,
    ]),
  ].map(item => String(item));
}

function blockerMessages(value, label) {
  if (!value || typeof value !== 'object') return [];
  const format = item => (label === 'artifact' || label === 'summary' ? item : `${label}: ${item}`);
  const messages = [];
  if (typeof value.blocker === 'string' && value.blocker.trim().length > 0) {
    messages.push(format(value.blocker));
  }
  if (Array.isArray(value.blockers)) {
    messages.push(...value.blockers.map(format));
  } else if (typeof value.blockers === 'string' && value.blockers.trim().length > 0) {
    messages.push(format(value.blockers));
  } else if (value.blockers && typeof value.blockers === 'object') {
    const count = Object.keys(value.blockers).length;
    if (count > 0) {
      messages.push(`${label}.blockers has ${count} object key(s)`);
    }
  }
  return messages;
}

function artifactWarnings(value) {
  const posture = statusWarningMessages(value, 'Artifact');
  const direct = warningMessages(value, 'Artifact');
  const summary = [
    ...statusWarningMessages(value?.summary, 'Artifact summary'),
    ...warningMessages(value?.summary, 'Artifact summary'),
  ];
  const receiptWarnings = [
    ...statusWarningMessages(value?.receiptEvidence, 'receiptEvidence'),
    ...warningMessages(value?.receiptEvidence, 'receiptEvidence'),
    ...statusWarningMessages(value?.receiptEvidence?.summary, 'receiptEvidence summary'),
    ...warningMessages(value?.receiptEvidence?.summary, 'receiptEvidence summary'),
  ];
  const rowWarnings = Array.isArray(value?.rows)
    ? value.rows.flatMap(row =>
        [
          ...statusWarningMessages(row, 'row'),
          ...warningMessages(row, 'row'),
          ...statusWarningMessages(row?.summary, 'row summary'),
          ...warningMessages(row?.summary, 'row summary'),
        ].map(item => `${row?.tableName ?? row?.county ?? 'row'}: ${item}`)
      )
    : [];
  const proofWarnings = Array.isArray(value?.proofs)
    ? value.proofs.flatMap(proof =>
        [
          ...statusWarningMessages(proof, 'proof'),
          ...warningMessages(proof, 'proof'),
          ...statusWarningMessages(proof?.summary, 'proof summary'),
          ...warningMessages(proof?.summary, 'proof summary'),
        ].map(item => `${proof?.county ?? 'proof'}: ${item}`)
      )
    : [];

  return [
    ...new Set([
      ...posture,
      ...direct,
      ...summary,
      ...receiptWarnings,
      ...rowWarnings,
      ...proofWarnings,
    ]),
  ].map(item => String(item));
}

function statusWarningMessages(value, label) {
  return value?.status === 'PASS_WITH_WARNINGS' ? [`${label} status is PASS_WITH_WARNINGS.`] : [];
}

function warningMessages(value, label) {
  if (!value || typeof value !== 'object') return [];
  const messages = [];
  if (typeof value.warning === 'string' && value.warning.trim().length > 0) {
    messages.push(value.warning);
  }
  if (Array.isArray(value.warnings)) {
    messages.push(...value.warnings);
  } else if (typeof value.warnings === 'string' && value.warnings.trim().length > 0) {
    messages.push(value.warnings);
  } else if (value.warnings && typeof value.warnings === 'object') {
    const count = Object.keys(value.warnings).length;
    if (count > 0) messages.push(`${label}.warnings has ${count} object key(s).`);
  }
  if (Number(value?.warningCount ?? 0) > 0) {
    const field = label.endsWith('summary') ? `${label}.warningCount` : `${label} warningCount`;
    messages.push(`${field} is ${Number(value.warningCount)}.`);
  }
  return messages;
}

function capList(items, limit = 20) {
  return {
    items: items.slice(0, limit),
    omitted: Math.max(0, items.length - limit),
  };
}

function buildArtifactDetails(loaded, blockers, warnings) {
  const sources = new Set([
    ...blockers.map(item => item.source),
    ...warnings.map(item => item.source),
  ]);
  return Object.fromEntries(
    Object.entries(loaded)
      .filter(([name]) => sources.has(name))
      .map(([name, artifact]) => [
        name,
        {
          present: artifact.present,
          blockers: capList([
            ...(artifact.parseError
              ? [`Artifact could not be parsed: ${artifact.parseError}.`]
              : []),
            ...(artifact.shapeError ? [artifact.shapeError] : []),
            ...artifactBlockers(artifact.value),
          ]),
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
    `- Runtime candidate scope: ${report.summary.countyScope.runtimeCandidateScope}`,
    `- Runtime candidate set passed: ${report.summary.countyScope.runtimeCandidateSetPassed ? 'yes' : 'no'}`,
    `- Runtime candidate proven counties: ${report.summary.countyScope.runtimeCandidateProven}`,
    `- Evidence-backed load candidates: ${report.summary.countyScope.evidenceBackedLoadCandidates}`,
    `- Runtime candidate ship blockers: ${report.summary.countyScope.runtimeCandidateShipBlockers}`,
    '',
    '## TerraFusion DB',
    '',
    `- Live runtime reachability: ${report.summary.terraFusionDb.liveRuntimeReachability}`,
    `- DB identity endpoint status: ${report.summary.terraFusionDb.dbIdentityEndpointStatus ?? 'unreachable/not probed'}`,
    `- DB content endpoint status: ${report.summary.terraFusionDb.dbContentEndpointStatus ?? 'unreachable/not probed'}`,
    `- DB identity passed: ${report.summary.terraFusionDb.dbIdentityPassed ? 'yes' : 'no'}`,
    `- DB content passed: ${report.summary.terraFusionDb.dbContentPassed ? 'yes' : 'no'}`,
    `- Runtime row path passed: ${report.summary.terraFusionDb.runtimeRowPathPassed ? 'yes' : 'no'}`,
    `- Product load ledger passed: ${report.summary.terraFusionDb.productLoadLedgerPassed ? 'yes' : 'no'}`,
    `- Runtime source lineage passed: ${report.summary.terraFusionDb.sourceLineagePassed ? 'yes' : 'no'}`,
    `- Product tables checked: ${report.summary.terraFusionDb.productTablesChecked}`,
    `- Lineage proven tables: ${report.summary.terraFusionDb.lineageProven}`,
    `- Rows exist with lineage unproven: ${report.summary.terraFusionDb.rowsExistLineageUnproven}`,
    `- Empty product tables: ${report.summary.terraFusionDb.emptyTables}`,
    '',
    '## Benton Pilot',
    '',
    `- Parcel sanity passed: ${report.summary.bentonPilot.parcelSanityPassed ? 'yes' : 'no'}`,
    `- Sale qualification status: ${report.summary.bentonPilot.saleQualificationStatus}`,
    `- Sale qualification canonical-backed: ${report.summary.bentonPilot.saleQualificationCanonicalBacked ? 'yes' : 'no'}`,
    `- Pilot closure status: ${report.summary.bentonPilot.pilotClosureStatus}`,
    `- Pilot closure proof detail passed: ${report.summary.bentonPilot.pilotClosureProofDetailPassed ? 'yes' : 'no'}`,
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
    '## Post-DB-Refresh Rerun Checklist',
    '',
    `Fast command: \`${report.postDbRefreshQuickCommand}\``,
    `Full readiness gate after fast pass: \`${report.postDbRefreshFullReadinessCommand}\``,
    '',
    ...report.postDbRefreshRerunChecklist.map(
      item => `${item.order}. \`${item.command}\` - ${item.proves}`
    ),
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
    '## Artifact Warning Details',
    '',
    ...Object.entries(report.artifactDetails).flatMap(([name, detail]) => {
      if (!detail.present || detail.warnings.items.length === 0) return [`- ${name}: none`];
      const lines = detail.warnings.items.map(warning => `- ${name}: ${warning}`);
      if (detail.warnings.omitted > 0) {
        lines.push(`- ${name}: ${detail.warnings.omitted} additional warning(s) omitted`);
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
          shapeError: artifact.shapeError ?? null,
        },
      ])
    ),
    summary: buildDomainSummary(loaded),
    shipBlockers: blockers,
    executionQueue,
    postDbRefreshQuickCommand,
    postDbRefreshFullReadinessCommand,
    postDbRefreshRerunChecklist,
    artifactDetails: buildArtifactDetails(loaded, blockers, warnings),
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
