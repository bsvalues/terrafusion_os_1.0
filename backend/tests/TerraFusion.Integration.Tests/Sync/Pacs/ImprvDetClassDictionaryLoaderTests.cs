using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Pacs;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Pacs;

/// <summary>
/// Slice C23-B service tests. Pin the `imprv_detail.imprv_det_class_cd`
/// ↔ `dbo.imprv_det_class` lane to prove the C22-B loader machinery,
/// generalized in C23-B, drives a different workbook source triple +
/// PACS dictionary table without code changes.
///
/// <para>The C22-B test file (<c>DictionaryLoaderServiceTests</c>)
/// already exhaustively pins every M1-M5 path. These tests focus on
/// what's <em>different</em> for imprv_det_class:
/// <list type="bullet">
/// <item>The workbook source is <c>imprv_detail.imprv_det_class_cd</c>,
///   not <c>property_val.property_use_cd</c>.</item>
/// <item>The PACS dictionary table is <c>dbo.imprv_det_class</c>,
///   not <c>dbo.property_use</c>.</item>
/// <item>The canonical-target vocabulary is <c>"ImprvDetailClass"</c>,
///   not <c>"PropertyUse"</c>.</item>
/// <item>Real Benton imprv_det_class_cd codes seeded from C23-B-live
///   inspection of <c>dbo.imprv_det_class</c>: numeric quality grades
///   <c>"10"</c> (Low), <c>"30"</c> (Avg), <c>"40"</c> (Good),
///   <c>"60"</c> (Exc), and word-form <c>"AbvAvg"</c>. The dictionary
///   has 27 rows total with <c>sys_flag='F'</c> universally — so M4
///   cannot fire in Benton against the live PACS instance, but the
///   M4 path is still pinned via stub.</item>
/// </list>
/// </para>
/// </summary>
public class ImprvDetClassDictionaryLoaderTests
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

    private sealed record Fixture(
        County County,
        SyncMappingWorkbook Workbook,
        SyncMappingColumn ClassColumn,
        IReadOnlyList<SyncMappingCodeValue> DeferredRows);

    /// <summary>
    /// Imprv-det-class lane target config — what C23-B's CLI dispatcher
    /// passes for `imprv_det_class`. Mirrors the Program.cs switch entry.
    /// </summary>
    private static DictionaryLoaderTargetConfig ImprvDetClassTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "imprv_detail",
            WorkbookSourceColumn: "imprv_det_class_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "imprv_det_class",
            CanonicalTargetName:  "ImprvDetailClass");

    private static DictionaryColumnConfig DefaultClassConfig() =>
        new(
            CodeColumn:           "imprv_det_class_cd",
            DescriptionColumn:    "imprv_det_cls_desc",
            ActiveFlagColumn:     null,           // confirmed at C23-B-live
            ActiveFlagPredicate:  null,
            YearColumn:           null);

    /// <summary>
    /// Standard fixture: a Draft workbook with one column
    /// (<c>imprv_detail.imprv_det_class_cd</c>) carrying Deferred
    /// code-value rows. Tests can override the seeded codes.
    /// </summary>
    private static async Task<Fixture> SeedFixtureAsync(
        TerraFusionDbContext db,
        IEnumerable<string>? deferredCodes = null)
    {
        var county = new County
        {
            Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id = Guid.NewGuid(), CountyId = county.Id, Name = "Benton PACS OLTP",
            SourceSystem = "PACS", ConnectionType = "SqlServer",
            Server = "localhost,1433", Database = "pacs_oltp",
            AuthMode = "SqlAuth", IsActive = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId = county.Id, SourceSystem = "PACS",
            Mode = "profile", Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);

        var wb = new SyncMappingWorkbook
        {
            CountyId = county.Id, SourceConnectionId = conn.Id,
            ProfileBatchId = batch.Id,
            Name = "fixture-c23-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "imprv_detail",
            SourceColumn = "imprv_det_class_cd",
            MappingLane = "Improvement",
            ReviewStatus = "Mapped",
            CanonicalTarget = "ImprvDetailClass",
        };
        db.SyncMappingColumns.Add(col);

        var codes = (deferredCodes ?? new[] { "10", "30", "40" }).ToList();
        var deferredRows = new List<SyncMappingCodeValue>();
        foreach (var c in codes)
        {
            var v = new SyncMappingCodeValue
            {
                CountyId = county.Id, MappingColumnId = col.Id,
                SourceValue = c, ReviewStatus = "Deferred",
            };
            db.SyncMappingCodeValues.Add(v);
            deferredRows.Add(v);
        }

        await db.SaveChangesAsync();
        return new Fixture(county, wb, col, deferredRows);
    }

    /// <summary>Builds a stub PACS dictionary row in the imprv_det_class shape.</summary>
    private static PacsDictionaryRow Row(string code, string? desc = null)
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["imprv_det_class_cd"] = code,
        };
        if (desc is not null) dict["imprv_det_cls_desc"] = desc;
        return new PacsDictionaryRow(dict);
    }

    private sealed class StubReader : IPacsDictionaryReader
    {
        private readonly List<PacsDictionaryRow> _rows;
        public StubReader(IEnumerable<PacsDictionaryRow> rows) => _rows = rows.ToList();

        public Task<PacsDictionaryReadResult> ReadDictionaryAsync(
            string schemaName, string tableName, CancellationToken cancellationToken = default)
            => Task.FromResult(new PacsDictionaryReadResult(
                schemaName, tableName,
                new List<string> { "imprv_det_class_cd", "imprv_det_cls_desc" },
                _rows));
    }

    // ── M5: clean Benton-shaped match ───────────────────────────────────

    [Fact]
    public async Task Loader_ProposesMappedForCleanImprvDetClassMatch_M5()
    {
        await using var db = CreateContext($"c23b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "10", "30", "40" });

        // Real Benton-shaped imprv_det_class dictionary entries from
        // C23-B-live inspection.
        var pacs = new StubReader(new[]
        {
            Row("10", "Low"),
            Row("30", "Avg"),
            Row("40", "Good"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetClassTarget(), DefaultClassConfig());

        result.M5CleanMatch.Should().Be(3);
        result.M1WorkbookCodeMissingFromDictionary.Should().Be(0);

        result.ProposedRows.Should().HaveCount(3);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceSchema.Should().Be("dbo");
            r.SourceTable.Should().Be("imprv_detail",
                "C23-B targets imprv_detail, not property_val");
            r.SourceColumn.Should().Be("imprv_det_class_cd");
            r.ReviewStatus.Should().Be("Mapped");
            r.Classification.Should().Be(DictionaryRowClassification.CleanMatch);
        });

        var avg = result.ProposedRows.Single(r => r.SourceValue == "30");
        avg.CanonicalValue.Should().Be("Avg");
    }

    // ── M1: workbook code missing from imprv_det_class dictionary ───────

    [Fact]
    public async Task Loader_DefersWhenImprvCodeMissingFromDictionary_M1()
    {
        await using var db = CreateContext($"c23b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "ZZZ" });

        var pacs = new StubReader(new[] { Row("10", "Low") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetClassTarget(), DefaultClassConfig());

        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Notes.Should().Contain("missing from PACS imprv_det_class dictionary",
            "the loader names the actual dictionary table in the integrity note");
    }

    // ── Fallback canonical_value uses ImprvDetailClass vocabulary ───────

    [Fact]
    public async Task Loader_UsesImprvDetailClassVocabulary_ForCanonicalFallback()
    {
        await using var db = CreateContext($"c23b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "10" });

        // Dictionary row with no description (forces M5 fallback path)
        var pacs = new StubReader(new[] { Row("10", desc: null) });
        var configNoDesc = DefaultClassConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetClassTarget(), configNoDesc);

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("ImprvDetailClass:10",
            "C23-B canonical-target vocabulary is ImprvDetailClass, " +
            "distinct from C22-B's PropertyUse vocabulary");
    }

    // ── Read-only contract on the imprv lane ───────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateImprvWorkbook()
    {
        await using var db = CreateContext($"c23b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var preWorkbookUpdated = fx.Workbook.UpdatedAt;
        var preColumnUpdated = fx.ClassColumn.UpdatedAt;
        var preRowUpdated = fx.DeferredRows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("10", "Low"),
            Row("30", "Avg"),
            Row("40", "Good"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetClassTarget(), DefaultClassConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking()
            .OrderBy(v => v.SourceValue).ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWorkbookUpdated);
        colReloaded.UpdatedAt.Should().Be(preColumnUpdated);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRowUpdated);
        rowsReloaded.Should().AllSatisfy(r =>
            r.ReviewStatus.Should().Be("Deferred",
                "C23-B proposes Mapped via CSV; the apply step is C23-C, not the loader"));
    }

    // ── Workbook column-existence guard names the imprv triple ─────────

    [Fact]
    public async Task Loader_ThrowsWhenWorkbookLacksImprvDetClassCdColumn()
    {
        await using var db = CreateContext($"c23b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var col = await db.SyncMappingColumns.SingleAsync();
        var values = await db.SyncMappingCodeValues.ToListAsync();
        db.SyncMappingCodeValues.RemoveRange(values);
        db.SyncMappingColumns.Remove(col);
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[] { Row("10", "Low") });
        var sut = new DictionaryLoaderService(db, pacs);

        Func<Task> act = () => sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetClassTarget(), DefaultClassConfig());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*does not contain a column for dbo.imprv_detail.imprv_det_class_cd*");
    }

    // ── M3: duplicate imprv_det_class code ─────────────────────────────

    [Fact]
    public async Task Loader_DefersOnDuplicateImprvDetClassCode_M3()
    {
        await using var db = CreateContext($"c23b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "30" });

        // Imagine a 2017-conversion artifact where '30' has two dictionary rows
        var pacs = new StubReader(new[]
        {
            Row("30", "Avg"),
            Row("30", "Avg (legacy variant)"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetClassTarget(), DefaultClassConfig());

        result.M3DuplicateDictionaryCode.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Classification.Should().Be(DictionaryRowClassification.DuplicateDictionaryCode);
        row.Notes.Should().Contain("Cannot unambiguously map");
        row.Notes.Should().Contain("Avg");
        row.Notes.Should().Contain("legacy");
    }
}
