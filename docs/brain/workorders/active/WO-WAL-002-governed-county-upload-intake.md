# WO-WAL-002 — Governed County Upload Intake

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WAL_000` |
| Program | Washington Assessor Launch V1 |
| Risk | R3 authenticated county-data ingestion into TerraFusion-controlled storage |
| Terminal condition | `COUNTY_UPLOAD_OBSERVED_VALIDATED_LINEAGE_BOUND_COUNTY_SCOPED_AND_NO_EXTERNAL_WRITE` |

## Objective

Replace scaffold/pending upload behavior with a real county-provided data path that lets an authorized assessor/admin improve the public baseline without TerraFusion writing to the county's source systems.

## Required outcome

1. Bind every upload to authenticated county identity and an explicit dataset/import type; a UI county selector cannot grant authority.
2. Begin with file formats actually implemented and tested. CSV is the minimum launch path. Add XLSX/DBF/GDB/ZIP or vendor-specific exports only when an existing parser is safely reusable or a bounded implementation is completed; never advertise unsupported formats.
3. Enforce bounded file size/type/content checks, malware/unsafe archive protections where relevant, schema/header inspection and fail-closed parse behavior.
4. Create immutable intake provenance: uploader identity, county, source filename, content hash, received time, parser/mapping version and resulting batch/receipt identity.
5. Map records into county-scoped staging; validate identities/types/ranges; quarantine rejected/ambiguous rows with reason classes.
6. Make retries idempotent or explicitly duplicate-aware using content/batch identity.
7. Promote accepted rows atomically into TerraFusion-controlled county-scoped canonical storage without changing external county systems.
8. Recompute trust/freshness/capability state after promotion and make that state consumable by Counties HUB/TerraForge.
9. Provide operator/user-visible progress, accepted/rejected counts, provenance and remediation guidance without leaking other counties.
10. Execute rollback/removal of the imported TerraFusion batch without touching source systems or unrelated county data.

## Required proof

- valid authenticated same-county upload through real API and UI;
- malformed, wrong-format and schema-drift refusal;
- cross-county attempt fails closed;
- duplicate/retry behavior proven;
- quarantine contents/reasons proven;
- lineage from source file hash → staging → canonical rows → runtime API;
- rollback removes/reverts only the owned TerraFusion import effect;
- external-system write count = zero.

## Denials

No PACS/CAMA/GIS/database write-back, no emailed/shared credentials, no county-context override from request body, no fabricated successful import receipt, no production deployment in this WO.

## Continuation

May execute in parallel with WAL-001/003/004 after WAL-000. Merge/verify and continue without owner relay.
