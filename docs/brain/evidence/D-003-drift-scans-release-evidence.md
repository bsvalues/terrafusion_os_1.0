# D-003 — Drift Scans / Release Evidence

- **Date:** 2026-06-09 · **Verdict: ✅ D-003 CLOSED** (scan-and-report; details in `graphify-out/DRIFT_REPORT.md`)

## Governance checks (current, post-restart ×2)
| Check | Status |
|---|---|
| `brain check` (naming · write-lanes · protected-paths · hardcoded-ports · reserved-staging) | ✅ all green |
| `brain wiki --check` | ✅ current (15 pages match canon) |
| `brain check reserved-staging` | ✅ green (3 frozen controllers, footprint not growing) |
| write-lanes (spec-gates owner) | ✅ green — 98 validated + 19 forward-staged exempted (exact, self-revoking; ADR-0014) |

## Drift scans run (changed-set scope; see DRIFT_REPORT for boundary)
- `naming:lint` PASS · `reserved-boundary-check` CLEAN (7 files) · `ui-honesty-pass` CLEAN
- `design-token-police` → 1 LOW nit (**D-009**, P3) · `registry:check` → **BROKEN** (**D-010**, P2: `applications/` dir absent)

## Release gates status
- Open drift: **P0=0 · P1=0 · P2=2 (D-001 env, D-010) · P3=1 (D-009)**
- `brain release`: ~51% confidence, **READY WITH KNOWN LIMITATIONS / NOT READY on unchecked product gates**
- Resolved this cycle: D-002 (Dais verified), D-003 (this), D-004/005/007 (reserved-office containment,
  ADR-0010–0014), D-006 (external), D-008 (fake-green stubs deleted)

## Known limitations
- Scans covered the **working-tree changed set**, not full-repo; BLAST_RADIUS / OWNERSHIP_GRAPH /
  TEST_COVERAGE_MAP deferred to a dedicated Graph slice (documented, not silently skipped).
- The Brain governance footprint (~70 files) is **uncommitted** — CI enforcement inert until landed.

## Remaining P1/P2 + next recommended slice
- P2: **D-010** (registry:check / `applications/`) — needs operator restore-vs-tolerate decision.
- Product gates unchecked: Shell-Contract verification · full UI honesty sweep · ServiceRegistry.
- **Next (per `brain next`): land the Brain governance commit, path-limited via `brain commit-plan`.**
