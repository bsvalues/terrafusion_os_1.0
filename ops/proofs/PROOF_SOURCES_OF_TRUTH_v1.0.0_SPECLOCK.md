# Proof Sources of Truth v1.0.0 — SpecLock

**Status:** DRAFT  
**Created:** 2025-12-19  
**Frozen At:** _Pending implementation completion_  
**Rollback Anchor:** v1.0.0-proof-sources-of-truth

---

## 1. Constitutional Scope

This document defines **canonical proof emission** for all TerraFusion subsystems. Each subsystem MUST emit its own proof directly—no synthesis allowed.

**Problem Solved:**
- `tf release bundle` was synthesizing proofs instead of collecting them from authoritative sources
- No standard schema across subsystems
- No CI mode for agent/deploy proof collection

**New Commands (Canonical Proof Emitters):**
- `tf agent proof [--ci]`
- `tf deploy proof [--ci]`
- `tf marketplace proof [--ci]`

**Existing Canonical Emitter:**
- `tf gate [--ci]` (already compliant)

**Amendment Process:**  
Changes require: SpecLock update + RFC + breaker review + constitutional tag bump.

---

## 2. Canonical Proof Schema (v1.0.0)

All proof commands MUST emit JSON conforming to this schema when `--ci` is specified.

### Top-Level Fields (ALL REQUIRED)

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Schema version, always `"1.0.0"` |
| `timestamp` | string | RFC3339 UTC (e.g., `"2025-12-19T12:00:00Z"`) |
| `subsystem` | enum | One of: `"gate"`, `"agent"`, `"deploy"`, `"marketplace"` |
| `status` | enum | One of: `"pass"`, `"fail"`, `"warn"`, `"error"` |
| `summary` | object | See Summary Schema below |
| `checks` | array | Array of Check objects (see below) |
| `error` | object? | REQUIRED when `status=="error"`, else null/omitted |

### Summary Schema

```json
{
  "total": <int>,       // Total checks run
  "passed": <int>,      // Checks with status "pass"
  "failed": <int>,      // Checks with status "fail"
  "warnings": <int>,    // Checks with status "warn"
  "skipped": <int>      // Checks with status "skip"
}
```

### Check Schema

```json
{
  "id": <int|string>,   // Unique identifier (stable ordering key)
  "name": <string>,     // Kebab-case check name (e.g., "session-state-valid")
  "status": <enum>,     // One of: "pass", "fail", "warn", "skip"
  "message": <string>,  // Human-readable result description
  "details": <object?>  // Optional structured details (null if omitted)
}
```

### Error Schema (when status=="error")

```json
{
  "code": <string>,     // Machine-readable error code
  "message": <string>   // Human-readable error description
}
```

### Example: Successful Proof

```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-19T12:00:00Z",
  "subsystem": "agent",
  "status": "pass",
  "summary": {
    "total": 4,
    "passed": 4,
    "failed": 0,
    "warnings": 0,
    "skipped": 0
  },
  "checks": [
    {"id": 1, "name": "no-active-session", "status": "pass", "message": "No active session detected"},
    {"id": 2, "name": "gate-first-enforced", "status": "pass", "message": "Gate-first enforcement active"},
    {"id": 3, "name": "session-dir-valid", "status": "pass", "message": "Sessions directory structure valid"},
    {"id": 4, "name": "registry-writable", "status": "pass", "message": "Session registry writable"}
  ]
}
```

### Example: Invalid Invocation Error

```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-19T12:00:00Z",
  "subsystem": "agent",
  "status": "error",
  "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0, "skipped": 0},
  "checks": [],
  "error": {
    "code": "invalid_invocation",
    "message": "Unknown flag: --unknown"
  }
}
```

---

## 3. Command Definitions

### A. tf agent proof

**Usage:**
```bash
tf agent proof [--ci]
```

**Behavior:**
- Without `--ci`: Human-readable output with colors
- With `--ci`: JSON-only stdout, no ANSI codes

**Required Checks (Minimum):**

| ID | Name | Description |
|----|------|-------------|
| 1 | `no-concurrent-sessions` | ACTIVE_SESSION marker absent OR single session |
| 2 | `gate-first-enforced` | Gate check required before session start |
| 3 | `sessions-dir-valid` | Sessions directory exists and writable |
| 4 | `active-session-artifacts` | If active: CONTRACT.md, SPECLOCK.md, TESTPLAN.md exist |

**Exit Codes:**
- 0: status is "pass" or "warn"
- 1: status is "fail"
- 2: status is "error" (invalid invocation)

---

### B. tf deploy proof

**Usage:**
```bash
tf deploy proof [--ci]
```

**Behavior:**
- Without `--ci`: Human-readable output
- With `--ci`: JSON-only stdout

**Required Checks (Minimum):**

| ID | Name | Description |
|----|------|-------------|
| 1 | `bundle-required-enforced` | Deploy commands require --bundle |
| 2 | `env-validation-active` | Environment validation (dev/techsupport/prod) active |
| 3 | `no-active-session-enforced` | Deploy blocked during active agent sessions |
| 4 | `gate-first-enforced` | Deploy requires gate pass |
| 5 | `path-sanitization-active` | Bundle path traversal/injection protection active |

**Exit Codes:**
- 0: status is "pass" or "warn"
- 1: status is "fail"
- 2: status is "error" (invalid invocation)

---

### C. tf marketplace proof

**Usage:**
```bash
tf marketplace proof [--ci]
```

**Behavior:**
- Without `--ci`: Human-readable output
- With `--ci`: JSON-only stdout

**Required Checks (Minimum):**

| ID | Name | Description |
|----|------|-------------|
| 1 | `registry-valid` | Registry JSON parseable and schema-compliant |
| 2 | `capability-allowlist-enforced` | Fail-closed capability enforcement active |
| 3 | `state-machine-valid` | Plugin states (installed/enabled/disabled/quarantined) consistent |
| 4 | `bundle-validation-active` | Install requires valid bundle (manifest, SBOM, proofs) |
| 5 | `execution-containment-active` | Run command has timeout + process isolation |

**Exit Codes:**
- 0: status is "pass" or "warn"
- 1: status is "fail"
- 2: status is "error" (invalid invocation)

---

## 4. Error Codes

### Standard Error Codes (All Subsystems)

| Code | Exit | Description |
|------|------|-------------|
| `invalid_invocation` | 2 | Unknown flags, missing required args |
| `internal_error` | 2 | Unexpected failure (file I/O, parsing) |
| `missing_prerequisite` | 1 | Required file/dir missing |
| `policy_violation` | 1 | Governance check failed |

### Subsystem-Specific Error Codes

**Agent:**
- `concurrent_session_active` (1): Another session already active

**Deploy:**
- `bundle_not_found` (1): Bundle directory doesn't exist
- `bundle_verify_failed` (1): RuntimeCert verification failed

**Marketplace:**
- `registry_corrupt` (1): Registry JSON invalid
- `capability_denied` (1): Forbidden capability requested

---

## 5. CI Purity Requirements

### Hard Requirements

1. **JSON-only stdout**: No text, no progress, no ANSI codes in `--ci` mode
2. **Exit code contract**: 0=pass/warn, 1=fail, 2=error
3. **Deterministic ordering**: `checks` array ordered by `id` ascending
4. **Stable key ordering**: JSON keys in fixed order (version, timestamp, subsystem, status, summary, checks, error)
5. **No stderr pollution**: Errors go to stdout as JSON `error` field
6. **Timestamp precision**: RFC3339 with Z suffix, no milliseconds required

### Forbidden in --ci Mode

- ANSI escape codes (`\033[...`)
- Progress indicators (spinners, dots)
- Multi-line output (except JSON itself)
- Human-readable prefixes (✓, ✗, →)
- Stderr output (all errors in JSON)

---

## 6. Integration with tf release bundle

### Current Behavior (WRONG)

```bash
# tf release bundle currently SYNTHESIZES proofs:
cat > "$out_dir/proofs/agent.json" << EOF
{
  "source": "agent",
  "status": "pass",
  ...
}
EOF
```

### Required Behavior (CORRECT)

```bash
# tf release bundle MUST call canonical emitters:
agent_proof=$(./ops/dev/tf.sh agent proof --ci) || {
  _release_fail "$ci" "Failed to collect agent proof" "PROOF_COLLECTION_FAILED"
}
echo "$agent_proof" > "$out_dir/proofs/agent.json"
```

### Fail-Closed Requirement

If any proof command:
- Exits non-zero (1 or 2)
- Produces invalid JSON
- Is missing required fields

Then `tf release bundle` MUST fail with `PROOF_COLLECTION_FAILED`.

---

## 7. Backward Compatibility

### Preserved Behaviors

1. **Human output unchanged**: All existing human-readable output preserved
2. **Existing --ci flags**: Deploy/marketplace --ci behavior unchanged
3. **Gate --ci**: Already compliant, no changes needed
4. **Exit codes**: All subsystems already use 0/1/2 contract

### New Behaviors (Additive)

1. `tf agent proof` subcommand (NEW)
2. `tf deploy proof` subcommand (NEW)
3. `tf marketplace proof` subcommand (NEW)
4. `tf release bundle` calls canonical emitters (CHANGED)

---

## 8. Test Coverage Requirements

### Schema + Purity Tests (Per Subsystem: 3×6=18)

1. `proof --ci` outputs valid JSON
2. `proof --ci` has all required top-level fields
3. `proof --ci` has correct `subsystem` field value
4. `proof --ci` has non-empty `checks` array
5. `proof --ci` has no ANSI escape codes
6. `proof --ci` has deterministic `checks` ordering

### Exit Code Tests (Per Subsystem: 3×2=6)

7. Invalid flag → exit 2 + error.code="invalid_invocation"
8. Force-fail scenario → exit 1 + status="fail" (where feasible)

### Integration Tests (2)

9. `tf release bundle` calls proof commands (not synthesis)
10. Missing proof command → bundle fails closed

**Total: 26 minimum tests**

---

## 9. Implementation Checkpoints

### Phase 1: SpecLock (Current)
- [x] SpecLock created
- [ ] Test suite skeleton

### Phase 2: Builder Implementation
- [ ] Add `cmd_agent_proof()` function
- [ ] Add `cmd_deploy_proof()` function
- [ ] Add `cmd_marketplace_proof()` function
- [ ] Shared proof JSON helper functions
- [ ] Update `cmd_release_bundle()` to use emitters

### Phase 3: Breaker Validation
- [ ] JSON injection attacks (newlines, quotes)
- [ ] stdout pollution tests
- [ ] Schema drift detection
- [ ] Missing field detection

---

## 10. Related Constitutional Documents

- **Gate Constitution:** `ops/dev/GATE_QUICK_REFERENCE.md`
- **Agent Constitution:** `ops/agents/AGENT_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md`
- **Deploy Constitution:** `ops/deploy/DEPLOY_RUNTIME_CONSTITUTION_v1.1.0_SPECLOCK.md`
- **Marketplace Constitution:** `ops/marketplace/MARKETPLACE_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md`
- **RuntimeCert Constitution:** `ops/proofs/RUNTIMECERT_BUNDLE_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

**END OF SPECLOCK**

**Frozen At:** _Pending (will be set when tests GREEN + tag created)_
