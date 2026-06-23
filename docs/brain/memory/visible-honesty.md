# Visible Honesty Register

> No county user, investor, or agent may mistake fake behavior for production truth. Every surface
> that shows data classifies that data. Mock/fixture/placeholder/demo must be **labeled in the UI**,
> not silently presented as real.

## Classification taxonomy
| Class | Meaning | UI requirement |
|-------|---------|----------------|
| **real** | Live, sovereign, county-isolated data from the DB / PACS truth | No label needed |
| **fixture** | Deterministic seed/test data standing in for real | Visible "Sample data" badge |
| **mock** | Hardcoded/stubbed values, no backing store | Visible "Mock" badge |
| **placeholder** | Empty/skeleton awaiting wiring | "Not yet wired" state |
| **demo-only** | Behaves for a demo, not production-safe | "Demo only" banner |

## Register
> Populated by the honesty sweep (P0 release gate). Run the `ui-honesty-pass` skill on changed UI
> files and the `design-token-police` skill for hardcoded light-mode/raw-token tells, then log here.

| Date | Surface / Component | Class | Labeled? | Owner | Notes |
|------|---------------------|-------|----------|-------|-------|
| 2026-06-09 | **FULL SWEEP (WO-0009)** — 18-file honesty contract battery + scanner over suites (42 files) + workbench (74 files) | mixed | ✅ verified | QA | Battery **105/106** (1 stale pinned-prose assertion → [[drift-ledger]] D-013; honesty intent survives). Scanner: **0 pattern hits**; spot-checked flags = CSS/descriptive false positives. Explicit truth labels found in product: `"Full TerraForge not done"` WARN chip (ForgeSuiteHome:800), `truthState: 'queued'` (AtlasSuiteHome:39). Governed surfaces disclose honestly. |
| 2026-06-09 | `ForgeSuiteHome.tsx` proof-path disclosure | **label dropped** | ⚠️ partial | Forge/fleet | `'Benton Runtime Pilot'` present + zero overclaim phrases, but the `DB/API-backed proof path` disclosure phrase was dropped in the fleet rewrite → D-013 (P2). |
| 2026-06-09 | `DaisPersistenceAcceptanceTests.cs` (Unit/Wave4) | ~~fake~~ **RESOLVED** | n/a — file DELETED | QA | 34 empty-body `[Fact]` stubs (+ false "skipped" doc-claim) **deleted** (D-008). Real coverage retained: Wave4PersistenceTests.cs (13 facts) + 37 Dais tests (D-002). No fake-green remains. |

## How to run the sweep
- UI honesty: invoke the **`ui-honesty-pass`** skill on changed UI component files → aspirational
  claims, fluff verbs, direct-action language where the code only drafts/requests/summarizes.
- Raw-token / light-mode tells: invoke the **`design-token-police`** skill.
- For each hit: classify, add a row, fix the label (or open a work order), and re-run.

**Rule:** a surface cannot ship 1.0 with unlabeled mock/fixture/demo data on a governed path.
