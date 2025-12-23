# TerraFusion Release Playbooks

> **Constitutional Layer:** Adoption (Docs-Only)  
> **Authority:** Presentation + guardrails — no execution expansion  
> **SpecLock:** `RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

## Overview

These playbooks compose **sealed `tf release *` commands** into operator-grade workflows. Each playbook is role-scoped and includes expected outputs, decision trees, and evidence references.

---

## Playbook 1: Standard Production Release

**ID:** PLAY-001  
**Audience:** Operator  
**Duration:** ~15 minutes  
**Risk Level:** Standard

### Prerequisites

- [ ] Local gate passes (`tf gate`)
- [ ] No active agent sessions
- [ ] Bundle directory prepared with manifests

### Procedure

#### Step 1: Verify Local Constitution

```bash
tf gate
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║         🛡️  Gate Z: Local Constitution Check              ║
╚═══════════════════════════════════════════════════════════╝

  [1/11] WSL Memory Cap: ✓ PASS (8GB)
  ...
  ─────────────────────────────────────────────────────────────
  ✓ GATE PASSED (11/11 checks)
  Ready for development.
```

**Exit Code:** `0` (proceed) | `1` (fix issues first)

---

#### Step 2: Prepare Release Bundle

```bash
tf release prepare --bundle ./releases/v2.1.0
```

**Expected Output:**
```
[2025-12-22 10:00:00] Preparing release bundle...
[2025-12-22 10:00:01] Running: tf release bundle --dir ./releases/v2.1.0
✓ Bundle created: ./releases/v2.1.0
[2025-12-22 10:00:02] Running: tf release verify --bundle ./releases/v2.1.0
✓ Bundle verified: 4/4 proofs valid

✓ PREPARE COMPLETE
  Bundle: ./releases/v2.1.0
  Proofs: gate.proof.json, agent.proof.json, deploy.proof.json, marketplace.proof.json
```

**Decision Tree:**
- ✅ All proofs valid → Proceed to Step 3
- ❌ Missing proofs → Run `tf gate proof --ci`, `tf agent proof --ci` to generate
- ❌ Invalid proofs → Investigate subsystem, do not proceed

---

#### Step 3: Deploy to Target Namespace

```bash
tf release deploy --bundle ./releases/v2.1.0 --namespace terrafusion-prod
```

**Expected Output:**
```
[2025-12-22 10:05:00] Deploying release bundle...
[2025-12-22 10:05:01] Running: tf release verify --bundle ./releases/v2.1.0
✓ Bundle verified
[2025-12-22 10:05:02] Running: tf deploy apply --bundle ./releases/v2.1.0 --namespace terrafusion-prod
✓ Applied to namespace: terrafusion-prod

✓ DEPLOY COMPLETE
  Namespace: terrafusion-prod
  Receipt: receipts/deploy.1734890702.json
```

**Decision Tree:**
- ✅ Deploy successful → Proceed to Step 4
- ❌ Namespace not found → Verify K8s context, create namespace
- ❌ Apply failed → Check manifest errors, rollback if partial

---

#### Step 4: Promote to Environment

```bash
tf release promote --bundle ./releases/v2.1.0 --to techsupport
```

**Expected Output:**
```
[2025-12-22 10:10:00] Promoting release bundle...
[2025-12-22 10:10:01] Running: tf release verify --bundle ./releases/v2.1.0
✓ Bundle verified
[2025-12-22 10:10:02] Running: tf deploy policy --bundle ./releases/v2.1.0
✓ Policy check passed
[2025-12-22 10:10:03] Running: tf deploy promote --bundle ./releases/v2.1.0 --from dev --to techsupport --require-chain
✓ Promoted: dev → techsupport

✓ PROMOTE COMPLETE
  From: dev
  To: techsupport
  Receipt: receipts/promote.dev-to-techsupport.1734890703.json
```

**Auto-Inference:**
- `--to techsupport` implies `--from dev`
- `--to prod` implies `--from techsupport`

**Decision Tree:**
- ✅ Promote successful → Proceed to Step 5
- ❌ MISSING_CHAIN → Previous promotion receipt missing, verify chain
- ❌ STALE_CHAIN → Bundle too old, refresh and re-prepare
- ❌ TIME_SKEW → System clock issue, investigate

---

#### Step 5: Generate Audit Report

```bash
tf release audit --bundle ./releases/v2.1.0
```

**Expected Output:**
```
[2025-12-22 10:15:00] Auditing release bundle...

╔═══════════════════════════════════════════════════════════╗
║              📋 Release Audit Report                       ║
╚═══════════════════════════════════════════════════════════╝

Bundle: ./releases/v2.1.0

Integrity Checks:
  [✓] gate.proof.json — valid
  [✓] agent.proof.json — valid
  [✓] deploy.proof.json — valid
  [✓] marketplace.proof.json — valid

Chain Analysis:
  [✓] dev → techsupport: receipts/promote.dev-to-techsupport.1734890703.json
  [✓] Timestamps monotonic
  [✓] Hash references valid

Policy Compliance:
  [✓] Chain integrity: PASS
  [✓] Freshness: PASS (age: 300s, max: 86400s)

─────────────────────────────────────────────────────────────
✓ AUDIT PASSED (4 proofs, 1 promotion, 0 violations)
```

---

### Evidence Produced

| Artifact | Location | Purpose |
|----------|----------|---------|
| Bundle proofs | `proofs/*.proof.json` | Subsystem compliance |
| Deploy receipt | `receipts/deploy.*.json` | Deployment record |
| Promote receipt | `receipts/promote.*.json` | Chain evidence |
| Audit report | stdout / `--ci` JSON | Compliance summary |

---

## Playbook 2: Emergency Rollback

**ID:** PLAY-002  
**Audience:** Operator / On-call  
**Duration:** ~5 minutes  
**Risk Level:** Elevated

### Prerequisites

- [ ] Rollback bundle exists and was previously verified
- [ ] Current deployment is confirmed problematic
- [ ] Documented reason for rollback (in agent notes)

### Procedure

#### Step 1: Verify Rollback Bundle

```bash
tf release audit --bundle ./releases/v2.0.0-rollback
```

Confirm all proofs valid and receipts present.

#### Step 2: Deploy Rollback

```bash
tf release deploy --bundle ./releases/v2.0.0-rollback --namespace terrafusion-prod
```

#### Step 3: Confirm Rollback Receipt

```bash
tf release audit --bundle ./releases/v2.0.0-rollback
```

Verify new deploy receipt exists.

### Constraints

- ⚠️ Rollback bundles MUST have valid receipts
- ⚠️ Freshness rules apply unless `--skip-freshness` explicitly used
- ⚠️ Document rollback reason before execution

---

## Playbook 3: Audit Response

**ID:** PLAY-003  
**Audience:** Auditor  
**Duration:** ~10 minutes  
**Access Required:** Read-only to bundle directory

### Procedure

#### Step 1: Request Audit Report

```bash
tf release audit --bundle ./releases/v2.1.0 --ci > audit_report.json
```

#### Step 2: Verify Receipt Chain (Manual)

```bash
# List all receipts
ls -la ./releases/v2.1.0/receipts/

# Check promote receipt chain
cat ./releases/v2.1.0/receipts/promote.*.json | jq '.from_env, .to_env, .timestamp'
```

#### Step 3: Cross-Reference Proofs

```bash
# Verify proof timestamps are before receipts
cat ./releases/v2.1.0/proofs/gate.proof.json | jq '.timestamp'
cat ./releases/v2.1.0/receipts/deploy.*.json | jq '.timestamp'
```

### Evidence Validation Checklist

- [ ] All 4 proofs present and valid
- [ ] Receipt hashes match file contents
- [ ] Timestamps are monotonically increasing
- [ ] Chain references are contiguous (dev → techsupport → prod)

---

## Playbook 4: Executive Status Brief

**ID:** PLAY-004  
**Audience:** CIO / Leadership  
**Duration:** ~2 minutes  
**Technical Level:** None required

### Quick Health Check

```bash
tf release status
```

**Healthy Output:**
```
╔═══════════════════════════════════════════════════════════╗
║              📊 Release Status                             ║
╚═══════════════════════════════════════════════════════════╝

System Health:
  Gate: ✓ PASS (11/11 checks)
  Active Sessions: 0

✓ SYSTEM HEALTHY
```

### Compliance Summary

```bash
tf release audit --bundle ./releases/latest --ci | jq '.summary'
```

**Output:**
```json
{
  "status": "PASS",
  "proofs_valid": 4,
  "promotions": 2,
  "violations": 0,
  "last_promotion": "2025-12-22T10:10:03Z",
  "environments": ["dev", "techsupport"]
}
```

### Status Interpretation

| Status | Meaning | Action |
|--------|---------|--------|
| `PASS` | All systems compliant | No action needed |
| `WARN` | Non-blocking issues | Review at convenience |
| `FAIL` | Blocking violations | Escalate to operations |

---

## Quick Reference

### Command Cheat Sheet

```bash
# Full release cycle
tf release prepare --bundle <dir>
tf release deploy --bundle <dir> --namespace <ns>
tf release promote --bundle <dir> --to <env>
tf release audit --bundle <dir>

# Quick health
tf release status

# CI-friendly (JSON output)
tf release audit --bundle <dir> --ci
tf release status --ci
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Failure / Policy violation |
| 2 | Invalid arguments |

---

**This document composes sealed commands only. No execution authority is granted.**
