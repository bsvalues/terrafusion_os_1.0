using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs.CanonicalTf;

/// <summary>
/// Slice B5': response payload for
/// <c>GET /api/parcels/{tfParcelId}/wsdor-roll?taxYear=...</c>.
///
/// <para>Carries the WSDOR-grade per-owner valuation breakdown for
/// one parcel/year pair, plus aggregate parcel-level sums computed
/// over the entry set. Each entry's
/// <see cref="ParcelWsdorEntry.OwnerDisplayName"/> already reflects
/// the canonical PII redaction policy (confidential rows show
/// <c>"[Confidential]"</c>); the reader does NOT re-redact.</para>
/// </summary>
public sealed record ParcelWsdorRollResponse
{
    public required Guid TfParcelId { get; init; }
    public required Guid CountyId { get; init; }
    public required short AssessmentYear { get; init; }

    public required IReadOnlyList<ParcelWsdorEntry> Entries { get; init; }

    /// <summary>Sum of per-owner <c>AssessedVal</c> across the entry set (NULLs excluded).</summary>
    public required decimal? AssessedValTotal { get; init; }

    /// <summary>Sum of per-owner <c>MarketVal</c> across the entry set (NULLs excluded).</summary>
    public required decimal? MarketValTotal { get; init; }
}

/// <summary>
/// Slice B5': one per-owner WSDOR entry for a parcel/year. Returns
/// the load-bearing valuation columns plus the owner display name.
/// </summary>
public sealed record ParcelWsdorEntry
{
    public required Guid TfAssessmentWsdorId { get; init; }
    public required Guid TfOwnerId { get; init; }

    /// <summary>Owner display name (already PII-redacted at canonical layer).</summary>
    public required string OwnerDisplayName { get; init; }

    public decimal? AssessedVal { get; init; }
    public decimal? MarketVal { get; init; }
    public decimal? AppraisedVal { get; init; }
    public decimal? TaxableClassified { get; init; }
    public decimal? TaxableNonClassified { get; init; }
    public decimal? LandTaxableClassified { get; init; }
    public decimal? LandTaxableNonClassified { get; init; }
    public decimal? ImprvTaxableClassified { get; init; }
    public decimal? ImprvTaxableNonClassified { get; init; }
    public decimal? StateValueClassified { get; init; }
    public decimal? StateValueNonClassified { get; init; }

    public string? BoeStatus { get; init; }
    public decimal? DisasterProrationPct { get; init; }
    public decimal? SnrFrzImprvHs { get; init; }
    public decimal? SnrFrzLandHs { get; init; }
}
