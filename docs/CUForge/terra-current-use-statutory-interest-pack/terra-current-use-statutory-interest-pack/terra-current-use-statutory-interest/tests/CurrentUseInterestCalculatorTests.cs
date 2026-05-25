using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Interest;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseInterestCalculatorTests
{
    [Fact]
    public async Task Interest_Accrues_From_April_30_To_Removal_Date()
    {
        var calculator = new CurrentUseInterestCalculator(new CurrentUseInterestRateProvider());

        var result = await calculator.CalculateAsync(
            new CurrentUseInterestAccrualInputDto(
                Guid.NewGuid(),
                2025,
                2671.75m,
                new DateOnly(2026, 3, 15),
                null),
            CancellationToken.None);

        Assert.Equal(new DateOnly(2025, 4, 30), result.AccrualStartDate);
        Assert.True(result.InterestTotal > 0);
        Assert.NotEmpty(result.Segments);
    }

    [Fact]
    public async Task No_Interest_When_Removal_Before_Due_Date()
    {
        var calculator = new CurrentUseInterestCalculator(new CurrentUseInterestRateProvider());

        var result = await calculator.CalculateAsync(
            new CurrentUseInterestAccrualInputDto(
                Guid.NewGuid(),
                2025,
                2671.75m,
                new DateOnly(2025, 4, 1),
                null),
            CancellationToken.None);

        Assert.Equal(0m, result.InterestTotal);
    }
}
