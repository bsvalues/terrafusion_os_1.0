# Release Playbooks Constitution v1.0.0 — SpecLock

**Status:** DRAFT → SEALED  
**Schema Version:** 1.0.0  
**Constitutional Layer:** Adoption (Docs-Only)  
**Authority Expansion:** NONE  

---

## 1. Purpose

This constitution defines the **operator-grade playbooks and role guides** that compose sealed `tf release *` commands into human-readable workflows. This layer is **presentation + guardrails**, not execution.

**Mission:** Counties, auditors, and CIOs understand releases through a single narrative, not 7 subsystems.

---

## 2. Constitutional Constraints

### Invariant A: No New Authority
Playbooks MAY NOT:
- Introduce new flags or environment variables
- Execute commands not already sealed in `tf.sh`
- Modify system state beyond what sealed commands allow
- Reference internal implementation details

### Invariant B: Sealed Composition Only
All playbook steps MUST reference ONLY these sealed commands:
```
tf release prepare   # bundle + verify
tf release deploy    # verify + apply
tf release promote   # verify + policy + promote
tf release audit     # integrity + chain + policy
tf release status    # gate + sessions
tf gate              # local constitution check
```

### Invariant C: Role-Scoped Narratives
- **Operator**: Full workflow with decision trees
- **Auditor**: Evidence validation without execution access
- **Executive**: Non-technical posture summaries

### Invariant D: Deterministic Outputs
Every playbook step MUST include:
1. Human-readable expected output
2. `--ci` JSON equivalent where applicable
3. Exit code semantics (0=success, 1=failure, 2=invalid)

### Invariant E: Reproducible Evidence
Every playbook MUST reference:
- Which receipts/proofs are produced
- Where evidence artifacts are stored
- How to verify without re-execution

---

## 3. Sealed Artifacts

| Artifact | Purpose | Audience |
|----------|---------|----------|
| `RELEASE_PLAYBOOKS.md` | Canonical operator playbooks | Operators |
| `RELEASE_PLAYBOOKS_CI_EXAMPLES.md` | JSON-only pipeline examples | CI Systems |
| `ROLE_GUIDE_OPERATOR.md` | Step-by-step operator usage | Operators |
| `ROLE_GUIDE_AUDITOR.md` | Evidence validation guide | Auditors |
| `ROLE_GUIDE_EXECUTIVE.md` | Non-technical summaries | CIO/Leadership |
| `RUNBOOK_FAQ.md` | Common questions & semantics | All |

---

## 4. Playbook Specifications

### 4.1 Standard Production Release

**ID:** `PLAY-001`  
**Audience:** Operator  
**Preconditions:** 
- `tf gate` passes
- No active agent sessions
- Bundle directory exists with valid manifests

**Flow:**
```
1. tf gate                           # Verify local constitution
2. tf release prepare --bundle <dir> # Create auditable artifact
3. tf release deploy --bundle <dir> --namespace <ns>  # Deploy to target
4. tf release promote --bundle <dir> --to <env>       # Promote with chain
5. tf release audit --bundle <dir>   # Generate compliance report
```

**Decision Points:**
- If prepare fails → Fix manifests, do not proceed
- If deploy fails → Check namespace, rollback if partial
- If promote policy fails → Review chain, check freshness

**Evidence Produced:**
- `receipts/deploy.*.json` — Deployment receipt
- `receipts/promote.*.json` — Promotion receipt
- `proofs/*.proof.json` — Subsystem proofs

---

### 4.2 Emergency Rollback

**ID:** `PLAY-002`  
**Audience:** Operator / On-call  
**Preconditions:**
- Active deployment exists
- Rollback bundle is available and verified

**Flow:**
```
1. tf release audit --bundle <rollback-bundle>  # Verify rollback bundle integrity
2. tf release deploy --bundle <rollback-bundle> --namespace <ns>  # Deploy rollback
3. tf release audit --bundle <rollback-bundle>  # Confirm rollback receipt
```

**Constraints:**
- Rollback bundles MUST have valid receipts (cannot skip verification)
- Freshness rules still apply unless `--skip-freshness` explicitly used
- Document reason in agent notes before rollback

---

### 4.3 Audit Response

**ID:** `PLAY-003`  
**Audience:** Auditor  
**Preconditions:**
- Access to bundle directory (read-only)
- No execution privileges required

**Flow:**
```
1. tf release audit --bundle <dir> --ci  # Get JSON audit report
2. Verify receipts/promote.*.json chain integrity manually
3. Cross-reference proofs/*.proof.json timestamps
4. Validate hash references match receipt claims
```

**Evidence Validation (No Execution):**
- Receipt `hash` field matches actual file hash
- Timestamps are monotonically increasing
- Chain references (`from_env` → `to_env`) are contiguous

---

### 4.4 Executive Status Brief

**ID:** `PLAY-004`  
**Audience:** CIO / Leadership  
**Preconditions:** None (read-only)

**Flow:**
```
1. tf release status --ci            # Quick health check
2. tf release audit --bundle <latest> --ci | jq '.summary'
```

**Output Interpretation:**
- `"status": "PASS"` — System healthy, deployments compliant
- `"status": "WARN"` — Non-blocking issues, review recommended
- `"status": "FAIL"` — Blocking issues, escalation required

---

## 5. Exit Code Inheritance

Playbooks inherit exit codes from underlying commands:

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Proceed to next step |
| 1 | Failure / Policy Violation | Stop, investigate, remediate |
| 2 | Invalid Arguments | Fix invocation, retry |

---

## 6. Forbidden Patterns

Playbooks MUST NOT include:

```bash
# ❌ Direct bundle manipulation
tar -xf bundle.tar.gz

# ❌ Bypassing sealed commands
kubectl apply -f manifests/

# ❌ Environment variable injection
TF_SKIP_VERIFY=1 tf release deploy

# ❌ Internal function calls
_validate_chain_integrity

# ❌ Unsupported flags
tf release prepare --force --skip-all
```

---

## 7. Governance Tests

### Static Checks (Lint)
```bash
# G-PLAY-001: No forbidden commands in playbooks
grep -E "kubectl|docker|tar|_[a-z_]+\(\)" docs/*.md && exit 1

# G-PLAY-002: All tf commands are sealed
grep -oE "tf [a-z]+ [a-z]+" docs/*.md | sort -u | while read cmd; do
  grep -q "$cmd" ops/dev/tf.sh || exit 1
done

# G-PLAY-003: JSON examples parse
grep -A10 '```json' docs/*CI*.md | grep -v '```' | jq . >/dev/null
```

### Link Validation
- All `tf release *` references exist in sealed constitution
- All receipt/proof paths follow canonical naming

---

## 8. Amendment Process

Changes to this constitution require:

1. **RFC** with evidence of necessity
2. **SpecLock update** with proposed changes
3. **Governance review** (all lint checks pass)
4. **Constitutional tag bump** (e.g., v1.1.0-release-playbooks)

---

## 9. Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2025-12-22 | Initial release — 4 playbooks, 6 artifacts |

---

**This constitution is SEALED. Playbooks are presentation-only and carry no execution authority.**
