# TerraFusion /loop Contract

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-003

## Purpose

A `/loop` is governed repetition. It is not "repeat forever." It advances through an approved Work
Order chain until a stop condition, merge boundary, or goal completion.

## Required Fields

Every `/loop` packet must define:

- loop id,
- parent goal,
- current Work Order selection rule,
- next Work Order selection rule,
- same-risk continuation rule,
- validation cadence,
- evidence cadence,
- PR/check/review monitoring rule,
- stop-gate classifier,
- post-merge rule,
- next-lane recommendation rule.

## Loop Responsibilities

The loop owns:

- choosing the next eligible Work Order inside the current goal,
- deciding whether Codex may continue automatically,
- enforcing validation cadence,
- enforcing evidence cadence,
- monitoring PR/review/check state,
- classifying stop gates,
- requiring post-merge verification before moving on.

The loop does not own:

- permission to exceed the goal risk ceiling,
- permission to bypass owner walls,
- permission to mutate blocked systems,
- authority to merge unless the merge model explicitly grants it.

## Same-Risk Continuation Rule

Codex may continue automatically when all are true:

- the current Work Order is complete or merged as required,
- the next Work Order is declared in the current loop,
- the next Work Order is same or lower risk,
- the next Work Order stays inside the authorized file surface,
- validation passed or any failure is remediable within scope,
- no protected system boundary appears,
- no owner authority wall appears.

## Stop Rule

Codex must stop when:

- owner authority is genuinely required,
- validation fails and cannot be repaired in scope,
- scope expands,
- branch strategy conflicts repeat,
- runtime/product/deployment/county/secrets boundary appears,
- destructive action is needed,
- canon sources conflict,
- local hook bypass is needed and not covered by standing exception.

STOP_TYPE: LOOP_CONTRACT_DEFINED

