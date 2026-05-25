using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Services;

public interface ICurrentUseService
{
    Task<CurrentUseOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CurrentUseEvidenceItemDto>> GetEvidenceAsync(Guid parcelId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CurrentUseTimelineEventDto>> GetTimelineAsync(Guid parcelId, CancellationToken cancellationToken);
    Task<RollbackCalculationResultDto> CalculateRollbackAsync(
        RollbackCalculationInputDto input,
        CancellationToken cancellationToken);
}
