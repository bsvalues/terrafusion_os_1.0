# WO-WB-TC-005 — Tile-Contract Test Hang Remediation (Option A)

**Goal:** GOAL-TF-WB-SUITE-TILE-CONTRACT-001 — Real Suite Tile-Array Launch Contract
**WO:** WO-WB-TC-005 — Test-design remediation (owner-approved Option A)
**Category:** Test remediation (tests + docs only)
**Operator:** Claude Code · owner decision `TEST_DESIGN_REMEDIATION_AUTH_GRANTED` (2026-07-11)

**Authorization:** Owner approved Option A with pre-authorized merge. Allowed: `suiteTileArrayLaunch.contract.test.tsx`
+ related test helpers/fixtures if strictly necessary + WO evidence docs. Blocked: suite-home/SuiteModuleGrid runtime,
CI workflow, backend, deploy, county/PACS/secrets.

---

## 1. Problem

`suiteTileArrayLaunch.contract.test.tsx` (PR #1240) imported the real suite-homes AND rendered the real
`SuiteModuleGrid` ~40× (once per shipped tile) to exercise `handleLaunch`. Under the full sharded Frontend Fast Gate,
that repeated real-grid rendering left an open worker handle that **deterministically hung one unit shard to the 30-min
job timeout** (orphan `vitest`/`esbuild` at kill), while sibling shards finished in ~4.5 min.

**Isolation (first-hand):** #1260 (all CI fixes, no this test) passed shard 1 at 4.7 min; #1240 (adds only this test file
+ 3 `export` lines) hung shard 1 at 30.3 min on both the run and a clean re-run → the test's rendering, not the CI infra,
is the cause. (The CI-reliability work — WO-CI-FASTGATE-003 — is complete and healthy: audit-exclude, 3-way unit shard,
split unit-vs-build/checks jobs, seal-gate `frontend-checks` enforcement, deterministic `fetch` stub, Bundle-Analysis
full-suite + missing-file fixes; all merged via #1245/#1252/#1257/#1260.)

## 2. Fix (Option A)

Drop the rendering entirely; assert the **real exported arrays as pure data**. The routing MECHANISM (given a
`launchMode`, the grid navigates/activates correctly) is already proven by the Phase-16 synthetic-fixture test
`launchSurfaceContractParcelWorkbench.contract.test.tsx` (unchanged, on `main`). No render → no hang; the real-array
contract codex #1237 asked for is preserved.

## 3. Invariants asserted (pure data)

- **Required tiles exist** — curated presence check per suite (Dais certification/appeals/calendar/terra-levy/management;
  Dossier documents/evidence/defense/chain/photos/search/terra-sync; Atlas gis/parcel-lens/layer-works).
- **Intent lock** — representative tiles keep their shipped `launchMode` + target (workbenchTab / moduleId), incl. the
  cross-suite Dossier `defense` → Dais tab — catches a mode/tab flip.
- **Supported launch modes only** — every tile's `launchMode` ∈ {workbench, standalone} (no reserved/unsupported mode).
- **Workbench tabs canonical** — every workbench tile's `workbenchTab` ∈ the 8-slug `WorkbenchTabSlug` union.
- **Standalone ids resolve** — every standalone tile resolves a non-empty `moduleId ?? id`.
- **No duplicate ids** — tile ids unique within each suite array.

## 4. Import-safety

Reading the exported arrays still evaluates the suite-home module graph (SuiteModuleGrid → moduleActivation crash vector,
panels, services, hooks); the retained `vi.mock` set tames that evaluation. Nothing is rendered, so the render-hang is
gone. No product file changed (the only product edit in this lane remains the 3 `export` keywords).

## 5. Validation

Focused tile-contract test + the Phase-16 mechanism test + full Frontend Fast Gate (3 unit shards) + Build & Checks, all
green in-budget; `git diff --check` clean; 0 unresolved review threads. CI is run-of-record.
