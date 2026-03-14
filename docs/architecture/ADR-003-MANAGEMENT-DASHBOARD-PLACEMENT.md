# ADR-003: Management Dashboard is a TerraDais Suite Module

**Status:** Accepted (2026-03-14)

## Context

- Management Dashboard provides office-wide operational views: work queue status, staff assignment, area progress, certification tracking, performance metrics.
- Polyrepo audit found implementations in: BCBSWebhub (audit workflow engine, user performance metrics, configurable dashboard widgets), BCBSLevy (levy operations dashboard, district analysis), TerraMiner (ETL monitoring, job scheduling, alert management), mass-valuation-showcase (mass appraisal dashboard, county progress tracking).
- These are county-management scope -- they span all parcels, all staff, all workflows.
- They cannot be parcel-scoped or even cross-parcel -- they are office-level operational tools.
- They fall within Dais's constitutional write-lane: workflow states, work assignment, certification, notices (TF-052).
- The plan's open question was: "Is Management Dashboard a TerraDais module or OS workspace?" (ADR-TBD-3).
- The Assessor and Deputy/Chief roles use this as their primary workspace (Doc 0A).

## Decision

- Management Dashboard is a **TerraDais standalone suite module**.
- It opens inside the TerraDais suite workspace (near-full-stage window), NOT as a separate OS workspace.
- It is NOT a new OS-level surface -- it belongs to Dais's workflow/operations domain.
- No new module ID needed -- it will be a view/panel within the existing `suite-dais` surface.
- Launch surface: TerraDais suite home -> Management Dashboard panel (or default landing for Assessor/Deputy roles).
- Write-lane: Dais (work queue assignments, review status, certification state).
- Read-lane from Forge: valuation progress, ratio study results (Forge writes these; Dais reads them).
- Read-lane from Atlas: GIS completion status (Atlas writes; Dais reads).
- Constitutional basis: TF-052 section Dais owns "workflow states, work assignment, certification, notices" and planned modules include "terra-queue".

## Consequences

- DaisSuiteHome.tsx will add Management Dashboard as a primary panel (likely the default view for Assessor/Deputy roles).
- Backend: `TerraFusion.Core` needs work queue, assignment, and certification services.
- The existing `deputy_chief` and `assessor` role definitions in workbenchRoles.ts already list Dais as a primary workspace -- this confirms that pattern.
- **Boundary: Dais vs. TerraCanon/OS Admin dashboards.** Dais Management Dashboard owns assessor operations: work queues, staff assignment, area progress, certification tracking, valuation cycle metrics. Infrastructure and system health dashboards (ETL monitoring, service status, deployment health, agent swarm metrics) belong to TerraCanon or OS Admin surfaces — that is the IT Director's domain, not the Assessor's. This boundary is explicit: if the dashboard answers "how is our assessment work progressing?" → Dais. If it answers "are our systems healthy?" → TerraCanon/OS Admin. ADR-TBD-5 will formalize TerraCanon's scope.
- No new OS-level surface registration needed.
- No new module ID in generatedModules.ts needed (uses existing suite-dais).
