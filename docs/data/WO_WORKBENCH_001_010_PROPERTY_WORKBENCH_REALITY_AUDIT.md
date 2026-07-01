# WO-WORKBENCH-001..010 — Property Workbench Reality Audit (Evidence Packet)

**Program:** P4 — Property Workbench
**Date:** 2026-07-01
**Mode:** Read-only (R0). No frontend/backend code change, no runtime change, no deployment, no auth
change, no reserved-office activation, no fixture promotion.
**Sources:** Source map of `frontend/apps/os-shell/src` (main) + live anonymous probes of the deployed
demo (`app-terrafusion-benton-demo.azurewebsites.net`, `2026-07-01`).
**Authority Boundary:** SW-01/02/03/09/10 not crossed. One packet, one section per WO (001–010).

---

## WO-WORKBENCH-001 — Surface Reality Audit

**Component:** `PropertyWorkbench.tsx` — route `/property/:parcelId/*` ("Tier-0 OS Surface").
Layout: Breadcrumb → ContextRibbon → two-pane (WorkbenchRail left dock + main stage `Outlet`) →
collapsible Activity Feed.

**Canonical tabs (9, locked, `PropertyWorkbench.tsx:98-108`):**
`summary → forge → atlas → dais → clerk → treasury → audit → dossier → pilot`.

**Data posture:** `DataProvider` (`services/dataProvider.ts`) is **always `live`** — non-live
`VITE_DATA_MODE` (snapshot/fixtures) **throws** unless `VITE_ALLOW_NON_LIVE_MODE=1`. Surfaces render
backend truth or an explicit `unavailable` state via `WorkbenchSourceBadge` (live/partial/fallback/
unavailable). No fixture fallback except Atlas's deterministic SVG preview when GIS is down.

**Deployed reality (probed):**
- The workbench **SPA is not served** on the demo (SPA routes 401; established WO-P8-MGMT-002).
- **All** tab data endpoints are auth-gated **401** (see §002) except `/api/pilot/tools` → **200**
  honest stub `{"tools":[],"source":"stub","runtimeOnline":false}`.
- Net: on the current demo the workbench would require login; with a session, tabs would render live
  data or honest `unavailable`. **No fabricated data path exists.**

**Classification:** surfaces are **real components, live-wired, auth-gated at runtime, honesty-badged.**

---

## WO-WORKBENCH-002 — Route and Tab Truth Matrix

| Route | Component | Tab | Data source | Demo (anon) |
|-------|-----------|-----|-------------|-------------|
| `/property` | `PropertySearch` | — | `getDataProvider().getProperty` | 401 (`/api/properties`) |
| `/property/:id` (index) | `PropertySummary` | summary | propertyStore (assessments/appeals) | 401 |
| `/property/:id/forge` | `PropertyForge` | forge | `/api/cost-schedules/*`, `/api/depreciation-curves/*`, `invokeTool` | 401 |
| `/property/:id/atlas` | `PropertyAtlas` | atlas | `/api/atlas/gis/parcels/:id/boundary|layers` + SVG fallback | 401 |
| `/property/:id/dais` | `PropertyDais` | dais | governed `invokeTool` (cert/PILT/exemption/BOE) | 401 |
| `/property/:id/clerk` | `PropertyClerk` | clerk | governed `invokeTool` (recording/title) | 401 |
| `/property/:id/treasury` | `PropertyTreasury` | treasury | governed `invokeTool` (tax/payment) | 401 |
| `/property/:id/audit` | `PropertyAudit` | audit | governed `invokeTool` (roll/levy compliance) | 401 |
| `/property/:id/dossier` | `PropertyDossier` | dossier | `/api/dossier/parcels/:id/details` + `synthesize_evidence` | 401 |
| `/property/:id/pilot` | `PropertyPilot` | pilot | `listPilotTools()` (Muse read-only) | **200 stub** |
| `/workbench/sync-doctrine` | `SyncDoctrineConsole` | — | `/api/sync/doctrine/state` | **200 live** |
| `/workbench/sync-readiness` | `SyncReadinessConsole` | — | probe-on-click | (probe) |

**Truth:** every property tab is live-wired to a real endpoint/governed tool; **10 of 11 property
data endpoints are auth-gated** on the demo; the only anonymously-green property surface is the
Pilot stub. The one anonymously-live workbench surface overall is the Sync Doctrine Console.

---

## WO-WORKBENCH-003 — Parcel Detail Path Audit

Flow (verified in source): `PropertySearch` → `navigate('/property/:id')` → `PropertyWorkbench`
reads `parcelId` param → `propertyStore.selectParcel(id)` → `getDataProvider().getProperty(id)`
(live) → on success sets `activeParcel` + eagerly loads assessments/documents/appeals; on failure
sets `activeParcelError {status,message,path}`. Tab clicks route to `/property/:id/{tab}`; `Outlet`
renders the child. Parcel context persisted in `sessionStorage['tf:parcel-context']` +
recents (max 10). **Path is live-only, error-disclosing.** On the demo, `getProperty` → 401 → the
workbench renders its `workbench-property-evidence-blocker` error state (per productionSmoke test),
not fabricated data.

---

## WO-WORKBENCH-004 — Forge Tab Data Contract Audit

Sub-tabs (all mount hidden): overview, cost, sales, income, reconcile, sketch. Endpoints:
`/api/cost-schedules/{countyId}/{taxYear}`, `/api/depreciation-curves/{countyId}`; governed
`invokeTool` for sales/income/reconciliation; field observations to `fieldStoreV2`. **Honesty
contract** (`PropertyForge.honesty.contract.test.tsx`): no `invokeTool` on mount, no
result-panel-success before invocation, badges show fallback/unavailable at idle. Demo: cost/dep
endpoints auth-gated (401). **Contract intact; no auto-invocation; no hardcoded indicated value.**

---

## WO-WORKBENCH-005 — Atlas / Map Tab Data Contract Audit

Endpoints: `/api/atlas/gis/parcels/:id/boundary`, `/api/atlas/gis/parcels/:id/layers` via
`useParcelBoundary()`/`useParcelLayers()`; Mapbox GL render; **deterministic SVG preview fallback**
when GIS unavailable (the one sanctioned non-live fallback, clearly a preview not real geometry).
Layers: boundary/zoning/flood/aerial. **Cross-reference to GEOM-001:** canonical geometry covers
79,199/84,418 parcels (93.82%); Atlas must render `unavailable`/SVG-preview for the 6.18% without
geometry. Demo: `/api/atlas/*` 401. **Contract intact; fallback is a labeled preview, not fake data.**

---

## WO-WORKBENCH-006 — Dais Tab Contract Audit

Governed tools only (`invokeTool`), risk-tiered: read-only (`check_cert_status`,
`summarize_levy_rate_components`, `explain_senior_exemption_impact`), write_low (drafting, task
assign/escalate, exemption renewal), write_high (`file_appeal`→`schedule_boe_hearing`,
`sign_off_certification_step`, `assemble_boe_packet`). Sub-panels: AppealDeadline/Hearing/Notice/
Certification. **No results on mount** (honesty contract). Write-lane gating enforced by
`workbench.writeLaneGates.test.ts`. Demo: `/api/dais/*` 401. **Contract intact.**

---

## WO-WORKBENCH-007 — Dossier / Evidence Tab Contract Audit

Endpoint `/api/dossier/parcels/:id/details` via `useDossierDetails()`; governed
`synthesize_evidence` (AI narrative), `generate_dossier_packet_narrative` (write_low),
`finalize_evidence_packet` (write_high), `handoff_packet_to_appeals` (write_low). Components:
ParcelEvidencePacket, PacketNarrativeEditor, PacketFinalizationPanel, PacketAppealHandoffPanel,
EvidenceSnapshotPanel. **Disclosure:** AI synthesis narrative explicitly labeled "not a substitute
for source records." **Live-only, no fixture fallback** (0 items when unavailable). Demo:
`/api/dossier/*` 401. **Contract intact; AI output disclosed.**

---

## WO-WORKBENCH-008 — Pilot Tool Assistant Contract Audit

`PropertyPilot` = governed tool-invocation shell: `listPilotTools()` →
`filterMuseReadOnlyTools()` (R3 slice exposes **read-only reasoning tools only**, no write tools),
`useToolInvocation()` (preflight → confirm → execute), `usePilotTraceList()`. Trace immutability
enforced (`workbench.traceImmutability.test.ts`). **Deployed reality (the notable finding):**
`/api/pilot/tools` → **200** but `{"tools":[],"source":"stub","runtimeOnline":false}` — the Pilot
runtime (port 4317) is **not deployed**; the backend returns an **honest empty stub** disclosing
`source:"stub"` and `runtimeOnline:false`. `/api/pilot/invoke` and `/api/pilot/metrics/summary` →
401. **Assistant discloses its offline/stub state rather than faking tools** — honesty holds.

---

## WO-WORKBENCH-009 — Reserved Office Gating Status Audit

**Finding: there is no "reserved-office" gating in the Property Workbench.** The source map found no
reserved-office routing or tab gate. What exists instead:
- **Role-based tab visibility** (`useWorkbenchRoles`, `config/workbenchRoles.ts`,
  `getVisibleTabs(roles,{showAll})`) — **presentation only**. Default visibility filters tabs by
  role, but a user "show all tabs" override is always available (localStorage
  `tf_workbench_show_all_tabs`). **Tab order never mutates** (constitutional).
- **Auth gating** (`authPolicy.ts`): `isDevPreviewMode()` (VITE_USE_MOCK_DATA / VITE_DEV_PREVIEW_
  BYPASS_AUTH) vs `shouldForceLoginRedirect()`.
- **Feature flags** (`config/features.ts`): all default **false** except AXIOM_FS/DASHBOARD/
  SIMULATION_ENGINE; `USE_MOCK_DATA` default false.

**Conclusion:** "reserved office" is not an implemented workbench concept. If it is expected canon, it
is **unimplemented** (a doc-vs-code gap to resolve in a dedicated WO). No reserved-office activation
attempted (would be out of scope regardless). Tabs clerk/treasury/audit are REGISTRY-tier (exist,
inventoried) per the real-hosting gate — present but lower-maturity than the Forge/Atlas/Dais primary set.

---

## WO-WORKBENCH-010 — End-to-End Parcel Flow Evidence Packet

**Synthesis of the flow, with runtime truth:**
1. Search (`/property`) → 2. select → `/property/:id` → 3. `selectParcel` → live `getProperty` →
4. tabs render live data or `unavailable`. On the **deployed demo** every step past search hits an
auth wall (401), so the E2E flow is **not anonymously exercisable end-to-end**; with a session it is.

**Honesty verdict (strong):** the workbench is architecturally honesty-first — live-only DataProvider
(fail-fast on non-live), `WorkbenchSourceBadge` on every surface, no results-on-mount, AI output
labeled, write-lane/trace-immutability/risk-policy enforced by a 50+ test contract suite
(honesty contracts per tab, `workbenchRealHosting.gate`, entrypoint parity/registry completeness).

**Gaps for later (non-blocking, each a future WO):**
- G1 (SW-01): workbench SPA not deployed to the demo → E2E only runnable locally (see WO-P8-MGMT-004 packet).
- G2 (SW-10): all tab endpoints auth-gated → E2E requires a real auth/session decision for the demo.
- G3: Pilot runtime not deployed → assistant is an honest stub on the demo.
- G4: "reserved office" canon unimplemented (§009) → reconcile doc vs code.
- G5: Atlas must disclose `unavailable` for the 6.18% of parcels without geometry (GEOM-001).

---

## Stop Walls Respected

| Wall | Status |
|------|--------|
| SW-01 deployment/reachability | not crossed (read-only) |
| SW-02 data mutation | not crossed |
| SW-03 secrets | not crossed (no credentials used) |
| SW-09 runtime behavior | not crossed (no code) |
| SW-10 auth/security policy | not crossed |
| Reserved-office activation | not attempted |

---

## Evidence Log

- Source: `PropertyWorkbench.tsx:98-108,156-642`, `Router.tsx:213-312`, per-tab components
  (`PropertySummary/Forge/Atlas/Dais/Clerk/Treasury/Audit/Dossier/Pilot.tsx`),
  `services/dataProvider.ts`, `config/features.ts`, `authPolicy.ts`, `config/workbenchRoles.ts`,
  `stores/propertyStore.ts`, `context/parcelContext.ts`
- Tests: `__tests__/workbench/*` (honesty contracts, `workbenchRealHosting.gate`, entrypoint parity/
  registry completeness, write-lane gates, trace immutability, risk policy — 50+)
- Deployed probes (anon): 10 property endpoints 401; `/api/pilot/tools` 200 stub; `/api/sync/doctrine/state` 200 live
- Cross-refs: WO-DATA-BENTON-GEOM-001 (geometry coverage), WO-P8-MGMT-002/004 (SPA reachability)

---

**WO-WORKBENCH-001..010: COMPLETE (read-only audit).** R0 queue exhausted. Remaining property-workbench
work (deploy SPA, wire auth/session, implement/retire reserved-office, deploy Pilot runtime) crosses
SW-01/SW-09/SW-10 → requires operator authorization.
