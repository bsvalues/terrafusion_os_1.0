# Gate C — Per-Branch Scoring & Final Disposition (decision layer)

*Completes the R11 decision lane. Decision-only; recovery lock ACTIVE; no R12 execution.*

## Scoring rubric (evidence-anchored, replayable)
Each score is **H / M / L**, derived from named evidence (not vibe):
- **O — operational value:** F18 value tier + recovery-spine relevance (shell/workbench/Dais/registry/governance).
- **U — uniqueness:** is the work unique & *not yet landed*? Drops to L if likely already landed via the recut/squash workflow (Lane 3) or duplicated across a recut family.
- **F — feasibility:** MERGE-CANDIDATE+clean = H; mergeable-but-chained/owner-sensitive = M; PORT-ONLY / behind the schema gate = L.

**Scope honesty:** scoring is at **initiative granularity** using lineage + mergeability +
F18 tier + PR-landing signals + fences — **not** per-commit diffs of all 80 branches. Gate C
FULL = the *decision layer* is complete and defensible. **Per-needle commit-level + "already
landed?" content verification is an R12-entry step**, not a Gate C blocker.

## Scored needle pool — MERGE-CANDIDATE initiatives (the 80, grouped)

| # | Initiative (branches) | O | U | F | Fences | Disposition (nomination) |
|---|---|---|---|---|---|---|
| N1 | **LocalOps/Muse/Pilot** — `wo-localops-000…008`, `wo-sec-localops-001`, `coefficient-preview-runtime` | H | H | H | sec-localops = owner-sensitive; AI tier-2 (eligible) | **salvage-now — FIRST** (ordered stack) |
| N2 | **Canon/governance tooling** — `feat/canon-*` (7), `feat/os-canon-*` (5) | H | H | H | governance = recovery-spine | **salvage-now — early** |
| N3 | **Atlas/ArcGIS (mergeable)** — `feat/atlas-maplibre-migration` (**open PR #1073**), `feat/atlas-suite-ci-contract-repair`, `codex/county-studio-terraatlas-*` (3) | M-H | M | H | county = owner-sensitive | **salvage-now — 2nd class** |
| N4 | **AI-consolidation honesty** — `wo-ai-consolidation-000/001/004a` | H | M | H | removes fiction (truth work) | **salvage; verify-landed** (004a likely already landed → root 5d16d8f) |
| N5 | **Property Workbench** — `codex/property-workbench-{comps-review-desk,production-closure,production-smoke}`, `927-workbench-parcel-load-recut`, `fix/workbench-parcel-boot-auth-gate` | H | M | M | recovery-spine; auth-gate owner-sensitive | **compare-later → salvage; verify-landed** (#1074/#927 likely landed) |
| N6 | **county-studio chain** — `codex/county-studio-*` (22, ordered, terminates `…real-dev-readiness` = closed PR #1075) | H | M | M | owner-sensitive (county); treat as ONE unit | **verify-landed (#1075) first; salvage residual** |
| — | **ops control panel** — `ops-control-panel-seed`, `ops-cp-002`, `ops-cp-003` | M | **L** | — | — | **ignore/verify-landed** (in main HEAD: `(#1079)`, intake/review-index already merged) |
| — | **sync atomicity fixes** — `fix/projector-delete-insert-atomicity` (**open PR #1076**), `fix/land-drain-propsupp-bulk-source` | M | L | M | — | **verify-landed** (#865/#1071/#1072 landed); resolve open #1076 |
| — | **domain studios** — `cuforge-*`, `incomeforge-readiness`, `regression-studio-runtime`, `terra-gama-runtime` | M | M | M | — | **compare-later** |
| — | **brain** — `wo-brain-0014-path-router`, `brain-domain-packs` | M | M | H | AI tier-2 | **compare-later** |
| — | **sync-db bridge** — `codex/sync-db-evidence-runtime-path` | H | M | M | pairs with sync port; behind schema gate | **compare-later** (bridge for N-sync) |
| — | **misc/peripheral** — `chore/ui-ux-pro-max-skill`, `chore/os-canon-bottom-tab-aria`, `wsaca-vendor-strategy`, `intelligence-preview`, `j10-dev39-dns`, `june10-*`, `runtime-db-binding-prod-config`, `release-auth-smoke-timeout`, `fix/wo-sec-0001-shell-quote-override`, `tf-agent-forge-wo-forge-002-v2` | L-M | L-M | H | wo-sec-0001 owner-sensitive | **case-by-case: compare-later / ignore** |

## Scored PORT-ONLY salvage candidates (Tier-1/2, behind schema gate)

| Initiative (best-version head) | O | U | F | Disposition |
|---|---|---|---|---|
| **Sync/PACS ETL** — `sync-complete-2-v3`, `sync-doctrine-4-impl-v9`, `sync-pop-4c/4d`, `attr-pop-1/2` | H | H | **L** (manual-port + schema gate + owner) | **archaeology → salvage AFTER schema reconciliation** |
| **Levy engine** — `r2/w12-real-levy-engine`, `wave-31-forge-levy-certification` | H | H | **L** (port + dual-LevyCertification reconcile + owner) | **archaeology → salvage AFTER schema reconciliation** |
| **Forge statistics/IAAO** — `r2/waves-26-35-integration` | H | H | **L** (port; cross-check live IAAO compliance code) | **archaeology → salvage AFTER schema gate** |
| **Deep GIS** — `r2/w18-real-arcgis-integration`, `r2/w10-real-atlas-gis`, `gis-pop-1` | M-H | M | L (port) | **archaeology → salvage (lower priority)** |

## Class-level dispositions (remainder)
- **CONTAINED (8)** → **ignore** (already in main; incl. this working branch, `codex/currentuse-sqlite-provider-fix` [note: the F14 fix *is* contained!], `dais-queue-root-cause`, etc.). *Worth flagging: `codex/currentuse-sqlite-provider-fix` is CONTAINED — the known CurrentUse fix may already be in main; verify at R12.*
- **PORT-ONLY non-candidates (~640)** → **archaeology** (default; salvage only if Lane 2 legacy heatmap later proves unique value). Includes the 58 `snyk-*` (stale/unmergeable → **ignore**) and the recut-family duplicates (keep one head per overlap group, archaeology the rest).
- **Tier-5 (CostForge "Ultimate", million-agent/quantum theater)** → **deprecate/cut**, never salvage.

## Nominated needle set & order (still under lock)
1. **N1 LocalOps/Muse/Pilot** (merge stack) — lowest risk, highest honesty.
2. **N2 Canon/governance tooling** (merge) — restores recovery-spine governance.
3. **N3 Atlas/ArcGIS** (merge/cherry-pick; resolve open PR #1073).
4. **N4 AI-consolidation honesty** (verify-landed + merge residual).
5. **N5 Property Workbench** (verify-landed; recovery-spine) & **N6 county-studio** (verify #1075).
6. **⛔ SCHEMA-RECONCILIATION GATE** (F14/HR-2) — blocks the Tier-1 ports.
7. **Sync → Levy → Forge-stats ports** (owner-reviewed, post-gate).
8. **Cut CostForge "Ultimate."**

## Gate C verdict: **FULL (decision layer)**
- Every branch carries lineage + mergeability (census) + risk fields (ci_trust, owner_sensitive,
  red_flag_categories, ai_reality_dependency, unresolved_product_intent) + a disposition.
- The needle set is **scored, fenced, and ordered**.
- **Explicit residual (by design, not omission):** per-needle commit-level diff + "already
  landed via recut?" content check is performed **at R12 entry**, per needle, not in bulk here.
  This is an execution-entry verification, consistent with "decide-not-execute."

Gate C is now **FULL**. Gates D/E and R12 execution remain gated on **owner lock-release**.
