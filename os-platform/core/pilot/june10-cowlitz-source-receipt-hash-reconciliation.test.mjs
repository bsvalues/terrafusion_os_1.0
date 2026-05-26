import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCowlitzSourceReceiptHashReconciliation,
  computeHashVariants,
  decideCowlitzReceiptHashPosture,
  summarizeCowlitzJsonl
} from "./june10-cowlitz-source-receipt-hash-reconciliation.mjs";

test("Cowlitz hash posture requires recapture when receipt and metadata agree but raw bytes differ", () => {
  const posture = decideCowlitzReceiptHashPosture({
    receiptHash: "receipt",
    metadataHash: "receipt",
    currentRawHash: "current",
    variantMatches: [],
    receiptFeatureCount: 2,
    currentFeatureCount: 2
  });

  assert.equal(posture.decision, "source_recapture_required");
  assert.equal(posture.dryRunInvalidated, true);
  assert.equal(posture.cowlitzCorrectionAuthorizationReady, false);
  assert.match(posture.blockers.join("\n"), /current raw artifact bytes do not match/);
});

test("Cowlitz hash posture restores authorization only on exact raw hash parity", () => {
  const posture = decideCowlitzReceiptHashPosture({
    receiptHash: "same",
    metadataHash: "same",
    currentRawHash: "same",
    variantMatches: [{ name: "raw_current_bytes", sha256: "same" }],
    receiptFeatureCount: 2,
    currentFeatureCount: 2
  });

  assert.equal(posture.decision, "receipt_hash_parity_restored");
  assert.equal(posture.hashParityRestored, true);
  assert.equal(posture.dryRunInvalidated, false);
  assert.equal(posture.cowlitzCorrectionAuthorizationReady, true);
});

test("Cowlitz hash posture corrects receipt mismatch when CRLF variant matches", () => {
  const posture = decideCowlitzReceiptHashPosture({
    receiptHash: "crlf",
    metadataHash: "crlf",
    currentRawHash: "lf",
    variantMatches: [{ name: "lf_to_crlf", sha256: "crlf" }],
    receiptFeatureCount: 2,
    currentFeatureCount: 2
  });

  assert.equal(posture.decision, "receipt_corrected");
  assert.equal(posture.hashParityRestored, true);
  assert.equal(posture.parityMode, "lf_to_crlf");
  assert.equal(posture.dryRunInvalidated, false);
  assert.equal(posture.cowlitzCorrectionAuthorizationReady, false);
});

test("Cowlitz JSONL summary counts pages and features", () => {
  const rawText = [
    JSON.stringify({
      exceededTransferLimit: true,
      features: [
        { attributes: { PARCNO: "A" } },
        { attributes: { PARCNO: "B" } }
      ]
    }),
    JSON.stringify({
      exceededTransferLimit: false,
      features: [{ attributes: { PARCNO: "C" } }]
    })
  ].join("\n");

  const summary = summarizeCowlitzJsonl(rawText);

  assert.equal(summary.lineCount, 2);
  assert.equal(summary.totalFeatures, 3);
  assert.equal(summary.pageSummaries[0].firstParcelNumber, "A");
  assert.equal(summary.pageSummaries[1].lastParcelNumber, "C");
});

test("Cowlitz reconciliation report keeps DB mutation and production binding blocked on mismatch", () => {
  const rawText = `${JSON.stringify({ features: [{ attributes: { PARCNO: "A" } }] })}\n`;
  const currentRawHash = computeHashVariants(Buffer.from(rawText)).find(
    (variant) => variant.name === "raw_current_bytes"
  ).sha256;
  const report = buildCowlitzSourceReceiptHashReconciliation({
    rawBuffer: Buffer.from(rawText),
    receipt: {
      rawArtifacts: [{ path: "raw.jsonl", sha256: "different", capturedAtUtc: "2026-05-26T00:00:00.000Z" }],
      counts: { parcelRowsExtracted: 1, parcelRowsNormalized: 1 }
    },
    captureMetadata: {
      rawArtifactSha256: "different",
      capturedAtUtc: "2026-05-26T00:00:00.000Z"
    },
    dryRun: { generatedAt: "2026-05-26T01:00:00.000Z" },
    rawArtifactPath: "os-platform/core/pilot/evidence/example.jsonl",
    rawArtifactModifiedAtUtc: "2026-05-26T02:00:00.000Z"
  });

  assert.equal(report.rawArtifact.currentSha256, currentRawHash);
  assert.equal(report.decision, "source_recapture_required");
  assert.equal(report.hashParityRestored, false);
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.cowlitzCorrectionAuthorizationReady, false);
});
