# Canon/IDE Execution Backlog

## Stage 0 — Truth Gate

- Run backend build.
- Run frontend type-check.
- Search for `os-canon`, `moduleComponents`, `activateModule`, route navigation drift.
- Inventory existing shell components.
- Confirm protected paths and hardcoded port policy.
- Confirm current AGENT_ENTRYPOINT and SEAL state.

## Stage 1 — os-canon shell compliance

- Register `os-canon` as lazy-loaded module.
- Launch with `activateModule(id)`.
- Apply near-full-stage sizing.
- Preserve Dock and Top Bar.
- Add launch-surface contract test.

## Stage 2 — Canon Runtime MVP

- Implement rule schema.
- Implement canon index.
- Implement query-by-path and query-by-task.
- Implement allowed/forbidden path resolution.
- Implement risk scoring.

## Stage 3 — Engineering write-lanes

- Add source-code path ownership.
- Add risk levels.
- Add manual review requirements.
- Add protected path policy.

## Stage 4 — Agent task state machine

- Add task schema.
- Add lifecycle transitions.
- Add transition audit events.
- Block invalid transitions.

## Stage 5 — Hooks + command policy

- Implement hook runner.
- Implement command allowlist/blocklist.
- Add approval-required commands.
- Add timeout/artifact capture policy.

## Stage 6 — Worktree + Git

- Create task worktrees.
- Bind tasks to worktree paths.
- Show diff.
- Stage/revert.
- Commit/PR draft.

## Stage 7 — Gate runner

- Typecheck gate.
- Backend build gate.
- Shell contract gate.
- Write-lane gate.
- Hardcoded port gate.
- Evidence gate.

## Stage 8 — Evidence + trace

- Evidence bundle writer.
- Redaction.
- Trace hash/seal.
- PR proof attachment.

## Stage 9 — os-canon UI

- Task composer.
- Plan panel.
- Diff panel.
- Gate panel.
- Trace panel.
- Agent stack.
- Approval panel.

## Stage 10 — CLI

- `tf canon query`
- `tf canon plan`
- `tf canon gates`
- `tf canon trace seal`
- `tf agent run`

## Stage 11 — Standalone Desktop

- Local repo open.
- Worktree tasking.
- Terminal.
- Diff/Git.
- Gate runner.
- Evidence viewer.
- No production county mutation.
