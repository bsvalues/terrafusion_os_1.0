/*
 * Data Quality DTOs
 *
 * Output shape for /costforge/analytics/data-quality/assess.
 * Each issue records category, affected field, count, severity, and a
 * parcel sample so the appraiser can drill in and inspect the bad rows.
 *
 * @version 1.0.0 - Track 4 (CostForge Benton Method v2)
 */

namespace TerraFusion.Core.DTOs;

public record DataQualityIssueDto(
    string Category,
    string Field,
    int AffectedCount,
    string Description,
    string Severity,                       // "critical" | "warning" | "info"
    IReadOnlyList<string> ParcelSample     // up to 5 example parcel IDs
);

public record DataQualityAssessmentDto(
    Guid CountyId,
    int TaxYear,
    int TotalParcels,
    IReadOnlyList<DataQualityIssueDto> Issues,
    DateTime GeneratedAt
);
