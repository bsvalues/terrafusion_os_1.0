# Flask → .NET Port Gap Matrix

Generated: 2026-04-18
Source: BCBSLevy prod snapshot (E:\TerraFusion_Archive_2025_08_10\...\BCBSLevy_PRODUCTION)
Target: `backend/src/TerraFusion.API/Controllers/Levy*Controller.cs` + `backend/src/TerraFusion.Levy/**`

Legend:
- **COVERED** — .NET controller already ports this surface (may need enhancement to match prod bodies)
- **PARTIAL** — some endpoints ported, some missing
- **GAP** — no .NET equivalent; needs full port
- **SKIP_UI** — UI concern, lives in React OS shell, not a backend port
- **SKIP_CLI** — CLI-only, not an HTTP API
- **SKIP_OS** — handled by OS-level service (auth, etc.)
- **DECIDE** — founder decision required before porting

## Matrix

| Flask file | Size | Routes | .NET counterpart | Status | Notes |
|---|---:|---:|---|---|---|
| `routes_admin.py` | 5.9 KB | 2 | LevyDashboardController | COVERED | admin dashboard + status |
| `routes_advanced_mcp.py` | 33.2 KB | 7 | — | DECIDE | "Advanced MCP" subsystem — port or deprecate? |
| `routes_auth.py` | 3.6 KB | 5 | — | SKIP_OS | OS-level auth handles login/logout/register/profile |
| `routes_budget_impact.py` | 28.1 KB | 5 | — | GAP | Budget simulation + AI simulation — needs new controller |
| `routes_dashboard.py` | 6.8 KB | 3 | LevyDashboardController | PARTIAL | `/metrics` + `/stats` may need enhancement |
| `routes_data_management.py` | 30.7 KB | 16 | LevyDataManagementController | PARTIAL | 16 Flask routes vs 5 .NET endpoints — big gap |
| `routes_data_quality.py` | 44.8 KB | TBD | — | GAP | **Largest gap.** Data quality workflows |
| `routes_db_fix.py` | 7.0 KB | TBD | — | SKIP_CLI | DB repair — CLI tool only, do not expose |
| `routes_examples.py` | TBD | TBD | — | SKIP_UI | Demo/examples page |
| `routes_forecasting.py` | TBD | TBD | LevyForecastController | PARTIAL | Compare specifics |
| `routes_glossary.py` | TBD | TBD | — | GAP | Minor — glossary endpoint |
| `routes_historical_analysis.py` | TBD | TBD | — | GAP | Historical analysis reports |
| `routes_home.py` | 3.0 KB | TBD | — | SKIP_UI | Landing page |
| `routes_levy_audit.py` | TBD | TBD | LevyAuditController | COVERED | dashboard/guidance/optimization ported |
| `routes_levy_calculator.py` | TBD | TBD | LevyCalculator + LevyCalculation | COVERED | rate calc + bill impact + aggregate ported |
| `routes_levy_exports.py` | TBD | TBD | LevyExportController | COVERED | upload/history/compare ported |
| `routes_mcp.py` | 66.1 KB | 11 | — | DECIDE | Core MCP surface. Same 11 routes in local+prod |
| `routes_mcp_army.py` | 18.7 KB | TBD | — | DECIDE | "MCP Army" — confirm concept alive |
| `routes_mcp_ui.py` | 1.1 KB | TBD | — | SKIP_UI | MCP UI glue |
| `routes_property_assessment.py` | 16.4 KB | TBD | — | GAP | Property assessment endpoints |
| `routes_public.py` | TBD | TBD | — | GAP | Public-facing read endpoints |
| `routes_reports.py` | TBD | TBD | LevyReportController | PARTIAL | templates/generate/scheduled in .NET |
| `routes_reports_new.py` | TBD | TBD | LevyReportController | PARTIAL | Newer report surfaces — verify |
| `routes_search.py` | TBD | TBD | LevySearchController | COVERED | search/autocomplete/recent ported |
| `routes_tax_strategy.py` | TBD | TBD | — | GAP | Tax strategy advisory |
| `routes_user_audit.py` | TBD | TBD | — | GAP | User audit log |

Plus local-only: `routes_tours.py` — keep (newer local feature).

## Summary

| Status | Count |
|---|---:|
| COVERED | 5 |
| PARTIAL | 5 |
| GAP | 8 |
| DECIDE | 3 |
| SKIP_UI | 4 |
| SKIP_CLI | 1 |
| SKIP_OS | 1 |

## Priority Ports (real work for Phase 2)

1. **`routes_data_quality.py`** (44.8 KB) — biggest gap, business-critical
2. **`routes_data_management.py`** delta (30.7 KB, 11 missing endpoints)
3. **`routes_budget_impact.py`** (28.1 KB)
4. **`routes_property_assessment.py`** (16.4 KB)
5. **`routes_historical_analysis.py`**
6. **`routes_user_audit.py`**
7. **`routes_tax_strategy.py`**
8. **`routes_public.py`**
9. **`routes_glossary.py`** (minor)
10. **`routes_dashboard.py` / `routes_forecasting.py` / `routes_reports.py` enhancements**

## Founder Decisions Needed (Phase 2 blockers)

- **D1:** Port MCP Army (`routes_mcp_army.py` + helpers) or deprecate?
- **D2:** Port Advanced MCP (`routes_advanced_mcp.py`) or deprecate?
- **D3:** Port core MCP surface (`routes_mcp.py`, 11 routes, 66 KB) into .NET, or keep Flask service alongside .NET API?

## Schema Drift (`models.py`)

- Local: 29,789 B
- Prod:  39,727 B (+10 KB)
- Hashes differ. Prod synced into local in Phase 1. EF migration audit required in Phase 3.

## Route surface identity (`routes_mcp.py`)

Both local and prod have the same **11 route decorators** and **14 function defs**. Prod is 6.2 KB larger purely from richer handler bodies — public API surface is identical, behavior is enhanced.
