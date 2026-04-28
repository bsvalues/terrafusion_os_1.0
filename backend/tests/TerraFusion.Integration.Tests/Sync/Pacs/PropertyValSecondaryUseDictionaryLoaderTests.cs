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
/// Slice C28-B service tests. Pin the
/// <c>property_val.secondary_use_cd</c> ↔ <c>dbo.property_use</c>
/// lane — the SECOND dictionary-reuse case in the C-series.
///
/// <para>What's new for C28-B vs C27-B (the first dictionary-reuse):
/// <list type="bullet">
/// <item>Same <c>dbo.property_use</c> dictionary as C22 + C27.</item>
/// <item>NEW workbook column: <c>property_val.secondary_use_cd</c>
///   (5 NeedsReview rows: 11, 37, 61, 69, 81).</item>
/// <item><b>Distinct canonical_target</b>: <c>"PropertySecondaryUse"</c>,
///   NOT <c>"PropertyUse"</c>. C28-B proves that two workbook columns
///   sharing one PACS dictionary can carry different canonical-target
///   vocabularies — the
///   <see cref="DictionaryLoaderTargetConfig.CanonicalTargetName"/>
///   field is genuinely orthogonal from the dictionary identity.</item>
/// <item>No re-inspection of <c>dbo.property_use</c> — inherited from
///   C22-B-live (per-dictionary inspection scope, second exercise of
///   that property after C27-B).</item>
/// <item>No allowlist change.</item>
/// <item>No new CLI flag — <c>--workbook-source-column</c> from
///   C27-B is reused as-is.</item>
/// </list>
/// </para>
/// </summary>
public class PropertyValSecondaryUseDictionaryLoaderTests
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
        SyncMappingColumn SecondaryUseColumn,
        IReadOnlyList<SyncMappingCodeValue> Rows);

    /// <summary>
    /// C28-B target config. Same dbo.property_use dictionary as C22 /
    /// C27, but:
    ///   - workbook target = property_val.secondary_use_cd
    ///   - canonical_target = "PropertySecondaryUse" (distinct from
    ///     C22-C / C27-C's "PropertyUse").
    /// </summary>
    private static DictionaryLoaderTargetConfig PropertyValSecondaryUseTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "property_val",
            WorkbookSourceColumn: "secondary_use_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "property_use",          // ← REUSED from C22 / C27
            CanonicalTargetName:  "PropertySecondaryUse"); // ← DISTINCT from C22 / C27

    /// <summary>
    /// Default column config — IDENTICAL to C22 / C27 because the
    /// dictionary is the same. C22-B-live captured: code/desc columns,
    /// no sys_flag, no year column. C28-B inherits without re-inspection.
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
            Name = "fixture-c28-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "property_val",
            SourceColumn = "secondary_use_cd",
            MappingLane = columnLane,
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
        };
        db.SyncMappingColumns.Add(col);

        var codeList = (codes ?? new[] { "11", "37", "61" }).ToList();
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

    /// <summary>Builds a stub PACS dictionary row in the dbo.property_use shape (same as C22 / C27).</summary>
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

    // ── M5: clean Benton-shaped match ──────────────────────────────────

    [Fact]
    public async Task Loader_ProposesMappedForCleanMatch_C28BPath()
    {
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11", "37", "61", "69", "81" });

        // Real Benton DOR PUC dictionary entries
        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("37", "37 Wholesale - Other"),
            Row("61", "61 Service - Personal"),
            Row("69", "69 Service - Other"),
            Row("81", "81 Cur - Use - Open Space"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(5);
        result.ProposedRows.Should().HaveCount(5);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceTable.Should().Be("property_val");
            r.SourceColumn.Should().Be("secondary_use_cd",
                "C28-B targets secondary_use_cd, NOT property_use_cd (C22) " +
                "or primary_use_cd (C27)");
            r.ReviewStatus.Should().Be("Mapped");
        });
    }

    // ── C28-A new pin: distinct canonical_target despite shared dictionary

    [Fact]
    public async Task Target_UsesPropertySecondaryUseVocabulary_NotPropertyUse()
    {
        // The C28-A new architectural property: two workbook columns
        // sharing one PACS dictionary can carry DIFFERENT canonical_target
        // vocabularies. C22-C and C27-C use canonical_target=PropertyUse;
        // C28-C uses canonical_target=PropertySecondaryUse to distinguish
        // the secondary-use semantic axis from the primary-use semantic
        // axis. The fallback path makes this visible: when the dictionary
        // description is null, the loader's fallback string is
        // "PropertySecondaryUse:<code>" — NOT "PropertyUse:<code>".
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        var pacs = new StubReader(new[] { Row("11", desc: null) });
        var configNoDesc = DefaultPropertyUseConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), configNoDesc);

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("PropertySecondaryUse:11",
            "C28-B canonical_target = 'PropertySecondaryUse', distinct from " +
            "C22-C / C27-C's 'PropertyUse'. Fallback string proves the " +
            "vocabulary distinction even when the dictionary description " +
            "is the same source as C22 / C27.");
        row.CanonicalValue.Should().NotBe("PropertyUse:11",
            "explicit anti-pattern: the loader must NOT default to C22/C27's " +
            "'PropertyUse' just because the dictionary is shared");
    }

    // ── C27-A guard inherited: no cross-column auto-fill from C22-C/C27-C

    [Fact]
    public async Task Loader_DoesNotConsultPriorC22COrC27CMappingsForMatchingCodes()
    {
        // Same guard as C27-B: the loader proposes the dictionary
        // description verbatim, NOT any prior canonical_value mapped on a
        // sibling workbook column for the same code. This test seeds
        // BOTH C22-C-style (property_val.property_use_cd) AND C27-C-style
        // (imprv.primary_use_cd) mappings for code '11' with operator-
        // rephrased canonical_values, then verifies the C28-B loader
        // proposes the dictionary description for property_val.secondary_use_cd
        // — ignoring both prior mappings.
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        // Seed competing C22-C mapping for code '11' on property_use_cd
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

        // Seed competing C27-C mapping for code '11' on primary_use_cd
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
            Row("11", "11 Single Family"),  // dictionary description
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), DefaultPropertyUseConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("11 Single Family",
            "loader proposes the DICTIONARY description verbatim, " +
            "ignoring both C22-C's and C27-C's prior canonical_values");
        row.CanonicalValue.Should().NotBe("C22C-OPERATOR-REPHRASED");
        row.CanonicalValue.Should().NotBe("C27C-OPERATOR-REPHRASED");
    }

    // ── Precondition gate: NeedsReview rows produce zero proposals ─────

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenP2NotMet()
    {
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db,
            codes: new[] { "11", "37" },
            status: "NeedsReview");

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("37", "37 Wholesale - Other"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), DefaultPropertyUseConfig());

        result.WorkbookDeferredRows.Should().Be(0);
        result.ProposedRows.Should().BeEmpty();
    }

    // ── Read-only no-mutation contract ─────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbookOnSecondaryUseProposal()
    {
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11", "37", "61" });

        var preWb = fx.Workbook.UpdatedAt;
        var preCol = fx.SecondaryUseColumn.UpdatedAt;
        var preRows = fx.Rows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("37", "37 Wholesale - Other"),
            Row("61", "61 Service - Personal"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), DefaultPropertyUseConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking()
            .Where(c => c.SourceColumn == "secondary_use_cd")
            .SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking().ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWb);
        colReloaded.UpdatedAt.Should().Be(preCol);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRows);
        rowsReloaded.Should().AllSatisfy(r => r.ReviewStatus.Should().Be("Deferred"));
    }

    // ── M2: per-column scope (NOT cross-column union) ──────────────────

    [Fact]
    public async Task Loader_OmitsDictionaryRowsUnobservedInSecondaryUseColumn_M2()
    {
        // Per C27-B's pinned property: M2 is per-column. The loader
        // counts dictionary rows unobserved in THIS column's workbook
        // codes only — not against any cross-column union.
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "11" });

        var pacs = new StubReader(new[]
        {
            Row("11", "11 Single Family"),
            Row("37", "37 Wholesale - Other"),  // unobserved on secondary_use_cd
            Row("61", "61 Service - Personal"), // unobserved on secondary_use_cd
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(1);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(2,
            "M2 is per-column — counts dict rows unobserved on " +
            "secondary_use_cd specifically");
    }

    // ── Lane-agnostic (per C25-B / C26-A / C27-A) ──────────────────────

    [Fact]
    public async Task Loader_WorksWithColumnInOtherLane()
    {
        // The actual workbook column is in Other lane (C28-A audit
        // captured this). The loader joins by SourceColumn, not lane —
        // and Other is the default fixture lane here.
        await using var db = CreateContext($"c28b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(
            db, codes: new[] { "11" }, status: "Deferred", columnLane: "Other");

        var pacs = new StubReader(new[] { Row("11", "11 Single Family") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            PropertyValSecondaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(1);
    }
}
