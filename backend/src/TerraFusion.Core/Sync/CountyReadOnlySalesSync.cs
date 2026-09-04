using TerraFusion.Core.Counties;
using TerraFusion.Core.PACS;

namespace TerraFusion.Core.Sync;

/// <summary>
/// Marker for an adapter that reads an external county system through a mechanically enforced
/// read-only connection. Seeded and in-process development adapters intentionally do not qualify.
/// </summary>
public interface IExternalReadOnlyPacsAdapter
{
    /// <summary>
    /// Confirms that the adapter's configured endpoint is the exact registered county source.
    /// Implementations must not return or log credential material.
    /// </summary>
    bool MatchesSource(string server, string database);

    /// <summary>
    /// Verifies against the connected database principal that the source account has no
    /// effective table DML permission. ApplicationIntent=ReadOnly is routing metadata only and
    /// is never sufficient for this decision.
    /// </summary>
    Task<bool> HasServerEnforcedReadOnlyAccessAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets status from the exact connection used for Sales extraction. This must not fall back
    /// to a primary PACS database when a separate Sales source is configured.
    /// </summary>
    Task<PacsConnectionStatus> GetSalesConnectionStatusAsync(
        CancellationToken cancellationToken = default);
}

public enum CountyReadOnlySalesSyncDisposition
{
    Completed,
    Denied,
    Failed,
}

public enum CountyReadOnlySalesSyncDenialCode
{
    None,
    InvalidAuthority,
    ConnectionNotConfigured,
    ConnectionAmbiguous,
    ConnectionNotReadOnly,
    SourceWriteAuthorityDetected,
    ExternalAdapterRequired,
    SourceIdentityMismatch,
    SourceContractInvalid,
    SourceDataInvalid,
    SourceRecordLimitExceeded,
}

public sealed record CountyReadOnlySalesSyncRequest(
    AuthenticatedCanonicalCountyContextResult? CountyContext);

public sealed record CountyReadOnlySalesSyncReceipt(
    string ContractId,
    Guid ReceiptId,
    Guid CountyId,
    Guid ConnectionId,
    string SourceSystem,
    int SourceRows,
    int AddedSales,
    int UpdatedSales,
    int ExternalWrites,
    int AvailableSales,
    string? LatestSaleDate,
    int? RecommendedStudyYear,
    DateTimeOffset CompletedAtUtc);

public sealed record CountyReadOnlySalesSyncResult(
    CountyReadOnlySalesSyncDisposition Disposition,
    CountyReadOnlySalesSyncDenialCode DenialCode,
    CountyReadOnlySalesSyncReceipt? Receipt);

public sealed record CountyReadOnlySalesSyncAvailability(
    string ContractId,
    Guid CountyId,
    Guid? ConnectionId,
    bool ConnectionConfigured,
    string? SourceSystem,
    DateTimeOffset? LastSuccessfulSyncAtUtc,
    int AvailableSales,
    string? LatestSaleDate,
    int? RecommendedStudyYear,
    bool SalesReviewAvailable,
    string Status);
