# Role Guide: Operator

> **Constitutional Layer:** Adoption (Docs-Only)  
> **Audience:** Platform operators, SREs, DevOps engineers  
> **SpecLock:** `RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

## Your Responsibilities

As an operator, you are responsible for:

1. **Preparing** release bundles with valid proofs
2. **Deploying** releases to target namespaces
3. **Promoting** releases through environments (dev → techsupport → prod)
4. **Monitoring** release health and compliance
5. **Rolling back** when necessary

---

## Daily Workflow

### Start of Day

```bash
# Check system health
tf release status

# Verify gate passes
tf gate
```

**If status shows WARN:** Review warnings, address if blocking.  
**If status shows FAIL:** Do not proceed with releases until resolved.

---

## Standard Release Flow

### Step 1: Prepare the Bundle

```bash
tf release prepare --bundle ./releases/v2.1.0
```

**What This Does:**
1. Creates the release bundle structure
2. Runs `tf release verify` to validate all proofs
3. Reports any missing or invalid proofs

**Success Criteria:**
- All 4 proofs valid (gate, agent, deploy, marketplace)
- No verification errors

**If Prepare Fails:**
- Check which proofs are missing
- Run individual proof commands: `tf gate proof --ci`, `tf agent proof --ci`
- Do NOT proceed to deploy with invalid proofs

---

### Step 2: Deploy to Namespace

```bash
tf release deploy --bundle ./releases/v2.1.0 --namespace terrafusion-prod
```

**What This Does:**
1. Re-verifies the bundle (safety check)
2. Applies manifests to the target K8s namespace
3. Creates a deploy receipt

**Success Criteria:**
- Verification passes
- All resources applied successfully
- Deploy receipt created

**If Deploy Fails:**
- Check namespace exists: `kubectl get ns terrafusion-prod`
- Review manifest errors in output
- If partial apply, consider rollback

---

### Step 3: Promote Through Environments

```bash
# Promote to techsupport (auto-infers --from dev)
tf release promote --bundle ./releases/v2.1.0 --to techsupport

# Later: Promote to prod (auto-infers --from techsupport)
tf release promote --bundle ./releases/v2.1.0 --to prod
```

**What This Does:**
1. Verifies bundle integrity
2. Checks promotion policy (chain, freshness)
3. Creates promote receipt with chain reference
4. Enforces `--require-chain` by default

**Environment Chain:**
```
dev → techsupport → prod
```

**If Promote Fails:**

| Error | Meaning | Action |
|-------|---------|--------|
| `MISSING_CHAIN` | No prior promotion receipt | Promote to previous env first |
| `STALE_CHAIN` | Bundle too old (>24h default) | Re-prepare bundle |
| `TIME_SKEW` | Future timestamp detected | Check system clock |
| `CHAIN_INTEGRITY_FAILED` | Hash mismatch | Investigate tampering |

---

### Step 4: Generate Audit Report

```bash
tf release audit --bundle ./releases/v2.1.0
```

**What This Does:**
1. Validates all proof integrity
2. Verifies promotion chain
3. Checks policy compliance
4. Produces human-readable summary

**When to Run:**
- After every promotion
- Before handoff to auditors
- When investigating issues

---

## Emergency Rollback

### When to Rollback

- Production incidents traced to release
- Critical bugs discovered post-deploy
- Security vulnerabilities identified

### Rollback Procedure

```bash
# 1. Document the reason (required)
tf agent notes  # Add rollback justification

# 2. Verify rollback bundle exists and is valid
tf release audit --bundle ./releases/v2.0.0-rollback

# 3. Deploy rollback bundle
tf release deploy --bundle ./releases/v2.0.0-rollback --namespace terrafusion-prod

# 4. Verify rollback succeeded
tf release audit --bundle ./releases/v2.0.0-rollback
```

### Rollback Constraints

- ⚠️ Rollback bundles MUST have valid proofs
- ⚠️ Freshness rules apply (use `--skip-freshness` only if bundle is known-good)
- ⚠️ Always document reason before rollback

---

## Troubleshooting

### Bundle Verification Fails

```bash
# Check which proofs are invalid
tf release verify --bundle ./releases/v2.1.0

# Regenerate missing proofs
tf gate proof --ci > ./releases/v2.1.0/proofs/gate.proof.json
tf agent proof --ci > ./releases/v2.1.0/proofs/agent.proof.json
```

### Promotion Policy Fails

```bash
# Check policy details
tf deploy policy --bundle ./releases/v2.1.0 --ci

# View current chain
ls -la ./releases/v2.1.0/receipts/
```

### Namespace Issues

```bash
# Verify K8s context
kubectl config current-context

# Check namespace exists
kubectl get ns terrafusion-prod

# Create if missing
kubectl create ns terrafusion-prod
```

---

## Command Quick Reference

| Task | Command |
|------|---------|
| Check health | `tf release status` |
| Prepare bundle | `tf release prepare --bundle <dir>` |
| Deploy | `tf release deploy --bundle <dir> --namespace <ns>` |
| Promote | `tf release promote --bundle <dir> --to <env>` |
| Audit | `tf release audit --bundle <dir>` |
| Rollback | `tf release deploy --bundle <rollback-dir> --namespace <ns>` |

---

## Exit Code Reference

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Proceed |
| 1 | Failure | Investigate, fix, retry |
| 2 | Invalid args | Check command syntax |

---

**This guide composes sealed commands only. No execution authority is expanded.**
