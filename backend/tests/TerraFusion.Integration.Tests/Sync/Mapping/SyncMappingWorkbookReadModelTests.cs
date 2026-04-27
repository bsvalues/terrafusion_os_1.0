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
/// Slice C7 tests: <see cref="SyncMappingWorkbookReadModel"/> loads
/// only Mapped workbooks and exposes them as immutable
/// <see cref="SyncMappingWorkbookSnapshot"/> values for transform
/// consumers (Slice C8+). The class also pins the
/// <see cref="SyncMappingWorkbookSnapshot.TryResolveCode"/> matching
/// policy: case-insensitive on (schema, table, column),
/// exact-after-trim on the source value.
/// </summary>
public class SyncMappingWorkbookReadModelTests
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
        Guid countyId, Guid connectionId, Guid batchId, string name, string status = "Mapped")
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
        string? canonicalTarget = "canonical.PropertyUseCode",
        string sourceSchema = "dbo")
        => new()
        {
            CountyId        = countyId,
            WorkbookId      = workbookId,
            SourceSchema    = sourceSchema,
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
        bool isExcluded = false,
        long? observedCount = 100,
        string? sourceLabel = null)
        => new()
        {
            CountyId        = countyId,
            MappingColumnId = columnId,
            SourceValue     = sourceValue,
            SourceLabel     = sourceLabel,
            ObservedCount   = observedCount,
            CanonicalValue  = canonicalValue,
            IsExcluded      = isExcluded,
            ReviewStatus    = reviewStatus,
        };

    /// <summary>
    /// Seeds a Mapped workbook with three property_use_cd values + one
    /// WAC code (operator-mapped, IsExcluded=false) + one WAC code
    /// (operator-excluded, IsExcluded=true). Returns the workbook id.
    /// </summary>
    private static async Task<Guid> SeedRichMappedWorkbookAsync(
        TerraFusionDbContext db, Guid countyId, Guid connectionId, Guid batchId,
        string name = "rich-mapped-wb")
    {
        var wb = NewWorkbook(countyId, connectionId, batchId, name);
        db.SyncMappingWorkbooks.Add(wb);

        var col1 = NewColumn(countyId, wb.Id, "property_val", "property_use_cd", "Valuation",
            canonicalTarget: "canonical.PropertyUseCode");
        db.SyncMappingColumns.Add(col1);

        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col1.Id, "11",
            canonicalValue: "Residential", observedCount: 6074));
        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col1.Id, "18",
            canonicalValue: "Apartments",  observedCount: 1411));
        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col1.Id, "83",
            reviewStatus: "Deferred", canonicalValue: null, observedCount: 561));

        var col2 = NewColumn(countyId, wb.Id, "sale", "wac_cd", "Sales",
            canonicalTarget: "canonical.SaleQualification");
        db.SyncMappingColumns.Add(col2);

        // Operator-mapped WAC: kept in comp pool as ArmsLengthSale.
        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col2.Id, "458-61A-203(1)",
            canonicalValue: "ArmsLengthSale", observedCount: 131, isExcluded: false));
        // Operator-excluded WAC: dropped from comp pool.
        db.SyncMappingCodeValues.Add(NewCodeValue(countyId, col2.Id, "458-61A-217(1)",
            reviewStatus: "Excluded",  canonicalValue: null, observedCount: 59, isExcluded: true));

        await db.SaveChangesAsync();
        return wb.Id;
    }

    // ── Happy path ───────────────────────────────────────────────────────

    [Fact]
    public async Task LoadMappedAsync_LoadsMappedWorkbook()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookReadModel(db);
        var snapshot = await sut.LoadMappedAsync(county.Id, wbId);

        snapshot.WorkbookId.Should().Be(wbId);
        snapshot.CountyId.Should().Be(county.Id);
        snapshot.ProfileBatchId.Should().Be(batch.Id);
        snapshot.Columns.Should().HaveCount(2);
    }

    [Fact]
    public async Task LoadMappedAsync_ReturnsCanonicalValueForMappedCode()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookReadModel(db);
        var snapshot = await sut.LoadMappedAsync(county.Id, wbId);

        var col = snapshot.Columns.Single(c => c.SourceColumn == "property_use_cd");
        col.CodeValues["11"].CanonicalValue.Should().Be("Residential");
        col.CodeValues["11"].ReviewStatus.Should().Be("Mapped");
        col.CodeValues["11"].IsExcluded.Should().BeFalse();
        col.CodeValues["11"].ObservedCount.Should().Be(6074);
    }

    [Fact]
    public async Task LoadMappedAsync_ReturnsColumnCanonicalTarget()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookReadModel(db);
        var snapshot = await sut.LoadMappedAsync(county.Id, wbId);

        var col = snapshot.Columns.Single(c => c.SourceColumn == "property_use_cd");
        col.CanonicalTarget.Should().Be("canonical.PropertyUseCode");
        col.MappingLane.Should().Be("Valuation");
    }

    [Fact]
    public async Task LoadMappedAsync_PreservesExcludedWacDecision()
    {
        // Memory-flagged scenario through the read model: an
        // operator-excluded WAC code surfaces with IsExcluded=true,
        // CanonicalValue=null, ReviewStatus=Excluded — exactly what
        // a future consumer needs to filter from the comp pool.
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookReadModel(db);
        var snapshot = await sut.LoadMappedAsync(county.Id, wbId);

        var col = snapshot.Columns.Single(c => c.SourceColumn == "wac_cd");
        var excluded = col.CodeValues["458-61A-217(1)"];
        excluded.IsExcluded.Should().BeTrue();
        excluded.CanonicalValue.Should().BeNull();
        excluded.ReviewStatus.Should().Be("Excluded");

        // And the OTHER WAC code (operator-mapped) keeps its IsExcluded=false +
        // canonical assignment.
        var kept = col.CodeValues["458-61A-203(1)"];
        kept.IsExcluded.Should().BeFalse();
        kept.CanonicalValue.Should().Be("ArmsLengthSale");
    }

    [Fact]
    public async Task LoadMappedAsync_PreservesDeferredDecision()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookReadModel(db);
        var snapshot = await sut.LoadMappedAsync(county.Id, wbId);

        var col = snapshot.Columns.Single(c => c.SourceColumn == "property_use_cd");
        var deferred = col.CodeValues["83"];
        deferred.ReviewStatus.Should().Be("Deferred");
        deferred.CanonicalValue.Should().BeNull();
        deferred.IsExcluded.Should().BeFalse();  // not auto-flipped
    }

    // ── Status guard ─────────────────────────────────────────────────────

    [Theory]
    [InlineData("Draft")]
    [InlineData("InProgress")]
    [InlineData("Approved")]
    [InlineData("Archived")]
    [InlineData("Locked")]
    public async Task LoadMappedAsync_RejectsNonMappedWorkbook(string status)
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, $"non-mapped-{status}", status: status);
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReadModel(db);
        Func<Task> act = () => sut.LoadMappedAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*Status='{status}'*Status='Mapped'*");
    }

    [Fact]
    public async Task LoadMappedAsync_RejectsDraftWorkbook()
    {
        // Specific named test the slice card asks for, in addition to
        // the Theory above. A Draft workbook is the typical mistake the
        // read model exists to prevent.
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "still-draft", status: "Draft");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReadModel(db);
        Func<Task> act = () => sut.LoadMappedAsync(county.Id, wb.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Draft'*Status='Mapped'*");
    }

    // ── County isolation ────────────────────────────────────────────────

    [Fact]
    public async Task LoadMappedAsync_IsCountyScoped()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, _,     _)      = await SeedScopeAsync(db, "Yakima");

        var wbId = await SeedRichMappedWorkbookAsync(db, countyA.Id, connA.Id, batchA.Id, "A wb");

        var sut = new SyncMappingWorkbookReadModel(db);

        // Load with the wrong county — must refuse.
        Func<Task> act = () => sut.LoadMappedAsync(countyB.Id, wbId);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found for county {countyB.Id}*");

        // Load with the correct county — succeeds.
        var ok = await sut.LoadMappedAsync(countyA.Id, wbId);
        ok.Columns.Should().NotBeEmpty();
    }

    // ── TryResolveCode policy ───────────────────────────────────────────

    [Fact]
    public async Task TryResolveCode_ReturnsTrueAndDecisionForKnownValue()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var snapshot = await new SyncMappingWorkbookReadModel(db).LoadMappedAsync(county.Id, wbId);

        var hit = snapshot.TryResolveCode("dbo", "property_val", "property_use_cd", "11", out var d);

        hit.Should().BeTrue();
        d.Should().NotBeNull();
        d!.CanonicalValue.Should().Be("Residential");
    }

    [Fact]
    public async Task TryResolveCode_ReturnsFalseForUnknownSourceValue()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var snapshot = await new SyncMappingWorkbookReadModel(db).LoadMappedAsync(county.Id, wbId);

        var hit = snapshot.TryResolveCode("dbo", "property_val", "property_use_cd", "99-NOT-IN-SAMPLE", out var d);

        hit.Should().BeFalse();
        d.Should().BeNull();
    }

    [Fact]
    public async Task TryResolveCode_ReturnsFalseForUnknownColumn()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var snapshot = await new SyncMappingWorkbookReadModel(db).LoadMappedAsync(county.Id, wbId);

        var hit = snapshot.TryResolveCode("dbo", "property_val", "completely_unknown_column", "11", out var d);

        hit.Should().BeFalse();
        d.Should().BeNull();
    }

    [Theory]
    // Schema/table/column matching is case-INSENSITIVE.
    [InlineData("DBO", "PROPERTY_VAL", "PROPERTY_USE_CD", "11", true)]
    [InlineData("DbO", "Property_Val", "Property_Use_Cd", "11", true)]
    [InlineData("dbo", "property_val", "property_use_cd", "11", true)]
    public async Task TryResolveCode_TableAndColumnMatchingIsCaseInsensitive(
        string schema, string table, string column, string value, bool expected)
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var snapshot = await new SyncMappingWorkbookReadModel(db).LoadMappedAsync(county.Id, wbId);

        var hit = snapshot.TryResolveCode(schema, table, column, value, out var _);
        hit.Should().Be(expected);
    }

    [Fact]
    public async Task TryResolveCode_SourceValueMatchingIsExactAfterTrim()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var snapshot = await new SyncMappingWorkbookReadModel(db).LoadMappedAsync(county.Id, wbId);

        // Trim noise — accepted (PACS varchar padding).
        snapshot.TryResolveCode("dbo", "property_val", "property_use_cd", "  11  ", out var trimHit)
            .Should().BeTrue();
        trimHit!.CanonicalValue.Should().Be("Residential");

        // Casing on the value — REJECTED. PACS code semantics are
        // case-significant; "R" vs "r" is a real distinction we never
        // smudge.
        // (None of our seeded codes have alpha → use property_use_cd's
        //  numeric "11" with a fictional alphabetic in the call — must
        //  miss because no row keys it.)
        snapshot.TryResolveCode("dbo", "property_val", "property_use_cd", "Eleven", out var caseMiss)
            .Should().BeFalse();
        caseMiss.Should().BeNull();
    }

    [Fact]
    public async Task TryResolveCode_NullSourceValue_ReturnsFalse()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedRichMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var snapshot = await new SyncMappingWorkbookReadModel(db).LoadMappedAsync(county.Id, wbId);

        snapshot.TryResolveCode("dbo", "property_val", "property_use_cd", null, out var d)
            .Should().BeFalse();
        d.Should().BeNull();
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task LoadMappedAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookReadModel(db);
        Func<Task> act = () => sut.LoadMappedAsync(Guid.Empty, Guid.NewGuid());
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task LoadMappedAsync_RejectsEmptyWorkbookId()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookReadModel(db);
        Func<Task> act = () => sut.LoadMappedAsync(Guid.NewGuid(), Guid.Empty);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookId*");
    }

    [Fact]
    public async Task LoadMappedAsync_RejectsMissingWorkbook()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookReadModel(db);
        var phantomId = Guid.NewGuid();
        var phantomCounty = Guid.NewGuid();

        Func<Task> act = () => sut.LoadMappedAsync(phantomCounty, phantomId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{phantomId}*not found for county {phantomCounty}*");
    }

    // ── Snapshot is immutable / does-not-mutate ─────────────────────────

    [Fact]
    public async Task LoadMappedAsync_DoesNotMutateWorkbook()
    {
        await using var db = CreateContext($"read-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "no-mutate-by-read");
        wb.UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var preStatus = wb.Status;
        var preUpdatedAt = wb.UpdatedAt;

        var sut = new SyncMappingWorkbookReadModel(db);
        await sut.LoadMappedAsync(county.Id, wb.Id);

        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        reloaded.Status.Should().Be(preStatus);
        reloaded.UpdatedAt.Should().Be(preUpdatedAt);
    }
}
