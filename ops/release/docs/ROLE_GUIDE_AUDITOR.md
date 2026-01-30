# Role Guide: Auditor

> **Constitutional Layer:** Adoption (Docs-Only)  
> **Audience:** Internal auditors, compliance officers, external reviewers  
> **SpecLock:** `RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

## Your Role

As an auditor, you validate release compliance **without executing deployments**. Your access is read-only to bundle directories and audit commands.

### What You Can Do

- ✅ Request audit reports from operators
- ✅ Verify proof integrity manually
- ✅ Validate promotion chain evidence
- ✅ Cross-reference timestamps and hashes
- ✅ Generate compliance documentation

### What You Cannot Do

- ❌ Execute deployments
- ❌ Modify bundles or receipts
- ❌ Bypass policy checks
- ❌ Access production systems directly

---

## Audit Workflow

### Step 1: Request Audit Report

Ask the operator to generate a JSON audit report:

```bash
tf release audit --bundle ./releases/v2.1.0 --ci > audit_report.json
```

Or if you have read access to the bundle directory:

```bash
tf release audit --bundle ./releases/v2.1.0 --ci
```

### Step 2: Interpret the Report

**Key Fields in Audit JSON:**

```json
{
  "status": "PASS",           // Overall compliance status
  "integrity": {
    "proofs_valid": 4,        // Number of valid proofs
    "proofs_total": 4         // Expected proofs
  },
  "chain": {
    "promotions": [...],      // Promotion history
    "timestamps_monotonic": true,  // Time ordering valid
    "hashes_valid": true      // Hash integrity valid
  },
  "policy": {
    "chain_integrity": "PASS",
    "freshness": "PASS"
  }
}
```

**Status Meanings:**

| Status | Meaning | Action |
|--------|---------|--------|
| `PASS` | Full compliance | Document and close |
| `WARN` | Non-blocking issues | Review and note |
| `FAIL` | Compliance violations | Escalate |

---

## Manual Verification

### Verify Proof Files

Each bundle must contain 4 proof files:

```
proofs/
├── gate.proof.json       # Local gate check proof
├── agent.proof.json      # Agent protocol proof
├── deploy.proof.json     # Deploy subsystem proof
└── marketplace.proof.json # Marketplace proof
```

**Proof Structure:**

```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-22T18:00:00Z",
  "status": "PASS",
  "source": "tf gate proof --ci",
  "summary": "11/11 checks passed"
}
```

**Validation Checklist:**

- [ ] All 4 proof files present
- [ ] Each proof has `status: "PASS"`
- [ ] Timestamps are before deployment receipts
- [ ] Version matches expected schema

---

### Verify Promotion Chain

Receipts record the promotion history:

```
receipts/
├── deploy.1734890700.json
├── promote.dev-to-techsupport.1734890703.json
└── promote.techsupport-to-prod.1734890800.json
```

**Receipt Structure:**

```json
{
  "type": "promote",
  "from_env": "dev",
  "to_env": "techsupport",
  "timestamp": "2025-12-22T18:10:03Z",
  "bundle_hash": "sha256:abc123...",
  "previous_receipt": "receipts/deploy.1734890700.json"
}
```

**Chain Validation:**

1. **Contiguity:** Each `from_env` must match previous `to_env`
   ```
   deploy → (dev) → promote(dev→techsupport) → promote(techsupport→prod)
   ```

2. **Monotonicity:** Timestamps must increase
   ```
   deploy.timestamp < promote.dev-to-techsupport.timestamp < promote.techsupport-to-prod.timestamp
   ```

3. **Hash Integrity:** `bundle_hash` must match across chain

---

### Verify Timestamps

```bash
# Extract all timestamps
cat ./releases/v2.1.0/proofs/*.json | jq -r '.timestamp'
cat ./releases/v2.1.0/receipts/*.json | jq -r '.timestamp'
```

**Expected Order:**

1. Proof timestamps (preparation phase)
2. Deploy receipt timestamp
3. Promote receipt timestamps (in order)

**Red Flags:**

- ⚠️ Receipt timestamp before proof timestamps
- ⚠️ Promote receipt before deploy receipt
- ⚠️ Timestamps in the future
- ⚠️ Large gaps unexplained (>24h between steps)

---

## Compliance Checklist

### Pre-Release Compliance

- [ ] All 4 proofs present and valid
- [ ] Proof timestamps precede deployment
- [ ] Bundle hash consistent across artifacts

### Deployment Compliance

- [ ] Deploy receipt exists
- [ ] Namespace matches expected target
- [ ] Resources applied count is reasonable

### Promotion Compliance

- [ ] Chain is contiguous (dev → techsupport → prod)
- [ ] No environment skipped
- [ ] Freshness within policy limits (default 24h)
- [ ] `--require-chain` was enforced

### Post-Release Compliance

- [ ] Audit report generated
- [ ] No policy violations reported
- [ ] Evidence artifacts preserved

---

## Common Audit Findings

### Finding: Missing Proofs

**Symptom:** `proofs_valid < proofs_total`

**Investigation:**
```bash
ls -la ./releases/v2.1.0/proofs/
```

**Remediation:** Operator must regenerate missing proofs and re-deploy.

---

### Finding: Broken Chain

**Symptom:** `MISSING_CHAIN` or `CHAIN_INTEGRITY_FAILED`

**Investigation:**
```bash
cat ./releases/v2.1.0/receipts/promote.*.json | jq '.from_env, .to_env'
```

**Remediation:** Verify promotion followed correct path. If skipped, escalate.

---

### Finding: Stale Bundle

**Symptom:** `STALE_CHAIN` error or freshness age > 86400s

**Investigation:**
```bash
cat ./releases/v2.1.0/proofs/gate.proof.json | jq '.timestamp'
# Compare to promotion timestamp
```

**Remediation:** Bundle must be re-prepared within freshness window.

---

### Finding: Time Skew

**Symptom:** `TIME_SKEW` error

**Investigation:**
```bash
# Check for future timestamps
cat ./releases/v2.1.0/receipts/*.json | jq '.timestamp' | while read ts; do
  if [ $(date -d "$ts" +%s) -gt $(date +%s) ]; then
    echo "FUTURE: $ts"
  fi
done
```

**Remediation:** Investigate system clock sync. May indicate tampering.

---

## Generating Compliance Reports

### JSON Export for Records

```bash
tf release audit --bundle ./releases/v2.1.0 --ci > compliance_v2.1.0.json
```

### Summary for Management

```bash
tf release audit --bundle ./releases/v2.1.0 --ci | jq '{
  release: .bundle,
  status: .status,
  proofs_valid: .integrity.proofs_valid,
  promotions: (.chain.promotions | length),
  violations: .summary.violations,
  last_promotion: .summary.last_promotion
}'
```

**Output:**

```json
{
  "release": "./releases/v2.1.0",
  "status": "PASS",
  "proofs_valid": 4,
  "promotions": 2,
  "violations": 0,
  "last_promotion": "2025-12-22T18:10:03Z"
}
```

---

## Questions to Ask Operators

1. "Can you provide the audit report for release X?"
2. "What was the promotion path for this release?"
3. "Were there any policy violations during promotion?"
4. "How long was the bundle between preparation and deployment?"
5. "Are all proof files preserved from the original bundle?"

---

**This guide enables evidence validation without execution access.**
