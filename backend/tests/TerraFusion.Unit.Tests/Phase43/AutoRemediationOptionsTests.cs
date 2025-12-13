// =============================================================================
// Phase 43: Controlled Auto-Remediation - Options Tests
// =============================================================================
// WIRING SPEC LOCK v1.0.0
// Tests for AutoRemediationOptions configuration and defaults.
// =============================================================================

using FluentAssertions;
using TerraFusion.Operations.Runbooks.Execution;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase43;

/// <summary>
/// Tests for <see cref="AutoRemediationOptions"/>.
/// Focus: Default values, immutability, configuration validation.
/// </summary>
[Trait("Phase", "43")]
[Trait("Component", "AutoRemediation")]
[Trait("Category", "UnitTest")]
public sealed class AutoRemediationOptionsTests
{
    #region Default Values Tests

    [Fact]
    public void DefaultOptions_EnableAutoRemediation_IsFalse()
    {
        // Arrange & Act
        var options = new AutoRemediationOptions();

        // Assert
        options.EnableAutoRemediation.Should().BeFalse(
            "auto-remediation must be OFF by default for safety");
    }

    [Fact]
    public void DefaultOptions_OptedInCounties_IsEmpty()
    {
        // Arrange & Act
        var options = new AutoRemediationOptions();

        // Assert
        options.OptedInCounties.Should().NotBeNull();
        options.OptedInCounties.Should().BeEmpty(
            "no counties should be opted in by default");
    }

    [Fact]
    public void DefaultOptions_AlwaysLogPolicyDecisions_IsTrue()
    {
        // Arrange & Act
        var options = new AutoRemediationOptions();

        // Assert
        options.AlwaysLogPolicyDecisions.Should().BeTrue(
            "policy decisions should always be logged for audit trail");
    }

    #endregion

    #region Configuration Tests

    [Fact]
    public void Options_WithEnableAutoRemediation_ReturnsConfiguredValue()
    {
        // Arrange & Act
        var options = new AutoRemediationOptions
        {
            EnableAutoRemediation = true
        };

        // Assert
        options.EnableAutoRemediation.Should().BeTrue();
    }

    [Fact]
    public void Options_WithOptedInCounties_ReturnsConfiguredSet()
    {
        // Arrange
        var counties = new HashSet<string> { "benton", "yakima", "king" };

        // Act
        var options = new AutoRemediationOptions
        {
            OptedInCounties = counties
        };

        // Assert
        options.OptedInCounties.Should().BeEquivalentTo(counties);
    }

    [Fact]
    public void Options_WithSingleOptedInCounty_ContainsCounty()
    {
        // Arrange & Act
        var options = new AutoRemediationOptions
        {
            OptedInCounties = new HashSet<string> { "benton" }
        };

        // Assert
        options.OptedInCounties.Should().Contain("benton");
        options.OptedInCounties.Should().HaveCount(1);
    }

    [Fact]
    public void Options_WithAlwaysLogPolicyDecisions_ReturnsConfiguredValue()
    {
        // Arrange & Act
        var options = new AutoRemediationOptions
        {
            AlwaysLogPolicyDecisions = false
        };

        // Assert
        options.AlwaysLogPolicyDecisions.Should().BeFalse();
    }

    #endregion

    #region Immutability Tests

    [Fact]
    public void Options_IsRecord_SupportsWithExpression()
    {
        // Arrange
        var original = new AutoRemediationOptions
        {
            EnableAutoRemediation = false,
            OptedInCounties = new HashSet<string> { "benton" }
        };

        // Act
        var modified = original with { EnableAutoRemediation = true };

        // Assert
        original.EnableAutoRemediation.Should().BeFalse("original should be unchanged");
        modified.EnableAutoRemediation.Should().BeTrue("modified should have new value");
    }

    [Fact]
    public void Options_OptedInCounties_IsReadOnly()
    {
        // Arrange
        var options = new AutoRemediationOptions
        {
            OptedInCounties = new HashSet<string> { "benton" }
        };

        // Act & Assert
        options.OptedInCounties.Should().BeAssignableTo<IReadOnlySet<string>>(
            "OptedInCounties should be read-only to prevent mutation");
    }

    #endregion

    #region Value Equality Tests

    [Fact]
    public void Options_WithSameValues_AreEqual()
    {
        // Arrange
        var options1 = new AutoRemediationOptions
        {
            EnableAutoRemediation = true,
            OptedInCounties = new HashSet<string> { "benton" },
            AlwaysLogPolicyDecisions = true
        };

        var options2 = new AutoRemediationOptions
        {
            EnableAutoRemediation = true,
            OptedInCounties = new HashSet<string> { "benton" },
            AlwaysLogPolicyDecisions = true
        };

        // Act & Assert
        options1.Should().BeEquivalentTo(options2);
    }

    [Fact]
    public void Options_WithDifferentValues_AreNotEqual()
    {
        // Arrange
        var options1 = new AutoRemediationOptions { EnableAutoRemediation = true };
        var options2 = new AutoRemediationOptions { EnableAutoRemediation = false };

        // Act & Assert
        options1.Should().NotBe(options2);
    }

    #endregion

    #region County Check Helper Tests

    [Fact]
    public void IsCountyOptedIn_WhenCountyInSet_ReturnsTrue()
    {
        // Arrange
        var options = new AutoRemediationOptions
        {
            OptedInCounties = new HashSet<string> { "benton", "yakima" }
        };

        // Act & Assert
        options.OptedInCounties.Contains("benton").Should().BeTrue();
        options.OptedInCounties.Contains("yakima").Should().BeTrue();
    }

    [Fact]
    public void IsCountyOptedIn_WhenCountyNotInSet_ReturnsFalse()
    {
        // Arrange
        var options = new AutoRemediationOptions
        {
            OptedInCounties = new HashSet<string> { "benton" }
        };

        // Act & Assert
        options.OptedInCounties.Contains("king").Should().BeFalse();
    }

    [Fact]
    public void IsCountyOptedIn_CaseSensitive_ByDefault()
    {
        // Arrange
        var options = new AutoRemediationOptions
        {
            OptedInCounties = new HashSet<string> { "benton" }
        };

        // Act & Assert - default HashSet is case-sensitive
        options.OptedInCounties.Contains("BENTON").Should().BeFalse(
            "county lookup should be case-sensitive by default");
    }

    [Fact]
    public void IsCountyOptedIn_CaseInsensitive_WhenConfiguredWithIgnoreCase()
    {
        // Arrange
        var options = new AutoRemediationOptions
        {
            OptedInCounties = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "benton" }
        };

        // Act & Assert
        options.OptedInCounties.Contains("BENTON").Should().BeTrue(
            "county lookup should be case-insensitive when comparer is configured");
    }

    #endregion
}
