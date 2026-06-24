# F14 Cross-Repo Contracts (gate criterion 5) — decision-only

*Defines the contract surface implied by the ratified SSOT + the leaned **C (projection)**
migration shape. Contracts are **core-owned** (shared-contracts, HR-8). No code, no lock release.*

## Contracts to define (all core-owned)

| Contract | Direction | Purpose | Owner | Consumers |
|---|---|---|---|---|
| **Sync→Dais levy-input payload** | Sync → Dais | normalized parcel/owner/AV/district inputs the Levy SoR needs to compute certifications | **core** (shared-contracts) | producer Sync; consumer Dais(Levy) |
| **Levy projection contract** (only if C) | Dais(Levy SoR) → core/main read-projection | the read shape exposed to retained core consumers (audit/notice/history/seeders) | **core** | producer Dais; consumer core read-projection |
| **Levy domain events** | Dais emits | `LevyCertified`, `LevyCertificationSuperseded`, `LevyRateSet` — drive projection refresh + audit | **core** | producer Dais; consumers projection refresher, AuditController |
| **Cert read DTO** | core-owned type | the canonical read DTO replacing direct `DbSet<LevyCertification>` access | **core** | all read consumers |
| **County-context contract** | cross-cutting | sovereign-county identity carried across Sync↔Dais↔core (string CountyId canonical) | **core** | all |

## Ownership & rules (binding)
- **Contract owner = TerraFusionOS core** (shared-contracts). Dais/Sync **implement against**, never redefine.
- **System-of-record = Dais(Levy).** Writes only to SoR.
- **NO dual-write:** the main-DB projection is **derived, read-only**; nothing writes levy truth in two places.
- **NO shadow schema:** the projection is an explicit contract-shaped read model, not a second authoritative schema.
- **Versioning:** contracts versioned in core; consumers pin a version; a breaking change is a core change with cross-repo blast radius → governance review (HR-8).
- **County identity:** canonical `string CountyId` (per SoR); the migration maps legacy `Guid CountyId` → string 1:1.

## Refresh / consistency model (C)
- Projection refresh is driven by **`LevyCertified`/`Superseded` events** (preferred) or scheduled batch; **staleness budget declared** in the projection contract.
- Read parity: projection must reconcile to SoR within the staleness budget; a parity check is a cutover checkpoint (criterion 4).

## If D instead of C
- Drop the **Levy projection contract** + **Cert read DTO-as-projection**; retained consumers must move to Dais and read the SoR directly (no core projection). Sync→Dais payload + domain events + county-context contract still apply.

## Dependency on criterion 4
The exact contract set is **conditional on the C/D choice** (projection contract exists iff C).
Everything else (Sync→Dais payload, domain events, county-context, cert read DTO) holds either way.

## Gate effect — F14 now 5/5 DRAFTED (ratification pending)
| Criterion | Status |
|---|---|
| 1 schema authority | ✅ ratified (Levy SoR → Dais) |
| 2 context ownership | ✅ ratified |
| 3 entity reconciliation direction | ✅ ratified |
| 4 migration plan | ✅ **drafted** (`F14-MIGRATION-PLAN.md`, leans C) — owner ratifies C/D |
| 5 cross-repo contracts | ✅ **drafted** (this doc) — finalized once C/D locked |

**The gate is DRAFTED end-to-end but not yet OPEN.** To open it (and unblock Tier-1 ports),
the owner must **ratify: (a) C vs D, and (b) the migration map + contract set.** Both remain
decision-layer; **no code, no lock release** until then.
