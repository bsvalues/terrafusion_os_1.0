# June 10 38-County Seed Receipt Contract

Date: 2026-05-14
Mode: wait-state receipt contract for the 38-county initial seed lane
Scope: artifact schema, statuses, gates, and folder convention only

## Purpose

The 38-county initial seed lane needs a receipt system before any source fetch, staging load, or runtime claim. This contract defines the minimum evidence each county must produce to move from source registry to loaded TerraFusion seed data.

This does not load data, fetch public sources, or mutate any TerraFusion DB.

## Artifact Root

Recommended root:

```text
evidence/june10-38-county-seed/YYYY-MM-DD/
```

Per-county folder:

```text
evidence/june10-38-county-seed/YYYY-MM-DD/{county-token}/
```

Required files per county attempt:

```text
source-snapshot-receipt.json
source-snapshot-receipt.md
normalized-load-manifest.json
normalized-load-manifest.md
terrafusion-load-receipt.json
terrafusion-load-receipt.md
api-proof.json
api-proof.md
ui-smoke-receipt.md
seed-status.md
```

Files may be absent only when the status clearly shows the lane has not reached that gate.

## Status Model

| Status | Meaning | Claim allowed |
|---|---|---|
| `NOT_STARTED` | No seed attempt has started | registry/provenance only |
| `SOURCE_DECISION_READY` | Registry source family is known | source identified |
| `ATTEMPT` | Work started but one or more gates failed | attempt only |
| `SNAPSHOT_CAPTURED` | Raw public snapshot exists with hash and timestamp | acquisition captured |
| `NORMALIZED_READY` | Normalized TerraFusion-owned payload exists | load candidate |
| `LOADED_NEEDS_API_PROOF` | Staging TerraFusion DB load receipt exists | loaded seed, not runtime proven |
| `API_PROVEN_NEEDS_UI_SMOKE` | API returns county rows with correct identity | API-proven seed |
| `LIMITED_WORKFLOW_READY` | Basic UI smoke passed with trust label and limits | limited workflow |
| `BLOCKED` | Work cannot proceed without source/data/product decision | blocked |

No status implies official/certified valuation readiness.

## Receipt JSON Shape

```json
{
  "receiptVersion": "june10-seed-v1",
  "status": "ATTEMPT",
  "county": "Yakima",
  "countyToken": "yakima",
  "state": "WA",
  "fips": "53077",
  "capturedAtUtc": "2026-05-14T00:00:00.000Z",
  "capturedBy": "operator-or-agent-id",
  "sourceFamily": "Direct sales search",
  "sourceSystem": {
    "name": "Yakima Spatialest",
    "url": "https://property.spatialest.com/wa/yakima#/",
    "accessType": "public",
    "termsOrRobotsNotes": "recorded separately",
    "requiresCredential": false
  },
  "rawArtifacts": [
    {
      "path": "raw/yakima-parcels.json",
      "sha256": "sha256-here",
      "bytes": 0,
      "recordCount": 0,
      "capturedAtUtc": "2026-05-14T00:00:00.000Z"
    }
  ],
  "normalizedArtifacts": [
    {
      "path": "normalized/yakima-parcels.normalized.jsonl",
      "sha256": "sha256-here",
      "schema": "terrafusion-public-parcel-v1",
      "recordCount": 0
    }
  ],
  "target": {
    "terrafusionDbIdentity": "redacted-or-hash",
    "databaseRole": "38-county-seed-staging",
    "schema": "public_seed",
    "tables": ["tf_seed_parcel", "tf_seed_sale"]
  },
  "counts": {
    "parcelRowsRaw": 0,
    "parcelRowsNormalized": 0,
    "parcelRowsLoaded": 0,
    "distinctParcelIdsLoaded": 0,
    "activeCurrentParcelIdsLoaded": null,
    "salesRowsRaw": 0,
    "salesRowsNormalized": 0,
    "salesRowsLoaded": 0,
    "geometryRowsLoaded": 0
  },
  "coverage": {
    "parcelStatusSemantics": "known | unknown | not_provided",
    "taxYearSemantics": "known | unknown | not_provided",
    "salesDateRange": {
      "min": null,
      "max": null
    },
    "expectedActiveParcelRange": {
      "min": null,
      "max": null,
      "source": null
    }
  },
  "apiProof": {
    "endpoint": null,
    "status": null,
    "payloadCounty": null,
    "countyEcho": false,
    "fallbackDetected": false,
    "rowCount": 0
  },
  "uiSmoke": {
    "performed": false,
    "frontendUrl": null,
    "screenshotFolder": null,
    "trustLabelVisible": false,
    "unsupportedWorkflowLabelsVisible": false
  },
  "workflowLabels": {
    "parcelInspection": "blocked",
    "salesReview": "blocked",
    "mapInspection": "blocked",
    "costForgeEstimate": "blocked",
    "officialValuation": "blocked"
  },
  "claimLabel": "registry/provenance only",
  "warnings": [],
  "blockers": [],
  "noSecretValuesRecorded": true
}
```

## Required Markdown Summary

Every JSON receipt needs a human-readable summary:

```text
# {County} June 10 Initial Seed Receipt

Status:
Claim label:
Captured at UTC:
Source family:
Source system:
Raw artifacts:
Normalized artifacts:
Target TerraFusion DB role:
Parcel rows loaded:
Distinct parcel IDs loaded:
Sales rows loaded:
API proof:
UI smoke:
Warnings:
Blockers:
Next action:
```

## Gate Rules

### Gate A: Source Snapshot

Passes when:

- `sourceSystem.url` is populated;
- at least one raw artifact exists;
- every raw artifact has a SHA-256 hash;
- every raw artifact has `capturedAtUtc`;
- `noSecretValuesRecorded` is true;
- blockers do not include sample/demo/source-access failure.

### Gate B: Normalized Payload

Passes when:

- at least one normalized artifact exists;
- every normalized artifact has a TerraFusion-owned schema name;
- `county`, `countyToken`, `state`, and `fips` are populated;
- normalized parcel rows are greater than zero;
- status semantics are recorded as known, unknown, or not provided.

### Gate C: TerraFusion Load

Passes when:

- target DB identity is recorded in redacted/hash form;
- target database role is `38-county-seed-staging` or another explicitly approved isolated role;
- parcel rows loaded are greater than zero;
- distinct parcel IDs loaded are greater than zero;
- product-load receipt exists;
- no fallback county is detected.

### Gate D: API Proof

Passes when:

- API endpoint is recorded;
- API status is 200;
- payload county matches selected county;
- county echo is true;
- fallback detected is false;
- API row count is greater than zero.

### Gate E: UI Smoke

Passes when:

- UI smoke is performed after API proof;
- screenshot folder is recorded;
- trust label is visible;
- unsupported workflow labels are visible;
- no 39-county runtime-ready claim appears.

## Status Derivation

Status must be derived from gates:

| Gates passed | Derived status |
|---|---|
| none | `ATTEMPT` or `BLOCKED` |
| A | `SNAPSHOT_CAPTURED` |
| A+B | `NORMALIZED_READY` |
| A+B+C | `LOADED_NEEDS_API_PROOF` |
| A+B+C+D | `API_PROVEN_NEEDS_UI_SMOKE` |
| A+B+C+D+E | `LIMITED_WORKFLOW_READY` |

`BLOCKED` overrides gate status when a source, legal, technical, or product-law blocker prevents progress.

## Workflow Label Rules

| Workflow | Minimum status | Additional requirement |
|---|---|---|
| Parcel inspection | `API_PROVEN_NEEDS_UI_SMOKE` | parcel rows and county identity proof |
| Sales review | `API_PROVEN_NEEDS_UI_SMOKE` | sales rows and date range proof |
| Map inspection | `API_PROVEN_NEEDS_UI_SMOKE` | geometry/map layer proof |
| CostForge estimate | `LIMITED_WORKFLOW_READY` | required public property characteristics present |
| Official valuation | never from initial seed alone | county calibration/certification proof required |

Allowed labels:

```text
available
limited
blocked
post_launch
```

## Naming And Hash Rules

County token:

- lowercase;
- spaces become hyphens;
- punctuation removed except hyphen.

Artifact hash:

- SHA-256;
- hash raw artifacts before normalization;
- hash normalized artifacts after deterministic serialization.

Do not hash or store secrets.

## Prohibited Receipt Patterns

Reject a receipt if it:

- claims full runtime readiness from source registry alone;
- claims full county data from five-row smoke;
- omits raw artifact hashes;
- omits target TerraFusion DB identity;
- stores credentials, tokens, cookies, or source passwords;
- uses Benton fallback rows for another county;
- marks CostForge official/certified from public seed data;
- records UI smoke before API proof.

## Next Implementation Step

After this contract, the first code slice should be a receipt validator/generator that can run against a fixture county folder and classify status without reaching source systems or touching any DB.
