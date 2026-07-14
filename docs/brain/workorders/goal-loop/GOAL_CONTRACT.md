# TerraFusion /goal Contract


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-002

## Purpose

A `/goal` is the bounded mission container for a TerraFusion program. It is not a single task and it
does not mutate the repository by itself.

The goal lets Codex operate without asking what to do every few minutes because intent, boundaries,
success conditions, authority walls, and continuation posture are already defined.

## Required Fields

Every `/goal` packet must define:

- goal id,
- program slug,
- mission,
- success condition,
- allowed risk classes,
- allowed systems and file surfaces,
- blocked systems and file surfaces,
- authority model,
- validation baseline,
- merge policy,
- continuation policy,
- stop conditions.

Reusable authority records must also name their effective point, expiry or terminal condition,
revocation triggers, eligible PR or PR class, and evidence/rollback requirements. Recorded authority
persists across sessions until it expires, completes, is revoked, or is superseded.

## Goal Responsibilities

The goal owns:

- program intent,
- completion definition,
- system boundary,
- risk ceiling,
- owner authority model,
- relationship to the active program register.

The goal does not own:

- implementation details for every file,
- PR merge authority unless explicitly stated,
- production authority,
- permission to cross blocked systems.

## Required Output From Goal Selection

When Codex selects or resumes a goal, it must report:

- selected program,
- current Work Order,
- next Work Order if current is complete,
- known blockers,
- active stop walls,
- allowed loop modes,
- whether continuation inside the recorded authority ceiling is enabled.

## Non-Claims

A goal does not authorize runtime, deployment, county, PACS, secrets, schema, CI, branch protection, or
destructive actions unless the goal explicitly includes that authority and the active Work Order scope
also permits it.

STOP_TYPE: GOAL_CONTRACT_DEFINED
