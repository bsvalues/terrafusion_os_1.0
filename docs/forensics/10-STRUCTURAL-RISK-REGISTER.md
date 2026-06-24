# Structural Risk Register (Lane 10)

*Deliverable #10.* Status: **complete**. Confidence: **medium-high**.
What could mislead recovery even after basic auditing.

| # | Risk | Evidence | Why it misleads | Severity |
|---|---|---|---|---|
| R1 | **Disjoint-root merge hazard** | 3 roots; 653 branches share no ancestor with `main` | Anyone attempting `git merge` of a legacy branch gets a meaningless 3,800-commit "merge" or a refusal. Divergence counts look like huge active branches. | **CRITICAL** |
| R2 | **`merged` flag is unreliable** | 38/40 recent PRs closed-unmerged, yet `#1079/#1043` are in `main` | Audits trusting GitHub's merge flag misclassify both landed and abandoned work. | HIGH |
| R3 | **Misleading completion narrative** | "1,008 agents", SEALED.md, status endpoints | Creates false confidence that swarm/FISMA/seal are done. | HIGH |
| R4 | **Near-complete ghost replicas** | `QUARANTINE/.../TERRAFUSION_OS_CORE`, `_CLEAN_BUILD_ZONE`, 15× property-workbench | A reader can mistake a 2.3 GB dead replica for an active system or "the real one". | HIGH |
| R5 | **Stacked PR chains** | `county-studio` ≥12-deep chains | Merging mid-chain in isolation breaks ordering / loses context. | MEDIUM |
| R6 | **Confusion aliases** | `config/` vs `configs/`; `os-shell` (frontend) vs `native-shell` vs Gateway "shell"; 3 `.sln` | Same-name surfaces invite editing the wrong one. | MEDIUM |
| R7 | **Recut sprawl / `-v2..v9`** | `feat/sync-doctrine-4-impl-v{2..9}`, `tf-agent-forge-wo-forge-005-*` (5 variants), `ui/tokens-b2-sweep-{02..38}` | Hard to tell which variant is authoritative; needle extraction must pick the right one. | MEDIUM |
| R8 | **`snyk-fix-*` on dead lineage** | 58 snyk branches, mostly root `7c26657` | Look like security work but are unmergeable/stale. | LOW |
| R9 | **Date anomalies** | `ops/agents/sessions/` 2025-12 logs; SEALED.md date | Timestamps can mislead chronology of "what happened when". | LOW |
| R10 | **Stray root residue** | `_validator_proof.log.err` | Looks like a proof artifact; is an error log. | LOW |
| R11 | **Committed secrets** (Loop 2 / F15) — **MITIGATED 2026-06-24** | `appsettings.json:16` (JWT key), `config/database.dev.json:3` (DB password) | Keys **rotated** per owner; committed values now stale/invalid. Residual: externalize to `${TF_*}` so the pattern doesn't recur or mislead audits. | ~~CRITICAL~~ → MEDIUM |
| R12 | **Dual LevyCertification schema** (F14) | `Core/Entities/LevyCertification.cs` vs `Levy/Models/LevyCertification.cs`, both `DbSet` | DI-order decides which persists; silent data-layer ambiguity. | HIGH |
| R13 | **Seal Gate cancelled-as-failed** (F13) | `seal-gate-fast.yml` `case` default | Phantom CI failures on superseded commits (observed on PR #1080); could block valid spine work. | HIGH |
| R14 | **Recovery-spine ownership vacuum** (F16) | `.github/CODEOWNERS` (no workbench/dais/registry owner) | Rebuild would be blind; Gate E precondition unmet. | HIGH |
| R15 | **`.workspace-map.json` ghost map** (F11) | root, Windows path + non-existent dirs | Any tool parsing it gets a false repo model. | MEDIUM |
| R16 | **Port contract theater** (F15) | platform.json 5046/3102 vs dev-compose 5000/3000 | Env-var port config silently ignored in dev. | MEDIUM |
| R17 | **`config/` vs `configs/` + appsettings/api-unified duplication** (F15) | root | Edit-the-wrong-config hazard. | MEDIUM |
| R18 | **Governance soft-fail expiry** (F13) | `seal-gate-fast.yml` (until 2026-06-30) | ~91 gov tests auto-flip to hard-fail in days; merges that pass now may break shortly. | MEDIUM |

## Hazardous-merge list (do NOT direct-merge)
- Any branch on roots `7c26657` / `5d16d8f` (653 branches) — **port-only**.
- Any mid-chain `county-studio-*` PR in isolation.
- The 582 "51+ ahead" divergence outliers (artifact of R1).

## Misleading-surface list
- `QUARANTINE/top-level-dirs/*` replicas; `elite-dashboard` fabricated metrics;
  `GPTController /explain` canned data; `SEALED.md`; "1,008-agent" status endpoints.
