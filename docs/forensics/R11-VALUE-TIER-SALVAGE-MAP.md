# Value-Tier Salvage Map (Tier 1–2 surfaces → best-version branches)

*Decision-lane artifact (feeds R12). A MAP, not a port — produced under recovery lock; no
merges/cherry-picks/ports executed here.* Inputs: `F18-LATENT-VALUE-AUDIT.md` (value tiers),
`evidence/branch-census.csv` (lineage+mergeability), `evidence/value-tier-surface-map.txt` (raw).

## The pattern that drives the plan
> **The deepest value (Tier-1 domain engines) is stranded on the dead lineage; the easiest
> wins (the honest LATENT AI spine) are on current main.** Recovery method therefore splits by
> surface: legacy Tier-1 = **port-only**; current-lineage Tier-2 = **merge/cherry-pick**.

| Surface | Value tier | Best-version branch(es) | Lineage | Recovery method | Fences |
|---|---|---|---|---|---|
| **Muse / Pilot / LocalOps** (honest local-AI spine) | 2 (LATENT, real) | `claude/wo-localops-000…008` (ordered stack; head = `wo-localops-008-runtime-proof`), `codex/coefficient-preview-runtime` | **MAIN-CURRENT** | **merge / cherry-pick (stack, in order)** | `wo-sec-localops-001-phone-redaction` = owner-sensitive |
| **ArcGIS / Atlas** (scheduler real; geo deferred) | 2 | `feat/atlas-maplibre-migration` (**open PR #1073**), `feat/atlas-suite-ci-contract-repair`, `codex/county-studio-terraatlas-geometry-wiring`→`…-evidence-correction`→`…-gis-truth-correction` | MAIN-CURRENT | **merge / cherry-pick** | county-studio = owner-sensitive (county) |
| **AI-consolidation honesty** (removes fiction) | 3 (truth work) | `claude/wo-ai-consolidation-000`,`-001`,`-004a` (mergeable); `fix/wo-ai-consolidation-004c-*` (port) | MAIN-CURRENT (+ third-root) | **merge** the mergeable; port the 004c-* honesty fixes | — |
| **Deep GIS** ("real" arcgis/geometry) | 2 | `r2/w18-real-arcgis-integration`, `r2/w10-real-atlas-gis`, `feat/gis-pop-1-geometry-lane-closure` | LEGACY | **manual-port files/hunks** | — |
| **Sync / PACS ETL** (production ETL skeleton) | 1 | corpus: `feat/sync-complete-2-v3-year-sliced-imprv-attr`; doctrine: `feat/sync-doctrine-4-impl-v9-hosted-test`; parcel spine: `feat/sync-pop-4c-canonical-parcel`/`-4d-final-closure`; dictionaries: `feat/attr-pop-1/2`; bridge onto main: `codex/sync-db-evidence-runtime-path` (**MERGE-CANDIDATE**) | mostly **LEGACY** (+1 main) | **manual-port** legacy heads; **cherry-pick** the sync-db-evidence bridge | **owner-sensitive (PACS)** + **schema-fractured (F14)** |
| **Levy engine** (real WA RCW math) | 1 | `r2/w12-real-levy-engine` (engine), `r2/wave-31-forge-levy-certification` (cert), `chore/terra-levy-parity-sync` (parity) | LEGACY | **manual-port** | **owner-sensitive (levy/cert)** + **schema-fractured (dual LevyCertification, F14)** |
| **Forge statistics / IAAO** (OLS/Bayesian/MonteCarlo/spatial/RCW) | 2 | `r2/waves-26-35-integration` (consolidated head of the whole suite); individual: `r2/wave-26-forge-ols-regression` … `wave-35-forge-valuation-pipeline` | LEGACY | **manual-port** (port the integration head; cross-check against IAAO compliance code already in main) | — |
| **CostForge "Ultimate"** | **5 (trash)** | — | — | **NOT salvage → deprecate/cut** | — |

## Recommended salvage sequence (dependency + risk order)
*(order = decision recommendation only; execution is R12, gated on lock-release)*

1. **LocalOps/Muse/Pilot stack** (`wo-localops-000…008`) — **lowest risk, highest honesty.** Mergeable, real, on current lineage; wires the LATENT local-AI spine that F17 found is the *only* genuinely defensible AI path. Merge as an ordered stack.
2. **ArcGIS/Atlas mergeable heads** — `feat/atlas-maplibre-migration` is already open as **PR #1073**; resolve it + the county-studio geometry chain (ordered).
3. **AI-consolidation honesty** — merge `wo-ai-consolidation-000/001/004a`; these *delete fiction* (the 1,008 canon correction already produced root 5d16d8f). Low risk, high truth value.
4. **⛔ SCHEMA RECONCILIATION GATE (blocks 5–7).** Per F14/HR-2, the Tier-1 domain ports touch the fractured persistence layer (dual `LevyCertification`, 4 DbContexts/3–4 DBs). **No Sync/Levy/forge port may proceed until schema lineage is reconciled.** This is the critical-path dependency.
5. **Sync/PACS ETL port** — after #4 + owner (PACS) review: port `sync-complete-2-v3`, `sync-doctrine-4-impl-v9`, `sync-pop-4c/4d`, `attr-pop-1/2`; cherry-pick `codex/sync-db-evidence-runtime-path` (the one mergeable bridge).
6. **Levy engine port** — after #4 + owner (levy/cert) review: port `r2/w12-real-levy-engine` + `wave-31` certification; reconcile the dual-LevyCertification first.
7. **Forge statistics port** — port `r2/waves-26-35-integration`; cross-check against the real IAAO compliance code already in the live spine.
8. **CostForge "Ultimate" cut** — deprecate `UltimateCostForgeAI.cs` (Tier 5); keep the honest valuation placeholder instead.

## Blast-radius notes
- **Steps 5–7 are blocked by the schema fracture (step 4)** — this is the single biggest dependency; porting domain engines onto an unreconciled multi-context/multi-DB layer would re-bury the value.
- **Overlap dedup before porting:** pick ONE head per recut family (sync-doctrine-4 → v9; wo-forge-005 → authoritative; tokens-b2-sweep → latest) — see R11 overlap-resolution groups.
- **PORT-ONLY means file/hunk extraction**, never `git merge` (disjoint histories). Steps 1–3 are the only *mergeable* work.
- **Owner-sensitive surfaces (PACS, levy, cert, county)** require owner review before salvage-now (R11 fence #2).

## Status
Map complete at surface→best-version granularity. **Per-branch uniqueness/feasibility/value
scoring + final needle commitment remain gated** (Gate C full + lock release). This map
nominates targets and sequence; R12 executes only on your explicit release.
