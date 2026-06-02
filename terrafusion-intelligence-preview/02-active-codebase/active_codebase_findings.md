# Active Codebase Scout Report

```
Agent: Active Codebase Scout
Mission: Search the entire terrafusion_os_1.0 repo for reusable assets that could power
         three conference demo experiences: Atlas, Academy, and TerraFusion OS.
Sources inspected: 26 search terms across entire repo (excluding node_modules, .git, dist, build).
  Frontend routes (Router.tsx), suite modules, workbench tabs, services, hooks, configs.
  Backend controllers, entities, services, DTOs, AI prompts, seeds.
  QUARANTINE archive (shock-and-awe, terra-agent, RAG, BS_PACS, brand codex, atlas-exports).
  Data fixtures (cost-matrices, demo JSON, database migrations/seeds).
Findings: See sections below.
Files changed: 1 (this report)
Evidence: File paths, line counts, component descriptions extracted from source.
Verification: All paths confirmed via ls/find/wc -l; component purpose from file headers.
Blockers: None for asset inventory. Many QUARANTINE assets need extraction/adaptation.
Next recommended action: Prioritize HIGH reuse assets for demo wiring; stub missing APIs.
Post-conference ideas: Promote best QUARANTINE modules back to active codebase;
  build Academy content pipeline from RAG knowledge base.
```

---

## TOP REUSABLE ASSETS (Ranked by Reuse Value)

| # | Asset | Location | Type | Lines | Demo Target | Reuse |
|---|-------|----------|------|-------|-------------|-------|
| 1 | PropertyWorkbench (6-tab parcel hub) | `frontend/apps/os-shell/src/pages/workbench/` | Page+Tabs | 2412 | Atlas (dossier) | HIGH |
| 2 | PropertyDossier tab (real API wired) | `...workbench/tabs/PropertyDossier.tsx` | Component | 537 | Atlas (dossier) | HIGH |
| 3 | PropertyAtlas tab (SVG map + layers) | `...workbench/tabs/PropertyAtlas.tsx` | Component | 527 | Atlas (GIS) | HIGH |
| 4 | PropertySummary tab (BentoGrid layout) | `...workbench/tabs/PropertySummary.tsx` | Component | 168 | Atlas (dossier) | HIGH |
| 5 | PropertySearch (parcel browse/search) | `...pages/PropertySearch.tsx` | Page | ~180 | Atlas | HIGH |
| 6 | AtlasSuiteHome (7 GIS sub-modules) | `...pages/suites/AtlasSuiteHome.tsx` | Page | ~130 | Atlas | HIGH |
| 7 | DossierSuiteHome (6 doc sub-modules) | `...pages/suites/DossierSuiteHome.tsx` | Page | ~130 | Atlas (dossier) | HIGH |
| 8 | ForgeSuiteHome (6 valuation modules) | `...pages/suites/ForgeSuiteHome.tsx` | Page | ~120 | Atlas+Academy | HIGH |
| 9 | DossierController (1370-line API) | `backend/src/TerraFusion.API/Controllers/DossierController.cs` | API | 1370 | Atlas (dossier) | HIGH |
| 10 | CostForgeModule (cost calculator) | `...suites/modules/CostForgeModule.tsx` | Module | 954 | Atlas+Academy | HIGH |
| 11 | AppealForgeModule (BOE appeals) | `...suites/modules/AppealForgeModule.tsx` | Module | 613 | Atlas+Academy | HIGH |
| 12 | IncomeForgeModule (income approach) | `...suites/modules/IncomeForgeModule.tsx` | Module | 636 | Atlas+Academy | HIGH |
| 13 | CompsForgeModule (sales comparison) | `...suites/modules/CompsForgeModule.tsx` | Module | 586 | Atlas+Academy | HIGH |
| 14 | ReconciliationModule (3-approach) | `...suites/modules/ReconciliationModule.tsx` | Module | 537 | Atlas+Academy | HIGH |
| 15 | GISModule (parcel viewer) | `...suites/modules/GISModule.tsx` | Module | 232 | Atlas | HIGH |
| 16 | TerraPrintModule (PDF/print) | `...suites/modules/TerraPrintModule.tsx` | Module | 306 | Atlas (reports) | HIGH |
| 17 | DefensePacketsModule (BOE packets) | `...suites/modules/DefensePacketsModule.tsx` | Module | 262 | Atlas+Academy | MEDIUM |
| 18 | GptSuiteHome (AI chat + builder) | `...pages/suites/GptSuiteHome.tsx` | Page | ~100 | Academy (ask) | HIGH |
| 19 | ATLAS AI chat component | `...components/ai/ATLAS.tsx` | Component | ~350 | Academy (ask) | MEDIUM |
| 20 | AdvancedCodexDashboard | `...components/codex/AdvancedCodexDashboard.tsx` | Component | ~300 | Academy (codex) | MEDIUM |
| 21 | ShellHome (OS launcher tile grid) | `...shell/home/ShellHome.tsx` | Page | ~250 | OS demo | HIGH |
| 22 | Property entity + DTOs | `backend/src/TerraFusion.Core/Entities/Property.cs` + DTOs | Entity | 53 | Atlas | HIGH |
| 23 | Benton cost matrix data (983 entries) | `data/cost-matrices/benton_county_data.json` | Data | N/A | Atlas+Academy | HIGH |
| 24 | AI prompts (14 govt GPTs) | `backend/src/TerraFusion.AI/Prompts/` (5 categories) | Prompt | ~600 | Academy | HIGH |
| 25 | GPT catalog (20 pre-built configs) | `backend/src/TerraFusion.AI/PREBUILT_GPT_CATALOG.md` | Config | ~500 | Academy | HIGH |
| 26 | Suite registry (5 suites + 3 OS features) | `...config/suiteRegistry.ts` | Config | ~150 | OS | HIGH |
| 27 | Frontend service layer | `...services/{atlas,dossier,forge,dais,gpt}Service.ts` | Services | 2436 | All | HIGH |
| 28 | PACS service (Harris PACS client) | `...services/pacsService.ts` + `harrisPacsClient.ts` | Service | ~450 | Atlas | HIGH |
| 29 | RAG knowledge base (Benton CAMA) | `QUARANTINE/.../rag/benton-cama/` (3 docs) | Content | 392 | Academy (codex) | HIGH |
| 30 | BOEArguer agent (Claude-powered) | `QUARANTINE/.../swarm-core/agents/BOEArguer.ts` | Agent | 404 | OS (handoff) | MEDIUM |
| 31 | terra-agent MCP tools (11 tools) | `QUARANTINE/.../terra-agent/mcp-server/src/tools/` | Tools | 1584 | OS (handoff) | MEDIUM |
| 32 | Ratio study components | `QUARANTINE/.../shock-and-awe/src/{pages,hooks,workbenches}/` | Components | 153 | Atlas (pulse) | LOW |
| 33 | Levy scenario board | `QUARANTINE/.../shock-and-awe/src/workbenches/LevyScenarioBoard.tsx` | Component | 22 | Atlas (pulse) | LOW |
| 34 | Demo data (ratio, levy, cohorts) | `QUARANTINE/.../shock-and-awe/demo/benton/` (3 JSON files) | Data | N/A | Atlas | MEDIUM |
| 35 | Handoff templates + examples | `QUARANTINE/.../handoffs/` + `templates/handoff-template.json` | Config | N/A | OS (handoff) | MEDIUM |
| 36 | CostForge backend services | `backend/src/TerraFusion.AI/Services/CostForge*.cs` | Service | ~800 | Atlas | HIGH |
| 37 | Database seeder (Benton data) | `backend/src/TerraFusion.AI/Seeds/BentonCostMatrixSeeder.cs` | Seed | N/A | Atlas | HIGH |
| 38 | Database migration (Benton county) | `database/migrations/002_BentonCountyData.sql` | Migration | N/A | Atlas | HIGH |
| 39 | Property valuation service | `backend/src/TerraFusion.AI/Services/PropertyValuationService.cs` | Service | 328 | Atlas+Academy | HIGH |
| 40 | Analytics reporting service | `backend/src/TerraFusion.AI/Services/AnalyticsReportingService.cs` | Service | 863 | Atlas (pulse) | MEDIUM |

---

## DETAILED FINDINGS BY SEARCH TERM

### 1. "atlas" / "dossier" / "deus" / "academy" / "codex" / "county studio"

**atlas**: No standalone "atlas" branding in active code. BUT the Atlas concept is FULLY IMPLEMENTED as:
- Route: `/atlas` (AtlasSuiteHome with 7 sub-modules: TerraGIS, ParcelLens, LayerWorks, TerraSketch, TerraPrint, TerraExport, TerraQuery)
- Route: `/property/:parcelId/atlas` (PropertyAtlas workbench tab)
- Service: `atlasService.ts` (307 lines, typed API client)
- QUARANTINE: `terrafusion-atlas/` directory with atlas schema, registries, governance docs
- QUARANTINE: `atlas-exports/` directory with exported atlas data (JSON, HTML, MD)

**dossier**: FULLY IMPLEMENTED:
- Route: `/dossier` (DossierSuiteHome with 6 modules: Documents, Evidence, Defense Packets, Chain of Custody, Photo Manager, Deep Search)
- Route: `/property/:parcelId/dossier` (PropertyDossier workbench tab -- WIRED TO REAL API)
- API: `DossierController.cs` (1370 lines, notes CRUD, composed parcel dossier, county isolation)
- DTOs: `ParcelDossierDetailsDto.cs`, `DossierDocumentDtos.cs`
- Entities: `DossierDocument.cs`, `DossierNote.cs`
- Service: `dossierService.ts` (412 lines)
- Hook: `useDossierDetails.ts`

**deus**: Zero matches. Not present in codebase.

**academy**: Zero matches. No existing Academy infrastructure. Must be built new.

**codex**: EXISTS but as "Codex 3-6-9" quality framework, NOT educational content:
- `AdvancedCodexDashboard.tsx` -- quality score visualization dashboard
- `CodexAdminPanel.tsx`, `CodexTrendAnalysis.tsx`, `NotificationPreferences.tsx`
- Backend: `Codex369Controller.cs`, `CodexExecutiveReportService.cs`, `CodexReportsController.cs`
- Route: `/codex/preferences`
- Hooks: `useCodexStatus.ts`, `useCodexSignalR.ts`
- These could be REPURPOSED for Academy "codex" feature but would need UI redesign.

**county studio**: Zero matches. Not present.

### 2. "parcel"

Extensively used throughout active codebase:
- `PropertySearch.tsx` -- parcel search/browse page
- `PropertyWorkbench.tsx` -- parcel-context hub with 6 tabs
- `parcelContext.ts` -- React context for active parcel
- `ParcelContextBanner.tsx` -- context banner component
- `ParcelContextHeader.tsx` -- header in workbench
- `ParcelGeometry.cs` -- backend entity
- `pacsService.ts` -- PACS parcel data API client
- All workbench tabs consume parcel context

### 3. "gis"

Active codebase:
- `GISModule.tsx` (232 lines) -- parcel viewer module in Atlas suite
- `PropertyAtlas.tsx` (527 lines) -- map layers (boundary, zoning, flood, aerial)
- `atlasService.ts` (307 lines) -- GIS API service
- `LayerWorksModule.tsx` (319 lines) -- advanced layer management
- `TerraQueryModule.tsx` (330 lines) -- spatial queries
- `TerraSketchModule.tsx` (291 lines) -- geometry editing
- `TerraExportModule.tsx` (299 lines) -- GIS data export (Shapefile, GeoJSON, KML)

QUARANTINE:
- `gispro/` government-core module (document classifier, search)
- GIS integration reports in root-artifacts

### 4. "pulse"

Only in QUARANTINE and design system:
- CSS animation pulse classes in design system
- `terra-legislative-pulse` government-core module in QUARANTINE
- TerraFusion status displays use "pulse" for live indicators
- No "county pulse" dashboard exists -- MUST BE BUILT

### 5. "report" / "pdf"

Active codebase:
- `TerraPrintModule.tsx` (306 lines) -- Map printing & PDF export with 6 templates (field card, full parcel report, neighborhood map, comp sheet, BOE appeal packet, GIS extract)
- `CodexReportsController.cs` (321 lines) -- executive Codex reports
- `EliteSystemReportController.cs` -- system report endpoints
- `AnalyticsReportingService.cs` (863 lines) -- analytics reports
- `CitizenVerifiableReportService.cs` -- citizen-facing reports

QUARANTINE:
- `CostReportPDFExport.tsx`, `CostBreakdownPdfExport.tsx` -- PDF export components
- `ExportPdfDialog.tsx`, `QuickExportButton.tsx`
- `pdfGenerator.ts` -- utility for generating PDFs
- `ProjectProgressReport.tsx` -- project reports
- `reportController.ts`, `reportRoutes.ts` -- report server routes
- `ReportComposer.tsx` workbench in shock-and-awe

### 6. "assessment"

Active codebase:
- `PropertyAssessment.cs` (entity), `PropertyAssessmentModels.cs`
- `PropertyAssessmentAIModel.cs` -- AI model for assessment
- `AssessmentRecommendationEngine.cs` -- AI recommendations
- `PropertyValuationService.cs` (328 lines) -- valuation logic
- All valuation prompts reference assessment methodology
- Frontend `PropertySummary` shows assessed/market/land/improvement values
- Scenes/stores reference assessment in ratio study context

QUARANTINE:
- Full assessment tools in terra-agent MCP tools
- BOE appeal assessor in shock-and-awe

### 7. "exemption"

Active codebase:
- `ComplianceService.cs` references exemption processing
- Property entity has type codes including 'E' (Exempt)
- Referenced in levy/tax modules

QUARANTINE:
- `terra-levy` models include exemption fields
- Valuation policy documents discuss exemption types
- PACS stored procedures handle exemptions

### 8. "ratio study"

Active codebase:
- `sceneStore.ts` -- mentions ratio study in scene definitions
- `sceneStore.test.ts` -- test references

QUARANTINE (significant):
- `useRatioStudy.ts` hook (23 lines)
- `RatioStudyBenton.tsx` page (86 lines)
- `RatioStudyDesigner.tsx` workbench (22 lines -- stub)
- `ratio-study.sample.json` -- Benton demo data
- `statistics.yaml` -- OpenAPI spec for ratio study endpoints
- Referenced in valuation policy docs

### 9. "sales validation"

QUARANTINE only:
- `sales_verification_agent.py` in terra-flow-production
- `sales_verification_integrator.py` in terra-flow-production
- Valuation assistant prompt covers sales validation methodology

### 10. "new construction"

QUARANTINE only:
- `NewConstructionCertificateGenerator.sql` in BS_PACS
- `Jefferson_GetNewConstruction.sql` in BS_PACS
- `SNRwithNC.sql` (Sales Not Reflecting New Construction) in BS_PACS
- Referenced in workflow overview docs

### 11. "income analysis" / "income approach"

Active codebase:
- `IncomeForgeModule.tsx` (636 lines) -- direct capitalization calculator in TerraForge suite

QUARANTINE:
- `dataAnalysisAgent.ts` references income approach
- Terra-levy models include income analysis fields
- RAG valuation policy covers income approach methodology
- Cost approach / income approach patterns in commercial database SQL

### 12. "cost approach"

Active codebase:
- `CostForgeModule.tsx` (954 lines) -- full cost calculator
- `CostForgeService.cs`, `CostForgeAIService.cs` -- backend services
- `CostForgeController.cs`, `CostForgeTestController.cs`
- `costForgeApiService.ts` (152 lines)
- `useCostForgeAPI.ts` hook

QUARANTINE:
- `CostApproachController.cs`, `CostApproachModels.cs`, `CostApproachService.cs` in BS_PACS
- Full cost matrix data in `data/cost-matrices/`

### 13. "boe" (Board of Equalization)

Active codebase:
- `AppealForgeModule.tsx` (613 lines) -- BOE appeal preparation
- `DefensePacketsModule.tsx` (262 lines) -- defense packet assembly
- `appeals-advisor.txt` -- AI prompt for BOE appeal advising
- TerraPrint has "BOE Appeal Packet" template

QUARANTINE:
- `BOEArguer.ts` (404 lines) -- Claude-powered BOE argument generator with structured case details
- Multiple references in shock-and-awe components

### 14. "growth corridor"

Active codebase:
- `florida-conquest-dashboard.tsx` -- references growth corridor analysis
- `scripts/ai-smoke.ts` -- references growth corridor in AI smoke tests

QUARANTINE:
- Florida/Arizona strategy docs reference growth corridors

### 15. "handoff"

Active codebase: None in active code.

QUARANTINE (significant):
- `handoffs/` directory with 3 JSON handoff files (Platform, Frontend, Security)
- `templates/handoff-template.json` -- structured handoff schema
- `AI_AGENT_HANDOFF_CONTEXT.md` -- AI agent handoff documentation
- `EXECUTIVE_HANDOFF_PACKAGE.md` -- executive handoff package
- `HANDOFF_STATUS.md` -- handoff tracking
- `KNOWLEDGE_TRANSFER_PACKAGE.md`
- `AI_AGENT_HANDOFF_PROMPT.md` in workspace-optimization

### 16. "property detail" / "property card"

Active codebase:
- `PropertySummary.tsx` (168 lines) -- BentoGrid property overview card
- `PropertyDossier.tsx` -- detailed property view with sections
- `PropertySection` component within dossier (address, parcel, type, owner)

QUARANTINE:
- `PropertyDetailsPage.tsx` in terrabuild-modernization
- `import_property_details.py` -- property data import

---

## EXISTING FRONTEND ROUTES (Router.tsx)

| Route | Component | Status | Demo Relevance |
|-------|-----------|--------|----------------|
| `/` | Desktop (OS windowed surface) | Live | OS demo |
| `/home` | ShellHome (tile launcher) | Live | OS demo |
| `/property` | PropertySearch | Live | Atlas |
| `/property/:parcelId` | PropertyWorkbench (6 tabs) | Live | Atlas (dossier) |
| `/property/:parcelId/forge` | PropertyForge tab | Live | Atlas |
| `/property/:parcelId/atlas` | PropertyAtlas tab | Live | Atlas |
| `/property/:parcelId/dais` | PropertyDais tab | Live | Atlas |
| `/property/:parcelId/dossier` | PropertyDossier tab | Live | Atlas (dossier) |
| `/property/:parcelId/pilot` | PropertyPilot tab | Live | OS |
| `/forge` | ForgeSuiteHome (6 modules) | Live | Atlas+Academy |
| `/atlas` | AtlasSuiteHome (7 modules) | Live | Atlas |
| `/dais` | DaisSuiteHome | Live | OS |
| `/dossier` | DossierSuiteHome (6 modules) | Live | Atlas |
| `/gpt` | GptSuiteHome (GPT Studio + Builder) | Live | Academy (ask) |
| `/pilot` | PilotHome | Live | OS |
| `/trace` | TraceHome | Live | OS |
| `/canon` | CanonHome | Live | OS |
| `/gen2/dossier` | TerraDossierGen2 | Live | Atlas |
| `/gen2/terraforge` | TerraForgeGen2 | Live | Atlas |
| `/marketplace` | TerraFusionMarketplace | Live | OS |
| `/monitoring` | Monitoring | Live | OS |
| `/codex/preferences` | NotificationPreferences | Live | Academy? |

---

## EXISTING BACKEND API ENDPOINTS (Key ones for demo)

| Endpoint | Controller | Purpose |
|----------|-----------|---------|
| `GET /api/dossier/parcels/{id}/details` | DossierController | Full parcel dossier (property, valuation, levies, notes) |
| `POST /api/dossier/notes` | DossierController | Create notes (CRUD) |
| `GET /api/costforge/*` | CostForgeController | Cost approach calculations |
| `GET /api/property-valuation/*` | PropertyValuationController | Property valuation endpoints |
| `GET /api/codex-reports/*` | CodexReportsController | Executive Codex reports |
| `GET /ops/pacs/*` | PACS endpoints | Harris PACS property data |

---

## DATA FIXTURES & SEED DATA

| Asset | Location | Content |
|-------|----------|---------|
| Benton cost matrix (983 entries) | `data/cost-matrices/benton_county_data.json` | Building types, costs, regions |
| Cost matrix (42 entries) | `data/cost-matrices/benton_cost_matrix.json` | 14 building types x 3 regions |
| Live cost matrix | `data/cost-matrices/benton_cost_matrix_live.json` | Current production data |
| Ratio study sample | `QUARANTINE/.../demo/benton/ratio-study.sample.json` | Demo ratio data |
| Levy forecast sample | `QUARANTINE/.../demo/benton/levy-forecast.sample.json` | Demo levy data |
| Cohorts data | `QUARANTINE/.../demo/benton/cohorts.json` | Cohort analysis demo |
| Database seeder | `backend/src/TerraFusion.AI/Seeds/BentonCostMatrixSeeder.cs` | Cost matrix seeding |
| Benton County SQL | `database/migrations/002_BentonCountyData.sql` | County data migration |

---

## AI/GPT ASSETS FOR ACADEMY

| Asset | Location | Lines | Notes |
|-------|----------|-------|-------|
| property-assessor.txt | `backend/src/TerraFusion.AI/Prompts/PropertyAssessment/` | ~80 | Expert assessor prompt with function calling |
| valuation-assistant.txt | same | ~80 | 3 approaches to value, market analysis |
| cama-expert.txt | same | N/A | CAMA system expertise |
| appeals-advisor.txt | same | N/A | BOE appeal advising |
| tax-calculator.txt | same | N/A | Tax calculation assistance |
| permit-assistant.txt | `...Prompts/CitizenServices/` | N/A | Permit guidance |
| compliance-checker.txt | same | N/A | FISMA compliance |
| county-assistant.txt | `...Prompts/CoreGovernment/` | N/A | General county ops |
| document-summarizer.txt | same | N/A | Document analysis |
| meeting-minutes.txt | same | N/A | Meeting notes |
| policy-advisor.txt | same | N/A | Policy research |
| budget-analyst.txt | `...Prompts/Finance/` | N/A | Budget analysis |
| revenue-forecaster.txt | `...Prompts/FinanceAndBudget/` | N/A | Revenue forecasting |
| procurement-assistant.txt | same | N/A | Procurement guidance |
| RAG: residential valuation policy | `QUARANTINE/.../rag/benton-cama/policies/` | 134 | Benton valuation policy |
| RAG: workflow overview | same | 181 | Assessment workflow |
| RAG: CAMA overview | `QUARANTINE/.../rag/benton-cama/manuals/` | 77 | Benton CAMA manual |

---

## MAPPING TO DEMO EXPERIENCES

### Atlas (Property Dossier + County Pulse)

**Immediate (HIGH reuse, already wired):**
- PropertySearch -> PropertyWorkbench -> PropertyDossier (REAL API backend)
- PropertySummary (values, owner, type in BentoGrid)
- PropertyAtlas tab (SVG map, layer selection)
- DossierController (1370-line API with county isolation)
- AtlasSuiteHome (7 GIS modules)
- DossierSuiteHome (6 document modules)
- CostForgeModule (cost calculator)
- AppealForgeModule (BOE appeals)
- TerraPrintModule (6 print/PDF templates)

**Needs work (MEDIUM):**
- County Pulse dashboard DOES NOT EXIST -- must be built
- Real GIS map integration (currently SVG schematic only)
- AnalyticsReportingService exists but no "pulse" UI

### Academy (Codex + Ask)

**Immediate (HIGH reuse):**
- GptSuiteHome (GPT Studio, Builder, Marketplace, Analytics)
- 14 government AI prompts ready to deploy
- 20 pre-built GPT configurations in catalog
- RAG knowledge base (392 lines of Benton CAMA content)
- GPTBuilderModule (341 lines, custom GPT creation)
- RAGDatasetsModule (438 lines, dataset management)

**Needs work:**
- "Academy" framing/wrapper does not exist
- Codex dashboard exists but is quality-metrics-oriented, not educational
- "Ask" interface: ATLAS.tsx component exists (floating orb chat) but stub-only
- Need to wire prompts to actual LLM backend for demo

### TerraFusion OS (Action/Intelligence Handoff)

**Immediate (HIGH reuse):**
- ShellHome (macOS Tahoe launcher with suite grid)
- Desktop surface (windowed OS experience)
- PilotConsole + PilotHome (agentic task orchestration)
- PropertyPilot tab (tool execution log)
- Suite registry (constitutional governance of 5 suites + 3 OS features)

**Needs work:**
- Handoff UI does not exist in active code (only QUARANTINE templates)
- BOEArguer agent (404 lines, Claude-powered) in QUARANTINE needs extraction
- terra-agent MCP tools (1584 lines, 11 tools) in QUARANTINE
- Handoff template JSON schema exists but no frontend to consume it

---

## SUMMARY

The codebase is remarkably well-provisioned for the Atlas demo -- the Property Workbench, Dossier, and Suite Homes are production-quality with real API wiring. The Academy demo needs a new wrapper around existing GPT/prompt/RAG assets. The OS handoff demo needs a new UI surface but can leverage existing PilotConsole patterns and QUARANTINE agent code.

**Critical gaps:**
1. County Pulse dashboard (no existing UI)
2. Academy educational wrapper (no existing UI)
3. Handoff visualization (no active code, only QUARANTINE templates)
4. Real GIS map rendering (currently SVG schematic only)
5. LLM backend wiring for Academy "ask" (prompts exist, no live demo endpoint)
