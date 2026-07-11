# WO-WB-TC-005 — Tile-Contract Test: Hang Investigation & Final Disposition (Option C)

**Goal:** GOAL-TF-WB-SUITE-TILE-CONTRACT-001 — Real Suite Tile-Array Launch Contract
**WO:** WO-WB-TC-005 — Hang remediation → final disposition
**Category:** Test remediation (tests + docs only)
**Operator:** Claude Code · owner decisions: Option A (`TEST_DESIGN_REMEDIATION`) then **Option C** (2026-07-11)
**Status:** CLOSED — the `suiteTileArrayLaunch.contract.test.tsx` test is **dropped**; #1240 lands as docs-only.

> Supersedes the coverage matrix in `WO-WB-TC-004` (which describes the now-removed test).

---

## 1. What happened

`suiteTileArrayLaunch.contract.test.tsx` (the real-array contract) deterministically hung one Frontend Fast Gate unit
shard to the 30-min timeout (orphan `vitest`/`esbuild` at kill), while sibling shards + Build & Checks passed in ~4.5 min.
Isolation was airtight: on #1260 (identical CI, without this test) shard 1 passed at 4.7 min; adding this one test file made
shard 1 hang.

**Three test-level fixes were tried and all failed** (each a full ~30-min CI run on #1240's shard 1):
1. Deterministic `fetch` stub (fixed the primary network hang elsewhere — shard 1 passed on #1260 — but not here).
2. Option A: remove ALL rendering, assert arrays as pure data → shard 1 still hung → the hang is at IMPORT, not render.
3. Stub `SuiteModuleGrid` exactly like the passing sibling deeplink tests → shard 1 still hung.

**Conclusion:** the defect is a cross-suite **import interaction** — this test imports all three suite-homes
(Atlas+Dais+Dossier) into one worker file; the deeplink tests import one each and pass. An eval-time open handle in one
suite-home's real dependency graph appears to surface only in that three-way combination. Pinpointing it precisely would
need further verbose/serialized diagnostics with no guarantee of a one-line fix.

## 2. Final disposition (Option C, owner-approved)

- **Drop** `suiteTileArrayLaunch.contract.test.tsx`.
- **Revert** the three `export const` edits (added only for this test) back to `const` — #1240 now makes **no product
  change**.
- **Keep** the Phase-16 synthetic-fixture test `launchSurfaceContractParcelWorkbench.contract.test.tsx` (on `main`,
  unchanged) as the launch-**mechanism** proof: given a `launchMode`, the grid navigates/activates correctly.
- #1240 lands as **docs-only** (this audit trail): WO-WB-TC-001, WO-WB-TC-004 (historical), WO-WB-TC-005 (this).

## 3. What coverage remains vs. what is deferred

- **Covered (on main):** the SuiteModuleGrid routing mechanism (Phase-16 synthetic-fixture test) + the window/route
  real-hosting & parity gates + honesty-contract coverage from prior workbench programs.
- **Deferred:** the real-array DATA contract (existence / launch-mode / workbenchTab / moduleId / no-dupe checks over the
  shipped arrays). If revived, it should NOT import the suite-home component modules into a fast-gate test. Cleaner
  vehicles: (a) a Node-side data test that reads the arrays from a data-only module — which first requires extracting the
  arrays into a small `suites/*Modules.ts` sibling that the suite-homes re-export (a product refactor, separately
  ratified); or (b) a typegen/lint rule over the array literals.

## 4. CI reliability (separate, DONE)

The gate-timeout work (WO-CI-FASTGATE-003) is complete and healthy — merged via #1245/#1252/#1257/#1260: audit-exclude,
3-way unit shard, split unit-vs-build/checks jobs, seal-gate `frontend-checks` enforcement, deterministic `fetch` stub,
Bundle-Analysis full-suite + missing-file fixes. The gate now completes in ~5 min for all work except the dropped test.
