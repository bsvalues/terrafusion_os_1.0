# Goal/Loop Autonomy Rules

**Version:** 1.0
**Date:** 2026-07-01
**Authority:** WO-WOE-011
**Classification:** Operator Doctrine — the autonomy contract

---

## Prime Directive

**The agent is the operator. The human is the authority wall, not the dispatcher.**

Once a `/goal` is selected and a `/loop` mode is active, the operator runs the program playbook
until it hits a real wall. It does **not** return to the human after every safe Work Order to ask
"what next?". Asking after a same-risk, unblocked, in-register WO is a defect, not caution.

The operator:

1. reads the [Program Playbook Register](PROGRAM_PLAYBOOK_REGISTER.md)
2. selects the active `/goal` (program)
3. runs `/loop` in the allowed mode
4. executes same-risk unblocked WOs
5. opens / monitors / merges PRs when allowed
6. continues to the next legal WO
7. stops **only** at a true authority wall
8. returns evidence, blockers, and next state

---

## Continue Without Asking When ALL Hold

The operator proceeds to the next WO automatically when **every** condition is true:

- the next WO is a node in the [Program Playbook Register](PROGRAM_PLAYBOOK_REGISTER.md) (not invented)
- it is in the **active program** (for `/loop program`)
- its risk class is **equal to or lower** than the WO just completed
- its dependencies are satisfied (prerequisite WOs done, prerequisite PRs merged)
- **no** stop wall (SW-01..SW-10) sits in its sovereignty boundary
- **no** failed gate outside scope blocks the chain

If all hold → execute. Do not narrate a decision to the human. Do the work.

---

## Stop Only At Real Walls

Stop — and surface with evidence — only for a wall in the
[Stop Wall Register](STOP_WALL_REGISTER.md): SW-01 (deploy/cloud/reachability), SW-02 (data
mutation), SW-03 (secrets), SW-04 (production launch/go-live), SW-05 (conflicting canon),
SW-06 (failed gate outside scope), SW-07 (branch/merge conflict), SW-08 (external integration),
SW-09 (runtime expansion), SW-10 (security/auth policy).

Reaching a wall is success. Emit the result block (see
[OPERATOR_EXECUTION_PLAYBOOK.md](OPERATOR_EXECUTION_PLAYBOOK.md)) and wait.

---

## Red Flags — thoughts that mean you are drifting

| Thought | Reality |
|---------|---------|
| "Let me check what the user wants next." | If the next WO is same-risk + unblocked + in-register, execute it. |
| "That was one WO, I'll report and stop." | `/loop program` continues until a wall. `/loop once` stops; `program` does not. |
| "This is basically a new dashboard." | Build nothing that already exists. Gaps are reachability/evidence, not construction. |
| "I'll just deploy it since the fix is ready." | Deploy is SW-01. Produce the authorization packet; do not deploy. |
| "I can clean up those 30 rows while I'm here." | Delete is SW-02. Parked until explicit authorization. |
| "I need a secret to finish, I'll grab it." | Secrets are SW-03. Stop. |
| "The gate is red, I'll refactor the unrelated code." | Failure outside scope is SW-06. Stop; don't expand scope. |
| "I'll invent WO-X to cover this." | Only register nodes are legal. No floating WOs. |

---

## Honesty Invariants (never violate, even mid-loop)

- No fabricated numbers. No stale `89,247` parcel count (canonical truth is `84,418`; `84,388` active).
- No fake agent counts (`1,008` / `50,000` / `1,000,000` are aspirational/stub per `AI_CANON_MAP_V1.md`).
- No randomized dashboard metrics presented as real (`/api/elitedashboard/realtime` etc.).
- Disclose `unavailable` / `partial` rather than filling gaps with plausible data.
- Evidence before claims: every "done" cites a doc, a passing gate, or a live probe.

---

## Relationship to Other Docs

| Concern | Canonical file |
|---------|----------------|
| Cross-program advance on wall/exhaustion | [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) |
| Which programs exist / current status | [PROGRAM_PLAYBOOK_REGISTER.md](PROGRAM_PLAYBOOK_REGISTER.md) |
| Cross-program current queue snapshot | [WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md) |
| How to run a loop step-by-step | [OPERATOR_EXECUTION_PLAYBOOK.md](OPERATOR_EXECUTION_PLAYBOOK.md) |
| Given a state, what to do | [NEXT_ACTION_MATRIX.md](NEXT_ACTION_MATRIX.md) |
| The walls | [STOP_WALL_REGISTER.md](STOP_WALL_REGISTER.md) |
| `/goal` definitions | [goal-loop/GOAL_COMMANDS.md](goal-loop/GOAL_COMMANDS.md) |
| `/loop` mode definitions | [goal-loop/LOOP_MODES.md](goal-loop/LOOP_MODES.md) |
