# Deploy Runtime Constitution v1.1.0 — SpecLock

**Status:** SEALED  
**Created:** 2025-12-18  
**Sealed At:** 2025-12-19  
**Amends:** v1.0.0-deploy-constitution  
**Frozen At:** 2025-12-19T18:50:00Z  
**Rollback Anchor:** v1.1.0-deploy-constitution-bundle-required

---

## 1. Constitutional Amendment Summary

This amendment adds **mandatory RuntimeCert bundle verification** as a hard precondition for all deployment operations.

**Key Change:**
- v1.0.0: Bundle directory + manifest.json existence check only
- v1.1.0: Full `tf release verify` execution required before any deploy action

**Affected Commands:**
- `tf deploy --env <env> --bundle <path>`
- `tf deploy promote --from <env> --to <env> --bundle <path>` (NEW: --bundle required)
- `tf deploy rollback --env <env> --to-version <version> --bundle <path>` (NEW: --bundle required)

---

## 2. New Constitutional Invariants

### Invariant 5 — RuntimeCert Bundle Verification Required (NEW)

**Requirement:** All deployment operations MUST execute and pass RuntimeCert bundle verification.

**Contract:**
1. **Mandatory Verification:**
   - Before any deployment action, execute: `tf release verify --bundle <path>`
   - Verification must exit 0 for deployment to proceed
   - If verification fails (exit 1) → deployment fails (exit 1)
   - If verification invalid (exit 2) → deployment fails (exit 2)

2. **Bundle Parameter Required:**
   - `tf deploy --bundle <path>` (EXISTING, now verified)
   - `tf deploy promote --bundle <path>` (NEW, required)
   - `tf deploy rollback --bundle <path>` (NEW, required)
   - Missing `--bundle` → exit 2 (invalid invocation)

3. **Verification Order:**
   ```
   1. Invocation validation (flags, args) → exit 2 on failure
   2. Gate-first check → exit 1 on failure
   3. No active sessions → exit 1 on failure
   4. RuntimeCert bundle verify → exit 1 on failure (NEW)
   5. Deploy-specific validation → exit 1 on failure
   6. Execute deployment → exit 0 on success
   ```

4. **Fail-Closed Default:**
   - No bundle provided → exit 2 with clear error message
   - Bundle directory not found → exit 1 with clear error message
   - Bundle verification fails → exit 1 with verification error details

**Rationale:**
RuntimeCert bundles provide cryptographic proof that:
- Gate checks passed at bundle creation time
- All required proofs (gate, agent, deploy, marketplace) are present
- Checksums are intact (no tampering)
- Proof status is passing (no failures)

Without verification, deployments may use:
- Tampered bundles
- Stale bundles with outdated proofs
- Incomplete bundles missing required proofs

---

### Invariant 6 — Bundle Path Validation (ENHANCED)

**Requirement:** Bundle paths MUST be validated for safety before use.

**Contract:**
1. **Path Sanitization:**
   - Reject paths containing newlines or control characters → exit 2
   - Reject paths with `..` traversal attempts → exit 2
   - Resolve to absolute path before verification

2. **Symlink Handling:**
   - Symlinks resolved before verification
   - Final path must be a directory

3. **CI JSON Safety:**
   - Bundle path in JSON output must be sanitized (no control chars)
   - Error messages must not leak raw user input

---

## 3. Updated Command Signatures

### tf deploy

```
tf deploy --env <dev|techsupport|prod> --bundle <path> [--ci] [--dry-run]
```

**Exit Codes:**
- 0: Deployment successful
- 1: Deployment failed (gate, session, bundle verify, or deploy error)
- 2: Invalid invocation (missing args, invalid env, missing bundle)

**Verification Sequence:**
1. Parse and validate arguments
2. Validate environment value
3. Execute gate check
4. Check for active sessions
5. **Execute `tf release verify --bundle <path>`** (NEW)
6. Execute deployment

### tf deploy promote

```
tf deploy promote --from <env> --to <env> --bundle <path> [--ci]
```

**Exit Codes:**
- 0: Promotion successful
- 1: Promotion failed (gate, bundle verify, or promotion error)
- 2: Invalid invocation (missing args, invalid path, missing bundle)

**Verification Sequence:**
1. Parse and validate arguments
2. Validate promotion path (dev→techsupport→prod)
3. Execute gate check
4. **Execute `tf release verify --bundle <path>`** (NEW)
5. Execute promotion

### tf deploy rollback

```
tf deploy rollback --env <env> --to-version <version> --bundle <path> [--ci]
```

**Exit Codes:**
- 0: Rollback successful
- 1: Rollback failed (gate, bundle verify, or rollback error)
- 2: Invalid invocation (missing args, missing bundle)

**Verification Sequence:**
1. Parse and validate arguments
2. Validate environment and version
3. Execute gate check
4. **Execute `tf release verify --bundle <path>`** (NEW)
5. Execute rollback

---

## 4. CI JSON Schema (--ci mode)

### Success Response
```json
{
  "version": "1.1.0",
  "timestamp": "2025-12-18T12:00:00Z",
  "status": "success",
  "operation": "deploy|promote|rollback",
  "environment": "<env>",
  "bundle": "<sanitized_path>",
  "bundle_verified": true
}
```

### Failure Response (Bundle Verification)
```json
{
  "version": "1.1.0",
  "timestamp": "2025-12-18T12:00:00Z",
  "status": "failed",
  "operation": "deploy|promote|rollback",
  "environment": "<env>",
  "bundle": "<sanitized_path>",
  "bundle_verified": false,
  "error": {
    "code": "BUNDLE_VERIFY_FAILED",
    "message": "<verification error details>"
  }
}
```

### Invalid Invocation Response
```json
{
  "version": "1.1.0",
  "timestamp": "2025-12-18T12:00:00Z",
  "status": "error",
  "operation": "deploy|promote|rollback",
  "error": {
    "code": "MISSING_BUNDLE|INVALID_PATH|MISSING_ENV",
    "message": "<error description>"
  }
}
```

---

## 5. Test Coverage Requirements

### Invocation Validity (Exit 2)
- [x] Missing --bundle on deploy → exit 2
- [x] Missing --bundle on promote → exit 2
- [x] Missing --bundle on rollback → exit 2
- [x] Path traversal in --bundle → exit 2
- [x] Control characters in --bundle → exit 2

### Bundle Verification (Exit 1)
- [x] Bundle directory not found → exit 1
- [x] Bundle verification fails (tampered) → exit 1
- [x] Bundle verification passes → proceed to deploy

### CI JSON Purity
- [x] --ci outputs valid JSON only
- [x] --ci error includes error.code
- [x] --ci bundle path sanitized

### Breaker Prevention (v1.1.0)
- [x] Empty bundle directory fails
- [x] Symlink resolution works correctly
- [x] Control characters sanitized in CI output
- [x] Newline JSON pollution prevented
- [x] tf release verify is actually called
- [x] Stale bundles accepted (documented design)

**Test Suite Location:** ops/dev/tests/test_deploy_runtimecert_enforcement.sh
**Test Count:** 23 tests (17 core + 6 breaker)
**Status:** ALL GREEN (23/23)

---

## 6. Amendment Process Record

**Amendment Justification:**
v1.0.0 deploy constitution only validated bundle structure (directory + manifest.json). This was insufficient because:
1. No cryptographic verification of bundle integrity
2. No validation that proofs are present and passing
3. No protection against tampered bundles

**RFC Evidence:**
- RuntimeCert Bundle Constitution v1.0.0 established verification semantics
- Integration required for defense-in-depth

**Breaker Review Status:** COMPLETE (6 bypass prevention tests)

**Shadow Deployment Testing:** N/A (governance-only, no actual deployment logic)

---

## 7. Frozen Invariants Summary

| ID | Invariant | Exit Code | Version |
|----|-----------|-----------|---------|
| R1 | Gate-first deployment | 1 | v1.0.0 |
| R2 | No active agent sessions | 1 | v1.0.0 |
| R3 | Explicit environment validation | 2 | v1.0.0 |
| R4 | Bundle directory + manifest required | 1 | v1.0.0 |
| **R5** | **RuntimeCert bundle verification** | **1** | **v1.1.0** |
| **R6** | **Bundle path sanitization** | **2** | **v1.1.0** |
