#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CROSSWALK = path.join(repoRoot, "generated", "truth", "washington-39-county-data-crosswalk.json");
const DEFAULT_CANONICAL_RECONCILIATION = path.join(
  repoRoot,
  "generated",
  "truth",
  "june10-canonical-db-reconciliation.json"
);
const DEFAULT_RECEIPT_RECONCILIATION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-reconciliation.latest.json"
);
const DEFAULT_YAKIMA_RECAPTURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-source-artifact-recapture.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-source-acquisition-prioritization.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-source-acquisition-prioritization.latest.md"
);

const COUNTY_FIPS_BY_NAME = new Map([
  ["Adams", "53001"],
  ["Asotin", "53003"],
  ["Benton", "53005"],
  ["Chelan", "53007"],
  ["Clallam", "53009"],
  ["Clark", "53011"],
  ["Columbia", "53013"],
  ["Cowlitz", "53015"],
  ["Douglas", "53017"],
  ["Ferry", "53019"],
  ["Franklin", "53021"],
  ["Garfield", "53023"],
  ["Grant", "53025"],
  ["Grays Harbor", "53027"],
  ["Island", "53029"],
  ["Jefferson", "53031"],
  ["King", "53033"],
  ["Kitsap", "53035"],
  ["Kittitas", "53037"],
  ["Klickitat", "53039"],
  ["Lewis", "53041"],
  ["Lincoln", "53043"],
  ["Mason", "53045"],
  ["Okanogan", "53047"],
  ["Pacific", "53049"],
  ["Pend Oreille", "53051"],
  ["Pierce", "53053"],
  ["San Juan", "53055"],
  ["Skagit", "53057"],
  ["Skamania", "53059"],
  ["Snohomish", "53061"],
  ["Spokane", "53063"],
  ["Stevens", "53065"],
  ["Thurston", "53067"],
  ["Wahkiakum", "53069"],
  ["Walla Walla", "53071"],
  ["Whatcom", "53073"],
  ["Whitman", "53075"],
  ["Yakima", "53077"]
]);

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

function haystack(row) {
  return [
    row.acquisitionFamily,
    row.officialAssessorBaseUrl,
    row.primarySalesSource,
    row.fallbackSource,
    row.gisMapSurface,
    ...(row.evidenceFiles ?? []),
    ...(row.payloadFiles ?? []),
    ...(row.localDataFiles ?? [])
  ]
    .join(" ")
    .toLowerCase();
}

function accessSignals(row) {
  const text = haystack(row);
  const payloadFileCount = row.payloadFiles?.length ?? 0;
  const localDataFileCount = row.localDataFiles?.length ?? 0;
  const explicitBulkTerms = [
    "open data",
    "download",
    "downloads",
    "downloadable",
    "datamart",
    "data files",
    "txt data",
    "report",
    "reports",
    "xlsx",
    "zip"
  ].filter((needle) => text.includes(needle));

  return {
    publicArcgisBulkOrQueryAvailable:
      text.includes("arcgis") ||
      text.includes("open data") ||
      text.includes("gis open data") ||
      text.includes("publicgis") ||
      text.includes("property data downloads") ||
      text.includes("downloadable assessor txt") ||
      text.includes("datamart"),
    sourceNativeParcelIdFieldKnown: text.includes("parcel") || text.includes("pin") || text.includes("taxsifter"),
    termsAcceptableEvidence: explicitBulkTerms.length > 0 || payloadFileCount > 0,
    hasPayloadFiles: payloadFileCount > 0,
    hasLocalDataFiles: localDataFileCount > 0,
    explicitBulkTerms,
    payloadFileCount,
    localDataFileCount
  };
}

function expectedBlocker(row, signals, yakimaRecapture) {
  if (row.county === "Yakima" && yakimaRecapture?.recaptureDecision === "source_recapture_blocked_interactive_lookup_only") {
    return "Known blocker: public source is interactive lookup/search only; no governed bulk/full source snapshot found.";
  }
  if (signals.hasPayloadFiles) {
    return "Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts.";
  }
  if (signals.publicArcgisBulkOrQueryAvailable) {
    return "Locate authoritative bulk/query layer, prove parcel ID field, capture full source snapshot, and hash receipt.";
  }
  if (signals.hasLocalDataFiles) {
    return "Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage.";
  }
  if (row.registryStatus !== "adapter-ready") {
    return "Registry is researched only; source access method and adapter contract must be verified first.";
  }
  return "Source artifact missing; first task is governed source capture and parcel ID semantics proof.";
}

function scoreCandidate(row, canonicalCounty, receiptReconciliation, yakimaRecapture) {
  const signals = accessSignals(row);
  let score = 0;
  const reasons = [];
  const penalties = [];

  if (row.registryStatus === "adapter-ready") {
    score += 2;
    reasons.push("adapter-ready registry status");
  } else {
    score -= 2;
    penalties.push("registry is researched, not adapter-ready");
  }

  if (row.priority === "P1") {
    score += 2;
    reasons.push("P1 acquisition priority");
  } else if (row.priority === "P2") {
    score += 1;
    reasons.push("P2 acquisition priority");
  } else {
    score -= 1;
    penalties.push("P3 acquisition priority");
  }

  if (row.classification === "public_source_seed") {
    score += 3;
    reasons.push("canonical rows already classified as public-source seed");
  }

  if (signals.publicArcgisBulkOrQueryAvailable) {
    score += 5;
    reasons.push("repo evidence indicates public bulk/query/open-data access");
  }

  if (signals.hasPayloadFiles) {
    score += 4;
    reasons.push(`${signals.payloadFileCount} payload file(s) already present`);
  }

  if (signals.hasLocalDataFiles) {
    score += 2;
    reasons.push(`${signals.localDataFileCount} local data evidence file(s) already present`);
    if (!signals.hasPayloadFiles && !signals.publicArcgisBulkOrQueryAvailable) {
      score -= 2;
      penalties.push("local data evidence is not receipt-grade without source recapture");
    }
  }

  if (signals.termsAcceptableEvidence) {
    score += 2;
    reasons.push("source text suggests public report/download posture");
  }

  if (signals.sourceNativeParcelIdFieldKnown) {
    score += 1;
    reasons.push("parcel identifier surface is named in source evidence");
  }

  const parcelRows = canonicalCounty?.parcelRows ?? 0;
  if (parcelRows > 0 && parcelRows <= 25000) {
    score += 2;
    reasons.push("small canonical row count lowers first-closure blast radius");
  } else if (parcelRows > 0 && parcelRows <= 75000) {
    score += 1;
    reasons.push("moderate canonical row count");
  } else if (parcelRows >= 200000) {
    score -= 1;
    penalties.push("large county row count increases closure cost");
  }

  if ((row.blockers ?? []).some((blocker) => blocker.toLowerCase().includes("demo/sample"))) {
    score -= 2;
    penalties.push("existing evidence contains demo/sample warning and must be replaced by governed capture");
  }

  if (row.county === "Yakima" && yakimaRecapture?.recaptureDecision === "source_recapture_blocked_interactive_lookup_only") {
    score -= 10;
    penalties.push("Yakima is known probe-only blocked by current recapture evidence");
  }

  if (receiptReconciliation.verifiedReceipts?.some((receipt) => receipt.fips === canonicalCounty?.fips)) {
    score = -999;
    penalties.push("already has verified receipt posture");
  }

  return {
    score,
    reasons,
    penalties,
    signals,
    expectedBlocker: expectedBlocker(row, signals, yakimaRecapture)
  };
}

export function buildSourceAcquisitionPrioritization({
  crosswalk,
  canonicalReconciliation,
  receiptReconciliation,
  yakimaRecapture
}) {
  const canonicalByFips = new Map(canonicalReconciliation.counties?.map((county) => [county.fips, county]) ?? []);
  const missingFips = new Set(receiptReconciliation.missingFips ?? []);
  const verifiedFips = new Set(receiptReconciliation.verifiedReceipts?.map((receipt) => receipt.fips) ?? []);

  const rows = crosswalk.rows
    .map((row) => {
      const fips = COUNTY_FIPS_BY_NAME.get(row.county);
      const canonicalCounty = canonicalByFips.get(fips);
      return {
        ...row,
        fips,
        canonicalParcelRows: canonicalCounty?.parcelRows ?? null
      };
    })
    .filter((row) => row.fips && row.fips !== "53005")
    .filter((row) => missingFips.has(row.fips))
    .map((row) => {
      const scoring = scoreCandidate(row, canonicalByFips.get(row.fips), receiptReconciliation, yakimaRecapture);
      return {
        county: row.county,
        fips: row.fips,
        priority: row.priority,
        registryStatus: row.registryStatus,
        classification: row.classification,
        acquisitionFamily: row.acquisitionFamily,
        officialAssessorBaseUrl: row.officialAssessorBaseUrl,
        primarySalesSource: row.primarySalesSource,
        fallbackSource: row.fallbackSource,
        gisMapSurface: row.gisMapSurface,
        canonicalParcelRows: row.canonicalParcelRows,
        payloadFileCount: scoring.signals.payloadFileCount,
        localDataFileCount: scoring.signals.localDataFileCount,
        publicArcgisBulkOrQueryAvailable: scoring.signals.publicArcgisBulkOrQueryAvailable,
        sourceNativeParcelIdFieldKnown: scoring.signals.sourceNativeParcelIdFieldKnown,
        termsAcceptableEvidence: scoring.signals.termsAcceptableEvidence,
        explicitBulkTerms: scoring.signals.explicitBulkTerms,
        score: scoring.score,
        rankReasons: scoring.reasons,
        rankPenalties: scoring.penalties,
        expectedBlocker: scoring.expectedBlocker,
        recommendedNextAction:
          row.county === "Yakima" ? "defer_until_governed_bulk_snapshot_exists" : "capture_source_snapshot_receipt"
      };
    })
    .sort((a, b) => b.score - a.score || a.county.localeCompare(b.county));

  const nextWave = rows.filter((row) => row.county !== "Yakima").slice(0, 5);
  const blockers = [];
  if (receiptReconciliation.productionBindingAllowed === true) {
    blockers.push("Receipt reconciliation unexpectedly allows production binding; prioritization expects binding to stay blocked.");
  }
  if (nextWave.length !== 5) blockers.push(`Expected 5 next-wave counties; found ${nextWave.length}.`);
  if ((receiptReconciliation.summary?.receiptsMissing ?? 0) > 0) {
    blockers.push(`${receiptReconciliation.summary.receiptsMissing} WA_INITIAL_SEED receipt gaps remain.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: "WA_INITIAL_SEED counties without verified receipt posture",
    requestedLabel: "37-county source acquisition prioritization",
    actualRemainingUnverifiedCount: rows.length,
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      note:
        "This ranks source acquisition work only. It does not certify runtime, mutate canonical rows, or permit production DB binding."
    },
    inputs: {
      receiptSummary: receiptReconciliation.summary,
      verifiedFips: [...verifiedFips].sort(),
      missingFips: [...missingFips].sort(),
      yakimaRecaptureDecision: yakimaRecapture?.recaptureDecision ?? null
    },
    rankingRules: [
      "Prefer verified public bulk/query/download sources over interactive-only search pages.",
      "Prefer counties with payload files or public open-data/download evidence already present.",
      "Prefer adapter-ready/P1 counties.",
      "Prefer smaller or moderate row counts for fast receipt closure.",
      "Penalize demo/sample evidence until recaptured from governed source artifacts.",
      "Penalize known probe-only blocked counties."
    ],
    nextWave,
    rankedCounties: rows,
    blockedButKnown: rows.filter((row) => row.county === "Yakima"),
    blockers
  };
}

function renderMarkdown(report) {
  const waveRows = report.nextWave
    .map(
      (row, index) =>
        `| ${index + 1} | ${row.county} | ${row.fips} | ${row.score} | ${row.acquisitionFamily} | ${row.canonicalParcelRows} | ${row.expectedBlocker} |`
    )
    .join("\n");
  const rankedRows = report.rankedCounties
    .map(
      (row, index) =>
        `| ${index + 1} | ${row.county} | ${row.fips} | ${row.score} | ${row.publicArcgisBulkOrQueryAvailable ? "yes" : "no"} | ${row.payloadFileCount} | ${row.localDataFileCount} | ${row.expectedBlocker} |`
    )
    .join("\n");
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";

  return `# June 10 Source Acquisition Prioritization

Generated: ${report.generatedAt}

## Verdict

- Scope: ${report.scope}
- Requested label: ${report.requestedLabel}
- Actual remaining unverified counties: ${report.actualRemainingUnverifiedCount}
- DB mutation attempted: ${report.doctrine.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.doctrine.productionBindingAllowed ? "yes" : "no"}
- Runtime claim allowed: ${report.doctrine.runtimeClaimAllowed ? "yes" : "no"}

## Next 5-County Acquisition Wave

| Rank | County | FIPS | Score | Acquisition family | Canonical rows | Expected blocker |
| ---: | --- | --- | ---: | --- | ---: | --- |
${waveRows}

## Full Ranking

| Rank | County | FIPS | Score | Bulk/query signal | Payload files | Local data files | Expected blocker |
| ---: | --- | --- | ---: | --- | ---: | ---: | --- |
${rankedRows}

## Ranking Rules

${report.rankingRules.map((rule) => `- ${rule}`).join("\n")}

## Blockers

${blockers}
`;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    crosswalk: args.get("crosswalk") ?? DEFAULT_CROSSWALK,
    canonicalReconciliation: args.get("canonical-reconciliation") ?? DEFAULT_CANONICAL_RECONCILIATION,
    receiptReconciliation: args.get("receipt-reconciliation") ?? DEFAULT_RECEIPT_RECONCILIATION,
    yakimaRecapture: args.get("yakima-recapture") ?? DEFAULT_YAKIMA_RECAPTURE,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };

  const report = buildSourceAcquisitionPrioritization({
    crosswalk: readJson(paths.crosswalk),
    canonicalReconciliation: readJson(paths.canonicalReconciliation),
    receiptReconciliation: readJson(paths.receiptReconciliation),
    yakimaRecapture: fs.existsSync(paths.yakimaRecapture) ? readJson(paths.yakimaRecapture) : null
  });

  report.supportingArtifacts = [
    { path: relativePath(paths.crosswalk), sha256: sha256File(paths.crosswalk) },
    { path: relativePath(paths.canonicalReconciliation), sha256: sha256File(paths.canonicalReconciliation) },
    { path: relativePath(paths.receiptReconciliation), sha256: sha256File(paths.receiptReconciliation) },
    {
      path: relativePath(paths.yakimaRecapture),
      sha256: fs.existsSync(paths.yakimaRecapture) ? sha256File(paths.yakimaRecapture) : null
    }
  ];

  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));

  console.log(`Source acquisition prioritization written: ${relativePath(paths.outJson)}`);
  console.log(`Remaining unverified: ${report.actualRemainingUnverifiedCount}`);
  console.log(`Next wave: ${report.nextWave.map((row) => row.county).join(", ")}`);
  console.log(`Production binding allowed: ${report.doctrine.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
