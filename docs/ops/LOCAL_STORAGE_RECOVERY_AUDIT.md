# WO-OPS-001: Local Storage Recovery Audit and Safe Cleanup

**Date**: 2026-06-14
**Status**: COMPLETE — All 16 approved Tier 3 worktrees deleted. 9 review-needed worktrees remain.

---

## 1. Starting State

| Metric | Value |
|--------|-------|
| Drive total | 952.9 GB |
| Drive used | 952.2 GB |
| Drive free | **0.71 GB** (critically low) |

## 2. Storage Map

### 2a. Docker

Docker volumes report 603.7 GB internally (after seed volume deletion), but all Docker data is stored in a single WSL2 VHDX file:
- **VHDX**: `C:\Users\bsval\AppData\Local\wsl\{f126617d-...}\ext4.vhdx` — **78.03 GB** on Windows host
- The internal 603.7 GB figure is the Linux filesystem view; actual host impact is 78 GB
- VHDX does not auto-shrink when Docker volumes are deleted
- Compaction requires `wsl --shutdown` + `Optimize-VHD` (not yet approved)

**Docker Volumes (current):**

| Volume | Status | Notes |
|--------|--------|-------|
| `backend_postgres-data` | **ACTIVE** | DO NOT DELETE — dev DBs |
| `55112e...` (anonymous) | ACTIVE | Mounted by postgres |
| `tf_mssql_data` | Inactive | MSSQL data — NOT APPROVED |
| `tf_mssql_data_pacs` | Inactive | PACS MSSQL data — NOT APPROVED |
| `pacs_baks` | Inactive | PACS backups — NOT APPROVED |
| ~~`tf_wa_initial_seed_sql_data`~~ | **DELETED** | Old seed data, no containers |
| ~~`tf_wa_seed_sql2_data`~~ | **DELETED** | Old seed data, no containers |

### 2b. Git Worktrees

| Metric | Before | After Tier 1+2 |
|--------|--------|----------------|
| Git worktree count | ~109 | 103 |
| Total directories | ~123 | ~117 |

### 2c. Other Caches

| Cache | Size | Action |
|-------|------|--------|
| `.codex-trash` | 3.62 GB | **DELETED** |
| NuGet cache | 4.36 GB | Not yet cleared |
| npm cache | 2.30 GB | Not yet cleared |
| `.chocolatey` | 1.15 GB | Not cleared |
| `.cache` | 1.19 GB | Not cleared |
| `.codex` | 2.76 GB | Not cleared |

## 3. Cleanup Performed

### Pass 1: node_modules deletion (PARTIAL — strategy abandoned)

- Targets: 84 node_modules directories
- Methods tried: `Remove-Item`, `rmdir /s /q`, `del /f /s /q` + `rmdir`, parallel (4 then 8 concurrent)
- Completed: ~8 directories fully deleted
- **Abandoned**: node_modules contains hundreds of thousands of tiny files with deep nesting, long paths, locked files, symlinks, and antivirus-scanned JS packages. Each deletion takes 5-10+ minutes on a near-full disk. Strategy pivot: delete entire stale worktrees instead.

### Pass 2: Safe cache deletion (COMPLETE)

- `.codex-trash`: DELETED (~3.6 GB)

### Pass 3: Docker seed volumes (COMPLETE)

- `tf_wa_initial_seed_sql_data`: inspected, no containers, DELETED
- `tf_wa_seed_sql2_data`: inspected, no containers, DELETED
- Freed ~11.5 GB inside Docker VM (not visible on Windows host — VHDX non-shrink)

### Pass 4: Tier 1 — Git-prunable worktrees (COMPLETE)

| Worktree | Action | Result |
|----------|--------|--------|
| `terrafusion_os_1.0_local-agent-ship` | `git worktree prune` + `rmdir /s /q` | DELETED |
| `tf-agent-fu2-gate` | `git worktree prune` + `rmdir /s /q` | DELETED |
| `tf-sync-v4` | `git worktree remove --force` | DELETED |
| `terrafusion_os_1.0_worktrees/tf-agent-docs-wo-research-template` | `git worktree prune` | PRUNED (dir already gone) |
| `terrafusion_os_1.0_worktrees/tf-agent-research-wo-pacs-cama` | `git worktree prune` | PRUNED (dir already gone) |

### Pass 5: Tier 2 — Old Claude worktrees (COMPLETE)

| Worktree | Age | Action | Result |
|----------|-----|--------|--------|
| `.claude/worktrees/hopeful-brown` | 2026-03-31 | `rmdir /s /q` (orphaned) | DELETED |
| `.claude/worktrees/priceless-payne` | 2026-03-11 | `rmdir /s /q` (orphaned) | DELETED |
| `.claude/worktrees/priceless-vaughan` | 2026-03-11 | `rmdir /s /q` (orphaned) | DELETED |
| `.claude/worktrees/relaxed-pare` | 2026-03-11 | `rmdir /s /q` (orphaned) | DELETED |
| `.claude/worktrees/upbeat-blackburn` | 2026-03-11 | `rmdir /s /q` (orphaned) | DELETED |
| `.claude/worktrees/heuristic-jackson-cf6690` | 2026-04-29 | `git worktree remove --force` | DELETED |

### Pass 6: Tier 3 — Merged PR worktrees (COMPLETE — all 16 deleted)

All 16 approved worktrees were PR-MERGED + git-clean. Deleted across two sessions (laptop shutdown interrupted first run after 6/16; remaining 10/16 completed in second run).

| # | Worktree | PR | Result |
|---|----------|-----|--------|
| 1 | codex-coefficient-preview-runtime | #861 | DELETED (session 1) |
| 2 | codex-income-forge-runtime | #859 | DELETED (session 1) |
| 3 | codex-regression-studio-runtime | #860 | DELETED (session 1) |
| 4 | codex-terra-gama-runtime | #862 | DELETED (session 1) |
| 5 | live-runtime-endpoint-triage | #872 | DELETED (session 1) |
| 6 | release-lane-auth-smoke-retry | #878 | DELETED (session 1) |
| 7 | pr857-cuforge-finish | #857 | DELETED (session 2) |
| 8 | pr858-batch-cost-run-live-api | #858 | DELETED (session 2) |
| 9 | cuforge-casework-desk | #874 | DELETED (session 2) |
| 10 | codex-county-studio-risk-surfaces | #880 | DELETED (session 2) |
| 11 | codex-county-studio-r1-artifact-payloads | #883 | DELETED (session 2) |
| 12 | codex-county-studio-r1-handoff-stabilization | #881 | DELETED (session 2) |
| 13 | codex-county-studio-r1-outbound-payloads | #887 | DELETED (session 2) |
| 14 | codex-county-studio-r1-payload-audit | #882 | DELETED (session 2) |
| 15 | codex-county-studio-r1-saved-context | #884 | DELETED (session 2) |
| 16 | codex-county-studio-r1-saved-view-payloads | #885 | DELETED (session 2) |

## 4. Results

| Metric | Value |
|--------|-------|
| Starting free space | 0.71 GB |
| Ending free space | **135.64 GB** |
| Total GB recovered | **~135 GB** |
| Worktree count before | ~109 |
| Worktree count after | 82 |

## 5. Tier 3 Verification List (NOT approved for deletion — evidence only)

### Safe to delete (PR MERGED, git status clean, has node_modules):

| Worktree | Branch | PR | Status | Dirty? | Recommendation |
|----------|--------|----|--------|--------|----------------|
| codex-coefficient-preview-runtime | codex/coefficient-preview-runtime | #861 | MERGED | clean | SAFE TO DELETE |
| codex-income-forge-runtime | codex/income-forge-runtime | #859 | MERGED | clean | SAFE TO DELETE |
| codex-regression-studio-runtime | codex/regression-studio-runtime | #860 | MERGED | clean | SAFE TO DELETE |
| codex-terra-gama-runtime | codex/terra-gama-runtime | #862 | MERGED | clean | SAFE TO DELETE |
| live-runtime-endpoint-triage | codex/dais-queue-root-cause | #872 | MERGED | clean | SAFE TO DELETE |
| release-lane-auth-smoke-retry | codex/runtime-db-binding-prod-config | #878 | MERGED | clean | SAFE TO DELETE |
| pr857-cuforge-finish | feat/cuforge-zustand-live-api | #857 | MERGED | clean | SAFE TO DELETE |
| pr858-batch-cost-run-live-api | feat/batch-cost-run-live-api | #858 | MERGED | clean | SAFE TO DELETE |
| cuforge-casework-desk | codex/cuforge-casework-desk | #874 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-risk-surfaces | codex/county-studio-r1-stabilization | #880 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-r1-artifact-payloads | codex/county-studio-r1-artifact-payloads | #883 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-r1-handoff-stabilization | codex/county-studio-r1-handoff-stabilization | #881 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-r1-outbound-payloads | codex/county-studio-r1-outbound-payloads | #887 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-r1-payload-audit | codex/county-studio-r1-payload-audit | #882 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-r1-saved-context | codex/county-studio-r1-saved-context | #884 | MERGED | clean | SAFE TO DELETE |
| codex-county-studio-r1-saved-view-payloads | codex/county-studio-r1-saved-view-payloads | #885 | MERGED | clean | SAFE TO DELETE |

### Needs review (PR OPEN or dirty or no PR):

| Worktree | Branch | PR | Status | Dirty? | Recommendation |
|----------|--------|----|--------|--------|----------------|
| evidence-publisher-manifest-policy | codex/evidence-publisher-manifest-policy | #840 | OPEN | clean | REVIEW — PR still open |
| june10-emergency-release-runbook | codex/june10-emergency-release-runbook | #873 | OPEN | clean | REVIEW — PR still open |
| june10-operational-calm-polish | codex/release-auth-smoke-timeout | #870 | OPEN | DIRTY | REVIEW — PR open + dirty |
| cuforge-case-state-persistence | codex/cuforge-case-state-persistence | #876 | OPEN | clean | REVIEW — PR still open |
| codex-release-node24 | codex/release-node24 | none | — | DIRTY | REVIEW — dirty, no PR |
| june10-production-readiness-audit-gate | codex/june10-production-readiness-audit-gate | none | — | clean | REVIEW — no PR |
| dais-queue-500-root-cause | codex/dais-queue-500-root-cause | none | — | DIRTY | REVIEW — dirty, no PR |
| production-provisioned-auth-db-backed | codex/production-provisioned-auth-db-backed | none | — | DIRTY | REVIEW — dirty, no PR, locked |
| compsforge-prometheus-comp-audit-v2 | codex/compsforge-prometheus-comp-audit-v2 | none | — | DIRTY | REVIEW — dirty, no PR |

### Small / no node_modules (low priority):

| Worktree | Branch | Notes |
|----------|--------|-------|
| codex-county-studio-context-stabilization | codex/county-studio-r1-context-stabilization | no-nm, clean, no PR |
| cuforge-case-desk | unknown | no-nm, clean |
| codex-county-studio-r1-dossier-saved-views | unknown | no-nm, clean |
| codex-county-studio-r1-packet-handoff-payloads | unknown | no-nm, clean |
| compsforge-prometheus-comp-audit | codex/compsforge-prometheus-comp-audit | no-nm, clean |

## 6. What Was NOT Deleted

- Source code (any)
- Git branches / stashes
- Database dumps / archives (`tf-backups`, `tf-db-archives`)
- Docker volumes (`tf_mssql_data`, `tf_mssql_data_pacs`, `pacs_baks`)
- PostgreSQL data directories
- Active worktrees (`tf-wo-data-002a-exec-p2`)
- Main checkout (quarantined `terrafusion_os_1.0`)
- Protected feature worktrees (`salt-lake-county-pack`, `intelligence-preview`, `compsforge-diagnosis`)
- Locked worktrees
- Tier 3 / Tier 4 worktrees (pending approval)
- Docker VHDX (not compacted)
- PACS data
- Evidence artifacts

## 7. Recommendations

### Next approval needed
1. ~~**Tier 3 "SAFE TO DELETE" list**~~ — DONE (all 16 deleted)
2. **Tier 3 "REVIEW" list** (9 worktrees with open PRs or dirty state) — close/abandon PRs first
3. **Docker VHDX compaction** — compact the 78 GB VHDX (could reclaim 10-30 GB)
4. **Tier 4 auth worktrees** — not yet inventoried

### Future prevention
4. Worktree rotation policy: auto-delete node_modules in worktrees > 7 days old
5. Cap concurrent worktrees at ~20

---

No seed/import/sync was run. No databases were mutated.
