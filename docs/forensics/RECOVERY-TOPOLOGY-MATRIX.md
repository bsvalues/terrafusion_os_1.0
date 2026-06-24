# Recovery-to-Repo Topology Matrix (Phase A)

*The reframe: recovery is no longer "fix the old monorepo into one forever-repo." It is
**recover the right assets into the right future homes.** This matrix is **Phase A —
classify-for-topology**. Decision-only; recovery lock ACTIVE; nothing extracted or migrated.*

## Two operations, now separated (HR-7)
- **Salvage** = find & preserve real value from old branches (R12). Keyed on F18 value tier.
- **Migration** = place that value into the correct **new** repo. A *distinct* operation that
  cannot start until (a) the target repos exist and (b) the core spine is proven.
- **"Valuable" is no longer sufficient — it must also be correctly placed.** Every needle now
  carries a `future_repo_target`.

## Target homes
| Repo | Owns |
|---|---|
| **TerraFusionOS** (core) | shell, workbench **host**, Pilot/Trace/Canon **shell surfaces**, contracts, runtime composition, **registry**, governance/canon tooling |
| **TerraFusion-Sync** (platform) | county ingestion, **PACS ETL**, ArcGIS **ingestion feed**, shared normalization/integration — *upstream of everything* |
| **TerraFusion-Dais** (suite) | Dais workflow/persistence, **Levy**, permits, certification |
| **TerraFusion-Atlas** (suite) | map UI, parcel/geometry **viewer** |
| **TerraFusion-Forge** (suite) | cost matrices, **forge statistics** (OLS/Bayesian/MonteCarlo/spatial/RCW), income/cu/regression studios, valuation pipeline |
| **TerraFusion-Dossier** (suite) | parcel dossier, document management |
| **legacy-only / archive** | wrapper noise, dead recut dupes, MOCKED/FICTION theater |
| **undecided** | deep AI internals (possible future **TerraFusion-Pilot**), the gated consciousness mesh |

## Matrix — surface → future home (with recovery op + phase)

| Surface / needle | Value tier | Best-version branch(es) | Lineage→method | **future_repo_target** | salvage→migrate | Phase |
|---|---|---|---|---|---|---|
| **N1 LocalOps/Muse/Pilot** | 2 (real) | `wo-localops-000…008` | MAIN→merge | **TerraFusionOS** (shell-facing Pilot) + *undecided* (deep AI internals → future TerraFusion-Pilot) | salvage→migrate(core) | **B** |
| **N2 Canon/governance tooling** | 1–2 | `feat/canon-*`, `os-canon-*` | MAIN→merge | **TerraFusionOS** (clearly core) | salvage→migrate(core) | **B** |
| **Registry** | — | `tools/registry`, ServiceRegistry | (in main) | **TerraFusionOS** | core spine | **B** |
| **Workbench** | 1 | `codex/property-workbench-*`, `927-recut` | MAIN→merge | **SPLIT:** host→**TerraFusionOS**; comps/valuation domain→**Forge/Dais** | salvage→migrate(split) | **B (host) / D (domain)** |
| **N4 AI-consolidation honesty** | 3 (truth) | `wo-ai-consolidation-000/001/004a` | MAIN→merge | **TerraFusionOS** (cross-cutting canon/truth) | salvage→migrate(core) | **B** |
| **Sync / PACS ETL** | 1 | `sync-complete-2-v3`, `sync-doctrine-4-impl-v9`, `sync-pop-4c/4d`, `attr-pop-1/2`; bridge `codex/sync-db-evidence-runtime-path` | LEGACY→port (+1 merge) | **TerraFusion-Sync** | salvage→migrate(platform) | **C** |
| **county-studio** | 1–2 | `codex/county-studio-*` (22) | MAIN→merge | **SPLIT:** ingestion→**Sync**; studio UI→**core/suite** | salvage→migrate(split); verify-landed #1075 | **C/D** |
| **ArcGIS / Atlas** | 2 | `feat/atlas-maplibre-migration` (PR #1073), `feat/atlas-suite-ci-contract-repair`, `county-studio-terraatlas-*` | MAIN→merge | **SPLIT:** map UI→**TerraFusion-Atlas**; nightly ingestion→**TerraFusion-Sync** | salvage→migrate(split) | **C (feed) / D (UI)** |
| **Deep GIS** | 2 | `r2/w18-real-arcgis-integration`, `r2/w10-real-atlas-gis`, `gis-pop-1` | LEGACY→port | **Atlas** (viewer) / **Sync** (reconciliation) | salvage→migrate(split) | **D** |
| **Levy engine** | 1 | `r2/w12-real-levy-engine`, `wave-31-cert` | LEGACY→port | **TerraFusion-Dais** (Dais-bound, NOT standalone platform) | salvage→migrate(suite) | **D** |
| **Forge statistics/IAAO** | 2 | `r2/waves-26-35-integration` | LEGACY→port | **TerraFusion-Forge** | salvage→migrate(suite) | **D** |
| **Income/Cu/Regression studios** | 2 | `codex/incomeforge-readiness`, `cuforge-*`, `regression-studio-runtime` | MAIN→merge | **TerraFusion-Forge** | salvage→migrate(suite) | **D** |
| **Dossier** | 2 | `r2/w13/w23/w24-dossier`, `r1/cx22-26-parcel-dossier` | LEGACY→port | **TerraFusion-Dossier** | salvage→migrate(suite) | **D** |
| **CostForge "Ultimate"** | **5** | — | — | **legacy-only (cut)** | neither | — |
| **Consciousness/quantum/million-agent** | 5 (mostly); mesh=2 gated | `fix/consciousness-engine-stub-733` | LEGACY→port | **undecided** (mesh) / **legacy-only** (theater) | study only | — |

## Phased recovery (topology-aware, NOT immediate full extraction)
- **Phase A — classify for topology** *(this matrix)* — every meaningful asset: what / real? / lineage / recoverability / **future home**. ✅ this doc.
- **Phase B — core spine → TerraFusionOS:** shell, workbench host, Pilot shell surface, canon/governance, registry, contracts. (N1 shell-part, N2, workbench host.) *This is still the recovery spine — do first.*
- **Phase C — platform ingress → TerraFusion-Sync:** PACS ETL, county ingestion, ArcGIS feed. *Upstream of everything; behind the F14 schema-reconciliation gate.*
- **Phase D — suite domains:** Dais(Levy) / Atlas / Forge / Dossier — least-fractured first.

## Do NOT pull forward (→ legacy-only)
The old monorepo blurred boundaries; a cleaner topology must not re-import the blur:
- ghost workspace layers (`.workspace-map.json`, dead `*.code-workspace` — F11/RF-5),
- fake platform wrappers / "Ultimate" CostForge theater (F18 Tier-5),
- misleading shell fluff / suite logic disguised as core,
- floating Levy-as-platform confusion (Levy is **Dais-bound**, not core/platform),
- 58 `snyk-*`, dead recut duplicates, MOCKED/FICTION AI surfaces (unless honesty-corrected).

## Risk note (the new failure mode to avoid)
Topology lowers structural-confusion risk but raises **premature-split risk**. So:
**decide target homes now (this matrix), recover in phases, extract last.** Migration into new
repos waits until the repos exist AND the core spine (Phase B) is proven. Splitting before we
know enough would recreate the mess in N repos instead of one.

## Status
Phase A classification complete. `future_repo_target` is now a first-order recovery field
(added to R11 schema). Salvage (R12) and Migration (new) remain gated on owner lock-release +
the target repos existing. This matrix is the placement decision; it executes nothing.
