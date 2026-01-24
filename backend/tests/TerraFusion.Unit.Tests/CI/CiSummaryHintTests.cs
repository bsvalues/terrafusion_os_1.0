using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.CI;

public class CiSummaryHintTests
{
    [Theory]
    [InlineData("drift_guard")]
    [InlineData("Drift_Guard")]
    [InlineData("drift-guard")]
    [InlineData("drift guard")]
    public void Decide_PrimaryIsDriftGuard_EmitsHint(string jobName)
    {
        var hint = CiFailureHint.Decide(jobName);

        hint.Should().Be(CiFailureHint.DriftGuardHint);
    }

    [Theory]
    [InlineData("build-backend")]
    [InlineData("build-frontend")]
    [InlineData("code-quality")]
    [InlineData("quality-gate")]
    [InlineData("drift_sentinel")]
    [InlineData("guard_only")]
    public void Decide_PrimaryIsNotDriftGuard_EmitsNothing(string jobName)
    {
        var hint = CiFailureHint.Decide(jobName);

        hint.Should().BeNull();
    }

    [Fact]
    public void Decide_PrimaryIsNullOrWhitespace_EmitsNothing()
    {
        CiFailureHint.Decide(null).Should().BeNull();
        CiFailureHint.Decide(string.Empty).Should().BeNull();
        CiFailureHint.Decide("   ").Should().BeNull();
    }
}
