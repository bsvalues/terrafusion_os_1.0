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
/// Slice C5 tests: <see cref="SyncMappingWorkbookExporter"/> turns a
/// county-scoped Mapping Workbook into review-safe CSV/Markdown
/// artifacts. Pattern matches the C2/C3 tests — InMemory provider,
/// fresh database name per test, tempdir output for the on-disk writes.
/// </summary>
public class SyncMappingWorkbookExporterTests : IDisposable
{
    private readonly string _tempRoot;

    public SyncMappingWorkbookExporterTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), $"tfb-c5-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempRoot);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            try { Directory.Delete(_tempRoot, recursive: true); }
            catch { /* best-effort */ }
        }
    }

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

    private static SyncMappingWorkbook NewWorkbook(Guid countyId, Guid connectionId, Guid batchId, string name)
        => new()
        {
            CountyId           = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId     = batchId,
            Name               = name,
            Status             = "Draft",
        };

    private static SyncMappingColumn NewColumn(
        Guid countyId, Guid workbookId, string sourceTable, string sourceColumn, string lane,
        int? distinctCount = null, decimal? distinctRatio = null,
        string? canonicalTarget = null, string reviewStatus = "NeedsReview")
        => new()
        {
            CountyId       = countyId,
            WorkbookId     = workbookId,
            SourceSchema   = "dbo",
            SourceTable    = sourceTable,
            SourceColumn   = sourceColumn,
            MappingLane    = lane,
            DistinctCount  = distinctCount,
            DistinctRatio  = distinctRatio,
            CanonicalTarget = canonicalTarget,
            ReviewStatus   = reviewStatus,
        };

    private static SyncMappingCodeValue NewCodeValue(
        Guid countyId, Guid columnId, string sourceValue, long? observedCount,
        string? canonicalValue = null, bool isExcluded = false,
        string? notes = null, string? sourceLabel = null)
        => new()
        {
            CountyId        = countyId,
            MappingColumnId = columnId,
            SourceValue     = sourceValue,
            SourceLabel     = sourceLabel,
            ObservedCount   = observedCount,
            CanonicalValue  = canonicalValue,
            IsExcluded      = isExcluded,
            ReviewStatus    = canonicalValue is not null ? "Mapped" : "NeedsReview",
            Notes           = notes,
        };

    // ── Pure CSV escape ──────────────────────────────────────────────────
    //
    // RFC 4180-ish: enclose in quotes when the value contains a comma,
    // quote, or line terminator; double inner quotes. Null/empty stays
    // empty.

    [Theory]
    [InlineData(null,                "")]
    [InlineData("",                  "")]
    [InlineData("plain",             "plain")]
    [InlineData("with,comma",        "\"with,comma\"")]
    [InlineData("with \"quote\"",    "\"with \"\"quote\"\"\"")]
    [InlineData("with\nnewline",     "\"with\nnewline\"")]
    [InlineData("with\rcr",          "\"with\rcr\"")]
    public void CsvEscape_HandlesAllSpecialCharacters(string? raw, string expected)
    {
        SyncMappingWorkbookExporter.CsvEscape(raw).Should().Be(expected);
    }

    // ── BuildColumnsCsv (pure) ───────────────────────────────────────────

    [Fact]
    public void BuildColumnsCsv_HeaderAndRowsMatchExpectedShape()
    {
        var workbookId = Guid.NewGuid();
        var workbook = new SyncMappingWorkbook
        {
            Id = workbookId,
            CountyId = Guid.NewGuid(),
            SourceConnectionId = Guid.NewGuid(),
            ProfileBatchId = Guid.NewGuid(),
            Name = "wb",
            Status = "Draft",
        };

        var col1 = NewColumn(workbook.CountyId, workbookId, "property_val", "property_use_cd", "Valuation",
            distinctCount: 63, distinctRatio: 0.0061m, canonicalTarget: "canonical.PropertyUseCode");
        var col2 = NewColumn(workbook.CountyId, workbookId, "sale", "wac_cd", "Sales",
            distinctCount: 55, distinctRatio: 0.0056m);

        var csv = SyncMappingWorkbookExporter.BuildColumnsCsv(workbook, new[] { col1, col2 });

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                       .Select(l => l.TrimEnd('\r'))
                       .ToArray();
        lines[0].Should().Be(string.Join(",", SyncMappingWorkbookExporter.ColumnsCsvHeader));
        lines.Should().HaveCount(3);  // header + 2 rows
        lines[1].Should().Contain("Valuation");
        lines[1].Should().Contain("property_val");
        lines[1].Should().Contain("property_use_cd");
        lines[1].Should().Contain("0.0061");
        lines[1].Should().Contain("canonical.PropertyUseCode");
        lines[2].Should().Contain("Sales");
        lines[2].Should().Contain("wac_cd");
        // Empty canonical target on col2 → trailing comma sequence (no value).
    }

    [Fact]
    public void BuildColumnsCsv_HandlesCommaAndQuoteInValues()
    {
        var workbookId = Guid.NewGuid();
        var workbook = new SyncMappingWorkbook
        {
            Id = workbookId, CountyId = Guid.NewGuid(),
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb", Status = "Draft",
        };

        // Notes contains a comma AND a quote — must round-trip via the
        // escape rules without breaking field count.
        var col = NewColumn(workbook.CountyId, workbookId, "neighborhood", "nbhd_descr", "Neighborhood");
        col.Notes = "He said \"hi, friend\" and left.";

        var csv = SyncMappingWorkbookExporter.BuildColumnsCsv(workbook, new[] { col });

        // The notes cell should be wrapped in quotes with the inner
        // quotes doubled.
        csv.Should().Contain("\"He said \"\"hi, friend\"\" and left.\"");
    }

    // ── BuildCodeValuesCsv (pure) ────────────────────────────────────────

    [Fact]
    public void BuildCodeValuesCsv_PreservesIsExcludedAsLowercaseString()
    {
        var workbookId = Guid.NewGuid();
        var workbook = new SyncMappingWorkbook
        {
            Id = workbookId, CountyId = Guid.NewGuid(),
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb", Status = "Draft",
        };
        var col = NewColumn(workbook.CountyId, workbookId, "sale", "wac_cd", "Sales");
        var values = new List<SyncMappingCodeValue>
        {
            NewCodeValue(workbook.CountyId, col.Id, "458-61A-203(1)", 131, isExcluded: false),
            NewCodeValue(workbook.CountyId, col.Id, "458-61A-217(1)",  59, isExcluded: true,
                canonicalValue: null,
                notes: "exempt transfer; hold for review"),
        };
        var byColumn = new Dictionary<Guid, List<SyncMappingCodeValue>> { [col.Id] = values };

        var csv = SyncMappingWorkbookExporter.BuildCodeValuesCsv(workbook, new[] { col }, byColumn);

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                       .Select(l => l.TrimEnd('\r'))
                       .ToArray();
        lines.Should().HaveCount(3);  // header + 2 rows
        lines[1].Should().Contain(",false,");
        lines[2].Should().Contain(",true,");
    }

    [Fact]
    public void BuildCodeValuesCsv_NoValues_OnlyHeaderRowEmitted()
    {
        var workbookId = Guid.NewGuid();
        var workbook = new SyncMappingWorkbook
        {
            Id = workbookId, CountyId = Guid.NewGuid(),
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "wb", Status = "Draft",
        };
        var col = NewColumn(workbook.CountyId, workbookId, "neighborhood", "nbhd_descr", "Neighborhood");

        var csv = SyncMappingWorkbookExporter.BuildCodeValuesCsv(
            workbook,
            new[] { col },
            new Dictionary<Guid, List<SyncMappingCodeValue>>());

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                       .Select(l => l.TrimEnd('\r'))
                       .ToArray();
        lines.Should().HaveCount(1);
        lines[0].Should().Be(string.Join(",", SyncMappingWorkbookExporter.CodeValuesCsvHeader));
    }

    // ── BuildMarkdown (pure) ─────────────────────────────────────────────

    [Fact]
    public void BuildMarkdown_OrdersByPriorityLaneAndIncludesTopValues()
    {
        var workbookId = Guid.NewGuid();
        var workbook = new SyncMappingWorkbook
        {
            Id = workbookId, CountyId = Guid.NewGuid(),
            SourceConnectionId = Guid.NewGuid(), ProfileBatchId = Guid.NewGuid(),
            Name = "Benton OLTP wb", Status = "Draft",
        };

        // One column per priority lane + one Other.
        var colVal     = NewColumn(workbook.CountyId, workbookId, "property_val", "property_use_cd", "Valuation",
            distinctCount: 63, distinctRatio: 0.0061m);
        var colSale    = NewColumn(workbook.CountyId, workbookId, "sale", "wac_cd", "Sales",
            distinctCount: 55, distinctRatio: 0.0056m);
        var colImprv   = NewColumn(workbook.CountyId, workbookId, "imprv_detail", "imprv_det_class_cd", "Improvement",
            distinctCount: 21, distinctRatio: 0.0022m);
        var colLand    = NewColumn(workbook.CountyId, workbookId, "land_detail", "land_soil_code", "Land",
            distinctCount: 36, distinctRatio: 0.0036m);
        var colHood    = NewColumn(workbook.CountyId, workbookId, "neighborhood", "nbhd_descr", "Neighborhood",
            distinctCount: 95, distinctRatio: 0.0034m);
        var colOther   = NewColumn(workbook.CountyId, workbookId, "property_val", "sup_desc", "Other",
            distinctCount: 85, distinctRatio: 0.0082m);

        var byColumn = new Dictionary<Guid, List<SyncMappingCodeValue>>
        {
            [colVal.Id]   = new() { NewCodeValue(workbook.CountyId, colVal.Id,   "11", 6074) },
            [colSale.Id]  = new() { NewCodeValue(workbook.CountyId, colSale.Id,  "458-61A-203(1)", 131) },
            [colImprv.Id] = new() { NewCodeValue(workbook.CountyId, colImprv.Id, "Avg", 2838) },
            [colLand.Id]  = new() { NewCodeValue(workbook.CountyId, colLand.Id,  "NONE", 7702) },
            [colHood.Id]  = new() { NewCodeValue(workbook.CountyId, colHood.Id,  "Sample neighborhood", 1) },
            [colOther.Id] = new() { NewCodeValue(workbook.CountyId, colOther.Id, "Annual",  100) },
        };

        var md = SyncMappingWorkbookExporter.BuildMarkdown(workbook,
            new[] { colVal, colSale, colImprv, colLand, colHood, colOther },
            byColumn);

        // Headline.
        md.Should().Contain("# Mapping Workbook Review");
        md.Should().Contain($"`{workbookId}`");
        md.Should().Contain("Benton OLTP wb");
        md.Should().Contain("**Status:** Draft");
        md.Should().Contain("**Columns:** 6");
        md.Should().Contain("**Code Values:** 6");

        // Lane-priority ordering: Valuation appears before Sales appears
        // before Other. String index check is enough.
        var ixValuation    = md.IndexOf("Lane: Valuation",    StringComparison.Ordinal);
        var ixSales        = md.IndexOf("Lane: Sales",        StringComparison.Ordinal);
        var ixImprovement  = md.IndexOf("Lane: Improvement",  StringComparison.Ordinal);
        var ixLand         = md.IndexOf("Lane: Land",         StringComparison.Ordinal);
        var ixNeighborhood = md.IndexOf("Lane: Neighborhood", StringComparison.Ordinal);
        var ixOther        = md.IndexOf("Lane: Other",        StringComparison.Ordinal);
        ixValuation.Should().BeGreaterThan(0);
        ixSales.Should().BeGreaterThan(ixValuation);
        ixImprovement.Should().BeGreaterThan(ixSales);
        ixLand.Should().BeGreaterThan(ixImprovement);
        ixNeighborhood.Should().BeGreaterThan(ixLand);
        ixOther.Should().BeGreaterThan(ixNeighborhood);

        // The top WAC code is surfaced (not auto-excluded note included).
        md.Should().Contain("`458-61A-203(1)`");
        md.Should().Contain("excluded: no");

        // Lane summary table.
        md.Should().Contain("| Lane | Columns | Code Values |");
    }

    // ── Live ExportAsync ─────────────────────────────────────────────────

    [Fact]
    public async Task ExportAsync_WritesAllThreeFilesByDefault()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "all-three wb");
        db.SyncMappingWorkbooks.Add(wb);
        var col = NewColumn(county.Id, wb.Id, "property_val", "property_use_cd", "Valuation",
            distinctCount: 63, distinctRatio: 0.0061m);
        db.SyncMappingColumns.Add(col);
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, col.Id, "11", 6074));
        await db.SaveChangesAsync();

        var dir = Path.Combine(_tempRoot, "all-three");
        var exporter = new SyncMappingWorkbookExporter(db);

        var result = await exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions(dir, "both"));

        result.Columns.Should().Be(1);
        result.CodeValues.Should().Be(1);
        result.WorkbookStatus.Should().Be("Draft");
        result.FilesWritten.Should().HaveCount(3);

        File.Exists(Path.Combine(dir, SyncMappingWorkbookExporter.ColumnsCsvFileName)).Should().BeTrue();
        File.Exists(Path.Combine(dir, SyncMappingWorkbookExporter.CodeValuesCsvFileName)).Should().BeTrue();
        File.Exists(Path.Combine(dir, SyncMappingWorkbookExporter.MarkdownFileName)).Should().BeTrue();
    }

    [Fact]
    public async Task ExportAsync_FormatCsv_OnlyWritesCsvFiles()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "csv-only wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var dir = Path.Combine(_tempRoot, "csv-only");
        var exporter = new SyncMappingWorkbookExporter(db);

        var result = await exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions(dir, "csv"));

        result.FilesWritten.Should().HaveCount(2);
        File.Exists(Path.Combine(dir, SyncMappingWorkbookExporter.MarkdownFileName)).Should().BeFalse();
    }

    [Fact]
    public async Task ExportAsync_FormatMd_OnlyWritesMarkdown()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "md-only wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var dir = Path.Combine(_tempRoot, "md-only");
        var exporter = new SyncMappingWorkbookExporter(db);

        var result = await exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions(dir, "md"));

        result.FilesWritten.Should().HaveCount(1);
        File.Exists(Path.Combine(dir, SyncMappingWorkbookExporter.MarkdownFileName)).Should().BeTrue();
        File.Exists(Path.Combine(dir, SyncMappingWorkbookExporter.ColumnsCsvFileName)).Should().BeFalse();
    }

    [Fact]
    public async Task ExportAsync_DoesNotMutateWorkbook()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "no-mutate wb");
        wb.UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        wb.Status = "Draft";
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var preStatus = wb.Status;
        var preUpdatedAt = wb.UpdatedAt;

        var dir = Path.Combine(_tempRoot, "no-mutate");
        var exporter = new SyncMappingWorkbookExporter(db);

        await exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions(dir));

        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        reloaded.Status.Should().Be(preStatus);
        reloaded.UpdatedAt.Should().Be(preUpdatedAt);
    }

    [Fact]
    public async Task ExportAsync_RejectsCrossCountyWorkbook()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, _,    _)       = await SeedScopeAsync(db, "Yakima");

        var wbA = NewWorkbook(countyA.Id, connA.Id, batchA.Id, "Benton wb");
        db.SyncMappingWorkbooks.Add(wbA);
        await db.SaveChangesAsync();

        var dir = Path.Combine(_tempRoot, "cross-county");
        var exporter = new SyncMappingWorkbookExporter(db);

        Func<Task> act = () => exporter.ExportAsync(
            countyB.Id,         // mismatched scope
            wbA.Id,
            new SyncMappingWorkbookExportOptions(dir));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found*county {countyB.Id}*");
    }

    [Fact]
    public async Task ExportAsync_CreatesOutputDirectoryWhenMissing()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "create-dir wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var dir = Path.Combine(_tempRoot, "create-this-subdir", "deeper");
        Directory.Exists(dir).Should().BeFalse();

        var exporter = new SyncMappingWorkbookExporter(db);
        var result = await exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions(dir));

        Directory.Exists(dir).Should().BeTrue();
        result.FilesWritten.Should().NotBeEmpty();
    }

    [Theory]
    [InlineData("invalid")]
    [InlineData("xlsx")]
    [InlineData("")]
    public async Task ExportAsync_RejectsInvalidFormat(string format)
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "bad-format wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var exporter = new SyncMappingWorkbookExporter(db);
        Func<Task> act = () => exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions(_tempRoot, format));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Format*");
    }

    [Fact]
    public async Task ExportAsync_RejectsBlankOutputDirectory()
    {
        await using var db = CreateContext($"export-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "blank-dir wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var exporter = new SyncMappingWorkbookExporter(db);
        Func<Task> act = () => exporter.ExportAsync(
            county.Id, wb.Id,
            new SyncMappingWorkbookExportOptions("   "));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*OutputDirectory*");
    }
}
