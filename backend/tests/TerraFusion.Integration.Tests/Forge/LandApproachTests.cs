using System;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — TF-native LAND approach (D-VAL-1, pack V4): neighborhood/reval-cycle unit values from
/// the TF LandScheduleSet, with the WA current-use/ag path producing the reduced assessed value.
/// </summary>
public class LandApproachTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static LandScheduleSet Schedule() => new()
    {
        CountyId = CountyA,
        EffectiveYear = 2025,
        Version = "v1",
        Origin = ReferenceDataOrigin.TerraFusionOwned,
        ProvenanceAuthor = "TerraFusion Valuation Standards",
        Rates =
        {
            new LandRate { Neighborhood = "N100", MarketUnitValue = 12m, CurrentUseUnitValue = 2m },
            new LandRate { Neighborhood = "N200", MarketUnitValue = 20m, CurrentUseUnitValue = null },
        },
    };

    [Fact] // L1
    public void market_land_value_is_unit_value_times_size()
    {
        var r = LandApproachCalculator.Compute(new LandApproachInput("N100", LandSizeUnits: 10_000m), Schedule());
        r.Found.Should().BeTrue();
        r.MarketValue.Should().Be(120_000m, "12/unit × 10000 units");
        r.IndicatedValue.Should().Be(120_000m);
    }

    [Fact] // L2
    public void current_use_path_yields_reduced_assessed_value()
    {
        var r = LandApproachCalculator.Compute(new LandApproachInput("N100", 10_000m, CurrentUse: true), Schedule());
        r.Found.Should().BeTrue();
        r.CurrentUseValue.Should().Be(20_000m, "2/unit current-use × 10000");
        r.IndicatedValue.Should().Be(20_000m, "WA current-use assessment uses the reduced value");
        r.IndicatedValue.Should().BeLessThan(r.MarketValue);
    }

    [Fact] // L3
    public void compute_is_deterministic()
    {
        var input = new LandApproachInput("N100", 10_000m);
        LandApproachCalculator.Compute(input, Schedule()).Should().Be(LandApproachCalculator.Compute(input, Schedule()));
    }

    [Fact] // L4
    public void unknown_neighborhood_is_explicit()
    {
        var r = LandApproachCalculator.Compute(new LandApproachInput("ZZZ", 10_000m), Schedule());
        r.Found.Should().BeFalse();
        r.Explanation.Should().NotBeNullOrWhiteSpace();
    }

    [Fact] // L5
    public void current_use_requested_but_unavailable_is_explicit_not_silent()
    {
        var r = LandApproachCalculator.Compute(new LandApproachInput("N200", 10_000m, CurrentUse: true), Schedule());
        r.Found.Should().BeFalse("N200 has no current-use rate; do not silently fall back to market");
        r.Explanation.Should().NotBeNullOrWhiteSpace();
    }
}
