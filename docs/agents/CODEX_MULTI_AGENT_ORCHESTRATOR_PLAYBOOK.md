# Codex Multi-Agent Orchestrator Playbook

**Program:** `PROGRAM-MAO-001`
**Work Order:** `WO-MAO-005`
**Authority:** `OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`
**Status:** completed reusable baseline; execution requires a new applicable active authority

This playbook operationalizes existing TerraFusion doctrine. It does not create a second Brain,
expand authority, or replace the Constitution, root `AGENTS.md`, the canonical Merge Authority
Model, mandatory worktree policy, or domain packs.

## Evidence Basis

| Control | Proven basis | Operational consequence |
|---------|--------------|-------------------------|
| Operator-owned mutable state | `docs/brain/evidence/WO-MAO-002-POST-MERGE-ASSURANCE.md` | Codex owns Work Order, PR, exact-head, worker, reservation, remediation, and assurance state inside the active envelope. |
| Mechanical reservations | `docs/brain/workorders/evidence/WO-MAO-003-RESERVATION-GATE.md` | Every mutable worker registers exact repository-bound claims; collisions and stale claims fail closed. |
| Deterministic wave selection | `docs/brain/workorders/evidence/WO-MAO-004-EXECUTABLE-GRAPH-PARALLEL-WAVE-PLANNER.md` | Codex dispatches only dependency-cleared, authority-bounded, reservation-safe nodes selected from governed inputs. |

The pilot did not prove overlapping reservations; MAO-003 supplies that proof. The planner does not
dispatch, reserve, open PRs, merge, or grant authority; the orchestrator performs those actions only
under an active recorded envelope.

## Dispatch Procedure

1. Read the canonical queue, program, active Work Order, owner-decision register, domain pack, and
   nearest `AGENTS.md`.
2. Confirm the envelope is active, unexpired, within risk ceiling, and has no revocation trigger.
3. Run the executable planner with explicit repository identity and path, contract, and environment
   claims. Never infer claims from allowed-file globs.
4. Select the maximum safe conflict-free wave within the authorized worker budget. A blocked lane
   does not freeze unrelated eligible lanes.
5. Give each mutable worker one Work Order, one branch, one isolated clean worktree, one PR, and
   exact reservation claims.
6. Register the assignment in the governed PR body and refresh its exact head after every revision.
7. Require normal validation, review remediation, required checks, zero unresolved threads, and
   independent exact-head assurance.
8. Merge only when the recorded Merge Mode permits it and every canonical merge condition passes.
9. Verify `origin/main`, release or complete reservations, persist evidence, and recompute the next
   wave without asking the owner for routine routing.

## Fail-Closed Rules

Suspend the affected dispatch and continuation envelope on scope expansion, protected-boundary
access, failed required checks, unresolved review, assurance failure, collision, stale reservation,
conflicting authority, false completion evidence, or expiration. Do not force-push, bypass a
required gate, clean a shared checkout, or reinterpret an owner denial.

## Owner Contact

Contact the owner only for a recorded revocation trigger or a genuinely new protected boundary.
The owner does not maintain PR numbers, SHAs, worktrees, reservations, worker identities, assurance
state, remediation revisions, or routine next-wave routing.

## Rollback

Use a normal protected revert PR for merged governance changes. Preserve incident, reservation, and
assurance evidence. Never rewrite `main`.

STOP_TYPE: CODEX_MULTI_AGENT_ORCHESTRATOR_PLAYBOOK_BASELINE_COMPLETE
