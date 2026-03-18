# TerraFusion OS — Capability Placement Map

> **Document C** · Phase 0 Architecture · v2.1
> **Status**: CANONICAL — maps every capability into placement buckets, resolves surface overlap
> **Locked decisions respected**: TF-050, TF-052, ADR-001, ADR-002, ADR-003
> **Last updated**: 2026-03-14
> **v2.1**: Replaced stale ADR-TBD references with accepted ADR-001/002/003. Added Dais-vs-TerraCanon boundary.

---

## Purpose

TerraFusion OS currently has 103+ registered surfaces with massive functional overlap. This document assigns every capability to exactly one placement bucket, declares the disposition of every legacy/alpha module, resolves known conflicts, and defines the action plan for Phase 1+.

---

## Placement Buckets

Every capability falls into exactly one of these four buckets:

| Bucket | ID | Description | Example |
|--------|----|-------------|---------|
| **Parcel-Native Edit** | `PNE` | Directly edits parcel data within a Workbench tab. Parcel-scoped. Always inside Workbench. | Cost model on a single parcel |
| **Parcel-Scoped Deep Tool** | `PSDT` | Complex parcel interaction requiring dedicated UI depth, but still parcel-bound. Lives inside a Workbench sub-tab. | Sales comparison with comp grid + map, income approach with lease-by-lease input |
| **Cross-Parcel Operational** | `CPO` | Operates across multiple parcels. Cannot live inside Workbench (which is parcel-scoped). Lives in suite standalone home or OS workspace. | Batch model runs, ratio studies, regression model building, neighborhood delineation |
| **County Management** | `CM` | County-wide administration, policy, configuration. Lives in suite standalone home or OS management surface. | Levy rate modeling, certification workflow, data sync admin |

---

## Capability Assignments by Domain

### Forge Domain (Valuation)

| Capability | Bucket | Current Location | Target Location | Notes |
|-----------|--------|-----------------|----------------|-------|
| Cost model review (single parcel) | PNE | PropertyForge.tsx (inline) | Forge > Cost sub-tab | Extract from monolith |
| Cost model execution (`run_valuation_model`) | PNE | PropertyForge.tsx (inline) | Forge > Cost sub-tab | write_high tool, stays parcel-bound |
| RCNLD calculation display | PNE | PropertyForge.tsx (inline) | Forge > Cost sub-tab | Building-level RCNLD breakdown |
| Value explanation (`explain_model_results`) | PNE | PropertyForge.tsx (inline) | Forge > Overview sub-tab | AI explanation of current value |
| Value change analysis (`explain_value_change`) | PNE | PropertyForge.tsx (inline) | Forge > Overview sub-tab | YoY comparison |
| Value history (`compare_assessed_value_history`) | PNE | PropertyForge.tsx (inline) | Forge > Overview sub-tab | Multi-year trend |
| Model inputs breakdown (`explain_model_inputs`) | PNE | PropertyForge.tsx (inline) | Forge > Cost sub-tab | Factor breakdown with PII flags |
| Comp selection + adjustments | PSDT | ComparableSalesPanel.tsx | Forge > Sales sub-tab | Full comp grid + map + paired adjustments |
| Comp rationale (`summarize_sales_comps_rationale`) | PSDT | PropertyForge.tsx (inline) | Forge > Sales sub-tab | AI comp rationale |
| Income capitalization | PSDT | IncomeValuationPanel.tsx | Forge > Income sub-tab | Direct cap, GRM, lease-by-lease |
| Income valuation (`run_income_valuation`) | PSDT | PropertyForge.tsx (inline) | Forge > Income sub-tab | NOI / cap rate execution |
| Three-approach reconciliation | PNE | Not yet built | Forge > Overview sub-tab | Weight sliders, narrative, sign-off |
| Batch cost model runs | CPO | Not yet built | TerraForge standalone | Mass appraisal production runs |
| Regression model building (MRA) | CPO | Not yet built (regression-studio placeholder) | TerraForge standalone > Regression Studio | ADR-002 accepted (2026-03-14): TerraForge module |
| Ratio study execution (COD/PRD/PRB) | CPO | Not yet built (statistics-studio placeholder) | TerraForge standalone > Statistics Studio | ADR-001 accepted (2026-03-14): TerraForge module |
| Model comparison (side-by-side) | CPO | Not yet built | TerraForge standalone | Compare model versions |
| Outlier detection / review | CPO | Not yet built | TerraForge standalone | Flag parcels outside tolerance |
| Coefficient application preview | CPO | Not yet built | TerraForge standalone | Preview model impact before apply |
| VEI (Vertical Equality Index) | CPO | Not yet built (vei placeholder) | TerraForge standalone > Statistics Studio | Equity analysis |
| Market rent survey management | CPO | Not yet built | TerraForge standalone | Commercial rent database |
| Cap rate database | CPO | Not yet built | TerraForge standalone | Cap rate survey tracking |

### Atlas Domain (GIS / Spatial)

| Capability | Bucket | Current Location | Target Location | Notes |
|-----------|--------|-----------------|----------------|-------|
| Parcel boundary display | PNE | Atlas tab | Atlas tab (Workbench) | Parcel-scoped map view |
| Neighborhood context | PNE | Atlas tab | Atlas tab (Workbench) | Show parcel in neighborhood context |
| Aerial/satellite imagery | PNE | Atlas tab | Atlas tab (Workbench) | Photo overlay |
| Comp location map | PSDT | ComparableSalesPanel.tsx | Forge > Sales sub-tab (embedded) | Map of comp locations — cross-referenced from Forge |
| Neighborhood delineation | CPO | Not yet built | TerraAtlas standalone | Draw/edit neighborhood boundaries |
| Spatial autocorrelation analysis | CPO | Not yet built | TerraAtlas standalone | Moran's I, LISA |
| Model residual mapping | CPO | Not yet built | TerraAtlas standalone | Spatial pattern analysis for mass appraisal |
| Flood zone management | CPO | Not yet built | TerraAtlas standalone | FEMA zone editing |
| Land use / zoning layer editing | CPO | Not yet built | TerraAtlas standalone | Jurisdiction-level spatial editing |
| GAMA (Geographic Area Market Analysis) | CPO | terra-gama placeholder | TerraAtlas standalone | Market area spatial analysis |

### Dais Domain (Admin / Workflow)

| Capability | Bucket | Current Location | Target Location | Notes |
|-----------|--------|-----------------|----------------|-------|
| Parcel workflow status | PNE | Dais tab | Dais tab (Workbench) | Current queue/assignment/SLA |
| Exemption display (parcel) | PNE | Dais tab | Dais tab (Workbench) | Active exemptions for this parcel |
| Permit display (parcel) | PNE | Dais tab | Dais tab (Workbench) | Active permits for this parcel |
| Appeal status (parcel) | PNE | Dais tab | Dais tab (Workbench) | Current appeal status |
| Management Dashboard (assessor ops) | CM | Not yet built | TerraDais standalone > Management Dashboard | ADR-003 accepted. Work queues, assignment, certification, progress. **Boundary**: "how is our assessment work progressing?" → Dais. "Are our systems healthy?" → TerraCanon/OS Admin (ADR-TBD-5). |
| Queue management (cross-parcel) | CPO | Not yet built | TerraDais standalone > TerraQueue | Work queue assignment, SLA tracking |
| Levy rate modeling | CM | terra-levy module | TerraDais standalone > TerraLevy | County-wide levy calculations |
| PILT forecasting | CM | terra-pilt placeholder | TerraDais standalone > TerraPILT | Federal PILT management |
| Permit intake (cross-parcel) | CPO | terra-permit placeholder | TerraDais standalone > TerraPermit | Batch permit processing |
| Exemption management (cross-parcel) | CM | Not yet built | TerraDais standalone > TerraExempt | Renewal tracking, batch eligibility |
| Certification workflow | CM | Not yet built | TerraDais standalone > TerraCert | Roll certification checklists |
| Notice generation (batch) | CM | Not yet built | TerraDais standalone > TerraNotice | Batch notice templates, mail queue |
| Appeal management (cross-parcel) | CPO | Not yet built | TerraDais standalone > TerraAppeal | BOE calendar, case tracking |

### Dossier Domain (Evidence / Records)

| Capability | Bucket | Current Location | Target Location | Notes |
|-----------|--------|-----------------|----------------|-------|
| Notes (parcel) | PNE | Dossier tab | Dossier tab (Workbench) | Appraiser notes on parcel |
| Photo viewer (parcel) | PNE | Dossier tab | Dossier tab (Workbench) | Parcel photos |
| Evidence packet (parcel) | PSDT | Not yet built | Dossier tab (Workbench) | BOE defense packet assembly |
| Document search (cross-parcel) | CPO | Not yet built | TerraDossier standalone | Full document search across parcels |
| Batch packet generation | CPO | Not yet built | TerraDossier standalone | Generate defense packets for hearing calendar |

### OS-Level Capabilities

| Capability | Bucket | Current Location | Target Location | Notes |
|-----------|--------|-----------------|----------------|-------|
| Property search | OS | Shell home | Shell home + Cmd+K | Parcel lookup, opens Workbench |
| TerraPilot console | OS | Pilot tab | Pilot tab (Workbench) + standalone `/pilot` | Tool execution log, AI conversation |
| TerraTrace viewer | OS | Not yet built | `/trace` | Audit trail viewer |
| TerraCanon IDE | OS | Not yet built | `/canon` | OS self-development environment |
| Desktop Shell | OS | os-shell | os-shell | Window management, dock, launchpad |
| Session management | OS | os-shell | os-shell | Auth, county context, user prefs |

### Management / Admin Capabilities

| Capability | Bucket | Current Location | Target Location | Notes |
|-----------|--------|-----------------|----------------|-------|
| PACS data bridge | CM | pacs-bridge placeholder | OS Admin > PACS Bridge | Harris PACS import/export |
| Data sync ETL | CM | terra-sync placeholder | OS Admin > TerraSync | County data synchronization |
| Data mining / enrichment | CM | terra-miner placeholder | OS Admin > TerraMiner | External data aggregation |
| Legislative tracking | CM | legislative-pulse placeholder | OS Admin > Legislative Pulse | WA state bill monitoring |
| Property data viewer | PNE | terra-primeview module | **RETIRE** → Workbench Summary tab | Absorbed by Property Workbench |
| TerraFlow (workflow engine) | CM | terra-flow module | TerraDais backend service | Workflow engine is a service, not a UI surface |
| PropertyTax AI | OS | property-tax-ai placeholder | **RETIRE** → TerraPilot | Absorbed into TerraPilot tool suite |

---

## Module Registry Disposition

Every module in `generatedModules.ts` gets exactly one of these dispositions:

| Disposition | Meaning |
|-------------|---------|
| `canonical-ui` | Active UI surface. Keep in registry. Launchpad visible. |
| `canonical-service` | Backend service. Keep in registry. Not launchpad-visible. |
| `future-module` | Planned but not built. Keep in registry with `runnable: false`. Not pinned. |
| `retire/archive` | Absorbed by canonical surface or dead. Remove from launchpad. Archive if code exists. |

### Module Dispositions

| Module ID | Current Status | Disposition | Rationale |
|-----------|---------------|-------------|-----------|
| `os-shell` | active | `canonical-ui` | The OS Shell — primary surface |
| `gis-pro` | active | `canonical-ui` | TerraAtlas standalone. Rename `displayName` to "TerraAtlas" |
| `terra-dossier` | active | `canonical-ui` | TerraDossier standalone |
| `terraforge` | active, autostart:false | `canonical-ui` | TerraForge standalone |
| `costforge-ai` | legacy | `retire/archive` | Absorbed into Forge Cost sub-tab + TerraForge standalone |
| `terra-flow` | beta | `canonical-service` | Workflow engine → TerraDais backend. Remove from launchpad. |
| `terra-gama` | alpha, not runnable | `future-module` | Geographic market analysis → TerraAtlas module. Unpin. |
| `terra-levy` | beta | `canonical-ui` | TerraDais > TerraLevy module. Keep. |
| `terra-permit` | alpha, not runnable | `future-module` | TerraDais > TerraPermit module. Unpin. |
| `terra-pilt` | alpha, not runnable | `future-module` | TerraDais > TerraPILT module. Unpin. |
| `terra-primeview` | active | `retire/archive` | Absorbed by Property Workbench Summary tab |
| `income-valuation` | alpha, not runnable | `retire/archive` | Absorbed into Forge Income sub-tab |
| `regression-studio` | alpha, not runnable | `future-module` | TerraForge standalone module. ADR-002 accepted. Unpin. |
| `statistics-studio` | alpha, not runnable | `future-module` | TerraForge standalone module. ADR-001 accepted. Unpin. |
| `comparable-sales` | beta | `retire/archive` | Absorbed into Forge Sales sub-tab (wraps ComparableSalesPanel) |
| `vei` | alpha, not runnable | `future-module` | TerraForge > Statistics module. Unpin. |
| `property-tax-ai` | alpha, not runnable | `retire/archive` | Absorbed into TerraPilot |
| `pacs-bridge` | alpha, not runnable | `future-module` | OS Admin surface. Unpin. |
| `terra-sync` | alpha, not runnable | `future-module` | OS Admin surface. Unpin. |
| `terra-miner` | alpha, not runnable | `future-module` | OS Admin surface. Unpin. |
| `legislative-pulse` | alpha, not runnable | `future-module` | OS Admin surface. Unpin. |
| `webhub` | legacy, not runnable | `retire/archive` | Legacy county portal. No canonical replacement needed in OS. |

---

## Conflict Resolutions

### Conflict 1: Where do ratio studies live?

- **Contender A**: Forge standalone module (Statistics Studio inside TerraForge)
- **Contender B**: Separate OS workspace at `/statistics`
- **Resolution**: **Forge module** (TerraForge standalone > Statistics Studio). Ratio studies are valuation validation — they belong in the Forge operational universe. **ADR-001 accepted 2026-03-14.**
- **Forbidden**: Ratio studies inside Workbench (they are cross-parcel by definition).

### Conflict 2: Where does regression model building live?

- **Contender A**: Forge standalone module (Regression Studio inside TerraForge)
- **Contender B**: Separate OS workspace at `/regression`
- **Resolution**: **Forge module** (TerraForge standalone > Regression Studio). Same rationale — model building is core to Forge's "build value" mission. **ADR-002 accepted 2026-03-14.**
- **Forbidden**: Regression inside Workbench (cross-parcel, multi-variable model building).

### Conflict 3: Income approach — Workbench or standalone?

- **Constitutional answer**: Parcel-scoped income analysis stays in Workbench (Forge > Income sub-tab). Market rent survey management and cap rate database are cross-parcel → TerraForge standalone.
- **Implementation**: IncomeValuationPanel.tsx stays in Workbench, wrapped by Forge > Income sub-tab. Market data management surfaces are separate TerraForge standalone pages.

### Conflict 4: Comp map — Atlas or Forge?

- **Constitutional answer**: Comp selection is a Forge write-lane operation. The map is a visualization aid for comp selection, not a GIS editing operation.
- **Resolution**: Comp map lives inside Forge > Sales sub-tab (embedded MapView, read-only from Atlas). Atlas write-lane is not invoked.

### Conflict 5: TerraPrime viewer vs. Workbench Summary

- **Resolution**: TerraPrime is absorbed. Property Workbench Summary tab is the canonical property viewer. The `terra-primeview` module gets `retire/archive` disposition. Any unique TerraPrime features not in Summary get migrated there.

---

## Phase 1 Action Items (Forge Sub-tab Restructure)

These actions are authorized by this document **after Phase 0D (Constitutional Reconciliation Note) is accepted**:

### Create

1. `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeOverview.tsx`
   - Value explanation, value change, value history, three-approach reconciliation
   - Extracted from PropertyForge.tsx lines ~500-700 (explanation/history sections)

2. `frontend/apps/os-shell/src/pages/workbench/tabs/forge/CostApproach.tsx`
   - Cost model review, RCNLD display, model inputs, run valuation
   - Extracted from PropertyForge.tsx lines ~700-900 (cost/model sections)

3. `frontend/apps/os-shell/src/pages/workbench/tabs/forge/SalesComparison.tsx`
   - Wraps existing ComparableSalesPanel.tsx
   - Adds comp rationale tool invocation from PropertyForge.tsx

4. `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx`
   - Wraps existing IncomeValuationPanel.tsx
   - Adds income valuation tool invocation from PropertyForge.tsx

### Modify

5. `PropertyForge.tsx` → Becomes ~200-line sub-tab switcher with CSS-hidden panel mounting (no unmount/remount — preserves state)

### Do NOT Create

- No new routes. Sub-tab switching is internal state, not URL-routed.
- No new services. Existing `invokeTool` from `pilotApi.ts` is the only API call pattern.
- No new stores. Existing `usePropertyStore` and `useWorkbenchTab` are sufficient.

---

## Consolidation Surface Count

| Category | Before | After Phase 3 |
|----------|--------|---------------|
| Active launchpad modules | 17 | 7 (`canonical-ui` only) |
| Placeholder modules (`/placeholder` route) | 9 | 0 (all reclassified) |
| Forge-related surfaces | 12+ | 2 (Workbench Forge tab + TerraForge standalone) |
| Valuation components doing similar things | 12+ | 4 (Overview, Cost, Sales, Income sub-tabs) |
| Dead/absorbed modules in registry | 0 | 6 (marked `retire/archive`) |
| Polyrepo inventory (total classified) | 16 | 40 (canonical: 1, feeder: 16, showcase: 3, predecessor: 20, unknown: 1) |

---

## Repo Classification

Classification scheme for repositories under `bsvalues/`:

| Label | Meaning |
|-------|---------|
| `canonical` | Active, constitutional, lives in terrafusion_os_1.0 |
| `feeder` | Contains capabilities to absorb into canonical |
| `county-specific` | County deployment config/data |
| `showcase` | Demo/portfolio, no production capabilities |
| `predecessor` | Earlier generation, archive candidate |
| `unknown` | Needs manual inspection |

### Repos by Classification

**Canonical**:
- `terrafusion_os_1.0` — The monorepo. All production surfaces, backend services, and governance documents.

**Feeder** (contain capabilities to be absorbed):
- `BSIncomeValuation` — Income approach (React/Express/Drizzle). Feeds Forge > Income sub-tab.
- `GeospatialAnalyzerBS` — Comparable sales + spatial analysis. Feeds Forge > Sales sub-tab + TerraAtlas.
- `PropertyTaxAI` — LangChain assessment assistant. Feeds TerraPilot tool suite.
- `BCBSGISPRO` — GIS/parcel mapping. Feeds TerraAtlas (gis-pro module).
- `BCBSLevy` — Levy rate calculations. Feeds TerraLevy (terra-levy module).
- `TerraFlow` — Workflow engine. Feeds TerraDais backend service (terra-flow module).
- `TerraPILT` — PILT calculator. Feeds TerraDais > TerraPILT (terra-pilt module).
- `TerraGama` — Geographic market analysis. Feeds TerraAtlas > TerraGAMA (terra-gama module).
- `CountyDataSync-1` — Data synchronization. Feeds TerraSync (terra-sync module).

**Feeder (provisional — require inspection)**:
- `terra-forge-rebuild` — Active (2026-03-14). Likely TerraForge standalone rebuild. Provisional feeder until inspected. Do NOT classify as canonical without inspection.
- `TerraFusion-Valuator-Pro-Studio` — Active (2026-02-18). Forge domain pro valuation studio. Provisional feeder.
- `WashingtonForge` — Active (2026-02-12). WA-specific forge variant. Provisional feeder or county-specific.
- `TerraMiner` — Active (2026-02-22). terra-miner module. Provisional feeder.
- `TerraFusionPilt` — Active (2026-02-04). May duplicate TerraPILT or be its successor. Provisional feeder.
- `MLS_to_TOTAL` — 2025-04-27. PACS bridge / data integration. Maps to pacs-bridge. Provisional feeder.
- `TaxI_AI` — 2025-04-17. AI tax assistant. Should absorb into TerraPilot. Provisional feeder.

**Showcase** (demo/portfolio only):
- `mass-valuation-showcase` — Active (2026-03-14). Mass appraisal demo/showcase. Confirm no unique logic.
- `legislative-pulse-beacon` — Legislative tracking demo. Source material for legislative-pulse module.

**Predecessor** (earlier generation, archive candidates):
- `TerraFusion_OS` — Pre-monorepo generation. Superseded by terrafusion_os_1.0.
- `terrafusion-os` — Pre-monorepo generation. Superseded by terrafusion_os_1.0.
- `TerraFusion_Master_Workspace` — Legacy workspace. Superseded by terrafusion_os_1.0.
- `BCBSDesktop` — Legacy WPF desktop app. Superseded by os-shell + Electron.
- `TerraFusion` — Original generation. Superseded by terrafusion_os_1.0.
- `terrafusion-website` — Legacy website. Superseded by terrafusion_os_1.0.
- `shock_and_awe` — Legacy project. Archive candidate.
- `TerraFusion_Record` — Legacy records project. Archive candidate.
- `fusion-governance-achieved` — Legacy governance artifact. Archive candidate.
- `TerraFusion_DevOps_Championship` — Legacy DevOps artifact. Archive candidate.
- `terrafusion-market` — Legacy marketplace project. Archive candidate.
- `TerraBuild` — Legacy build/valuation project. Archive candidate.
- `terrafusion_enterprise` — Legacy enterprise variant. Archive candidate.
- `TerraFusionV0Demo` — V0 demo. Archive candidate.
- `TerraFusion_PlayGround` — Playground/sandbox. Archive candidate.
- `BCBSPermit` — Legacy permit app. Archive candidate.
- `TerraFusion_BentonCounty` — Legacy county-specific repo. Archive candidate.
- `TerraDBAssist` — Legacy DB assistant. Archive candidate.
- `BCBSLegislativePulse` — Legacy legislative pulse app. Archive candidate.
- `kid-safeguard-ai` — Non-TerraFusion project. Archive candidate.

**Unknown** (require manual inspection):
- `terra-magic-wand` — Active (2026-01-10). Unknown scope, unclassified.

---

## Surface → Repo → Service Consolidation Matrix

> **Binding rule**: No surface may be set to `retire/archive` until its Service Parity Verified column is checked.

> **Note**: Repos classified as provisional require manual inspection before their classification is finalized. Active private repos are NOT assumed canonical without inspection and parity proof.

| Surface (UI) | Source Repo | Backing Service/Endpoint | Disposition | Canonical Home | Service Parity Verified? |
|-------------|-------------|-------------------------|-------------|----------------|--------------------------|
| os-shell | terrafusion_os_1.0 | Vite dev server (localhost:5173) | `canonical-ui` | OS Shell | N/A (shell itself) |
| property-workbench | terrafusion_os_1.0 | TerraFusion.API `/api/properties` | `canonical-ui` | Property Workbench (Tier-0) | ☐ |
| suite-forge | terrafusion_os_1.0 | TerraFusion.API `/api/valuation` | `canonical-ui` | TerraForge Suite Home | ☐ |
| suite-atlas | terrafusion_os_1.0 | TerraFusion.API `/api/gis` | `canonical-ui` | TerraAtlas Suite Home | ☐ |
| suite-dais | terrafusion_os_1.0 | TerraFusion.API `/api/workflow` | `canonical-ui` | TerraDais Suite Home | ☐ |
| suite-dossier | terrafusion_os_1.0 | TerraDossier (localhost:3007) | `canonical-ui` | TerraDossier Suite Home | ☐ |
| suite-gpt | terrafusion_os_1.0 | TerraFusion.Consciousness `/api/ai` | `canonical-ui` | TerraGPT Suite Home | ☐ |
| terraforge | terrafusion_os_1.0 | TerraFusion.API `/api/valuation` | `canonical-ui` | TerraForge standalone (localhost:4201) | ☐ |
| gis-pro | BCBSGISPRO | Standalone Vite (localhost:5178) | `canonical-ui` | TerraAtlas standalone | ☐ |
| terra-dossier | terrafusion_os_1.0 | Deno server (localhost:3007) | `canonical-ui` | TerraDossier standalone | ☐ |
| terra-levy | BCBSLevy | Standalone Vite (localhost:5177) | `canonical-ui` | TerraDais > TerraLevy | ☐ |
| terra-flow | TerraFlow | Standalone Vite (localhost:5183) | `canonical-service` | TerraDais backend service | ☐ |
| comparable-sales | GeospatialAnalyzerBS | comparableSalesService.ts (rehosted) | `retire/archive` | Forge > Sales sub-tab | ✅ |
| income-valuation | BSIncomeValuation | incomeValuationService.ts (rehosted) | `retire/archive` | Forge > Income sub-tab | ✅ |
| costforge-ai | terrafusion_os_1.0 (legacy) | Standalone Vite (localhost:5176) | `retire/archive` | Forge > Cost sub-tab | ☐ |
| terra-primeview | terrafusion_os_1.0 | Standalone Vite (localhost:5184) | `retire/archive` | Workbench Summary tab | ☐ |
| property-tax-ai | PropertyTaxAI | None (placeholder) | `retire/archive` | TerraPilot tool suite | ☐ |
| webhub | terrafusion_os_1.0 (legacy) | None (localhost:5185, not runnable) | `retire/archive` | N/A — legacy portal | ☐ |
| terra-gama | TerraGama | None (placeholder, localhost:5182) | `future-module` | TerraAtlas > TerraGAMA | ☐ |
| terra-permit | terrafusion_os_1.0 | None (placeholder, localhost:5181) | `future-module` | TerraDais > TerraPermit | ☐ |
| terra-pilt | TerraPILT | None (placeholder, localhost:5179) | `future-module` | TerraDais > TerraPILT | ☐ |
| terra-sync | CountyDataSync-1 | None (placeholder) | `future-module` | OS Admin > TerraSync | ☐ |
| terra-miner | TerraMiner | None (placeholder) | `future-module` | OS Admin > TerraMiner | ☐ |
| pacs-bridge | terrafusion_os_1.0 | None (placeholder) | `future-module` | OS Admin > PACS Bridge | ☐ |
| legislative-pulse | legislative-pulse-beacon | None (placeholder) | `future-module` | OS Admin > Legislative Pulse | ☐ |
| regression-studio | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraForge > Regression Studio | ☐ |
| statistics-studio | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraForge > Statistics Studio | ☐ |
| vei | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraForge > Statistics Studio | ☐ |
| os-pilot | terrafusion_os_1.0 | TerraFusion.API `/api/pilot` | `canonical-ui` | TerraPilot (OS Feature) | ☐ |
| os-trace | terrafusion_os_1.0 | TerraFusion.API `/api/trace` | `canonical-ui` | TerraTrace (OS Feature) | ☐ |
| os-canon | terrafusion_os_1.0 | None (shell-only) | `canonical-ui` | TerraCanon (OS Feature) | ☐ |
| gpt-studio | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraGPT > GPT Studio | ☐ |
| gpt-marketplace | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraGPT > GPT Marketplace | ☐ |
| gpt-management | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraGPT > GPT Management | ☐ |
| gpt-builder | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraGPT > GPT Builder | ☐ |
| gpt-analytics | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraGPT > GPT Analytics | ☐ |
| gpt-rag | terrafusion_os_1.0 | None (placeholder) | `future-module` | TerraGPT > GPT RAG | ☐ |
| federation-dashboard | terrafusion_os_1.0 | Internal component | `canonical-ui` | OS Shell embedded | ☐ |
| costforge | terrafusion_os_1.0 | Internal component | `canonical-ui` | CostForge (legacy module renderer) | ☐ |
| terra-gaia | terrafusion_os_1.0 | Internal component | `canonical-ui` | TerraGaia (legacy AI module) | ☐ |
| sovereign-dashboard | terrafusion_os_1.0 | Internal component | `canonical-ui` | Sovereign Dashboard (document viewer) | ☐ |
| axiom-fs | terrafusion_os_1.0 | Internal component | `canonical-ui` | AxiomFS (lattice file system) | ☐ |
| terra-forge-rebuild | terra-forge-rebuild | Unknown (provisional — requires inspection) | `provisional` | TerraForge standalone (if parity confirmed) | ☐ |
| mass-valuation-showcase | mass-valuation-showcase | Unknown (showcase — confirm no unique logic) | `showcase` | N/A — demo/showcase only | ☐ |
| valuator-pro-studio | TerraFusion-Valuator-Pro-Studio | Unknown (provisional — requires inspection) | `provisional` | Forge domain (if unique capabilities found) | ☐ |
| washington-forge | WashingtonForge | Unknown (provisional — requires inspection) | `provisional` | Forge domain or county-specific | ☐ |
| terra-miner-repo | TerraMiner | Unknown (provisional — requires inspection) | `provisional` | OS Admin > TerraMiner (if parity confirmed) | ☐ |
| terrafusion-pilt | TerraFusionPilt | Unknown (provisional — requires inspection) | `provisional` | TerraDais > TerraPILT (if successor to TerraPILT) | ☐ |
| mls-to-total | MLS_to_TOTAL | Unknown (provisional — requires inspection) | `provisional` | OS Admin > PACS Bridge (data integration) | ☐ |
| taxi-ai | TaxI_AI | Unknown (provisional — requires inspection) | `provisional` | TerraPilot tool suite (AI tax assistant) | ☐ |
| terra-magic-wand | terra-magic-wand | Unknown (unclassified — requires inspection) | `unknown` | TBD — requires manual inspection | ☐ |

---

## Retirement Readiness

### Ready to Retire (parity verified)

| Surface | Canonical Replacement | Parity Status |
|---------|----------------------|---------------|
| `comparable-sales` (standalone module) | Forge > Sales sub-tab (ComparableSalesPanel.tsx rehosted) | ✅ Service parity verified — comparableSalesService.ts active |
| `income-valuation` (standalone module) | Forge > Income sub-tab (IncomeValuationPanel.tsx rehosted) | ✅ Service parity verified — incomeValuationService.ts active |

### Blocked on Parity (cannot retire yet)

| Surface | Blocking Reason | Action Required |
|---------|----------------|-----------------|
| `costforge-ai` | Cost model capabilities not yet extracted to Forge > Cost sub-tab | Build CostApproach.tsx, verify RCNLD + model execution parity |
| `terra-primeview` | Property viewer features not yet fully migrated to Workbench Summary tab | Audit TerraPrime features, migrate missing ones to Summary |
| `property-tax-ai` | LangChain assessment tools not yet absorbed into TerraPilot tool suite | Define tool schema, register tools in Pilot API |
| `webhub` | Legacy portal. No direct replacement needed, but must verify no active county dependency. | Confirm no county deployment references webhub endpoint |

---

## Gap Analysis

### 1. Capabilities with no surface

These capabilities are needed by county assessor workflows but have no UI surface yet:

| Capability | Domain | Bucket | Priority | Notes |
|-----------|--------|--------|----------|-------|
| Three-approach reconciliation | Forge | PNE | High | Weight sliders + narrative for cost/sales/income. Required for final value determination. |
| Batch cost model runs | Forge | CPO | High | Mass appraisal production. Core workflow for annual revaluation cycle. |
| Queue management / TerraQueue | Dais | CPO | High | Work assignment + SLA tracking. No surface at all today. |
| Certification workflow | Dais | CM | Medium | Roll certification checklists. Paper-based today. |
| Notice generation (batch) | Dais | CM | Medium | Batch notice templates + mail queue. External vendor today. |
| Appeal management / TerraAppeal | Dais | CPO | Medium | BOE calendar + case tracking. Spreadsheet-based today. |
| Exemption management | Dais | CM | Medium | Renewal tracking + batch eligibility. Manual today. |
| Evidence packet assembly | Dossier | PSDT | Medium | BOE defense packet for hearings. Manual Word/PDF today. |
| Document search (cross-parcel) | Dossier | CPO | Low | Full-text search across all parcel documents. |
| Neighborhood delineation | Atlas | CPO | Medium | Draw/edit neighborhood boundaries for market analysis. |
| Model residual mapping | Atlas | CPO | Low | Spatial pattern analysis for mass appraisal QA. |

### 2. Surfaces with no backend

These UI surfaces exist (registered in moduleComponents.tsx or generatedModules.ts) but have no real service behind them:

| Surface | Current State | What's Missing |
|---------|--------------|----------------|
| `terra-gama` | Placeholder component | No backend service, no data model, no API endpoint |
| `terra-permit` | Placeholder component | No backend service, no permit data ingestion |
| `terra-pilt` | Placeholder component | No backend service, no federal PILT data |
| `terra-sync` | Placeholder component | No ETL pipeline, no data connectors |
| `terra-miner` | Placeholder component | No external data aggregation service |
| `pacs-bridge` | Placeholder component | No Harris PACS connector, no field mapping engine |
| `legislative-pulse` | Placeholder component | No legislative tracking service, no bill scraper |
| `regression-studio` | Placeholder component | No regression engine, no model storage |
| `statistics-studio` | Placeholder component | No ratio study engine, no COD/PRD calculator |
| `vei` | Placeholder component | No equity analysis engine |
| `gpt-studio` | Placeholder component | No prompt engineering backend |
| `gpt-marketplace` | Placeholder component | No model/prompt catalog service |
| `gpt-management` | Placeholder component | No API key / quota management |
| `gpt-builder` | Placeholder component | No custom GPT builder backend |
| `gpt-analytics` | Placeholder component | No usage analytics pipeline |
| `gpt-rag` | Placeholder component | No vector store, no document indexer |

### 3. Duplicate overlaps

| Overlap | Surfaces Involved | Resolution |
|---------|------------------|------------|
| Cost valuation | `costforge-ai`, `costforge` (MODULE_REGISTRY), `suite-forge`, Forge Workbench tab | `costforge-ai` retires. `costforge` is legacy renderer. `suite-forge` is suite home. Forge Workbench tab is parcel-scoped. |
| Property viewing | `terra-primeview`, Workbench Summary tab, `sovereign-dashboard` | `terra-primeview` retires into Summary. `sovereign-dashboard` is document-viewer, not property viewer. |
| AI assistant | `property-tax-ai`, `terra-gaia`, `suite-gpt`, `os-pilot` | `property-tax-ai` retires into Pilot. `terra-gaia` is legacy AI. `suite-gpt` is suite home. `os-pilot` is tool orchestration. |
| GIS / mapping | `gis-pro` (TerraGIS), `suite-atlas`, Atlas Workbench tab | `gis-pro` is standalone TerraAtlas. `suite-atlas` is suite home. Atlas Workbench tab is parcel-scoped. Three distinct roles. |
| Income valuation | `income-valuation` (standalone), IncomeValuationPanel (component) | `income-valuation` module retires. Component stays as Forge > Income sub-tab wrapper. Parity verified. |
| Comparable sales | `comparable-sales` (standalone), ComparableSalesPanel (component) | `comparable-sales` module retires. Component stays as Forge > Sales sub-tab wrapper. Parity verified. |
| Workflow | `terra-flow` (UI surface), TerraFlow backend service | UI surface removed from launchpad. `terra-flow` becomes `canonical-service` only. |

### 4. Binding conflict resolutions (new in v2.0)

| Conflict | Description | Resolution |
|----------|-------------|------------|
| `gis-pro` displayName vs. constitutional name | generatedModules.ts says "TerraGIS", suiteRegistry.ts says "TerraAtlas" | Rename `gis-pro` displayName to "TerraAtlas" per suite registry. Module ID `gis-pro` unchanged for backward compatibility. |
| `terra-gaia` vs. `suite-gpt` | Both registered, both render AI interfaces | `terra-gaia` is legacy module, `suite-gpt` is constitutional. Coexist until suite-gpt achieves feature parity, then `terra-gaia` retires. Documented in MODULE_ALIASES. |
| `costforge` vs. `suite-forge` | MODULE_REGISTRY has both | `costforge` is legacy component (CostForgeQuantumDashboard). `suite-forge` is constitutional suite home (ForgeSuiteHome). Different render targets. No conflict — `costforge` can retire when suite-forge subsumes its features. |
| GPT suite modules without constitutional backing | `gpt-studio` through `gpt-rag` (6 modules) registered but not in CONSTITUTIONAL_SUITES | These are sub-modules of the `gpt` suite. They live inside `suite-gpt` hierarchy, not as independent suites. No constitutional conflict. |
| Workbench tab `clerk` / `treasury` / `audit` | Declared in suiteRegistry VALID_WORKBENCH_TAB_IDS but no matching suites | These are R3.x future department tabs (Recording, Tax Collection, Financial Compliance). No suite exists yet. Tab IDs are reserved. |

---

## Appendix A: Port Allocation

All known port assignments from generatedModules.ts and related configs:

| Port | Service / Module | Runtime | Status |
|------|-----------------|---------|--------|
| 3000 | Frontend (Vite legacy config) | Vite | Legacy reference |
| 3002 | TerraFusion.Gateway (Shell) | .NET 8 | Production |
| 3004 | TerraFusion.Consciousness | .NET 8 | Production |
| 3007 | TerraDossier | Deno | Active |
| 4201 | TerraForge standalone | pnpm/Vite | Active |
| 5000 | TerraFusion.API (Kernel) | .NET 8 | Production |
| 5173 | OS Shell (Vite dev) | pnpm/Vite | Active (autostart) |
| 5176 | CostForge AI (legacy) | Vite | Legacy |
| 5177 | TerraLevy | Vite | Beta |
| 5178 | TerraGIS / gis-pro | Vite | Active |
| 5179 | TerraPILT | Vite | Placeholder (not runnable) |
| 5181 | TerraPermit | Vite | Placeholder (not runnable) |
| 5182 | TerraGAMA | Vite | Placeholder (not runnable) |
| 5183 | TerraFlow | Vite | Beta |
| 5184 | TerraPrime / primeview | Vite | Active (retire candidate) |
| 5185 | WebHub | Vite | Legacy (not runnable) |
| 5432 | PostgreSQL | PostgreSQL | Infrastructure |
| 6379 | Redis | Redis | Infrastructure |
| 8500 | Consul | Consul | Infrastructure |

---

## Appendix B: Module Alias Map

Complete mapping of module IDs to display names to suite constitutional names, derived from `moduleComponents.tsx` MODULE_ALIASES and `moduleActivation.ts` display name map.

| Module ID (canonical) | Display Name | Suite / Constitutional Name | Aliases |
|-----------------------|-------------|---------------------------|---------|
| `os-shell` | TerraFusion OS Shell | OS Shell (system) | — |
| `property-workbench` | Property Workbench | Tier-0 OS Surface | workbench, property-workbench-window |
| `suite-forge` | TerraForge | Forge Suite (constitutional) | forge, terraforge |
| `suite-atlas` | TerraAtlas | Atlas Suite (constitutional) | atlas, terraatlas |
| `suite-dais` | TerraDais | Dais Suite (constitutional) | dais, terradais |
| `suite-dossier` | TerraDossier | Dossier Suite (constitutional) | dossier, terradossier |
| `suite-gpt` | TerraGPT | GPT Suite (constitutional) | gpt, terragpt |
| `os-pilot` | TerraPilot | OS Feature | pilot, terrapilot |
| `os-trace` | TerraTrace | OS Feature | trace, terratrace |
| `os-canon` | TerraCanon | OS Feature | canon, terracanon |
| `costforge` | CostForge | Legacy (Forge predecessor) | terrabuild, terra-build, property, assessment |
| `terra-gaia` | TerraGaia | Legacy (GPT predecessor) | gaia |
| `terra-levy` | TerraLevy | Dais > TerraLevy | levy, levy-calculator |
| `terra-flow` | TerraFlow | Dais backend service | flow |
| `gis-pro` | TerraGIS | Atlas standalone | gis, gis-viewer, map, terra-gis |
| `terra-dossier` | TerraDossier | Dossier standalone | docs, documents, document-manager |
| `terraforge` | TerraForge | Forge standalone | — |
| `income-valuation` | Income Valuation | RETIRED → Forge > Income | income |
| `comparable-sales` | Comparable Sales | RETIRED → Forge > Sales | comps, comparables |
| `regression-studio` | Regression Studio | Future: Forge > Regression | regression |
| `statistics-studio` | Statistics Studio | Future: Forge > Statistics | stats, statistics |
| `vei` | VEI | Future: Forge > Statistics | — |
| `terra-gama` | TerraGAMA | Future: Atlas > GAMA | gama |
| `terra-permit` | TerraPermit | Future: Dais > Permit | permit |
| `terra-pilt` | TerraPILT | Future: Dais > PILT | pilt |
| `terra-primeview` | TerraPrime | RETIRED → Workbench Summary | primeview |
| `property-tax-ai` | PropertyTax AI | RETIRED → TerraPilot | property-tax |
| `costforge-ai` | CostForge AI | RETIRED → Forge Cost sub-tab | — |
| `webhub` | WebHub | RETIRED | — |
| `pacs-bridge` | PACS DataBridge | Future: OS Admin | pacs |
| `terra-sync` | TerraSync | Future: OS Admin | sync |
| `terra-miner` | TerraMiner | Future: OS Admin | miner, terraminer |
| `legislative-pulse` | Legislative Pulse | Future: OS Admin | legislative, legislative-beacon |
| `gpt-studio` | GPT Studio | Future: GPT sub-module | — |
| `gpt-marketplace` | GPT Marketplace | Future: GPT sub-module | — |
| `gpt-management` | GPT Management | Future: GPT sub-module | — |
| `gpt-builder` | GPT Builder | Future: GPT sub-module | — |
| `gpt-analytics` | GPT Analytics | Future: GPT sub-module | — |
| `gpt-rag` | GPT RAG | Future: GPT sub-module | — |
| `federation-dashboard` | Federation Dashboard | OS Shell embedded | — |
| `sovereign-dashboard` | Sovereign Dashboard | OS Shell embedded | dashboard, doc-viewer, document-viewer |
| `axiom-fs` | AxiomFS | OS Shell embedded | — |
| `atlas-ai` | ATLAS | Legacy AI module | ai |
| `reporting` | Analytics | Legacy analytics | analytics, reports |
| `marketplace` | Marketplace | OS module store | store, apps |
| `counties` | Counties Hub | OS admin | — |
| `government-architecture` | Architecture | OS admin | — |
| `settings` | Settings | OS system | config, preferences |
| `shortcuts-help` | Shortcuts & Help | OS system | help, shortcuts |
| `plugin-manager` | Plugin Manager | OS system | — |

---

## Polyrepo Classification (Final — 2026-03-14)

Complete 23-repo audit with secrets triage, statistical/regression asset inventory, and extraction disposition.

### Classification Table

| Repo | Classification | Domain | Secrets Status | Stats/Regression | Disposition | Key Assets to Extract |
|------|---------------|--------|---------------|-----------------|-------------|----------------------|
| **terrafusion_os_1.0** | canonical | OS | Private repo | N/A | Keep — single source of truth | — |
| **Bsbcintelligentvalues** | predecessor/feeder | Valuation | Made private (minor: fallback session secret, ArcGIS catalog) | YES — mass appraisal regression (4 model types), XGBoost, Prophet, COD/PRD/PRB/VIF | Extract then archive | mass-appraisal.service.ts (1,005 lines), market_predictor.py, data_quality.py, CAMA connector, ArcGIS catalog |
| **BCBSLevy** | feeder | Tax/Levy | Made private (HIGH: 6 PG dumps, real 2025 levy Excel files) | YES — ARIMA, linear regression, anomaly detection | Extract then archive | levy_utils.py (rate engine), compliance_utils.py (WA statutory), bill_impact_utils.py, forecast models |
| **TerraMiner** | feeder | Data/ETL | Made private (CRITICAL: RapidAPI key, PACS.env.txt) | Partial — market trends | Extract then archive | ETL pipeline framework, GIS/PACS/MLS connectors, CMA service, RAG retriever, K8s devops kit |
| **terra-forge-rebuild** | predecessor/feeder | Valuation | Made private (CRITICAL: Supabase key, DB dumps) | YES — OLS solver, VEI | Extract then archive | regression-calibrate (OLS), VEI components, pacsBentonContract.ts, cost schedules, sync engine |
| **TerraFusionTheory** | feeder | Spatial | Made private (clean) | YES — GWR spatial regression | Extract then archive | GWR model, spatial feature engineering (viewshed, network centrality, KNN spatial lag), R-tree indexing |
| **TerraFusionPilt** | county-specific | PILT/Finance | Made private (HIGH: session secret in .env.production) | No | Extract then archive | PILT distribution logic, levy rate allocation, Windows AD auth pattern, MSSQL connectivity |
| **mass-valuation-showcase** | predecessor | Valuation | Public (clean) | YES — IAAO COD/PRD/PRB, Python RF/GBR | Reference then archive | IAAO ratio study engine, appeals system, defense studio, batch valuation, regression model storage schema |
| **WashingtonForge** | prototype | UI | Public (clean) | No (mock data) | Reference then archive | Ratio study UI patterns, calibration UI, cockpit map, TypeScript type contracts (lib/api/types.ts) |
| **BCBSWebhub** | predecessor | Audit/Workflow | Deleted (HIGH: session secret, JWT, DB password, PACS.env.txt) | Partial — audit analytics | Deleted | Was: audit workflow engine, annotations/comments, custom workflows, analytics schema |
| **TerraFUsionPermit** | feeder (quarantined) | Permits | Deleted (CRITICAL: Supabase key in .env.local) | No | Deleted (code in QUARANTINE) | Was: permit classifier business logic, LangChain/RAG pipeline |
| **TerraFusionSync** | predecessor | Sync/GIS | Deleted (clean) | No | Deleted | Was: GIS multi-format export, district lookup, ExemptionSeer AI, RBAC manager |
| **terra-fusion-prime-view** | predecessor | Viewer | Deleted (HIGH: Supabase creds in source, FTP creds) | No | Deleted | Was: FTP import pipeline design, ArcGIS sync layer, ExemptionPanel |
| **TerraFusion_Record** | feeder | Municipal | Public (clean) | No | Keep as reference | 12-module municipal OS architecture (recorder, licensing, permits, inspections, payments) |
| **TerraFusionInsightPro** | predecessor | Mobile | Deleted (minor: staging DB password) | No | Deleted | Was: TerraField mobile concept (CRDT offline-first) |
| **TerraFusion-Valuator-Pro-Studio** | showcase | Demo | Deleted (clean) | No | Deleted | None — toy implementations |
| **TerraFusionAssistant** | showcase | AI | Deleted (clean) | No | Deleted | None — generic AI chat wrapper |
| **TerraFusion_PlayGround** | showcase | AI | Deleted (clean) | No | Deleted | None — AI code generator |
| **TerraFusionPlayground** | predecessor | Generic | Deleted (clean) | No | Deleted | None — generic boilerplate |
| **TerraFusionProPlus** | showcase | DevOps | Deleted (clean) | No | Deleted | None — DevOps dashboard concept |
| **Terrafusion-market** | predecessor | Marketing | Deleted (clean) | No | Deleted | None — strategy docs |
| **terrafusion-website** | marketing | Website | Public (clean) | No | Keep | — |
| **terrafusion-docs** | docs | Documentation | Public (clean) | No | Keep | — |
| **terrafusion-developer-tools** | infra | Dev tooling | Public (clean) | No | Keep | — |
| **legislative-pulse-beacon** | niche | Legislative | Public (clean) | No | Keep | Legislative tracking capability |

### ADR Resolutions

The following open ADRs from Document D have been resolved:

| ADR | Question | Resolution | Decided |
|-----|----------|-----------|---------|
| ADR-TBD-1 → ADR-001 | Is Statistics Studio a TerraForge module or a new OS workspace? | **TerraForge module** — cross-parcel ratio studies are Forge write-lane (TF-052) | 2026-03-14 |
| ADR-TBD-2 → ADR-002 | Is Regression Studio a TerraForge module or a new OS workspace? | **TerraForge module** — MRA/GWR model building is Forge write-lane (TF-052) | 2026-03-14 |
| ADR-TBD-3 → ADR-003 | Is Management Dashboard a TerraDais module or OS workspace? | **TerraDais module** — work queue/certification is Dais write-lane (TF-052) | 2026-03-14 |

### Binding Note

> No feeder repo may be deleted or archived until its extractable assets listed in the "Key Assets to Extract" column have been reviewed and either (a) ported to terrafusion_os_1.0 or (b) explicitly declined with rationale recorded. The 6 private feeder repos are the extraction backlog for Phase 4B.
