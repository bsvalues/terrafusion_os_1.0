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
/// WS-1 substream 1f — TF-native COST reference-data foundation (D-VAL-1).
///
/// These tests define and prove the TerraFusion-owned cost reference structures the Forge cost
/// approach will consume: deterministic factor resolution, COMPLETE TF provenance (never a vendor
/// cost basis), county-scoped + version-pinned selection, explicit (non-silent) misses, and WS-3
/// audit inheritance. Corpus is parity-reference evidence only — no vendor schedule is imported.
/// </summary>
public class CostReferenceDataTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CountyB = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static CostFactorSet ResidentialSet(Guid countyId, int effectiveYear, string version)
    {
        var set = new CostFactorSet
        {
            Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001"),
            CountyId = countyId,
            EffectiveYear = effectiveYear,
            RevalCycle = "2025-2030",
            Version = version,
            Origin = ReferenceDataOrigin.TerraFusionOwned,
            ProvenanceAuthor = "TerraFusion Valuation Standards",
        };
        set.Factors.AddRange(new[]
        {
            new CostFactor { ImprovementClassCode = "R1", SizeBandMinSqFt = null, SizeBandMaxSqFt = null, UnitCostPerSqFt = 100m },
            new CostFactor { ImprovementClassCode = "R1", SizeBandMinSqFt = 0,    SizeBandMaxSqFt = 1499, UnitCostPerSqFt = 120m },
            new CostFactor { ImprovementClassCode = "R1", SizeBandMinSqFt = 1500, SizeBandMaxSqFt = 3000, UnitCostPerSqFt = 110m },
        });
        return set;
    }

    [Fact] // F1
    public void resolution_is_deterministic_for_same_inputs_and_equal_sets()
    {
        var set = ResidentialSet(CountyA, 2025, "v1");

        var first = set.ResolveUnitCost("R1", 2000);
        var second = set.ResolveUnitCost("R1", 2000);
        first.Should().Be(second);
        first.Found.Should().BeTrue();
        first.UnitCostPerSqFt.Should().Be(110m, "the 1500-3000 size band is the most specific match");

        // An independently constructed but identical set yields an identical resolution.
        var equalSet = ResidentialSet(CountyA, 2025, "v1");
        equalSet.ResolveUnitCost("R1", 2000).Should().Be(first);
    }

    [Fact] // F2
    public void provenance_must_be_complete_and_tf_owned_never_vendor()
    {
        var good = ResidentialSet(CountyA, 2025, "v1");
        good.Invoking(s => s.EnsureTfProvenance()).Should().NotThrow();
        good.Origin.Should().Be(ReferenceDataOrigin.TerraFusionOwned);
        good.IsVendorDependent.Should().BeFalse("D-VAL-1: no third-party/vendor cost basis is representable");

        var missingVersion = ResidentialSet(CountyA, 2025, version: "");
        missingVersion.Invoking(s => s.EnsureTfProvenance()).Should().Throw<InvalidOperationException>();

        var missingAuthor = ResidentialSet(CountyA, 2025, "v1");
        missingAuthor.ProvenanceAuthor = "";
        missingAuthor.Invoking(s => s.EnsureTfProvenance()).Should().Throw<InvalidOperationException>();

        var missingYear = ResidentialSet(CountyA, effectiveYear: 0, "v1");
        missingYear.Invoking(s => s.EnsureTfProvenance()).Should().Throw<InvalidOperationException>();
    }

    [Fact] // F3
    public void selection_is_county_scoped()
    {
        var sets = new[]
        {
            ResidentialSet(CountyA, 2025, "v1"),
            ResidentialSet(CountyB, 2025, "v1"),
        };

        CostFactorCatalog.Select(sets, CountyA, 2025)!.CountyId.Should().Be(CountyA);
        CostFactorCatalog.Select(sets, CountyB, 2025)!.CountyId.Should().Be(CountyB);
        CostFactorCatalog.Select(sets, Guid.NewGuid(), 2025).Should().BeNull("no cross-county fallback");
    }

    [Fact] // F4
    public void selection_is_pinned_to_effective_year_version()
    {
        var sets = new[]
        {
            ResidentialSet(CountyA, 2025, "v1"),
            ResidentialSet(CountyA, 2026, "v2"),
        };

        CostFactorCatalog.Select(sets, CountyA, 2025)!.Version.Should().Be("v1");
        CostFactorCatalog.Select(sets, CountyA, 2026)!.Version.Should().Be("v2");
        CostFactorCatalog.Select(sets, CountyA, 2099).Should().BeNull("no nearest-year guessing");
    }

    [Fact] // F5
    public void unknown_class_is_explicit_not_silent()
    {
        var set = ResidentialSet(CountyA, 2025, "v1");

        var miss = set.ResolveUnitCost("DOES_NOT_EXIST", 2000);
        miss.Found.Should().BeFalse();
        miss.Explanation.Should().NotBeNullOrWhiteSpace("a miss must be explained, never a silent default value");
    }

    [Fact] // F6
    public async System.Threading.Tasks.Task cost_factor_set_inherits_ws3_audit_stamping()
    {
        var clock = new FixedClock(new DateTime(2026, 3, 3, 9, 0, 0, DateTimeKind.Utc));
        var users = new FakeUser
        {
            Current = new RequestUserContext(true, "assessor.jane", CountyA.ToString(), Array.Empty<string>())
        };

        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(nameof(cost_factor_set_inherits_ws3_audit_stamping))
            .AddInterceptors(new AuditableEntityInterceptor(clock, users))
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "InMemory" })
            .Build();

        await using var ctx = new TerraFusionDbContext(options, config);
        var set = ResidentialSet(CountyA, 2025, "v1");
        ctx.CostFactorSets.Add(set);
        await ctx.SaveChangesAsync();

        set.CreatedBy.Should().Be("assessor.jane", "Forge reference data inherits WS-3 stamping; no second audit path");
        set.CreatedAt.Should().Be(clock.UtcNow);
        ctx.AuditLogs.Count(a => a.Type.Contains(nameof(CostFactorSet))).Should().Be(1);
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
