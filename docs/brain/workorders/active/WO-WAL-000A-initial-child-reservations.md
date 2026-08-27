# WO-WAL-000A — Initial Exact Child Reservations

| Field | Value |
| --- | --- |
| Status | `COMPLETE_ON_PROTECTED_MERGE` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Parent | `WO-WAL-000` |
| Authority | Issue #1485 via `OWNER-WAL-V1-MISSION-AUTHORITY-20260827` |
| Base | `0aba8ff60d09f526b6aa0a8aaf85fd4fc7957778` |
| Risk | R3 governance-only child registration |

## Objective

Replace the broad initial-wave routing language with four exact, non-colliding child Work Orders.
Each child is a bounded decomposition of its open parent, inherits the same WAL goal and loop, and
has an exact path, contract, environment, denial and validation boundary.

Correct the parallel planner's reservation typing so exact machine-declared versioned contract
identifiers containing protected-resource words remain identifiers, while protected environment
reservations and adversarial contract relabeling continue to fail closed. This is an R3
governance/planner correction required to validate the exact child wave.

This registration does not complete `WO-WAL-001` through `WO-WAL-004`, stabilize all of their
contracts, or unblock `WO-WAL-005` or `WO-WAL-006`.

## Exact Governance Reservation

Only these paths may change under this governance child:

- `docs/brain/workorders/active/WO-WAL-000A-initial-child-reservations.md`
- `docs/brain/workorders/schema/work-order.schema.json`
- `docs/brain/workorders/registry/work-order-registry.seed.json`
- `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
- `docs/brain/workorders/programs/washington-assessor-launch-v1.md`
- `docs/brain/workorders/tools/wo-wave-plan.mjs`
- `docs/brain/workorders/tools/wo-wave-plan.test.mjs`

No product, runtime, test, package, workflow, deployment or generated-evidence file is writable in
this child.

## Initial Child Wave

| Child | Parent dependency | Risk | Exact contract reservation | Exact environment reservation |
| --- | --- | --- | --- | --- |
| `WO-WAL-001A` | `WO-WAL-000` satisfied; bounded child of open `WO-WAL-001` | R2 | `wal.public-baseline-ledger.v1` | `local-temp-only`: OS temporary directory only; no network or database |
| `WO-WAL-002A` | `WO-WAL-000` satisfied; bounded child of open `WO-WAL-002` | R2 | `wal.county-upload.csv-parser.v1` | `local-memory-stream-only`: disposable in-memory streams only |
| `WO-WAL-003A` | `WO-WAL-000` satisfied; bounded child of open `WO-WAL-003` | R3 | `wal.source-profile.v1`; `wal.external-readonly.v1` | `mock-source-only`: in-process strings and reflection only |
| `WO-WAL-004A` | `WO-WAL-000` satisfied; bounded child of open `WO-WAL-004` | R5 | `wal.county-identity.v1`; `wal.county-authority.v1` | `wal004a-local-in-memory`: synthetic county rows and claims only |

The satisfied dependency is the protected-complete mission root `WO-WAL-000`. The named product
parent is an association and continuation target; it remains open and is not recorded as a satisfied
dependency.

### WO-WAL-001A paths

- `docs/brain/workorders/active/WO-WAL-001A-public-baseline-ledger-contract.md`
- `scripts/truth/wal-public-baseline-ledger.mjs`
- `scripts/truth/wal-public-baseline-ledger.test.mjs`

### WO-WAL-002A paths

- `docs/brain/workorders/active/WO-WAL-002A-streaming-csv-parser-harness.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvStreamParser.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvStreamParserTests.cs`

### WO-WAL-003A paths

- `docs/brain/workorders/active/WO-WAL-003A-read-only-source-adapter-contract.md`
- `backend/src/TerraFusion.Core/Sync/Profiles/IReadOnlyCountySourceAdapter.cs`
- `backend/src/TerraFusion.Core/Sync/Profiles/ReadOnlySourceCommandGuard.cs`
- `backend/tests/TerraFusion.Unit.Tests/Sync/ReadOnlyCountySourceAdapterContractTests.cs`

### WO-WAL-004A paths

- `docs/brain/workorders/active/WO-WAL-004A-canonical-county-authority-contract.md`
- `backend/src/TerraFusion.Core/Counties/WashingtonCountyRegistry.cs`
- `backend/src/TerraFusion.API/Services/CountyResolver.cs`
- `backend/src/TerraFusion.API/Auth/HttpContextRequestUserContextAccessor.cs`
- `backend/TerraFusion.API.Tests/CountyResolverTests.cs`
- `backend/TerraFusion.API.Tests/Auth/HttpContextRequestUserContextAccessorTests.cs`

## Exact Denials

- No child may write outside its listed files or claim an unlisted contract or environment.
- No child may use a live network, database, identity provider, county system, credential, secret,
  PACS/CAMA/GIS source, protected county data or production environment.
- `WO-WAL-001A` may not infer landed rows, runtime registration, provenance completeness,
  freshness, capability or no-fallback proof from registry/source readiness.
- `WO-WAL-002A` may not create an upload API, authentication/county binding, persistence,
  provenance, quarantine, promotion, rollback or unsupported-format path.
- `WO-WAL-003A` may not connect to a source or expose DML, DDL, write-back, credential, connection,
  transaction, stored-procedure or production registration behavior; static guard proof is not live
  no-DML proof.
- `WO-WAL-004A` may not add schema/migrations, controllers/routes, trust/activation state, frontend
  authority, write-back or any missing/unknown/ambiguous default county, including Benton.
- No initial child completes its broad parent or clears the stable-contract dependencies of
  `WO-WAL-005` or `WO-WAL-006`.

## Validation

- parse `docs/brain/workorders/registry/work-order-registry.seed.json` as JSON;
- validate the four new child records against
  `docs/brain/workorders/schema/work-order.schema.json` and prove the optional schema extension causes
  no validation regression in pre-existing registry records;
- query the registry and prove all four children are `ready` with satisfied `WO-WAL-000` mission-
  root dependencies and explicit still-open parent association notes;
- run the read-only wave planner with exact path, contract and environment candidate reservations and
  prove the four children form a non-colliding initial executable set;
- prove exact machine-declared WAL versioned contract identifiers containing `county` or `sql` are
  admitted under valid inherited mission authority while missing, extra, duplicate, cross-kind and
  protected environment or contract-relabel claims fail closed;
- run focused Work Order query tests and the full parallel-wave planner Node suite;
- run `git diff --check` and prove only the seven exact governance paths changed.

## Mission Authority Note

Issue #1485 authorizes exact mechanical children that only decompose the WAL mission. The active
mission decision supplies the bounded lifecycle authority, while these records supply the exact
execution scope. Contract and environment reservations do not create credentials, protected-data
access, production access or external-system authority.

## Completion

This child becomes complete only when the protected merge contains the four exact child records, the
truthful `WO-WAL-000A` lifecycle record, consistent queue/program routing, and passing scoped
governance validation. Execution then continues through the registered children while their parents
remain open.
