import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCowlitzBoundedCorrectionDryRun,
  parseCanonicalParcelNumbers,
  parseCowlitzSourceParcno,
  probeCowlitzCurrentSource
} from "./june10-cowlitz-bounded-correction-dry-run.mjs";

test("Cowlitz correction dry-run stages source-only and supersedes canonical-only without mutation", () => {
  const source = parseCowlitzSourceParcno(
    JSON.stringify({
      features: [
        { attributes: { PARCNO: "A" } },
        { attributes: { PARCNO: "B" } },
        { attributes: { PARCNO: "B" } },
        { attributes: { PARCNO: "C" } }
      ]
    })
  );
  const canonical = parseCanonicalParcelNumbers("ParcelNumber\nA\nD\n");
  const report = buildCowlitzBoundedCorrectionDryRun({
    source,
    canonical,
    closure: { status: "bounded_correction_plan_required" },
    sourceReceipt: { sourceSystem: { url: "https://example.invalid/query" } },
    currentSourceProbe: {
      attempted: true,
      requestedCount: 1,
      found: [],
      absent: ["D"],
      errors: []
    }
  });

  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.currentDeltas.sourceOnlyCount, 2);
  assert.equal(report.currentDeltas.canonicalOnlyCount, 1);
  assert.equal(report.currentDeltas.sourceDuplicateGroups, 1);
  assert.equal(report.proposedCorrection.postCorrectionIdentityParityPossible, true);
  assert.equal(report.proposedSupersede[0].classification, "stale_canonical_candidate");
  assert.equal(report.proposedStage.every((row) => row.loadableNow === false), true);
  assert.match(report.blockers.join("\n"), /Expected 321 source-only identifiers/);
});

test("Cowlitz current source probe records found and absent identifiers", async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(String(url));
    return {
      ok: true,
      async json() {
        return {
          features: [
            { attributes: { PARCNO: "A" } }
          ]
        };
      }
    };
  };

  const result = await probeCowlitzCurrentSource({
    sourceUrl: "https://example.test/arcgis/query",
    parcelNumbers: ["A", "B"],
    fetchImpl: fakeFetch
  });

  assert.equal(result.attempted, true);
  assert.equal(result.found.length, 1);
  assert.equal(result.absent.length, 1);
  assert.equal(result.absent[0], "B");
  assert.equal(result.errors.length, 0);
  assert.match(calls[0], /PARCNO/);
});

test("Cowlitz correction dry-run blocks authorization when source artifact hash mismatches receipt", () => {
  const source = parseCowlitzSourceParcno(
    JSON.stringify({
      features: [
        { attributes: { PARCNO: "A" } },
        { attributes: { PARCNO: "B" } }
      ]
    })
  );
  const canonical = parseCanonicalParcelNumbers("ParcelNumber\nA\nD\n");
  const report = buildCowlitzBoundedCorrectionDryRun({
    source,
    canonical,
    closure: { status: "bounded_correction_plan_required" },
    sourceReceipt: { sourceSystem: { url: "https://example.invalid/query" } },
    currentSourceProbe: {
      attempted: true,
      requestedCount: 1,
      found: [],
      absent: ["D"],
      errors: []
    },
    sourceArtifactIntegrity: {
      expectedSha256: "expected",
      actualSha256: "actual",
      matches: false
    }
  });

  assert.equal(report.dryRunStatus, "dry_run_blocked");
  assert.equal(report.receiptCandidate.status, "dry_run_blocked");
  assert.match(report.blockers.join("\n"), /hash does not match/);
});

test("Cowlitz correction dry-run accepts hash mismatch only with matching reconciliation evidence", () => {
  const source = parseCowlitzSourceParcno(
    JSON.stringify({
      features: [
        { attributes: { PARCNO: "A" } },
        { attributes: { PARCNO: "B" } }
      ]
    })
  );
  const canonical = parseCanonicalParcelNumbers("ParcelNumber\nA\nD\n");
  const report = buildCowlitzBoundedCorrectionDryRun({
    source,
    canonical,
    closure: { status: "bounded_correction_plan_required" },
    sourceReceipt: { sourceSystem: { url: "https://example.invalid/query" } },
    currentSourceProbe: {
      attempted: true,
      requestedCount: 1,
      found: [],
      absent: ["D"],
      errors: []
    },
    sourceArtifactIntegrity: {
      expectedSha256: "receipt",
      actualSha256: "raw",
      matches: false
    },
    sourceReceiptHashReconciliation: {
      decision: "receipt_corrected",
      hashParityRestored: true,
      parityMode: "lf_to_crlf",
      receiptArtifact: { sha256: "receipt" },
      rawArtifact: { currentSha256: "raw" }
    }
  });

  assert.equal(report.sourceReceiptHashReconciliation.acceptedForDryRun, true);
  assert.doesNotMatch(report.blockers.join("\n"), /hash does not match/);
});
