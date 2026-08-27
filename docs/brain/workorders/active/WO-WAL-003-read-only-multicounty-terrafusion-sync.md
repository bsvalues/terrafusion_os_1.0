# WO-WAL-003 — Read-Only Multi-County TerraFusion Sync

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WAL_000` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 protected read-only external integration and county credentials/data; no external writes |
| Terminal condition | `MULTICOUNTY_SYNC_SOURCE_PROFILES_READ_ONLY_LINEAGE_PROVEN_NO_EXTERNAL_DML` |

## Objective

Generalize the Benton-proven runtime Sync engine into a county/source-profile connection system that can continuously ingest authorized county data while every external system remains read-only before official TerraFusion adoption.

## Preserve

Reuse the real `terrafusion_os_1.0` Sync primitives: raw→truth→canonical staging, source_xref/lineage, quarantine, county isolation, lane drains, checkpointing, operator status, ArcGIS read, scaling and rollback patterns. Do not replace them with the separate mapping-workbook Sync repo.

## Required outcome

1. Remove single-county/Benton identity assumptions from reusable runtime orchestration; county identity comes from an explicit governed connection/profile and authorized context.
2. Define source profiles/adapters by actual source shape/vendor/API/file family. Harris PACS table/column doctrine must not be applied to non-Harris systems by assumption.
3. Connection profiles declare capability, source identity, county identity, extraction/query method, schema/mapping version, checkpoint strategy, freshness and read-only enforcement.
4. Database profiles use read-only credentials/roles where the source supports them and prove no INSERT/UPDATE/DELETE/MERGE/DDL/writeback path is required or invoked.
5. API/GIS/feed profiles use read-only methods/endpoints and bound retries/timeouts/rate limits.
6. Ingest into TerraFusion-controlled county-scoped raw/staging/canonical storage with provenance and quarantine.
7. Support initial full snapshot plus bounded incremental/CDC/checkpoint behavior only where source capability supports it; otherwise schedule safe read snapshots.
8. Detect schema/source drift and fail closed before corrupting canonical data.
9. Expose connection/freshness/last-success/error/provenance state to the county control plane.
10. Prove disconnect/rollback leaves external source unchanged and preserves/reverts TerraFusion state according to the exact connection contract.

## Representative launch proof

Deep runtime proof must cover more than the already-proven Benton/Harris shape. Exercise representative source families actually needed by Washington counties (for example Harris/SQL plus at least one materially different API/GIS/vendor/export path) and prove the abstraction is not Benton-by-another-name. Additional profiles are added as actual county inputs require them.

## External-write proof

For every representative connected source, capture observed source-side command/method evidence sufficient to show external writes did not occur. Source credentials should be read-only when possible. A code assertion that "we only read" is not sufficient by itself.

## Denials

- no source-system DML/DDL/writeback;
- no use of a county credential outside its authorized county/source;
- no silent schema remapping based on Benton defaults;
- no direct promotion when lineage/quarantine gates fail;
- no production connection before WAL-007 release acceptance.

## Continuation

May execute in parallel with WAL-001/002/004 after WAL-000. Routine source-profile decomposition stays inside Issue #1485 and does not require fresh owner relay.
