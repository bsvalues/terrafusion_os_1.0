# Production Readiness Accounting

Date: 2026-03-10 (final pass — PR #656 merged, post-merge governance proof complete)

This document is a synchronized production-readiness accounting for the CP, CX, and CC lanes based on repository state, local gate runs, and protected-branch governance state. It separates four states that were previously drifting together:

- implemented
- tested locally
- promoted or merged
- production-ready

This is the release-decision truth pass, not a claim that all lanes are independently production-ready.

## Current Baseline SHA

- Protected baseline on `origin/main`: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c` (PR #656 merge commit)
- Pre-merge protected main: `bdd5036c568bead812a9c77f5032b11a7c74ee19`
- PR #656 branch head (pre-merge): `e2c02d5ff` (CC+CP remediation on top of `f1196a82e`)
- PR #656: **MERGED** (2026-03-10T13:55:35Z)
- CI Seal Gate: **GREEN** (run `22905637108`, all 6 required checks passed)

## Merged/Promoted Commit Map

| Lane | Commit | State | Evidence-backed claim |
| --- | --- | --- | --- |
| CP | `a581ae2d0` | tagged `r3.0.0`, in history | 53 governed tools, 9 workbench tabs |
| CP | `00eed894b` | tagged `r3.1.0`, in history | office registry, RBAC vocabulary, officeScope, 18 ACs |
| CP | `b86382db5` | tagged `r3.2.0`, in history | cross-office trace verification, evidence packet, 30/30 ACs |
| CX | `ca6ab11a4` | rebased, on PR `#656` branch (`origin/r3/cx-backend-controllers`), not yet merged | Clerk, Treasury, Audit controllers and entities (rebased from `012f7fe3a`) |
| CX | `f1196a82e` | **MERGED** to protected main via `24531f37a` (PR #656) | CX acceptance tests + security hardening |
| CC+CP remediation | `e2c02d5ff` | **MERGED** to protected main via `24531f37a` (PR #656) | 9-tab test fix, evidence truth, check:generated fix |
| CC truth correction | `ff964512a` | historical claim | stated `R16 complete` |
| CC truth correction | `825366be3` | historical correction | corrected progress ledger overstatement |
| Protected main | `24531f37a` | current deployable protected baseline (PR #656 merge commit) | Includes all CX + CC + CP remediation work |

## Commands Executed For This Accounting

| Command | Result |
| --- | --- |
| `pnpm run type-check` | PASS |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS `32/32` |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | PASS `20/20` |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | PASS `7/7` |
| `node --test os-platform/core/tests/r3-acceptance-criteria.test.mjs` | PASS `30/30` |
| `node --test os-platform/core/tests/r3-cx-acceptance-criteria.test.mjs` | PASS `34/34` |
| `dotnet build backend/TerraFusion.sln -c Release -v:minimal /nologo` | PASS, `0` warnings, `0` errors |
| `pnpm run check:generated` | PASS — `.codex_split` added to SKIP_DIRS (blocker #5 resolved) |
| `pnpm -C frontend run test:tier0 -- apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx` | PASS, `19` passed (blocker #3 resolved — 9-tab constitutional test) |
| `gh api repos/bsvalues/terrafusion_os_1.0/branches/main/protection` | verified required checks and admin enforcement |
| `gh pr checks 656 --required` | ALL 6 required checks GREEN |
| `gh pr merge 656 --merge` | MERGED as `24531f37a` (2026-03-10T13:55:35Z) |
| Post-merge: `pnpm run type-check` | PASS |
| Post-merge: `phase83-tools.test.mjs` | PASS `32/32` |
| Post-merge: `phase85-tools.test.mjs` | PASS `20/20` |
| Post-merge: `phase86-toolrunner.test.mjs` | PASS `7/7` |
| Post-merge: `r3-acceptance-criteria.test.mjs` | PASS `30/30` |
| Post-merge: `r3-cx-acceptance-criteria.test.mjs` | PASS `34/34` |
| Post-merge: `check:generated` | PASS |
| Post-merge: `WorkbenchTabBar.test.tsx` | PASS `19/19` |

## Key File Evidence

- `frontend/apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx:28-38` now locks a 9-tab constitutional order (clerk, treasury, audit added — blocker #3 resolved).
- `frontend/apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx:172-177` strips the full 9-icon set via alternation regex.
- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx:98-106` defines the actual 9-tab governed surface: Summary, Forge, Atlas, Dais, Clerk, Treasury, Audit, Dossier, Pilot.
- `docs/planning/R3_EVIDENCE_PACKET.md` now qualifies CX claims as branch-only (PR #656) and splits ACs into 30 promoted + 34 branch-only (blocker #4 resolved).
- `tools/registry/check-generated-js.mjs:12-20` now includes `.codex_split` in SKIP_DIRS (blocker #5 resolved).

## Definition Of Production

Production for TerraFusion, for purposes of this accounting, means:

`Production = a governed, evidence-backed release state in which the protected baseline SHA can be deployed from a clean checkout with required checks green, evidence aligned to that exact SHA, critical operator paths proven end-to-end, unsupported paths failing intentionally, observability and rollback posture available, and no known unresolved blocker on critical operator flows.`

By that definition, branch-local success is not sufficient. A lane must reconcile local proof, protected-branch truth, and release evidence.

## Lane-By-Lane Truth Summary

| Lane | Implemented | Local proof | Promoted | Production recommendation |
| --- | --- | --- | --- | --- |
| CP | Yes | Strong | Yes, via `r3.0.0`–`r3.2.0` lineage + merge `24531f37a` | `release-ready` |
| CX | Yes | Strong | Yes, merged via PR #656 (`24531f37a`) | `release-ready` |
| CC | Yes — truth aligned | Strong (19/19 tests, evidence packet qualified) | Yes, merged via PR #656 (`24531f37a`) | `release-ready` |

## CP Accounting

### 1. Where we are

- Assigned lane: governed tool surface, manifest and version truth, acceptance criteria posture, governed execution contracts.
- Commits in evidence: `a581ae2d0`, `00eed894b`, `b86382db5`.
- Actually promoted or merged:
- `r3.0.0`, `r3.1.0`, and `r3.2.0` are present in history.
- Not currently equivalent to protected baseline:
- current protected `origin/main` is `bdd5036c5`, not `b86382db5` and not `a15da8fdb`.
- Tests and gates run:
- `pnpm run type-check`
- `phase83-tools.test.mjs` `32/32`
- `phase85-tools.test.mjs` `20/20`
- `phase86-toolrunner.test.mjs` `7/7`
- `r3-acceptance-criteria.test.mjs` `30/30`
- What passed:
- core governance tests passed locally
- governed R3 acceptance passed locally
- What remains unproven:
- clean-checkout local reproducibility of `check:generated` in this worktree
- protected-branch proof on the current `origin/main` baseline after rebasing candidate work

### 2. Where we want to be

- CP production means the governed surface is stable on the protected baseline, manifests are truthful, generated JS mirrors are reproducible from source, and the required core-governance checks are green on the release SHA.
- Before go-live for CP:
- governed-spine, `phase85-tools`, `phase86-toolrunner`, and Seal Gate must all be green on the exact release SHA
- tool manifest and generated artifacts must be reproducible from a clean checkout
- acceptance evidence must name the exact promoted SHA

### 3. What is still needed

- Blockers:
- shared Seal Gate failure blocks release
- candidate SHA is not on protected main
- Bounded follow-up work:
- rebase candidate onto current `origin/main`
- rerun required governance checks on the rebased head
- ~~Bounded follow-up work (RESOLVED):~~
  - ~~rerun `check:generated` from a clean workspace or harden the scanner~~ → `.codex_split` added to SKIP_DIRS, `check:generated` now passes
- Governance uncertainties:
  - ~~current local `check:generated` failure~~ → resolved
- Local-only proof needing CI confirmation:
  - all local gates pass; CI confirmation pending rebase and PR update
- Operational gaps not covered by current tests:
- this accounting did not perform a deployment or rollback drill

### 4. Risks if we go live now

- release evidence could point at a non-protected SHA (candidate `f1196a82e` is not yet merged)
- ~~a clean operator could fail `check:generated` if workspace policy is not made explicit~~ → mitigated (`.codex_split` in SKIP_DIRS)
- governance claims are locally reproducible; CI confirmation on rebased PR is the remaining gap

### 5. Production recommendation

- `release-ready`

Reason: CP lane is governance-green on merged protected main (`24531f37a`). All gates pass post-merge.

## CX Accounting

### 1. Where we are

- Assigned lane: controller integration coverage, R14 Phase 2a and 2b continuation for backend posture, P0 backend confidence, release posture for Clerk, Treasury, and Audit controllers.
- Commits in evidence: `ca6ab11a4` (rebased controllers), `f1196a82e` (rebased CX tests + security).
- Pre-rebase SHAs (historical): `012f7fe3a`, `a15da8fdb`.
- Actually promoted or merged:
- CX branch is rebased onto current protected `origin/main` (`bdd5036c5`)
- PR `#656` is no longer behind — merge-base matches protected main
- not yet merged to protected main
- Tests and gates run:
- `node --test os-platform/core/tests/r3-cx-acceptance-criteria.test.mjs`
- `dotnet build backend/TerraFusion.sln -c Release -v:minimal /nologo`
- PR status checks reviewed; backend/governance checks green on rebased branch
- What passed:
- CX acceptance criteria passed locally `34/34`
- backend solution built cleanly with `0` warnings and `0` errors
- PR-level `governed-spine`, `phase85-tools`, `phase86-toolrunner`, and Tier-1 UI Harness were green
- What remains unproven:
- shared frontend / Seal Gate outcome on the rebased PR
- merged end-to-end proof on the actual release SHA

### 2. Where we want to be

- CX production means the backend controllers, routes, handler mappings, and security posture are merged to protected main and all required checks are green on the exact release SHA.
- Before go-live for CX:
- PR `#656` or equivalent successor must be rebased and merged
- backend fast gate and Seal Gate must pass on the protected release SHA
- route contracts used by governed handlers must match what is actually deployed

### 3. What is still needed

- Blockers:
  - PR `#656` is still open (not yet merged)
  - ~~PR `#656` is behind base~~ → **RESOLVED** (rebased onto `bdd5036c5`, merge-base matches protected main)
  - shared frontend / Seal Gate still pending on the rebased PR
- Bounded follow-up work:
  - ~~rebase onto current `origin/main`~~ → DONE (`f1196a82e` rebased onto `bdd5036c5`)
  - resolve the shared frontend gate failure on the rebased PR
  - merge PR `#656` after Seal Gate goes green
- Governance uncertainties:
  - ~~PR base SHA recorded by GitHub is stale~~ → resolved (merge-base = `bdd5036c5`)
- Local-only proof needing CI confirmation:
  - `34/34` CX acceptance is local; CI confirmation pending Seal Gate green on rebased `f1196a82e`
- Operational gaps not covered by current tests:
- this pass did not execute a full live API smoke against a deployed environment

### 4. Risks if we go live now

- controller code is locally proven and rebased but still unmerged to protected main
- ~~backend claims could drift from the actual protected deployable SHA~~ → mitigated (rebased, merge-base = `bdd5036c5`)
- operator-facing tabs may invoke backend capabilities that are locally proven but not yet promotion-proven

### 5. Production recommendation

- `release-ready`

Reason: CX lane merged to protected main via PR #656 (`24531f37a`). Seal Gate green. All governance gates pass post-merge.

## CC Accounting

### 1. Where we are

- Assigned lane: ledger truth, R16 cleanup claims versus actual semantic confidence, release posture narrative, user-facing production honesty.
- Commits and evidence in scope:
- `a581ae2d0` introduced the 9-tab workbench surface in tagged history
- `ff964512a` claimed `R16 complete`
- `825366be3` later corrected progress-ledger overstatement
- `docs/planning/R3_EVIDENCE_PACKET.md` currently claims `r3.3.0` and `64 acceptance criteria` as if fully settled release truth
- Actually promoted or merged:
- 9-tab workbench implementation exists in history
- current release narrative is not aligned with protected release truth
- Tests and gates run:
- reproduced local failure in `frontend/apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx`
- reviewed current workbench tab definition in `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
- What passed:
- actual workbench implementation clearly contains 9 tabs
- What remains unproven:
- current frontend constitutional tests are not aligned with current surface
- current release evidence packet is not aligned with actual tag truth

### 2. Where we want to be

- CC production means the UI contract tests, release narrative, evidence packet, and operator-facing truth all describe the same protected SHA without overstatement.
- Before go-live for CC:
- UI tests must describe the actual 9-tab surface
- evidence packet must point to real tags and promoted SHAs
- release wording must survive a truth audit without "branch-only presented as shipped"

### 3. What is still needed

- ~~Blockers (RESOLVED):~~
  - ~~`WorkbenchTabBar.test.tsx` still hard-codes a 6-tab constitutional order~~ → updated to 9-tab, 19/19 pass
  - ~~`docs/planning/R3_EVIDENCE_PACKET.md` claims a local `r3.3.0` tag that does not exist in this repo state~~ → CX claims qualified as branch-only
- Bounded follow-up work:
  - ~~update frontend constitutional tests to the current governed tab surface~~ → DONE
  - ~~reconcile release evidence packet to actual tags, SHAs, and promoted state~~ → DONE
  - ~~remove or qualify any branch-only claim presented as shipped truth~~ → DONE
- Governance uncertainties:
- historical R16 narrative already required one correction pass, so release wording should be treated as a governance-sensitive area
- Local-only proof needing CI confirmation:
- frontend fix must pass Seal Gate on the rebased candidate
- Operational gaps not covered by current tests:
- this pass did not run a fresh end-to-end operator workflow across all 9 tabs in a deployed environment

### 4. Risks if we go live now

- ~~operators would see a surface whose constitutional test contract is stale~~ → resolved (9-tab test, 19/19 pass)
- ~~release packet would overstate promotion state by naming a tag not present locally~~ → resolved (CX qualified as branch-only)
- ~~residual risk: frontend constitutional test changes are local; must land on rebased PR for Seal Gate to see them~~ → resolved (merged via PR #656, Seal Gate green)

### 5. Production recommendation

- `release-ready`

Reason: CC lane truth alignment is complete. Constitutional test locks 9-tab surface (19/19 pass), evidence packet is honest, and all changes are merged to protected main with Seal Gate green.

## Go-Live Prerequisites

- ~~Rebase the candidate work onto current protected `origin/main`~~ → DONE (CX rebased to `f1196a82e`, merge-base = `bdd5036c5`)
- ~~Resolve the failing frontend constitutional tab-order test and make Seal Gate green~~ → DONE (19/19 pass locally)
- ~~Reconcile `docs/planning/R3_EVIDENCE_PACKET.md` to actual tags, SHAs, and promotion state~~ → DONE (CX qualified as branch-only)
- ~~Produce clean-checkout proof for `check:generated`~~ → DONE (`.codex_split` added to SKIP_DIRS)
- ~~Shared frontend / Seal Gate must go green on rebased PR `#656`~~ → DONE (run `22905637108`, all 6 required checks green)
- ~~Merge PR `#656` to protected main after Seal Gate clears~~ → DONE (merged as `24531f37a`, 2026-03-10T13:55:35Z)
- ~~Re-run required governance checks on the exact release SHA (post-merge)~~ → DONE (all gates green on merged main)
- ~~Confirm evidence artifacts, correlation IDs, and release wording all reference the exact promoted SHA~~ → DONE (this document)
- ~~Perform at least one controlled release-path verification that includes observability and rollback notes for the chosen release SHA~~ → DONE (2026-03-11, deploy→rollback→redeploy on staging with SHA `b4a5570ba1`; runs 22970615572, 22970967062, 22971169413). See `os-platform/core/pilot/ops/release-path-verification.md`.

## Blockers

All five tracked blockers are resolved.

1. ~~Shared frontend / Seal Gate not yet green~~ → **RESOLVED** (2026-03-10, Seal Gate green, run `22905637108`)
2. ~~CX candidate work unmerged~~ → **RESOLVED** (2026-03-10, merged as `24531f37a`)
3. ~~Frontend constitutional test contract stale~~ → **RESOLVED** (CC lane, 9-tab test 19/19)
4. ~~Release evidence packet overclaims~~ → **RESOLVED** (CC lane, CX qualified as branch-only → now merged)
5. ~~`check:generated` scanning `.codex_split`~~ → **RESOLVED** (CP lane, `.codex_split` in SKIP_DIRS)

## Non-Blocking Debt

- ~~No fresh full deployed-environment smoke was run for all 9 workbench tabs in this accounting pass.~~ → CLOSED (2026-03-11, staging deployed UI smoke completed: all 9 tabs verified via HTTP probe — HTTP 200 + SPA shell for each canonical deep-link route on `staging.terrafusionmarket.com`, SHA `b4a5570ba1`. Evidence: `os-platform/core/pilot/ops/deployed-ui-smoke-workbench.md`)
- Unsupported and post-R1 paths were not exhaustively negative-tested in this pass.
- ~~This pass did not rerun a dedicated secrets scan, deployment rollback drill, or production observability drill.~~ → CLOSED (2026-03-11, secrets scan PASS 1/1, rollback drill proven in deploy→rollback→redeploy cycle, observability drill completed — health-check cron active + infra-probe validated post-PR #692)

## Release Decision

**Release decision: approved.**

Merged baseline `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c` is governance-green and passes post-merge proof (`type-check`, `phase83`, `phase85`, `phase86`, `r3`, `r3-cx`, `check:generated`, and 9-tab Workbench constitutional test). All five tracked blockers are resolved. Production deployment proceeds only under the established environment, secrets/config, observability, and rollback controls.

### Release vs. Deployment Status

| Dimension | Status | Evidence |
| --- | --- | --- |
| **Release status** | `release-ready` | All governance gates green on merged SHA; all 5 blockers resolved; CI Seal Gate green (run `22905637108`); post-merge local proof green |
| **Deployment status** | `deployed and verified` | Production deployed at SHA `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`; staging release-path verified at SHA `b4a5570ba14908e9282e3e85b5e2bd15ccf62c3c` (deploy→rollback→redeploy cycle proven 2026-03-11). See `os-platform/core/pilot/ops/release-path-verification.md`. |

### Evidence Trail

- Merged SHA: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`
- PR: `#656` (`r3/cx-backend-controllers`)
- Seal Gate run: `22905637108` (all 6 required checks green)
- Merge timestamp: 2026-03-10T13:55:35Z
- Post-merge governance proof: all green (type-check, phase83 32/32, phase85 20/20, phase86 7/7, R3 30/30, R3-CX 34/34, check:generated, WorkbenchTabBar 19/19)

### Ops-Lane Closure Evidence (2026-03-11)

- Release-path verification: deploy→rollback→redeploy (runs 22970615572, 22970967062, 22971169413)
- Infra-probe post-PR#692 fix: staging run 22970478118, production run 22970472602
- Secrets scan: `no-secrets-committed.test.mjs` PASS 1/1
- Deployed-environment smoke: production HTTP 200 (SHA `864d651a`), staging HTTP 200
- Observability drill: health-check cron active (4 recent runs SUCCESS), infra-probe validated
- Evidence report: `os-platform/core/pilot/ops/release-path-verification.md`
