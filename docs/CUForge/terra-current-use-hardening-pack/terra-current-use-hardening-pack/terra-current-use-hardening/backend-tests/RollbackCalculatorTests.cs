using TerraFusion.Modules.CurrentUse.Domain;
using TerraFusion.Modules.CurrentUse.Domain.Rollback;
using TerraFusion.Modules.CurrentUse.Dto;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class RollbackCalculatorTests
{
    [Fact]
    public void FarmAg_After_2025_09_01_Uses_Four_Years()
    {
        var years = RollbackRules.DetermineRollbackYearCount(
            ClassificationType.FarmAndAgricultural,
            new DateOnly(2026, 3, 15));

        Assert.Equal(4, years);
    }

    [Fact]
    public void OpenSpace_Uses_Seven_Years()
    {
        var years = RollbackRules.DetermineRollbackYearCount(
            ClassificationType.OpenSpace,
            new DateOnly(2026, 3, 15));

        Assert.Equal(7, years);
    }

    [Fact]
    public void Timber_Uses_Seven_Years()
    {
        var years = RollbackRules.DetermineRollbackYearCount(
            ClassificationType.TimberLand,
            new DateOnly(2026, 3, 15));

        Assert.Equal(7, years);
    }

    [Fact]
    public void Qualifying_Voluntary_Withdrawal_Suppresses_Penalty()
    {
        var calculator = new RollbackCalculator();

        var result = calculator.Calculate(BuildInput(
            removalType: RemovalType.OwnerVoluntaryWithdrawal,
            penaltySuppressionReason: PenaltySuppressionReason.QualifyingVoluntaryWithdrawal,
            statutoryExceptionReason: StatutoryExceptionReason.None));

        Assert.False(result.PenaltyApplied);
        Assert.Equal(0m, result.PenaltyAmount);
    }

    [Fact]
    public void No_Suppression_Applies_Penalty()
    {
        var calculator = new RollbackCalculator();

        var result = calculator.Calculate(BuildInput(
            removalType: RemovalType.AssessorInitiatedRemoval,
            penaltySuppressionReason: null,
            statutoryExceptionReason: StatutoryExceptionReason.None));

        Assert.True(result.PenaltyApplied);
        Assert.True(result.PenaltyAmount > 0m);
    }

    [Fact]
    public void Statutory_Exception_Zeros_Total_Due()
    {
        var calculator = new RollbackCalculator();

        var result = calculator.Calculate(BuildInput(
            removalType: RemovalType.ExemptTransferRemoval,
            penaltySuppressionReason: null,
            statutoryExceptionReason: StatutoryExceptionReason.NaturalDisaster));

        Assert.True(result.StatutoryExceptionApplied);
        Assert.Equal(0m, result.TotalDue);
    }

    [Fact]
    public void Missing_Year_Data_Does_Not_Crash()
    {
        var calculator = new RollbackCalculator();

        var input = BuildInput(
            removalType: RemovalType.AssessorInitiatedRemoval,
            penaltySuppressionReason: null,
            statutoryExceptionReason: StatutoryExceptionReason.None);

        var modified = input with
        {
            CurrentUseAssessedValuesByYear = input.CurrentUseAssessedValuesByYear
                .Where(x => x.TaxYear != 2023)
                .ToArray()
        };

        var result = calculator.Calculate(modified);

        Assert.Contains(result.Explanation, x => x.Label.Contains("Skipped year"));
    }

    private static RollbackCalculationInputDto BuildInput(
        RemovalType removalType,
        PenaltySuppressionReason? penaltySuppressionReason,
        StatutoryExceptionReason? statutoryExceptionReason)
    {
        return new RollbackCalculationInputDto(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            new DateOnly(2026, 3, 15),
            2026,
            ClassificationType.FarmAndAgricultural,
            removalType,
            new[]
            {
                new TaxYearValueDto(2022, 39000m),
                new TaxYearValueDto(2023, 40500m),
                new TaxYearValueDto(2024, 41750m),
                new TaxYearValueDto(2025, 42500m),
            },
            new[]
            {
                new TaxYearValueDto(2022, 280000m),
                new TaxYearValueDto(2023, 295000m),
                new TaxYearValueDto(2024, 307000m),
                new TaxYearValueDto(2025, 318000m),
            },
            new[]
            {
                new LevyRateDto(2022, 10.1m),
                new LevyRateDto(2023, 9.95m),
                new LevyRateDto(2024, 9.8m),
                new LevyRateDto(2025, 9.7m),
            },
            new[]
            {
                new InterestRateDto(2022, 0.12m),
                new InterestRateDto(2023, 0.12m),
                new InterestRateDto(2024, 0.12m),
                new InterestRateDto(2025, 0.12m),
            },
            penaltySuppressionReason,
            statutoryExceptionReason,
            null,
            null,
            "unit.test@county.gov");
    }
}
