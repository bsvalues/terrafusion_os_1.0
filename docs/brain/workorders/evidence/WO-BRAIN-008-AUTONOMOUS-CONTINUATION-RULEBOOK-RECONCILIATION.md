# WO-BRAIN-008 - Autonomous Continuation Rulebook Reconciliation

**Program:** Brain Operator System

**Goal:** `GOAL-BRAIN-OPERATOR-001`

**Loop:** `LOOP-BRAIN-OPERATOR-001`

**Base:** `017648d00b6de282b3b5c753058bde47045d9a9b`

## Verdict

RECONCILED / OPERATOR-EXECUTED. Autonomous continuation means the active operator advances through
registered, dependency-cleared work under existing authority. It does not mean an unattended runner,
an independent Brain service, or authority inferred from a score.

## Canonical Continuation Contract

The operator continues when all are true:

1. The current WO is complete or merged as its program requires.
2. The next WO is registered in the active program or deterministically selected by the portfolio gate.
3. Dependencies are verified from current evidence.
4. The next WO is same or lower risk under the canonical WOE R0-R5 model, or its higher risk is already
   explicitly authorized by the active goal/loop packet.
5. File and system scope is explicit.
6. Validation and review failures are remediable inside scope.
7. No ungranted root approval trigger or SW-01..SW-10 wall is crossed.
8. Any merge, tooling exception, or destructive repair uses authority already granted for the exact
   program, PR, commit, or target.

Program completion triggers portfolio reconciliation. It is not an owner-dispatch stop. The run stops
only when all safe registered lanes are parked/exhausted or a true authority decision blocks the
selected action.

## Canonical Risk Vocabulary

Work-order continuation uses `WORK_ORDER_DATA_MODEL.md`:

| Class | Continuation meaning |
|-------|----------------------|
| R0 | Read-only discovery; no repository writes |
| R1 | Docs, evidence, schema, register, or operator-truth patch |
| R2 | Local developer tooling with no product/runtime behavior |
| R3 | CI, governance tooling, hooks, or policy configuration |
| R4 | Runtime/application behavior |
| R5 | Production, security, protected data, release, deployment, secrets, PACS, or county systems |

The path router's R0-R3 values are a legacy path-risk-floor profile aligned to TerraPilot write
severity. They are not interchangeable with WOE execution risk and cannot lower a WO's risk.

## Authority Reconciliation

- Normal worktree, commit, push, PR, review, and branch-update operations continue under the active
  operator packet.
- Merge continues only under an explicit applicable merge mode; otherwise it is an authority wall.
- Hook bypass continues only under an explicit applicable exception. DevEx bootstrap makes normal
  hooks the expected path.
- Exact destructive worktree repair may continue only when the target and preservation checks are
  already authorized.
- A score, memory record, next candidate, or historical worked example never grants authority.

## Source Precedence

1. Constitution and root/nearest `AGENTS.md`.
2. One-Brain goal, loop, WO, stop-wall, and domain-pack doctrine.
3. Explicit current owner authority packet.
4. Current program/register/queue state.
5. Live Git/GitHub/validation evidence.
6. Historical examples and memory, labeled as snapshots.

## Non-Claims

This reconciliation does not add a scheduler, runner, queue service, risk calculator, merge bot,
hook bypass, CI rule, or runtime behavior. The active agent remains the executor.

## Next Work Order

`WO-BRAIN-009 - Brain/WOE Integration Evidence Packet` is dependency-cleared.

STOP_TYPE: `BRAIN_AUTONOMOUS_CONTINUATION_RULEBOOK_RECONCILED`
