using System;

namespace TerraFusion.Core.Sync.PacsExemption;

/// <summary>
/// EXEMPTION-FACT-SEAL: one current-year exemption fact at the ACTIVE
/// supplement (MAX sup_num per (prop_id, exmpt_tax_yr)). Grain =
/// parcel + owner + year + type.
/// </summary>
public sealed record PacsSourceExemption(
    int PropId,
    long OwnerId,
    short ExmptTaxYr,
    short SupNum,
    string ExmptTypeCd,
    string? ExmptSubtypeCd,
    decimal? ExemptionPct,
    DateTime? EffectiveDt,
    DateTime? TerminationDt,
    short? QualifyYr,
    short? OwnerTaxYr,
    short? EffectiveTaxYr);

/// <summary>One PACS exmpt_type dictionary row.</summary>
public sealed record PacsSourceExemptionType(string ExmptTypeCd, string? ExmptDesc);
