# County Data Intake MVP Posture

- Generated: 2026-06-07T18:19:25.129Z
- Verdict: J10_COUNTY_DATA_INTAKE_MVP_POSTURE_LOCKED
- Status: DESIGN_MVP_GOVERNED_INTAKE_MODEL
- Packet hash: 1db38a336a764babd6cfabbfdc6a3b8669a494e41476b5e91cf3e30cbfd018e6

## Boundary

- canonicalImportAllowed: false
- Production mutation allowed: false
- Production DB binding change allowed: false
- Sync product claim allowed: false
- Runtime claim allowed: false
- No production DB mutation.

Proof command:

```bash
node os-platform/core/pilot/j10-county-data-intake-posture.mjs
```

## June 10 Role

Governed onboarding lane for counties that begin with assessor exports, GIS packages, spreadsheets, or source packets instead of direct legacy database connectivity.

## Four-Lane Model

| Lane | Scope | Status |
| --- | --- | --- |
| Runtime Lane | Benton County runtime pilot | Runtime proof lane |
| Sovereignty Lane | All 39 Washington counties | Launch posture lane |
| Provenance / Onboarding Lane | 38 non-Benton counties | No runtime claim without county-specific DB/API proof |
| County Data Intake Lane | Assessor-provided exports and governed upload packages | Design/MVP lane only |

## Accepted Source Package Types

- csv
- txt
- xlsx
- fgdb_directory
- zipped_fgdb
- zip_generic

## Runtime Promotion Rule

validated_data_must_be_promoted_into_terrafusion_db_and_pass_api_proof_gates

## Forbidden Claims

- County Data Intake is production import.
- Uploaded files become live immediately.
- The intake lane mutates TerraFusion DB.
- All counties can upload and operate live on June 10.

## Final Claim Sheet Addition

For counties without direct legacy DB access, TerraFusion defines a governed County Data Intake Lane for assessor-provided exports, GIS packages, spreadsheets, and source packets. The MVP creates receipts, validates county/FIPS binding, screens unsafe material, produces rejected-row and dry-run reports, and requires human approval. It does not write to canonical production tables.
