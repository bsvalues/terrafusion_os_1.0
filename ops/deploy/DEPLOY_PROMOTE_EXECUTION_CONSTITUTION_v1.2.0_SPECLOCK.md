# Deploy Promotion Execution Constitution v1.2.0 — SPECLOCK

**Status:** FROZEN  
**Effective:** 2024-12-20  
**Supersedes:** v1.1.0 promote placeholder  
**Depends On:** DEPLOY_APPLY_K8S_HEALTH_RECEIPT_CONSTITUTION_v1.1.0

---

## Overview

Promotion execution enables auditable, fail-closed deployment progression across the environment chain: `dev → techsupport → prod`. This constitution extends v1.1.0 apply+health with receipt chain verification and promotion-specific invariants.

---

## Scope

### In Scope (v1.2.0)
- Kubernetes deployments only (MODE == k8s)
- Forward-only promotions: dev→techsupport, techsupport→prod
- Receipt chain model (append-only, immutable)
- `tf deploy promote` execution with namespace/timeout
- `tf deploy history` read-only chain query

### Out of Scope
- Docker Compose deployments
- Backward promotions (prod→dev, etc.)
- Cross-cluster promotions
- Auto-rollback on failure

---

## Commands

### 1. `tf deploy promote` (Execution)

```bash
# Long form (explicit from/to)
tf deploy promote --from <dev|techsupport> --to <techsupport|prod> \
    --bundle <dir> --namespace <ns> [--timeout <sec>] [--dry-run] [--ci]

# Short form (env implies from)
tf deploy promote --env <techsupport|prod> \
    --bundle <dir> --namespace <ns> [--timeout <sec>] [--dry-run] [--ci]
```

**Short form mapping:**
| `--env` | Implied `--from` | Implied `--to` |
|---------|------------------|----------------|
| techsupport | dev | techsupport |
| prod | techsupport | prod |

### 2. `tf deploy history` (Read-Only)

```bash
tf deploy history --bundle <dir> [--ci]
```

Returns the promotion chain for a bundle.

---

## Receipt Chain Model

### Directory Structure

```
<bundle>/
├── manifest.json
├── checksums.sha256
├── proofs/
│   ├── gate.json
│   ├── agent.json
│   └── ...
├── k8s/
│   └── *.yaml
└── receipts/                    # NEW in v1.2.0
    ├── apply_dev.json           # Created by first apply to dev
    ├── apply_techsupport.json   # Created by apply to techsupport
    ├── apply_prod.json          # Created by apply to prod
    ├── promote_dev_techsupport_<ts>.json
    └── promote_techsupport_prod_<ts>.json
```

### Receipt Naming Convention

| Receipt Type | Filename Pattern | Created By |
|--------------|------------------|------------|
| Apply | `apply_<env>.json` | `tf deploy apply --env <env>` |
| Promote | `promote_<from>_<to>_<ts>.json` | `tf deploy promote` |

Where `<ts>` is ISO8601 compact: `YYYYMMDDTHHMMSSZ`

### Apply Receipt Schema (v1.2.0 extension)

The existing v1.1.0 apply receipt is written to `receipts/apply_<env>.json`:

```json
{
  "version": "1.2.0",
  "timestamp": "2024-12-20T10:30:00Z",
  "environment": "dev",
  "mode": "k8s",
  "bundle": {
    "path": "/path/to/bundle",
    "hash": "sha256:...",
    "verified": true
  },
  "git": {
    "sha": "abc123",
    "tag": "v1.0.0"
  },
  "action": "apply",
  "status": "success",
  "steps": [...],
  "error": null,
  "k8s": {
    "context": "minikube",
    "namespace": "terrafusion-dev",
    "applied": [...],
    "rollout": [...],
    "timeout_config": {...}
  }
}
```

### Promote Receipt Schema (v1.2.0)

```json
{
  "version": "1.2.0",
  "timestamp": "2024-12-20T11:00:00Z",
  "operation": "promote",
  "source_env": "dev",
  "target_env": "techsupport",
  "bundle": {
    "path": "/path/to/bundle",
    "hash": "sha256:..."
  },
  "source_receipt": {
    "path": "receipts/apply_dev.json",
    "hash": "sha256:...",
    "timestamp": "2024-12-20T10:30:00Z"
  },
  "target_receipt": {
    "path": "receipts/apply_techsupport.json",
    "hash": "sha256:...",
    "timestamp": "2024-12-20T11:00:00Z"
  },
  "k8s": {
    "context": "minikube",
    "namespace": "terrafusion-techsupport",
    "timeout_config": {
      "per_deployment": 120,
      "applied": 120
    }
  },
  "status": "success|failed|dry_run",
  "error": null | { "code": "...", "message": "..." }
}
```

### History Output Schema (v1.2.0)

```json
{
  "version": "1.2.0",
  "timestamp": "2024-12-20T12:00:00Z",
  "bundle": "/path/to/bundle",
  "chain": [
    {
      "type": "apply",
      "env": "dev",
      "timestamp": "2024-12-20T10:30:00Z",
      "status": "success",
      "receipt": "receipts/apply_dev.json"
    },
    {
      "type": "promote",
      "from": "dev",
      "to": "techsupport",
      "timestamp": "2024-12-20T11:00:00Z",
      "status": "success",
      "receipt": "receipts/promote_dev_techsupport_20241220T110000Z.json"
    },
    {
      "type": "apply",
      "env": "techsupport",
      "timestamp": "2024-12-20T11:00:00Z",
      "status": "success",
      "receipt": "receipts/apply_techsupport.json"
    }
  ],
  "current_stage": "techsupport",
  "next_promotion": "techsupport → prod"
}
```

---

## Constitutional Invariants

### A) Gate-First (Exit 1)
Promote MUST pass gate check before any mutations.
- Failure: exit 1, error.code="GATE_FAILED", NO receipts written.

### B) No Active Sessions (Exit 1)
Promote blocked if agent session is active.
- Failure: exit 1, error.code="ACTIVE_SESSION", NO receipts written.

### C) Valid Promotion Pairs Only (Exit 2)
Only forward promotions allowed:
| From | To | Valid |
|------|-----|-------|
| dev | techsupport | ✅ |
| techsupport | prod | ✅ |
| dev | prod | ❌ |
| techsupport | dev | ❌ |
| prod | * | ❌ |

- Failure: exit 2, error.code="INVALID_PROMOTION"

### D) Source Receipt Required (Exit 1)
Promotion requires prior-stage apply receipt exists and is valid:
| Promotion | Required Source Receipt |
|-----------|------------------------|
| dev→techsupport | `receipts/apply_dev.json` |
| techsupport→prod | `receipts/apply_techsupport.json` |

Validation:
1. File exists
2. JSON parses successfully
3. status == "success"
4. environment matches expected source env

- Missing: exit 1, error.code="MISSING_SOURCE_RECEIPT"
- Invalid/corrupt: exit 1, error.code="SOURCE_RECEIPT_INVALID"

### E) Bundle Verification (Exit 1)
Promote MUST verify bundle integrity via `tf release verify`.
- Failure: exit 1, error.code="VERIFY_FAILED"

### F) K8s Mode Required (Exit 2)
Promote requires MODE == k8s.
- Failure: exit 2, error.code="UNSUPPORTED_MODE"

### G) Namespace Required (Exit 2)
The `--namespace` flag is mandatory (fail-closed).
- Failure: exit 2, error.code="NAMESPACE_REQUIRED"

### H) Timeout Bounds
Timeout clamped to [10, 600] seconds. Default: 120.
Invalid timeout format: exit 2, error.code="TIMEOUT_INVALID"

### I) Execution via Sealed Apply (Internal)
Promotion MUST use the same apply logic as v1.1.0:
- kubectl toolchain validation
- Context validation
- Namespace sanitization + existence check
- k8s/ manifest directory check
- kubectl apply execution
- kubectl rollout status health checks
- Atomic receipt writing

### J) Dry-Run Semantics
With `--dry-run`:
1. Full validation (gate, session, source receipt, bundle verify)
2. NO kubectl apply/rollout calls
3. Write promotion receipt with status="dry_run"
4. NO target apply receipt written

### K) Receipt Immutability
Receipts are append-only:
- Apply receipts: ONE per env, overwritten on re-apply
- Promote receipts: APPEND new file with timestamp suffix
- Never delete or modify existing promote receipts

### L) CI Purity
With `--ci`:
- JSON-only stdout
- No ANSI escape codes
- kubectl output captured, not leaked
- All errors as structured JSON

---

## Exit Code Contract

| Code | Meaning |
|------|---------|
| 0 | Success or dry_run |
| 1 | Failure (gate/session/verify/receipt/apply/health) |
| 2 | Invalid invocation (flags/env/mode/promotion) |

---

## Error Codes

| Code | Exit | Trigger |
|------|------|---------|
| UNSUPPORTED_MODE | 2 | MODE != k8s |
| INVALID_INVOCATION | 2 | Missing required flags |
| INVALID_PROMOTION | 2 | Invalid from/to pair |
| NAMESPACE_REQUIRED | 2 | --namespace not provided |
| TIMEOUT_INVALID | 2 | Non-numeric or out-of-bounds timeout |
| GATE_FAILED | 1 | Gate preflight failed |
| ACTIVE_SESSION | 1 | Agent session in progress |
| MISSING_SOURCE_RECEIPT | 1 | Prior-stage apply receipt not found |
| SOURCE_RECEIPT_INVALID | 1 | Source receipt corrupt or wrong status |
| VERIFY_FAILED | 1 | Bundle verification failed |
| KUBECTL_MISSING | 1 | kubectl not in PATH |
| KUBE_CONTEXT_UNAVAILABLE | 1 | No active K8s context |
| NAMESPACE_NOT_FOUND | 1 | Target namespace doesn't exist |
| K8S_MANIFEST_MISSING | 1 | No k8s/ directory or manifests |
| APPLY_FAILED | 1 | kubectl apply failed |
| HEALTH_FAILED | 1 | kubectl rollout status failed |
| HEALTH_TIMEOUT | 1 | Rollout exceeded timeout |

---

## Execution Flow

### Promote Flow (non-dry-run)

```
1. Parse flags
   └─ Missing/invalid → exit 2

2. Validate promotion pair
   └─ Invalid pair → exit 2 INVALID_PROMOTION

3. Validate mode == k8s
   └─ MODE != k8s → exit 2 UNSUPPORTED_MODE

4. Check namespace provided
   └─ Missing → exit 2 NAMESPACE_REQUIRED

5. Gate check
   └─ Fail → exit 1 GATE_FAILED

6. Check no active session
   └─ Active → exit 1 ACTIVE_SESSION

7. Verify bundle (tf release verify)
   └─ Fail → exit 1 VERIFY_FAILED

8. Load + validate source receipt
   ├─ Missing → exit 1 MISSING_SOURCE_RECEIPT
   └─ Invalid → exit 1 SOURCE_RECEIPT_INVALID

9. Execute apply to target env
   ├─ kubectl validation fails → exit 1 KUBECTL_*
   ├─ Apply fails → exit 1 APPLY_FAILED
   └─ Health fails → exit 1 HEALTH_FAILED/TIMEOUT

10. Write target apply receipt
    └─ receipts/apply_<target_env>.json

11. Write promotion receipt
    └─ receipts/promote_<from>_<to>_<ts>.json

12. Output success
    └─ exit 0
```

### Dry-Run Flow

Same as above but steps 9-10 are skipped:
- Step 9: Validation only, no kubectl apply/rollout
- Step 10: NO target apply receipt
- Step 11: Write promotion receipt with status="dry_run"

---

## Receipt Hash Computation

Receipts reference each other by SHA256 hash of file contents:

```bash
sha256sum <file> | awk '{print $1}'
```

Stored as: `"hash": "sha256:<64-hex-chars>"`

---

## Flag Combinations

### Valid Combinations

| Flags | Valid | Notes |
|-------|-------|-------|
| `--from dev --to techsupport --bundle X --namespace Y` | ✅ | Long form |
| `--env techsupport --bundle X --namespace Y` | ✅ | Short form (from=dev) |
| `--env prod --bundle X --namespace Y` | ✅ | Short form (from=techsupport) |
| `--from X --to Y --bundle B --namespace N --timeout 300` | ✅ | Custom timeout |
| `--from X --to Y --bundle B --namespace N --dry-run` | ✅ | Dry run |
| `--from X --to Y --bundle B --namespace N --ci` | ✅ | CI mode |
| `--from X --to Y --bundle B --namespace N --dry-run --ci` | ✅ | Combined |

### Invalid Combinations

| Flags | Error |
|-------|-------|
| `--from dev --to prod` | INVALID_PROMOTION |
| `--from prod --to dev` | INVALID_PROMOTION |
| `--from techsupport --to dev` | INVALID_PROMOTION |
| `--env dev` | INVALID_PROMOTION (dev has no source) |
| `--from dev --to techsupport` (no --bundle) | INVALID_INVOCATION |
| `--from dev --to techsupport --bundle X` (no --namespace) | NAMESPACE_REQUIRED |
| `--from X --env Y` | INVALID_INVOCATION (conflicting) |

---

## Test Requirements (Minimum 28)

See `ops/dev/tests/test_deploy_promote_exec_v1_2_0_governance.sh`

---

## SPECLOCK HASH

```
SHA256: <computed-at-seal>
Frozen: 2024-12-20
```

---

## AGENT NOTES

### NOTES_NOW
- 

### RISKS_FOUND
- 

### DECISIONS
- Apply receipts go to receipts/apply_<env>.json (env-specific)
- Promote receipts append with timestamp suffix
- Source receipt hash verified by reading file and computing sha256
- Short form --env implies from based on env chain position

### TODO_NEXT_SESSION
- 
