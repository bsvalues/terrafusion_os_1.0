# WO-WAL-001 — Statewide Public Baseline Runtime Completion

| Field | Value |
| --- | --- |
| Status | `ACTIVE_EXACT_CHILD_ROUTING` |
| Program | Washington Assessor Launch V1 |
| Risk | R4 bounded public-data acquisition/runtime implementation |
| Terminal condition | `ALL_39_COUNTIES_HAVE_TRUTHFUL_RUNTIME_PUBLIC_BASELINE_OR_EXPLICIT_SOURCE_GAP_WITH_NO_BENTON_FALLBACK` |

## Objective

Convert the completed 39-county acquisition/source registry into observed, county-scoped public-data runtime truth usable by Counties HUB and launch-eligible TerraForge workflows.

## Starting truth

The registry covers 39/39 counties and current JSON evidence reports 35 adapter-ready and 4 researched, but the proof explicitly does not establish statewide ingestion, normalization, geometry or endpoint runtime coverage.

Use existing truth tooling as the measured starting point. Do not create a replacement inventory unless a missing measurement requires a bounded extension.

## Required outcome

For every Washington county:

1. resolve/verify the public parcel backbone and the recorded public sales/acquisition source;
2. execute the smallest lawful acquisition adapter/family needed to obtain current public launch data;
3. normalize county identity and required parcel/sales fields into TerraFusion-controlled county-scoped staging/canonical storage;
4. attach source URL/system, acquisition timestamp, source revision/hash where available, transform version and trust tier;
5. quarantine malformed/ambiguous records rather than silently coercing them;
6. prove landed rows and runtime API consumption through the existing truth inventory/runtime ledger;
7. eliminate silent Benton fallback for non-Benton requests;
8. expose an explicit source-gap state if a public source becomes technically or legally unavailable; never fabricate rows/readiness;
9. identify which TerraForge launch capabilities each county's observed public inputs can support.

## Minimum public launch baseline

At minimum, each county must have a truthful parcel-context baseline from the statewide/public parcel source. Public sales/comparable capability is enabled only where acquired sales evidence is actually landed and runtime-consumed. If a county lacks sufficient public inputs for a TerraForge module, the capability matrix must say so and route the county to upload/Sync rather than block the county from Counties HUB.

## Denials

- no authentication bypass to non-public data;
- no external source writes;
- no silent Benton data reuse;
- no seeded/fake county counts presented as runtime;
- no module readiness inferred solely from registry/adaptor existence;
- no production deployment in this WO.

## Evidence

Produce a machine-readable 39-row runtime baseline ledger with per-county source, row counts, provenance/freshness, quarantine counts, runtime endpoints, fallback check and TerraForge input-capability state. Execute representative record-level lineage proof for every acquisition family and runtime smoke for all 39 county contexts.

## Continuation

This WO may run in parallel with WAL-002/003 and bounded WAL-004. Continue automatically when child PRs merge; do not return to the owner for routine source-family implementation choices inside Issue #1485.
