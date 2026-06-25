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

## Loop 6 — F17 AI Reality Audit + R11 decision lane (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L6 |
| **trigger** | Playbook added F17 (AI Reality Audit) + explicit R11 (decision lane) |
| **/goal** | Reality-classify every AI surface; stand up the R11 branch-disposition decision register |
| **method** | F17 Explore agent (claim-vs-runtime, REAL/LATENT/MOCKED/FICTION) + census-driven R11 inputs (owner-sensitive 87, AI-touched 132, overlap families, mergeability) |
| **evidence** | `F17-AI-REALITY-AUDIT.md`, `R11-BRANCH-DISPOSITION.md` |
| **F17 result** | AI estate **mostly MOCKED/FICTION** (~20 of ~28); thin **REAL** (AICommand/AIEngine/AzureOpenAI) + **LATENT** (Muse/Pilot/GPT) spine. "1,008"/"50,000" agent constants now only in QUARANTINE artifacts, not live code. Several FICTION UI surfaces **honestly disclose** non-function (good faith). |
| **R11 result** | Decision register at class/family level: CONTAINED 8→ignore, MERGE-CANDIDATE 80→needle pool, PORT-ONLY 653→archaeology. Fences encoded; fence #3 (AI) resolved by F17. Outputs: disposition register, owner-sensitive list (87), AI-dependency list (132 resolved), overlap groups (5), archaeology-only list (653). **Needle list DEFERRED** (Gate C full + lock release). |
| **lock status** | R11 is decide-not-execute → produced under lock (documentation only). R12–R14 execution remains gated. |
| **confidence change** | AI ambiguity → classified; branch-disposition framework now populated and fenced. No new disorder category (4th consecutive loop). |
| **decision** | Hold recovery lock. Final needles + R12 salvage await Gate C FULL + explicit owner lock-release. |

## Loop 7 — F18 Latent Value audit + value-axis reframe (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L7 |
| **trigger** | Owner challenge: bad marketing / MOCKED-runtime ≠ no value; demand a claim-stripped substance audit on a 5-tier taxonomy |
| **/goal** | Assess the axis F17 missed — latent engineering value, independent of runtime status & naming |
| **method** | F18 Explore agent: read implementation depth (LOC, algorithms, data models), real test/run evidence, gated-vs-empty; classify on owner's 5 tiers + claim-stripped residue |
| **evidence** | `F18-LATENT-VALUE-AUDIT.md` |
| **result** | **~30–40% genuinely good** (Sync/PACS ETL ~1,712 LOC, Levy RCW math ~97 LOC, IAAO compliance "stub", gated mesh orchestrator, ArcGIS scheduler) — Tier 1–2. **~40–50% hype theater** (CostForge `UltimateCostForgeAI.cs` 820 LOC of `Task.Delay`, million-agent/quantum) — Tier 5. **~10–20% real process** (phase4d provenance manifests — NOT test/benchmark proof) — Tier 3. |
| **corrections** | (a) Corrects F17 value-blindness: ComplianceServiceStub + Consciousness mesh are tier-2 real value, not worthless. (b) Refines owner's "test results" hypothesis: manifests are real *process record*, not empirical proof. (c) Rewrites R11 fence #3 to key on **value tier, not runtime status** — only Tier 5 defaults to archaeology. |
| **doctrine** | Added **HR-6** (reclassify by evidence not vibe; value ≠ runtime ≠ naming; avoid both failure modes — believing claims AND discarding good work for bad packaging). |
| **confidence change** | value axis now assessed; salvage targeting materially sharper. No new disorder category. |
| **decision** | Hold recovery lock. The Tier-1/2 surfaces (Sync, Levy, compliance, mesh) are the real salvage spine; CostForge "Ultimate" is the real cut. R12 execution still awaits owner lock-release. |

## Loop 7.1 — Value-tier salvage map (2026-06-24)

| Field | Value |
|---|---|
| **trigger** | Owner: build the value-tier salvage map (Tier 1–2 surfaces → which branches carry their best versions) |
| **method** | census-driven surface→branch mapping (`evidence/value-tier-surface-map.txt`) + F18 tiers + lineage/mergeability fences |
| **evidence** | `R11-VALUE-TIER-SALVAGE-MAP.md`, `evidence/value-tier-surface-map.txt` |
| **key pattern** | Deepest value (Tier-1 Sync/Levy/forge-stats) is **PORT-ONLY on the dead legacy lineage**; the honest LATENT AI spine (LocalOps/Muse/Pilot, `wo-localops-000…008`) is **MAIN-CURRENT / mergeable**. Recovery method splits accordingly. |
| **critical dependency** | A **schema-reconciliation gate** (F14/HR-2) blocks all Tier-1 domain ports (Sync/Levy/forge) — they sit on the fractured multi-context/multi-DB layer; porting first would re-bury the value. |
| **recommended sequence** | (1) LocalOps/Muse/Pilot stack [merge, lowest risk], (2) Atlas/ArcGIS mergeable heads incl. open PR #1073, (3) AI-honesty merges, (4) ⛔ schema reconciliation gate, (5) Sync port, (6) Levy port, (7) forge-stats port, (8) cut CostForge "Ultimate". |
| **status** | Map = decision artifact (under lock). R12 execution gated on owner lock-release. |

## Loop 8 — Per-branch scoring → Gate C FULL (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L8 |
| **trigger** | Owner: finish the decision layer — complete per-branch scoring, take Gate C to FULL, do NOT release the lock yet |
| **/goal** | Score the needle pool (U/F/O), assign final dispositions, nominate ordered needle set |
| **method** | Extract 80 MERGE-CANDIDATE branches → group into ~12 initiatives; score on evidence-anchored rubric (lineage+mergeability+F18 tier+PR-landing+fences) |
| **evidence** | `R11-GATE-C-SCORING.md` |
| **result** | Needle set scored, fenced, ordered. Nominated order: N1 LocalOps/Muse/Pilot → N2 canon/governance → N3 Atlas/ArcGIS → N4 AI-honesty → N5/N6 workbench+county → ⛔schema gate → sync/levy/forge ports → cut CostForge. Several "MERGE-CANDIDATE" initiatives (ops-cp, sync-atomicity, county-studio) likely **already landed via recut** → verify-landed, not re-salvage. `currentuse-sqlite-provider-fix` is CONTAINED (F14 fix may already be in main). 58 snyk-* → ignore. |
| **Gate C** | **FULL (decision layer).** Explicit residual by design: per-needle commit/landing verification = R12-entry step. |
| **lock status** | Held. R12 execution gated on explicit owner release. Decision layer is now complete. |
| **decision** | Stop at the decision layer per owner. When released, R12 begins with N1 (LocalOps/Muse/Pilot), reassess before N3, deep-engine ports last (post schema gate). |

## Loop 9 — Repo-topology reframe + Recovery-to-Repo Topology Matrix (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L9 |
| **trigger** | Owner decision: split into a new repo topology (TerraFusionOS core / TerraFusion-Sync platform / Dais·Atlas·Forge·Dossier suites). Recovery = recover right assets into right future homes. |
| **/goal** | Phase A — classify every surface/needle for its future repo home; separate salvage from migration |
| **method** | Map F18 value-tier surfaces + the scored needle set → target repos; define phased recovery |
| **evidence** | `RECOVERY-TOPOLOGY-MATRIX.md` |
| **result** | `future_repo_target` added as a first-order recovery field (R11 schema). Homes assigned: N1 Pilot→core(+undecided deep AI); N2 canon→core; Sync ETL→TerraFusion-Sync; Levy→**TerraFusion-Dais** (not platform); forge-stats→TerraFusion-Forge; Atlas split (UI→Atlas, feed→Sync); workbench split (host→core, domain→suite); CostForge "Ultimate"→legacy-only(cut). Phases B(core)→C(Sync)→D(suites). |
| **doctrine** | Added **HR-7** (recover into future topology not old repo; salvage ≠ migration; don't pull wrapper noise forward; topology-aware phased recovery; beware premature split). |
| **risk shift** | ↓ structural-confusion risk (won't recreate the blur in N repos); ↑ premature-split risk → mitigation: decide homes now, extract in phases, migrate only after core spine proven + repos exist. |
| **lock status** | Held. Migration is a NEW operation gated on target repos existing + Phase B done. |
| **decision** | Classification (Phase A) complete. R12 salvage + migration await owner lock-release; first move stays N1 into TerraFusionOS core. |

## Loop 9.1 — Topology matrix v2 (executable) (2026-06-24)

| Field | Value |
|---|---|
| **trigger** | Owner approved the topology map + gave refinements: add shared-contracts bucket; hard rules for Workbench/Atlas/Pilot; anti-duplication ownership; executable column set |
| **evidence** | `RECOVERY-TOPOLOGY-MATRIX.md` (v2) |
| **changes** | Added **core:shared-contracts** home. Rewrote matrix to 9 executable columns (surface · source location · lineage · method · future home · contract owner · schema owner · phase · cut/defer/port/merge). Added anti-duplication ownership table (runtime/contracts/persistence/ingestion/UI-host/tests per split surface). Extraction order set: P1 core → P2 Sync → P3 suites (Atlas→Dais→Forge→Dossier) → P4 AI internals. |
| **doctrine** | Added **HR-8** (split ≠ duplicate; shared-contracts is a real home; R-WB / R-ATLAS / R-PILOT / R-SPLIT). New R11 fields: future_home_confidence, cross_repo_contract_needed, extract_now_or_later. |
| **key tightenings** | Workbench is never a domain repo; Atlas UI vs ingestion seam; Pilot stays in core until earned; every split surface needs all 6 ownership cells filled or it does not split. |
| **status** | Matrix now executable, not conceptual. No extraction/repo creation. Migration gated on lock-release + repos existing. |

## Loop 10 — Phase-1 core-spine founding plan (definition) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L10 |
| **trigger** | Owner: draft the Phase-1 core-spine founding plan now; do not hold; do not start extraction |
| **/goal** | Define TerraFusionOS core + shared-contracts as a thin governed center (what it is/owns/never-owns + contracts future repos obey) |
| **evidence** | `founding/` — TERRAFUSIONOS-FOUNDING-PLAN, CORE-CONTENTS-MATRIX, SHARED-CONTRACTS-MATRIX, OWNERSHIP-CELLS, NON-OWNERSHIP-RULES, EXTRACTION-PREREQUISITES |
| **result** | Core includes: shell/windowing, top-bar/dock, workbench **host**, Pilot/Trace/Canon shell surfaces, registry/runtime composition, governance/canon tooling, **shared-contracts**, core config standards. Core excludes all suite/platform domain + ingestion + deep AI. 7 shared contracts defined (workbench-tab, suite→core, sync→suite payload, cross-repo DTO/event, auth/session, registry, county-isolation). Ownership cells filled (incl. split surfaces). 8 non-ownership rules. Per-repo extraction prerequisites set. |
| **owner clarifications applied** | shared-contracts explicit under core; Pilot split stays undecided; County Hub = Sync consumer (not core, unless shell-only routing); Levy stays Dais-bound. |
| **status** | Founding **definition** only. No extraction, no repo creation, no home/owner reassignment (matrix v2 stands). |
| **decision** | Phase-1 defined. Extraction/migration begins only on owner lock-release + target repos created + per-repo prerequisites met (`EXTRACTION-PREREQUISITES.md`). |

## Loop 11 — Ratification pass (no-code gate) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L11 |
| **trigger** | Owner: start Ratification now, not recovery; do not release the lock; do not start R12 |
| **/goal** | Formally ratify the topology + founding plan (the FECF no-code gate before any recovery/migration) |
| **method** | Re-check each of 4 items for contradiction vs forensic record, then stamp with conditions |
| **evidence** | `RATIFICATION-RECORD.md` |
| **result** | All 4 RATIFIED-WITH-CONDITIONS: (1) core contents [cond: registry convergence, explicit shared-contracts, Pilot shell-only]; (2) hard boundaries [R-WB/R-ATLAS enforced, CostForge cut]; (3) ownership cells [Levy/Dais persistence provisional until F14 resolved; Pilot deep cell deferred=undecided]; (4) needle order [N1→N2→reassess→N3; deep ports behind schema gate]. |
| **doctrine** | Added **HR-9** (Ratification = mandatory no-code gate; lifecycle Discover→Classify→Ratify→Recover→Migrate; lock-release scoped to one ratified needle). |
| **authorizes** | ONLY a future narrow lock-release for **R12-N1** (LocalOps/Muse/Pilot → core) with entry checks (not-landed / content-vs-main / no schema-config spillover / owner-sensitive fenced). |
| **does NOT authorize** | general unlock · R12 beyond N1 · extraction now · repo creation · deep ports · Pilot deep internals. |
| **lock status** | ACTIVE — unchanged by ratification. |
| **decision** | Topology/founding **accepted**. Next step (on explicit owner go): narrow R12-N1 release only. |

## Loop 12 — R12-N1 narrow release → entry checks → ALREADY-LANDED (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L12 |
| **trigger** | Owner: release recovery lock narrowly for R12-N1 only (LocalOps/Muse/Pilot → core), run entry checks first |
| **method** | Read-only entry checks on `wo-localops-008` stack: divergence, 2-dot content diff vs main, spillover, fence, branch-only files |
| **evidence** | `R12-N1-ENTRY-CHECK.md` |
| **result** | **N1 is ALREADY LANDED in main, and main is MORE evolved** (main local-agent 113 files vs branch 107; main has localOpsEngine/localOpsTraceBridge the branch lacks; branch-only = 62 stale e2e tests main already removed). Merging would REGRESS main. |
| **disposition change** | N1: salvage-now → **IGNORE (already-landed)**. No code moved. |
| **process win** | Entry-check discipline prevented a regression on execution move #1 — vindicates recut-aware rule + Ratification (HR-9) + "merged-flag-unreliable". |
| **implication** | MERGE-CANDIDATE needles (N2/N3/N5/N6) are likely also already-landed via recut → run content-presence check on each before any release. Real salvage likely concentrates in PORT-ONLY legacy engines (behind schema gate). |
| **lock status** | Narrow N1 release **consumed**; recovery lock **returns to FULL ACTIVE**. No general unlock. |
| **decision** | Reassess before N2 (per ratified order). Recommend batch content-presence entry check on the MERGE-CANDIDATE pool next. |

## Loop 13 — Batch already-landed check N2/N3/N5/N6 (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L13 |
| **trigger** | Owner: run read-only batch already-landed check across N2/N3/N5/N6; no lock release; no code |
| **method** | content-presence per representative branch (ahead/behind + 2-dot tree delta + branch-only files) |
| **evidence** | `R12-BATCH-LANDED-CHECK.md` |
| **result** | Mergeable pool collapses: **N2 (all), N5a/b, N6 = already-landed (ignore)** via recut (PR #932/#1074/#1075). **N3a atlas-maplibre = open PR #1073 = the ONE genuine actionable mergeable item.** N3b atlas-suite = partially-landed (cherry-pick subset). **N5c auth-gate = HAZARD (+1.86M insertions, 622 branch-only) → never merge, port-only/archaeology, owner-sensitive.** |
| **pattern** | recent-base (behind 3–9, PR marker) = landed; old-base (behind 147–189) = main's later deletions dominate + same 62 stale e2e files = noise. |
| **strategic** | merge-candidate pool ≠ real salvage pool. Near-term mergeable work ≈ just PR #1073. Genuine value concentrates in PORT-ONLY legacy Tier-1 engines behind the F14 schema gate (file/hunk port only). |
| **lock status** | FULL ACTIVE — no release, no code. |
| **decision** | Either resolve PR #1073 (own narrow release) OR pivot to a decision-layer **F14 schema-reconciliation plan** (the true critical path blocking Sync/Levy/Forge). |

## Loop 13.1 — Full-membership re-check (CORRECTS Loop 13 collapse) (2026-06-24)

| Field | Value |
|---|---|
| **trigger** | Owner re-issued the batch directive (rigor) → re-ran across FULL initiative membership, not representatives |
| **evidence** | `R12-BATCH-LANDED-CHECK-v2.md` (supersedes v1 collapse) |
| **correction** | Loop 13's "pool mostly already-landed" was **premature collapse** (under-sampled). Characterized the noise floor: `residual ≤ 9` = shared deletion-residue (8 PerformanceTest*.cs + CostForgeAIController.test.cs) = already-landed; `residual >> 9` = genuine unlanded value. |
| **genuine residual found** | county-studio forge/pilot harnesses (`os-platform/core/pilot/county-studio-*.mjs`) + `AtlasLiveGeometryController.cs` (cherry-pickable, behind 150); deep atlas/gis (`r2/w*-atlas-gis`, port-only); workbench host-contract branches (331–335 residual, verify depth); auth-gate hazard (569). |
| **corrected dispositions** | N2 canon = already-landed ✓; N3a #1073 = live merge; N3/N6 county-studio geometry + forge/pilot harnesses = **cherry-pick residual**; deep atlas/gis = port→Atlas; workbench host-contract = verify→core; auth-gate = port-only/hazard. |
| **doctrine note** | HR-6 / "no premature collapse" caught in the act — the re-run prevented discarding real work. v1 retained (two-truths), v2 authoritative. |
| **lock status** | FULL ACTIVE — no release, no code. |
| **decision** | Real near-term value is larger than v1 implied: a genuine cherry-pick pool (county-studio harnesses + atlas geometry) on current lineage, plus PORT-ONLY Tier-1 behind F14 gate. |

## Loop 14 — F14 schema-reconciliation plan (decision-only) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L14 |
| **trigger** | Owner: do (2) first — decision-only F14 schema-reconciliation plan (the real critical path); park #1073 |
| **/goal** | Turn the F14 fracture into a ratifiable decision object that can later unblock Sync/Dais·Levy/Forge ports |
| **method** | Ground the 4 contexts + cross-context entity collisions; frame SSOT options + blast radius + gate criteria. No code. |
| **evidence** | `F14-SCHEMA-RECONCILIATION-PLAN.md` |
| **new finding** | **THREE** cross-context collisions (not 1): `LevyCertification`, `LevyRate`, `LevyScenario` — all defined in both Core/Entities and Levy/Models. Migration depth: Data 103 / Levy 4 / CurrentUse 1. |
| **produced** | (1) context truth table (4 contexts, DB targets, homes); (2) entity collision register (3 entities, data-truth-split, no physical collision); (3) 4 SSOT options per domain (keep-split / consolidate→Dais / projection / deprecate) — not chosen; (4) blast-radius matrix; (5) 5 gate criteria that must hold before any Tier-1 port. |
| **gate** | Tier-1 ports BLOCKED until: schema authority chosen, context ownership clarified, entity collisions reconciled, migration plan declared, cross-repo contracts defined (HR-2). |
| **lock status** | FULL ACTIVE — no path chosen, no code, no release. |
| **decision** | F14 is now ratifiable. Next: Ratify the SSOT path (owner picks), OR resolve parked #1073 as the near-term win. |

## Loop 14.1 — F14 collision register hardened to field level (2026-06-24)

| Field | Value |
|---|---|
| **trigger** | F14 directive re-issued (rigor) → hardened the one soft spot: per-entity field-level collision detail |
| **evidence** | `F14-ENTITY-COLLISION-DETAIL.md` |
| **confirmed** | 3 genuine Core↔Levy collisions (LevyCertification/LevyRate/LevyScenario) re-derived via `comm`. Loop-14 count holds (LevyRate/Scenario live in Core's combined `Entities/Levy/LevyEntities.cs`). |
| **field facts** | All 3 share one signature: Core = `int`-PK lightweight summary; Levy = `Guid`-PK rich system-of-record (attestation envelope/hash, references, AI/QuantumOptimized fields) + separate DB. Core also holds a whole legacy levy sub-domain (TaxDistrict/TaxCode/ComplianceCheck/LevyAuditRecord…). |
| **decision impact** | Incompatible PKs + attestation gap make SSOT options **D (deprecate Core levy)** or **C (Core = read projection)** the evidence-supported front-runners; "keep-split by design" (A) disfavored. Levy module = system-of-record → TerraFusion-Dais. Still owner's call. |
| **lock status** | FULL ACTIVE — no code, no release. |
| **decision** | F14 now fully ratification-ready on concrete schema facts. Next: ratify SSOT path, or resolve parked #1073. |

## Loop 15 — F14 SSOT ratification (no-code gate) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L15 |
| **trigger** | Owner: ratify the F14 SSOT path first (lean D/C); Levy module = SoR; home = Dais |
| **evidence** | `F14-SSOT-RATIFICATION.md` |
| **ratified** | **Levy module = authoritative system-of-record** (Guid-PK, attested, separate DB) → **TerraFusion-Dais**. Core `Entities/Levy/*` (3 collisions + legacy subdomain) **demoted to legacy**. Final form = **C (Core read-projection) or D (deprecate Core levy)**, bound to one execution test: does any retained core/main-DB consumer need to READ levy data? Rejected: A (keep-split) + dual-write. Also ratified: rename `TerraFusionContext`→Identity context; CurrentUse stays Forge + apply provider fix. |
| **gate effect** | F14 gate **3/5**: criteria 1–3 (schema authority / context ownership / entity reconciliation-direction) MET; **4 (migration plan)** + **5 (cross-repo contracts)** OPEN. Tier-1 ports STILL BLOCKED. |
| **lock status** | FULL ACTIVE — no code, no migration, no release (HR-9). |
| **decision** | Direction set decisively. Next decision-layer artifacts: F14 migration plan (criterion 4) + levy/sync cross-repo contracts (criterion 5). #1073 still the parked near-term merge. |

## Loop 16 — F14 criteria 4 + 5 drafted (gate fully drafted) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L16 |
| **trigger** | Owner: do both, criterion 4 (migration plan) first, then criterion 5 (contracts); no #1073 yet |
| **evidence** | `F14-MIGRATION-PLAN.md`, `F14-CROSSREPO-CONTRACTS.md` |
| **criterion-4 finding** | Core (main-DB) `LevyCertifications` has a LARGE retained-read surface (~12 controllers + NoticeService/CertificationService + PACS seeders); live cert writes currently hit the LEGACY store. ⇒ retained-read set NON-EMPTY ⇒ **leans Option C (read projection), not D**. Map covers: data migration (int→Guid, Guid→string CountyId, lossy-reverse), frozen 103/4 lineages, projection refresh (event-driven), no-dual-write/no-shadow-schema, cutover checkpoints, rollback (C-then-maybe-D, never D-first), open risks. |
| **criterion-5 finding** | 5 core-owned contracts: Sync→Dais levy-input payload, Levy projection contract (if C), levy domain events, cert read DTO, county-context. Rules: core owns, no dual-write, no shadow schema, versioned, string CountyId canonical. |
| **gate status** | F14 **5/5 DRAFTED** but NOT OPEN — owner must ratify (a) C vs D and (b) the migration map + contract set. |
| **lock status** | FULL ACTIVE — no code, no migration, no release. |
| **decision** | Gate fully drafted. Reassess: ratify C/D to OPEN the gate (then Tier-1 ports unblock), or take parked #1073. |

## Loop 17 — F14 gate ratified OPEN (Option C) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L17 |
| **trigger** | Owner: ratify C + migration map + contract set now; no #1073 yet |
| **evidence** | `F14-GATE-RATIFICATION.md` |
| **ratified** | **Option C** (Core = read-only projection; `TerraFusion.Levy` = SoR → Dais; no dual-write, no shadow schema, projection/event refresh only). D rejected for now (large retained-read surface). Criterion-4 map + criterion-5 contracts ratified. |
| **gate** | **F14 GATE OPEN — 5/5.** HR-2 schema-decision blocker cleared. Tier-1 ports (Sync/Dais·Levy/Forge) unblocked **to PLAN** (execution still lock-gated). |
| **lock status** | FULL ACTIVE — no code, no migration, no projection build, no release. |
| **authorizes** | drafting the first **Tier-1 port execution plan** (decision-layer) — NOT execution. Tier-1 port execution = future narrow, individually-ratified release (like R12-N1). |
| **decision** | Schema decision layer COMPLETE. Reassess: (a) draft Tier-1 port execution plan, or (b) parked PR #1073. |

## Loop 18 — first Tier-1 port execution plan drafted (decision-only) (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L18 |
| **trigger** | Owner: draft the first Tier-1 port execution plan now, decision-only, in **Sync → Dais/Levy → Forge** order; not #1073, not a lock release, not code movement |
| **evidence** | `TIER1-PORT-PLAN.md` + read-only grounding check on named source heads |
| **grounding finding** | Sync legacy heads (`sync-complete-2-v3`, `sync-doctrine-4-v9`, `sync-pop-4c/4d`, `attr-pop-1/2`) have **true-residual = 0** → port method is **hunk-level** (diffs to files already in main's sync engine), NOT file-add. `codex/sync-db-evidence-runtime-path` (ahead 17, **8 genuine new files**) = **cherry-pickable bridge**. Levy/Forge `r2/*` heads uniformly show **true-residual ≈ 42** → almost certainly a **shared deletion-residue floor** (like the 9-file/62-e2e floors) → MUST be characterized & subtracted before trusting residual (HR-6, v1→v2 lesson). |
| **plan shape** | Per-domain: target repo · source heads · port method · entry checks · owner-sensitive fences · schema/config deps · cross-repo contracts touched · cut line (now/later) · rollback/abort · proof-of-success-of-the-plan. Cross-cutting entry check = characterize r2-42 floor + one-head-per-recut + content-presence. **CostForge "Ultimate" CUT** (F18 Tier-5 theater) — do not port. |
| **sequencing** | Sync first (platform ingress; contract must land before suites can be fed) → Dais/Levy second (ratified Option-C SoR; needs Sync feed + F14 migration) → Forge third (consumes both). |
| **gate status** | F14 gate OPEN (5/5). Tier-1 ports unblocked **to plan** only — plan now exists. |
| **lock status** | FULL ACTIVE — no code, no merge, no cherry-pick, no repo creation, no release (HR-9). |
| **decision** | Tier-1 plan is decision-ready, convertible into per-domain narrow-release work orders. Reassess: (a) prepare first narrow release = **Sync entry-checks** (read-only hunk inventory, still no merge), or (b) take parked **PR #1073** as a contained near-term win. Hold for owner direction. |

## Loop 19 — Sync entry-check (read-only) → legacy Sync heads SUPERSEDED (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L19 |
| **trigger** | Owner: proceed with (a) — prepare the read-only Sync entry-checks now (no lock release, no port) |
| **evidence** | `SYNC-ENTRY-CHECK.md` + `git diff/rev-list` on all 7 named heads vs `origin/main` @ `2ae013561` |
| **floor characterized** | the **62-file ADDED branch-only floor is 100% e2e/test** (61 os-platform e2e + 1 costforge-ai), uniform across all heads → **true-residual of new source = 0** (plan's claim holds). |
| **headline finding** | **All 6 legacy Sync heads are SUPERSEDED.** `main`'s sync engine is a near-strict **superset**: main ahead by **393–5,360 lines**; branch-only ≤ **41 lines**, and those are *older* variants (e.g. hardcoded `ValidSaleCode="100"` vs main's `CountyRatioCodebook`/`IRatioQualificationPolicy`). Wholesale port = **regression**. Only ~2 defensive-guard fragments + 1 doc-comment are even improvement *candidates* (low value, verify-vs-main). |
| **bridge reclassified** | `codex/sync-db-evidence-runtime-path` (ahead 17 / behind 150; +6,991/−265; 20 new files) touches **zero backend sync engine** — it is **Pilot-evidence + Forge County-Studio**. Misleading name. ⇒ **reclassify Sync→Forge/Pilot**, not a Sync release. |
| **verdict** | **No clean Sync-domain first-release candidate exists among these heads.** Sync ingress already landed in main via recut + 150-commit evolution. Content-presence beat branch status again (same pattern as v2 batch-landed check). |
| **lock status** | FULL ACTIVE — read-only entry-check only; no code, no merge, no cherry-pick, no release (HR-9). |
| **decision (for owner)** | (1) Close the Sync legacy-port lane as *superseded-by-main*; (2) reclassify the codex bridge → Forge/Pilot in `TIER1-PORT-PLAN.md`; (3) advance the real critical path to **Dais/Levy** — run the same entry-check on the `r2/*` Levy heads (characterize the suspected ~42 floor first), where the ratified Option-C SoR value genuinely is not-yet-landed. |

## Loop 20 — Sync recs ratified + Dais/Levy entry-check → also SUPERSEDED (2026-06-24)

| Field | Value |
|---|---|
| **loop_id** | L20 |
| **trigger** | Owner: ratify all 3 Sync recommendations; then run the read-only Dais/Levy entry-check (Option-C-aware) |
| **ratified (Sync)** | (1) **Sync legacy-port lane CLOSED** as superseded-by-main; (2) `codex/sync-db-evidence-runtime-path` **reclassified Sync→Forge/Pilot**; (3) critical path advanced to Dais/Levy. Recorded in `TIER1-PORT-PLAN.md` §1 banner + headers. |
| **evidence** | `DAIS-LEVY-ENTRY-CHECK.md` + `git diff/show` on 5 Levy/Dais heads vs `origin/main` @ `2ae013561` |
| **smoking gun** | main's `LevyDbContext.cs` header: *"previously named LevyDbContextStub.cs … **de-stubbed 2026-04-18** … real, migrated, DI-registered."* The `r2/*` heads still carry the **old `LevyDbContextStub.cs`** → branches are the older ancestors. |
| **finding** | **All 5 Levy/Dais heads SUPERSEDED.** Main ahead: Levy module **+4,371 lines** (real migrations), dais/permits **+106,173 lines** (437 files). Branch-only Levy residual (226 lines) = old stub + stale migration-snapshot fragments. Floor (104 ADDED) = 90 test + old stub + CostForge "Ultimate" theater (CUT) + 3 `.tar.gz` binary residue → **0 genuine new source**. |
| **Option-C check** | **Clean** — Core-levy branch-only = **0** (no re-arming of Core authority); but **no SoR value** to gain either. `LevyDbContextStub.cs` added to a **port-fence** (porting would re-stub the SoR). |
| **cross-domain pattern** | **TWICE confirmed** (Sync + Dais/Levy, plus N1 + v2 batch): main already holds the evolved Tier-1 work; branch sprawl is recut *ancestry*, not pending value. Tier-1 recovery is collapsing toward "**main is the spine → topology-split / Migrate**", not "port from branches." |
| **lock status** | FULL ACTIVE — read-only; no code, no merge, no cherry-pick, no release (HR-9). |
| **decision (for owner)** | (1) Close the Dais/Levy legacy-port lane as superseded; (2) fence `LevyDbContextStub.cs`; (3) run the **Forge entry-check** (last Tier-1 domain) — if the pattern holds a third time, Tier-1 recovery collapses into Migrate (topology split on main), with branch salvage reserved for narrow proven fragments only. |

## Loop 21 — Forge entry-check → SUPERSEDED; Tier-1 port-recovery CLOSED (2026-06-25)

| Field | Value |
|---|---|
| **loop_id** | L21 |
| **trigger** | Owner: run the Forge entry-check (last Tier-1 domain); separate real stats/IAAO/income substance from CostForge theater |
| **evidence** | `FORGE-ENTRY-CHECK.md` + `git diff/ls-tree` on 5 Forge heads vs `origin/main` @ `2ae013561` |
| **substance check** | **Real stats engines ALL in main**: `OlsSolver`, `MultipleRegressionEngine`, `GwrModel`, `QuantileRegressionModel`, `SpatialRegressionModel`, `SpatialAutocorrelation`, `BayesianAnalysis`, `MonteCarloSimulation`, `IncomeApproach`, `IAAOValidationRules`, `ForgeStatisticsService`. **Smoking gun:** main already contains `R2Wave26OlsRegressionTests`/`R2Wave27BayesianMonteCarloTests`/`R2Wave28SpatialAutocorrelationTests` → wave work recut into main *with tests*. Wave head adds **0** stats files main lacks. |
| **theater/hazard** | branch-only forge residual (~112 lines) = CostForge "Ultimate": `EstimatedValue=425000m //Placeholder`, "Quantum-enhanced", "Government. Transcended.", **reintroduced Tyler lore** (`// TODO: Add Tyler Technologies`), `SquareFootage=0/YearBuilt=1900`. Porting = regression vs valuation honesty + C48-HYGIENE. **CUT + FENCE.** |
| **shared floor closed** | the suspected r2 floor is the **uniform 104-file ADDED floor** (90 test + 14 noise: old `LevyDbContextStub.cs`, CostForge theater ×7, `*.tar.gz` ×3, config, ShellHome) shared across ALL r2 heads → 0 genuine new source. |
| **finding** | **Forge SUPERSEDED-BY-MAIN — third confirmation.** forge/stats subset: main ahead **+127K–129K lines**; branch-only is theater only. |
| **STRATEGIC** | **All 3 Tier-1 lanes (Sync, Dais/Levy, Forge) superseded.** Tier-1 **port-recovery is CLOSED**. The legacy/r2 estate is **recut ancestry, not pending value**. Program pivots **Recover → Migrate**: split the evolved `main` spine into the topology (`RECOVERY-TOPOLOGY-MATRIX.md`); `IForgeStatisticsService` = core shared-contract at split. Branch salvage reduced to a few proven micro-fragments (e.g. ≤2 Sync defensive guards), catalogued not laned. |
| **lock status** | FULL ACTIVE — read-only; no code, no merge, no cherry-pick, no release (HR-9). |
| **decision (for owner)** | (1) Close the Forge port lane; (2) CUT+FENCE CostForge "Ultimate"/$425k/Tyler lore; (3) **declare Tier-1 port-recovery CLOSED** and pivot to **Migrate** (topology split planning on the main spine); (4) reserve branch salvage for proven micro-fragments only. |

## Loop 22 — Tier-1 Closure Record ratified (Recover → Migrate pivot) (2026-06-25)

| Field | Value |
|---|---|
| **loop_id** | L22 |
| **trigger** | Owner: produce the Tier-1 Closure Record first (governance ratification), then the Migrate-phase split plan |
| **evidence** | `TIER1-CLOSURE-RECORD.md` — cites the full chain: branch census/3-lineage, Gate C scoring, value-tier salvage map, topology matrix, F14 ratification, Sync/Dais-Levy/Forge entry-checks, v2 batch + N1 |
| **finding ratified** | The Tier-1 **port-recovery thesis was tested across all 3 domains and DISPROVEN.** Sync + Dais/Levy + Forge all superseded-by-main. Legacy/`r2` estate = recut ancestry, not pending value. |
| **closure decisions** | (1) Sync CLOSED; bridge → Forge/Pilot. (2) Dais/Levy CLOSED under Option C (no Core re-arming). (3) Forge CLOSED (stats + wave tests in main). (4) CostForge "Ultimate" **CUT + FENCED** (theater/hazard; $425k placeholder, Tyler lore). (5) **Tier-1 branch-port recovery CLOSED.** (6) **Pivot Recover → Migrate**; `main` spine = migration source; salvage = proven micro-fragments only. |
| **fenced** | CostForge "Ultimate" surfaces; `LevyDbContextStub.cs`; fabricated value placeholders; Tyler/Tyler-Vision lore; `docs/*.tar.gz`. |
| **salvageable (micro only)** | Sync malformed-county-key guard (verify) + WSDOR three-state doc-comment (doc-only). No engine/schema/SoR salvage remains. |
| **FECF** | Discover ✅ → Classify ✅ → Ratify ✅ → **Recover ✅ (closed: thesis disproven)** → **Migrate ▶ (opening)**. |
| **lock status** | FULL ACTIVE — governance record only; authorizes *planning* of Migrate, not code/repo/extraction (HR-9). |
| **decision** | Tier-1 sealed. Next artifact = **Migrate-phase split plan** (TerraFusionOS core · Sync · Dais · Forge · Atlas · Dossier), decision-only, sourcing from the evolved `main` spine; `IForgeStatisticsService` + F14 Levy projection/sync contracts = core shared-contracts at split. |

## Loop 23 — Migrate-phase split plan drafted (decision-only) (2026-06-25)

| Field | Value |
|---|---|
| **loop_id** | L23 |
| **trigger** | Owner: after the Closure Record, move into the Migrate-phase split plan (6 repos) |
| **evidence** | `MIGRATE-SPLIT-PLAN.md` + grounding scan of `main` spine (backend projects, frontend page surfaces, contract locations) |
| **grounding** | `main` already has clean module boundaries: backend `TerraFusion.{Sync,Levy,CostForge,CurrentUse,AI,Core,Abstractions}`; frontend `forge`(307)/`workbench`(77)/`atlas`(20)/`dais`(8)+`levy`(1)/`dossier`(1). Shared contracts live in `Abstractions/{DTOs,Interfaces}` + scattered `Core`. |
| **plan shape** | Source = **main spine, not branches** (split, not port). **Contracts-FIRST**: formalize core shared-contracts (`Abstractions` + F14 levy projection/sync + `IForgeStatisticsService` + tab/payload contracts) before any suite splits. Sequencing: **1 core+contracts → 2 Sync → 3a Atlas (after #1073) → 3b Dais/Levy (after F14 migration) → 3c Forge → 3d Dossier**; Phase 4 Pilot/mesh deferred. |
| **maturity findings** | Forge = large/mature (307 fe + CostForge/CurrentUse/stats). Dais = backend-weighted (real Levy SoR) / frontend-thin. **Dossier = embedded (no backend project, 1 fe file) → R-SPLIT cells NOT fillable → DO NOT split yet** (consolidate-then-split or defer). |
| **fences carried** | CostForge "Ultimate", `LevyDbContextStub.cs`, `$425k`/Tyler lore, `*.tar.gz` — never migrate. |
| **mechanics** | history-preserving (`filter-repo`/subtree) vs fresh-tree framed but NOT chosen; lean H for backend (audit provenance), F acceptable for thin fe suites — chosen per-repo at release. |
| **topology matrix** | updated with a post-closure banner: Sync/Levy/Forge "manual-port" rows superseded; source = main spine; executable mapping now in `MIGRATE-SPLIT-PLAN.md`. |
| **lock status** | FULL ACTIVE — decision-only; no repo creation, no filter-repo/subtree, no file movement, no contract code, no release (HR-9). |
| **decision (for owner)** | Reassess: (a) ratify the split plan + sequencing; (b) authorize the **first narrow Migrate release = Phase-1 shared-contracts formalization** (in-repo, no new repos — de-risks every later split); or (c) take parked **PR #1073** first so Atlas (3a) splits cleanly. |

## Loop 24 — Migrate split plan RATIFIED + Phase-1 contracts charter (first narrow release) (2026-06-25)

| Field | Value |
|---|---|
| **loop_id** | L24 |
| **trigger** | Owner: do (a) ratify split plan + sequencing, then (b) release lock narrowly for Phase-1 shared-contracts formalization in `main`; do NOT take #1073 first |
| **evidence** | `MIGRATE-R1-RATIFICATION.md` (governance) + `backend/src/TerraFusion.Abstractions/CONTRACTS.md` (in-repo charter) + contract-surface inventory |
| **ratified** | `MIGRATE-SPLIT-PLAN.md` accepted as-is (6 repos, contracts-first, R-SPLIT, sequence 1→2→3a→3b→3c→3d, Phase 4 deferred, `main` = source). |
| **lock change** | **FIRST NARROW RELEASE** — lock PARTIALLY released for **Phase-1 shared-contracts formalization in-repo on `main` ONLY**. Out-of-scope (repo creation, filter-repo/subtree, suite extraction, Atlas/Dais/Forge moves, Dossier split, Pilot internals, schema/persistence, fenced material) **remains ACTIVE-LOCKED**. |
| **inventory** | Abstractions = canonical home (14 DTOs + 6 interfaces). Scattered: `Core/Interfaces` ×36, `Core/DTOs` ×57 — mix of cross-repo + domain-local. **Key dep fact:** Abstractions is the upstream leaf (referenced by Core+7); a Core contract is promotable only if signature types are self-contained (no EF/entity coupling) — else promote its DTO first. `ITerraFusionDbContext` stays in Core/Data (persistence). |
| **charter** | `CONTRACTS.md` establishes: canonical home; the dependency/no-inversion rule; ownership (core-owned, one definition) + versioning (additive, no-break-without-version, string CountyId canonical); the 4 named contract sets (workbench tab / sync→suite payloads / F14 levy projection / forge stats); a promote-vs-stay classification table; a per-contract build-verified promotion procedure. |
| **build-safety (HR-4)** | `dotnet` unavailable in this env → **charter-first** (zero build risk) lands now; physical relocations are **separate, individually build-verified increments** (no big-bang, no unproven "done" claims, no hidden rebuilds). |
| **lock status** | PARTIALLY RELEASED (Phase-1 shared-contracts only); all other migration ACTIVE-LOCKED. |
| **decision** | Seam formalized. Next: begin per-contract promotion increments (start with the self-contained ones: `ICacheStatisticsService`, `CanonicalTf/*`, `GisTf/*`, `Kernel/*`), each build-verified — pending owner go on starting physical moves, or owner may first review the classification. |

## Loop 25 — classification reviewed/corrected + first contract promotion (GisTf) (2026-06-25)

| Field | Value |
|---|---|
| **loop_id** | L25 |
| **trigger** | Owner chose (1): review/adjust the promote-vs-stay classification first, then move code in tiny build-verifiable increments (GisTf→Kernel→CanonicalTf order; only candidates passing the 5-point gate). |
| **review (gate results)** | Read each first-cluster candidate's source vs the 5-point gate. **`ICacheStatisticsService` FAILED** — `using TerraFusion.Core.Services;` + returns `NegativeCacheStatistics` (Core type) → would invert dependency → **moved to STAY** (corrects the earlier "self-contained" tag). **`GisTf/*` (2), `Kernel/*` (3 records), `CanonicalTf/*` (4+nested) PASS** — pure DTOs, no EF/Core types, consumers rebind via `using` swap only. CountyId-Guid flagged: do NOT change type on move (versioned follow-up). |
| **first promotion (GisTf)** | Moved `ParcelGeometryResponse.cs` + `ParcelNeighborResponse.cs` Core/DTOs → Abstractions/DTOs/GisTf (namespace `TerraFusion.Core.DTOs.GisTf`→`TerraFusion.Abstractions.DTOs.GisTf`); updated 4 consumer `using`s (Data reader, Core `IParcelGeometryReader`, 2 tests) + 1 controller doc-comment cref. Repo-wide sweep: **0 stale references**. No inversion (Core refs Abstractions). |
| **build-safety (HR-4)** | `dotnet` unavailable locally → **build NOT verified in this env**; CI is the validator for this increment. No "done" claim beyond "references migrated, structurally consistent." |
| **lock status** | PARTIALLY RELEASED (Phase-1 shared-contracts only); all other migration ACTIVE-LOCKED. |
| **decision** | First cluster promoted. Per the agreed sequence: **let CI validate GisTf before promoting the next cluster (Kernel, then CanonicalTf).** Hold for CI green / owner go. |
