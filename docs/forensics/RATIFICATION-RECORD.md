# Ratification Record — Topology & Phase-1 Founding Plan

*FECF lifecycle gate: **Discover ✅ → Classify ✅ → RATIFY (this doc) → Recover (gated) →
Migrate (gated)**. Ratification is a **no-code gate**: it accepts classification + target
homes as decided (no longer hypotheses) and authorizes only a single, narrow next step.
Recovery lock remains **ACTIVE**.*

**Authority:** owner direction (2026-06-24) + prior per-loop approvals.
**Method:** each item re-checked for contradiction against the forensic record (F1–F18,
3-root census, Red Flag Register, F14 schema fracture, F17/F18 AI reality+value) before stamping.

---

## Item 1 — TerraFusionOS core contents → **RATIFIED (with conditions)**
**Statement:** core = shell/windowing, top-bar/dock, **workbench host**, shell-facing
Pilot/Muse/LocalOps, canon/governance, registry/runtime composition, **shared-contracts**, core config.
**Contradiction check:** consistent with `founding/CORE-CONTENTS-MATRIX.md`; no surface here is
domain/ingestion/deep-AI. ✅ no contradiction.
**Conditions (must hold at recover-time, not ratification blockers):**
- C1.1 Registry: the 3 registry impls (F5: `tools/registry`, `ToolRegistry.js`, backend `ServiceRegistry`) **converge to one** core registry.
- C1.2 Shared-contracts are **extracted explicitly**, not left implied in shell code (HR-8).
- C1.3 Pilot = **shell-facing only**; deep AI internals excluded (R-PILOT).

## Item 2 — Hard repo boundaries → **RATIFIED**
**Statement:** workbench host→core; Atlas UI→TerraFusion-Atlas; Atlas ingestion→TerraFusion-Sync;
Levy→TerraFusion-Dais; wrapper noise + CostForge "Ultimate"→legacy-only.
**Contradiction check:** consistent with `RECOVERY-TOPOLOGY-MATRIX.md` v2 + HR-8 (R-WB/R-ATLAS).
Levy-in-Dais resolves the "Levy-as-platform" floating concern (no contradiction with F14 — F14
is a *schema* fracture, handled by a condition below). ✅ no contradiction.
**Conditions:**
- C2.1 R-WB enforced: no domain logic enters the workbench host.
- C2.2 R-ATLAS seam enforced: UI vs ingestion stay separate at extraction.
- C2.3 CostForge "Ultimate" is **cut, not migrated** (F18 Tier-5).

## Item 3 — Ownership cells → **RATIFIED (with one deferred cell)**
**Statement:** the top-level + split-surface ownership cells in `founding/OWNERSHIP-CELLS.md`
(runtime/contracts/persistence/ingestion/UI-host/tests).
**Contradiction check:** all split surfaces (Workbench, Atlas, county-studio, Levy/Dais) have
every cell filled; contracts uniformly core-owned. ✅ consistent with R-SPLIT.
**Conditions / deferral:**
- C3.1 **Levy/Dais persistence cell is provisional until F14 dual-`LevyCertification` is resolved** — that cell is "real" only post-reconciliation.
- C3.2 **Pilot deep-internals runtime cell remains `undecided`** (one deliberately-unfilled cell) → Pilot deep internals are *not cleared to split* (consistent with R-PILOT; not a defect).

## Item 4 — Needle order → **RATIFIED**
**Statement:** N1 first → N2 next → **reassess** → N3; all Sync/Levy/Forge deep ports
**blocked behind the F14 schema-reconciliation gate**.
**Contradiction check:** consistent with `R11-GATE-C-SCORING.md` + `R11-VALUE-TIER-SALVAGE-MAP.md`.
✅ no contradiction.
**Conditions:**
- C4.1 N1 = LocalOps/Muse/Pilot shell-facing stack into core, **merge** (lowest risk).
- C4.2 Schema gate is a hard blocker for steps that touch the fractured persistence layer (HR-2).

---

## Overall verdict: **RATIFIED — WITH CONDITIONS**
The topology and Phase-1 founding plan are **accepted as decided** (no longer hypotheses). The
attached conditions are *recover-time obligations*, not ratification blockers.

## What ratification AUTHORIZES (and only this)
- A **single, narrow, future lock-release for R12-N1 only** — LocalOps/Muse/Pilot shell-facing
  stack → TerraFusionOS core — **contingent on the N1 entry checks**:
  1. verify **not already landed** (recut-aware; Lane 3 / Loop 5),
  2. verify content against current `main`,
  3. verify **no schema/config spillover** (no F14/F15 surface drags in),
  4. verify **owner-sensitive surfaces stay fenced** (e.g. `wo-sec-localops-001-phone-redaction`).

## What ratification does NOT authorize
- ❌ General recovery-lock release. ❌ R12 for anything beyond N1. ❌ Any extraction now.
- ❌ Repo creation. ❌ Deep Sync/Levy/Forge ports (behind schema gate). ❌ Pilot deep internals.
- ❌ Reopening home/owner assignments (no contradiction surfaced → matrix v2 stands).

## Lifecycle position after this record
Discover ✅ · Classify ✅ · **Ratify ✅ (conditional)** · Recover ⛔ gated (next: narrow R12-N1
release on owner go) · Migrate ⛔ gated (target repos + per-repo prerequisites).

## Sign-off
- Ratified by: **owner** (direction 2026-06-24).
- Evidence-consistency checked by: forensic recovery agent (this record).
- Recovery lock: **ACTIVE** — unchanged by ratification.
