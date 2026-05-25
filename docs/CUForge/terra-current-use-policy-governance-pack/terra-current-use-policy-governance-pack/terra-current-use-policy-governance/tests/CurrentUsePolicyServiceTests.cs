
using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Policy;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUsePolicyServiceTests
{
    [Fact]
    public async Task Resolve_Returns_Active_Policy()
    {
        var service = new CurrentUsePolicyService();

        var result = await service.ResolvePolicyAsync(
            new ResolveCurrentUsePolicyRequestDto(
                Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                new DateOnly(2026, 3, 15)),
            CancellationToken.None);

        Assert.Equal("2025.09.01", result.PolicyVersion);
    }
}
