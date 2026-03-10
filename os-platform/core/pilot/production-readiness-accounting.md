# Production Readiness Accounting

Date: 2026-03-12 (final consolidation — rebased candidate SHA reconciled)

This document is a synchronized production-readiness accounting for the CP, CX, and CC lanes based on repository state, local gate runs, and protected-branch governance state. It separates four states that were previously drifting together:

- implemented
- tested locally
- promoted or merged
- production-ready

This is the release-decision truth pass, not a claim that all lanes are independently production-ready.

## Current Baseline SHA

- Protected baseline on `origin/main`: `bdd5036c568bead812a9c77f5032b11a7c74ee19`
- Rebased candidate SHA (PR #656 head): `f1196a82e330dbceafa32a1dbabe86a79e914235`
- PR #656 merge-base: `bdd5036c5` (matches protected main — **not behind**)
- Local CP/CC working HEAD: `a15da8fdb` (pre-rebase; CP/CC remediation work is on this SHA)
- Open promotion path: PR `#656` (`r3/cx-backend-controllers`)
- PR `#656` merge state: `UP-TO-DATE` (rebased onto current protected main)

## Merged/Promoted Commit Map

| Lane | Commit | State | Evidence-backed claim |
| --- | --- | --- | --- |
| CP | `a581ae2d0` | tagged `r3.0.0`, in history | 53 governed tools, 9 workbench tabs |
| CP | `00eed894b` | tagged `r3.1.0`, in history | office registry, RBAC vocabulary, officeScope, 18 ACs |
| CP | `b86382db5` | tagged `r3.2.0`, in history | cross-office trace verification, evidence packet, 30/30 ACs |
| CX | `ca6ab11a4` | rebased, on PR `#656` branch (`origin/r3/cx-backend-controllers`), not yet merged | Clerk, Treasury, Audit controllers and entities (rebased from `012f7fe3a`) |
| CX | `f1196a82e` | PR `#656` head, rebased onto `bdd5036c5`, not yet merged to protected main | CX acceptance tests + security hardening (rebased from `a15da8fdb`) |
| CC truth correction | `ff964512a` | historical claim | stated `R16 complete` |
| CC truth correction | `825366be3` | historical correction | corrected progress ledger overstatement |
| Protected main | `bdd5036c5` | current deployable protected baseline | CI repair merge, not the same as candidate lane SHA |

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
| `gh pr view 656 --json ...` | verified open PR, now rebased onto protected main; shared Seal Gate still pending |

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
| CP | Yes | Strong | Partially, via `r3.0.0` to `r3.2.0` lineage | `ready pending shared blockers` |
| CX | Yes | Strong | No, still PR-only | `ready pending shared blockers` |
| CC | Yes — truth aligned | Strong (19/19 tests, evidence packet qualified) | Partially | `ready pending shared blockers` |

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

- `ready pending shared blockers`

Reason: CP lane implementation and local gate coverage are strong, but the candidate is not the protected baseline and the release remains blocked by shared governance and evidence alignment issues.

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

- `ready pending shared blockers`

Reason: CX lane has strong local backend proof and is now rebased onto current protected main. It is still branch-only (PR #656 not yet merged) and cannot be called production-ready until Seal Gate clears and the PR is merged.

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
- residual risk: frontend constitutional test changes are local; must land on rebased PR for Seal Gate to see them

### 5. Production recommendation

- `ready pending shared blockers`

Reason: CC lane truth alignment is now complete — constitutional test locks 9-tab surface (19/19 pass), evidence packet qualifies CX as branch-only, and release narrative is honest. Remaining blocker is shared (Seal Gate on rebased PR).

## Go-Live Prerequisites

- ~~Rebase the candidate work onto current protected `origin/main`~~ → DONE (CX rebased to `f1196a82e`, merge-base = `bdd5036c5`)
- ~~Resolve the failing frontend constitutional tab-order test and make Seal Gate green~~ → DONE (19/19 pass locally)
- ~~Reconcile `docs/planning/R3_EVIDENCE_PACKET.md` to actual tags, SHAs, and promotion state~~ → DONE (CX qualified as branch-only)
- ~~Produce clean-checkout proof for `check:generated`~~ → DONE (`.codex_split` added to SKIP_DIRS)
- Shared frontend / Seal Gate must go green on rebased PR `#656` (`f1196a82e`)
- Merge PR `#656` to protected main after Seal Gate clears
- Re-run required governance checks on the exact release SHA (post-merge)
- Confirm evidence artifacts, correlation IDs, and release wording all reference the exact promoted SHA
- Perform at least one controlled release-path verification that includes observability and rollback notes for the chosen release SHA

## Blockers

1. Shared frontend / Seal Gate not yet green on rebased PR `#656` (`f1196a82e`). Backend and governance checks are green; remaining red is the shared frontend gate.
2. ~~CX candidate work remains unmerged and behind the current protected base.~~ → **RECLASSIFIED**: CX is rebased (no longer behind). Reclassified as: CX not yet merged to protected main — blocked on blocker #1 (Seal Gate).
3. ~~Frontend constitutional test contract is stale relative to the actual 9-tab workbench.~~ → **RESOLVED** (2026-03-12, CC lane)
4. ~~Release evidence packet currently overclaims tag and acceptance settlement.~~ → **RESOLVED** (2026-03-12, CC lane)
5. ~~Current local workspace cannot provide clean `check:generated` proof because `.codex_split` is being scanned.~~ → **RESOLVED** (2026-03-12, CP lane)

## Non-Blocking Debt

- No fresh full deployed-environment smoke was run for all 9 workbench tabs in this accounting pass.
- Unsupported and post-R1 paths were not exhaustively negative-tested in this pass.
- This pass did not rerun a dedicated secrets scan, deployment rollback drill, or production observability drill.

## Release Recommendation

- Release-decision ready: `yes`
- Deploy-to-production ready: `no`
- Final recommendation: `hold for Seal Gate green + CX merge`

Rationale:
- Blockers #3, #4, and #5 are **resolved** (CC truth alignment, evidence packet, check:generated).
- Blocker #2 is **reclassified**: CX is rebased onto protected main (`f1196a82e` merge-base = `bdd5036c5`). No longer behind. Still unmerged — blocked on Seal Gate.
- Blocker #1 is the **sole remaining gate**: shared frontend / Seal Gate must go green on the rebased PR `#656`.
- All three lanes are `ready pending shared blockers`. CC upgraded from `not ready`.

The critical path is now:
1. Seal Gate goes green on `f1196a82e` (shared frontend gate is the remaining red)
2. Merge PR `#656` to protected main
3. Final governance proof on the merged SHA

Once that sequence completes, all lanes are locally proven, evidence-aligned, and promotion-proven. The release decision remains `hold` until the Seal Gate clears and the merge completes.
