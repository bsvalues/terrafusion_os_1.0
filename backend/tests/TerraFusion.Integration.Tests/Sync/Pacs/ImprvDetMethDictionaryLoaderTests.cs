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
/// Slice C25-B service tests. Pin the
/// <c>imprv_detail.imprv_det_meth_cd</c> ↔ <c>dbo.imprv_det_meth</c>
/// lane to prove the C23-B generalized DictionaryLoaderService
/// machinery drives a fourth workbook source triple + PACS dictionary
/// table without code changes — and to pin the C25-A policy's specific
/// guards (precondition gate; method-vs-class distinction).
///
/// <para>The C22-B / C23-B / C24-B test files already exhaustively pin
/// every M1-M5 path. These tests focus on what's <em>new</em> for
/// C25-B:
/// <list type="bullet">
/// <item>The workbook source is <c>imprv_detail.imprv_det_meth_cd</c>
///   — same table as <c>imprv_det_class_cd</c> (C23) but a
///   different column (calculation-method axis, not class axis).</item>
/// <item>The PACS dictionary table is <c>dbo.imprv_det_meth</c> with
///   yet another column-name variant: <c>imprv_det_meth_dsc</c>
///   (NOT <c>imprv_det_meth_desc</c>) — fourth wrong-assumption
///   catch by the live-inspection gate.</item>
/// <item>The canonical-target vocabulary is <c>"ImprvDetailMethod"</c>,
///   distinct from C23's <c>"ImprvDetailClass"</c>.</item>
/// <item>Real Benton imprv_det_meth_cd codes seeded from C25-B-live
///   inspection: <c>"C"</c> (Commercial), <c>"R"</c> (Residential),
///   <c>"M"</c> (Mobile Home), <c>"EXT-B"</c> (Ext Feature Break
///   Point), <c>"EXT-F"</c> (Ext Feature Flat Rate), <c>"IRR"</c>
///   (IRRIGATE), <c>"T1"</c>/<c>"T3"</c> (TREE1/TREE3), <c>"TRL"</c>
///   (TRELLIS), <c>"V1"</c> (VINYARD1).</item>
/// <item>Precondition gate: per C25-A, the loader produces zero
///   proposed rows when no code-values are <c>Deferred</c>. This
///   exercises the C25-A "loader does not infer state" invariant.</item>
/// </list>
/// </para>
/// </summary>
public class ImprvDetMethDictionaryLoaderTests
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
        SyncMappingColumn MethColumn,
        IReadOnlyList<SyncMappingCodeValue> Rows);

    /// <summary>
    /// Imprv-det-meth lane target config — what C25-B's CLI dispatcher
    /// passes for `imprv_det_meth`. Mirrors the Program.cs switch entry.
    /// </summary>
    private static DictionaryLoaderTargetConfig ImprvDetMethTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "imprv_detail",
            WorkbookSourceColumn: "imprv_det_meth_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "imprv_det_meth",
            CanonicalTargetName:  "ImprvDetailMethod");

    /// <summary>
    /// Default column config matching the C25-B-live inspection.
    /// Note <c>imprv_det_meth_dsc</c> NOT <c>imprv_det_meth_desc</c>.
    /// </summary>
    private static DictionaryColumnConfig DefaultMethConfig() =>
        new(
            CodeColumn:           "imprv_det_meth_cd",
            DescriptionColumn:    "imprv_det_meth_dsc",
            ActiveFlagColumn:     null,           // confirmed at C25-B-live
            ActiveFlagPredicate:  null,
            YearColumn:           null);

    /// <summary>
    /// Standard fixture: a Draft workbook with one column
    /// (<c>imprv_detail.imprv_det_meth_cd</c>) carrying code-values
    /// at a configurable status — defaulting to Deferred to mirror the
    /// post-precondition state. Tests that need the precondition gate
    /// fixture override <paramref name="status"/>.
    /// </summary>
    private static async Task<Fixture> SeedFixtureAsync(
        TerraFusionDbContext db,
        IEnumerable<string>? codes = null,
        string status = "Deferred",
        string columnLane = "Improvement")
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
            Name = "fixture-c25-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "imprv_detail",
            SourceColumn = "imprv_det_meth_cd",
            MappingLane = columnLane,
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
        };
        db.SyncMappingColumns.Add(col);

        var codeList = (codes ?? new[] { "C", "R", "M" }).ToList();
        var rows = new List<SyncMappingCodeValue>();
        foreach (var c in codeList)
        {
            var v = new SyncMappingCodeValue
            {
                CountyId = county.Id, MappingColumnId = col.Id,
                SourceValue = c, ReviewStatus = status,
            };
            db.SyncMappingCodeValues.Add(v);
            rows.Add(v);
        }

        await db.SaveChangesAsync();
        return new Fixture(county, wb, col, rows);
    }

    /// <summary>Builds a stub PACS dictionary row in the dbo.imprv_det_meth shape.</summary>
    private static PacsDictionaryRow Row(string code, string? desc = null)
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["imprv_det_meth_cd"] = code,
        };
        if (desc is not null) dict["imprv_det_meth_dsc"] = desc;
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
                new List<string> { "imprv_det_meth_cd", "imprv_det_meth_dsc" },
                _rows));
    }

    // ── M5: clean Benton-shaped match ───────────────────────────────────

    [Fact]
    public async Task Loader_ProposesMappedForCleanImprvDetMethMatch_M5()
    {
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "C", "R", "M" });

        var pacs = new StubReader(new[]
        {
            Row("C", "Commercial"),
            Row("R", "Residential"),
            Row("M", "Mobile Home"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.M5CleanMatch.Should().Be(3);
        result.M1WorkbookCodeMissingFromDictionary.Should().Be(0);
        result.ProposedRows.Should().HaveCount(3);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceTable.Should().Be("imprv_detail",
                "C25-B targets imprv_detail (same table as C23, different column)");
            r.SourceColumn.Should().Be("imprv_det_meth_cd",
                "C25-B targets the method column, NOT the class column");
            r.ReviewStatus.Should().Be("Mapped");
        });

        var commercial = result.ProposedRows.Single(r => r.SourceValue == "C");
        commercial.CanonicalValue.Should().Be("Commercial");
    }

    // ── C25-A precondition gate: NeedsReview rows are NOT proposed ─────

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenP2NotMet_NeedsReview()
    {
        // Per C25-A "Precondition gate": if code-values are NeedsReview
        // (P2 not met), the loader produces zero proposed rows. The
        // loader does not infer state — it only proposes for Deferred.
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "C", "R", "M" },
            status: "NeedsReview");                         // ← P2 NOT met

        var pacs = new StubReader(new[]
        {
            Row("C", "Commercial"),
            Row("R", "Residential"),
            Row("M", "Mobile Home"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.WorkbookDeferredRows.Should().Be(0,
            "C25-A precondition gate: the loader scans only Deferred rows; " +
            "with all rows still NeedsReview, the scan count must be 0");
        result.ProposedRows.Should().BeEmpty(
            "no Deferred rows means no proposed CSV rows — the operator " +
            "sees the precondition gap as a zero-row diagnostic, not a " +
            "silent regression that scans NeedsReview");
    }

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenColumnIsInOtherLane_LaneAgnostic()
    {
        // C25-A documents that imprv_det_meth_cd currently sits in the
        // Other lane (P1: lane reclassification). The loader joins the
        // column by SourceColumn, NOT by lane — so lane reclassification
        // is workbook hygiene, not a loader precondition. This test
        // pins that property: even with the column in the Other lane,
        // the loader still finds it and proposes for its Deferred rows.
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "C" },
            status: "Deferred",
            columnLane: "Other");                           // ← P1 NOT met

        var pacs = new StubReader(new[] { Row("C", "Commercial") });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.M5CleanMatch.Should().Be(1,
            "the loader joins by SourceColumn, not lane — P1 (lane " +
            "reclassification) is workbook hygiene, not a loader " +
            "precondition. The proposal works regardless.");
    }

    // ── M1: workbook code missing from dictionary ──────────────────────

    [Fact]
    public async Task Loader_DefersWhenImprvDetMethCodeMissingFromDictionary_M1()
    {
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "GHOST" });

        var pacs = new StubReader(new[] { Row("C", "Commercial") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Notes.Should().Contain("missing from PACS imprv_det_meth dictionary");
    }

    // ── M2: dictionary-only codes ignored ───────────────────────────────

    [Fact]
    public async Task Loader_OmitsDictionaryRowsUnobservedInWorkbook_M2()
    {
        // Real Benton: dictionary has 12 rows (C/R/M/EXT-B/EXT-F/IRR/
        // T1/T2/T3/TRL/V1/V2); workbook only observed 10 of them. T2
        // and V2 are M2 (NOT in CSV).
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "C", "R" });

        var pacs = new StubReader(new[]
        {
            Row("C",  "Commercial"),
            Row("R",  "Residential"),
            Row("T2", "TREE2"),    // unobserved
            Row("V2", "VINYARD2"), // unobserved
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.M5CleanMatch.Should().Be(2);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(2);
        result.ProposedRows.Should().HaveCount(2,
            "M2 rows are NOT in the CSV — only observed Deferred codes show up");
    }

    // ── ImprvDetailMethod canonical-target vocabulary ──────────────────

    [Fact]
    public async Task Loader_UsesImprvDetailMethodVocabulary_ForCanonicalFallback()
    {
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "C" });

        // Dictionary row with no description — forces M5 fallback path
        var pacs = new StubReader(new[] { Row("C", desc: null) });
        var configNoDesc = DefaultMethConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), configNoDesc);

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("ImprvDetailMethod:C",
            "C25-B canonical-target vocabulary is ImprvDetailMethod, " +
            "distinct from C23-B's ImprvDetailClass — these address " +
            "different axes of imprv_detail (method vs class)");
    }

    // ── Read-only no-mutation contract ─────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbookOnImprvDetMethProposal()
    {
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "C", "R", "M" });

        var preWb = fx.Workbook.UpdatedAt;
        var preCol = fx.MethColumn.UpdatedAt;
        var preRows = fx.Rows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("C", "Commercial"), Row("R", "Residential"), Row("M", "Mobile Home"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking().ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWb);
        colReloaded.UpdatedAt.Should().Be(preCol);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRows);
        rowsReloaded.Should().AllSatisfy(r =>
            r.ReviewStatus.Should().Be("Deferred",
                "C25-B proposes Mapped via CSV; the apply step is C25-C, not the loader"));
    }

    // ── M3: duplicate dictionary code ──────────────────────────────────

    [Fact]
    public async Task Loader_DefersOnDuplicateImprvDetMethCode_M3()
    {
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "R" });

        var pacs = new StubReader(new[]
        {
            Row("R", "Residential"),
            Row("R", "Residential (legacy variant)"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.M3DuplicateDictionaryCode.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Classification.Should().Be(DictionaryRowClassification.DuplicateDictionaryCode);
        row.Notes.Should().Contain("Cannot unambiguously map");
        row.Notes.Should().Contain("legacy variant");
    }

    // ── Workbook column-existence guard names the meth triple ──────────

    [Fact]
    public async Task Loader_ThrowsWhenWorkbookLacksImprvDetMethCdColumn()
    {
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var col = await db.SyncMappingColumns.SingleAsync();
        var values = await db.SyncMappingCodeValues.ToListAsync();
        db.SyncMappingCodeValues.RemoveRange(values);
        db.SyncMappingColumns.Remove(col);
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[] { Row("C", "Commercial") });
        var sut = new DictionaryLoaderService(db, pacs);

        Func<Task> act = () => sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*does not contain a column for dbo.imprv_detail.imprv_det_meth_cd*");
    }

    // ── C12 trim-on-both-sides interop (char(5) padding) ───────────────

    [Fact]
    public async Task Loader_MatchesPaddedImprvDetMethSourceValuesAfterTrim()
    {
        // imprv_det_meth_cd is char(5) per C25-B-live; padded values
        // ('R    ') match dictionary code 'R' after trim. Stored
        // SourceValue preserved verbatim per C12 'never rewrite'.
        await using var db = CreateContext($"c25b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "R    " });

        var pacs = new StubReader(new[] { Row("R", "Residential") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetMethTarget(), DefaultMethConfig());

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.SourceValue.Should().Be("R    ");
    }
}
