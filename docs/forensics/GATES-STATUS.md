# Gate Model Status

*Living. Last update: Loop 1, 2026-06-24.* Recovery lock remains **ACTIVE**.

| Gate | Criterion | Verdict | Rationale |
|---|---|---|---|
| **A — Discovery Sufficiency** | Forensic lanes broad enough that new finding-categories are rare | **PARTIAL → re-converging** | Loop 2 (F11–F16) re-opened discovery; **Loop 3 + Loop 4 produced NO new categories** — they refined/downgraded existing ones (Levy "collision"→data-split; registration "sprawl"→benign; context ambiguity→classified). Convergence is resuming. Provisional re-pass is contingent only on the **legacy-lineage** Lane 2 heatmap (archaeology) and Lane 3 population CI-reclassification — both deferred, neither expected to surface a new *category*. |
| **B — Duplication Clarity** | Multiple-systems hypothesis evidenced enough to guide recovery | **PASS** | Lane 5 resolved it: one live system + experiments + 2.3 GB ghosts; counts file-path-backed. F14 adds a *data-layer* duplication (3 DbContexts, dual LevyCertification) but does not reopen the system-count question. |
| **C — Branch Trustworthiness** | Branch dispositions evidence-backed; **lineage_class + mergeability_class required before branch trust accepted** (tightened) | **PARTIAL (advanced)** | Lineage + mergeability satisfied for all 741 (`branch-census.csv`). **R11 decision register now produced** (`R11-BRANCH-DISPOSITION.md`) with fences encoded; `ci_trust_class` bounded (Loop 5), `ai_reality_dependency_flag` resolved (F17), owner-sensitive (87) + overlap groups + archaeology-only (653) listed. **Remaining for FULL Gate C:** per-branch uniqueness/feasibility/value scoring + final needle selection — **deferred (fence #5)** until lock release. Class-level disposition trustable; per-branch needle list not yet. |
| **D — Containment Readiness** | Salvage-critical evidence protected; no major hidden system unexplained | **NOT MET** | Needles not yet identified; cannot guarantee containment won't destroy salvage value. |
| **E — Recovery Spine Readiness** | Shell/workbench/Dais/registry/governance spine actionable without reckless omission | **NOT MET** | Spine is mapped (Lane 7) but salvage from 653 port-only branches is unassessed; acting now risks omission. |

## Decision (current — post Loop 5)

**Forensic phase is saturated.** Loops 3, 4, and 5 produced **no new disorder category** —
they refined/bounded/closed existing findings. The bar to *consider* salvage planning (R-lanes)
is cleared. **Recovery lock remains ACTIVE pending the owner's explicit release decision.**
Residuals from Loop 4 are closed (`LOOP5-VERIFICATION.md`); the one open item (cert/levy single
source of truth) is an owner product decision, not a forensic blocker.

*(Historical) Decision (post Loop 2): stay in discovery → advance to Loop 3; Gate A withdrawn
because Loop 2 re-opened discovery. Superseded by the above after Loops 3–5 re-converged.*

### Loop 3 entry objectives
1. **Verify F14/F15 criticals** (highest priority): does the dual `LevyCertification` DbSet
   actually fault at runtime? Are the F15 secrets in current HEAD (not just history)?
2. **Escalate F15 secret exposure** to the owner with a rotation recommendation (do not
   rotate/commit changes under recovery lock without authorization).
3. Lane 2: per-surface commit-touch heatmap for shell/workbench/Dais/registry/governance across the **legacy lineage**.
4. Lane 3: full closed-unmerged PR sweep; mark each salvage-relevant PR "landed in main? y/n" by content diff.
5. Lane R11 **scoring rubric only** (uniqueness/feasibility/value) — no dispositions until Gate C is full.

### New gate dependencies introduced by Loop 2
- **Gate D** now also requires: ~~F15 secret exposure resolved/owned~~ **(DONE — keys rotated 2026-06-24)**; F14 schema-conflict understood.
- **Gate E** now also requires: recovery-spine stewardship assigned (F16) and the Seal Gate
  cancelled-as-failed foot-gun (F13) acknowledged so spine work isn't blocked by phantom CI failures.
