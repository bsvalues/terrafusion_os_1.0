# Domain Pack: Dossier (TerraDossier)

> Suite ID: `terradossier` · Domain: Records / Evidence · Mission: **prove the decision**

## Mission

Prove the decision. TerraDossier owns records, evidence, documents, narratives, case files, and
packets — and the custody of that evidence.

## Owns

- Documents (uploads and generated).
- Narratives (including Muse drafts, if saved).
- Evidence items and evidence custody.
- Packets (assembled collections).
- Case files.

## Does Not Own

- Valuation math, models, or comps (**TerraForge**).
- Workflow state — permits, exemptions, appeals, notices, certification (**TerraDais**).
- GIS geometry, layers, or spatial annotations (**TerraAtlas**).
- Shell routing, window management, or the Workbench frame (**Shell / OS Core**).

## Allowed Writes

- Document records (upload + generated), with custody metadata.
- Narratives and saved Muse drafts.
- Evidence items and their custody chain.
- Assembled packets and case files — writes emitting an appropriate TerraTrace event.

## Forbidden Writes

- Valuation data — **TerraForge**.
- Workflow / admin state — **TerraDais** (Dossier records/assembles outcomes; it does not initiate workflows).
- GIS geometry / spatial artifacts — **TerraAtlas**.
- Shell chrome, routing, or z-index.
- Any persistence not isolated by `CountyId` for county-scoped data.

## Routing Rules

- Dossier is the **single custody owner** for documents and evidence; other suites that need a document
  attached **call the Dossier service** rather than writing the document store themselves.
- Dossier **records and assembles outcomes** — it does **not** initiate workflows (that is Dais).
- A published notice (drafted/queued by Dais) becomes a Dossier artifact once delivered.
- Parcel-scoped records work surfaces in the **Property Workbench** Dossier tab, not standalone windows.

## Required Proof

- `pnpm run type-check`.
- `pnpm canon` / `pnpm canon:gatefast` (write-lane gates green).
- Evidence-custody integrity (cf. `phase4d.wave1d.dossier-documents.json` style artifacts for the
  expected shape of records proof).
- TerraTrace event emission for evidence/document writes.
- `CountyId` isolation evidence for county-scoped writes.

## Common Failure Patterns

- Initiating or mutating a workflow from a records flow — Dais's lane.
- Recomputing or rewriting a valuation number when assembling a packet — Forge's lane.
- Editing geometry to "correct" a map in a packet — Atlas's lane.
- Letting another suite write the document store directly instead of through the Dossier service.
- Missing `CountyId` filter on evidence persistence.

## Escalation Triggers

Stop and get human approval when a change would:

- Alter evidence-custody or chain-of-custody semantics (legal significance).
- Change document retention or classification behavior.
- Touch another suite's write lane.
- Affect county-isolation behavior.

## Non-Goals

- No valuation math.
- No workflow orchestration.
- No GIS editing.
- No shell/routing changes.
- No suite-local brain or queue authority.

## Canon Sources

- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§3.4 TerraDossier; §8.2 `dossier` reserved meaning)
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` (write-lane matrix; "Dossier does not initiate workflows")
- `CLAUDE.md` (County data isolation / Sovereign County model)
- Suite home: `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx`
