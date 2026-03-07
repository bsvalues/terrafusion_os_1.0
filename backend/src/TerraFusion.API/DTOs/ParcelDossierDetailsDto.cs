namespace TerraFusion.API.DTOs;

/// <summary>
/// CX-23/CX-24: Parcel Dossier v1 "details" — deeper view than CX-22's composed summary.
/// Adds: parameterized limits, PII redaction, note-headers-only (no content),
/// cost breakdown categories, CAMA-ready placeholders, selective includes.
/// County-isolated: cross-county → 404 (anti-enumeration).
///
/// CX-24: All section fields are nullable. When ?include= is specified,
/// non-requested sections are serialized as null.
/// Default (no include param) = all sections populated.
/// CX-24: Added CorrelationId, Links for trace/evidence.
/// </summary>
public sealed record ParcelDossierDetailsDto(
    string ParcelId,
    Guid CountyId,
    DateTime GeneratedAt,
    bool PiiRedacted,
    PropertyDetails? Property,
    ValuationSignals? Valuation,
    LevyDetails? Levies,
    NoteHeaders? Notes
)
{
    /// <summary>
    /// CX-24: Request correlation ID for audit-trail lookups.
    /// Echoes the inbound X-Correlation-ID header when present,
    /// otherwise server-generated with "dossier-" prefix.
    /// </summary>
    public string? CorrelationId { get; init; }

    /// <summary>
    /// CX-24: Stable resource links for evidence navigation.
    /// </summary>
    public DossierResourceLinks? Links { get; init; }
}

public sealed record PropertyDetails(
    Guid PropertyId,
    string ParcelNumber,
    string Address,
    string? PropertyType,
    int? YearBuilt,
    decimal AssessedValue,
    decimal LandValue,
    decimal ImprovementValue,
    decimal MarketValue,
    int TaxYear,
    DateTime AssessmentDate,
    // CAMA-ready placeholders — null until Property entity gains these columns
    string? ClassCode,
    string? UseCode,
    string? Neighborhood
);

public sealed record ValuationSignals(
    decimal TotalValue,
    int CategoryCount,
    List<ValuationCategory> Categories
);

public sealed record ValuationCategory(
    string Name,
    decimal Amount,
    double Percentage
);

public sealed record LevyDetails(
    int LevyCountTotal,
    int LevyCountReturned,
    List<LevyEntry> Recent
);

public sealed record LevyEntry(
    Guid TaxLevyId,
    string TaxingDistrict,
    decimal TaxRate,
    decimal LevyAmount,
    int TaxYear,
    string Purpose,
    DateTime EffectiveDate
);

public sealed record NoteHeaders(
    int NoteCountTotal,
    int NoteCountReturned,
    List<NoteHeaderItem> Items
);

public sealed record NoteHeaderItem(
    Guid NoteId,
    string NoteType,
    DateTime CreatedAt,
    string AuthorKind
);

/// <summary>
/// CX-24: Stable resource links for dossier evidence navigation.
/// All paths are relative API routes — no host/scheme, safe for any deployment.
/// </summary>
public sealed record DossierResourceLinks(
    string Self,
    string? Summary,
    string? Details,
    string Notes,
    string Casefile
);
