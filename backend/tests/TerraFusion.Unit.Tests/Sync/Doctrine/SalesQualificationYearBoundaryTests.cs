using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: year-aware lookup contract tests for
/// <see cref="DoctrineSalesAuditService.LookupRulesForYearAsync"/>.
/// Validates that pre-2017 vs post-2017 boundaries are honored.
/// </summary>
public sealed class SalesQualificationYearBoundaryTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public SalesQualificationYearBoundaryTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"sync-d5-year-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private async Task SeedAsync()
        => await new SalesQualificationCodesSeeder(
            _db, NullLogger<SalesQualificationCodesSeeder>.Instance).SeedAsync();

    private DoctrineSalesAuditService BuildAudit()
        => new(_db, NullLogger<DoctrineSalesAuditService>.Instance);

    [Fact]
    public async Task Year_2025_returns_post2017_DOR_and_post2018_COUNTY_rules()
    {
        await SeedAsync();

        var rules = await BuildAudit().LookupRulesForYearAsync(2025);

        rules.Should().HaveCount(2);
        rules.Should().Contain(r =>
            r.SurfaceCode == "DOR_RATIO"
            && r.SourceField == "sl_county_ratio_cd"
            && r.EffectiveStartYear == 2017
            && r.EffectiveEndYear == null
            && r.QualifiedCodes.SequenceEqual(new[] { "100" }));
        rules.Should().Contain(r =>
            r.SurfaceCode == "COUNTY_RATIO"
            && r.SourceField == "sl_ratio_type_cd"
            && r.EffectiveStartYear == 2018
            && r.QualifiedCodes.SequenceEqual(new[] { "00" }));
    }

    [Fact]
    public async Task Year_2010_returns_only_pre2017_DOR_rule()
    {
        await SeedAsync();

        var rules = await BuildAudit().LookupRulesForYearAsync(2010);

        rules.Should().HaveCount(1);
        rules[0].SurfaceCode.Should().Be("DOR_RATIO");
        rules[0].EffectiveStartYear.Should().Be(1990);
        rules[0].EffectiveEndYear.Should().Be(2016);
        rules[0].QualifiedCodes.Should().Equal(new[] { "0" });
    }

    [Fact]
    public async Task Surface_filter_narrows_to_DOR_only()
    {
        await SeedAsync();

        var rules = await BuildAudit().LookupRulesForYearAsync(2025, surface: "DOR_RATIO");

        rules.Should().HaveCount(1);
        rules[0].SurfaceCode.Should().Be("DOR_RATIO");
    }

    [Fact]
    public async Task Year_2017_boundary_returns_post2017_DOR_not_pre2017()
    {
        await SeedAsync();

        var rules = await BuildAudit().LookupRulesForYearAsync(2017, surface: "DOR_RATIO");

        // Year 2017: post-2017 rule starts inclusive at 2017; pre-2017
        // rule ends inclusive at 2016. Only the post-2017 rule applies.
        rules.Should().HaveCount(1);
        rules[0].EffectiveStartYear.Should().Be(2017);
        rules[0].QualifiedCodes.Should().Equal(new[] { "100" });
    }
}
