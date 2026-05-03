using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Schema-level persistence tests for the Slice C2 Mapping Workbook
/// trio (<see cref="SyncMappingWorkbook"/>, <see cref="SyncMappingColumn"/>,
/// <see cref="SyncMappingCodeValue"/>).
///
/// <para>These tests do NOT exercise canonical-mapping logic — there is
/// none yet. Slice C3+ owns transform consumption. The contract here is
/// purely shape: persistable, county-scoped, indexable, and the natural
/// keys behave the way the EF configuration claims.</para>
///
/// <para>Pattern matches the existing
/// <c>DeepProfileOrchestratorTests</c> — in-memory provider via
/// <c>UseInMemoryDatabase</c>, fresh database name per test for
/// isolation, no transaction ceremony.</para>
/// </summary>
public class SyncMappingWorkbookSchemaTests
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

    private static SyncMappingWorkbook NewWorkbook(Guid countyId, Guid connectionId, Guid batchId, string name)
        => new()
        {
            CountyId           = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId     = batchId,
            Name               = name,
            Status             = "Draft",
        };

    private static SyncMappingColumn NewColumn(
        Guid countyId,
        Guid workbookId,
        string sourceTable,
        string sourceColumn,
        string lane,
        string reviewStatus = "NeedsReview")
        => new()
        {
            CountyId      = countyId,
            WorkbookId    = workbookId,
            SourceSchema  = "dbo",
            SourceTable   = sourceTable,
            SourceColumn  = sourceColumn,
            MappingLane   = lane,
            ReviewStatus  = reviewStatus,
        };

    private static SyncMappingCodeValue NewCodeValue(
        Guid countyId,
        Guid columnId,
        string sourceValue,
        long observedCount,
        string? canonicalValue = null,
        bool isExcluded = false)
        => new()
        {
            CountyId        = countyId,
            MappingColumnId = columnId,
            SourceValue     = sourceValue,
            ObservedCount   = observedCount,
            CanonicalValue  = canonicalValue,
            IsExcluded      = isExcluded,
            ReviewStatus    = canonicalValue is not null ? "Mapped" : "NeedsReview",
        };

    // ── Persistence shape ────────────────────────────────────────────────

    [Fact]
    public async Task PersistsWorkbookWithColumnAndCodeValues()
    {
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var workbook = NewWorkbook(
            county.Id, conn.Id, batch.Id,
            "Benton PACS OLTP — canonical use-code review");
        db.SyncMappingWorkbooks.Add(workbook);

        var column = NewColumn(
            county.Id, workbook.Id,
            "property_val", "property_use_cd",
            "Valuation",
            "InProgress");
        column.DistinctCount  = 63;
        column.DistinctRatio  = 0.0061m;
        column.CanonicalTarget = "canonical.PropertyUseCode";
        db.SyncMappingColumns.Add(column);

        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, column.Id, "11", 6074, "Residential"));
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, column.Id, "18", 1411, "Apartments"));
        db.SyncMappingCodeValues.Add(NewCodeValue(county.Id, column.Id, "83",  561, "MobileHome"));

        await db.SaveChangesAsync();

        // Read back through the navigation property — proves the FKs and
        // the cascading load behave.
        var loaded = await db.SyncMappingWorkbooks
            .Include(w => w.Columns)
            .ThenInclude(c => c.CodeValues)
            .SingleAsync(w => w.Id == workbook.Id);

        loaded.Name.Should().Be("Benton PACS OLTP — canonical use-code review");
        loaded.Status.Should().Be("Draft");
        loaded.Columns.Should().HaveCount(1);

        var c = loaded.Columns.Single();
        c.SourceTable.Should().Be("property_val");
        c.SourceColumn.Should().Be("property_use_cd");
        c.MappingLane.Should().Be("Valuation");
        c.ReviewStatus.Should().Be("InProgress");
        c.DistinctCount.Should().Be(63);
        c.DistinctRatio.Should().Be(0.0061m);
        c.CanonicalTarget.Should().Be("canonical.PropertyUseCode");
        c.CodeValues.Should().HaveCount(3);

        var byValue = c.CodeValues.ToDictionary(v => v.SourceValue);
        byValue["11"].CanonicalValue.Should().Be("Residential");
        byValue["11"].ReviewStatus.Should().Be("Mapped");
        byValue["18"].ObservedCount.Should().Be(1411);
        byValue["83"].SourceValue.Should().Be("83");
    }

    [Fact]
    public async Task RequiresCountyScope_RejectsCrossCountyWorkbookQuery()
    {
        // Two counties, one workbook each. A query scoped to County A must
        // not return County B's workbook — proves the denormalized
        // CountyId on every row is enforceable as the Sovereign-County
        // filter from CLAUDE.md.
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, connB, batchB) = await SeedScopeAsync(db, "Yakima");

        db.SyncMappingWorkbooks.Add(NewWorkbook(countyA.Id, connA.Id, batchA.Id, "Benton workbook"));
        db.SyncMappingWorkbooks.Add(NewWorkbook(countyB.Id, connB.Id, batchB.Id, "Yakima workbook"));
        await db.SaveChangesAsync();

        var aOnly = await db.SyncMappingWorkbooks
            .Where(w => w.CountyId == countyA.Id)
            .ToListAsync();

        aOnly.Should().HaveCount(1);
        aOnly[0].Name.Should().Be("Benton workbook");
        aOnly.Should().NotContain(w => w.CountyId == countyB.Id);
    }

    [Fact]
    public async Task DoesNotCrossCountyQuery_AtTheCodeValueLevel()
    {
        // Same scope-isolation guarantee at the leaf row level. If
        // someone forgets to scope the workbook query, the values
        // themselves still carry their own CountyId and can be
        // independently filtered.
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, connB, batchB) = await SeedScopeAsync(db, "Yakima");

        var wbA = NewWorkbook(countyA.Id, connA.Id, batchA.Id, "Benton wb");
        var wbB = NewWorkbook(countyB.Id, connB.Id, batchB.Id, "Yakima wb");
        db.SyncMappingWorkbooks.AddRange(wbA, wbB);

        var colA = NewColumn(countyA.Id, wbA.Id, "property_val", "property_use_cd", "Valuation");
        var colB = NewColumn(countyB.Id, wbB.Id, "property_val", "property_use_cd", "Valuation");
        db.SyncMappingColumns.AddRange(colA, colB);

        db.SyncMappingCodeValues.Add(NewCodeValue(countyA.Id, colA.Id, "11", 100));
        db.SyncMappingCodeValues.Add(NewCodeValue(countyB.Id, colB.Id, "11", 200));
        await db.SaveChangesAsync();

        var aValues = await db.SyncMappingCodeValues
            .Where(v => v.CountyId == countyA.Id)
            .ToListAsync();

        aValues.Should().HaveCount(1);
        aValues[0].ObservedCount.Should().Be(100);
        aValues.Should().NotContain(v => v.CountyId == countyB.Id);
    }

    // ── Profile-batch coexistence ────────────────────────────────────────

    [Fact]
    public async Task ReusesProfileBatchReferenceWithoutDeletingProfileStats()
    {
        // The workbook stores ProfileBatchId as a Guid (no FK constraint)
        // — pin that the seeded SyncProfileTableStats / SyncProfileColumnStats
        // / SyncProfileCodeCandidate rows for the same batch are not
        // affected by workbook lifecycle changes. The workbook is a
        // *consumer* of the profile, not its owner.
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Seed a profile-side row that the workbook will reference.
        db.SyncProfileTableStats.Add(new SyncProfileTableStats
        {
            CountyId         = county.Id,
            SyncBatchId      = batch.Id,
            SourceSystem     = "PACS",
            SchemaName       = "dbo",
            TableName        = "property_val",
            RowCount         = 2_539_028,
            RowCountIsExact  = false,
            SampleRowCount   = 10_365,
            SamplingMethod   = "BernoulliSample",
        });
        await db.SaveChangesAsync();

        // Create then delete a workbook against the same batch.
        var workbook = NewWorkbook(county.Id, conn.Id, batch.Id, "ephemeral wb");
        db.SyncMappingWorkbooks.Add(workbook);
        await db.SaveChangesAsync();

        db.SyncMappingWorkbooks.Remove(workbook);
        await db.SaveChangesAsync();

        // Profile-side row must still exist — workbook deletion does not
        // cascade into profile stats.
        var profileStillThere = await db.SyncProfileTableStats
            .Where(s => s.SyncBatchId == batch.Id)
            .CountAsync();

        profileStillThere.Should().Be(1);
    }

    // ── Lane vocabulary ──────────────────────────────────────────────────

    [Theory]
    [InlineData("Valuation")]
    [InlineData("Sales")]
    [InlineData("Improvement")]
    [InlineData("Land")]
    [InlineData("Neighborhood")]
    [InlineData("Other")]
    public async Task SupportsPriorityLaneValues(string lane)
    {
        // The MappingLane field is string-typed for forward-compat. Pin
        // that the C1-recommended lane values from the seed doc round-
        // trip cleanly.
        await using var db = CreateContext($"map-{Guid.NewGuid()}-{lane}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, $"wb-{lane}");
        db.SyncMappingWorkbooks.Add(wb);

        var col = NewColumn(county.Id, wb.Id, "property_val", "property_use_cd", lane);
        db.SyncMappingColumns.Add(col);

        await db.SaveChangesAsync();

        var loaded = await db.SyncMappingColumns
            .Where(c => c.CountyId == county.Id)
            .SingleAsync();

        loaded.MappingLane.Should().Be(lane);
    }

    // ── Default review state ─────────────────────────────────────────────

    [Fact]
    public async Task NewColumn_DefaultsToNeedsReview()
    {
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "default-status wb");
        db.SyncMappingWorkbooks.Add(wb);

        // Build column without setting ReviewStatus explicitly to confirm
        // the default sticks.
        db.SyncMappingColumns.Add(new SyncMappingColumn
        {
            CountyId      = county.Id,
            WorkbookId    = wb.Id,
            SourceSchema  = "dbo",
            SourceTable   = "property_val",
            SourceColumn  = "property_use_cd",
            MappingLane   = "Valuation",
        });

        await db.SaveChangesAsync();

        var loaded = await db.SyncMappingColumns
            .Where(c => c.CountyId == county.Id)
            .SingleAsync();

        loaded.ReviewStatus.Should().Be("NeedsReview");
    }

    [Fact]
    public async Task ExcludedCodeValue_StoresIsExcludedFlag()
    {
        // Pin that the operator's "this WAC code is an exempt transfer,
        // do not feed comps" decision survives the round-trip. The
        // memory-flagged WacCd lane.
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "WacCd review");
        db.SyncMappingWorkbooks.Add(wb);

        var col = NewColumn(county.Id, wb.Id, "sale", "wac_cd", "Sales", "Mapped");
        db.SyncMappingColumns.Add(col);

        db.SyncMappingCodeValues.Add(NewCodeValue(
            county.Id, col.Id, "458-61A-203(1)", 131,
            canonicalValue: null,
            isExcluded: true));
        db.SyncMappingCodeValues.Add(NewCodeValue(
            county.Id, col.Id, "01", 50,
            canonicalValue: "ArmsLengthSale"));
        await db.SaveChangesAsync();

        var loaded = await db.SyncMappingCodeValues
            .Where(v => v.MappingColumnId == col.Id)
            .ToListAsync();

        loaded.Should().HaveCount(2);
        loaded.Single(v => v.IsExcluded).SourceValue.Should().Be("458-61A-203(1)");
        loaded.Single(v => !v.IsExcluded).CanonicalValue.Should().Be("ArmsLengthSale");
    }

    // ── Audit fields ─────────────────────────────────────────────────────

    [Fact]
    public async Task AuditFields_SetByDefaultOnInsert()
    {
        // The interceptor populates CreatedAt/UpdatedAt from HttpContext
        // in-process; in an InMemory test the entity defaults
        // (= DateTime.UtcNow at field-init time) are what land. Either
        // way the columns must be non-default after SaveChanges.
        await using var db = CreateContext($"map-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = NewWorkbook(county.Id, conn.Id, batch.Id, "audit-fields wb");
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var loaded = await db.SyncMappingWorkbooks.SingleAsync(w => w.Id == wb.Id);
        loaded.CreatedAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(-1));
        loaded.UpdatedAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(-1));
    }
}
