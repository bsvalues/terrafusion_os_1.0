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
/// WS-1 — TF-native INCOME approach (D-VAL-1, pack V6): IndicatedValue = NOI ÷ cap rate, with the
/// cap rate resolved from the TF CapRateSet by income property class. Deterministic; explicit miss.
/// </summary>
public class IncomeApproachTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static CapRateSet CapRates() => new()
    {
        CountyId = CountyA,
        EffectiveYear = 2025,
        Version = "v1",
        Origin = ReferenceDataOrigin.TerraFusionOwned,
        ProvenanceAuthor = "TerraFusion Valuation Standards",
        Rates =
        {
            new CapRate { IncomePropertyClass = "APT", CapitalizationRate = 0.08m },
            new CapRate { IncomePropertyClass = "RETAIL", CapitalizationRate = 0.00m }, // invalid on purpose
        },
    };

    [Fact] // I1
    public void value_is_noi_divided_by_cap_rate()
    {
        var r = IncomeApproachCalculator.Compute(new IncomeApproachInput("APT", NetOperatingIncome: 80_000m), CapRates());
        r.Found.Should().BeTrue();
        r.CapRate.Should().Be(0.08m);
        r.IndicatedValue.Should().Be(1_000_000m, "80000 / 0.08");
    }

    [Fact] // I2
    public void compute_is_deterministic()
    {
        var input = new IncomeApproachInput("APT", 80_000m);
        IncomeApproachCalculator.Compute(input, CapRates()).Should().Be(IncomeApproachCalculator.Compute(input, CapRates()));
    }

    [Fact] // I3
    public void unknown_class_is_explicit()
    {
        var r = IncomeApproachCalculator.Compute(new IncomeApproachInput("WAREHOUSE", 80_000m), CapRates());
        r.Found.Should().BeFalse();
        r.Explanation.Should().NotBeNullOrWhiteSpace();
    }

    [Fact] // I4
    public void zero_cap_rate_is_explicit_not_divide_by_zero()
    {
        var r = IncomeApproachCalculator.Compute(new IncomeApproachInput("RETAIL", 80_000m), CapRates());
        r.Found.Should().BeFalse("a zero cap rate is invalid; never divide by zero or emit a silent value");
        r.Explanation.Should().NotBeNullOrWhiteSpace();
    }

    [Fact] // I5
    public async System.Threading.Tasks.Task cap_rate_set_inherits_ws3_audit_stamping()
    {
        var clock = new FixedClock(new DateTime(2026, 5, 5, 11, 0, 0, DateTimeKind.Utc));
        var users = new FakeUser { Current = new RequestUserContext(true, "assessor.kim", CountyA.ToString(), Array.Empty<string>()) };
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(nameof(cap_rate_set_inherits_ws3_audit_stamping))
            .AddInterceptors(new AuditableEntityInterceptor(clock, users)).Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "InMemory" }).Build();

        await using var ctx = new TerraFusionDbContext(options, config);
        var set = CapRates();
        ctx.CapRateSets.Add(set);
        await ctx.SaveChangesAsync();

        set.CreatedBy.Should().Be("assessor.kim");
        ctx.AuditLogs.Count(a => a.Type.Contains(nameof(CapRateSet))).Should().Be(1);
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
