# Runbook FAQ

> **Constitutional Layer:** Adoption (Docs-Only)  
> **Purpose:** Common questions and semantic clarifications  
> **SpecLock:** `RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

## Exit Code Semantics

### Q: What does exit code 0 mean?

**A:** Success. The command completed without errors. Proceed to the next step.

### Q: What does exit code 1 mean?

**A:** Failure or policy violation. Something went wrong or a policy check failed. Stop, investigate, and remediate before proceeding.

**Common causes:**
- Proof validation failed
- Policy check failed (STALE_CHAIN, MISSING_CHAIN, etc.)
- K8s apply failed
- Bundle verification failed

### Q: What does exit code 2 mean?

**A:** Invalid arguments. The command was invoked incorrectly. Check the syntax and retry.

**Common causes:**
- Missing required flag (e.g., `--bundle`)
- Unknown flag provided
- Invalid environment name

---

## WARN vs FAIL Semantics

### Q: What's the difference between WARN and FAIL?

| Status | Meaning | Blocking? | Action |
|--------|---------|-----------|--------|
| **WARN** | Non-critical issue detected | No | Review at convenience, may proceed |
| **FAIL** | Critical issue detected | Yes | Must resolve before proceeding |

### Q: When does the system emit WARN?

**Examples:**
- RAG index is stale (>5 days old)
- Active agent sessions exist (not blocking, but notable)
- Non-critical dependency missing

### Q: When does the system emit FAIL?

**Examples:**
- Proof validation failed
- Chain integrity violated
- Policy check failed
- Required subsystem unavailable

---

## Promotion Chain

### Q: Why can't I deploy directly to production?

**A:** Constitutional policy requires the promotion chain:

```
dev → techsupport → prod
```

This ensures:
1. Every release is tested in lower environments first
2. Evidence exists for each promotion
3. Audit trail is complete
4. No shortcuts that bypass validation

### Q: What if I really need to skip an environment?

**A:** You cannot skip environments. The chain is enforced by:

1. `--require-chain` flag (always on for promote)
2. Policy validation checks for prior receipts
3. Hash integrity verification across chain

If you attempt to skip, you'll receive `MISSING_CHAIN` error.

### Q: Can I promote backwards (prod → dev)?

**A:** No. Promotions are forward-only. To "rollback," you deploy a previous version's bundle forward through the chain again.

---

## Freshness Rules

### Q: What is the freshness window?

**A:** By default, bundles expire after **24 hours** (86400 seconds). This ensures:

1. Bundles aren't deployed long after preparation
2. Evidence remains relevant to current system state
3. Stale configurations don't reach production

### Q: How do I change the freshness window?

**A:** Use `--max-age` flag during promote:

```bash
tf release promote --bundle ./releases/v2.1.0 --to prod --max-age 172800
```

Valid range: 60 seconds to 604800 seconds (1 minute to 7 days)

### Q: Can I skip freshness checks entirely?

**A:** Yes, with `--skip-freshness`:

```bash
tf release promote --bundle ./releases/v2.1.0 --to prod --skip-freshness
```

⚠️ **Use with caution.** Document the reason. This should only be used for known-good rollback bundles.

---

## Proofs and Receipts

### Q: What are the 4 required proofs?

| Proof | Subsystem | What It Validates |
|-------|-----------|-------------------|
| `gate.proof.json` | Gate | Local constitution checks pass |
| `agent.proof.json` | Agent | Agent protocol compliance |
| `deploy.proof.json` | Deploy | Deploy subsystem ready |
| `marketplace.proof.json` | Marketplace | Marketplace constitution |

### Q: Where are proofs generated?

**A:** During `tf release prepare`:

```bash
tf release prepare --bundle ./releases/v2.1.0
```

Individual proofs can also be generated:
```bash
tf gate proof --ci > proofs/gate.proof.json
tf agent proof --ci > proofs/agent.proof.json
```

### Q: What's the difference between a proof and a receipt?

| Artifact | Purpose | When Created |
|----------|---------|--------------|
| **Proof** | Evidence that a subsystem check passed | During prepare |
| **Receipt** | Record of an action (deploy, promote) | During deploy/promote |

### Q: How long should I keep receipts?

**A:** Retention policy depends on your compliance requirements:

- **Minimum:** Until next release supersedes
- **Recommended:** 90 days for audit purposes
- **Compliance:** Per your organization's data retention policy

---

## Bundle Structure

### Q: What's in a release bundle?

```
releases/v2.1.0/
├── manifests/           # K8s manifests or config files
├── proofs/
│   ├── gate.proof.json
│   ├── agent.proof.json
│   ├── deploy.proof.json
│   └── marketplace.proof.json
├── receipts/
│   ├── deploy.1734890700.json
│   └── promote.dev-to-techsupport.1734890703.json
└── bundle.json          # Bundle metadata
```

### Q: Can I modify a bundle after preparation?

**A:** No. Bundle integrity is verified via hashes. Any modification will:

1. Fail verification during deploy/promote
2. Trigger `CHAIN_INTEGRITY_FAILED` error
3. Require re-preparation

---

## Error Resolution

### Q: I got MISSING_CHAIN. What do I do?

**A:** This means you're trying to promote to an environment without the required prior promotion.

**Resolution:**
1. Check current chain: `ls -la ./releases/v2.1.0/receipts/`
2. Promote to the missing environment first
3. Then promote to your target

### Q: I got STALE_CHAIN. What do I do?

**A:** The bundle is older than the freshness window.

**Resolution:**
1. Re-run `tf release prepare --bundle <dir>` to refresh
2. Or use `--skip-freshness` if this is a known-good rollback bundle

### Q: I got CHAIN_INTEGRITY_FAILED. What do I do?

**A:** Hash mismatch detected. This could indicate:

1. Bundle was modified after preparation
2. Receipt was tampered with
3. Filesystem corruption

**Resolution:**
1. Investigate the discrepancy
2. If tampering suspected, escalate to security
3. Re-prepare from clean source

### Q: I got TIME_SKEW. What do I do?

**A:** A timestamp in the future was detected (>5 minutes tolerance).

**Resolution:**
1. Check system clock: `date`
2. Verify NTP sync: `timedatectl`
3. If clock is correct, this may indicate tampering

---

## CI/CD Integration

### Q: How do I use these commands in CI?

**A:** Use the `--ci` flag for JSON output:

```bash
result=$(tf release prepare --bundle ./releases/v2.1.0 --ci)
status=$(echo "$result" | jq -r '.status')
if [ "$status" != "PASS" ]; then
  echo "$result" | jq '.error'
  exit 1
fi
```

### Q: Can I run releases in parallel?

**A:** No. The promotion chain requires sequential execution:

1. Prepare (can be parallelized across different releases)
2. Deploy (one namespace at a time)
3. Promote (sequential through environments)

### Q: How do I automate the full release cycle?

**A:** See `RELEASE_PLAYBOOKS_CI_EXAMPLES.md` for GitHub Actions, GitLab CI, and Azure DevOps examples.

---

## Security Questions

### Q: Can someone bypass the promotion chain?

**A:** No. The chain is enforced by:

1. Policy validation in promote command
2. Receipt hash verification
3. Constitutional immutability

Even with root access, bypassing would require modifying sealed `tf.sh` code, which would break constitutional integrity.

### Q: How do I know proofs weren't forged?

**A:** Proofs contain:

1. Timestamp from execution
2. Source command that generated them
3. Hash of system state at generation time

Cross-reference with receipts and audit logs to verify authenticity.

### Q: What if I suspect tampering?

**A:**
1. Run `tf release audit --bundle <dir>` to check integrity
2. Compare hashes across chain
3. Escalate to security if any discrepancy

---

## Troubleshooting

### Q: The command hangs. What do I do?

**A:** Commands should complete within seconds. If hanging:

1. Check if K8s cluster is reachable
2. Verify network connectivity
3. Check for resource locks

Use `Ctrl+C` to cancel and investigate.

### Q: I see garbled output. What's wrong?

**A:** If using `--ci` flag, output is JSON-only. If you see ANSI codes:

1. Ensure you're using `--ci` flag correctly
2. Check terminal compatibility
3. Pipe through `cat` to strip ANSI: `tf release status --ci | cat`

### Q: Logs are too verbose. How do I quiet them?

**A:** Use `--ci` for machine-readable JSON output only:

```bash
tf release audit --bundle ./releases/v2.1.0 --ci 2>/dev/null
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Bundle** | Packaged release with manifests, proofs, and receipts |
| **Chain** | Sequential promotion path: dev → techsupport → prod |
| **Constitution** | Immutable governance rules that cannot be bypassed |
| **Freshness** | Time limit on bundle validity (default 24h) |
| **Gate** | Local constitution check that validates system readiness |
| **Proof** | Cryptographic evidence of subsystem check passing |
| **Receipt** | Record of deploy or promote action with evidence |
| **Seal** | Mark an artifact as immutable (no further changes) |
| **SpecLock** | Specification document that freezes requirements |

---

**This FAQ provides semantic clarifications. No execution authority is granted.**
