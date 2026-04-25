using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface IBentonCustomMetricService
{
    Task<DecileAnalysisDto> GetDecilesAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);

    Task<StratifiedCodDto> GetStratifiedCodAsync(
        Guid countyId, int taxYear, string stratum, string? segment, string splitBy, CancellationToken ct = default);

    Task<ConditionBiasDto> GetConditionBiasAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);

    Task<SegmentDriftDto> GetSegmentDriftAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);

    Task<GradeDriftDto> GetGradeDriftAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);
}
