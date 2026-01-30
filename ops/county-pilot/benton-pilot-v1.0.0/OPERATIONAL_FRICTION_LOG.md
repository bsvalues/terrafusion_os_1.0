# Operational Friction Log: Benton County Pilot

> **Pilot ID**: PILOT-BENTON-2025-12-23  
> **Mode**: Evidence-Only (Friction Recording)  
> **Constraint**: No fixes during execution

---

## Purpose

This log captures friction points encountered during the County Pilot execution. Per the Command Contract, **no execution-layer changes** are permitted. Findings may only result in:
- Documentation updates
- Playbook clarifications

---

## Friction Points Identified

### FRICTION-001: Bundle Missing k8s/ Directory

**Severity**: Medium  
**Command**: `tf release deploy --bundle ./bundle --env dev --namespace terrafusion-staging --dry-run --ci`

**Observation**:
```json
{"status":"fail","steps":[
  {"name":"verify","status":"pass","message":"Bundle verified"},
  {"name":"apply","status":"fail","message":"Deploy fail"}
]}
```

**Root Cause**: The `tf release bundle` command creates a proof bundle but does not include Kubernetes manifests. The `tf release deploy` expects a `k8s/` directory with YAML manifests.

**Friction**: Playbook doesn't clarify that bundle creation is **proof-only** and requires separate K8s manifest preparation.

**Recommended Clarification**:
- Add to RELEASE_PLAYBOOKS.md Step 2: "Note: Bundle contains proofs only. Ensure k8s/ manifests are prepared separately."

---

### FRICTION-002: Promote Requires Prior Apply Receipt

**Severity**: Low  
**Command**: `tf release promote --bundle ./bundle --to techsupport --namespace terrafusion-staging --dry-run --ci`

**Observation**:
```json
{"status":"fail","steps":[
  {"name":"verify","status":"pass"},
  {"name":"policy","status":"pass"},
  {"name":"promote","status":"fail","message":"Promote fail"}
]}
```

**Root Cause**: Promotion requires a successful `apply_dev.json` receipt in the bundle. Since deploy failed (no k8s/), there's no receipt to chain from.

**Friction**: This is **expected behavior** but the error message could be more explicit about missing receipt.

**Recommended Clarification**:
- Error message should state: "Missing source receipt: receipts/apply_dev.json"

---

### FRICTION-003: Audit Chain Status "warn" for Fresh Bundles

**Severity**: Informational  
**Command**: `tf release audit --bundle ./bundle --ci`

**Observation**:
```json
{"sections":{"chain":{"status":"warn","count":0,"environments":[]}}}
```

**Root Cause**: Fresh bundles have no deployment receipts, so chain count is 0, triggering a warning.

**Friction**: Not actual friction—this is correct behavior. New operators may be confused by the warning.

**Recommended Clarification**:
- Add to PLAY-003 note: "Chain status 'warn' is normal for bundles without prior deployments."

---

### FRICTION-004: Namespace Discovery Not Automated

**Severity**: Low  
**Command**: All deploy/promote commands

**Observation**: Operator must know valid namespaces beforehand. No discovery command exists.

**Friction**: Playbook assumes operator knows target namespace.

**Recommended Clarification**:
- Add to prerequisites: "Run `kubectl get namespaces` to identify target namespace."

---

## Friction Summary

| ID | Severity | Category | Status |
|----|----------|----------|--------|
| FRICTION-001 | Medium | Bundle Structure | Documentation |
| FRICTION-002 | Low | Error Message | Documentation |
| FRICTION-003 | Informational | Expected Behavior | Documentation |
| FRICTION-004 | Low | Discovery | Documentation |

---

## No Execution Changes Required

Per the Command Contract:
- ✓ All friction points are **documentation-only** fixes
- ✓ No code modifications required
- ✓ No new flags or env vars needed
- ✓ Existing sealed commands are **correct and complete**

---

## Recommendations

1. **Update RELEASE_PLAYBOOKS.md** with clarifications for FRICTION-001, 002, 003
2. **Add namespace discovery tip** to prerequisites
3. **Consider future enhancement**: More explicit error messages for missing receipts

---

**Recorded by**: AI Agent (GitHub Copilot)  
**Timestamp**: 2025-12-23T17:30:00Z
