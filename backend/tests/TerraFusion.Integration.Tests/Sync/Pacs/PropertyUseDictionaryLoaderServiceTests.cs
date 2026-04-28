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
/// Slice C22-B service tests. Mirror the C14-B / C16-D / C17 / C19 /
/// C20 test scaffolding patterns (InMemory provider, fresh database
/// per test, no live PACS access). Every M1-M5 mismatch path from
/// the C22-A policy is pinned here; the read-only no-mutation
/// contract is pinned by an explicit UpdatedAt-unchanged test.
/// </summary>
public class PropertyUseDictionaryLoaderServiceTests
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
        SyncMappingColumn UseColumn,
        IReadOnlyList<SyncMappingCodeValue> DeferredRows);

    /// <summary>
    /// Standard fixture: a Draft workbook with one column
    /// (`property_val.property_use_cd`) carrying 3 Deferred code-value
    /// rows ('11', '21', '83'). Tests can adjust the rows or seed
    /// extra dictionary entries for each scenario.
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
            Name = "fixture-c22-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "property_val",
            SourceColumn = "property_use_cd",
            MappingLane = "Valuation",
            ReviewStatus = "Mapped",
            CanonicalTarget = "PropertyUse",
        };
        db.SyncMappingColumns.Add(col);

        var codes = (deferredCodes ?? new[] { "11", "21", "83" }).ToList();
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

    /// <summary>
    /// Standard column config matching the C22-B Program.cs default
    /// for `dbo.property_use`. Tests can override per scenario.
    /// </summary>
    private static PropertyUseDictionaryColumnConfig DefaultConfig() =>
        new(
            CodeColumn:           "property_use_cd",
            DescriptionColumn:    "property_use_desc",
            ActiveFlagColumn:     "sys_flag",
            ActiveFlagPredicate:  "sys_flag <> 'I'",
            YearColumn:           null);

    /// <summary>Builds a stub PACS dictionary row from a code/desc/sysFlag triple.</summary>
    private static PacsDictionaryRow Row(string code, string? desc = null, string? sysFlag = "A")
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["property_use_cd"] = code,
        };
        if (desc is not null) dict["property_use_desc"] = desc;
        if (sysFlag is not null) dict["sys_flag"] = sysFlag;
        return new PacsDictionaryRow(dict);
    }

    /// <summary>Test stub — returns canned rows; never touches the network.</summary>
    private sealed class StubReader : IPacsDictionaryReader
    {
        private readonly List<PacsDictionaryRow> _rows;
        public StubReader(IEnumerable<PacsDictionaryRow> rows)
            => _rows = rows.ToList();

        public Task<PacsDictionaryReadResult> ReadDictionaryAsync(
            string schemaName, string tableName, CancellationToken cancellationToken = default)
            => Task.FromResult(new PacsDictionaryReadResult(
                schemaName, tableName,
                new List<string> { "property_use_cd", "property_use_desc", "sys_flag" },
                _rows));
    }

    // ── Cross-county isolation ──────────────────────────────────────────

    [Fact]
    public async Task Loader_RejectsCrossCountyWorkbook()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);
        var otherCountyId = Guid.NewGuid();

        var pacs = new StubReader(new[] { Row("11", "Single Family") });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        Func<Task> act = () => sut.ProposeReviewCsvAsync(
            otherCountyId, fx.Workbook.Id, DefaultConfig());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found for county {otherCountyId}*");
    }

    // ── Read-only contract ──────────────────────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateWorkbook()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var preWorkbookUpdated = fx.Workbook.UpdatedAt;
        var preColumnUpdated = fx.UseColumn.UpdatedAt;
        var preRowUpdated = fx.DeferredRows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family"),
            Row("21", "Commercial"),
            Row("83", "Industrial"),
        });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(fx.County.Id, fx.Workbook.Id, DefaultConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking()
            .OrderBy(v => v.SourceValue).ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWorkbookUpdated, "workbook UpdatedAt must not change");
        colReloaded.UpdatedAt.Should().Be(preColumnUpdated, "column UpdatedAt must not change");
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRowUpdated,
            "every code-value's UpdatedAt must remain identical");
        rowsReloaded.Should().AllSatisfy(r =>
            r.ReviewStatus.Should().Be("Deferred", "no row promoted to a terminal status"));
    }

    // ── M5: clean match ─────────────────────────────────────────────────

    [Fact]
    public async Task Loader_ProposesMappedForCleanActiveMatch_M5()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "11" });

        var pacs = new StubReader(new[] { Row("11", "Single Family Residential", "A") });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.M5CleanMatch.Should().Be(1);
        result.M1WorkbookCodeMissingFromDictionary.Should().Be(0);
        result.M3DuplicateDictionaryCode.Should().Be(0);
        result.M4InactiveDictionaryRow.Should().Be(0);

        result.ProposedRows.Should().HaveCount(1);
        var row = result.ProposedRows[0];
        row.ReviewStatus.Should().Be("Mapped");
        row.SourceValue.Should().Be("11");
        row.CanonicalValue.Should().Be("Single Family Residential");
        row.IsExcluded.Should().Be(false);
        row.Classification.Should().Be(PropertyUseClassification.CleanMatch);
        row.Notes.Should().Contain("Dictionary-matched");
        row.Notes.Should().Contain("pre-2017 records");
    }

    // ── M1: workbook code missing from dictionary ───────────────────────

    [Fact]
    public async Task Loader_DefersWhenWorkbookCodeMissingFromDictionary_M1()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "X1" });

        var pacs = new StubReader(new[] { Row("11", "Single Family") });  // no X1
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        result.M5CleanMatch.Should().Be(0);

        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.SourceValue.Should().Be("X1");
        row.CanonicalValue.Should().BeNull();
        row.CanonicalValueNull.Should().Be(true);
        row.Classification.Should().Be(PropertyUseClassification.WorkbookCodeMissingFromDictionary);
        row.Notes.Should().Contain("missing from PACS property_use dictionary");
        row.Notes.Should().Contain("data-integrity issue");
    }

    // ── M2: dictionary code unobserved in workbook ──────────────────────

    [Fact]
    public async Task Loader_OmitsDictionaryRowsUnobservedInWorkbook_M2()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "11" });

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family"),
            Row("21", "Commercial"),  // unobserved
            Row("83", "Industrial"),  // unobserved
        });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.DictionaryRowsRead.Should().Be(3);
        result.M5CleanMatch.Should().Be(1);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(2,
            "M2 counts dictionary rows not present in the workbook");
        result.ProposedRows.Should().HaveCount(1,
            "M2 rows are NOT included in the proposed CSV");
        result.ProposedRows[0].SourceValue.Should().Be("11");
    }

    // ── M3: duplicate dictionary code ───────────────────────────────────

    [Fact]
    public async Task Loader_DefersOnDuplicateDictionaryCode_M3()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "11" });

        var pacs = new StubReader(new[]
        {
            Row("11", "Single Family"),
            Row("11", "Mobile Home"),  // collision
        });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.M3DuplicateDictionaryCode.Should().Be(1);
        result.M5CleanMatch.Should().Be(0);

        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Classification.Should().Be(PropertyUseClassification.DuplicateDictionaryCode);
        row.Notes.Should().Contain("multiple dictionary rows");
        row.Notes.Should().Contain("Cannot unambiguously map");
        row.Notes.Should().Contain("Single Family");
        row.Notes.Should().Contain("Mobile Home");
    }

    // ── M4: inactive dictionary row ─────────────────────────────────────

    [Fact]
    public async Task Loader_DefersOnInactiveDictionaryRow_M4()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "99" });

        var pacs = new StubReader(new[]
        {
            Row("99", "Legacy Use", sysFlag: "I"),  // inactive
        });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.M4InactiveDictionaryRow.Should().Be(1);
        result.M5CleanMatch.Should().Be(0);

        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Classification.Should().Be(PropertyUseClassification.InactiveDictionaryRow);
        row.Notes.Should().Contain("INACTIVE");
        row.Notes.Should().Contain("legacy or pre-conversion");
    }

    [Fact]
    public async Task Loader_TreatsAllRowsAsActiveWhenNoActiveFlagConfigured()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "99" });

        var pacs = new StubReader(new[] { Row("99", "Legacy", sysFlag: "I") });
        var configWithoutActiveFlag = DefaultConfig() with
        {
            ActiveFlagColumn = null,
            ActiveFlagPredicate = null,
        };

        var sut = new PropertyUseDictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, configWithoutActiveFlag);

        result.M4InactiveDictionaryRow.Should().Be(0,
            "without an active-flag predicate, M4 cannot fire");
        result.M5CleanMatch.Should().Be(1,
            "the row is treated as active and proposed Mapped");
    }

    // ── Mixed scenarios ─────────────────────────────────────────────────

    [Fact]
    public async Task Loader_HandlesAllFiveCategoriesInOneRun()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[]
        {
            "11",  // M5 clean
            "X1",  // M1 missing
            "DUP", // M3 duplicate
            "INA", // M4 inactive
        });

        var pacs = new StubReader(new[]
        {
            Row("11",  "Single Family",  "A"),
            Row("DUP", "First Variant",  "A"),
            Row("DUP", "Second Variant", "A"),
            Row("INA", "Legacy Use",     "I"),
            Row("Z1",  "Unobserved",     "A"),  // M2
        });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.WorkbookDeferredRows.Should().Be(4);
        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(1);
        result.M3DuplicateDictionaryCode.Should().Be(1);
        result.M4InactiveDictionaryRow.Should().Be(1);
        result.M5CleanMatch.Should().Be(1);
        result.ProposedRows.Should().HaveCount(4,
            "M2 rows are NOT in the CSV; M1+M3+M4+M5 = 4");
    }

    // ── RFC 4180 / canonical_value handling ─────────────────────────────

    [Fact]
    public async Task Loader_ProposesCanonicalValueWithCommas_PreservedVerbatim()
    {
        // C17-A2 lesson: descriptions with commas / quotes pass through
        // the loader's ProposedReviewCsvRow. The CLI dispatcher's CSV
        // emitter handles RFC 4180 quoting — the service preserves the
        // string verbatim.
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "11" });

        var pacs = new StubReader(new[]
        {
            Row("11", "Residential, Single Family, Detached", "A"),
        });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("Residential, Single Family, Detached",
            "the service does not modify the description; CSV emitter handles quoting");
    }

    [Fact]
    public async Task Loader_FallsBackToCanonicalTargetWhenDescriptionMissing()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "11" });

        // Dictionary row with no description column (or null description)
        var pacs = new StubReader(new[] { Row("11", desc: null, sysFlag: "A") });
        var configNoDesc = DefaultConfig() with { DescriptionColumn = null };
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, configNoDesc);

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("PropertyUse:11",
            "fallback uses canonical_target:code; operator can rephrase at C22-C");
    }

    // ── Workbook column-existence guard ─────────────────────────────────

    [Fact]
    public async Task Loader_ThrowsWhenWorkbookLacksPropertyUseCdColumn()
    {
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Drop the column row to simulate a workbook without the target column
        var col = await db.SyncMappingColumns.SingleAsync();
        var values = await db.SyncMappingCodeValues.ToListAsync();
        db.SyncMappingCodeValues.RemoveRange(values);
        db.SyncMappingColumns.Remove(col);
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[] { Row("11", "Single Family") });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        Func<Task> act = () => sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*does not contain a column for dbo.property_val.property_use_cd*");
    }

    // ── C12 trim-on-both-sides interop ──────────────────────────────────

    [Fact]
    public async Task Loader_MatchesPaddedSourceValuesAfterTrim()
    {
        // PACS char(N) padding may surface in the workbook; the C12
        // matcher already trims both sides for matching. The loader's
        // dictionary lookup is keyed by the *trimmed* SourceValue, so
        // a workbook value of "11   " still matches a dictionary code
        // of "11".
        await using var db = CreateContext($"c22b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "11   " });

        var pacs = new StubReader(new[] { Row("11", "Single Family") });
        var sut = new PropertyUseDictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, DefaultConfig());

        result.M5CleanMatch.Should().Be(1,
            "trimmed workbook value '11' matches dictionary code '11'");
        var row = result.ProposedRows.Single();
        row.SourceValue.Should().Be("11   ",
            "stored SourceValue is preserved verbatim per C12 'never rewrite stored values'");
    }
}
