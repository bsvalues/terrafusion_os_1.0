namespace TerraFusion.API.DTOs;

/// <summary>
/// CX-25: Dossier evidence snapshot — self-contained, hash-verifiable
/// evidence document for a parcel. Suitable for board of review,
/// audit, appeals, and regulatory handoff.
///
/// Read-only composition of existing data. No new writes.
/// County-isolated: cross-county → 404 (anti-enumeration).
/// Content hash (SHA-256) enables tamper detection.
/// </summary>
public sealed record EvidenceSnapshotDto(
    string ParcelId,
    Guid CountyId,
    DateTime SnapshotTimestamp,
    string CorrelationId,
    string ContentHash,
    EvidencePropertySummary Property,
    EvidenceValuationSummary? Valuation,
    EvidenceLevySummary Levies,
    EvidenceNoteSummary Notes,
    DossierResourceLinks Links
);

/// <summary>
/// Minimal property facts for the evidence record.
/// </summary>
public sealed record EvidencePropertySummary(
    Guid PropertyId,
    string ParcelNumber,
    string Address,
    string? PropertyType,
    decimal AssessedValue,
    decimal LandValue,
    decimal ImprovementValue,
    decimal MarketValue,
    int TaxYear,
    DateTime AssessmentDate
);

/// <summary>
/// Valuation signals at snapshot time.
/// </summary>
public sealed record EvidenceValuationSummary(
    decimal TotalValue,
    int CategoryCount
);

/// <summary>
/// Levy summary at snapshot time.
/// </summary>
public sealed record EvidenceLevySummary(
    int TotalCount,
    int IncludedCount,
    decimal TotalLevyAmount
);

/// <summary>
/// Note summary at snapshot time (no content — headers only).
/// </summary>
public sealed record EvidenceNoteSummary(
    int TotalCount,
    int IncludedCount,
    string[] NoteTypes
);
