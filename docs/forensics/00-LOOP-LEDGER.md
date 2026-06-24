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

## Loop 2 — Expanded forensic lanes F11–F16 (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L2 |
| **trigger** | Playbook expanded with 6 new forensic lanes: Workspace/Code-Space, Dependency, Build/CI/Release, Data/Schema/Migration, Config/Env/Secrets, Ownership/False-Completion |
| **/goal** | Cover the six new inspection angles with cross-checked, file-path evidence |
| **method** | 6 parallel Explore subagents (one per lane), read-only |
| **evidence captured** | deliverables `F11-…` through `F16-…` |
| **confirmed** | F12 — dependency/package management is CLEAN (pnpm+NuGet, single lockfiles). F13 — Seal Gate "cancelled-as-failed" foot-gun, which independently explains the PR #1080 CI failures. |
| **NEW categories of disorder surfaced** | (1) F14 — **multiple conflicting DB migration lineages**; LevyCertification defined twice incompatibly, both registered as DbSet. (2) F15 — **committed JWT secret + plaintext DB password**; broken dev-compose port contract; config duplication. (3) F16 — recovery-spine surfaces (workbench/dais/registry) **UNOWNED**; ~412 completion docs vs ~2 evidence-backed; 50,000-agent fiction. (4) F11 — `.workspace-map.json` is a misleading ghost map (Windows root, non-existent dirs). |
| **confidence change** | high on all six lanes individually; BUT discovery breadth **regressed** — new disorder categories appeared, so overall convergence dropped. |
| **gate effect** | **Gate A provisional pass WITHDRAWN** (new categories still appearing). Gate B holds. Gate C unchanged. New criticals (F14/F15) raise Gate D/E bars. |
| **decision** | **Stay in discovery.** Run Loop 3: deepen Lanes 2 & 3, verify F14/F15 criticals at runtime, escalate F15 secrets to owner. Recovery lanes remain gated. |

### Carried-forward questions (Loop 3)
1. Does the LevyCertification dual-DbSet actually throw at runtime, or is one context never co-loaded?
2. Are the F15 secrets present in **current HEAD** (not just history)? Confirm + scope rotation.
3. Commit-content heatmap (Lane 2) for shell/workbench/Dais/registry across the legacy lineage.
4. Full closed-unmerged PR landing checks (Lane 3).
5. Owner rulings: native-shell intent; recovery-spine stewardship (F16); secret rotation (F15).

## Loop 3 — (not yet run)
