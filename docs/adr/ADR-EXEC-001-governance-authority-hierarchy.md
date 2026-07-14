# ADR-EXEC-001: Governance Authority Hierarchy

Status: Accepted and active; merged by PR #1273
Date: 2026-07-13

Source audit: [`WO-MAO-000 Doctrine Conflict Audit Proof`](../brain/evidence/WO-MAO-000-proof.md).

## Context

TerraFusion has constitutional canon, Brain rules, operator doctrine, Goal/Loop contracts, Work
Orders, agent instructions, playbooks, and mechanical repository controls. Several documents assigned
different merge, continuation, and risk behavior without stating which source controlled. That drift
turned routine execution into repeated owner routing.

## Decision

When two governance documents disagree, apply this semantic authority order:

1. **TerraFusion Constitution.** TF-052 at
   `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` and ratified constitutional canon.
2. **Ratified owner decisions in the canonical decision register.** Only active, unexpired,
   non-revoked entries in `.governance/owner-decisions.json` carry this authority.
3. **Canonical Brain and root operating governance.** Queue, sequencing, risk vocabulary, authority
   walls, proof, root `AGENTS.md`, and ratified governance ADRs.
4. **Active program and Work Order authority.** A bounded packet may grant execution, product,
   branch, or merge actions only within the files, systems, actions, risk, and duration recorded by
   levels 1-3.
5. **Directory-local `AGENTS.md` restrictions.** A local file may narrow authority inside its subtree.
   It may not broaden a grant or contradict levels 1-4.
6. **Active playbooks and runbooks.** Procedures that implement but never redefine higher authority.
7. **Existing implementation patterns.** Use only when higher authority leaves an implementation
   choice open.
8. **Agent judgment.** Last-resort execution choices inside all higher boundaries.

This order explicitly supersedes the older six-level hierarchy in the audited base. There is no
second active hierarchy. A "nearest-scope override" means a narrower restriction, not permission to
broaden authority. Conflicts involving directory-local instructions resolve through this ADR.

The Cortex sequence in `docs/brain/canon/source-priority.json` is source-discovery order only. It can
guide where an operator looks first, but it cannot reorder this authority hierarchy or resolve a
conflict.

## Mechanical Enforcement

Mechanical enforcement is not a semantic authority tier. It is the execution interlock:

- branch protection, required checks, repository policy configuration, and schema validation cannot
  be bypassed because prose says an action is allowed;
- when doctrine permits an action that enforcement rejects, the action remains blocked and the
  mismatch is recorded as governance drift;
- when enforcement is weaker than doctrine, the stricter doctrine remains binding;
- doctrine and enforcement changes must land together when the Work Order authorizes both;
- otherwise the exact mechanical change is deferred and no success claim may imply it already exists.

For `main`, `.governance/main.protection.json` records PR integration, strict status checks, the five
canonical contexts, zero approving reviews, admin enforcement, conversation resolution, and disabled
force-push/deletion. GitHub exposes "require PR" through the presence of
`required_pull_request_reviews`; the normalized canon records the derived boolean explicitly. The
drift verifier compares every claimed invariant. Branch protection does not designate the merge actor.

## MAO-001 Owner Authorization

The owner decision `OWNER-MAO-001-R5-GOVERNANCE-AMENDMENT` in the canonical decision register is the
authorization for this exact amendment. It is limited to the 19 source-cited WO-MAO-000 findings and
the WO-MAO-001 file/action scope. It is not general R5 authority, production authority, credentials
authority, suite-boundary authority, or permission to modify runtime behavior.

## Staged Operator-Merge Activation

**OPERATOR-MERGE AUTHORITY IS RATIFIED BUT NOT ACTIVE.**

WO-MAO-001A separates the one-time owner envelope from mutable pilot execution state. The owner
envelope is published once in `MAO_002_PILOT_BOOTSTRAP_JSON` and defines the operator, assurance
identity, repository set, path ceiling, risk ceiling, merge count, expiry, and suspension state.
Codex publishes and refreshes `MAO_002_PILOT_EXECUTION_JSON` with the two PR numbers, exact current
head SHAs, path scopes, reservations, implementation operators, and assurance evidence. Both records
bind to the checked-in inactive policy `.governance/mao-002-pilot-merge-authority.json`, and the
required `governed-spine` check validates the execution record is inside the owner envelope. A pilot
head change requires only an operator execution-state revision and check rerun, not another owner
decision. MAO-001A remains Mode A and does not itself activate the pilot.

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
