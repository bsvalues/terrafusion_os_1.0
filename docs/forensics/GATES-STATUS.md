# Gate Model Status

*Living. Last update: Loop 1, 2026-06-24.* Recovery lock remains **ACTIVE**.

| Gate | Criterion | Verdict | Rationale |
|---|---|---|---|
| **A — Discovery Sufficiency** | Forensic lanes broad enough that new finding-categories are rare | **PASS (provisional)** | Loop 1 surfaced the dominant structural category (3 disjoint roots) and confirmed prior honesty-debt findings. New categories stopped appearing. Lanes 2 & 3 remain shallow — re-confirm after Loop 2. |
| **B — Duplication Clarity** | Multiple-systems hypothesis evidenced enough to guide recovery | **PASS** | Lane 5 resolved it: one live system + experiments + 2.3 GB ghosts; counts are file-path-backed. |
| **C — Branch Trustworthiness** | Branch dispositions evidence-backed; **lineage_class + mergeability_class required before branch trust accepted** (tightened) | **PARTIAL** | **Required lineage + mergeability fields are now satisfied for all 741 branches** (`evidence/branch-census.csv`): MAIN-CURRENT 88 / LEGACY 580 / THIRD-ROOT 73; PORT-ONLY 653 / MERGE-CANDIDATE 80 / CONTAINED 8. What remains for full Gate C: per-branch uniqueness/feasibility/value scoring (Lane 11) + full PR-landing checks (Lane 3 Loop 2). **Do not finalize needle list yet.** |
| **D — Containment Readiness** | Salvage-critical evidence protected; no major hidden system unexplained | **NOT MET** | Needles not yet identified; cannot guarantee containment won't destroy salvage value. |
| **E — Recovery Spine Readiness** | Shell/workbench/Dais/registry/governance spine actionable without reckless omission | **NOT MET** | Spine is mapped (Lane 7) but salvage from 653 port-only branches is unassessed; acting now risks omission. |

## Decision

**Stay in discovery → advance to Loop 2.** Recovery lanes 11–14 remain gated.

### Loop 2 entry objectives (to lift Gate C → full, then approach D)
1. Lane 2: build per-surface commit-touch heatmap for shell/workbench/Dais/registry/governance across the **legacy lineage**, to locate where buried value concentrates.
2. Lane 3: full closed-unmerged PR sweep; mark each salvage-relevant PR "landed in main? y/n" by content diff.
3. Begin Lane 11 **scoring rubric only** (uniqueness/feasibility/value) — no dispositions committed until Gate C is full.
