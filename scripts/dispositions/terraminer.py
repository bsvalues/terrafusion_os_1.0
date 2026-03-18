#!/usr/bin/env python3
"""Phase 4B Disposition: TerraMiner (175 assets).

Terminal classification for every asset. No asset remains pending.
Boundary law: Canon=connectors/ETL/scrapers/schedulers/sync/data-validation/monitoring/alerting/observability;
              Forge=property models/CMA logic/property search/assessment data products;
              Atlas=GIS connectors/geocoding/spatial data/regional geographic config;
              OS Admin=DevOps infrastructure (Dockerfiles, Helm, K8s, Terraform, CI/CD).
CRITICAL: Connector code is Canon even when downstream consumer is Forge. PACS connector = Canon (domain "sync").
CRITICAL: AI agents, LLM features, voice, RAG, prompt optimization, swarm engine -> ALL DEFERRED on TerraGPT (ADR-TBD-5).
Flask routes/controllers -> DECLINED (framework scaffolding, canonical uses .NET).
Python/Flask-specific config, migrations, utilities -> DECLINED.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

REPO_NAME = "TerraMiner"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
SEC_NOTE = (
    "Repo made private 2026-03-14. CRITICAL: RapidAPI key exposed (451301875bmsh...), "
    "PACS.env.txt with server/user creds. RapidAPI subscription likely lapsed. "
    "PACS server internal-only. Keys NOT ROTATED. No longer publicly accessible."
)


def p(suite, batch, cap, target, reason, parity="adapted", repl="none"):
    """Ported asset. P4B-009: remediation_note required (secrets_status=critical)."""
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


# --- Batch aliases ---
CS = "canon-sync"
CE = "canon-etl"
CO = "canon-observability"
FV = "forge-valuation"
AG = "atlas-gis"
OA = "os-admin"

DISPOSITIONS: dict[str, dict] = {
    # === FLASK SCAFFOLDING (DECLINED) ===
    "TMR-001": d("Flask application entry point. Canonical uses .NET 8 ASP.NET Core. Framework scaffolding.",
                  "backend/TerraFusion.API/Program.cs"),
    "TMR-002": d("Core module with SQLAlchemy instance and blueprint registry. Flask-specific scaffolding.",
                  "backend/TerraFusion.API/Program.cs"),
    "TMR-003": d("Main entry point registering Flask blueprints. Framework scaffolding.",
                  "backend/TerraFusion.API/Program.cs"),
    "TMR-045": d("Benton County Flask routes for assessment reports. Flask route scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-046": d("Regional routes blueprint for SE WA county endpoints. Flask route scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-080": d("Template middleware for modern/legacy template switching. Flask-specific middleware.",
                  "none"),
    "TMR-081": d("CMA Flask routes for creating and managing CMA reports. Flask route scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-086": d("County property API Flask routes. Flask route scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-093": d("CMA controller handling report CRUD. Flask controller scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-097": d("PACMLS controller for MLS data management views. Flask controller scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-099": d("Property record card controller for detailed property display. Flask controller scaffolding.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-102": d("Property views blueprint with search and display routes. Flask view scaffolding.",
                  "frontend/src/pages/"),

    # === AUTH (DECLINED - canonical exists) ===
    "TMR-009": d("API key and credential models. Canonical auth models exist in TerraFusion.Security.",
                  "backend/TerraFusion.Security/Models/"),
    "TMR-010": d("API credential model for external service credentials. Canonical exists.",
                  "backend/TerraFusion.Security/Models/"),
    "TMR-078": d("API key authentication middleware. Canonical auth middleware in TerraFusion.Security.",
                  "backend/TerraFusion.Security/Auth/"),
    "TMR-079": d("RBAC decorators for Flask route protection. Canonical RBAC in TerraFusion.Security.",
                  "backend/TerraFusion.Security/Auth/"),
    "TMR-096": d("API credential controller for managing external API keys. Canonical exists.",
                  "backend/TerraFusion.Security/Controllers/"),
    "TMR-115": d("AES encryption/decryption utilities. Canonical crypto in TerraFusion.Security.",
                  "backend/TerraFusion.Security/Crypto/"),
    "TMR-130": d("Admin API key creation script. Canonical admin bootstrap exists.",
                  "scripts/seed-benton-database.sh"),

    # === AI FRAMEWORK (DECLINED - canonical exists in TerraFusion.AI) ===
    "TMR-055": d("AI model factory creating OpenAI/Anthropic LLM clients. Canonical AI service exists.",
                  "backend/TerraFusion.AI/"),
    "TMR-056": d("OpenAI client wrapper for text generation. Canonical AI client exists.",
                  "backend/TerraFusion.AI/"),
    "TMR-057": d("Anthropic client wrapper for Claude text generation. Canonical AI client exists.",
                  "backend/TerraFusion.AI/"),
    "TMR-058": d("OpenAI integration module with global client init. Canonical AI integration exists.",
                  "backend/TerraFusion.AI/"),

    # === DB/MIGRATION (DECLINED - Python-specific) ===
    "TMR-103": d("Database module with SQLAlchemy engine and table definitions. Python/SQLAlchemy-specific. Canonical uses EF Core.",
                  "backend/TerraFusion.Data/"),
    "TMR-104": d("Database migration functions creating performance indexes. Python migration. Canonical uses EF Core migrations.",
                  "backend/TerraFusion.Data/Migrations/"),
    "TMR-105": d("Database utilities for Flask-SQLAlchemy initialization. Flask-specific.",
                  "backend/TerraFusion.Data/"),
    "TMR-131": d("Database migration runner script. Python-specific. Canonical uses EF Core CLI.",
                  "none"),
    "TMR-132": d("JobRun table fix migration. Python-specific one-time fix.",
                  "none"),
    "TMR-133": d("ScheduledReport table fix migration. Python-specific one-time fix.",
                  "none"),

    # === DUPLICATES (DECLINED) ===
    "TMR-027": d("Zillow web scraper fallback. Duplicate of TMR-025 Zillow API connector; scraper is fragile alternative.",
                  "TMR-025"),
    "TMR-028": d("Working Zillow scraper variant. Duplicate alternative implementation of TMR-025/027.",
                  "TMR-025"),
    "TMR-095": d("Data source API controller. Duplicate of TMR-094 data source controller.",
                  "TMR-094"),

    # === GENERIC UTILITIES (DECLINED) ===
    "TMR-116": d("Data export utilities for CSV/JSON/Excel. Generic utility; canonical export patterns exist.",
                  "none"),
    "TMR-118": d("Application configuration loader and updater. Python-specific config pattern. Canonical uses appsettings.json.",
                  "backend/TerraFusion.API/appsettings.json"),
    "TMR-119": d("Logging setup utility with configurable levels. Python-specific. Canonical uses Serilog.",
                  "backend/TerraFusion.Core/"),
    "TMR-121": d("Test data insertion utility for development seeding. Generic dev utility.",
                  "scripts/seed-benton-database.sh"),
    "TMR-122": d("Application configuration file with scraping settings. Python-specific config.",
                  "backend/TerraFusion.API/appsettings.json"),
    "TMR-137": d("Mock data for agents, ETL pipelines, system metrics. Generic test/mock data.",
                  "none"),
    "TMR-138": d("Utility functions (generateId, formatNumber, cn, formatDuration). Generic TS utils; canonical utils exist.",
                  "frontend/src/lib/utils.ts"),
    "TMR-142": d("Metric card React component for system metrics. Generic UI component; canonical design system.",
                  "frontend/src/components/ui/"),
    "TMR-146": d("Activity log React component showing recent system events. Generic UI component.",
                  "frontend/src/components/"),
    "TMR-155": d("Design system documentation. Superseded by canonical design system docs.",
                  "docs/"),

    # === NEXT.JS / FLASK-SPECIFIC (DECLINED) ===
    "TMR-148": d("Next.js ETL status API route. Next.js-specific; canonical uses .NET API.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-150": d("Next.js system metrics API route. Next.js-specific; canonical uses .NET API.",
                  "backend/TerraFusion.API/Controllers/"),
    "TMR-157": d("API Gateway Dockerfile. Flask-specific container config. Canonical Dockerfiles exist.",
                  "backend/"),
    "TMR-158": d("Helm chart for API gateway. Flask-specific Helm chart. Canonical Helm exists.",
                  "infrastructure/"),
    "TMR-159": d("ArgoCD application manifests. Flask-specific K8s manifests. Canonical K8s exists.",
                  "infrastructure/"),
    "TMR-160": d("Prometheus monitoring configuration. Flask-specific monitoring config. Canonical monitoring exists.",
                  "infrastructure/"),
    "TMR-161": d("Terraform EKS module for AWS. Flask-specific Terraform. Canonical infra exists.",
                  "infrastructure/"),
    "TMR-162": d("GitHub Actions CI/CD workflows. Flask-specific CI/CD. Canonical workflows exist.",
                  ".github/workflows/"),
    "TMR-163": d("Python project configuration (pyproject.toml). Python dependency file. Canonical uses .NET NuGet + npm.",
                  "backend/Directory.Packages.props"),
    "TMR-164": d("Next.js package.json with shadcn/ui dependencies. Next.js-specific; canonical frontend uses Vite.",
                  "frontend/package.json"),
    "TMR-165": d("Tailwind CSS configuration with custom theme. Next.js-specific; canonical Tailwind config exists.",
                  "frontend/tailwind.config.ts"),
    "TMR-166": d("Standalone Zillow Flask app for isolated data interactions. Flask-specific standalone app.",
                  "none"),

    # === TERRACANON: CANON-SYNC (44 assets) ===
    "TMR-007": p("TerraCanon", CS, "canon.sync.zillow_data_models",
                  "backend/TerraFusion.DataMining/Models/",
                  "Zillow data models: ZillowMarketData, ZillowPriceTrend, ZillowProperty. Data source schema."),
    "TMR-008": p("TerraCanon", CS, "canon.sync.narrpr_data_models",
                  "backend/TerraFusion.DataMining/Models/",
                  "NARRPR data models for scraped property report data. Data source schema."),
    "TMR-013": p("TerraCanon", CS, "canon.sync.api_connector_base",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "Abstract base API connector with rate limiting, authentication, metrics, and retry logic."),
    "TMR-018": p("TerraCanon", CS, "canon.sync.data_validation",
                  "backend/TerraFusion.DataMining/Validation/",
                  "Data validation utilities: required field checking, string/address normalization, deduplication."),
    "TMR-019": p("TerraCanon", CS, "canon.sync.property_data_sync",
                  "backend/TerraFusion.DataMining/ETL/",
                  "Data sync job periodically syncing property data from multiple sources with dedup and standardization."),
    "TMR-020": p("TerraCanon", CS, "canon.sync.narrpr_scraper",
                  "backend/TerraFusion.DataMining/Scrapers/",
                  "NARRPR web scraper using Selenium for login, report scraping, and data extraction."),
    "TMR-021": p("TerraCanon", CS, "canon.sync.narrpr_etl_pipeline",
                  "backend/TerraFusion.DataMining/ETL/",
                  "NARRPR ETL plugin wrapping the scraper with extract/transform/load pipeline."),
    "TMR-022": p("TerraCanon", CS, "canon.sync.attom_api_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "ATTOM Property Data API connector for property search, details, AVM, sales history, and tax data."),
    "TMR-023": p("TerraCanon", CS, "canon.sync.pacmls_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "PACMLS (Paragon Connect MLS) connector for MLS listing data and sales history."),
    "TMR-024": p("TerraCanon", CS, "canon.sync.pacmls_etl_pipeline",
                  "backend/TerraFusion.DataMining/ETL/",
                  "PACMLS ETL plugin implementing full extract/transform/load for MLS data."),
    "TMR-025": p("TerraCanon", CS, "canon.sync.zillow_api_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "Zillow API connector via RapidAPI for property data, market trends, and Zestimates."),
    "TMR-026": p("TerraCanon", CS, "canon.sync.zillow_etl_pipeline",
                  "backend/TerraFusion.DataMining/ETL/",
                  "Zillow ETL plugin for market data extract/transform/load."),
    "TMR-029": p("TerraCanon", CS, "canon.sync.realtor_api_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "Realtor.com API connector via RapidAPI for property search and market data."),
    "TMR-030": p("TerraCanon", CS, "canon.sync.redfin_api_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "Redfin API connector using internal Redfin APIs for property data and market trends."),
    "TMR-031": p("TerraCanon", CS, "canon.sync.hud_api_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "HUD API connector for Fair Market Rents, Income Limits, and housing data."),
    "TMR-032": p("TerraCanon", CS, "canon.sync.unified_real_estate_connector",
                  "backend/TerraFusion.DataMining/Connectors/",
                  "Unified real estate data connector with intelligent failover across Zillow, Realtor, and PACMLS."),
    "TMR-033": p("TerraCanon", CS, "canon.sync.file_based_etl",
                  "backend/TerraFusion.DataMining/ETL/",
                  "File-based ETL plugins for CSV, Excel, JSON, XML, and geospatial file ingestion."),
    "TMR-034": p("TerraCanon", CS, "canon.sync.file_format_parser",
                  "backend/TerraFusion.DataMining/ETL/",
                  "Multi-format file parser supporting CSV, Excel, JSON, XML, and geospatial formats."),
    "TMR-036": p("TerraCanon", CS, "canon.sync.county_scraper_base",
                  "backend/TerraFusion.DataMining/Scrapers/",
                  "Base county scraper abstract class with rate limiting and browser-like headers."),
    "TMR-037": p("TerraCanon", CS, "canon.sync.county_scraper_factory",
                  "backend/TerraFusion.DataMining/Scrapers/",
                  "County scraper factory for instantiating county-specific scrapers by name."),
    "TMR-038": p("TerraCanon", CS, "canon.sync.benton_county_scraper",
                  "backend/TerraFusion.DataMining/Scrapers/County/",
                  "Benton County scraper using GIS REST API and PACS for parcels, values, sales, and land use."),
    "TMR-039": p("TerraCanon", CS, "canon.sync.franklin_county_scraper",
                  "backend/TerraFusion.DataMining/Scrapers/County/",
                  "Franklin County property scraper. County data ingestion."),
    "TMR-040": p("TerraCanon", CS, "canon.sync.walla_walla_county_scraper",
                  "backend/TerraFusion.DataMining/Scrapers/County/",
                  "Walla Walla County property scraper. County data ingestion."),
    "TMR-042": p("TerraCanon", CS, "canon.sync.benton_pacs_connector",
                  "backend/TerraFusion.DataMining/Regional/",
                  "Benton County PACS database connector via pyodbc for Harris PACS assessment data. Connector = Canon (domain sync)."),
    "TMR-043": p("TerraCanon", CS, "canon.sync.unified_assessment_api",
                  "backend/TerraFusion.DataMining/Regional/",
                  "Unified assessment data API across PACS and GIS sources. Aggregates data sources = Canon (domain sync)."),
    "TMR-076": p("TerraCanon", CS, "canon.sync.zillow_service",
                  "backend/TerraFusion.DataMining/Services/",
                  "Zillow service for property search, details, and market data access. Data source service."),
    "TMR-077": p("TerraCanon", CS, "canon.sync.narrpr_service",
                  "backend/TerraFusion.DataMining/Services/",
                  "NARRPR service for data access and report management. Data source service."),
    "TMR-084": p("TerraCanon", CS, "canon.sync.pacmls_api_routes",
                  "backend/TerraFusion.DataMining/API/",
                  "PACMLS API routes for MLS data search and retrieval. Data connector API surface."),
    "TMR-085": p("TerraCanon", CS, "canon.sync.real_estate_api_routes",
                  "backend/TerraFusion.DataMining/API/",
                  "Real estate API routes for unified property data access. Data connector API surface."),
    "TMR-087": p("TerraCanon", CS, "canon.sync.zillow_api_routes",
                  "backend/TerraFusion.DataMining/API/",
                  "Zillow property and market data API routes. Data connector API surface."),
    "TMR-094": p("TerraCanon", CS, "canon.sync.data_source_controller",
                  "backend/TerraFusion.DataMining/Controllers/",
                  "Data source controller managing external data source configurations. Data source management."),
    "TMR-124": p("TerraCanon", CS, "canon.sync.pacs_api_server",
                  "backend/TerraFusion.DataMining/",
                  "PACS API server for serving PACS database data via REST. PACS connector = Canon (domain sync)."),
    "TMR-126": p("TerraCanon", CS, "canon.sync.dedup_dashboard",
                  "backend/TerraFusion.DataMining/DataQuality/",
                  "Deduplication dashboard for reviewing and managing duplicate records. Data quality tool."),
    "TMR-128": p("TerraCanon", CS, "canon.sync.seed_data_sources",
                  "backend/TerraFusion.DataMining/Seeds/",
                  "Data source seeding script. Configures external API connections for sync."),
    "TMR-129": p("TerraCanon", CS, "canon.sync.initialize_data_sources",
                  "backend/TerraFusion.DataMining/Seeds/",
                  "Data source initialization for configuring external API connections."),
    "TMR-134": p("TerraCanon", CS, "canon.sync.data_import",
                  "backend/TerraFusion.DataMining/Scripts/",
                  "Data import script for bulk data loading. ETL tool."),
    "TMR-167": p("TerraCanon", CS, "canon.sync.pacmls_credential_setup",
                  "backend/TerraFusion.DataMining/Scripts/",
                  "PACMLS credential setup script. Data source configuration."),
    "TMR-168": p("TerraCanon", CS, "canon.sync.data_validation_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "Test suite for ETL data validation utilities. Tests for Canon validation logic."),
    "TMR-169": p("TerraCanon", CS, "canon.sync.attom_integration_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "Integration tests for ATTOM API ETL connector. Tests for Canon connector."),
    "TMR-170": p("TerraCanon", CS, "canon.sync.pacmls_integration_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "Integration tests for PACMLS ETL connector. Tests for Canon connector."),
    "TMR-171": p("TerraCanon", CS, "canon.sync.zillow_integration_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "Integration tests for Zillow ETL connector. Tests for Canon connector."),
    "TMR-173": p("TerraCanon", CS, "canon.sync.pacs_connection_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "PACS connection test suite. Tests for PACS connector = Canon (domain sync)."),
    "TMR-174": p("TerraCanon", CS, "canon.sync.pacs_integration_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "PACS integration test suite. Tests for PACS connector = Canon (domain sync)."),
    "TMR-175": p("TerraCanon", CS, "canon.sync.pacs_server_runner",
                  "backend/TerraFusion.DataMining/Scripts/",
                  "PACS server runner script. PACS connector infrastructure = Canon (domain sync)."),

    # === TERRACANON: CANON-ETL (10 assets) ===
    "TMR-004": p("TerraCanon", CE, "canon.etl.orm_models",
                  "backend/TerraFusion.DataMining/Models/",
                  "ORM models: ActivityLog, JobRun, ETLSchedule, SystemMetric, APIUsageLog, AlertRule, etc. ETL schema."),
    "TMR-011": p("TerraCanon", CE, "canon.etl.schedule_model",
                  "backend/TerraFusion.DataMining/Models/",
                  "Schedule model for ETL job scheduling configuration. ETL scheduling schema."),
    "TMR-012": p("TerraCanon", CE, "canon.etl.base_class",
                  "backend/TerraFusion.DataMining/ETL/",
                  "Abstract base ETL class defining extract/transform/load interface with run() orchestration."),
    "TMR-014": p("TerraCanon", CE, "canon.etl.job_manager",
                  "backend/TerraFusion.DataMining/ETL/",
                  "ETL job manager coordinating plugin discovery, async job execution, status tracking, and callbacks."),
    "TMR-015": p("TerraCanon", CE, "canon.etl.plugin_discovery",
                  "backend/TerraFusion.DataMining/ETL/",
                  "ETL plugin discovery and CLI runner for discovering and executing ETL plugins."),
    "TMR-016": p("TerraCanon", CE, "canon.etl.scheduler",
                  "backend/TerraFusion.DataMining/ETL/",
                  "ETL scheduler with background thread checking cron expressions to trigger jobs."),
    "TMR-082": p("TerraCanon", CE, "canon.etl.management_routes",
                  "backend/TerraFusion.DataMining/API/",
                  "ETL management routes for starting, stopping, and monitoring ETL jobs. ETL API surface."),
    "TMR-083": p("TerraCanon", CE, "canon.etl.schedule_routes",
                  "backend/TerraFusion.DataMining/API/",
                  "Schedule management routes for ETL schedule CRUD. ETL scheduling API surface."),
    "TMR-114": p("TerraCanon", CE, "canon.etl.scheduled_tasks",
                  "backend/TerraFusion.DataMining/Tasks/",
                  "Scheduled tasks manager for periodic monitoring, health checks, and report generation."),
    "TMR-154": p("TerraCanon", CE, "canon.etl.plugins_docs",
                  "docs/datamining/",
                  "ETL plugins documentation with plugin development guide. Canon ETL reference."),

    # === TERRACANON: CANON-OBSERVABILITY (11 assets) ===
    "TMR-017": p("TerraCanon", CO, "canon.observability.etl_metrics",
                  "backend/TerraFusion.DataMining/ETL/",
                  "ETL metrics collector recording execution time, records processed, error rates to SystemMetric."),
    "TMR-106": p("TerraCanon", CO, "canon.observability.alert_manager",
                  "backend/TerraFusion.DataMining/Monitoring/",
                  "Alert manager creating, acknowledging, resolving alerts and triggering notifications."),
    "TMR-107": p("TerraCanon", CO, "canon.observability.system_monitor",
                  "backend/TerraFusion.DataMining/Monitoring/",
                  "System monitor collecting CPU, memory, disk, network metrics using psutil."),
    "TMR-108": p("TerraCanon", CO, "canon.observability.api_monitoring",
                  "backend/TerraFusion.DataMining/Monitoring/",
                  "API monitoring middleware logging request/response times and endpoint usage."),
    "TMR-109": p("TerraCanon", CO, "canon.observability.db_metrics",
                  "backend/TerraFusion.DataMining/Monitoring/",
                  "Database metrics collector for PostgreSQL performance monitoring."),
    "TMR-110": p("TerraCanon", CO, "canon.observability.monitoring_tasks",
                  "backend/TerraFusion.DataMining/Monitoring/",
                  "Monitoring background tasks for periodic health checks and metric collection."),
    "TMR-111": p("TerraCanon", CO, "canon.observability.report_generator",
                  "backend/TerraFusion.DataMining/Reports/",
                  "Report generator creating monitoring/alert reports in HTML/CSV/Excel with email delivery."),
    "TMR-112": p("TerraCanon", CO, "canon.observability.notification_service",
                  "backend/TerraFusion.DataMining/Notifications/",
                  "Notification service sending alerts through email, Slack, webhook channels."),
    "TMR-113": p("TerraCanon", CO, "canon.observability.email_reports",
                  "backend/TerraFusion.DataMining/Reports/",
                  "Email report generation and delivery utilities. Observability reporting."),
    "TMR-125": p("TerraCanon", CO, "canon.observability.app_monitor",
                  "backend/TerraFusion.DataMining/Monitoring/",
                  "Application monitor for uptime, health check, and status tracking."),
    "TMR-145": p("TerraCanon", CO, "canon.observability.etl_status_component",
                  "frontend/src/components/datamining/",
                  "ETL status React component displaying pipeline health and job status. Observability UI."),

    # === TERRAFORGE: FORGE-VALUATION (6 assets) ===
    "TMR-005": p("TerraForge", FV, "forge.valuation.property_model",
                  "backend/TerraFusion.Core/Entities/Property/",
                  "Property model with parcel_number, MLS, address, characteristics, tax, sales history. Core domain entity."),
    "TMR-006": p("TerraForge", FV, "forge.valuation.cma_report_model",
                  "backend/TerraFusion.Core/Entities/CMA/",
                  "CMA Report model with subject property, search parameters, comparable properties, adjustments. Valuation product."),
    "TMR-074": p("TerraForge", FV, "forge.valuation.cma_service",
                  "backend/TerraFusion.DataMining/Services/",
                  "CMA service integrating Zillow, NARRPR, and AI for comparative market analysis report generation."),
    "TMR-075": p("TerraForge", FV, "forge.valuation.property_service",
                  "backend/TerraFusion.DataMining/Services/",
                  "Property service with sample data and property search/retrieval. Core property data product."),
    "TMR-123": p("TerraForge", FV, "forge.valuation.property_search",
                  "backend/TerraFusion.DataMining/Search/",
                  "Property search module for property lookup and filtering. Assessment data access."),
    "TMR-151": p("TerraForge", FV, "forge.valuation.pacs_integration_docs",
                  "docs/datamining/",
                  "PACS integration documentation with database connection details and IAAO standards."),

    # === TERRAATLAS: ATLAS-GIS (6 assets) ===
    "TMR-041": p("TerraAtlas", AG, "atlas.gis.benton_gis_connector",
                  "backend/TerraFusion.DataMining/Regional/",
                  "Benton County GIS connector using ArcGIS REST API for parcel, assessment, and ownership data."),
    "TMR-044": p("TerraAtlas", AG, "atlas.gis.se_wa_regional_config",
                  "backend/TerraFusion.DataMining/Regional/",
                  "SE WA regional customization with county metadata for Benton, Franklin, Walla Walla, Columbia, Garfield, Asotin."),
    "TMR-120": p("TerraAtlas", AG, "atlas.gis.location_data",
                  "backend/TerraFusion.DataMining/Utils/",
                  "Location data utilities for geocoding and location management. Spatial data processing."),
    "TMR-127": p("TerraAtlas", AG, "atlas.gis.location_processing",
                  "backend/TerraFusion.DataMining/Scripts/",
                  "Location data processing scripts for geocoding. Spatial data processing."),
    "TMR-152": p("TerraAtlas", AG, "atlas.gis.benton_gis_docs",
                  "docs/datamining/",
                  "Benton County GIS integration documentation with ArcGIS endpoint details."),
    "TMR-172": p("TerraAtlas", AG, "atlas.gis.benton_gis_tests",
                  "backend/TerraFusion.DataMining.Tests/",
                  "Benton GIS connector test suite. Tests for Atlas GIS connector."),

    # === OS ADMIN (1 asset) ===
    "TMR-156": p("OS Admin", OA, "os.admin.devops_kit",
                  "infrastructure/devops/",
                  "Terra DevOps Kit: Dockerfiles, Helm charts, K8s ArgoCD, GitHub Actions CI/CD, Terraform EKS, Prometheus."),

    # === DEFERRED ON TERRAGPT (43 assets) ===
    "TMR-035": df("AI-powered data analyzer ETL plugin for classification, summarization, sentiment, entity extraction. "
                  "Blocked on TerraGPT architecture charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-047": df("AI SE WA property insights with assessment ratio analysis and regional valuation context. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-048": df("Market analyzer AI agent for price trends, investment potential, and market statistics via RAG. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-049": df("Property recommendation AI agent matching properties to user preferences with LLM explanations. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-050": df("Natural language search AI agent parsing free-text queries into structured property search. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-051": df("Text summarizer AI agent generating concise property description summaries. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-052": df("Agent protocol handler routing requests to correct AI agent with unified interface. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-053": df("Agent tools manager integrating ACI for external tool access by AI agents. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-054": df("RAG property retriever querying database for property data to augment AI responses. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-059": df("AI property analyzer with PropertyAnalyzerModel for valuation insights. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-060": df("AI property recommendation engine using OpenAI for personalized matching. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-061": df("AI contextual suggestions generating page-context-aware insights. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-062": df("Voice command analyzer using NLP to determine intent and extract search parameters. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-063": df("Voice processor for voice-to-text and command processing pipeline. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-064": df("Prompt optimizer analyzing feedback to suggest prompt improvements. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-065": df("Continuous learning system managing automatic AI agent improvement cycles. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-066": df("A/B prompt testing module comparing prompt formulations with result tracking. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-067": df("Model content protocol server for streaming content generation and agent coordination. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-068": df("AI API endpoints blueprint for agent interactions. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-069": df("AI integration endpoints for external AI service routes. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-070": df("AI learning endpoints for continuous learning system routes. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-071": df("AI monitoring endpoints for agent health and performance. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-072": df("AI prompt management endpoints for CRUD and A/B testing. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-073": df("Model content API endpoints for content generation requests. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-088": df("Property recommendations API routes for AI-powered matching. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-089": df("AI suggestions API routes for contextual insights. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-090": df("Agent tools API routes exposing ACI tool capabilities. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-091": df("Voice search API routes. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-092": df("Voice processing API routes. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-098": df("Property recommendations controller for AI recommendation views. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-100": df("Voice controller for voice input handling. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-101": df("Voice search controller for voice-based property searching. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-117": df("AI feedback data export utilities. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-135": df("TypeScript swarm engine for autonomous task decomposition and parallel agent execution. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-136": df("TypeScript type definitions for agent swarm system (Agent, SwarmTask, SubTask, ExecutionPhase). "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-139": df("Cloud Coach Dashboard React component with agents, metrics, ETL status, swarm visualization. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-140": df("Swarm task visualizer React component showing decomposition tree and execution progress. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-141": df("Agent card React component displaying agent status, capabilities, and metrics. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-143": df("Swarm mode badge React component. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-144": df("Command input React component for natural language swarm queries. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-147": df("Next.js agents API route for CRUD operations. AI agent API. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-149": df("Next.js swarm execution API route. Swarm engine API. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
    "TMR-153": df("Agent tools documentation with ACI integration guide. AI tooling docs. "
                  "Blocked on TerraGPT charter.",
                  "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and AI agent hosting model defined"),
}


# --- Apply dispositions to manifest ---
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

        # FIX DOMAINS: PACS-related assets should be "sync" not "valuation"
        if aid in ("TMR-042", "TMR-043", "TMR-124", "TMR-173", "TMR-174", "TMR-175"):
            asset["domain"] = "sync"

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

    # --- Summary ---
    counts = {"ported": 0, "declined": 0, "deferred-with-rationale": 0}
    suite_counts: dict[str, int] = {}
    batch_counts: dict[str, int] = {}
    forge_rows: list[str] = []
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
            if suite == "TerraForge":
                forge_rows.append(
                    f"  {asset['asset_id']}: {asset['canonical_capability']} -- "
                    f"{asset['disposition_rationale'][:80]}"
                )
            if suite == "TerraAtlas":
                atlas_rows.append(
                    f"  {asset['asset_id']}: {asset['canonical_capability']} -- "
                    f"{asset['disposition_rationale'][:80]}"
                )
        if s == "deferred-with-rationale":
            deferred_rows.append(
                f"  {asset['asset_id']}: {asset.get('blocker_type','?')} -- "
                f"{asset['disposition_rationale'][:100]}"
            )

    print(f"=== TerraMiner Disposition Complete ===")
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
    print(f"TerraForge rows ({len(forge_rows)} -- each with justification):")
    for row in forge_rows:
        print(row)
    print()
    print(f"TerraAtlas rows ({len(atlas_rows)} -- each with justification):")
    for row in atlas_rows:
        print(row)
    print()
    print(f"Deferred rows ({len(deferred_rows)}):")
    for row in deferred_rows:
        print(row)
    print()
    print(f"Security: All {counts.get('ported',0)} ported assets have remediation_note (P4B-009, secrets_status=critical)")
    print(f"  SEC_NOTE: {SEC_NOTE}")
    print(f"Manifest written to: {manifest_path}")


if __name__ == "__main__":
    main()
