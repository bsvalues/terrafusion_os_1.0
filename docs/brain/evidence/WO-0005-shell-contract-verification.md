# WO-0005 — Shell-Contract Verification Evidence

- **Date:** 2026-06-09 · **Verdict: ⚠️ GATE NOT CLEAN — 2 violation clusters found (D-011, D-012)**
- Verification-only slice (no fixes — both clusters are outside scope: R4 shell / product suites).

## What was verified

| Surface | Result |
|---|---|
| Workbench compliance (`workbench-host-boundary` + `workbench-tab-embedding`) | ❌ **39/44** — 5 fail (D-011) |
| Write-lane governance (`c2-write-lane-governance` + `suite-write-lane-compliance`) | ❌ **31/33** — 2 fail (D-012) |
| Workbench route guard (`CANONICAL_WORKBENCH_TABS`) | ✅ canonical 6 only (verified FU-1/FU-2A) |
| Rendered tab gating (reserved offices off by default) | ✅ `reservedOfficeGating.test.ts` 3/3 (FU-2A) |
| Workbench contract constants (`VALID_WORKBENCH_TAB_IDS` etc.) | ✅ `workbench.contractGates` + `registryCompleteness` 46/46 (verified during FU-2A) |

## Findings (recorded as drift, NOT fixed here)

**D-011 (P1)** — `PropertyWorkbenchWindow.tsx`/`PropertyWorkbench.tsx` no longer match the 9-tab
embedding contract (`TABS`/`TAB_COMPONENTS` structure + `[Codex]` violation logging). Not FU-2A
fallout — FU-2A touched only `PropertyWorkbenchSurface.tsx`; the failing tests read different files.
Likely parallel-window divergence vs. the contract, or the contract is stale vs. a Surface
consolidation — **architect call (R4)**.

**D-012 (P1)** — literal Article III cross-suite imports: `DaisSuiteHome.tsx:28` and
`DossierSuiteHome.tsx:28` both import forge's `county-studio/countyStudyApi`. Dais/Dossier must not
import Forge directly; bridge or relocate the shared API.

## Why P1 and not P2
Both failing suites run `continue-on-error` in SEAL **with the governance escape hatch expiring
2026-06-30** — at expiry they become hard merge-blockers. Fix-before-1.0 severity.

## Honest scope boundary
Dock/top-bar ownership and full launch-surface truth-table assertions were **not** exhaustively swept
this slice (the frontend `launchSurfaceContractParcelWorkbench`/`shellTruthAudit` contract suites
exist but were not run here — vitest batch deferred to the follow-up WO that resolves D-011, since the
Window divergence will dominate those results anyway). Documented, not silently skipped.
