using TerraFusion.Core.Counties;

namespace TerraFusion.Core.Import;

public enum CountyCsvUploadPromotionDisposition
{
    Promoted,
    Duplicate,
    Denied,
}

public enum CountyCsvUploadPromotionDenialCode
{
    None,
    InvalidAuthority,
    BatchNotFound,
    UnsupportedDataset,
    StagingNotFound,
    InvalidStaging,
    NoPromotableRows,
}

public sealed record CountyCsvUploadPromotionRequest(
    AuthenticatedCanonicalCountyContextResult? CountyContext,
    Guid BatchId);

public sealed record CountyCsvUploadPromotionSummary(
    Guid BatchId,
    Guid CountyId,
    string ContractId,
    int PromotedRowCount,
    string LatestSaleDate,
    DateTimeOffset PromotedAtUtc);

public sealed record CountyCsvUploadPromotionResult(
    CountyCsvUploadPromotionDisposition Disposition,
    CountyCsvUploadPromotionDenialCode DenialCode,
    CountyCsvUploadPromotionSummary? Promotion);

public sealed record CountyCsvUploadPromotionAvailability(
    Guid CountyId,
    string ContractId,
    int PromotedSales,
    string? LatestSaleDate,
    bool SalesReviewAvailable);

public interface ICountyCsvUploadPromoter
{
    public const string ContractId = "wal.county-upload.terraforge-sales-promotion.v1";

    Task<CountyCsvUploadPromotionResult> PromoteAsync(
        CountyCsvUploadPromotionRequest request,
        CancellationToken cancellationToken = default);

    Task<CountyCsvUploadPromotionAvailability> GetAvailabilityAsync(
        AuthenticatedCanonicalCountyContextResult countyContext,
        CancellationToken cancellationToken = default);
}
