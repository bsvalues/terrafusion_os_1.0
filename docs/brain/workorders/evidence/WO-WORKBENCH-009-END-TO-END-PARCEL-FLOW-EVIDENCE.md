# WO-WORKBENCH-009 — End-to-End Parcel Flow Evidence

## Result

`PASS`

The Property Workbench has a coherent end-to-end parcel flow from route/selection into a parcel-scoped workbench shell, shared tab context, suite-specific tabs, and traceable Pilot activity surfaces.

This work order is evidence-only. No runtime code, route code, package files, CI, schema/migration, county data, PACS integration, tool policy, or deployment surface was changed.

## Scope

Goal: document the observed end-to-end parcel assessor flow across the canonical Property Workbench path.

Inspected surfaces:

- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`
- `frontend/apps/os-shell/src/context/workbenchTabContext.tsx`
- `frontend/apps/os-shell/src/context/parcelContext.ts`
- `frontend/apps/os-shell/src/stores/propertyStore.ts`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertySummary.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/**`
- `frontend/apps/os-shell/src/__tests__/shell/workbenchHostIntegrity.contract.test.ts`

## Flow Summary

Observed route flow:

```text
property search / parcel selection
  -> /property/:parcelId/*
  -> PropertyWorkbench
  -> usePropertyStore.selectParcel(parcelId)
  -> DataProvider parcel evidence load
  -> ContextRibbon + WorkbenchRail + ActivityFeed
  -> React Router Outlet context
  -> Workbench tab surface
```

Observed tab context flow:

```text
PropertyWorkbench
  -> Outlet context { parcelId, propertyData, workMode }
  -> useWorkbenchTab()
  -> tab-specific surface
```

Observed window-adapter flow:

```text
openWorkbenchWindow(parcelId, tabId)
  -> set parcel context
  -> record recent parcel
  -> selectParcel(parcelId)
  -> open property-workbench desktop window
  -> WorkbenchTabProvider / WorkbenchTabCtx
  -> tab-specific surface
```

## Canonical Workbench Shell

`PropertyWorkbench.tsx` is the route-hosted parcel-context hub for `/property/:parcelId/*`.

Observed shell capabilities:

- reads `parcelId` from route params
- computes current tab from route path
- loads active parcel through `usePropertyStore.selectParcel(parcelId)`
- blocks review when authenticated/live parcel evidence is unavailable
- renders `ContextRibbon`, `WorkbenchRail`, route `Outlet`, and `ActivityFeed`
- passes parcel context to child tabs through `Outlet context`
- uses role-aware tab visibility while preserving tab order
- keeps quick actions tool-bound through OS action execution

The shell does not directly perform suite business writes. It hosts and coordinates parcel-scoped surfaces.

## Parcel Evidence Model

`propertyStore.ts` is the shared active-parcel state path.

Observed behavior:

- `selectParcel(parcelId)` sets the active parcel
- parcel evidence load uses `getDataProvider().getParcel(parcelId)`
- related data loads in parallel after the parcel shell is usable
- related data includes assessments, documents, appeals, tax statements, recording history, audit trail, and recent operations
- missing/unauthorized parcel evidence produces an explicit blocker state rather than allowing silent reliance
- recent parcels are persisted as a convenience surface

This is an honest local/route state model, not proof of production data availability.

## Canonical Tabs Observed

The active assessor flow currently includes:

- Summary — overview and parcel identity/context
- Forge — valuation review and related valuation surfaces
- Atlas — GIS/spatial evidence
- Dais — workflow/appeal/notice/certification surfaces
- Dossier — records/evidence/packet/narrative/custody surfaces
- Pilot — read-only Muse/Pilot reasoning and trace evidence surface

Registry tests also identify nine valid Workbench tab IDs:

- `summary`
- `forge`
- `atlas`
- `dais`
- `clerk`
- `treasury`
- `audit`
- `dossier`
- `pilot`

Program 3 has focused on the canonical assessor chain, not on promoting Clerk, Treasury, or Audit maturity.

## Suite Boundary Observations

Forge:

- owns valuation/cost/sales/income/reconciliation surfaces
- must not mutate Dais workflow, Atlas geometry, or Dossier records

Atlas:

- owns GIS/spatial evidence and overlays
- must not mutate valuation, workflow, or records

Dais:

- owns workflow/admin state such as appeals, deadlines, notices, hearings, and certification
- must not own Dossier packet/custody or Forge valuation math

Dossier:

- owns records, evidence, documents, narratives, packets, and custody
- does not initiate workflows

Pilot:

- owns tool invocation control and reasoning surface behavior
- must not directly write suite-owned data
- routes actions through TerraPilot tools and TerraTrace evidence

## Contract Evidence Observed

Relevant tests exist for:

- Workbench real hosting for Forge, Atlas, Dais, Dossier, and Pilot
- route integrity and nested Workbench hosting
- registry completeness and valid tab IDs
- Workbench source badges
- route/deep-link parity
- write-lane gate classification
- risk policy classification
- trace immutability
- parcel-context navigation
- property store production smoke behavior
- suite-specific tab tests for Summary, Forge, Atlas, Dais, Dossier, and Pilot
- Dossier-to-Dais and Dais routing contracts

The real-hosting gate verifies tabs are not placeholder modules and that primary tabs expose interactive surfaces. Secondary tabs Dossier and Pilot also render real surfaces.

## End-to-End Classification

| Segment | Classification | Evidence |
| --- | --- | --- |
| Route entry | implemented | `/property/:parcelId/*`, route host, route tests |
| Parcel load | implemented/partial | property store and DataProvider calls |
| Evidence unavailable blocker | implemented | explicit property evidence blocker UI |
| Context ribbon/rail/activity feed | implemented | Workbench shell |
| Summary tab | implemented | tab component/tests |
| Forge tab | implemented/partial | real hosted surface and valuation evidence WOs |
| Atlas tab | implemented/partial | real hosted surface and GIS evidence WOs |
| Dais tab | implemented/partial | real hosted workflow surface and evidence WOs |
| Dossier tab | implemented/partial | records/custody evidence WOs |
| Pilot tab | implemented/partial | read-only Muse tool surface and trace evidence WOs |
| Live production E2E proof | missing | no live backend/session run in this WO |

## Gaps And Risks

1. This WO did not run a live browser through a real authenticated parcel session.
2. Live backend data availability was not proven.
3. County isolation was observed as a required boundary but not proven end-to-end.
4. Clerk, Treasury, and Audit tabs are registered but not matured in this Program 3 evidence chain.
5. Suite write-lane enforcement is contract-covered but not proven through live multi-suite mutation attempts.
6. Pilot tool execution was not live-run against backend services in this WO.
7. No production readiness, release readiness, or deployment authorization is implied.

## Validation Run

Commands intended for this evidence packet:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

## Conclusion

The canonical assessor Workbench has a real parcel-centered shell and a coherent tab flow from route to suite surface to traceable actions. Program 3 can now move from per-surface truth to an operational packet that tells agents and operators how to use, validate, and extend the Workbench without violating suite boundaries.

Next recommended work order:

`WO-WORKBENCH-010 — Property Workbench Operational Packet`

STOP_TYPE: `END_TO_END_PARCEL_FLOW_EVIDENCE_CAPTURED`
