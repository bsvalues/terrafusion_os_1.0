# Domain Pack: Atlas (TerraAtlas)

> Suite ID: `terraatlas` · Domain: GIS / Spatial · Mission: **see the county**
> Modules: `terra-parcel` (ParcelLens), `terra-layers` (LayerWorks), and related spatial modules

## Mission

See the county. TerraAtlas owns the GIS / spatial domain — maps, layers, geometry, and the spatial
tools that let assessors understand parcels in space.

## Owns

- GIS layers and layer symbology.
- Parcel boundaries (geometry).
- Spatial annotations.
- Map bookmarks.
- Neighborhood definitions.
- Layer preferences.

## Does Not Own

- Valuation calculations, models, or comps (**TerraForge**).
- Workflow state — permits, exemptions, appeals, notices, certification (**TerraDais**).
- Document / evidence custody (**TerraDossier**).
- Shell routing, window management, or the Workbench frame (**Shell / OS Core**).

## Allowed Writes

- GIS layers, symbology, and layer preferences.
- Parcel boundary geometry (single spatial writer).
- Spatial annotations and markup.
- Map bookmarks and neighborhood definitions — spatial writes emitting an appropriate TerraTrace event.

## Forbidden Writes

- Valuation data of any kind — **TerraForge**.
- Workflow / admin state — **TerraDais** ("no admin workflow writes" per the write-lane matrix).
- Documents, narratives, packets, evidence — **TerraDossier**.
- Shell chrome, routing, or z-index.
- Any persistence not isolated by `CountyId` for county-scoped data.

## Routing Rules

- Spatial artifacts are written only by Atlas; other suites consume geometry read-only.
- Need a neighborhood used in valuation? **Forge** reads the Atlas-owned definition; Atlas does not
  compute value from it.
- Need a map exported into an evidence packet? **Dossier** assembles the packet; Atlas supplies the
  spatial render, not the document record.
- Parcel-scoped spatial work surfaces in the **Property Workbench** Atlas tab, not standalone windows.

## Required Proof

- `pnpm run type-check`.
- `pnpm canon` / `pnpm canon:gatefast` (write-lane gates green).
- For geometry changes: spatial regression / integrity evidence (cf. `phase4d.wave1c.atlas-gis.json`
  style artifacts for the expected shape of spatial proof).
- TerraTrace event emission for spatial writes.
- `CountyId` isolation evidence for county-scoped writes.

## Common Failure Patterns

- Computing or storing a value from a spatial layer — crosses into Forge's lane.
- Editing workflow state from a map tool — Dais's lane.
- Persisting an exported map as a "document" instead of routing to Dossier.
- A second writer for parcel geometry — single-writer rule violation.
- Missing `CountyId` filter on spatial persistence.

## Escalation Triggers

Stop and get human approval when a change would:

- Change parcel-geometry semantics or the authoritative boundary source.
- Alter neighborhood definitions that downstream valuation depends on.
- Touch another suite's write lane.
- Affect county-isolation behavior.

## Non-Goals

- No valuation math.
- No workflow orchestration.
- No document custody.
- No shell/routing changes.
- No suite-local brain or queue authority.

## Canon Sources

- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§3.2 TerraAtlas; Article VI modules; §8.2 `atlas` reserved meaning)
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` (write-lane matrix; "no admin workflow writes")
- `CLAUDE.md` (County data isolation / Sovereign County model)
- Modules: `packages/gis-pro`
- Suite home: `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`
