# TerraFusion Sync v4 — Control Plane Design Spec

**Date:** 2026-04-16
**Status:** Proposed. Ready for user review.
**Related:** `2026-04-16-terrafusion-sync-v4-operator-surface-design.md` (separate spec for the CLI/SDK surface).

---

## 1. Strategic goal

Make TerraFusion Sync what it is supposed to be: the **AI-powered, FISMA-HIGH, multi-county legacy-database ingestion powerhouse** at the heart of a government operating system serving 39+ Washington State counties. The current code is a graveyard of aspirational naming (5,750 LOC dormant, background loop hardcoded no-op, rubber-stamp contract validator). This spec replaces that with a control plane that stands on battle-tested OSS (Debezium, Kafka, RisingWave, Arroyo) and adds a thin, focused Rust layer that enforces TerraFusion-specific policy, tenancy, AI integration, and auditability.

**Non-goal:** rebuilding CDC, streaming infrastructure, or observability from scratch. Every production government data platform stands on OSS for these; we will too.

**Success in one sentence:** a new county plugs in their legacy PACS and sees canonical data flowing to TerraFusion's operational store within 72 hours, with full NIST 800-53 AU-2/AU-3/AU-12 audit trails, zero custom CDC code, and AI-flagged anomalies surfacing to the Consciousness swarm for human-in-the-loop review.

---

## 2. Architecture

### 2.1 Layered view

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SOURCES (per county, per vendor)                                        │
│  Harris PACS MSSQL  │  Tyler Vision  │  Aumentum  │  Patriot  │  SDS    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │  Native CDC
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  INGEST:  Debezium Kafka Connect                                         │
│           (one connector per county, SQL Server CDC + snapshot)          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  EVENT BACKBONE:  Kafka (MSK or Strimzi)                                 │
│    topic: sync.source.{vendor}.{county}.{table}                          │
│    topic: sync.canonical.{entity}                                         │
│    topic: sync.audit                                                      │
│    topic: sync.anomaly                                                    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│ TRANSFORM:       │  │ CONTROL PLANE:   │  │ AUDIT SINK:              │
│   Arroyo         │  │   Rust service   │  │   OTel Collector →       │
│   (streaming SQL)│  │   (this spec)    │  │   Splunk Cloud Federal   │
└────────┬─────────┘  └────────┬─────────┘  │   + S3 Object Lock WORM  │
         │                     │            └──────────────────────────┘
         ▼                     │
┌──────────────────┐           │
│ CANONICAL VIEWS: │           │
│   RisingWave     │           │
│   (materialized  │           │
│   streaming MVs) │           │
└────────┬─────────┘           │
         │                     │
         ▼                     │
┌─────────────────────────────────────────────────────────────────────────┐
│  HOT READ LAYER:  PostgreSQL (TerraFusion canonical DB)                  │
│  Consumers: CostForge, SalesForge, IncomeForge, TerraFlow, UI           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Components

Each component is chosen because it solves a problem we do not want to solve ourselves.

| Layer | Component | Why this choice |
|---|---|---|
| CDC ingestion | **Debezium Kafka Connect** | 1,000+ production deployments including government. Native SQL Server CDC via `cdc.lsn_time_mapping`. Auto-handles snapshot→streaming transition. FISMA-acceptable. Alternative (home-grown polling) fails FISMA audit. |
| Event backbone | **Kafka (AWS MSK or Strimzi on K8s)** | Durable, partitioned, replayable. Every downstream (RisingWave, Arroyo, audit, AI swarm) taps the same stream. Scales to thousands of counties via topic partitioning. |
| Stream transform | **Arroyo** (Rust streaming SQL; now Cloudflare Pipelines) | Rust-native, sub-second latency, SQL authoring. Handles canonical field mapping (PARID→parcelId), sanitization, 3-layer PACS qualification, per-county per-vendor normalization. Apache 2.0. |
| Materialized views | **RisingWave** (Rust streaming DB, PG-compatible) | Maintains canonical denormalized views as streams arrive. Sub-100ms freshness. Replaces the PacsCanonicalizer + PacsToTerraFusionSyncService + migration backfill dance entirely with declarative SQL. |
| Hot read layer | **PostgreSQL** (existing `terrafusion` DB) | Unchanged. CostForge / SalesForge / Frontend continue to read from existing canonical tables; RisingWave writes them. Zero consumer refactor. |
| Control plane | **Rust service** (this spec) | The TerraFusion-unique layer: policy, tenancy, AI integration, governed operations. Not a sync engine — a governance and orchestration layer on top of the OSS stack. |
| Observability | **OpenTelemetry → Splunk Cloud Federal** (FedRAMP High 2024-authorized) OR **Prometheus + Grafana Federal** | Traces, metrics, logs, audit events. Splunk is the FedRAMP-authorized path; Grafana Federal is the cost-controlled path. Choice deferred to deployment configuration. |
| Audit store | **S3 Object Lock WORM** with SHA-256 chain-of-custody | NIST 800-53 AU-2/AU-3/AU-9/AU-12. 7-year retention. Cryptographically tamper-evident. Standard FedRAMP pattern. |

### 2.3 The Rust control plane — what WE build

This is the only substantial new code. It is NOT a sync engine. It orchestrates the OSS stack and enforces TerraFusion policy.

**Scope (single Rust workspace under `/packages/terra-sync/`):**

1. **Connector registry** — CRUD API for Debezium connector configurations per county. Validates config against pacscontract.v1 policy before deployment to Kafka Connect cluster.
2. **pacscontract.v1 policy engine** — real policy enforcement (not the current rubber stamp). Parses signed contract manifests. Rejects topic subscriptions that violate read-only / tenancy / column-level restrictions. Issues tokens to consumers.
3. **County tenancy** — enforces sovereign-county isolation at the event-bus level. Every topic, every sink, every audit event is tagged with `county_id`. Cross-county reads require explicit amendment.
4. **AI-swarm integration** — publishes `sync.anomaly` events to the Consciousness service (port 3004). Consumes verdicts. Surfaces them via the operator CLI (see spec 2).
5. **gRPC surface** — the external API for the operator CLI, other TerraFusion services (.NET, TS, Python), and external auditors. All authenticated via mTLS. All actions audited.
6. **WORM audit emitter** — every state-changing operation emits an event to `sync.audit` Kafka topic. Partition key = `county_id`. Hash-chained to previous event. Written to S3 Object Lock by a dedicated audit sink.
7. **Health + readiness** — aggregates CDC lag, Kafka topic lag, RisingWave view freshness, connector state. Exposes `/health`, `/ready`, `/metrics` (Prometheus).
8. **Operator CLI backend** — this is the gRPC server that `tfsync` (spec 2) talks to.

**Out of scope for the control plane:**
- No direct MSSQL access (Debezium owns that)
- No SQL transformation (Arroyo owns that)
- No canonical view maintenance (RisingWave owns that)
- No Postgres writes (only RisingWave sink writes canonical)
- No CDC logic (Debezium owns that)

Keeping scope narrow is the entire point. The ~5,000 Rust LOC we write replaces 8,000+ LOC we delete.

---

## 3. Data flow

### 3.1 Steady-state sync flow

1. Assessor updates parcel in Benton County Harris PACS MSSQL.
2. SQL Server CDC captures the change in `cdc.<instance>_CT` tables (no triggers, no polling).
3. Debezium connector `benton-harris-pacs` reads CDC log, publishes event to `sync.source.harris.benton.property`.
4. Arroyo pipeline `normalize-property` consumes, applies field mapping, writes to `sync.canonical.property`.
5. RisingWave materialized view `mv_properties` consumes canonical topic, upserts to PG canonical table `Properties`.
6. CostForge / SalesForge / UI see the new value via their existing Postgres queries — no code change.
7. Audit sink writes every step to `sync.audit`, which is persisted to S3 Object Lock.
8. If Arroyo's anomaly-detection rules fire (ratio outlier, schema drift, missing required field), an event is published to `sync.anomaly`; Consciousness swarm consumes.

### 3.2 County onboarding flow

1. New county (e.g., Yakima) signs CJIS + data-sharing agreement.
2. Operator runs `tfsync connector scaffold --vendor=aumentum --county=yakima`.
3. CDK generates connector config + contract amendment draft.
4. Two-officer sign-off on pacscontract amendment (see spec 2 §`tfsync contract ratify`).
5. Control plane deploys connector to Kafka Connect cluster.
6. Debezium runs initial snapshot → CDC streaming.
7. Arroyo pipeline + RisingWave view for Yakima activate automatically via topic pattern subscription.
8. Yakima data appears in canonical Postgres within hours (snapshot) to minutes (ongoing CDC).

### 3.3 Contract amendment flow (write-back, column access, cross-county)

1. Operator proposes amendment: `tfsync contract amend --allow-writeback=prop_tax --county=Benton`.
2. Amendment draft signed by first officer (X.509 or Sigstore).
3. Second officer ratifies: `tfsync contract ratify <id>`.
4. Control plane validates amendment against pacscontract.v1 schema, stores in `docs/spec-lock/locks/pacscontract/amendments/`.
5. Relevant Arroyo pipelines + Debezium sink connectors activate the newly-permitted capability.
6. Amendment event published to `sync.audit` with both signatures.

---

## 4. Governance and compliance

### 4.1 pacscontract.v1 as real policy

Current state: a single `ValidateContractAsync` method returning `IsValid = true` unconditionally. Replaced by a **policy engine** in the Rust control plane:

- Contract manifest is a signed YAML/CBOR document in `docs/spec-lock/locks/pacscontract/`.
- Per-county overlay manifests add amendments (cryptographically signed).
- Policy engine evaluates every operator action, every consumer subscription, every sink write against the combined manifest.
- Denials are logged to `sync.audit` with the specific rule that failed.

### 4.2 Sovereign-county isolation

Every topic, every RisingWave view, every Postgres write, every audit event carries `county_id`. Cross-county queries (e.g., a Tyler Vision integration that spans two counties) require an explicit amendment with both counties' sign-off.

### 4.3 NIST 800-53 compliance mapping

| Control | Implementation |
|---|---|
| AU-2 (event logging) | Every state-changing operation → `sync.audit` topic → S3 WORM |
| AU-3 (event content) | Structured events: event_type, timestamp (µs UTC), actor identity, source system, outcome, affected entity IDs |
| AU-9 (audit protection) | S3 Object Lock (WORM). Hash-chained records. Dedicated audit-store IAM role (write-once). |
| AU-12 (audit generation) | Every TerraFusion service that touches canonical data emits events; control plane aggregates |
| AU-8 (time stamps) | All events use µs-precision UTC from NTP-synced nodes |
| SC-8/SC-13 (crypto in transit) | mTLS on all gRPC; TLS 1.3 on all Kafka; TDE on Postgres |
| AC-3 (access enforcement) | Every gRPC call authenticated (mTLS cert → identity); authorized via pacscontract policy |
| CM-5 (access to changes) | Two-officer sign-off on contract amendments; connector deployments gated |

---

## 5. Migration from current state

### 5.1 What gets deleted

| Artifact | LOC | Why |
|---|---:|---|
| `backend/src/TerraFusion.Sync/` (project) | 4,385 | Aspirational AI-branded shadow. Zero callers. |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1,365 | Dormant. Never registered. |
| `backend/src/TerraFusion.Core/Services/HarrisPACSSyncBackgroundService.cs` | 370 | Hardcoded no-op. Replaced by Debezium Connect. |
| `packages/terra-sync/src-tauri/src/` (current mock) | 1,501 | 100% mock; `rand::random()` for metrics. |
| `backend/src/TerraFusion.Data/Canonicalizers/PacsCanonicalizer.cs` | 155 | My personal bypass. |
| `backend/src/TerraFusion.API/Controllers/CanonicalAdminController.cs` | ~60 | My personal bypass. |
| Shadow CAMA seed scripts (`tmp/t0-canonicalize.sql`, `tmp/t1-canonicalize-av.sql`) | ~100 | Replaced by RisingWave MVs. |

**Total deletion:** ~7,900 LOC of dormant, shadow, or bypass code.

### 5.2 What gets migrated

| Artifact | LOC | Migration |
|---|---:|---|
| `backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs` | ~2,500 | Remains for one-shot historical bulk loads (pre-CDC baseline). Retires once Debezium snapshot proves equivalent. |
| `backend/src/TerraFusion.API/Seeds/PacsCanonicalizer.cs` | 1,014 | **Replaced** by RisingWave materialized views. Keep running in parallel for 30 days to compare outputs, then delete. |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | ~1,500 | **Replaced** by RisingWave + Arroyo. Keep during shadow-mode comparison. |
| QUARANTINE Python ETL (`terra-flow-production/sync_service/`) | 32,057 | Port the LOGIC (state machine, retry, checkpoint, conflict-resolution strategies) into Rust control plane and/or Arroyo SQL. Discard Flask/SQLAlchemy. Python tree retired after logic extracted. |
| `packages/terra-sync/` (frontend + Tauri shell) | ~2,500 | Becomes the **operator console** (see spec 2). Tauri UI stays; backend Rust rewritten per this spec. |
| 9 × `E:\PACS_*.zip` migration kits | — | Planning docs from April 2025. Reference material. Not code. |

### 5.3 Phased rollout (ordered, not time-boxed)

**Phase 1 — foundation.**
- Stand up Kafka cluster (MSK or Strimzi).
- Deploy Kafka Connect with SQL Server CDC worker pool.
- Bootstrap Rust control plane project (single workspace, gRPC skeleton).
- Implement minimal policy engine loading pacscontract.v1 manifest.
- Deploy OTel Collector + choose observability vendor (Splunk Federal vs Grafana Federal).
- Set up S3 Object Lock audit bucket with 7-year retention policy.

**Phase 2 — Benton first-county.**
- Create Debezium connector for Benton Harris PACS MSSQL.
- Author Arroyo pipelines for the 4 canonical entities used by CostForge: `Properties`, `CamaCharacteristics`, `ComparableSales`, `PropertyAssessments`.
- Author RisingWave materialized views.
- Run in SHADOW MODE alongside existing PacsCanonicalizer. Daily diff: Shadow vs Truth.
- Cut over CostForge reads once shadow-diff is <0.1% delta for 7 consecutive days.

**Phase 3 — consumer migration.**
- Decommission `PacsCanonicalizer`, `PacsToTerraFusionSyncService`, `HarrisPACSSyncBackgroundService`.
- Delete `backend/src/TerraFusion.Sync/` project and its registrations.
- Delete my bypass (`Data/Canonicalizers/PacsCanonicalizer.cs` + `CanonicalAdminController.cs`).
- Port QUARANTINE Python state-machine + conflict-resolution logic into Rust control plane where genuinely needed.

**Phase 4 — multi-county fan-out.**
- Connector Development Kit (spec 2) + conformance tests.
- Onboard counties 2–5 (staggered): Kennewick (Tyler Vision), Richland (Tyler Vision), Pasco (Aumentum), Prosser (Harris PACS).
- Document the onboarding runbook.

**Phase 5 — AI integration.**
- Anomaly-emission rules in Arroyo (ratio outliers, schema drift, unusual value ranges).
- `sync.anomaly` topic consumed by Consciousness.
- Operator CLI + approval workflow for AI flags (spec 2).

**Phase 6 — bidirectional amendment path (optional).**
- If/when a county wants TerraFusion-computed values written BACK to PACS (e.g., calibrated AV), the amendment workflow is exercised end-to-end.
- Port QUARANTINE `conflict_resolver.py` strategies into an Arroyo pipeline.
- Deploy Debezium sink connector under amended contract.

---

## 6. Data model contracts

### 6.1 Topic naming convention

```
sync.source.{vendor}.{county}.{table}        # raw CDC from legacy
sync.canonical.{entity}                        # normalized, county-tagged canonical
sync.audit                                     # every state change, hash-chained
sync.anomaly                                   # AI-swarm input stream
sync.contract                                  # contract amendment events
sync.deadletter                                # failed events, DLQ pattern
```

Partition key for all topics: `county_id` (sovereignty).

### 6.2 Canonical event shape (JSON Schema, stored in `sync.canonical.*`)

```json
{
  "event_id": "uuid-v4",
  "schema_version": "1.0",
  "event_type": "upsert|delete",
  "county_id": "uuid",
  "entity": "Property|CamaCharacteristic|ComparableSale|...",
  "source_system": "harris-pacs|tyler-vision|aumentum|...",
  "source_id": "prop_id | parcel_guid | ...",
  "occurred_at_utc": "ISO-8601 µs",
  "ingested_at_utc": "ISO-8601 µs",
  "before": { /* prior state, null for new */ },
  "after": { /* canonical shape */ },
  "provenance": {
    "debezium_offset": "...",
    "connector_name": "...",
    "transform_pipeline": "...",
    "transform_version": "1.2.0"
  },
  "audit_chain": {
    "prev_event_hash": "sha256:...",
    "this_event_hash": "sha256:..."
  }
}
```

### 6.3 Audit event shape (for `sync.audit`)

```json
{
  "audit_id": "uuid-v4",
  "event_type": "connector.deploy|policy.deny|contract.amend|sync.upsert|...",
  "occurred_at_utc": "ISO-8601 µs",
  "actor": { "identity": "...", "auth_method": "mTLS|service-account", "certificate_fingerprint": "..." },
  "county_id": "uuid | null",
  "subject": { /* what was touched */ },
  "outcome": "success|denied|failed",
  "policy_refs": [ "pacscontract.v1", "amendment-xxx" ],
  "prev_hash": "sha256:...",
  "hash": "sha256:..."
}
```

---

## 7. Out of scope for this spec

These are explicitly deferred or handled elsewhere:

- **Operator CLI (`tfsync`) + Connector Development Kit + developer docs site** — separate spec `2026-04-16-terrafusion-sync-v4-operator-surface-design.md`.
- **TerraFlow** (post-canonical workflow engine at `packages/terrabuild/`) — unchanged by this spec. Reads canonical data; downstream of the control plane.
- **Consciousness** (port 3004, AI agent orchestrator) — unchanged. This spec adds a producer relationship (`sync.anomaly` topic); no changes to the Consciousness service itself.
- **Frontend UI changes** — CostForge / SalesForge / IncomeForge continue to read from Postgres canonical tables. Zero refactor. Their reads are unchanged.
- **Harris PACS write-back** (bidirectional) — possible via the amendment path, but no county has requested it. Deferred.
- **Connectors for Tyler Vision, Aumentum, Patriot, SDS** — Phase 4+. This spec proves the pattern on Harris PACS (Benton) first.
- **Chaos engineering, disaster-recovery drills, multi-region replication** — valuable, but post-MVP.

---

## 8. Success criteria

- CostForge reads from canonical Postgres produce identical values before and after Sync v4 cutover (numerical diff <0.001 median/COD/PRD/PRB per neighborhood for 30 consecutive days).
- Debezium connector for Benton runs with <60s CDC lag for 7 consecutive days.
- `sync.audit` topic records every state change; S3 WORM store passes external auditor's chain-verification; 7-year retention policy active.
- Contract amendment end-to-end (propose → sign → ratify → activate) works for a synthetic write-back authorization.
- `backend/src/TerraFusion.Sync/` project is DELETED from the repo; build still succeeds.
- `HarrisPACSSyncBackgroundService` no-op is DELETED; replaced by Kafka Connect deployment.
- A new county's connector can be onboarded in ≤72 hours (Connector Development Kit, spec 2, makes this possible).
- `grep -rn "rand::random\(\)" packages/terra-sync` returns zero hits (no mocked metrics).
- All gRPC calls are mTLS-authenticated; unauthenticated requests rejected.
- OpenTelemetry traces span end-to-end from PACS row change to CostForge UI read.

---

## 9. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Debezium connector config drift across counties | Med | Connector Development Kit (spec 2) enforces schema; all configs in version control; `tfsync connector diff` surfaces drift. |
| RisingWave materialized views produce numerical delta vs existing PacsCanonicalizer | Med | Shadow-mode parallel run for 30 days. Automated daily diff. Cutover only after 7 consecutive days <0.1% delta. |
| Arroyo pipeline has a bug that corrupts canonical data | Low-Med | Kafka replay gives us time-travel recovery. Dead-letter topic catches malformed events. Versioned pipelines — roll back by re-deploying prior version. |
| FedRAMP observability vendor (Splunk) cost exceeds budget | Med | Dual-path: Grafana Federal is the fallback. OpenTelemetry makes vendor swap a configuration change, not a code change. |
| County legacy system uses a vendor we don't have a connector for | High (eventually) | CDK in spec 2 is built exactly for this. Community/vendor contributions possible via marketplace (Tier 3, spec 2). |
| pacscontract.v1 policy engine has a bypass bug | Med | Every TerraFusion canonical write goes through RisingWave sink (the only writer). Policy engine rejections are structured events to `sync.audit`. External auditor can verify. Treated as a critical code path with TDD + mutation testing. |
| Deleting the 7,900 LOC of dormant code breaks something unexpectedly | Low | Each deletion gated by build success + smoke test + integration test pass. Deletions shipped in small PRs with rollback plan. |
| Bidirectional write-back under amendment introduces PACS data corruption | Med (only if exercised) | Write-back confined to specific tables, specific columns per amendment. Dry-run mode required. Conflict-resolution strategy mandatory. Two-officer approval. Audit on every write. |

---

## 10. Glossary

- **CDC (Change Data Capture):** extracting inserts/updates/deletes from a source DB as they happen.
- **pacscontract.v1:** the governance spec that defines what TerraFusion is allowed to do with PACS data. Lives at `docs/spec-lock/locks/pacscontract/`.
- **Sovereign-county isolation:** each county's data is logically tenant-isolated; cross-county access requires explicit amendment.
- **Shadow mode:** new system runs alongside old, producing the same outputs; human-readable diff allows cutover only after parity proved.
- **WORM (Write-Once-Read-Many):** storage medium that physically cannot be modified or deleted after write. Used for audit retention.
- **FedRAMP-HIGH:** the highest authorization level for cloud services handling federal government data.
- **NIST 800-53:** federal catalog of security and privacy controls. AU-* family is audit logging.

---

**End of Sync v4 Control Plane spec.**
