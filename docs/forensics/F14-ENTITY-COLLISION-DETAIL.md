# F14 — Entity Collision Detail (field-level, ratification-ready)

> Addendum to `F14-SCHEMA-RECONCILIATION-PLAN.md` §2. Hardens the collision register from
> "confirm divergence" to **field-level evidence**, so the SSOT path is choosable on facts.
> Read-only; no code; no lock release.

## Confirmed: 3 genuine Core↔Levy collisions (+ a whole legacy sub-domain)
Re-derived via `comm` of class names in `TerraFusion.Core/Entities` ∩ `TerraFusion.Levy/Models`:
**`LevyCertification`, `LevyRate`, `LevyScenario`.**

Beyond the 3, **`TerraFusion.Core/Entities/Levy/LevyEntities.cs` is an entire legacy levy
sub-domain** (all `[Key] int Id`): `TaxDistrict`, `TaxCode`, `LevyRate`, `LevyScenario`,
`ImportLog`, `ExportLog`, `ComplianceCheck`, `DataQualityScore`, `ValidationRule`,
`LevyAuditRecord`. It parallels the modern `TerraFusion.Levy` module.

## Shared signature of all 3 collisions
| | Core (`Entities/Levy/…`, main DB) | Levy module (`Models/…`, separate Levy DB) |
|---|---|---|
| **PK** | `int Id` (`[Key]`) | `Guid Id` |
| **CountyId** | (Levy uses `string`; Core LevyCertification uses `Guid`) | `string CountyId` |
| **Shape** | lightweight computed/summary | rich statutory system-of-record |
| **Extras** | none | `[Table(...)]`, attestation, references, AI/quantum fields, full audit |

## LevyCertification — field-level diff (the decisive one)
| Aspect | Core `Entities/LevyCertification.cs` | Levy `Models/LevyCertification.cs` |
|---|---|---|
| PK | `int Id` | `Guid Id` |
| CountyId | `Guid` | `string` |
| Model intent | **calculation-result summary** (~24 fields: PriorYearLevy, RequestedLevy, CertifiedLevy, AssessedValue, limits, `WasReduced`, `Status` string) | **authoritative statutory record** (AssessedValueRegular, LimitFactor, HighestLawfulLevy, BankedCapacityUsed/Remaining, NewConstructionLevy, Annexation/Refund/LidLift amounts) |
| Provenance/attestation | none | `AttestationEnvelope/Hash/CorrelationId`, `CalculationSnapshot`, `IpdReferenceId`, `StateSchoolReferenceId`, `SupersededByCertificationId`, `SupersededAt` |
| Status | `string Status` | `enum LevyCertificationStatus` |
| Audit | `CreatedBy/CreatedAt` | `CreatedAt/By` + `UpdatedAt/By` |
| Table | convention `LevyCertifications` (main DB) | `[Table("LevyCertifications")]` (Levy DB) |

**Reading:** these are not two versions of one schema — they are a **legacy summary** (Core)
vs a **modern statutory system-of-record with attestation/provenance** (Levy). PK and CountyId
types are incompatible; no shared migration.

`LevyRate` / `LevyScenario` follow the identical pattern (Core `int`-PK simple; Levy `Guid`-PK
rich with AI/`QuantumOptimized`/`ConfidenceScore` fields).

## Decision implication (frames, does not choose)
The field evidence strongly narrows the SSOT options from `F14-…-PLAN.md` §3:
- **Levy module = modern system-of-record** (Guid-PK, attestation, separate DB) → topology home **TerraFusion-Dais**.
- **Core `Entities/Levy/*` = legacy lineage** (int-PK summary) → strongest fits are **Option D (deprecate Core levy)** or **Option C (Core becomes a read projection populated via contract)**. "Keep-split by design" (A) is hard to justify given the incompatible PKs and the attestation gap.
- This is an **owner/product ratification call**, but the field-level facts now make D/C the evidence-supported front-runners and A/dual-write the disfavored ones.

## Register status
`F14-…-PLAN.md` §2 "confirm field divergence" → **CONFIRMED** here at field level for all 3
collisions. F14 is now fully ratification-ready: the owner can pick the SSOT path on concrete
schema facts, not on a label. No code; no lock release.
