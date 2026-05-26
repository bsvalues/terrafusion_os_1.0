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
const DEFAULT_CAPTURE_METADATA = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "cowlitz",
  "cowlitz-parcels-parcno-capture-metadata.json"
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
const DEFAULT_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-source-receipt-hash-reconciliation.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-source-receipt-hash-reconciliation.latest.md"
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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
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

export function summarizeCowlitzJsonl(rawText) {
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const pageSummaries = [];
  let totalFeatures = 0;

  for (const [index, line] of lines.entries()) {
    const payload = JSON.parse(line);
    const features = payload.features ?? [];
    totalFeatures += features.length;
    pageSummaries.push({
      page: index + 1,
      features: features.length,
      exceededTransferLimit: payload.exceededTransferLimit === true,
      firstParcelNumber: features[0]?.attributes?.PARCNO ?? null,
      lastParcelNumber: features.at(-1)?.attributes?.PARCNO ?? null,
      lineSha256: sha256Text(line)
    });
  }

  return {
    lineCount: lines.length,
    totalFeatures,
    pageSummaries
  };
}

export function computeHashVariants(rawBuffer) {
  const rawText = rawBuffer.toString("utf8");
  const trimmed = rawText.trimEnd();
  const finalLf = rawText.endsWith("\n") ? rawText : `${rawText}\n`;
  const crlfToLf = rawText.replace(/\r\n/g, "\n");
  const lfToCrlf = rawText.replace(/\r?\n/g, "\r\n");
  const firstLine = rawText.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const minifiedJsonl = rawText
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.stringify(JSON.parse(line)))
    .join("\n");

  return [
    { name: "raw_current_bytes", sha256: sha256Buffer(rawBuffer) },
    { name: "ensure_final_lf", sha256: sha256Text(finalLf) },
    { name: "trim_end", sha256: sha256Text(trimmed) },
    { name: "crlf_to_lf", sha256: sha256Text(crlfToLf) },
    { name: "lf_to_crlf", sha256: sha256Text(lfToCrlf) },
    { name: "first_jsonl_line_only", sha256: sha256Text(firstLine) },
    { name: "first_jsonl_line_with_lf", sha256: sha256Text(`${firstLine}\n`) },
    { name: "jsonl_pages_minified", sha256: sha256Text(minifiedJsonl) },
    { name: "jsonl_pages_minified_with_lf", sha256: sha256Text(`${minifiedJsonl}\n`) }
  ];
}

export function decideCowlitzReceiptHashPosture({
  receiptHash,
  metadataHash,
  currentRawHash,
  variantMatches,
  receiptFeatureCount,
  currentFeatureCount
}) {
  const blockers = [];

  if (!receiptHash) blockers.push("Source snapshot receipt does not record a raw artifact hash.");
  if (!metadataHash) blockers.push("Capture metadata does not record a raw artifact hash.");
  if (receiptHash && metadataHash && receiptHash !== metadataHash) {
    blockers.push("Source snapshot receipt hash and capture metadata hash disagree.");
  }

  if (receiptHash && receiptHash === currentRawHash) {
    return {
      decision: "receipt_hash_parity_restored",
      hashParityRestored: true,
      parityMode: "raw_current_bytes",
      dryRunInvalidated: false,
      cowlitzCorrectionAuthorizationReady: true,
      productionBindingAllowed: false,
      blockers
    };
  }

  if (variantMatches.length > 0) {
    const variantNames = variantMatches.map((match) => match.name);
    const lineEndingOnly = variantNames.every((name) => name === "lf_to_crlf" || name === "crlf_to_lf");
    if (lineEndingOnly) {
      blockers.push(
        `Raw-byte hash differs because the receipt hash matches line-ending variant(s): ${variantNames.join(", ")}.`
      );
      blockers.push("Cowlitz correction authorization remains blocked until the dry-run consumes this reconciliation evidence.");
      return {
        decision: "receipt_corrected",
        hashParityRestored: true,
        parityMode: variantNames.join(","),
        dryRunInvalidated: false,
        cowlitzCorrectionAuthorizationReady: false,
        productionBindingAllowed: false,
        blockers
      };
    }

    blockers.push(`Receipt hash matches computed non-byte variant(s): ${variantNames.join(", ")}.`);
    return {
      decision: "hash_computation_variant_identified",
      hashParityRestored: false,
      parityMode: variantNames.join(","),
      dryRunInvalidated: true,
      cowlitzCorrectionAuthorizationReady: false,
      productionBindingAllowed: false,
      blockers
    };
  }

  if (receiptFeatureCount !== null && currentFeatureCount !== receiptFeatureCount) {
    blockers.push(
      `Current raw artifact feature count ${currentFeatureCount} differs from receipt count ${receiptFeatureCount}.`
    );
    return {
      decision: "source_recapture_required",
      hashParityRestored: false,
      parityMode: null,
      dryRunInvalidated: true,
      cowlitzCorrectionAuthorizationReady: false,
      productionBindingAllowed: false,
      blockers
    };
  }

  blockers.push(
    "Receipt and capture metadata agree, but current raw artifact bytes do not match and no line-ending/order/wrapper variant explains the mismatch."
  );
  blockers.push("Cowlitz bounded correction dry-run remains invalid for authorization until source is recaptured or a matching artifact is restored.");

  return {
    decision: "source_recapture_required",
    hashParityRestored: false,
    parityMode: null,
    dryRunInvalidated: true,
    cowlitzCorrectionAuthorizationReady: false,
    productionBindingAllowed: false,
    blockers
  };
}

export function buildCowlitzSourceReceiptHashReconciliation({
  rawBuffer,
  receipt,
  captureMetadata,
  dryRun,
  rawArtifactPath,
  rawArtifactModifiedAtUtc
}) {
  const rawText = rawBuffer.toString("utf8");
  const jsonlSummary = summarizeCowlitzJsonl(rawText);
  const variants = computeHashVariants(rawBuffer);
  const currentRawHash = variants.find((variant) => variant.name === "raw_current_bytes").sha256;
  const receiptRawArtifact = receipt.rawArtifacts?.[0] ?? {};
  const receiptHash = receiptRawArtifact.sha256 ?? null;
  const metadataHash = captureMetadata.rawArtifactSha256 ?? null;
  const variantMatches = variants.filter((variant) => variant.sha256 === receiptHash);
  const decision = decideCowlitzReceiptHashPosture({
    receiptHash,
    metadataHash,
    currentRawHash,
    variantMatches,
    receiptFeatureCount: receipt.counts?.parcelRowsExtracted ?? null,
    currentFeatureCount: jsonlSummary.totalFeatures
  });

  return {
    generatedAt: new Date().toISOString(),
    countyName: "Cowlitz County",
    fips: "53015",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    cowlitzCorrectionAuthorizationReady: decision.cowlitzCorrectionAuthorizationReady,
    dryRunInvalidated: decision.dryRunInvalidated,
    hashParityRestored: decision.hashParityRestored,
    parityMode: decision.parityMode,
    decision: decision.decision,
    rawArtifact: {
      path: relativePath(rawArtifactPath),
      currentSha256: currentRawHash,
      currentBytes: rawBuffer.length,
      currentModifiedAtUtc: rawArtifactModifiedAtUtc,
      lineCount: jsonlSummary.lineCount,
      totalFeatures: jsonlSummary.totalFeatures
    },
    receiptArtifact: {
      path: receiptRawArtifact.path ?? null,
      sha256: receiptHash,
      capturedAtUtc: receiptRawArtifact.capturedAtUtc ?? receipt.capturedAtUtc ?? null,
      parcelRowsExtracted: receipt.counts?.parcelRowsExtracted ?? null,
      parcelRowsNormalized: receipt.counts?.parcelRowsNormalized ?? null
    },
    captureMetadata: {
      path: relativePath(DEFAULT_CAPTURE_METADATA),
      sha256: metadataHash,
      capturedAtUtc: captureMetadata.capturedAtUtc ?? null,
      expectedSourceCount: captureMetadata.expectedSourceCount ?? null,
      capturedFeatureRows: captureMetadata.capturedFeatureRows ?? null,
      pageSize: captureMetadata.pageSize ?? null,
      pages: captureMetadata.pages ?? null
    },
    sourceCaptureTimestampComparison: {
      metadataCapturedAtUtc: captureMetadata.capturedAtUtc ?? null,
      receiptCapturedAtUtc: receiptRawArtifact.capturedAtUtc ?? receipt.capturedAtUtc ?? null,
      rawArtifactModifiedAtUtc,
      dryRunGeneratedAtUtc: dryRun.generatedAt ?? null,
      receiptAndMetadataHashesAgree: Boolean(receiptHash && receiptHash === metadataHash),
      receiptAndCurrentRawHashesAgree: Boolean(receiptHash && receiptHash === currentRawHash)
    },
    hashVariantChecks: variants.map((variant) => ({
      ...variant,
      matchesReceipt: variant.sha256 === receiptHash
    })),
    pageSummary: {
      firstPage: jsonlSummary.pageSummaries[0] ?? null,
      lastPage: jsonlSummary.pageSummaries.at(-1) ?? null,
      pagesWithTransferLimit: jsonlSummary.pageSummaries.filter((page) => page.exceededTransferLimit).length,
      pagesWithoutTransferLimit: jsonlSummary.pageSummaries.filter((page) => !page.exceededTransferLimit).length
    },
    ruledOutCauses: variants
      .filter((variant) => variant.name !== "raw_current_bytes" && variant.sha256 !== receiptHash)
      .map((variant) => variant.name),
    likelyCause:
      decision.decision === "receipt_corrected"
        ? "receipt hash was computed over CRLF-normalized JSONL bytes while the current artifact is stored with LF line endings"
        : "raw artifact was superseded after the receipt, or the receipt points to a prior capture artifact",
    requiredNextAction:
      decision.decision === "receipt_hash_parity_restored"
        ? "rerun Cowlitz bounded correction dry-run"
        : decision.decision === "receipt_corrected"
          ? "rerun Cowlitz bounded correction dry-run with this line-ending-aware receipt reconciliation evidence"
        : "recapture Cowlitz source artifact with a new governed receipt, then rerun Cowlitz bounded correction dry-run",
    blockers: decision.blockers
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  const variants = report.hashVariantChecks
    .map((variant) => `| ${variant.name} | ${variant.sha256} | ${variant.matchesReceipt ? "yes" : "no"} |`)
    .join("\n");

  return `# Cowlitz Source Receipt Hash Reconciliation

Generated: ${report.generatedAt}

## Verdict

- Decision: ${report.decision}
- Hash parity restored: ${report.hashParityRestored ? "yes" : "no"}
- Parity mode: ${report.parityMode ?? "none"}
- DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Cowlitz correction authorization ready: ${report.cowlitzCorrectionAuthorizationReady ? "yes" : "no"}
- Dry-run invalidated for authorization: ${report.dryRunInvalidated ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Hashes

| Artifact | SHA-256 |
| --- | --- |
| Current raw artifact | ${report.rawArtifact.currentSha256} |
| Source snapshot receipt | ${report.receiptArtifact.sha256 ?? "missing"} |
| Capture metadata | ${report.captureMetadata.sha256 ?? "missing"} |

## Timestamp Comparison

| Source | Timestamp |
| --- | --- |
| Capture metadata | ${report.sourceCaptureTimestampComparison.metadataCapturedAtUtc ?? "missing"} |
| Source snapshot receipt | ${report.sourceCaptureTimestampComparison.receiptCapturedAtUtc ?? "missing"} |
| Current raw artifact mtime | ${report.sourceCaptureTimestampComparison.rawArtifactModifiedAtUtc ?? "missing"} |
| Cowlitz dry-run generated | ${report.sourceCaptureTimestampComparison.dryRunGeneratedAtUtc ?? "missing"} |

## Raw Artifact Shape

| Metric | Value |
| --- | ---: |
| Bytes | ${report.rawArtifact.currentBytes} |
| JSONL pages | ${report.rawArtifact.lineCount} |
| Features | ${report.rawArtifact.totalFeatures} |
| Pages with transfer limit | ${report.pageSummary.pagesWithTransferLimit} |
| Pages without transfer limit | ${report.pageSummary.pagesWithoutTransferLimit} |

## Variant Checks

| Variant | SHA-256 | Matches receipt |
| --- | --- | --- |
${variants}

## Decision

${report.requiredNextAction}

Likely cause: ${report.likelyCause}.

## Blockers

${blockers}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawArtifactPath = args.get("source-raw") ?? DEFAULT_SOURCE_RAW;
  const receiptPath = args.get("source-receipt") ?? DEFAULT_SOURCE_RECEIPT;
  const metadataPath = args.get("capture-metadata") ?? DEFAULT_CAPTURE_METADATA;
  const dryRunPath = args.get("dry-run") ?? DEFAULT_DRY_RUN;
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;

  const stat = fs.statSync(rawArtifactPath);
  const report = buildCowlitzSourceReceiptHashReconciliation({
    rawBuffer: fs.readFileSync(rawArtifactPath),
    receipt: readJson(receiptPath),
    captureMetadata: readJson(metadataPath),
    dryRun: readJson(dryRunPath),
    rawArtifactPath,
    rawArtifactModifiedAtUtc: stat.mtime.toISOString()
  });

  writeJson(outJson, report);
  writeText(outMd, renderMarkdown(report));

  console.log(`Cowlitz source receipt hash reconciliation written: ${relativePath(outJson)}`);
  console.log(`Decision: ${report.decision}`);
  console.log(`Current raw hash: ${report.rawArtifact.currentSha256}`);
  console.log(`Receipt hash: ${report.receiptArtifact.sha256 ?? "missing"}`);
  console.log(`DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
