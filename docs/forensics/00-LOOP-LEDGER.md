# Loop Ledger

*Operational memory of the forensic recovery. One entry per major pass.*

---

## Loop 1 — Discovery breadth

| Field | Value |
|---|---|
| **loop_id** | L1 |
| **date** | 2026-06-24 |
| **lanes touched** | 1, 3, 4, 5, 6, 7, 8, 9, 10 (2 partial) |
| **immediate /goal** | Establish broad, cross-checked evidence base across all forensic lanes before any recovery action |
| **methods** | `git ls-remote/for-each-ref/rev-list/merge-base/left-right`; GitHub MCP `list_branches` (8 pages) + `list_pull_requests`; 3 parallel Explore subagents (duplication; canon+runtime; residue+drift) |
| **evidence captured** | `evidence/branch-roots.txt`, `evidence/branch-divergence-vs-main.txt`, `evidence/lineage-family-breakdown.txt`; deliverables 01–10 |
| **what it confirmed** | Live spine is real (Kernel/Gateway/frontend/Muse); honesty debt (1,008 agents, FISMA gaps, audit interceptor missing) — matches repo's own honest docs |
| **what it invalidated** | The framing "branch sprawl = hygiene problem" — it is actually **history fragmentation across 3 disjoint roots**. The "582 huge branches" reading is a measurement artifact of disjoint histories, not 582 megabranches. GitHub `merged` flag is invalid as a disposition signal here. |
| **hidden systems/risks surfaced** | 3 git roots (580/89/73 branches); 2.3 GB ghost graveyard with near-complete replicas; recut-PR culture; dual `/explain`; date anomalies |
| **confidence change** | low → **high** on structure/runtime/duplication; medium on PR history & commit-content (Lanes 2/3 still shallow) |
| **decision** | **Stay in discovery.** Hold recovery lock. Advance to Loop 2 to deepen Lanes 2 & 3, then re-test Gates C/D. Recovery lanes 11–14 remain gated. |

### Carried-forward questions
1. Where does buried value concentrate on the legacy lineage (per-surface commit heatmap)?
2. For each salvage-relevant PR: did it actually land in `main` (content diff, not merge flag)?
3. Is `native-shell/` a retired experiment or an intended parallel target? (owner ruling)
4. Are the 2025-12 session-log / SEALED.md dates real or skew?
5. Which of the `r2/w*-real-*` and `feat/sync-*` recut variants is authoritative?

---

## Loop 1.1 — Playbook schema-addendum compliance (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L1.1 |
| **trigger** | Playbook updated: lineage_class + mergeability_class made required first-order branch fields; Lane 1 & Lane 11 & Gate C tightened; Branch Census Schema Addendum added |
| **/goal** | Make the census conform to the new mandatory schema before any disposition |
| **action** | Generated per-branch dataset `evidence/branch-census.csv` (741 branches) with all six required fields; encoded the PORT-ONLY default rule for unrelated histories |
| **result** | lineage_class: MAIN-CURRENT 88 / LEGACY 580 / THIRD-ROOT 73. mergeability_class: PORT-ONLY 653 / MERGE-CANDIDATE 80 / CONTAINED 8 |
| **correction** | CONTAINED is **8**, not the earlier "15" (which was a `--left-right` artifact including disjoint branches). CSV supersedes. |
| **gate effect** | Gate C's new lineage+mergeability prerequisite is now satisfied; value/feasibility scoring still pending for full Gate C. |
| **decision** | Unchanged: stay in discovery; recovery lanes remain gated. |

## Loop 2 — (not yet run)
Planned objectives in `GATES-STATUS.md` → "Loop 2 entry objectives".
