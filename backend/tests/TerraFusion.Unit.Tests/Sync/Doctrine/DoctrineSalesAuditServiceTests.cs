using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: contract tests for
/// <see cref="DoctrineSalesAuditService"/>. Validates the report
/// shape, promoter alignment computation, year-awareness presence
/// detection, and operator-actionable notes.
/// </summary>
public sealed class DoctrineSalesAuditServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public DoctrineSalesAuditServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"sync-d5-audit-{Guid.NewGuid():N}")
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

    private DoctrineSalesAuditService BuildAudit()
        => new(_db, NullLogger<DoctrineSalesAuditService>.Instance);

    private SalesQualificationCodesSeeder BuildSeeder()
        => new(_db, NullLogger<SalesQualificationCodesSeeder>.Instance);

    [Fact]
    public async Task Empty_doctrine_table_reports_zero_rules_but_table_exists()
    {
        var audit = BuildAudit();

        var report = await audit.AuditAsync();

        report.DoctrineState.TableExists.Should().BeTrue();
        report.DoctrineState.TotalRules.Should().Be(0);
        report.DoctrineState.ActiveRules.Should().Be(0);
        report.DoctrineState.Rules.Should().BeEmpty();
    }

    [Fact]
    public async Task Seeded_state_returns_three_rules()
    {
        await BuildSeeder().SeedAsync();
        var report = await BuildAudit().AuditAsync();

        report.DoctrineState.TotalRules.Should().Be(3);
        report.DoctrineState.ActiveRules.Should().Be(3);
        report.DoctrineState.Rules.Should().HaveCount(3);
    }

    [Fact]
    public async Task All_three_year_awareness_checks_PRESENT_after_seed()
    {
        await BuildSeeder().SeedAsync();
        var report = await BuildAudit().AuditAsync();

        report.YearAwarenessCheck.Post2017DorRule.Should().Be("PRESENT");
        report.YearAwarenessCheck.Pre2017DorRule.Should().Be("PRESENT");
        report.YearAwarenessCheck.Post2018CountyRule.Should().Be("PRESENT");
    }

    [Fact]
    public async Task Pre2017_DOR_rule_MISSING_when_deactivated()
    {
        await BuildSeeder().SeedAsync();

        var pre2017 = await _db.TfDoctrineSalesQualificationCodes
            .FirstAsync(r => r.SurfaceCode == "DOR_RATIO"
                          && r.EffectiveStartYear == 1990);
        pre2017.ActiveFlag = false;
        await _db.SaveChangesAsync();

        var report = await BuildAudit().AuditAsync();

        report.YearAwarenessCheck.Pre2017DorRule.Should().Be("MISSING");
        report.YearAwarenessCheck.Post2017DorRule.Should().Be("PRESENT");
        report.YearAwarenessCheck.Post2018CountyRule.Should().Be("PRESENT");
    }

    [Fact]
    public async Task Promoter_alignment_aligned_against_default_seed()
    {
        await BuildSeeder().SeedAsync();
        var report = await BuildAudit().AuditAsync();

        report.PromoterAlignment.PacsSaleTruthPromoterColumn
            .Should().Be("sl_county_ratio_cd");
        report.PromoterAlignment.PacsSaleTruthPromoterCodes
            .Should().Equal(new[] { "100" });
        report.PromoterAlignment.AlignedWithDoctrine.Should().BeTrue();
        report.PromoterAlignment.Discrepancies.Should().BeEmpty();
    }

    [Fact]
    public async Task Promoter_alignment_diverges_when_doctrine_lacks_100()
    {
        // Seed only a hypothetical doctrine where '100' is NOT in the
        // qualified set (operator entered ['00'] for the DOR surface
        // by mistake). The audit should flag the divergence.
        _db.TfDoctrineSalesQualificationCodes.Add(new TfDoctrineSalesQualificationCode
        {
            RuleId = Guid.NewGuid(),
            SurfaceCode = "DOR_RATIO",
            SourceField = "sl_county_ratio_cd",
            EffectiveStartYear = 2017,
            EffectiveEndYear = null,
            QualifiedCodesJson = "[\"00\"]", // deliberately NOT '100'
            EvidenceSource = "test-mismatch",
            Confidence = "LOW",
            ActiveFlag = true,
        });
        await _db.SaveChangesAsync();

        var report = await BuildAudit().AuditAsync();

        report.PromoterAlignment.AlignedWithDoctrine.Should().BeFalse();
        report.PromoterAlignment.Discrepancies.Should().NotBeEmpty();
        report.PromoterAlignment.Discrepancies.Should().Contain(d =>
            d.Contains("100", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Promoter_alignment_diverges_when_no_DOR_rule_for_column()
    {
        // Doctrine missing entirely for the promoter's column.
        _db.TfDoctrineSalesQualificationCodes.Add(new TfDoctrineSalesQualificationCode
        {
            RuleId = Guid.NewGuid(),
            SurfaceCode = "COUNTY_RATIO",
            SourceField = "sl_ratio_type_cd",
            EffectiveStartYear = 2018,
            QualifiedCodesJson = "[\"00\"]",
            EvidenceSource = "test",
            Confidence = "MEDIUM",
            ActiveFlag = true,
        });
        await _db.SaveChangesAsync();

        var report = await BuildAudit().AuditAsync();

        report.PromoterAlignment.AlignedWithDoctrine.Should().BeFalse();
        report.PromoterAlignment.Discrepancies.Should().Contain(d =>
            d.Contains("no active doctrine rule", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Operator_notes_contain_promoter_alignment_statement_when_aligned()
    {
        await BuildSeeder().SeedAsync();
        var report = await BuildAudit().AuditAsync();

        report.OperatorActionableNotes.Should().NotBeEmpty();
        report.OperatorActionableNotes[0].Should().Contain("PacsSaleTruthPromoter");
        report.OperatorActionableNotes[0].Should().Contain("'100'");
        report.OperatorActionableNotes[0].Should().Contain("aligns with");
    }

    [Fact]
    public async Task Operator_notes_contain_diverge_statement_when_not_aligned()
    {
        var report = await BuildAudit().AuditAsync();

        report.OperatorActionableNotes.Should().NotBeEmpty();
        report.OperatorActionableNotes[0].Should().Contain("does NOT align");
    }

    [Fact]
    public async Task Audited_at_is_recent()
    {
        var before = DateTime.UtcNow.AddSeconds(-1);
        var report = await BuildAudit().AuditAsync();
        var after = DateTime.UtcNow.AddSeconds(1);

        report.AuditedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }

    [Fact]
    public async Task Inactive_rules_show_in_total_but_not_active_count()
    {
        await BuildSeeder().SeedAsync();
        var any = await _db.TfDoctrineSalesQualificationCodes.FirstAsync();
        any.ActiveFlag = false;
        await _db.SaveChangesAsync();

        var report = await BuildAudit().AuditAsync();
        report.DoctrineState.TotalRules.Should().Be(3);
        report.DoctrineState.ActiveRules.Should().Be(2);
    }
}
