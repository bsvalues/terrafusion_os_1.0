#!/usr/bin/env python3
"""Phase 4B Disposition: BCBSLevy (148 assets).

Terminal classification for every asset. No asset remains pending.
Boundary law: Dais=levy workflows/assessment-ops/notices/certification;
              Canon=ETL/sync/data-quality-monitoring/infrastructure;
              Forge=valuation logic; Atlas=spatial/GIS/map.
Dashboard question test: "How is assessment work progressing?" -> Dais
                         "Are the systems healthy?" -> Canon/OS Admin
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

REPO_NAME = "BCBSLevy"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
SEC_NOTE = (
    "Repo made private 2026-03-14. HIGH: 6 PostgreSQL dumps in backups/, "
    "real 2025 levy Excel files in 2025/. Data exposure (not credentials). "
    "No longer publicly accessible. History scrub recommended."
)


def p(suite, batch, cap, target, reason, parity="adapted", repl="none"):
    """Ported asset. P4B-009: remediation_note required (secrets_status=high)."""
    return {
        "status": "ported", "disposition_reason": reason, "parity_mode": parity,
        "replacement_ref": repl, "migration_batch": batch,
        "canonical_capability": cap, "target_home": target,
        "owner_suite": suite, "blocker_type": "", "unblock_condition": "",
        "decision_owner": "founder",
        "security_review": {"status": "remediated", "remediation_note": SEC_NOTE},
    }


def d(reason, repl="none"):
    """Declined asset."""
    return {
        "status": "declined", "disposition_reason": reason,
        "parity_mode": "superseded" if repl != "none" else "none",
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


# ─── Batch aliases ─────────────────────────────────────────────────────
DL = "dais-levy"
DW = "dais-workflow"
CS = "canon-sync"
FV = "forge-valuation"
AG = "atlas-gis"

DISPOSITIONS: dict[str, dict] = {
    # ═══ APPLICATION SCAFFOLDING (Flask-specific, canonical uses .NET) ═══
    "LEV-001": d("Flask application factory. Canonical uses .NET 8 ASP.NET Core. Framework scaffolding, not business logic.",
                  "backend/TerraFusion.API/Program.cs"),
    "LEV-003": d("Flask multi-env config. Canonical uses appsettings.json + .NET config.",
                  "backend/TerraFusion.API/appsettings.json"),

    # ═══ CORE LEVY DOMAIN MODELS & SERVICES (TerraDais) ═══
    "LEV-002": p("TerraDais", DL, "dais.levy.domain_models",
                  "backend/TerraFusion.Core/Entities/Levy/",
                  "ORM models for TaxDistrict, TaxCode, Property, LevyRate, LevyScenario, ComplianceCheck, etc. Core levy domain schema."),
    "LEV-004": p("TerraDais", DL, "dais.levy.rate_calculation_api",
                  "backend/TerraFusion.API/Controllers/LevyCalculatorController.cs",
                  "Levy rate calculator routes: rate calculation, bill impact, rate comparison. Core levy workflow."),
    "LEV-005": p("TerraDais", DL, "dais.levy.rate_math_engine",
                  "backend/TerraFusion.Core/Services/LevyCalculationService.cs",
                  "Levy calculation utility: rate from amounts/AV, statutory limit enforcement, precision rounding. Core business math."),
    "LEV-006": p("TerraDais", DL, "dais.levy.forecasting_engine",
                  "backend/TerraFusion.AI/Forecasting/LevyForecastService.cs",
                  "Forecasting engine: linear, exponential, ARIMA models for levy rate prediction, anomaly detection, statutory compliance."),
    "LEV-008": p("TerraDais", DL, "dais.levy.forecast_api",
                  "backend/TerraFusion.API/Controllers/LevyForecastController.cs",
                  "Forecasting routes: forecast generation, district analysis, comparison views. Levy workflow."),
    "LEV-009": p("TerraDais", DL, "dais.levy.statutory_compliance",
                  "backend/TerraFusion.Core/Services/LevyComplianceService.cs",
                  "WA state statutory compliance: $5.90/1000 limit, 1% annual cap, consolidated rate limits, senior exemptions, banked capacity. Core levy law."),
    "LEV-010": p("TerraDais", DL, "dais.levy.enhanced_compliance",
                  "backend/TerraFusion.Core/Services/EnhancedComplianceService.cs",
                  "Enhanced compliance: comprehensive reports, compliance history tracking, multi-scenario statutory validation."),
    "LEV-011": p("TerraDais", DL, "dais.levy.bill_impact_analysis",
                  "backend/TerraFusion.Core/Services/BillImpactService.cs",
                  "Bill impact calculator: estimates effect of proposed legislation on property taxes, rate changes, exemption changes."),
    "LEV-013": p("TerraDais", DL, "dais.levy.historical_rate_mgmt",
                  "backend/TerraFusion.Core/Services/HistoricalRateService.cs",
                  "Historical rate management: store/retrieve rates, YoY change calculation, trend analysis, CSV import/export."),
    "LEV-014": p("TerraDais", DL, "dais.levy.advanced_historical",
                  "backend/TerraFusion.AI/Analysis/HistoricalAnalysisService.cs",
                  "Advanced historical analysis: statistics, moving averages, future rate forecasting, anomaly detection, district aggregation."),
    "LEV-015": p("TerraDais", DL, "dais.levy.historical_analysis_api",
                  "backend/TerraFusion.API/Controllers/HistoricalAnalysisController.cs",
                  "Historical analysis routes: statistical dashboard, trend forecasting, anomaly views, multi-year comparisons."),
    "LEV-016": p("TerraDais", DL, "dais.levy.district_analysis",
                  "backend/TerraFusion.Core/Services/DistrictAnalysisService.cs",
                  "District analysis: district details, tax code association, historical rate queries, comprehensive statistics."),
    "LEV-018": p("TerraDais", DL, "dais.levy.export_mgmt_api",
                  "backend/TerraFusion.API/Controllers/LevyExportController.cs",
                  "Levy export management routes: upload/parse levy files, view historical exports, compare data across years. Levy workflow layer."),
    "LEV-020": p("TerraDais", DL, "dais.levy.audit_api",
                  "backend/TerraFusion.API/Controllers/LevyAuditController.cs",
                  "Levy audit routes: compliance auditing dashboard, interactive guidance, optimization recommendations. Assessment ops."),
    "LEV-021": p("TerraDais", DL, "dais.levy.dashboard_api",
                  "backend/TerraFusion.API/Controllers/LevyDashboardController.cs",
                  "Dashboard: district count, tax code count, property count, AV totals, levy amounts, average rates. 'How is levy work progressing?' -> Dais."),
    "LEV-025": p("TerraDais", DL, "dais.levy.tax_roll_export",
                  "backend/TerraFusion.Core/Services/TaxRollExportService.cs",
                  "Tax roll export: generate CSV rolls with property tax calculations. Assessment output product."),
    "LEV-026": p("TerraDais", DL, "dais.levy.report_api",
                  "backend/TerraFusion.API/Controllers/LevyReportController.cs",
                  "Report generation routes: template management, multi-format generation, scheduled configuration."),
    "LEV-027": p("TerraDais", DL, "dais.levy.report_engine",
                  "backend/TerraFusion.Core/Services/LevyReportService.cs",
                  "Report utilities: customizable templates, filters, calculated fields, CSV/PDF export."),
    "LEV-031": p("TerraDais", DL, "dais.levy.tax_strategy_tree",
                  "backend/TerraFusion.API/Controllers/TaxStrategyController.cs",
                  "Tax strategy decision tree: interactive visualization, decision path analysis, strategy recommendations."),
    "LEV-032": p("TerraDais", DL, "dais.levy.budget_impact",
                  "backend/TerraFusion.API/Controllers/BudgetImpactController.cs",
                  "Budget impact visualization: interactive analysis of rate/AV changes on district budgets."),
    "LEV-033": p("TerraDais", DL, "dais.levy.entity_search",
                  "backend/TerraFusion.API/Controllers/LevySearchController.cs",
                  "Search across levy entities: districts, codes, properties, users, logs. Levy-domain search is assessment ops."),
    "LEV-034": p("TerraDais", DL, "dais.levy.fuzzy_search",
                  "backend/TerraFusion.Core/Services/LevySearchService.cs",
                  "Fuzzy matching, autocomplete, search activity logging for levy entities."),
    "LEV-040": p("TerraDais", DL, "dais.levy.public_portal",
                  "backend/TerraFusion.API/Controllers/PublicLevyPortalController.cs",
                  "Public portal: property tax info, property search, district info for citizens. Citizen-facing levy service."),
    "LEV-041": p("TerraDais", DL, "dais.levy.glossary_api",
                  "backend/TerraFusion.API/Controllers/GlossaryController.cs",
                  "Tax terminology glossary routes with categorized terms and contextual tooltips."),
    "LEV-042": p("TerraDais", DL, "dais.levy.terminology_reference",
                  "backend/TerraFusion.Core/Reference/TaxTerminology.cs",
                  "50+ tax terms covering levies, assessments, special levies, admin concepts, statistics. Domain reference data."),
    "LEV-047": p("TerraDais", DL, "dais.levy.interactive_charts",
                  "frontend/src/components/levy/visualizations/",
                  "Interactive viz utils: Plotly chart configs with drill-down, map visualizations, dynamic dashboards for levy metrics."),

    # ═══ LEVY WORKFLOW & AUDIT (TerraDais dais-workflow) ═══
    "LEV-037": p("TerraDais", DW, "dais.workflow.user_audit_api",
                  "backend/TerraFusion.Security/Audit/UserAuditController.cs",
                  "User audit routes: activity tracking, levy override management/approval, behavior analytics. Workflow ops."),
    "LEV-038": p("TerraDais", DW, "dais.workflow.user_audit_service",
                  "backend/TerraFusion.Security/Audit/UserAuditService.cs",
                  "User audit utils: action logging, activity tracking, levy override recording. Workflow service."),
    "LEV-060": p("TerraDais", DW, "dais.workflow.user_audit_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Migration: user audit tables for tracking user actions and levy overrides. Workflow schema."),

    # ═══ DATA IMPORT / SYNC / QUALITY (TerraCanon) ═══
    "LEV-012": p("TerraCanon", CS, "canon.sync.district_import",
                  "backend/TerraFusion.Data/Import/DistrictImportService.cs",
                  "Tax district import: tab-delimited, XML, Excel with column mapping, duplicate detection. ETL function."),
    "LEV-017": p("TerraCanon", CS, "canon.sync.levy_export_parser",
                  "backend/TerraFusion.Data/Import/LevyExportParser.cs",
                  "Levy export file parser: TXT, XLS, XLSX, XML, CSV, JSON formats. File format ETL."),
    "LEV-022": p("TerraCanon", CS, "canon.sync.data_quality_mgmt",
                  "backend/TerraFusion.Core/Services/DataQualityService.cs",
                  "Data quality routes: dashboard, validation rules, error patterns. 'Is the data clean?' -> Canon."),
    "LEV-023": p("TerraCanon", CS, "canon.sync.data_import_export",
                  "backend/TerraFusion.API/Controllers/LevyDataManagementController.cs",
                  "Data management routes: import/export in multiple formats, manage districts/codes/properties. ETL ops."),
    "LEV-024": p("TerraCanon", CS, "canon.sync.multi_format_import",
                  "backend/TerraFusion.Data/Import/ImportService.cs",
                  "Data import utils: file type detection, multi-format reading, validation, model mapping. ETL pipeline."),
    "LEV-048": p("TerraCanon", CS, "canon.sync.data_archiving",
                  "backend/TerraFusion.Data/Archive/DataArchiveService.cs",
                  "Data archiving: snapshots, automatic archiving, retention policy enforcement, restore. Infrastructure ops."),
    "LEV-067": p("TerraCanon", CS, "canon.sync.benton_levy_import",
                  "scripts/levy/",
                  "Benton County data importer: imports real county levy and property data. County data sync."),
    "LEV-076": p("TerraCanon", CS, "canon.sync.export_parser_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Levy export parser tests: multi-format file parsing tests. Tests for Canon import logic."),
    "LEV-077": p("TerraCanon", CS, "canon.sync.data_import_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Data import tests: multi-format import functionality tests. Tests for Canon import logic."),
    "LEV-121": p("TerraCanon", CS, "canon.sync.parser_documentation",
                  "docs/levy/",
                  "Levy export parser docs: supported formats, parsing rules, field mappings. Canon ETL reference."),
    "LEV-137": p("TerraCanon", CS, "canon.sync.data_quality_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Migration: data quality tables for scores, validation rules, error patterns. Canon data quality schema."),
    "LEV-142": p("TerraCanon", CS, "canon.sync.csv_bulk_import",
                  "scripts/levy/",
                  "Simple CSV import for bulk property/rate data loading. ETL tool."),

    # ═══ VALUATION / ASSESSMENT (TerraForge) ═══
    "LEV-028": p("TerraForge", FV, "forge.valuation.assessment_api",
                  "backend/TerraFusion.API/Controllers/PropertyAssessmentController.cs",
                  "Property assessment routes: data validation, valuation (cost/income/sales), compliance verification. Core valuation workflow."),
    "LEV-030": p("TerraForge", FV, "forge.valuation.property_validation",
                  "backend/TerraFusion.Core/Validation/PropertyValidationFramework.cs",
                  "Property data validation: schema validation, business rules, value range constraints, cross-field consistency. Forge data quality."),
    "LEV-078": p("TerraForge", FV, "forge.valuation.validation_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Property data validation tests: schema, business rules, value ranges. Tests for Forge validation logic."),

    # ═══ SPATIAL / GIS (TerraAtlas) ═══
    "LEV-086": p("TerraAtlas", AG, "atlas.gis.levy_district_map",
                  "frontend/src/components/levy/Map/",
                  "Immersive map: interactive GIS tax district map with polygon rendering. Spatial interaction surface."),
    "LEV-087": p("TerraAtlas", AG, "atlas.gis.district_polygon_gen",
                  "frontend/src/components/levy/Map/",
                  "Polygon generator: creates GIS polygons for tax district visualization. Spatial geometry logic."),
    "LEV-130": p("TerraAtlas", AG, "atlas.gis.immersive_map_page",
                  "frontend/src/pages/levy/Map/",
                  "Immersive district map template: full-screen interactive GIS map for tax district visualization. Spatial UI."),

    # ═══ AUTH & ADMIN (DECLINED — canonical exists) ═══
    "LEV-035": d("Flask auth routes. Canonical auth in TerraFusion.Security with .NET Identity.",
                  "backend/TerraFusion.Security/Auth/"),
    "LEV-036": d("Flask auth utils. Canonical auth service exists.",
                  "backend/TerraFusion.Security/Auth/AuthService.cs"),
    "LEV-039": d("Flask admin routes. Canonical admin in TerraFusion.API/Controllers/AdminController.cs.",
                  "backend/TerraFusion.API/Controllers/AdminController.cs"),
    "LEV-144": d("Admin user creation script. Canonical admin bootstrap exists.",
                  "scripts/seed-benton-database.sh"),

    # ═══ MCP / AI FRAMEWORK (DECLINED — canonical exists in TerraFusion.AI) ═══
    "LEV-044": d("MCP core framework. Canonical MCP exists in TerraFusion.AI.",
                  "backend/TerraFusion.AI/"),
    "LEV-045": d("MCP base agent class. Canonical MCP agent framework exists.",
                  "backend/TerraFusion.AI/"),
    "LEV-046": d("Anthropic Claude API wrapper. Canonical AI service exists.",
                  "backend/TerraFusion.AI/Services/"),
    "LEV-125": d("MCP army route. Canonical MCP orchestration exists.",
                  "backend/TerraFusion.Consciousness/"),
    "LEV-126": d("MCP agent manager. Canonical agent lifecycle in Consciousness.",
                  "backend/TerraFusion.Consciousness/"),
    "LEV-127": d("MCP army init. Canonical swarm bootstrap exists.",
                  "backend/TerraFusion.Consciousness/"),
    "LEV-145": d("MCP API endpoints. Canonical MCP API exists.",
                  "backend/TerraFusion.AI/MCP/"),
    "LEV-146": d("MCP dashboard routes. Canonical MCP dashboard exists.",
                  "backend/TerraFusion.AI/MCP/"),
    "LEV-147": d("MCP UI routes. Canonical MCP management UI exists.",
                  "frontend/src/pages/"),
    "LEV-148": d("MCP templates. Canonical MCP UI exists in React.",
                  "frontend/src/pages/"),

    # ═══ INFRASTRUCTURE UTILITIES (DECLINED — canonical exists) ═══
    "LEV-049": d("Schema compatibility utils. Flask/SQLAlchemy-specific raw SQL workarounds. Canonical uses EF Core.",
                  "backend/TerraFusion.Data/"),
    "LEV-050": d("Audit logging utils. Canonical audit exists in TerraFusion.Security.",
                  "backend/TerraFusion.Security/Audit/"),
    "LEV-051": d("API call logging. Canonical OpenTelemetry-based logging exists.",
                  "backend/TerraFusion.Core/"),
    "LEV-052": d("Error handling utils. Canonical error handling middleware exists.",
                  "backend/TerraFusion.Core/"),
    "LEV-053": d("HTML sanitizer. Canonical security sanitization exists.",
                  "backend/TerraFusion.Security/"),
    "LEV-054": d("Sanitize utils. Duplicate of LEV-053.",
                  "backend/TerraFusion.Security/"),
    "LEV-055": d("Filter utils. Generic query filtering; canonical uses EF Core LINQ.",
                  "backend/TerraFusion.Core/"),

    # ═══ MIGRATIONS (mixed) ═══
    "LEV-056": p("TerraDais", DL, "dais.levy.initial_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Initial levy schema creation. Schema reference for EF Core migration authoring."),
    "LEV-057": d("API call log migration. Infrastructure concern covered by canonical logging.",
                  "backend/TerraFusion.Data/Migrations/"),
    "LEV-058": p("TerraDais", DL, "dais.levy.historical_rates_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Historical rates table migration. Multi-year rate tracking schema."),
    "LEV-059": p("TerraDais", DL, "dais.levy.audit_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Levy audit table migration. Compliance audit records schema."),
    "LEV-061": d("Search index migration. Canonical handles indexing via EF Core.",
                  "backend/TerraFusion.Data/"),
    "LEV-062": d("Alembic migration config. Flask/Alembic-specific. Canonical uses EF Core migrations.",
                  "backend/TerraFusion.Data/Migrations/"),
    "LEV-136": p("TerraDais", DL, "dais.levy.scenario_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Levy scenario columns migration. Adds what-if analysis fields."),
    "LEV-138": p("TerraDais", DL, "dais.levy.district_enhanced_schema",
                  "backend/TerraFusion.Data/Migrations/",
                  "Tax district columns migration. Enhanced tracking fields."),

    # ═══ SCRIPTS (mixed) ═══
    "LEV-063": d("DB init script. Canonical uses EF Core migrations + seed scripts.",
                  "scripts/seed-benton-database.sh"),
    "LEV-064": p("TerraDais", DL, "dais.levy.sample_data_seeding",
                  "scripts/levy/",
                  "Sample data seeder: demo districts, codes, properties, rates. Test data for levy module."),
    "LEV-065": p("TerraDais", DL, "dais.levy.historical_rates_seeding",
                  "scripts/levy/",
                  "Historical rates seeder: multi-year rate data for trend analysis testing."),
    "LEV-066": d("Demo environment seeder. Redundant with LEV-064 + LEV-065 combined.",
                  "LEV-064 + LEV-065"),
    "LEV-068": d("PostgreSQL backup tool. Canonical backup tooling exists in ops scripts.",
                  "scripts/"),
    "LEV-069": d("Flask CLI tool. Framework-specific CLI. Canonical uses .NET CLI.",
                  "none"),
    "LEV-070": d("Production migration script. One-time SQLite→PostgreSQL migration, no longer needed.",
                  "none"),
    "LEV-129": p("TerraDais", DL, "dais.levy.compliance_test_data",
                  "scripts/levy/",
                  "Compliance test data seeder: creates test scenarios for compliance validation."),
    "LEV-143": p("TerraDais", DL, "dais.levy.tax_code_seeding",
                  "scripts/levy/",
                  "Tax code insertion script for populating tax code reference data."),

    # ═══ TESTS ═══
    "LEV-071": p("TerraDais", DL, "dais.levy.calculator_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Levy calculator tests: unit tests for core calculation functions."),
    "LEV-072": p("TerraDais", DL, "dais.levy.integration_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Levy integration tests: end-to-end workflow tests."),
    "LEV-073": p("TerraDais", DL, "dais.levy.visualization_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Levy visualization tests: chart and visualization generation tests."),
    "LEV-074": p("TerraDais", DL, "dais.levy.forecasting_tests",
                  "backend/TerraFusion.API.Tests/Levy/",
                  "Forecasting tests: forecast model and prediction tests."),
    "LEV-079": d("Schema tests. ORM model alignment tests specific to SQLAlchemy. Canonical uses EF Core.",
                  "backend/TerraFusion.API.Tests/"),
    "LEV-080": d("Test fixtures / conftest. Pytest-specific test infra. Canonical uses xUnit/.NET.",
                  "backend/TerraFusion.API.Tests/"),

    # ═══ FRONTEND UI — FLASK TEMPLATES & VANILLA JS (DECLINED — canonical uses React) ═══
    "LEV-081": d("Flask CSS stylesheet. Canonical uses Tailwind CSS 4.1.",
                  "frontend/src/styles/"),
    "LEV-082": d("Vanilla JS dashboard. Canonical uses React + Recharts.",
                  "frontend/src/components/levy/"),
    "LEV-083": d("Vanilla JS levy calculator. Canonical uses React components.",
                  "frontend/src/components/levy/"),
    "LEV-084": d("Vanilla JS chart functions. Canonical uses Recharts.",
                  "frontend/src/components/levy/"),
    "LEV-085": d("Vanilla JS budget impact simulator. Canonical uses React.",
                  "frontend/src/components/levy/"),
    "LEV-088": d("Vanilla JS district import preview. Canonical uses React.",
                  "frontend/src/components/levy/"),
    "LEV-089": d("IntroJS guided tour. Not part of canonical UX pattern.",
                  "none"),
    "LEV-090": d("Flask Jinja base template. Canonical uses React layouts.",
                  "frontend/src/layouts/"),
    "LEV-091": d("Flask levy calculator HTML. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-092": d("Flask dashboard HTML. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-093": d("Flask forecasting templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-094": d("Flask levy audit templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-095": d("Flask levy export templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-096": d("Flask data management templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-097": d("Flask data quality templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-098": d("Flask assessment templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-099": d("Flask tax strategy templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-100": d("Flask public portal templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-101": d("Flask report templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-102": d("Flask user audit templates. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-103": d("Flask auth templates. Canonical uses React pages.",
                  "frontend/src/pages/auth/"),
    "LEV-104": d("Flask budget impact template. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-105": d("Flask bill impact template. Canonical uses React pages.",
                  "frontend/src/pages/levy/"),
    "LEV-131": d("County branding assets. Canonical handles theming via design system.",
                  "frontend/public/images/"),
    "LEV-132": d("SVG/CSS loading animations. Canonical uses React loading patterns.",
                  "frontend/src/components/"),
    "LEV-140": d("Extracted Next.js components. Duplicate UI component library.",
                  "frontend/src/components/"),
    "LEV-141": d("Extracted shadcn/ui library. Exact duplicate of canonical shadcn in frontend/src/components/ui/.",
                  "frontend/src/components/ui/"),

    # ═══ REFERENCE DATA & SAMPLE DATA (PORTED) ═══
    "LEV-106": p("TerraDais", DL, "dais.levy.sample_property_data",
                  "scripts/levy/sample-data/",
                  "Sample property CSV for testing and demos."),
    "LEV-107": p("TerraDais", DL, "dais.levy.sample_tax_codes",
                  "scripts/levy/sample-data/",
                  "Sample tax codes CSV mapping code areas to districts."),
    "LEV-108": p("TerraDais", DL, "dais.levy.tca_reference",
                  "scripts/levy/reference-data/",
                  "TCA reference CSV with district-to-code mappings. Production reference data."),
    "LEV-109": p("TerraDais", DL, "dais.levy.pacs_export_samples",
                  "scripts/levy/reference-data/",
                  "Real Benton County PACS levy export files (TXT, XLS, XLSX, XML). Production reference data."),

    # ═══ 2025 REFERENCE DOCUMENTATION (PORTED — real levy worksheets) ═══
    "LEV-110": p("TerraDais", DL, "dais.levy.limitation_worksheets",
                  "docs/levy/reference/2025-limitations/",
                  "2025 Levy Limitations Worksheets: HLL calculations for all Benton County districts."),
    "LEV-111": p("TerraDais", DL, "dais.levy.dor_reports",
                  "docs/levy/reference/2025-dor-reports/",
                  "2025 DOR Reports: state levy values, banked capacity, certification, total levies by TCA."),
    "LEV-112": p("TerraDais", DL, "dais.levy.calc_summaries",
                  "docs/levy/reference/2025-calc-summaries/",
                  "2025 Levy Calc Summary Reports: per-district calculation summaries."),
    "LEV-113": p("TerraDais", DL, "dais.levy.constitutional_1pct",
                  "docs/levy/reference/",
                  "Constitutional 1% levy calculation worksheet for 2025."),
    "LEV-114": p("TerraDais", DL, "dais.levy.rate_spread",
                  "docs/levy/reference/",
                  "County rate spread worksheet 2025: rate distribution across districts."),
    "LEV-115": p("TerraDais", DL, "dais.levy.ospi_data",
                  "docs/levy/reference/",
                  "OSPI school district levy data 2025."),
    "LEV-116": p("TerraDais", DL, "dais.levy.preliminary_values",
                  "docs/levy/reference/2025-preliminary-values/",
                  "Preliminary values reports for 2025: 3 rounds for school districts and all districts."),
    "LEV-117": p("TerraDais", DL, "dais.levy.hll_panels",
                  "docs/levy/reference/2025-hll-panels/",
                  "HLL Panel images: screenshots of Highest Lawful Levy calculations."),
    "LEV-134": p("TerraDais", DL, "dais.levy.treasurer_certification",
                  "docs/levy/reference/2025-certification/",
                  "Certification to Treasurer: final certification documents and tax collection workbooks."),
    "LEV-135": p("TerraDais", DL, "dais.levy.district_hll_assistance",
                  "docs/levy/reference/2025-district-assistance/",
                  "District assistance worksheets: HLL calculation examples for cities, fire, hospital, port, library."),

    # ═══ DOMAIN DOCUMENTATION (mixed) ═══
    "LEV-118": p("TerraDais", DL, "dais.levy.api_documentation",
                  "docs/levy/",
                  "REST API documentation: endpoints, request/response formats. Levy system API reference."),
    "LEV-119": p("TerraDais", DL, "dais.levy.data_dictionary",
                  "docs/levy/",
                  "Data dictionary: field definitions for all levy database tables. Schema reference."),
    "LEV-120": d("Application structure docs. Flask-specific architecture overview. Superseded by canonical docs.",
                  "docs/architecture/"),
    "LEV-122": d("MCP framework docs. Canonical MCP documentation exists.",
                  "docs/"),
    "LEV-123": d("PostgreSQL migration guide. One-time migration, no longer needed.",
                  "none"),
    "LEV-124": d("Backup/restore docs. Canonical ops documentation exists.",
                  "docs/"),

    # ═══ CONFIG FILES (DECLINED — framework-specific) ═══
    "LEV-133": d("pyproject.toml. Python dependency file. Canonical uses .NET NuGet + npm.",
                  "backend/Directory.Packages.props"),
    "LEV-139": d("WSGI entry point. Flask-specific production config.",
                  "none"),

    # ═══ FLASK HOME PAGE (DECLINED) ═══
    "LEV-043": d("Flask home/landing routes. Canonical uses React Router.",
                  "frontend/src/pages/"),

    # ═══ AI-POWERED FEATURES (DEFERRED — TerraGPT charter) ═══
    "LEV-007": df("AI-enhanced forecasting with Claude API: explanations, recommendations, model selection. "
                  "Blocked on TerraGPT architecture charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "LEV-019": df("AI-powered levy audit agent (Lev): compliance verification, law explanation, "
                  "optimization recommendations. Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "LEV-029": df("MCP property assessment agents: DataValidation, Valuation, Compliance, Workflow agents. "
                  "Blocked on TerraGPT architecture charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "LEV-075": df("AI forecasting tests. Blocked on TerraGPT: tests cannot be ported until AI service architecture defined.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "LEV-128": df("Advanced AI analysis agent for complex multi-step analysis. "
                  "Blocked on TerraGPT architecture charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
}


# ─── Apply dispositions to manifest ─────────────────────────────────────
def main() -> None:
    manifest_path = Path(__file__).resolve().parents[2] / "phase4b.manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    repo = next(r for r in manifest["repos"] if r["name"] == REPO_NAME)

    # Verify every asset has a disposition
    asset_ids = {a["asset_id"] for a in repo["assets"]}
    disp_ids = set(DISPOSITIONS.keys())
    missing = asset_ids - disp_ids
    extra = disp_ids - asset_ids
    if missing:
        raise ValueError(f"Assets without disposition: {sorted(missing)}")
    if extra:
        raise ValueError(f"Dispositions for non-existent assets: {sorted(extra)}")

    # Apply dispositions
    for asset in repo["assets"]:
        aid = asset["asset_id"]
        disp = DISPOSITIONS[aid]
        asset["status"] = disp["status"]
        asset["disposition_rationale"] = disp["disposition_reason"]
        asset["parity_mode"] = disp["parity_mode"]
        asset["replacement_ref"] = disp["replacement_ref"]
        asset["migration_batch"] = disp["migration_batch"]
        asset["security_review"] = disp["security_review"]
        asset["updated_at"] = NOW
        if disp["status"] == "ported":
            asset["canonical_capability"] = disp["canonical_capability"]
            asset["target_home"] = disp["target_home"]
            asset["owner_suite"] = disp["owner_suite"]
        if disp["status"] == "deferred-with-rationale":
            asset["blocker_type"] = disp["blocker_type"]
            asset["unblock_condition"] = disp["unblock_condition"]
            asset["decision_owner"] = disp["decision_owner"]
        if disp["status"] == "declined":
            asset["disposition_owner"] = disp["decision_owner"]

    # Repo-level timestamps
    repo["disposition_started_at"] = NOW
    repo["disposition_completed_at"] = NOW

    # Verify no pending assets remain
    pending = [a["asset_id"] for a in repo["assets"] if a["status"] == "pending"]
    if pending:
        raise ValueError(f"Assets still pending after disposition: {pending}")

    # Write back
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # ─── Summary ────────────────────────────────────────────────────────
    counts = {"ported": 0, "declined": 0, "deferred-with-rationale": 0}
    suite_counts: dict[str, int] = {}
    batch_counts: dict[str, int] = {}
    canon_rows: list[str] = []
    atlas_rows: list[str] = []
    deferred_rows: list[str] = []

    for asset in repo["assets"]:
        s = asset["status"]
        counts[s] = counts.get(s, 0) + 1
        if s == "ported":
            suite = asset["owner_suite"]
            batch = asset["migration_batch"]
            suite_counts[suite] = suite_counts.get(suite, 0) + 1
            batch_counts[batch] = batch_counts.get(batch, 0) + 1
            if suite == "TerraCanon":
                canon_rows.append(
                    f"  {asset['asset_id']}: {asset['canonical_capability']} — "
                    f"{asset['disposition_rationale'][:80]}"
                )
            if suite == "TerraAtlas":
                atlas_rows.append(
                    f"  {asset['asset_id']}: {asset['canonical_capability']} — "
                    f"{asset['disposition_rationale'][:80]}"
                )
        if s == "deferred-with-rationale":
            deferred_rows.append(
                f"  {asset['asset_id']}: {asset.get('blocker_type','?')} — "
                f"{asset['disposition_rationale'][:100]}"
            )

    print(f"=== BCBSLevy Disposition Complete ===")
    print(f"Total: {len(repo['assets'])} assets")
    print(f"  ported: {counts.get('ported', 0)}")
    print(f"  declined: {counts.get('declined', 0)}")
    print(f"  deferred: {counts.get('deferred-with-rationale', 0)}")
    print()
    print("By owner suite:")
    for suite, c in sorted(suite_counts.items()):
        print(f"  {suite}: {c}")
    print()
    print("By migration batch:")
    for batch, c in sorted(batch_counts.items()):
        print(f"  {batch}: {c}")
    print()
    print(f"TerraCanon rows ({len(canon_rows)} — each with justification):")
    for row in canon_rows:
        print(row)
    print()
    print(f"TerraAtlas rows ({len(atlas_rows)} — each with justification):")
    for row in atlas_rows:
        print(row)
    print()
    print(f"Deferred rows ({len(deferred_rows)}):")
    for row in deferred_rows:
        print(row)
    print()
    print(f"Security: All {counts.get('ported',0)} ported assets have remediation_note (P4B-009, secrets_status=high)")
    print(f"Manifest written to: {manifest_path}")


if __name__ == "__main__":
    main()
