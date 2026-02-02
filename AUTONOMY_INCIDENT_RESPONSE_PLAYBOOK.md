# Autonomy Incident Response Playbook

**Phase 4N28 • TerraFusion Autonomy Governance**

This playbook provides step-by-step instructions for County CIO and Security officers to triage, verify, and respond to autonomy incidents.

---

## 🚨 Core Principle: Do Not Trust Labels; Trust Proofs

Labels like `incident` and `break-glass` on PRs are **cosmetic flags**, not authoritative controls. The source of truth is always:

1. **Evidence Index** (`evidence-index.json`) — Machine-verifiable attestations
2. **Signed Bundle** (`.zip` with `.sig/.crt/.bundle` triplet) — Cryptographic proof
3. **Rekor Transparency Log** — Immutable public record
4. **Custody Attestation** — Chain of evidence integrity

Anyone can apply a label. Only workflows with proper governance can produce valid evidence.

---

## 📋 Quick Reference: One-Command Triage

```bash
# Download incident packet from release, then:
pnpm perf:triage \
  --zip autonomy-evidence-bundle-<runId>-sealed.zip \
  --policy-from-index evidence-index.json \
  --strict \
  --verify-signatures \
  --emit-packet \
  --out ./triage-output
```

This produces:
- `incident-report.json` — Machine-readable report
- `incident-report.md` — Human-readable report
- `incident-report.html` — Offline HTML report
- `autonomy-incident-packet-<id>.zip` — Complete packet for archival

---

## 🔐 Step 1: Verify the Bag

Before reviewing any incident details, **verify the evidence bundle is authentic**.

### 1.1 Download the Evidence Bag

From the incident release (e.g., `autonomy-incident/2026`):

```bash
# Download all artifacts
gh release download autonomy-incident/2026 --pattern "*" --dir ./incident-review
cd ./incident-review
```

### 1.2 Verify Bundle Integrity (Hashes)

```bash
pnpm perf:verify-bundle --zip autonomy-evidence-bundle-*-sealed.zip --strict
```

**Expected output:** `✅ Bundle verified`

If this fails, **STOP**. The bundle has been tampered with or corrupted.

### 1.3 Verify Signatures (Keyless)

```bash
pnpm perf:verify-bundle \
  --zip autonomy-evidence-bundle-*-sealed.zip \
  --verify-signatures \
  --policy-from-index evidence-index.json
```

**Expected output:** Shows issuer, identity, and pin verification status.

### 1.4 Verify Custody Chain

```bash
pnpm perf:verify-custody \
  --in ./extracted \
  --strict \
  --verify-signatures
```

---

## 📊 Step 2: Interpret Ledger Signals

Open `incident-report.html` or review the ledger viewer. Look for these signals:

| Signal | Meaning | Action if Missing |
|--------|---------|-------------------|
| 📌 **Pinned** | Signature identity locked to expected workflow | Investigate if missing |
| 👥 **TPI** | Two-person integrity verified | Review approval chain |
| 🚨 **Break-Glass** | Emergency governance activated | Verify 3+ approvals |
| 🔐 **Roles** | Security + CIO roles verified | Confirm role binding |
| 🧾 **Anchored** | Rekor transparency log entry | Check log index |

### Signal Combinations

- ✅ All signals green → **Standard incident, proceed to review**
- ⚠️ Missing TPI → **Escalate: approval chain incomplete**
- ⚠️ Missing Roles → **Escalate: role binding failed**
- ❌ Bundle verify failed → **STOP: evidence compromised**

---

## 🔍 Step 3: Review the Change

### 3.1 Review Apply Proof

The `apply-proof.json` contains:
- What changed (`planItemId`, `strategyId`)
- Which file was modified
- Exact rollback command
- Final commit SHA

### 3.2 Review Diff

```bash
# View the actual change
git log --oneline -1 <finalCommitSha>
git show <finalCommitSha>
```

### 3.3 Verify Gates Passed

Check that all quality gates passed:
- `pnpm run type-check` ✅
- `pnpm run lint` ✅
- `pnpm run test` ✅

---

## ⚖️ Step 4: Decide

Based on your review, choose one:

| Decision | When | Next Step |
|----------|------|-----------|
| **Accept** | Change is valid, gates passed | Archive to incident tier |
| **Rollback** | Change is invalid or risky | Execute rollback |
| **Pause Lane** | Need more investigation | Enable autonomy pause |

---

## ⏪ Step 5: Execute Rollback (If Required)

### 5.1 Preview Rollback

```bash
# See what will be reverted
git log --oneline -1 <finalCommitSha>
git diff <finalCommitSha>^..<finalCommitSha>
```

### 5.2 Execute Rollback

The rollback command is in the evidence:

```bash
# From apply-proof.json
git revert <finalCommitSha> --no-edit
```

### 5.3 Run Gates After Rollback

```bash
pnpm run type-check
pnpm run lint
pnpm run test
```

### 5.4 Create Rollback PR

```bash
git push origin HEAD
gh pr create --title "chore(autonomy): rollback incident <runId>" \
  --body "Rollback of autonomy change per incident review" \
  --label "rollback"
```

---

## 📦 Step 6: Republish Evidence (If Changed)

If you made changes (rollback, additional review), regenerate and republish:

### 6.1 Generate New Evidence Bundle

```bash
pnpm perf:bundle \
  --in . \
  --out ./dist \
  --run-id <new-runId> \
  --include-seals \
  --strict
```

### 6.2 Sign the Bundle

```bash
cosign sign-blob --yes \
  --bundle ./dist/autonomy-evidence-bundle-<runId>.zip.bundle \
  ./dist/autonomy-evidence-bundle-<runId>.zip
```

### 6.3 Attach to Incident Release

```bash
gh release upload autonomy-incident/2026 \
  ./dist/autonomy-evidence-bundle-<runId>-sealed.zip \
  ./dist/evidence-index.json \
  --clobber
```

---

## 🗄️ Step 7: Archive

### 7.1 Retention Tiers

| Tier | Retention | Purpose |
|------|-----------|---------|
| `ci` | 90 days | CI artifacts, ephemeral |
| `merged` | 1 year | Standard merged changes |
| `incident` | 7 years | Audit-required evidence |

### 7.2 Incident Tagging

Ensure the release is tagged correctly:

```bash
# Tag format: autonomy-incident/<year>
gh release view autonomy-incident/2026
```

### 7.3 Archive Verification

Confirm the incident packet is archived:

```bash
# List all artifacts in incident release
gh release view autonomy-incident/2026 --json assets
```

---

## 🛑 Emergency: Pause Autonomy Lane

If you need to pause all autonomy activity:

```bash
# Check current pause status
cat .github/autonomy-pause.json

# To pause (creates/updates file):
echo '{"paused": true, "reason": "Incident investigation", "by": "<your-login>", "at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .github/autonomy-pause.json
git add .github/autonomy-pause.json
git commit -m "chore(autonomy): pause lane for incident investigation"
git push
```

To resume:

```bash
echo '{"paused": false}' > .github/autonomy-pause.json
git add .github/autonomy-pause.json
git commit -m "chore(autonomy): resume lane"
git push
```

---

## 📞 Escalation Contacts

| Role | Responsibility |
|------|----------------|
| **Security Lead** | Final authority on security incidents |
| **County CIO** | Final authority on operational incidents |
| **DevOps Lead** | Technical execution of rollbacks |

---

## ✅ Checklist Summary

- [ ] Downloaded evidence bag from release
- [ ] Verified bundle integrity (`perf:verify-bundle --strict`)
- [ ] Verified signatures (`--verify-signatures --policy-from-index`)
- [ ] Verified custody chain (if present)
- [ ] Reviewed ledger signals (TPI, Roles, Pinned, Anchored)
- [ ] Reviewed the actual change
- [ ] Made decision: Accept / Rollback / Pause
- [ ] If rollback: executed and verified gates
- [ ] If republish: generated new sealed bundle
- [ ] Archived to incident tier

---

## 📚 Related Documentation

- [Evidence Index Schema](./evidence-index.ts) — Technical schema reference
- [Break-Glass Protocol](./BREAK_GLASS_PROTOCOL.md) — Emergency procedures
- [Autonomy Ledger Viewer](./evidence-ledger-viewer.ts) — HTML dashboard

---

*Do not trust labels; trust proofs. Government. Transcended.*
