using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Interest;

public interface ICurrentUseInterestRateProvider
{
    Task<IReadOnlyList<CurrentUseInterestRateDto>> GetRatesForAccrualPeriodAsync(
        Guid countyId,
        int taxYear,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseInterestRateProvider : ICurrentUseInterestRateProvider
{
    public Task<IReadOnlyList<CurrentUseInterestRateDto>> GetRatesForAccrualPeriodAsync(
        Guid countyId,
        int taxYear,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken)
    {
        // Phase implementation uses a single rate per tax year.
        // Production can replace this with state/county rate history.
        IReadOnlyList<CurrentUseInterestRateDto> rates =
        [
            new CurrentUseInterestRateDto(
                Guid.NewGuid(),
                countyId,
                taxYear,
                0.12m,
                startDate,
                endDate,
                "Phase scaffold default annual statutory delinquency interest rate.",
                DateTimeOffset.UtcNow,
                "system")
        ];

        return Task.FromResult(rates);
    }
}
