# PR Disposition Register (Lane 3 — PR & Merge-Path Audit)

*Deliverable #4.* Status: **partial** (recent-40 window + structural pattern).
Confidence: **medium**. Full historical PR sweep deferred to Loop 2.

Method: `mcp__github__list_pull_requests` (state=all, sorted by updated, 40 most recent),
parsed for `number | state | merged | base←head | title`; cross-checked against
`git log origin/main` subjects.

---

## 1. Headline pattern: "closed-unmerged is the norm"

Of the 40 most-recently-updated PRs:

| State | Count |
|---|---|
| open | 2 |
| closed, **merged=false** | 38 |
| merged=true (GitHub merge button) | **0** |

Yet `main`'s history shows squash-style subjects like `… (#1079)`, `… (#1043)`,
`… (#932)`, `… (#1074)` **and** classic `Merge pull request #1072 …` /
`#1015` / `#915` commits.

**Interpretation (cross-checked):** work lands on `main` predominantly by **recut /
cherry-pick / squash**, after which the source PR is **closed without the merge flag**.
GitHub's `merged` boolean is therefore an **unreliable disposition signal** in this repo —
a PR marked "closed-unmerged" may have fully landed (e.g. `#1079`, `#1043`) or may be
genuinely abandoned. Disposition must be confirmed by **content presence in `main`**, not
by the merge flag.

This is itself a **misleading-PR hazard** (Lane 10): any future audit that trusts the
`merged` field will misclassify both landed and abandoned work.

---

## 2. Stacked / chained PRs (dangerous to merge directly)

Many PRs target **another feature branch**, not `main` — long dependency chains:

```
#912 county-studio-runtime-evidence-drift → county-studio-r1-forge-dev-smoke
#911 county-studio-r1-forge-dev-smoke      → county-studio-r1-forge-dev-status
#910 …r1-forge-dev-status                  → county-studio-terraatlas-geometry-wiring
#909 …risk-object-source-audit             → …terraatlas-geometry-wiring
#908 …geometry-wiring                      → …geometry-evidence-correction
#907 …geometry-evidence-correction         → …forge-real-data-wiring-verification
#906 …real-data-wiring-verification        → …forge-dev-dependency-reclassification
#904 …dev-dependency-reclassification      → …data-lineage-reconciliation
#903 …data-lineage-reconciliation          → …real-dev-activation
#901 …real-dev-activation                  → sync-db-evidence-runtime-path
#900 …sync-db-evidence-runtime-path        → county-studio-real-dev-readiness
#1075 county-studio-real-dev-readiness     → main
```
A single `county-studio` initiative spans **≥12 chained PRs**. Merging any mid-chain PR
in isolation is hazardous. These all live on the **current `main` lineage** (root
`f2511bb`) so they are at least *technically* mergeable — but only as an ordered stack.

## 3. Currently open PRs

| # | base ← head | Title | Note |
|---|---|---|---|
| 1073 | main ← `feat/atlas-maplibre-migration` | Atlas MapLibre migration + parcel context overlay | claims cherry-picked cleanly onto main; **verify lineage before trusting** |
| 1076 | main ← `fix/projector-delete-insert-atomicity` | Projector delete/insert atomicity | empty body; relates to closed #865/#927/#1072 recut chain |

## 4. Disposition rules adopted (for Loop 2 full sweep)

1. **Never** trust the `merged` flag. Confirm landing by content diff against `main`.
2. Treat any PR whose head branch is on root `7c26657`/`5d16d8f` as **port-only**
   (cannot merge — see `03-…`).
3. Chained PRs → disposition the **whole chain** as one unit, in order, or extract the
   net file delta.
4. `snyk-fix-*` PRs on the legacy lineage → bulk **ignore** (stale, unmergeable).

## 5. Unresolved (Loop 2)
- Full inventory of all closed-unmerged PRs (repo has 1000+ PR numbers).
- Per-PR "landed in main? yes/no" content check for the salvage-relevant ones.
- Recurring CI/policy/gate failure patterns (not yet sampled).
