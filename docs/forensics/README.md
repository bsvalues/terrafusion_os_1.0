# TerraFusion Forensic Recovery — Evidence Register

> Produced under the **TerraFusion Forensic Recovery Playbook Work Order**.
> Doctrine: *completeness before confidence; evidence before interpretation; discovery is not recovery; no premature collapse.*

This directory is the **operational memory** of the forensic recovery. It is not a
narrative audit — every conclusion here is traceable to a named evidence source
(git command output, file path, PR record, or canonical doc).

## Loop status

| | |
|---|---|
| **Current loop** | Loop 41 — core boundary RATIFIED; WO-CORE-1 specified (blocked on target repo) |
| **Recovery lock** | **PARTIALLY RELEASED** — Phase-1 shared-contracts formalization (in-repo) ONLY; all other migration ACTIVE-LOCKED (HR-9) |
| **Gate reached** | F14 schema gate **OPEN** (5/5, Option C); Tier-1 port-recovery **CLOSED** (thesis disproven, `TIER1-CLOSURE-RECORD.md`) |
| **FECF position** | Discover ✅ → Classify ✅ → Ratify ✅ → **Recover ✅ (closed)** → **Migrate ▶ (opening, decision-only)** |
| **Date** | 2026-06-24 |
| **Working branch** | `claude/terrafusion-forensic-playbook-u3kvx6` (on current `main` lineage) |

## The one finding that reframes everything

The repository contains **three disjoint git histories** (three unrelated root
commits). **580 of 742 branches (78%) share *no common ancestor* with current
`main`** and are therefore **physically impossible to merge**. All buried value on
those branches must be recovered by file-/hunk-level cherry-pick or manual port —
never by `git merge`. This single fact explains the branch sprawl, the
recut-PR culture, and the 38-of-40 closed-unmerged PR pattern. See
`03-BRANCH-CENSUS-REGISTER.md`.

## Documents

| # | Deliverable | File | Status |
|---|---|---|---|
| 1 | Canonical Truth Brief | `02-CANONICAL-TRUTH-BRIEF.md` | complete (cross-checked) |
| 2 | Forensic Coverage Matrix | `01-COVERAGE-MATRIX.md` | living |
| 3 | Branch Census Register | `03-BRANCH-CENSUS-REGISTER.md` | complete (cross-checked) |
| 4 | PR Disposition Register | `04-PR-DISPOSITION-REGISTER.md` | partial (recent window) |
| 5 | Root Containment Table | `05-ROOT-CONTAINMENT-TABLE.md` | complete |
| 6 | System Duplication Map | `06-SYSTEM-DUPLICATION-MAP.md` | complete |
| 7 | Runtime Truth Map | `07-RUNTIME-TRUTH-MAP.md` | complete (cross-checked) |
| 8 | Artifact & Residue Register | `08-ARTIFACT-RESIDUE-REGISTER.md` | complete |
| 9 | Agent Drift Report | `09-AGENT-DRIFT-REPORT.md` | complete |
| 10 | Structural Risk Register | `10-STRUCTURAL-RISK-REGISTER.md` | complete |
| — | Loop Ledger | `00-LOOP-LEDGER.md` | living |
| — | Gate Model status | `GATES-STATUS.md` | living |
| 11–14 | Recovery Lanes (needles/salvage/containment/spine) | `11-RECOVERY-LANES-STATUS.md` | **gated — not started** |

### Loop 2 — expanded forensic lanes (F11–F16)

> The playbook later added six forensic lanes that reuse numbers 11–16. To avoid collision
> with the recovery lanes (R11–R14), these are filed with an **`F`** prefix.

| Lane | Deliverable | File | Status |
|---|---|---|---|
| F11 | Workspace / Code-Space Truth | `F11-WORKSPACE-CODESPACE-TRUTH.md` | complete |
| F12 | Dependency / Package-Manager Truth | `F12-DEPENDENCY-TRUTH.md` | complete (cleanest lane) |
| F13 | Build / CI / Release-Path Truth | `F13-BUILD-CI-RELEASE-TRUTH.md` | complete |
| F14 | Data / Schema / Migration Lineage | `F14-DATA-SCHEMA-MIGRATION-LINEAGE.md` | complete (conflicts found) |
| F15 | Config / Env / Secrets Surface | `F15-CONFIG-ENV-SECRETS-SURFACE.md` | complete (secrets rotated → mitigated; config hygiene residual) |
| F16 | Ownership / False-Completion | `F16-OWNERSHIP-FALSE-COMPLETION.md` | complete |

**Loop 2 outcome:** F11–F16 **re-opened discovery** — new disorder categories (conflicting
DB lineages, committed secrets, ownership vacuum) appeared, so Gate A's provisional pass is
withdrawn. See `00-LOOP-LEDGER.md` (Loop 2) and `GATES-STATUS.md`.

### Loop 3 — synthesis & consolidation (read these next)

| Deliverable | File | What it is |
|---|---|---|
| **Red Flag Register** | `RED-FLAG-REGISTER.md` | the 6 hidden-system generators, severity-ranked — **start here** |
| **Cross-Lane Synthesis** | `CROSS-LANE-SYNTHESIS.md` | XJ-1…XJ-6 contradiction joins across lanes |
| **Hard Rules** | `DOCTRINE-HARD-RULES.md` | HR-1…HR-5 binding rules (+ two-truths principle) |

**Loop 3 outcome:** the six lanes collapse into a smaller set of **coupled** failures —
ghost authority (unowned), schema/config fracture (live in the spine), and false-completion
narrative — with CI signal distortion making branch/PR truth unreliable. Dependency truth is
cleared. Recovery still gated; Loop 4 = verification + quantification.

### Loop 4 — verification & quantification

| Deliverable | File |
|---|---|
| **Loop 4 Verification** | `LOOP4-VERIFICATION.md` |
| **Loop 5 Verification** | `LOOP5-VERIFICATION.md` |
| **F17 — AI Reality Audit** (runtime axis) | `F17-AI-REALITY-AUDIT.md` |
| **F18 — Latent Value Audit** (value axis; value ≠ runtime) | `F18-LATENT-VALUE-AUDIT.md` |
| **R11 — Branch Disposition (decision lane)** | `R11-BRANCH-DISPOSITION.md` |
| **Value-Tier Salvage Map** (Tier 1–2 → best-version branches) | `R11-VALUE-TIER-SALVAGE-MAP.md` |
| **Gate C Scoring** (per-branch U/F/O + ordered needle set) | `R11-GATE-C-SCORING.md` |
| **Recovery-to-Repo Topology Matrix** (Phase A; future-home per surface) | `RECOVERY-TOPOLOGY-MATRIX.md` |
| **Phase-1 Founding Plan** (TerraFusionOS core definition; 6 docs) | `founding/TERRAFUSIONOS-FOUNDING-PLAN.md` |
| **Ratification Record** (no-code gate; topology+founding accepted) | `RATIFICATION-RECORD.md` |
| **R12-N1 Entry-Check** (first execution attempt → already-landed, no merge) | `R12-N1-ENTRY-CHECK.md` |
| **R12 Batch Already-Landed Check** (v1, representative — SUPERSEDED) | `R12-BATCH-LANDED-CHECK.md` |
| **R12 Batch Check v2** (full-membership, CORRECTED; genuine residual found) | `R12-BATCH-LANDED-CHECK-v2.md` |
| **F14 Schema-Reconciliation Plan** (decision-only; the Tier-1 critical-path gate) | `F14-SCHEMA-RECONCILIATION-PLAN.md` |
| **F14 Entity Collision Detail** (field-level, ratification-ready) | `F14-ENTITY-COLLISION-DETAIL.md` |
| **F14 SSOT Ratification** (Levy module = SoR → Dais; Core levy legacy; gate 3/5) | `F14-SSOT-RATIFICATION.md` |
| **F14 Migration Plan** (criterion 4; leans C/projection) | `F14-MIGRATION-PLAN.md` |
| **F14 Cross-Repo Contracts** (criterion 5; core-owned) | `F14-CROSSREPO-CONTRACTS.md` |
| **F14 Gate Ratification** (Option C ratified → gate OPEN 5/5) | `F14-GATE-RATIFICATION.md` |
| **First Tier-1 Port Execution Plan** (decision-only; Sync→Dais/Levy→Forge) | `TIER1-PORT-PLAN.md` |
| **Sync Entry-Check** (read-only; legacy Sync heads = SUPERSEDED by main) | `SYNC-ENTRY-CHECK.md` |
| **Dais/Levy Entry-Check** (read-only; `r2/*` heads = SUPERSEDED; Option-C clean) | `DAIS-LEVY-ENTRY-CHECK.md` |
| **Forge Entry-Check** (read-only; `r2/wave-*` = SUPERSEDED; stats in main; theater CUT) | `FORGE-ENTRY-CHECK.md` |
| **Tier-1 Closure Record** (governance; port thesis disproven → Recover→Migrate pivot) | `TIER1-CLOSURE-RECORD.md` |
| **Migrate-Phase Split Plan** (decision-only; 6-repo split from the `main` spine, contracts-first) | `MIGRATE-SPLIT-PLAN.md` |
| **Migrate R1 Ratification** (split plan ratified; first narrow lock release = contracts) | `MIGRATE-R1-RATIFICATION.md` |
| **Shared Contracts Charter** (in-repo, authoritative; canonical contract home + rules) | `../../backend/src/TerraFusion.Abstractions/CONTRACTS.md` |
| **Interface Classification Review** (read-only; A promote-now / B DTO-first / C stay) | `INTERFACE-CLASSIFICATION-REVIEW.md` |
| **Migrate Phase-1 Contracts Closure** (governance; shared-contracts sealed; B3 deferred to Sync) | `MIGRATE-PHASE1-CONTRACTS-CLOSURE.md` |
| **TerraFusionOS Core Split Plan** (decision-only; first repo boundary, cut line, first move) | `MIGRATE-CORE-SPLIT-PLAN.md` |
| **Migrate Core WO-1** (ratified boundary + first execution work order; blocked on target repo) | `MIGRATE-CORE-WO-1.md` |
| **B-Tier Promotion Plan** (read-only; DTO-first order; B1 Workbench clean, 2 DEFERs) | `B-TIER-PROMOTION-PLAN.md` |
| **Master Playbook & Agent Handoff** (canonical operating package — doctrine, topology, phases, agent/queue model; NOT an execution release) | `MASTER-PLAYBOOK-HANDOFF.md` |
| **Full Agent Handoff** (standalone continuity doc — usable without history; two-lock state, doctrine, next-signal gates; NOT an execution release) | `FULL-AGENT-HANDOFF.md` |
| **TerraFusionOS Receiving-Vessel Scaffold** (WO-LOOP-44; governance scaffold — now a *reconciliation candidate*, see correction) | `terrafusionos-vessel/_STAGING-README.md` |
| **WO-LOOP-44R — Reconcile w/ existing `terrafusion-os`** (CORRECTION: receiving repo already exists; reconcile not create; identity map, lock model, comparison checklist) | `WO-LOOP-44R-RECONCILE.md` |
| **Progress Reconstruction Ledger** (what is actually BUILT — merged-PR arc + backend/gov/frontend/CI reality; corrects "half-made" impression + stale doc counts) | `PROGRESS-RECONSTRUCTION-LEDGER.md` |
| **WO-SR-001 — Suite Repo Ratification & Extraction Blueprint** (5-repo names/retention/source-paths/contracts/disposition/matrix/bootstrap/WO-chain; decision-layer) | `WO-SR-001-SUITE-REPO-BLUEPRINT.md` |
| **Authority-Reconciliation Ledger** (WO-SR-001 §8; precedence-ranked reconciliation — decomposition RECONCILED via TF-052 LAW; base-repo identity = TRUE_OWNER_BOUNDARY → RESOLVED) | `AUTHORITY-RECONCILIATION-LEDGER.md` |
| **⭐ OWNER DECISION — Topology Ratified** (GOVERNING: sovereign base = `terrafusion_os_1.0`; `terrafusion-os` superseded; federated 1+5 topology; One Brain; Tier-0 Workbench; contract-first) | `OWNER-DECISION-TOPOLOGY-RATIFIED.md` |
| **Suite Program & Topology** (ratified federated matrix + program register + One-Brain dispatch + contract-freeze/extraction/gate policy + bootstrap/branch-protection spec) | `SUITE-PROGRAM-AND-TOPOLOGY.md` |
| **Suite Repo Creation Manifest** (machine-executable: 5 private repos, settings, protection, contracts, provenance, rollback) | `SUITE-REPO-CREATION-MANIFEST.json` |
| **Suite Repo Creation — Credential Request** (RESULT: BLOCKED_MISSING_EXECUTION_CREDENTIAL; required-capabilities + credential-type map; no strategic/owner-engineering work remains) | `SUITE-REPO-CREATION-CREDENTIAL-REQUEST.md` |
| **WO-SR-002 — Shared-Contract Freeze** (classifies Abstractions seam; versions only suite-consumable contracts; compat/deprecation + publication boundary + validation; invents nothing) | `WO-SR-002-CONTRACT-FREEZE.md` |
| **WO-FORGE-X-001 — Forge Inventory** (source-side disposition; CostForge project = theater/REJECT; real Forge distributed across Core/Entities/Forge + AI + SalesForge + CurrentUse) | `WO-FORGE-X-001-INVENTORY.md` |
| **WO-FORGE-X-002 — Forge Disposition/Dependency/Provenance** (crux: Forge owns engines→new ForgeDbContext; shared parcel/sale data stays OS/Sync via contract; geo/county-studio→Forge) | `WO-FORGE-X-002-DISPOSITION.md` |
| **WO-ATLAS-X-001 — Atlas Inventory** ("Atlas" spans 3 domains: GIS suite / SystemGptAtlas AI→GPT / Sync-profiling; maps unrendered → #1073 hard cutover precondition) | `WO-ATLAS-X-001-INVENTORY.md` |
| **WO-DAIS-X-001 — Dais Inventory** (clean/no-theater but largest; F14 Levy SoR/projection three-way split; `levy.projection` contract GAP; Levy own-context clean extract) | `WO-DAIS-X-001-INVENTORY.md` |
| **WO-DOSSIER-X-001 — Dossier Inventory** (NOT thinnest — dispersed, real chain-of-custody; "evidence" 4-way overload; `dossier.evidence` contract GAP) | `WO-DOSSIER-X-001-INVENTORY.md` |
| **WO-GPT-X-001 — TerraGPT Inventory** (real RAG infra vs largest theater; Muse/Pilot=OS; pages/suites=shared registry; SystemGptAtlas→Atlas; GPT=leaf/no-write-lane) — completes all 5 | `WO-GPT-X-001-INVENTORY.md` |
| **WO-ATLAS-X-002 — Atlas Disposition** (Atlas owns ~no data; geometry Sync-populated; AtlasDbContext=authored artifacts; SystemGptAtlas→Atlas) | `WO-ATLAS-X-002-DISPOSITION.md` |
| **WO-DAIS-X-002 — Dais Disposition** (F14 3-way confirmed; generic Workflow stays OS; DaisDbContext+LevyDbContext; levy.projection gating) | `WO-DAIS-X-002-DISPOSITION.md` |
| **WO-GPT-X-002 — GPT Disposition** (theater REJECT incl. TerraGaia; GptDbContext carve; gpt↔pilot tool contract) | `WO-GPT-X-002-DISPOSITION.md` |

**Loop 4 outcome:** suspected→classified on all five items. `TerraFusionContext` = separate
Identity context (naming hazard, not dual-core). Dual `LevyCertification` = **no physical
collision; divergent-DB data-truth split**. CI foot-gun confirmed (PR #1080: 4/4 Seal-Gate
failures misleading). Critical-surface history lives on the legacy lineage, not main.
**All Loop-4 exit conditions met; no new disorder category** → the bar to *consider* salvage
planning is cleared, pending the owner's decision to release the recovery lock.

Raw evidence (git output) is under `evidence/`.

## How to read this

1. Start with **`02-CANONICAL-TRUTH-BRIEF.md`** — what is true now.
2. Read **`03-BRANCH-CENSUS-REGISTER.md`** — the three-lineage finding governs all branch decisions.
3. Use **`01-COVERAGE-MATRIX.md`** to see what is proven vs. still shallow.
4. **Do not act on the recovery lanes** until Gates A–E pass (`GATES-STATUS.md`).
