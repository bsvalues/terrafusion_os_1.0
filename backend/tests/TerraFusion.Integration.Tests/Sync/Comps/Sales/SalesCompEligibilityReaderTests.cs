using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Comps.Sales;

/// <summary>
/// Slice C37-B tests for <see cref="SalesCompEligibilityReader"/>.
/// Seeds <c>CanonicalSaleQualifications</c> directly (rather than
/// running the C36 writer) so the reader is exercised in isolation
/// against every <see cref="CanonicalSaleQualificationDecision"/>
/// shape and against the workbook-pin variant of the query.
///
/// <para>Pattern matches the C36 / C8-C tests: fresh InMemory DB per
/// test, real EF Core configuration so the C35-B index + composite
/// PK constraints are honored.</para>
/// </summary>
public class SalesCompEligibilityReaderTests
{
    private const string OperatorId = "c37-test";

    private static TerraFusionDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private static async Task<County> SeedCountyAsync(
        TerraFusionDbContext db, string name, string fips)
    {
        var county = new County
        {
            Id = Guid.NewGuid(), Name = name, State = "WA", FipsCode = fips,
        };
        db.Counties.Add(county);
        await db.SaveChangesAsync();
        return county;
    }

    private static CanonicalSaleQualification BuildRow(
        Guid countyId,
        int chgOfOwnerId,
        CanonicalSaleQualificationDecision decision,
        Guid sourceWorkbookId,
        DateTime sourceWorkbookLockedAt,
        string? wacSource = null,
        string? wacCanonical = null,
        string? ratioSource = null,
        string? ratioCanonical = null,
        DateTime? saleDate = null,
        decimal? salePrice = null)
    {
        var nowUtc = DateTime.UtcNow;
        var (wacAxis, ratioAxis) = decision switch
        {
            CanonicalSaleQualificationDecision.Qualified =>
                (CanonicalSaleAxisDecision.Qualified, CanonicalSaleAxisDecision.Qualified),
            CanonicalSaleQualificationDecision.Excluded =>
                (CanonicalSaleAxisDecision.Excluded, CanonicalSaleAxisDecision.Qualified),
            _ =>
                (CanonicalSaleAxisDecision.NotMapped, CanonicalSaleAxisDecision.NotMapped),
        };

        return new CanonicalSaleQualification
        {
            CountyId                    = countyId,
            ChgOfOwnerId                = chgOfOwnerId,
            ComputedDecision            = decision,
            WacCdSourceValue            = wacSource,
            WacCdCanonicalValue         = wacCanonical,
            WacCdAxisDecision           = wacAxis,
            SlRatioTypeCdSourceValue    = ratioSource,
            SlRatioTypeCdCanonicalValue = ratioCanonical,
            SlRatioTypeCdAxisDecision   = ratioAxis,
            SourceWorkbookId            = sourceWorkbookId,
            SourceWorkbookLockedAt      = sourceWorkbookLockedAt,
            SaleDate                    = saleDate,
            SalePrice                   = salePrice,
            CreatedAt                   = nowUtc,
            UpdatedAt                   = nowUtc,
            CreatedBy                   = OperatorId,
            UpdatedBy                   = OperatorId,
        };
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task ReadAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var sut = new SalesCompEligibilityReader(db);

        Func<Task> act = () => sut.ReadAsync(Guid.Empty, sourceWorkbookId: null);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    // ── Selection rule: Qualified-only ──────────────────────────────────

    [Fact]
    public async Task ReadAsync_ReturnsOnlyQualifiedRows()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var workbookId = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        // 2 Qualified, 1 Excluded, 1 Inconclusive — Excluded and
        // Inconclusive must NOT be in the comp pool per C37-A.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 1001, CanonicalSaleQualificationDecision.Qualified,
                workbookId, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale",
                ratioSource: "00",          ratioCanonical: "Conventional"),
            BuildRow(county.Id, 1002, CanonicalSaleQualificationDecision.Qualified,
                workbookId, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale",
                ratioSource: "00",          ratioCanonical: "Conventional"),
            BuildRow(county.Id, 1003, CanonicalSaleQualificationDecision.Excluded,
                workbookId, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 1004, CanonicalSaleQualificationDecision.Inconclusive,
                workbookId, lockedAt,
                wacSource: "999-UNKNOWN"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);
        var pool = await sut.ReadAsync(county.Id, sourceWorkbookId: null);

        pool.Should().HaveCount(2);
        pool.Select(r => r.ChgOfOwnerId).Should().BeEquivalentTo(new[] { 1001, 1002 });
    }

    [Fact]
    public async Task ReadAsync_ExcludesOperatorTaggedExclusionsExplicitly()
    {
        // Direct WacCd-bug containment assertion: an operator-tagged
        // exclusion (the 458-61A-217(1)-style code) must not enter the
        // comp pool no matter what the ratio axis says.
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var workbookId = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 5001, CanonicalSaleQualificationDecision.Excluded,
                workbookId, lockedAt,
                wacSource: "458-61A-217(1)",
                ratioSource: "00", ratioCanonical: "Conventional"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);
        var pool = await sut.ReadAsync(county.Id, sourceWorkbookId: null);

        pool.Should().BeEmpty();
    }

    [Fact]
    public async Task ReadAsync_ExcludesWorkbookSilentInconclusivesExplicitly()
    {
        // The 2017 conversion caveat: pre-conversion / unmapped
        // wac_cd codes land as Inconclusive (NotMapped on at least one
        // axis). The filter must reject them.
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var workbookId = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 6001, CanonicalSaleQualificationDecision.Inconclusive,
                workbookId, lockedAt,
                wacSource: "PRE-2017-CODE"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);
        var pool = await sut.ReadAsync(county.Id, sourceWorkbookId: null);

        pool.Should().BeEmpty();
    }

    // ── County isolation ────────────────────────────────────────────────

    [Fact]
    public async Task ReadAsync_KeepsCountyIsolation()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var benton  = await SeedCountyAsync(db, "Benton", "53005");
        var yakima  = await SeedCountyAsync(db, "Yakima", "53077");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(benton.Id, 1001, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(yakima.Id, 1001, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);

        var bentonPool = await sut.ReadAsync(benton.Id, sourceWorkbookId: null);
        bentonPool.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(1001);

        var yakimaPool = await sut.ReadAsync(yakima.Id, sourceWorkbookId: null);
        yakimaPool.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(1001);

        // Same ChgOfOwnerId in both counties; the filter never
        // returns the other county's row.
        bentonPool.Should().NotContain(r => r.ChgOfOwnerId == 1001 && r.WacCdCanonicalValue == null);
    }

    [Fact]
    public async Task ReadAsync_ReturnsEmptyForUnknownCounty()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var sut = new SalesCompEligibilityReader(db);

        var pool = await sut.ReadAsync(Guid.NewGuid(), sourceWorkbookId: null);
        pool.Should().BeEmpty();
    }

    // ── Workbook-pin opt-in ─────────────────────────────────────────────

    [Fact]
    public async Task ReadAsync_PinsToSourceWorkbookWhenSpecified()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var oldWb = Guid.NewGuid();
        var newWb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 7001, CanonicalSaleQualificationDecision.Qualified,
                oldWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 7002, CanonicalSaleQualificationDecision.Qualified,
                newWb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);

        var unpinned = await sut.ReadAsync(county.Id, sourceWorkbookId: null);
        unpinned.Should().HaveCount(2);

        var pinnedToOld = await sut.ReadAsync(county.Id, sourceWorkbookId: oldWb);
        pinnedToOld.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(7001);

        var pinnedToNew = await sut.ReadAsync(county.Id, sourceWorkbookId: newWb);
        pinnedToNew.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(7002);

        // Pinning to a workbook id that produced no canonical rows
        // returns empty, not throw.
        var pinnedToPhantom = await sut.ReadAsync(county.Id, sourceWorkbookId: Guid.NewGuid());
        pinnedToPhantom.Should().BeEmpty();
    }

    [Fact]
    public async Task ReadAsync_TreatsEmptyWorkbookGuidAsNoPin()
    {
        // Hard Guard 7: pin is opt-in. Passing Guid.Empty is the
        // same as "no pin"; the reader treats it as an unspecified
        // pin rather than as a literal "match Guid.Empty workbooks"
        // (no canonical row would carry that anyway).
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 8001, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);
        var pool = await sut.ReadAsync(county.Id, sourceWorkbookId: Guid.Empty);

        pool.Should().ContainSingle().Which.ChgOfOwnerId.Should().Be(8001);
    }

    // ── Read-only contract ──────────────────────────────────────────────

    [Fact]
    public async Task ReadAsync_DoesNotMutateAnyState()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 9001, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 9002, CanonicalSaleQualificationDecision.Excluded,
                wb, lockedAt,
                wacSource: "458-61A-217(1)"),
            BuildRow(county.Id, 9003, CanonicalSaleQualificationDecision.Inconclusive,
                wb, lockedAt,
                wacSource: "999-UNKNOWN"));
        await db.SaveChangesAsync();

        var pre = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new
            {
                r.ChgOfOwnerId,
                r.ComputedDecision,
                r.UpdatedAt,
                r.UpdatedBy,
                r.WacCdSourceValue,
            })
            .ToListAsync();

        var sut = new SalesCompEligibilityReader(db);
        await sut.ReadAsync(county.Id, sourceWorkbookId: null);
        await sut.ReadAsync(county.Id, sourceWorkbookId: wb);

        var post = await db.CanonicalSaleQualifications.AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new
            {
                r.ChgOfOwnerId,
                r.ComputedDecision,
                r.UpdatedAt,
                r.UpdatedBy,
                r.WacCdSourceValue,
            })
            .ToListAsync();

        post.Should().BeEquivalentTo(pre);
    }

    // ── Idempotent: deterministic ordering ──────────────────────────────

    [Fact]
    public async Task ReadAsync_OrdersByChgOfOwnerIdAscDeterministically()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);

        // Insert out-of-order: result must still come back ascending.
        db.CanonicalSaleQualifications.AddRange(
            BuildRow(county.Id, 4003, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 4001, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"),
            BuildRow(county.Id, 4002, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)", wacCanonical: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);
        var pool = await sut.ReadAsync(county.Id, sourceWorkbookId: null);

        pool.Select(r => r.ChgOfOwnerId).Should().Equal(4001, 4002, 4003);
    }

    // ── Projection completeness ─────────────────────────────────────────

    [Fact]
    public async Task ReadAsync_ProjectsAllPublicFieldsFromCanonicalRow()
    {
        await using var db = CreateContext($"sce-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db, "Benton", "53005");
        var wb = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 20, 0, 0, DateTimeKind.Utc);
        var saleDate = new DateTime(2025, 7, 18, 0, 0, 0, DateTimeKind.Utc);

        db.CanonicalSaleQualifications.Add(
            BuildRow(county.Id, 12001, CanonicalSaleQualificationDecision.Qualified,
                wb, lockedAt,
                wacSource: "458-61A-203(1)",
                wacCanonical: "ArmsLengthSale",
                ratioSource: "00",
                ratioCanonical: "Conventional",
                saleDate: saleDate,
                salePrice: 525000m));
        await db.SaveChangesAsync();

        var sut = new SalesCompEligibilityReader(db);
        var pool = await sut.ReadAsync(county.Id, sourceWorkbookId: null);

        pool.Should().ContainSingle();
        var row = pool[0];
        row.ChgOfOwnerId.Should().Be(12001);
        row.WacCdSourceValue.Should().Be("458-61A-203(1)");
        row.WacCdCanonicalValue.Should().Be("ArmsLengthSale");
        row.SlRatioTypeCdSourceValue.Should().Be("00");
        row.SlRatioTypeCdCanonicalValue.Should().Be("Conventional");
        row.SaleDate.Should().Be(saleDate);
        row.SalePrice.Should().Be(525000m);
        row.SourceWorkbookId.Should().Be(wb);
        row.SourceWorkbookLockedAt.Should().Be(lockedAt);
    }
}
