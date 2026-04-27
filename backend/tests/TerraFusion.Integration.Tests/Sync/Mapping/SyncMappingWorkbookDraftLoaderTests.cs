using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Slice C3 tests: <see cref="SyncMappingWorkbookDraftLoader"/> turns
/// real <see cref="SyncProfileCodeCandidate"/> rows into draft Mapping
/// Workbook rows. Pattern matches the existing
/// <c>DeepProfileOrchestratorTests</c> — InMemory provider, fresh
/// database name per test for isolation.
/// </summary>
public class SyncMappingWorkbookDraftLoaderTests
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

    private static SyncProfileCodeCandidate Candidate(
        Guid countyId,
        Guid batchId,
        string table,
        string column,
        int distinct,
        int sample,
        decimal ratio,
        string reason = "low_cardinality_string",
        string? candidateCodesJson = null)
        => new()
        {
            CountyId           = countyId,
            SyncBatchId        = batchId,
            SourceSystem       = "PACS",
            SchemaName         = "dbo",
            TableName          = table,
            ColumnName         = column,
            DistinctCount      = distinct,
            SampleSize         = sample,
            DistinctRatio      = ratio,
            Reason             = reason,
            CandidateCodesJson = candidateCodesJson,
        };

    /// <summary>
    /// Realistic candidate-codes JSON shape: a 3-entry top-N like the
    /// reader actually emits. Uses real Benton PACS values from the
    /// B2.7-OLTP run.
    /// </summary>
    private const string PropertyUseCdTopN =
        @"[{""Value"":""11"",""Count"":6074},{""Value"":""18"",""Count"":1411},{""Value"":""83"",""Count"":561}]";

    private const string WacCdTopN =
        @"[{""Value"":""458-61A-203(1)"",""Count"":131},{""Value"":""458-61A-217(1)"",""Count"":59}]";

    // ── Workbook + columns + values ──────────────────────────────────────

    [Fact]
    public async Task CreateDraftAsync_CreatesWorkbook()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m,
            candidateCodesJson: PropertyUseCdTopN));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("Benton OLTP draft"));

        result.WorkbookId.Should().NotBe(Guid.Empty);
        result.ReusedExistingDraft.Should().BeFalse();

        var workbook = await db.SyncMappingWorkbooks.SingleAsync(w => w.Id == result.WorkbookId);
        workbook.CountyId.Should().Be(county.Id);
        workbook.ProfileBatchId.Should().Be(batch.Id);
        workbook.Name.Should().Be("Benton OLTP draft");
        workbook.Status.Should().Be("Draft");
    }

    [Fact]
    public async Task CreateDraftAsync_CreatesColumnsFromCodeCandidates()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "sale", "wac_cd", 55, 9779, 0.0056m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("two-col draft"));

        result.ColumnsCreated.Should().Be(2);

        var columns = await db.SyncMappingColumns
            .Where(c => c.WorkbookId == result.WorkbookId)
            .OrderBy(c => c.SourceTable)
            .ThenBy(c => c.SourceColumn)
            .ToListAsync();

        columns.Should().HaveCount(2);
        columns[0].SourceTable.Should().Be("property_val");
        columns[0].SourceColumn.Should().Be("property_use_cd");
        columns[0].DistinctCount.Should().Be(63);
        columns[0].DistinctRatio.Should().Be(0.0061m);
        columns[0].ReviewStatus.Should().Be("NeedsReview");
        columns[1].SourceTable.Should().Be("sale");
        columns[1].SourceColumn.Should().Be("wac_cd");
    }

    [Fact]
    public async Task CreateDraftAsync_CreatesCodeValuesFromCandidateJson()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m,
            candidateCodesJson: PropertyUseCdTopN));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("draft with values"));

        result.CodeValuesCreated.Should().Be(3);

        var values = await db.SyncMappingCodeValues
            .Where(v => v.CountyId == county.Id)
            .OrderByDescending(v => v.ObservedCount)
            .ToListAsync();

        values.Should().HaveCount(3);
        values[0].SourceValue.Should().Be("11");
        values[0].ObservedCount.Should().Be(6074);
        values[0].ReviewStatus.Should().Be("NeedsReview");
        values[0].IsExcluded.Should().BeFalse();
        values[0].CanonicalValue.Should().BeNull();
        values[1].SourceValue.Should().Be("18");
        values[2].SourceValue.Should().Be("83");
    }

    [Fact]
    public async Task CreateDraftAsync_NullOrInvalidCandidateJson_StillCreatesColumnWithoutValues()
    {
        // Tolerance: a candidate whose top-N JSON is null/empty/invalid
        // still produces a column row — column-level review is useful
        // even when the per-value seeding fails.
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "neighborhood", "nbhd_descr", 95, 27876, 0.0034m,
            candidateCodesJson: null));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m,
            candidateCodesJson: "{ this is not valid JSON ]"));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("tolerant draft"));

        result.ColumnsCreated.Should().Be(2);
        result.CodeValuesCreated.Should().Be(0);
    }

    // ── Lane inference (one Theory keeps the rule table close + readable) ─

    [Theory]
    [InlineData("property_val", "property_use_cd",    "Valuation")]
    [InlineData("PROPERTY_VAL", "Property_Use_Cd",    "Valuation")]    // case-insensitive
    [InlineData("land_detail",  "primary_use_cd",     "Land")]
    [InlineData("land_detail",  "land_soil_code",     "Land")]
    [InlineData("sale",         "wac_cd",             "Sales")]
    [InlineData("sale",         "sl_ratio_type_cd",   "Sales")]
    [InlineData("imprv_detail", "imprv_det_class_cd", "Improvement")]
    [InlineData("imprv",        "imprv_state_cd",     "Improvement")]
    [InlineData("imprv_attr",   "i_attr_val_cd",      "Improvement")]
    [InlineData("neighborhood", "nbhd_descr",         "Neighborhood")]
    [InlineData("property_val", "sup_desc",           "Other")]        // not in priority list
    [InlineData("property",     "state_cd",           "Other")]
    [InlineData("anything_else","random_col",         "Other")]
    public void InferLane_ReturnsCorrectLaneForKnownAndUnknown(string table, string column, string expected)
    {
        SyncMappingWorkbookDraftLoader.InferLane(table, column).Should().Be(expected);
    }

    [Fact]
    public async Task CreateDraftAsync_InfersValuationLaneForPropertyUse()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("v-lane"));

        var col = await db.SyncMappingColumns.SingleAsync(c => c.WorkbookId == result.WorkbookId);
        col.MappingLane.Should().Be("Valuation");
    }

    [Fact]
    public async Task CreateDraftAsync_InfersSalesLaneForWacCd_AndDoesNotAutoExclude()
    {
        // Memory-flagged scenario: WacCd carries exempt-transfer codes
        // that should not feed comps. The loader surfaces them as
        // NeedsReview / IsExcluded=false — the human makes the call,
        // not the loader.
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "sale", "wac_cd", 55, 9779, 0.0056m,
            candidateCodesJson: WacCdTopN));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("s-lane"));

        var col = await db.SyncMappingColumns.SingleAsync(c => c.WorkbookId == result.WorkbookId);
        col.MappingLane.Should().Be("Sales");
        col.ReviewStatus.Should().Be("NeedsReview");

        var values = await db.SyncMappingCodeValues
            .Where(v => v.MappingColumnId == col.Id)
            .ToListAsync();
        values.Should().AllSatisfy(v =>
        {
            v.IsExcluded.Should().BeFalse();
            v.ReviewStatus.Should().Be("NeedsReview");
            v.CanonicalValue.Should().BeNull();
        });
    }

    [Fact]
    public async Task CreateDraftAsync_InfersImprovementLaneForImprvDetailClass()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "imprv_detail", "imprv_det_class_cd", 21, 9338, 0.0022m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("i-lane"));

        var col = await db.SyncMappingColumns.SingleAsync(c => c.WorkbookId == result.WorkbookId);
        col.MappingLane.Should().Be("Improvement");
    }

    [Fact]
    public async Task CreateDraftAsync_InfersLandLaneForSoilCode()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "land_detail", "land_soil_code", 36, 10009, 0.0036m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("l-lane"));

        var col = await db.SyncMappingColumns.SingleAsync(c => c.WorkbookId == result.WorkbookId);
        col.MappingLane.Should().Be("Land");
    }

    [Fact]
    public async Task CreateDraftAsync_InfersNeighborhoodLaneForNbhdDescr()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "neighborhood", "nbhd_descr", 95, 27876, 0.0034m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("n-lane"));

        var col = await db.SyncMappingColumns.SingleAsync(c => c.WorkbookId == result.WorkbookId);
        col.MappingLane.Should().Be("Neighborhood");
    }

    // ── County isolation ─────────────────────────────────────────────────

    [Fact]
    public async Task CreateDraftAsync_IsCountyScoped()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (countyA, _, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, _, batchB) = await SeedScopeAsync(db, "Yakima");

        db.SyncProfileCodeCandidates.Add(Candidate(
            countyA.Id, batchA.Id, "property_val", "property_use_cd", 63, 10000, 0.0063m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            countyB.Id, batchB.Id, "property_val", "property_use_cd", 70, 10000, 0.0070m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);

        var resultA = await loader.CreateDraftAsync(
            countyA.Id, batchA.Id, new SyncMappingWorkbookDraftOptions("A draft"));
        var resultB = await loader.CreateDraftAsync(
            countyB.Id, batchB.Id, new SyncMappingWorkbookDraftOptions("B draft"));

        resultA.ColumnsCreated.Should().Be(1);
        resultB.ColumnsCreated.Should().Be(1);

        var aCol = await db.SyncMappingColumns.SingleAsync(c => c.CountyId == countyA.Id);
        aCol.DistinctCount.Should().Be(63);

        var bCol = await db.SyncMappingColumns.SingleAsync(c => c.CountyId == countyB.Id);
        bCol.DistinctCount.Should().Be(70);
    }

    [Fact]
    public async Task CreateDraftAsync_DoesNotCrossCountyCandidates()
    {
        // Candidate exists in County B, but the loader is asked for
        // County A's batch. The B candidate must not bleed into A's
        // workbook even though both batches happen to share the same
        // batch GUID would be unusual — use distinct batches and a
        // shared county-A workbook to force the filter to do its job.
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (countyA, _, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, _, batchB) = await SeedScopeAsync(db, "Yakima");

        // County A has zero candidates for batchA. County B has one.
        db.SyncProfileCodeCandidates.Add(Candidate(
            countyB.Id, batchB.Id, "property_val", "property_use_cd", 63, 10000, 0.0063m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var resultA = await loader.CreateDraftAsync(
            countyA.Id, batchA.Id, new SyncMappingWorkbookDraftOptions("A empty draft"));

        resultA.ColumnsCreated.Should().Be(0);

        // No County-A column should ever exist, even though County B's
        // candidate was sitting right there in the same database.
        var aColCount = await db.SyncMappingColumns
            .CountAsync(c => c.CountyId == countyA.Id);
        aColCount.Should().Be(0);
    }

    // ── Idempotency ──────────────────────────────────────────────────────

    [Fact]
    public async Task CreateDraftAsync_IsIdempotentWhenDraftExists()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m,
            candidateCodesJson: PropertyUseCdTopN));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var first = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("idempotent"));

        var second = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("idempotent"));

        // Same workbook surface, no duplicate rows.
        second.WorkbookId.Should().Be(first.WorkbookId);
        second.ReusedExistingDraft.Should().BeTrue();
        second.ColumnsCreated.Should().Be(0);
        second.CodeValuesCreated.Should().Be(0);

        var totalCols = await db.SyncMappingColumns.CountAsync(c => c.CountyId == county.Id);
        var totalVals = await db.SyncMappingCodeValues.CountAsync(v => v.CountyId == county.Id);
        totalCols.Should().Be(1);   // not 2
        totalVals.Should().Be(3);   // not 6
    }

    [Fact]
    public async Task CreateDraftAsync_ReplacesExistingDraftOnlyWhenRequested()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m,
            candidateCodesJson: PropertyUseCdTopN));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var first = await loader.CreateDraftAsync(
            county.Id, batch.Id, new SyncMappingWorkbookDraftOptions("replace-me"));

        // Add a second candidate AFTER the first draft so the replace
        // semantic has something different to materialize.
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "sale", "wac_cd", 55, 9779, 0.0056m,
            candidateCodesJson: WacCdTopN));
        await db.SaveChangesAsync();

        var replaced = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("replace-me", ReplaceExistingDraft: true));

        replaced.WorkbookId.Should().Be(first.WorkbookId);  // workbook row preserved
        replaced.ReusedExistingDraft.Should().BeFalse();    // contents rebuilt
        replaced.ColumnsCreated.Should().Be(2);
        replaced.CodeValuesCreated.Should().Be(5);          // 3 + 2 (top-N entries)

        var cols = await db.SyncMappingColumns.CountAsync(c => c.CountyId == county.Id);
        cols.Should().Be(2);  // not 3 — old row replaced, not duplicated

        var vals = await db.SyncMappingCodeValues.CountAsync(v => v.CountyId == county.Id);
        vals.Should().Be(5);  // not 8
    }

    [Fact]
    public async Task CreateDraftAsync_DoesNotModifyNonDraftWorkbook()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Pre-existing workbook with the same name, but Status=Mapped
        // (graduated past Draft). The loader must refuse to touch it
        // even with ReplaceExistingDraft=true.
        var locked = new SyncMappingWorkbook
        {
            CountyId           = county.Id,
            SourceConnectionId = conn.Id,
            ProfileBatchId     = batch.Id,
            Name               = "approved-and-locked",
            Status             = "Mapped",
        };
        db.SyncMappingWorkbooks.Add(locked);
        db.SyncMappingColumns.Add(new SyncMappingColumn
        {
            CountyId      = county.Id,
            WorkbookId    = locked.Id,
            SourceSchema  = "dbo",
            SourceTable   = "property_val",
            SourceColumn  = "property_use_cd",
            MappingLane   = "Valuation",
            ReviewStatus  = "Mapped",
        });
        await db.SaveChangesAsync();

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "sale", "wac_cd", 55, 9779, 0.0056m,
            candidateCodesJson: WacCdTopN));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);

        Func<Task> loadOverLocked = () => loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("approved-and-locked", ReplaceExistingDraft: true));

        await loadOverLocked.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Mapped*");

        // The locked workbook's column was untouched.
        var stillThere = await db.SyncMappingColumns
            .Where(c => c.WorkbookId == locked.Id)
            .ToListAsync();
        stillThere.Should().HaveCount(1);
        stillThere[0].SourceColumn.Should().Be("property_use_cd");
    }

    // ── Options surface ──────────────────────────────────────────────────

    [Fact]
    public async Task CreateDraftAsync_IncludeFilter_LimitsToAllowlist()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd", 63, 10365, 0.0061m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "sale", "wac_cd", 55, 9779, 0.0056m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "land_detail", "land_soil_code", 36, 10009, 0.0036m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var include = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "dbo.property_val.property_use_cd",
            "dbo.land_detail.land_soil_code",
        };

        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("filtered", IncludeQualifiedColumns: include));

        result.ColumnsCreated.Should().Be(2);
        result.CandidatesSkipped.Should().Be(1);  // wac_cd dropped

        var sourceColumns = await db.SyncMappingColumns
            .Where(c => c.CountyId == county.Id)
            .Select(c => c.SourceColumn)
            .ToListAsync();
        sourceColumns.Should().BeEquivalentTo(new[] { "property_use_cd", "land_soil_code" });
    }

    [Fact]
    public async Task CreateDraftAsync_MaxCandidates_TruncatesAfterDeterministicOrder()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var (county, _, batch) = await SeedScopeAsync(db);

        // Insert 4 candidates; cap at 2. Deterministic sort is
        // (schema, table, column) → with all schema=dbo, the alphabetical
        // table/column order picks "imprv.imprv_state_cd" + "imprv_detail.imprv_det_class_cd".
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "sale",         "wac_cd",             55, 9779,  0.0056m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "imprv",        "imprv_state_cd",     94, 10331, 0.0091m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "imprv_detail", "imprv_det_class_cd", 21, 9338,  0.0022m));
        db.SyncProfileCodeCandidates.Add(Candidate(
            county.Id, batch.Id, "property_val", "property_use_cd",    63, 10365, 0.0061m));
        await db.SaveChangesAsync();

        var loader = new SyncMappingWorkbookDraftLoader(db);
        var result = await loader.CreateDraftAsync(
            county.Id, batch.Id,
            new SyncMappingWorkbookDraftOptions("capped", MaxCandidates: 2));

        result.ColumnsCreated.Should().Be(2);
        result.CandidatesSkipped.Should().Be(2);

        var taken = await db.SyncMappingColumns
            .Where(c => c.CountyId == county.Id)
            .OrderBy(c => c.SourceTable)
            .ThenBy(c => c.SourceColumn)
            .Select(c => c.SourceTable + "." + c.SourceColumn)
            .ToListAsync();
        taken.Should().Equal(new[]
        {
            "imprv.imprv_state_cd",
            "imprv_detail.imprv_det_class_cd",
        });
    }

    // ── Argument validation ──────────────────────────────────────────────

    [Fact]
    public async Task CreateDraftAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var loader = new SyncMappingWorkbookDraftLoader(db);

        Func<Task> act = () => loader.CreateDraftAsync(
            Guid.Empty, Guid.NewGuid(),
            new SyncMappingWorkbookDraftOptions("nope"));

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task CreateDraftAsync_RejectsEmptyProfileBatchId()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var loader = new SyncMappingWorkbookDraftLoader(db);

        Func<Task> act = () => loader.CreateDraftAsync(
            Guid.NewGuid(), Guid.Empty,
            new SyncMappingWorkbookDraftOptions("nope"));

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*ProfileBatchId*");
    }

    [Fact]
    public async Task CreateDraftAsync_RejectsBlankWorkbookName()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var loader = new SyncMappingWorkbookDraftLoader(db);

        Func<Task> act = () => loader.CreateDraftAsync(
            Guid.NewGuid(), Guid.NewGuid(),
            new SyncMappingWorkbookDraftOptions("   "));

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookName*");
    }

    [Fact]
    public async Task CreateDraftAsync_RejectsNonPositiveMaxCandidates()
    {
        await using var db = CreateContext($"draft-{Guid.NewGuid()}");
        var loader = new SyncMappingWorkbookDraftLoader(db);

        Func<Task> act = () => loader.CreateDraftAsync(
            Guid.NewGuid(), Guid.NewGuid(),
            new SyncMappingWorkbookDraftOptions("nope", MaxCandidates: 0));

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*MaxCandidates*");
    }
}
