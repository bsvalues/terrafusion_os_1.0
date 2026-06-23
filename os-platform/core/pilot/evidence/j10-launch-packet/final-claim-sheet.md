# June 10 Final Claim Sheet

## Primary Claim

TerraFusion launches the Washington county operating model.

Each county is represented as a sovereign jurisdictional workspace with its own identity, role context, source posture, and readiness state.

Benton County is the first runtime-proven county, backed by TerraFusion DB/API and PACS-derived source provenance.

The other Washington counties are represented in onboarding/provenance/intake mode until promoted by county-specific TerraFusion DB/API runtime proof.

The runtime path is:

```text
TerraFusion DB -> TerraFusion API -> TerraFusion apps
```

## Source Posture

Benton:

```text
PACS-derived Benton source data
-> constrained Benton ingestion / validation
-> TerraFusion DB
-> TerraFusion API
-> TerraFusion apps
```

Other Washington counties:

```text
public / ArcGIS / assessor-source / future county source packets
-> onboarding / provenance / governed intake posture
-> no runtime claim until county-specific DB/API proof exists
```

## County Data Intake Boundary

County Data Intake is a governed onboarding side lane.

- `canonicalImportAllowed: false`
- No production DB mutation.
- No immediate runtime enablement.
- No TerraFusion Sync product claim.
- Human approval and later canonical import proof are required before runtime promotion.

## Benton Runtime Proof Summary

Benton is the first runtime-proven county for the June 10 posture.

The Benton claim is limited to:

- Operational-snapshot runtime pilot.
- TerraFusion DB/API-backed runtime path.
- PACS-derived source provenance.
- Evidence-backed UAT and acceptance posture.
- Snapshot runtime posture, not live Hostinger PACS connectivity.

## County Sovereignty Posture Summary

All 39 Washington counties are represented in the sovereignty shell posture.

- Benton County: `Runtime Pilot`.
- Other 38 counties: onboarding, provenance inventory, or intake posture.
- Non-Benton runtime operations are blocked until county-specific TerraFusion DB/API proof exists.
- County identity, role context, source posture, and readiness state are part of the launch story.

## County Data Intake Posture Summary

County Data Intake is included to show how counties without direct legacy DB connectivity can begin governed onboarding.

The intake lane supports assessor exports, GIS packages, spreadsheets, and source packets as evidence inputs. It does not write canonical runtime data during June 10.

## Visible Honesty Labels

Use these labels wherever a surface is not fully runtime-proven:

- Preview
- Onboarding
- Provenance Inventory
- Not Runtime Enabled
- Snapshot Runtime Only
- Intake MVP
- Dry Run Only
- Unavailable

## Explicit Non-Claims

TerraFusion does not claim on June 10:

- All counties are live.
- All counties are certified.
- Full Washington statewide production readiness.
- Full statewide certification.
- Hostinger is connected to PACS.
- TerraFusion Sync is fully productized.
- AI valuations are official.
- Every module is production-ready.
- Every endpoint/workflow is complete.

## Evidence Anchors

- J10-INTAKE: `4a53776e2`
- J10-SOV: `444d3dd16`
- Intake evidence: `os-platform/core/pilot/evidence/j10-county-data-intake-posture.latest.md`
- Sovereignty evidence: `os-platform/core/pilot/evidence/j10-county-sovereignty-shell-posture.latest.md`
- Existing Phase 20 UAT packet: `os-platform/core/pilot/evidence/phase20-benton-acceptance-uat.latest.json`
- Existing Phase 20 signoff: `os-platform/core/pilot/evidence/phase20-assessor-signoff.json`
