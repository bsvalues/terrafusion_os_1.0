using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface IRollupService
{
    /// <summary>
    /// Rollup metrics by stratum: city | type | vintage | grade.
    /// Each stratum row joins CamaCharacteristics parcel counts with
    /// EquityMetricService sale-ratio metrics.
    /// </summary>
    Task<RollupResponseDto> GetRollupAsync(
        Guid countyId, int taxYear, string by, CancellationToken ct = default);
}
