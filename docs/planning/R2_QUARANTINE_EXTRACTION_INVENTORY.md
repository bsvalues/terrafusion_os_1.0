# R2 Quarantine Extraction Inventory

**Date:** March 7, 2026
**Purpose:** Catalog extractable domain logic from quarantine for the R2 Assessor Suite extraction program
**Method:** Direct source reading, file classification, line counts

---

## Summary

| Quarantine Source | LOC | Real Domain Logic | Extraction Value |
|-------------------|-----|-------------------|-----------------|
| `applications/terra-flow-production/` | 183,825 (Python) | Property valuation agent, assessment API, spatial service, data governance, sync service, DB models | **HIGH** |
| `BS_PACS/` | 86,558 (SQL) | 2,086 stored procedures, 2,133 table definitions, views, functions — actual Harris PACS 9.0 database | **CRITICAL** (reference only — county approval required) |
| `terra-flow/` | ~14,000 (TS/Python) | Privacy engines (DP, FL, HE), WebSocket service | **LOW** (no Assessor logic) |
| `terrafusion-atlas/` | TBD | ArcGIS integration, layer definitions | **MEDIUM** |
| `terra-levy/` | TBD | Levy calculation logic | **MEDIUM** |
| `terra-collections/` | TBD | Tax collection workflows | **LOW** (R3) |

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

## P1: `terrafusion-atlas/` — GIS Components (Pending Deep Read)

To be inventoried. Expected: ArcGIS REST service integration, layer definitions, map rendering components.

---

## P1: `terra-levy/` — Levy Engine (Pending Deep Read)

To be inventoried. Expected: Statutory levy calculation logic, rate tables, RCW formula implementations.

---

## Extraction Priority Matrix

| Priority | Source | Target Suite | Method | Estimated Effort |
|----------|--------|-------------|--------|-----------------|
| **1** | `terra-flow-production/property_valuation_agent.py` | TerraForge | Port Python ML models to C# ML.NET or keep as Python microservice | Medium |
| **2** | `terra-flow-production/api/assessment.py` + `models.py` | TerraForge | Port Flask routes to .NET controllers, SQLAlchemy models to EF Core | Medium |
| **3** | `BS_PACS` tables/SPs (reference) | All suites | Study data structures, build compatible entities | Low (reference only) |
| **4** | `terra-flow-production/api/spatial*` | TerraAtlas | Port spatial queries to PostGIS | Medium |
| **5** | `terra-flow-production/data_governance/` | TerraDais | Port sovereignty/classification to .NET | Low |
| **6** | `terra-flow/privacy engines` | TerraFusion.Security | Port Python DP/FL/HE to .NET | Low (nice-to-have) |

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

The quarantine is **not as rich as previously claimed**:
- `terra-flow/` (the originally cited "gold mine") is mostly scaffolding — no Assessor logic
- `terra-flow-production/` (under `applications/`) IS the real app — 183K lines Python with actual domain logic
- `BS_PACS/` is the actual Harris PACS database — 86K lines SQL, 2,086 SPs, 2,133 tables — but is **reference only** (county approval required for any use)
- The R2 extraction program will produce real results, but it's a porting effort, not just "move files"

---

*Classification: Planning document*
*Source: Direct quarantine directory reads, file-by-file classification*
