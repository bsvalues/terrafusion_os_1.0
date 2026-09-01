# Branch Protection — `main`

**Source of truth:** `scripts/governance/branch-protection.sh`
**Documented in workflow:** `.github/workflows/branch-protection-snapshot.yml`
**Prometheus T5 / PR-5 (2026-05-12).**

## Current state vs. target state

Pre-PR-5, only **six** checks blocked merge to `main`:

| Check | Pre-PR-5 | Target (PR-5) |
|---|---|---|
| 🔒 TerraFusion Seal Gate | required | required |
| Backend Gate (.NET 8) / Canonical .NET Test Run | required | required |
| **Backend .NET Tests / Canonical .NET Test Run** | advisory | **required** |
| 🧪 Tier-1 UI Harness Validation | required | required |
| phase85-tools | required | required |
| phase86-toolrunner | required | required |
| governed-spine | required | required |
| **Vitest Full Suite (merge gate)** | advisory | **required** |
| **Migration Apply Check** | did not exist | **required** |
| CodeQL | advisory (`continue-on-error: true`) | advisory (`continue-on-error` removed by PR-5 — now fails the security-scan job, blocking the Seal Gate dependency) |
| Trivy | advisory (`continue-on-error: true`) | advisory (same as CodeQL above) |

Two-Person Integrity (`required_approving_review_count`) was `0`. After PR-5 it is `1`.

Every name in the table above is the **exact** required-context string, emoji included. The
drift-guard matches these literally across all three sources, so a human-readable paraphrase
here will fail the build rather than quietly describing a check that is not the one enforced.

## What each required check verifies

- **🔒 TerraFusion Seal Gate** — composite gate aggregating quality-gate, classify_changes, contract-guard; runs the `ci-seal-gate.ps1` script that asserts canon invariants.
- **Backend Gate (.NET 8)** — reusable `dotnet-test.yml` over `backend/TerraFusion.sln`: the
  `CostForge`, `CurrentUse`, `Levy`, `SalesForge` and `Integration` suites. It does **not** contain
  `TerraFusion.Unit.Tests`, so it cannot observe anything that project asserts — including the
  Phase 10 async-safety governance guards.
- **Backend .NET Tests** — the same reusable workflow over the root `TerraFusion.sln`: `Unit.Tests`,
  `Tests` and `Integration.Tests`, ~3,850 tests, with the `Category!=DockerRequired&Category!=Vector`
  filter (CI-HYGIENE-4A).

  These two are **not** a subset and a superset. `Integration.Tests` is the only project they share,
  so requiring either one alone leaves the other's suites entirely ungated. Both are required, and
  neither may be dropped on the grounds that "the other .NET gate is green".

  This entry previously attributed the root solution's test count and its `Category!=` filter to
  **Backend Gate**, which runs neither. That misattribution is why the required-checks list carried
  the narrower gate while the prose described the broader one — see the regression note below.
- **🧪 Tier-1 UI Harness Validation** — design-system token enforcement + a11y baseline on critical UI surfaces.
- **phase85-tools / phase86-toolrunner** — internal tooling contracts (registry + toolrunner). Constitutional.
- **governed-spine** — sovereign-spine boundary checks (Phase 7 seal).
- **Vitest Full Suite (merge gate)** — `frontend/` full vitest run with skip-ceiling enforcement (sealed 2026-03-21 at 222). This is the *frontend* analog of the backend gate; pre-PR-5 it was running but not required.
- **Migration Apply Check** — runs `dotnet ef database update` against a fresh pgvector/pg16 container whenever `Migrations/`, `TerraFusionDbContext.cs`, or `Entities/**` change. Lints new migrations for destructive ops outside `Down()`.

## How to apply the change

Branch protection is a **privileged operation**. CI does not (and should not) mutate it. After this PR merges, an authorized maintainer runs:

```bash
bash scripts/governance/branch-protection.sh
```

The script:

1. Captures current protection into `branch-protection-snapshot-<UTC>.json` (audit trail + rollback artifact).
2. PUTs the new policy to `repos/$REPO/branches/main/protection`.
3. Prints a verification command.

## Rollback path

If something explodes after the apply:

```bash
gh api -X PUT "repos/bsvalues/terrafusion_os_1.0/branches/main/protection" \
  --input branch-protection-snapshot-<UTC>.json
```

The pre-apply snapshot from step 1 above is the rollback input.

## Two-Person Integrity scope (Fix #5 caveat)

The existing `autonomy-tpi-guard.yml` workflow only fires for PRs labeled `autonomy`. Extending TPI to *all* PRs at the workflow level conflicts with how that policy file is currently scoped (it's a tier-0 autonomy control with specific bot-pattern enforcement, not a general second-reviewer gate).

PR-5 takes the **simpler, more durable path**: `required_approving_review_count=1` enforced through branch protection. This guarantees every PR gets at least one human approver without overloading the autonomy-specific TPI policy. If a future slice wants to extend TPI semantics (signature verification, Rekor, bot-exclusion) to non-autonomy PRs, that is its own design conversation; the gap is intentional, not accidental.

## Audit invariants

- The required-checks list lives in **three** places that must agree:
  1. `.github/workflows/branch-protection-snapshot.yml` (canonical comment + drift-guard step)
  2. `scripts/governance/branch-protection.sh` (the JSON heredoc)
  3. This document
- The `branch-protection-snapshot.yml` workflow has a drift-guard step that fails the build if any required check from the canonical list is missing from `branch-protection.sh`. That keeps the three sources from silently diverging.
- The script captures a JSON snapshot of prior state on every run. Those snapshot files are the audit artifact.

## Regression: why both .NET gates are required (#1449)

PR #1449 merged with `Backend .NET Tests / Canonical .NET Test Run` **red**. It was not blocked,
because no .NET context was required on `main` at all: live protection carried five contexts while
this document and `branch-protection.sh` codified eight. Nothing compared the codified list to the
live API, so the gap produced no failing build.

Requiring the codified list as it then stood would **not** have blocked #1449 either. The only .NET
context in it was `Backend Gate (.NET 8)`, which runs `backend/TerraFusion.sln` and therefore never
executes `TerraFusion.Unit.Tests` — it was green on the same commit where the full suite failed.

The failure it missed was real: `AtlasProjectionProcessHost.ResolvePermissionFlag` used
`.GetAwaiter().GetResult()`, tripping `AllApiServices_NoGetAwaiterGetResult`. Every pull request
opened afterwards inherited that red run from `main`.

Use #1449 as the regression case for this list. A change to the required checks is correct only if,
replayed against #1449's head, the merge would have been blocked.
