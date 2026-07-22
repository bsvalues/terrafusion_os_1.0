# WO-SR-005B-E3 - Atlas Bounded Extraction Scope Audit Evidence

## Result

`PASS_NO_DIRECT_EXTRACTION_BUILT_FRESH_FOUNDATION_READY`

No committed sovereign product-source slice is eligible for direct extraction into
`bsvalues/terrafusion-atlas`. The smallest safe next slice is a built-fresh standalone projection
foundation that promotes the already-proven E2 projection behavior out of its verifier, remains
offline and unwired, and does not copy OS, provider, county, valuation, or sovereign adapter source.

## Audit Basis

| Surface | Exact evidence | SHA-256 | Verdict |
| --- | --- | --- | --- |
| Sovereign adapter | `backend/src/TerraFusion.API/Adapters/AtlasSpatialReadAdapter.cs:5-8`, `:23-25`, `:30-77`, `:131-195` | `c658da4aede71d23333725a61fdc2fd9864b6c796025bd410b304a48dcd498fd` | Pure and unwired, but depends on sovereign C# assemblies, DTOs, and API serialization; retain in sovereign base. |
| OS Atlas hook | `frontend/apps/os-shell/src/hooks/useAtlasGis.ts:10-12`, `:33-45`, `:62-83`, `:100-124`, `:129-190` | `93d85cac26335a5f66dd5ff981bafe7c408f61f59edb7970b165853b711673ee` | OS auth/composition adapter with cross-lane fields; not suite product source. |
| OS Atlas service | `frontend/apps/os-shell/src/services/atlasService.ts:10-16`, `:51-61`, `:231-319`, `:347-444` | `368ff384eb8791ad889590fb4315874a0787a4e19884ed97f849a9f1c662897f` | Mixes Benton/ArcGIS, auth, valuation, land, and improvement concerns; direct extraction rejected. |
| Atlas suite home | `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx:10-16`, `:32-42` | `6aa240d6e0f707abfd2f3be4326aa8af804dd28e08fbabd199e43b6aa2ee10e6` | Tier-0 OS launcher/composition surface; remains sovereign. |
| Workbench Atlas tab | `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx:15-36`, `:131-158` | `ccc762f7872dce08af0b90d6d10f03580e067f7ca0ea4f5c5f790e91ace0b614` | Workbench composition with synthetic preview geometry; not extractable evidence or suite ownership. |
| Legacy GIS package boundary | `packages/gis-pro/package.json:2-19`, `:69-110` | `cd31fc7a97a3c0dd48b37b9b9a0bf2a31bdd34edb86e065b44787816b55a75cf` | Provider, database, auth, server, and AI dependency bundle; wholesale extraction rejected. |
| Legacy map component | `packages/gis-pro/client/src/components/TerraFusionMap.tsx:1-35`, `:83-100`, `:126-150` | `43bc500f153d990a4700c91a7e22276dd16f31cd9f7647d831f11d672c7987ab` | Mapbox/Benton-specific and fabricates fallback geometry; direct extraction rejected. |
| Legacy mixed schema | `packages/gis-pro/shared/core-schema.ts:5-47`, `:73-105` | `263cc4995a179a2d4ee8eed899236f59aed0ba0b60fcc1239d1b98f0f530aafd` | Combines parcels, valuation, documents, workflows, GIS, and audit; violates suite ownership boundary. |
| Standalone projection proof | `scripts/verify-atlas-spatial-read.mjs:132-159`, `:165-206`; `scripts/verify-atlas-spatial-read.test.mjs:51-73` in `terrafusion-atlas@a1669e09636743ac18c2525db69e20346a0f408b` | verifier `64f9de025e0cfba7821b5c9db4dc4b20ca2f7264fd2128f5e2acc41203a64c90`; tests `3693f99c7e72440957f36a2c10a96b50ae771dd80d9324cc59458ba2fc2e8c32` | Provider-neutral Polygon, Point, and unavailable projection is proven and can be promoted built-fresh. |

The standalone governance also requires source ownership and exact provenance, rejects wholesale
copying, and keeps product extraction blocked until a later admitted Work Order
(`AGENTS.md:3-28`, `canon/INTAKE_RULES.md:3-12`, and `canon/CONTRACT_DEPENDENCY.md:5-17` at the Atlas
base above). The Atlas domain pack assigns layers and geometry to Atlas while excluding valuation,
workflow, documents, and shell composition (`brain/packs/atlas/README.md:5-21`).

## Dependency And Ownership Boundary

- Sovereign base SHA audited: `7085a698c6a4313fa78874ad70f3e8450a685632`.
- Standalone Atlas SHA audited: `a1669e09636743ac18c2525db69e20346a0f408b`.
- Shared contract remains sovereign-owned: `atlas.spatial-read@1.0.0`, schema SHA-256
  `21ef6c6fb97a98c353794e59be3b80f0d666de435593dec74c2324351ec6fadc`.
- Atlas may own provider-neutral projection of validated contract evidence. The OS retains auth,
  Workbench composition, suite launching, provider integration, and county/runtime orchestration.
- No package dependency is required for the built-fresh projection function.

## Copy Versus History Decision

`NO DIRECT COPY`. None of the audited sovereign product files has a clean Atlas-only dependency and
ownership boundary. No Git history import is justified. F1 will factor the already-tested standalone
E2 projection behavior into a new destination product module and make the verifier consume it.

## Exact R3 Allowlist

`WO-SR-005B-F1` is limited to these files in `bsvalues/terrafusion-atlas`:

- `src/spatial-read/project-atlas-feature.mjs`
- `test/project-atlas-feature.test.mjs`
- `scripts/verify-atlas-spatial-read.mjs`
- `scripts/verify-atlas-spatial-read.test.mjs`
- `AGENTS.md`
- `operations/work-orders/WO-SR-005B-F1-atlas-standalone-spatial-projection-foundation.md`
- `operations/evidence/WO-SR-005B-F1-ATLAS-STANDALONE-SPATIAL-PROJECTION-FOUNDATION.md`

The slice may move the proven projection implementation from the verifier into the new module,
import it back into the verifier, and add direct product-module parity tests. It may not change a
package or lockfile, workflow, contract artifact, provider, network call, runtime consumer, OS code,
county/PACS/SQL behavior, credential, secret, deployment, cutover, or duplicate source.

## Parity And Negative Proof

F1 must preserve the E2 outcomes:

- Polygon evidence produces one longitude-first GeoJSON Polygon.
- Centroid-only evidence produces one GeoJSON Point.
- Unavailable evidence produces no feature and never invents location.
- County mismatch, invalid polygon rings, and cross-lane fields remain rejected by contract proof.
- Existing hash-pinned verifier and six tests continue to pass.

## Rollback

Revert the future F1 Atlas merge. The new module will have no runtime consumer, provider access,
package publication, deployment, data mutation, or ownership cutover, so rollback is repository-only.
The existing E2 verifier can be restored from its pre-F1 version without sovereign changes.

## Non-Claims

- E3 did not copy source, adopt a runtime, transfer ownership, or retire a duplicate.
- F1 will not make Atlas a live application or connect it to a provider.
- The sovereign adapter remains authoritative and unwired.
- Direct extraction may be reconsidered only after a later audit identifies a genuinely isolated
  Atlas source slice; E3 found none.

## Next

`WO-SR-005B-F1 - Atlas Standalone Spatial Projection Foundation` is admitted as the smallest R3
built-fresh implementation. It is not an extraction or cutover Work Order.
