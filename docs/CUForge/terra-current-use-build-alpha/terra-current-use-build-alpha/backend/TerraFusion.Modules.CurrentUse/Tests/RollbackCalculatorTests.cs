using TerraFusion.Modules.CurrentUse.Domain;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class RollbackCalculatorTests
{
    [Fact]
    public void FarmAg_After_Cutover_Uses_Four_Years()
    {
        var calculator = new RollbackCalculator();

        var years = calculator.GetRollbackYears(
            "FARM_AND_AGRICULTURAL",
            new DateOnly(2026, 3, 15),
            2026);

        Assert.Equal(new[] { 2022, 2023, 2024, 2025 }, years);
    }

    [Fact]
    public void OpenSpace_Uses_Seven_Years()
    {
        var calculator = new RollbackCalculator();

        var years = calculator.GetRollbackYears(
            "OPEN_SPACE",
            new DateOnly(2026, 3, 15),
            2026);

        Assert.Equal(7, years.Count);
    }
}
