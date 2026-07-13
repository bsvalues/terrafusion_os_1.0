# ADR-EXEC-001: Governance Authority Hierarchy

Status: Accepted by WO-MAO-001 reconciliation, pending merge
Date: 2026-07-13

## Context

TerraFusion has constitutional canon, Brain rules, operator doctrine, Goal/Loop contracts, Work
Orders, agent instructions, playbooks, and mechanical repository controls. Several documents assigned
different merge, continuation, and risk behavior without stating which source controlled. That drift
turned routine execution into repeated owner routing.

## Decision

When two governance documents disagree, apply this semantic authority order:

1. **TerraFusion Constitution.** TF-052 and ratified constitutional canon.
2. **Canonical Brain rules and ratified governance ADRs.** Queue, sequencing, risk vocabulary,
   authority walls, proof, and cross-program semantics.
3. **Recorded owner authority.** An active Goal, Loop, and Work Order may grant bounded execution,
   product, branch, or merge authority, but cannot override levels 1-2.
4. **Operator doctrine and canonical Goal/Loop rules.** Execution, continuation, review, evidence, and
   stop procedure. A document must declare itself canonical for the semantics it owns.
5. **Domain knowledge packs.** Path ownership, forbidden writes, routing, and required proof.
6. **Branch/worktree policy and root `AGENTS.md`.** Repository-wide operating defaults.
7. **Directory-local `AGENTS.md`.** Path-specific specialization that cannot exceed levels 1-6.
8. **Program playbooks.** Approved execution graphs and procedures that implement, but do not
   redefine, higher authority.
9. **Work Orders.** Specific execution packets bounded by their parent Goal, Loop, program, and owner
   grant. A Work Order carries level-3 authority only when it cites an active recorded owner grant;
   otherwise it cannot override higher defaults by calling itself authorized.
10. **Existing implementation patterns and agent judgment.** Last-resort execution choices only.

An active Work Order is more specific than a default procedure but is not independently higher than
the Constitution, canonical Brain rules, or a conflicting recorded owner decision. It grants only the
files, systems, risk classes, actions, and duration named by its linked authority record.

## Mechanical Enforcement

Mechanical enforcement is not a semantic authority tier. It is the execution interlock:

- branch protection, required checks, repository policy configuration, and schema validation cannot
  be bypassed because prose says an action is allowed;
- when doctrine permits an action that enforcement rejects, the action remains blocked and the
  mismatch is recorded as governance drift;
- when enforcement is weaker than doctrine, the stricter doctrine remains binding;
- doctrine and enforcement changes must land together when the Work Order authorizes both;
- otherwise the exact mechanical change is deferred and no success claim may imply it already exists.

For `main`, `.governance/main.protection.json` currently requires PR-based integration, admin
enforcement, and the five canonical checks. It does not designate the merge actor. Ratified operator
merge therefore does not weaken branch protection or alter the snapshot.

## Authority Records

Reusable authority must be recorded in the active Goal/Loop/Work Order or a linked owner decision and
must state:

- program, Goal, Loop, and Work Order;
- allowed files, systems, actions, and risk ceiling;
- merge mode and eligible PRs or bounded PR class;
- effective point, expiry/terminal condition, and revocation triggers;
- evidence and rollback requirements.

Authority persists across sessions and operators until its recorded expiry, completion, revocation,
or superseding decision. It is not recreated from chat memory or inferred from a prior success.

## Consequences

- Already-authorized work is not a new authority wall.
- One Brain may dispatch many isolated workers without creating competing governance.
- Playbooks and local instructions cannot silently override canonical continuation or merge semantics.
- Cross-repository dispatch requires a committed `PATH_CANON_REGISTER.md`. That file is absent from the
  WO-MAO-001 base, so cross-repo allocation remains blocked; the verified in-repo pack map remains
  usable.
- A governance conflict unresolved by this hierarchy is a true owner wall.

## Rollback

Revert this ADR and its reconciliation set in one normal PR. Branch protection and protected-resource
walls remain unchanged throughout rollback.
