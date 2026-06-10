# Domain Pack: Dais (TerraDais)

> Suite ID: `terradais` · Domain: Assessor Admin · Mission: **operate value**
> Modules: `terra-levy`, `terra-pilt`, `terra-permit`, `terra-exempt`, `terra-appeal`, `terra-cert`, `terra-notice`, `terra-queue`

## Mission

Operate value. TerraDais owns assessor administration and the workflow state behind permits,
exemptions, appeals, notices, and roll certification.

## Owns

- Permit records, lifecycle, and inspection status.
- Exemption records, eligibility determinations, renewals, and decisions.
- Appeal records, deadlines, and BOE workflow state.
- Notices: drafts, queue, and delivery status.
- Roll certification checklists and sign-offs (policy-gated, high-risk).
- Task assignments, work queues, SLA tracking, and workflow states generally.

## Does Not Own

- Valuation math, models, comparable selection, or CAMA characteristics (**TerraForge**).
- GIS geometry, layers, or spatial annotations (**TerraAtlas**).
- Document/evidence custody (**TerraDossier** — Dais must use the Dossier service API).
- Shell routing, window management, or the Workbench frame (**Shell / OS Core**).

## Allowed Writes

- Permit lifecycle + inspection state.
- Exemption decisions, renewals, and supporting status.
- Appeal state and BOE deadlines.
- Notice drafts, queue entries, and delivery status (the *published* notice is a Dossier artifact).
- Certification checklist items and sign-offs (with policy gate).
- Task/queue assignments and workflow transitions — each emitting a TerraTrace `workflow` event.

## Forbidden Writes

- Valuation artifacts of any kind (model outputs, comps, breakdowns) — **TerraForge** is the single writer.
- GIS geometry / spatial artifacts — **TerraAtlas**.
- Documents, narratives, packets, or evidence directly — must go through the **TerraDossier** service API.
- Shell chrome, routing, or z-index.
- Any persistence that is **not** filtered by `CountyId` for county-scoped data.

## Routing Rules

- County-scoped persistence **must** be isolated by `CountyId` (Sovereign County model).
- Workflow status changes emit TerraTrace events in the `workflow` category.
- Need a document attached to a workflow outcome? Route to the **Dossier** service, do not write the
  document store from Dais.
- Need a valuation number to act on? Read it from **Forge** (read-only); never recompute or rewrite it.
- Parcel-scoped admin work surfaces in the **Property Workbench** Dais tab, not standalone windows.

## Required Proof

- `pnpm run type-check`.
- `pnpm canon` / `pnpm canon:gatefast` (write-lane + naming gates green).
- Evidence that county-scoped writes filter by `CountyId`.
- TerraTrace `workflow` event emission for state transitions.
- For certification sign-offs: policy-gate evidence (high-risk path).

## Common Failure Patterns

- Writing a valuation number "because the workflow needed it" — crosses into Forge's lane.
- Storing an uploaded document directly instead of calling the Dossier service.
- Missing `CountyId` filter, leaking cross-county workflow state.
- Using `audit` in a module name (reserved for the future TerraAudit office — use `trace`/`activity`).
- Using reserved office words (`clerk`, `treasury`, `auditor`, `recorder`) in a Dais module.

## Escalation Triggers

Stop and get human approval when a change would:

- Alter roll **certification** logic or sign-off gating (statutory, high-risk).
- Change statutory deadlines or BOE appeal rules.
- Touch a write lane owned by another suite.
- Introduce a new Dais module (suite-owner approval + naming-rule compliance required).
- Affect county-isolation behavior.

## Non-Goals

- No valuation engineering.
- No GIS editing.
- No document custody.
- No shell/routing changes.
- No suite-local brain or queue authority — sequencing belongs to the OS Brain.

## Canon Sources

- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§3.3 TerraDais; Article V modules; §8 blocked words)
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` (write-lane matrix)
- `CLAUDE.md` (County data isolation / Sovereign County model)
- Modules: `packages/terra-levy`, `packages/terra-pilt`, `packages/terra-permit`
- Suite home: `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`
