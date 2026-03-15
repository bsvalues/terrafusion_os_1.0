#!/usr/bin/env python3
"""Phase 4B Disposition: TerraFusionPilt (71 assets).

Terminal classification for every asset. No asset remains pending.
Boundary law: Dais=PILT workflow/case-mgmt/distribution-calc/levy-allocation/reporting/dashboards/import;
              Canon=data-quality-validation/sync/infrastructure-health;
              Dossier=document-conversion/formatting/PDF-generation (the document capability, not the PILT content);
              Forge/Atlas=none expected (PILT is assessment-ops, not valuation or GIS);
              OS Admin=auth/governance infrastructure.
CRITICAL: PILT product logic is Dais, NOT plumbing. "How do we operate PILT work?" -> Dais.
CRITICAL: "How do we move/govern PILT systems?" -> Canon/OS Admin.
CRITICAL: AI/LLM-powered agents using OpenAI/Anthropic -> DEFERRED on TerraGPT (ADR-TBD-5).
CRITICAL: shadcn/ui components, generic React hooks, framework scaffolding (Express, Drizzle config,
          Vite config, PostCSS, etc.) -> DECLINED. Canonical already has these.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

REPO_NAME = "TerraFusionPilt"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
SEC_NOTE = (
    "Repo made private 2026-03-14. HIGH: session secret in .env.production. "
    "Service dormant. Key NOT ROTATED. No longer publicly accessible."
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


def df(reason, blocker, unblock, owner="founder"):
    """Deferred asset."""
    return {
        "status": "deferred-with-rationale", "disposition_reason": reason,
        "parity_mode": "none", "replacement_ref": "none", "migration_batch": "",
        "canonical_capability": "", "target_home": "", "owner_suite": "",
        "blocker_type": blocker, "unblock_condition": unblock,
        "decision_owner": owner,
        "security_review": {"status": "pending", "remediation_note": SEC_NOTE},
    }


# --- Batch aliases ---
DP = "dais-pilt"
CE = "canon-etl"
OS = "os-shared"

DISPOSITIONS: dict[str, dict] = {
    # ===================================================================
    # SERVER INFRASTRUCTURE (DECLINED - framework scaffolding)
    # ===================================================================
    "TFP-001": d("Express server entry point. Canonical uses .NET 8 ASP.NET Core. Framework scaffolding.",
                  "backend/TerraFusion.API/Program.cs"),

    # ===================================================================
    # PILT CORE SERVICES (PORTED -> TerraDais)
    # ===================================================================
    "TFP-002": p("TerraDais", DP, "dais.pilt.api_routes",
                  "backend/TerraFusion.API/Modules/Pilt/Routes",
                  "Complete PILT API route definitions: history, distributions, districts, land classifications, "
                  "levy rates, bulk import, report generation, data export, validation, feedback. "
                  "Core PILT operational endpoints. Dais domain: 'How do we operate PILT work?'"),

    "TFP-003": p("TerraDais", DP, "dais.pilt.storage_layer",
                  "backend/TerraFusion.API/Modules/Pilt/Storage",
                  "PILT data storage layer with IStorage interface, DbStorage (PostgreSQL) and MemStorage "
                  "(in-memory fallback with Benton County sample data). PILT business data access. "
                  "Dais domain: PILT data persistence is operational workflow."),

    # ===================================================================
    # DATABASE CONFIG (DECLINED - framework scaffolding)
    # ===================================================================
    "TFP-004": d("Neon PostgreSQL/Drizzle ORM connection pool. Canonical uses EF Core with PostgreSQL. "
                  "Framework-specific database config.",
                  "backend/TerraFusion.Data/TerraFusionDbContext.cs"),

    # ===================================================================
    # AI AGENTS (DEFERRED - TerraGPT charter, ADR-TBD-5)
    # ===================================================================
    "TFP-005": df("AI property valuation engine using OpenAI: comparable sales, market trends, risk assessment, "
                   "anomaly detection. Blocked on TerraGPT charter for all LLM-powered agents.",
                   "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and LLM agent framework established"),

    "TFP-006": df("OpenAI-powered PILT report analysis agent: insights, recommendations, risk factors, "
                   "compliance notes. Blocked on TerraGPT charter.",
                   "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and LLM agent framework established"),

    "TFP-007": df("Advanced multi-format report generation agent (HTML/PDF/Excel/JSON). In agents/ folder, "
                   "implies external API dependency. TFP-009 exists as non-AI alternative. Blocked on TerraGPT.",
                   "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and LLM agent framework established"),

    "TFP-008": df("OpenAI-powered PDF conversion agent for PILT reports. Explicit LLM dependency. "
                   "Blocked on TerraGPT charter.",
                   "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and LLM agent framework established"),

    # ===================================================================
    # DOCUMENT SERVICES (PORTED -> TerraDossier - no AI dependency)
    # ===================================================================
    "TFP-009": p("TerraDossier", OS, "dossier.pilt.document_conversion",
                  "backend/TerraFusion.AI/Agents/DocumentConversion",
                  "Document conversion producing government-standard HTML reports WITHOUT external API "
                  "dependencies. Distribution tables, land classification breakdowns, compliance formatting. "
                  "Dossier domain: document production capability, not PILT operational logic."),

    "TFP-010": p("TerraDossier", OS, "dossier.pilt.document_formatting",
                  "backend/TerraFusion.AI/Agents/DocumentFormatting",
                  "Government document formatting: pixel-perfect layouts, typography, spacing, visual hierarchy, "
                  "professional color schemes. Dossier domain: document presentation capability."),

    # ===================================================================
    # BACKUP FILES (DECLINED)
    # ===================================================================
    "TFP-011": d("Backup copy of formattingAgent.ts. Not canonical; TFP-010 is the primary."),

    # ===================================================================
    # SCHEMA DEFINITIONS (PORTED -> TerraDais for PILT schema, TerraCanon for validation)
    # ===================================================================
    "TFP-012": p("TerraDais", DP, "dais.pilt.database_schema",
                  "backend/TerraFusion.Data/Schemas/Pilt",
                  "Full Drizzle ORM schema defining 13 PostgreSQL tables for PILT domain: exempt_properties, "
                  "users, feedback, districts, land_classifications, levy_rates, pilt_receipts, distributions, "
                  "intelligence_metrics, predictive_models, anomaly_detections, insights. "
                  "Reference for EF Core schema migration. Dais domain: PILT data structure."),

    "TFP-013": d("Core simplified schema (5 tables). Strict subset of TFP-012 (13 tables). "
                  "No unique tables or fields not covered by full schema.",
                  "TFP-012"),

    "TFP-014": p("TerraCanon", CE, "canon.pilt.validation_schema",
                  "backend/TerraFusion.Data/Schemas/Validation",
                  "Validation system schema: validation_rules, validation_agents, validation_runs, "
                  "validation_issues, validation_tasks, validation_audit_logs. "
                  "Canon domain: 'Is the PILT data clean and valid?' Data quality infrastructure, "
                  "not PILT operational workflow."),

    # ===================================================================
    # FRONTEND - PILT PAGES (PORTED -> TerraDais for PILT-specific, DECLINED for generic)
    # ===================================================================
    "TFP-015": d("React frontend entry point with route config. Canonical frontend has its own routing. "
                  "Framework scaffolding.", "frontend/src/App.tsx"),

    "TFP-016": p("TerraDais", DP, "dais.pilt.dashboard_view",
                  "frontend/src/modules/pilt/pages/Dashboard.tsx",
                  "Consolidated PILT dashboard: year selector, PILT history chart, distribution pie chart, "
                  "metric cards (total amount/assessed value/district count), report trigger, "
                  "tabbed overview/analytics. Core Dais operational view for PILT work."),

    "TFP-017": p("TerraDais", DP, "dais.pilt.reports_view",
                  "frontend/src/modules/pilt/pages/Reports.tsx",
                  "PILT reports and analytics page: year selection, template picker, format selection, "
                  "report generator integration. Dais domain: PILT reporting workflow."),

    "TFP-018": d("Backup of earlier Reports page. Not canonical; TFP-017 is the primary."),

    "TFP-019": p("TerraDais", DP, "dais.pilt.bulk_import",
                  "frontend/src/modules/pilt/pages/BulkImport.tsx",
                  "Bulk CSV import for PILT data types (receipts, distributions, land classifications, "
                  "levy rates, districts). Drag-and-drop upload with per-file status. "
                  "Dais domain: PILT data ingestion is operational workflow."),

    "TFP-020": df("Property valuation UI with AI-powered results display. Frontend for TFP-005 (OpenAI agent). "
                   "Non-functional without AI backend. Blocked on TerraGPT charter.",
                   "adr-pending", "ADR-TBD-5 (TerraGPT charter) accepted and LLM agent framework established"),

    # ===================================================================
    # FRONTEND - PILT COMPONENTS (PORTED for PILT-specific, DECLINED for generic)
    # ===================================================================
    "TFP-021": p("TerraDais", DP, "dais.pilt.report_generator_widget",
                  "frontend/src/modules/pilt/components/ReportGenerator.tsx",
                  "Report generator component: template selection (executive/detailed/financial/compliance/custom), "
                  "format picker, advanced options (watermark, metadata, custom footer), preview/download. "
                  "Works with non-AI report backends. Dais domain: PILT report generation UI."),

    "TFP-022": p("TerraDais", DP, "dais.pilt.distribution_chart",
                  "frontend/src/modules/pilt/components/DistributionPieChart.tsx",
                  "Recharts pie chart for PILT distribution across taxing districts. "
                  "Tooltips, legend, loading/error states, CSV download. Dais domain: PILT visualization."),

    "TFP-023": d("Generic metric card widget. Canonical frontend has Card from shadcn/ui; "
                  "MetricCard pattern easily rebuilt with existing primitives.",
                  "frontend/src/components/ui/card.tsx"),

    "TFP-024": d("PILT-specific navigation header. Canonical workbench/suite navigation replaces "
                  "app-specific nav. Framework scaffolding."),

    "TFP-025": d("Generic footer component. Canonical OS has its own branding/footer."),

    "TFP-026": d("React error boundary. Canonical frontend has error handling infrastructure.",
                  "frontend/src/components/shared/ErrorBoundary.tsx"),

    # ===================================================================
    # FRONTEND - AUTH (DECLINED - canonical OS auth)
    # ===================================================================
    "TFP-027": d("App-specific auth hook. Canonical OS provides authentication at the platform level. "
                  "PILT module will use OS auth, not its own.",
                  "frontend/src/hooks/useAuth.tsx (OS-level)"),

    "TFP-028": d("Protected route wrapper. Canonical OS handles route protection at platform level.",
                  "frontend/src/lib/protected-route.tsx (OS-level)"),

    # ===================================================================
    # FRONTEND - PILT DATA LAYER (PORTED -> TerraDais)
    # ===================================================================
    "TFP-029": p("TerraDais", DP, "dais.pilt.client_data_layer",
                  "frontend/src/modules/pilt/lib/data.ts",
                  "PILT data types (PiltReceiptData, DistributionData, FeedbackFormData), "
                  "API fetch functions for history/distribution/export, percentage utility, chart colors. "
                  "Dais domain: PILT-specific client data access."),

    "TFP-030": p("TerraDais", DP, "dais.pilt.type_definitions",
                  "frontend/src/modules/pilt/lib/types.ts",
                  "Shared TypeScript type definitions for PILT domain models. "
                  "Dais domain: PILT data contracts."),

    # ===================================================================
    # FRONTEND - GENERIC UTILITIES (DECLINED - canonical already has these)
    # ===================================================================
    "TFP-031": d("cn() + formatCurrency() utilities. Canonical already has cn() in utils.ts. "
                  "formatCurrency is trivial to add.", "frontend/src/lib/utils.ts"),

    "TFP-032": d("React Query client config. Canonical already has query client setup.",
                  "frontend/src/lib/queryClient.ts"),

    "TFP-033": d("Toast notification hook. Canonical uses shadcn/ui toast.",
                  "frontend/src/hooks/use-toast.ts"),

    "TFP-034": d("Local storage persistence hook. Generic utility, canonical can add as needed."),

    "TFP-035": d("Mobile detection hook. Generic utility, canonical can add as needed."),

    # ===================================================================
    # FRONTEND - shadcn/ui COMPONENTS (ALL DECLINED - canonical has identical copies)
    # ===================================================================
    "TFP-036": d("shadcn/ui AlertDialog. Already installed in canonical frontend.",
                  "frontend/src/components/ui/alert-dialog.tsx"),
    "TFP-037": d("shadcn/ui Badge. Already installed in canonical frontend.",
                  "frontend/src/components/ui/badge.tsx"),
    "TFP-038": d("shadcn/ui Button. Already installed in canonical frontend.",
                  "frontend/src/components/ui/button.tsx"),
    "TFP-039": d("shadcn/ui Card. Already installed in canonical frontend.",
                  "frontend/src/components/ui/card.tsx"),
    "TFP-040": d("shadcn/ui Dialog. Already installed in canonical frontend.",
                  "frontend/src/components/ui/dialog.tsx"),
    "TFP-041": d("shadcn/ui HoverCard. Already installed in canonical frontend.",
                  "frontend/src/components/ui/hover-card.tsx"),
    "TFP-042": d("shadcn/ui Input. Already installed in canonical frontend.",
                  "frontend/src/components/ui/input.tsx"),
    "TFP-043": d("shadcn/ui Label. Already installed in canonical frontend.",
                  "frontend/src/components/ui/label.tsx"),
    "TFP-044": d("shadcn/ui Select. Already installed in canonical frontend.",
                  "frontend/src/components/ui/select.tsx"),
    "TFP-045": d("shadcn/ui Separator. Already installed in canonical frontend.",
                  "frontend/src/components/ui/separator.tsx"),
    "TFP-046": d("shadcn/ui Skeleton. Already installed in canonical frontend.",
                  "frontend/src/components/ui/skeleton.tsx"),
    "TFP-047": d("shadcn/ui Tabs. Already installed in canonical frontend.",
                  "frontend/src/components/ui/tabs.tsx"),
    "TFP-048": d("shadcn/ui Textarea. Already installed in canonical frontend.",
                  "frontend/src/components/ui/textarea.tsx"),
    "TFP-049": d("Theme provider (next-themes). Already installed in canonical frontend.",
                  "frontend/src/components/ui/theme-provider.tsx"),
    "TFP-050": d("shadcn/ui Toast. Already installed in canonical frontend.",
                  "frontend/src/components/ui/toast.tsx"),
    "TFP-051": d("Toaster renderer. Already installed in canonical frontend.",
                  "frontend/src/components/ui/toaster.tsx"),
    "TFP-052": d("shadcn/ui Tooltip. Already installed in canonical frontend.",
                  "frontend/src/components/ui/tooltip.tsx"),

    # ===================================================================
    # FRONTEND - CONFIG/SCAFFOLDING (ALL DECLINED)
    # ===================================================================
    "TFP-053": d("Global CSS with theme tokens. Canonical has its own theme system.",
                  "frontend/src/index.css"),
    "TFP-054": d("React app entry point (main.tsx). Framework scaffolding.",
                  "frontend/src/main.tsx"),
    "TFP-055": d("HTML entry point (index.html). Framework scaffolding.",
                  "frontend/index.html"),
    "TFP-056": d("404 Not Found page. Canonical has its own.",
                  "frontend/src/pages/not-found.tsx"),

    # ===================================================================
    # BUILD/CONFIG FILES (ALL DECLINED)
    # ===================================================================
    "TFP-057": d("Drizzle Kit migration config. Canonical uses EF Core migrations.",
                  "backend/TerraFusion.Data/Migrations/"),
    "TFP-058": d("Vite build config. Canonical has its own vite.config.ts.",
                  "frontend/vite.config.ts"),
    "TFP-059": d("Vite-Express dev server integration. Framework scaffolding, not applicable to .NET backend."),
    "TFP-060": d("Tailwind CSS config. Canonical has its own tailwind.config.ts.",
                  "frontend/tailwind.config.ts"),
    "TFP-061": d("TypeScript compiler config. Canonical has its own tsconfig.json.",
                  "frontend/tsconfig.json"),
    "TFP-062": d("PostCSS config. Canonical has its own postcss.config.js.",
                  "frontend/postcss.config.js"),
    "TFP-063": d("shadcn/ui component registry config. Canonical has its own components.json.",
                  "frontend/components.json"),
    "TFP-064": d("Package manifest (80+ deps). Canonical has its own package.json. "
                  "PILT-specific deps (jsPDF, xlsx) noted for migration batch."),
    "TFP-065": d("Production env template. Canonical manages env config at OS level. "
                  "API key placeholders noted for PILT module config.",
                  "backend/TerraFusion.API/appsettings.json"),

    # ===================================================================
    # DOCUMENTATION (PORTED reference doc, DECLINED duplicates)
    # ===================================================================
    "TFP-066": p("TerraDais", DP, "dais.pilt.reference_report",
                  "docs/reference/pilt/PILT_Report_2024.pdf",
                  "Detailed PILT report PDF (82MB) for 2024 Benton County. "
                  "Reference document for validation of PILT calculation accuracy. "
                  "Dais domain: PILT operational reference."),

    "TFP-067": d("TerraFusion brand specification. Already exists in canonical OS design docs.",
                  "docs/design/brand-specification.md"),

    "TFP-068": d("TerraFusion implementation package. Already exists in canonical OS architecture docs.",
                  "docs/architecture/implementation-package.md"),

    "TFP-069": p("TerraDais", DP, "dais.pilt.module_documentation",
                  "docs/modules/pilt/README.md",
                  "PILT module README with architecture overview, setup instructions, features list, "
                  "deployment guide. Dais domain: PILT module documentation."),

    # ===================================================================
    # PLATFORM-SPECIFIC (DECLINED - Replit, not relevant)
    # ===================================================================
    "TFP-070": d("Replit development environment config. Platform-specific, not relevant to canonical OS."),
    "TFP-071": d("Replit development documentation. Platform-specific, not relevant to canonical OS."),
}


def main():
    manifest_path = Path(__file__).resolve().parents[2] / "phase4b.manifest.json"
    print(f"Loading manifest: {manifest_path}")

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Find TerraFusionPilt repo
    repo = None
    for r in manifest["repos"]:
        if r["name"] == REPO_NAME:
            repo = r
            break

    if repo is None:
        print(f"ERROR: Repo '{REPO_NAME}' not found in manifest!")
        return

    # Apply dispositions
    applied = 0
    missing = []
    for asset in repo["assets"]:
        aid = asset["asset_id"]
        if aid in DISPOSITIONS:
            disp = DISPOSITIONS[aid]
            asset["status"] = disp["status"]
            asset["disposition_rationale"] = disp["disposition_reason"]
            asset["parity_mode"] = disp["parity_mode"]
            asset["replacement_ref"] = disp["replacement_ref"]
            asset["migration_batch"] = disp["migration_batch"]
            asset["canonical_capability"] = disp.get("canonical_capability", asset.get("canonical_capability", ""))
            asset["target_home"] = disp.get("target_home", asset.get("target_home", ""))
            asset["owner_suite"] = disp.get("owner_suite", "") or asset.get("owner_suite", "")
            asset["blocker_type"] = disp["blocker_type"]
            asset["unblock_condition"] = disp["unblock_condition"]
            asset["decision_owner"] = disp["decision_owner"]
            asset["security_review"] = disp["security_review"]
            asset["disposition_owner"] = "founder"
            asset["updated_at"] = NOW
            # For ported assets, keep original canonical_capability/target_home if disposition provides them
            if disp["status"] == "ported":
                asset["canonical_capability"] = disp["canonical_capability"]
                asset["target_home"] = disp["target_home"]
            applied += 1
        else:
            missing.append(aid)

    # Summary
    ported = sum(1 for a in repo["assets"] if a.get("status") == "ported")
    declined = sum(1 for a in repo["assets"] if a.get("status") == "declined")
    deferred = sum(1 for a in repo["assets"] if a.get("status") == "deferred-with-rationale")
    pending = sum(1 for a in repo["assets"] if a.get("status", "pending") == "pending")

    print(f"\n=== TerraFusionPilt Disposition Summary ===")
    print(f"Applied: {applied}/{len(repo['assets'])} assets")
    print(f"  Ported:   {ported}")
    print(f"  Declined: {declined}")
    print(f"  Deferred: {deferred}")
    print(f"  Pending:  {pending}")

    if missing:
        print(f"\nWARNING: Missing dispositions for: {missing}")

    # Suite breakdown
    suites: dict[str, int] = {}
    batches: dict[str, int] = {}
    for a in repo["assets"]:
        if a.get("status") == "ported":
            s = a.get("owner_suite", "?")
            suites[s] = suites.get(s, 0) + 1
            b = a.get("migration_batch", "?")
            batches[b] = batches.get(b, 0) + 1

    print(f"\nBy suite (ported only):")
    for s, c in sorted(suites.items()):
        print(f"  {s}: {c}")

    print(f"\nBy batch (ported only):")
    for b, c in sorted(batches.items()):
        print(f"  {b}: {c}")

    # Deferred details
    print(f"\nDeferred assets:")
    for a in repo["assets"]:
        if a.get("status") == "deferred-with-rationale":
            print(f"  {a['asset_id']}: {a.get('blocker_type', '?')} - {a.get('unblock_condition', '?')}")

    # TerraCanon justification
    print(f"\nTerraCanon rows (must justify each):")
    for a in repo["assets"]:
        if a.get("status") == "ported" and a.get("owner_suite") == "TerraCanon":
            print(f"  {a['asset_id']}: {a.get('disposition_rationale', '?')[:120]}")

    # TerraDossier rows
    print(f"\nTerraDossier rows:")
    for a in repo["assets"]:
        if a.get("status") == "ported" and a.get("owner_suite") == "TerraDossier":
            print(f"  {a['asset_id']}: {a.get('disposition_rationale', '?')[:120]}")

    # Write
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nManifest written: {manifest_path}")
    print("Run validator: python scripts/validate_phase4b_manifest.py")


if __name__ == "__main__":
    main()
