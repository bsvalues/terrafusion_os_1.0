# WO-SR-005B-E3 - Atlas Bounded Extraction Scope Audit

| Field | Value |
| --- | --- |
| Status | COMPLETE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only discovery and docs/evidence |
| Dependency | WO-SR-005B-E2 complete |
| Next | WO-SR-005B-F1 - Atlas Standalone Spatial Projection Foundation |

## Objective

Identify the smallest provider-neutral Atlas product slice that can be copied to
`bsvalues/terrafusion-atlas` with exact provenance and standalone parity while the sovereign source
remains authoritative.

## Allowed

- Read-only inspection of committed TerraFusion and Atlas source, tests, package metadata, and
  existing contract/evidence surfaces.
- Docs and governance changes under `docs/brain/workorders/**` required for the audit evidence and
  routing.
- Read-only local validation that does not start services or access external operational resources.

## Required Evidence

- exact source and destination paths;
- source SHA and file hashes;
- dependency and build boundary;
- contract consumption and county-context behavior;
- standalone parity tests and negative cases;
- copy-versus-history decision;
- rollback and duplicate-retirement exclusions;
- exact R3 allowed files, or an evidence-backed no-go verdict.

## Blocked

- Source copying, deletion, runtime wiring, ownership cutover, or duplicate retirement.
- Package, lockfile, CI, deployment, provider, Mapbox, ArcGIS, county, PACS, SQL, credential,
  secret, live-service, or production changes.
- Claims that the standalone Atlas suite owns product behavior before a later R3 merge and cutover.

## Validation

- exact `file:line` source citations;
- `git diff --check`;
- `node docs/brain/workorders/tools/wo-query.mjs --json`;
- Work Order tooling tests;
- exact-file scope inspection.

## Stop Type

`ATLAS_BOUNDED_EXTRACTION_SCOPE_AUDITED`

## Completion

- Result: `PASS_NO_DIRECT_EXTRACTION_BUILT_FRESH_FOUNDATION_READY`.
- The sovereign candidates are coupled to OS composition, provider/county specifics, valuation and
  data-write concerns, or sovereign C# assemblies; no exact source slice is safe to copy as the
  standalone suite foundation.
- The E2 projection behavior is provider-neutral, deterministic, synthetic-only, and already proven
  in the destination repository. `WO-SR-005B-F1` may promote that behavior from the verifier into a
  built-fresh product-source module without wiring a runtime consumer.
- Evidence: [WO-SR-005B-E3-ATLAS-BOUNDED-EXTRACTION-SCOPE-AUDIT.md](../evidence/WO-SR-005B-E3-ATLAS-BOUNDED-EXTRACTION-SCOPE-AUDIT.md).
