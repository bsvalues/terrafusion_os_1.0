# Merge Authority Model

Program: codex-operator-autonomy
Goal: GOAL-TF-CODEX-OPERATOR-AUTONOMY-001
Loop: LOOP-TF-CODEX-OPERATOR-AUTONOMY-001
Work Order: WO-OP-AUTO-008

## Purpose

Codex must distinguish merge readiness from merge authority.

## Mode A - Owner Merge Required

Default for:

- runtime,
- backend,
- frontend runtime behavior,
- tools-sync implementation,
- CI or workflow changes,
- deployment,
- county runtime,
- PACS,
- secrets,
- product behavior.

Codex reports `MERGE_AUTH_REQUIRED` when the PR is clean, green, and in scope.

## Mode B - Preauthorized Merge When Green

Allowed only when the active goal/loop explicitly grants it for docs/governance Work Orders and all
are true:

- PR scope matches the Work Order,
- checks are green or explicitly acceptable,
- review threads are resolved,
- merge state is clean,
- no runtime/backend/tools-sync/CI/deployment/county files changed,
- no owner authority wall remains.

Codex must still post-merge verify `origin/main`.

## Mode C - Auto-Merge Armed

Codex may enable auto-merge only inside explicitly approved low-risk loops when:

- branch protection allows it,
- the Work Order permits it,
- no review or scope wall remains,
- the PR remains docs/governance only.

## Required Merge Report

After any authorized merge, Codex reports:

- PR number and URL,
- merge commit,
- `origin/main` head,
- files verified on main,
- post-merge validation,
- next Work Order or next-lane recommendation.

STOP_TYPE: MERGE_AUTHORITY_MODEL_DEFINED
