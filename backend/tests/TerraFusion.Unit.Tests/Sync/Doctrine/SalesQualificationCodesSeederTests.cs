using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: contract tests for
/// <see cref="SalesQualificationCodesSeeder"/>.
/// </summary>
public sealed class SalesQualificationCodesSeederTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public SalesQualificationCodesSeederTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"sync-d5-seed-{Guid.NewGuid():N}")
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

    private SalesQualificationCodesSeeder Build()
        => new(_db, NullLogger<SalesQualificationCodesSeeder>.Instance);

    [Fact]
    public async Task First_run_inserts_three_seed_rules()
    {
        var seeder = Build();

        var added = await seeder.SeedAsync();

        added.Should().Be(3);
        var rules = await _db.TfDoctrineSalesQualificationCodes.ToListAsync();
        rules.Should().HaveCount(3);
        rules.Should().AllSatisfy(r => r.ActiveFlag.Should().BeTrue());
    }

    [Fact]
    public async Task Second_run_is_idempotent_no_duplicates()
    {
        var seeder = Build();

        await seeder.SeedAsync();
        var added2 = await seeder.SeedAsync();

        added2.Should().Be(0);
        var count = await _db.TfDoctrineSalesQualificationCodes.CountAsync();
        count.Should().Be(3);
    }

    [Fact]
    public async Task Seeder_does_not_reactivate_deactivated_rules()
    {
        var seeder = Build();
        await seeder.SeedAsync();

        // Operator deactivates the pre-2017 DOR rule.
        var pre2017 = await _db.TfDoctrineSalesQualificationCodes
            .FirstAsync(r => r.SurfaceCode == "DOR_RATIO"
                          && r.EffectiveStartYear == 1990);
        pre2017.ActiveFlag = false;
        await _db.SaveChangesAsync();

        // Re-run.
        var added2 = await seeder.SeedAsync();

        added2.Should().Be(0);
        var refreshed = await _db.TfDoctrineSalesQualificationCodes
            .FirstAsync(r => r.RuleId == pre2017.RuleId);
        refreshed.ActiveFlag.Should().BeFalse(
            "soft-disable is sticky; seeder must not reactivate operator-disabled rules");
    }

    [Fact]
    public async Task Seeded_rules_each_carry_evidence_and_confidence()
    {
        var seeder = Build();
        await seeder.SeedAsync();

        var rules = await _db.TfDoctrineSalesQualificationCodes.ToListAsync();
        rules.Should().AllSatisfy(r =>
        {
            r.EvidenceSource.Should().NotBeNullOrWhiteSpace();
            r.Confidence.Should().BeOneOf("HIGH", "MEDIUM", "LOW");
            r.SurfaceCode.Should().BeOneOf("DOR_RATIO", "COUNTY_RATIO");
            r.QualifiedCodesJson.Should().StartWith("[").And.EndWith("]");
        });
    }

    [Fact]
    public async Task Adding_an_extra_rule_alongside_seed_is_preserved()
    {
        var seeder = Build();
        await seeder.SeedAsync();

        // Operator adds a hypothetical new rule.
        _db.TfDoctrineSalesQualificationCodes.Add(new TfDoctrineSalesQualificationCode
        {
            RuleId = Guid.NewGuid(),
            SurfaceCode = "DOR_RATIO",
            SourceField = "sl_county_ratio_cd",
            EffectiveStartYear = 2030,
            EffectiveEndYear = null,
            QualifiedCodesJson = "[\"100\",\"110\"]",
            EvidenceSource = "operator-extension future",
            Confidence = "LOW",
            ActiveFlag = true,
        });
        await _db.SaveChangesAsync();

        var added2 = await seeder.SeedAsync();

        added2.Should().Be(0, "the three deterministic seed rules were already inserted");
        var total = await _db.TfDoctrineSalesQualificationCodes.CountAsync();
        total.Should().Be(4);
    }

    [Fact]
    public async Task Deterministic_rule_ids_used_so_seed_is_reproducible()
    {
        var seeder = Build();
        await seeder.SeedAsync();

        var ids = await _db.TfDoctrineSalesQualificationCodes
            .Select(r => r.RuleId)
            .OrderBy(g => g)
            .ToListAsync();

        // Re-run on a fresh DB and confirm the same IDs.
        var opts2 = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"sync-d5-seed-2-{Guid.NewGuid():N}")
            .Options;
        var cfg2 = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        using var db2 = new TerraFusionDbContext(opts2, cfg2);
        db2.Database.EnsureCreated();

        var seeder2 = new SalesQualificationCodesSeeder(
            db2, NullLogger<SalesQualificationCodesSeeder>.Instance);
        await seeder2.SeedAsync();
        var ids2 = await db2.TfDoctrineSalesQualificationCodes
            .Select(r => r.RuleId)
            .OrderBy(g => g)
            .ToListAsync();

        ids2.Should().Equal(ids);
    }
}
