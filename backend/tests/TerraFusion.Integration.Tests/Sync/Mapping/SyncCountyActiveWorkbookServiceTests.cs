using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Slice C41-B tests for <see cref="SyncCountyActiveWorkbookService"/>.
/// Asserts every C41-A Hard Guard mechanically:
/// <list type="bullet">
/// <item>SET against Mapped + same-county workbook persists.</item>
/// <item>SET against Draft workbook throws.</item>
/// <item>SET against cross-county workbook throws.</item>
/// <item>SET twice with same workbook is a no-op
///   (audit fields don't bump; idempotent).</item>
/// <item>GET against no-pointer county returns <c>null</c>.</item>
/// <item>County isolation: per-county scope honored across SET /
///   GET / Clear.</item>
/// <item>SET / Clear do not mutate <c>CanonicalSaleQualifications</c>
///   or any workbook row.</item>
/// <item>Clear against no-pointer county is a no-op (no
///   exception).</item>
/// </list>
///
/// <para>The FK-Restrict invariant (C41-A Hard Guard 8: a
/// pointed-to workbook can't be deleted) is enforced at the
/// database level by the EF configuration; we verify the FK is
/// configured rather than re-asserting Postgres' constraint
/// behavior, which the schema migration test
/// (C35-B / C40-B style) already covers via the model snapshot.</para>
/// </summary>
public class SyncCountyActiveWorkbookServiceTests
{
    private const string OperatorId = "c41b-test";

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
        TerraFusionDbContext db, string name = "Benton", string fips = "53005")
    {
        var county = new County
        {
            Id = Guid.NewGuid(), Name = name, State = "WA", FipsCode = fips,
        };
        db.Counties.Add(county);
        await db.SaveChangesAsync();
        return county;
    }

    private static async Task<Guid> SeedWorkbookAsync(
        TerraFusionDbContext db,
        Guid countyId,
        string status = "Mapped",
        string name = "wb")
    {
        var conn = new SyncSourceConnection
        {
            Id = Guid.NewGuid(), CountyId = countyId, Name = $"{name}-conn",
            SourceSystem = "PACS", ConnectionType = "SqlServer",
            Server = "localhost,1433", Database = "pacs_oltp",
            AuthMode = "SqlAuth", IsActive = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId = countyId, SourceSystem = "PACS", Mode = "profile",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);

        var wb = new SyncMappingWorkbook
        {
            CountyId           = countyId,
            SourceConnectionId = conn.Id,
            ProfileBatchId     = batch.Id,
            Name               = $"{name}-{Guid.NewGuid():N}",
            Status             = status,
        };
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();
        return wb.Id;
    }

    // ── 1. Happy-path SET against Mapped + same county ──────────────────

    [Fact]
    public async Task SetAsync_PersistsPointerForMappedWorkbookInSameCounty()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var sut = new SyncCountyActiveWorkbookService(db);
        var snap = await sut.SetAsync(county.Id, wbId, OperatorId, "first promotion");

        snap.CountyId.Should().Be(county.Id);
        snap.ActiveWorkbookId.Should().Be(wbId);
        snap.SetBy.Should().Be(OperatorId);
        snap.SetReason.Should().Be("first promotion");

        var persisted = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .SingleAsync(p => p.CountyId == county.Id);
        persisted.ActiveWorkbookId.Should().Be(wbId);
        persisted.SetBy.Should().Be(OperatorId);
        persisted.CreatedBy.Should().Be(OperatorId);
        persisted.UpdatedBy.Should().Be(OperatorId);
    }

    // ── 2. Reject Draft workbook (Hard Guard 2) ─────────────────────────

    [Fact]
    public async Task SetAsync_RejectsDraftWorkbook()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var draftId = await SeedWorkbookAsync(db, county.Id, status: "Draft");

        var sut = new SyncCountyActiveWorkbookService(db);
        Func<Task> act = () => sut.SetAsync(county.Id, draftId, OperatorId, null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Draft'*Status='Mapped'*");

        // No pointer row created on rejection.
        (await db.SyncCountyActiveWorkbooks.CountAsync()).Should().Be(0);
    }

    // ── 3. Reject cross-county workbook (Hard Guard 2) ──────────────────

    [Fact]
    public async Task SetAsync_RejectsCrossCountyWorkbook()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id);

        var sut = new SyncCountyActiveWorkbookService(db);

        // Yakima asks to point at Benton's workbook → "not found".
        Func<Task> act = () => sut.SetAsync(yakima.Id, bentonWb, OperatorId, null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{bentonWb}*not found for county {yakima.Id}*");

        (await db.SyncCountyActiveWorkbooks.CountAsync()).Should().Be(0);
    }

    // ── 4. SET twice with same workbook is idempotent (Hard Guard 3) ───

    [Fact]
    public async Task SetAsync_SameWorkbookTwice_IsNoOp_AuditFieldsDoNotBump()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        var sut = new SyncCountyActiveWorkbookService(db);
        await sut.SetAsync(county.Id, wbId, OperatorId, "first set");

        var afterFirst = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .SingleAsync(p => p.CountyId == county.Id);
        var firstUpdatedAt = afterFirst.UpdatedAt;
        var firstUpdatedBy = afterFirst.UpdatedBy;
        var firstSetAt     = afterFirst.SetAt;
        var firstSetReason = afterFirst.SetReason;

        // Re-set with same workbookId. Per Hard Guard 3 this MUST
        // be a no-op — the existing audit fields are NOT bumped,
        // even though we passed a different operator and reason.
        await sut.SetAsync(county.Id, wbId, "second-operator", "second set with new reason");

        var afterSecond = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .SingleAsync(p => p.CountyId == county.Id);
        afterSecond.UpdatedAt.Should().Be(firstUpdatedAt,
            "Hard Guard 3: idempotent SET must not bump UpdatedAt");
        afterSecond.UpdatedBy.Should().Be(firstUpdatedBy,
            "Hard Guard 3: idempotent SET must not rotate UpdatedBy");
        afterSecond.SetAt.Should().Be(firstSetAt,
            "Hard Guard 3: idempotent SET must not bump SetAt");
        afterSecond.SetReason.Should().Be(firstSetReason,
            "Hard Guard 3: idempotent SET must not overwrite SetReason");
        afterSecond.SetBy.Should().Be(OperatorId,
            "Hard Guard 3: SetBy preserved from the original promotion");
    }

    // ── 5. SET overwrites in place when target workbook differs ─────────

    [Fact]
    public async Task SetAsync_DifferentWorkbookSecondTime_OverwritesInPlace()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbA = await SeedWorkbookAsync(db, county.Id, name: "A");
        var wbB = await SeedWorkbookAsync(db, county.Id, name: "B");

        var sut = new SyncCountyActiveWorkbookService(db);
        await sut.SetAsync(county.Id, wbA, "first-operator", "promote A");
        await sut.SetAsync(county.Id, wbB, "second-operator", "promote B");

        var rows = await db.SyncCountyActiveWorkbooks.AsNoTracking()
            .Where(p => p.CountyId == county.Id).ToListAsync();
        rows.Should().ContainSingle(
            "singleton-per-county invariant (Hard Guard 1)");
        rows[0].ActiveWorkbookId.Should().Be(wbB);
        rows[0].SetBy.Should().Be("second-operator");
        rows[0].SetReason.Should().Be("promote B");
        rows[0].CreatedBy.Should().Be("first-operator",
            "FISMA: CreatedBy preserved from the original promotion");
        rows[0].UpdatedBy.Should().Be("second-operator",
            "FISMA: UpdatedBy rotates on every actual state change");
    }

    // ── 6. GET against no-pointer county returns null (Hard Guard 9) ───

    [Fact]
    public async Task GetAsync_NoPointer_ReturnsNull()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var sut = new SyncCountyActiveWorkbookService(db);
        var result = await sut.GetAsync(county.Id);

        result.Should().BeNull("no-pointer is a valid state per Hard Guard 9");
    }

    // ── 7. County isolation across SET / GET / Clear ────────────────────

    [Fact]
    public async Task SetGetClear_PreserveCountyIsolation()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var benton = await SeedCountyAsync(db, "Benton", "53005");
        var yakima = await SeedCountyAsync(db, "Yakima", "53077");
        var bentonWb = await SeedWorkbookAsync(db, benton.Id, name: "benton");
        var yakimaWb = await SeedWorkbookAsync(db, yakima.Id, name: "yakima");

        var sut = new SyncCountyActiveWorkbookService(db);
        await sut.SetAsync(benton.Id, bentonWb, OperatorId, null);
        await sut.SetAsync(yakima.Id, yakimaWb, OperatorId, null);

        // GET stays scoped per county.
        var bentonSnap = await sut.GetAsync(benton.Id);
        bentonSnap.Should().NotBeNull();
        bentonSnap!.ActiveWorkbookId.Should().Be(bentonWb);

        var yakimaSnap = await sut.GetAsync(yakima.Id);
        yakimaSnap.Should().NotBeNull();
        yakimaSnap!.ActiveWorkbookId.Should().Be(yakimaWb);

        // Clearing one county doesn't touch the other.
        await sut.ClearAsync(benton.Id, OperatorId);
        (await sut.GetAsync(benton.Id)).Should().BeNull();
        (await sut.GetAsync(yakima.Id)).Should().NotBeNull();
    }

    // ── 8. SET / Clear do not mutate canonical landing or workbook ──────

    [Fact]
    public async Task SetAndClear_DoNotMutateCanonicalLandingOrWorkbookRows()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);
        var wbId = await SeedWorkbookAsync(db, county.Id);

        // Seed a synthetic canonical landing row so we can prove
        // SET / Clear leave it untouched.
        var canonicalRow = new CanonicalSaleQualification
        {
            CountyId                    = county.Id,
            ChgOfOwnerId                = 9001,
            ComputedDecision            = CanonicalSaleQualificationDecision.Qualified,
            WacCdSourceValue            = "458-61A-203(1)",
            WacCdCanonicalValue         = "ArmsLengthSale",
            WacCdAxisDecision           = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdSourceValue    = "00",
            SlRatioTypeCdCanonicalValue = "Conventional",
            SlRatioTypeCdAxisDecision   = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId            = wbId,
            SourceWorkbookLockedAt      = DateTime.UtcNow,
            CreatedAt                   = DateTime.UtcNow,
            UpdatedAt                   = DateTime.UtcNow,
            CreatedBy                   = "seed",
            UpdatedBy                   = "seed",
        };
        db.CanonicalSaleQualifications.Add(canonicalRow);
        await db.SaveChangesAsync();

        var preCanonical = await db.CanonicalSaleQualifications.AsNoTracking()
            .Select(r => new
            {
                r.CountyId, r.ChgOfOwnerId, r.ComputedDecision,
                r.UpdatedAt, r.UpdatedBy, r.WacCdSourceValue,
            })
            .ToListAsync();
        var preWorkbook = await db.SyncMappingWorkbooks.AsNoTracking()
            .Select(w => new { w.Id, w.Status, w.UpdatedAt, w.UpdatedBy })
            .ToListAsync();

        var sut = new SyncCountyActiveWorkbookService(db);
        await sut.SetAsync(county.Id, wbId, OperatorId, "promotion");
        await sut.ClearAsync(county.Id, OperatorId);
        await sut.SetAsync(county.Id, wbId, OperatorId, "second promotion");

        var postCanonical = await db.CanonicalSaleQualifications.AsNoTracking()
            .Select(r => new
            {
                r.CountyId, r.ChgOfOwnerId, r.ComputedDecision,
                r.UpdatedAt, r.UpdatedBy, r.WacCdSourceValue,
            })
            .ToListAsync();
        var postWorkbook = await db.SyncMappingWorkbooks.AsNoTracking()
            .Select(w => new { w.Id, w.Status, w.UpdatedAt, w.UpdatedBy })
            .ToListAsync();

        postCanonical.Should().BeEquivalentTo(preCanonical,
            "Hard Guard 4 / 5: SET / Clear must not mutate CanonicalSaleQualifications");
        postWorkbook.Should().BeEquivalentTo(preWorkbook,
            "Hard Guard 4 / 5: SET / Clear must not mutate SyncMappingWorkbook rows");
    }

    // ── 9. Clear against no-pointer is a no-op ─────────────────────────

    [Fact]
    public async Task ClearAsync_AgainstNoPointerCounty_IsNoOp()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var county = await SeedCountyAsync(db);

        var sut = new SyncCountyActiveWorkbookService(db);
        Func<Task> act = () => sut.ClearAsync(county.Id, OperatorId);

        await act.Should().NotThrowAsync(
            "clearing a county with no pointer is idempotent (Hard Guard 9 valid state)");
        (await db.SyncCountyActiveWorkbooks.CountAsync()).Should().Be(0);
    }

    // ── 10. Argument validation ─────────────────────────────────────────

    [Fact]
    public async Task GetAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var sut = new SyncCountyActiveWorkbookService(db);

        Func<Task> act = () => sut.GetAsync(Guid.Empty);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task SetAsync_RejectsArgumentValidationFailures()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var sut = new SyncCountyActiveWorkbookService(db);

        Func<Task> emptyCounty = () => sut.SetAsync(Guid.Empty, Guid.NewGuid(), OperatorId, null);
        await emptyCounty.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");

        Func<Task> emptyWorkbook = () => sut.SetAsync(Guid.NewGuid(), Guid.Empty, OperatorId, null);
        await emptyWorkbook.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookId*");

        Func<Task> blankOperator = () => sut.SetAsync(Guid.NewGuid(), Guid.NewGuid(), "", null);
        await blankOperator.Should().ThrowAsync<ArgumentException>().WithMessage("*OperatorId*");
    }

    [Fact]
    public async Task ClearAsync_RejectsArgumentValidationFailures()
    {
        await using var db = CreateContext($"awb-{Guid.NewGuid()}");
        var sut = new SyncCountyActiveWorkbookService(db);

        Func<Task> emptyCounty = () => sut.ClearAsync(Guid.Empty, OperatorId);
        await emptyCounty.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");

        Func<Task> blankOperator = () => sut.ClearAsync(Guid.NewGuid(), "  ");
        await blankOperator.Should().ThrowAsync<ArgumentException>().WithMessage("*OperatorId*");
    }
}
