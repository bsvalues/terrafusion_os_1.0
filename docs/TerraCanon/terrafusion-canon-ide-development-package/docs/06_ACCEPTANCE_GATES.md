# Acceptance Gates

## Shell contract gate

Pass criteria:

- `os-canon` opens in-shell.
- Dock remains visible.
- Top Bar remains visible.
- Surface is near-full-stage.
- No full-page route is used.
- OS feature launch uses module activation.

## Canon Runtime gate

Pass criteria:

- Rules load from `canon-index.json`.
- Path lookup returns expected rules.
- Task lookup returns expected rules.
- Forbidden paths are blocked.
- Risk scoring returns deterministic result.

## Agent state gate

Pass criteria:

- Task cannot move from Draft to Executing.
- Task cannot edit files before Canon Context Loaded.
- Task cannot commit before gates run.
- Task cannot seal evidence before diff and gate outputs are attached.

## Command policy gate

Pass criteria:

- Allowed commands execute.
- Approval-required commands pause.
- Blocked commands fail closed.
- Outputs are captured and redacted.

## Worktree gate

Pass criteria:

- Task creates isolated worktree.
- Diff is scoped to worktree.
- Worktree cleanup does not touch main working tree.
- Parallel tasks do not collide.

## Evidence gate

Pass criteria:

- Evidence bundle has task ID, intent, files, commands, diff hash, gates, approvals, trace hash.
- Sensitive output is redacted.
- Bundle is immutable after sealing.
