using TerraFusion.Modules.CurrentUse.Domain.Rollback;
using TerraFusion.Modules.CurrentUse.Dto;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseAlphaRollbackTests
{
    [Fact]
    public void FarmAg_After_Cutover_Uses_Four_Years()
    {
        var engine = new CurrentUseAlphaRollbackEngine();

        var result = engine.Calculate(new CurrentUseAlphaRollbackRequestDto(
            Guid.NewGuid(),
            "FARM_AND_AGRICULTURAL",
            new DateOnly(2026, 3, 15),
            2026));

        Assert.Equal(4, result.RollbackYears.Count);
    }
}
