using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 2B: canonical special-assessment agency dictionary from
/// PACS <c>special_assessment_agency</c>. These are the non-ad-valorem assessment
/// authorities (e.g. Noxious Weed, Mosquito, Conservation District, Irrigation,
/// Diking). County-isolated. The agency is the assessment-bill backing dimension,
/// the analogue of tax_district for levy bills.
/// </summary>
public sealed class TfAssessmentAgency
{
    public Guid TfAssessmentAgencyId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    public int AgencyId { get; set; }
    public string? AssessmentCd { get; set; }
    public string? AssessmentTypeCd { get; set; }
    public string? AssessmentDescription { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
