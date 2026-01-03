# Deploy Apply + Receipt Constitution v1.0.0 — SpecLock

> **Status**: LOCKED — Amendment requires RFC + Breaker approval + shadow review  
> **Created**: 2024-12-19  
> **References**: DEPLOY_RUNTIME_CONSTITUTION_v1.1.0_SPECLOCK.md, RuntimeCert Bundle Constitution

## Overview

This SpecLock defines **Phase 3** of the Deploy Constitution: actual execution orchestration from a verified RuntimeCert bundle, with immutable deployment receipts.

## Commands

### 1. `tf deploy apply`

```bash
tf deploy apply --env <dev|techsupport|prod> --bundle <dir> [--dry-run] [--ci]
```

**Purpose**: Execute deployment from a verified RuntimeCert bundle.

**Required Flags**:
- `--env <env>`: Target environment (dev, techsupport, prod)
- `--bundle <dir>`: Path to RuntimeCert bundle directory

**Optional Flags**:
- `--dry-run`: Validate and produce receipt without executing mutations
- `--ci`: JSON-only output to stdout

### 2. `tf deploy receipt`

```bash
tf deploy receipt --bundle <dir> [--ci]
```

**Purpose**: Read and output existing deployment receipt from bundle.

**Required Flags**:
- `--bundle <dir>`: Path to RuntimeCert bundle directory

**Optional Flags**:
- `--ci`: JSON-only output to stdout

---

## Exit Codes

| Code | Meaning | Examples |
|------|---------|----------|
| 0 | Success or dry_run | Deployment completed, dry-run passed |
| 1 | Failure | Verify failed, execution failed, missing receipt |
| 2 | Invalid invocation | Missing flags, invalid env, unsupported mode, bad paths |

---

## Core Invariants

### A. Verify-First (Hard Precondition)

`apply` **MUST** run `tf release verify --bundle <dir>` before any execution.

- If verify fails: exit 1, no side effects, receipt NOT written
- Verify output captured for receipt steps

### B. Mode Detection (No Assumptions)

Mode detection uses existing `detect_mode()` function:
- `k8s`: kubectl available and namespace exists
- `compose`: docker-compose fallback
- `unknown`: neither available

**Supported modes for v1.0.0**: None (governance-only phase)

If apply is invoked and mode is unsupported:
- Exit 2 with `error.code=unsupported_mode`
- No receipt written for invalid invocation

### C. Dry-Run Safety

When `--dry-run` is specified:
1. All validations run (verify, preflight)
2. Execute step marked as `skip` with message "dry_run"
3. Health step marked as `skip` with message "dry_run"
4. Receipt written with `status="dry_run"` and `action="dry_run"`
5. **MUST NOT** mutate cluster/docker state

### D. Receipt Creation (Immutable Audit Artifact)

**Location**: `<bundle>/proofs/deploy_receipt.json`

**Write conditions**:
- SUCCESS: Receipt written with `status="success"`
- DRY_RUN: Receipt written with `status="dry_run"`
- EXECUTION FAILURE (after mutation attempt): Receipt written with `status="failed"`
- INVALID INVOCATION: No receipt written (exit 2)
- VERIFY FAILURE: No receipt written (exit 1)

**Atomic write**: Write to temp file, then `mv` to final location.

---

## Receipt Schema v1.0.0

```json
{
  "version": "1.0.0",
  "timestamp": "<RFC3339Z>",
  "environment": "dev|techsupport|prod",
  "mode": "k8s|compose|unknown",
  "bundle": {
    "path": "<sanitized absolute path>",
    "hash": "<sha256 of checksums.sha256 file>",
    "verified": true
  },
  "git": {
    "sha": "<HEAD sha or null>",
    "tag": "<exact tag or null>"
  },
  "action": "apply|dry_run",
  "status": "success|failed|dry_run",
  "steps": [
    {"name": "verify", "status": "pass|fail", "message": "..."},
    {"name": "preflight", "status": "pass|fail", "message": "..."},
    {"name": "execute", "status": "pass|fail|skip", "message": "..."},
    {"name": "health", "status": "pass|fail|skip", "message": "..."}
  ],
  "error": {"code": "...", "message": "..."} | null
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| version | string | Schema version "1.0.0" |
| timestamp | string | RFC3339 UTC timestamp |
| environment | string | Target environment |
| mode | string | Detected orchestration mode |
| bundle.path | string | Sanitized absolute bundle path |
| bundle.hash | string | SHA256 of checksums.sha256 |
| bundle.verified | boolean | Always true if receipt written |
| git.sha | string\|null | Current HEAD SHA |
| git.tag | string\|null | Exact tag match or null |
| action | string | "apply" or "dry_run" |
| status | string | Final status |
| steps | array | Step execution results |
| error | object\|null | Error details if failed |

### Steps Array

Each step has:
- `name`: Step identifier (verify, preflight, execute, health)
- `status`: "pass", "fail", or "skip"
- `message`: Human-readable description

---

## CI Purity

When `--ci` flag is present:

1. **JSON-only stdout**: No ANSI codes, no extra text
2. **Valid JSON**: Must parse with `python3 -m json.tool`
3. **Deterministic**: Keys sorted alphabetically where possible

### Error JSON Schema

For invalid invocations (exit 2):
```json
{
  "version": "1.0.0",
  "timestamp": "<RFC3339Z>",
  "status": "error",
  "operation": "apply|receipt",
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<description>"
  }
}
```

Error codes:
- `MISSING_ENV`: --env flag required
- `MISSING_BUNDLE`: --bundle flag required
- `INVALID_ENV`: Invalid environment value
- `INVALID_BUNDLE_PATH`: Path validation failed
- `UNSUPPORTED_MODE`: Mode not supported for apply
- `MISSING_RECEIPT`: Receipt file not found (receipt command)

---

## Mode Support Matrix v1.0.0

| Mode | Supported | Notes |
|------|-----------|-------|
| k8s | NO | Governance-only phase; future v1.1.0 |
| compose | NO | Governance-only phase; future v1.1.0 |
| unknown | NO | Never supported |

**v1.0.0 behavior**: All apply invocations result in:
- `execute` step: `status="skip"`, `message="v1.0.0 governance-only"`
- `health` step: `status="skip"`, `message="v1.0.0 governance-only"`
- Overall `status="success"` (governance checks passed)

---

## File Paths

| Path | Purpose |
|------|---------|
| `<bundle>/proofs/deploy_receipt.json` | Deployment receipt |
| `<bundle>/checksums.sha256` | Bundle integrity hashes |
| `<bundle>/manifest.json` | Bundle manifest |

---

## Security Considerations

1. **Path sanitization**: Bundle paths sanitized for JSON (no control chars, newlines)
2. **Atomic writes**: Receipt uses temp + mv to prevent partial writes
3. **No execution in v1.0.0**: Mitigates risk during governance establishment
4. **Verify-first**: Ensures bundle integrity before any action

---

## Amendment Process

Changes to this SpecLock require:
1. RFC document with justification
2. Breaker review (all governance tests GREEN)
3. Shadow review against historical bundles
4. Tag version bump (e.g., v1.1.0-deploy-apply-receipt-constitution)

---

## AGENT NOTES

### NOTES_NOW
- v1.0.0 is governance-only; execute/health always skip
- Real orchestration deferred to v1.1.0

### RISKS_FOUND
- Receipt file could be pre-created with invalid content (breaker test)
- Race between verify and receipt write (document, mitigate in v1.1.0)

### DECISIONS
- Atomic write via temp + mv for receipt
- Unsupported mode = exit 2 (invalid invocation)
- v1.0.0 governance-only: execute/health skip but receipt written

### TODO_NEXT_SESSION
- v1.1.0: Add k8s apply support with kubectl integration
- v1.1.0: Add compose apply support
- Add re-verify before receipt write as race mitigation
