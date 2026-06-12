using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities.Forge;
using TerraFusion.Core.Time;
using TerraFusion.Data;
using TerraFusion.Data.Interceptors;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — deterministic TF-native COST approach (D-VAL-1): RCN − depreciation + land.
/// RCN from the TF CostFactorSet; physical depreciation from the TF DepreciationSchedule;
/// functional/economic obsolescence as survivorship factors. No vendor table; fully deterministic
/// and explainable. (Pack V3 / cost_approach_components.)
/// </summary>
public class CostApproachTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static CostFactorSet Costs() => new()
    {
        CountyId = CountyA,
        EffectiveYear = 2025,
        Version = "v1",
        Origin = ReferenceDataOrigin.TerraFusionOwned,
        ProvenanceAuthor = "TerraFusion Valuation Standards",
        Factors =
        {
            new CostFactor { ImprovementClassCode = "R1", SizeBandMinSqFt = 1500, SizeBandMaxSqFt = 3000, UnitCostPerSqFt = 110m },
        },
    };

    private static DepreciationSchedule Depreciation() => new()
    {
        CountyId = CountyA,
        EffectiveYear = 2025,
        Version = "v1",
        Origin = ReferenceDataOrigin.TerraFusionOwned,
        ProvenanceAuthor = "TerraFusion Valuation Standards",
        Factors =
        {
            new DepreciationFactor { AgeMinYears = 0,  AgeMaxYears = 9,  DepreciationFraction = 0.10m },
            new DepreciationFactor { AgeMinYears = 10, AgeMaxYears = 19, DepreciationFraction = 0.20m },
            new DepreciationFactor { AgeMinYears = 20, AgeMaxYears = 29, DepreciationFraction = 0.35m },
        },
    };

    [Fact] // C1
    public void cost_value_is_rcn_minus_depreciation_plus_land()
    {
        var input = new CostApproachInput("R1", SizeSqFt: 2000, EffectiveAgeYears: 15, LandContribution: 50_000m);

        var result = CostApproachCalculator.Compute(input, Costs(), Depreciation());

        result.Found.Should().BeTrue();
        result.ReplacementCostNew.Should().Be(220_000m, "110/sqft × 2000 sqft");
        result.PhysicalDepreciationFraction.Should().Be(0.20m, "effective age 15 → 10-19 band");
        result.DepreciatedImprovementValue.Should().Be(176_000m, "220000 × (1 − 0.20)");
        result.IndicatedValue.Should().Be(226_000m, "176000 + 50000 land");
    }

    [Fact] // C2
    public void compute_is_deterministic()
    {
        var input = new CostApproachInput("R1", 2000, 15, 50_000m);
        var a = CostApproachCalculator.Compute(input, Costs(), Depreciation());
        var b = CostApproachCalculator.Compute(input, Costs(), Depreciation());
        a.Should().Be(b);
    }

    [Fact] // C3
    public void depreciation_schedule_lookup_is_banded_and_explicit_on_miss()
    {
        var hit = Depreciation().ResolveDepreciation(15);
        hit.Found.Should().BeTrue();
        hit.Fraction.Should().Be(0.20m);

        var miss = Depreciation().ResolveDepreciation(99);
        miss.Found.Should().BeFalse();
        miss.Explanation.Should().NotBeNullOrWhiteSpace();
    }

    [Fact] // C4
    public void obsolescence_applies_as_survivorship_factors()
    {
        var input = new CostApproachInput("R1", 2000, 15, 50_000m,
            FunctionalObsolescenceFraction: 0.10m, EconomicObsolescenceFraction: 0.05m);

        var result = CostApproachCalculator.Compute(input, Costs(), Depreciation());

        // 220000 × (1−0.20) × (1−0.10) × (1−0.05) = 150480; + 50000 land = 200480
        result.DepreciatedImprovementValue.Should().Be(150_480m);
        result.IndicatedValue.Should().Be(200_480m);
    }

    [Fact] // C5
    public void missing_cost_factor_is_explicit_not_silent()
    {
        var input = new CostApproachInput("UNKNOWN_CLASS", 2000, 15, 50_000m);

        var result = CostApproachCalculator.Compute(input, Costs(), Depreciation());

        result.Found.Should().BeFalse();
        result.IndicatedValue.Should().Be(0m, "no silent value when an input is missing");
        result.Explanation.Should().NotBeNullOrWhiteSpace();
    }

    [Fact] // C6
    public async System.Threading.Tasks.Task depreciation_schedule_inherits_ws3_audit_stamping()
    {
        var clock = new FixedClock(new DateTime(2026, 4, 4, 10, 0, 0, DateTimeKind.Utc));
        var users = new FakeUser { Current = new RequestUserContext(true, "assessor.lee", CountyA.ToString(), Array.Empty<string>()) };

        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(nameof(depreciation_schedule_inherits_ws3_audit_stamping))
            .AddInterceptors(new AuditableEntityInterceptor(clock, users))
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "InMemory" })
            .Build();

        await using var ctx = new TerraFusionDbContext(options, config);
        var schedule = Depreciation();
        ctx.DepreciationSchedules.Add(schedule);
        await ctx.SaveChangesAsync();

        schedule.CreatedBy.Should().Be("assessor.lee");
        ctx.AuditLogs.Count(a => a.Type.Contains(nameof(DepreciationSchedule))).Should().Be(1);
    }

    private sealed class FixedClock : IClock
    {
        public FixedClock(DateTime utc) => UtcNow = utc;
        public DateTime UtcNow { get; }
    }

    private sealed class FakeUser : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; set; } = RequestUserContext.Anonymous;
    }
}
