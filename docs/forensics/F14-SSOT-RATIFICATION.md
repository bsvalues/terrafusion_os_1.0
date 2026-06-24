# F14 SSOT Ratification Record

*FECF no-code gate (HR-9). Ratifies the single-source-of-truth decision for the fractured
levy/schema domain, on the field-level evidence in `F14-ENTITY-COLLISION-DETAIL.md`. **No code,
no migration, no lock release.** Authority: owner direction 2026-06-24.*

## RATIFIED decision

### 1. Levy domain system-of-record
- **The `TerraFusion.Levy` module is the AUTHORITATIVE system-of-record** for the levy domain
  (`Guid`-PK, attested, references, separate DB). **Future home = `TerraFusion-Dais`.**
- **Core `Entities/Levy/*` is NOT authoritative** — the `int`-PK lightweight models
  (`LevyCertification`, `LevyRate`, `LevyScenario`) **and the broader Core legacy levy
  subdomain** (`TaxDistrict`, `TaxCode`, `ImportLog`, `ExportLog`, `ComplianceCheck`,
  `DataQualityScore`, `ValidationRule`, `LevyAuditRecord`) are **demoted to legacy.**
- **`ITerraFusionDbContext` relinquishes `DbSet<LevyCertification>`** (and the other Core
  levy sets) under either final form below.

### 2. Final form = C or D, bound to ONE execution-time test
> **Test:** does any *retained* core/main-DB consumer need to **read** levy data?
- **No → D (deprecate Core levy):** delete the Core `Entities/Levy/*` subdomain; consumers
  (e.g. `LevyCertificationController`, currently on `TerraFusionDbContext`→Core variant) repoint
  to the Levy SoR via contract.
- **Yes → C (Core as read-only projection):** Core levy becomes a projection populated from the
  Levy SoR via the sync→suite/Levy contract. **No dual writes.**

### 3. REJECTED options
- **A — keep-split-by-design:** rejected. Incompatible PKs (`int` vs `Guid`), divergent
  CountyId types, and the attestation/provenance gap make a "designed split" accidental drift.
- **Dual-write / two systems-of-record:** rejected (data-truth split is the problem, not the solution).

### 4. Related ratifications (from the F14 plan)
- **`TerraFusionContext` → rename** (e.g. `TerraFusionIdentityContext`); stays Identity, same
  DB, core-owned — removes the naming hazard. (Rename only; no schema change.)
- **`CurrentUseDbContext`** stays its own store → `TerraFusion-Forge`; **apply
  `fix/currentuse-sqlite-provider-fix`** as a precondition.

## Gate effect — F14 gate advances 3/5 (NOT fully open)
| Gate criterion (from F14 plan §5) | Status after this ratification |
|---|---|
| 1. Schema authority chosen | ✅ **MET** — Levy module = SoR; Core levy demoted |
| 2. Context ownership clarified | ✅ **MET** — domain→core, Levy→Dais, CurrentUse→Forge, Identity→core(renamed) |
| 3. Entity naming/ownership reconciled | ✅ **MET (direction)** — Levy owns; Core levy legacy; interface drops sets; C/D at execution |
| 4. Migration plan declared | ⛔ **OPEN** — needs the repoint/projection-or-delete migration plan (incl. existing main-DB levy data + the 103/4 lineages) |
| 5. Cross-repo contracts defined | ⛔ **OPEN** — sync→suite/Levy contract + (if C) projection contract, in core shared-contracts |

**Tier-1 ports (Sync / Dais·Levy / Forge) remain BLOCKED** until criteria 4 & 5 are also
satisfied (HR-2). This ratification opens 1–3; the gate is not yet fully open.

## Blast radius acknowledged (for the migration plan, criterion 4)
- `LevyCertificationController` + any service on `TerraFusionDbContext` reading/writing the
  Core `LevyCertification` must repoint (D) or read the projection (C).
- Existing **data** in the main-DB `LevyCertifications` table must be reconciled/migrated, not silently dropped.
- The Levy DB (`LevyDatabase`/`levy-dev.db`) becomes the canonical store → confirm prod connection wiring.

## What this authorizes / does NOT
- **Authorizes:** drafting the next decision-layer artifacts — the **F14 migration plan**
  (criterion 4) and the **levy/sync cross-repo contracts** (criterion 5). Both decision-only.
- **Does NOT:** release the lock, move code, run migrations, delete Core levy, or extract any
  Tier-1 repo. Execution is a separate, later, individually-ratified work order.

## Lifecycle
Discover ✅ · Classify ✅ · Ratify (topology ✅, **F14 SSOT ✅ here**) · Recover ⛔ (gate 3/5) · Migrate ⛔.
