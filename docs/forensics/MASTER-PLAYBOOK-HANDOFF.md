# TerraFusion Master Playbook & Agent Handoff

> **Operating package — NOT an execution release.** No movement is authorized by this document.
> It consolidates the program's doctrine, topology, phase plan, and agent/queue model into the
> canonical handoff. Frozen-state validated at adoption: HEAD `f539e4ebc`, clean tree, no scope
> drift (seam present; fences intact). Recovery lock holds; Migrate-execution remains locked.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)

---

## I. Strategic shift (proven)
TerraFusion is a **migration** problem, not a monorepo-cleanup problem. The branch estate was
reclassified by lineage/mergeability; "merge-candidate" branches were largely already-landed
recuts; the Tier-1 branch-port thesis collapsed under content-presence (`TIER1-CLOSURE-RECORD.md`).
**The evolved `main` spine is the migration source.** Target architecture = thin core + platform +
suites. Branch salvage is now a **micro-fragment exception**, not the primary path.

## II. What the forensic program proved
Three disjoint git lineages; six red-flag generators (schema fracture, false authority, config
topology fracture, CI signal distortion, ghost workspace authority + theater/residue co-location);
classification must precede evaluation. **Workbench = host/orchestration (core), not a domain
repo. Sync = platform ingress. Levy → Dais (Option C SoR). Shared contracts = explicit, core-owned.**

## III. Risk has moved from discovery → execution
Live risks now: cutting core out of a still-monolithic shell tree; leaking suite logic into core;
inverting dependencies while promoting contracts; convenience-copying that rebuilds the monolith
in the new repo; splitting immature domains too early (Dossier, deep Pilot).

## IV. Governing doctrine (lifecycle + rules)
**Discover → Classify → Ratify → Recover → Migrate.** Rules: (1) classify before evaluate;
(2) ratify before execute; (3) no WO crosses analysis→action without a gate; (4) `main` is the
source unless a micro-fragment is proven otherwise; (5) Workbench host = core, domains = suites;
(6) Sync = platform ingress; (7) Levy = Dais-bound; (8) contracts core-owned & explicit; (9) no
broad release where a narrow one suffices; (10) build/test proof gate every code-moving increment;
(11) no convenience copying that recreates the monolith; (12) no repo created for a dramatic name.
*(Aligns with `DOCTRINE-HARD-RULES.md` HR-1…HR-9.)*

## V. Future repo topology (ratified — `RECOVERY-TOPOLOGY-MATRIX.md`)
- **TerraFusionOS (core):** shell/desktop/windowing/dock/top-bar · Workbench **host** only ·
  shell-facing Pilot/Muse/LocalOps · canon/governance · registry/runtime composition · shared
  contracts. **Does not own** suite domain, Sync/PACS, Levy authority, Forge engines, Atlas
  ingestion, Dossier internals, deep Pilot internals.
- **TerraFusion-Sync (platform):** county ingestion · PACS ETL · county-hub feed · Atlas nightly
  ingestion · normalization/ingress.
- **TerraFusion-Dais:** workflow/admin · permits/notices/certification/queue · Levy SoR surfaces.
- **TerraFusion-Forge:** valuation pipelines · current-use/income/cost · Forge stats/IAAO.
- **TerraFusion-Atlas:** map UI · spatial interaction.
- **TerraFusion-Dossier:** parcel dossier · evidence/document management.
- **Deferred:** deeper Pilot/AI internals (only if runtime-real + evidence-backed + owned + justified).

## VI. Program phases (status)
- **Phase 0 — Shared contracts** (`TerraFusion.Abstractions`): **partial, CI-green** — DTO clusters
  (GisTf/Kernel/CanonicalTf) + A-tier interfaces (4) + B1 workbench cluster + B2 cache contract done;
  B3 + 2 DEFERs handed to lanes (`MIGRATE-PHASE1-CONTRACTS-CLOSURE.md`).
- **Phase 1 — Found TerraFusionOS core**: **planned + ratified, execution LOCKED** (`MIGRATE-CORE-SPLIT-PLAN.md`, `MIGRATE-CORE-WO-1.md`).
- **Phase 2 — Stabilize core** (zero core→suite refs): not started.
- **Phase 3 Sync → 4 Atlas → 5 Dais/Levy → 6 Forge → 7 Dossier**: deferred, in order, each gated on upstream stability.
- **Phase 8 — Deep Pilot/AI**: only if justified.

## VII. Immediate operating plan + stop gate
**Stop gate:** no execution beyond the current partial shared-contracts release unless **(1)** an
explicit owner execution release is granted **and** **(2)** `TerraFusionOS` repo is provisioned.
**Current partial release scope:** shared-contracts seam only; everything else locked.
**Accomplished in it:** GisTf/Kernel/CanonicalTf DTOs; A-tier interfaces (IGisDataService,
IPacsReachabilityProbeService, IWorkbenchSyncReadinessRefreshRunner, IForgeStatisticsService);
B1 Workbench cluster; B2 cache contract — all CI-green.

## VIII. Parallel agent / subagent model (if available)
**Lead agent** owns release boundaries, ratification checks, CI interpretation, scope policing,
conflict resolution, artifact assembly, go/no-go. **Parallelize** evidence review & planning;
**serialize** code-moving seam changes; never two agents on one boundary.
Agents: **A** shared-contracts seam · **B** core split · **C** Sync/platform · **D** Dais/Levy
schema (F14) · **E** Forge extraction · **F** Atlas/UI seam (+#1073 tracking) · **G** Dossier
maturity · **H** CI/gate (run classification, superseded-commit foot-gun filtering, gate checklists).

## IX. Parallel work rules
- **Safe to parallelize:** source maps, ownership maps, contract inventories, consumer analysis,
  leave-behind maps, extraction prerequisites, CI interpretation, doc/handoff packaging.
- **Must serialize:** any file move / namespace change / contract promotion / shared-contracts
  motion / repo skeleton creation / monolith extraction / schema-affecting movement.
- **One-boundary-at-a-time:** only one live code-moving seam at any moment (contracts | core |
  Sync | Dais/Levy | Forge | Atlas | Dossier). No overlapping seam edits.

## X. Agent work queue
- **Q1 — ready now (decision-level):** validate frozen state / no drift (✓ done at adoption);
  maintain shared-contract seam inventory; prepare `TerraFusionOS` bootstrap checklist.
- **Q2 — ready on execution release + repo provisioning:** execute WO-CORE-1; stand up skeleton
  (`Abstractions` + kernel host shell); validate build-green + zero core→suite refs.
- **Q3 — after core stand-up:** draft Sync execution WO; reconfirm Atlas seam; refresh Dais/Levy
  prerequisites.
- **Q4 — deferred:** B3 Sync interfaces; PR #1073; deep Pilot/AI; Dossier extraction.

## XI. Non-negotiables for any next agent
1. Don't treat historical branches as the default source. 2. Don't move suite code into core for
convenience. 3. Don't split Dossier early. 4. Don't split Pilot internals early. 5. Don't migrate
fenced theater. 6. Don't broaden a narrow release without explicit owner approval. 7. Don't claim
build completion without CI proof. 8. Don't silently reinterpret ratified topology.

## XII. Next explicit decision needed
One of: **(1)** release execution + provision `TerraFusionOS`; **(2)** keep holding;
**(3)** redirect (e.g. PR #1073, deferred B3/Sync, Forge/F14 planning, external-estate
classification). Until then, this package + `MIGRATE-CORE-WO-1.md` stand as the full operating
handoff. **No movement authorized.**

> **Pending WO edit (deferred, no churn):** on the next real touch of `MIGRATE-CORE-WO-1.md`, add
> **Gate M1 — Execution Authorization** (all required: explicit owner release · target repo
> provisioned · history method chosen · skeleton scope fixed · success gate unchanged = build green
> + zero core→suite internal references).
