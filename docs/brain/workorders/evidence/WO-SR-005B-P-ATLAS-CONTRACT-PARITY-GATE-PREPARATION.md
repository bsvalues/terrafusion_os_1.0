# WO-SR-005B-P - Atlas Contract and Parity Gate Preparation

## Verdict

`COMPLETE_BLOCKED_CONTRACT_PROMOTION_REQUIRED`

Atlas has genuine spatial read concepts, but current `main` does not contain a frozen Atlas domain
contract or a bounded source unit that can be copied honestly. `WO-SR-005B` remains blocked. The
next bounded slice is `WO-SR-005B-C - Atlas Read Contract Decomposition`.

## Live Source Inventory

| Surface | Observed truth | Ownership classification | Extraction disposition |
| --- | --- | --- | --- |
| `backend/src/TerraFusion.Core/Interfaces/IGisDataService.cs` | Parcel boundary and layer records used by the live Atlas GIS API | Atlas concepts embedded in Core; PACS-shaped and not frozen | Candidate for decomposition, not direct promotion |
| `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs` | Preferred combined parcel boundary/layer read API | OS integration/API host | Remains sovereign |
| `frontend/apps/os-shell/src/hooks/useAtlasGis.ts` | Duplicates backend response types for the Workbench | OS-shell adapter | Remains sovereign; not a package contract |
| `frontend/apps/os-shell/src/services/atlasService.ts` | Broad Atlas API, direct Benton ArcGIS fallback, export helpers, and local types | Mixed OS adapter and county-specific integration | Not extractable as one unit |
| `frontend/apps/os-shell/src/types/domain.ts` | Generic `GISLayer`, `GISFeature`, and `GISGeometry` UI models | OS-owned composition types | Not an Atlas package contract |
| `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx` | Partial suite truth backed by OS APIs and external Mapbox configuration | OS-shell composition | Remains sovereign |
| `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx` | Parcel-scoped Atlas composition surface | Tier-0 Workbench | Remains sovereign |
| `packages/gis-pro/**` | 121 tracked files: 33 TS/TSX, 9 Python, 12 JS, 20 docs, 10 deployment, 10 assistant, 7 attached assets | Mixed legacy/package surface | Reject wholesale extraction |

The inspected source state is pinned to sovereign base
`309c081c355a9fe0b555661867bd911463b2886f`. The latest commit touching the combined Atlas source
inventory was `58c27cb186f7d56fbf7cd941599e6fe61878a2b8`.

## Contract Ownership Classification

The contract freeze contains only `forge.valuation@1.0.0` and `crosscut.audit@1.0.0`. Atlas consumes
the audit group but has no domain-specific frozen group.

| Candidate | Classification | Reason |
| --- | --- | --- |
| `ParcelBoundaryResult` family | Existing Atlas concept, missing suite contract | Located in Core; includes PACS and owner-display concerns; no explicit county context; not hash-frozen |
| `ParcelLayersResult` family | Existing Atlas concept, missing suite contract | Mixes zoning, flood, tax-area, and land-class source models; ownership and county boundary require decomposition |
| `useAtlasGis.ts` interfaces | Implementation-local duplicate | Frontend copies backend shapes and therefore cannot be the contract authority |
| `atlasService.ts` interfaces | Implementation-local and provider/county coupled | Includes direct Benton ArcGIS URLs, query construction, export artifacts, and UI service models |
| `GISLayer` / `GISGeometry` | OS-owned composition model | Generic shell-facing types do not establish suite API ownership |
| `packages/gis-pro/shared/core-schema.ts` | Not extractable | Mixes users, valuation fields, documents, workflows, GIS, audit, and county persistence across suite write lanes |

No new contract is asserted merely to unblock extraction. A genuine contract must be provider-neutral,
county-context-aware, read-only at the first boundary, and separated from PACS persistence, OS-shell
composition, Dossier custody, Dais workflow, and Forge valuation fields.

## Standalone Map Parity Gate

The smallest honest parity gate is synthetic and read-only. A future Atlas extraction must prove all
of the following against the same fixtures in sovereign and destination repositories:

1. A frozen Atlas read contract with exact file hashes and compatibility rules.
2. Parcel boundary and layer fixture parity without county, PACS, SQL, or live provider access.
3. Explicit county context at the contract boundary and no cross-county data path.
4. Stable source-honesty mapping for `live`, `fallback`, and `unavailable`, including the combined
   boundary/layer response shape.
5. Mapbox as the current renderer baseline, `VITE_MAPBOX_ACCESS_TOKEN` as the only browser token name,
   and a deterministic missing-token state.
6. Renderer lifecycle cleanup, route/parcel change handling, style reload and layer rehydration.
7. Text-safe popup content, attribution, keyboard/accessibility, and provider-failure proof.
8. Standalone build and focused tests in `terrafusion-atlas`, plus `contract-compat`, `suite-ci`, and
   `governance-gate`.
9. Exact provenance and byte/hash comparison for any copied source.
10. No source deletion, ownership cutover, package publication, or production claim.

## Blockers

- No `atlas.*` domain group exists in `contracts.freeze.json`.
- Current candidate records are coupled to Core and PACS terminology and omit explicit county context.
- Frontend contract shapes are duplicated rather than generated or consumed from one authority.
- `packages/gis-pro` is a mixed application/archive-like surface, not a bounded Atlas module.
- Live map proof depends on external Mapbox configuration; direct Benton ArcGIS fallbacks are not a
  standalone or production-safe parity mechanism.
- Existing Workbench evidence records unresolved combined-response source mapping and deterministic
  missing-token fallback gaps.

## Non-Claims

- No Atlas runtime, contract, package, provider, or destination source changed.
- No county/PACS/SQL data, secret value, external service, or production system was accessed.
- No extraction, publication, source retirement, or ownership cutover is approved.
- This packet does not claim the mixed GIS package is canonical Atlas implementation.

## Validation

- `brain/packs/atlas/README.md` and `frontend/apps/os-shell/AGENTS.md` boundary review: PASS;
  Atlas ownership, forbidden writes, shell composition, and escalation rules were applied before
  source classification.
- Live tracked source inventory and ownership classification: PASS.
- Existing Atlas and Workbench evidence reconciliation: PASS.
- Contract-freeze inspection: PASS; Atlas domain group absent.
- `git diff --check`: required before commit.
- `node docs/brain/workorders/tools/wo-query.mjs --json --authority R4`: required before commit.
- Runtime/backend/frontend/tools-sync/CI/deployment changes: none.

## Next

`WO-SR-005B-C - Atlas Read Contract Decomposition` must define the exact provider-neutral records,
county-context rule, ownership exclusions, compatibility contract, and synthetic fixture set. It is
docs/evidence only. `WO-SR-005B` remains blocked until a later authorized contract implementation is
hash-frozen and the parity gate is executable.
