# R2 Extraction Plan

Date: March 7, 2026
Baseline: `r1.0.0` tag at `37d405b14` on `main`
Purpose: define the extraction-first buildout of the Assessor suite from R1 proof through full domain depth.

## Boundary

R1 proved the governed architecture with real data and evidence. It is tagged, merged,
and sealed. This plan is domain enrichment by extraction, not more scaffold-building.

What R1 delivered:

- Governed spine: invoke contracts, trace, county isolation, RBAC, risk confirmation
- 10 real handlers (5 proof-certified, 5 backend-wired but not yet proof-certified)
- Forge: governed valuation path only (cost approach, simplified math)
- Atlas: parcel geometry and layer list (no GIS workflows)
- Dossier: casefile, notes, evidence snapshot (no document management)
- Dais: levy calculation real, PILT explicitly disabled (501)
- Evidence: AC-1 through AC-11, 17/17, 19 SHA256-verified artifacts

What R1 did not deliver:

- Real valuation lineage (cost matrices, income approach, sales comparison, reconciliation)
- Real GIS and ArcGIS integration
- Real PILT calculator, permit workflows, statutory levy engine
- Full document management and evidence chain
- 14 of 24 manifest tools remain stubs

## Method

Extract domain logic from the quarantine app inventory into the current backend/controllers.
Do not rebuild from scratch unless quarantine sources are unusable for a specific domain.
Wrap each extracted slice with the same governance, evidence, and gate discipline proven in R1.

## Permanent Gates

These are non-negotiable for every release after R1:

- `pnpm run type-check` — zero errors
- `node --test os-platform/core/tests/phase83-tools.test.mjs` — 32/32 (grows with new tools)
- `node --test os-platform/core/tests/r1-acceptance-criteria.test.mjs` — 17/17 (grows)
- `pnpm -w run r1:verify-evidence` — evidence verifier pass (SHA updated per release)
- Fake-path elimination: targeted grep zero on active production surfaces
- County isolation: every backend route filters by countyId
- Correlation: every request chain carries correlationId through trace

---

## Phase R1.1 — Expand Governed Surface (Weeks 1–2)

### Objective

Move from 5 proof-certified tools to 9 governed tools with full evidence. All 4 target
tools already have real handlers in `handlers.real.ts` calling live backend endpoints.
R1.1 is about proof certification, not implementation.

### Tools

| Tool | Handler | Backend Endpoint | Suite | Risk | Status |
|------|---------|-----------------|-------|------|--------|
| `explain_model_inputs` | `explainModelInputsRealHandler` | `GET /api/costforge/models/{modelId}` | forge | read_only | Handler real, needs proof |
| `compare_assessed_value_history` | `compareAssessedValueHistoryRealHandler` | `GET /api/properties/{parcelId}` | forge | read_only | Handler real, needs proof |
| `add_dossier_note` | `addDossierNoteRealHandler` | `POST /api/dossier/{parcelId}/notes` | dossier | write_low | Handler real, needs proof |
| `query_parcel_layers` | `queryParcelLayersRealHandler` | `GET /api/atlas/parcels/{parcelId}/layers` | atlas | read_only | Handler real, needs proof |

### Work Packages

#### R1.1-CP: Contract Freeze + Proof Harness

Owner: CP lane

- Freeze tool payloads for the 4 new tools (params, response shape, error codes)
- Add governed proof tests to `r1-acceptance-criteria.test.mjs` for each tool
  - `explain_model_inputs`: model inputs with real modelId produce structured factors
  - `compare_assessed_value_history`: two different parcels produce different trend arrays
  - `add_dossier_note`: write-low confirmation gate + reason code required + note persists
  - `query_parcel_layers`: layer list for Benton County parcel returns real layer names
- Add anti-fake-path regression tests for each tool

Exit: AC count grows from 17 to ~25, all passing.

#### R1.1-CX: Backend Endpoint Verification

Owner: CX lane

- For `explain_model_inputs`: verify `/api/costforge/models/{modelId}` returns real
  model factor data (not hardcoded), with auth and county isolation
- For `compare_assessed_value_history`: verify `/api/properties/{parcelId}` returns
  real valuation history array with annual values
- For `add_dossier_note`: verify `/api/dossier/{parcelId}/notes` POST creates a real
  persistent note with SHA-256 evidence hash
- For `query_parcel_layers`: verify `/api/atlas/parcels/{parcelId}/layers` returns
  real layer inventory for the queried parcel

Exit: all 4 backend endpoints are source-verified, auth-confirmed, county-scoped.

#### R1.1-CC: Workbench Surface Exposure

Owner: CC lane

- Surface `explain_model_inputs` results in the Forge tab (model factor breakdown)
- Surface `compare_assessed_value_history` results in the Forge tab (year-over-year trend)
- Surface `add_dossier_note` in the Dossier tab (governed write with confirmation)
- Surface `query_parcel_layers` in the Atlas tab (layer inventory display)

Exit: all 4 tools visible in workbench, governed lifecycle with correlation ID.

### R1.1 Definition of Done

- 9 governed tools proof-certified (5 from R1 + 4 new)
- AC count: ~25/25 passing
- Evidence packet refreshed for new SHA
- Tag: `r1.1.0`

---

## Phase R2 — Full Assessor Suite (Weeks 2–12)

### Quarantine App Inventory

These are the extraction sources ranked by domain value.

| # | App | Target Suite | Stack | Extraction Value | Key Asset |
|---|-----|-------------|-------|-----------------|-----------|
| 1 | `terra-flow-production/` | OS Core + All Suites | Python Flask | ★★★★★ | 60+ routes, 20+ DB tables, ALL Assessor domain logic |
| 2 | `costforge-ai-workspace/` | TerraForge | Node + Drizzle + PG | ★★★★ | 30+ DB tables, Benton CAMA cost matrices, Bayesian/Monte Carlo/OLS/spatial stats |
| 3 | `terraforge-suite/` | TerraForge | Rust + TS | ★★★ | Rust cost/income/comp kernels, 12 JSON schema contracts, golden test values |
| 4 | `bcbs-gis-pro-production/` | TerraAtlas | Express + PG + ArcGIS | ★★★★ | Real Benton County ArcGIS FeatureServer, 31 layers, Claude AI doc analysis |
| 5 | `terra-pilt-production/` | TerraDais | Express + SQLite/PG | ★★★★ | Complete PILT calculator for Hanford (586k federal acres), real levy data |
| 6 | `bs-income-valuation-production/` | TerraForge | Express + TS + PG | ★★★ | Income approach, GIM multipliers, time series decomposition |
| 7 | `terra-permit/` | TerraDais | Express + TS + PG | ★★★ | Permit classifier, PACS proxy (FastAPI subprocess) |
| 8 | `costforge-ai/` | TerraForge | Python + Flask | ★★★ | `ConstructionCostEngine` — matrices, multipliers, depreciation, regional factors |
| 9 | `terra-gama-production/` | TerraForge | Next.js + Flask | ★★ | ArcGIS proxy (31 layers), market area analysis formulas |
| 10 | `BS_PACS/` | OS Core | .NET + SQL Server | ★★ | PACS schema snapshots, Harris integration models |
| 11 | `terra-primeview-production/` | Property Workbench | React + Supabase | ★★ | DB schema (properties, counties, neighborhoods), WA compliance data |

### Extraction Method (per app)

For each quarantine app to extract:

1. **Read** the quarantine source. Identify domain logic vs. scaffold/boilerplate.
2. **Map** domain functions to target suite controllers and services.
3. **Extract** into current `.NET` backend services or create new domain services.
4. **Wire** through existing governed tool handlers where applicable.
5. **Gate** with the same evidence discipline: type-check, phase83, county isolation,
   correlation, fake-path zero.
6. **Test** with domain-specific acceptance criteria added to the test suite.
7. **Evidence** with updated signoff and manifest for each extraction wave.

### Wave 1: Forge Extraction (Weeks 2–6)

#### Target: Replace simplified valuation math with real assessment logic

Extraction sources:
- `costforge-ai/core-engine/construction_cost_engine.py` → .NET CostForge service
- `costforge-ai-workspace/` → Benton CAMA cost matrices, DB schema
- `terraforge-suite/` → Rust kernel contracts (cost/income/comps), golden test values
- `bs-income-valuation-production/` → Income approach, GIM multipliers
- `terra-flow-production/` → RCW calculators, PACS ETL logic

#### Work Packages

##### W1-FORGE-01: Cost Approach Extraction

Source: `costforge-ai/core-engine/construction_cost_engine.py` + `costforge-ai-workspace/`

Extract:
- Building cost matrices (residential, commercial, industrial, government)
- Regional multipliers (urban, suburban, rural)
- Age depreciation tables
- Quality adjustment factors
- Benton County actual CAMA cost matrices from workspace DB

Target: `backend/src/TerraFusion.CostForge/` — enrich existing service with real matrices

Backend changes:
- Replace simplified `/api/costforge/calculate` math with matrix-based calculation
- Add `/api/costforge/matrices` endpoint for matrix inspection/audit
- Preserve existing governed handler contract (request/response shape stable)

Governed tool impact:
- `run_valuation_model` handler unchanged (same endpoint, richer backend)
- `explain_model_inputs` returns real matrix factors instead of simplified inputs

Gate: two-parcel proof with materially different outputs using real matrices.

##### W1-FORGE-02: Income Approach

Source: `bs-income-valuation-production/` + `terraforge-suite/` (Rust income kernel)

Extract:
- Income capitalization logic
- GIM (Gross Income Multiplier) calculation
- Time series decomposition for rental trends
- Market rent estimation

Target: new `IncomeApproachService` in `backend/src/TerraFusion.CostForge/`

Backend changes:
- Add `POST /api/costforge/income-approach` endpoint
- Wire to new governed tool (or extend `run_valuation_model` with approach parameter)

New governed tool: `run_income_valuation` (or parameter extension of existing tool)

##### W1-FORGE-03: Sales Comparison

Source: `terra-gama-production/` + `terraforge-suite/` (Rust comps kernel)

Extract:
- Comparable selection logic
- Sales adjustment calculations
- Market area analysis formulas
- Comp grid generation

Target: new `SalesComparisonService` in `backend/src/TerraFusion.CostForge/`

Backend changes:
- Add `POST /api/costforge/sales-comparison` endpoint
- Add `GET /api/costforge/comps/{parcelId}` for comp retrieval

New governed tool: `summarize_sales_comps_rationale` (already in manifest as stub)

##### W1-FORGE-04: Reconciliation

Source: `terra-flow-production/` (reconciliation logic)

Extract:
- Multi-approach reconciliation weights
- Final value determination logic
- Confidence scoring across approaches

Target: extend `CostForgeController` with reconciliation endpoint

Backend changes:
- Add `POST /api/costforge/reconcile` endpoint
- Integrates cost, income, and sales results into final assessed value

Gate: reconciliation of 3 approaches for a single parcel produces a weighted final value.

### Wave 2: Atlas GIS Extraction (Weeks 4–8)

#### Target: Replace parcel-only geometry with real GIS workflows

Extraction source:
- `bcbs-gis-pro-production/` → Real ArcGIS FeatureServer integration, 31 Benton County layers

##### W2-ATLAS-01: ArcGIS Integration

Source: `bcbs-gis-pro-production/`

Extract:
- ArcGIS FeatureServer connection and query logic
- Layer catalog (31 Benton County layers: parcels, zoning, flood, aerial, etc.)
- Parcel geometry queries with spatial filtering
- Feature attribute retrieval

Target: `backend/src/TerraFusion.API/Controllers/AtlasController.cs` — extend existing

Backend changes:
- Enrich `/api/atlas/parcels/{parcelId}/layers` with real ArcGIS layer data
- Add `/api/atlas/layers` for full layer catalog
- Add `/api/atlas/spatial-query` for spatial intersection queries
- Add `/api/atlas/export/{format}` for GIS data export

Governed tool impact:
- `query_parcel_layers` returns real ArcGIS layer attributes

##### W2-ATLAS-02: Map Workflow UX

Owner: CC lane

- Replace schematic SVG map in Atlas tab with real ArcGIS-backed map
- Layer toggle, selection, search
- Parcel highlight and spatial selection
- Print/export workflows

Gate: Atlas tab displays real Benton County parcel geometry from ArcGIS FeatureServer.

### Wave 3: Dais Real Logic (Weeks 6–10)

#### Target: Replace stubs and simplified logic with real Assessor admin workflows

Extraction sources:
- `terra-pilt-production/` → PILT calculator
- `terra-permit/` → Permit classifier, PACS proxy
- `terra-flow-production/` → RCW levy/statutory calculators

##### W3-DAIS-01: PILT Calculator

Source: `terra-pilt-production/`

Extract:
- Hanford Nuclear Reservation PILT calculation (586,000 federal acres)
- Federal payment schedules
- WA State RCW PILT formulas
- Real levy data integration

Target: `backend/src/TerraFusion.API/Controllers/PiltController.cs` — replace 501 stubs

Backend changes:
- Replace `Post-R1 / 501` responses with real calculation endpoints
- Add `POST /api/pilt/calculate` with real Hanford PILT math
- Add `GET /api/pilt/schedules` for payment schedule retrieval

Governed tool: new `calculate_pilt_payment` tool

##### W3-DAIS-02: Permit Workflows

Source: `terra-permit/`

Extract:
- Permit classification rules
- PACS proxy for permit data retrieval
- Inspection scheduling logic
- Valuation impact calculation

Target: new `PermitController` in `backend/src/TerraFusion.API/Controllers/`

Backend changes:
- Add `/api/permits/classify` endpoint
- Add `/api/permits/{parcelId}` for parcel permit history
- Add `/api/permits/inspection-impact` for valuation impact

Governed tool: `assign_task` (already in manifest as stub — wire to permit workflow)

##### W3-DAIS-03: Statutory Levy Engine

Source: `terra-flow-production/` (RCW calculators) + `terra-levy/` (IPC SDK pattern only)

Extract:
- WA RCW 84.52 / 84.55 statutory limit calculations
- Real district levy rate modeling
- Tax code area aggregation
- Revenue projection with real district data

Target: enrich `LevyCalculationController` with real statutory engine

Backend changes:
- Replace simplified levy math with RCW-compliant calculations
- Add `GET /api/levy-calculation/districts/{countyId}` for district inventory
- Add `POST /api/levy-calculation/statutory-check` for limit compliance

Gate: levy calculation for real Benton County districts produces RCW-compliant rates.

### Wave 4: Dossier Completion (Weeks 8–12)

#### Target: Complete document management and evidence chain

Extraction source:
- `terra-flow-production/` (document/report logic)
- `terra-dossier/` (IPC SDK pattern — reference only)

##### W4-DOS-01: Document Management Backend

Target: `backend/src/TerraFusion.API/Controllers/DossierController.cs` — replace 501 stubs

Backend changes:
- Replace `Post-R1 / 501` document management routes with real implementation
- Add `POST /api/dossier/documents/upload` — document storage
- Add `GET /api/dossier/documents/{documentId}` — document retrieval
- Add `POST /api/dossier/documents/search` — document search with metadata
- Add SHA-256 chain linking for evidence integrity

Governed tool: `summarize_dossier` (already in manifest as stub)

##### W4-DOS-02: Evidence Chain and Packet Assembly

Target: new evidence chain service

Backend changes:
- Add `POST /api/dossier/packets/assemble` — packet assembly from evidence
- Add `GET /api/dossier/packets/{packetId}` — assembled packet retrieval
- Evidence linkage: each document/note in a chain with SHA-256 hash pointers

Governed tool: `assemble_boe_packet` (already in manifest as stub)

Gate: evidence packet assembled from real documents with SHA-256 chain integrity.

---

## Stub-to-Real Handler Progression

R1 shipped 10 real handlers. 14 manifest tools remain stubs. This is the extraction
sequence for wiring them:

| Tool | Stub? | Target Wave | Extraction Source | New Backend Endpoint |
|------|-------|------------|-------------------|---------------------|
| `explain_model_results` | Stub | W1 | costforge-ai | extend `/api/costforge` |
| `summarize_sales_comps_rationale` | Stub | W1 | terra-gama + terraforge-suite | `/api/costforge/sales-comparison` |
| `assign_task` | Stub | W3 | terra-permit | `/api/permits/classify` |
| `check_cert_status` | Stub | W3 | terra-flow | `/api/dais/certification` |
| `assemble_boe_packet` | Stub | W4 | terra-flow | `/api/dossier/packets/assemble` |
| `draft_notice` | Stub | W3 | terra-flow | `/api/dais/notices` |
| `draft_appeal_response` | Stub | W3 | terra-flow | `/api/dais/appeals` |
| `summarize_dossier` | Stub | W4 | terra-flow | `/api/dossier/summary` |
| `synthesize_evidence` | Stub | W4 | terra-flow | `/api/dossier/evidence/synthesize` |
| `generate_commissioner_memo` | Stub | W3 | terra-flow | `/api/dais/memos` |
| `request_trace_redaction` | Stub | W4 | OS core | `/pilot/trace/redact` |
| `explain_senior_exemption_impact` | Stub | W3 | terra-flow | `/api/dais/exemptions` |
| `draft_value_change_notice` | Stub | W3 | terra-flow | `/api/dais/notices/value-change` |
| `draft_boe_appeal_response` | Stub | W3 | terra-flow | `/api/dais/appeals/response` |

Target: 24/24 real handlers by end of Wave 4.

---

## Lane Ownership

| Lane | Owner | Scope |
|------|-------|-------|
| CP | Copilot | Contract freeze, handler wiring, proof harness, acceptance criteria, evidence |
| CX | Codex | Backend extraction, domain service implementation, endpoint creation |
| CC | Claude | Frontend surface exposure, UX for new domain results, fake-path elimination |

### Handoff Protocol (Same as R1)

- CX extracts and publishes stable backend endpoints with auth and county isolation
- CP freezes governed tool contract and writes proof tests
- CC wires frontend surfaces only against frozen contracts
- Evidence packet updated per wave with same discipline: signoff, manifest, SHA verification

---

## Timeline

| Week | Phase | Deliverable |
|------|-------|------------|
| 1 | R1.1 | 4 new tools proof-certified (9 total governed) |
| 2 | R1.1 close + W1 start | R1.1 tagged, Forge extraction begins |
| 2–4 | W1-FORGE-01 | Cost approach: real matrices replace simplified math |
| 3–5 | W1-FORGE-02 | Income approach extracted and wired |
| 4–6 | W1-FORGE-03 + 04 | Sales comparison + reconciliation |
| 4–6 | W2-ATLAS-01 | ArcGIS integration extracted |
| 5–8 | W2-ATLAS-02 | Map workflow UX |
| 6–8 | W3-DAIS-01 | PILT calculator replaces 501 stubs |
| 7–9 | W3-DAIS-02 | Permit workflows |
| 8–10 | W3-DAIS-03 | Statutory levy engine |
| 8–10 | W4-DOS-01 | Document management backend |
| 10–12 | W4-DOS-02 | Evidence chain and packet assembly |

Waves overlap. CC frontend work for each wave starts 1 week after CX backend extraction
publishes stable endpoints.

## Release Tags

| Tag | Content | Gate |
|-----|---------|------|
| `r1.0.0` | Governed spine + 5-proof tools | ✅ Shipped March 7, 2026 |
| `r1.1.0` | 9 governed tools, expanded AC | R1.1 close |
| `r2.0.0-w1` | Forge real valuation (cost + income + sales + reconciliation) | Wave 1 close |
| `r2.0.0-w2` | Atlas real GIS | Wave 2 close |
| `r2.0.0-w3` | Dais real PILT + permit + levy | Wave 3 close |
| `r2.0.0` | Full Assessor suite (24/24 handlers, all stubs eliminated) | Wave 4 close |

## Definition of Done: R2

R2 is complete when:

- 24/24 manifest tools have real handlers
- Forge has cost, income, sales, and reconciliation with real Benton County matrices
- Atlas has real ArcGIS integration with Benton County layers
- Dais has real PILT calculator, permit workflows, and statutory levy engine
- Dossier has document management and evidence chain
- All permanent gates pass
- Evidence packet covers all 4 waves with correlation IDs and reproducible traces
- No production surface depends on stub, mock, or simplified logic

## Beyond R2

R3+ reuses the proven governance spine for additional office verticals:

- TerraClerk (County Clerk)
- TerraTreasury (County Treasurer)
- TerraAudit (County Auditor)
- TerraRecorder (County Recorder)

Each vertical follows the same pattern: extract domain logic, wire governed tools,
expose through workbench surfaces, gate with evidence discipline. The governance spine
does not need to be reproven — only extended.

---

*Classification: Internal planning document*
*Baseline: r1.0.0 at 37d405b14*
*Method: Extraction-first, not rebuild*
