# Deploy Promotion Policy Constitution v1.3.0 — SPECLOCK

**Status:** DRAFT  
**Effective:** 2024-12-22  
**Supersedes:** None (policy layer)  
**Depends On:** DEPLOY_PROMOTE_EXECUTION_CONSTITUTION_v1.2.0

---

## Overview

Promotion policy enforcement adds optional chain requirements and freshness validation on top of the v1.2.0 promote execution primitive. Policy is evaluated **before** K8s mutations, providing fail-closed governance.

---

## Scope

### In Scope (v1.3.0)
- Receipt chain requirement enforcement (optional, flag-controlled)
- Chain integrity validation (always, when receipts exist)
- Optional freshness enforcement (explicit flags only)
- Read-only policy evaluator (`tf deploy policy`)
- Deterministic time handling for tests (TF_NOW_EPOCH)

### Out of Scope
- New promotion paths (still dev→techsupport→prod only)
- Auto-remediation
- Policy configuration files (flags-only in v1.3.0)
- Approval workflows

---

## Commands

### 1. `tf deploy promote` (Extended)

Existing v1.2.0 surface + new policy flags:

```bash
tf deploy promote --from <env> --to <env> --bundle <dir> --namespace <ns> \
    [--require-chain] [--max-age <seconds>] [--require-freshness] \
    [--timeout <sec>] [--dry-run] [--ci]
```

**New Flags:**
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--require-chain` | bool | false | Enforce receipt chain exists before promote |
| `--max-age <sec>` | int | (none) | Max seconds since last receipt timestamp; implies --require-chain |
| `--require-freshness` | bool | false | Alias for --max-age 86400 (24 hours); implies --require-chain |

**Flag Interactions:**
- `--max-age` without value → exit 2 INVALID_INVOCATION
- `--max-age` implicitly sets `--require-chain=true`
- `--require-freshness` expands to `--max-age 86400 --require-chain`
- `--max-age` and `--require-freshness` both present → use explicit --max-age value

### 2. `tf deploy policy` (New - Read-Only)

```bash
tf deploy policy --bundle <dir> [--max-age <seconds>] [--ci]
```

Evaluates current bundle policy status without performing any mutations.

**Returns:** pass / warn / fail with detailed reasons.

---

## Policy Rules

### A) Receipt Chain Required (Optional - Flag Controlled)

**When Enforced:**
- `--require-chain` flag present, OR
- `--max-age` flag present, OR
- `--require-freshness` flag present

**Requirements by Promotion:**

| Promotion | Required Receipts |
|-----------|-------------------|
| dev→techsupport | `receipts/apply_dev.json` |
| techsupport→prod | `receipts/apply_techsupport.json` + at least one `promote_dev_techsupport_*.json` |

**Failure:** exit 1, error.code="MISSING_CHAIN"

**Note:** Without `--require-chain`, the existing v1.2.0 MISSING_SOURCE_RECEIPT behavior applies.

### B) Chain Integrity (Always Enforced When Receipts Exist)

If promotion receipts exist, validate:

1. **Source receipt reference exists:**
   - `source_receipt.path` file exists in bundle
   - Failure: exit 1, error.code="CHAIN_INTEGRITY_FAILED", reason="source_receipt_missing"

2. **Source receipt hash matches:**
   - Compute SHA256 of referenced file
   - Compare to `source_receipt.hash`
   - Failure: exit 1, error.code="CHAIN_INTEGRITY_FAILED", reason="source_hash_mismatch"

3. **Target receipt reference exists (if present):**
   - `target_receipt.path` file exists (may be null for dry_run)
   - Failure: exit 1, error.code="CHAIN_INTEGRITY_FAILED", reason="target_receipt_missing"

4. **Target receipt hash matches (if present):**
   - Failure: exit 1, error.code="CHAIN_INTEGRITY_FAILED", reason="target_hash_mismatch"

5. **Monotonic time ordering:**
   - For each pair of consecutive promote receipts (sorted by filename):
     - Later receipt timestamp >= earlier receipt timestamp
   - Failure: exit 1, error.code="CHAIN_INTEGRITY_FAILED", reason="time_order_violation"

### C) Optional Freshness (Explicit Flags Only)

**When Enforced:**
- `--max-age <seconds>` flag present, OR
- `--require-freshness` flag present

**Freshness Window:**
```
now = TF_NOW_EPOCH (env override) or current Unix epoch
stale_cutoff = now - max_age
```

**Evaluation:**
1. Source apply receipt timestamp must be >= stale_cutoff
2. If promote receipts exist, latest promote receipt timestamp must be >= stale_cutoff

**Failure:** exit 1, error.code="STALE_CHAIN"

**Bounds:**
| Parameter | Min | Max | Default (--require-freshness) |
|-----------|-----|-----|-------------------------------|
| max-age | 60 | 604800 (7 days) | 86400 (24 hours) |

Out of bounds: exit 2 INVALID_INVOCATION

### D) Time Skew Detection

Timestamps in the future (beyond tolerance) indicate clock drift or tampering.

**Tolerance:** 300 seconds (5 minutes)

**Check:**
```
if receipt_timestamp > now + tolerance:
    exit 1, error.code="TIME_SKEW"
```

**Applies to:**
- Apply receipt timestamps
- Promote receipt timestamps

### E) Testability: TF_NOW_EPOCH Override

For deterministic testing:
```bash
export TF_NOW_EPOCH=1703088000  # Unix timestamp
```

When set:
- All "now" calculations use this value
- Must be valid positive integer
- Invalid value → exit 2 INVALID_INVOCATION (internal, not user-facing)

---

## Receipt Selection Rules

### Latest Receipt Selection

When multiple promote receipts exist (e.g., multiple dev→techsupport promotions):

**Selection Algorithm:**
1. List all matching receipts: `promote_<from>_<to>_*.json`
2. Extract timestamp suffix from filename: `YYYYMMDDTHHMMSSZ`
3. Sort lexicographically (lexicographic sort == temporal sort for ISO8601)
4. Select last entry (most recent)

**Example:**
```
promote_dev_techsupport_20241220T100000Z.json
promote_dev_techsupport_20241220T110000Z.json  ← selected (latest)
promote_dev_techsupport_20241220T090000Z.json
```

**Security Note:** Filename timestamp is authoritative for selection. The internal JSON timestamp is used for freshness validation. Mismatch is not an error (allows for timezone variations).

### Chain Enumeration Order

For integrity validation, receipts are processed in temporal order:
1. Apply receipts by environment order: dev → techsupport → prod
2. Promote receipts by filename timestamp (ascending)

---

## Timestamp Format and Parsing

### ISO8601 Full Format
```
2024-12-20T10:30:00Z
```

**Parsing to Unix epoch:**
```bash
date -d "2024-12-20T10:30:00Z" +%s
```

### ISO8601 Compact (Filename)
```
20241220T103000Z
```

**Parsing:**
```bash
# Insert separators, then parse
ts="20241220T103000Z"
formatted="${ts:0:4}-${ts:4:2}-${ts:6:2}T${ts:9:2}:${ts:11:2}:${ts:13:2}Z"
date -d "$formatted" +%s
```

---

## JSON Output Schemas

### tf deploy policy --ci

**Success:**
```json
{
  "version": "1.3.0",
  "timestamp": "2024-12-22T10:00:00Z",
  "operation": "policy",
  "bundle": "/path/to/bundle",
  "status": "pass",
  "policy": {
    "chain_required": true,
    "chain_present": true,
    "max_age": 86400,
    "now_epoch": 1703239200,
    "freshness_check": "pass"
  },
  "chain": {
    "source_apply": {
      "path": "receipts/apply_dev.json",
      "timestamp": "2024-12-22T08:00:00Z",
      "age_seconds": 7200,
      "fresh": true
    },
    "latest_promote": {
      "path": "receipts/promote_dev_techsupport_20241222T090000Z.json",
      "timestamp": "2024-12-22T09:00:00Z",
      "age_seconds": 3600,
      "fresh": true
    }
  },
  "error": null
}
```

**Failure:**
```json
{
  "version": "1.3.0",
  "timestamp": "2024-12-22T10:00:00Z",
  "operation": "policy",
  "bundle": "/path/to/bundle",
  "status": "fail",
  "policy": {
    "chain_required": true,
    "chain_present": false,
    "max_age": 86400,
    "now_epoch": 1703239200,
    "freshness_check": "skip"
  },
  "chain": null,
  "error": {
    "code": "MISSING_CHAIN",
    "message": "Required receipt chain not found"
  }
}
```

### tf deploy promote --ci (Policy Failure)

Extends v1.2.0 error format:
```json
{
  "version": "1.3.0",
  "timestamp": "2024-12-22T10:00:00Z",
  "status": "error",
  "operation": "promote",
  "error": {
    "code": "STALE_CHAIN",
    "message": "Chain receipts older than max-age (86400s)",
    "details": {
      "max_age": 86400,
      "now_epoch": 1703239200,
      "oldest_receipt_age": 172800
    }
  }
}
```

---

## Exit Code Contract

| Code | Meaning |
|------|---------|
| 0 | Policy pass / promote success / dry_run |
| 1 | Policy failure (MISSING_CHAIN, CHAIN_INTEGRITY_FAILED, STALE_CHAIN, TIME_SKEW) |
| 2 | Invalid invocation (bad flags, bad args) |

---

## Error Codes (v1.3.0 Additions)

| Code | Exit | Trigger |
|------|------|---------|
| INVALID_INVOCATION | 2 | Missing --bundle, invalid --max-age value |
| MISSING_CHAIN | 1 | --require-chain but chain incomplete |
| CHAIN_INTEGRITY_FAILED | 1 | Hash mismatch, missing ref, time order violation |
| STALE_CHAIN | 1 | Receipts older than --max-age |
| TIME_SKEW | 1 | Future timestamp beyond tolerance |

---

## Execution Flow (Promote with Policy)

```
1. Parse flags (including new policy flags)
   └─ Invalid → exit 2

2. Expand --require-freshness to --max-age 86400

3. Validate --max-age bounds [60, 604800]
   └─ Out of bounds → exit 2

4. [ v1.2.0 validation: pair, mode, namespace, timeout ]

5. Gate check
   └─ Fail → exit 1 GATE_FAILED

6. Session check
   └─ Active → exit 1 ACTIVE_SESSION

7. Verify bundle
   └─ Fail → exit 1 VERIFY_FAILED

8. Load source receipt
   └─ Missing → exit 1 MISSING_SOURCE_RECEIPT (v1.2.0)

9. [NEW] If --require-chain: validate chain present
   └─ Missing chain → exit 1 MISSING_CHAIN

10. [NEW] Validate chain integrity (if receipts exist)
    └─ Fail → exit 1 CHAIN_INTEGRITY_FAILED

11. [NEW] If --max-age: validate freshness
    └─ Stale → exit 1 STALE_CHAIN
    └─ Time skew → exit 1 TIME_SKEW

12. Execute K8s apply (unless --dry-run)

13. Write receipts

14. Exit 0
```

---

## Helper Functions

### _policy_now_epoch()
```bash
_policy_now_epoch() {
    if [[ -n "${TF_NOW_EPOCH:-}" ]] && [[ "$TF_NOW_EPOCH" =~ ^[0-9]+$ ]]; then
        echo "$TF_NOW_EPOCH"
    else
        date +%s
    fi
}
```

### _sha256_file()
```bash
_sha256_file() {
    local file="$1"
    sha256sum "$file" 2>/dev/null | awk '{print "sha256:"$1}'
}
```

### _select_latest_receipt()
```bash
# Returns latest promote receipt by filename timestamp
_select_latest_receipt() {
    local receipts_dir="$1" from_env="$2" to_env="$3"
    find "$receipts_dir" -maxdepth 1 -name "promote_${from_env}_${to_env}_*.json" \
        | sort | tail -1
}
```

### _parse_receipt_timestamp()
```bash
# ISO8601 timestamp → Unix epoch
_parse_receipt_timestamp() {
    local ts="$1"
    date -d "$ts" +%s 2>/dev/null || echo "0"
}
```

---

## Test Requirements (Minimum 24)

### Invocation Validity (4)
1. `deploy policy` missing --bundle → exit 2
2. `--max-age` non-integer → exit 2
3. `--max-age` below min (60) → exit 2
4. `--max-age` above max (604800) → exit 2

### Chain Required (4)
5. promote with --require-chain but no receipts → exit 1 MISSING_CHAIN
6. dev→techsupport with --require-chain but apply_dev missing → exit 1 MISSING_CHAIN
7. techsupport→prod with --require-chain but apply_techsupport missing → exit 1 MISSING_CHAIN
8. require-chain with promote receipt missing (for prod) → exit 1 MISSING_CHAIN

### Chain Integrity (4)
9. promote receipt references missing source receipt → exit 1 CHAIN_INTEGRITY_FAILED
10. promote receipt source hash mismatch → exit 1 CHAIN_INTEGRITY_FAILED
11. promote receipt references missing target apply receipt → exit 1 CHAIN_INTEGRITY_FAILED
12. monotonic ordering violated → exit 1 CHAIN_INTEGRITY_FAILED

### Optional Freshness (4)
13. max-age set, chain older → exit 1 STALE_CHAIN
14. max-age set, chain within window → exit 0
15. future timestamp beyond tolerance → exit 1 TIME_SKEW
16. future timestamp within tolerance → pass

### Policy Command Output (4)
17. `tf deploy policy` (human) reports PASS/FAIL with reason
18. `tf deploy policy --ci` returns valid JSON with status enum
19. `--ci` no ANSI
20. `--ci` JSON includes evaluated max_age and now_epoch fields

### Security / Injection (4)
21. newline injection in receipt fields doesn't break JSON
22. path traversal in bundle rejected
23. malicious filename ordering can't bypass latest selection
24. multiple receipts: latest selection is deterministic and correct

---

## SPECLOCK HASH

```
SHA256: <computed-at-seal>
Frozen: <pending>
```

---

## AGENT NOTES

### NOTES_NOW
- Phase 1 SpecLock created

### RISKS_FOUND
- 

### DECISIONS
- TF_NOW_EPOCH for test determinism
- --max-age bounds: 60-604800 seconds (1 min to 7 days)
- --require-freshness defaults to 24 hours (86400s)
- TIME_SKEW tolerance: 300s (5 minutes)
- Filename timestamp authoritative for selection, JSON timestamp for freshness
- Chain integrity is ALWAYS enforced when receipts exist (not optional)
- Chain requirement is OPTIONAL (flag-controlled)

### TODO_NEXT_SESSION
- Phase 2: Create test suite
- Phase 3: Implement helpers and enforcement
