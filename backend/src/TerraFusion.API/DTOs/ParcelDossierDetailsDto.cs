namespace TerraFusion.API.DTOs;

/// <summary>
/// CX-23: Parcel Dossier v1 "details" — deeper view than CX-22's composed summary.
/// Adds: parameterized limits, PII redaction, note-headers-only (no content),
/// cost breakdown categories, CAMA-ready placeholders.
/// County-isolated: cross-county → 404 (anti-enumeration).
/// </summary>
public sealed record ParcelDossierDetailsDto(
    string ParcelId,
    Guid CountyId,
    DateTime GeneratedAt,
    bool PiiRedacted,
    PropertyDetails Property,
    ValuationSignals? Valuation,
    LevyDetails Levies,
    NoteHeaders Notes
);

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
