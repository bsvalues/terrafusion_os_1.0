using TerraFusion.CurrentUse.Domain.Rollback;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

public class CurrentUseAlphaRollbackTests
{
    private readonly CurrentUseAlphaRollbackEngine _engine = new();

    [Fact]
    public void FarmAg_After_Cutover_Uses_Four_Years()
    {
        var years = _engine.DetermineRollbackYears(
            "FARM_AND_AGRICULTURAL",
            new DateOnly(2025, 9, 1),
            taxYearOfRemoval: 2026);

        Assert.Equal(4, years.Length);
    }

    [Fact]
    public void FarmAg_Before_Cutover_Uses_Seven_Years()
    {
        var years = _engine.DetermineRollbackYears(
            "FARM_AND_AGRICULTURAL",
            new DateOnly(2025, 8, 31),
            taxYearOfRemoval: 2026);

        Assert.Equal(7, years.Length);
    }

    [Theory]
    [InlineData("OPEN_SPACE")]
    [InlineData("TIMBER_LAND")]
    [InlineData("DESIGNATED_FORESTLAND")]
    public void Non_FarmAg_Always_Uses_Seven_Years(string classification)
    {
        var years = _engine.DetermineRollbackYears(
            classification,
            new DateOnly(2025, 9, 15),
            taxYearOfRemoval: 2026);

        Assert.Equal(7, years.Length);
    }

    [Fact]
    public void Calculate_Returns_Correct_Engine_Version()
    {
        var result = _engine.Calculate(
            "FARM_AND_AGRICULTURAL",
            new DateOnly(2026, 1, 1),
            taxYearOfRemoval: 2026);

        Assert.Equal("CU_ROLLBACK_ENGINE_v2026_03_01", result.CalculationVersion);
        Assert.Equal("2025.09.01", result.PolicyVersion);
    }

    [Fact]
    public void Calculate_FarmAg_Rollback_Years_Are_Contiguous()
    {
        var result = _engine.Calculate(
            "FARM_AND_AGRICULTURAL",
            new DateOnly(2026, 3, 1),
            taxYearOfRemoval: 2026);

        Assert.Equal(4, result.RollbackYears.Length);
        for (int i = 1; i < result.RollbackYears.Length; i++)
            Assert.Equal(result.RollbackYears[i - 1] + 1, result.RollbackYears[i]);
    }
}
