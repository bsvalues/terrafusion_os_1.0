using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Interest;

public interface ICurrentUseInterestCalculator
{
    Task<CurrentUseInterestAccrualResultDto> CalculateAsync(
        CurrentUseInterestAccrualInputDto input,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseInterestCalculator : ICurrentUseInterestCalculator
{
    private readonly ICurrentUseInterestRateProvider _rateProvider;

    public CurrentUseInterestCalculator(ICurrentUseInterestRateProvider rateProvider)
    {
        _rateProvider = rateProvider;
    }

    public async Task<CurrentUseInterestAccrualResultDto> CalculateAsync(
        CurrentUseInterestAccrualInputDto input,
        CancellationToken cancellationToken)
    {
        var startDate = input.TaxDueDateOverride ?? CurrentUseInterestRules.GetDefaultAccrualStartDate(input.TaxYear);
        var endDate = input.RemovalDate;

        if (endDate <= startDate || input.AdditionalTax <= 0)
        {
            return new CurrentUseInterestAccrualResultDto(
                input.TaxYear,
                input.AdditionalTax,
                startDate,
                endDate,
                0m,
                Array.Empty<CurrentUseInterestAccrualSegmentDto>());
        }

        var rates = await _rateProvider.GetRatesForAccrualPeriodAsync(
            input.CountyId,
            input.TaxYear,
            startDate,
            endDate,
            cancellationToken);

        var segments = new List<CurrentUseInterestAccrualSegmentDto>();

        foreach (var rate in rates)
        {
            var segmentStart = Max(startDate, rate.EffectiveStartDate);
            var segmentEnd = Min(endDate, rate.EffectiveEndDate ?? endDate);
            var dayCount = CurrentUseInterestRules.CountDaysInclusiveStartExclusiveEnd(segmentStart, segmentEnd);

            if (dayCount <= 0)
            {
                continue;
            }

            var interest = input.AdditionalTax * rate.AnnualRate * dayCount / 365m;

            segments.Add(new CurrentUseInterestAccrualSegmentDto(
                input.TaxYear,
                segmentStart,
                segmentEnd,
                dayCount,
                rate.AnnualRate,
                RoundCurrency(interest),
                $"{input.AdditionalTax} × {rate.AnnualRate} × {dayCount} / 365"));
        }

        return new CurrentUseInterestAccrualResultDto(
            input.TaxYear,
            input.AdditionalTax,
            startDate,
            endDate,
            RoundCurrency(segments.Sum(x => x.InterestAmount)),
            segments);
    }

    private static DateOnly Max(DateOnly a, DateOnly b) => a > b ? a : b;
    private static DateOnly Min(DateOnly a, DateOnly b) => a < b ? a : b;

    private static decimal RoundCurrency(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }
}
