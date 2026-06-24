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

## Loop 14 — (next: F14 schema-reconciliation plan [decision-only], or narrow PR-#1073 release)
