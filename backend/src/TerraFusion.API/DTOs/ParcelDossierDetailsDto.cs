using TerraFusion.Core.Services;

namespace TerraFusion.API.DTOs;

/// <summary>
/// Parcel Dossier v1 ("details") — richer composition view.
/// Read-only. County-isolated. No PII (OwnerSSN excluded, piiRedacted = true).
/// </summary>
public sealed record ParcelDossierDetailsDto
{
    public string ParcelId { get; init; } = string.Empty;
    public Guid CountyId { get; init; }
    public bool PiiRedacted { get; init; } = true;

    public PropertyDetails? Property { get; init; }
    public ValuationSignals? Valuation { get; init; }
    public CostBreakdownDto? CostBreakdown { get; init; }
    public LevyDetails? Levy { get; init; }
    public NoteHeaders? Notes { get; init; }
    public DateTime GeneratedAtUtc { get; init; }
}

/// <summary>
/// Expanded property core fields — situs-safe, no PII.
/// Fields not yet in schema return null with documented reason.
/// </summary>
public sealed record PropertyDetails
{
    public Guid Id { get; init; }
    public string ParcelNumber { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string? OwnerName { get; init; }
    public string? PropertyType { get; init; }
    public int? YearBuilt { get; init; }

    // Schema-expansion placeholders — null until CAMA integration lands
    public string? ClassCode { get; init; }
    public string? UseCode { get; init; }
    public string? Neighborhood { get; init; }
    public string? LandSummary { get; init; }
    public string? BuildingSummary { get; init; }
}

/// <summary>
/// Read-only assessed value breakdown + year.
/// No internal model weights or raw comps.
/// </summary>
public sealed record ValuationSignals
{
    public decimal AssessedValue { get; init; }
    public decimal LandValue { get; init; }
    public decimal ImprovementValue { get; init; }
    public decimal MarketValue { get; init; }
    public DateTime AssessmentDate { get; init; }
    public int TaxYear { get; init; }
}

/// <summary>
/// Levy details — county-scoped history with total count.
/// </summary>
public sealed record LevyDetails
{
    public int LevyCountTotal { get; init; }
    public List<LevyHistorySummary> History { get; init; } = new();
}

/// <summary>
/// Latest N note headers (metadata only, no bodies).
/// Prevents PII leakage through note content.
/// </summary>
public sealed record NoteHeaders
{
    public int NoteCount { get; init; }
    public List<NoteHeaderItem> Latest { get; init; } = new();
}

/// <summary>
/// Single note header — id, timestamp, type, author classification.
/// Content excluded by design (PII risk).
/// </summary>
public sealed record NoteHeaderItem
{
    public Guid NoteId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string NoteType { get; init; } = string.Empty;
    public string AuthorKind { get; init; } = string.Empty; // "system" | "user"
}
