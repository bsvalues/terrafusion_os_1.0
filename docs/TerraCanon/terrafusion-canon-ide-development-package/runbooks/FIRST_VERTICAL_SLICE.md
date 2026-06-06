# First Vertical Slice: Fix os-canon Shell Launch Drift

## Goal

Prove the entire Canon/IDE loop with one bounded engineering task.

## Scope

Allowed likely paths:

```txt
frontend/apps/os-shell/src/config/moduleComponents.tsx
frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx
frontend/apps/os-shell/src/orchestration/moduleActivation.ts
frontend/apps/os-shell/src/stores/desktopStore.ts
frontend/apps/os-shell/src/modules/os-canon/**
os-platform/core/tests/launch-surface-contract.test.mjs
```

Forbidden:

```txt
ARCHIVE/**
specialized/**
backend/**
marketplace/**
runtime county data
```

## Steps

1. Load Launch / Surface Contract.
2. Create Canon task.
3. Resolve allowed/forbidden files.
4. Create worktree.
5. Register `os-canon`.
6. Replace route navigation with `activateModule('os-canon')`.
7. Apply near-full-stage sizing.
8. Add/adjust launch-surface contract test.
9. Run gates:
   - `pnpm run type-check`
   - `node --test os-platform/core/tests/launch-surface-contract.test.mjs`
10. Generate evidence bundle.
11. Seal trace.
12. Draft commit/PR.

## Done

- os-canon opens inside shell.
- Dock visible.
- Top Bar visible.
- Near-full-stage.
- No unrelated files changed.
- Evidence bundle created.
