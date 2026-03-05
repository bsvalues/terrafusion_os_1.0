namespace TerraFusion.Core.DTOs;

/// <summary>
/// CX-23: Enriched parcel dossier details — full CostForge breakdown,
/// configurable limits, PII-safe note headers, and selective includes.
/// County-isolated: cross-county requests receive 404.
/// </summary>
public class ParcelDossierDetailsDto
{
    public string ParcelId { get; set; } = string.Empty;
    public Guid CountyId { get; set; }
    public string CountyName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public bool PiiRedacted { get; set; } = true;

    // ── Property (expanded, PII-safe) ──────────────────────────────
    public DossierDetailPropertyDto? Property { get; set; }

    // ── Valuation Signals (extracted for semantic clarity) ──────────
    public DossierDetailValuationDto? Valuation { get; set; }

    // ── CostForge Breakdown (full hierarchy, nullable) ─────────────
    public DossierDetailCostBreakdownDto? CostBreakdown { get; set; }

    // ── Levy Details (configurable depth) ──────────────────────────
    public DossierDetailLevyDto? Levies { get; set; }

    // ── Note Headers (metadata-only, PII-safe) ─────────────────────
    public DossierDetailNotesDto? Notes { get; set; }
}

// ── Property Section ───────────────────────────────────────────────

public class DossierDetailPropertyDto
{
    public Guid PropertyId { get; set; }
    public string ParcelNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? OwnerName { get; set; }
    public string? PropertyType { get; set; }
    public int? YearBuilt { get; set; }
}

// ── Valuation Signals ──────────────────────────────────────────────

public class DossierDetailValuationDto
{
    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal MarketValue { get; set; }
    public int TaxYear { get; set; }
    public DateTime AssessmentDate { get; set; }
}

// ── CostForge Breakdown ────────────────────────────────────────────

public class DossierDetailCostBreakdownDto
{
    public decimal TotalValue { get; set; }
    public double ConfidenceScore { get; set; }
    public DateTime AnalysisDate { get; set; }
    public string AnalysisMethod { get; set; } = string.Empty;
    public List<DossierDetailCostCategoryDto> Categories { get; set; } = new();
}

public class DossierDetailCostCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
    public List<DossierDetailCostComponentDto> Components { get; set; } = new();
}

public class DossierDetailCostComponentDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Unit { get; set; } = string.Empty;
    public double Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

// ── Levy Details ───────────────────────────────────────────────────

public class DossierDetailLevyDto
{
    public int TotalCountyLevies { get; set; }
    public List<ParcelDossierLevyEntryDto> History { get; set; } = new();
}

// ── Note Headers (metadata-only) ───────────────────────────────────

public class DossierDetailNotesDto
{
    public int NoteCount { get; set; }
    public List<DossierDetailNoteHeaderDto> Headers { get; set; } = new();
}

public class DossierDetailNoteHeaderDto
{
    public Guid NoteId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string NoteType { get; set; } = string.Empty;

    /// <summary>"system" or "user" — normalized to prevent PII leakage of author names.</summary>
    public string AuthorKind { get; set; } = "user";
}
