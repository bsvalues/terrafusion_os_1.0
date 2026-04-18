# Flask → .NET Port Gap Matrix

Generated: 2026-04-18
Source: BCBSLevy prod snapshot (E:\TerraFusion_Archive_2025_08_10\...\BCBSLevy_PRODUCTION)
Target: `backend/src/TerraFusion.API/Controllers/Levy*Controller.cs` + `backend/src/TerraFusion.Levy/**`

Legend:
- **COVERED** — .NET controller already ports this surface (may need enhancement to match prod bodies)
- **COVERED_PLACEHOLDER** — .NET contract ported as deterministic placeholder; real persistence/AI wiring deferred behind stable interface
- **PARTIAL** — some endpoints ported, some missing
- **PARTIAL_BLOCKED** — controller stub exists but every endpoint is honestly `501 Not Implemented` because required schema/utility ports are missing. Lying "stub-200" responses removed. Documented unblock conditions per endpoint.
- **GAP** — no .NET equivalent; needs full port
- **SKIP_UI** — UI concern, lives in React OS shell, not a backend port
- **SKIP_CLI** — CLI-only, not an HTTP API
- **SKIP_OS** — handled by OS-level service (auth, etc.)
- **DECIDE** — founder decision required before porting
- **CANCEL_PARTIAL** — DECIDE resolved, but post-review reveals 0 portable routes today (architectural obsolescence, schema-blocked, or pure UI). Documented; revisit only if listed unblock conditions are met.

## Matrix

| Flask file | Size | Routes | .NET counterpart | Status | Notes |
|---|---:|---:|---|---|---|
| `routes_admin.py` | 5.9 KB | 2 | LevyDashboardController | COVERED | admin dashboard + status |
| `routes_advanced_mcp.py` | 33.2 KB | 7 | — | CANCEL_PARTIAL | D2 resolved 2026-04-18: 0/7 portable now (1 SKIP_UI = `/advanced-insights` HTML page; 6 OBSOLETE = built on retired `get_claude_service` + `check_api_key_status` + custom `advanced_ai_agent` vendor-locked Anthropic stack — same architectural objection as routes_mcp.py, sovereign hybrid uses `MuseLlmOptions` config-based provider) |
| `routes_auth.py` | 3.6 KB | 5 | — | SKIP_OS | OS-level auth handles login/logout/register/profile |
| `routes_budget_impact.py` | 28.1 KB | 5 | — | GAP | Budget simulation + AI simulation — needs new controller |
| `routes_dashboard.py` | 6.8 KB | 3 | LevyDashboardController | PARTIAL | `/metrics` + `/stats` may need enhancement |
| `routes_data_management.py` | 30.7 KB | 15 | LevyDataManagementController | PARTIAL_BLOCKED | Audit 2026-04-18: 15 Flask routes → 3 SKIP_UI (`/`, `/import` GET form, `/export` GET form), **2 IMPLEMENTED 2026-04-18** (`GET /districts` + `GET /districts/{id}` wired against real `LevyDbContext`.Districts), 2 portable-when-Properties-query-ported (`/properties` list+detail — entity exists in TerraFusion.Core), 8 SCHEMA_BLOCKED (`POST /import`, `POST /export`, `POST /import/district`, `/import-history`, `/export-history`, `POST /api/preview-district-import`, `/tax-codes` list+detail). **Correction to earlier audit:** `LevyDbContext` was mislabeled a "TEMPORARY STUB" — file header comment was stale; context is real (9 DbSets, 4 migrations totaling ~60 KB, ModelSnapshot, registered in Program.cs with LEVY_DATABASE_URL). File renamed `LevyDbContextStub.cs` → `LevyDbContext.cs` + stale comment removed. **Remaining unblock prereqs**: (1) Properties read query → 2 endpoints, (2) `TaxCode` entity + migration → 2 endpoints, (3) `ImportLog`/`ExportLog` entities + port of `utils/import_utils.py` + `utils/district_utils.py` → 6 endpoints. |
| `routes_data_quality.py` | 44.8 KB | 12 | LevyDataQualityController + LevyDataQualityService | COVERED_PLACEHOLDER | Phase 2 Task 2.1 closed: 7/12 JSON routes ported as deterministic placeholder behind stable contract (`/analyze`, `/ai-recommendations`, `/monitoring-status`, `/monitoring/toggle`, `/realtime-metrics`, `/trends`, `/audit`); 5/12 SKIP_UI by design (`/`, `/rules`, `/rules/create`, `/errors`, `/activities` — listed explicitly in controller XML doc, render in React shell). Real persistence (`ValidationRule`/`DataQualityScore`/`ErrorPattern`/`DataQualityActivity`) and AI-swarm wiring deferred to later phase behind same interface (Service is honest about this in code comments). |
| `routes_db_fix.py` | 7.0 KB | TBD | — | SKIP_CLI | DB repair — CLI tool only, do not expose |
| `routes_examples.py` | TBD | TBD | — | SKIP_UI | Demo/examples page |
| `routes_forecasting.py` | TBD | TBD | LevyForecastController | PARTIAL | Compare specifics |
| `routes_glossary.py` | TBD | TBD | — | GAP | Minor — glossary endpoint |
| `routes_historical_analysis.py` | TBD | TBD | — | GAP | Historical analysis reports |
| `routes_home.py` | 3.0 KB | TBD | — | SKIP_UI | Landing page |
| `routes_levy_audit.py` | TBD | TBD | LevyAuditController | COVERED | dashboard/guidance/optimization ported |
| `routes_levy_calculator.py` | TBD | TBD | LevyCalculator + LevyCalculation | COVERED | rate calc + bill impact + aggregate ported |
| `routes_levy_exports.py` | TBD | TBD | LevyExportController | COVERED | upload/history/compare ported |
| `routes_mcp.py` | 66.1 KB | 11 | — | CANCEL_PARTIAL | D3 resolved 2026-04-18: 0/11 portable now (3 OBSOLETE = anthropic key mgmt — `AnthropicMuseLlmClient` retired, .NET uses `MuseLlmOptions` config-based provider; 3 SKIP_UI = HTML templates; 5 DEFER = need `ApiCallLog` schema, same blocker as Task 2.5) |
| `routes_mcp_army.py` | 18.7 KB | 16 | — | CANCEL_PARTIAL | D1 resolved 2026-04-18: 0/16 portable now (2 SKIP_UI = dashboard HTML pages; 14 DUPLICATE = custom Flask agent-coordination layer — Architect Prime / Integration Coordinator / Component Leads / Specialists / master-prompt / training — fully overlaps and conflicts with `EnterpriseAIAgentCoordinator` + `AISwarmOrchestrator` (10,008-agent OS swarm already running). Parallel coordination layer in .NET would fight the OS swarm) |
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
| COVERED_PLACEHOLDER | 1 |
| PARTIAL | 4 |
| PARTIAL_BLOCKED | 1 |
| GAP | 7 |
| DECIDE | 0 |
| CANCEL_PARTIAL | 3 |
| SKIP_UI | 4 |
| SKIP_CLI | 1 |
| SKIP_OS | 1 |

## Priority Ports (real work for Phase 2)

1. **`routes_data_management.py`** — wire Properties list+detail (entity exists in TerraFusion.Core) → 2 more endpoints
2. **`routes_budget_impact.py`** (28.1 KB)
3. **`routes_property_assessment.py`** (16.4 KB)
4. **`routes_historical_analysis.py`**
5. **`routes_user_audit.py`**
6. **`routes_tax_strategy.py`**
7. **`routes_public.py`**
8. **`routes_glossary.py`** (minor)
9. **`routes_dashboard.py` / `routes_forecasting.py` / `routes_reports.py`** enhancements
10. (deferred) **`routes_data_management.py`** schema work — needs `TaxCode` + `ImportLog` + `ExportLog` entities + import/export utility ports
11. (deferred) **`routes_data_quality.py`** persistence wiring — contract already in place, needs `ValidationRule`/`DataQualityScore`/`ErrorPattern`/`DataQualityActivity` schema + service rewire

## Founder Decisions Needed (Phase 2 blockers)

- **D1 (RESOLVED 2026-04-18):** Decision was "audit before deciding". Outcome: CANCEL_PARTIAL. After source review of all 16 routes: 2 SKIP_UI (dashboard HTML), 14 architecturally DUPLICATE the OS-level `EnterpriseAIAgentCoordinator` + `AISwarmOrchestrator` (10,008-agent swarm already operational). Porting would create a competing/parallel agent-coordination plane in .NET that would conflict with the OS swarm. No controller created. Re-open only if MCP Army's specific concepts (Architect Prime / Component Leads / master-prompt directive broadcast) are determined to be missing from the OS swarm AND deemed required for TerraLevy.
- **D2 (RESOLVED 2026-04-18):** Decision was "audit before deciding". Outcome: CANCEL_PARTIAL. After source review of all 7 routes: 1 SKIP_UI (`/advanced-insights` HTML), 6 OBSOLETE — all built on the same retired stack as routes_mcp.py (`get_claude_service` + `check_api_key_status` + custom `advanced_ai_agent` with vendor-locked Anthropic calls). Same sovereign-architecture objection: runtime API-key mutation + vendor lock-in violates `MuseLlmOptions` config-based provider selection. No controller created. Re-open only if a sovereign-architecture-compliant version of these capabilities (NL query / multi-step / cross-dataset / contextual recommendations) is needed for the OS Pilot surface — in which case it belongs on the Pilot/Muse OS layer, not Levy.
- **D3 (RESOLVED 2026-04-18):** Decision was "port to .NET". Outcome: CANCEL_PARTIAL. After source review, 0/11 routes are portable today: 3 are architecturally obsolete (Anthropic env-var key mgmt — `AnthropicMuseLlmClient` retired, .NET uses `MuseLlmOptions` runtime config provider selection — runtime API key mutation violates sovereign hybrid architecture); 3 are SKIP_UI (server-rendered HTML); 5 are DEFER pending `ApiCallLog` schema (same blocker as Task 2.5). No controller created. Re-open if/when (a) `ApiCallLog` schema lands in `TerraFusionDbContext` to enable the 5 telemetry endpoints, or (b) a sovereign-architecture-compliant LLM provider config endpoint is needed for the OS Pilot surface.

## Schema Drift (`models.py`)

- Local: 29,789 B
- Prod:  39,727 B (+10 KB)
- Hashes differ. Prod synced into local in Phase 1. EF migration audit required in Phase 3.

## Route surface identity (`routes_mcp.py`)

Both local and prod have the same **11 route decorators** and **14 function defs**. Prod is 6.2 KB larger purely from richer handler bodies — public API surface is identical, behavior is enhanced.
