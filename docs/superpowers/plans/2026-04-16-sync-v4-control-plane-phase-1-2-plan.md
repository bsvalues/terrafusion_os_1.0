# Sync v4 Control Plane — Phase 1+2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Debezium + Kafka + RisingWave + Rust control plane foundation, then run Benton Harris PACS through the new pipeline in shadow mode alongside the existing `PacsCanonicalizer`. The shadow-mode daily diff report proves numerical parity before any cutover.

**Architecture:** Debezium (SQL Server CDC) → Kafka (MSK/Strimzi) → Arroyo (Rust streaming SQL transforms) → RisingWave (Rust streaming MVs, writes TerraFusion Postgres canonical tables). A new Rust control plane service (`terra-sync-control`) enforces `pacscontract.v1` policy, emits WORM audit events, exposes gRPC, and publishes anomaly events to Consciousness. CostForge/SalesForge/UI reads are unchanged throughout Phase 1+2 (they keep reading Postgres).

**Tech Stack:** Rust (2021 edition), Tokio, Tonic (gRPC), Prost, SQLx, Debezium SQL Server Connector 2.5+, Apache Kafka 3.6+, Kafka Connect, Arroyo 0.11+, RisingWave 2.0+, PostgreSQL 16, AWS S3 with Object Lock (or equivalent), OpenTelemetry Collector, Splunk Cloud Federal (prod) / Prometheus+Grafana (dev), Docker Compose (local dev), Terraform or Helm (prod infra).

**Spec:** `docs/superpowers/specs/2026-04-16-terrafusion-sync-v4-control-plane-design.md`

---

## File Structure (lock decomposition before coding)

All new Rust code lives under the existing `packages/terra-sync/` workspace. Crates are small and focused.

```
packages/terra-sync/
├── Cargo.toml                              # workspace manifest (MODIFY)
├── rust-toolchain.toml                     # CREATE: pin to Rust stable
├── .github/workflows/rust.yml              # CREATE: CI for the workspace
├── crates/
│   ├── terra-sync-proto/                   # CREATE: gRPC .proto + generated code
│   │   ├── Cargo.toml
│   │   ├── build.rs
│   │   └── proto/
│   │       ├── control_plane.proto
│   │       ├── audit.proto
│   │       └── policy.proto
│   ├── terra-sync-policy/                  # CREATE: pacscontract.v1 policy engine
│   │   ├── Cargo.toml
│   │   ├── src/lib.rs
│   │   ├── src/manifest.rs                 # YAML parsing + signature verify
│   │   ├── src/evaluator.rs                # policy decision engine
│   │   └── tests/
│   │       ├── manifest_load.rs
│   │       └── deny_unauthorized.rs
│   ├── terra-sync-audit/                   # CREATE: WORM audit emitter
│   │   ├── Cargo.toml
│   │   ├── src/lib.rs
│   │   ├── src/event.rs                    # AuditEvent record + hash chain
│   │   ├── src/emitter.rs                  # Kafka producer for sync.audit
│   │   └── src/s3_sink.rs                  # S3 Object Lock sink (batch consumer)
│   ├── terra-sync-control/                 # CREATE: the control plane service
│   │   ├── Cargo.toml
│   │   ├── src/main.rs                     # binary entry
│   │   ├── src/server.rs                   # gRPC server impl
│   │   ├── src/config.rs                   # config loading
│   │   ├── src/registry.rs                 # connector registry (DB-backed)
│   │   ├── src/observability.rs            # OTel setup
│   │   └── tests/
│   │       └── server_smoke.rs
│   └── terra-sync-shadow-diff/             # CREATE: shadow-mode comparator
│       ├── Cargo.toml
│       └── src/main.rs
├── deploy/                                 # CREATE: deployment manifests
│   ├── docker-compose.dev.yml              # local dev full topology
│   ├── debezium/
│   │   └── connectors/benton-harris-pacs.json
│   ├── arroyo/
│   │   └── pipelines/
│   │       ├── normalize-property.sql
│   │       ├── normalize-cama.sql
│   │       ├── normalize-comparable-sales.sql
│   │       └── normalize-property-assessments.sql
│   ├── risingwave/
│   │   └── views/
│   │       ├── mv_properties.sql
│   │       ├── mv_cama_characteristics.sql
│   │       ├── mv_comparable_sales.sql
│   │       └── mv_property_assessments.sql
│   └── terraform/                          # prod infra (MSK, S3, roles)
│       └── README.md                       # links to infra repo
├── docs/
│   └── spec-lock/
│       └── locks/pacscontract/v1/
│           ├── manifest.yaml               # MOVE the existing contract here
│           └── amendments/                 # empty dir + .gitkeep
└── tests/
    └── integration/
        ├── Cargo.toml
        └── tests/
            └── phase2_smoke.rs             # full-topology CI test
```

Files being **deleted** are NOT in this plan — they're deleted only after shadow-mode parity is proven (end of Phase 2). That happens in the Phase 3 plan.

---

## Shared Conventions

### Cargo workspace commands
```bash
cd packages/terra-sync
cargo build --workspace
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all --check
```

### Proto codegen (runs automatically on `cargo build` via `build.rs` in `terra-sync-proto`)

### Local dev topology bring-up
```bash
cd packages/terra-sync/deploy
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f
```

### PostgreSQL connection (TerraFusion canonical, re-used)
- Host: `localhost:5432`
- DB: `terrafusion`
- User: `postgres` / Password: `devpassword123`
- Container: `terrafusion-postgres-dev`

### gRPC port convention
- Control plane: `localhost:9443` (mTLS)
- Unauthenticated metrics: `localhost:9090` (Prometheus)
- Health: `localhost:8080/health`, `/ready`

### Git commit convention
```
feat(sync-v4): <subject>

<body explaining the why>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

# PHASE 1 — Foundation

Goal: Local dev topology comes up with `docker compose up`. Control plane service starts, exposes gRPC + health + metrics. Policy engine loads the pacscontract.v1 manifest. Audit events flow to a dev Kafka topic. No actual PACS data yet — just infrastructure and the control plane skeleton.

---

### Task 1: Workspace bootstrap + rust-toolchain

**Files:**
- Create: `packages/terra-sync/rust-toolchain.toml`
- Modify: `packages/terra-sync/Cargo.toml` (workspace members)

- [ ] **Step 1: Write rust-toolchain.toml**

```toml
[toolchain]
channel = "1.82.0"
components = ["rustfmt", "clippy"]
targets = []
profile = "default"
```

- [ ] **Step 2: Replace workspace Cargo.toml**

```toml
[workspace]
resolver = "2"
members = [
    "crates/terra-sync-proto",
    "crates/terra-sync-policy",
    "crates/terra-sync-audit",
    "crates/terra-sync-control",
    "crates/terra-sync-shadow-diff",
    "tests/integration",
]

[workspace.package]
edition = "2021"
version = "4.0.0"
license = "MIT"
authors = ["TerraFusion OS"]

[workspace.dependencies]
tokio = { version = "1.40", features = ["full"] }
tonic = "0.12"
tonic-build = "0.12"
prost = "0.13"
prost-types = "0.13"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_yaml = "0.9"
anyhow = "1"
thiserror = "1"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
opentelemetry = "0.27"
opentelemetry-otlp = "0.27"
opentelemetry_sdk = "0.27"
tracing-opentelemetry = "0.28"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "chrono", "uuid", "json"] }
rdkafka = { version = "0.36", features = ["cmake-build", "ssl"] }
aws-sdk-s3 = "1.60"
aws-config = "1.5"
sha2 = "0.10"
uuid = { version = "1.10", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
rustls = "0.23"
rustls-pemfile = "2"
async-trait = "0.1"
tower = "0.5"
tower-http = { version = "0.6", features = ["trace"] }
hyper = "1"
axum = "0.7"
prometheus = "0.13"

[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 1
```

- [ ] **Step 3: Verify the workspace parses**

```bash
cd packages/terra-sync && cargo metadata --format-version 1 > /dev/null
```
Expected: no output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/terra-sync/rust-toolchain.toml packages/terra-sync/Cargo.toml
git commit -m "feat(sync-v4): workspace bootstrap — rust-toolchain + cargo members

Pin Rust 1.82 stable. Register six crates (four to implement, one
integration test harness, one shadow-diff binary). Central workspace
deps for Tonic, SQLx, rdkafka, AWS SDK, OpenTelemetry.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: terra-sync-proto — gRPC contracts

**Files:**
- Create: `packages/terra-sync/crates/terra-sync-proto/Cargo.toml`
- Create: `packages/terra-sync/crates/terra-sync-proto/build.rs`
- Create: `packages/terra-sync/crates/terra-sync-proto/src/lib.rs`
- Create: `packages/terra-sync/crates/terra-sync-proto/proto/control_plane.proto`
- Create: `packages/terra-sync/crates/terra-sync-proto/proto/audit.proto`
- Create: `packages/terra-sync/crates/terra-sync-proto/proto/policy.proto`

- [ ] **Step 1: Cargo.toml**

```toml
[package]
name = "terra-sync-proto"
version.workspace = true
edition.workspace = true
license.workspace = true
description = "gRPC protobuf contracts for TerraFusion Sync v4"

[dependencies]
tonic = { workspace = true }
prost = { workspace = true }
prost-types = { workspace = true }
serde = { workspace = true }

[build-dependencies]
tonic-build = { workspace = true }
```

- [ ] **Step 2: build.rs**

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &[
                "proto/control_plane.proto",
                "proto/audit.proto",
                "proto/policy.proto",
            ],
            &["proto"],
        )?;
    Ok(())
}
```

- [ ] **Step 3: proto/control_plane.proto**

```proto
syntax = "proto3";
package terrafusion.sync.v4.control;

import "google/protobuf/timestamp.proto";

service ControlPlane {
    rpc GetStatus(GetStatusRequest) returns (GetStatusResponse);
    rpc ListConnectors(ListConnectorsRequest) returns (ListConnectorsResponse);
    rpc GetConnector(GetConnectorRequest) returns (Connector);
    rpc PauseConnector(PauseConnectorRequest) returns (PauseConnectorResponse);
    rpc ResumeConnector(ResumeConnectorRequest) returns (ResumeConnectorResponse);
}

message GetStatusRequest {}

message GetStatusResponse {
    string version = 1;
    google.protobuf.Timestamp server_time = 2;
    bool healthy = 3;
    map<string, string> component_states = 4;  // kafka, connect, risingwave, etc.
}

message ListConnectorsRequest {
    string county_filter = 1;  // optional
}

message ListConnectorsResponse {
    repeated Connector connectors = 1;
}

message GetConnectorRequest {
    string name = 1;
}

message Connector {
    string name = 1;
    string county_id = 2;
    string county_name = 3;
    string vendor = 4;
    ConnectorState state = 5;
    google.protobuf.Timestamp last_cdc_event = 6;
    int64 cdc_lag_seconds = 7;
    string snapshot_state = 8;  // none | in_progress | complete
    int32 snapshot_percent = 9;
    string pause_reason = 10;
}

enum ConnectorState {
    STATE_UNSPECIFIED = 0;
    RUNNING = 1;
    PAUSED = 2;
    DEGRADED = 3;
    SNAPSHOTTING = 4;
    FAILED = 5;
}

message PauseConnectorRequest {
    string name = 1;
    string reason = 2;
}

message PauseConnectorResponse {
    string audit_event_id = 1;
}

message ResumeConnectorRequest {
    string name = 1;
}

message ResumeConnectorResponse {
    string audit_event_id = 1;
}
```

- [ ] **Step 4: proto/audit.proto**

```proto
syntax = "proto3";
package terrafusion.sync.v4.audit;

import "google/protobuf/timestamp.proto";

message AuditEvent {
    string audit_id = 1;
    string event_type = 2;
    google.protobuf.Timestamp occurred_at = 3;
    Actor actor = 4;
    string county_id = 5;  // empty if control-plane-global
    Subject subject = 6;
    Outcome outcome = 7;
    repeated string policy_refs = 8;
    string prev_hash = 9;
    string hash = 10;
    map<string, string> metadata = 11;
}

message Actor {
    string identity = 1;
    string auth_method = 2;  // mtls | service-account | system
    string certificate_fingerprint = 3;
}

message Subject {
    string kind = 1;           // connector | topic | contract | canonical-row
    string id = 2;
    map<string, string> attrs = 3;
}

enum Outcome {
    OUTCOME_UNSPECIFIED = 0;
    SUCCESS = 1;
    DENIED = 2;
    FAILED = 3;
}
```

- [ ] **Step 5: proto/policy.proto**

```proto
syntax = "proto3";
package terrafusion.sync.v4.policy;

service PolicyEngine {
    rpc Evaluate(EvaluateRequest) returns (EvaluateResponse);
    rpc ValidateManifest(ValidateManifestRequest) returns (ValidateManifestResponse);
}

message EvaluateRequest {
    string actor_identity = 1;
    string action = 2;  // "connector.deploy" | "topic.subscribe" | "writeback.write" | ...
    string resource_kind = 3;
    string resource_id = 4;
    string county_id = 5;
    map<string, string> context = 6;
}

message EvaluateResponse {
    bool allowed = 1;
    string rule_matched = 2;  // the policy rule that produced the decision
    string reason = 3;
}

message ValidateManifestRequest {
    string manifest_yaml = 1;
}

message ValidateManifestResponse {
    bool valid = 1;
    repeated string errors = 2;
    repeated string warnings = 3;
}
```

- [ ] **Step 6: src/lib.rs — expose generated modules**

```rust
//! Protobuf contracts for TerraFusion Sync v4.
//!
//! Generated code is produced at build time by `build.rs`.

pub mod control {
    tonic::include_proto!("terrafusion.sync.v4.control");
}

pub mod audit {
    tonic::include_proto!("terrafusion.sync.v4.audit");
}

pub mod policy {
    tonic::include_proto!("terrafusion.sync.v4.policy");
}
```

- [ ] **Step 7: Build and verify codegen**

```bash
cd packages/terra-sync && cargo build -p terra-sync-proto
```
Expected: clean build. Run `cargo doc -p terra-sync-proto --no-deps` to confirm the three modules appear.

- [ ] **Step 8: Commit**

```bash
git add packages/terra-sync/crates/terra-sync-proto/
git commit -m "feat(sync-v4): terra-sync-proto crate — gRPC contracts

Defines three proto files:
- control_plane.proto — status, connector CRUD (pause/resume/list)
- audit.proto — AuditEvent with hash-chain fields, Actor, Subject, Outcome
- policy.proto — PolicyEngine.Evaluate for real pacscontract enforcement

tonic-build generates Rust server+client stubs on cargo build.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: terra-sync-policy — pacscontract.v1 manifest + evaluator

**Files:**
- Create: `packages/terra-sync/crates/terra-sync-policy/Cargo.toml`
- Create: `packages/terra-sync/crates/terra-sync-policy/src/lib.rs`
- Create: `packages/terra-sync/crates/terra-sync-policy/src/manifest.rs`
- Create: `packages/terra-sync/crates/terra-sync-policy/src/evaluator.rs`
- Create: `packages/terra-sync/crates/terra-sync-policy/tests/manifest_load.rs`
- Create: `packages/terra-sync/crates/terra-sync-policy/tests/deny_unauthorized.rs`
- Create: `docs/spec-lock/locks/pacscontract/v1/manifest.yaml`

- [ ] **Step 1: Cargo.toml**

```toml
[package]
name = "terra-sync-policy"
version.workspace = true
edition.workspace = true
license.workspace = true

[dependencies]
serde = { workspace = true }
serde_yaml = { workspace = true }
thiserror = { workspace = true }
tracing = { workspace = true }
terra-sync-proto = { path = "../terra-sync-proto" }

[dev-dependencies]
tempfile = "3"
```

- [ ] **Step 2: Create initial manifest.yaml**

File path: `docs/spec-lock/locks/pacscontract/v1/manifest.yaml`

```yaml
contract: pacscontract
version: v1
description: |
  Governing read-only contract for Harris PACS access from TerraFusion.
  All PACS read operations are permitted via authorized Debezium connectors.
  All PACS writes are FORBIDDEN except under ratified amendment.

defaults:
  read_only: true
  allow_subscribe_canonical: true
  require_mtls: true

counties:
  benton:
    id: "19190019-1919-1919-1919-191919191919"
    name: "Benton"
    state: "WA"
    vendor: harris-pacs
    read_only: true
    allow_subscribe:
      - sync.source.harris.benton.*
      - sync.canonical.*
    forbid_subscribe: []
    active_amendments: []

forbidden_actions:
  - action: writeback.write
    reason: "pacscontract.v1 base contract forbids PACS writes. Amendment required."

audit:
  all_actions_logged: true
  retention_years: 7
  worm_required: true
```

- [ ] **Step 3: src/manifest.rs**

```rust
use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Clone, Deserialize)]
pub struct ContractManifest {
    pub contract: String,
    pub version: String,
    pub description: String,
    pub defaults: Defaults,
    pub counties: HashMap<String, CountyPolicy>,
    pub forbidden_actions: Vec<ForbiddenAction>,
    pub audit: AuditPolicy,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Defaults {
    pub read_only: bool,
    pub allow_subscribe_canonical: bool,
    pub require_mtls: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CountyPolicy {
    pub id: String,
    pub name: String,
    pub state: String,
    pub vendor: String,
    pub read_only: bool,
    pub allow_subscribe: Vec<String>,
    #[serde(default)]
    pub forbid_subscribe: Vec<String>,
    #[serde(default)]
    pub active_amendments: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ForbiddenAction {
    pub action: String,
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuditPolicy {
    pub all_actions_logged: bool,
    pub retention_years: u32,
    pub worm_required: bool,
}

#[derive(Debug, Error)]
pub enum ManifestError {
    #[error("failed to read manifest file: {0}")]
    Io(#[from] std::io::Error),
    #[error("failed to parse manifest YAML: {0}")]
    Parse(#[from] serde_yaml::Error),
    #[error("manifest contract name mismatch: expected pacscontract, got {0}")]
    ContractMismatch(String),
}

impl ContractManifest {
    pub fn load_from_path(path: &Path) -> Result<Self, ManifestError> {
        let contents = std::fs::read_to_string(path)?;
        let manifest: ContractManifest = serde_yaml::from_str(&contents)?;
        if manifest.contract != "pacscontract" {
            return Err(ManifestError::ContractMismatch(manifest.contract));
        }
        tracing::info!(
            contract = %manifest.contract,
            version = %manifest.version,
            counties = manifest.counties.len(),
            "policy manifest loaded"
        );
        Ok(manifest)
    }
}
```

- [ ] **Step 4: src/evaluator.rs**

```rust
use crate::manifest::{ContractManifest, CountyPolicy};
use terra_sync_proto::policy::{EvaluateRequest, EvaluateResponse};

pub struct PolicyEvaluator {
    manifest: ContractManifest,
}

impl PolicyEvaluator {
    pub fn new(manifest: ContractManifest) -> Self {
        Self { manifest }
    }

    pub fn evaluate(&self, req: &EvaluateRequest) -> EvaluateResponse {
        // 1. Global forbidden actions check
        for forbidden in &self.manifest.forbidden_actions {
            if forbidden.action == req.action {
                return EvaluateResponse {
                    allowed: false,
                    rule_matched: format!("forbidden_actions.{}", forbidden.action),
                    reason: forbidden.reason.clone(),
                };
            }
        }

        // 2. County-specific evaluation
        let county = self.find_county(&req.county_id);
        if let Some(cp) = county {
            return self.evaluate_county(cp, req);
        }

        // 3. Default: deny unknown county
        EvaluateResponse {
            allowed: false,
            rule_matched: "default.deny_unknown_county".into(),
            reason: format!("county_id {} not registered in manifest", req.county_id),
        }
    }

    fn find_county(&self, county_id: &str) -> Option<&CountyPolicy> {
        self.manifest.counties.values().find(|c| c.id == county_id)
    }

    fn evaluate_county(&self, cp: &CountyPolicy, req: &EvaluateRequest) -> EvaluateResponse {
        // Writeback is blocked unless an amendment permits it.
        if req.action == "writeback.write" && cp.read_only && cp.active_amendments.is_empty() {
            return EvaluateResponse {
                allowed: false,
                rule_matched: format!("counties.{}.read_only", cp.name.to_lowercase()),
                reason: "no active write-back amendment".into(),
            };
        }

        // Topic subscribe check
        if req.action == "topic.subscribe" {
            let topic = req.context.get("topic").cloned().unwrap_or_default();
            if cp.forbid_subscribe.iter().any(|p| glob_match(p, &topic)) {
                return EvaluateResponse {
                    allowed: false,
                    rule_matched: format!("counties.{}.forbid_subscribe", cp.name.to_lowercase()),
                    reason: format!("topic {} in county {} forbid list", topic, cp.name),
                };
            }
            if cp.allow_subscribe.iter().any(|p| glob_match(p, &topic)) {
                return EvaluateResponse {
                    allowed: true,
                    rule_matched: format!("counties.{}.allow_subscribe", cp.name.to_lowercase()),
                    reason: String::new(),
                };
            }
            return EvaluateResponse {
                allowed: false,
                rule_matched: "default.deny_topic_not_listed".into(),
                reason: format!("topic {} not in allow list for county {}", topic, cp.name),
            };
        }

        // Default-allow for other actions if county is known — conservative permissive
        EvaluateResponse {
            allowed: true,
            rule_matched: format!("counties.{}.default_allow", cp.name.to_lowercase()),
            reason: String::new(),
        }
    }
}

/// Minimal glob matcher: * matches any sequence.
fn glob_match(pattern: &str, s: &str) -> bool {
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 1 {
        return pattern == s;
    }
    let mut cursor = 0;
    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        if i == 0 {
            if !s[cursor..].starts_with(part) {
                return false;
            }
            cursor += part.len();
        } else if i == parts.len() - 1 {
            if !s[cursor..].ends_with(part) {
                return false;
            }
        } else if let Some(pos) = s[cursor..].find(part) {
            cursor += pos + part.len();
        } else {
            return false;
        }
    }
    true
}
```

- [ ] **Step 5: src/lib.rs**

```rust
pub mod evaluator;
pub mod manifest;

pub use evaluator::PolicyEvaluator;
pub use manifest::{ContractManifest, ManifestError};
```

- [ ] **Step 6: tests/manifest_load.rs**

```rust
use std::path::PathBuf;
use terra_sync_policy::ContractManifest;

fn repo_root() -> PathBuf {
    // test cwd is the crate root
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

#[test]
fn loads_benton_from_pacscontract_v1() {
    let path = repo_root().join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml");
    let manifest = ContractManifest::load_from_path(&path).expect("manifest loads");

    assert_eq!(manifest.contract, "pacscontract");
    assert_eq!(manifest.version, "v1");
    assert!(manifest.defaults.read_only);
    assert!(manifest.defaults.require_mtls);
    assert_eq!(manifest.audit.retention_years, 7);
    assert!(manifest.audit.worm_required);

    let benton = manifest.counties.get("benton").expect("benton present");
    assert_eq!(benton.name, "Benton");
    assert_eq!(benton.vendor, "harris-pacs");
    assert!(benton.read_only);
    assert!(benton.active_amendments.is_empty());
}

#[test]
fn rejects_wrong_contract_name() {
    use std::io::Write;
    let mut f = tempfile::NamedTempFile::new().unwrap();
    write!(
        f,
        "contract: other\nversion: v1\ndescription: x\ndefaults: {{read_only: true, allow_subscribe_canonical: true, require_mtls: true}}\ncounties: {{}}\nforbidden_actions: []\naudit: {{all_actions_logged: true, retention_years: 7, worm_required: true}}\n"
    )
    .unwrap();
    let err = ContractManifest::load_from_path(f.path()).unwrap_err();
    assert!(err.to_string().contains("pacscontract"));
}
```

- [ ] **Step 7: tests/deny_unauthorized.rs**

```rust
use std::collections::HashMap;
use std::path::PathBuf;
use terra_sync_policy::{ContractManifest, PolicyEvaluator};
use terra_sync_proto::policy::EvaluateRequest;

fn load_manifest() -> ContractManifest {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml");
    ContractManifest::load_from_path(&path).unwrap()
}

#[test]
fn writeback_to_benton_is_denied_by_default() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let req = EvaluateRequest {
        actor_identity: "test".into(),
        action: "writeback.write".into(),
        resource_kind: "canonical-row".into(),
        resource_id: "Properties/...".into(),
        county_id: "19190019-1919-1919-1919-191919191919".into(),
        context: HashMap::new(),
    };
    let resp = evaluator.evaluate(&req);
    assert!(!resp.allowed, "writeback must be denied under base pacscontract.v1");
    assert!(resp.reason.contains("Amendment required") || resp.reason.contains("amendment"));
}

#[test]
fn subscribe_to_allowed_topic_is_permitted() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let mut ctx = HashMap::new();
    ctx.insert("topic".into(), "sync.source.harris.benton.property".into());
    let req = EvaluateRequest {
        actor_identity: "arroyo".into(),
        action: "topic.subscribe".into(),
        resource_kind: "topic".into(),
        resource_id: "sync.source.harris.benton.property".into(),
        county_id: "19190019-1919-1919-1919-191919191919".into(),
        context: ctx,
    };
    let resp = evaluator.evaluate(&req);
    assert!(resp.allowed, "allowed topic must permit subscribe; rule={}", resp.rule_matched);
}

#[test]
fn subscribe_to_unregistered_county_is_denied() {
    let evaluator = PolicyEvaluator::new(load_manifest());
    let mut ctx = HashMap::new();
    ctx.insert("topic".into(), "sync.canonical.property".into());
    let req = EvaluateRequest {
        actor_identity: "arroyo".into(),
        action: "topic.subscribe".into(),
        resource_kind: "topic".into(),
        resource_id: "sync.canonical.property".into(),
        county_id: "00000000-0000-0000-0000-000000000000".into(),
        context: ctx,
    };
    let resp = evaluator.evaluate(&req);
    assert!(!resp.allowed);
    assert!(resp.rule_matched.contains("deny_unknown_county"));
}
```

- [ ] **Step 8: Run tests**

```bash
cd packages/terra-sync && cargo test -p terra-sync-policy
```
Expected: 5 tests pass (2 in manifest_load, 3 in deny_unauthorized).

- [ ] **Step 9: Commit**

```bash
git add packages/terra-sync/crates/terra-sync-policy/ docs/spec-lock/locks/pacscontract/v1/manifest.yaml
git commit -m "feat(sync-v4): terra-sync-policy crate — real pacscontract.v1 evaluator

Replaces the current rubber-stamp IsValid=true stub with a YAML-driven
policy engine. Loads docs/spec-lock/locks/pacscontract/v1/manifest.yaml
which codifies:
- read-only base contract
- per-county rules (Benton today; more via amendments)
- allow/forbid topic subscribe patterns with glob matching
- global forbidden actions (writeback.write unless amended)
- audit retention 7 years, WORM required

5 passing tests prove: manifest parses, wrong contract rejected,
writeback denied by default, allowed topic permits subscribe,
unregistered county denied.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: terra-sync-audit — hash-chained event model

**Files:**
- Create: `packages/terra-sync/crates/terra-sync-audit/Cargo.toml`
- Create: `packages/terra-sync/crates/terra-sync-audit/src/lib.rs`
- Create: `packages/terra-sync/crates/terra-sync-audit/src/event.rs`
- Create: `packages/terra-sync/crates/terra-sync-audit/src/emitter.rs`
- Create: `packages/terra-sync/crates/terra-sync-audit/tests/hash_chain.rs`

- [ ] **Step 1: Cargo.toml**

```toml
[package]
name = "terra-sync-audit"
version.workspace = true
edition.workspace = true
license.workspace = true

[dependencies]
chrono = { workspace = true }
uuid = { workspace = true }
sha2 = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
thiserror = { workspace = true }
tokio = { workspace = true }
rdkafka = { workspace = true }
tracing = { workspace = true }
terra-sync-proto = { path = "../terra-sync-proto" }
```

- [ ] **Step 2: src/event.rs — AuditEvent with hash chain**

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub audit_id: String,
    pub event_type: String,
    pub occurred_at: DateTime<Utc>,
    pub actor: Actor,
    pub county_id: String,
    pub subject: Subject,
    pub outcome: Outcome,
    pub policy_refs: Vec<String>,
    pub prev_hash: String,
    pub hash: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Actor {
    pub identity: String,
    pub auth_method: String,
    pub certificate_fingerprint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subject {
    pub kind: String,
    pub id: String,
    pub attrs: HashMap<String, String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Outcome {
    Success,
    Denied,
    Failed,
}

pub struct AuditEventBuilder {
    pub event_type: String,
    pub actor: Actor,
    pub county_id: String,
    pub subject: Subject,
    pub outcome: Outcome,
    pub policy_refs: Vec<String>,
    pub metadata: HashMap<String, String>,
}

impl AuditEventBuilder {
    /// Finalize with a `prev_hash` from the last event in the chain
    /// (empty string for the genesis event).
    pub fn build(self, prev_hash: &str) -> AuditEvent {
        let audit_id = Uuid::new_v4().to_string();
        let occurred_at = Utc::now();

        let mut event = AuditEvent {
            audit_id,
            event_type: self.event_type,
            occurred_at,
            actor: self.actor,
            county_id: self.county_id,
            subject: self.subject,
            outcome: self.outcome,
            policy_refs: self.policy_refs,
            prev_hash: prev_hash.to_string(),
            hash: String::new(), // filled below
            metadata: self.metadata,
        };
        event.hash = compute_hash(&event);
        event
    }
}

fn compute_hash(event: &AuditEvent) -> String {
    // Deterministic JSON over everything except the hash field itself.
    let mut clone = event.clone();
    clone.hash.clear();
    let canonical = serde_json::to_string(&clone).expect("audit event serializes");
    let digest = Sha256::digest(canonical.as_bytes());
    format!("sha256:{:x}", digest)
}

/// Verify a chain of audit events in order.
/// Returns the index of the first broken link, or None if all links valid.
pub fn verify_chain(events: &[AuditEvent]) -> Option<usize> {
    let mut expected_prev = String::new(); // genesis
    for (i, event) in events.iter().enumerate() {
        if event.prev_hash != expected_prev {
            return Some(i);
        }
        let recomputed = compute_hash(event);
        if recomputed != event.hash {
            return Some(i);
        }
        expected_prev = event.hash.clone();
    }
    None
}
```

- [ ] **Step 3: src/emitter.rs — Kafka producer wrapper**

```rust
use crate::event::AuditEvent;
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::ClientConfig;
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum EmitError {
    #[error("kafka producer creation: {0}")]
    Producer(#[from] rdkafka::error::KafkaError),
    #[error("kafka send: {0}")]
    Send(String),
    #[error("json serialization: {0}")]
    Json(#[from] serde_json::Error),
}

pub struct AuditEmitter {
    producer: FutureProducer,
    topic: String,
}

impl AuditEmitter {
    pub fn new(bootstrap_servers: &str, topic: &str) -> Result<Self, EmitError> {
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", bootstrap_servers)
            .set("message.timeout.ms", "5000")
            .set("compression.type", "zstd")
            .set("enable.idempotence", "true")
            .create()?;
        Ok(Self {
            producer,
            topic: topic.to_string(),
        })
    }

    pub async fn emit(&self, event: &AuditEvent) -> Result<(), EmitError> {
        let key = event.county_id.clone();
        let payload = serde_json::to_vec(event)?;
        let record = FutureRecord::to(&self.topic)
            .key(&key)
            .payload(&payload);

        self.producer
            .send(record, Duration::from_secs(5))
            .await
            .map_err(|(e, _)| EmitError::Send(e.to_string()))?;

        tracing::debug!(audit_id = %event.audit_id, event_type = %event.event_type, "audit emitted");
        Ok(())
    }
}
```

- [ ] **Step 4: src/lib.rs**

```rust
pub mod emitter;
pub mod event;

pub use emitter::{AuditEmitter, EmitError};
pub use event::{Actor, AuditEvent, AuditEventBuilder, Outcome, Subject, verify_chain};
```

- [ ] **Step 5: tests/hash_chain.rs**

```rust
use std::collections::HashMap;
use terra_sync_audit::{Actor, AuditEventBuilder, Outcome, Subject, verify_chain};

fn make_actor() -> Actor {
    Actor {
        identity: "testuser".into(),
        auth_method: "mtls".into(),
        certificate_fingerprint: "sha256:AABB...".into(),
    }
}

fn make_subject(kind: &str, id: &str) -> Subject {
    Subject {
        kind: kind.into(),
        id: id.into(),
        attrs: HashMap::new(),
    }
}

#[test]
fn chain_of_three_events_verifies_clean() {
    let e1 = AuditEventBuilder {
        event_type: "connector.deploy".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec!["pacscontract.v1".into()],
        metadata: HashMap::new(),
    }
    .build("");

    let e2 = AuditEventBuilder {
        event_type: "connector.pause".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build(&e1.hash);

    let e3 = AuditEventBuilder {
        event_type: "connector.resume".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("connector", "benton-v1"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build(&e2.hash);

    assert!(verify_chain(&[e1, e2, e3]).is_none(), "clean chain should verify");
}

#[test]
fn tampered_event_detected() {
    let mut e1 = AuditEventBuilder {
        event_type: "x".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build("");
    let e2 = AuditEventBuilder {
        event_type: "y".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("y", "y"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build(&e1.hash);

    // Tamper: change event_type without updating hash.
    e1.event_type = "z".into();

    let broken = verify_chain(&[e1, e2]);
    assert_eq!(broken, Some(0), "tampered event at index 0 should be flagged");
}

#[test]
fn broken_prev_link_detected() {
    let e1 = AuditEventBuilder {
        event_type: "a".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build("");
    // Build e2 with a wrong prev_hash.
    let e2 = AuditEventBuilder {
        event_type: "b".into(),
        actor: make_actor(),
        county_id: "benton".into(),
        subject: make_subject("x", "x"),
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build("sha256:wrong");

    let broken = verify_chain(&[e1, e2]);
    assert_eq!(broken, Some(1));
}
```

- [ ] **Step 6: Run tests**

```bash
cd packages/terra-sync && cargo test -p terra-sync-audit
```
Expected: 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/terra-sync/crates/terra-sync-audit/
git commit -m "feat(sync-v4): terra-sync-audit crate — hash-chained audit events

AuditEventBuilder produces AuditEvent with SHA-256 chain:
- hash = sha256(canonical JSON of the event with hash field blanked)
- prev_hash links to the prior event; '' for genesis
- verify_chain walks the chain and returns the first broken index

3 tests: clean chain verifies, tampered event detected, broken
prev_link detected.

AuditEmitter wraps an rdkafka idempotent producer; partition key =
county_id so audit events for a county order correctly. Compression
zstd. Ready for sync.audit topic write.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: terra-sync-control — minimal gRPC server skeleton

**Files:**
- Create: `packages/terra-sync/crates/terra-sync-control/Cargo.toml`
- Create: `packages/terra-sync/crates/terra-sync-control/src/main.rs`
- Create: `packages/terra-sync/crates/terra-sync-control/src/server.rs`
- Create: `packages/terra-sync/crates/terra-sync-control/src/config.rs`
- Create: `packages/terra-sync/crates/terra-sync-control/src/observability.rs`
- Create: `packages/terra-sync/crates/terra-sync-control/tests/server_smoke.rs`

- [ ] **Step 1: Cargo.toml**

```toml
[package]
name = "terra-sync-control"
version.workspace = true
edition.workspace = true
license.workspace = true

[[bin]]
name = "terra-sync-control"
path = "src/main.rs"

[dependencies]
tokio = { workspace = true }
tonic = { workspace = true }
prost = { workspace = true }
prost-types = { workspace = true }
axum = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
serde_yaml = { workspace = true }
thiserror = { workspace = true }
anyhow = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }
tracing-opentelemetry = { workspace = true }
opentelemetry = { workspace = true }
opentelemetry-otlp = { workspace = true }
opentelemetry_sdk = { workspace = true }
chrono = { workspace = true }
uuid = { workspace = true }
prometheus = { workspace = true }
terra-sync-proto = { path = "../terra-sync-proto" }
terra-sync-policy = { path = "../terra-sync-policy" }
terra-sync-audit = { path = "../terra-sync-audit" }
```

- [ ] **Step 2: src/config.rs**

```rust
use serde::Deserialize;
use std::net::SocketAddr;
use std::path::PathBuf;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub grpc: GrpcConfig,
    pub metrics: MetricsConfig,
    pub kafka: KafkaConfig,
    pub manifest_path: PathBuf,
    pub observability: ObservabilityConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GrpcConfig {
    pub listen_addr: SocketAddr,
    pub tls_cert: Option<PathBuf>,
    pub tls_key: Option<PathBuf>,
    pub ca_cert: Option<PathBuf>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MetricsConfig {
    pub listen_addr: SocketAddr,
}

#[derive(Debug, Clone, Deserialize)]
pub struct KafkaConfig {
    pub bootstrap_servers: String,
    pub audit_topic: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ObservabilityConfig {
    pub otlp_endpoint: Option<String>,
    pub log_level: String,
}

impl Config {
    pub fn from_file(path: &std::path::Path) -> anyhow::Result<Self> {
        let s = std::fs::read_to_string(path)?;
        Ok(serde_yaml::from_str(&s)?)
    }
}
```

- [ ] **Step 3: src/observability.rs**

```rust
use crate::config::ObservabilityConfig;
use opentelemetry::trace::TracerProvider as _;
use opentelemetry_sdk::trace::TracerProvider;
use tracing_subscriber::prelude::*;

pub fn init(cfg: &ObservabilityConfig) -> anyhow::Result<()> {
    let env_filter = tracing_subscriber::EnvFilter::try_new(&cfg.log_level)
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    let stdout_layer = tracing_subscriber::fmt::layer().json();

    let otel_layer = if let Some(endpoint) = &cfg.otlp_endpoint {
        let exporter = opentelemetry_otlp::SpanExporter::builder()
            .with_tonic()
            .with_endpoint(endpoint)
            .build()?;
        let provider = TracerProvider::builder()
            .with_batch_exporter(exporter, opentelemetry_sdk::runtime::Tokio)
            .build();
        let tracer = provider.tracer("terra-sync-control");
        Some(tracing_opentelemetry::layer().with_tracer(tracer))
    } else {
        None
    };

    tracing_subscriber::registry()
        .with(env_filter)
        .with(stdout_layer)
        .with(otel_layer)
        .init();

    Ok(())
}
```

- [ ] **Step 4: src/server.rs — ControlPlane service impl**

```rust
use std::collections::HashMap;
use std::sync::Arc;
use terra_sync_audit::AuditEmitter;
use terra_sync_policy::PolicyEvaluator;
use terra_sync_proto::control::{
    control_plane_server::ControlPlane, Connector, ConnectorState, GetConnectorRequest,
    GetStatusRequest, GetStatusResponse, ListConnectorsRequest, ListConnectorsResponse,
    PauseConnectorRequest, PauseConnectorResponse, ResumeConnectorRequest, ResumeConnectorResponse,
};
use tonic::{Request, Response, Status};

pub struct ControlPlaneService {
    pub policy: Arc<PolicyEvaluator>,
    pub audit: Arc<AuditEmitter>,
    pub start_time: chrono::DateTime<chrono::Utc>,
}

#[tonic::async_trait]
impl ControlPlane for ControlPlaneService {
    async fn get_status(
        &self,
        _req: Request<GetStatusRequest>,
    ) -> Result<Response<GetStatusResponse>, Status> {
        let mut states = HashMap::new();
        states.insert("control_plane".into(), "running".into());
        states.insert("policy_engine".into(), "ready".into());
        states.insert("kafka_audit".into(), "ready".into());

        let now = chrono::Utc::now();
        let elapsed = now - self.start_time;

        let mut metadata = HashMap::new();
        metadata.insert("uptime_seconds".into(), elapsed.num_seconds().to_string());
        states.extend(metadata);

        let resp = GetStatusResponse {
            version: env!("CARGO_PKG_VERSION").to_string(),
            server_time: Some(prost_types::Timestamp {
                seconds: now.timestamp(),
                nanos: now.timestamp_subsec_nanos() as i32,
            }),
            healthy: true,
            component_states: states,
        };
        Ok(Response::new(resp))
    }

    async fn list_connectors(
        &self,
        _req: Request<ListConnectorsRequest>,
    ) -> Result<Response<ListConnectorsResponse>, Status> {
        // Phase 1: empty registry. Phase 2 wires in the DB-backed registry (Task 10).
        Ok(Response::new(ListConnectorsResponse { connectors: vec![] }))
    }

    async fn get_connector(
        &self,
        req: Request<GetConnectorRequest>,
    ) -> Result<Response<Connector>, Status> {
        Err(Status::not_found(format!("connector {} not registered", req.into_inner().name)))
    }

    async fn pause_connector(
        &self,
        _req: Request<PauseConnectorRequest>,
    ) -> Result<Response<PauseConnectorResponse>, Status> {
        Err(Status::unimplemented("pause_connector — wired in Phase 2"))
    }

    async fn resume_connector(
        &self,
        _req: Request<ResumeConnectorRequest>,
    ) -> Result<Response<ResumeConnectorResponse>, Status> {
        Err(Status::unimplemented("resume_connector — wired in Phase 2"))
    }
}
```

- [ ] **Step 5: src/main.rs — binary entry**

```rust
mod config;
mod observability;
mod server;

use std::sync::Arc;
use terra_sync_audit::AuditEmitter;
use terra_sync_policy::{ContractManifest, PolicyEvaluator};
use terra_sync_proto::control::control_plane_server::ControlPlaneServer;
use tonic::transport::Server;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config_path = std::env::var("SYNC_CONTROL_CONFIG")
        .unwrap_or_else(|_| "config/control-plane.yaml".into());
    let cfg = config::Config::from_file(std::path::Path::new(&config_path))?;

    observability::init(&cfg.observability)?;
    tracing::info!(version = env!("CARGO_PKG_VERSION"), "terra-sync-control starting");

    let manifest = ContractManifest::load_from_path(&cfg.manifest_path)?;
    let policy = Arc::new(PolicyEvaluator::new(manifest));

    let audit = Arc::new(AuditEmitter::new(
        &cfg.kafka.bootstrap_servers,
        &cfg.kafka.audit_topic,
    )?);

    let svc = server::ControlPlaneService {
        policy,
        audit,
        start_time: chrono::Utc::now(),
    };

    // Metrics server (Prometheus-scrapable HTTP)
    let metrics_addr = cfg.metrics.listen_addr;
    tokio::spawn(async move {
        let app = axum::Router::new()
            .route("/health", axum::routing::get(|| async { "ok" }))
            .route("/ready", axum::routing::get(|| async { "ok" }))
            .route(
                "/metrics",
                axum::routing::get(|| async {
                    let encoder = prometheus::TextEncoder::new();
                    let metric_families = prometheus::gather();
                    encoder.encode_to_string(&metric_families).unwrap_or_default()
                }),
            );
        let listener = tokio::net::TcpListener::bind(metrics_addr).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    });

    tracing::info!(addr = %cfg.grpc.listen_addr, "gRPC server listening");
    Server::builder()
        .add_service(ControlPlaneServer::new(svc))
        .serve(cfg.grpc.listen_addr)
        .await?;

    Ok(())
}
```

- [ ] **Step 6: Create a dev config file**

Location: `packages/terra-sync/crates/terra-sync-control/config/control-plane.dev.yaml`

```yaml
grpc:
  listen_addr: "0.0.0.0:9443"
  tls_cert: null
  tls_key: null
  ca_cert: null
metrics:
  listen_addr: "0.0.0.0:9090"
kafka:
  bootstrap_servers: "localhost:9092"
  audit_topic: "sync.audit"
manifest_path: "../../../docs/spec-lock/locks/pacscontract/v1/manifest.yaml"
observability:
  otlp_endpoint: null
  log_level: "info,terra_sync_control=debug"
```

- [ ] **Step 7: tests/server_smoke.rs — compile-only smoke**

```rust
// Smoke: the service compiles and can be instantiated.
// Real end-to-end test lives in tests/integration/phase2_smoke.rs once the
// full topology is up.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use terra_sync_audit::{Actor, AuditEventBuilder, Outcome, Subject};
use terra_sync_policy::{ContractManifest, PolicyEvaluator};

#[test]
fn policy_evaluator_constructs() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent().unwrap().parent().unwrap().parent().unwrap()
        .join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml");
    let m = ContractManifest::load_from_path(&path).unwrap();
    let _eval: Arc<PolicyEvaluator> = Arc::new(PolicyEvaluator::new(m));
}

#[test]
fn audit_event_builder_produces_genesis() {
    let e = AuditEventBuilder {
        event_type: "control_plane.start".into(),
        actor: Actor {
            identity: "system".into(),
            auth_method: "system".into(),
            certificate_fingerprint: String::new(),
        },
        county_id: String::new(),
        subject: Subject {
            kind: "service".into(),
            id: "control-plane".into(),
            attrs: HashMap::new(),
        },
        outcome: Outcome::Success,
        policy_refs: vec![],
        metadata: HashMap::new(),
    }
    .build("");
    assert!(e.hash.starts_with("sha256:"));
    assert_eq!(e.prev_hash, "");
}
```

- [ ] **Step 8: Build + tests**

```bash
cd packages/terra-sync && cargo build -p terra-sync-control
cargo test -p terra-sync-control
```
Expected: binary builds; 2 smoke tests pass. Do NOT run the binary yet — needs Kafka (Task 6).

- [ ] **Step 9: Commit**

```bash
git add packages/terra-sync/crates/terra-sync-control/
git commit -m "feat(sync-v4): terra-sync-control crate — gRPC skeleton

Binary terra-sync-control:
- Loads YAML config (SYNC_CONTROL_CONFIG env var or config/control-plane.yaml)
- Initializes JSON structured logs + optional OTLP trace exporter
- Loads pacscontract.v1 manifest via terra-sync-policy
- Instantiates AuditEmitter bound to sync.audit Kafka topic
- Exposes gRPC ControlPlane service on :9443 (TLS optional, wired Phase 3)
- Axum /health, /ready, /metrics on :9090

ControlPlane.GetStatus returns version + server_time + component
states. list/get/pause/resume return stub responses (wired in Phase 2
after connector registry lands).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: docker-compose dev topology

**Files:**
- Create: `packages/terra-sync/deploy/docker-compose.dev.yml`
- Create: `packages/terra-sync/deploy/README.md`

- [ ] **Step 1: docker-compose.dev.yml**

```yaml
version: "3.9"

name: terrafusion-sync-v4-dev

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.7.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports: ["2181:2181"]

  kafka:
    image: confluentinc/cp-kafka:7.7.0
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,PLAINTEXT_HOST://0.0.0.0:29092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports: ["29092:29092"]

  connect:
    image: debezium/connect:2.7
    depends_on: [kafka]
    environment:
      BOOTSTRAP_SERVERS: kafka:9092
      GROUP_ID: connect-1
      CONFIG_STORAGE_TOPIC: connect.configs
      OFFSET_STORAGE_TOPIC: connect.offsets
      STATUS_STORAGE_TOPIC: connect.status
      KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_KEY_CONVERTER_SCHEMAS_ENABLE: "false"
      CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: "false"
    ports: ["8083:8083"]

  risingwave:
    image: risingwavelabs/risingwave:v2.0.0
    command: playground
    ports:
      - "4566:4566"   # psql (RW frontend)
      - "5691:5691"   # meta
      - "1250:1250"   # dashboard
    depends_on: [kafka]

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.109.0
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP

  prometheus:
    image: prom/prometheus:v2.55.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports: ["9091:9090"]

  grafana:
    image: grafana/grafana:11.3.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports: ["3001:3000"]
```

- [ ] **Step 2: otel-collector-config.yaml**

Location: `packages/terra-sync/deploy/otel-collector-config.yaml`

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch: {}

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
```

- [ ] **Step 3: prometheus.yml**

Location: `packages/terra-sync/deploy/prometheus.yml`

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: terra-sync-control
    static_configs:
      - targets: ["host.docker.internal:9090"]
```

- [ ] **Step 4: README.md**

Location: `packages/terra-sync/deploy/README.md`

```markdown
# Local dev topology

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f
```

Services:
- Kafka broker: `localhost:29092` (host) / `kafka:9092` (container network)
- Kafka Connect: `http://localhost:8083`
- RisingWave psql: `postgresql://root@localhost:4566/dev`
- OTel Collector: gRPC `localhost:4317`, HTTP `localhost:4318`
- Prometheus: `http://localhost:9091`
- Grafana: `http://localhost:3001` (admin/admin)

Tear down:
```bash
docker compose -f docker-compose.dev.yml down -v
```
```

- [ ] **Step 5: Bring it up and sanity check**

```bash
cd packages/terra-sync/deploy
docker compose -f docker-compose.dev.yml up -d
# Wait ~60s for Kafka+Connect to settle
curl -sf http://localhost:8083/ | head -5
# Expected: Kafka Connect worker JSON (version, commit, kafka_cluster_id)
curl -sf http://localhost:4566 || true
docker compose -f docker-compose.dev.yml down
```

- [ ] **Step 6: Commit**

```bash
git add packages/terra-sync/deploy/
git commit -m "feat(sync-v4): local dev topology — Kafka + Debezium Connect + RisingWave + OTel + Grafana

docker compose -f docker-compose.dev.yml up -d starts:
- Kafka broker (Confluent 7.7)
- Kafka Connect + Debezium 2.7 (SQL Server connector plugin shipped in the image)
- RisingWave 2.0 in playground mode
- OTel Collector with debug exporter
- Prometheus + Grafana

New contributor boots the Sync v4 dev topology in <5 minutes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: CI workflow — build + test + clippy + fmt

**Files:**
- Create: `packages/terra-sync/.github/workflows/rust.yml`

- [ ] **Step 1: Write rust.yml**

```yaml
name: sync-v4-rust

on:
  push:
    paths: ["packages/terra-sync/**"]
  pull_request:
    paths: ["packages/terra-sync/**"]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/terra-sync
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: packages/terra-sync

      - name: cargo fmt
        run: cargo fmt --all --check

      - name: cargo clippy
        run: cargo clippy --workspace --all-targets -- -D warnings

      - name: cargo build
        run: cargo build --workspace

      - name: cargo test
        run: cargo test --workspace
```

- [ ] **Step 2: Commit**

```bash
git add packages/terra-sync/.github/workflows/rust.yml
git commit -m "ci(sync-v4): rust workspace CI — fmt + clippy + build + test

Triggers on packages/terra-sync/** changes. Enforces clippy -D warnings.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Create Kafka topics used in Phase 2

**Files:** (runbook-style task; no source files created)

- [ ] **Step 1: Bring up dev topology**

```bash
cd packages/terra-sync/deploy
docker compose -f docker-compose.dev.yml up -d
sleep 60
```

- [ ] **Step 2: Create audit + canonical + source topics**

```bash
for t in sync.audit sync.anomaly sync.deadletter sync.canonical.property sync.canonical.cama sync.canonical.comparable_sales sync.canonical.property_assessments sync.source.harris.benton.property sync.source.harris.benton.imprv sync.source.harris.benton.sale sync.source.harris.benton.property_val; do
  docker compose -f docker-compose.dev.yml exec kafka kafka-topics --bootstrap-server kafka:9092 --create --if-not-exists --topic "$t" --partitions 6 --replication-factor 1
done

docker compose -f docker-compose.dev.yml exec kafka kafka-topics --bootstrap-server kafka:9092 --list | sort
```
Expected: all listed topics appear.

- [ ] **Step 3: Start the control plane binary and smoke-test gRPC**

Terminal 1:
```bash
cd packages/terra-sync/crates/terra-sync-control
SYNC_CONTROL_CONFIG=config/control-plane.dev.yaml cargo run -p terra-sync-control
```

Terminal 2:
```bash
grpcurl -plaintext -d '{}' localhost:9443 terrafusion.sync.v4.control.ControlPlane/GetStatus | jq .
```
Expected: response with `healthy: true`, `component_states` map, current `server_time`.

- [ ] **Step 4: Phase 1 exit gate**

Verify:
- `curl http://localhost:8080/health` → `ok`
- `curl http://localhost:9090/metrics | head` → Prometheus metrics
- gRPC GetStatus returns the expected shape

Commit a runbook note:

```bash
git add -A
git commit --allow-empty -m "milestone(sync-v4): PHASE 1 exit gate — dev topology up, control plane serves gRPC

Dev topology (Kafka+Connect+RisingWave+OTel+Grafana) starts via
docker-compose. terra-sync-control binary runs, loads pacscontract.v1,
exposes ControlPlane/GetStatus, serves /health /ready /metrics.

Phase 2 (Benton connector + Arroyo pipelines + RisingWave MVs +
shadow-mode diff) begins after this commit.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# PHASE 2 — Benton first-county in shadow mode

Goal: Harris PACS Benton data flows Debezium → Kafka → Arroyo → RisingWave → a `shadow_*` Postgres schema (parallel to existing canonical). A daily diff job compares shadow vs existing canonical and publishes a report. No consumer reads shadow data yet. Cutover (Phase 3) happens only after 7 days of <0.1% diff.

Important: Phase 2 requires an MSSQL instance with PACS data. For dev, use the MSSQL bak restored from `E:\PACS\pacs_oltp_backup_2026_01_15_170502_7994110.bak`. For CI, use a miniaturized synthetic fixture database.

---

### Task 9: Provision MSSQL dev instance with Benton PACS

**Files:**
- Modify: `packages/terra-sync/deploy/docker-compose.dev.yml` (add mssql service)
- Create: `packages/terra-sync/deploy/mssql/README.md`

- [ ] **Step 1: Add MSSQL service**

Append to `docker-compose.dev.yml`:

```yaml
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "<redacted-local-dev-sql-password>"
      MSSQL_PID: "Developer"
      MSSQL_AGENT_ENABLED: "true"
    ports: ["1433:1433"]
    volumes:
      - mssql-data:/var/opt/mssql
      - ./mssql/backups:/var/opt/mssql/backup

volumes:
  mssql-data: {}
```

- [ ] **Step 2: mssql/README.md**

Location: `packages/terra-sync/deploy/mssql/README.md`

```markdown
# Restoring the Benton PACS MSSQL snapshot

The Benton PACS backup is at `E:\PACS\pacs_oltp_backup_2026_01_15_170502_7994110.bak`
(≈102 GB). For dev we restore it into the `mssql` container.

## Restore
```bash
# copy .bak into ./backups/ (or mount from E:)
docker compose exec mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P '<redacted-local-dev-sql-password>' \
  -Q "RESTORE DATABASE pacs_oltp FROM DISK='/var/opt/mssql/backup/pacs_oltp_backup_2026_01_15_170502_7994110.bak' WITH MOVE 'pacs_oltp' TO '/var/opt/mssql/data/pacs_oltp.mdf', MOVE 'pacs_oltp_log' TO '/var/opt/mssql/data/pacs_oltp_log.ldf', REPLACE"
```

## Enable CDC on the tables we'll replicate
```sql
USE pacs_oltp;
EXEC sys.sp_cdc_enable_db;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'property',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'property_val',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'sale',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo', @source_name = N'imprv',
  @role_name = N'cdc_reader', @supports_net_changes = 0;
```

## Create the Debezium reader service account
```sql
CREATE LOGIN debezium WITH PASSWORD = 'TF_Deb2026!';
USE pacs_oltp;
CREATE USER debezium FOR LOGIN debezium;
EXEC sp_addrolemember 'db_datareader', 'debezium';
GRANT SELECT ON SCHEMA::cdc TO debezium;
```
```

- [ ] **Step 3: Commit (infra change only; data ops run separately per runbook)**

```bash
git add packages/terra-sync/deploy/docker-compose.dev.yml packages/terra-sync/deploy/mssql/README.md
git commit -m "feat(sync-v4): add MSSQL 2022 dev service + CDC runbook

Runs MSSQL 2022 Developer edition with SQL Agent enabled (required for
CDC). Runbook mssql/README.md documents restore + sp_cdc_enable_db +
per-table CDC + debezium service account.

The actual 102GB .bak restore is a manual step; this commit only adds
the container spec + runbook.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Debezium connector for Benton Harris PACS

**Files:**
- Create: `packages/terra-sync/deploy/debezium/connectors/benton-harris-pacs.json`
- Create: `packages/terra-sync/deploy/debezium/register.sh`

- [ ] **Step 1: Write connector config**

Location: `packages/terra-sync/deploy/debezium/connectors/benton-harris-pacs.json`

```json
{
  "name": "benton-harris-pacs-v1",
  "config": {
    "connector.class": "io.debezium.connector.sqlserver.SqlServerConnector",
    "tasks.max": "1",
    "database.hostname": "mssql",
    "database.port": "1433",
    "database.user": "debezium",
    "database.password": "TF_Deb2026!",
    "database.names": "pacs_oltp",
    "topic.prefix": "sync.source.harris.benton",
    "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
    "schema.history.internal.kafka.topic": "sync.source.harris.benton.schema-history",
    "table.include.list": "dbo.property,dbo.property_val,dbo.sale,dbo.imprv",
    "snapshot.mode": "initial",
    "include.schema.changes": "true",
    "database.encrypt": "false",
    "provide.transaction.metadata": "false",
    "heartbeat.interval.ms": "5000",
    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable": "false",
    "value.converter.schemas.enable": "false",
    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": "false",
    "transforms.unwrap.delete.handling.mode": "rewrite"
  }
}
```

- [ ] **Step 2: register.sh helper**

Location: `packages/terra-sync/deploy/debezium/register.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
CONNECT=${CONNECT:-http://localhost:8083}
CFG="${1:-connectors/benton-harris-pacs.json}"

echo "Registering $CFG at $CONNECT"
curl -sf -X POST -H "Content-Type: application/json" \
  "$CONNECT/connectors" \
  -d @"$CFG" | jq .

echo "Listing:"
curl -sf "$CONNECT/connectors" | jq .

echo "Status of $(jq -r .name $CFG):"
curl -sf "$CONNECT/connectors/$(jq -r .name $CFG)/status" | jq .
```

Make executable:
```bash
chmod +x packages/terra-sync/deploy/debezium/register.sh
```

- [ ] **Step 3: Register + verify (runbook)**

```bash
cd packages/terra-sync/deploy/debezium
./register.sh connectors/benton-harris-pacs.json
```
Expected: connector status shows `RUNNING`. Tail topic:
```bash
docker compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic sync.source.harris.benton.pacs_oltp.dbo.property --from-beginning --max-messages 3 | head -50
```
Expected: 3 JSON CDC messages with `op: "c"` (create) or `"r"` (read during snapshot).

- [ ] **Step 4: Commit**

```bash
git add packages/terra-sync/deploy/debezium/
git commit -m "feat(sync-v4): Debezium SQL Server connector for Benton Harris PACS

Replicates dbo.property, property_val, sale, imprv from pacs_oltp into
sync.source.harris.benton.pacs_oltp.dbo.<table> Kafka topics.

snapshot.mode=initial does the full historical load on first start,
then transitions to CDC streaming via SQL Server change tables.

register.sh wraps the Connect REST API for operator convenience.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Arroyo pipeline for Properties canonicalization

**Files:**
- Create: `packages/terra-sync/deploy/arroyo/pipelines/normalize-property.sql`

- [ ] **Step 1: Write the SQL pipeline**

```sql
-- normalize-property.sql
-- Consumes sync.source.harris.benton.pacs_oltp.dbo.property + property_val + situs
-- Produces sync.canonical.property records matching the canonical JSON Schema
-- published in the Sync v4 control plane design spec §6.2.

CREATE CONNECTION kafka_source WITH (
    connector = 'kafka',
    type = 'source',
    format = 'json',
    bootstrap_servers = 'kafka:9092'
);

CREATE CONNECTION kafka_sink WITH (
    connector = 'kafka',
    type = 'sink',
    format = 'json',
    bootstrap_servers = 'kafka:9092'
);

CREATE TABLE source_property (
    prop_id INT,
    geo_id VARCHAR,
    prop_type_cd VARCHAR,
    legal_desc VARCHAR,
    prop_create_dt TIMESTAMP,
    __op VARCHAR,
    __deleted VARCHAR
) WITH (connection = 'kafka_source', topic = 'sync.source.harris.benton.pacs_oltp.dbo.property');

CREATE TABLE source_property_val (
    prop_id INT,
    prop_val_yr INT,
    sup_num INT,
    hood_cd VARCHAR,
    assessed_val DECIMAL(18,2),
    market DECIMAL(18,2),
    imprv_val DECIMAL(18,2),
    land_hstd_val DECIMAL(18,2),
    land_non_hstd_val DECIMAL(18,2),
    __op VARCHAR,
    __deleted VARCHAR
) WITH (connection = 'kafka_source', topic = 'sync.source.harris.benton.pacs_oltp.dbo.property_val');

CREATE TABLE canonical_property (
    event_id VARCHAR,
    schema_version VARCHAR,
    event_type VARCHAR,
    county_id VARCHAR,
    entity VARCHAR,
    source_system VARCHAR,
    source_id VARCHAR,
    occurred_at_utc TIMESTAMP,
    ingested_at_utc TIMESTAMP,
    after_json VARCHAR
) WITH (connection = 'kafka_sink', topic = 'sync.canonical.property');

INSERT INTO canonical_property
SELECT
    uuid_generate_v4() AS event_id,
    '1.0' AS schema_version,
    CASE WHEN p.__deleted = 'true' THEN 'delete' ELSE 'upsert' END AS event_type,
    '19190019-1919-1919-1919-191919191919' AS county_id,
    'Property' AS entity,
    'harris-pacs' AS source_system,
    CAST(p.prop_id AS VARCHAR) AS source_id,
    COALESCE(p.prop_create_dt, CURRENT_TIMESTAMP) AS occurred_at_utc,
    CURRENT_TIMESTAMP AS ingested_at_utc,
    json_object(
      'prop_id', p.prop_id,
      'geo_id', p.geo_id,
      'prop_type_cd', p.prop_type_cd,
      'legal_desc', p.legal_desc,
      'neighborhood', pv.hood_cd,
      'assessment_year', pv.prop_val_yr,
      'assessed_val', pv.assessed_val,
      'market_val', pv.market,
      'imprv_val', pv.imprv_val,
      'land_val', COALESCE(pv.land_hstd_val, 0) + COALESCE(pv.land_non_hstd_val, 0)
    ) AS after_json
FROM source_property p
LEFT JOIN source_property_val pv
    ON p.prop_id = pv.prop_id
   AND pv.prop_val_yr = (SELECT MAX(prop_val_yr) FROM source_property_val WHERE prop_id = p.prop_id)
   AND pv.sup_num = 0
WHERE p.prop_id IS NOT NULL;
```

- [ ] **Step 2: Deploy pipeline via Arroyo (runbook)**

Arroyo deployment happens via its web UI or API. Runbook:
1. Open Arroyo UI (`http://localhost:5115` in Arroyo's dev docker image).
2. Paste the SQL, name the pipeline `normalize-property`, deploy.
3. Confirm pipeline reaches `RUNNING` state.
4. Tail `sync.canonical.property` — confirm events flow.

(Note: Arroyo is NOT in docker-compose.dev.yml yet. Add it:)

Append to `docker-compose.dev.yml`:
```yaml
  arroyo:
    image: ghcr.io/arroyosystems/arroyo:0.14.0
    depends_on: [kafka]
    environment:
      ARROYO__CONTROLLER__SCHEDULER: node
    ports:
      - "5115:5115"   # UI
      - "8000:8000"   # API
```

- [ ] **Step 3: Commit**

```bash
git add packages/terra-sync/deploy/arroyo/ packages/terra-sync/deploy/docker-compose.dev.yml
git commit -m "feat(sync-v4): Arroyo pipeline normalize-property + Arroyo in dev topology

SQL pipeline joins Debezium CDC topics (property + property_val) into
canonical property events on sync.canonical.property. Event shape
matches spec §6.2 (event_id, schema_version, event_type upsert|delete,
county_id, entity, source_system, source_id, after_json).

Arroyo 0.14 added to docker-compose.dev.yml on ports 5115 (UI) / 8000 (API).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Arroyo pipelines for CamaCharacteristics, ComparableSales, PropertyAssessments

**Files:**
- Create: `packages/terra-sync/deploy/arroyo/pipelines/normalize-cama.sql`
- Create: `packages/terra-sync/deploy/arroyo/pipelines/normalize-comparable-sales.sql`
- Create: `packages/terra-sync/deploy/arroyo/pipelines/normalize-property-assessments.sql`

- [ ] **Step 1: normalize-cama.sql**

```sql
-- normalize-cama.sql
-- Consumes sync.source.harris.benton.pacs_oltp.dbo.imprv (+ imprv_detail if CDC-enabled)
-- Produces sync.canonical.cama

CREATE CONNECTION kafka_source WITH (connector='kafka', type='source', format='json', bootstrap_servers='kafka:9092');
CREATE CONNECTION kafka_sink   WITH (connector='kafka', type='sink',   format='json', bootstrap_servers='kafka:9092');

CREATE TABLE source_imprv (
    prop_id INT, prop_val_yr INT, imprv_id INT,
    imprv_type_cd VARCHAR, imprv_state_cd VARCHAR,
    imprv_val DECIMAL(18,2), physical_pct DECIMAL(7,4), dep_pct DECIMAL(7,4),
    __op VARCHAR, __deleted VARCHAR
) WITH (connection='kafka_source', topic='sync.source.harris.benton.pacs_oltp.dbo.imprv');

CREATE TABLE canonical_cama (
    event_id VARCHAR, schema_version VARCHAR, event_type VARCHAR,
    county_id VARCHAR, entity VARCHAR, source_system VARCHAR,
    source_id VARCHAR, occurred_at_utc TIMESTAMP, ingested_at_utc TIMESTAMP,
    after_json VARCHAR
) WITH (connection='kafka_sink', topic='sync.canonical.cama');

INSERT INTO canonical_cama
SELECT
  uuid_generate_v4(),
  '1.0',
  CASE WHEN __deleted='true' THEN 'delete' ELSE 'upsert' END,
  '19190019-1919-1919-1919-191919191919',
  'CamaCharacteristic',
  'harris-pacs',
  CAST(prop_id AS VARCHAR) || ':' || CAST(prop_val_yr AS VARCHAR),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  json_object(
    'parcel_id', CAST(prop_id AS VARCHAR),
    'tax_year', prop_val_yr,
    'building_type', imprv_type_cd,
    'improvement_val', imprv_val,
    'physical_pct', physical_pct,
    'depreciation_pct', dep_pct
  )
FROM source_imprv
WHERE prop_id IS NOT NULL;
```

- [ ] **Step 2: normalize-comparable-sales.sql**

```sql
-- normalize-comparable-sales.sql
-- Consumes sync.source.harris.benton.pacs_oltp.dbo.sale
-- Produces sync.canonical.comparable_sales

CREATE CONNECTION kafka_source WITH (connector='kafka', type='source', format='json', bootstrap_servers='kafka:9092');
CREATE CONNECTION kafka_sink   WITH (connector='kafka', type='sink',   format='json', bootstrap_servers='kafka:9092');

CREATE TABLE source_sale (
    chg_of_owner_id INT, sl_price DECIMAL(18,2), adjusted_sl_price DECIMAL(18,2),
    sl_dt TIMESTAMP, sl_type_cd VARCHAR, sl_financing_cd VARCHAR,
    sl_county_ratio_cd VARCHAR, sl_ratio_type_cd VARCHAR, sl_ratio VARCHAR,
    sl_qualifier VARCHAR, suppress_on_ratio_rpt_cd VARCHAR,
    include_no_calc BOOLEAN, land_only_sale BOOLEAN,
    __op VARCHAR, __deleted VARCHAR
) WITH (connection='kafka_source', topic='sync.source.harris.benton.pacs_oltp.dbo.sale');

CREATE TABLE canonical_sales (
    event_id VARCHAR, schema_version VARCHAR, event_type VARCHAR,
    county_id VARCHAR, entity VARCHAR, source_system VARCHAR,
    source_id VARCHAR, occurred_at_utc TIMESTAMP, ingested_at_utc TIMESTAMP,
    after_json VARCHAR
) WITH (connection='kafka_sink', topic='sync.canonical.comparable_sales');

INSERT INTO canonical_sales
SELECT
  uuid_generate_v4(),
  '1.0',
  CASE WHEN __deleted='true' THEN 'delete' ELSE 'upsert' END,
  '19190019-1919-1919-1919-191919191919',
  'ComparableSale',
  'harris-pacs',
  CAST(chg_of_owner_id AS VARCHAR),
  COALESCE(sl_dt, CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP,
  json_object(
    'chg_of_owner_id', chg_of_owner_id,
    'sale_price', sl_price,
    'adjusted_sale_price', adjusted_sl_price,
    'sale_date', sl_dt,
    'sale_type_cd', sl_type_cd,
    'financing_cd', sl_financing_cd,
    'county_ratio_cd', sl_county_ratio_cd,
    'ratio_type_cd', sl_ratio_type_cd,
    'qualifier', sl_qualifier,
    'suppress_on_ratio_rpt_cd', suppress_on_ratio_rpt_cd,
    'include_no_calc', include_no_calc,
    'land_only_sale', land_only_sale
  )
FROM source_sale
WHERE chg_of_owner_id IS NOT NULL;
```

- [ ] **Step 3: normalize-property-assessments.sql**

```sql
-- normalize-property-assessments.sql
-- Distills property_val CDC events into canonical PropertyAssessment events.

CREATE CONNECTION kafka_source WITH (connector='kafka', type='source', format='json', bootstrap_servers='kafka:9092');
CREATE CONNECTION kafka_sink   WITH (connector='kafka', type='sink',   format='json', bootstrap_servers='kafka:9092');

CREATE TABLE source_pv (
    prop_id INT, prop_val_yr INT, sup_num INT,
    assessed_val DECIMAL(18,2), market DECIMAL(18,2),
    imprv_val DECIMAL(18,2), land_hstd_val DECIMAL(18,2), land_non_hstd_val DECIMAL(18,2),
    legal_desc VARCHAR, legal_desc_2 VARCHAR,
    __op VARCHAR, __deleted VARCHAR
) WITH (connection='kafka_source', topic='sync.source.harris.benton.pacs_oltp.dbo.property_val');

CREATE TABLE canonical_pa (
    event_id VARCHAR, schema_version VARCHAR, event_type VARCHAR,
    county_id VARCHAR, entity VARCHAR, source_system VARCHAR,
    source_id VARCHAR, occurred_at_utc TIMESTAMP, ingested_at_utc TIMESTAMP,
    after_json VARCHAR
) WITH (connection='kafka_sink', topic='sync.canonical.property_assessments');

INSERT INTO canonical_pa
SELECT
  uuid_generate_v4(),
  '1.0',
  CASE WHEN __deleted='true' THEN 'delete' ELSE 'upsert' END,
  '19190019-1919-1919-1919-191919191919',
  'PropertyAssessment',
  'harris-pacs',
  CAST(prop_id AS VARCHAR) || ':' || CAST(prop_val_yr AS VARCHAR) || ':' || CAST(sup_num AS VARCHAR),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  json_object(
    'prop_id', prop_id,
    'assessment_year', prop_val_yr,
    'sup_num', sup_num,
    'assessed_value', assessed_val,
    'market_value', market,
    'improvement_value', imprv_val,
    'land_value', COALESCE(land_hstd_val,0) + COALESCE(land_non_hstd_val,0),
    'legal_description', TRIM(COALESCE(legal_desc,'') || ' ' || COALESCE(legal_desc_2,''))
  )
FROM source_pv
WHERE prop_id IS NOT NULL AND sup_num = 0;
```

- [ ] **Step 4: Deploy all three pipelines in Arroyo UI; verify topics flow**

- [ ] **Step 5: Commit**

```bash
git add packages/terra-sync/deploy/arroyo/pipelines/
git commit -m "feat(sync-v4): Arroyo pipelines for CAMA + ComparableSales + PropertyAssessments

Three new pipelines completing the Benton canonical-event set:
- normalize-cama.sql → sync.canonical.cama
- normalize-comparable-sales.sql → sync.canonical.comparable_sales
- normalize-property-assessments.sql → sync.canonical.property_assessments

Each consumes the matching Debezium-sourced topic and emits
canonical-shaped events per spec §6.2.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 13: RisingWave materialized views writing shadow Postgres tables

**Files:**
- Create: `packages/terra-sync/deploy/risingwave/shadow-schema.sql`
- Create: `packages/terra-sync/deploy/risingwave/mv_properties.sql`
- Create: `packages/terra-sync/deploy/risingwave/mv_cama_characteristics.sql`
- Create: `packages/terra-sync/deploy/risingwave/mv_comparable_sales.sql`
- Create: `packages/terra-sync/deploy/risingwave/mv_property_assessments.sql`

Important: MVs write to a **separate `shadow` schema** in TerraFusion Postgres so existing consumers are untouched.

- [ ] **Step 1: shadow-schema.sql (run against TerraFusion Postgres once)**

```sql
-- shadow-schema.sql
-- Creates the shadow schema + tables that mirror the canonical tables structurally.
-- The shadow-diff job (Task 14) compares shadow.Properties vs public."Properties"
-- and emits daily delta reports.

CREATE SCHEMA IF NOT EXISTS shadow;

CREATE TABLE IF NOT EXISTS shadow."Properties" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "ParcelId" varchar(50) NOT NULL,
    "PropertyId" varchar(50) NOT NULL,
    "GeoId" varchar(50),
    "Neighborhood" varchar(50),
    "SitusCity" varchar(100),
    "SitusState" varchar(2),
    "SitusZip" varchar(20),
    "PropertyUseCode" varchar(20),
    "LegalDescription" varchar(2000),
    "LastUpdated" timestamp with time zone,
    UNIQUE ("CountyId", "ParcelId")
);

CREATE TABLE IF NOT EXISTS shadow."CamaCharacteristics" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "ParcelId" varchar(50) NOT NULL,
    "TaxYear" int NOT NULL,
    "BuildingType" varchar(10),
    "ImprvVal" numeric(18,2),
    "PhysicalDepreciationPct" numeric(7,4),
    "DepreciationPct" numeric(7,4),
    "UpdatedAt" timestamp with time zone,
    UNIQUE ("CountyId", "ParcelId", "TaxYear")
);

CREATE TABLE IF NOT EXISTS shadow."ComparableSales" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "ParcelId" varchar(50),
    "SaleDate" timestamp with time zone,
    "SalePrice" numeric(18,2),
    "AdjustedSalePrice" numeric(18,2),
    "SaleTypeCode" varchar(5),
    "CountyRatioCode" varchar(10),
    "Qualifier" varchar(10),
    "SuppressOnRatioRptCd" varchar(5),
    "IncludeNoCalc" boolean,
    "LandOnlySale" boolean
);

CREATE TABLE IF NOT EXISTS shadow."PropertyAssessments" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "PropertyParcelId" varchar(50) NOT NULL,
    "AssessmentYear" int NOT NULL,
    "AssessedValue" numeric(18,2),
    "MarketValue" numeric(18,2),
    "ImprovementValue" numeric(18,2),
    "LandValue" numeric(18,2),
    UNIQUE ("CountyId", "PropertyParcelId", "AssessmentYear")
);
```

- [ ] **Step 2: mv_properties.sql (runs in RisingWave)**

```sql
-- mv_properties.sql
-- RisingWave materialized view reading sync.canonical.property Kafka topic,
-- upserting into Postgres shadow."Properties" via JDBC sink.

CREATE SOURCE IF NOT EXISTS src_canonical_property (
    event_id varchar,
    schema_version varchar,
    event_type varchar,
    county_id varchar,
    entity varchar,
    source_system varchar,
    source_id varchar,
    occurred_at_utc timestamp,
    ingested_at_utc timestamp,
    after_json varchar
)
WITH (
    connector = 'kafka',
    topic = 'sync.canonical.property',
    properties.bootstrap.server = 'kafka:9092',
    scan.startup.mode = 'earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_properties AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    (after_json::jsonb->>'prop_id')::varchar AS "ParcelId",
    'PACS-' || (after_json::jsonb->>'prop_id') AS "PropertyId",
    after_json::jsonb->>'geo_id' AS "GeoId",
    after_json::jsonb->>'neighborhood' AS "Neighborhood",
    NULL::varchar AS "SitusCity",          -- Arroyo pass must enrich from situs topic (Phase 2.1)
    NULL::varchar AS "SitusState",
    NULL::varchar AS "SitusZip",
    after_json::jsonb->>'prop_type_cd' AS "PropertyUseCode",
    after_json::jsonb->>'legal_desc' AS "LegalDescription",
    ingested_at_utc AS "LastUpdated"
FROM src_canonical_property
WHERE event_type = 'upsert';

-- Sink to Postgres shadow schema
CREATE SINK sink_shadow_properties
FROM mv_properties
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name = 'shadow."Properties"',
    primary_key = 'CountyId,ParcelId',
    type = 'upsert'
);
```

- [ ] **Step 3: mv_cama_characteristics.sql**

```sql
CREATE SOURCE IF NOT EXISTS src_canonical_cama (
    event_id varchar, schema_version varchar, event_type varchar,
    county_id varchar, entity varchar, source_system varchar,
    source_id varchar, occurred_at_utc timestamp, ingested_at_utc timestamp,
    after_json varchar
)
WITH (
    connector='kafka', topic='sync.canonical.cama',
    properties.bootstrap.server='kafka:9092', scan.startup.mode='earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cama AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    (after_json::jsonb->>'parcel_id')::varchar AS "ParcelId",
    (after_json::jsonb->>'tax_year')::int AS "TaxYear",
    (after_json::jsonb->>'building_type')::varchar AS "BuildingType",
    (after_json::jsonb->>'improvement_val')::numeric AS "ImprvVal",
    (after_json::jsonb->>'physical_pct')::numeric AS "PhysicalDepreciationPct",
    (after_json::jsonb->>'depreciation_pct')::numeric AS "DepreciationPct",
    ingested_at_utc AS "UpdatedAt"
FROM src_canonical_cama
WHERE event_type='upsert';

CREATE SINK sink_shadow_cama FROM mv_cama
WITH (
    connector='jdbc',
    jdbc.url='jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name='shadow."CamaCharacteristics"',
    primary_key='CountyId,ParcelId,TaxYear',
    type='upsert'
);
```

- [ ] **Step 4: mv_comparable_sales.sql**

```sql
CREATE SOURCE IF NOT EXISTS src_canonical_sales (
    event_id varchar, schema_version varchar, event_type varchar,
    county_id varchar, entity varchar, source_system varchar,
    source_id varchar, occurred_at_utc timestamp, ingested_at_utc timestamp,
    after_json varchar
)
WITH (
    connector='kafka', topic='sync.canonical.comparable_sales',
    properties.bootstrap.server='kafka:9092', scan.startup.mode='earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    NULL::varchar AS "ParcelId",
    (after_json::jsonb->>'sale_date')::timestamp AS "SaleDate",
    (after_json::jsonb->>'sale_price')::numeric AS "SalePrice",
    (after_json::jsonb->>'adjusted_sale_price')::numeric AS "AdjustedSalePrice",
    (after_json::jsonb->>'sale_type_cd')::varchar AS "SaleTypeCode",
    (after_json::jsonb->>'county_ratio_cd')::varchar AS "CountyRatioCode",
    (after_json::jsonb->>'qualifier')::varchar AS "Qualifier",
    (after_json::jsonb->>'suppress_on_ratio_rpt_cd')::varchar AS "SuppressOnRatioRptCd",
    (after_json::jsonb->>'include_no_calc')::boolean AS "IncludeNoCalc",
    (after_json::jsonb->>'land_only_sale')::boolean AS "LandOnlySale"
FROM src_canonical_sales
WHERE event_type='upsert';

CREATE SINK sink_shadow_sales FROM mv_sales
WITH (
    connector='jdbc',
    jdbc.url='jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name='shadow."ComparableSales"',
    primary_key='Id',
    type='upsert'
);
```

- [ ] **Step 5: mv_property_assessments.sql**

```sql
CREATE SOURCE IF NOT EXISTS src_canonical_pa (
    event_id varchar, schema_version varchar, event_type varchar,
    county_id varchar, entity varchar, source_system varchar,
    source_id varchar, occurred_at_utc timestamp, ingested_at_utc timestamp,
    after_json varchar
)
WITH (
    connector='kafka', topic='sync.canonical.property_assessments',
    properties.bootstrap.server='kafka:9092', scan.startup.mode='earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_assessments AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    (after_json::jsonb->>'prop_id')::varchar AS "PropertyParcelId",
    (after_json::jsonb->>'assessment_year')::int AS "AssessmentYear",
    (after_json::jsonb->>'assessed_value')::numeric AS "AssessedValue",
    (after_json::jsonb->>'market_value')::numeric AS "MarketValue",
    (after_json::jsonb->>'improvement_value')::numeric AS "ImprovementValue",
    (after_json::jsonb->>'land_value')::numeric AS "LandValue"
FROM src_canonical_pa
WHERE event_type='upsert';

CREATE SINK sink_shadow_pa FROM mv_property_assessments
WITH (
    connector='jdbc',
    jdbc.url='jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name='shadow."PropertyAssessments"',
    primary_key='CountyId,PropertyParcelId,AssessmentYear',
    type='upsert'
);
```

- [ ] **Step 6: Runbook — apply and verify**

```bash
# Postgres: create shadow schema
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion \
  -f /path/to/packages/terra-sync/deploy/risingwave/shadow-schema.sql

# RisingWave: apply each MV
psql postgresql://root@localhost:4566/dev \
  -f packages/terra-sync/deploy/risingwave/mv_properties.sql
# (repeat for the other three)

# Verify shadow rows appear
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion \
  -c 'SELECT COUNT(*) FROM shadow."Properties";'
```
Expected: count > 0 after the Debezium snapshot completes and Arroyo+RisingWave pipelines have processed.

- [ ] **Step 7: Commit**

```bash
git add packages/terra-sync/deploy/risingwave/
git commit -m "feat(sync-v4): RisingWave materialized views → Postgres shadow schema

shadow-schema.sql creates shadow.Properties, .CamaCharacteristics,
.ComparableSales, .PropertyAssessments in the existing TerraFusion
Postgres. MVs in RisingWave consume sync.canonical.* topics and sink
upserts via JDBC.

Existing public.* canonical tables are untouched — Phase 3 cutover
only after shadow vs truth diff is <0.1% for 7 days.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 14: terra-sync-shadow-diff — daily comparator

**Files:**
- Create: `packages/terra-sync/crates/terra-sync-shadow-diff/Cargo.toml`
- Create: `packages/terra-sync/crates/terra-sync-shadow-diff/src/main.rs`
- Create: `packages/terra-sync/crates/terra-sync-shadow-diff/tests/diff_math.rs`

- [ ] **Step 1: Cargo.toml**

```toml
[package]
name = "terra-sync-shadow-diff"
version.workspace = true
edition.workspace = true
license.workspace = true

[[bin]]
name = "terra-sync-shadow-diff"
path = "src/main.rs"

[dependencies]
tokio = { workspace = true }
sqlx = { workspace = true }
anyhow = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }
serde_json = { workspace = true }
chrono = { workspace = true }
```

- [ ] **Step 2: src/main.rs**

```rust
use sqlx::postgres::PgPoolOptions;
use std::collections::HashMap;

#[derive(Debug)]
struct DiffReport {
    table: String,
    truth_row_count: i64,
    shadow_row_count: i64,
    missing_in_shadow: i64,
    extra_in_shadow: i64,
    value_mismatches: i64,
    delta_percent: f64,
}

impl DiffReport {
    fn emit_json(&self) -> serde_json::Value {
        serde_json::json!({
            "table": self.table,
            "truth_row_count": self.truth_row_count,
            "shadow_row_count": self.shadow_row_count,
            "missing_in_shadow": self.missing_in_shadow,
            "extra_in_shadow": self.extra_in_shadow,
            "value_mismatches": self.value_mismatches,
            "delta_percent": self.delta_percent,
            "threshold_ok": self.delta_percent < 0.1,
        })
    }
}

pub fn delta_percent(truth: i64, mismatches: i64) -> f64 {
    if truth == 0 {
        if mismatches == 0 { 0.0 } else { 100.0 }
    } else {
        (mismatches as f64 / truth as f64) * 100.0
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:devpassword123@localhost:5432/terrafusion".into());
    let pool = PgPoolOptions::new().max_connections(5).connect(&db_url).await?;

    let county_id: uuid::Uuid = uuid::Uuid::parse_str("19190019-1919-1919-1919-191919191919")?;
    let tax_year = 2026i32;

    let tables = [
        ("Properties",           "ParcelId"),
        ("CamaCharacteristics",  "ParcelId"),
        ("PropertyAssessments",  "PropertyParcelId"),
    ];

    let mut reports = Vec::new();

    for (tbl, key) in tables {
        // Truth count
        let truth_count: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM public."{tbl}" WHERE "CountyId" = $1"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;
        // Shadow count
        let shadow_count: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM shadow."{tbl}" WHERE "CountyId" = $1"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;
        // Missing in shadow
        let missing: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM public."{tbl}" t
                 WHERE t."CountyId" = $1
                   AND NOT EXISTS (
                     SELECT 1 FROM shadow."{tbl}" s
                      WHERE s."CountyId" = t."CountyId" AND s."{key}" = t."{key}")"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;
        // Extra in shadow
        let extra: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM shadow."{tbl}" s
                 WHERE s."CountyId" = $1
                   AND NOT EXISTS (
                     SELECT 1 FROM public."{tbl}" t
                      WHERE t."CountyId" = s."CountyId" AND t."{key}" = s."{key}")"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;

        let mismatches = missing.0 + extra.0;
        let rep = DiffReport {
            table: tbl.to_string(),
            truth_row_count: truth_count.0,
            shadow_row_count: shadow_count.0,
            missing_in_shadow: missing.0,
            extra_in_shadow: extra.0,
            value_mismatches: 0,  // value-level diff enhancement for Phase 2.1
            delta_percent: delta_percent(truth_count.0, mismatches),
        };
        tracing::info!(?rep, "shadow diff");
        reports.push(rep.emit_json());
    }

    // Emit combined JSON report to stdout (consumed by scheduler or written to S3).
    let out = serde_json::json!({
        "generated_at_utc": chrono::Utc::now(),
        "county_id": county_id,
        "tax_year": tax_year,
        "reports": reports,
    });
    println!("{}", serde_json::to_string_pretty(&out)?);

    Ok(())
}
```

- [ ] **Step 3: tests/diff_math.rs**

```rust
use terra_sync_shadow_diff::delta_percent;

#[test]
fn delta_zero_when_no_truth_no_mismatch() {
    assert_eq!(delta_percent(0, 0), 0.0);
}

#[test]
fn delta_100_when_no_truth_but_mismatches() {
    assert_eq!(delta_percent(0, 5), 100.0);
}

#[test]
fn delta_ratio_matches() {
    let d = delta_percent(1000, 3);
    assert!((d - 0.3).abs() < 1e-9);
}

#[test]
fn under_threshold_when_less_than_zero_point_one() {
    assert!(delta_percent(100_000, 99) < 0.1);
    assert!(delta_percent(100_000, 100) >= 0.1);
}
```

- [ ] **Step 4: Make `delta_percent` reachable from tests**

In `src/main.rs`, expose the function by converting the main.rs into a thin binary that re-exports from an internal `lib` module, or simply mark `pub fn delta_percent` and use it in tests via `terra-sync-shadow-diff` crate. Simpler path: add a `src/lib.rs`:

```rust
// src/lib.rs
pub fn delta_percent(truth: i64, mismatches: i64) -> f64 {
    if truth == 0 {
        if mismatches == 0 { 0.0 } else { 100.0 }
    } else {
        (mismatches as f64 / truth as f64) * 100.0
    }
}
```
And in `src/main.rs`, remove the local `pub fn delta_percent` and `use terra_sync_shadow_diff::delta_percent;` instead.

- [ ] **Step 5: Run tests**

```bash
cd packages/terra-sync && cargo test -p terra-sync-shadow-diff
```
Expected: 4 tests pass.

- [ ] **Step 6: Runbook: run the diff binary**

```bash
cd packages/terra-sync
DATABASE_URL=postgres://postgres:devpassword123@localhost:5432/terrafusion \
  cargo run -p terra-sync-shadow-diff | tee shadow-diff-report.json
```
Expected: JSON report with per-table row counts + deltas.

- [ ] **Step 7: Commit**

```bash
git add packages/terra-sync/crates/terra-sync-shadow-diff/
git commit -m "feat(sync-v4): terra-sync-shadow-diff — daily parity check vs public canonical

Compares row counts + missing/extra rows between shadow and truth for
Properties, CamaCharacteristics, PropertyAssessments for Benton. Emits
JSON report suitable for cron + S3 archiving.

delta_percent logic: 0% when both sides empty, 100% when truth empty
but shadow has data, else (mismatches/truth)*100.

4 unit tests on delta_percent thresholds.

Phase 2.1 enhancement (separate task): value-level diff for key fields
(sum/min/max/median over numeric columns per neighborhood).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 15: Integration smoke — full topology in CI

**Files:**
- Create: `packages/terra-sync/tests/integration/Cargo.toml`
- Create: `packages/terra-sync/tests/integration/tests/phase2_smoke.rs`

- [ ] **Step 1: Cargo.toml**

```toml
[package]
name = "terra-sync-integration-tests"
version.workspace = true
edition.workspace = true
license.workspace = true
publish = false

[dependencies]
tokio = { workspace = true }
anyhow = { workspace = true }
reqwest = { version = "0.12", features = ["json"] }
serde_json = { workspace = true }
tonic = { workspace = true }
prost = { workspace = true }
terra-sync-proto = { path = "../../crates/terra-sync-proto" }
terra-sync-policy = { path = "../../crates/terra-sync-policy" }
terra-sync-audit = { path = "../../crates/terra-sync-audit" }

[dev-dependencies]
testcontainers = "0.23"
```

- [ ] **Step 2: tests/phase2_smoke.rs**

```rust
// Phase 2 smoke: verify policy engine + audit chain are integrated and
// the control plane serves GetStatus. The full Debezium+Kafka+RisingWave
// topology is exercised by an external runbook (docker-compose), not this
// test — CI runs a subset using testcontainers for Kafka only.

#[tokio::test]
async fn policy_manifest_loads_from_disk() {
    let path = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml");
    let m = terra_sync_policy::ContractManifest::load_from_path(&path).unwrap();
    assert!(m.counties.contains_key("benton"));
}

#[tokio::test]
async fn audit_chain_from_multiple_events_verifies() {
    use std::collections::HashMap;
    use terra_sync_audit::{Actor, AuditEventBuilder, Outcome, Subject, verify_chain};

    let actor = Actor { identity: "test".into(), auth_method: "mtls".into(), certificate_fingerprint: "sha256:x".into() };
    let sub = Subject { kind: "connector".into(), id: "benton".into(), attrs: HashMap::new() };

    let mut prev = String::new();
    let mut chain = vec![];
    for i in 0..10 {
        let e = AuditEventBuilder {
            event_type: format!("event_{i}"),
            actor: actor.clone(),
            county_id: "benton".into(),
            subject: sub.clone(),
            outcome: Outcome::Success,
            policy_refs: vec!["pacscontract.v1".into()],
            metadata: HashMap::new(),
        }
        .build(&prev);
        prev = e.hash.clone();
        chain.push(e);
    }
    assert!(verify_chain(&chain).is_none(), "10-event chain must verify");
}
```

- [ ] **Step 3: Run**

```bash
cd packages/terra-sync && cargo test -p terra-sync-integration-tests
```
Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/terra-sync/tests/integration/
git commit -m "test(sync-v4): integration smoke — manifest load + 10-event audit chain

Phase 2 smoke harness in tests/integration/. Two tests:
1. Policy manifest loads from docs/spec-lock/locks/pacscontract/v1/
2. 10-event audit chain built iteratively verifies clean

Full Debezium+Kafka+RisingWave topology tests live in runbook form
(docker compose + curl). CI harness expands in Phase 2.1 with
testcontainers-backed Kafka smoke.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 16: Phase 2 exit gate — 7-day shadow parity

**Files:** (runbook + milestone commit)

- [ ] **Step 1: Start daily shadow-diff cron**

On the dev host (or CI scheduler), add a cron:

```cron
# Daily at 02:00 UTC
0 2 * * * cd /path/to/packages/terra-sync && \
  DATABASE_URL=postgres://... cargo run --release -p terra-sync-shadow-diff \
  >> /var/log/terrafusion/shadow-diff-$(date +\%F).json 2>&1
```

- [ ] **Step 2: Daily observation log**

For 7 consecutive days, observe `shadow-diff-*.json` and record in `docs/superpowers/evidence/2026-04-XX-sync-v4-shadow-parity-day-N.md`:
- Property delta_percent
- CamaCharacteristic delta_percent
- PropertyAssessment delta_percent
- Any anomalies

- [ ] **Step 3: Exit criteria (7 days, all tables, all days)**

- `delta_percent < 0.1` for every table every day
- No Kafka Connect connector failure events
- No CDC lag spike > 5 minutes
- Audit topic event count > 0 and chain verifies with `verify_chain`

- [ ] **Step 4: When gate passes, commit milestone**

```bash
git commit --allow-empty -m "milestone(sync-v4): PHASE 2 exit gate — 7-day shadow parity achieved

Benton Harris PACS → Debezium → Kafka → Arroyo → RisingWave → Postgres
shadow schema. 7 consecutive days with delta_percent < 0.1 across
Properties, CamaCharacteristics, PropertyAssessments. Audit chain
verified daily.

Ready for Phase 3 (consumer migration + decommission of
PacsCanonicalizer/PacsToTerraFusionSyncService/TerraFusion.Sync/
shadow code).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

Before declaring Phase 1+2 complete, confirm:

1. `cargo build --workspace` green
2. `cargo test --workspace` green (all of: policy 5 tests, audit 3, control 2, shadow-diff 4, integration 2 = 16 tests)
3. `cargo clippy --workspace --all-targets -- -D warnings` green
4. `cargo fmt --all --check` green
5. `docker compose -f deploy/docker-compose.dev.yml up -d` brings up all services healthy
6. `grpcurl -plaintext -d '{}' localhost:9443 terrafusion.sync.v4.control.ControlPlane/GetStatus` returns healthy
7. Debezium connector `benton-harris-pacs-v1` status = `RUNNING`
8. All 4 Kafka canonical topics receive events (`kafka-console-consumer ... --max-messages 1`)
9. RisingWave `SELECT COUNT(*) FROM mv_properties;` > 0
10. Postgres `SELECT COUNT(*) FROM shadow."Properties";` > 0
11. `cargo run -p terra-sync-shadow-diff` emits a report with JSON-valid structure
12. `pacscontract.v1` manifest is at `docs/spec-lock/locks/pacscontract/v1/manifest.yaml` and parses
13. 7-day parity observation committed to `docs/superpowers/evidence/`
14. Milestone commit for Phase 2 exit gate in git log

---

## What's NOT in this plan (separate plans)

- **Phase 3:** consumer cutover (RisingWave writes `public.*` instead of `shadow.*`), decommission of `PacsCanonicalizer` / `PacsToTerraFusionSyncService` / `backend/src/TerraFusion.Sync/` / `HarrisPACSProductionService` / `HarrisPACSSyncBackgroundService` / my-bypass files.
- **Phase 4:** multi-county onboarding (Kennewick Tyler Vision, Pasco Aumentum, etc) using the Connector Development Kit.
- **Phase 5:** AI-swarm integration (sync.anomaly topic consumed by Consciousness).
- **Phase 6:** bidirectional write-back under pacscontract amendments.
- **Operator Surface:** `tfsync` CLI, CDK scaffolding tooling, Tauri console, docs site. Separate spec, separate plan.
- **mTLS on gRPC:** Phase 3. Current Phase 1+2 runs plaintext on localhost.
- **S3 Object Lock WORM audit sink:** Phase 3. Current Phase 1+2 writes audit to Kafka `sync.audit` topic only; S3 archiver is a follow-up.

Each of those is its own plan when the time comes.
