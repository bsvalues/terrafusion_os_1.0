using FluentAssertions;
using TerraFusion.CiHints;
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

    /// <summary>
    /// Locks the project path used by ci-verified.yml to invoke the hint helper.
    /// If this test fails, update the positive guard pattern in ci.yml to match.
    /// </summary>
    [Fact]
    public void CiHints_ProjectPathContract_IsStable()
    {
        // This path is referenced by:
        // 1. ci-verified.yml (dotnet run --project ... TerraFusion.CiHints.csproj)
        // 2. ci.yml hint_drift_guard (positive guard pattern: TerraFusion.CiHints.csproj)
        const string expectedNamespace = "TerraFusion.CiHints";

        // Verify the namespace matches the expected contract
        typeof(CiFailureHint).Namespace.Should().Be(expectedNamespace);

        // Verify the assembly name follows the expected pattern (matches .csproj name)
        var assemblyName = typeof(CiFailureHint).Assembly.GetName().Name;
        assemblyName.Should().Be(expectedNamespace,
            "assembly name must match project name TerraFusion.CiHints.csproj for CI guard to detect it");
    }
}
