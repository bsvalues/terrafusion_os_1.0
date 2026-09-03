using TerraFusion.Core.Import;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Persists the immutable county-bound validation result for one admitted CSV batch.
/// </summary>
public interface ICountyCsvUploadRowStager
{
    public const string ContractId = "wal.county-upload.durable-row-staging.v1";

    Task<CountyCsvUploadRowStagingSummary> StageAsync(
        CountyCsvUploadRowStagingRequest request,
        CancellationToken cancellationToken = default);
}
