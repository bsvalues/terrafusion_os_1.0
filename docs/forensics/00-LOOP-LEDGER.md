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

## Loop 3 — Cross-lane contradiction synthesis (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L3 |
| **trigger** | Owner direction: not broad auditing, not recovery — a cross-lane synthesis + consolidation |
| **/goal** | Join lanes to expose coupled contradictions; consolidate into a Red Flag Register; promote findings to hard rules |
| **method** | Synthesis over Loop 1+2 evidence + targeted runtime grounding (`AddDbContext` grep in `TerraFusion.API/Program.cs`) |
| **evidence captured** | `RED-FLAG-REGISTER.md` (6 buckets, severity-ranked), `CROSS-LANE-SYNTHESIS.md` (XJ-1…XJ-6), `DOCTRINE-HARD-RULES.md` (HR-1…HR-5), F15 two-truths split |
| **grounded new sub-findings** | Live API co-registers `TerraFusionDbContext` + `LevyDbContext` + a separately-named `TerraFusionContext` → dual `LevyCertification` is **co-loaded at runtime** (not archival); `AddDbContext<TerraFusionDbContext>` registered ~20+ times (registration sprawl); `TerraFusionContext` vs `TerraFusionDbContext` name ambiguity flagged |
| **primary hidden-system generators (elevated)** | (1) schema/persistence fracture, (2) false authority/false completion, (3) config topology fracture — with CI signal distortion amplifying branch/PR mis-judgement; ghost workspace authority sustained by ownership vacuum |
| **cleared** | Dependency truth (F12) — confirmed not a generator |
| **confidence change** | diagnosis precision ↑ sharply (coupled failures, not 6 independent); F14↔runtime now grounded high |
| **decision** | Stay in discovery/synthesis posture. Recovery lanes remain gated. Loop 4 = verification + quantification (below). |

### Carried-forward questions (Loop 4)
1. Is `TerraFusionContext` an alias of `TerraFusionDbContext` or a real second core context? (escalate if real)
2. Does the dual `LevyCertification` DbSet fault at runtime / map to the same physical table?
3. Quantify XJ-5: how many branches/PRs were CI-misjudged (replay `cancelled` vs `failure`)?
4. Lane 2 commit heatmap; Lane 3 PR-landing + CI-signal reclassification (Hard Rule 5).

## Loop 4 — Verification & quantification (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L4 |
| **trigger** | Owner approval: convert Loop-3 "suspected" → "classified" (5-item scope), still pre-recovery |
| **/goal** | Hard-classify the context ambiguity + dual LevyCertification; quantify CI distortion; critical-surface heatmap; runtime registration truth table |
| **method** | 1 deep persistence Explore agent + direct file reads (Program.cs:2477–2505) + git heatmap + observed PR #1080 CI sample |
| **evidence** | `LOOP4-VERIFICATION.md` (Items 1–5 + exit-gate eval) |
| **classified** | (1) `TerraFusionContext` = separate Identity context on same DB (naming hazard, not alias/wrapper/dual-core). (2) dual `LevyCertification` = **no physical collision; divergent-DB data-truth split** (LevyDbContext uses separate DB/`levy-dev.db`). (3) CI foot-gun: PR #1080 sample 4/4 Seal-Gate failures were foot-gun, 0 real. (4) critical-surface churn is on the legacy lineage, not main. (5) registration "sprawl" = benign conditional CLI branches. |
| **corrections** | Persistence agent's "physical table collision" was wrong (missed separate connection string); corrected by direct Program.cs read. |
| **confidence change** | suspected→classified on all five; no new disorder category appeared (findings refined/downgraded, not expanded) |
| **exit gate** | **All 5 Loop-4 exit conditions met; no new category** → bar to *consider* salvage planning is cleared. Recovery lock stays ACTIVE (owner decision). |
| **decision** | Hold recovery lock. Loop 5 residuals are small (CurrentUse reachability; cert/levy product question; optional population CI replay). Await owner go for R-lanes. |

## Loop 5 — Residual verification (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L5 |
| **trigger** | Owner chose (B): run Loop-4 residuals before any salvage |
| **/goal** | Close the 3 small residuals (CurrentUse reachability; enlarge CI sample; cert/levy escalation) |
| **method** | grep (CurrentUse wiring) + `pull_request_read get_check_runs` on 5 closed PRs |
| **evidence** | `LOOP5-VERIFICATION.md` |
| **resolved** | (1) CurrentUse IS live in API (`Program.cs:2519`) → live spine hosts **4 contexts / 3–4 DBs**. (2) CI: 5/5 sampled closed PRs are **green in final state** → closed-unmerged = recut workflow, not CI failure; foot-gun corrupts only **transient/per-commit** signals, not final PR state; each PR fires 55–69 checks. (3) cert/levy data-home = **owner product question**, escalated, not resolved. |
| **correction** | Refines Loop-4 Item-3: the foot-gun's damage is to *transient* signals; *final resolved* PR CI state is reliable. Branch-disposition risk is specifically for mid-flight/abandoned PRs. |
| **confidence change** | CI-distortion concern now precisely bounded; persistence truth complete. No new disorder category (3rd consecutive loop with none). |
| **decision** | Residuals closed. Recovery lock stays ACTIVE pending owner's release decision. Forensic phase is effectively saturated. |

## Loop 6 — (only if owner releases recovery lock → R-lanes)
