# TerraFusion Full Agent Handoff

> **Operating-memory & continuity document — NOT an execution release.** This handoff is memory,
> not a green light. The existence of a handoff, playbook, or work order does **not** create implicit
> authorization. Adopted at HEAD `11441d6f1` (Loop 42 sealed, CI-green), clean tree, no scope drift.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)
**Companion:** [`MASTER-PLAYBOOK-HANDOFF.md`](MASTER-PLAYBOOK-HANDOFF.md) (operating package) · [`MIGRATE-CORE-WO-1.md`](MIGRATE-CORE-WO-1.md) (first execution WO, ratified, not released)

## Purpose
This is the standalone handoff for any next agent, operator, or execution partner taking over
TerraFusion work. It is designed to be usable **without** rereading the entire conversation history.
It captures current truth, governing doctrine, hard constraints, completed work, locked state, and
exact next decision gates. **This handoff is not an execution release.** It is an operating-memory
and continuity document.

## 1. Executive Summary
TerraFusion has moved from chaotic repo archaeology into a governed migration and buildout program.
The original assumption that broad historical branch recovery was required has been materially
overturned. The forensic program established that the **evolved `main` spine is now the primary
migration source**, while most historical branch value proved to be recut ancestry, already-landed
work, or superseded lineage. The program is now in a **decision-complete but execution-locked** state.

**Current truth in one sentence:** the next real move is not more discovery; it is to **provision
`TerraFusionOS`** and explicitly **release the first narrow Migrate execution** around
`TerraFusion.Abstractions` plus the kernel host shell. Until that happens, **no execution is authorized.**

## 2. Current Locked State
**Frozen posture**
- Loop 42 is sealed.
- Durable operating handoff has been committed in repo.
- `WO-CORE-1` has been drafted and is CI-green.
- Migrate execution remains locked.
- No code movement is currently authorized.

**Two-lock rule** — execution stays closed until **both** are true:
1. explicit owner execution release is granted
2. `TerraFusionOS` repo is provisioned and ready

**Meaning:** even if the plan is complete, execution is **physically and policy blocked**. The
existence of a handoff, playbook, or work order does not create implicit authorization.

## 3. Governing Doctrine
The full program is governed by **FECF**:

```text
Discover -> Classify -> Ratify -> Recover -> Migrate
```

**Core doctrinal rules**
1. Classification before evaluation.
2. Ratification before execution.
3. Confidence is never promoted to truth without evidence.
4. Eligibility is never promoted to approval.
5. A target home is never promoted to a destination until ratified.
6. Recovery and migration are separate.
7. No work order may cross from analysis to action without a gate.
8. Main spine is the migration source unless a micro-fragment is explicitly proven otherwise.
9. Narrow releases over broad releases.
10. Build/test proof gates every code-moving increment.

## 4. Major Forensic Conclusions
**4.1 The repo is historically plural, not merely messy.** The estate contained multiple historical
and system layers: disjoint lineages; ghost workspace authority; schema/config fracture;
false-completion narrative layers; archive/runtime ambiguity; branch ancestry recuts; multiple
"truth-looking" planning systems.

**4.2 The branch estate is not the main recovery source anymore.** Initial forensic theory suggested
the deepest value was stranded in old branches. Content-presence checks broadly disproved that.
Confirmed pattern:
- N1 LocalOps / Muse / Pilot: already landed
- mergeable candidate pool: mostly already landed
- Sync legacy heads: superseded by `main`
- Dais / Levy legacy heads: superseded by `main`
- Forge legacy heads: superseded by `main`

**4.3 Tier-1 branch-port recovery is closed.**

```text
Historical branches remain evidence and ancestry.
They do not currently authorize broad porting.
Main is the migration source unless a narrow fragment is proven absent and valuable.
```

**4.4 Discovery is complete enough to stop expanding.** The next phase is not another broad audit;
it is controlled execution only after the two locks are satisfied.

## 5. Sovereign Source Truth
The governing planning source is the **current evolved `main` spine** — not old local branches, side
repos, random worktrees, or historical MVP projects.

**Side sources may be mined only if:** (1) the exact gap is named; (2) the candidate fragment is
proven absent from main; (3) the fragment has evidence value; (4) the target home is ratified;
(5) the owner explicitly releases execution.

**Do NOT treat as sovereign by default:** historical branches · shadow workspaces · old MVPs ·
archive folders · branch exports · duplicate repo-name families · copied local worktrees ·
agent-generated docs without ratification.

## 6. Path and Identity Rules
**Path identity rule:** canon is **path-based, not name-based**. A repo name alone is never
sufficient to establish canon status. A system is only defined by:

```text
exact path
system name
status
owner
role
supersedes relationship, if any
```

**Operational consequence:** never say "TerraFusionSync is canonical" without specifying the path.
Never treat an archive copy as a runtime system because the folder name looks real. Never treat a
ZIP, VHD, database backup, or export package as repo truth.

## 7. Current Active Decision Locks
**Lock A — execution release.** The operator has not released Migrate execution. Until release is
explicit, all agents remain in decision-layer / handoff / planning mode only.

**Lock B — target repo provisioning.** `TerraFusionOS` must be provisioned and ready before
execution. Until the target repo exists and is ready, no migrate step may begin.

**Lock interaction:** both locks must open. One lock opening alone is insufficient.

## 8. Work Orders and Current Gate State
**WO-CORE-1**

```text
Status:  Drafted · CI-green · Not execution-released
Purpose: First narrow Migrate execution around TerraFusion.Abstractions + kernel host shell.
Role:    First real code-moving packet after locks open.
```

**Handoff status:** this handoff is complete as operating memory. It does **not** authorize WO-CORE-1.

## 9. Allowed Work Right Now
Until both locks open, allowed work is limited to: maintaining or improving handoff clarity ·
decision-layer review · gap statement refinement · work order wording refinement · target repo
provisioning planning · operator checklist preparation · non-executing prompt preparation · evidence
indexing · confirmation of locked state.

**No code movement. No file migration. No import. No branch port. No cleanup. No runtime buildout.**

## 10. Explicitly Prohibited Until Unlock
Do not: create runtime code in the new repo · move code from old repo to new repo · cherry-pick
branch content · port historical branch payloads · revive whole folders · merge archive material ·
restructure the repo · rewrite canon to fit execution momentum · convert eligibility into approval ·
treat this handoff as permission · start `WO-CORE-1` without explicit release · provision around the
operator's decision gate · infer authorization from silence.

## 11. Immediate Next Valid Signals
The next agent must wait for exactly one of these explicit signals.

**Signal 1 — Release execution and provision repo.** Operator explicitly releases execution AND
`TerraFusionOS` is provisioned → begin WO-CORE-1 according to its scoped playbook.

**Signal 2 — Continue holding.** Remain in decision-layer mode; do not execute → maintain
handoff / readiness posture only.

**Signal 3 — Redirect.** Possible redirects: `#1073` · B3 / Sync · F14 / Forge · external-estate
classification · other named decision-layer target → work only on the redirected decision-layer
target; no implied execution.

## 12. First Execution Packet When Released
When both locks open, the first execution packet should be **narrow**.

```text
WO-CORE-1 — TerraFusion.Abstractions + Kernel Host Shell Migration
```

**Purpose:** establish the minimal canonical core boundary in `TerraFusionOS` without dragging the
entire old runtime forward.

**Initial target:** `TerraFusion.Abstractions` · kernel host shell · minimal compile/test proof ·
provenance evidence · no broad product surface.

**Required execution rule:** start from current `main` truth. Do not broad-port from old branches.
Use historical branches only if a named micro-fragment is proven absent from main and approved.

## 13. Evidence Hierarchy
Use this order when evaluating claims:
1. production telemetry and runtime evidence
2. repo source on current main
3. CI/build/test evidence
4. committed work-order evidence
5. ratified canon / ADR / governance docs
6. branch ancestry and historical commits
7. old planning docs
8. agent summaries
9. intuition

Never proceed on intuition alone.

## 14. Agent Operating Rules
**Prime rule:** do not destabilize the line.

**Required before any future write** — an execution agent must report:

```text
pwd
git branch --show-current
git rev-parse --show-toplevel
git status --short
```

If the checkout is not the assigned clean worktree, **stop**. If foreign files are present, **stop**.
If the shared checkout state is uncertain, **quarantine** it; do not clean it.

**Worktree rule:** one agent, one worktree, one work order, one branch, one PR. No shared mutable
working tree execution.

## 15. What the Next Agent Must Not Misread
- **Handoff is not authorization** — this document is memory, not a green light.
- **Main is source, branches are evidence** — historical branches may explain lineage, but they are
  not the default migration source.
- **Recovery is not migration** — a fragment can be recoverable but still not approved for migration.
- **Target home is not destination until ratified** — even if a home seems obvious, it is not a
  destination until the work order says so.
- **Broad completeness is not virtue** — the correct next move is narrow, testable, and reversible.

## 16. Operator Checklist Before Unlock
Before authorizing execution, the operator should confirm:

```text
[ ] TerraFusionOS repo exists
[ ] repo is clean and accessible
[ ] branch protection / PR model is known
[ ] WO-CORE-1 is the active packet
[ ] exact scope is accepted
[ ] no broad import is authorized
[ ] provenance expectations are defined
[ ] validation commands are defined
[ ] rollback path is defined
[ ] execution release is explicit
```

If any box is unchecked, **hold**.

## 17. Recommended Response to "What's Next?"

```text
Next is not more discovery.

Next is either:
1. explicitly release execution and provision TerraFusionOS, then run WO-CORE-1;
2. continue holding;
3. redirect to a named decision-layer target.

Without signal 1, execution remains locked.
```

## 18. Canonical Final State Summary

```text
Loop 42: sealed
Execution: locked
Migration: not authorized
Recovery: evidence-only
Main spine: primary migration source
Historical branches: ancestry/evidence only unless micro-fragment approved
WO-CORE-1: drafted and CI-green
TerraFusionOS repo: required before execution
Next valid action: operator signal 1, 2, or 3
```

## 19. Final Instruction to Next Agent
Do not improvise. Do not execute because the plan looks ready. Do not treat this handoff as
momentum. Hold until the operator gives one of the three explicit signals. If released, start with
`WO-CORE-1` only. If not released, remain in decision-layer mode.
