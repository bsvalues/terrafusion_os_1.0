using TerraFusion.Modules.CurrentUse.Domain.Rollback;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Services;

public interface ICurrentUseAlphaService
{
    Task<CurrentUseAlphaOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken cancellationToken);
    Task<CurrentUseAlphaRollbackResultDto> CalculateRollbackAsync(CurrentUseAlphaRollbackRequestDto request, CancellationToken cancellationToken);
}

public sealed class CurrentUseAlphaService : ICurrentUseAlphaService
{
    private readonly CurrentUseAlphaRollbackEngine _engine;

    public CurrentUseAlphaService(CurrentUseAlphaRollbackEngine engine)
    {
        _engine = engine;
    }

    public Task<CurrentUseAlphaOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new CurrentUseAlphaOverviewDto(
            parcelId,
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Sample Owner",
            "FARM_AND_AGRICULTURAL",
            "OWNER_WITHDRAWAL_REQUESTED",
            18.42m));
    }

    public Task<CurrentUseAlphaRollbackResultDto> CalculateRollbackAsync(
        CurrentUseAlphaRollbackRequestDto request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(_engine.Calculate(request));
    }
}
