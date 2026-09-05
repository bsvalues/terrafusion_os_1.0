using TerraFusion.Core.Counties;
using TerraFusion.Core.Sync;

namespace TerraFusion.Core.Interfaces;

public interface ICountyReadOnlySalesSyncService
{
    public const string ContractId = "wal.county-connected.readonly-sales-sync.v1";

    Task<CountyReadOnlySalesSyncResult> SyncAsync(
        CountyReadOnlySalesSyncRequest request,
        CancellationToken cancellationToken = default);

    Task<CountyReadOnlySalesSyncAvailability> GetAvailabilityAsync(
        AuthenticatedCanonicalCountyContextResult countyContext,
        CancellationToken cancellationToken = default);
}
