# F14 Schema-Reconciliation Plan (decision-only)

*Turns the F14 fracture from "known finding" into a **ratifiable decision artifact** that can
later unblock the Tier-1 ports (Sync / Dais·Levy / Forge). **No code, no migrations, no lock
release.** Forensics surfaced the fracture; this plan frames the decisions — it does not choose.*

Critical-path role: per the batch checks, the mergeable pool mostly evaporated into
already-landed; the real remaining value is **PORT-ONLY Tier-1 engines behind this gate.**

---

## 1. Context truth table

| Context | Purpose | DB target | Registration | Runtime role | Class | Future home |
|---|---|---|---|---|---|---|
| `TerraFusionDbContext` | domain (100+ DbSets: properties, PACS slices, sync, forge, dossier…) | **main** (`DefaultConnection`) | `TerraFusion.API/Program.cs:2271` + ~26 mutually-exclusive CLI/seed branches | ~150 controller/service injections | **AUTHORITATIVE** | TerraFusionOS core (+ suites read via contract) |
| `TerraFusionContext` | ASP.NET **Identity** + seed reference data (7 DbSets: Property, County, Module, AIModel, CostMatrix, Valuation, SystemLog) | **main (same DB)** via `ResolvePrimaryConnectionString` | `Program.cs:2293`; Consciousness `Program.cs:91` | 7 injections (TerraGaiaService, AI svcs, seeder, health) | **PARALLEL (naming hazard)** | core (Identity) — **rename to de-confuse** |
| `LevyDbContext` | Levy domain | **separate** (`LEVY_DATABASE_URL`/`LevyDatabase`; else `levy-dev.db`) — never `DefaultConnection` (`Program.cs:2479–2493`) | `Program.cs:2477` | 19 injections (Levy ctrls/svcs) | **PARALLEL (isolated DB)** | TerraFusion-Dais |
| `CurrentUseDbContext` | current-use assessment | **dedicated** DB, hardcoded schema `currentuse` | `AddCurrentUseServices` (`Program.cs:2519`); also CurrentUse.Host | 7 injections | **PARALLEL (isolated DB)** | TerraFusion-Forge |

Migration lineage depth: `TerraFusion.Data` **103** · `Levy` **4** · `CurrentUse` **1** (+ orphaned Experiments raw-SQL).

---

## 2. Entity collision register
**THREE** classes are defined in BOTH `TerraFusion.Core/Entities` and `TerraFusion.Levy/Models`:

| Entity | Core def (main DB) | Levy def (Levy DB) | Physical collision? | Conflict type |
|---|---|---|---|---|
| **LevyCertification** | `Core/Entities/LevyCertification.cs:12` — `int Id` PK, Guid CountyId, ~11 fields | `Levy/Models/LevyCertification.cs:40` — `Guid Id` PK, `string CountyId`, 40+ fields, `[Table("LevyCertifications")]`, attestation/banked-capacity | **No** (different DBs) | **data-truth split** (cert written via Dais-surface→main DB vs Levy module→Levy DB) |
| **LevyRate** | Core/Entities | Levy/Models | **No** (different DBs) | data-truth split (confirm field divergence at reconcile) |
| **LevyScenario** | Core/Entities | Levy/Models | **No** (different DBs) | data-truth split (confirm field divergence) |

> **Field-level detail CONFIRMED** in `F14-ENTITY-COLLISION-DETAIL.md`: all 3 share one
> signature — Core = `int`-PK lightweight (in legacy `Entities/Levy/LevyEntities.cs`), Levy =
> `Guid`-PK rich system-of-record with attestation/AI fields + separate DB. Core also holds a
> whole legacy levy sub-domain (TaxDistrict/TaxCode/ComplianceCheck/LevyAuditRecord…). Evidence
> points the SSOT choice toward **D (deprecate Core levy)** or **C (Core = read projection)**,
> with Levy-module as system-of-record → TerraFusion-Dais.

Also: `ITerraFusionDbContext` (Core interface) declares `DbSet<LevyCertification>` (the Core
variant) → interface/ownership contradiction with Levy's authoritative variant.

**Formal decision object:** the Levy domain has **two homes** for its core entities (main DB
via Core, Levy DB via Levy module). No crash; a silent split of where levy/cert "truth" lives.

---

## 3. Single-source-of-truth options (NOT chosen here)

### Levy domain (LevyCertification / LevyRate / LevyScenario)
- **A — keep split by design:** Core = lightweight summary, Levy = authoritative. *Requires* an explicit reason + sync contract; otherwise it's accidental drift.
- **B — consolidate to one authoritative schema:** Levy's rich Guid-PK definitions become system-of-record (Dais-owned); delete Core's int-PK variants; repoint any main-DB consumers to read via a contract. *(Aligns with topology: Levy → Dais.)*
- **C — parallel stores w/ explicit contract boundary:** Levy DB = system of record; Core = read-only projection populated via the sync→suite contract. No dual writes.
- **D — deprecate one lineage:** retire Core's `Levy*` entities entirely; `ITerraFusionDbContext` drops `DbSet<LevyCertification>`.

### `TerraFusionContext` vs `TerraFusionDbContext` (same DB, Identity vs domain)
- **A — keep the Identity/domain split** (low risk) but **rename** `TerraFusionContext` → e.g. `TerraFusionIdentityContext` to kill the naming hazard.
- **B — merge** Identity into the domain context (more invasive; not recommended without cause).

### CurrentUse
- Largely isolated (dedicated DB). Option: confirm it stays its own store under Forge, or fold into Forge's schema. **Apply `fix/currentuse-sqlite-provider-fix`** (the unmerged provider fix) as a precondition either way.

> Choosing among A–D is an **owner/product decision** (ownership + intent). This plan frames; ratification chooses.

---

## 4. Blast-radius matrix (per reconciliation path)

| Path | Dais/Levy | Sync | Forge | Workbench | Contracts/APIs | Migrations | Tests | Extraction |
|---|---|---|---|---|---|---|---|---|
| **A keep-split** | low | needs dual-feed contract | low | low | **new sync→both contract** | none now | dual-store tests | Dais+core both keep Levy types (blurred) |
| **B consolidate→Dais** | **high** (Dais owns) | medium (feed Dais only) | low | medium (tab reads contract) | Levy contract in core | **merge 4 Levy + drop Core Levy\*; data migration** | rewrite Levy tests | clean: Levy fully in Dais |
| **C projection** | medium | medium (populates projection) | low | low | **read-projection contract** | additive (projection tables) | projection-sync tests | Dais=SoR, core=view |
| **D deprecate Core Levy** | medium | low | low | low | drop `ITerraFusionDbContext.LevyCertification` | drop Core Levy tables (check data) | remove Core Levy tests | cleanest for extraction |
| **rename TerraFusionContext** | none | none | none | none | none (Identity internal) | none (rename only) | update DI tests | removes naming hazard |

(Confidence: directional — exact migration/data impact requires a per-entity field diff at reconcile time.)

---

## 5. Gate criteria — what MUST be true before any Tier-1 port starts

> **Status after `F14-SSOT-RATIFICATION.md` (2026-06-24): gate at 3/5.** Criteria 1–3 MET
> (Levy module = system-of-record → Dais; Core levy demoted to legacy [final C/D at execution];
> contexts owned; Identity-context rename ratified). Criteria **4 (migration plan)** and
> **5 (cross-repo contracts)** remain OPEN — Tier-1 ports stay BLOCKED until both are done.

The F14 gate **opens** only when ALL hold (ratified):
1. **Schema authority chosen** per fractured domain (Levy A/B/C/D selected; CurrentUse confirmed; Identity-rename decided).
2. **Context ownership clarified** — which future repo owns each context + its DB (per topology: domain→core, Levy→Dais, CurrentUse→Forge, Identity→core).
3. **Entity naming/ownership reconciled** — the 3 `Levy*` collisions resolved to one owner each; `ITerraFusionDbContext` interface aligned.
4. **Migration plan declared** — how the 103 / 4 / 1 lineages reconcile without data loss; `fix/currentuse-sqlite-provider-fix` applied; Experiments raw-SQL folded or archived.
5. **Cross-repo contract impact identified** — sync→suite payload + Levy/CurrentUse contracts defined in core (shared-contracts) before any consumer extracts.

**Until all five hold, Sync / Dais·Levy / Forge ports remain BLOCKED** (HR-2). This is the
single dependency gating the genuine remaining salvage value.

---

## Status
F14 is now a **ratifiable decision object** (4 contexts mapped, 3 collisions registered, 4
SSOT options framed, blast-radius matrixed, gate criteria set). **No path chosen, no code, no
lock release.** Next: this plan goes through Ratification (owner picks the SSOT path) → only
then do the Tier-1 ports unblock. `#1073` remains the parked near-term execution win,
independent of this gate.
