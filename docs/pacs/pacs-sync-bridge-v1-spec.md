# PACS Sync Bridge v1 — Implementation Spec

**Status:** binding implementation contract. Layer 3 of 3:

```text
docs/pacs/pacs-knowledge-baseline.md         (Layer 1 — what PACS is)
docs/pacs/pacs-ingestion-spine.md            (Layer 2 — how to ingest correctly)
docs/pacs/pacs-source-provenance-doctrine.md (Layer 2.5 — how lineage is enforced)
docs/pacs/pacs-sync-bridge-v1-spec.md        (Layer 3 — what to build first) ← this doc
```

## 0. Framing — TerraFusion is becoming the system of record

TerraFusion is **not** "syncing PACS." TerraFusion is becoming the
new CAMA / county property system of record. The job is:

> **Reconstruct PACS truth, translate it into TerraFusion truth,
> prove it, then gradually transfer authority from PACS to
> TerraFusion.**

PACS identity (`prop_id + prop_val_yr + sup_num`) remains sacred for
**migration, audit, and rollback**. But TerraFusion needs its own
identity: `tf_parcel_id`, `tf_owner_id`, `tf_assessment_id`,
`tf_sale_id`, `tf_levy_id`. PACS keys become **lineage**, not
permanent authority.

TerraFusion Sync is **not ETL**. It is a **governed bidirectional
reconciliation engine** with five engines:

```text
1. Extract     — pull from PACS / source systems faithfully
2. Crosswalk   — map source identity to TF identity, preserving lineage
3. Diff        — compare what we have vs what was loaded last
4. Conflict    — surface contested-authority writes for review
5. Write-back  — push approved TF writes back to PACS (Phase 2+, not v1)
   / Rollback  — undo any promoted batch with full restoration
```

This v1 spec builds the **control tower** for those engines. v1 does
NOT execute the engines yet. v1 makes sure that when an engine
runs, every write has a place to be proven.

---

## 1. Phase 1 scope — what's in, what's out

### ✅ In scope

1. `canonical_tf.tf_parcel` — TF-native parcel identity table.
2. **Eight `sync_bridge.*` control-tower tables:**
   - `source_xref` — lineage backbone (TF entity → source key).
   - `field_authority` — write governance (which side owns each field).
   - `load_batch` — every load operation registered.
   - `diff_ledger` — what changed between loads.
   - `conflict_queue` — contested-authority writes awaiting review.
   - `writeback_journal` — every write back to PACS journaled.
   - `rollback_package` — packaged undo for any promoted batch.
   - `promotion_gate_result` — gate execution outcomes per batch.
3. **EF migration** creating both schemas + all 9 tables.
4. **DbContext registration** (`DbSet<...>` for each).
5. **EF configurations** (PK / FK / index / column-type).
6. **Field authority seed** — Phase 0 rules for the parcel domain.
7. **One unit test** per entity verifying it materializes against an
   in-memory provider (compile + schema validity).

### ❌ NOT in v1 (explicit deferrals)

- The actual PACS → TF parcel spine ingest (Phase 1.5 next slice).
- The `raw_pacs.*` schema (Phase 1.5).
- The `legacy_tf_unproven.*` quarantine of current `Properties` /
  `pacs_sales` (Phase 1.6).
- Owners ingestion (Phase 2).
- Sales ingestion (Phase 2).
- GIS / spatial (Phase 3).
- UI / dashboards (Phase 3).
- Write-back execution to PACS (Phase 2+; v1 only logs intent).
- Rollback execution (Phase 2+; v1 only stores rollback packages).
- Conflict review UI (Phase 2+; v1 only enqueues).
- Multi-county scope (current scope: Benton only via county_id).

This boundary is **non-negotiable in v1**. Adding scope means
amending this spec; it does not happen mid-slice.

---

## 2. Schema decisions

### 2.1 PostgreSQL (not SQL Server)

The user's source DDL is SQL Server-flavored. TerraFusion DB is
PostgreSQL in production, SQLite in dev (per
`backend/CLAUDE.md`). Translation rules:

| User's SQL Server | Our PostgreSQL / EF Core |
|---|---|
| `UNIQUEIDENTIFIER` | `uuid` |
| `NEWID()` default | EF-generated `Guid.NewGuid()` |
| `NVARCHAR(N)` | `varchar(N)` |
| `NVARCHAR(MAX)` | `text` |
| `DATETIME2` | `timestamp with time zone` |
| `SYSUTCDATETIME()` | `now() at time zone 'utc'` (or EF default `DateTime.UtcNow`) |
| `BIT` | `boolean` |
| `BIGINT IDENTITY` | `bigserial` (or EF Identity) |
| `HASHBYTES('SHA2_256', x)` | computed in C#; we store the hash, not compute in SQL |

### 2.2 Schema namespacing

PostgreSQL has first-class schema support. EF Core configures via
`HasDefaultSchema` / `[Table(Schema = "...")]`. We will use:

```text
canonical_tf  — TF-native canonical entities
sync_bridge   — control tower
(public)      — unchanged; existing TF DB stays here
```

`raw_pacs.*`, `truth_pacs.*`, and `legacy_tf_unproven.*` schemas
are deferred to Phase 1.5. v1 does not create them.

### 2.3 Identity strategy

- **`tf_parcel_id`** is `Guid` (uuid). Default-generated in EF.
- **Composite keys preserved on bridge tables** where the user's DDL
  used them (`PK_tf_source_xref` is composite per first message).
- **Surrogate `bigint` IDs** elsewhere where the user's DDL used
  `BIGINT IDENTITY` (per second message).

The user's two messages slightly disagree on the `source_xref` PK
shape (composite vs surrogate). v1 follows the **second message**:
surrogate `bigint` PK + a unique constraint on the natural composite
key. This makes referencing easier and keeps the natural key
queryable.

---

## 3. The 9 v1 tables (binding DDL)

### 3.1 `canonical_tf.tf_parcel`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
tf_parcel_id                 uuid                        PK, default Guid.NewGuid
county_id                    uuid                        NOT NULL — match Benton GUID
parcel_number                varchar(50)                 PACS geo_id at first
situs_address                varchar(255)                derived; PII-classified
legal_description            text
parcel_status                varchar(50)                 'ACTIVE' | 'INACTIVE' | 'WITHDRAWN' | 'UNDER_REVIEW'
property_type                varchar(20)                 'R' | 'MH' | 'P' (P only if explicitly authorized)
current_owner_id             uuid                        FK to canonical_tf.tf_owner (Phase 2)
current_assessment_id        uuid                        FK to canonical_tf.tf_assessment (Phase 2)
created_at                   timestamptz                 NOT NULL default now()
updated_at                   timestamptz                 NOT NULL default now()

INDEX (county_id, parcel_number)
INDEX (county_id, parcel_status)
```

`current_owner_id` / `current_assessment_id` are nullable in v1. They
become NOT NULL in Phase 2 once those tables land, gated by the
"NO tf_parcel.current_owner_id unless lineage-backed owner exists"
rule from the user's save state.

### 3.2 `sync_bridge.source_xref`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
xref_id                      bigserial                   PK
tf_entity_type               varchar(50)                 NOT NULL — 'parcel', 'owner', 'sale', 'assessment', 'levy'
tf_entity_id                 uuid                        NOT NULL — FK type-dependent
source_system                varchar(50)                 NOT NULL — see source_family enum below
source_database              varchar(100)
source_table                 varchar(100)
source_key_json              jsonb                       NOT NULL — composite key as JSON
source_query_hash            varchar(128)                NOT NULL — SHA-256 of executed query
load_batch_id                uuid                        NOT NULL FK → load_batch
first_seen_at                timestamptz                 NOT NULL default now()
last_seen_at                 timestamptz                 NOT NULL default now()
confidence_score             numeric(5,2)                NOT NULL default 1.00
is_active                    boolean                     NOT NULL default true

UNIQUE (tf_entity_type, tf_entity_id, source_system)
INDEX (source_system, source_key_json) — for reverse lookups
INDEX (load_batch_id)
```

For PACS parcels, `source_key_json` is:

```json
{ "prop_id": 12345, "prop_val_yr": 2026, "sup_num": 0 }
```

### 3.3 `sync_bridge.field_authority`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
authority_id                 bigserial                   PK
domain_name                  varchar(50)                 NOT NULL — 'parcel', 'owner', 'sale', etc.
field_name                   varchar(100)                NOT NULL
phase                        varchar(50)                 NOT NULL — 'phase_0', 'phase_1', 'phase_2', etc.
system_of_record             varchar(50)                 NOT NULL — 'PACS', 'TF', 'GIS', 'CONTESTED'
pacs_to_tf_allowed           boolean                     NOT NULL
tf_to_pacs_allowed           boolean                     NOT NULL
conflict_strategy            varchar(50)                 NOT NULL — see conflict_strategy enum below
approval_required            boolean                     NOT NULL default true
rollback_required            boolean                     NOT NULL default true
created_at                   timestamptz                 NOT NULL default now()
updated_at                   timestamptz                 NOT NULL default now()

UNIQUE (domain_name, field_name, phase)
```

**conflict_strategy enum:** `PACS_WINS`, `TF_WINS`, `MANUAL_REVIEW`,
`APPEND_ONLY`, `BLOCKED`. Default for any field without an explicit
rule: `BLOCKED`.

### 3.4 `sync_bridge.load_batch`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
load_batch_id                uuid                        PK, default Guid.NewGuid
source_family                varchar(64)                 NOT NULL — see source_family enum below
source_system                varchar(128)                NOT NULL
source_file_or_database      varchar(256)                NOT NULL
source_query_name            varchar(256)
source_query_hash            varchar(64)                 NOT NULL
restore_source               varchar(256)
operator                     varchar(128)                NOT NULL
started_at                   timestamptz                 NOT NULL default now()
completed_at                 timestamptz
status                       varchar(32)                 NOT NULL — 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL'
proof_gate_report_path       varchar(512)
rows_extracted               bigint
rows_promoted                bigint
error_summary                text                        sanitized; no secrets
created_at                   timestamptz                 NOT NULL default now()

INDEX (source_family, started_at DESC)
INDEX (status)
```

**source_family enum:** `PACS_OLTP`, `PACS_BACKUP`, `CAMACLOUD`,
`PACS_SPATIAL`, `PACS_LISTS`, `TAAPPSVR`, `PROVAL`, `ASCEND`, `CIAPS`,
`BENTON_DYNLOADER`, `LEGACY_UNKNOWN`.

### 3.5 `sync_bridge.diff_ledger`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
diff_id                      bigserial                   PK
load_batch_id                uuid                        NOT NULL FK → load_batch
tf_entity_type               varchar(50)                 NOT NULL
tf_entity_id                 uuid                        NOT NULL
field_name                   varchar(100)                NOT NULL
diff_kind                    varchar(32)                 NOT NULL — 'INSERT' | 'UPDATE' | 'DELETE' | 'NO_CHANGE'
before_value                 text
after_value                  text
created_at                   timestamptz                 NOT NULL default now()

INDEX (load_batch_id)
INDEX (tf_entity_type, tf_entity_id, field_name)
```

### 3.6 `sync_bridge.conflict_queue`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
conflict_id                  uuid                        PK, default Guid.NewGuid
load_batch_id                uuid                        NOT NULL FK → load_batch
tf_entity_type               varchar(50)                 NOT NULL
tf_entity_id                 uuid                        NOT NULL
field_name                   varchar(100)                NOT NULL
domain_name                  varchar(50)                 NOT NULL
proposed_value               text
current_value                text
conflict_strategy            varchar(50)                 NOT NULL
resolution_status            varchar(32)                 NOT NULL default 'PENDING' — 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_RESOLVED'
resolved_value               text
resolved_by                  varchar(128)
resolved_at                  timestamptz
notes                        text
created_at                   timestamptz                 NOT NULL default now()

INDEX (resolution_status, created_at)
INDEX (load_batch_id)
```

### 3.7 `sync_bridge.writeback_journal`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
journal_id                   uuid                        PK, default Guid.NewGuid
load_batch_id                uuid                        FK → load_batch
tf_entity_type               varchar(50)                 NOT NULL
tf_entity_id                 uuid                        NOT NULL
target_system                varchar(50)                 NOT NULL — 'PACS', 'CAMACLOUD'
target_table                 varchar(100)                NOT NULL
target_key_json              jsonb                       NOT NULL
field_name                   varchar(100)                NOT NULL
new_value                    text
authority_id                 bigint                      NOT NULL FK → field_authority
status                       varchar(32)                 NOT NULL — 'INTENDED' | 'EXECUTED' | 'FAILED' | 'WITHDRAWN'
executed_at                  timestamptz
operator                     varchar(128)                NOT NULL
created_at                   timestamptz                 NOT NULL default now()

INDEX (target_system, status)
INDEX (load_batch_id)
```

In v1, all rows are status='INTENDED'. Phase 2+ adds the actual
write-back execution.

### 3.8 `sync_bridge.rollback_package`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
rollback_package_id          uuid                        PK, default Guid.NewGuid
load_batch_id                uuid                        NOT NULL FK → load_batch (one-to-one)
package_payload              jsonb                       NOT NULL — JSON-encoded inverse-operations
package_size_bytes           bigint                      NOT NULL
created_at                   timestamptz                 NOT NULL default now()
restorable_until             timestamptz                 retention horizon
applied_at                   timestamptz                 null until rollback executed
applied_by                   varchar(128)
status                       varchar(32)                 NOT NULL default 'AVAILABLE' — 'AVAILABLE' | 'APPLIED' | 'EXPIRED' | 'CORRUPTED'

UNIQUE (load_batch_id)
INDEX (status, restorable_until)
```

### 3.9 `sync_bridge.promotion_gate_result`

```text
column                       type                        notes
─────────────────────────────────────────────────────────────────────────
gate_result_id               bigserial                   PK
load_batch_id                uuid                        NOT NULL FK → load_batch
gate_name                    varchar(100)                NOT NULL — 'R-1', 'R-2', 'T-1', etc.
gate_stage                   varchar(50)                 NOT NULL — 'SOURCE_TO_RAW' | 'RAW_TO_TRUTH' | 'TRUTH_TO_CANONICAL' | 'CANONICAL_TO_PRODUCT'
status                       varchar(32)                 NOT NULL — 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
expected                     text
actual                       text
detail                       text
executed_at                  timestamptz                 NOT NULL default now()

INDEX (load_batch_id, gate_stage)
INDEX (status, executed_at DESC)
```

---

## 4. Field authority seed (Phase 0)

The first migration also seeds these initial rules for the parcel
domain (per the user's first-message example, expanded):

```text
domain   | field             | sor    | pacs→tf | tf→pacs | conflict       | phase
---------+-------------------+--------+---------+---------+----------------+--------
parcel   | parcel_number     | PACS   | true    | false   | PACS_WINS      | phase_0
parcel   | situs_address     | PACS   | true    | false   | MANUAL_REVIEW  | phase_0
parcel   | legal_description | PACS   | true    | false   | PACS_WINS      | phase_0
parcel   | property_type     | PACS   | true    | false   | PACS_WINS      | phase_0
parcel   | parcel_status     | PACS   | true    | false   | PACS_WINS      | phase_0
parcel   | county_id         | TF     | false   | false   | TF_WINS        | phase_0
parcel   | created_at        | TF     | false   | false   | APPEND_ONLY    | phase_0
parcel   | updated_at        | TF     | false   | false   | APPEND_ONLY    | phase_0
```

`property_type='P'` writes are blocked at the application layer
until the operator approves Personal Property scope.

---

## 5. Promotion gates (v1 set)

v1 implements the schema for `promotion_gate_result` but does NOT
yet wire all gates. The v1 gates that DO get wired (because they're
testable against the schema itself):

```text
Gate ARCH-1 — schema integrity
  every sync_bridge table compiles, materializes against an
  in-memory provider, and round-trips a sample row.

Gate ARCH-2 — field_authority seed completeness
  every column on canonical_tf.tf_parcel that's not auto-managed
  has a phase_0 row in field_authority.

Gate ARCH-3 — referential integrity
  every FK declared in §3 actually creates the FK constraint at
  migration time.
```

All other gates (R-*, T-*, C-*, P-*) are wired in Phase 1.5+ when
their target schemas land.

---

## 6. Implementation contract (binding)

This v1 slice MUST land:

1. **9 EF entity classes** in
   `backend/src/TerraFusion.Core/Entities/`:
   - `CanonicalTf/TfParcel.cs`
   - `SyncBridge/SourceXref.cs`
   - `SyncBridge/FieldAuthority.cs`
   - `SyncBridge/LoadBatch.cs`
   - `SyncBridge/DiffLedger.cs`
   - `SyncBridge/ConflictQueue.cs`
   - `SyncBridge/WritebackJournal.cs`
   - `SyncBridge/RollbackPackage.cs`
   - `SyncBridge/PromotionGateResult.cs`
2. **EF configurations** matching §3 column types, FK targets, and
   indexes, in `backend/src/TerraFusion.Data/Configurations/`.
3. **DbContext registration** — 9 `DbSet<...>` entries on
   `TerraFusionDbContext`.
4. **One EF migration** creating the `canonical_tf` and `sync_bridge`
   schemas + 9 tables + indexes + FKs + the field_authority seed.
5. **One unit test** per entity verifying it materializes through
   `UseInMemoryDatabase` (proves entity + configuration align).
6. **One integration test** that materializes the field_authority
   seed and asserts the 8 phase_0 rows are present.

This v1 slice MUST NOT land:

- Any ingest code reading from `pacs_oltp` or any source system.
- Any `raw_pacs.*` or `truth_pacs.*` schema.
- Any deletion / rename of existing `Properties` / `pacs_sales` /
  `CanonicalSaleQualifications` / `SyncMappingWorkbook` tables.
- Any frontend / API code beyond what's already on main.

---

## 7. Migration name + commit message (binding)

```text
Migration: 20260502_AddCanonicalTfAndSyncBridgeV1
Commit:    feat: implement canonical parcel identity + lineage +
           sync authority core. The parcel finally has a birth
           certificate.
```

---

## 8. Five-year doctrine note

This v1 control tower will outlive every individual ingest. When
PACS retires (Phase 4 of the doctrine's migration plan), the
sync_bridge tables stay — they document the lineage of every
TF row back to its legacy source forever. That's the audit trail
the assessor's office needs even after PACS is read-only archive.

---

## 9. Warning for future agents

If you ever:

- Join on `prop_id` alone (without `prop_val_yr`, `sup_num`)
- Write to `product.*` without an `xref` row
- Allow a write-back without a `field_authority` rule
- Promote a load batch without all gates passing
- Create a row in `canonical_tf.*` without `load_batch_id` and
  `source_query_hash` traceable to a real `load_batch`

…the system will silently rot again. The tech debt will start
whispering your name at night. Don't.

---

## 10. Definition of done for v1

The v1 slice is done when:

- [ ] All 9 entities exist and compile.
- [ ] EF migration applies cleanly against fresh Postgres + SQLite.
- [ ] DbContext exposes all 9 DbSets.
- [ ] `field_authority` carries the 8 phase_0 parcel rows.
- [ ] All unit tests green.
- [ ] No deletion or rename of existing pre-doctrine tables.
- [ ] No code path that ingests from PACS yet.
- [ ] Commit message matches §7.

After that, the next slice (Phase 1.5) is the **first real
PACS → canonical_tf.tf_parcel ingest** with the gold query, writing
to `raw_pacs.property` first and promoting through `truth_pacs.parcel
_spine` to `canonical_tf.tf_parcel`, recording every step in
`sync_bridge.load_batch` + `sync_bridge.source_xref` +
`sync_bridge.diff_ledger` + `sync_bridge.promotion_gate_result`.

But not in this slice. **This slice builds the control tower
first.** When the parcel arrives, it has a birth certificate
waiting.
