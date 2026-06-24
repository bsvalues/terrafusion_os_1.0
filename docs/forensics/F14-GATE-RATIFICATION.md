# F14 Gate Ratification — Option C + map + contracts → GATE OPEN

*FECF no-code gate (HR-9). Records owner ratification of the final F14 reconciliation
decision. **No code, no migration, no lock release.** Authority: owner direction 2026-06-24.*

## RATIFIED

### 1. Final form = **Option C (Core = read projection only)**
- `TerraFusion.Levy` = **system-of-record** (Guid-PK, attested, separate DB) → **TerraFusion-Dais**.
- Core `LevyCertifications` (+ `Entities/Levy/*` legacy subdomain) becomes a **read-only
  projection** in main DB, populated from the SoR.
- **No dual-write. No shadow schema. Projection/event refresh only.**
- **D rejected (for now):** the large retained-read surface (~12 controllers + NoticeService/
  CertificationService + PACS seeders) makes deprecation premature. C-then-maybe-D later.

### 2. Migration map (criterion 4) — RATIFIED (`F14-MIGRATION-PLAN.md`)
Data migration (int→Guid +LegacyId, Guid→string CountyId, lossy-reverse), frozen 103/4
lineages, event-driven projection refresh, cutover checkpoints, rollback = C-then-maybe-D
(never D-first), open risks accepted as tracked.

### 3. Cross-repo contracts (criterion 5) — RATIFIED (`F14-CROSSREPO-CONTRACTS.md`)
5 core-owned contracts: Sync→Dais levy-input payload · **Levy projection contract (C — IN)** ·
levy domain events · cert read DTO · county-context. Core owns; suites implement-not-redefine;
versioned; canonical `string CountyId`.

## Gate status: **F14 GATE OPEN (5/5 ratified)**
| Criterion | |
|---|---|
| 1 schema authority | ✅ ratified (Levy SoR → Dais) |
| 2 context ownership | ✅ ratified |
| 3 entity reconciliation | ✅ ratified |
| 4 migration map | ✅ **ratified (Option C)** |
| 5 cross-repo contracts | ✅ **ratified** |

The HR-2 schema-decision blocker is **cleared.** Tier-1 ports (Sync / Dais·Levy / Forge) are
no longer blocked *by an undecided schema*.

## What GATE-OPEN authorizes — and does NOT
- **Authorizes:** drafting the **first Tier-1 port execution plan** (decision-layer) against
  the ratified SoR/projection shape + contracts.
- **Does NOT:** release the recovery lock · move/port code · run migrations · build the
  projection · create repos. **Tier-1 port *execution* remains a separate, narrowly-released,
  individually-ratified work order** (HR-9), with its own entry checks — exactly like R12-N1.

## Lifecycle
Discover ✅ · Classify ✅ · Ratify (topology ✅, F14 SSOT ✅, **F14 gate ✅ OPEN**) · Recover ⛔
(execution still lock-gated, now *unblocked to plan*) · Migrate ⛔.

## Reassess (next)
With the gate open, the two clean options are: **(a)** draft the first **Tier-1 port execution
plan** (the real value pool: Sync → Dais·Levy → Forge, in F14-aware order), or **(b)** take the
parked **PR #1073** as a contained near-term merge. Recovery lock remains ACTIVE for both until
a narrow release is ratified.
