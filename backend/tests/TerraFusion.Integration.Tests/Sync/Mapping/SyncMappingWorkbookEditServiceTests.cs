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
/// Slice C9-B tests: <see cref="SyncMappingWorkbookEditService"/>
/// edits one column or code-value row per invocation while the
/// workbook is <c>Status='Draft'</c>. Pattern matches the C2/C3/C5/C6/
/// C7 tests — InMemory provider, fresh database name per test,
/// synthetic Draft workbooks.
/// </summary>
public class SyncMappingWorkbookEditServiceTests
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
            Id = Guid.NewGuid(), Name = countyName, State = "WA",
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
            CountyId = county.Id, SourceSystem = "PACS",
            Mode = "profile", Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);

        await db.SaveChangesAsync();
        return (county, conn, batch);
    }

    /// <summary>
    /// Seeds a Draft workbook with two columns and a small per-column
    /// code-value vocabulary so each test can edit one row and verify
    /// siblings are untouched.
    /// </summary>
    private static async Task<(SyncMappingWorkbook wb, SyncMappingColumn wacCol, SyncMappingColumn ratioCol)>
        SeedDraftWorkbookAsync(TerraFusionDbContext db, Guid countyId, Guid connId, Guid batchId,
            string status = "Draft", string name = "wb")
    {
        var wb = new SyncMappingWorkbook
        {
            CountyId = countyId, SourceConnectionId = connId, ProfileBatchId = batchId,
            Name = name, Status = status,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
        db.SyncMappingWorkbooks.Add(wb);

        var wac = new SyncMappingColumn
        {
            CountyId = countyId, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "sale", SourceColumn = "wac_cd",
            MappingLane = "Sales",
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
        var ratio = new SyncMappingColumn
        {
            CountyId = countyId, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "sale", SourceColumn = "sl_ratio_type_cd",
            MappingLane = "Sales",
            ReviewStatus = "NeedsReview",
            CanonicalTarget = null,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
        db.SyncMappingColumns.AddRange(wac, ratio);

        // Seed wac_cd vocab.
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = wac.Id,
            SourceValue = "458-61A-203(1)", ReviewStatus = "NeedsReview",
            CanonicalValue = null, IsExcluded = false, ObservedCount = 131,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = wac.Id,
            SourceValue = "458-61A-217(1)", ReviewStatus = "NeedsReview",
            CanonicalValue = null, IsExcluded = false, ObservedCount = 59,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });
        // Seed ratio vocab.
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = ratio.Id,
            SourceValue = "00", ReviewStatus = "NeedsReview",
            CanonicalValue = null, IsExcluded = false, ObservedCount = 2464,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });

        await db.SaveChangesAsync();
        return (wb, wac, ratio);
    }

    private static SyncMappingWorkbookEditRequest WacRequest(
        string? sourceValue = null,
        string? canonicalTarget = null,
        string? canonicalValue = null,
        bool   canonicalValueNull = false,
        string? reviewStatus = null,
        bool?  isExcluded = null,
        string? notes = null)
        => new(
            SourceSchema:       "dbo",
            SourceTable:        "sale",
            SourceColumn:       "wac_cd",
            SourceValue:        sourceValue,
            CanonicalTarget:    canonicalTarget,
            CanonicalValue:     canonicalValue,
            CanonicalValueNull: canonicalValueNull,
            ReviewStatus:       reviewStatus,
            IsExcluded:         isExcluded,
            Notes:              notes);

    // ── Status guard ────────────────────────────────────────────────────

    [Theory]
    [InlineData("Mapped")]
    [InlineData("Approved")]
    [InlineData("Archived")]
    [InlineData("Locked")]
    public async Task Edit_RejectsNonDraftWorkbook(string status)
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id, status: status);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)", reviewStatus: "Mapped"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*Status='{status}'*Status='Draft'*");
    }

    // ── County isolation ────────────────────────────────────────────────

    [Fact]
    public async Task Edit_RejectsCrossCountyWorkbook()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, _,    _)       = await SeedScopeAsync(db, "Yakima");
        var (wbA, _, _) = await SeedDraftWorkbookAsync(db, countyA.Id, connA.Id, batchA.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(countyB.Id, wbA.Id,
            WacRequest(sourceValue: "458-61A-203(1)", reviewStatus: "Mapped"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found for county {countyB.Id}*");
    }

    // ── Column-scope mutations ──────────────────────────────────────────

    [Fact]
    public async Task Edit_UpdatesColumnCanonicalTarget()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(canonicalTarget: "canonical.SaleQualification"));

        result.Scope.Should().Be("column");
        result.EditedRowId.Should().Be(wac.Id);
        result.Changed.Should().BeTrue();
        result.Before["canonical_target"].Should().BeNull();
        result.After["canonical_target"].Should().Be("canonical.SaleQualification");

        var reloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync(c => c.Id == wac.Id);
        reloaded.CanonicalTarget.Should().Be("canonical.SaleQualification");
    }

    [Fact]
    public async Task Edit_UpdatesColumnReviewStatus()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(reviewStatus: "InProgress"));

        result.Changed.Should().BeTrue();
        result.Before["review_status"].Should().Be("NeedsReview");
        result.After["review_status"].Should().Be("InProgress");

        var reloaded = await db.SyncMappingColumns.AsNoTracking().SingleAsync(c => c.Id == wac.Id);
        reloaded.ReviewStatus.Should().Be("InProgress");
    }

    [Fact]
    public async Task Edit_UpdatesColumnNotes()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(notes: "Review by EOD Friday"));

        result.Changed.Should().BeTrue();
        result.After["notes"].Should().Be("Review by EOD Friday");
    }

    // ── Code-value-scope mutations ──────────────────────────────────────

    [Fact]
    public async Task Edit_UpdatesCodeValueCanonicalValue()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale",
                reviewStatus: "Mapped"));

        result.Scope.Should().Be("code value");
        result.Changed.Should().BeTrue();
        result.Before["canonical_value"].Should().BeNull();
        result.After["canonical_value"].Should().Be("ArmsLengthSale");
        result.After["review_status"].Should().Be("Mapped");
        result.After["is_excluded"].Should().Be("false");  // not auto-flipped
    }

    [Fact]
    public async Task Edit_ClearsCodeValueCanonicalValue()
    {
        // Seed with a canonical value already set; --canonical-value-null
        // clears it.
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var existing = await db.SyncMappingCodeValues
            .SingleAsync(v => v.MappingColumnId == wac.Id && v.SourceValue == "458-61A-203(1)");
        existing.CanonicalValue = "Original";
        existing.ReviewStatus = "Mapped";
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValueNull: true,
                reviewStatus: "NeedsReview"));

        result.Changed.Should().BeTrue();
        result.Before["canonical_value"].Should().Be("Original");
        result.After["canonical_value"].Should().BeNull();
    }

    [Fact]
    public async Task Edit_MarksCodeValueExcluded()
    {
        // Memory-flagged scenario: operator explicitly marks an
        // exempt-transfer WAC code as Excluded. The service writes
        // exactly what the operator typed; nothing inferred.
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-217(1)",
                reviewStatus: "Excluded",
                isExcluded: true,
                notes: "REET exemption; not arms-length."));

        result.Changed.Should().BeTrue();
        result.After["review_status"].Should().Be("Excluded");
        result.After["is_excluded"].Should().Be("true");
        result.After["notes"].Should().Contain("REET exemption");
    }

    [Fact]
    public async Task Edit_MarksCodeValueDeferred()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                reviewStatus: "Deferred",
                notes: "Need assessor input"));

        result.Changed.Should().BeTrue();
        result.After["review_status"].Should().Be("Deferred");
        result.After["is_excluded"].Should().Be("false");
    }

    // ── Source-row identity ─────────────────────────────────────────────

    [Fact]
    public async Task Edit_RejectsMissingSourceColumn()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(county.Id, wb.Id,
            new SyncMappingWorkbookEditRequest(
                SourceSchema: "dbo", SourceTable: "sale", SourceColumn: "phantom_col",
                SourceValue: null, CanonicalTarget: "X", CanonicalValue: null,
                CanonicalValueNull: false, ReviewStatus: null,
                IsExcluded: null, Notes: null));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*phantom_col*not found in workbook*");
    }

    [Fact]
    public async Task Edit_RejectsMissingSourceValue()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "PHANTOM-CODE", reviewStatus: "Mapped"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*PHANTOM-CODE*not found*");
    }

    // ── Validation ──────────────────────────────────────────────────────

    [Fact]
    public async Task Edit_RejectsInvalidReviewStatus()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)", reviewStatus: "BananaStatus"));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*ReviewStatus*BananaStatus*");
    }

    [Fact]
    public async Task Edit_RejectsBareRequestWithNoMutationFields()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)"));  // no mutators

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*at least one mutation*");
    }

    [Fact]
    public async Task Edit_RejectsCanonicalValueAndCanonicalValueNullTogether()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "X", canonicalValueNull: true));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*mutually exclusive*");
    }

    [Fact]
    public async Task Edit_RejectsScopeIncorrectFields()
    {
        // Service-side defense (parser also catches this).
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        // Column scope but supplying a code-value-only field.
        Func<Task> act1 = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(canonicalValue: "X"));  // code-value-only
        await act1.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*CanonicalValue is code-value-scope only*");

        // Code-value scope but supplying CanonicalTarget (column-only).
        Func<Task> act2 = () => sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)", canonicalTarget: "X"));
        await act2.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*CanonicalTarget is column-scope only*");
    }

    // ── No-side-effect ──────────────────────────────────────────────────

    [Fact]
    public async Task Edit_DoesNotModifyOtherValuesInSameColumn()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        // Capture the SIBLING value's pre-state.
        var siblingPre = await db.SyncMappingCodeValues.AsNoTracking()
            .SingleAsync(v => v.MappingColumnId == wac.Id && v.SourceValue == "458-61A-217(1)");

        var sut = new SyncMappingWorkbookEditService(db);
        await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale",
                reviewStatus: "Mapped"));

        var siblingPost = await db.SyncMappingCodeValues.AsNoTracking()
            .SingleAsync(v => v.Id == siblingPre.Id);

        siblingPost.ReviewStatus.Should().Be(siblingPre.ReviewStatus);
        siblingPost.CanonicalValue.Should().Be(siblingPre.CanonicalValue);
        siblingPost.IsExcluded.Should().Be(siblingPre.IsExcluded);
        siblingPost.UpdatedAt.Should().Be(siblingPre.UpdatedAt);
    }

    [Fact]
    public async Task Edit_DoesNotModifyOtherWorkbook()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wbA, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id, name: "A");
        var (wbB, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id, name: "B");

        var preB = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbB.Id);
        var preBColIds = await db.SyncMappingColumns.AsNoTracking()
            .Where(c => c.WorkbookId == wbB.Id).Select(c => c.Id).ToListAsync();
        var preBValues = await db.SyncMappingCodeValues.AsNoTracking()
            .Where(v => preBColIds.Contains(v.MappingColumnId)).ToListAsync();

        var sut = new SyncMappingWorkbookEditService(db);
        await sut.EditAsync(county.Id, wbA.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale", reviewStatus: "Mapped"));

        var postB = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbB.Id);
        postB.UpdatedAt.Should().Be(preB.UpdatedAt);
        postB.Status.Should().Be(preB.Status);

        var postBValues = await db.SyncMappingCodeValues.AsNoTracking()
            .Where(v => preBColIds.Contains(v.MappingColumnId)).ToListAsync();
        foreach (var pre in preBValues)
        {
            var post = postBValues.Single(v => v.Id == pre.Id);
            post.ReviewStatus.Should().Be(pre.ReviewStatus);
            post.CanonicalValue.Should().Be(pre.CanonicalValue);
            post.IsExcluded.Should().Be(pre.IsExcluded);
        }
    }

    // ── Memory-flagged WacCd ────────────────────────────────────────────

    [Fact]
    public async Task Edit_DoesNotAutoExcludeWacCodes()
    {
        // Setting --canonical-value alone (no --is-excluded) leaves
        // IsExcluded as it was. The operator typing --is-excluded true
        // is the only path to exclusion.
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-217(1)",
                canonicalValue: "TransferByDeed",
                reviewStatus: "Mapped"));

        result.After["is_excluded"].Should().Be("false");
        result.After["canonical_value"].Should().Be("TransferByDeed");
        result.After["review_status"].Should().Be("Mapped");
    }

    [Fact]
    public async Task Edit_PreservesOperatorIsExcludedDecision()
    {
        // Pre-set IsExcluded=true; subsequent edit only sets
        // CanonicalValue. IsExcluded must round-trip unchanged.
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var existing = await db.SyncMappingCodeValues
            .SingleAsync(v => v.MappingColumnId == wac.Id && v.SourceValue == "458-61A-217(1)");
        existing.IsExcluded = true;
        existing.ReviewStatus = "Excluded";
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-217(1)",
                notes: "Adding clarifying notes."));

        result.After["is_excluded"].Should().Be("true");        // unchanged
        result.After["review_status"].Should().Be("Excluded");  // unchanged
        result.After["notes"].Should().Be("Adding clarifying notes.");
    }

    // ── Idempotency ─────────────────────────────────────────────────────

    [Fact]
    public async Task Edit_ReeditSameValueSucceedsWithEmptyDiff()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);

        // First edit sets the value.
        var first = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale", reviewStatus: "Mapped"));
        first.Changed.Should().BeTrue();

        // Second edit asks for the SAME state — should succeed but diff
        // is empty.
        var second = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale", reviewStatus: "Mapped"));
        second.Changed.Should().BeFalse();
        second.Before["canonical_value"].Should().Be(second.After["canonical_value"]);
        second.Before["review_status"].Should().Be(second.After["review_status"]);
    }

    // ── Audit ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Edit_BumpsUpdatedAtButNotCreatedAt()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var existing = await db.SyncMappingCodeValues.AsNoTracking()
            .SingleAsync(v => v.MappingColumnId == wac.Id && v.SourceValue == "458-61A-203(1)");
        var preCreatedAt = existing.CreatedAt;
        var preUpdatedAt = existing.UpdatedAt;
        var workbookPreUpdatedAt = wb.UpdatedAt;

        // Allow a tiny gap so DateTime.UtcNow is observably later.
        await Task.Delay(20);

        var sut = new SyncMappingWorkbookEditService(db);
        await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale", reviewStatus: "Mapped"));

        var post = await db.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == existing.Id);
        post.CreatedAt.Should().Be(preCreatedAt);
        post.UpdatedAt.Should().BeAfter(preUpdatedAt);

        var postWb = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wb.Id);
        postWb.UpdatedAt.Should().BeAfter(workbookPreUpdatedAt);
    }

    [Fact]
    public async Task Edit_NoOpStillBumpsUpdatedAt()
    {
        // Per C9-A policy: idempotent re-edit succeeds with empty diff
        // BUT still bumps audit stamps because operator confirmation is
        // itself an event.
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        // Pre-set the value.
        var existing = await db.SyncMappingCodeValues
            .SingleAsync(v => v.MappingColumnId == wac.Id && v.SourceValue == "458-61A-203(1)");
        existing.CanonicalValue = "ArmsLengthSale";
        existing.ReviewStatus = "Mapped";
        await db.SaveChangesAsync();

        var preUpdatedAt = existing.UpdatedAt;
        await Task.Delay(20);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "458-61A-203(1)",
                canonicalValue: "ArmsLengthSale", reviewStatus: "Mapped"));

        result.Changed.Should().BeFalse();

        var post = await db.SyncMappingCodeValues.AsNoTracking().SingleAsync(v => v.Id == existing.Id);
        post.UpdatedAt.Should().BeAfter(preUpdatedAt);
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task Edit_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(Guid.Empty, Guid.NewGuid(), WacRequest(reviewStatus: "Mapped"));
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task Edit_RejectsEmptyWorkbookId()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var sut = new SyncMappingWorkbookEditService(db);

        Func<Task> act = () => sut.EditAsync(Guid.NewGuid(), Guid.Empty, WacRequest(reviewStatus: "Mapped"));
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookId*");
    }

    [Fact]
    public async Task Edit_TableAndColumnMatchingIsCaseInsensitive()
    {
        // Source-row identity per C7 read-model policy: case-insensitive
        // on (schema, table, column). Edit must follow the same rule.
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, wac, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        var result = await sut.EditAsync(county.Id, wb.Id,
            new SyncMappingWorkbookEditRequest(
                SourceSchema: "DBO", SourceTable: "Sale", SourceColumn: "WAC_CD",
                SourceValue: null,
                CanonicalTarget: "uppercase-routes-fine",
                CanonicalValue: null, CanonicalValueNull: false,
                ReviewStatus: null, IsExcluded: null, Notes: null));

        result.Scope.Should().Be("column");
        result.EditedRowId.Should().Be(wac.Id);
        result.After["canonical_target"].Should().Be("uppercase-routes-fine");
    }

    [Fact]
    public async Task Edit_SourceValueMatchingIsExactAfterTrim()
    {
        await using var db = CreateContext($"edit-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var (wb, _, _) = await SeedDraftWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = new SyncMappingWorkbookEditService(db);
        // Padded spaces around the value — service trims and matches.
        var result = await sut.EditAsync(county.Id, wb.Id,
            WacRequest(sourceValue: "  458-61A-203(1)  ",
                canonicalValue: "ArmsLengthSale",
                reviewStatus: "Mapped"));

        result.Scope.Should().Be("code value");
        result.Changed.Should().BeTrue();
    }
}
