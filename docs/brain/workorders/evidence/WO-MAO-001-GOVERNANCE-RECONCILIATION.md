# WO-MAO-001 Governance Reconciliation Evidence

**Program:** `PROGRAM-MAO-001`
**Goal:** `GOAL-MAO-001`
**Loop:** `LOOP-MAO-001`
**Base:** `origin/main@63f959e07240e0159ce101cd4d76e814788aac44`
**Classification:** Governance reconciliation only

## Verdict

The 16 WO-MAO-000 findings are reconciled to one semantic model:

- authority is explicit, recorded, bounded, persistent, and revocable;
- a true wall requires presently unresolved new authority;
- risk is the canonical `R0` through `R5` vocabulary and is one dimension of authority, not authority
  by itself;
- one Brain permits many isolated workers;
- operator merge is bounded and automatically suspended on integrity failure;
- mechanical controls remain interlocks and cannot silently redefine doctrine.

## Amendment Matrix

The source locations below refer to the audited base SHA before this reconciliation.

| ID | Audited source | Finding | Disposition | Concrete amendment |
|----|----------------|---------|-------------|--------------------|
| F01 | `AGENTS.md:17-24` | Authority hierarchy omitted owner grants, operator doctrine, Work Orders, playbooks, and mechanical enforcement. | SUPERSEDE | `AGENTS.md` and `ADR-EXEC-001` define the complete hierarchy and enforcement interlock. |
| F02 | `AGENTS.md:36-40` | Every product behavior change forced a new owner stop. | NARROW | Only behavior outside the active Work Order or recorded authority requires new authority. |
| F03 | `AGENTS.md:36-41` | Every branch or merge strategy action forced a new owner stop. | NARROW | Routine actions follow recorded merge authority; only missing/conflicting strategy or exceptions stop. |
| F04 | `AGENTS.md:50-57` | "Agents open draft PRs; humans merge" contradicted later operator doctrine. | SUPERSEDE | Root policy now allows ready/draft PRs and Mode B/C merge under recorded authority. |
| F05 | `docs/branching/BRANCH_AND_WORKTREE_POLICY.md:9-16,23-30` | Branch table and lifecycle required human-only merge and promotion. | SUPERSEDE | Branch policy now names human or authorized operator and preserves protected-PR checks. |
| F06 | `docs/agents/AGENT_WORKTREE_ISOLATION.md:28-45` | Every failed-worktree or zero-unique branch cleanup required a fresh human touch. | NARROW | Exact current-WO failed-path repair is allowed under a recorded procedure; other deletion remains protected. |
| F07 | `docs/brain/workorders/GOAL_LOOP_AUTONOMY_RULES.md:33-42` | Equal-or-lower numeric risk controlled continuation even when explicit authority differed. | SUPERSEDE | Continuation uses recorded risk, system, file, and action authority. |
| F08 | `docs/brain/workorders/NEXT_ACTION_MATRIX.md:44-57` and `docs/brain/workorders/schema/WORK_ORDER_DATA_MODEL.md:57-66` | Active matrix used an incompatible `R0`-`R4` vocabulary. | SUPERSEDE | All active continuation documents use the canonical `R0`-`R5` model. |
| F09 | `docs/brain/workorders/NEXT_ACTION_MATRIX.md:24-36` | First-match wall row made portfolio reconciliation unreachable. | REORDER | Portfolio reconciliation is evaluated before the regular-program wall stop. |
| F10 | `docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md:1-42` and `docs/brain/workorders/playbooks/MERGE_AUTHORITY_MODEL.md:1-63` | Two active merge models carried incompatible defaults and scope. | SUPERSEDE | Operator model is canonical; playbook copy is a pointer only. |
| F11 | `docs/brain/workorders/goal-loop/GOAL_CONTRACT.md:16-31` | Authority records had no required expiry, revocation, PR class, or persistence semantics. | CLARIFY | Goal contract records effective point, terminal condition, revocation triggers, eligible PR class, evidence, and rollback. |
| F12 | `brain/packs/README.md:17-39` | One-Brain doctrine could be practiced as one worker despite only prohibiting competing governance. | CLARIFY | Pack and root canon state one Brain is one governance authority, not one worker process. |
| F13 | `brain/packs/README.md:37-55` | Cross-repo allocation could rely on repo name or assumption without exact path canon. | NARROW | Cross-repo dispatch fails closed until committed path-canon exists; in-repo pack map remains usable. |
| F14 | `docs/brain/workorders/goal-loop/README.md:48-58` | Any uncertain preflight field could cause immediate downgrade or stop without bounded lookup. | NARROW | Canon lookup and read-only live inspection precede any stop; only material residual uncertainty blocks. |
| F15 | `docs/brain/workorders/STOP_WALL_REGISTER.md:13-33,76-78` | Routine merge conflict and in-scope recovery could be misclassified as authority walls. | CLARIFY | Walls require unresolved new authority; routine conflict, review, validation, and approved repair are non-walls. |
| F16 | `docs/brain/workorders/programs/work-order-engine.md:96-98` and `docs/brain/workorders/goal-loop/NEXT_WO_SELECTION_RULE.md:15-20` | Operator final-call language and risk-up shorthand recreated founder routing. | SUPERSEDE | Live queue plus recorded authority selects the next dependency-cleared WO automatically. |

**Mapped findings:** 16
**Unmapped findings:** 0
**Conflict dispositions deferred:** 0

## Authority Hierarchy

[ADR-EXEC-001](../../../adr/ADR-EXEC-001-governance-authority-hierarchy.md) is the controlling decision.
In descending semantic authority:

1. Constitution;
2. canonical Brain rules and accepted ADRs;
3. recorded owner authority;
4. operator and Goal/Loop doctrine;
5. domain packs;
6. root and branch-level `AGENTS.md`;
7. directory-local `AGENTS.md`;
8. program playbooks and Work Orders inside their parent authority;
9. implementation patterns and agent judgment.

Mechanical enforcement is an execution interlock, not a prose tier. When enforcement is stricter, it
blocks until reconciliation. When prose is stricter, the operator follows prose and opens a governed
mechanical correction rather than bypassing either source.

## Operator-Merge Ratification

The canonical model defines:

- Mode A: no applicable grant, owner merge required;
- Mode B: recorded bounded authority for one PR, exact batch, or bounded PR class;
- Mode C: auto-merge under an applicable Mode B grant and repository policy.

MAO-001 does not create portfolio-wide merge authority. It ratifies a future MAO-002 grant limited to
the two exact pilot PRs after dispatch packets and reservations exist. Required conditions include
scope, clear reservations, required checks, zero unresolved threads, clean merge state, evidence,
rollback, and no protected boundary.

Automatic suspension occurs if unauthorized scope, a reservation collision, a required-gate bypass,
material scope expansion, protected-boundary access, or false evidence reaches `main`. Restoration
requires containment or revert through a normal PR, verified post-rollback `main`, incident evidence,
corrected controls, and explicit ratification.

## Mechanical Protection Status

`.governance/main.protection.json` remains unchanged. It requires a PR, strict up-to-date checks,
administrator enforcement, and the canonical check contexts. It does not prescribe a human-only merge
actor, so the bounded operator model does not require a branch-protection change.

Two mechanical capabilities are intentionally not claimed:

1. `PATH_CANON_REGISTER.md` is absent from this base; cross-repository dispatch remains blocked until a
   committed register exists.
2. Reservation collision enforcement does not yet exist; MAO-003 must implement and red-team it. The
   MAO-002 disjoint pilot cannot satisfy that proof.

These are capability dependencies, not unresolved contradictions in the amended authority model.

## Safety Posture

- Runtime/backend/frontend/product changes: none.
- CI/workflow/branch-protection changes: none.
- Production, credentials, secrets, PACS, county SQL, and county data: untouched.
- Shared checkout: untouched.
- Portfolio-wide operator merge: not authorized.

## Local Validation

| Validation | Result |
|------------|--------|
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS; JSON parsed |
| `corepack pnpm run type-check` | PASS after governed frozen bootstrap |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS; 56 tests |
| Frozen bootstrap invariants | PASS; package hash, lock hash, and tracked status unchanged; lifecycle scripts suppressed |
| `corepack pnpm brain review-diff --workorder WO-MAO-001` | Scope PASS: all changed files are allowed. Overall command remains BLOCKED by the pre-existing global write-lane validator finding seven unchanged `treasury` suite entries. |

No `tools/registry/**` file differs from `origin/main`; the write-lane baseline defect is not amended,
excluded, or represented as passing by this Work Order.

## Next Work Order

`WO-MAO-002 - Minimal Two-Lane Pilot`, after this reconciliation merges. The independent post-merge
reviewer is a separate read-only assurance-agent instance, not either implementation operator and not
William.
