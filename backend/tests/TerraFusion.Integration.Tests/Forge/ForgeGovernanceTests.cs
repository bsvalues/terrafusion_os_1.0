using System;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — governance + isolation (pack V10/V11): sovereign-county isolation on reference data and
/// Forge write-lane discipline (Forge writes only valuation columns; supplement/notice/appeal fail).
/// </summary>
public class ForgeGovernanceTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CountyB = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact] // V10
    public void cross_county_reference_use_is_rejected()
    {
        FluentActions.Invoking(() => ForgeCountyGuard.EnsureSameCounty(CountyA, CountyB))
            .Should().Throw<InvalidOperationException>();

        FluentActions.Invoking(() => ForgeCountyGuard.EnsureSameCounty(CountyA, CountyA)).Should().NotThrow();
    }

    [Fact] // V11
    public void forge_write_lane_allows_only_valuation_columns()
    {
        FluentActions.Invoking(() =>
            ForgeWriteLane.EnsureValuationColumnsOnly(new[] { "AssessedValue", "LandValue", "ImprovementValue" }))
            .Should().NotThrow();

        FluentActions.Invoking(() =>
            ForgeWriteLane.EnsureValuationColumnsOnly(new[] { "AssessedValue", "SupplementStatus" }))
            .Should().Throw<InvalidOperationException>("supplement/notice/appeal columns are outside Forge's write-lane");
    }
}
