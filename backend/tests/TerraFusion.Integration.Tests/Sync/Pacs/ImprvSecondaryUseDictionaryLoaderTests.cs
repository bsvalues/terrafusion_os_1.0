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
/// Slice C29-B service tests. Pin the
/// <c>imprv.secondary_use_cd</c> ↔ <c>dbo.property_use</c> lane —
/// the THIRD dictionary-reuse case in the C-series and the FIRST
/// to REUSE both the dictionary AND the canonical_target
/// vocabulary (mirroring C22+C27's PropertyUse reuse, but on the
/// PropertySecondaryUse axis introduced at C28-C).
///
/// <para>Smaller test file than prior C-series slices because the
/// architectural novelty is purely "canonical_target REUSE" —
/// already half-proven at C22+C27 for `PropertyUse`. This slice
/// completes the proof on the `PropertySecondaryUse` axis.</para>
/// </summary>
public class ImprvSecondaryUseDictionaryLoaderTests
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
        SyncMappingColumn ImprvSecondaryUseColumn,
        IReadOnlyList<SyncMappingCodeValue> Rows);

    /// <summary>
    /// C29-B target config. Same dbo.property_use dictionary as C22 /
    /// C27 / C28; same PropertySecondaryUse canonical_target as C28-C.
    /// </summary>
    private static DictionaryLoaderTargetConfig ImprvSecondaryUseTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "imprv",
            WorkbookSourceColumn: "secondary_use_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "property_use",            // ← REUSED from C22 / C27 / C28
            CanonicalTargetName:  "PropertySecondaryUse");   // ← REUSED from C28-C

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
            Name = "fixture-c29-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "imprv",
            SourceColumn = "secondary_use_cd",
            MappingLane = columnLane,
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
        };
        db.SyncMappingColumns.Add(col);

        var codeList = (codes ?? new[] { "18" }).ToList();
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

    // ── M5: clean Benton-shaped match (the smallest possible C-series proof)

    [Fact]
    public async Task Loader_ProposesMappedForCleanMatch_TheSingleCode18()
    {
        await using var db = CreateContext($"c29b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "18" });

        var pacs = new StubReader(new[] { Row("18", "18 Mobile Home") });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            ImprvSecondaryUseTarget(), DefaultPropertyUseConfig());

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.SourceTable.Should().Be("imprv");
        row.SourceColumn.Should().Be("secondary_use_cd");
        row.ReviewStatus.Should().Be("Mapped");
        row.CanonicalValue.Should().Be("18 Mobile Home");
    }

    // ── C29-A new architectural pin: canonical_target REUSE ────────────

    [Fact]
    public async Task Target_ReusesPropertySecondaryUseVocabulary_FromC28C()
    {
        // C29-A's new architectural property: two workbook columns can
        // share BOTH the PACS dictionary AND the canonical_target
        // vocabulary. The fallback path makes the REUSE visible: the
        // fallback string is "PropertySecondaryUse:18" — same as C28-C
        // would produce for the same code on property_val.secondary_use_cd.
        await using var db = CreateContext($"c29b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "18" });

        var pacs = new StubReader(new[] { Row("18", desc: null) });
        var configNoDesc = DefaultPropertyUseConfig() with { DescriptionColumn = null };
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            ImprvSecondaryUseTarget(), configNoDesc);

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("PropertySecondaryUse:18",
            "C29-B canonical_target REUSES C28-C's PropertySecondaryUse — " +
            "the fallback string format is identical, proving canonical_target " +
            "REUSE across workbook columns is supported");
        row.CanonicalValue.Should().NotBe("PropertyUse:18",
            "explicit anti-pattern: the loader must NOT default to C22/C27's " +
            "PropertyUse just because the dictionary is shared");
    }

    // ── C27-A guard inherited: no cross-column auto-fill ──────────────

    [Fact]
    public async Task Loader_DoesNotConsultPriorMappingsForMatchingCodes()
    {
        // Even when a competing C28-C-style mapping exists for code '18'
        // on property_val.secondary_use_cd (same canonical_target!), the
        // loader for imprv.secondary_use_cd proposes the dictionary
        // description verbatim, not the prior mapping's canonical_value.
        await using var db = CreateContext($"c29b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "18" });

        // Seed competing C28-C-style mapping for code '18' on
        // property_val.secondary_use_cd (same canonical_target as this slice)
        var c28Column = new SyncMappingColumn
        {
            CountyId = fx.County.Id, WorkbookId = fx.Workbook.Id,
            SourceSchema = "dbo", SourceTable = "property_val",
            SourceColumn = "secondary_use_cd",
            MappingLane = "Other",
            ReviewStatus = "Mapped",
            CanonicalTarget = "PropertySecondaryUse",
        };
        db.SyncMappingColumns.Add(c28Column);
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = fx.County.Id, MappingColumnId = c28Column.Id,
            SourceValue = "18", ReviewStatus = "Mapped",
            CanonicalValue = "C28C-OPERATOR-REPHRASED",
        });
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[] { Row("18", "18 Mobile Home") });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            ImprvSecondaryUseTarget(), DefaultPropertyUseConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("18 Mobile Home",
            "loader proposes the DICTIONARY description, NOT C28-C's " +
            "prior canonical_value — even when the canonical_target is " +
            "literally the same string ('PropertySecondaryUse')");
        row.CanonicalValue.Should().NotBe("C28C-OPERATOR-REPHRASED");
    }

    // ── Precondition gate ─────────────────────────────────────────────

    [Fact]
    public async Task Loader_ProducesZeroRowsWhenP2NotMet()
    {
        await using var db = CreateContext($"c29b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "18" }, status: "NeedsReview");

        var pacs = new StubReader(new[] { Row("18", "18 Mobile Home") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            ImprvSecondaryUseTarget(), DefaultPropertyUseConfig());

        result.WorkbookDeferredRows.Should().Be(0);
        result.ProposedRows.Should().BeEmpty();
    }

    // ── Read-only no-mutation contract ─────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbookOnImprvSecondaryUseProposal()
    {
        await using var db = CreateContext($"c29b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, codes: new[] { "18" });

        var preWb = fx.Workbook.UpdatedAt;
        var preCol = fx.ImprvSecondaryUseColumn.UpdatedAt;
        var preRows = fx.Rows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[] { Row("18", "18 Mobile Home") });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id,
            ImprvSecondaryUseTarget(), DefaultPropertyUseConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking()
            .Where(c => c.SourceTable == "imprv" && c.SourceColumn == "secondary_use_cd")
            .SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking().ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWb);
        colReloaded.UpdatedAt.Should().Be(preCol);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRows);
        rowsReloaded.Should().AllSatisfy(r => r.ReviewStatus.Should().Be("Deferred"));
    }
}
