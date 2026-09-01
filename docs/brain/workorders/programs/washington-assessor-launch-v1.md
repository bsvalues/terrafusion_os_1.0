# Washington Assessor Launch V1

**Goal:** `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1`

**Loop:** `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1`

**Owner directive:** GitHub Issue #1485

**Deadline:** production terminal proof before the WACO Annual Conference begins September 29, 2026; target no later than September 28, 2026 Pacific time.

**Status:** ACTIVE — PR #1486 completed governance activation on protected main and Issue #1485 is
recorded as `OWNER-WAL-V1-MISSION-AUTHORITY-20260827`. The A through E construction waves are
protected-complete. `WO-WAL-000F` records no executable F child: broad parents 001-004 remain open,
005/006 remain blocked, and the 003 live-source continuation remains behind its exact authority wall.

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
| `WO-WAL-000B` | Reconcile protected A-wave completion and register the four next exact reservation sets | protected-complete 001A-004A; complete only on protected merge |
| `WO-WAL-000C` | Reconcile protected B-wave completion and register the four next exact reservation sets | protected-complete 001B-004B; complete only on protected merge |
| `WO-WAL-000D` | Reconcile protected C-wave completion and register the four next exact reservation sets | protected-complete 001C-004C; complete only on protected merge |
| `WO-WAL-000E` | Reconcile protected D-wave completion, register exactly 001E/002E/004E, and record the Sync authority wall | protected-complete 001D-004D; complete only on protected merge |
| `WO-WAL-000F` | Reconcile protected E-wave completion and record zero executable F children while preserving authority walls | protected-complete 001E/002E/004E; complete only on protected merge |
| `WO-WAL-001` | 39-county public-baseline acquisition → normalization → landed runtime truth | 000 |
| `WO-WAL-001A` | Deterministic 39-county source-registry ledger contract; no runtime inference | protected complete in PR #1489; bounded child of open 001 |
| `WO-WAL-001B` | Deterministic public acquisition artifact receipt evidence; no landing/runtime inference | protected complete in PR #1493; bounded child of open 001 |
| `WO-WAL-001C` | Canonical 39-county receipt ledger with explicit parcel/sales gaps | protected complete in PR #1498; bounded child of open 001 |
| `WO-WAL-001D` | Verify supplied artifact bytes against exact receipt-ledger county/kind/hash/length evidence | protected 001A/001B/001C plus protected 000D; bounded child of open 001 |
| `WO-WAL-001E` | Atomically land one already-verified public artifact in isolated local temporary storage and return a receipt | protected complete in PR #1510 at `1144599ac99e20312d38b83ab71457519f6b8181`; bounded child of open 001 |
| `WO-WAL-002` | Real governed county upload intake | 000 |
| `WO-WAL-002A` | Strict bounded in-memory CSV stream parser harness; no upload path | protected complete in PR #1490; bounded child of open 002 |
| `WO-WAL-002B` | Declared CSV intake envelope and deterministic content evidence; no authority/persistence | protected complete in PR #1494; bounded child of open 002 |
| `WO-WAL-002C` | Canonical same-county operational binding around one protected CSV envelope | protected complete in PR #1500; bounded child of open 002 |
| `WO-WAL-002D` | Deterministic county/dataset/content CSV idempotency identity | protected 002A/002B/002C plus protected 000D; bounded child of open 002 |
| `WO-WAL-002E` | Fail-closed local-memory first-seen/duplicate decision over protected idempotency evidence | protected complete in PR #1508 at `dcd1405b15d7aaa686ae444ed917117fcada3de0`; bounded child of open 002 |
| `WO-WAL-003` | Read-only multi-county TerraFusion Sync with explicit source profiles | 000 |
| `WO-WAL-003A` | Mock-only source-profile/read-adapter contract and static command guard | protected complete in PR #1491; bounded child of open 003 |
| `WO-WAL-003B` | Bounded mock-adapter read execution and immutable result envelope | protected complete in PR #1495; bounded child of open 003 |
| `WO-WAL-003C` | Fake-ADO single-reader adapter and bounded page composition | protected complete in PR #1501; bounded child of open 003 |
| `WO-WAL-003D` | One profile-bound read session over a caller-owned already-open fake ADO connection | protected 003A/003B/003C plus protected 000D; bounded child of open 003 |
| `WO-WAL-003` live-source continuation | No executable 003E is registered; require a named county/source/system, authorized read-only credential or role and secret-store reference, permitted execution/network environment, data classification/handling, and source-side no-DML evidence method | explicit authority wall |
| `WO-WAL-004` | County identity, isolation, trust states, activation boundary, no Benton fallback | 000; overlaps 001-003 |
| `WO-WAL-004A` | Canonical 39-county identity and conflicting authenticated-claim denial foundation | protected complete in PR #1488; bounded child of open 004 |
| `WO-WAL-004B` | Pure county data-mode visibility and same-county authority boundary | protected complete in PR #1496; bounded child of open 004 |
| `WO-WAL-004C` | Data-free activation-prerequisite eligibility contract | protected complete in PR #1499; bounded child of open 004 |
| `WO-WAL-004D` | Fail-closed authenticated-context to canonical county GUID binding | protected 004A plus protected 000D; bounded child of open 004 |
| `WO-WAL-004E` | Bind authenticated persisted county GUID to exactly one canonical 39-county context | protected complete in PR #1509 at `b4c34f53a6c0251fc2df3a02974b5e7e96ef7a95`; bounded child of open 004 |
| `WO-WAL-005` | Real `/counties` Counties HUB driven by control-plane truth | 001-004 contracts stable |
| `WO-WAL-006` | TerraForge statewide launch runtime with data-capability truth | 001-004 contracts stable; overlaps 005 |
| `WO-WAL-007` | 39-county browser/API/adversarial launch proof | 001-006 |
| `WO-WAL-008` | Exact production release + external assessor acceptance | 007 |
| `WO-WAL-009` | Terminal closeout, exact identities, `COMPLETED_AND_CONSUMED` | 008 |

The exact A through E waves are protected-complete. The exact executable F set is empty: no
001F/002F/003E/003F/004F record exists, and no F contract, environment, or implementation path is
reserved. The broad 001/002/003/004 parents remain open and route only through future evidence-backed
exact children rather than being dispatched as monoliths. Completion of an A-E child does not
complete its parent or satisfy the stable-contract dependencies of 005/006.

## Exact construction waves

| Child | Risk | Exact contracts | Local deterministic environment | Key denial |
| --- | --- | --- | --- | --- |
| `WO-WAL-001A` | R2 | `wal.public-baseline-ledger.v1` | `local-temp-only`; OS temp only, no network/database | Registry/source readiness cannot imply landed rows, runtime, provenance/freshness completeness, capability or no fallback |
| `WO-WAL-002A` | R2 | `wal.county-upload.csv-parser.v1` | `local-memory-stream-only`; disposable streams | No upload/auth/county binding, persistence, provenance, quarantine, promotion, rollback or unsupported formats |
| `WO-WAL-003A` | R3 | `wal.source-profile.v1`; `wal.external-readonly.v1` | `mock-source-only`; strings/reflection only | No connection, credentials, DML/DDL/write-back, production registration or live no-DML claim |
| `WO-WAL-004A` | R5 | `wal.county-identity.v1`; `wal.county-authority.v1` | `wal004a-local-in-memory`; synthetic rows/claims | No schema/migration, route/controller integration, trust/activation state, frontend authority or default county |
| `WO-WAL-001B` | R2 | `wal.public-acquisition-artifact-receipt.v1` | `local-memory-artifact-fixture-only` | No network, filesystem output, persistence, landed/runtime inference or activation |
| `WO-WAL-002B` | R3 | `wal.county-upload.csv-envelope.v1` | `local-memory-csv-envelope-only` | No authentication, county binding, API, persistence, quarantine, promotion, rollback or UI |
| `WO-WAL-003B` | R3 | `wal.external-readonly.execution-envelope.v1` | `mock-read-executor-only` | No live source, credential, DI registration, persistence or source-side no-DML claim |
| `WO-WAL-004B` | R5 | `wal.county-data-authority-boundary.v1` | `local-memory-authority-predicate-only` | No raw claims, integration, persistence, activation inference, adoption or default county |
| `WO-WAL-001C` | R2 | `wal.public-acquisition-receipt-ledger.v1` | `local-memory-receipt-ledger-only` | No acquisition transport, landing, parsing, freshness, runtime or capability inference |
| `WO-WAL-002C` | R5 | `wal.county-upload.csv-county-bound-intake.v1` | `local-memory-authority-bound-csv-only` | No raw claims, authentication, API, persistence, quarantine, promotion, rollback or UI |
| `WO-WAL-003C` | R4 | `wal.external-readonly.db-command-adapter.v1` | `fake-ado-reader-only` | No nonquery, transaction, credential, live database, DI registration, persistence or observed no-DML claim |
| `WO-WAL-004C` | R5 | `wal.county-data-activation-prerequisite.v1` | `local-memory-activation-prerequisite-only` | No activation, adoption, role grant, UI, persistence, evidence fabrication or default county |
| `WO-WAL-001D` | R2 | `wal.public-acquisition-artifact-verification.v1` | `local-memory-public-artifact-verification-only` | No network acquisition, filesystem landing, parsing, authenticity/freshness, normalization, runtime or capability inference |
| `WO-WAL-002D` | R3 | `wal.county-upload.csv-idempotency.v1` | `local-memory-csv-idempotency-only` | No duplicate store/decision, authentication, uploader identity, API, persistence, quarantine, promotion or rollback |
| `WO-WAL-003D` | R4 | `wal.external-readonly.db-connection-session.v1` | `fake-ado-open-connection-only` | No connection discovery/credentials/open/close, live DB, DI, retry, persistence, checkpoint or observed no-DML claim |
| `WO-WAL-004D` | R5 | `wal.authenticated-county-authority-binding.v1` | `local-auth-context-resolver-fixture-only` | No token auth, role/capability grant, activation/public-private decision, route/body/header authority, integration, persistence or default county |
| `WO-WAL-001E` | R3 | `wal.public-acquisition-artifact-landing.v1` | `local-temp-public-artifact-landing-only` | No acquisition, source-authenticity inference, permanent storage, parsing, normalization, runtime, protected data or production |
| `WO-WAL-002E` | R3 | `wal.county-upload.csv-duplicate-decision.v1` | `local-memory-csv-duplicate-decision-only` | No durable duplicate store/reservation, upload transport, authentication, persistence, quarantine, promotion or rollback |
| `WO-WAL-004E` | R5 | `wal.authenticated-canonical-county-context.v1` | `local-auth-context-canonical-registry-fixture-only` | Canonical registry fixture only; no token auth, role/capability grant, activation, selector authority, persistence, live county resource, protected data, default county or production |

The exact path allowlists, machine-readable contract/environment reservations, and validation gates are canonical in
`docs/brain/workorders/registry/work-order-registry.seed.json` and the corresponding child Work Order
documents. Contract/environment reservations do not create credential, protected-data, external-
system or production authority.

There is no F-wave row because `WO-WAL-000F` registers zero executable F children, contracts,
environments, and implementation paths.

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
- no live Sync continuation without the complete named-source, read-only credential/role,
  secret-store-reference, execution/network, data-handling, and source-side no-DML evidence bundle.

## Capability honesty

Statewide launch does not mean every TerraForge module is usable from public data in every county. The runtime must compute/display capability from required observed inputs. Public-data workflows may launch statewide while cost/income/calibration functions remain unavailable for a county until the required county-specific data is uploaded or connected.
