# Recovery-to-Repo Topology Matrix — v2 (executable)

*Phase A classification, made executable. Recovery = recover the right assets into the right
future homes. Salvage ≠ migration (HR-7). Decision-only; recovery lock ACTIVE.*

> **UPDATE (2026-06-25, post `TIER1-CLOSURE-RECORD.md`):** the Tier-1 port thesis is closed —
> Sync/Levy/Forge "manual-port (post schema gate)" rows below are **superseded**. The migration
> **source is the evolved `main` spine, not branches** (split, not port). The executable mapping
> now lives in `MIGRATE-SPLIT-PLAN.md`; the future-home/owner columns here remain authoritative.

## Target homes (+ shared-contracts bucket)
| Repo | Owns |
|---|---|
| **TerraFusionOS** (core) | shell, workbench **host**, Pilot/Trace/Canon **shell surfaces**, runtime composition, **registry**, governance/canon tooling |
| **core: shared-contracts** | shared interfaces, event contracts, DTO schemas, cross-repo API contracts, **workbench tab contracts**, **sync→suite payload contracts** — core-OWNED but explicitly *shared*, never buried in shell code |
| **TerraFusion-Sync** (platform) | county ingestion, PACS ETL, county-hub feed, ArcGIS **nightly ingestion** — upstream of all |
| **TerraFusion-Dais** (suite) | Dais workflow/persistence, **Levy**, permits, certification |
| **TerraFusion-Atlas** (suite) | map **UI / spatial interaction** only |
| **TerraFusion-Forge** (suite) | cost matrices, forge statistics, income/**current-use** studios, valuation pipeline |
| **TerraFusion-Dossier** (suite) | parcel dossier, document management |
| **legacy-only / archive** · **undecided** | wrapper noise / theater (cut) · deep AI internals (future TerraFusion-Pilot?), gated mesh |

## Hard boundary rules (prevent re-blurring)
- **R-WB — Workbench is NEVER a domain repo.** It is only: host · tab contract · orchestration surface · route-collapse target. Suites own the real domain surfaces rendered inside it.
- **R-ATLAS — Atlas seam:** UI / spatial interaction → TerraFusion-Atlas; spatial ingestion / sync / nightly feeds → TerraFusion-Sync. Atlas is never both platform and suite.
- **R-PILOT — Pilot stays in core** until its AI internals are runtime-real **and** evidence-backed **and** independently owned **and** large enough to justify extraction. Do **not** split because it "sounds modular."
- **R-SPLIT — split ≠ duplicate.** For every split surface, exactly one owner each for: **runtime · contracts · persistence · ingestion · UI host · tests.** Unassigned ownership = do not split yet.

## Matrix (executable columns)

| Surface | Current source location | Lineage class | Recovery method | Future home | Contract owner | Schema owner | Phase | Status |
|---|---|---|---|---|---|---|---|---|
| LocalOps/Muse/Pilot (shell-facing) | `TerraFusion.AI/Services/MuseService.cs`, `Controllers/PilotController.cs`, `os-platform/core/pilot/local-agent`, `wo-localops-*` | MAIN-CURRENT | merge (stack) | **TerraFusionOS** | core (shared) | core | **1** | **merge** |
| Pilot deep AI internals | (same + AI internals) | mixed | study | **undecided** (→ future Pilot) | core (interim) | — | **4** | **defer** |
| Canon/governance tooling | `feat/canon-*`, `feat/os-canon-*`, `.governance/` | MAIN-CURRENT | merge | **TerraFusionOS** | core (shared) | core | **1** | **merge** |
| Registry | `tools/registry`, backend `ServiceRegistry`, `os-platform/core/ToolRegistry.js` | in main | adopt | **TerraFusionOS** | core (shared) | core | **1** | **port/merge** |
| Workbench **host** | `frontend/apps/os-shell/src/pages/workbench` + shell host | MAIN-CURRENT | merge | **TerraFusionOS** | core (tab contracts) | core | **1** | **merge** |
| Workbench **domain** (comps/valuation) | workbench domain components | MAIN+legacy | port/merge | **Forge / Dais** (per surface) | core (tab contract) | suite | **4** | **defer→port** |
| Shared contracts | DTOs, interfaces, hub/payload contracts (scattered in `TerraFusion.Core`, `Abstractions`) | mixed | extract+formalize | **core: shared-contracts** | **core** | core | **1** | **port (formalize)** |
| Sync / PACS ETL | `backend/src/TerraFusion.*/Sync`, `terra-fusion-sync`, `sync-*`/`attr-*`/`sync-pop-*` | LEGACY (port) | manual-port | **TerraFusion-Sync** | core (sync→suite contracts) | **Sync** | **2** | **port** (post schema gate) |
| County ingestion | `codex/county-studio-*` (ingestion parts) | MAIN (split) | merge/port | **TerraFusion-Sync** | core | Sync | **2** | **port** |
| ArcGIS nightly ingestion | `ArcGisNightlySyncHostedService`, `feat/block-d-arcgis-reconciliation` | mixed | port | **TerraFusion-Sync** | core | Sync | **2** | **port** |
| Atlas map UI | `frontend` PropertyAtlas/GeoForge, `feat/atlas-maplibre-migration` (PR #1073) | MAIN-CURRENT | merge | **TerraFusion-Atlas** | core (map contracts) | Atlas | **3a** | **merge** |
| Deep GIS viewer | `r2/w10-real-atlas-gis`, `gis-pop-1` | LEGACY | port | **TerraFusion-Atlas** | core | Atlas | **3a** | **port** |
| Levy engine + cert | `backend/src/TerraFusion.Levy`, `r2/w12-real-levy-engine`, `wave-31` | LEGACY | port | **TerraFusion-Dais** | core | **Dais** (resolve dual-cert, F14) | **3b** | **port** (post schema gate) |
| Dais workflow/permits | `frontend dais/`, `r2/w11-real-dais-permits` | mixed | port/merge | **TerraFusion-Dais** | core | Dais | **3b** | **port** |
| Forge statistics/IAAO | `TerraFusion.CostForge` (real), `r2/waves-26-35-integration` | LEGACY | port | **TerraFusion-Forge** | core | Forge | **3c** | **port** |
| Income / Current-Use studios | `TerraFusion.CurrentUse`, `incomeforge-readiness`, `cuforge-*` | mixed | port/merge | **TerraFusion-Forge** | core | Forge | **3c** | **port/merge** |
| Dossier / doc mgmt | dossier components, `r2/w13/w23/w24`, `r1/cx22-26` | LEGACY | port | **TerraFusion-Dossier** | core | Dossier | **3d** | **port** |
| CostForge "Ultimate" | `UltimateCostForgeAI.cs` (820 LOC theater) | — | — | **legacy-only** | — | — | — | **cut** |
| Consciousness/quantum/million-agent | `TerraFusion.Consciousness/Services/*` | LEGACY | study | **undecided** (mesh) / **legacy** (theater) | — | — | **4** | **defer/cut** |

## Anti-duplication ownership (R-SPLIT) — split surfaces
| Split surface | runtime | contracts | persistence | ingestion | UI host | tests |
|---|---|---|---|---|---|---|
| **Workbench** | core (host) / suite (domain) | **core** (tab contract) | suite | — | **core** | split per layer |
| **Atlas** | Atlas (UI) / Sync (feed) | **core** | Atlas (view state) / Sync (geo) | **Sync** | core (shell) | per repo |
| **County studio** | Sync (ingest) / core (studio shell) | **core** | Sync | **Sync** | core | per repo |
| **Levy/Dais** | Dais | **core** | **Dais** | Sync (source data) | core (workbench tab) | Dais |

> If any cell above is unfilled for a surface, that surface is **not** cleared to split.

## Extraction order (executable)
- **Phase 1 — Found the core (TerraFusionOS):** shell, workbench host, canon/governance, registry, **shared-contracts**, shell-facing Pilot/Muse/LocalOps. *(merge-mostly; lowest risk.)*
- **Phase 2 — Platform ingress (TerraFusion-Sync):** PACS ETL, county ingestion, county-hub feed, Atlas nightly ingestion. *(behind F14 schema-reconciliation gate.)*
- **Phase 3 — Suites, in order:** **3a Atlas → 3b Dais (incl. Levy) → 3c Forge → 3d Dossier.** *(platform ingress settles before suite dependence expands.)*
- **Phase 4 — AI internals later:** only after F17-style reality classification + real ownership; Pilot deep internals, gated mesh.

## Status
v2 matrix is executable: every surface has source location, lineage, method, future home,
contract owner, schema owner, phase, and cut/defer/port/merge status. New R11 fields added
(`future_home_confidence`, `cross_repo_contract_needed`, `extract_now_or_later`). **No
extraction or repo creation performed** — migration awaits owner lock-release + target repos.
