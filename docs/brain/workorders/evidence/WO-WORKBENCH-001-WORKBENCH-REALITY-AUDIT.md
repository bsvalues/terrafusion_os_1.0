# WO-WORKBENCH-001 - Workbench Reality Audit

**Date:** 2026-07-01
**Goal:** `GOAL-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE`
**Loop:** `LOOP-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE`
**Mode:** Discovery / evidence only
**Branch:** `wo/workbench-reality-audit`
**Base:** `origin/main`

## Purpose

Establish the current truth of the Property Workbench before implementation.
This audit does not change runtime code, routing, tabs, backend endpoints,
workflow behavior, county data, PACS/SQL access, or deployment behavior.

Write-lane authorization for this packet comes from the owner-authorized
Program 3 Workbench `/goal` + `/loop`, which explicitly permits docs/evidence
artifacts under `docs/brain/workorders/evidence/**` while blocking runtime,
CI, schema, deployment, secrets, county data, PACS, and SQL changes.

The Workbench is a Tier-0 OS surface. Parcel-scoped assessor work must route
through the Workbench, not standalone suite windows.

## Canon Read

Primary canon and governance sources inspected:

- `brain/packs/shell/README.md`
- `brain/packs/forge/README.md`
- `brain/packs/atlas/README.md`
- `brain/packs/dais/README.md`
- `brain/packs/dossier/README.md`
- `frontend/apps/os-shell/AGENTS.md`
- `docs/brain/workorders/programs/property-workbench.md`
- `docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md`
- `docs/architecture/specs/terrafusion/adr/ADR-0001_PROPERTY_WORKBENCH_TIER0.md`
- `scripts/spec-gates/workbench-compliance.mjs`

## Current Surface Inventory

| Surface | Current file(s) | Current reality |
|---------|-----------------|-----------------|
| Workbench host | `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx` | Implemented. Hosts Context Ribbon, Workbench Rail, routed tab outlet, and Activity Feed. |
| Canonical route root | `frontend/apps/os-shell/src/Router.tsx` | Implemented as `/property/:parcelId` with nested tab routes. |
| Search entrypoint | `frontend/apps/os-shell/src/pages/PropertySearch.tsx` | Present as `/property`; routes to parcel Workbench after selection. |
| Shared contract | `frontend/apps/os-shell/src/contracts/workbench.ts` | Present, but current tab slug contract does not exactly match rendered routes. |
| Property store | `frontend/apps/os-shell/src/stores/propertyStore.ts` | Present. `selectParcel()` loads parcel evidence first, then related data in parallel. |
| Context ribbon | `frontend/apps/os-shell/src/components/workbench/ContextRibbon.tsx` | Present. Uses badge and quick-action providers. |
| Workbench rail | `frontend/apps/os-shell/src/components/workbench/WorkbenchRail.tsx` | Present. Uses filtered tabs from role visibility. |
| Activity feed | `frontend/apps/os-shell/src/components/workbench/ActivityFeed.tsx` | Present. Projection surface for parcel activity. |
| Workbench tests | `frontend/apps/os-shell/src/__tests__/workbench/**` | Broad coverage exists for tabs, honesty contracts, routing, risk, write lanes, trace immutability, production smoke, and entrypoint parity. |

## Route Truth

Routes currently registered in `frontend/apps/os-shell/src/Router.tsx`:

| Route | Component | Canon status |
|-------|-----------|--------------|
| `/property` | `PropertySearch` | Supported search/browse entrypoint. |
| `/property/:parcelId` | `PropertyWorkbench` + `PropertySummary` index | Canonical Summary route. |
| `/property/:parcelId/forge` | `PropertyForge` | Canonical Forge route. |
| `/property/:parcelId/atlas` | `PropertyAtlas` | Canonical Atlas route. |
| `/property/:parcelId/dais` | `PropertyDais` | Canonical Dais route. |
| `/property/:parcelId/dossier` | `PropertyDossier` | Canonical Dossier route. |
| `/property/:parcelId/pilot` | `PropertyPilot` | Canonical Pilot route. |
| `/property/:parcelId/clerk` | `PropertyClerk` | Implemented R3 extension route, outside the v3.1 six-tab canon. |
| `/property/:parcelId/treasury` | `PropertyTreasury` | Implemented R3 extension route, outside the v3.1 six-tab canon. |
| `/property/:parcelId/audit` | `PropertyAudit` | Implemented R3 extension route, outside the v3.1 six-tab canon. |

Legacy module routes under `modules/property-workbench` redirect to `/`.

## Tab Truth

Canonical v3.1 order:

`Summary -> Forge -> Atlas -> Dais -> Dossier -> Pilot`

Current rendered `WORKBENCH_TABS` order in `PropertyWorkbench.tsx`:

`Summary -> Forge -> Atlas -> Dais -> Clerk -> Treasury -> Audit -> Dossier -> Pilot`

Current tab components under `frontend/apps/os-shell/src/pages/workbench/tabs/`:

| Tab | Component | Maturity classification |
|-----|-----------|-------------------------|
| Summary | `PropertySummary.tsx` | Implemented. Reads active parcel, assessments, appeals, and source disclosure from the property store. |
| Forge | `PropertyForge.tsx` | Implemented. Hosts Forge sub-tabs and valuation tool surfaces. Needs dedicated Forge surface truth WO before calling it complete. |
| Atlas | `PropertyAtlas.tsx` | Implemented. Provides boundary/layer previews, GIS disclosures, and governed tool invocations. Full geometry remains reserved for Atlas suite. |
| Dais | `PropertyDais.tsx` | Implemented. Large workflow surface with read/write tool invocations and Dais panels. Needs dedicated Dais surface truth WO before operational promotion. |
| Dossier | `PropertyDossier.tsx` | Implemented. Evidence, casefile, note, packet, narrative, finalization, and appeal-handoff surfaces. Needs dedicated Dossier surface truth WO. |
| Pilot | `PropertyPilot.tsx` | Implemented. Loads Muse/read-only tools from Pilot manifest and renders execution/evidence surfaces. Needs dedicated Pilot integration truth WO. |
| Clerk | `PropertyClerk.tsx` | Implemented R3 extension tab. Outside this Program 3 requested chain unless separately authorized. |
| Treasury | `PropertyTreasury.tsx` | Implemented R3 extension tab. Outside this Program 3 requested chain unless separately authorized. |
| Audit | `PropertyAudit.tsx` | Implemented R3 extension tab. Outside this Program 3 requested chain unless separately authorized. |

## Data Source Truth

The Workbench does not directly own county data. Current data flow observed:

1. `/property/:parcelId` route loads `PropertyWorkbench`.
2. `PropertyWorkbench` calls `usePropertyStore().selectParcel(parcelId)` on mount.
3. `selectParcel()` calls `getDataProvider().getParcel(parcelId)` with a 20 second evidence timeout.
4. Related evidence loads in parallel after the parcel shell is usable:
   - assessments
   - documents
   - appeals
   - tax statements
   - recording history
   - audit trail
   - recent operations
5. If the parcel is unavailable or auth fails, the Workbench renders an evidence blocker instead of fake data.

This is the right posture for evidence-first Workbench operation, but the exact live/fallback provider
mode and API endpoint coverage require WO-WORKBENCH-002 routing/deep-link truth and WO-WORKBENCH-009
end-to-end parcel flow evidence.

## Tests / Gates Found

Relevant Workbench tests exist under `frontend/apps/os-shell/src/__tests__/workbench/`:

- `PropertyWorkbench.productionSmoke.test.tsx`
- `workbench.contractGates.test.ts`
- `workbench.writeLaneGates.test.ts`
- `workbench.traceImmutability.test.ts`
- `workbench.riskPolicy.test.ts`
- `workbenchEntrypoints.parity.test.ts`
- `workbenchEntrypoints.registryCompleteness.test.ts`
- tab-level tests for Summary, Forge, Atlas, Dais, Dossier, Pilot, and R3 extension tabs
- honesty contract tests for Summary, Forge, Atlas, Dais, and Reconciliation surfaces

Spec gate:

- `node scripts/spec-gates/workbench-compliance.mjs`

Observed result:

```text
Workbench Compliance PASSED
No forbidden routes or non-canonical tabs found
```

## Gaps / Risks

| Gap | Evidence | Risk | Recommended WO |
|-----|----------|------|----------------|
| Canon vs implementation tab set drift | v3.1 canon lists six tabs; current runtime includes Clerk, Treasury, Audit before Dossier/Pilot. | Governance drift if R3 extension tabs are considered promoted without explicit canon status. | WO-WORKBENCH-003 maturity classification should separate v3.1 canon tabs from R3 extension tabs. |
| `WorkbenchTabSlug` omits `pilot` while runtime tabs/routes include Pilot | `contracts/workbench.ts` includes `summary|forge|atlas|dais|clerk|treasury|audit|dossier`; `PropertyWorkbench.tsx` uses `pilot`. | Contract drift; type/build behavior should be verified before touching runtime. | WO-WORKBENCH-002 routing/deep-link truth. |
| Route compliance gate passes despite extension tabs | `workbench-compliance.mjs` passed while Clerk/Treasury/Audit are registered. | Gate may not enforce the six-tab v3.1 order; may be intentional R3 extension tolerance or stale gate coverage. | WO-WORKBENCH-002 and WO-WORKBENCH-003. |
| Large Dais and Dossier tabs include write-capable tool surfaces | PropertyDais and PropertyDossier invoke write_low/write_high governed tools. | Requires careful truth classification; no write behavior should be changed in audit phase. | WO-WORKBENCH-006 and WO-WORKBENCH-007. |
| Workbench program file is older than requested Program 3 chain | `docs/brain/workorders/programs/property-workbench.md` uses older WO titles and stops at WO-WORKBENCH-010. | Program register drift; do not silently rewrite program canon in audit. | Future WOE/program registry reconciliation, or include in WO-WORKBENCH-011 rollup. |

## Proven

- Property Workbench is implemented as a Tier-0 OS shell route under `/property/:parcelId`.
- Canonical six routes exist: Summary, Forge, Atlas, Dais, Dossier, Pilot.
- The route also includes R3 extension tabs: Clerk, Treasury, Audit.
- Workbench host uses a Context Ribbon, Workbench Rail, routed tab outlet, and Activity Feed.
- Workbench uses `propertyStore` and `getDataProvider()` rather than hardcoded parcel data in the host.
- Workbench has an explicit evidence-blocker state when parcel evidence cannot load.
- Workbench compliance spec gate passes on current `origin/main`.

## Not Proven

- End-to-end search -> parcel -> each tab runtime flow is not proven by this audit.
- Live backend endpoint coverage per tab is not proven by this audit.
- Forge, Atlas, Dais, Dossier, and Pilot surfaces are not promoted as complete by this audit.
- R3 extension tabs are not approved for Program 3 implementation work by this audit.
- Production readiness, county deployment, PACS, SQL, or protected data access are not proven or authorized.

## Validation Run

```text
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

## Validation Result

- `workbench-compliance`: PASS
- `wo-query`: PASS
- `git diff --check`: PASS

## Next Recommended Work Orders

1. `WO-WORKBENCH-002 - Routing / Deep-Link Truth`
   - Verify route table, redirects, parcel deep links, role-filtered tab visibility, and contract type drift.
2. `WO-WORKBENCH-003 - Tab + Tool Maturity Classification`
   - Classify canonical tabs versus R3 extension tabs and mark implemented/partial/honest-empty/blocked.
3. `WO-WORKBENCH-004 - Forge Surface Truth`
   - Validate Forge tab source truth and runtime/tool maturity without changing valuation behavior.

## Done / Not Done

Done:

- Current Workbench route/tab/source/test/gate truth captured from `origin/main`.
- No runtime code changed.
- No route behavior changed.
- No suite write-lane behavior changed.

Not done:

- No Workbench implementation changes.
- No endpoint additions.
- No county data/PACS/SQL access.
- No claim that Property Workbench is complete.
