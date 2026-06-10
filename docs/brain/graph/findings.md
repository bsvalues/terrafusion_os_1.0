# Graphify Findings (drift + blast radius)

> "Graphify" = system visibility: what is connected, what drifted, what is high-blast-radius.
> This repo has **no tool literally named `graphify`** (grep, 2026-06-09 — zero references). Rather
> than fabricate one, this note maps the Graphify *role* onto detectors that already exist here, and
> records their real output. Reports land in `graphify-out/`.

## What "Graphify" maps to in THIS repo (honest inventory)
| Graphify role | Real detector in this repo |
|---------------|----------------------------|
| Reserved-name / suite-boundary drift | **`reserved-boundary-check`** skill |
| Raw-token / light-mode UI drift | **`design-token-police`** skill |
| Aspirational / dishonest UI claims | **`ui-honesty-pass`** skill |
| Naming/canon lint | `pnpm run naming:lint` (`tools/naming/naming-lint.mjs`) |
| Generated-module drift | `pnpm run registry:check` |
| Manifest/contract drift | `pnpm run contract:check` (`tools/dev/manifest-guard.mjs`) |
| Code inventory / blast radius baseline | `docs/CODE_INTEL_BASELINE.json` (keys: generated_at, counts, items) |
| Type graph integrity | `pnpm run type-check` (`tsc -p tsconfig.core.json`) |

> If a real Graphify (e.g. an Obsidian graph export or a code-intel pass) is run externally, drop its
> output as `graphify-out/GRAPH_REPORT.md` etc. and reconcile findings into [[drift-ledger]].

## Four reports the Graph Agent maintains in `graphify-out/`
1. `DRIFT_REPORT.md` — reserved names, audit↔trace misuse, cross-suite imports, parcel routes
   bypassing Workbench, OS-shell importing department logic, hardcoded ports/z-index, unlabeled mock.
2. `BLAST_RADIUS.md` — files imported by many areas; shell files; shared cross-suite services; high-risk controllers/stores/routing.
3. `OWNERSHIP_GRAPH.md` — file → layer → suite → owner → write-lane → release-gate.
4. `TEST_COVERAGE_MAP.md` — feature → files → tests → gaps.

## Baseline run — 2026-06-09
| Check | Result |
|-------|--------|
| `pnpm run type-check` | ✅ PASS (exit 0, clean) |
| `dotnet build TerraFusion.sln` | ⚠️ 0 CS errors; output-copy blocked by running API (PID 60308) — D-001 |
| reserved-boundary-check skill | ⬜ not yet run — D-003 |
| design-token-police skill | ⬜ not yet run — D-003 |
| ui-honesty-pass skill | ⬜ not yet run — D-003 |
| naming:lint / registry:check / contract:check | ⬜ not yet run |

**Next Graph Agent action:** run the three detector skills + the three lint scripts on the current
branch diff; promote every P0/P1 hit into [[drift-ledger]]; write the four reports into `graphify-out/`.
