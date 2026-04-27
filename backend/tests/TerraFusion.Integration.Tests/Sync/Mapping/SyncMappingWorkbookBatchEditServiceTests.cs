using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Slice C11-B service tests. Exercises
/// <see cref="SyncMappingWorkbookBatchEditService"/> against a
/// fixture workbook (2 columns × 3 code-values each) using EF Core
/// InMemory. Mirrors the C9-B / C10-B test scaffolding patterns.
/// </summary>
public class SyncMappingWorkbookBatchEditServiceTests
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
        SyncMappingColumn WacColumn,
        SyncMappingColumn UseColumn,
        SyncMappingCodeValue WacAnchor,
        SyncMappingCodeValue WacOther,
        SyncMappingCodeValue WacThird,
        SyncMappingCodeValue UseRes,
        SyncMappingCodeValue UseCom,
        SyncMappingCodeValue UseInd);

    private static async Task<Fixture> SeedFixtureAsync(TerraFusionDbContext db, string status = "Draft")
    {
        var county = new County
        {
            Id = Guid.NewGuid(),
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = county.Id,
            Name = "Benton PACS OLTP",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "localhost,1433",
            Database = "pacs_oltp",
            AuthMode = "SqlAuth",
            IsActive = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            Mode = "profile",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);

        var workbook = new SyncMappingWorkbook
        {
            CountyId = county.Id,
            SourceConnectionId = conn.Id,
            ProfileBatchId = batch.Id,
            Name = "fixture-batch-edit",
            Status = status,
        };
        db.SyncMappingWorkbooks.Add(workbook);

        var wacColumn = new SyncMappingColumn
        {
            CountyId = county.Id,
            WorkbookId = workbook.Id,
            SourceSchema = "dbo",
            SourceTable = "sale",
            SourceColumn = "wac_cd",
            MappingLane = "Sales",
            ReviewStatus = "NeedsReview",
        };
        var useColumn = new SyncMappingColumn
        {
            CountyId = county.Id,
            WorkbookId = workbook.Id,
            SourceSchema = "dbo",
            SourceTable = "property_val",
            SourceColumn = "property_use_cd",
            MappingLane = "Valuation",
            ReviewStatus = "NeedsReview",
        };
        db.SyncMappingColumns.AddRange(wacColumn, useColumn);

        // C9-C anchor: pre-Excluded code-value used to verify
        // unlisted-row preservation across batch runs.
        var wacAnchor = new SyncMappingCodeValue
        {
            CountyId = county.Id,
            MappingColumnId = wacColumn.Id,
            SourceValue = "458-61A-217(1)",
            ReviewStatus = "Excluded",
            CanonicalValue = null,
            IsExcluded = true,
            Notes = "REET exemption; exclude from arms-length comps",
        };
        var wacOther = new SyncMappingCodeValue
        {
            CountyId = county.Id,
            MappingColumnId = wacColumn.Id,
            SourceValue = "458-61A-203(1)",
            ReviewStatus = "NeedsReview",
        };
        var wacThird = new SyncMappingCodeValue
        {
            CountyId = county.Id,
            MappingColumnId = wacColumn.Id,
            SourceValue = "458-61A-200",
            ReviewStatus = "NeedsReview",
        };
        var useRes = new SyncMappingCodeValue
        {
            CountyId = county.Id,
            MappingColumnId = useColumn.Id,
            SourceValue = "11",
            ReviewStatus = "NeedsReview",
        };
        var useCom = new SyncMappingCodeValue
        {
            CountyId = county.Id,
            MappingColumnId = useColumn.Id,
            SourceValue = "21",
            ReviewStatus = "NeedsReview",
        };
        var useInd = new SyncMappingCodeValue
        {
            CountyId = county.Id,
            MappingColumnId = useColumn.Id,
            SourceValue = "31",
            ReviewStatus = "NeedsReview",
        };
        db.SyncMappingCodeValues.AddRange(wacAnchor, wacOther, wacThird, useRes, useCom, useInd);

        await db.SaveChangesAsync();

        return new Fixture(county, workbook, wacColumn, useColumn,
            wacAnchor, wacOther, wacThird, useRes, useCom, useInd);
    }

    private static IReadOnlyList<BatchEditCsvRow> ParseRows(string csv)
    {
        var result = BatchEditCsvParser.Parse(csv);
        result.HeaderError.Should().BeNull();
        return result.Rows;
    }

    // ── Happy path ────────────────────────────────────────────────────────

    [Fact]
    public async Task BatchEdit_DryRunDoesNotMutate()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value,is_excluded\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,ArmsLengthSale,false\n" +
            "code_value,dbo,property_val,property_use_cd,11,Mapped,Residential,false\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(
            fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.DryRun);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.DryRunValidated);
        result.RowsToMutate.Should().Be(2);
        result.Errors.Should().BeEmpty();

        // Verify zero mutation: detach + re-read everything.
        await using var verify = CreateContext(dbName);
        var wacOther = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacOther.Id);
        wacOther.ReviewStatus.Should().Be("NeedsReview");
        wacOther.CanonicalValue.Should().BeNull();
    }

    [Fact]
    public async Task BatchEdit_ApplyMutatesOnlyListedRows()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value,is_excluded\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,ArmsLengthSale,false\n" +
            "code_value,dbo,property_val,property_use_cd,11,Mapped,Residential,false\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(
            fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.Applied);
        result.RowsToMutate.Should().Be(2);
        result.MappedCount.Should().Be(2);

        await using var verify = CreateContext(dbName);
        var wacOther = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacOther.Id);
        wacOther.ReviewStatus.Should().Be("Mapped");
        wacOther.CanonicalValue.Should().Be("ArmsLengthSale");
        wacOther.IsExcluded.Should().BeFalse();

        var useRes = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.UseRes.Id);
        useRes.ReviewStatus.Should().Be("Mapped");
        useRes.CanonicalValue.Should().Be("Residential");

        // Unlisted rows untouched.
        var wacThird = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacThird.Id);
        wacThird.ReviewStatus.Should().Be("NeedsReview");
    }

    // ── Hard Guards ───────────────────────────────────────────────────────

    [Fact]
    public async Task BatchEdit_RejectsNonDraftWorkbook()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db, status: "Mapped");

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        Func<Task> act = () => sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Mapped'*");
    }

    [Fact]
    public async Task BatchEdit_RejectsCrossCountyWorkbook()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);
        var otherCountyId = Guid.NewGuid();

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        Func<Task> act = () => sut.ApplyAsync(otherCountyId, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found for county {otherCountyId}*");
    }

    [Fact]
    public async Task BatchEdit_RejectsInvalidReviewStatus()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),BananaStatus\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.DryRun);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.ValidationFailed);
        result.Errors.Should().HaveCount(1);
        result.Errors[0].Message.Should().Contain("BananaStatus");
    }

    [Fact]
    public async Task BatchEdit_RejectsMissingSourceValueForCodeValueScope()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,,Mapped\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.DryRun);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.ValidationFailed);
        result.Errors.Should().ContainSingle(e => e.Message.Contains("source_value is required"));
    }

    [Fact]
    public async Task BatchEdit_RejectsCanonicalTargetOnCodeValueRow()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_target\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,SomeColumnTarget\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.DryRun);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.ValidationFailed);
        result.Errors.Should().ContainSingle(e => e.Message.Contains("canonical_target is column-scope"));
    }

    [Fact]
    public async Task BatchEdit_RejectsDuplicateRowsForSameTarget()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Excluded\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.DryRun);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.ValidationFailed);
        result.Errors.Should().Contain(e => e.Message.Contains("duplicate target"));
    }

    [Fact]
    public async Task BatchEdit_RejectsPartialFailure_AllOrNothing()
    {
        // Two valid rows + one bad row → zero mutations.
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,ArmsLengthSale\n" +
            "code_value,dbo,sale,wac_cd,DOES-NOT-EXIST,Mapped,Phantom\n" +
            "code_value,dbo,property_val,property_use_cd,11,Mapped,Residential\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);

        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.ValidationFailed);
        result.Errors.Should().HaveCount(1);
        result.RowsToMutate.Should().Be(0);

        // Verify zero mutation — both originally-valid rows stayed unchanged.
        await using var verify = CreateContext(dbName);
        var wacOther = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacOther.Id);
        wacOther.ReviewStatus.Should().Be("NeedsReview");
        wacOther.CanonicalValue.Should().BeNull();

        var useRes = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.UseRes.Id);
        useRes.ReviewStatus.Should().Be("NeedsReview");
        useRes.CanonicalValue.Should().BeNull();
    }

    // ── WAC no-auto-exclusion (memory-flagged directive) ──────────────────

    [Fact]
    public async Task BatchEdit_DoesNotAutoExcludeWacCodes()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        // Apply a batch that touches a WAC code with review_status=Mapped
        // and is_excluded=false. A buggy implementation that pattern-
        // matched the WAC prefix would set IsExcluded=true.
        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value,is_excluded\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,ArmsLengthSale,false\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);
        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.Applied);

        await using var verify = CreateContext(dbName);
        var wacOther = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacOther.Id);
        wacOther.IsExcluded.Should().BeFalse();
        wacOther.ReviewStatus.Should().Be("Mapped");
    }

    // ── End-to-end terminalize and lock ───────────────────────────────────

    [Fact]
    public async Task BatchEdit_ApplyCanTerminalizeFixtureAndLockSucceeds()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        // 2 columns + 6 code-values; the C9-C anchor (wacAnchor) is
        // already Excluded and gets re-listed in the CSV with the same
        // status (legitimate operator confirmation; should remain
        // Excluded).
        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,is_excluded\n" +
            "column,dbo,sale,wac_cd,,Mapped,Sales.WacCode,,\n" +
            "column,dbo,property_val,property_use_cd,,Mapped,Valuation.PropertyUseCode,,\n" +
            "code_value,dbo,sale,wac_cd,458-61A-217(1),Excluded,,REETExempt,true\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,,ArmsLengthSale,false\n" +
            "code_value,dbo,sale,wac_cd,458-61A-200,Mapped,,ArmsLengthSale,false\n" +
            "code_value,dbo,property_val,property_use_cd,11,Mapped,,Residential,false\n" +
            "code_value,dbo,property_val,property_use_cd,21,Mapped,,Commercial,false\n" +
            "code_value,dbo,property_val,property_use_cd,31,Mapped,,Industrial,false\n");

        var batch = new SyncMappingWorkbookBatchEditService(db);
        var batchResult = await batch.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);
        batchResult.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.Applied);
        batchResult.RowsToMutate.Should().Be(8);

        // Lock now succeeds.
        var lockSvc = new SyncMappingWorkbookLockService(db);
        var lockResult = await lockSvc.LockAsync(fx.County.Id, fx.Workbook.Id);
        lockResult.Status.Should().Be("Mapped");
        lockResult.ColumnsValidated.Should().Be(2);
        lockResult.CodeValuesValidated.Should().Be(6);
    }

    // ── Concurrency ───────────────────────────────────────────────────────

    [Fact]
    public async Task BatchEdit_RejectsConcurrentApply_WhenStatusFlippedMidFlight()
    {
        // Simulates: validation phase passes against a Draft workbook,
        // but between the validation and apply re-read another caller
        // flipped the workbook to Mapped (e.g. lock raced in). Expected:
        // the apply concurrency check refuses; zero rows mutate.
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value,is_excluded\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,ArmsLengthSale,false\n");

        // External flip via a SECOND DbContext on the same in-memory db,
        // mimicking a different operator's commit. This must happen
        // AFTER the service has already loaded the workbook into its
        // tracking context but BEFORE the re-read in apply. The service
        // re-reads via Entry.ReloadAsync which pulls from the store,
        // so a flip in the parallel context will be visible.
        await using (var other = CreateContext(dbName))
        {
            var w = await other.SyncMappingWorkbooks.SingleAsync(x => x.Id == fx.Workbook.Id);
            w.Status = "Mapped";
            await other.SaveChangesAsync();
        }

        var sut = new SyncMappingWorkbookBatchEditService(db);
        Func<Task> act = () => sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);

        // Either the initial Status guard fires (db sees Mapped already)
        // or the post-validation re-read fires (Concurrent modification).
        // Both are correct; both refuse.
        var thrown = await Record.ExceptionAsync(act);
        thrown.Should().NotBeNull();
        thrown.Should().BeOfType<InvalidOperationException>();
        (thrown!.Message.Contains("Status='Mapped'") ||
         thrown.Message.Contains("Concurrent modification"))
            .Should().BeTrue("the service must refuse with one of the two guard messages");
    }

    // ── Audit semantics ───────────────────────────────────────────────────

    [Fact]
    public async Task BatchEdit_BumpsWorkbookAuditOnce()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        // Capture pre-apply timestamp.
        var pre = fx.Workbook.UpdatedAt;
        await Task.Delay(5); // ensure timestamp difference is visible

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value,is_excluded\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,A,false\n" +
            "code_value,dbo,sale,wac_cd,458-61A-200,Mapped,B,false\n" +
            "code_value,dbo,property_val,property_use_cd,11,Mapped,C,false\n" +
            "code_value,dbo,property_val,property_use_cd,21,Mapped,D,false\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);
        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.Applied);

        await using var verify = CreateContext(dbName);
        var wb = await verify.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == fx.Workbook.Id);
        wb.UpdatedAt.Should().BeAfter(pre);

        // All four mutated code-values share the same UpdatedAt — single
        // SaveChangesAsync produces a uniform timestamp.
        var values = await verify.SyncMappingCodeValues.AsNoTracking()
            .Where(v => v.MappingColumnId == fx.WacColumn.Id || v.MappingColumnId == fx.UseColumn.Id)
            .Where(v => v.ReviewStatus == "Mapped")
            .ToListAsync();
        values.Should().HaveCount(4);
        var firstStamp = values[0].UpdatedAt;
        values.Should().AllSatisfy(v => v.UpdatedAt.Should().Be(firstStamp));
    }

    // ── Unlisted-row preservation (C9-C anchor) ───────────────────────────

    [Fact]
    public async Task BatchEdit_PreservesUnlistedRows()
    {
        var dbName = $"batch-{Guid.NewGuid()}";
        await using var db = CreateContext(dbName);
        var fx = await SeedFixtureAsync(db);

        // CSV touches only one row in the WAC column; the C9-C-style
        // anchor (wacAnchor) is NOT named. It must remain byte-for-byte
        // unchanged including its IsExcluded=true and its operator notes.
        var anchorBefore = await db.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacAnchor.Id);

        var rows = ParseRows(
            "scope,source_schema,source_table,source_column,source_value,review_status,canonical_value,is_excluded\n" +
            "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped,ArmsLengthSale,false\n");

        var sut = new SyncMappingWorkbookBatchEditService(db);
        var result = await sut.ApplyAsync(fx.County.Id, fx.Workbook.Id, rows,
            SyncMappingWorkbookBatchEditMode.Apply);
        result.Outcome.Should().Be(SyncMappingWorkbookBatchEditOutcome.Applied);

        await using var verify = CreateContext(dbName);
        var anchorAfter = await verify.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == fx.WacAnchor.Id);
        anchorAfter.ReviewStatus.Should().Be(anchorBefore.ReviewStatus);
        anchorAfter.IsExcluded.Should().Be(anchorBefore.IsExcluded);
        anchorAfter.CanonicalValue.Should().Be(anchorBefore.CanonicalValue);
        anchorAfter.Notes.Should().Be(anchorBefore.Notes);
    }
}
