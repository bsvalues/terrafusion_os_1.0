/*
 * IEquityMetricService
 *
 * Sole public surface for IAAO + Benton Method equity metric computation.
 * All CostForge v2 metric displays go through this interface.
 *
 * @version 1.0.0 - Track 1 (CostForge Benton Method v2)
 */

using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface IEquityMetricService
{
    /// <summary>
    /// Compute equity metrics for every segment within the given stratum.
    /// </summary>
    /// <param name="stratum">none | county | neighborhood | city | type | vintage | condition | grade</param>
    /// <param name="segment">Optional filter — restrict ratios to a specific segment within the stratum.</param>
    Task<IDictionary<string, EquityMetricsDto>> GetMetricsAsync(
        Guid countyId,
        int taxYear,
        string stratum,
        string? segment,
        CancellationToken ct = default);

    /// <summary>
    /// Compute metrics from a pre-built SaleRatio list. Used by other services
    /// (RollupService, BentonCustomMetricService, CalibrationService) that have
    /// already scoped the ratios.
    /// </summary>
    EquityMetricsDto ComputeFromRatios(IReadOnlyList<SaleRatio> ratios);
}
