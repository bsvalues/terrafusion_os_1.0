# Phase 1 Exit Gate

Phase 1 of TerraFusion Sync v4 is complete when every item below passes.
Phase 2 (Debezium connector + Arroyo pipelines + RisingWave MVs + shadow
parity gate) starts only after this checklist is green.

## What Phase 1 shipped

- `terra-sync-proto` — gRPC contracts (ControlPlane, Policy, Audit)
- `terra-sync-policy` — pacscontract.v1 evaluator with amendment
  escape hatch sealed at load time
- `terra-sync-audit` — SHA-256 hash-chained AuditEvent model
  (BTreeMap-deterministic) + Kafka emitter (feature-gated)
- `terra-sync-control` — binary loading pacscontract.v1, serving gRPC
  ControlPlane/GetStatus, /health, /ready, /metrics, graceful shutdown,
  audit transport honesty (reports "degraded-null" vs "ready")
- Local dev topology: Kafka + Debezium Connect + RisingWave + OTel +
  Prometheus + Grafana via docker-compose
- CI: fmt + clippy + build + test on default features, clippy + build
  on `--features kafka` (with cmake), docker compose config validation

## Checklist

### 1. Rust workspace health

```bash
cd packages/terra-sync
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```
Expected: green on all three commands. Test count ≥ 26
(9 policy unit + 5 policy integration + 8 audit + 1 control +
3 control integration as of this commit).

### 2. Dev topology boots

```bash
cd packages/terra-sync/deploy
docker compose -f docker-compose.dev.yml up -d
sleep 60
docker compose -f docker-compose.dev.yml ps
```
Expected: all 7 services in `running` state.

### 3. Phase 2 topics provisioned

```bash
cd packages/terra-sync/deploy
./bin/create-topics.sh
```
Expected: 11 topics listed; `sync.audit` among them.

### 4. Control plane runs and serves gRPC

Terminal 1:
```bash
cd packages/terra-sync/crates/terra-sync-control
SYNC_CONTROL_CONFIG=config/control-plane.dev.yaml cargo run -p terra-sync-control
```
Without `--features kafka`, audit transport is NullAudit — events
increment `terra_sync_audit_events_dropped_total` but do not reach Kafka.
Acceptable for Phase 1; Phase 3 adds the prod shape.

Terminal 2:
```bash
grpcurl -plaintext -d '{}' localhost:9443 \
  terrafusion.sync.v4.control.ControlPlane/GetStatus | jq .
```
Expected fields:
- `version` matches `CARGO_PKG_VERSION` of terra-sync-control
- `healthy: true`
- `component_states["control_plane"] == "running"`
- `component_states["policy_engine"] == "ready"`
- `component_states["audit_transport"] == "degraded-null"`
- `component_states["audit_backend"] == "null"`
- `component_states["metrics_server"] == "ready"`
- `component_states["uptime_seconds"]` present

### 5. Metrics + health

```bash
curl -sf http://localhost:9090/health    # ok
curl -sf http://localhost:9090/ready     # ok
curl -sf http://localhost:9090/metrics | head -5
```
Expected: Prometheus-format output.

### 6. Policy evaluator rejects unauthorized writeback

Out of scope for the gRPC surface in Phase 1. Indirect evidence:
14 policy crate tests pass under `cargo test -p terra-sync-policy`.
Direct evaluation endpoint arrives in Phase 2.

### 7. Audit chain verification on live Kafka events

Out of scope for Phase 1 (no emission path wired end-to-end).
Indirect evidence: 8 audit crate tests pass, including tamper
detection and BTreeMap round-trip stability. End-to-end verification
is the Phase 2 shadow-parity gate (Task 16).

### 8. Graceful shutdown

```bash
# In terminal 1 (control plane), send Ctrl+C.
# Expected log line: "shutdown signal received"
# Expected final line: "gRPC server stopped"
```

## Exit criteria

Phase 1 exits when items 1–5 and 8 are green on a fresh clone.
Items 6 and 7 are known gaps Phase 2 closes.

## What Phase 1 deliberately does not do

- No end-to-end data flow (Debezium → Arroyo → RisingWave): Phase 2.
- No mTLS, no signed amendments, no WORM S3 audit sink: Phase 3.
- No operator CLI, no TUI: deferred per the operator-surface spec.
- No multi-county: Benton only in Phase 2; horizontal scale Phase 3+.
