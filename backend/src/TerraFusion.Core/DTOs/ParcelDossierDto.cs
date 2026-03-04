namespace TerraFusion.Core.DTOs;

/// <summary>
/// CX-22: Composed parcel dossier — read-only view combining
/// property core, CostForge summary, levy history, and notes.
/// County-isolated: cross-county requests receive 404.
/// </summary>
public class ParcelDossierDto
{
    public string ParcelId { get; set; } = string.Empty;
    public Guid CountyId { get; set; }
    public string CountyName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    // ── Property Core ────────────────────────────────────────────
    public ParcelDossierPropertyDto Property { get; set; } = new();

    // ── CostForge Summary (nullable — analysis may not exist) ───
    public ParcelDossierCostForgeSummaryDto? CostForge { get; set; }

    // ── Levy History Summary ─────────────────────────────────────
    public ParcelDossierLevySummaryDto Levies { get; set; } = new();

    // ── Notes Summary ────────────────────────────────────────────
    public ParcelDossierNotesSummaryDto Notes { get; set; } = new();
}

public class ParcelDossierPropertyDto
{
    public Guid PropertyId { get; set; }
    public string ParcelNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? PropertyType { get; set; }
    public int? YearBuilt { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal MarketValue { get; set; }
    public int TaxYear { get; set; }
    public DateTime AssessmentDate { get; set; }
}

public class ParcelDossierCostForgeSummaryDto
{
    public decimal TotalCost { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public double ConfidenceScore { get; set; }
    public DateTime AnalysisDate { get; set; }
    public string AnalysisMethod { get; set; } = string.Empty;
    public int ComponentCount { get; set; }
}

public class ParcelDossierLevySummaryDto
{
    public int TotalRecords { get; set; }
    public List<ParcelDossierLevyEntryDto> Recent { get; set; } = new();
}

public class ParcelDossierLevyEntryDto
{
    public Guid TaxLevyId { get; set; }
    public string TaxingDistrict { get; set; } = string.Empty;
    public decimal TaxRate { get; set; }
    public decimal LevyAmount { get; set; }
    public int TaxYear { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; }
}

public class ParcelDossierNotesSummaryDto
{
    public int TotalCount { get; set; }
    public List<ParcelDossierNoteEntryDto> Recent { get; set; } = new();
}

public class ParcelDossierNoteEntryDto
{
    public Guid NoteId { get; set; }
    public string NoteType { get; set; } = string.Empty;
    public string Preview { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
