# Domain Pack: Forge (TerraForge)

> Suite ID: `terraforge` · Domain: Valuation · Mission: **build value**
> Modules: `terra-cost`, `terra-comp`, and related valuation modules

## Mission

Build value. TerraForge owns valuation engineering — the models, approaches, comparable analysis, and
calibration that produce defensible value.

## Owns

- Valuation models and model outputs.
- Cost approach data.
- Income approach data.
- Sales comparison data and comparable grids.
- Comparable selections.
- Model calibration.
- CAMA characteristics (single writer for parcel characteristics).
- Valuation notes.

## Does Not Own

- Appeal workflow, permit/exemption state, notice queues, or certification (**TerraDais**).
- Document / evidence custody (**TerraDossier**).
- GIS geometry, layers, or spatial annotations (**TerraAtlas**).
- Shell routing, window management, or the Workbench frame (**Shell / OS Core**).

## Allowed Writes

- Valuation models, cost/income/sales-comparison data, comparable grids and selections.
- Model calibration parameters and runs.
- CAMA characteristics (Forge is the single CAMA writer per the write-lane matrix).
- Valuation notes — each value-affecting write emitting a TerraTrace `valuation` event.

## Forbidden Writes

- Workflow state (permits, exemptions, appeals, notices, certification) — **TerraDais**.
- Documents, narratives, packets, or evidence — **TerraDossier**.
- GIS geometry / spatial artifacts — **TerraAtlas**.
- Shell chrome, routing, or z-index.
- Any persistence not isolated by `CountyId` for county-scoped data.

## Routing Rules

- Value changes emit TerraTrace events in the `valuation` category.
- Other suites **consume valuation read-only**; Forge never writes into their lanes.
- Need the valuation reflected in a notice or appeal packet? **Dais** drafts the workflow / **Dossier**
  assembles the document — Forge supplies the number, nothing more.
- Parcel-scoped valuation work surfaces in the **Property Workbench** Forge tab, not standalone windows.

## Required Proof

- `pnpm run type-check`.
- `pnpm canon` / `pnpm canon:gatefast` (write-lane gates green).
- Valuation regression / calibration evidence where models change (see `phase4d.wave1a.forge-*.json`
  style regression artifacts for the expected shape of valuation proof).
- TerraTrace `valuation` event emission for value-affecting writes.
- `CountyId` isolation evidence for county-scoped writes.

## Common Failure Patterns

- Writing workflow state ("mark this appeal resolved") from within a valuation flow — Dais's lane.
- Persisting a generated valuation PDF directly instead of routing to Dossier.
- Editing parcel geometry to "fix" a comp — Atlas's lane.
- Duplicating the CAMA writer (two code paths writing characteristics) — single-writer rule violation.
- Value-affecting change with no `valuation` trace event.

## Escalation Triggers

Stop and get human approval when a change would:

- Change a valuation **methodology** or calibration approach (product behavior change).
- Alter CAMA characteristic semantics or the single-writer boundary.
- Touch another suite's write lane.
- Affect county-isolation behavior.

## Non-Goals

- No workflow orchestration.
- No document custody.
- No GIS editing.
- No shell/routing changes.
- No suite-local brain or queue authority.

## Canon Sources

- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§3.1 TerraForge; §8.2 `forge` reserved meaning)
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` (write-lane matrix; single CAMA writer)
- `CLAUDE.md` (County data isolation / Sovereign County model)
- Modules: `packages/terrabuild`
- Suite home: `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`
