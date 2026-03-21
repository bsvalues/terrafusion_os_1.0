# Frontend Command Palette Legacy Label Honesty

Date: 2026-03-21
Status: PASS
Owner lane: Agent C
Purpose: Record the bounded command-palette honesty slice that preserves legacy-module search aliases while stopping the mounted search surface from presenting legacy suite modules as current primary suite names.

## Scope

This quality lane was intentionally limited to the mounted command palette registry and its direct contract:

- `frontend/apps/os-shell/src/shell/command-palette/CommandPalette.tsx`
- `frontend/apps/os-shell/src/shell/command-palette/__tests__/CommandPalette.test.tsx`

No routing targets, module IDs, activation semantics, scene wiring, release gates, or governance plumbing were changed.

## Change Summary

- The legacy command-palette entries for `costforge`, `terra-gaia`, and `atlas-ai` now render as `TerraForge Legacy`, `TerraGPT Legacy`, and `TerraAtlas Legacy AI`.
- The visible labels now match the canonical suite identity while making the legacy status explicit on the mounted shell search surface.
- Search aliases for `CostForge`, `TerraGaia`, and `ATLAS AI` remain intact through keywords and explicit shortcut-match terms, so operator muscle memory still resolves to the correct legacy entries.
- A focused command-palette contract locks the legacy-label behavior and the preserved module activation path.

## Verification

Bounded verification was executed on 2026-03-21.

Results:

- `pnpm --dir frontend exec vitest run apps/os-shell/src/shell/command-palette/__tests__/CommandPalette.test.tsx` = `37 passed`, `0 failed`
- `pnpm run type-check` = `PASS`
- `node --test os-platform/core/tests/phase83-tools.test.mjs` = `56 passed`, `0 failed`
- `pnpm run security:scan` = `PASS` on rerun; governed scope remained `tools/registry`, `os-platform/core/pilot`, and `os-platform/core/types`, with the same existing `73 findings`

Note: the first post-change `security:scan` attempt hit a transient Snyk API timeout (`504 Gateway Timeout`) while scanning `os-platform/core/pilot`; the immediate rerun completed successfully without changing governed scope or findings posture.

## Truth Statement

This quality lane is a refinement only.

It does not alter the current production traffic blockers documented in the post-Phase-25 release authorization packet.