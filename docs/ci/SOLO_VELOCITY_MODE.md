# Solo Velocity Mode

**Status**: ACTIVE  
**Last Updated**: 2025-01-26  
**Purpose**: Maximum development velocity for solo developers

---

## The Philosophy

During solo development, your "review" is **automation + your own discipline**.  
Human approvals are only useful when there's actually another human.

**Keep the real safety** (deterministic required checks), **drop the process theater** (required reviews + GitHub App co-signer).

---

## How It Works

### Three Lanes

| Lane | Trigger | Required? | Time | Purpose |
|------|---------|-----------|------|---------|
| **🔒 Seal Gate (fast)** | Every PR | ✅ YES | 3-8 min | Fast, deterministic gate |
| **🌙 Nightly** | 2 AM UTC daily | ❌ NO | 15-45 min | Heavy checks, review in morning |
| **🚀 Release** | `v*` tags only | ✅ for release | 30-60 min | Full compliance for vendors |

### What's in Each Lane

#### 🔒 Seal Gate (fast) — `seal-gate-fast.yml`
The ONE required check for PRs:
- ✅ Lint/format (fast)
- ✅ Type checking (fast)
- ✅ Unit tests (no external deps)
- ✅ Build validation
- ✅ Drift guard (deterministic)
- ❌ NO E2E
- ❌ NO container scans
- ❌ NO SBOM

#### 🌙 Nightly — `nightly.yml`
Run overnight, review in morning:
- ✅ E2E tests (Playwright)
- ✅ Integration tests (with DB)
- ✅ SBOM generation
- ✅ Security deep scans (CodeQL, Trivy, Semgrep)
- ✅ Performance tests
- ✅ Accessibility audits

#### 🚀 Release — `release-compliance.yml`
Full compliance pack for `v*` tags:
- ✅ Full test suite
- ✅ SBOM (SPDX + CycloneDX)
- ✅ Container scanning
- ✅ License compliance
- ✅ SLSA provenance
- ✅ Everything for vendor due diligence

---

## Branch Protection Settings

### Required Settings (GitHub → Settings → Branches → main)

```yaml
# Solo Velocity Mode settings
require_approving_reviews: 0          # No reviews required
require_last_push_approval: false     # OFF (no separation of duties)
dismiss_stale_reviews: false          # Irrelevant when 0 reviews
enforce_admins: false                 # You're the only admin
require_status_checks:
  strict: true                        # Must be up-to-date with main
  contexts:
    - "🔒 SEAL"                       # The ONE required check
```

### How to Set It

1. Go to: `https://github.com/<owner>/<repo>/settings/branches`
2. Edit the `main` branch rule
3. Set:
   - **Require a pull request before merging**: Enabled
   - **Required approving reviews**: `0`
   - **Require review from Code Owners**: Disabled
   - **Require approval of the most recent push**: Disabled
   - **Require status checks to pass before merging**: Enabled
   - **Status checks**: Add `🔒 SEAL` (from seal-gate-fast.yml)
   - **Require branches to be up to date**: Enabled
   - **Do not allow bypassing the above settings**: Disabled (you're solo)

---

## Disable Auto-Approve

The auto-approve system requires:
- A GitHub App with PR review permissions
- Secrets: `TF_REVIEW_APP_ID`, `TF_REVIEW_APP_PRIVATE_KEY`
- Variable: `TF_AUTO_APPROVE_ENABLED=true`

**To disable (recommended for solo mode):**

1. Go to: `https://github.com/<owner>/<repo>/settings/variables/actions`
2. Either:
   - Delete `TF_AUTO_APPROVE_ENABLED`, OR
   - Set `TF_AUTO_APPROVE_ENABLED=false`

The auto-approve code remains in the repo as a future capability, but won't execute.

---

## Migration Checklist

### Today (5 minutes)

- [ ] Update branch protection (0 reviews, require `🔒 SEAL` only)
- [ ] Set `TF_AUTO_APPROVE_ENABLED=false` or delete it
- [ ] Push the new workflows (this commit)

### Verify It Works

1. Create a test PR
2. Only `🔒 TerraFusion Seal Gate (fast)` should run
3. It should complete in 3-8 minutes
4. You can merge without approval

### Check Nightly

- Wait for 2 AM UTC (or trigger manually)
- Review results in the morning
- Fix any failures as regular work

---

## Switching to Enterprise Governance Mode

When you hire a team or have a buyer evaluating:

### Enable Full Governance

```yaml
# Enterprise Governance Mode settings
require_approving_reviews: 1          # Require 1 review
require_last_push_approval: true      # Separation of duties
dismiss_stale_reviews: true           # Re-review after changes
enforce_admins: true                  # Even you follow the rules
require_status_checks:
  contexts:
    - "🔒 SEAL"
    - "governance-proof"              # Add more checks
    - "scope-drift-guard"
```

### Enable Auto-Approve (if using GitHub App)

1. Set `TF_AUTO_APPROVE_ENABLED=true`
2. Configure `TF_REVIEW_APP_ID` and `TF_REVIEW_APP_PRIVATE_KEY`
3. Install the GitHub App on the repo

### Enable CODEOWNERS

Create `.github/CODEOWNERS`:
```
* @your-username
backend/ @backend-team
frontend/ @frontend-team
```

---

## FAQ

### What if nightly fails?

It's informational. Fix it during normal work hours, not at 2 AM.

### What if I need E2E before merging?

Run nightly manually: Actions → Nightly Heavy Checks → Run workflow

### What about security vulnerabilities?

- Critical/High: Fixed in normal workflow (Snyk PRs, etc.)
- Nightly catches anything that slips through
- Release gate catches everything before shipping

### Why not just remove all checks?

You still want:
- Build to work (catches typos, missing deps)
- Unit tests to pass (catches regressions)
- Warnings as errors (maintains code quality)
- Drift guards (enforces patterns)

The goal is **fast + deterministic**, not **zero safety**.

---

## Workflow Files

| File | Purpose | Required? |
|------|---------|-----------|
| [seal-gate-fast.yml](../workflows/seal-gate-fast.yml) | Fast PR gate | ✅ YES |
| [nightly.yml](../workflows/nightly.yml) | Heavy checks overnight | ❌ NO |
| [release-compliance.yml](../workflows/release-compliance.yml) | Full compliance for releases | ✅ for v* tags |

---

*Solo Velocity Mode: Real safety without process theater.*
