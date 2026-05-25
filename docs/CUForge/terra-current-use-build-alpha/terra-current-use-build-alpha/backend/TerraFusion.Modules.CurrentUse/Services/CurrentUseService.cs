using TerraFusion.Modules.CurrentUse.Domain;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Services;

public interface ICurrentUseService
{
    Task<CurrentUseOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken cancellationToken);
    Task<RollbackCalculationResultDto> CalculateRollbackAsync(RollbackCalculationRequestDto request, CancellationToken cancellationToken);
}

public sealed class CurrentUseService : ICurrentUseService
{
    private readonly RollbackCalculator _calculator;

    public CurrentUseService(RollbackCalculator calculator)
    {
        _calculator = calculator;
    }

    public Task<CurrentUseOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new CurrentUseOverviewDto(
            parcelId,
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Sample Owner",
            "FARM_AND_AGRICULTURAL",
            "OWNER_WITHDRAWAL_REQUESTED",
            18.42m,
            0.76m,
            RollbackCalculator.PolicyVersion));
    }

    public Task<RollbackCalculationResultDto> CalculateRollbackAsync(
        RollbackCalculationRequestDto request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(_calculator.Calculate(request));
    }
}
