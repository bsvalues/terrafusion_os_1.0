#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SOURCE_RAW = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "cowlitz",
  "cowlitz-parcels-parcno-raw.jsonl"
);
const DEFAULT_CANONICAL_CSV = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "cowlitz",
  "cowlitz-canonical-parcelnumbers.csv"
);
const DEFAULT_SOURCE_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-reimport-dry-run",
  "cowlitz",
  "source-snapshot-receipt.json"
);
const DEFAULT_CLOSURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-receipt-closure.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function artifact(filePath) {
  return {
    path: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
    sha256: fs.existsSync(filePath) ? sha256File(filePath) : null
  };
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--") continue;
    if (!argv[index]?.startsWith("--")) continue;
    const key = argv[index].slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
      continue;
    }
    args.set(key, next);
    index += 1;
  }
  return args;
}

function normalizeParcelId(value) {
  return String(value ?? "").trim();
}

export function parseCowlitzSourceParcno(rawText) {
  const source = new Set();
  const duplicates = new Map();
  let rows = 0;
  let nullOrBlank = 0;

  for (const line of rawText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const payload = JSON.parse(line);
    for (const feature of payload.features ?? []) {
      rows += 1;
      const parcno = normalizeParcelId(feature.attributes?.PARCNO);
      if (!parcno) {
        nullOrBlank += 1;
        continue;
      }
      if (source.has(parcno)) duplicates.set(parcno, (duplicates.get(parcno) ?? 1) + 1);
      source.add(parcno);
    }
  }

  return {
    rows,
    distinct: source,
    nullOrBlank,
    duplicates
  };
}

export function parseCanonicalParcelNumbers(csvText) {
  const canonical = new Set();
  const duplicates = new Map();
  let rows = 0;

  for (const line of csvText.split(/\r?\n/).slice(1)) {
    const parcelNumber = normalizeParcelId(line);
    if (!parcelNumber) continue;
    rows += 1;
    if (canonical.has(parcelNumber)) duplicates.set(parcelNumber, (duplicates.get(parcelNumber) ?? 1) + 1);
    canonical.add(parcelNumber);
  }

  return {
    rows,
    distinct: canonical,
    duplicates
  };
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort((a, b) => a.localeCompare(b));
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function quoteSql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export async function probeCowlitzCurrentSource({ sourceUrl, parcelNumbers, fetchImpl = fetch }) {
  const found = new Set();
  const errors = [];

  for (const part of chunk(parcelNumbers, 25)) {
    const url = new URL(sourceUrl);
    url.searchParams.set("where", `PARCNO IN (${part.map(quoteSql).join(",")})`);
    url.searchParams.set("outFields", "PARCNO");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("f", "json");

    try {
      const response = await fetchImpl(url);
      if (!response.ok) {
        errors.push({ chunkSize: part.length, status: response.status });
        continue;
      }
      const payload = await response.json();
      if (payload.error) {
        errors.push({ chunkSize: part.length, error: payload.error });
        continue;
      }
      for (const feature of payload.features ?? []) {
        const parcno = normalizeParcelId(feature.attributes?.PARCNO);
        if (parcno) found.add(parcno);
      }
    } catch (error) {
      errors.push({ chunkSize: part.length, error: String(error?.message ?? error) });
    }
  }

  return {
    attempted: true,
    requestedCount: parcelNumbers.length,
    found: [...found].sort((a, b) => a.localeCompare(b)),
    absent: parcelNumbers.filter((parcelNumber) => !found.has(parcelNumber)),
    errors
  };
}

export function buildCowlitzBoundedCorrectionDryRun({
  source,
  canonical,
  closure,
  sourceReceipt,
  currentSourceProbe,
  sourceArtifactIntegrity = null
}) {
  const sourceOnly = setDifference(source.distinct, canonical.distinct);
  const canonicalOnly = setDifference(canonical.distinct, source.distinct);
  const overlap = [...source.distinct].filter((parcelNumber) => canonical.distinct.has(parcelNumber)).length;
  const sourceDuplicateRows = [...source.duplicates.values()].reduce((total, count) => total + count - 1, 0);
  const duplicateAfter = sourceOnly.some((parcelNumber) => canonical.distinct.has(parcelNumber)) ? 1 : 0;
  const postCorrectionDistinct = canonical.distinct.size - canonicalOnly.length + sourceOnly.length;
  const sourceProbeFound = new Set(currentSourceProbe?.found ?? []);
  const sourceProbeAbsent = new Set(currentSourceProbe?.absent ?? []);
  const probeHadErrors = Boolean(currentSourceProbe?.errors?.length);

  const proposedSupersede = canonicalOnly.map((parcelNumber) => {
    const currentSourceStatus = sourceProbeFound.has(parcelNumber)
      ? "present_in_current_source"
      : sourceProbeAbsent.has(parcelNumber)
        ? "absent_from_current_source"
        : probeHadErrors
          ? "probe_error_unclassified"
          : "not_live_probed";
    return {
      parcelNumber,
      action: currentSourceStatus === "absent_from_current_source" ? "supersede_if_authorized" : "hold_for_source_probe_resolution",
      classification: currentSourceStatus === "absent_from_current_source" ? "stale_canonical_candidate" : "source_probe_not_closed",
      currentSourceStatus,
      deleteAllowed: false
    };
  });

  const proposedStage = sourceOnly.map((parcelNumber) => ({
    parcelNumber,
    action: "stage_insert_if_runtime_fields_captured",
    classification: "source_only_identity_candidate",
    trustPosture: "COWLITZ_PUBLIC_PARCEL_IDENTITY_PENDING_RUNTIME_FIELDS",
    loadableNow: false,
    requiredBeforeInsert: [
      "runtime-complete source fields",
      "lineage receipt",
      "rollback receipt",
      "post-correction duplicate proof"
    ]
  }));

  const postCorrectionIdentityParityPossible =
    duplicateAfter === 0 &&
    source.nullOrBlank === 0 &&
    canonical.duplicates.size === 0 &&
    postCorrectionDistinct === source.distinct.size;

  const receiptCandidate = {
    receiptVersion: "cowlitz_bounded_correction_dry_run_v1",
    countyName: "Cowlitz County",
    fips: "53015",
    sourceClass: "WA_INITIAL_SEED",
    sourceParcelIdField: "PARCNO",
    status: postCorrectionIdentityParityPossible ? "dry_run_ready_for_authorization_packet" : "dry_run_blocked",
    counts: {
      sourceOnly: sourceOnly.length,
      canonicalOnly: canonicalOnly.length,
      proposedSupersedes: proposedSupersede.length,
      proposedStageInserts: proposedStage.length,
      duplicateGroupsAfter: duplicateAfter,
      postCorrectionDistinct
    },
    productionBindingAllowed: false,
    certificationAllowed: false,
    databaseMutationAttempted: false
  };

  const blockers = [];
  if (sourceOnly.length !== 321) blockers.push(`Expected 321 source-only identifiers; found ${sourceOnly.length}.`);
  if (canonicalOnly.length !== 125) blockers.push(`Expected 125 canonical-only identifiers; found ${canonicalOnly.length}.`);
  if (duplicateAfter !== 0) blockers.push("Dry-run correction would create duplicate parcel identifiers.");
  if (probeHadErrors) blockers.push("Current source probe had errors; canonical-only supersede authorization is not closed.");
  if (proposedStage.some((row) => row.loadableNow !== false)) blockers.push("Source-only rows must remain no-op staged until runtime fields are captured.");
  if (sourceArtifactIntegrity && sourceArtifactIntegrity.matches !== true) {
    blockers.push("Source raw artifact hash does not match the source snapshot receipt.");
  }

  receiptCandidate.status =
    blockers.length === 0 && postCorrectionIdentityParityPossible
      ? "dry_run_ready_for_authorization_packet"
      : "dry_run_blocked";

  return {
    generatedAt: new Date().toISOString(),
    countyName: "Cowlitz County",
    fips: "53015",
    dryRunStatus: blockers.length === 0 ? "dry_run_pass_pending_authorization" : "dry_run_blocked",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    sourceSystem: sourceReceipt.sourceSystem,
    closureStatus: closure.status,
    sourceArtifactIntegrity,
    currentSourceProbe: currentSourceProbe ?? {
      attempted: false,
      requestedCount: canonicalOnly.length,
      found: [],
      absent: [],
      errors: []
    },
    currentDeltas: {
      sourceRows: source.rows,
      sourceDistinct: source.distinct.size,
      sourceNullOrBlank: source.nullOrBlank,
      sourceDuplicateGroups: source.duplicates.size,
      sourceDuplicateRows,
      canonicalRows: canonical.rows,
      canonicalDistinct: canonical.distinct.size,
      canonicalDuplicateGroups: canonical.duplicates.size,
      exactOverlap: overlap,
      sourceOnlyCount: sourceOnly.length,
      canonicalOnlyCount: canonicalOnly.length
    },
    proposedCorrection: {
      postCorrectionIdentityParityPossible,
      duplicateGroupsAfter: duplicateAfter,
      proposedSupersedeCount: proposedSupersede.length,
      proposedStageInsertCount: proposedStage.length,
      proposedSupersedePath: "os-platform/core/pilot/evidence/june10-cowlitz-bounded-correction-dry-run/proposed-supersede-list.json",
      proposedStageInsertPath: "os-platform/core/pilot/evidence/june10-cowlitz-bounded-correction-dry-run/proposed-stage-insert-list.json",
      rollbackPlanPath: "os-platform/core/pilot/evidence/june10-cowlitz-bounded-correction-dry-run/rollback-plan.json",
      correctionReceiptCandidatePath: "os-platform/core/pilot/evidence/june10-cowlitz-bounded-correction-dry-run/correction-receipt-candidate.json"
    },
    proposedSupersede,
    proposedStage,
    rollbackPlan: {
      rollbackRequired: true,
      mutationAuthorized: false,
      rollbackMode: "no_op_dry_run",
      ifExecutedLater: [
        "restore superseded canonical rows to active/current state",
        "remove or supersede inserted staged Cowlitz rows by correction receipt id",
        "re-run Cowlitz identity closure and receipt reconciliation"
      ]
    },
    receiptCandidate,
    supportingArtifacts: [
      artifact(DEFAULT_SOURCE_RAW),
      artifact(DEFAULT_CANONICAL_CSV),
      artifact(DEFAULT_SOURCE_RECEIPT),
      artifact(DEFAULT_CLOSURE)
    ],
    blockers
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# Cowlitz Bounded Correction Dry-Run

Generated: ${report.generatedAt}

## Verdict

- Status: ${report.dryRunStatus}
- DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Current Delta

| Metric | Value |
| --- | ---: |
| Source distinct PARCNO | ${report.currentDeltas.sourceDistinct} |
| Canonical distinct ParcelNumber | ${report.currentDeltas.canonicalDistinct} |
| Exact overlap | ${report.currentDeltas.exactOverlap} |
| Source-only | ${report.currentDeltas.sourceOnlyCount} |
| Canonical-only | ${report.currentDeltas.canonicalOnlyCount} |
| Source duplicate groups | ${report.currentDeltas.sourceDuplicateGroups} |
| Canonical duplicate groups | ${report.currentDeltas.canonicalDuplicateGroups} |

## Proposed No-Op Correction

- Proposed supersedes: ${report.proposedCorrection.proposedSupersedeCount}
- Proposed staged inserts: ${report.proposedCorrection.proposedStageInsertCount}
- Duplicate groups after: ${report.proposedCorrection.duplicateGroupsAfter}
- Identity parity possible after bounded correction: ${report.proposedCorrection.postCorrectionIdentityParityPossible ? "yes" : "no"}

## Current Source Probe

- Attempted: ${report.currentSourceProbe.attempted ? "yes" : "no"}
- Requested: ${report.currentSourceProbe.requestedCount}
- Found: ${report.currentSourceProbe.found.length}
- Absent: ${report.currentSourceProbe.absent.length}
- Errors: ${report.currentSourceProbe.errors.length}

## Source Artifact Integrity

- Expected SHA-256: ${report.sourceArtifactIntegrity?.expectedSha256 ?? "not recorded"}
- Actual SHA-256: ${report.sourceArtifactIntegrity?.actualSha256 ?? "not checked"}
- Matches receipt: ${report.sourceArtifactIntegrity?.matches === true ? "yes" : "no"}

## Blockers

${blockers}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRawPath = args.get("source-raw") ?? DEFAULT_SOURCE_RAW;
  const canonicalCsvPath = args.get("canonical-csv") ?? DEFAULT_CANONICAL_CSV;
  const sourceReceiptPath = args.get("source-receipt") ?? DEFAULT_SOURCE_RECEIPT;
  const closurePath = args.get("closure") ?? DEFAULT_CLOSURE;
  const outRoot = args.get("out-root") ?? DEFAULT_OUT_ROOT;
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;
  const skipLiveProbe = args.get("skip-live-probe") === "true";

  const source = parseCowlitzSourceParcno(fs.readFileSync(sourceRawPath, "utf8"));
  const canonical = parseCanonicalParcelNumbers(fs.readFileSync(canonicalCsvPath, "utf8"));
  const sourceReceipt = readJson(sourceReceiptPath);
  const closure = readJson(closurePath);
  const expectedSourceHash = sourceReceipt.rawArtifacts?.[0]?.sha256 ?? null;
  const actualSourceHash = sha256File(sourceRawPath);
  const sourceArtifactIntegrity = {
    path: path.relative(repoRoot, sourceRawPath).replaceAll(path.sep, "/"),
    expectedSha256: expectedSourceHash,
    actualSha256: actualSourceHash,
    matches: expectedSourceHash === actualSourceHash
  };
  const canonicalOnly = setDifference(canonical.distinct, source.distinct);
  const currentSourceProbe = skipLiveProbe
    ? {
        attempted: false,
        requestedCount: canonicalOnly.length,
        found: [],
        absent: [],
        errors: []
      }
    : await probeCowlitzCurrentSource({
        sourceUrl: sourceReceipt.sourceSystem.url,
        parcelNumbers: canonicalOnly
      });

  const report = buildCowlitzBoundedCorrectionDryRun({
    source,
    canonical,
    closure,
    sourceReceipt,
    currentSourceProbe,
    sourceArtifactIntegrity
  });

  writeJson(outJson, {
    ...report,
    proposedSupersede: undefined,
    proposedStage: undefined
  });
  writeText(outMd, renderMarkdown(report));
  writeJson(path.join(outRoot, "proposed-supersede-list.json"), report.proposedSupersede);
  writeJson(path.join(outRoot, "proposed-stage-insert-list.json"), report.proposedStage);
  writeJson(path.join(outRoot, "rollback-plan.json"), report.rollbackPlan);
  writeJson(path.join(outRoot, "correction-receipt-candidate.json"), report.receiptCandidate);

  console.log(`Cowlitz bounded correction dry-run written: ${path.relative(repoRoot, outJson)}`);
  console.log(`Status: ${report.dryRunStatus}`);
  console.log(`Source-only: ${report.currentDeltas.sourceOnlyCount}`);
  console.log(`Canonical-only: ${report.currentDeltas.canonicalOnlyCount}`);
  console.log(`DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
