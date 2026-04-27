using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Slice C6 tests: <see cref="SyncMappingWorkbookLockService"/> transitions
/// a Draft workbook to Mapped only when every column + code-value row is
/// in a terminal review status (Mapped / Excluded / Deferred). Pattern
/// matches the C2/C3/C5 tests — InMemory provider, fresh database name
/// per test for isolation.
/// </summary>
public class SyncMappingWorkbookLockServiceTests
{
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

    private static async Task<(County county, SyncSourceConnection conn, SyncBatch batch)>
        SeedScopeAsync(TerraFusionDbContext db, string countyName = "Benton")
    {
        var county = new County
        {
            Id       = Guid.NewGuid(),
            Name     = countyName,
            State    = "WA",
            FipsCode = countyName == "Benton" ? "53005" : "53011",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id              = Guid.NewGuid(),
            CountyId        = county.Id,
            Name            = $"{countyName} PACS OLTP",
            SourceSystem    = "PACS",
            ConnectionType  = "SqlServer",
            Server          = "localhost,1433",
            Database        = "pacs_oltp",
            AuthMode        = "SqlAuth",
            IsActive        = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId       = county.Id,
            SourceSystem   = "PACS",
            Mode           = "profile",
            Status         = "completed",
            StartedAtUtc   = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount      = 0,
        };
        db.SyncBatches.Add(batch);

        await db.SaveChangesAsync();
        return (county, conn, batch);
    }

    private static SyncMappingWorkbook NewWorkbook(
        Guid countyId, Guid connectionId, Guid batchId, string name, string status = "Draft")
        => new()
        {
            CountyId           = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId     = batchId,
            Name               = name,
            Status             = status,
        };

    private static SyncMappingColumn NewColumn(
        Guid countyId, Guid workbookId, string sourceTable, string sourceColumn, string lane,
        string reviewStatus = "Mapped",
        string? canonicalTarget = "canonical.Target")
        => new()
        {
            CountyId        = countyId,
            WorkbookId      = workbookId,
            SourceSchema    = "dbo",
            SourceTable     = sourceTable,
            SourceColumn    = sourceColumn,
            MappingLane     = lane,
            ReviewStatus    = reviewStatus,
            CanonicalTarget = canonicalTarget,
        };

    private static SyncMappingCodeValue NewCodeValue(
        Guid countyId, Guid columnId, string sourceValue,
        string reviewStatus = "Mapped",
        string? canonicalValue = "CanonicalVal",
        bool isExcluded = false)
        => new()
        {
            CountyId        = countyId,
            MappingColumnId = columnId,
            SourceValue     = sourceValue,
            ReviewStatus    = reviewStatus,
            CanonicalValue  = canonicalValue,
            IsExcluded      = isExcluded,
        };

    /// <summary>
    /// Seeds a workbook with N=1 column + M=2 code-values, all in
    /// terminal-review state. Tests that need failure cases mutate one
    /// of the rows post-seed.
    /// </summary>
    private static async Task<SyncMappingWorkbook> SeedFullyReviewedWorkbookAsync(
        TerraFusionDbContext db, Guid countyId, Guid connectionId, Guid batchId,
        string name = "lockable-wb")
    {
        var wb = NewWorkbook(countyId, connectionId, batchId, name);
        db.SyncMappingWorkbooks.Add(wb);

        var col = NewColumn(countyId, wb.Id, "property_val", "property_use_cd", "Valuation");
        db.SyncMappingColumns.Add(col);

        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col.Id, "11"));
        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col.Id, "18", reviewStatus: "Excluded",
            canonicalValue: null, isExcluded: true));

        await db.SaveChangesAsync();
        return wb;
    }

    // ── Happy path ───────────────────────────────────────────────────────

    [Fact]
    public async Task LockAsync_SetsDraftWorkbookToMapped_WhenAllRowsReviewed()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = await SeedFullyReviewedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookLockService(db);

        var result = await sut.LockAsync(county.Id, wb.Id);

        result.WorkbookId.Should().Be(wb.Id);
        result.Status.Should().Be("Mapped");
        result.ColumnsValidated.Should().Be(1);
        result.CodeValuesValidated.Should().Be(2);

        // Reload to confirm Status flipped + UpdatedAt bumped.
        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        reloaded.Status.Should().Be("Mapped");
    }

    [Fact]
    public async Task LockAsync_AllowsDeferredAndExcludedRows()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "mixed-terminal");
        db.SyncMappingWorkbooks.Add(wb);

        var col = NewColumn(county.Id, wb.Id, "property_val", "property_use_cd", "Valuation",
            reviewStatus: "Deferred");
        db.SyncMappingColumns.Add(col);

        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "11", reviewStatus: "Mapped"));
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "18", reviewStatus: "Excluded",
            canonicalValue: null, isExcluded: true));
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "83", reviewStatus: "Deferred",
            canonicalValue: null));
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        var result = await sut.LockAsync(county.Id, wb.Id);

        result.Status.Should().Be("Mapped");
        result.ColumnsValidated.Should().Be(1);
        result.CodeValuesValidated.Should().Be(3);
    }

    // ── Reject non-terminal review statuses ─────────────────────────────

    [Fact]
    public async Task LockAsync_RejectsWorkbookWithColumnNeedsReview()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "col-needs-review");
        db.SyncMappingWorkbooks.Add(wb);
        var col = NewColumn(county.Id, wb.Id, "property_val", "property_use_cd", "Valuation",
            reviewStatus: "NeedsReview");
        db.SyncMappingColumns.Add(col);
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "11", reviewStatus: "Mapped"));
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);

        Func<Task> act = () => sut.LockAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*1 column(s)*0 code-value(s)*property_val.property_use_cd*NeedsReview*");

        // Workbook stayed Draft.
        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        reloaded.Status.Should().Be("Draft");
    }

    [Fact]
    public async Task LockAsync_RejectsWorkbookWithCodeValueNeedsReview()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "value-needs-review");
        db.SyncMappingWorkbooks.Add(wb);
        var col = NewColumn(county.Id, wb.Id, "sale", "wac_cd", "Sales", reviewStatus: "Mapped");
        db.SyncMappingColumns.Add(col);
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "458-61A-203(1)",
            reviewStatus: "NeedsReview", canonicalValue: null));
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "458-61A-217(1)",
            reviewStatus: "Mapped"));
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);

        Func<Task> act = () => sut.LockAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*0 column(s)*1 code-value(s)*458-61A-203(1)*NeedsReview*");

        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        reloaded.Status.Should().Be("Draft");
    }

    [Fact]
    public async Task LockAsync_RejectsWorkbookWithInProgressRows()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "in-progress");
        db.SyncMappingWorkbooks.Add(wb);
        var col = NewColumn(county.Id, wb.Id, "imprv_detail", "imprv_det_class_cd", "Improvement",
            reviewStatus: "InProgress");
        db.SyncMappingColumns.Add(col);
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "Avg", reviewStatus: "InProgress"));
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        Func<Task> act = () => sut.LockAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*1 column(s)*1 code-value(s)*InProgress*");

        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        reloaded.Status.Should().Be("Draft");
    }

    // ── Reject non-Draft workbook statuses ──────────────────────────────

    [Fact]
    public async Task LockAsync_RejectsAlreadyMappedWorkbook()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        // Even with all rows terminal, an already-Mapped workbook should
        // refuse to re-lock — locking is a one-way transition.
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "already-mapped", status: "Mapped");
        db.SyncMappingWorkbooks.Add(wb);
        var col = NewColumn(county.Id, wb.Id, "property_val", "property_use_cd", "Valuation");
        db.SyncMappingColumns.Add(col);
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "11"));
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        Func<Task> act = () => sut.LockAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Mapped'*Only workbooks with Status='Draft'*");
    }

    [Theory]
    [InlineData("Approved")]
    [InlineData("Archived")]
    [InlineData("Locked")]      // not a real status but the gate must catch it
    public async Task LockAsync_RejectsAnyNonDraftWorkbookStatus(string status)
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, $"non-draft-{status}", status: status);
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        Func<Task> act = () => sut.LockAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*Status='{status}'*");
    }

    // ── County isolation ────────────────────────────────────────────────

    [Fact]
    public async Task LockAsync_IsCountyScoped()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, _,    _)       = await SeedScopeAsync(db, "Yakima");

        var wbA = await SeedFullyReviewedWorkbookAsync(db, countyA.Id, connA.Id, batchA.Id, "A wb");

        var sut = new SyncMappingWorkbookLockService(db);

        // Try to lock A's workbook with B's CountyId — must refuse.
        Func<Task> act = () => sut.LockAsync(countyB.Id, wbA.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found for county {countyB.Id}*");

        // A's workbook stayed Draft.
        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbA.Id);
        reloaded.Status.Should().Be("Draft");
    }

    // ── Read-only of canonical decisions ────────────────────────────────

    [Fact]
    public async Task LockAsync_DoesNotModifyCanonicalTargets()
    {
        // The lock service VALIDATES — it does not author. CanonicalTarget
        // and CanonicalValue must round-trip unchanged through a successful
        // lock.
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "preserve-targets");
        db.SyncMappingWorkbooks.Add(wb);

        var col = NewColumn(county.Id, wb.Id, "property_val", "property_use_cd", "Valuation",
            reviewStatus: "Mapped",
            canonicalTarget: "canonical.PropertyUseCode");
        db.SyncMappingColumns.Add(col);

        var v1 = NewCodeValue(county.Id, col.Id, "11",
            reviewStatus: "Mapped",   canonicalValue: "Residential");
        var v2 = NewCodeValue(county.Id, col.Id, "18",
            reviewStatus: "Excluded", canonicalValue: null, isExcluded: true);
        db.SyncMappingCodeValues.AddRange(v1, v2);
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        await sut.LockAsync(county.Id, wb.Id);

        var reloadedCol = await db.SyncMappingColumns.AsNoTracking().SingleAsync(c => c.Id == col.Id);
        reloadedCol.CanonicalTarget.Should().Be("canonical.PropertyUseCode");
        reloadedCol.ReviewStatus.Should().Be("Mapped");

        var values = await db.SyncMappingCodeValues.AsNoTracking()
            .Where(v => v.MappingColumnId == col.Id)
            .OrderBy(v => v.SourceValue).ToListAsync();
        values[0].SourceValue.Should().Be("11");
        values[0].CanonicalValue.Should().Be("Residential");
        values[0].IsExcluded.Should().BeFalse();
        values[1].SourceValue.Should().Be("18");
        values[1].CanonicalValue.Should().BeNull();
        values[1].IsExcluded.Should().BeTrue();
    }

    [Fact]
    public async Task LockAsync_DoesNotAutoExcludeWacCodes()
    {
        // Memory-flagged scenario: the lock service must not silently flip
        // IsExcluded on WAC codes (or any other rows). It can only validate
        // what the operator already decided. Test a workbook where
        // operator EXPLICITLY mapped WAC codes (IsExcluded=false,
        // ReviewStatus=Mapped) and confirm that survives the lock.
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "wac-not-auto-excluded");
        db.SyncMappingWorkbooks.Add(wb);

        var col = NewColumn(county.Id, wb.Id, "sale", "wac_cd", "Sales",
            reviewStatus: "Mapped");
        db.SyncMappingColumns.Add(col);

        // Operator decision: this exempt-transfer code stays in the comp
        // pool because they haven't decided to exclude yet — they MAPPED
        // it to the canonical "ArmsLengthSale" lane.
        db.SyncMappingCodeValues.Add(NewCodeValue(
            county.Id, col.Id, "458-61A-203(1)",
            reviewStatus: "Mapped",
            canonicalValue: "ArmsLengthSale",
            isExcluded: false));
        // And another one that the operator DID excludethemselves.
        db.SyncMappingCodeValues.Add(NewCodeValue(
            county.Id, col.Id, "458-61A-217(1)",
            reviewStatus: "Excluded",
            canonicalValue: null,
            isExcluded: true));
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        await sut.LockAsync(county.Id, wb.Id);

        var reloaded = await db.SyncMappingCodeValues.AsNoTracking()
            .Where(v => v.MappingColumnId == col.Id)
            .OrderBy(v => v.SourceValue).ToListAsync();
        reloaded[0].SourceValue.Should().Be("458-61A-203(1)");
        reloaded[0].IsExcluded.Should().BeFalse();   // NOT auto-flipped
        reloaded[0].CanonicalValue.Should().Be("ArmsLengthSale");
        reloaded[1].SourceValue.Should().Be("458-61A-217(1)");
        reloaded[1].IsExcluded.Should().BeTrue();    // operator-decided, untouched
    }

    // ── Empty-workbook edge case ────────────────────────────────────────

    [Fact]
    public async Task LockAsync_WorkbookWithNoColumnsOrValues_LocksTrivially()
    {
        // A workbook with zero columns has nothing to validate — locking
        // succeeds trivially. Defensible: the operator created a workbook,
        // didn't add anything, and decided it was done.
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "empty-wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookLockService(db);
        var result = await sut.LockAsync(county.Id, wb.Id);

        result.Status.Should().Be("Mapped");
        result.ColumnsValidated.Should().Be(0);
        result.CodeValuesValidated.Should().Be(0);
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task LockAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookLockService(db);
        Func<Task> act = () => sut.LockAsync(Guid.Empty, Guid.NewGuid());
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task LockAsync_RejectsEmptyWorkbookId()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookLockService(db);
        Func<Task> act = () => sut.LockAsync(Guid.NewGuid(), Guid.Empty);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookId*");
    }

    [Fact]
    public async Task LockAsync_RejectsMissingWorkbook()
    {
        await using var db = CreateContext($"lock-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookLockService(db);
        var phantomId = Guid.NewGuid();
        var phantomCounty = Guid.NewGuid();

        Func<Task> act = () => sut.LockAsync(phantomCounty, phantomId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{phantomId}*not found for county {phantomCounty}*");
    }
}
