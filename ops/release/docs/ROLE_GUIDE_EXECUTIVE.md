# Role Guide: Executive

> **Constitutional Layer:** Adoption (Docs-Only)  
> **Audience:** CIO, CTO, County IT Directors, Leadership  
> **SpecLock:** `RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

## Executive Summary

TerraFusion's release system provides **constitutional governance** over all software deployments. This means:

- ✅ Every release is **auditable** with cryptographic evidence
- ✅ Promotions follow a **mandatory chain** (dev → techsupport → prod)
- ✅ Policy violations are **blocked automatically**
- ✅ Compliance is **verifiable** without technical expertise

---

## What You Need to Know

### The Three States

| Status | Meaning | Your Action |
|--------|---------|-------------|
| 🟢 **PASS** | System healthy, all releases compliant | No action needed |
| 🟡 **WARN** | Non-blocking issues detected | Review at convenience |
| 🔴 **FAIL** | Blocking violations present | Escalate to operations |

### The Release Chain

All software changes follow a mandatory path:

```
Development → Tech Support → Production
    (dev)    →  (techsupport)  →   (prod)
```

- **No skipping allowed** — You cannot deploy directly to production
- **Evidence required** — Each promotion creates a receipt
- **Time limits apply** — Bundles expire after 24 hours (configurable)

---

## Quick Health Check

Ask your operator to run:

```bash
tf release status
```

**Healthy Response:**

```
╔═══════════════════════════════════════════════════════════╗
║              📊 Release Status                             ║
╚═══════════════════════════════════════════════════════════╝

System Health:
  Gate: ✓ PASS (11/11 checks)
  Active Sessions: 0

✓ SYSTEM HEALTHY
```

**What This Tells You:**
- All constitutional checks are passing
- No active development sessions that could cause instability
- System is ready for releases

---

## Compliance Posture

Ask your operator to run:

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
  "last_promotion": "2025-12-22T18:10:03Z",
  "environments": ["dev", "techsupport"]
}
```

### Reading the Summary

| Field | Meaning |
|-------|---------|
| `status` | Overall compliance (PASS/WARN/FAIL) |
| `proofs_valid` | Number of verified subsystem checks (expect 4) |
| `promotions` | How many environment promotions occurred |
| `violations` | Policy violations detected (should be 0) |
| `last_promotion` | When the last promotion happened |
| `environments` | Which environments have received this release |

---

## Key Questions Answered

### "Is our system compliant?"

**Check:** `tf release audit --bundle <latest> --ci`

If `status: "PASS"` and `violations: 0`, you are compliant.

---

### "When was the last production deployment?"

**Check:** Look at `last_promotion` in the audit summary.

Or ask for the receipt:
```bash
ls -la ./releases/latest/receipts/promote.*prod*
```

---

### "Can someone deploy directly to production?"

**Answer:** No.

The constitutional promotion policy requires:
1. Valid proofs from preparation
2. Prior promotion to techsupport
3. Chain integrity verification
4. Freshness within time limits

Any attempt to skip steps is **automatically blocked**.

---

### "How do we prove compliance to auditors?"

**Answer:** Export the audit report:

```bash
tf release audit --bundle ./releases/v2.1.0 --ci > compliance_report.json
```

This JSON file contains:
- All proof validations
- Complete promotion chain
- Policy compliance status
- Timestamps and evidence

Auditors can verify this independently without system access.

---

### "What happens if there's an emergency?"

**Answer:** Emergency rollbacks are supported:

1. Operator documents the reason
2. Rollback bundle is verified (must have valid proofs)
3. Rollback is deployed
4. New audit report is generated

Even emergencies create evidence trails.

---

## Risk Indicators

### 🟢 Low Risk

- `status: "PASS"` consistently
- Regular promotions with short time gaps
- All 4 proofs valid
- Zero violations

### 🟡 Medium Risk

- `status: "WARN"` appearing
- Long gaps between promotions (>1 week)
- Stale bundles requiring `--skip-freshness`

### 🔴 High Risk

- `status: "FAIL"` in any audit
- `violations > 0`
- Missing proofs
- Broken promotion chain
- Evidence of time skew

---

## Monthly Review Checklist

Ask your operations team to provide:

1. **System Health Report**
   - How many releases this month?
   - Any FAIL statuses encountered?
   - Resolution time for issues?

2. **Compliance Summary**
   - Total violations detected: ___
   - Violations remediated: ___
   - Current compliance status: ___

3. **Audit Evidence**
   - Last 5 release audit reports preserved?
   - Promotion chain complete for each?

---

## Escalation Triggers

**Escalate to Operations when:**

- `tf release status` shows FAIL
- Audit report shows `violations > 0`
- Promotion chain is broken
- Time skew detected (possible tampering)

**Escalate to Security when:**

- `CHAIN_INTEGRITY_FAILED` error
- Evidence of modified receipts
- Unexplained future timestamps

---

## Terminology Reference

| Term | Meaning |
|------|---------|
| **Bundle** | A packaged release with all manifests and proofs |
| **Proof** | Cryptographic evidence that a subsystem check passed |
| **Receipt** | Record of a deployment or promotion action |
| **Chain** | The sequence of promotions from dev to prod |
| **Freshness** | Time limit on bundle validity (default 24h) |
| **Gate** | The local constitution check that must pass |

---

## One-Page Summary

```
┌─────────────────────────────────────────────────────────────┐
│                 TERRAFUSION RELEASE GOVERNANCE               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHAIN:  dev ───────► techsupport ───────► prod            │
│          (prepare)     (promote)       (promote)           │
│                                                             │
│  EVIDENCE:  proofs + receipts + audit reports              │
│                                                             │
│  POLICY:  chain required │ freshness enforced │ no skips   │
│                                                             │
│  STATUS:  🟢 PASS = healthy                                 │
│           🟡 WARN = review needed                           │
│           🔴 FAIL = escalate                                │
│                                                             │
│  VERIFY:  tf release status    (quick check)               │
│           tf release audit     (full compliance)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**This guide provides non-technical posture summaries. No execution authority is granted.**
