# Branch Census Register (Lane 1 — Git Graph Audit)

*Deliverable #3.* Status: **complete with cross-check**. Confidence: **HIGH**.

Method (chain-of-custody):
- `git ls-remote --heads origin | wc -l` → **741** remote heads (+ this working branch).
- `mcp__github__list_branches` paginated pages 1–8 → 742 (cross-check; agrees).
- `git for-each-ref` + `git rev-list --max-parents=0` per branch → root partition (`evidence/branch-roots.txt`).
- `git rev-list --left-right --count origin/main...<branch>` per branch → divergence (`evidence/branch-divergence-vs-main.txt`).
- `git merge-base origin/main <branch>` → ancestry test.

---

## 1. The dominant finding: three disjoint lineages

`git merge-base origin/main origin/<legacy-branch>` returns **empty** — no common
ancestor. There are **3 distinct root commits**:

| Root commit | Root date | Root subject | Branches | Disposition class |
|---|---|---|---|---|
| `f2511bb` | 2026-05-24 | `feat(income-forge): activate live runtime module (#859)` | **89** | **Current `main` lineage — tractable** |
| `7c26657` | 2025-08-31 | `Initial commit: TerraFusion Security Monitoring Fix …` | **580** | **Legacy lineage — archaeology / port-only** |
| `5d16d8f` | 2026-06-11 | `docs(ai-consolidation): WO-AI-CONSOLIDATION-004a — correct the 1,008-agents canon claim (#951)` | **73** | **Third re-root — port-only** |

**Implication:** `main` was re-rooted at least twice. Only the **89** branches on root
`f2511bb` can be reasoned about with normal `git merge`/`cherry-pick` against `main`. The
**653** branches on roots `7c26657` + `5d16d8f` are on disjoint DAGs — merging them into
`main` is unsafe/meaningless; their value must be extracted file-by-file.

> This is also the most likely root cause of the historical pain described in the WO:
> "incomplete git understanding, partial pushes, unfinished merges, repeated restarts."
> A re-root silently strands every in-flight branch.

---

## 2. Divergence buckets (vs `origin/main`)

From `evidence/branch-divergence-vs-main.txt` (ahead/behind counts):

| Bucket | Count | Notes |
|---|---|---|
| Fully contained in `main` (ahead = 0) | **15** | Prune-safe — already in `main`. |
| 1–10 commits ahead | 104 | Mostly same-lineage recent work. |
| 11–50 commits ahead | 40 | Review individually. |
| 51+ commits ahead | **582** | **Inflated by the disjoint-root effect** — these show thousands "ahead" because they share no base with `main`, not because they are 582 genuine megabranches. Treat as archaeology. |

The top-15 most-diverged branches all report identical "194 behind / ~3,800 ahead" —
the signature of measuring across unrelated histories, confirming the re-root.

---

## 3. Branch family map (by lineage)

Source: `evidence/lineage-family-breakdown.txt`.

### Legacy lineage `7c26657` (580 branches — the buried-value archive)
`feat/*` 142 · `fix/*` 59 · `snyk-*` 58 · `ui/*` 55 · `copilot/*` 47 · `r2/*` 40 ·
`codex/*` 25 · `chore/*` 20 · `tf-agent-*` 19 · `docs/*` 16 · `claude/*` 14 · `r1/*` 10 ·
`feature/*` 9 · `ops/*` 8 · `phase4b/*` 7 · plus `wave2-9/*`, `r2.5–r2.8/*`, `release/*`,
`rescue/*`, `revert/*`, `hotfix/*`, `phase4c/*`, `test/*`, `wip/*`.

Notable families to mine later (Lane 11):
- `r2/w1…w25` + `r2/wave-26…35` — the "real calculators" series (forge, pilt, costforge, atlas, dais, levy, dossier).
- `feat/sync-*` — PACS→TerraFusion sync corpus/drain work (many `-v2…v9` recuts).
- `feat/canon-*`, `feat/os-canon-*` — canon gate/viewer tooling.
- `feat/phase4-…phase51-*` — long phase ladder (workspace spine, auth, registry).
- `ui/tokens-b2-sweep-02…38` — design-token ratchet sweeps.
- `snyk-fix-*`/`snyk-upgrade-*` (58) — automated dependency PRs; almost certainly stale on a dead lineage → bulk-ignore candidates.

### Current `main` lineage `f2511bb` (89 branches — tractable)
`codex/*` 47 · `claude/*` 18 · `feat/*` 15 · `fix/*` 5 · `chore/*` 2 · `tf-agent-*` 1 · `main`.
Dominated by `codex/county-studio-*` chains, `claude/wo-localops-*`, `claude/wo-ai-consolidation-*`, `codex/ops-cp-*`.

### Third lineage `5d16d8f` (73 branches)
`claude/*` 25 · `fix/*` 19 · `docs/*` 13 · `tf-agent-*` 9 · `feat/*` 4 · others.
Centered on `claude/wo-data-*`, `fix/wo-ai-consolidation-004c-*`, `docs/wo-data-004b-*`.

---

## 4. Census completeness

Lane 1 completion criterion ("every remote branch inventoried, basic historical position
known") is **met**: all 742 branches are partitioned by root and bucketed by divergence,
with raw evidence committed under `evidence/`. Per-branch *uniqueness/feasibility/value*
scoring is deferred to Lane 11 (gated).
