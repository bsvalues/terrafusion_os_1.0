# WO-0007 — D-011 Investigation: Is the Workbench Window Contract Stale?

- **Date:** 2026-06-09 · **Verdict: the CONTRACT TESTS are stale — the components are live.**
- Investigation-only (R4 decision reserved to the architect). No source changed.

## Topology (proven)
| Component | Status | Evidence |
|---|---|---|
| `PropertyWorkbench.tsx` (54 lines) | **LIVE, thin host** | routed at `property/:parcelId` (`Router.tsx:253`); delegates to Surface |
| `PropertyWorkbenchWindow.tsx` (193 lines) | **LIVE, thin host** | registered in `config/moduleComponents.tsx` (window/module activation); delegates to Surface |
| `PropertyWorkbenchSurface.tsx` (530 lines) | **canonical owner** | both hosts import it |

## Where the contract elements actually live now
| Contract element | Test reads | Actually lives in |
|---|---|---|
| `TABS` / `WORKBENCH_TABS` (9 canonical defs) | Window / Workbench | **Surface** (`WORKBENCH_TABS`, intact, 9 defined) |
| `tabPathMap` (8 non-summary paths) | Workbench | **Surface** (`getCurrentTabFromPath`, intact) |
| `TAB_COMPONENTS` | Window | Window (still there; structure shape diverged from extractor) |
| `[Codex]` violation logging | Window | **NOWHERE** — removed/superseded; no non-test source emits it |

The embedding contract dates from `cad667c3e` ("Layer 3-4 promotion with 9-tab workbench and
governance tests") — written **before** the Surface consolidation centralized the tab structures.

## Recommendation (R4 — architect's call, not executed)
**Retarget the contract tests at the Surface; do not reshape the live components.**
1. Point `TABS`/`WORKBENCH_TABS`/`tabPathMap` assertions at `PropertyWorkbenchSurface.tsx`.
2. Keep the contract's *intent*: **9 tabs DEFINED** (constants, incl. forward-staged Clerk/Treasury/Audit)
   vs **6 rendered by default** (TF-052 §4.1 + FU-2A gate) — the retargeted tests should encode the
   defined-vs-rendered distinction explicitly so they don't fight the reserved-office gating.
3. Drop or replace the `[Codex]` logging assertions — the feature no longer exists in source; asserting
   it is contract fiction. If violation-logging is still wanted, that's a new feature decision, not a test fix.
4. Re-validate host-boundary enforcement against the host components as they are (thin delegating hosts).

Blast radius of the recommendation: test files under `os-platform/core/tests/` only (governance lane);
zero product-component changes; clears the 5 failures honestly before the SEAL escape hatch hardens
(2026-06-30).
