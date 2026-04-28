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
/// Slice C26-B service tests. Pin the
/// <c>imprv_detail.imprv_det_sub_class_cd</c> ↔
/// <c>dbo.imprv_det_sub_class</c> lane to prove the C23-B generalized
/// DictionaryLoaderService machinery drives a fifth workbook source
/// triple + PACS dictionary table without code changes — and to pin
/// the C26-A policy's specific guards (no-special-character-inference;
/// asymmetric column naming workbook ↔ dictionary).
///
/// <para>The C22-B / C23-B / C24-B / C25-B test files already
/// exhaustively pin every M1-M5 path. These tests focus on what's
/// <em>new</em> for C26-B:
/// <list type="bullet">
/// <item>The workbook source column is
///   <c>imprv_det_sub_class_cd</c> (unabbreviated, mirrors
///   <c>imprv_detail</c> table column).</item>
/// <item>The PACS dictionary code column is
///   <c>imprv_det_sub_cls_cd</c> (abbreviated; PACS abbreviates
///   "class" → "cls" in the dictionary table). This is the
///   FIFTH wrong-assumption catch by the live-inspection gate.</item>
/// <item>The canonical-target vocabulary is
///   <c>"ImprvDetailSubClass"</c>, distinct from the four prior
///   targets.</item>
/// <item>Real Benton imprv_det_sub_class_cd codes seeded from
///   C26-B-live inspection: <c>"*"</c> and <c>"+"</c> —
///   special-character codes whose semantics are operator-
///   authoritative.</item>
/// <item>No special-character semantic inference: <c>"*"</c> is
///   NOT loader-interpreted as "any/wildcard"; <c>"+"</c> is NOT
///   loader-interpreted as "additional/extra". This is C26-A
///   Hard Guard #3 made explicit.</item>
/// </list>
/// </para>
/// </summary>
public class ImprvDetSubClassDictionaryLoaderTests
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
        SyncMappingColumn SubClassColumn,
        IReadOnlyList<SyncMappingCodeValue> Rows);

    /// <summary>
    /// Imprv-det-sub-class lane target config. Note the asymmetry:
    /// workbook column = <c>imprv_det_sub_class_cd</c> (unabbreviated);
    /// dictionary table = <c>dbo.imprv_det_sub_class</c> (also
    /// unabbreviated at the table-name level, but its INTERNAL columns
    /// are <c>imprv_det_sub_cls_cd</c> / <c>imprv_det_sub_cls_desc</c>).
    /// </summary>
    private static DictionaryLoaderTargetConfig ImprvDetSubClassTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "imprv_detail",
            WorkbookSourceColumn: "imprv_det_sub_class_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "imprv_det_sub_class",
            CanonicalTargetName:  "ImprvDetailSubClass");

    /// <summary>
    /// Default column config matching the C26-B-live inspection.
    /// Note: <c>imprv_det_sub_cls_cd</c> NOT
    /// <c>imprv_det_sub_class_cd</c> (PACS dictionary abbreviates
    /// "class" to "cls" on BOTH code and description columns).
    /// </summary>
    private static DictionaryColumnConfig DefaultSubClassConfig() =>
        new(
            CodeColumn:           "imprv_det_sub_cls_cd",
            DescriptionColumn:    "imprv_det_sub_cls_desc",
            ActiveFlagColumn:     null,           // confirmed at C26-B-live (sys_flag all 'f')
            ActiveFlagPredicate:  null,
            YearColumn:           null);

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
            Name = "fixture-c26-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "imprv_detail",
            SourceColumn = "imprv_det_sub_class_cd",
            MappingLane = columnLane,
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
        };
        db.SyncMappingColumns.Add(col);

        var codeList = (codes ?? new[] { "*", "+" }).ToList();
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

    /// <summary>Builds a stub PACS dictionary row in the dbo.imprv_det_sub_class shape.</summary>
    private static PacsDictionaryRow Row(string code, string? desc = null)
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["imprv_det_sub_cls_cd"] = code,        // ← abbreviated, per live inspection
        };
        if (desc is not null) dict["imprv_det_sub_cls_desc"] = desc;
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
                new List<string> { "imprv_det_sub_cls_cd", "imprv_det_sub_cls_desc" },
                _rows));
    }

    // ── M5: clean Benton-shaped match (the actual 2 codes) ─────────────

    [Fact]
    public async Task Loader_ProposesMappedForCleanSubClassMatch_M5()
    {
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "*", "+" });

        // Real Benton C26-B-live values: '*' description is '*'
        // (self-referential), '+' is "Plus Grade".
        var pacs = new StubReader(new[]
        {
            Row("*", "*"),
            Row("+", "Plus Grade"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        result.M5CleanMatch.Should().Be(2);
        result.ProposedRows.Should().HaveCount(2);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceTable.Should().Be("imprv_detail",
                "C26-B targets imprv_detail (same table as C23/C25, different column)");
            r.SourceColumn.Should().Be("imprv_det_sub_class_cd",
                "workbook column is unabbreviated; only the dictionary's internal " +
                "code column carries the 'cls' abbreviation");
            r.ReviewStatus.Should().Be("Mapped");
        });

        var star = result.ProposedRows.Single(r => r.SourceValue == "*");
        star.CanonicalValue.Should().Be("*",
            "self-referential dictionary description is preserved verbatim — " +
            "operator can rephrase to 'All Sub-Classes' or 'Wildcard' at C26-C, " +
            "but the loader does NOT make that interpretation");

        var plus = result.ProposedRows.Single(r => r.SourceValue == "+");
        plus.CanonicalValue.Should().Be("Plus Grade",
            "+ is mapped to 'Plus Grade' from the dictionary; the loader " +
            "did NOT infer 'additional' or 'extra' from the '+' code shape");
    }

    // ── C26-A Hard Guard #3: no special-character semantic inference ───

    [Fact]
    public async Task Loader_TreatsSpecialCharacterCodesIdenticallyToWordCodes()
    {
        // Per C26-A Hard Guard #3: '*' and '+' classify identically to
        // any other code. This test pins the property by mixing '*' / '+'
        // with the word codes from prior dictionaries — same M5 path,
        // same notes pattern, same Mapped status, no prefix/shape branch.
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[]
        {
            "*",      // special character
            "+",      // special character
            "ABC",    // word
            "X1",     // alphanumeric
        });

        var pacs = new StubReader(new[]
        {
            Row("*",   "*"),
            Row("+",   "Plus Grade"),
            Row("ABC", "Alpha Bravo Charlie"),
            Row("X1",  "Cross One"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        result.M5CleanMatch.Should().Be(4,
            "all four codes — across special-char + word + alphanumeric — " +
            "must classify identically as M5 clean. No code-shape branch " +
            "in the loader (C26-A Hard Guard #3).");
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.Classification.Should().Be(DictionaryRowClassification.CleanMatch);
            r.ReviewStatus.Should().Be("Mapped");
            r.Notes.Should().Contain("Dictionary-matched",
                "every M5 row carries the same notes pattern regardless of " +
                "whether the source code is special-character, word, or alphanumeric");
        });
    }

    // ── M1: special-character code missing from dictionary ─────────────

    [Fact]
    public async Task Loader_DefersWhenSpecialCharCodeMissingFromDictionary_M1()
    {
        // Special-character codes that aren't in the dictionary are
        // particularly notable per C26-A — they may be wildcard
        // placeholders PACS handles outside the dictionary table. The
        // loader still treats them with the same M1 path; the notes
        // language documents the special nature for the operator.
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "?" });

        var pacs = new StubReader(new[] { Row("*", "*"), Row("+", "Plus Grade") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.SourceValue.Should().Be("?");
        row.Notes.Should().Contain("missing from PACS imprv_det_sub_class dictionary");
    }

    // ── Precondition gate: NeedsReview rows produce zero proposals ─────

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenP2NotMet()
    {
        // Per C26-A precondition gate (inheriting C25-A): if code-values
        // are NeedsReview (P2 not met), the loader produces zero
        // proposals. The loader does not infer state.
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "*", "+" },
            status: "NeedsReview");                         // ← P2 NOT met

        var pacs = new StubReader(new[]
        {
            Row("*", "*"), Row("+", "Plus Grade"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        result.WorkbookDeferredRows.Should().Be(0);
        result.ProposedRows.Should().BeEmpty();
    }

    // ── Lane-agnostic (P1 is workbook hygiene, not loader precondition)

    [Fact]
    public async Task Loader_WorksWithColumnInOtherLane_PerC25BFinding()
    {
        // C25-B's operational finding (now C26-A Hard Non-Goal):
        // the loader joins by SourceColumn, NOT by lane. P1 (lane
        // reclassification) is workbook hygiene, not a loader
        // precondition. C26-B inherits this directly: even with the
        // column in Other lane, the loader proposes for its Deferred
        // rows.
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "*" },
            status: "Deferred",
            columnLane: "Other");                           // ← P1 NOT met

        var pacs = new StubReader(new[] { Row("*", "*") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        result.M5CleanMatch.Should().Be(1,
            "the loader joins by SourceColumn, not lane — P1 stays parked");
    }

    // ── Asymmetric column naming: workbook unabbreviated, dict abbreviated

    [Fact]
    public async Task Loader_HandlesAsymmetricColumnNaming()
    {
        // Pins C26-B-live's findings: the workbook source column is
        // 'imprv_det_sub_class_cd' (unabbreviated, mirrors imprv_detail
        // table), but the PACS dictionary's internal code column is
        // 'imprv_det_sub_cls_cd' (abbreviated). The DictionaryLoaderService
        // separates these two concerns via Target.WorkbookSourceColumn
        // and DictionaryColumns.CodeColumn.
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "+" });

        // Stub reader returns rows keyed by the ABBREVIATED dictionary
        // column name (imprv_det_sub_cls_cd)
        var pacs = new StubReader(new[] { Row("+", "Plus Grade") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();

        // Output uses the WORKBOOK column name (unabbreviated)
        row.SourceColumn.Should().Be("imprv_det_sub_class_cd",
            "the proposed CSV row uses the workbook's column name " +
            "(matches what the operator sees in the workbook)");
        row.CanonicalValue.Should().Be("Plus Grade",
            "but the canonical_value comes from the dictionary's abbreviated " +
            "description column (imprv_det_sub_cls_desc), pulled via the " +
            "DictionaryColumnConfig.DescriptionColumn parameter");
    }

    // ── ImprvDetailSubClass canonical-target vocabulary ────────────────

    [Fact]
    public async Task Loader_UsesImprvDetailSubClassVocabulary_ForCanonicalFallback()
    {
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "+" });

        var pacs = new StubReader(new[] { Row("+", desc: null) });
        var configNoDesc = DefaultSubClassConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), configNoDesc);

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("ImprvDetailSubClass:+",
            "C26-B canonical-target vocabulary is ImprvDetailSubClass; " +
            "fallback handles special-character codes the same way as " +
            "any other code");
    }

    // ── Read-only no-mutation contract ─────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbookOnSubClassProposal()
    {
        await using var db = CreateContext($"c26b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "*", "+" });

        var preWb = fx.Workbook.UpdatedAt;
        var preCol = fx.SubClassColumn.UpdatedAt;
        var preRows = fx.Rows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[] { Row("*", "*"), Row("+", "Plus Grade") });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvDetSubClassTarget(), DefaultSubClassConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking().ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWb);
        colReloaded.UpdatedAt.Should().Be(preCol);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRows);
        rowsReloaded.Should().AllSatisfy(r => r.ReviewStatus.Should().Be("Deferred"));
    }
}
