# Washington Assessor Launch V1

**Goal:** `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1`

**Loop:** `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1`

**Owner directive:** GitHub Issue #1485

**Deadline:** production terminal proof before the WACO Annual Conference begins September 29, 2026; target no later than September 28, 2026 Pacific time.

**Status:** ACTIVE — PR #1486 completed the governance activation on protected main and Issue #1485
is recorded as `OWNER-WAL-V1-MISSION-AUTHORITY-20260827`. The initial construction wave routes
through the exact children registered below; broad parents remain open.

## Mission

Finish the existing 39-county Washington Counties HUB/data foundation and launch TerraFusion OS + TerraForge as TerraFusion's first official Washington-assessor production release.

This is a mission-level program. A child WO, PR, test, staging deployment, or Benton-only proof is not the task boundary. The lead operator continues through the dependency graph until the terminal condition is proven or a genuinely consequential owner decision outside Issue #1485 is required.

## Product model

All 39 Washington counties are first-class launch entries.

County data progresses through three pre-adoption trust modes:

1. `PUBLIC` — TerraFusion-acquired public baseline with exact provenance/freshness.
2. `COUNTY_PROVIDED` — county export/upload validated, mapped, quarantined when needed, lineage-bound, and promoted only into TerraFusion-controlled county-scoped storage.
3. `CONNECTED` — TerraFusion Sync reads an authorized county database/API/feed/GIS source and updates TerraFusion-controlled county-scoped storage.

`OFFICIAL_TERRAFUSION_ADOPTION` is a later county-specific state and is outside this program.

### External source write boundary

Until explicit future county adoption, every external county source is read-only. This program may ingest/copy/normalize into TerraFusion storage but may not mutate, update, delete, synchronize back to, or otherwise write to county PACS/CAMA/GIS/database/source systems.

## Protected activation truth

Original deep-review base: `a1f6fd66d2cff6e3dc7f62ebc00311974951dc90`.

Current protected launch baseline after Gate C repair PR #1484: `3651e2fb6c440f66aaa9326328484c1b5bd9201f` (tree `ba477519d8610b17693800ec1d15522e84a41af7`).

- Five-Suite Federated Repository Buildout is complete and remains closed.
- Gate C is repaired on protected main. PR #1484 replaced the working-directory-dependent relative pnpm filter with canonical `terrafusion-frontend...` plus `--fail-if-no-match`; its regression contract passed 2/2 and protected-main Gate C passed clean with frontend/backend builds, zero errors and zero warnings. Gate C is therefore a required passing launch control, not tolerated pre-existing debt.
- 39/39 source-registry coverage exists; current evidence reports 35 adapter-ready and 4 researched, with official assessor URL, primary sales source, statewide parcel backbone, and acquisition family for every county.
- That registry evidence explicitly does **not** prove statewide ingestion, normalization, geometry, or runtime coverage.
- Current `CountiesHub.tsx` is an unavailable guardrail; protected Router has no `/counties` route.
- Closed PR #1461 is history/reference only, not a merge candidate.
- Existing truth tooling measures source evidence, landed rows, runtime registration and no-Benton-fallback behavior. Reuse it rather than restarting archaeology.
- `DataImportController` is scaffold/pending behavior, not a completed county upload path.
- The runtime Sync engine in this repository has substantial Benton/Harris-PACS proof, lineage, quarantine, lane drains and ArcGIS geometry, but is not yet a proven generic 39-county connection layer.
- The separate `bsvalues/terrafusion-os` repository is mapping-workbook/evidence tooling, not the statewide runtime ingestion engine.
- TerraForge has real runtime-backed surfaces but retains June-10/Benton assumptions that cannot define statewide launch.

## Work Order graph

| WO | Outcome | Dependency |
| --- | --- | --- |
| `WO-WAL-000` | Canonicalize Issue #1485 mission authority and register this finite program | owner directive |
| `WO-WAL-000A` | Register and mechanically enforce the four initial exact child reservation sets | satisfied 000; complete only on protected merge |
| `WO-WAL-001` | 39-county public-baseline acquisition → normalization → landed runtime truth | 000 |
| `WO-WAL-001A` | Deterministic 39-county source-registry ledger contract; no runtime inference | satisfied 000; bounded child of open 001 |
| `WO-WAL-002` | Real governed county upload intake | 000 |
| `WO-WAL-002A` | Strict bounded in-memory CSV stream parser harness; no upload path | satisfied 000; bounded child of open 002 |
| `WO-WAL-003` | Read-only multi-county TerraFusion Sync with explicit source profiles | 000 |
| `WO-WAL-003A` | Mock-only source-profile/read-adapter contract and static command guard | satisfied 000; bounded child of open 003 |
| `WO-WAL-004` | County identity, isolation, trust states, activation boundary, no Benton fallback | 000; overlaps 001-003 |
| `WO-WAL-004A` | Canonical 39-county identity and conflicting authenticated-claim denial foundation | satisfied 000; bounded child of open 004 |
| `WO-WAL-005` | Real `/counties` Counties HUB driven by control-plane truth | 001-004 contracts stable |
| `WO-WAL-006` | TerraForge statewide launch runtime with data-capability truth | 001-004 contracts stable; overlaps 005 |
| `WO-WAL-007` | 39-county browser/API/adversarial launch proof | 001-006 |
| `WO-WAL-008` | Exact production release + external assessor acceptance | 007 |
| `WO-WAL-009` | Terminal closeout, exact identities, `COMPLETED_AND_CONSUMED` | 008 |

After `WO-WAL-000` and protected completion of `WO-WAL-000A`, the exact initial executable set is
001A/002A/003A/004A. The broad
001/002/003/004 parents remain open and route through exact children rather than being dispatched as
monoliths. Completion of any A child does not complete its parent or satisfy the stable-contract
dependencies of 005/006.

## Initial exact construction wave

| Child | Risk | Exact contracts | Local deterministic environment | Key denial |
| --- | --- | --- | --- | --- |
| `WO-WAL-001A` | R2 | `wal.public-baseline-ledger.v1` | `local-temp-only`; OS temp only, no network/database | Registry/source readiness cannot imply landed rows, runtime, provenance/freshness completeness, capability or no fallback |
| `WO-WAL-002A` | R2 | `wal.county-upload.csv-parser.v1` | `local-memory-stream-only`; disposable streams | No upload/auth/county binding, persistence, provenance, quarantine, promotion, rollback or unsupported formats |
| `WO-WAL-003A` | R3 | `wal.source-profile.v1`; `wal.external-readonly.v1` | `mock-source-only`; strings/reflection only | No connection, credentials, DML/DDL/write-back, production registration or live no-DML claim |
| `WO-WAL-004A` | R5 | `wal.county-identity.v1`; `wal.county-authority.v1` | `wal004a-local-in-memory`; synthetic rows/claims | No schema/migration, route/controller integration, trust/activation state, frontend authority or default county |

The exact path allowlists, machine-readable contract/environment reservations, and validation gates are canonical in
`docs/brain/workorders/registry/work-order-registry.seed.json` and the corresponding child Work Order
documents. Contract/environment reservations do not create credential, protected-data, external-
system or production authority.

## Launch terminal condition

The program closes only when:

1. all 39 counties are canonical registry entries and visible in Counties HUB;
2. each county has a truthful usable public-baseline state with provenance/freshness and no fabricated completeness;
3. actual county runtime rows/endpoints prove state and no silent Benton fallback exists;
4. upload intake is real and county-scoped, with validation/quarantine/lineage and promotion only into TerraFusion-controlled storage;
5. Sync supports explicitly read-only county/source connections and proves external write-back is neither required nor performed;
6. authenticated county identity and cross-county isolation are proven through API, Sync, HUB, TerraForge and relevant Workbench paths;
7. HUB exposes the real `PUBLIC → COUNTY_PROVIDED → CONNECTED` progression and actions for all 39;
8. TerraForge selected launch workflows are county-aware, disclose trust/source level, never fall back silently, and do not advertise modules whose required inputs are absent;
9. browser/API acceptance covers all 39 contexts, plus deep upload/Sync/runtime journeys over representative source families and adversarial cross-county attempts;
10. all required merge/release controls, including Gate C, pass for the exact accepted release;
11. the exact proven release is in production with real auth, HTTPS, monitoring, backup/rollback and release identity;
12. an external non-development-network assessor journey succeeds end-to-end;
13. protected governance records `COMPLETED_AND_CONSUMED`, exact URL/release/rollback/proof identities, and no launch-blocking gaps.

## Hard walls

- no external county-system writes before future explicit adoption;
- no unauthorized non-public data acquisition;
- no cross-county disclosure or silent Benton fallback;
- no constitutional suite-topology change or sixth suite;
- no unrelated WilliamOS or unrelated CI/release program;
- no required-check bypass, force push, fabricated evidence, or irreversible destructive action without proven rollback;
- no readiness/module/Sync/production claim without observed evidence.

## Capability honesty

Statewide launch does not mean every TerraForge module is usable from public data in every county. The runtime must compute/display capability from required observed inputs. Public-data workflows may launch statewide while cost/income/calibration functions remain unavailable for a county until the required county-specific data is uploaded or connected.
