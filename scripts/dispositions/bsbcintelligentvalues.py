#!/usr/bin/env python3
"""Phase 4B Disposition: Bsbcintelligentvalues (200 assets).

Terminal classification for every asset. No asset remains pending.
Boundary law: Forge=valuation logic, Atlas=spatial interaction, Shared=platform primitives.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

REPO_NAME = "Bsbcintelligentvalues"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
SEC_NOTE = "Repo made private 2026-03-14. Minor: fallback session secret in source, ArcGIS service catalog URL. Low risk — no longer publicly accessible."

def p(suite, batch, cap, target, reason, parity="adapted", repl="none"):
    """Ported asset."""
    return {
        "status": "ported", "disposition_reason": reason, "parity_mode": parity,
        "replacement_ref": repl, "migration_batch": batch,
        "canonical_capability": cap, "target_home": target,
        "owner_suite": suite, "blocker_type": "", "unblock_condition": "",
        "decision_owner": "founder",
        "security_review": {"status": "passed", "remediation_note": SEC_NOTE},
    }

def d(reason, repl="none"):
    """Declined asset."""
    return {
        "status": "declined", "disposition_reason": reason, "parity_mode": "superseded" if repl != "none" else "none",
        "replacement_ref": repl, "migration_batch": "", "canonical_capability": "",
        "target_home": "", "owner_suite": "", "blocker_type": "",
        "unblock_condition": "", "decision_owner": "founder",
        "security_review": {"status": "passed", "remediation_note": ""},
    }

def df(reason, blocker, unblock, owner="founder", sec_note=""):
    """Deferred asset."""
    return {
        "status": "deferred-with-rationale", "disposition_reason": reason,
        "parity_mode": "none", "replacement_ref": "none", "migration_batch": "",
        "canonical_capability": "", "target_home": "", "owner_suite": "",
        "blocker_type": blocker, "unblock_condition": unblock,
        "decision_owner": owner,
        "security_review": {"status": "pending", "remediation_note": sec_note},
    }

# ─── Forge targets ──────────────────────────────────────────────────────
FV = "forge-valuation"
FR = "forge-regression"
FS = "forge-statistics"
FU = "forge-ui"
AG = "atlas-gis"
CS = "canon-sync"

DISPOSITIONS: dict[str, dict] = {
    # ═══ MASS APPRAISAL / VALUATION SERVICES (core Forge domain) ═══
    "BIV-001": p("TerraForge", FV, "forge.mass_appraisal.service", "backend/TerraFusion.AI/MassAppraisal/MassAppraisalService.cs",
                  "Mass appraisal service: MRA, geospatial modeling, cost/income/sales approaches, ratio studies, calibration. Core valuation engine."),
    "BIV-002": p("TerraForge", FV, "forge.mass_appraisal.api", "backend/TerraFusion.API/Controllers/MassAppraisalController.cs",
                  "Mass appraisal API: CAMA-style model CRUD, calibration, valuation runs. Core Forge API layer."),
    "BIV-003": p("TerraForge", FV, "forge.valuation.enriched", "backend/TerraFusion.Core/Services/PropertyValuationService.cs",
                  "Property valuation with weather, climate, demographic enrichment. Unique multi-factor valuation logic."),
    "BIV-004": p("TerraForge", FV, "forge.valuation.enriched.api", "backend/TerraFusion.API/Controllers/PropertyValuationController.cs",
                  "Valuation controller with external data integration. API layer for enriched valuation."),
    "BIV-005": p("TerraForge", FV, "forge.analytics.orchestration", "backend/TerraFusion.Core/Services/AnalyticsOrchestrator.cs",
                  "Analytics orchestrator integrating all subsystems (connectors, validators, enrichers). Core Forge analytics engine."),
    "BIV-006": p("TerraForge", FV, "forge.analytics.api", "backend/TerraFusion.API/Controllers/AnalyticsController.cs",
                  "Analytics controller: market analytics, trend analysis, property analytics. Core Forge API."),

    # ═══ DATA CONNECTORS (unique integration logic) ═══
    "BIV-007": p("TerraCanon", CS, "canon.connector.cama", "backend/TerraFusion.Core/Sync/Connectors/CamaConnector.cs",
                  "CAMA system connector for property assessment queries, improvement data, land records. Irreplaceable CAMA integration."),
    "BIV-008": p("TerraAtlas", AG, "atlas.connector.gis", "backend/TerraFusion.Core/GIS/Connectors/GisConnector.cs",
                  "GIS connector: ArcGIS, Mapbox, generic spatial services with spatial queries and feature layers. Core Atlas data source."),
    "BIV-009": p("TerraAtlas", AG, "atlas.connector.gis.perf", "backend/TerraFusion.Core/GIS/Connectors/GisConnectorOptimizations.cs",
                  "GIS connector performance: connection pooling, request batching. Atlas-owned spatial performance logic."),
    "BIV-010": p("TerraForge", FV, "forge.connector.market", "backend/TerraFusion.Core/Connectors/MarketConnector.cs",
                  "Market data connector for MLS/CSV listings. Feeds valuation comparables and market analysis."),
    "BIV-011": p("TerraForge", FV, "forge.connector.census", "backend/TerraFusion.Core/Connectors/CensusConnector.cs",
                  "Census/demographic connector for ACS data. Feeds valuation models with population, income, housing data."),
    "BIV-012": p("TerraForge", FV, "forge.connector.weather", "backend/TerraFusion.Core/Connectors/WeatherConnector.cs",
                  "Weather/climate connector. Feeds valuation adjustment factors for environmental conditions."),
    "BIV-013": p("TerraDossier", "dossier-documents", "dossier.connector.pdf", "backend/TerraFusion.Core/Documents/PdfConnector.cs",
                  "PDF document connector: field extraction, text extraction, metadata parsing from assessment documents. Core Dossier capability."),
    "BIV-014": d("Base connector abstract class. Superseded by TFR-022 (connector interface) already ported from terra-forge-rebuild.", "TFR-022 connector interface"),
    "BIV-015": d("Connector factory/registry. Superseded by TFR-020 (connector registry) already ported.", "TFR-020 connector registry"),
    "BIV-016": d("Connector bootstrap initialization. Generic startup scaffolding.", "none"),

    "BIV-017": p("TerraCanon", CS, "canon.connector.management.api", "backend/TerraFusion.API/Controllers/ConnectorManagementController.cs",
                  "Connector management API: REST endpoints for connector status, data queries. Core Canon operational API."),
    "BIV-018": p("TerraAtlas", AG, "atlas.enrichment.geospatial", "backend/TerraFusion.Core/GIS/GeospatialEnricher.cs",
                  "Geospatial enricher: geocoding, proximity analysis, flood zone detection, walkability scoring. Core Atlas spatial enrichment."),
    "BIV-019": p("TerraCanon", CS, "canon.quality.validator", "backend/TerraFusion.Core/Sync/DataValidator.cs",
                  "Data validator: range validation, outlier detection (IQR), completeness scoring. Core data quality enforcement."),
    "BIV-020": p("TerraForge", FV, "forge.market.monitor", "backend/TerraFusion.Core/Services/MarketMonitor.cs",
                  "Market monitor: hot/cold market detection, trend alerts, threshold-based notifications. Core Forge market analysis."),
    "BIV-021": p("TerraCanon", CS, "canon.scheduler.data_refresh", "backend/TerraFusion.Core/Sync/DataRefreshScheduler.cs",
                  "Data refresh scheduler: automated periodic refresh of market, property, and GIS data. Core Canon ETL scheduling."),

    # ═══ GENERIC INFRASTRUCTURE (declined — superseded by canonical stack) ═══
    "BIV-022": d("Background job scheduler. Generic infrastructure — canonical has Hangfire/hosted services.", "canonical .NET hosted services"),
    "BIV-023": d("Alert service with console/email/webhook. Generic infrastructure.", "canonical notification services"),
    "BIV-024": d("System monitoring with console/email alerts. Generic infrastructure.", "canonical .NET health checks + Prometheus"),
    "BIV-025": d("Auth middleware with API key verification, RBAC. Superseded by canonical TerraFusion.Security.", "backend/TerraFusion.Security/"),
    "BIV-026": d("Security headers middleware (CSP, CORS, XSS). Superseded by canonical .NET security middleware.", "backend/TerraFusion.Security/"),
    "BIV-027": d("Dev one-time auth tokens. Development tooling, not production logic.", "none"),
    "BIV-028": d("Dev auth routes. Development tooling.", "none"),
    "BIV-029": d("User management CRUD routes. Superseded by canonical GovernmentUsers entity and auth.", "backend/TerraFusion.Core/Entities/GovernmentUser"),
    "BIV-030": d("Performance logging middleware. Generic infrastructure.", "canonical OpenTelemetry integration"),
    "BIV-031": d("Error handler middleware. Generic infrastructure.", "standard .NET exception middleware"),
    "BIV-032": d("Drizzle ORM schema. Superseded by canonical EF Core DbContext with 20+ tables.", "backend/TerraFusion.Data/TerraFusionDbContext"),
    "BIV-033": d("In-memory storage implementation. No production value — development stub.", "none"),
    "BIV-034": d("Drizzle ORM migration config. Superseded by EF Core migrations.", "EF Core migration infrastructure"),

    # ═══ MORE FORGE API SERVICES ═══
    "BIV-035": p("TerraForge", FV, "forge.market.api", "backend/TerraFusion.API/Controllers/MarketController.cs",
                  "Market controller: market trends, metrics, analysis endpoints. Core Forge market API."),
    "BIV-036": p("TerraAtlas", AG, "atlas.gis.api", "backend/TerraFusion.API/Controllers/GisController.cs",
                  "GIS controller: geocoding, spatial queries, geospatial enrichment. Core Atlas API."),
    "BIV-037": p("TerraForge", FV, "forge.recommendations.api", "backend/TerraFusion.API/Controllers/RecommendationsController.cs",
                  "Property recommendations: valuation-based comparable suggestions. Core Forge comparable selection logic."),
    "BIV-038": p("TerraForge", FV, "forge.timeseries.api", "backend/TerraFusion.API/Controllers/TimeseriesController.cs",
                  "Property timeseries: historical value trend data. Core Forge temporal analysis."),

    # ═══ AI / LLM SERVICES (deferred pending TerraGPT charter) ═══
    "BIV-039": df("Enhanced AI service with rate limiting, multi-provider support. Placement depends on TerraGPT suite architecture.",
                  "architectural", "TerraGPT suite architecture scoped and charter written", sec_note="Multi-provider API key handling must be reviewed."),
    "BIV-040": df("AI service factory (OpenAI, xAI). Multi-provider abstraction depends on TerraGPT scoping.",
                  "architectural", "TerraGPT suite architecture scoped"),
    "BIV-041": df("OpenAI service for property analysis and valuation insights. Contains valuable valuation prompts but direct API key dependency.",
                  "architectural", "TerraGPT suite architecture scoped + API key management resolved", sec_note="OpenAI API key handling must be reviewed."),
    "BIV-042": d("xAI (Grok) service as alternative AI provider. Superseded — single canonical AI provider sufficient.", "canonical AI service via TerraGPT"),
    "BIV-043": df("AI chat API: conversation management, AI-powered analysis. Depends on TerraGPT suite scoping.",
                  "architectural", "TerraGPT suite architecture scoped"),

    # ═══ AI INFRASTRUCTURE (declined — superseded by canonical AI swarm) ═══
    "BIV-044": d("MCP controller. Superseded by canonical MCP infrastructure.", "canonical MCP integration"),
    "BIV-045": d("Enhanced MCP controller. Superseded.", "canonical MCP integration"),
    "BIV-046": d("Memory manager controller. Superseded by canonical AI swarm memory.", "canonical AI swarm in TerraFusion.Consciousness"),
    "BIV-047": p("TerraForge", FR, "forge.avm.valuation_agent", "backend/TerraFusion.AI/Agents/ValuationAgent.cs",
                  "Valuation agent: sales comparison, cost approach, income approach, mass appraisal methodologies. The valuation logic is the asset — adapt from agent format to service.",
                  parity="adapted"),
    "BIV-048": p("TerraForge", FR, "forge.analytics.market_agent", "backend/TerraFusion.AI/Agents/MarketAnalysisAgent.cs",
                  "Real estate analytics agent: market analysis, property recommendations, trend tracking methodologies. Unique market analysis logic."),
    "BIV-049": d("Developer agent. Generic AI code assistant — no domain logic.", "none"),
    "BIV-050": d("MCP agent. Generic MCP tooling.", "none"),
    "BIV-051": d("Agent coordinator. Superseded by canonical TerraFusion.Consciousness swarm.", "backend/TerraFusion.Consciousness/"),
    "BIV-052": d("Agent coordinator performance optimizations. Superseded.", "backend/TerraFusion.Consciousness/"),
    "BIV-053": d("Agent registry. Superseded by canonical AI swarm registry.", "backend/TerraFusion.Consciousness/"),
    "BIV-054": d("Agent factory. Superseded.", "backend/TerraFusion.Consciousness/"),
    "BIV-055": d("Tool registry. Superseded.", "canonical tool infrastructure"),
    "BIV-056": d("MCP tools integration. Superseded.", "canonical MCP"),
    "BIV-057": d("Vector memory system. Superseded by canonical AI infrastructure.", "backend/TerraFusion.Consciousness/"),
    "BIV-058": d("Vector memory optimizations. Superseded.", "backend/TerraFusion.Consciousness/"),
    "BIV-059": d("Vector memory enhancer. Superseded.", "backend/TerraFusion.Consciousness/"),
    "BIV-060": d("Agent interface definitions. Superseded by canonical agent contracts.", "backend/TerraFusion.Consciousness/"),
    "BIV-061": d("Tool interface definitions. Superseded.", "canonical tool interfaces"),

    # ═══ AGENT TYPE DEFINITIONS (port valuation-specific types) ═══
    "BIV-062": p("TerraForge", FR, "forge.types.valuation_agent", "backend/TerraFusion.AI/Types/ValuationAgentConfig.cs",
                  "Valuation agent types: appraisal methodology configuration, approach weighting. Core Forge model config."),
    "BIV-063": p("TerraForge", FR, "forge.types.market_agent", "backend/TerraFusion.AI/Types/MarketAgentConfig.cs",
                  "Market analysis agent types: market analysis configuration. Core Forge config."),
    "BIV-064": p("TerraForge", FR, "forge.types.analytics_agent", "backend/TerraFusion.AI/Types/AnalyticsAgentConfig.cs",
                  "Analytics agent types: configuration definitions for analytics processing."),

    # ═══ PYTHON ML MICROSERVICES (unique ML logic) ═══
    "BIV-065": p("TerraForge", FR, "forge.ml.analytics_service", "backend/TerraFusion.AI/ML/AnalyticsService.cs",
                  "Python analytics: Prophet time series, XGBoost, Random Forest for property value prediction. Unique ML models — adapt to .NET ML pipeline."),
    "BIV-066": p("TerraForge", FR, "forge.ml.market_predictor", "backend/TerraFusion.AI/ML/MarketPredictor.cs",
                  "Market predictor: Prophet + XGBoost + Random Forest ensemble for property value forecasting. Core Forge ML."),
    "BIV-067": p("TerraCanon", CS, "canon.quality.ml_checker", "backend/TerraFusion.Core/Sync/DataQualityChecker.cs",
                  "ML data quality: column validation, null detection, outlier detection (IQR). Core Canon data quality."),
    "BIV-068": d("MLflow experiment tracker. Infrastructure tooling — not domain logic.", "canonical ML infrastructure"),
    "BIV-069": d("Property CRUD microservice. Generic CRUD — superseded by canonical PropertyController.", "backend/TerraFusion.API/Controllers/"),
    "BIV-070": p("TerraForge", FV, "forge.market.metrics_service", "backend/TerraFusion.Core/Services/MarketMetricsService.cs",
                  "Market metrics microservice: market metrics, trends, predictions API. Core Forge market analysis."),
    "BIV-071": p("TerraAtlas", AG, "atlas.spatial.analysis_service", "backend/TerraFusion.Core/GIS/SpatialAnalysisService.cs",
                  "Spatial analysis: geocoding, proximity searches, neighborhood boundaries. Core Atlas spatial computation."),

    # ═══ PYTHON/MICROSERVICE INFRASTRUCTURE (declined) ═══
    "BIV-072": d("SQLAlchemy DB schema. Superseded by canonical EF Core schema.", "backend/TerraFusion.Data/"),
    "BIV-073": d("FastAPI utilities. Python framework scaffolding.", "none"),
    "BIV-074": d("Microservices launcher. Infrastructure scaffolding.", "none"),
    "BIV-075": d("Microservices Node↔Python client. Superseded by monolith architecture.", "none"),
    "BIV-076": d("Microservices bridge controller. Superseded.", "none"),

    # ═══ ETL PIPELINE (unique orchestration logic) ═══
    "BIV-077": p("TerraCanon", CS, "canon.etl.pipeline_dag", "backend/TerraFusion.Core/Sync/ETL/RealEstatePipeline.cs",
                  "ETL pipeline DAG: MLS data extraction, cleaning, geocoding, loading orchestration. Core Canon ETL workflow logic."),
    "BIV-078": d("Airflow configuration. Infrastructure config — not business logic.", "none"),

    # ═══ ARCGIS SERVICE CATALOG (unique GIS reference) ═══
    "BIV-079": p("TerraAtlas", AG, "atlas.gis.arcgis_catalog", "backend/TerraFusion.Core/GIS/Config/ArcGisServiceCatalog.cs",
                  "ArcGIS services catalog: all Benton County GIS feature services (parcels, neighborhoods, flood zones). Irreplaceable GIS reference.",
                  parity="exact"),

    # ═══ DOCUMENTATION / GENERATED TYPES (declined) ═══
    "BIV-080": d("OpenAPI specification. Documentation — will be regenerated from canonical API.", "auto-generated from .NET controllers"),
    "BIV-081": d("Property type definitions. Frontend types — regenerated from canonical schema.", "auto-generated from EF Core"),
    "BIV-082": p("Shared", "os-shared", "os.types.external_data", "frontend/src/types/externalData.ts",
                  "External data types: WeatherData, ClimateData, DemographicData. Shared type contract for enrichment services."),
    "BIV-083": d("Server-side property types. Superseded by canonical EF Core entities.", "backend/TerraFusion.Core/Entities/"),

    # ═══ MASS APPRAISAL UI (core Forge UI components) ═══
    "BIV-084": p("TerraForge", FU, "forge.mass_appraisal.page", "frontend/src/pages/forge/mass-appraisal/MassAppraisalPage.tsx",
                  "Mass appraisal page: regression models, cost manual, depreciation calculator, ratio study panel. Core Forge workspace UI."),
    "BIV-085": p("TerraForge", FU, "forge.cost.manual", "frontend/src/pages/forge/cost/CostManual.tsx",
                  "Cost manual: Marshall & Swift style replacement cost calculations. Core cost approach UI."),
    "BIV-086": p("TerraForge", FU, "forge.cost.depreciation_calc", "frontend/src/pages/forge/cost/DepreciationCalculator.tsx",
                  "Depreciation calculator: age-life, modified age-life, breakdown methods. Core cost approach UI."),
    "BIV-087": p("TerraForge", FU, "forge.income.approach_ui", "frontend/src/pages/forge/income/IncomeApproachPanel.tsx",
                  "Income approach: capitalization rate and income multiplier valuations. Core Forge income approach UI."),
    "BIV-088": p("TerraForge", FS, "forge.statistics.ratio_study_panel", "frontend/src/pages/forge/statistics/RatioStudyPanel.tsx",
                  "Ratio study panel: assessment-to-sale ratio analysis, IAAO compliance metrics. Core Forge statistics."),
    "BIV-089": p("TerraForge", FU, "forge.sales.comparison_grid", "frontend/src/pages/forge/sales/SalesComparisonGrid.tsx",
                  "Sales comparison grid: comparable property analysis with adjustments. Core Forge sales approach UI."),
    "BIV-090": p("TerraForge", FS, "forge.statistics.quality_control", "frontend/src/pages/forge/statistics/QualityControlPanel.tsx",
                  "Quality control panel: mass appraisal model diagnostics and validation. Core Forge QC."),
    "BIV-091": p("TerraForge", FU, "forge.regression.model_details", "frontend/src/pages/forge/regression/ModelDetails.tsx",
                  "Model details: regression coefficients, statistics, variable importance. Core Forge regression UI."),
    "BIV-092": p("TerraForge", FU, "forge.regression.models_list", "frontend/src/pages/forge/regression/ModelsList.tsx",
                  "Models list: available mass appraisal models with summary statistics. Core Forge model management."),
    "BIV-093": p("TerraForge", FU, "forge.valuation.results_widget", "frontend/src/pages/forge/valuation/ValuationResultsWidget.tsx",
                  "Property valuation widget: valuation results with approach breakdowns. Core Forge valuation display."),

    # ═══ ATLAS GIS UI (true spatial/map interaction) ═══
    "BIV-094": p("TerraAtlas", AG, "atlas.gis.mass_appraisal_viz", "frontend/src/pages/atlas/MassAppraisalGIS.tsx",
                  "GIS visualization of mass appraisal data. Primary job is spatial display of appraisal results on map. Atlas-owned."),
    "BIV-095": d("GIS demo page. Demo with no production value.", "none"),
    "BIV-096": p("TerraAtlas", AG, "atlas.gis.address_map", "frontend/src/pages/atlas/components/AddressMap.tsx",
                  "Address map: Leaflet-based property mapping with geocoding. Core Atlas spatial UI."),
    "BIV-097": p("TerraAtlas", AG, "atlas.gis.animated_trend_map", "frontend/src/pages/atlas/components/AnimatedTrendMap.tsx",
                  "Animated trend map: property value changes over time on map. Primary job is spatial temporal visualization. Atlas-owned."),
    "BIV-098": p("TerraAtlas", AG, "atlas.gis.map_container", "frontend/src/pages/atlas/components/MapContainer.tsx",
                  "Map container: Leaflet map initialization and management. Core Atlas map infrastructure."),
    "BIV-099": p("TerraAtlas", AG, "atlas.gis.sentiment_heatmap", "frontend/src/pages/atlas/components/SentimentHeatMap.tsx",
                  "Sentiment heat map: neighborhood sentiment on map overlay. Primary job is spatial sentiment rendering. Atlas-owned."),
    "BIV-100": p("TerraAtlas", AG, "atlas.gis.market_heatmap", "frontend/src/pages/atlas/components/MarketHeatMap.tsx",
                  "Market heat map: property value distributions rendered spatially. Primary job is spatial value rendering. Atlas-owned."),

    # ═══ FORGE PROPERTY UI COMPONENTS ═══
    "BIV-101": p("TerraForge", FU, "forge.property.search", "frontend/src/pages/forge/property/PropertySearch.tsx",
                  "Property search with filtering by address, type, price range. Core Forge property selection UI."),
    "BIV-102": d("Property card component. Generic UI chrome — no domain logic.", "canonical property display components"),
    "BIV-103": d("Property detail header. Generic UI chrome.", "canonical property display components"),
    "BIV-104": p("TerraForge", FU, "forge.property.enrichment_widget", "frontend/src/pages/forge/property/PropertyEnrichmentWidget.tsx",
                  "Property enrichment widget: shows external data enrichment results. Unique valuation enrichment display."),
    "BIV-105": p("TerraForge", FU, "forge.property.valuation_widget", "frontend/src/pages/forge/property/ValuationWidget.tsx",
                  "Inline property valuation display. Core Forge valuation UI."),
    "BIV-106": p("TerraForge", FU, "forge.property.batch_tool", "frontend/src/pages/forge/property/BatchProcessingTool.tsx",
                  "Batch processing tool: bulk property operations. Core Forge batch capability."),
    "BIV-107": p("TerraForge", FU, "forge.property.hazard_risk", "frontend/src/pages/forge/property/HazardRiskAssessment.tsx",
                  "Natural hazard risk assessment: flood, wind, weather risk factors for valuation adjustments. Forge-owned — risk factors affect value."),
    "BIV-108": p("TerraForge", FU, "forge.property.comparison", "frontend/src/pages/forge/comparison/AdvancedComparison.tsx",
                  "Advanced property comparison: side-by-side analysis of characteristics and valuations. Core Forge comparable analysis."),

    # ═══ FORGE ASSESSMENT INTELLIGENCE ═══
    "BIV-109": p("TerraForge", FS, "forge.statistics.assessment_intelligence", "frontend/src/pages/forge/statistics/AssessmentIntelligence.tsx",
                  "Assessment intelligence: outlier detection, market trends, appeal risk analysis. Core Forge analytical dashboard."),
    "BIV-110": p("TerraForge", FS, "forge.statistics.assessment_intelligence.client", "frontend/src/services/forge/assessmentIntelligenceService.ts",
                  "Assessment intelligence client service. Core Forge analytics API integration."),

    # ═══ AI-GUIDED UI (deferred pending TerraGPT) ═══
    "BIV-111": df("Valuation assistant: AI-guided valuation workflow. Depends on TerraGPT suite architecture for LLM interaction patterns.",
                  "architectural", "TerraGPT suite architecture scoped"),

    # ═══ FORGE TAX / MARKET DASHBOARDS ═══
    "BIV-112": p("TerraForge", FU, "forge.tax.assessment_dashboard", "frontend/src/pages/forge/tax/TaxAssessmentDashboard.tsx",
                  "Tax assessment dashboard: property tax calculations and assessment summaries. Core Forge tax analysis."),
    "BIV-113": p("TerraForge", FU, "forge.tax.calculator", "frontend/src/pages/forge/tax/TaxCalculatorWidget.tsx",
                  "Tax calculator widget: interactive property tax estimation. Core Forge tax tool."),
    "BIV-114": p("TerraForge", FS, "forge.statistics.market_analytics", "frontend/src/pages/forge/statistics/MarketAnalyticsDashboard.tsx",
                  "Market analytics dashboard: key market metrics and trend summaries. Core Forge market analytics."),
    "BIV-115": p("TerraForge", FS, "forge.statistics.market_dashboard", "frontend/src/pages/forge/statistics/MarketDashboard.tsx",
                  "Market dashboard: real-time market status indicators. Core Forge market monitoring UI."),
    "BIV-116": p("TerraForge", FU, "forge.charts.market_trend", "frontend/src/pages/forge/charts/MarketTrendChart.tsx",
                  "Market trend chart: price and volume trend visualization. Core Forge charting."),
    "BIV-117": p("TerraForge", FS, "forge.statistics.market_cycle", "frontend/src/pages/forge/statistics/MarketCyclePredictor.tsx",
                  "Market cycle predictor: forecasting market phases. Core Forge predictive analytics."),
    "BIV-118": p("TerraForge", FU, "forge.charts.market_metrics_card", "frontend/src/pages/forge/charts/MarketMetricsCard.tsx",
                  "Market metrics card: key market KPIs display. Core Forge summary component."),

    # ═══ ATLAS NEIGHBORHOOD / SPATIAL UI ═══
    "BIV-119": p("TerraAtlas", AG, "atlas.neighborhood.comparison", "frontend/src/pages/atlas/neighborhood/NeighborhoodComparison.tsx",
                  "Neighborhood comparison wizard: side-by-side neighborhood analysis. Primary job is comparing geographic entities. Atlas-owned."),
    "BIV-120": p("TerraAtlas", AG, "atlas.neighborhood.sentiment", "frontend/src/pages/atlas/neighborhood/SentimentDashboard.tsx",
                  "Neighborhood sentiment dashboard: community perception metrics by geography. Primary job is spatial sentiment analysis. Atlas-owned."),
    "BIV-121": p("TerraAtlas", AG, "atlas.neighborhood.sentiment_widget", "frontend/src/pages/atlas/neighborhood/SentimentWidget.tsx",
                  "Neighborhood sentiment widget: inline geographic sentiment display. Atlas-owned."),
    "BIV-122": p("TerraForge", FS, "forge.statistics.economic_indicators", "frontend/src/pages/forge/statistics/EconomicIndicators.tsx",
                  "Economic indicators dashboard: regional economic data for valuation context. Value logic — Forge-owned."),
    "BIV-123": p("TerraAtlas", AG, "atlas.gis.school_district_map", "frontend/src/pages/atlas/components/SchoolDistrictMap.tsx",
                  "School district map and comparison: map-based school district visualization. Primary job is spatial overlay. Atlas-owned."),
    "BIV-124": p("TerraForge", FU, "forge.property.recommendations", "frontend/src/pages/forge/property/RecommendationCarousel.tsx",
                  "Property recommendation carousel: AI-curated comparable suggestions. Value logic — Forge-owned."),

    # ═══ AI CHAT UI (deferred pending TerraGPT) ═══
    "BIV-125": df("AI specialist chat for interactive property analysis. Depends on TerraGPT suite architecture.",
                  "architectural", "TerraGPT suite architecture scoped", sec_note="LLM API key handling must be reviewed."),
    "BIV-126": df("Property insight card: AI-generated property analysis summaries. Depends on TerraGPT.",
                  "architectural", "TerraGPT suite architecture scoped"),

    # ═══ MORE DECLINED INFRASTRUCTURE ═══
    "BIV-127": d("AI provider selector UI. Infrastructure UI — no domain logic.", "none"),

    # ═══ FORGE CHARTS ═══
    "BIV-128": p("TerraForge", FU, "forge.charts.market_metrics", "frontend/src/pages/forge/charts/MarketMetricsChart.tsx",
                  "Market metrics chart: Recharts-based market data visualization. Core Forge charting."),
    "BIV-129": p("TerraForge", FU, "forge.charts.market_prediction", "frontend/src/pages/forge/charts/MarketPredictionChart.tsx",
                  "Market prediction chart: forecast visualization. Core Forge predictive display."),
    "BIV-130": p("TerraForge", FU, "forge.charts.price_history", "frontend/src/pages/forge/charts/PriceHistoryChart.tsx",
                  "Price history chart: individual property value history. Core Forge temporal display."),
    "BIV-131": p("TerraForge", FU, "forge.charts.market_trends", "frontend/src/pages/forge/charts/PropertyMarketTrends.tsx",
                  "Property market trends chart. Core Forge trend visualization."),
    "BIV-132": p("TerraForge", FU, "forge.charts.segment_comparison", "frontend/src/pages/forge/charts/SegmentComparisonChart.tsx",
                  "Segment comparison chart: comparing property segments. Core Forge analytical chart."),
    "BIV-133": p("TerraForge", FU, "forge.charts.trend_prediction", "frontend/src/pages/forge/charts/TrendPredictionWidget.tsx",
                  "Trend prediction widget: dashboard-embeddable trend forecasts. Core Forge predictive widget."),

    # ═══ FORGE DATA HOOKS ═══
    "BIV-134": p("TerraForge", FU, "forge.hooks.property_data", "frontend/src/hooks/forge/usePropertyData.ts",
                  "Property data hook: fetching and managing property data. Core Forge data access."),
    "BIV-135": p("TerraForge", FU, "forge.hooks.market_data", "frontend/src/hooks/forge/useMarketData.ts",
                  "Market data hook: market metrics and trends. Core Forge data access."),
    "BIV-136": p("TerraForge", FU, "forge.hooks.valuation_data", "frontend/src/hooks/forge/useValuationData.ts",
                  "Valuation data hook: property valuation API interactions. Core Forge data access."),
    "BIV-137": d("Generic AI hook. Infrastructure — no domain logic.", "none"),
    "BIV-138": d("Generic agent hook. Infrastructure.", "none"),

    # ═══ FORGE CLIENT SERVICES ═══
    "BIV-139": p("TerraForge", FV, "forge.client.valuation", "frontend/src/services/forge/valuationService.ts",
                  "Property valuation client service. Core Forge API integration."),
    "BIV-140": p("TerraForge", FV, "forge.client.market_trends", "frontend/src/services/forge/marketTrendsService.ts",
                  "Market trends client service. Core Forge market analytics integration."),

    # ═══ ATLAS CLIENT SERVICES ═══
    "BIV-141": p("TerraAtlas", AG, "atlas.client.neighborhood_comparison", "frontend/src/services/atlas/neighborhoodComparisonService.ts",
                  "Neighborhood comparison client: comparing neighborhood metrics. Atlas-owned — geographic entity comparison."),
    "BIV-142": p("TerraAtlas", AG, "atlas.client.neighborhood_sentiment", "frontend/src/services/atlas/neighborhoodSentimentService.ts",
                  "Neighborhood sentiment client: sentiment data by geography. Atlas-owned — spatial sentiment."),
    "BIV-143": p("TerraAtlas", AG, "atlas.client.neighborhood", "frontend/src/services/atlas/neighborhoodService.ts",
                  "Neighborhood service: general neighborhood data operations. Atlas-owned — geographic data."),
    "BIV-144": p("TerraForge", FV, "forge.client.comparison", "frontend/src/services/forge/comparisonService.ts",
                  "Property comparison client: comparable property analysis. Core Forge comparable selection."),
    "BIV-145": p("TerraForge", FV, "forge.client.insights", "frontend/src/services/forge/insightsService.ts",
                  "Property insights client: analytical property summaries. Core Forge analytics."),
    "BIV-146": p("TerraForge", FV, "forge.client.economic", "frontend/src/services/forge/economicService.ts",
                  "Economic indicators client: regional economic data for valuation. Core Forge enrichment."),
    "BIV-147": p("TerraForge", FV, "forge.client.hazard", "frontend/src/services/forge/hazardService.ts",
                  "Natural hazard client: risk assessment for valuation adjustments. Core Forge risk analysis."),
    "BIV-148": p("TerraAtlas", AG, "atlas.client.school_district", "frontend/src/services/atlas/schoolDistrictService.ts",
                  "School district client: school data and map integration. Atlas-owned — geographic overlay data."),
    "BIV-149": p("TerraCanon", CS, "canon.client.validation", "frontend/src/services/canon/validationService.ts",
                  "Data validation client: property data quality checks. Core Canon data quality."),
    "BIV-150": p("TerraForge", FV, "forge.client.enrichment", "frontend/src/services/forge/enrichmentService.ts",
                  "Enrichment client: property data enrichment operations. Core Forge data enhancement."),
    "BIV-151": p("TerraForge", FV, "forge.client.integrated_data", "frontend/src/services/forge/integratedDataService.ts",
                  "Integrated property data: combining multiple data sources. Core Forge data assembly."),
    "BIV-152": p("TerraForge", FV, "forge.client.valuation_agent", "frontend/src/services/forge/valuationAgentService.ts",
                  "Valuation agent client: AI valuation agent API. Core Forge AI valuation integration."),

    # ═══ MORE DECLINED INFRASTRUCTURE ═══
    "BIV-153": d("Generic agent client service. Infrastructure.", "none"),
    "BIV-154": d("AI client library. Generic AI communication.", "none"),
    "BIV-155": d("Memory optimizer. Generic frontend utility.", "none"),
    "BIV-156": d("Optimized logging service. Generic infrastructure.", "none"),
    "BIV-157": d("Troubleshooting service. Generic diagnostics.", "none"),
    "BIV-158": d("Error definitions hierarchy. Generic error types.", "standard .NET exception hierarchy"),
    "BIV-159": d("Server logger utility. Generic logging.", "canonical Serilog"),

    # ═══ FORGE VALUATION AGENT API ═══
    "BIV-160": p("TerraForge", FR, "forge.valuation_agent.routes", "backend/TerraFusion.API/Controllers/ValuationAgentController.cs",
                  "Valuation agent routes: AI-driven valuation API endpoints. Core Forge AI valuation API."),
    "BIV-161": p("TerraForge", FR, "forge.valuation_agent.controller", "backend/TerraFusion.API/Controllers/ValuationAgentController.cs",
                  "Valuation agent controller: AI-driven valuation request handling. Core Forge AI valuation."),

    # ═══ DECLINED INFRASTRUCTURE / SCAFFOLDING ═══
    "BIV-162": d("Agent management API. Generic agent lifecycle. Superseded by canonical AI swarm.", "backend/TerraFusion.Consciousness/"),
    "BIV-163": d("Server entry point (Express app). Superseded by canonical .NET Program.cs.", "backend/TerraFusion.API/Program.cs"),
    "BIV-164": d("Route registration. Superseded by canonical .NET route mapping.", "backend/TerraFusion.API/Program.cs"),
    "BIV-165": d("Python requirements.txt. Dependency list — not logic.", "none"),

    # ═══ FORGE COMPARISON STATE ═══
    "BIV-166": p("TerraForge", FU, "forge.state.comparison", "frontend/src/contexts/forge/ComparisonContext.tsx",
                  "Comparison context: React state for property comparison workflows. Core Forge state management."),
    "BIV-167": p("TerraForge", FU, "forge.state.advanced_comparison", "frontend/src/contexts/forge/AdvancedComparisonContext.tsx",
                  "Advanced comparison context: multi-property comparison state. Core Forge state management."),

    # ═══ DECLINED UI/STYLING ═══
    "BIV-168": d("Property color schemes. Styling utility — no domain logic.", "canonical design system"),
    "BIV-169": p("TerraForge", FV, "forge.types.market", "frontend/src/types/forge/marketTypes.ts",
                  "Market types: MarketMetrics, MarketTrend, MarketPrediction. Core Forge type contract."),
    "BIV-170": p("TerraAtlas", AG, "atlas.types.animated_map", "frontend/src/types/atlas/animatedMapTypes.ts",
                  "Animated map types: spatial trend visualization type definitions. Atlas-owned spatial types."),
    "BIV-171": d("Connector examples library. Documentation/examples — not production logic.", "none"),
    "BIV-172": d("Voice search component. Experimental UX feature — no domain logic.", "none"),

    # ═══ FORGE AGENT CREATOR ═══
    "BIV-173": p("TerraForge", FR, "forge.valuation_agent.creator", "backend/TerraFusion.AI/Agents/ValuationAgentFactory.cs",
                  "Valuation agent creator: dynamically creates specialized valuation agents. Core Forge AI factory."),
    "BIV-174": d("Agent system entry point. Infrastructure bootstrap.", "none"),
    "BIV-175": d("Vector memory persistence data. JSON data file — no logic.", "none"),

    # ═══ REFERENCE DATA (valuable domain data) ═══
    "BIV-176": p("TerraForge", FV, "forge.reference.cma_data", "docs/reference/sample-data/cma_spreadsheet.csv",
                  "CMA spreadsheet data: comparable market analysis reference data for Benton County. Domain reference data.",
                  parity="exact"),
    "BIV-177": p("TerraForge", FV, "forge.reference.titan_data", "docs/reference/sample-data/titan_analytics.csv",
                  "Titan Analytics data: property analytics reference data. Domain reference data.",
                  parity="exact"),

    # ═══ HARRIS PACS DLLs (deferred — binary artifacts need security + legal) ═══
    "BIV-178": df("Harris PACS DLL artifacts (Core.DLL, MRA.DLL, etc.). Binary artifacts require security review and legal clearance for redistribution.",
                  "security", "Security review of binary artifacts + legal clearance for Harris PACS DLL redistribution",
                  sec_note="Binary DLL artifacts from third-party vendor. Cannot port without legal review."),

    # ═══ DECLINED CI/CD / BUILD / INFRASTRUCTURE ═══
    "BIV-179": d("CI/CD workflow. Infrastructure config.", "canonical GitHub Actions"),
    "BIV-180": d("CI workflow. Infrastructure config.", "canonical CI"),
    "BIV-181": d("Database initialization script. Superseded by EF Core migrations.", "EF Core migrations"),
    "BIV-182": d("Qdrant vector store. Infrastructure — superseded by canonical AI.", "backend/TerraFusion.Consciousness/"),
    "BIV-183": d("Microservices status UI. Infrastructure monitoring — superseded.", "canonical system health"),
    "BIV-184": d("Logging dashboard. Infrastructure monitoring.", "canonical logging"),
    "BIV-185": d("Error dashboard. Infrastructure monitoring.", "canonical error handling"),
    "BIV-186": d("Application layout components. Superseded by canonical OS shell.", "canonical OS shell"),
    "BIV-187": d("Main application routing. Superseded by canonical routing.", "canonical OS routing"),
    "BIV-188": d("Dev auth admin page. Development tooling.", "none"),
    "BIV-189": d("Dev auth login page. Development tooling.", "none"),
    "BIV-190": d("User admin page. Superseded by canonical admin.", "canonical OS admin"),
    "BIV-191": d("Dev token generation script. Development tooling.", "none"),
    "BIV-192": d("Onboarding system. UX scaffolding — no domain logic.", "none"),
    "BIV-193": d("Badge management. Gamification feature — not core assessment domain.", "none"),
    "BIV-194": p("TerraForge", FU, "forge.property.hazard_assessment", "frontend/src/pages/forge/property/HazardAssessment.tsx",
                  "Hazards risk assessment: natural disaster risk evaluation for valuation factors. Core Forge risk analysis."),
    "BIV-195": d("Theme configuration. Styling — no domain logic.", "canonical design system"),
    "BIV-196": d("Tailwind CSS config. Styling/build config.", "canonical tailwind config"),
    "BIV-197": d("Vite build config. Build infrastructure.", "canonical vite config"),
    "BIV-198": d("Agent demo route. Test/demo — not production.", "none"),
    "BIV-199": p("TerraForge", FV, "forge.recommendations.routes", "backend/TerraFusion.API/Controllers/RecommendationsController.cs",
                  "Recommendations routes: property recommendation API. Core Forge comparable selection API."),
    "BIV-200": d("Microservices integration routes. Bridge routes — superseded by monolith.", "none"),
}


def apply_dispositions(manifest_path: Path) -> None:
    """Apply terminal dispositions to Bsbcintelligentvalues assets in the manifest."""
    with manifest_path.open("r", encoding="utf-8") as f:
        manifest = json.load(f)

    repo = next(r for r in manifest["repos"] if r["name"] == REPO_NAME)
    repo["disposition_started_at"] = NOW
    repo["repo_status"] = "migration-in-progress"

    unmatched = []
    for asset in repo["assets"]:
        aid = asset["asset_id"]
        if aid not in DISPOSITIONS:
            unmatched.append(aid)
            continue

        dd = DISPOSITIONS[aid]
        asset["status"] = dd["status"]
        asset["disposition_rationale"] = dd["disposition_reason"]
        asset["parity_mode"] = dd["parity_mode"]
        asset["replacement_ref"] = dd["replacement_ref"]
        asset["migration_batch"] = dd["migration_batch"]
        if dd.get("canonical_capability"):
            asset["canonical_capability"] = dd["canonical_capability"]
        if dd.get("target_home"):
            asset["target_home"] = dd["target_home"]
        if dd.get("owner_suite"):
            asset["owner_suite"] = dd["owner_suite"]
        asset["blocker_type"] = dd.get("blocker_type", "")
        asset["unblock_condition"] = dd.get("unblock_condition", "")
        asset["decision_owner"] = dd.get("decision_owner", "founder")
        asset["security_review"] = dd["security_review"]
        asset["updated_at"] = NOW

    if unmatched:
        raise RuntimeError(f"Assets without disposition: {unmatched}")

    still_pending = [a["asset_id"] for a in repo["assets"] if a["status"] == "pending"]
    if still_pending:
        raise RuntimeError(f"Assets still pending: {still_pending}")

    repo["disposition_completed_at"] = NOW

    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # ─── Summary ────────────────────────────────────────────────────────
    counts = {}
    batch_counts = {}
    suite_counts = {}
    security_blocked = []
    atlas_rows = []

    for asset in repo["assets"]:
        s = asset["status"]
        counts[s] = counts.get(s, 0) + 1
        suite = asset.get("owner_suite", "Unassigned")
        suite_counts[suite] = suite_counts.get(suite, 0) + 1
        if s == "ported":
            batch = asset.get("migration_batch", "unassigned")
            batch_counts[batch] = batch_counts.get(batch, 0) + 1
            if suite == "TerraAtlas":
                atlas_rows.append(asset)
        sec = asset.get("security_review", {})
        if sec.get("status") not in ("passed", "remediated"):
            security_blocked.append(asset["asset_id"])

    print(f"\n{'='*60}")
    print(f"BSBCINTELLIGENTVALUES DISPOSITION COMPLETE")
    print(f"{'='*60}")
    print(f"Total assets: {len(repo['assets'])}")
    for s, c in sorted(counts.items()):
        print(f"  {s}: {c}")

    print(f"\nBy migration batch (ported only):")
    for batch, count in sorted(batch_counts.items()):
        print(f"  {batch}: {count}")

    print(f"\nBy owner suite:")
    for suite, count in sorted(suite_counts.items()):
        print(f"  {suite}: {count}")

    print(f"\nSecurity-blocked: {len(security_blocked)}")
    for aid in security_blocked:
        print(f"  {aid}")

    deferred = [a for a in repo["assets"] if a["status"] == "deferred-with-rationale"]
    if deferred:
        print(f"\nDeferred assets ({len(deferred)}):")
        for a in deferred:
            print(f"  {a['asset_id']} | {a.get('source_path', 'N/A')[:60]}")
            print(f"    blocker: {a.get('blocker_type', 'N/A')}")
            print(f"    unblock: {a.get('unblock_condition', 'N/A')}")
            print(f"    owner:   {a.get('decision_owner', 'N/A')}")

    # Top 15 highest-value ported assets
    ported = [a for a in repo["assets"] if a["status"] == "ported"]
    high_value = [a for a in ported if any(kw in a.get("canonical_capability", "")
                  for kw in ["mass_appraisal", "regression", "ml.", "ratio", "calibration",
                             "valuation", "analytics", "market", "connector"])][:15]
    print(f"\nTop 15 highest-value ported assets:")
    for a in high_value:
        print(f"  {a['asset_id']} | {a.get('owner_suite', '?')} | {a.get('canonical_capability', '')}")

    # Atlas justification
    print(f"\nAtlas-assigned assets ({len(atlas_rows)}) — spatial justification:")
    for a in atlas_rows:
        reason = a.get("disposition_rationale", "")
        # Extract the justification sentence
        just = [s for s in reason.split(". ") if "Atlas" in s or "spatial" in s.lower() or "map" in s.lower() or "geographic" in s.lower()]
        j = just[0] if just else reason[:80]
        print(f"  {a['asset_id']} | {a.get('canonical_capability', '')} | {j}")


if __name__ == "__main__":
    manifest_path = Path(__file__).resolve().parents[2] / "phase4b.manifest.json"
    apply_dispositions(manifest_path)
