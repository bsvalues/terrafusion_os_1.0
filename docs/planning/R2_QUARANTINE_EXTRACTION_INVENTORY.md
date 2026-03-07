# R2 Quarantine Extraction Inventory

**Date:** March 7, 2026
**Purpose:** Catalog extractable domain logic from quarantine for the R2 Assessor Suite extraction program
**Method:** Direct source reading, file classification, line counts

---

## Summary

| Quarantine Source | LOC | Real Domain Logic | Extraction Value |
|-------------------|-----|-------------------|-----------------|
| `costforge-ai-workspace/` | ~41 MB (Node/React/Express/PG) | **THE GOLD MINE** — complete CostForge platform with real Benton County cost matrices, 10+ MCP agents, Drizzle ORM schema, 30+ API routes, 94,149 properties | **CRITICAL — P0** |
| `costforge-ai/` | ~1.1 MB (Python) | CostForge AI engine — building cost matrices, regional multipliers, depreciation tables, quality adjustments, batch processing | **CRITICAL — P0** |
| `applications/terraforge-suite/` | ~1,120 (TypeScript) | **USPAP three-approach valuation**: sales comparison (440 lines), income/direct cap (295 lines), reconciliation (383 lines) — complete appraisal methodology | **CRITICAL — P0** |
| `applications/terra-build-actual/` | ~117 (TypeScript) | Marshall-Swift cost engine facade — base cost × region × quality × condition × age calculation | **CRITICAL — P0** |
| `marketplace/government-core/terra-levy/` | 1,118 (TypeScript) | MCP tax calculation server — 9 tools, 7 Zod schemas, property assessment/tax calculation/compliance/forecasting/equity analysis (mixed with marketing fiction) | **HIGH** (extract real tax logic, discard "quantum consciousness") |
| `applications/terra-flow-production/` | 183,825 (Python) | Property valuation agent (ML: RandomForest, GradientBoosting, ElasticNet), assessment API, spatial service, data governance, sync service, DB models | **HIGH** |
| `BS_PACS/` | 86,558 (SQL) | 2,086 stored procedures, 2,133 table definitions, views, functions — actual Harris PACS 9.0 database | **REFERENCE ONLY** (county approval required) |
| `terra-flow/` | ~14,000 (TS/Python) | Privacy engines (DP, FL, HE), WebSocket service | **LOW** (no Assessor logic) |
| `BS_PACS/Database/` | ~5,000+ (C#) | **REAL C# .NET Core API** — DataSyncService (actual PACS connector via Dapper), CostApproachController, CostApproachModels (CostFactor, DepreciationRate, LandValue), BillingService, JWT auth, Hangfire, ~10K county data files | **HIGH** (same tech stack as production!) |
| `terrafusion-atlas/` | ~2,000 (Python/JSON) | Metadata indexing framework with Python automation scripts — **NOT GIS/ArcGIS** (empty registries) | **LOW** |
| `terra-levy/` | 203 lines (MD) | **100% DEAD** — only a copilot instructions file, zero implementation | **NONE** |
| `terra-collections/` | ~2,000 (Python) | Privacy engines (DP, FL, HE) — same tier_17/18 as terra-flow | **LOW** (nice-to-have for TerraFusion.Security) |

---

## P0: `costforge-ai-workspace/` — THE CostForge Gold Mine (41 MB)

**Tech stack:** Node.js / React 18 / Express / PostgreSQL / Drizzle ORM / MCP Agent Framework
**Port:** 5000 (single-port architecture)

### REAL DOMAIN LOGIC (Extract First)

| Category | Files | What It Contains |
|----------|-------|-----------------|
| **Cost Matrices** | `benton_cost_matrix.json` (3.4KB), `benton_cost_matrix_live.json` (21KB), `benton_cost_matrix_proper.json` (17KB) | Real Benton County cost data — 7 building types (A1 Agricultural, C1 Commercial Retail, C4 Warehouse, I1 Industrial, R1 Residential SF, R2 Residential MF, S1 Special Purpose), 3 regions (Central/East/West Benton), matrix year 2025, matrix IDs from actual PACS data |
| **County Data** | `benton_county_data.json` (30KB), `benton_county_data_summary.json` | 94,149 Benton County property records |
| **MCP Agents** | `server/mcp/agents/` (10+ agents) | conversionAgent (Marshall Swift→CFT), costEstimationAgent, dataAnalysisAgent, dataQualityAgent, complianceAgent, geospatialAnalysisAgent, documentProcessingAgent |
| **DB Schema** | `shared/schema.ts` | Drizzle ORM tables: properties, improvements, costMatrix, users, sessions, agentStatus, calculationHistory |
| **API Routes** | `server/routes/` (30+ modules) | Cost calculation, data import/export, property management, FTP integration |
| **Cost Engine** | `server/services/` | Building cost estimation with quality/complexity factors, material breakdown |

### EXTRACTION PLAN

1. **Cost matrices** → Seed into `TerraFusion.Data` EF Core entities (CostMatrix table with building type, region, base cost, adjustment factors)
2. **MCP agents** → Port agent logic to `TerraFusion.AI` services (conversionAgent → CostMatrixConversionService, costEstimationAgent → CostEstimationService)
3. **Drizzle schema** → Map to existing EF Core entities or create new ones in `TerraFusion.Data/Entities/`
4. **API routes** → Port to `CostForgeController.cs` endpoints (already has scaffolding with auth + county isolation)
5. **County data** → Import into PostgreSQL via EF Core seed or migration

---

## P0: `costforge-ai/` — CostForge AI Engine (Python)

**Tech stack:** Python 3 / pandas / numpy / asyncio

### Core Engine: `core-engine/construction_cost_engine.py`

**Real calculation logic with:**

| Component | Values | Use |
|-----------|--------|-----|
| **Building cost matrices** | Residential $150/sqft, Commercial $200, Industrial $120, Government $180 — with breakdown (foundation, framing, roofing, exterior, interior, mechanical, electrical, plumbing) | Base cost calculation |
| **Regional multipliers** | Urban 1.20x, Suburban 1.00x, Rural 0.85x | Location adjustment |
| **Quality factors** | Excellent 1.25x, Good 1.10x, Average 1.00x, Fair 0.85x, Poor 0.70x | Quality adjustment |
| **Depreciation tables** | 2% annual rate, max 60% depreciation, condition factors (new 1.00 → poor 0.50) | Age/condition depreciation |
| **Inflation** | 3% annual construction inflation, base year 2024 | Replacement cost |
| **Batch processing** | County-wide assessment capability for 94,149 properties | Bulk valuation |

### Data Types (Port to C#)

```python
@dataclass
class ConstructionCostRequest:
    parcel_id: str
    building_type: str       # residential, commercial, industrial, government
    square_footage: float
    year_built: int
    quality_grade: str       # excellent, good, average, fair, poor
    region: str              # urban, suburban, rural
    condition: str           # new, good, average, fair, poor
    stories: Optional[int]
    basement: Optional[bool]
    garage: Optional[bool]

@dataclass
class ConstructionCostResult:
    parcel_id: str
    base_construction_cost: float
    replacement_cost: float
    depreciated_value: float
    cost_per_sqft: float
    regional_factor: float
    quality_factor: float
    age_factor: float
    confidence_score: float
    processing_time_ms: float
    cost_breakdown: Dict[str, float]
    recommendations: List[str]
```

### EXTRACTION PLAN

Port `CostForgeEngine.calculate_construction_cost()` to C# in `TerraFusion.AI/Services/CostApproachService.cs`. The algorithm is straightforward:
1. Look up base cost per sqft by building type
2. Apply regional multiplier
3. Apply quality factor
4. Calculate depreciation from age and condition
5. Apply inflation adjustment
6. Produce breakdown with confidence score

---

## P0: `applications/terra-flow-production/` — The Real Assessor App

**Tech stack:** Python 3 / Flask / SQLAlchemy / PostgreSQL / scikit-learn / GeoPandas / Shapely
**Total:** 436 Python files, 183,825 lines

### REAL DOMAIN LOGIC (Extract)

| File | Lines | Classification | What It Contains |
|------|-------|---------------|-----------------|
| `ai_agents/property_valuation_agent.py` | 2,099 | **REAL** | ML-based property valuation with RandomForest, GradientBoosting, ElasticNet. Capabilities: estimate_property_value, train_valuation_model, value_trend_analysis, comp_based_valuation, valuation_explainability, batch_valuation |
| `ai_agents/geospatial_analysis_agent.py` | ~500+ | **REAL** | Geospatial analysis with GeoPandas/Shapely |
| `ai_agents/anomaly_detection_agent.py` | ~400+ | **REAL** | Assessment anomaly detection |
| `ai_agents/data_validation_agent.py` | ~400+ | **REAL** | Data quality validation |
| `ai_agents/predictive_analytics_agent.py` | ~500+ | **REAL** | Predictive analytics for property values |
| `api/assessment.py` | 608 | **REAL** | Assessment API routes — property CRUD, assessment visualization, spatial queries against PostgreSQL |
| `api/spatial.py` | 270 | **REAL** | Spatial API — geometry queries |
| `api/spatial_service.py` | 888 | **REAL** | Spatial analysis service — GeoPandas/Shapely integration |
| `api/data_query.py` | ~300+ | **REAL** | Data query endpoints |
| `api/database.py` | ~200+ | **REAL** | Database connection/config |
| `models.py` | 566 | **REAL** | SQLAlchemy models — Property, Assessment, TaxRecord, User, Role, Permission (PostgreSQL with JSONB) |
| `property_model.py` | ~300+ | **REAL** | Property domain model |
| `data_governance/data_classification.py` | ~200+ | **REAL** | Data classification rules |
| `data_governance/data_sovereignty.py` | ~200+ | **REAL** | County data sovereignty enforcement |
| `data_conversion/conversion_manager.py` | ~300+ | **REAL** | Data format conversion |
| `sync_service/models/sync_tables.py` | ~200+ | **REAL** | Sync table definitions |
| `sync_service/models.py` | ~200+ | **REAL** | PACS sync models |

### INFRASTRUCTURE (Useful reference)

| File | Lines | Classification |
|------|-------|---------------|
| `api/auth.py` | ~200 | Auth patterns (reference) |
| `api/gateway.py` | ~200 | API gateway patterns (reference) |
| `api/connection_manager.py` | ~200 | Connection management (reference) |
| `config_loader.py` | ~100 | Config loading patterns (reference) |

### EXTRACTION PLAN

**Target R2 suites and what to extract:**

1. **TerraForge** ← `property_valuation_agent.py` + `api/assessment.py`
   - ML valuation models (RandomForest, GradientBoosting, ElasticNet)
   - Comp-based valuation logic
   - Value trend analysis
   - Batch valuation capability
   - Port from Python/Flask to C#/.NET 8 service in `TerraFusion.AI`

2. **TerraAtlas** ← `api/spatial.py` + `api/spatial_service.py` + `geospatial_analysis_agent.py`
   - Spatial query patterns
   - GeoPandas/Shapely geometry operations
   - Port to PostGIS queries or keep as Python microservice

3. **TerraDais** ← `data_governance/` + assessment models
   - Data classification → certification workflow
   - Data sovereignty → county isolation enforcement
   - Assessment lifecycle → permit/appeal/notice workflows

4. **TerraDossier** ← `sync_service/` + data conversion
   - Sync table patterns → document sync
   - Data conversion → document format conversion

---

## P0: `BS_PACS/` — Harris PACS 9.0 Database Schema (REFERENCE ONLY)

**CRITICAL: Per CLAUDE.md, NEVER modify Harris PACS integration without county approval.**

**Tech stack:** SQL Server / T-SQL
**Total:** 86,558 lines of SQL

### Contents

| Category | Count | Examples |
|----------|-------|---------|
| **Stored Procedures** | 2,086 | `ARBGetCompGridSales`, `ARBGetExemptions`, `ARBGetProperty`, `ARBGetValues`, `ARBGetNoticeValues`, `ARBGetTaxPreview`, `ARBAutoSchedule` |
| **Tables** | 2,133 | `PARCELSANDASSESS`, `RES_base_feature_matrix_mapped`, `RES_depre_matrix`, `LEASEHOLD`, `GISLicense`, `ProtestNotice`, `PARCEL_PACS` |
| **Views** | TBD | Assessment/tax views |
| **Functions** | TBD | Calculation functions |

### Key Domain Stored Procedures (by Assessor function)

| Domain | Procedures (examples) | Extraction Use |
|--------|----------------------|----------------|
| **ARB (Appeal/Review Board)** | `ARBGetCompGridSales`, `ARBGetExemptions`, `ARBGetHeader`, `ARBGetHearing`, `ARBGetNoticeValues`, `ARBGetProperty`, `ARBGetTaxPreview`, `ARBGetValues`, `ARBAutoSchedule`, `ARBCopyHearing` | Understand appeal workflow data model for TerraDais TerraAppeal module |
| **Assessment** | `AI`, `AILY`, `AIE`, `AIN`, `AIOPH`, `AISales`, `AP`, `APLY`, `APCS`, `APCSALES`, `APSales` | Understand assessment data structures for TerraForge |
| **Accounting** | `ACCTLM`, `AGRollbacks_1D1_rpt` | Understand levy/accounting for TerraDais TerraLevy |

### Key Tables

| Table | Extraction Use |
|-------|----------------|
| `PARCELSANDASSESS` | Parcel + assessment join structure — reference for TerraForge entity design |
| `RES_base_feature_matrix_mapped` | **Residential cost matrix** — reference for CAMA cost approach |
| `RES_depre_matrix` | **Depreciation matrix** — reference for depreciation calculations |
| `LEASEHOLD` | Leasehold property tracking — reference for income approach |
| `ProtestNotice` | Protest/appeal notice structure — reference for TerraDais TerraAppeal |
| `GISLicense` | GIS licensing — reference for TerraAtlas |
| `PARCEL_PACS` | Core parcel table — reference for all suites |

### EXTRACTION RULES

1. **DO NOT copy PACS code** — it's proprietary Harris/Tyler technology
2. **USE AS REFERENCE** — understand data structures, field names, relationships
3. **BUILD COMPATIBLE** — new TerraFusion services should produce data compatible with PACS import/export
4. **COUNTY APPROVAL REQUIRED** — any direct PACS integration changes need county sign-off per CLAUDE.md

---

## P0: `applications/terraforge-suite/` — USPAP Three-Approach Valuation (TypeScript)

**Tech stack:** TypeScript / USPAP-aligned appraisal methodology
**Total:** 1,120 lines across 3 files — complete three-approach valuation engine

This is the **most domain-critical find** — complete USPAP-compliant appraisal methodology ready for extraction.

### Sales Comparison Approach (`harness/src/approaches/sales.ts` — 440 lines)

| Function | What It Does |
|----------|-------------|
| `runSalesApproach()` | Main execution — adjusts comparable sales to subject property |
| `calculateAdjustments()` | GLA, lot size, age, condition, location adjustments |
| `calculateWeight()` | Weights comparables by adjustment magnitude |
| `determineConfidence()` | Confidence scoring based on comp quality |
| `generateFlags()` | Quality control flags for review |
| `generateExplanation()` | Narrative explanation of analysis |

**Output:** Indicated value via median, weighted average, bracketed mean with audit events.

### Income Approach (`harness/src/approaches/income.ts` — 295 lines)

| Function | What It Does |
|----------|-------------|
| `runIncomeApproach()` | Direct capitalization: Value = NOI / Cap Rate |
| `extractCapRate()` | Market-extracted capitalization rates |
| `generateExplanation()` | Detailed calculation narrative |

**Calculation chain:** Potential Gross Income → Vacancy → Effective Gross Income → Operating Expenses (taxes, insurance, utilities, maintenance, management, reserves) → NOI → Cap Rate → Indicated Value

### Reconciliation (`harness/src/approaches/reconcile.ts` — 383 lines)

| Function | What It Does |
|----------|-------------|
| `runReconciliation()` | Combines all three approaches into final opinion of value |
| `calculateWeights()` | Adaptive weighting by property type and confidence |
| `calculateBracketedValue()` | Midpoint between approaches |
| `getPrimaryApproachValue()` | Selects highest-weighted approach |

**Property-type default weights:**
- Residential: 60% sales, 20% cost, 20% income
- Commercial: 20% sales, 30% cost, 50% income
- Industrial/Special: custom distributions

**Three reconciliation methods:** weighted average, bracketed, primary approach

### EXTRACTION PLAN

Already TypeScript — port to `TerraFusion.AI/Services/` as C# services:
1. `SalesComparisonService.cs` ← `sales.ts` (adjustment grid, comp weighting, confidence scoring)
2. `IncomeApproachService.cs` ← `income.ts` (NOI calculation, direct capitalization)
3. `ReconciliationService.cs` ← `reconcile.ts` (multi-approach synthesis, property-type weighting)
4. Wire through existing `CostForgeController.cs` or new `ValuationController.cs`
5. Expose via governed invoke path: pilotApi → PilotController → handler → endpoint

---

## P0: `applications/terra-build-actual/` — Marshall-Swift Cost Engine (TypeScript)

**Tech stack:** TypeScript
**File:** `server/services/costEngine/marshallSwift.ts` — 117 lines

Facade service for Marshall-Swift cost factors. Clean, extractable calculation:

```
Total Cost = Base Cost × Region Factor × Quality Factor × Condition Factor × Age Factor × Area
```

| Function | What It Does |
|----------|-------------|
| `getBaseCost()` | Base cost rates by building type |
| `getRegionFactor()` | Regional cost adjustment |
| `getQualityFactor()` | Quality level multiplier |
| `getConditionFactor()` | Condition-based adjustment |
| `calculateAgeFactor()` | Age bracket depreciation |
| `calculateCostEstimation()` | Full adjusted cost calculation |

### EXTRACTION PLAN

Merge with `costforge-ai/core-engine/construction_cost_engine.py` — both implement the same cost approach pattern. Port to single `CostApproachService.cs` in `TerraFusion.AI/Services/` with:
- Marshall-Swift factor tables from this file
- Regional/quality/depreciation matrices from the Python engine
- Real Benton County cost data from `costforge-ai-workspace/benton_cost_matrix*.json`

---

## HIGH: `marketplace/government-core/terra-levy/` — Tax Calculation MCP Server

**Tech stack:** TypeScript / MCP SDK / Zod validation
**File:** `index.ts` — 1,118 lines

**MIXED SIGNAL:** Contains real tax domain logic wrapped in marketing fiction ("quantum consciousness", "4D spatiotemporal analysis"). Extract the real parts, discard the fiction.

### REAL (Extract)

| Tool/Schema | What It Does |
|-------------|-------------|
| `terralevy_property_assessment` | Property tax assessment calculation |
| `terralevy_tax_calculation` | Tax computation with rate components |
| `terralevy_tax_compliance` | Regulatory compliance validation |
| `terralevy_tax_forecasting` | Revenue forecasting |
| `terralevy_equity_analysis` | Assessment fairness/uniformity analysis |
| `terralevy_tax_reporting` | Government report generation |
| `PropertyAssessment` schema | Zod-validated assessment input/output |
| `TaxCalculation` schema | Tax calculation with breakdowns |
| `TaxCompliance` schema | Compliance check structures |

### FICTION (Discard)

| Component | Why It's Fiction |
|-----------|-----------------|
| "Consciousness levels" (reactive → transcendent) | Marketing fiction, not domain logic |
| "Quantum optimization" (12x speedup) | No quantum computing present |
| "4D spatiotemporal analysis" | Standard time-series with marketing wrapper |
| `terralevy_consciousness_evolution` tool | Pure fiction |
| `terralevy_quantum_optimization` tool | Pure fiction |

### EXTRACTION PLAN

1. Extract Zod schemas → port to C# DTOs/validation in `TerraFusion.Core/DTOs/`
2. Extract real tax calculation logic → port to `TerraFusion.AI/Services/TaxCalculationService.cs`
3. Extract compliance validation → port to `TerraFusion.AI/Services/TaxComplianceService.cs`
4. Wire through existing `LevyCalculationController.cs` (already has auth + county isolation)
5. Discard all "consciousness" and "quantum" wrappers

---

## P1: `terra-flow/` — Visualization Shell (Low Extraction Value)

**Finding:** This is NOT the Assessor app. It's a visualization/privacy prototype.

| Category | Lines | Classification |
|----------|-------|---------------|
| Privacy engines (DP, FL, HE) | ~865 | **REAL** — Extractable to `TerraFusion.Security` |
| WebSocket service | ~811 | **REAL** — Reusable infra for SignalR replacement |
| React UI components | ~10,000 | **SCAFFOLDING** — "Quantum" dashboards, no domain logic |
| Achievement docs | ~500 | **DEAD CODE** — Marketing fiction |

**Extraction:** Only the privacy engines are worth extracting (differential privacy, federated learning, homomorphic encryption). These could enhance `TerraFusion.Security` for citizen data protection.

---

## UPGRADED: `BS_PACS/Database/` — Real C# .NET Core API (Same Stack!)

**Tech stack:** C# .NET Core / Dapper ORM / SQL Server / JWT / Hangfire / Azure Blob Storage

Not just SQL schemas — has a production-ready .NET backend:

| File | Classification | What It Contains |
|------|---------------|-----------------|
| `Services/DataSyncService.cs` | **REAL — CRITICAL** | Harris PACS 9.0 connector via Dapper. Reads prop_id, geo_id, market_value, owner_name from PACS SQL Server. Maps to TerraFusion schema. |
| `Models/CostApproach/CostApproachModels.cs` | **REAL** | `CostFactor` (building type, cost/sqft, material/labor), `DepreciationRate` (age-based %), `LandValue` (geography-based) |
| `Services/BillingService.cs` | **REAL** | 311 lines — payment processing, delinquency, revenue forecasting |
| `Program.cs` | **REAL** | ASP.NET Core with JWT, Hangfire (daily sync), Serilog, Azure Blob Storage |
| `PACS DATA/` | **REAL DATA** | ~10K files of actual Benton County property data |

**Extraction:** Already C#/.NET — port directly to production `TerraFusion.Data/Entities/` and `TerraFusion.AI/Services/`.

---

## DEAD: `terrafusion-atlas/` — Metadata Registry (NOT GIS)

Metadata indexing framework, NOT GIS/ArcGIS. Python scripts (classifier, validator) with empty registries. No map components, no spatial data. **Real GIS code does not exist in quarantine — TerraAtlas GIS must be built new.**

---

## DEAD: `terra-levy/` — Never Built

203-line copilot instructions file only. Zero implementation. TerraDais TerraLevy must be built from existing `LevyCalculationController.cs` and BS_PACS stored procedures.

---

## Extraction Priority Matrix

| Priority | Source | Target Suite | Method | Estimated Effort |
|----------|--------|-------------|--------|-----------------|
| **1** | `costforge-ai-workspace/benton_cost_matrix*.json` | TerraForge | Seed real cost matrices into EF Core CostMatrix entity | Low — data import |
| **2** | `terraforge-suite/harness/src/approaches/{sales,income,reconcile}.ts` | TerraForge | **CRITICAL** — Port USPAP three-approach valuation to C# services (SalesComparisonService, IncomeApproachService, ReconciliationService) | Medium — clean TypeScript, straightforward port |
| **3** | `costforge-ai/core-engine/construction_cost_engine.py` + `terra-build-actual/marshallSwift.ts` | TerraForge | Merge both cost engines into single `CostApproachService.cs` with Marshall-Swift factors | Medium — two sources, one target |
| **4** | `costforge-ai-workspace/server/mcp/agents/` | TerraForge | Port MCP agent logic to TerraFusion.AI services | Medium |
| **5** | `costforge-ai-workspace/shared/schema.ts` | TerraFusion.Data | Map Drizzle ORM schema to EF Core entities | Low — schema mapping |
| **6** | `marketplace/government-core/terra-levy/index.ts` | TerraDais | Extract real tax calculation/compliance/forecasting logic (discard "quantum" fiction), port to `TaxCalculationService.cs` | Medium — requires separating real from fiction |
| **7** | `terra-flow-production/property_valuation_agent.py` | TerraForge | Port Python ML models to C# ML.NET or keep as Python microservice | Medium-High |
| **8** | `terra-flow-production/api/assessment.py` + `models.py` | TerraForge | Port Flask routes to .NET controllers, SQLAlchemy models to EF Core | Medium |
| **9** | `BS_PACS/Database/` (C# .NET Core API) | TerraForge/TerraDais | Port DataSyncService, CostApproachModels, BillingService — **same stack** | Low-Medium — direct C# port |
| **10** | `BS_PACS` tables/SPs (reference) | All suites | Study data structures, build compatible entities | Low (reference only) |
| **11** | `terra-flow-production/api/spatial*` | TerraAtlas | Port spatial queries to PostGIS | Medium |
| **12** | `terra-flow-production/data_governance/` | TerraDais | Port sovereignty/classification to .NET | Low |
| **13** | `terra-flow/privacy engines` | TerraFusion.Security | Port Python DP/FL/HE to .NET | Low (nice-to-have) |

---

## Key Decision: Port vs. Microservice

The main quarantine asset (`terra-flow-production`) is **Python/Flask/SQLAlchemy**. The production backend is **.NET 8/EF Core**. Two strategies:

### Option A: Port to .NET (Recommended for R2)
- Rewrite domain logic in C# using existing TerraFusion.AI/TerraFusion.Data patterns
- Use PACS SQL schemas as reference for entity design
- Advantages: single stack, EF Core integration, existing auth/county isolation
- Disadvantage: manual porting effort

### Option B: Python Microservice (For ML-heavy components)
- Keep `property_valuation_agent.py` as Python microservice behind API gateway
- Call from .NET via HTTP/gRPC
- Advantages: preserve scikit-learn ML models, faster deployment
- Disadvantage: two stacks, additional deployment complexity

### Recommended: Hybrid
- Port assessment API routes and domain models to .NET (TerraForge/TerraDais)
- Keep ML valuation models as Python microservice behind gateway (TerraFusion.AI)
- Use PACS SQL as reference for all entity design

---

## Honest Assessment

The quarantine is **significantly richer than any single pass found**, with domain logic spread across 6+ directories:

**What's real and extractable (by value):**
1. `terraforge-suite/` — **CROWN JEWEL** — Complete USPAP three-approach valuation (sales comparison, income/direct cap, reconciliation) in clean TypeScript. 1,120 lines of pure domain logic with property-type-specific weighting, confidence scoring, and audit trails. This is THE appraisal methodology engine.
2. `costforge-ai-workspace/` — Complete CostForge platform with real Benton County cost matrices (7 building types, 3 regions, 2025 data), 10+ MCP agents, Drizzle ORM schema, 30+ API routes
3. `terra-build-actual/marshallSwift.ts` — Clean Marshall-Swift cost engine facade (117 lines) — merges with #4
4. `costforge-ai/core-engine/` — Real cost estimation algorithm with regional multipliers, quality factors, depreciation tables
5. `marketplace/government-core/terra-levy/` — Real tax calculation logic (9 tools, 7 Zod schemas) wrapped in "quantum consciousness" marketing fiction — extract real, discard fiction
6. `terra-flow-production/` (under `applications/`) — 183K lines Python with ML valuation agent (scikit-learn), assessment API, spatial service
7. `BS_PACS/Database/` — C# .NET Core API (same stack!) with DataSyncService, CostApproachModels, BillingService
8. `BS_PACS/` SQL — Actual Harris PACS 9.0 database schema (86K SQL, 2,086 SPs, 2,133 tables) — **reference only**

**What's NOT extractable:**
- `terra-flow/` (originally cited "gold mine") — mostly visualization scaffolding, no Assessor logic
- `terrafusion-atlas/` — metadata registry, NOT GIS
- `terra-levy/` — zero implementation (203 lines of copilot instructions)
- Achievement/marketing docs in quarantine — fiction
- "Quantum consciousness" wrappers in terra-levy MCP — fiction

**Bottom line:** R2 extraction is not just viable — it's stronger than expected. The quarantine contains a **complete USPAP-compliant appraisal methodology** (cost + sales + income + reconciliation), real county cost matrices, a Marshall-Swift engine, and tax calculation logic. The porting effort (TypeScript→C#, Python→C#) is straightforward because the domain logic is clean and well-structured. The terraforge-suite approaches are the most valuable find — they represent the actual Assessor methodology that R2 needs to deliver.

---

*Classification: Planning document*
*Source: Direct quarantine directory reads, file-by-file classification*
