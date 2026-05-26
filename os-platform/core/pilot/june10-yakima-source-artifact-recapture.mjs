#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const YAKIMA_FIPS = "53077";
const YAKIMA_SOURCE_BASE = "https://yes.co.yakima.wa.us/AssessorAPI";
const YAKIMA_SEARCH_PAGE = `${YAKIMA_SOURCE_BASE}/Property_Search.html`;
const YAKIMA_SEARCH_APP = `${YAKIMA_SOURCE_BASE}/JS/property-search-ng-app.js`;

const DEFAULT_CLOSURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-receipt-closure.latest.json"
);
const DEFAULT_CAPTURE_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "yakima"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-source-artifact-recapture.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-source-artifact-recapture.latest.md"
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

function sha256Text(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
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

function unique(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))];
}

function toYakimaDisplayParcelNumber(value) {
  const stripped = String(value ?? "").replace(/[^0-9A-Za-z]/g, "");
  if (stripped.length > 6) return `${stripped.slice(0, 6)}-${stripped.slice(6)}`;
  return stripped;
}

function toSourceNativeParcelNumber(value) {
  return String(value ?? "").replace(/[^0-9A-Za-z]/g, "");
}

function extractEndpointDiscovery(appSource) {
  const endpoints = unique(
    [...appSource.matchAll(/\/ParcelDetails\/[A-Za-z0-9_/{}.-]+/g)].map((match) => match[0])
  );
  return {
    sourceSearchPage: YAKIMA_SEARCH_PAGE,
    sourceApplicationScript: YAKIMA_SEARCH_APP,
    parcelDetailEndpointTemplate: `${YAKIMA_SOURCE_BASE}/ParcelDetails/GetByParcelNumber/{parcelNumber}`,
    parcelSearchEndpointTemplate: `${YAKIMA_SOURCE_BASE}/ParcelDetails/GetByParcelString/{parcelPrefixOrPattern}`,
    endpointsDiscovered: endpoints,
    supportsParcelDetailLookup: endpoints.some((endpoint) => endpoint.includes("GetByParcelNumber")),
    supportsParcelStringSearch: endpoints.some((endpoint) => endpoint.includes("GetByParcelString")),
    bulkExportEndpointDetected: false,
    bulkExportEndpointEvidence: null,
    termsPosture:
      "Public Yakima County assessor search UI exposes parcel detail/search APIs; no bulk export endpoint was found in the shipped app source."
  };
}

function summarizeProbeResponse({ parcelNumber, responseStatus, responseText, error }) {
  const sourceNativeParcelNumber = toSourceNativeParcelNumber(parcelNumber);
  if (error) {
    return {
      requestedParcelNumber: sourceNativeParcelNumber,
      requestedDisplayParcelNumber: toYakimaDisplayParcelNumber(parcelNumber),
      responseStatus: null,
      foundInCurrentSource: false,
      classification: "probe_error",
      error,
      rawResponseSha256: null,
      rawResponseBytes: 0
    };
  }

  if (responseStatus === 404) {
    return {
      requestedParcelNumber: sourceNativeParcelNumber,
      requestedDisplayParcelNumber: toYakimaDisplayParcelNumber(parcelNumber),
      responseStatus,
      foundInCurrentSource: false,
      classification: "not_found_in_current_source",
      rawResponseSha256: sha256Text(responseText ?? ""),
      rawResponseBytes: responseText?.length ?? 0
    };
  }

  if (responseStatus !== 200) {
    return {
      requestedParcelNumber: sourceNativeParcelNumber,
      requestedDisplayParcelNumber: toYakimaDisplayParcelNumber(parcelNumber),
      responseStatus,
      foundInCurrentSource: false,
      classification: "unexpected_source_response",
      rawResponseSha256: sha256Text(responseText ?? ""),
      rawResponseBytes: responseText?.length ?? 0
    };
  }

  let payload = null;
  try {
    payload = JSON.parse(responseText);
  } catch {
    return {
      requestedParcelNumber: sourceNativeParcelNumber,
      requestedDisplayParcelNumber: toYakimaDisplayParcelNumber(parcelNumber),
      responseStatus,
      foundInCurrentSource: false,
      classification: "invalid_json_response",
      rawResponseSha256: sha256Text(responseText),
      rawResponseBytes: responseText.length
    };
  }

  const returnedSourceNative = toSourceNativeParcelNumber(payload.ParcelNumber);
  return {
    requestedParcelNumber: sourceNativeParcelNumber,
    requestedDisplayParcelNumber: toYakimaDisplayParcelNumber(parcelNumber),
    responseStatus,
    foundInCurrentSource: returnedSourceNative === sourceNativeParcelNumber,
    classification: returnedSourceNative === sourceNativeParcelNumber ? "found_in_current_source" : "source_identity_mismatch",
    returnedParcelNumber: payload.ParcelNumber ?? null,
    returnedSourceNativeParcelNumber: returnedSourceNative || null,
    sourceRecordIdPresent: payload.Id !== undefined && payload.Id !== null,
    linkIdPresent: payload.LinkId !== undefined && payload.LinkId !== null,
    ownerRecordCount: Array.isArray(payload.OwnerRecords) ? payload.OwnerRecords.length : null,
    situsAddressCount: Array.isArray(payload.SitusAddresses) ? payload.SitusAddresses.length : null,
    landRecordCount: Array.isArray(payload.LandRecords) ? payload.LandRecords.length : null,
    residenceCount: Array.isArray(payload.Residences) ? payload.Residences.length : null,
    mobileHomeCount: Array.isArray(payload.MobileHomes) ? payload.MobileHomes.length : null,
    rawResponseSha256: sha256Text(responseText),
    rawResponseBytes: responseText.length
  };
}

function countByClassification(probes) {
  return probes.reduce((counts, probe) => {
    counts[probe.classification] = (counts[probe.classification] ?? 0) + 1;
    return counts;
  }, {});
}

export function buildYakimaSourceArtifactRecapture({
  closure,
  endpointDiscovery,
  appSourceHash,
  sourceOnlyProbes,
  canonicalOnlyProbes,
  probeArtifactPath,
  probeArtifactSha256,
  probeReceiptPath,
  probeReceiptSha256,
  maxProbesPerClass
}) {
  const sourceOnlyTotal = closure.postRepairIdentityOverlap?.sourceOnlyCount ?? null;
  const canonicalOnlyTotal = closure.postRepairIdentityOverlap?.canonicalOnlyCount ?? null;
  const sourceOnlyFound = sourceOnlyProbes.filter((probe) => probe.classification === "found_in_current_source").length;
  const canonicalOnlyFound = canonicalOnlyProbes.filter((probe) => probe.classification === "found_in_current_source").length;
  const canonicalOnlyNotFound = canonicalOnlyProbes.filter(
    (probe) => probe.classification === "not_found_in_current_source"
  ).length;

  const blockers = [];
  if (!endpointDiscovery.bulkExportEndpointDetected) {
    blockers.push("Yakima public source app did not expose a governed bulk/full-source export endpoint.");
  }
  if (sourceOnlyTotal > sourceOnlyProbes.length || canonicalOnlyTotal > canonicalOnlyProbes.length) {
    blockers.push(
      "Only sample probe evidence was captured; the full 100 source-only and 3,360 canonical-only deltas are not fully classified."
    );
  }
  if (sourceOnlyFound > 0) {
    blockers.push(
      `${sourceOnlyFound} probed source-only parcel identifiers are live in the current Yakima source and absent from canonical.`
    );
  }
  if (canonicalOnlyNotFound > 0) {
    blockers.push(
      `${canonicalOnlyNotFound} probed canonical-only parcel identifiers were not found in the current Yakima source.`
    );
  }

  const fullSnapshotCaptured = endpointDiscovery.bulkExportEndpointDetected === true;
  const boundedCorrectionDryRunViable =
    fullSnapshotCaptured &&
    sourceOnlyTotal === sourceOnlyProbes.length &&
    canonicalOnlyTotal === canonicalOnlyProbes.length &&
    sourceOnlyProbes.every((probe) => probe.classification === "found_in_current_source") &&
    canonicalOnlyProbes.every((probe) => probe.classification === "not_found_in_current_source");

  return {
    generatedAt: new Date().toISOString(),
    countyName: "Yakima County",
    fips: YAKIMA_FIPS,
    scope: "yakima_source_artifact_recapture",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    receiptConverted: false,
    sourceSnapshotReceiptEmitted: false,
    sourceProbeReceiptEmitted: true,
    sourceArtifactStatus: fullSnapshotCaptured ? "full_source_snapshot_captured" : "probe_artifact_only",
    recaptureDecision: fullSnapshotCaptured
      ? "full_source_snapshot_available_for_reconciliation"
      : "source_recapture_blocked_interactive_lookup_only",
    boundedCorrectionDryRunViable,
    endpointDiscovery: {
      ...endpointDiscovery,
      applicationScriptSha256: appSourceHash
    },
    closureInput: {
      status: closure.status,
      sourceParcelIdField: closure.sourceParcelIdField,
      sourceOnlyCount: sourceOnlyTotal,
      canonicalOnlyCount: canonicalOnlyTotal,
      sourceOnlySampleSize: closure.deltaClassification?.sourceOnly?.sample?.length ?? 0,
      canonicalOnlySampleSize: closure.deltaClassification?.canonicalOnly?.sample?.length ?? 0
    },
    probePolicy: {
      maxProbesPerClass,
      capturedFields:
        "minimal source identity/shape summary only; raw API response bytes are represented by SHA-256 hashes to avoid storing unnecessary public owner/address payloads",
      termsPosture: endpointDiscovery.termsPosture
    },
    sourceOnlyProbeSummary: {
      probed: sourceOnlyProbes.length,
      foundInCurrentSource: sourceOnlyFound,
      classificationCounts: countByClassification(sourceOnlyProbes),
      sample: sourceOnlyProbes.slice(0, 10)
    },
    canonicalOnlyProbeSummary: {
      probed: canonicalOnlyProbes.length,
      foundInCurrentSource: canonicalOnlyFound,
      notFoundInCurrentSource: canonicalOnlyNotFound,
      classificationCounts: countByClassification(canonicalOnlyProbes),
      sample: canonicalOnlyProbes.slice(0, 10)
    },
    duplicateNullSourceSemantics: {
      status: fullSnapshotCaptured ? "requires_full_snapshot_parser" : "not_rerunnable_from_interactive_lookup_probe",
      sourceNullOrBlank: null,
      sourceDuplicateGroups: null,
      reason:
        "Yakima recapture found parcel detail/search APIs, but no authoritative complete source export artifact for duplicate/null semantics."
    },
    deltaClassification: {
      sourceOnly:
        sourceOnlyFound > 0
          ? "sample_confirms_live_source_rows_missing_from_canonical"
          : "sample_does_not_confirm_live_source_rows",
      canonicalOnly:
        canonicalOnlyNotFound > 0
          ? "sample_confirms_canonical_rows_absent_from_current_source"
          : "sample_does_not_confirm_stale_canonical_rows",
      fullDeltaClassification: "blocked_until_full_source_snapshot_or_complete_delta_probe_is_available"
    },
    sourceProbeArtifacts: {
      probeArtifactPath: relativePath(probeArtifactPath),
      probeArtifactSha256,
      probeReceiptPath: relativePath(probeReceiptPath),
      probeReceiptSha256
    },
    requiredNextAction: boundedCorrectionDryRunViable
      ? "Build Yakima bounded correction dry-run from full source snapshot."
      : "Acquire a governed Yakima full source export/snapshot, or explicitly defer Yakima from receipt-backed June 10 production binding.",
    blockers
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# Yakima Source Artifact Recapture

Generated: ${report.generatedAt}

## Verdict

- Decision: ${report.recaptureDecision}
- Source artifact status: ${report.sourceArtifactStatus}
- Source snapshot receipt emitted: ${report.sourceSnapshotReceiptEmitted ? "yes" : "no"}
- Source probe receipt emitted: ${report.sourceProbeReceiptEmitted ? "yes" : "no"}
- Bounded correction dry-run viable: ${report.boundedCorrectionDryRunViable ? "yes" : "no"}
- DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Endpoint Discovery

- Search page: ${report.endpointDiscovery.sourceSearchPage}
- App script: ${report.endpointDiscovery.sourceApplicationScript}
- Supports parcel detail lookup: ${report.endpointDiscovery.supportsParcelDetailLookup ? "yes" : "no"}
- Supports parcel string search: ${report.endpointDiscovery.supportsParcelStringSearch ? "yes" : "no"}
- Bulk export endpoint detected: ${report.endpointDiscovery.bulkExportEndpointDetected ? "yes" : "no"}
- App script SHA-256: ${report.endpointDiscovery.applicationScriptSha256}

## Delta Probe Summary

| Class | Total delta | Probed | Found in current source | Not found in current source |
| --- | ---: | ---: | ---: | ---: |
| Source-only | ${report.closureInput.sourceOnlyCount} | ${report.sourceOnlyProbeSummary.probed} | ${report.sourceOnlyProbeSummary.foundInCurrentSource} | ${report.sourceOnlyProbeSummary.classificationCounts.not_found_in_current_source ?? 0} |
| Canonical-only | ${report.closureInput.canonicalOnlyCount} | ${report.canonicalOnlyProbeSummary.probed} | ${report.canonicalOnlyProbeSummary.foundInCurrentSource} | ${report.canonicalOnlyProbeSummary.notFoundInCurrentSource} |

## Duplicate / Null Semantics

- Status: ${report.duplicateNullSourceSemantics.status}
- Reason: ${report.duplicateNullSourceSemantics.reason}

## Artifacts

- Probe artifact: ${report.sourceProbeArtifacts.probeArtifactPath}
- Probe artifact SHA-256: ${report.sourceProbeArtifacts.probeArtifactSha256}
- Probe receipt: ${report.sourceProbeArtifacts.probeReceiptPath}
- Probe receipt SHA-256: ${report.sourceProbeArtifacts.probeReceiptSha256}

## Required Next Action

${report.requiredNextAction}

## Blockers

${blockers}
`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TerraFusion-June10-EvidenceProbe/1.0",
      Accept: "application/json,text/javascript,text/html;q=0.9,*/*;q=0.8"
    },
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  return { status: response.status, text };
}

async function probeParcel(parcelNumber) {
  const displayParcelNumber = toYakimaDisplayParcelNumber(parcelNumber);
  const url = `${YAKIMA_SOURCE_BASE}/ParcelDetails/GetByParcelNumber/${displayParcelNumber}`;
  try {
    const { status, text } = await fetchText(url);
    return {
      ...summarizeProbeResponse({ parcelNumber, responseStatus: status, responseText: text }),
      sourceUrl: url
    };
  } catch (error) {
    return {
      ...summarizeProbeResponse({ parcelNumber, error: error instanceof Error ? error.message : String(error) }),
      sourceUrl: url
    };
  }
}

async function probeMany(parcelNumbers) {
  const probes = [];
  for (const parcelNumber of parcelNumbers) {
    probes.push(await probeParcel(parcelNumber));
  }
  return probes;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const closurePath = args.get("closure") ?? DEFAULT_CLOSURE;
  const captureRoot = args.get("capture-root") ?? DEFAULT_CAPTURE_ROOT;
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;
  const maxProbesPerClass = Number(args.get("max-probes-per-class") ?? 50);

  const closure = readJson(closurePath);
  const appSource = (await fetchText(YAKIMA_SEARCH_APP)).text;
  const endpointDiscovery = extractEndpointDiscovery(appSource);
  const sourceOnlySamples = unique(closure.deltaClassification?.sourceOnly?.sample ?? []).slice(0, maxProbesPerClass);
  const canonicalOnlySamples = unique(closure.deltaClassification?.canonicalOnly?.sample ?? []).slice(0, maxProbesPerClass);
  const sourceOnlyProbes = await probeMany(sourceOnlySamples);
  const canonicalOnlyProbes = await probeMany(canonicalOnlySamples);

  const generatedAtSafe = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
  const probeArtifactPath = path.join(captureRoot, `yakima-source-recapture-probe-${generatedAtSafe}.jsonl`);
  const probeReceiptPath = path.join(captureRoot, `yakima-source-recapture-probe-receipt-${generatedAtSafe}.json`);

  const probeLines = [...sourceOnlyProbes, ...canonicalOnlyProbes].map((probe) => JSON.stringify(probe)).join("\n");
  writeText(probeArtifactPath, `${probeLines}\n`);
  const probeArtifactSha256 = sha256File(probeArtifactPath);

  const probeReceipt = {
    receiptVersion: "yakima_source_probe_v1",
    countyName: "Yakima County",
    fips: YAKIMA_FIPS,
    capturedAt: new Date().toISOString(),
    sourceSearchPage: YAKIMA_SEARCH_PAGE,
    sourceApplicationScript: YAKIMA_SEARCH_APP,
    sourceApplicationScriptSha256: sha256Text(appSource),
    rawArtifacts: [
      {
        path: relativePath(probeArtifactPath),
        sha256: probeArtifactSha256,
        rows: sourceOnlyProbes.length + canonicalOnlyProbes.length
      }
    ],
    sourceSnapshotReceipt: false,
    productionBindingAllowed: false,
    databaseMutationAttempted: false
  };
  writeJson(probeReceiptPath, probeReceipt);
  const probeReceiptSha256 = sha256File(probeReceiptPath);

  const report = buildYakimaSourceArtifactRecapture({
    closure,
    endpointDiscovery,
    appSourceHash: sha256Text(appSource),
    sourceOnlyProbes,
    canonicalOnlyProbes,
    probeArtifactPath,
    probeArtifactSha256,
    probeReceiptPath,
    probeReceiptSha256,
    maxProbesPerClass
  });

  writeJson(outJson, report);
  writeText(outMd, renderMarkdown(report));

  console.log(`Yakima source artifact recapture written: ${relativePath(outJson)}`);
  console.log(`Decision: ${report.recaptureDecision}`);
  console.log(`Probe artifact: ${relativePath(probeArtifactPath)}`);
  console.log(`DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
