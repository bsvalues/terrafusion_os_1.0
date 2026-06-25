# TerraFusion Full Agent Handoff

> **Operating-memory & continuity document — NOT an execution release.** This handoff is memory,
> not a green light. The existence of a handoff, playbook, or work order does **not** create implicit
> authorization. Current as of **Loop 45**, HEAD `fc00d5e24`, clean tree, no scope drift.
>
> **Supersedes the Loop 43 edition** of this file on two points: the receiving repo's identity
> (§5A) and the lock model (§2). Git history preserves the prior snapshot.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)
**Companions:** [`MASTER-PLAYBOOK-HANDOFF.md`](MASTER-PLAYBOOK-HANDOFF.md) · [`MIGRATE-CORE-WO-1.md`](MIGRATE-CORE-WO-1.md) · [`WO-LOOP-44R-RECONCILE.md`](WO-LOOP-44R-RECONCILE.md)

## Purpose
Standalone handoff for any next agent/operator/execution partner. Usable **without** rereading the
conversation history. Captures current truth, governing doctrine, hard constraints, completed work,
locked state, and exact next-decision gates. **Not an execution release.**

## 1. Executive Summary
TerraFusion moved from repo archaeology into a governed migration program. The branch-port recovery
thesis collapsed under content-presence checks — **the evolved `main` spine of the archive repo is
the migration source**, and most historical branch value is recut ancestry / already-landed /
superseded. The program is **decision-complete but execution-locked**.

**Current truth in one sentence:** the receiving repo already exists (`bsvalues/terrafusion-os`); the
next moves are to **reconcile** the staged governance scaffold against it (WO-LOOP-44R) and run the
**WO-CORE-1 readiness gate** (WO-LOOP-45) — and only then discuss releasing the first narrow
migration (WO-CORE-1). Until an explicit release, **no execution is authorized.**

## 2. Current Locked State (corrected at Loop 45)
```text
Lock A (execution release):  CLOSED    — WO-CORE-1 not released
Lock B (receiving repo):     SATISFIED — bsvalues/terrafusion-os already exists
                             — content parity PENDING VERIFICATION (see §6)
Execution:                   BLOCKED   — Lock A remains closed; Lock B is no longer the blocker
```
Even with a complete plan and an existing target repo, execution is **policy-blocked** by Lock A.
A handoff/playbook/work-order existing does **not** create authorization.

## 3. Governing Doctrine — FECF
```text
Discover -> Classify -> Ratify -> Recover -> Migrate
```
1. Classification before evaluation. 2. Ratification before execution. 3. Confidence ≠ truth without
evidence. 4. Eligibility ≠ approval. 5. A target home ≠ a destination until ratified. 6. Recovery and
migration are separate. 7. No WO crosses analysis→action without a gate. 8. The archive `main` spine
is the migration source unless a micro-fragment is explicitly proven otherwise. 9. Narrow releases
over broad. 10. Build/test proof gate on every code-moving increment. 11. No convenience-copy that
rebuilds the monolith. 12. No repo created for a dramatic name (and **no second/duplicate repo** —
see §5A).

## 4. Major Forensic Conclusions
- **Historically plural, not merely messy:** disjoint lineages, ghost workspace authority,
  schema/config fracture, false-completion narrative, archive/runtime ambiguity, branch recuts,
  multiple "truth-looking" planning systems.
- **The branch estate is not the recovery source:** N1 LocalOps/Muse/Pilot already landed;
  mergeable-candidate pool mostly already landed; Sync / Dais-Levy / Forge legacy heads superseded by
  `main`. Tier-1 branch-port recovery is **closed**.
- **Discovery is complete enough to stop expanding.** The next phase is controlled execution behind
  the locks — not another broad audit.

## 5. Sovereign Source Truth & Identity Rules
### 5A. Repo-identity map (authoritative — corrected Loop 45)
| Repo | Role | Runtime? |
|---|---|---|
| **`bsvalues/terrafusion-os`** | **sovereign receiving vessel** — already exists; runtime-empty by design; populated only via Work Orders with approved governance/tooling/contract artifacts | not yet a runnable replacement |
| `bsvalues/terrafusion_os_1.0` | **old runtime archive / mine** (this repo) — the migration *source* spine | yes (legacy runtime) |
| `bsvalues/TerraFusion-Platform` | **reference mine** | reference only |

> **Hard rule:** "TerraFusionOS" is a *label*, not a repo to create. The repo is **`terrafusion-os`**.
> Never create a new/second receiving repo. `terrafusion_os_1.0` is **not** deprecated — it is the source/archive.

### 5B. Sovereign source
The governing planning source is the **archive `main` spine** (`terrafusion_os_1.0`). Side sources
may be mined only if: (1) the exact gap is named; (2) the fragment is proven absent from `main`;
(3) it has evidence value; (4) the target home is ratified; (5) the owner explicitly releases.
**Do NOT treat as sovereign by default:** historical branches, shadow workspaces, old MVPs, archive
folders, branch exports, duplicate repo-name families, copied worktrees, unratified agent docs.

### 5C. Path identity
Canon is **path-based, not name-based**. A system is defined by exact path · name · status · owner ·
role · supersedes-relationship. Never treat a ZIP/VHD/DB-backup/export as repo truth.

## 6. Access constraint (this session)
This session's GitHub scope is **`bsvalues/terrafusion_os_1.0` only**. Reads of `terrafusion-os`
return *"Access denied: repository is not configured for this session."* The `list_repos`/`add_repo`
scope-expansion tools are **not available** here, and the integration token **cannot create repos**
(`403`). Consequence: cross-repo reconciliation (WO-LOOP-44R) and any write to `terrafusion-os` must
run **owner-side** or in a **`terrafusion-os`-scoped session**. To let this assistant do it directly,
**add `bsvalues/terrafusion-os` to the session scope.**

## 7. Work Orders & Gate State
- **WO-CORE-1** — drafted · CI-green in source context · **not released** · not executed. First
  narrow migration packet: `TerraFusion.Abstractions` + kernel host shell. (`MIGRATE-CORE-WO-1.md`)
- **WO-LOOP-44 / 44R** — vessel scaffold staged under `terrafusionos-vessel/`; **reframed
  create→reconcile** at Loop 45. WO-LOOP-44R supplies a 12-row file-by-file comparison checklist
  (DUP/SUP/GAP/CONFLICT) to reconcile the staged scaffold against `terrafusion-os`'s existing root.
- **WO-LOOP-45** — WO-CORE-1 Readiness Gate (evaluate `terrafusion-os` readiness; not execution).
- Deferred gate-M1 edit on WO-CORE-1 (Execution Authorization) remains queued for its next real touch.

## 8. Sequence from here
```text
WO-LOOP-44R  reconcile staged scaffold vs terrafusion-os root (no creation, docs/gov-only patch if gaps)
WO-LOOP-45   WO-CORE-1 Readiness Gate (repo clean? protections? provenance? exact import list? rollback?)
THEN         discuss opening Lock A (explicit WO-CORE-1 execution release)
WO-CORE-1    first narrow migration: TerraFusion.Abstractions + kernel host shell, from archive main
```

## 9. Allowed Work Right Now
Maintain/improve handoff clarity · decision-layer review · gap-statement refinement · WO wording ·
reconciliation planning · readiness-checklist prep · non-executing prompt prep · evidence indexing ·
lock-state confirmation. **No code movement. No file migration. No import. No branch port. No cleanup.
No runtime buildout. No repo creation.**

## 10. Explicitly Prohibited Until Unlock
Create a new/second repo · create runtime code in `terrafusion-os` · move code archive→vessel ·
cherry-pick/port branch payloads · revive folders · merge archive material · restructure ·
rewrite canon to fit momentum · convert eligibility into approval · treat this handoff as permission ·
start WO-CORE-1 without explicit release · infer authorization from silence · introduce
`backend/`/`frontend/`/`os-platform/`/package/build/CI into `terrafusion-os` · touch PACS / county SQL
/ county data / secrets.

## 11. Immediate Next Valid Signals
1. **Release execution** — explicit owner WO-CORE-1 release (after WO-LOOP-44R + WO-LOOP-45 pass) → run WO-CORE-1.
2. **Continue holding** — decision-layer only.
3. **Redirect** — `#1073` · B3/Sync · F14/Forge · external-estate classification · other named decision-layer target.

Plus the near-term operational fork: **add `terrafusion-os` to scope** (so this assistant runs
WO-LOOP-44R), or run WO-LOOP-44R owner-side.

## 12. First Execution Packet When Released (narrow)
`WO-CORE-1 — TerraFusion.Abstractions + Kernel Host Shell`. Establish the minimal canonical core
boundary in `terrafusion-os` without dragging the old runtime forward. Target: `Abstractions` +
kernel host shell + minimal compile/test proof + provenance evidence + **no broad product surface**.
Proof gate: builds green + **zero core→suite internal references**. Start from archive `main` truth;
do not broad-port from branches.

## 13. Evidence Hierarchy
1. production telemetry/runtime · 2. repo source on archive `main` · 3. CI/build/test · 4. committed
work-order evidence · 5. ratified canon/ADR/governance · 6. branch ancestry/history · 7. old planning
docs · 8. agent summaries · 9. intuition. **Never proceed on intuition alone.**

## 14. Agent Operating Rules
Prime rule: do not destabilize the line. Before any write, report: `pwd`, `git branch --show-current`,
`git rev-parse --show-toplevel`, `git status --short`, target repo, runtime-involved (yes/no),
provenance-required (yes/no), files to touch, validation gates. If the checkout isn't the assigned
clean worktree, **stop**. Foreign files present → **stop**. Uncertain shared state → **quarantine**,
don't clean. **One agent, one worktree, one work order, one branch, one PR.** Always verify CI claims
against `head_sha` (cancelled-on-old-SHA = supersession artifact, not a failure).

## 15. What the Next Agent Must Not Misread
Handoff ≠ authorization. Archive `main` is source; branches are evidence. Recovery ≠ migration. Target
home ≠ destination until ratified. Broad completeness ≠ virtue (narrow/testable/reversible wins).
**The receiving repo is `terrafusion-os` and already exists — never create a new one.**

## 16. Operator Checklist Before Unlock (Lock A)
```text
[ ] WO-LOOP-44R reconciliation complete (scaffold parity vs terrafusion-os known)
[ ] terrafusion-os clean and accessible; branch protection known
[ ] WO-CORE-1 is the active packet; exact scope accepted; no broad import authorized
[ ] provenance expectations defined; validation commands defined; rollback path defined
[ ] WO-LOOP-45 readiness gate passed
[ ] execution release is explicit
```
If any box is unchecked, **hold**.

## 17. Canonical Final State Summary
```text
Loop 42: sealed (Master Playbook)            Loop 43: sealed (this handoff, 1st edition)
Loop 44: vessel scaffold STAGED              Loop 45: identity corrected -> terrafusion-os (reconcile, not create)
Execution: locked (Lock A closed)            Migration: not authorized      Recovery: evidence-only
Source: archive bsvalues/terrafusion_os_1.0 main spine
Receiving vessel: bsvalues/terrafusion-os (EXISTS; runtime-empty by design)
WO-CORE-1: drafted / CI-green / not released
Next: WO-LOOP-44R -> WO-LOOP-45 -> (maybe) open Lock A
```

## 18. Final Instruction to Next Agent
Do not improvise. Do not execute because the plan looks ready. Do not treat this handoff as momentum.
Do not create a new repo — the vessel is `terrafusion-os`. Hold until the operator gives an explicit
signal. If released, start with WO-CORE-1 only, into `terrafusion-os`, from archive `main` truth.
If not released, remain in decision-layer mode.
