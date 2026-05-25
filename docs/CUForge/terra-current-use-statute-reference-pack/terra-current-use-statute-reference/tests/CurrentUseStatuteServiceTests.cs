
using TerraFusion.Modules.CurrentUse.Statutes;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseStatuteServiceTests
{
    [Fact]
    public async Task Washington_References_Return()
    {
        var service = new CurrentUseStatuteService();

        var refs = await service.GetReferencesAsync(
            "WA",
            CancellationToken.None);

        Assert.NotEmpty(refs);
    }

    [Fact]
    public async Task Rule_Provenance_Returns()
    {
        var service = new CurrentUseStatuteService();

        var rules = await service.GetRuleProvenanceAsync(
            CancellationToken.None);

        Assert.NotEmpty(rules);
    }
}
