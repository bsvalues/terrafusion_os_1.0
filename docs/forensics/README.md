# TerraFusion Forensic Recovery — Evidence Register

> Produced under the **TerraFusion Forensic Recovery Playbook Work Order**.
> Doctrine: *completeness before confidence; evidence before interpretation; discovery is not recovery; no premature collapse.*

This directory is the **operational memory** of the forensic recovery. It is not a
narrative audit — every conclusion here is traceable to a named evidence source
(git command output, file path, PR record, or canonical doc).

## Loop status

| | |
|---|---|
| **Current loop** | Loop 39 — Phase-1 shared-contracts SEALED (B3 deferred: PACS fence) |
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
| **B-Tier Promotion Plan** (read-only; DTO-first order; B1 Workbench clean, 2 DEFERs) | `B-TIER-PROMOTION-PLAN.md` |

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
