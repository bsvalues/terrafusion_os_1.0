using Xunit;

namespace TerraFusion.Unit.SmokeTests;

public class SmokeTests
{
    [Fact]
    public void Sanity_Checks_Pass()
    {
        Assert.True(1 + 1 == 2);
        Assert.NotNull("terrafusion");
    }
}
