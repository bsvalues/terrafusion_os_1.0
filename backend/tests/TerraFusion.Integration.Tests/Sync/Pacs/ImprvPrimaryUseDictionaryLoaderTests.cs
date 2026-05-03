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
/// Slice C27-B service tests. Pin the
/// <c>imprv.primary_use_cd</c> ↔ <c>dbo.property_use</c> lane —
/// the FIRST dictionary-reuse case in the C-series.
///
/// <para>C22-B through C26-B each introduced a new PACS dictionary
/// table. C27-B introduces a new <em>workbook column</em> that
/// reuses the already-proven <c>dbo.property_use</c> dictionary.
/// These tests focus on what's <em>new</em> for C27-B:
/// <list type="bullet">
/// <item>The dictionary table is reused from C22 — same
///   <c>dbo.property_use</c> with the same column config
///   (<c>property_use_cd</c> / <c>property_use_desc</c>).</item>
/// <item>The workbook source is <c>imprv.primary_use_cd</c>
///   (NOT <c>property_val.property_use_cd</c> — that's C22's
///   target).</item>
/// <item>The canonical_target is REUSED: <c>"PropertyUse"</c>
///   for both columns (C22-C set the precedent).</item>
/// <item><b>No cross-column auto-fill</b>: the loader proposes
///   the dictionary description verbatim, NOT C22-C's prior
///   canonical_values for matching codes. Operator decides
///   cross-column alignment at C27-C. (C27-A Hard Guard #3
///   extension.)</item>
/// <item>Real Benton imprv.primary_use_cd codes seeded from
///   the workbook audit: <c>"11"</c>, <c>"21"</c>, <c>"83"</c>
///   (overlap with C22's known codes), plus <c>"31"</c>,
///   <c>"61"</c> (codes possibly NOT in C22 if the property_val
///   side never observed them).</item>
/// </list>
/// </para>
/// </summary>
public class ImprvPrimaryUseDictionaryLoaderTests
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
        SyncMappingColumn ImprvPrimaryUseColumn,
        IReadOnlyList<SyncMappingCodeValue> Rows);

    /// <summary>
    /// Imprv.primary_use_cd lane target config — the C27-B binding
    /// that reuses C22's <c>dbo.property_use</c> dictionary.
    /// </summary>
    private static DictionaryLoaderTargetConfig ImprvPrimaryUseTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "imprv",                    // ← imprv (NOT property_val)
            WorkbookSourceColumn: "primary_use_cd",           // ← primary_use_cd (NOT property_use_cd)
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "property_use",             // ← REUSED from C22
            CanonicalTargetName:  "PropertyUse");             // ← REUSED from C22

    /// <summary>
    /// Default column config for <c>dbo.property_use</c> —
    /// IDENTICAL to C22's config because the dictionary is the
    /// same. C22-B-live captured: code/desc columns,
    /// no sys_flag, no year column. C27-B inherits this without
    /// re-inspection.
    /// </summary>
    private static DictionaryColumnConfig DefaultPropertyUseConfig() =>
        new(
            CodeColumn:           "property_use_cd",
            DescriptionColumn:    "property_use_desc",
            ActiveFlagColumn:     null,
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
            Name = "fixture-c27-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "imprv",
            SourceColumn = "primary_use_cd",
            MappingLane = columnLane,
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
        };
        db.SyncMappingColumns.Add(col);

        var codeList = (codes ?? new[] { "11", "21", "83" }).ToList();
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

    /// <summary>Builds a stub PACS dictionary row in the dbo.property_use shape (same as C22).</summary>
    private static PacsDictionaryRow Row(string code, string? desc = null)
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["property_use_cd"] = code,
        };
        if (desc is not null) dict["property_use_desc"] = desc;
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
                new List<string> { "property_use_cd", "property_use_desc" },
                _rows));
    }

    // ── M5: clean Benton-shaped match (the dictionary-reuse path) ──────

    [Fact]
    public async Task Loader_ProposesMappedForCleanMatch_AgainstReusedDictionary()
    {
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11", "21", "83" });

        // Same dictionary content as C22-B-live (3 rows of property_use)
        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family Residential"),
            Row("21", "Commercial"),
            Row("83", "Industrial"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(3);
        result.ProposedRows.Should().HaveCount(3);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceTable.Should().Be("imprv",
                "C27-B targets imprv table, NOT property_val (that's C22's target)");
            r.SourceColumn.Should().Be("primary_use_cd",
                "C27-B targets primary_use_cd (different column from C22's property_use_cd, " +
                "even though both share the same PACS dictionary)");
            r.ReviewStatus.Should().Be("Mapped");
        });
    }

    // ── C27-A guard: no cross-column auto-fill ─────────────────────────

    [Fact]
    public async Task Loader_DoesNotConsultPriorC22CMappingsForMatchingCodes()
    {
        // Per C27-A Hard Guard #3 extension: the loader proposes the
        // dictionary's description column verbatim. It does NOT consult
        // any prior canonical_value mappings (e.g. C22-C's mappings on
        // property_val.property_use_cd) for codes that match. Cross-column
        // alignment is the operator's decision at C27-C, not the loader's.
        //
        // To pin this: the test seeds a workbook column AND, separately,
        // seeds another workbook column for property_val.property_use_cd
        // with EXISTING Mapped canonical_values that use a DIFFERENT
        // string than what the dictionary description says. The loader
        // for C27-B's column must propose the DICTIONARY description,
        // NOT the property_val column's prior canonical_value.
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        // Seed a SEPARATE pre-existing C22-C mapping for the same code
        // on the property_val side. The loader must NOT pick this up.
        var c22Column = new SyncMappingColumn
        {
            CountyId = fx.County.Id, WorkbookId = fx.Workbook.Id,
            SourceSchema = "dbo", SourceTable = "property_val",
            SourceColumn = "property_use_cd",
            MappingLane = "Valuation",
            ReviewStatus = "Mapped",
            CanonicalTarget = "PropertyUse",
        };
        db.SyncMappingColumns.Add(c22Column);
        var c22Row = new SyncMappingCodeValue
        {
            CountyId = fx.County.Id, MappingColumnId = c22Column.Id,
            SourceValue = "11", ReviewStatus = "Mapped",
            // Operator-rephrased canonical_value from C22-C (intentionally
            // different from the dictionary description "Single Family
            // Residential" to detect any cross-column read).
            CanonicalValue = "OPERATOR-REPHRASED-FROM-C22C",
        };
        db.SyncMappingCodeValues.Add(c22Row);
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family Residential"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("Single Family Residential",
            "C27-A Hard Guard #3 extension: the loader proposes the DICTIONARY " +
            "description verbatim. It does NOT read C22-C's prior " +
            "canonical_value ('OPERATOR-REPHRASED-FROM-C22C') for the same " +
            "code. Cross-column alignment is the operator's decision at C27-C.");
        row.CanonicalValue.Should().NotBe("OPERATOR-REPHRASED-FROM-C22C",
            "explicit anti-pattern check: the prior C22-C mapping must NOT leak");
    }

    // ── M1: workbook code missing from dictionary, with cross-column note

    [Fact]
    public async Task Loader_DefersWhenImprvPrimaryUseCodeMissingFromDictionary_M1()
    {
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "999" });

        var pacs = new StubReader(new[] { Row("11", "Single Family Residential") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Notes.Should().Contain("missing from PACS property_use dictionary",
            "even though this is a C27-B (imprv-side) loader run, the " +
            "dictionary table is still property_use — the M1 note names " +
            "the actual dictionary table");
    }

    // ── Precondition gate: NeedsReview rows produce zero proposals ─────

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenP2NotMet()
    {
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "11", "21" },
            status: "NeedsReview");

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family"),
            Row("21", "Commercial"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        result.WorkbookDeferredRows.Should().Be(0);
        result.ProposedRows.Should().BeEmpty();
    }

    // ── Lane-agnostic (P1 deferred per C25-B / C26-A) ──────────────────

    [Fact]
    public async Task Loader_WorksWithColumnInOtherLane_PerC25BFinding()
    {
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "11" },
            status: "Deferred",
            columnLane: "Other");                           // ← P1 NOT met

        var pacs = new StubReader(new[] { Row("11", "Single Family Residential") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(1,
            "loader joins by SourceColumn, not lane");
    }

    // ── PropertyUse vocabulary REUSE pinned in target config ──────────

    [Fact]
    public async Task Target_ReusesPropertyUseVocabulary_ForCanonicalFallback()
    {
        // C27 reuses C22's "PropertyUse" canonical_target string. Future
        // canonical-value consumers reading the workbook see the same
        // canonical_target='PropertyUse' for BOTH property_val.property_use_cd
        // (C22-C) AND imprv.primary_use_cd (C27-C). This test pins the
        // reuse via the fallback path: when the dictionary description
        // is null, the loader's fallback string is "PropertyUse:<code>"
        // (NOT "ImprvPrimaryUse:<code>" or any other variant).
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        var pacs = new StubReader(new[] { Row("11", desc: null) });
        var configNoDesc = DefaultPropertyUseConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), configNoDesc);

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("PropertyUse:11",
            "C27 reuses C22's 'PropertyUse' canonical_target — fallback " +
            "format must match for consumer-side cross-column consistency");
    }

    // ── Read-only no-mutation contract ─────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbookOnImprvPrimaryUseProposal()
    {
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11", "21", "83" });

        var preWb = fx.Workbook.UpdatedAt;
        var preCol = fx.ImprvPrimaryUseColumn.UpdatedAt;
        var preRows = fx.Rows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family"),
            Row("21", "Commercial"),
            Row("83", "Industrial"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking()
            .Where(c => c.SourceColumn == "primary_use_cd")
            .SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking().ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWb);
        colReloaded.UpdatedAt.Should().Be(preCol);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRows);
        rowsReloaded.Should().AllSatisfy(r => r.ReviewStatus.Should().Be("Deferred"));
    }

    // ── M2: dictionary-only codes ignored ───────────────────────────────

    [Fact]
    public async Task Loader_OmitsDictionaryRowsUnobservedInImprvWorkbook_M2()
    {
        await using var db = CreateContext($"c27b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family"),
            Row("21", "Commercial"),                  // unobserved on imprv side
            Row("83", "Industrial"),                  // unobserved on imprv side
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, ImprvPrimaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(1);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(2,
            "M2 counts dictionary rows the imprv-side workbook never observed; " +
            "it does NOT cross-reference the property_val side");
        result.ProposedRows.Should().HaveCount(1);
    }
}
