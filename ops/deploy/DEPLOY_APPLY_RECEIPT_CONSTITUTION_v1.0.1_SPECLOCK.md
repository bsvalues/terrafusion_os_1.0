```markdown
# Deploy Apply + Receipt Constitution v1.0.1 — SpecLock (Hardening)

> **Status**: LOCKED — Amendment requires RFC + Breaker approval + shadow review  
> **Created**: 2024-12-20  
> **Base Version**: v1.0.0  
> **References**: DEPLOY_APPLY_RECEIPT_CONSTITUTION_v1.0.0_SPECLOCK.md

## Overview

This SpecLock defines **hardening** for Deploy Apply + Receipt Constitution, closing two proof gaps identified in v1.0.0:

1. **TOCTOU risk** between verify and receipt write
2. **Explicit symlink detection** (not incidental blocking)

All v1.0.0 invariants remain in force. This addendum adds two new invariants.

---

## New Error Codes (v1.0.1)

| Code | Meaning | Exit |
|------|---------|------|
| `BUNDLE_CHANGED` | Bundle hash changed between verify and receipt write | 1 |
| `SYMLINK_NOT_ALLOWED` | Bundle path or critical file is a symlink | 2 |
| `PATH_ESCAPE` | Resolved path escapes expected boundaries | 2 |

---

## New Invariants

### Invariant C: TOCTOU Mitigation (Re-hash Before Receipt)

After all preflight checks pass and immediately before receipt write:

1. Re-compute bundle hash: `sha256sum checksums.sha256`
2. Compare to hash captured after initial verify
3. If mismatch: exit 1 with `error.code=BUNDLE_CHANGED`, no receipt written

**Rationale**: Closes race window between `tf release verify` (L~2676) and receipt write (L~2766). A malicious or concurrent process modifying bundle contents mid-apply is now detected.

**Implementation**:
```bash
# After verify passes, capture hash
verified_hash=$(_get_bundle_hash "$abs_bundle_path")

# ... preflight checks ...

# Immediately before receipt write, re-hash
pre_write_hash=$(_get_bundle_hash "$abs_bundle_path")
if [[ "$verified_hash" != "$pre_write_hash" ]]; then
    # TOCTOU detected
    _apply_error_json "BUNDLE_CHANGED" "Bundle modified between verify and apply"
    return 1
fi
# Now safe to write receipt
```

### Invariant D: Explicit Symlink Detection

Before bundle validation (early in `cmd_deploy_apply`):

1. **Bundle root**: `test -L "$abs_bundle_path"` → exit 2 `SYMLINK_NOT_ALLOWED`
2. **manifest.json**: `test -L "$abs_bundle_path/manifest.json"` → exit 2 `SYMLINK_NOT_ALLOWED`
3. **proofs/**: `test -L "$abs_bundle_path/proofs"` → exit 2 `SYMLINK_NOT_ALLOWED`
4. **checksums.sha256**: `test -L "$abs_bundle_path/checksums.sha256"` → exit 2 `SYMLINK_NOT_ALLOWED`

**Rationale**: v1.0.0 blocked symlink bundles incidentally (manifest.json not found). This makes the policy explicit and provable, with a dedicated error code.

**Implementation**:
```bash
# After abs_bundle_path resolution, before existence check
_check_symlink() {
    local path="$1" desc="$2"
    if [[ -L "$path" ]]; then
        if [[ -n "$ci_mode" ]]; then
            _apply_error_json "SYMLINK_NOT_ALLOWED" "Symlink not allowed: $desc"
        else
            log_error "Symlink not allowed: $desc"
        fi
        return 2
    fi
    return 0
}

_check_symlink "$abs_bundle_path" "bundle root" || return $?
# After confirming directory exists:
_check_symlink "$abs_bundle_path/manifest.json" "manifest.json" || return $?
_check_symlink "$abs_bundle_path/proofs" "proofs directory" || return $?
_check_symlink "$abs_bundle_path/checksums.sha256" "checksums.sha256" || return $?
```

### Invariant E: Path Escape Detection (Defense in Depth)

After resolving `abs_bundle_path` via realpath:

1. Compute canonical path: `realpath -m "$abs_bundle_path"`
2. Verify canonical path does not escape expected boundaries (e.g., `/tmp`, workspace root)
3. If escape detected: exit 2 with `error.code=PATH_ESCAPE`

**Note**: v1.0.0 already blocks `..` in path strings. This adds realpath-level verification for symlink-following attacks.

---

## Updated Receipt Schema

Receipt schema remains v1.0.0 (no structural changes). The `bundle.hash` field now has strengthened semantics:

- **v1.0.0**: Hash captured after verify
- **v1.0.1**: Hash verified twice (after verify AND before receipt write)

---

## Test Requirements (v1.0.1 Addendum)

### I. TOCTOU Detection Tests

| ID | Test | Expected |
|----|------|----------|
| I1 | Modify bundle between verify and receipt write | Exit 1, `BUNDLE_CHANGED`, no receipt |
| I2 | Same hash at verify and write | Exit 0, receipt written |
| I3 | Delete checksums.sha256 between verify and write | Exit 1, `BUNDLE_CHANGED` |

### J. Explicit Symlink Tests

| ID | Test | Expected |
|----|------|----------|
| J1 | Bundle root is symlink to valid bundle | Exit 2, `SYMLINK_NOT_ALLOWED` |
| J2 | manifest.json is symlink | Exit 2, `SYMLINK_NOT_ALLOWED` |
| J3 | proofs/ is symlink | Exit 2, `SYMLINK_NOT_ALLOWED` |
| J4 | checksums.sha256 is symlink | Exit 2, `SYMLINK_NOT_ALLOWED` |
| J5 | File inside proofs/ is symlink (not blocked) | Exit 0 (policy is on critical files only) |

### K. Path Escape Tests

| ID | Test | Expected |
|----|------|----------|
| K1 | Bundle path with symlink escaping to /etc | Exit 2, `SYMLINK_NOT_ALLOWED` or `PATH_ESCAPE` |
| K2 | Deeply nested symlink chain | Exit 2, `SYMLINK_NOT_ALLOWED` |

---

## Backward Compatibility

- All v1.0.0 tests MUST remain GREEN
- New tests are additive (test suite I, J, K)
- Error codes are new; no existing code depends on them

---

## Exit Code Contract (Unchanged)

| Code | Meaning |
|------|---------|
| 0 | Success or dry_run |
| 1 | Failure (verify, TOCTOU, execution) |
| 2 | Invalid invocation (missing flags, symlinks, path escape) |

---

## Amendment Process

Changes to this SpecLock require:
1. RFC document with justification
2. Breaker review (all v1.0.0 + v1.0.1 tests GREEN)
3. Shadow review against historical bundles
4. Tag version bump (e.g., v1.0.2-deploy-apply-receipt-constitution)

---

## AGENT NOTES

### NOTES_NOW
- v1.0.1 is pure hardening; no behavioral changes for valid bundles
- TOCTOU mitigation uses hash comparison (cheap, ~1ms)
- Symlink checks are early-exit (before expensive verify call)

### RISKS_FOUND
- Hash comparison could false-positive on legitimate bundle updates (mitigated: apply should be atomic)
- Symlink check doesn't recurse into proofs/*.json (design decision: only critical files)

### DECISIONS
- Re-hash uses same `_get_bundle_hash()` helper (SHA256 of checksums.sha256)
- Symlink check is exit 2 (invalid invocation), not exit 1 (failure)
- Path escape uses `realpath -m` for non-existent path handling

### TODO_NEXT_SESSION
- v1.1.0: Add k8s/compose execution support
- Consider file-level symlink detection inside proofs/ (if compliance requires)
```
