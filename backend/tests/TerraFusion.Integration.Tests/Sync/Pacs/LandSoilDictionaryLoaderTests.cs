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
/// Slice C24-B service tests. Pin the
/// <c>land_detail.land_soil_code</c> ↔ <c>dbo.land_soil</c> lane to
/// prove the C23-B generalized DictionaryLoaderService machinery
/// drives a third workbook source triple + PACS dictionary table
/// without code changes — and to pin the C24-A policy's
/// Land-specific guards.
///
/// <para>The C22-B test file (<c>DictionaryLoaderServiceTests</c>)
/// already exhaustively pins every M1-M5 path. The C23-B test file
/// (<c>ImprvDetClassDictionaryLoaderTests</c>) pins a second target
/// generalization. These tests focus on what's <em>new</em> for
/// C24-B:
/// <list type="bullet">
/// <item>The workbook source is <c>land_detail.land_soil_code</c>.</item>
/// <item>The PACS dictionary table is <c>dbo.land_soil</c> with
///   Hungarian-notation column names (<c>szLandSoilCode</c>,
///   <c>szLandSoilDesc</c>) — not <c>land_soil_code</c> /
///   <c>land_soil_desc</c>.</item>
/// <item>The canonical-target vocabulary is <c>"LandSoil"</c>.</item>
/// <item>NULL <c>szLandSoilDesc</c> rows (BMDRP, RMDRP in Benton)
///   correctly fall through to the <c>"LandSoil:&lt;code&gt;"</c>
///   canonical fallback — pinned for the operator's C24-C review.</item>
/// <item>No code-prefix logic: the loader treats <c>"DRAG1"</c> /
///   <c>"IRAG1"</c> / <c>"NONE"</c> identically. Per C24-A Hard Guard
///   #3, no RCW 84.34 / current-use intent leaks from prefix.</item>
/// <item>Real Benton land_soil_code codes seeded from C24-B-live
///   inspection: <c>"DRAG1"</c>, <c>"IRAG1"</c>, <c>"BASE$"</c>,
///   <c>"NONE"</c>, <c>"WASTE"</c>, <c>"BMDRP"</c> (NULL desc),
///   <c>"RHS94"</c>.</item>
/// </list>
/// </para>
/// </summary>
public class LandSoilDictionaryLoaderTests
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
        SyncMappingColumn SoilColumn,
        IReadOnlyList<SyncMappingCodeValue> DeferredRows);

    /// <summary>
    /// Land-soil lane target config — what C24-B's CLI dispatcher
    /// passes for `land_soil`. Mirrors the Program.cs switch entry.
    /// </summary>
    private static DictionaryLoaderTargetConfig LandSoilTarget() =>
        new(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "land_detail",
            WorkbookSourceColumn: "land_soil_code",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "land_soil",
            CanonicalTargetName:  "LandSoil");

    /// <summary>
    /// Default column config matching the C24-B-live inspection of
    /// dbo.land_soil (Hungarian-notation columns, no active flag,
    /// no year keying).
    /// </summary>
    private static DictionaryColumnConfig DefaultLandSoilConfig() =>
        new(
            CodeColumn:           "szLandSoilCode",
            DescriptionColumn:    "szLandSoilDesc",
            ActiveFlagColumn:     null,           // confirmed at C24-B-live
            ActiveFlagPredicate:  null,
            YearColumn:           null);

    /// <summary>
    /// Standard fixture: a Draft workbook with one column
    /// (<c>land_detail.land_soil_code</c>) carrying Deferred
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
            Name = "fixture-c24-b", Status = "Draft",
        };
        db.SyncMappingWorkbooks.Add(wb);

        var col = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "land_detail",
            SourceColumn = "land_soil_code",
            MappingLane = "Land",
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
        };
        db.SyncMappingColumns.Add(col);

        var codes = (deferredCodes ?? new[] { "DRAG1", "IRAG1", "NONE" }).ToList();
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

    /// <summary>Builds a stub PACS dictionary row in the dbo.land_soil shape.</summary>
    private static PacsDictionaryRow Row(string code, string? desc = null)
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["szLandSoilCode"] = code,
        };
        // Distinguishing "no description column" (key absent) from
        // "description present but null" (key present, value null) —
        // the live PACS rows have BMDRP/RMDRP with explicit NULL.
        if (desc is not null) dict["szLandSoilDesc"] = desc;
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
                new List<string> { "szLandSoilCode", "szLandSoilDesc" },
                _rows));
    }

    // ── M5: clean Benton-shaped match (DRAG / IRAG / NONE in one batch) ──

    [Fact]
    public async Task Loader_ProposesMappedForCleanLandSoilMatch_M5()
    {
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "DRAG1", "IRAG1", "NONE" });

        // Real Benton-shaped land_soil dictionary entries from
        // C24-B-live inspection.
        var pacs = new StubReader(new[]
        {
            Row("DRAG1", "Dry Agland #1"),
            Row("IRAG1", "Irrigated Agland #1"),
            Row("NONE",  "None"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.M5CleanMatch.Should().Be(3);
        result.M1WorkbookCodeMissingFromDictionary.Should().Be(0);
        result.ProposedRows.Should().HaveCount(3);
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.SourceSchema.Should().Be("dbo");
            r.SourceTable.Should().Be("land_detail",
                "C24-B targets land_detail, not land_soil");
            r.SourceColumn.Should().Be("land_soil_code");
            r.ReviewStatus.Should().Be("Mapped");
            r.Classification.Should().Be(DictionaryRowClassification.CleanMatch);
        });

        var drag1 = result.ProposedRows.Single(r => r.SourceValue == "DRAG1");
        drag1.CanonicalValue.Should().Be("Dry Agland #1",
            "the loader proposes the dictionary description verbatim — operator " +
            "confirms WSDOR / DOR per-acre alignment at C24-C, NOT the loader");
    }

    // ── M1: workbook code missing from land_soil dictionary ────────────

    [Fact]
    public async Task Loader_DefersWhenLandSoilCodeMissingFromDictionary_M1()
    {
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "GHOST" });

        var pacs = new StubReader(new[] { Row("DRAG1", "Dry Agland #1") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.M1WorkbookCodeMissingFromDictionary.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Notes.Should().Contain("missing from PACS land_soil dictionary",
            "the loader names the actual dictionary table in the integrity note");
    }

    // ── NULL-description fallback (BMDRP / RMDRP in real Benton) ───────

    [Fact]
    public async Task Loader_FallsBackToLandSoilVocabulary_WhenDictionaryDescIsNull()
    {
        // Per C24-B-live: BMDRP and RMDRP in Benton have NULL
        // szLandSoilDesc. The loader's M5 path must not fail — it
        // falls back to the "LandSoil:<code>" canonical so the
        // operator can rephrase against the WSDOR table at C24-C.
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "BMDRP" });

        // Dictionary row with NULL szLandSoilDesc (key absent in stub)
        var pacs = new StubReader(new[] { Row("BMDRP", desc: null) });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("LandSoil:BMDRP",
            "C24-B canonical-target vocabulary is LandSoil; the NULL-desc " +
            "fallback uses canonical_target:code so the operator sees the " +
            "code at C24-C review and provides a WSDOR-aligned label");
    }

    // ── No prefix-based logic (C24-A Hard Guard #3) ─────────────────────

    [Fact]
    public async Task Loader_AppliesIdenticalLogicAcrossPrefixGroups()
    {
        // Per C24-A Hard Guard #3: no RCW 84.34 / current-use intent
        // is inferred from code prefix. The loader's classification
        // logic does not branch on SourceValue substrings — DRAG/IRAG/
        // RCIA/WASTE/NONE are all just opaque codes to the loader.
        // This test pins that property: feed one code from each prefix
        // family, dictionary has them all, and verify the loader's M5
        // path treats them identically (same notes pattern, same
        // classification, same canonical-value derivation).
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[]
        {
            "DRAG1",  // dryland-ag prefix
            "IRAG1",  // irrigated-ag prefix
            "DRPA1",  // dry-pasture prefix
            "IRPA1",  // irrigated-pasture prefix
            "RCIA1",  // river-circle-irrigated-ag prefix
            "BASE$",  // dollar-sign suffix (rate base)
            "NONE",   // word
            "WASTE",  // word
            "RHS94",  // year-suffixed homesite
        });

        var pacs = new StubReader(new[]
        {
            Row("DRAG1", "Dry Agland #1"),
            Row("IRAG1", "Irrigated Agland #1"),
            Row("DRPA1", "Dry Pasture #1"),
            Row("IRPA1", "Irrigated Pasture #1"),
            Row("RCIA1", "River Circle Irrigated Agland #1"),
            Row("BASE$", "Base rate per Acre or Hectacre"),
            Row("NONE",  "None"),
            Row("WASTE", "Wasteland"),
            Row("RHS94", "RHS94"),
        });

        var sut = new DictionaryLoaderService(db, pacs);
        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.M5CleanMatch.Should().Be(9,
            "all 9 codes — across DRAG/IRAG/DRPA/IRPA/RCIA/BASE/NONE/WASTE/RHS " +
            "prefixes — must classify identically as M5 clean. No prefix-aware " +
            "branch in the loader.");
        result.ProposedRows.Should().AllSatisfy(r =>
        {
            r.Classification.Should().Be(DictionaryRowClassification.CleanMatch,
                "C24-A Hard Guard #3: classification is uniform across prefix families");
            r.ReviewStatus.Should().Be("Mapped");
            r.Notes.Should().Contain("Dictionary-matched",
                "every M5 row carries the same notes pattern regardless of code shape");
        });

        // Spot-check that BASE$ (special character) and NONE (word) both
        // use the same description-as-canonical-value path
        var basisRow = result.ProposedRows.Single(r => r.SourceValue == "BASE$");
        basisRow.CanonicalValue.Should().Be("Base rate per Acre or Hectacre");
        var noneRow = result.ProposedRows.Single(r => r.SourceValue == "NONE");
        noneRow.CanonicalValue.Should().Be("None");
    }

    // ── M3: duplicate dictionary code ──────────────────────────────────

    [Fact]
    public async Task Loader_DefersOnDuplicateLandSoilCode_M3()
    {
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "DRAG1" });

        // Imagine a year-keyed superseded WSDOR vintage where DRAG1
        // has two dictionary rows. Per C24-A's M3 note language:
        // "Duplicate land_soil codes typically indicate year-keyed
        //  revisions; operator selects the appropriate WSDOR / DOR
        //  vintage during C24-C review."
        var pacs = new StubReader(new[]
        {
            Row("DRAG1", "Dry Agland #1 (current vintage)"),
            Row("DRAG1", "Dry Agland #1 (1994 vintage)"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.M3DuplicateDictionaryCode.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.ReviewStatus.Should().Be("Deferred");
        row.Classification.Should().Be(DictionaryRowClassification.DuplicateDictionaryCode);
        row.Notes.Should().Contain("Cannot unambiguously map");
        row.Notes.Should().Contain("current vintage");
        row.Notes.Should().Contain("1994 vintage");
    }

    // ── M2: dictionary-only codes ignored ───────────────────────────────

    [Fact]
    public async Task Loader_OmitsDictionaryRowsUnobservedInLandWorkbook_M2()
    {
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "DRAG1" });

        // Real Benton dictionary has 58 rows; only 35 appear in the
        // workbook. The 23 unobserved rows must be M2 (NOT in CSV).
        var pacs = new StubReader(new[]
        {
            Row("DRAG1", "Dry Agland #1"),
            Row("BMIA2", "Badger Mountain Irrigated Agland #2"),  // unobserved
            Row("CLAS$", "Soil rates by soil class"),             // unobserved
            Row("FROS",  "Unknown"),                              // unobserved
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.DictionaryRowsRead.Should().Be(4);
        result.M5CleanMatch.Should().Be(1);
        result.M2DictionaryCodeUnobservedInWorkbook.Should().Be(3,
            "M2 counts dictionary rows the workbook never observed");
        result.ProposedRows.Should().HaveCount(1,
            "M2 rows are NOT in the CSV — only observed Deferred codes show up");
    }

    // ── RFC 4180 quoting (descriptions with commas) ─────────────────────

    [Fact]
    public async Task Loader_PreservesLandSoilDescWithSpecialChars()
    {
        // The OSOS dictionary description in real Benton is "Open Space
        // / Open Space"; some descriptions can contain commas, slashes,
        // dollar signs (BASE$ row carries "Base rate per Acre or
        // Hectacre"). The loader passes them through verbatim — the
        // CLI dispatcher's CSV emitter handles RFC 4180 quoting.
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "OSOS" });

        var pacs = new StubReader(new[]
        {
            Row("OSOS", "Open Space, RCW 84.34 / current-use, \"timber-zone\""),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        var row = result.ProposedRows.Single();
        row.CanonicalValue.Should().Be("Open Space, RCW 84.34 / current-use, \"timber-zone\"",
            "service preserves description verbatim; CSV emitter handles quoting");
    }

    // ── Read-only contract on the Land lane ─────────────────────────────

    [Fact]
    public async Task Loader_DoesNotMutateLandWorkbook()
    {
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "DRAG1", "IRAG1", "NONE" });

        var preWorkbookUpdated = fx.Workbook.UpdatedAt;
        var preColumnUpdated = fx.SoilColumn.UpdatedAt;
        var preRowUpdated = fx.DeferredRows.Select(r => r.UpdatedAt).ToList();

        var pacs = new StubReader(new[]
        {
            Row("DRAG1", "Dry Agland #1"),
            Row("IRAG1", "Irrigated Agland #1"),
            Row("NONE",  "None"),
        });
        var sut = new DictionaryLoaderService(db, pacs);

        await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        var wbReloaded = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync();
        var colReloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync();
        var rowsReloaded = await db.SyncMappingCodeValues.AsNoTracking()
            .OrderBy(v => v.SourceValue).ToListAsync();

        wbReloaded.UpdatedAt.Should().Be(preWorkbookUpdated);
        colReloaded.UpdatedAt.Should().Be(preColumnUpdated);
        rowsReloaded.Select(r => r.UpdatedAt).Should().BeEquivalentTo(preRowUpdated);
        rowsReloaded.Should().AllSatisfy(r =>
            r.ReviewStatus.Should().Be("Deferred",
                "C24-B proposes Mapped via CSV; the apply step is C24-C, not the loader"));
    }

    // ── Workbook column-existence guard names the land triple ──────────

    [Fact]
    public async Task Loader_ThrowsWhenWorkbookLacksLandSoilCodeColumn()
    {
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var col = await db.SyncMappingColumns.SingleAsync();
        var values = await db.SyncMappingCodeValues.ToListAsync();
        db.SyncMappingCodeValues.RemoveRange(values);
        db.SyncMappingColumns.Remove(col);
        await db.SaveChangesAsync();

        var pacs = new StubReader(new[] { Row("DRAG1", "Dry Agland #1") });
        var sut = new DictionaryLoaderService(db, pacs);

        Func<Task> act = () => sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*does not contain a column for dbo.land_detail.land_soil_code*");
    }

    // ── C12 trim-on-both-sides interop (char(10) padding) ──────────────

    [Fact]
    public async Task Loader_MatchesPaddedLandSoilSourceValuesAfterTrim()
    {
        // PACS char(10) padding surfaces in the workbook's
        // land_soil_code (e.g. 'DRAG1     '). The loader's dictionary
        // lookup is keyed by trimmed SourceValue so 'DRAG1     '
        // matches dictionary code 'DRAG1'. Stored SourceValue is
        // preserved verbatim per C12 'never rewrite stored values'.
        await using var db = CreateContext($"c24b-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, deferredCodes: new[] { "DRAG1     " });

        var pacs = new StubReader(new[] { Row("DRAG1", "Dry Agland #1") });
        var sut = new DictionaryLoaderService(db, pacs);

        var result = await sut.ProposeReviewCsvAsync(
            fx.County.Id, fx.Workbook.Id, LandSoilTarget(), DefaultLandSoilConfig());

        result.M5CleanMatch.Should().Be(1);
        var row = result.ProposedRows.Single();
        row.SourceValue.Should().Be("DRAG1     ");
    }
}
