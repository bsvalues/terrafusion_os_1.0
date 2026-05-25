
namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseKpiDto(
    string Key,
    string Label,
    decimal Value,
    string Unit,
    string? Trend
);

public sealed record CurrentUseOperationalSummaryDto(
    Guid CountyId,
    int TotalClassifiedParcels,
    decimal TotalClassifiedAcres,
    decimal EstimatedTotalRollbackExposure,
    int ActiveMonitoringCount,
    int RemovalReviewCount,
    int AppealWindowOpenCount,
    int MissingEvidenceCount,
    IReadOnlyList<CurrentUseKpiDto> Kpis,
    DateTimeOffset GeneratedAt
);
