import assert from "node:assert/strict";
import test from "node:test";

import { buildYakimaSourceArtifactRecapture } from "./june10-yakima-source-artifact-recapture.mjs";

const endpointDiscovery = {
  sourceSearchPage: "https://yes.co.yakima.wa.us/AssessorAPI/Property_Search.html",
  sourceApplicationScript: "https://yes.co.yakima.wa.us/AssessorAPI/JS/property-search-ng-app.js",
  parcelDetailEndpointTemplate:
    "https://yes.co.yakima.wa.us/AssessorAPI/ParcelDetails/GetByParcelNumber/{parcelNumber}",
  parcelSearchEndpointTemplate:
    "https://yes.co.yakima.wa.us/AssessorAPI/ParcelDetails/GetByParcelString/{parcelPrefixOrPattern}",
  endpointsDiscovered: ["/ParcelDetails/GetByParcelNumber/", "/ParcelDetails/GetByParcelString/"],
  supportsParcelDetailLookup: true,
  supportsParcelStringSearch: true,
  bulkExportEndpointDetected: false,
  bulkExportEndpointEvidence: null,
  termsPosture: "Public assessor search UI exposes parcel detail/search APIs; no bulk export endpoint was found."
};

const closure = {
  status: "blocked_source_canonical_delta",
  sourceParcelIdField: "AssessorNumber",
  postRepairIdentityOverlap: {
    sourceOnlyCount: 100,
    canonicalOnlyCount: 3360
  },
  deltaClassification: {
    sourceOnly: {
      sample: ["17140922403"]
    },
    canonicalOnly: {
      sample: ["10070199992"]
    }
  }
};

function buildReport(overrides = {}) {
  return buildYakimaSourceArtifactRecapture({
    closure,
    endpointDiscovery,
    appSourceHash: "app-hash",
    sourceOnlyProbes: [
      {
        requestedParcelNumber: "17140922403",
        classification: "found_in_current_source",
        foundInCurrentSource: true
      }
    ],
    canonicalOnlyProbes: [
      {
        requestedParcelNumber: "10070199992",
        classification: "not_found_in_current_source",
        foundInCurrentSource: false
      }
    ],
    probeArtifactPath: "os-platform/core/pilot/evidence/probe.jsonl",
    probeArtifactSha256: "probe-hash",
    probeReceiptPath: "os-platform/core/pilot/evidence/probe-receipt.json",
    probeReceiptSha256: "receipt-hash",
    maxProbesPerClass: 50,
    ...overrides
  });
}

test("Yakima recapture blocks full receipt conversion when only interactive lookup APIs are found", () => {
  const report = buildReport();

  assert.equal(report.recaptureDecision, "source_recapture_blocked_interactive_lookup_only");
  assert.equal(report.sourceArtifactStatus, "probe_artifact_only");
  assert.equal(report.sourceSnapshotReceiptEmitted, false);
  assert.equal(report.sourceProbeReceiptEmitted, true);
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.certificationAllowed, false);
  assert.equal(report.boundedCorrectionDryRunViable, false);
  assert.match(report.blockers.join("\n"), /did not expose a governed bulk\/full-source export endpoint/);
});

test("Yakima recapture records sample evidence without pretending full delta classification", () => {
  const report = buildReport();

  assert.equal(report.sourceOnlyProbeSummary.foundInCurrentSource, 1);
  assert.equal(report.canonicalOnlyProbeSummary.notFoundInCurrentSource, 1);
  assert.equal(report.deltaClassification.sourceOnly, "sample_confirms_live_source_rows_missing_from_canonical");
  assert.equal(report.deltaClassification.canonicalOnly, "sample_confirms_canonical_rows_absent_from_current_source");
  assert.equal(
    report.deltaClassification.fullDeltaClassification,
    "blocked_until_full_source_snapshot_or_complete_delta_probe_is_available"
  );
});

test("Yakima bounded correction dry-run is viable only with full snapshot and complete probes", () => {
  const report = buildReport({
    closure: {
      ...closure,
      postRepairIdentityOverlap: {
        sourceOnlyCount: 1,
        canonicalOnlyCount: 1
      }
    },
    endpointDiscovery: {
      ...endpointDiscovery,
      bulkExportEndpointDetected: true
    }
  });

  assert.equal(report.sourceArtifactStatus, "full_source_snapshot_captured");
  assert.equal(report.boundedCorrectionDryRunViable, true);
  assert.equal(report.productionBindingAllowed, false);
});
