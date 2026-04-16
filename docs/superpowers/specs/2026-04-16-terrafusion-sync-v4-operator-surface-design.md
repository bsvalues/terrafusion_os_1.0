# TerraFusion Sync v4 — Operator Surface Design Spec

**Date:** 2026-04-16
**Status:** Proposed. Ready for user review.
**Related:** `2026-04-16-terrafusion-sync-v4-control-plane-design.md` (companion spec — the control plane this CLI talks to).

---

## 1. Strategic goal

Give TerraFusion operators, compliance auditors, connector authors, and developers a **single coherent surface** for operating Sync v4. Today, answering a question like "is Kennewick's sync working?" requires reading Grafana + `kubectl logs` + psql + Splunk + the .NET API. This spec replaces that tool-context-switching with **one CLI (`tfsync`), one Connector Development Kit (CDK), one docs site, and one policy-signing workflow**.

**Principle filter applied to every tool included:** *does the platform degrade measurably without this?* Everything that fails that test was cut. Every "AI dashboard with 3D visualization" was cut. This is an honest ops surface, not a marketing surface.

**Success in one sentence:** an ops engineer can diagnose any Sync v4 incident in ≤10 minutes using `tfsync`, a connector author can onboard a new county in ≤72 hours using the CDK, and a FISMA auditor can export tamper-evident audit evidence in one command.

---

## 2. Architecture

### 2.1 Layered view

```
         ┌──────────────────────────────────────┐
         │  Humans                               │
         │  ops ops │ auditor │ connector author │ dev  │
         └──────────────┬───────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────┐
         │  tfsync CLI (Rust binary)            │
         │  gRPC client → Control Plane         │
         │  mTLS-authenticated                  │
         └──────────────┬───────────────────────┘
                        │ gRPC
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  TerraFusion Sync v4 Control Plane (spec 1)                     │
│  ─ connector registry                                            │
│  ─ pacscontract.v1 policy engine                                │
│  ─ county tenancy                                                │
│  ─ AI-swarm integration                                          │
│  ─ audit emitter                                                 │
└─────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────┐
         │  Connector Development Kit (CDK)     │
         │  terra-sync-cdk crate                │
         │  tfsync connector scaffold/test/cert │
         └──────────────┬───────────────────────┘
                        │
                        ▼
         connector binary (Debezium Kafka Connect plugin)

         ┌──────────────────────────────────────┐
         │  Tauri Operator Console              │
         │  (existing packages/terra-sync UI)   │
         │  wraps tfsync gRPC calls             │
         └──────────────────────────────────────┘

         ┌──────────────────────────────────────┐
         │  Developer Docs Site                 │
         │  Docusaurus at docs.terrafusion.os  │
         └──────────────────────────────────────┘
```

### 2.2 Components

| Component | Lang | Purpose |
|---|---|---|
| **`tfsync` CLI binary** | Rust | Single operator interface. ~30 subcommands covering day-to-day ops, audit export, lineage, contract amendments. |
| **`terra-sync-cdk` library crate** | Rust | Authoring toolkit for new connectors. Trait, conformance tests, fixtures. |
| **Connector binaries** | Rust | One per vendor (harris-pacs, tyler-vision, aumentum, patriot, sds). Package as Kafka Connect plugins. |
| **Tauri operator console** | TS + Rust | Visual UX over the same gRPC API. For humans who prefer GUI. Optional — CLI is canonical. |
| **Docusaurus docs site** | TS | Architecture + tutorials + connector authoring + audit cookbook. Hosted at `docs.terrafusion.os` (or internal equivalent). |
| **Spec-Lock v2** | N/A | Signed contract amendments stored in `docs/spec-lock/locks/pacscontract/amendments/` as YAML with X.509 or Sigstore signatures. |
| **Integration test harness** | Rust | Full-topology tests (Kafka + Debezium + Arroyo + RisingWave in CI), not mocks. |
| **SBOM + signing** | Infra | CycloneDX SBOM per release; Sigstore cosign on container images; required for FedRAMP High. |

All components live in a single Cargo workspace under `/packages/terra-sync/` with internal crates:

```
packages/terra-sync/
├── Cargo.toml                     # workspace
├── crates/
│   ├── terra-sync-cli/            # the tfsync binary
│   ├── terra-sync-control/        # control plane service (spec 1)
│   ├── terra-sync-cdk/            # connector authoring kit
│   ├── terra-sync-proto/          # gRPC .proto + generated clients/servers
│   ├── terra-sync-policy/         # pacscontract.v1 policy engine (shared)
│   └── connectors/
│       ├── harris-pacs/
│       ├── tyler-vision/
│       └── aumentum/
├── console/                       # Tauri + React frontend (existing, rewritten)
├── docs/                          # Docusaurus site source
└── tests/
    └── integration/               # full-topology tests
```

---

## 3. `tfsync` CLI — full command specification

All commands are gRPC calls. All return structured output (default human, `-o json|yaml` for automation). All state-changing commands audited to `sync.audit`. All authenticated via mTLS cert on operator's machine.

### 3.1 Tier 1 — Indispensable (ships at v4 MVP)

#### `tfsync status`
One-screen platform health. Always the first command anyone runs.

```
$ tfsync status
TerraFusion Sync v4  │  2026-04-16T14:32:07Z  │  healthy

Control Plane:      ✓  https://sync.terrafusion.os:8443   (uptime 12d 4h)
Kafka Cluster:      ✓  3 brokers, 0 under-replicated
Kafka Connect:      ✓  5 workers, 5 active connectors
RisingWave:         ✓  4 MVs, avg freshness 2.3s
PostgreSQL canonical: ✓  read replica lag 180ms

Counties (5 active):
  CDC Lag    County         Vendor         Connector         Mode
  ────────────────────────────────────────────────────────────────
  42s        Benton         harris-pacs    benton-v1        ● streaming
  1m 07s     Kennewick      tyler-vision   kennewick-v1     ● streaming
  3m 14s     Richland       tyler-vision   richland-v1      ⚠ degraded (see `tfsync alert`)
  —          Pasco          aumentum       pasco-v1         ◌ snapshot 42%
  —          Prosser        harris-pacs    prosser-v1       ◌ paused by jsmith@benton.wa.gov

Alerts: 1 warning, 0 critical
Run `tfsync alert` for details.
```

#### `tfsync connector list | get | pause | resume | replay`

```
$ tfsync connector list
NAME            COUNTY      VENDOR        STATE     CDC LAG   SNAPSHOT
benton-v1       Benton      harris-pacs   RUNNING   42s       complete
kennewick-v1    Kennewick   tyler-vision  RUNNING   1m 07s    complete
richland-v1     Richland    tyler-vision  DEGRADED  3m 14s    complete
pasco-v1        Pasco       aumentum      SNAPSHOTTING        42%
prosser-v1      Prosser     harris-pacs   PAUSED    —         complete

$ tfsync connector pause benton-v1 --reason="schema migration window 1530-1600 UTC"
✓ benton-v1 paused (audit event ev_8f2c1a...)

$ tfsync connector replay benton-v1 --from=2026-04-16T14:00:00Z --to=2026-04-16T15:00:00Z
✓ 1,842 events queued for replay (job_id repl_7fe2...)
  Monitor: tfsync job watch repl_7fe2...
```

#### `tfsync topic inspect | tail | schema | dead-letter`

```
$ tfsync topic tail sync.canonical.property --county=Benton --follow
{event_id: "..", entity: "Property", source_id: "102892110005003", after: {..}}
...

$ tfsync topic dead-letter list --county=Benton --since=24h
  5 events in sync.deadletter for Benton in 24h
  Reason: schema-mismatch=3, unknown-field=2
  Inspect: tfsync topic dead-letter get <event_id>
  Replay after fix: tfsync topic dead-letter replay <event_id>
```

#### `tfsync audit`

```
$ tfsync audit export --from 2026-01-01 --to 2026-03-31 --format syslog -o /tmp/audit-q1-2026.log
✓ 847,392 events exported (syslog RFC 5424)
  Chain integrity verified ✓
  SHA-256: 9f7a...

$ tfsync audit verify --chain --since=90d
✓ 2,341,118 events verified
  No chain breaks. No hash mismatches. No gaps.

$ tfsync audit search --parcel=102892110005003 --since=30d
2026-04-14 09:23:11Z  cdc.upsert    Property       actor=debezium/benton-v1
2026-04-14 09:23:11Z  canonical.upsert CamaCharacteristic actor=risingwave/mv_cama
2026-04-14 09:23:11Z  reader.read   CostForge      actor=cf-svc (HTTP 200)
...

$ tfsync audit tap --follow --filter=policy.deny
# live-tail of policy denials — incident response
```

#### `tfsync lineage trace`

```
$ tfsync lineage trace --parcel=102892110005003 --field=SitusCity
Parcel: 102892110005003
Field:  Properties.SitusCity = "Kennewick"

Provenance chain:
  1. SOURCE  pacs_oltp.property.situs_city        = "KENNEWICK"
     County:    Benton
     DB:        harris-pacs-db.benton.wa.gov
     As-of:     2026-04-14T09:23:11Z (µs: 894)
     Debezium offset: kafka:benton-v1/partition=0/offset=847392

  2. TRANSFORM  Arroyo pipeline "normalize-situs-city" v1.2.0
     Rule:      TRIM + TITLECASE
     Output:    "Kennewick"

  3. CANONICAL  Properties.SitusCity = "Kennewick"
     Writer:    RisingWave sink "mv_properties"
     Written:   2026-04-14T09:23:11.302Z

  4. CONSUMED  CostForge neighborhood rollup query
     Reader:    cf-svc (HTTP 200, 4 subsequent reads in last 30d)

  Audit events: ev_8f2c1a…, ev_9a3f2d…, ev_b41e7c… (3 total)
```

#### `tfsync contract validate | amend | list | ratify`

```
$ tfsync contract validate
Loading manifest: docs/spec-lock/locks/pacscontract/v1/manifest.yaml
Amendments: 3 active

✓ Benton County: read-only, all entities
✓ Kennewick County: read-only, all entities
⚠ Richland County: write-back permitted on PropertyAssessments (amendment am_3f9a2c..., expires 2027-01-01)
✗ Yakima County: amendment am_7fe2d... AWAITING RATIFICATION (signed by jsmith@benton.wa.gov only)

$ tfsync contract amend --allow-writeback=PropertyAssessments --county=Yakima --expires=2027-01-01 --signed-by=<cert>
✓ Amendment draft created: am_abc123...
  Signed by: cto@terrafusion.os
  AWAITING SECOND OFFICER RATIFICATION

$ tfsync contract ratify am_abc123 --signed-by=<cert>
✓ Amendment ratified
  Effective: 2026-04-17T00:00:00Z
  Activates: Debezium sink connector yakima-writeback-v1
```

#### `tfsync guard`

```
$ tfsync guard scan
Scanning canonical Postgres write paths...

✓ 0 direct INSERT statements found from non-sync services
✓ 0 raw SQL bypasses detected in backend/src/
✓ RisingWave sink is the only principal with write access to canonical tables

$ tfsync guard watch --live
# tails Postgres pgaudit log for any canonical-table write by a principal != risingwave-sink
# alerts immediately if one appears. This would have caught my personal bypass from the
# prior session within seconds.
```

---

### 3.2 Tier 2 — High-value force multipliers

#### `tfsync dq` — data quality
```
tfsync dq run --county=Benton --tax-year=2026                 # full 8-check suite
tfsync dq gate --block-on=critical --ci                       # exit 1 if critical
tfsync dq report --format=html > dq-report.html
```
Wraps the `CamaDataQualityService` from the prior CostForge work. Becomes a CI gate.

#### `tfsync parcel trace`
One-shot parcel debugging.
```
tfsync parcel trace 102892110005003 --last 30d
# Timeline of every source change, CDC event, transform, canonical write, and consumer read
```

#### `tfsync backfill` — historical replay + snapshot
```
tfsync backfill run --county=Benton --year=2024 --table=ComparableSales
tfsync snapshot take --county=Benton
tfsync snapshot status --county=Benton
```
For onboarding new counties and recovering from pipeline changes.

#### `tfsync anomaly` — Consciousness swarm interface
```
tfsync anomaly list --since=24h --severity=high
tfsync anomaly explain <event_id>           # prints Consciousness swarm's reasoning
tfsync anomaly approve <event_id> --note="..."
tfsync anomaly dismiss <event_id> --reason="known-issue-ABC"
```
Human-in-the-loop for AI flags. Every action audited.

#### `tfsync dev` — local development environment
```
tfsync dev up                               # docker-compose: Kafka + Debezium + RisingWave + PG
tfsync dev seed --fixture=benton-2024-small # ~1K parcel realistic fixture
tfsync dev tail benton
tfsync dev down --clean
```
New contributor boots the full Sync v4 topology in <5 minutes.

---

### 3.3 Tier 3 — deferred

`tfsync chaos`, `tfsync dr drill`, `tfsync replicate`, `tfsync usage`, `tfsync marketplace` — valuable but not at v4 MVP. Built once baseline is stable.

---

### 3.4 Output format conventions

- Default: rich human-readable (tables, color, emoji for state).
- `-o json` / `-o yaml`: machine-parseable. All CLI actions scriptable.
- `-o csv` where rows are tabular (e.g., `connector list`, `audit search`).
- `--quiet`: only exit code (for CI).
- `--follow`: live-tail mode (`status`, `audit tap`, `anomaly list`, `topic tail`).

### 3.5 Auth and identity

- mTLS client cert in `~/.terrafusion/identity.pem` (per-operator).
- Cert maps to identity principal; identity → role → authorized commands.
- Every command emits an audit event with the operator's cert fingerprint.
- Sensitive commands (connector deploy, contract amend, backfill) require a second-factor MFA token.

### 3.6 Shell completion and docs

- Zsh, Bash, Fish completions generated by `tfsync completions <shell>`.
- `tfsync <cmd> --help` always present.
- `tfsync docs` opens the docs site in a browser to the relevant page.

---

## 4. Connector Development Kit (CDK)

### 4.1 Purpose

A new county brings their legacy vendor. Writing the connector from scratch today takes weeks. With the CDK, it takes 2–3 days:

1. `tfsync connector scaffold --vendor=sds --county=cowlitz`
2. Fill in 3 trait methods (extract, transform, map-to-canonical).
3. `tfsync connector test --fixture=synthetic-cowlitz`
4. `tfsync connector certify` → runs the contract conformance suite.
5. `tfsync connector deploy` (requires contract amendment + two-officer sign-off).

### 4.2 CDK trait surface

```rust
#[async_trait]
pub trait LegacyConnector: Send + Sync + 'static {
    /// Required: metadata describing the vendor + supported modes.
    fn metadata(&self) -> ConnectorMetadata;

    /// Required: validate connection + schema contract.
    async fn validate(&self, config: &ConnectorConfig) -> Result<ContractProof>;

    /// Required: emit canonical events from source changes.
    /// Implementations typically wrap a Debezium connector + an optional
    /// pre-processing stage.
    async fn stream_changes(&self, config: &ConnectorConfig, sink: EventSink) -> Result<()>;

    /// Optional: initial snapshot capture (default: delegates to Debezium).
    async fn snapshot(&self, config: &ConnectorConfig, sink: EventSink) -> Result<()> {
        self.stream_changes(config, sink).await
    }

    /// Optional: write-back path. Default: unimplemented (contract amendment required).
    async fn write_back(&self, _: WriteBackRequest) -> Result<()> {
        Err(Error::WriteBackNotPermitted)
    }
}
```

### 4.3 Conformance test suite

Every connector MUST pass:

- **pacscontract.v1 conformance:** read-only by default, rejects writes without amendment.
- **Schema conformance:** produces canonical events matching `sync.canonical.*` JSON Schema.
- **Tenant isolation:** every emitted event carries the correct `county_id`.
- **Audit emission:** every action produces a `sync.audit` event with hash-chain continuity.
- **Replay safety:** replaying the same CDC offset produces the same canonical output (idempotent).
- **Dead-letter behavior:** malformed source rows are routed to DLQ, not dropped.
- **Back-pressure:** connector pauses when downstream Kafka topic reports lag > threshold.

Conformance is `tfsync connector certify`. A connector that fails cannot be deployed.

### 4.4 Starter connectors

| Vendor | Counties using | Priority |
|---|---|---|
| Harris PACS | Benton, Prosser | **Phase 2 MVP** |
| Tyler Vision | Kennewick, Richland | Phase 4 |
| Aumentum | Pasco | Phase 4 |
| Patriot PACS | Pierce | Phase 5 |
| SDS Inc | Yakima | Phase 5 |

Community/vendor contributions welcome via the marketplace (Tier 3 deferred).

---

## 5. Tauri Operator Console

The existing `packages/terra-sync/` frontend (React + Tauri) stays, but its backend gets replaced. It becomes the **GUI over the same `tfsync` gRPC API** — for humans who prefer clicking to typing.

**Scope:**
- Status dashboard (same data as `tfsync status`, visual).
- Connector list with pause/resume/replay buttons.
- Live topic tail with filter UI.
- Contract amendment workflow with diff viewer and signing UI.
- Audit search + export.
- Anomaly review queue with approve/dismiss.
- Lineage graph visualization.

**Non-goal:** a second source of truth. Every button calls a `tfsync` gRPC verb. If it's not in the CLI, it's not in the console.

**Why keep it:** Tauri's sweet spot is exactly this — a single-binary cross-platform GUI that wraps a service. Non-CLI-comfortable assessors and compliance officers benefit.

---

## 6. Spec-Lock v2 — signed contract amendments

Current state: `docs/spec-lock/locks/pacscontract/pacscontract.v1/` contains docs. Intent is enforced by convention.

v2 upgrades this to **executable policy**:

### 6.1 Structure

```
docs/spec-lock/locks/pacscontract/
├── v1/
│   ├── manifest.yaml                    # the base contract
│   ├── manifest.yaml.sig                # first-officer signature
│   ├── manifest.yaml.cosign.bundle      # Sigstore transparency log
│   └── amendments/
│       ├── am_abc123.yaml               # amendment doc
│       ├── am_abc123.yaml.sig.1         # first-officer signature
│       ├── am_abc123.yaml.sig.2         # second-officer ratification
│       └── am_abc123.yaml.cosign.bundle
```

### 6.2 Amendment lifecycle

1. **Draft:** `tfsync contract amend ...` creates a YAML amendment + first signature.
2. **Review:** amendment YAML is human-readable; reviewers can inspect via `tfsync contract show am_...`.
3. **Ratify:** `tfsync contract ratify am_...` adds the second signature (must be a distinct cert).
4. **Activate:** control plane reloads the policy manifest; the amendment takes effect.
5. **Revoke:** `tfsync contract revoke am_...` — requires the same two-officer rule.

### 6.3 Cryptographic guarantees

- X.509 certs rooted in the TerraFusion internal CA, OR Sigstore keyless (preferred for public auditability).
- Every signature entry includes: signer identity, timestamp, SHA-256 of document, signature bytes.
- Control plane verifies signatures on every policy manifest load. Mismatch = refuse to operate.

---

## 7. Developer docs site

Docusaurus site at `docs.terrafusion.os` (or internal equivalent). Replaces the existing scattered `.md` files in the repo with an organized, searchable, versioned site.

### 7.1 Structure

```
docs/
├── Introduction
│   ├── What is TerraFusion Sync v4
│   └── Architecture (with the Mermaid diagram from spec 1)
├── Operating
│   ├── Daily operations
│   ├── Alert response runbooks
│   ├── Onboarding a new county (72-hour protocol)
│   └── Contract amendment workflow
├── Developing Connectors
│   ├── CDK quick-start
│   ├── Trait reference
│   ├── Conformance tests
│   └── Vendor guides (Harris PACS, Tyler Vision, Aumentum, ...)
├── Auditing and Compliance
│   ├── NIST 800-53 control mapping
│   ├── Audit export cookbook
│   └── Sample audit queries
├── CLI Reference (auto-generated from tfsync --help output)
├── Architecture Decision Records
└── Changelog (per-release notes)
```

### 7.2 Must-have properties

- Versioned: docs for v4.0 are frozen when v4.1 ships.
- Searchable: Algolia or MeiliSearch index.
- Linkable: every section has a stable anchor URL.
- Runnable: code examples are tested in CI against the actual binaries.

---

## 8. Integration test harness

Current state: .NET integration tests use in-memory mocks. That's not enough for a distributed CDC pipeline.

New pattern: **full-topology tests** spin up real infrastructure.

```
tests/integration/
├── harness/                        # spins up Kafka+Connect+Debezium+RisingWave in testcontainers-rs
├── scenarios/
│   ├── basic-cdc.rs                # update in fake MSSQL → canonical event
│   ├── schema-evolution.rs
│   ├── contract-enforcement.rs     # policy denies an unauthorized subscribe
│   ├── bidirectional-amendment.rs  # amendment unlocks a sink
│   ├── audit-chain-integrity.rs    # crash + restart → chain still valid
│   └── county-onboarding.rs        # full 72-hour onboarding rehearsed
└── fixtures/
    ├── synthetic-benton/           # deterministic fixture for Benton
    └── synthetic-multi-county/
```

Runs in CI. Each scenario ≤5 minutes. Total suite ≤30 minutes.

---

## 9. SBOM and supply chain integrity

Required for FedRAMP High. Not optional.

- Every Rust crate build emits a CycloneDX SBOM.
- Container images signed with Sigstore `cosign`.
- SLSA level 3 provenance via GitHub's reusable workflows.
- Daily Trivy scan of deployed container images with results published to `sync.audit` (yes, scan results themselves are audit events).

---

## 10. Migration from current state

### 10.1 What gets kept and evolved

| Current artifact | Evolution |
|---|---|
| `packages/terra-sync/` frontend (React + Tauri shell) | Kept. Becomes the Operator Console (§5). Rust backend replaced per spec 1. |
| `packages/terra-sync/src-tauri/Cargo.toml` workspace | Kept. Crates added per §2.2 layout. |
| `docs/spec-lock/locks/pacscontract/v1/` | Upgraded to signed manifest + amendments structure (§6). |

### 10.2 What gets added

| New artifact | Purpose |
|---|---|
| `crates/terra-sync-cli/` | The `tfsync` binary |
| `crates/terra-sync-cdk/` | Connector authoring kit |
| `crates/terra-sync-proto/` | gRPC .proto + generated clients |
| `crates/terra-sync-policy/` | Shared policy engine (used by control plane + CLI) |
| `crates/connectors/harris-pacs/` | First reference connector |
| `docs/docusaurus/` | Developer docs site source |
| `tests/integration/` | Full-topology harness |
| `.github/workflows/release.yml` | SBOM, Sigstore, SLSA provenance |

### 10.3 Phased rollout

**Phase 1 — CLI MVP (parallel with control plane phase 1).**
- `tfsync status`, `tfsync connector list/pause/resume`, `tfsync audit export`, `tfsync guard scan`.
- Minimal gRPC proto + client generation.

**Phase 2 — Contract + Lineage + Dead-Letter.**
- `tfsync contract validate/amend/ratify`.
- `tfsync lineage trace`.
- `tfsync topic dead-letter list/get/replay`.
- Spec-Lock v2 signed manifests live.

**Phase 3 — CDK + first community connector.**
- `tfsync connector scaffold/test/certify`.
- Harris PACS reference connector refactored to use CDK.
- Developer docs site published.

**Phase 4 — Tier 2 tools.**
- `tfsync dq`, `tfsync parcel trace`, `tfsync backfill`, `tfsync anomaly`, `tfsync dev`.
- Tauri operator console rewritten against new gRPC.

**Phase 5 — SBOM + SLSA + FedRAMP observability hookup.**

**Phase 6 — Tier 3 (chaos, DR, replicate, usage, marketplace) as demand warrants.**

---

## 11. Success criteria

- An operator with no prior Sync v4 experience can run `tfsync status` and correctly interpret the output within 30 seconds.
- A FISMA auditor can produce a tamper-evident audit export for a 3-month window with one command.
- A new connector (e.g., Tyler Vision for Kennewick) is scaffolded, tested, certified, and deployed within 72 hours.
- Every state-changing CLI command is audited. `tfsync audit search --actor=<your-cert-fp>` shows exactly what you did today.
- `tfsync guard scan` returns zero bypasses (i.e., the raw-SQL canonical-write pattern that I personally introduced is gated and impossible to reintroduce).
- The Tauri operator console is a GUI over the same gRPC API — zero second-source-of-truth.
- Docs site has stable URLs for every section, version-frozen per release.
- Integration test suite runs full topology (no mocks) and completes in ≤30 minutes.
- SBOM produced per release; container images cosign-signed; SLSA level 3 provenance.

---

## 12. Out of scope for this spec

- **Control plane service itself** — in spec 1.
- **Debezium / Kafka / Arroyo / RisingWave deployment** — standard OSS; spec 1 covers the overall architecture; actual infra-as-code lives in a deployment repo.
- **TerraFusion-wide CLI patterns** — this spec defines `tfsync`; other tools (`tfforge`, `tfaudit`, etc.) if they exist are separate.
- **Specific AI models used by Consciousness for anomaly review** — Consciousness service owns that.
- **Frontend-UI redesign for CostForge/SalesForge** — unchanged by this spec.

---

## 13. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| CLI surface sprawls to 80 commands, nobody can learn it | Med | Strict tier discipline; Tier 3 deferred until proven necessary; every added command justified against the "degrades without this" filter. |
| Signed-contract workflow is too heavy; operators bypass it | Low | Signing is a 30-second step (`tfsync contract ratify` with a YubiKey or Sigstore device flow). Bypasses are impossible — the policy engine rejects unsigned amendments. |
| Tauri console diverges from CLI | Med | Rule: console has no logic of its own. Every action = gRPC call. Contract enforced in PR review + integration test. |
| Connector authors build poor-quality connectors | High (at scale) | CDK conformance tests are MANDATORY before deploy. Community contributions require both conformance pass and human review. |
| Docs site rots, operators rely on stale info | Med | Every command's `--help` is auto-extracted into docs on release. Versioned docs; old versions frozen, not deleted. |
| Integration test topology takes too long in CI | Low-Med | Testcontainers-rs with pre-warmed Kafka image; parallel scenarios; ≤30 minutes target. |
| Operator CLI breaks automation when output format changes | Low | `-o json` output is governed by a stable schema; breaking changes require major version bump (`tfsync v4 → v5`). |

---

## 14. Glossary

- **CDK (Connector Development Kit):** the Rust trait + test harness + scaffold tool for authoring a new legacy-system connector.
- **Spec-Lock:** TerraFusion's practice of storing immutable, signed specifications in `docs/spec-lock/` as governance artifacts.
- **Conformance test:** deterministic suite a connector MUST pass before deployment.
- **Shadow mode:** new pipeline runs alongside old; diffs surface before cutover.
- **Dead-letter queue (DLQ):** Kafka topic receiving malformed or failed events for human review rather than silent drop.
- **Sovereign-county isolation:** each county's data is tenant-isolated at every layer.
- **Two-officer rule:** every contract amendment requires signatures from two distinct authorized officers (no self-ratification).

---

**End of Sync v4 Operator Surface spec.**
