# AGENTS.md — OS Shell

This is the **TerraFusion OS Shell** (department-agnostic chrome, window manager, routing spine).

**Before modifying anything here, read the Shell domain pack:** [`brain/packs/shell/README.md`](../../../brain/packs/shell/README.md).

Key boundaries (full detail in the pack):

- **Owns:** Dock, Top Bar, window manager, **z-index authority** (`src/shell/desktop/zIndex.ts`),
  module activation + suite registry (`src/config/suiteRegistry.ts`), command palette, global status,
  stage framing, and the Property Workbench frame.
- **Stay department-agnostic** — no suite business logic in the shell.
- **No hardcoded z-index** — all stacking goes through `zIndex.ts`.
- **No route escape** — parcel-scoped work routes to the Property Workbench, not standalone windows.
- OS features (TerraPilot, TerraTrace) **open inside the shell**.

Governance: one Brain, many packs. Authority hierarchy and human-approval triggers are in the root
[`AGENTS.md`](../../../AGENTS.md). Workbench tab order and OS-feature classification are constitutional
(`docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md`).
