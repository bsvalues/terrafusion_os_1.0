# Benton County Assessor Acceptance - June 10 Pilot Scope

## Accepted Scope

I accept the June 10 pilot scope as a controlled Benton operational-snapshot runtime and Washington county operating model launch posture.

Accepted scope:

- Benton operational-snapshot runtime.
- TerraFusion DB/API-backed parcel and property data for the Benton runtime pilot.
- PACS-derived Benton source provenance.
- Hostinger staging/production snapshot runtime posture where previously evidenced.
- Demonstration/UAT posture only.
- Washington county sovereignty shell posture.
- 38 non-Benton counties represented only as onboarding/provenance/intake workspaces.
- County Data Intake MVP as governed onboarding only, with `canonicalImportAllowed: false`.

## Excluded From Acceptance

This acceptance does not approve or claim:

- Full statewide production.
- 39-county runtime operation.
- Full statewide certification.
- Live Hostinger PACS connection.
- Official AI valuation replacement.
- PACS write-back.
- TerraFusion Sync product completion.
- Production readiness for unfinished placeholder modules.
- Runtime enablement for non-Benton counties without county-specific TerraFusion DB/API proof.
- Canonical import from County Data Intake without a later approved import proof.

## Runtime Statement

The June 10 runtime path is:

```text
TerraFusion DB -> TerraFusion API -> TerraFusion apps
```

PACS is Benton source provenance only. PACS is not the June 10 product story and is not the Hostinger runtime dependency.

## Evidence References

- Existing Phase 20 signoff JSON: `os-platform/core/pilot/evidence/phase20-assessor-signoff.json`
- Existing Phase 20 Benton acceptance/UAT packet: `os-platform/core/pilot/evidence/phase20-benton-acceptance-uat.latest.json`
- J10-INTAKE commit: `4a53776e2`
- J10-SOV commit: `444d3dd16`
- Final claim sheet: `os-platform/core/pilot/evidence/j10-launch-packet/final-claim-sheet.md`

## Signature

Signed:

```text
Bill Spencer
Benton County Assessor
Date: 2026-06-10
```

Acceptance status for repository evidence:

```text
READY_FOR_ASSESSOR_REVIEW
```

