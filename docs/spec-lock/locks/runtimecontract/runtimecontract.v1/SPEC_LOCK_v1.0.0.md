# RuntimeContract v1.0.0 SpecLock

**Lock ID:** `runtimecontract.v1`
**Surface:** `runtimecontract`
**Version:** `1.0.0`
**Status:** `active`
**Owner:** `systemgpt`
**Created:** `2025-12-13`

---

## Purpose

Shell-agnostic constitutional runtime contract defining the **minimum viable government OS** requirements that ANY TerraFusion deployment shell (K8s, MicroVM, Appliance) MUST satisfy.

This is the **Governance Kernel** - the immutable core that County IT never modifies.

---

## Constitutional Requirements

### 1. Health Endpoints (REQUIRED)

| Endpoint | Method | Response | Failure Behavior |
|----------|--------|----------|------------------|
| `/healthz/ready` | GET | 200 OK / 503 Service Unavailable | MUST return 503 unless `speclock_ok=true` AND `state_mesh_ok=true` |
| `/healthz/proof` | GET | JSON (deterministic) | MUST return deterministic proof payload |
| `/ops/speclock` | GET | JSON manifest | MUST return current speclock manifest |
| `/ops/speclock/proof` | GET | JSON proof | MUST return speclock verification proof |
| `/ops/speclock/state/proof` | GET | JSON state proof | MUST return state mesh proof |

### 2. Readiness Contract

**Rule:** `/healthz/ready` MUST return HTTP 503 unless ALL of:
- SpecLock manifest loaded and verified
- State mesh artifacts verified
- Receipt storage accessible
- County configuration validated

**Rationale:** No traffic until constitutional invariants hold.

### 3. Proof Endpoint Contract (`/healthz/proof`)

**Response Schema (deterministic, lexicographic key order):**

```json
{
  "manifest_sha256": "^[a-f0-9]{64}$",
  "receipt_count": "integer >= 0",
  "speclock_ok": "boolean",
  "state_mesh_ok": "boolean",
  "state_proof_present": "boolean",
  "timestamp_epoch": "integer (unix epoch seconds)"
}
```

**Determinism Rules:**
- Keys MUST be sorted lexicographically
- SHA-256 MUST be lowercase hex
- Timestamp MUST be Unix epoch seconds (not milliseconds)
- No trailing whitespace

### 4. Metrics Contract (REQUIRED)

| Metric | Type | Description |
|--------|------|-------------|
| `tf_speclock_ok` | Gauge | 1 if speclock verified, 0 otherwise |
| `tf_state_mesh_ok` | Gauge | 1 if state mesh verified, 0 otherwise |
| `tf_receipt_count` | Gauge | Total receipts issued |
| `tf_runtime_boot_timestamp` | Gauge | Unix epoch of last boot |

### 5. Durable Storage Contract (REQUIRED)

| Path | Purpose | Persistence |
|------|---------|-------------|
| `${ARTIFACTS_ROOT}/receipts/` | Citizen receipts | Durable (survives restart) |
| `${ARTIFACTS_ROOT}/speclock/tss/state/` | TSS state artifacts | Durable |
| `${ARTIFACTS_ROOT}/speclock/manifest.json` | Current manifest | Durable |

**Environment Variable:** `ARTIFACTS_ROOT` (default: `/app/artifacts`)

### 6. Plugin Admission Contract (REQUIRED)

**Rule:** Any pod with label `terrafusion.io/plugin=true` MUST be validated before running.

**Validation Requirements:**
- `TF_SBOM_SHA256` environment variable present and valid
- `TF_SLSA_SHA256` environment variable present and valid
- `TF_BUNDLE_SHA256` environment variable present and valid
- Admission decision endpoint returns `allow=true`

**Enforcement:**
- Shell A (K8s): ValidatingAdmissionWebhook with `failPolicy: Fail`
- Shell B (MicroVM): Init process gate
- Both: `deny_beats_allow` policy

### 7. County vs TerraFusion Responsibilities

| Responsibility | Owner | Notes |
|----------------|-------|-------|
| Hardware provisioning | County IT | Servers, network, storage |
| Network configuration | County IT | Firewall, DNS, load balancer |
| TLS certificates | County IT (or TF-managed) | cert-manager or manual |
| Software deployment | TerraFusion | `tf-runtime apply` |
| Configuration updates | TerraFusion | Via sealed config |
| Runtime verification | TerraFusion | `tf-runtime verify` |
| Security patches | TerraFusion | Automated via CI |
| Data sovereignty | County | Data never leaves county boundary |

---

## Generated Artifacts

- `generated/runtimecontract.schema.json` - JSON Schema for proof endpoint
- `generated/runtimecontract.openapi.yaml` - OpenAPI spec for health endpoints
- `generated/runtimecontract.checklist.md` - Human-readable checklist

---

## Test Requirements

1. `schema_validates_proof_endpoint` - Proof response matches schema
2. `readiness_refuses_when_speclock_false` - 503 when speclock_ok=false
3. `readiness_refuses_when_statemesh_false` - 503 when state_mesh_ok=false
4. `proof_is_deterministic` - Same input → same output
5. `proof_keys_lexicographic` - Keys sorted alphabetically
6. `metrics_exist` - All required metrics present
7. `storage_paths_configurable` - ARTIFACTS_ROOT honored
8. `plugin_admission_denies_missing_sbom` - Missing SBOM → denied
9. `plugin_admission_denies_missing_slsa` - Missing SLSA → denied

---

## Breaking Changes Policy

Any change to:
- Endpoint paths
- Response schema fields
- Metric names
- Storage paths
- Admission requirements

...requires an Amendment via `amendment.v1` workflow with quorum >= 3.

---

## Related Locks

- `receipt.v1` - Receipt generation contract
- `pluginlock.v1` - Plugin permission envelope
- `amendment.v1` - Governance upgrade workflow
- `statereport.v1` - State-level report quorum
