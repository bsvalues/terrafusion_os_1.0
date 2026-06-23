# Domain Pack: Shell

> OS shell chrome and routing. **Not a suite.** An OS surface owned by OS Core.
> Canonical location: `frontend/apps/os-shell/`

## Mission

Provide the department-agnostic operating-system shell: the chrome, window management, and routing
spine that every suite renders inside. The shell teaches and enforces the OS model; it never contains
department business logic.

## Owns

- OS shell chrome: Dock, Top Bar, global status, stage framing.
- Window manager and **z-index authority** (`frontend/apps/os-shell/src/shell/desktop/zIndex.ts`).
- Module/suite activation and the **suite registry** (`frontend/apps/os-shell/src/config/suiteRegistry.ts`).
- Command palette and global navigation.
- The **Property Workbench** OS surface and its canonical tab order:
  `Summary → Forge → Atlas → Dais → Dossier → Pilot` (Dossier and Pilot always last).
- Bridge/anti-drift UI (Suite Compass, Context Ribbon) that teaches the OS model.
- Hosting OS features (TerraPilot, TerraTrace) **inside** the shell.

## Does Not Own

- Any suite business logic (valuation, GIS, workflow, documents, AI).
- Parcel-scoped domain work — that belongs to the **Property Workbench**, not standalone windows.
- Write lanes for suite-owned facts (see the suite packs).
- The audit/trace event store (TerraTrace owns it; the shell only hosts the surface).

## Allowed Writes

- Shell chrome layout, Dock/Top Bar configuration, window state, and z-index constants **within the
  canonical layer hierarchy**.
- Suite registry entries (registration metadata only — manually maintained source of truth).
- Routing tables, command-palette entries, and global navigation state.
- Bridge UI (Suite Compass, Context Ribbon) presentation — read-only projections only.

## Forbidden Writes

- **Hardcoded z-index values.** All stacking goes through the z-index authority module; no magic
  numbers in components.
- **Route escape**: opening parcel-scoped work in a standalone window instead of routing to the
  Property Workbench (`/property/:parcelId/:tab`).
- Suite-owned domain data (valuation, GIS geometry, workflow state, documents) — route to the owning
  suite's service, never write directly from the shell.
- Department-specific business rules embedded in shell chrome.
- Reordering the canonical Workbench tab order without Architecture-team approval (constitutional).

## Routing Rules

- Parcel-scoped work **routes to the Property Workbench**, not standalone windows.
- OS features (TerraPilot, TerraTrace) **open inside the shell**, never as separate apps.
- Suite activation goes through the suite registry; new surfaces register there rather than
  hard-wiring navigation.
- Stacking/overlay decisions route through `zIndex.ts` (Top Bar = 10, Windows = 30, Dock = 1000,
  command palette = 1200–1300, modals = 1400, a11y skip-nav = 99999).
- Cross-suite actions initiated from the shell route through the owning lane's service + TerraTrace.

## Required Proof

- `pnpm run type-check` (must pass).
- `pnpm canon` / `pnpm canon:gatefast` (governance gates green).
- Shell-contract / Tier-1 UI Harness validation green (the `🧪 Tier-1 UI Harness Validation` required check).
- For routing/z-index changes: evidence that no hardcoded z-index was introduced and no route-escape
  path was added.

## Common Failure Patterns

- Opening a parcel detail in a free-floating window instead of the Workbench tab route.
- Hardcoding `z-index: 9999` (or similar) in a component instead of using `zIndex.ts`.
- Smuggling suite business logic (valuation math, workflow transitions) into shell components.
- Reordering or renaming Workbench tabs and breaking the locked canonical order.
- Registering a suite surface ad hoc instead of through `suiteRegistry.ts`.

## Escalation Triggers

Stop and get human approval when a change would:

- Reorder, rename, add, or remove a Workbench tab (constitutional — Architecture team).
- Restructure the z-index layer hierarchy.
- Change the global routing model or introduce a new top-level surface.
- Make the shell department-aware (couple it to a specific office's rules).

## Non-Goals

- No suite business logic in the shell.
- No standalone parcel windows.
- No second brain / no suite-local queue inside the shell.
- Not building the Brain Path Router (WO-BRAIN-0014).

## Canon Sources

- `docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md`
- `docs/files/PROPERTY_WORKBENCH_SPEC_v3.md`
- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (Article IV: Workbench tab order; §1.2 OS features)
- `frontend/apps/os-shell/src/shell/desktop/zIndex.ts` (z-index authority)
- `frontend/apps/os-shell/src/config/suiteRegistry.ts` (suite registration source of truth)
