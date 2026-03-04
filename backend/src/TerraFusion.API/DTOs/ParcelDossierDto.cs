using TerraFusion.Core.Services;

namespace TerraFusion.API.DTOs;

/// <summary>
/// Parcel Dossier v0 — composition view aggregating property, cost, levy, and notes.
/// Read-only. County-isolated. No PII (OwnerSSN excluded).
/// </summary>
public sealed record ParcelDossierDto
{
    public string ParcelId { get; init; } = string.Empty;
    public Guid CountyId { get; init; }
    public ParcelPropertySummary? Property { get; init; }
    public CostBreakdownDto? CostBreakdown { get; init; }
    public List<LevyHistorySummary> LevyHistory { get; init; } = new();
    public DossierNotesSummary Notes { get; init; } = new();
    public DateTime GeneratedAtUtc { get; init; }
}

public sealed record ParcelPropertySummary
{
    public Guid Id { get; init; }
    public string ParcelNumber { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string? OwnerName { get; init; }
    public string? PropertyType { get; init; }
    public int? YearBuilt { get; init; }
    public decimal AssessedValue { get; init; }
    public decimal LandValue { get; init; }
    public decimal ImprovementValue { get; init; }
    public decimal MarketValue { get; init; }
    public DateTime AssessmentDate { get; init; }
    public int TaxYear { get; init; }
}

public sealed record LevyHistorySummary
{
    public Guid TaxLevyId { get; init; }
    public string TaxingDistrict { get; init; } = string.Empty;
    public double TaxRate { get; init; }
    public double LevyAmount { get; init; }
    public int TaxYear { get; init; }
    public string Purpose { get; init; } = string.Empty;
    public DateTime EffectiveDate { get; init; }
}

public sealed record DossierNotesSummary
{
    public int NoteCount { get; init; }
    public DateTime? LatestNoteAt { get; init; }
}
