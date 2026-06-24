# R12 Batch Already-Landed Check — v2 (CORRECTED, full-membership)

> **Supersedes the collapse conclusion in `R12-BATCH-LANDED-CHECK.md` (v1).** v1 checked only
> 1–3 *representative* branches per initiative and concluded "pool mostly already-landed." The
> full-membership check (all canon/atlas/workbench/county-studio branches) shows that was
> **premature collapse** (HR-6 / "no premature collapse"). Genuine unlanded value exists. v1
> stands as a record of the representative pass; **this v2 is authoritative.**

## Noise floor characterized (so residual counts are trustworthy)
- **`residual ≤ 9` = shared deletion-residue = already-landed.** The recurring 9 files are
  identical across unrelated branches: `os-platform/development/testing-suite/performance/PerformanceTest00{5..9,12..14}.cs`
  + `tests/costforge-ai/CostForgeAIController.test.cs` — old tests `main` deleted; every
  old-base branch still carries them. (Plus the 62 stale `e2e/E2ETest*.cs`, already excluded.)
- **`residual >> 9` = genuine unlanded content.** Verified sample (county-studio-canonical-parcel-readiness, 60):
  real `os-platform/core/pilot/county-studio-*.mjs` + `.test.mjs` harnesses (forge-real-data-wiring,
  data-lineage-reconciliation, real-dev-backend-health, port-preflight, server-activation,
  terraatlas-geometry-evidence) + `backend/.../AtlasLiveGeometryController.cs` + evidence JSON/MD. **Real, tested, not in main.**

## Corrected dispositions

| Initiative | Landed status | Residual unique content? | Regression risk if merged | Next disposition |
|---|---|---|---|---|
| **N2 canon/governance** (all `feat/canon-*`,`os-canon-*`) | **already-landed** (all at residual=9 floor; os-canon-diff-risk-viewer=0, #932) | **none** (floor only) | HIGH (old base) | **ignore (verify-complete)** ✓ v1 call holds |
| **N3a atlas-maplibre (#1073 OPEN)** | not landed | yes (1 file, recent) | LOW | **merge via PR #1073** (the one live mergeable item) |
| **N3 deep atlas/gis** (`r2/w2,w10,w18` 51–52; `ui/ecosystem-…-atlas` 103) | **residual-salvageable** | **yes, substantial** | n/a (LEGACY PORT-ONLY) | **port → TerraFusion-Atlas** |
| **N3/N6 county-studio terraatlas geometry** (33–66 residual) | **residual-salvageable** | **yes** (AtlasLiveGeometryController + geometry harnesses) | bulk-merge re-adds floor | **cherry-pick residual** (MERGE-CANDIDATE, behind 150) |
| **N5a workbench recut (#1074), worktree-mcp** | **already-landed** (residual=0) | none | LOW | **ignore** ✓ |
| **N5 workbench host-contract** (`workbench-canonical-host-runtime-contracts` 331, `…live-deferred-scope-truth` 334, `…contribution-pattern` 118, `…runtime-reconciliation` 335) | **residual-salvageable — verify depth** (huge ahead 1.5k–3.8k; some may be main-deleted mass) | **likely yes** (core-bound workbench host work) | EXTREME if bulk-merged | **finer per-file diff → cherry-pick/port; → TerraFusionOS core (host)** |
| **N5c auth-gate** (569 residual, +1.86M ins) | **HAZARD** | re-adds deleted mass | EXTREME | **never merge → port-only/archaeology; owner-sensitive** |
| **N6 county-studio forge/pilot harnesses** (`canonical-parcel-readiness` 60, `exemption-fact-dependency` 62, `full-forge-dev-smoke` 60, `r1-forge-dev-handoff` 64, `real-dev-port-preflight` 52, `runtime-evidence-drift` 48, …) | **NOT already-landed — residual-salvageable** | **yes — real LocalOps pilot + forge-real-data harnesses** | bulk-merge re-adds floor | **cherry-pick residual** (behind 150, MERGE-CANDIDATE); owner-sensitive (county) |
| **N6 county-studio r1-stabilization/handoff/saved-*** (residual=9) | already-landed (floor) | none | HIGH | **ignore** |

## Corrected headline (retraction of v1 collapse)
The mergeable pool does **NOT** fully collapse to already-landed. It splits three ways:
1. **Already-landed (ignore):** all of N2 canon, the recent recut items (#932/#1074), the `residual=9` floor branches.
2. **One live merge:** PR #1073 (atlas-maplibre).
3. **Genuine unlanded residual (real value, was nearly discarded):**
   - **county-studio forge/pilot harnesses + AtlasLiveGeometryController** (cherry-pickable, behind 150),
   - **deep atlas/gis** (`r2/w*-atlas-gis`, port-only → Atlas),
   - **workbench host-contract work** (core-bound; verify depth before port),
   - all fenced where owner-sensitive (county) or hazardous (auth-gate).

## Method correction (for the record)
- v1 error: judged whole initiatives from 1–3 representatives → missed member branches carrying real residual.
- v2 fix: full-membership + a characterized noise floor (`residual ≤ 9` and the e2e set = deletion-residue).
- Recovery method by residual + lineage: `residual≤9` → ignore; recent-base + residual → merge/cherry-pick; old-base/LEGACY + residual → port-only; huge-ahead → verify depth first (may be main-deleted mass).

## Strategic clarification (revised)
Real near-term value is larger than v1 implied: beyond PR #1073, there is a **genuine
cherry-pick pool** (county-studio forge/pilot harnesses + atlas geometry) on the current
lineage, **plus** the PORT-ONLY Tier-1 engines behind the F14 gate. The "everything's already
landed" story was an artifact of under-sampling. No lock release; no code moved.
