# Gate Model Status

*Living. Last update: Loop 1, 2026-06-24.* Recovery lock remains **ACTIVE**.

| Gate | Criterion | Verdict | Rationale |
|---|---|---|---|
| **A — Discovery Sufficiency** | Forensic lanes broad enough that new finding-categories are rare | **WITHDRAWN → back to PARTIAL** | Loop 1's provisional pass is **revoked**: Loop 2's six new lanes (F11–F16) surfaced *new* categories of disorder (conflicting DB lineages F14; committed secrets F15; ownership vacuum F16). Per the /loop rule, frequent new categories ⇒ remain in discovery. Re-test after Loop 3 verifies the new criticals and Lanes 2 & 3 deepen. |
| **B — Duplication Clarity** | Multiple-systems hypothesis evidenced enough to guide recovery | **PASS** | Lane 5 resolved it: one live system + experiments + 2.3 GB ghosts; counts file-path-backed. F14 adds a *data-layer* duplication (3 DbContexts, dual LevyCertification) but does not reopen the system-count question. |
| **C — Branch Trustworthiness** | Branch dispositions evidence-backed; **lineage_class + mergeability_class required before branch trust accepted** (tightened) | **PARTIAL** | **Required lineage + mergeability fields are now satisfied for all 741 branches** (`evidence/branch-census.csv`): MAIN-CURRENT 88 / LEGACY 580 / THIRD-ROOT 73; PORT-ONLY 653 / MERGE-CANDIDATE 80 / CONTAINED 8. What remains for full Gate C: per-branch uniqueness/feasibility/value scoring (Lane 11) + full PR-landing checks (Lane 3 Loop 2). **Do not finalize needle list yet.** |
| **D — Containment Readiness** | Salvage-critical evidence protected; no major hidden system unexplained | **NOT MET** | Needles not yet identified; cannot guarantee containment won't destroy salvage value. |
| **E — Recovery Spine Readiness** | Shell/workbench/Dais/registry/governance spine actionable without reckless omission | **NOT MET** | Spine is mapped (Lane 7) but salvage from 653 port-only branches is unassessed; acting now risks omission. |

## Decision (post Loop 2)

**Stay in discovery → advance to Loop 3.** Recovery lanes R11–R14 remain gated. Gate A is
withdrawn because Loop 2 re-opened discovery.

### Loop 3 entry objectives
1. **Verify F14/F15 criticals** (highest priority): does the dual `LevyCertification` DbSet
   actually fault at runtime? Are the F15 secrets in current HEAD (not just history)?
2. **Escalate F15 secret exposure** to the owner with a rotation recommendation (do not
   rotate/commit changes under recovery lock without authorization).
3. Lane 2: per-surface commit-touch heatmap for shell/workbench/Dais/registry/governance across the **legacy lineage**.
4. Lane 3: full closed-unmerged PR sweep; mark each salvage-relevant PR "landed in main? y/n" by content diff.
5. Lane R11 **scoring rubric only** (uniqueness/feasibility/value) — no dispositions until Gate C is full.

### New gate dependencies introduced by Loop 2
- **Gate D** now also requires: F15 secret exposure resolved/owned; F14 schema-conflict understood.
- **Gate E** now also requires: recovery-spine stewardship assigned (F16) and the Seal Gate
  cancelled-as-failed foot-gun (F13) acknowledged so spine work isn't blocked by phantom CI failures.
