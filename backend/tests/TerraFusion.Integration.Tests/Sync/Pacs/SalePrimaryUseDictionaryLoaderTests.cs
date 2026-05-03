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
/// Slice C30-B service tests. Pin the
/// <c>sale.primary_use_cd</c> ↔ <c>dbo.property_use</c> lane —
/// the FOURTH dictionary-reuse case in the C-series and the
/// THIRD workbook column on canonical_target=`PropertyUse`.
///
/// <para>What's new for C30-B vs the prior 3 dictionary-reuse
/// slices (C27/C28/C29):
/// <list type="bullet">
/// <item>Sales-side workbook target: <c>sale.primary_use_cd</c>
///   (43 NeedsReview rows; largest remaining dictionary-reuse
///   target in the workbook).</item>
/// <item>canonical_target=`PropertyUse` REUSED from C22-C +
///   C27-C — proving the canonical_target REUSE pattern scales
///   from N=2 to N=3 columns sharing one vocabulary.</item>
/// <item>NEW guard: no sale-context inference. Per C30-A's
///   sales-specific amendment, the loader does NOT read sibling
///   sale.* fields (sl_dt, sl_price, etc.) for canonical_value
///   derivation — the canonical_value is purely the dictionary
///   description; sale-context interpretation is the operator's
///   authority at C30-C.</item>
/// <item>Standard guards inherited: no new live-inspection,
///   no allowlist change, no new CLI flag, no new service class,
///   no cross-column auto-fill.</item>
/// </list>
/// </para>
/// </summary>
public class SalePrimaryUseDictionaryLoaderTests
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
        SyncMappingColumn SalePrimaryUseColumn,
        IReadOnlyList<SyncMappingCodeValue> Rows);

    /// <summary>
    /// C30-B target config. Same dbo.property_use dictionary as C22 /
    /// C27 / C28 / C29; same canonical_target=PropertyUse as C22 / C27.
    /// </summary>
    private static DictionaryLoaderTargetConfig SalePrimaryUseTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "sale",
            WorkbookSourceColumn: "primary_use_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "property_use",   // ← REUSED from C22 / C27 / C28 / C29
            CanonicalTargetName:  "PropertyUse");   // ← REUSED from C22-C and C27-C

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
        string columnLane = "Other")
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
            Name = "fixture-c30-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "sale",
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

    // ── M5: clean Benton-shaped match (sales-side path) ───────────────

    [Fact]
    public async Task Loader_ProposesMappedForCleanSaleMatch_M5()
    {
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11", "21", "83" });

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("21", "21 Manufacturing - Food"),
            Row("83", "83 Cur - Use - Ag"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(3);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceTable.Should().Be("sale",
                "C30-B targets sale (NOT property_val from C22 or imprv from C27)");
            r.SourceColumn.Should().Be("primary_use_cd");
            r.ReviewStatus.Should().Be("Mapped");
        });
    }

    // ── C30-A NEW pin: no sale-context inference ──────────────────────

    [Fact]
    public async Task Loader_DoesNotReadSaleContextFields_ForCanonicalDerivation()
    {
        // C30-A's new sales-specific Hard Guard: the loader does NOT
        // read sibling sale.* fields (sl_dt, sl_price, sl_class_cd, etc.)
        // when deriving canonical_value. The canonical_value comes purely
        // from the property_use dictionary's description column. Sale-
        // context interpretation is the operator's authority at C30-C.
        //
        // This test pins the property by seeding sale-context columns
        // alongside the target column. If the loader were inappropriately
        // reading those, the proposed canonical_value could plausibly
        // include the sale year, price, etc. The loader must NOT.
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        // Seed several sibling sale-context workbook columns. These exist
        // in the workbook's column scope but are NOT what C30-B targets.
        var siblings = new[]
        {
            ("sl_dt",        "2018-06-15"),
            ("sl_price",     "450000"),
            ("sl_class_cd",  "MA"),
            ("sl_type_cd",   "REGULAR"),
        };
        foreach (var (siblingCol, siblingValue) in siblings)
        {
            var col = new SyncMappingColumn
            {
                CountyId = fx.County.Id, WorkbookId = fx.Workbook.Id,
                SourceSchema = "dbo", SourceTable = "sale",
                SourceColumn = siblingCol,
                MappingLane = "Sales",
                ReviewStatus = "Deferred",
                CanonicalTarget = null,
            };
            db.SyncMappingColumns.Add(col);
            db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
            {
                CountyId = fx.County.Id, MappingColumnId = col.Id,
                SourceValue = siblingValue, ReviewStatus = "Deferred",
            });
        }
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), DefaultPropertyUseConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("11 Single Family",
            "the loader proposes the DICTIONARY description verbatim. " +
            "It does NOT consult sale-context columns (sl_dt, sl_price, " +
            "sl_class_cd, sl_type_cd) when deriving canonical_value. " +
            "Sale-context interpretation is the operator's authority at C30-C.");

        // Anti-pattern: the canonical_value must NOT contain any of the
        // sale-context values
        row.CanonicalValue.Should().NotContain("2018",
            "sale year (from sl_dt) must not leak into canonical_value");
        row.CanonicalValue.Should().NotContain("450000",
            "sale price must not leak into canonical_value");
        row.CanonicalValue.Should().NotContain("MA",
            "sale class must not leak into canonical_value");
        row.CanonicalValue.Should().NotContain("REGULAR",
            "sale type must not leak into canonical_value");

        // Per C30-A: the result row count must be exactly 1 — only the
        // explicitly-targeted column produces a proposed row, NOT the
        // sibling columns that are also Deferred in the workbook.
        result.ProposedRows.Should().HaveCount(1,
            "only sale.primary_use_cd is in scope; sibling sale.* columns " +
            "are NOT swept into the proposal even when they are Deferred");
    }

    // ── canonical_target=PropertyUse REUSE pinned ─────────────────────

    [Fact]
    public async Task Target_ReusesPropertyUseVocabulary_ThirdColumnOnSameTarget()
    {
        // canonical_target=PropertyUse is now used by THREE workbook
        // columns: property_val.property_use_cd (C22-C),
        // imprv.primary_use_cd (C27-C), and sale.primary_use_cd (C30-C).
        // The fallback path makes the REUSE visible.
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        var pacs = new StubReader(new[] { Row("11", desc: null) });
        var configNoDesc = DefaultPropertyUseConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), configNoDesc);

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("PropertyUse:11",
            "C30-B canonical_target=PropertyUse — same as C22-C and C27-C. " +
            "Fallback string format is identical to those slices.");
        row.CanonicalValue.Should().NotBe("PropertySecondaryUse:11",
            "explicit anti-pattern: must NOT default to C28/C29's vocabulary");
    }

    // ── No cross-column auto-fill (extends C27-A guard) ───────────────

    [Fact]
    public async Task Loader_DoesNotConsultPriorMappingsFromC22COrC27CForMatchingCodes()
    {
        // C30-B's loader for sale.primary_use_cd must NOT consult prior
        // C22-C / C27-C mappings for matching codes — even though all
        // three carry canonical_target=PropertyUse. Cross-column
        // alignment is the operator's decision at C30-C.
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        // Seed competing C22-C-style mapping
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
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = fx.County.Id, MappingColumnId = c22Column.Id,
            SourceValue = "11", ReviewStatus = "Mapped",
            CanonicalValue = "C22C-OPERATOR-REPHRASED",
        });

        // Seed competing C27-C-style mapping
        var c27Column = new SyncMappingColumn
        {
            CountyId = fx.County.Id, WorkbookId = fx.Workbook.Id,
            SourceSchema = "dbo", SourceTable = "imprv",
            SourceColumn = "primary_use_cd",
            MappingLane = "Other",
            ReviewStatus = "Mapped",
            CanonicalTarget = "PropertyUse",
        };
        db.SyncMappingColumns.Add(c27Column);
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = fx.County.Id, MappingColumnId = c27Column.Id,
            SourceValue = "11", ReviewStatus = "Mapped",
            CanonicalValue = "C27C-OPERATOR-REPHRASED",
        });
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), DefaultPropertyUseConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("11 Single Family",
            "loader proposes the DICTIONARY description, ignoring C22-C and C27-C");
        row.CanonicalValue.Should().NotBe("C22C-OPERATOR-REPHRASED");
        row.CanonicalValue.Should().NotBe("C27C-OPERATOR-REPHRASED");
    }

    // ── Precondition gate: NeedsReview rows produce zero proposals ────

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenP2NotMet()
    {
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db, codes: new[] { "11", "21" }, status: "NeedsReview");

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("21", "21 Manufacturing - Food"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), DefaultPropertyUseConfig());

        result.WorkbookDeferredRows.Should().Be(0);
        result.ProposedRows.Should().BeEmpty();
    }

    // ── Read-only no-mutation contract ────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbookOnSaleProposal()
    {
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11", "21", "83" });

        var preWb = fx.Workbook.UpdatedAt;
        var preCol = fx.SalePrimaryUseColumn.UpdatedAt;
        var preRows = fx.Rows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("21", "21 Manufacturing - Food"),
            Row("83", "83 Cur - Use - Ag"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), DefaultPropertyUseConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking()
            .Where(c => c.SourceTable == "sale" && c.SourceColumn == "primary_use_cd")
            .SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking().ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWb);
        colReloaded.UpdatedAt.Should().Be(preCol);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRows);
        rowsReloaded.Should().AllSatisfy(r => r.ReviewStatus.Should().Be("Deferred"));
    }

    // ── M2: per-column scope (sales-side) ────────────────────────────

    [Fact]
    public async Task Loader_OmitsDictionaryRowsUnobservedInSaleColumn_M2()
    {
        // M2 is per-column: dictionary rows unobserved on
        // sale.primary_use_cd specifically. Does NOT cross-reference
        // C22-C / C27-C / C28-C / C29-C observations.
        await using var db = CreateContext($"c30b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("21", "21 Manufacturing - Food"),  // unobserved on sale side
            Row("83", "83 Cur - Use - Ag"),         // unobserved on sale side
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            SalePrimaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(1);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(2,
            "M2 is per-column; sale-side observations only");
    }
}
