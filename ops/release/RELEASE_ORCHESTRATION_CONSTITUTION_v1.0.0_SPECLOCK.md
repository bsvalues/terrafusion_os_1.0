# Release Orchestration Constitution v1.0.0 — SPECLOCK

**Status:** FROZEN  
**Effective:** 2024-12-22  
**Depends On:**
- RUNTIMECERT_BUNDLE_CONSTITUTION_v1.0.0
- DEPLOY_APPLY_K8S_HEALTH_RECEIPT_CONSTITUTION_v1.1.0
- DEPLOY_PROMOTE_EXECUTION_CONSTITUTION_v1.2.0
- DEPLOY_PROMOTION_POLICY_CONSTITUTION_v1.3.0

---

## Overview

Release Orchestration provides operator-grade commands that **compose** existing sealed subsystems into a single, auditable release workflow. This constitution adds **zero new execution logic**—all commands are wrappers that delegate to constitutional primitives.

**Design Principle:** Counties, auditors, and CIOs should understand releases through a single narrative, not 7 subsystems.

---

## Scope

### In Scope (v1.0.0)
- Operator-friendly wrapper commands for release lifecycle
- Composition of existing sealed primitives only
- JSON output in `--ci` mode
- Fail-closed error propagation from underlying commands
- Deterministic behavior with no new side effects

### Out of Scope
- New execution logic (all logic lives in v1.0.0-v1.3.0 constitutions)
- Canary/blue-green deployment patterns
- Cross-cluster orchestration
- Rollback automation
- Approval workflows

---

## Commands

### 1. `tf release prepare` (Bundle + Verify)

**Purpose:** Create and immediately verify a release bundle.

```bash
tf release prepare --out <dir> [--mode dev|techsupport|prod] [--force] [--ci]
```

**Composition:**
1. Calls `cmd_release_bundle --out <dir> --mode <mode> [--force] [--ci]`
2. If step 1 succeeds, calls `cmd_release_verify --bundle <dir> [--ci]`
3. Returns exit code from first failing step, or 0 if all pass

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Bundle created and verified |
| 1 | Bundle creation failed OR verification failed |
| 2 | Invalid invocation |

**JSON Output (`--ci`):**
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "status": "success|fail",
  "operation": "prepare",
  "bundle": "<absolute-path>",
  "steps": [
    {"name": "bundle", "status": "pass|fail", "message": "..."},
    {"name": "verify", "status": "pass|fail|skip", "message": "..."}
  ],
  "error": {"code": "<CODE>", "message": "..."} // only on failure
}
```

---

### 2. `tf release deploy` (Apply to Environment)

**Purpose:** Deploy a verified bundle to a specific environment.

```bash
tf release deploy --bundle <dir> --env <dev|techsupport|prod> \
    --namespace <ns> [--timeout <sec>] [--dry-run] [--ci]
```

**Composition:**
1. Calls `cmd_release_verify --bundle <dir> [--ci]` (preflight)
2. If step 1 passes, calls `cmd_deploy_apply --env <env> --bundle <dir> --namespace <ns> [--timeout <sec>] [--dry-run] [--ci]`
3. Returns exit code from first failing step, or 0 if all pass

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Deployment succeeded (or dry-run passed) |
| 1 | Verify failed OR deploy failed |
| 2 | Invalid invocation |

**JSON Output (`--ci`):**
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "status": "success|fail|dry_run",
  "operation": "deploy",
  "bundle": "<absolute-path>",
  "environment": "<env>",
  "namespace": "<ns>",
  "steps": [
    {"name": "verify", "status": "pass|fail", "message": "..."},
    {"name": "apply", "status": "pass|fail|skip", "message": "..."}
  ],
  "error": {"code": "<CODE>", "message": "..."} // only on failure
}
```

---

### 3. `tf release promote` (Forward Promotion with Policy)

**Purpose:** Promote a release from one environment to the next with policy enforcement.

```bash
tf release promote --bundle <dir> --to <techsupport|prod> \
    --namespace <ns> [--timeout <sec>] [--skip-freshness] [--dry-run] [--ci]
```

**Automatic Defaults:**
- `--from` is inferred: `techsupport` implies `--from dev`, `prod` implies `--from techsupport`
- `--require-chain` is always enabled
- `--require-freshness` is enabled unless `--skip-freshness` is passed

**Composition:**
1. Calls `cmd_release_verify --bundle <dir> [--ci]` (preflight)
2. Calls `cmd_deploy_policy --bundle <dir> [--ci]` (chain check)
3. If steps 1-2 pass, calls `cmd_deploy_promote --bundle <dir> --from <inferred> --to <to> --require-chain [--require-freshness] --namespace <ns> [--timeout <sec>] [--dry-run] [--ci]`
4. Returns exit code from first failing step, or 0 if all pass

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Promotion succeeded (or dry-run passed) |
| 1 | Verify failed OR policy failed OR promote failed |
| 2 | Invalid invocation |

**JSON Output (`--ci`):**
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "status": "success|fail|dry_run",
  "operation": "promote",
  "bundle": "<absolute-path>",
  "from_env": "<from>",
  "to_env": "<to>",
  "namespace": "<ns>",
  "policy": {
    "require_chain": true,
    "require_freshness": true|false
  },
  "steps": [
    {"name": "verify", "status": "pass|fail", "message": "..."},
    {"name": "policy", "status": "pass|fail", "message": "..."},
    {"name": "promote", "status": "pass|fail|skip", "message": "..."}
  ],
  "error": {"code": "<CODE>", "message": "..."} // only on failure
}
```

---

### 4. `tf release audit` (Full Chain Inspection)

**Purpose:** Comprehensive audit of release chain for compliance review.

```bash
tf release audit --bundle <dir> [--ci]
```

**Composition:**
1. Calls `cmd_release_verify --bundle <dir> [--ci]` (integrity)
2. Calls `cmd_deploy_history --bundle <dir> [--ci]` (chain)
3. Calls `cmd_deploy_policy --bundle <dir> [--ci]` (policy evaluation)
4. Aggregates results (does not fail-fast; collects all)

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | All checks pass |
| 1 | One or more checks failed |
| 2 | Invalid invocation |

**JSON Output (`--ci`):**
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "status": "pass|fail",
  "operation": "audit",
  "bundle": "<absolute-path>",
  "sections": {
    "integrity": {"status": "pass|fail", "summary": "..."},
    "chain": {"status": "pass|warn|fail", "count": N, "environments": [...]},
    "policy": {"status": "pass|warn|fail", "summary": "..."}
  },
  "overall": {
    "pass_count": N,
    "fail_count": N,
    "warn_count": N
  }
}
```

---

### 5. `tf release status` (Quick Health Check)

**Purpose:** Single-command health check for operators.

```bash
tf release status --bundle <dir> [--ci]
```

**Composition:**
1. Calls `cmd_release_verify --bundle <dir> [--ci]` (integrity)
2. Calls `cmd_deploy_receipt --bundle <dir> [--ci]` (latest state)
3. Returns combined status

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Bundle healthy, latest receipt available |
| 1 | Integrity failed OR no receipts found |
| 2 | Invalid invocation |

**JSON Output (`--ci`):**
```json
{
  "version": "1.0.0",
  "timestamp": "<ISO8601>",
  "status": "healthy|unhealthy",
  "operation": "status",
  "bundle": "<absolute-path>",
  "integrity": {"status": "pass|fail"},
  "latest_receipt": {
    "environment": "<env>",
    "timestamp": "<ISO8601>",
    "status": "<status>"
  } // null if no receipts
}
```

---

## Invariants (Constitutional)

### Rule A: Wrapper-Only Enforcement
All orchestration commands MUST delegate to existing sealed primitives.
No orchestration command may implement new business logic.

### Rule B: Fail-Closed Propagation
If any underlying command fails, the orchestration command MUST fail.
Exit codes from underlying commands propagate directly.

### Rule C: CI JSON Purity
All `--ci` output MUST be valid JSON with no ANSI codes.
Human-readable output MUST NOT appear in `--ci` mode.

### Rule D: No New Side Effects
Orchestration commands MUST NOT:
- Create files outside the bundle directory
- Modify system state beyond what underlying commands do
- Cache state between invocations

### Rule E: Deterministic Composition
Given identical inputs and underlying command behavior,
orchestration commands MUST produce identical outputs.

---

## Error Codes (Inherited)

Orchestration commands inherit error codes from underlying constitutions:

| Code | Source | Meaning |
|------|--------|---------|
| `BUNDLE_EXISTS` | RuntimeCert | Output dir exists without --force |
| `BUNDLE_INVALID` | RuntimeCert | Missing/corrupt manifest |
| `VERIFY_FAILED` | RuntimeCert | Checksum or proof failure |
| `DEPLOY_FAILED` | Deploy v1.1.0 | K8s apply failure |
| `HEALTH_FAILED` | Deploy v1.1.0 | Health check timeout |
| `MISSING_CHAIN` | Policy v1.3.0 | No promote receipts |
| `CHAIN_INTEGRITY_FAILED` | Policy v1.3.0 | Hash/time violations |
| `STALE_CHAIN` | Policy v1.3.0 | Freshness policy violated |
| `TIME_SKEW` | Policy v1.3.0 | Future timestamp detected |
| `INVALID_PROMOTION` | Promote v1.2.0 | Invalid from→to pair |

---

## Test Requirements

### Governance Tests (24 minimum)

**A. Invocation Validity (4 tests)**
- A1: `tf release prepare` without `--out` → exit 2
- A2: `tf release deploy` without `--bundle` → exit 2
- A3: `tf release promote` without `--to` → exit 2
- A4: `tf release audit --help` → exit 0

**B. Prepare Command (4 tests)**
- B1: Prepare with valid args → exit 0, bundle exists
- B2: Prepare with existing dir no --force → exit 1
- B3: Prepare + verify passes → JSON shows both steps pass
- B4: Prepare with invalid mode → exit 2

**C. Deploy Command (4 tests)**
- C1: Deploy with valid bundle → calls apply (mock)
- C2: Deploy with invalid bundle → exit 1, no apply called
- C3: Deploy --dry-run → exit 0, status=dry_run
- C4: Deploy --ci → valid JSON output

**D. Promote Command (4 tests)**
- D1: Promote --to techsupport → infers --from dev
- D2: Promote --to prod → infers --from techsupport
- D3: Promote without chain → exit 1 (--require-chain enforced)
- D4: Promote with --skip-freshness → freshness check skipped

**E. Audit Command (4 tests)**
- E1: Audit valid bundle → all sections present
- E2: Audit with chain → chain.count > 0
- E3: Audit invalid bundle → exit 1
- E4: Audit --ci → valid JSON, no ANSI

**F. Status Command (4 tests)**
- F1: Status healthy bundle → exit 0, status=healthy
- F2: Status corrupt bundle → exit 1, status=unhealthy
- F3: Status bundle no receipts → latest_receipt=null
- F4: Status --ci → valid JSON

### Breaker Tests (12 minimum)

- ATK-1: Inject ANSI in bundle path → no ANSI in --ci output
- ATK-2: Concurrent prepare to same dir → second fails
- ATK-3: Promote with tampered receipt → CHAIN_INTEGRITY_FAILED
- ATK-4: Audit with missing proofs/ → verify section fails
- ATK-5: Status with symlink bundle → follows or rejects safely
- ATK-6: Deploy with non-existent namespace → propagates error
- ATK-7: Prepare then delete during verify → atomic or fail
- ATK-8: Promote with clock skew → TIME_SKEW propagated
- ATK-9: Audit --ci with stderr noise → stdout clean JSON
- ATK-10: Status with huge receipt file → bounded resource use
- ATK-11: Deploy with path traversal → rejected
- ATK-12: Promote with invalid --to → exit 2

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-22 | Initial release orchestration constitution |

---

## Amendment Process

Changes to this constitution require:

1. Create SpecLock document for proposed changes
2. Submit RFC with evidence of necessity
3. Pass full governance + breaker test suites
4. Conduct shadow review against 10+ historical releases
5. Tag constitutional version bump

**SEALED:** This document is FROZEN upon commit.
