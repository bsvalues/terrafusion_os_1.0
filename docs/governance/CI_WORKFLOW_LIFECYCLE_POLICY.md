# CI Workflow Lifecycle Policy

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-02-12

---

## Purpose

Keep `main` **green** under required checks. Prevent "red-main theater" from non-required workflows. Ensure every workflow respects the **governed spine** and quarantine invariants.

This policy codifies the posture established in PR #302 (CI noise triage) and provides rules for adding, promoting, demoting, and removing workflow push triggers.

---

## Workflow Classes

| Class | Triggers Allowed | Can Block Merge? | Stability Expectation | Examples |
|-------|-----------------|------------------|----------------------|----------|
| **REQUIRED** | `pull_request`, `push` (main) | **Yes** | Must be consistently green | SEAL Gate, governed-spine, phase85-tools, phase86-toolrunner, Tier-1 UI Harness |
| **PUSH-OPTIONAL** | `push` (scoped), `pull_request` | No | Should be green; demote if noisy | yaml-sanity, deps fast lane, perf budget, governance-proof |
| **SCHEDULED** | `schedule`, `workflow_dispatch` | No | May fail without blocking delivery; owner responds within SLA | security daily, CI/CD nightly, accessibility weekly |
| **MANUAL** | `workflow_dispatch` only | No | Can be experimental or expensive; never blocks merges | legacy pipelines, silenced PR #302 workflows |
| **DEPRECATED** | none (file retained for history) | No | Must be archived or deleted within 90 days of deprecation | — |

### Current Required Checks (5)

These are enforced by GitHub branch protection on `main`:

1. `🔒 TerraFusion Seal Gate` — governance, quarantine, tests
2. `governed-spine` — repo shape guard
3. `phase85-tools` — platform tool tests
4. `phase86-toolrunner` — tool runner tests
5. `🧪 Tier-1 UI Harness Validation` — UI smoke tests

**No workflow outside this list may be added to required checks without a governance PR.**

---

## Promotion Rules

A workflow may be **promoted from MANUAL to PUSH-OPTIONAL** only if:

1. It runs inside **governed paths** — no quarantined root assumptions; all `working-directory` values exist in `git ls-tree HEAD`.
2. It is **deterministic** — no flake rate above 5% over 20 consecutive runs.
3. It completes within **10 minutes** (PUSH-OPTIONAL budget).
4. It produces **actionable failures** — clear logs, meaningful exit codes, artifacts if applicable.
5. It passes for **20 consecutive runs** on `main` (via `workflow_dispatch` or schedule).

A workflow may be **promoted from PUSH-OPTIONAL to REQUIRED** only if:

1. It protects **platform integrity** (security, governance, build, or compliance).
2. It has an **identified owner** who responds same-day.
3. It meets the stricter SLA (see Ownership section below).
4. Promotion is documented in a governance PR with rationale.

---

## Demotion Rules

**Immediately demote** a non-required workflow to `workflow_dispatch` if any of:

- It fails on `main` due to **path assumptions** or quarantined directories.
- It creates **notification spam** (failures without merge-blocking value).
- It is **flaky and unowned** (no response within SLA window).
- It is **redundant** with an existing required check.

**Demotion procedure:**

1. Remove `push:` from the workflow's `on:` block.
2. Retain `workflow_dispatch:` (and `schedule:` if applicable).
3. Document in the PR body: why, what changed, how to rollback, owner.
4. Reference this policy in the commit message.

---

## Quarantine + Spine Constraints (Non-Negotiable)

- Workflows must treat repo structure as **git-tracked truth** (`git ls-tree HEAD`).
- No workflow may assume legacy root directories exist.
- If a workflow's `working-directory` or `paths:` filter references a quarantined path:
  - Rewrite to target governed directories, **or**
  - Demote to MANUAL, **or**
  - Deprecate.
- The workflow-paths test suite (`scripts/governance/__tests__/workflow-paths.test.mjs`) validates path integrity — 13 tests / 5 suites.
- Stale path exemptions are tracked in `scripts/governance/workflow-paths.mjs` → `STALE_PATH_EXEMPTIONS`.

---

## Trigger Scoping Guidance

Use `paths` / `paths-ignore` to prevent irrelevant changes from triggering expensive workflows.

| Workflow Type | Recommended Filter |
|---------------|-------------------|
| Docs-only | `paths: ['docs/**', '**/*.md']` |
| Heavy build | `paths-ignore: ['docs/**', '**/*.md', 'QUARANTINE/**']` |
| Governance | No path filter (must always run) |
| Frontend | `paths: ['frontend/**', 'experience-suite/**']` |

**Never use `paths:` on REQUIRED workflows** — they must fire on every PR/push to prevent bypass.

---

## Operational Runbook

### Adding a New Workflow

1. Start as **MANUAL** (`workflow_dispatch` only).
2. Validate locally: `make governance` / `pwsh tools/dev/governance.ps1`.
3. Confirm `working-directory` values exist in governed spine.
4. Run 20 times via `workflow_dispatch` against `main`.
5. If stable, promote to PUSH-OPTIONAL via governance PR.

### Silencing a Noisy Workflow

1. Confirm the workflow is **not required** (check branch protection).
2. Remove `on: push` — retain `workflow_dispatch` and any `schedule`.
3. File a tracking issue with root cause category.
4. Document in PR body per demotion procedure above.

### Re-enabling After Fix

1. Fix the underlying failure (path, config, code bug, runner).
2. Add `workflow_dispatch` trigger if not present.
3. Run 20 times via dispatch against `main`.
4. If passing, add `push: branches: [main]` back.
5. Monitor for 1 week before considering stable.

### Responding to Red Main

1. Check if the failing workflow is **REQUIRED**.
2. If REQUIRED: **fix immediately** — this is a governance outage.
3. If PUSH-OPTIONAL: demote to MANUAL if not fixable same-day.
4. If SCHEDULED/MANUAL: file issue, assign owner, no urgency unless security-critical.

---

## Ownership & SLAs

| Class | Response SLA | Escalation |
|-------|-------------|------------|
| **REQUIRED** | Same day | Governance outage — no feature work until restored |
| **PUSH-OPTIONAL** | 3 business days | Demote to MANUAL if unresolved |
| **SCHEDULED** | 3 business days (security: same day) | Disable schedule if persistently broken |
| **MANUAL** | Best effort | May be deprecated if stale >90 days |
| **DEPRECATED** | N/A | Delete file within 90 days |

---

## Audit Trail Requirements

Any trigger promotion or demotion must be documented in the PR body:

- **Why**: root cause or justification
- **What changed**: specific `on:` block diff
- **How to rollback**: exact revert steps
- **Owner**: who is responsible for the workflow going forward

Reference this policy: `docs/governance/CI_WORKFLOW_LIFECYCLE_POLICY.md`

---

## Current Inventory Snapshot

> **Enforced by:** `scripts/governance/workflow-inventory.mjs --check`
> Verify: `node scripts/governance/workflow-inventory.mjs --check`
> Update: `node scripts/governance/workflow-inventory.mjs --write`

<!-- INVENTORY-SNAPSHOT-BEGIN -->
| Class | Count |
|-------|-------|
| REQUIRED | 3 |
| PUSH-OPTIONAL | 40 |
| SCHEDULED | 17 |
| MANUAL | 19 |
| DEPRECATED | 2 |
| **Total** | 81 |

**REQUIRED** (3):
- `core-governance-gates.yml`
- `seal-gate-fast.yml`
- `tier1-ui-harness.yml`

**PUSH-OPTIONAL** (40):
- `accessibility.yml`
- `accreditation-compat.yml`
- `ai-swarm-safety.yml`
- `atlas-validation.yml`
- `autonomy-break-glass-guard.yml`
- `autonomy-break-glass-incident-publisher.yml`
- `autonomy-evidence-publisher.yml`
- `autonomy-incident-label-guard.yml`
- `autonomy-incident-publisher.yml`
- `autonomy-tpi-guard.yml`
- `benton-runner-smoke.yml`
- `benton.yml`
- `build-validation.yml`
- `ci-cd-pipeline.yml`
- `ci-verified.yml`
- `ci.yml`
- `county-kit-parity.yml`
- `deps-fast-lane.yml`
- `designctl.yml`
- `gate-pipeline.yml`
- `golden-corpus-compat.yml`
- `governance-proof.yml`
- `gpt-rag.yml`
- `markdown-lint.yml`
- `observability-ci.yml`
- `opa-policy-tests.yml`
- `release-compliance.yml`
- `release-lane-guard.yml`
- `release-lane.yml`
- `release-validation.yml`
- `rust-security-gates.yml`
- `rust-verify.yml`
- `slsa-provenance.yml`
- `spec-gates.yml`
- `terra-levy-tests.yml`
- `terrafusion-ci-cd-production.yml`
- `testing.yml`
- `tfctl-ci.yml`
- `ui-governance.yml`
- `yaml-sanity.yml`

**SCHEDULED** (17):
- `accessibility-audit.yml`
- `accreditation-oracle-health.yml`
- `autonomy-pr-lane.yml`
- `break-glass-drill.yml`
- `ci-cd.yml`
- `external-verify.yml`
- `governance-audit.yml`
- `governance-import-hygiene-nightly.yml`
- `nightly.yml`
- `oracle-health.yml`
- `perf-skill-audit.yml`
- `performance-budget.yml`
- `sbom.yml`
- `security-compliance-ci.yml`
- `security-compliance.yml`
- `security.yml`
- `terraforge-ci.yml`

**MANUAL** (19):
- `autonomy-incident-triage.yml`
- `baseline-guard.yml`
- `ci-cd-main.yml`
- `code-intel.yml`
- `deployment.yml`
- `e2e-smoke.yml`
- `frontend-ci-isolated.yml`
- `grfe-ci.yaml`
- `infrastructure-cicd.yml`
- `kubernetes-infrastructure-ci.yml`
- `manifest-contract-guard.yml`
- `performance-regression.yml`
- `scope-drift-guard.yml`
- `tag-lint.yml`
- `terrafusion-gate-enforcement.yml`
- `terrafusion-pipeline.yml`
- `test.yml`
- `visual-regression.yml`
- `wave1-freeze-guard.yml`

**DEPRECATED** (2):
- `autonomy-casefile-publisher.yml`
- `dotnet-test.yml`
<!-- INVENTORY-SNAPSHOT-END -->

**Schedules preserved post-triage:**

| Workflow | Cron | Cadence |
|----------|------|---------|
| `accessibility-audit.yml` | `0 0 * * 1` | Weekly (Monday) |
| `ci-cd-pipeline.yml` | `0 2 * * *` | Nightly (2 AM UTC) |
| `security.yml` | `0 6 * * *` | Daily (6 AM UTC) |

---


## Verification Commands

```bash
# Full governance suite (91 tests / 25 suites)
make governance
# or
pwsh tools/dev/governance.ps1

# Individual suites
node --test scripts/quarantine/__tests__/*.test.mjs                     # Quarantine (23t/4s)
node --test os-platform/core/tests/phase83-tools.test.mjs               # Phase83 (32t/11s)
node --test scripts/governance/__tests__/workflow-paths.test.mjs        # Workflow paths (13t/5s)
node --test scripts/governance/__tests__/workflow-inventory*.test.mjs   # Inventory (23t/5s)

# Inventory snapshot check
node scripts/governance/workflow-inventory.mjs --check
node scripts/governance/workflow-inventory.mjs --write  # update if needed

# Check which workflows fire on push
gh run list --branch main --limit 20 --json name,event,conclusion \
  --jq '.[] | select(.event == "push") | "\(.conclusion)\t\(.name)"'
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [CI_GOVERNANCE_INDEX.md](CI_GOVERNANCE_INDEX.md) | CI workflow quick reference |
| [QUARANTINE_SOP.md](QUARANTINE_SOP.md) | Quarantine governance procedures (includes CI noise triage history) |
| [SEAL_ONLY_REQUIRED_CHECK_POLICY.md](SEAL_ONLY_REQUIRED_CHECK_POLICY.md) | SEAL gate policy and rationale |
| [AGENTS.md](../../AGENTS.md) | Core governance rules |

---

**Government. Transcended. Governed.**
