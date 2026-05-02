using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Transforms.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Transforms.Sales;

/// <summary>
/// Slice C8-B tests: <see cref="SalesQualificationTransform"/> turns
/// a <see cref="SalesQualificationSource"/> into a deterministic
/// <see cref="SalesQualificationDecision"/> using a locked Mapping
/// Workbook as the rule source. Pattern matches C7's read-model tests
/// — InMemory provider, fresh database name per test, synthetic Mapped
/// workbooks built per scenario.
///
/// <para>Slice contract: see
/// <c>docs/sync/sales-qualification-transform-policy.md</c> (Slice
/// C8-A). The 17 named tests below are the implementation slice's
/// required test matrix.</para>
/// </summary>
public class SalesQualificationTransformTests
{
    private const string Schema      = "dbo";
    private const string Table       = "sale";
    private const string WacColumn   = "wac_cd";
    private const string RatioColumn = "sl_ratio_type_cd";

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

    /// <summary>
    /// Build a Mapped workbook with one wac_cd column + one
    /// sl_ratio_type_cd column. Caller passes per-axis fixtures so each
    /// test can shape its own scenario.
    /// </summary>
    private static async Task<Guid> SeedMappedWorkbookAsync(
        TerraFusionDbContext db, Guid countyId, Guid connectionId, Guid batchId,
        IEnumerable<(string Value, string ReviewStatus, string? CanonicalValue, bool IsExcluded)> wacRows,
        IEnumerable<(string Value, string ReviewStatus, string? CanonicalValue, bool IsExcluded)> ratioRows,
        string status = "Mapped",
        string name = "wb")
    {
        var wb = new SyncMappingWorkbook
        {
            CountyId           = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId     = batchId,
            Name               = name,
            Status             = status,
        };
        db.SyncMappingWorkbooks.Add(wb);

        var wacCol = new SyncMappingColumn
        {
            CountyId        = countyId,
            WorkbookId      = wb.Id,
            SourceSchema    = Schema,
            SourceTable     = Table,
            SourceColumn    = WacColumn,
            MappingLane     = "Sales",
            ReviewStatus    = "Mapped",
            CanonicalTarget = "canonical.SaleQualification",
        };
        var ratioCol = new SyncMappingColumn
        {
            CountyId        = countyId,
            WorkbookId      = wb.Id,
            SourceSchema    = Schema,
            SourceTable     = Table,
            SourceColumn    = RatioColumn,
            MappingLane     = "Sales",
            ReviewStatus    = "Mapped",
            CanonicalTarget = "canonical.RatioStudyType",
        };
        db.SyncMappingColumns.AddRange(wacCol, ratioCol);

        foreach (var (value, reviewStatus, canonicalValue, isExcluded) in wacRows)
        {
            db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
            {
                CountyId        = countyId,
                MappingColumnId = wacCol.Id,
                SourceValue     = value,
                ReviewStatus    = reviewStatus,
                CanonicalValue  = canonicalValue,
                IsExcluded      = isExcluded,
                ObservedCount   = 1,
            });
        }
        foreach (var (value, reviewStatus, canonicalValue, isExcluded) in ratioRows)
        {
            db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
            {
                CountyId        = countyId,
                MappingColumnId = ratioCol.Id,
                SourceValue     = value,
                ReviewStatus    = reviewStatus,
                CanonicalValue  = canonicalValue,
                IsExcluded      = isExcluded,
                ObservedCount   = 1,
            });
        }

        await db.SaveChangesAsync();
        return wb.Id;
    }

    private static SalesQualificationTransform CreateSut(TerraFusionDbContext db)
        => new SalesQualificationTransform(new SyncMappingWorkbookReadModel(db));

    // Reusable shorthands.
    private static (string, string, string?, bool) Mapped(string val, string canonical)
        => (val, "Mapped",   canonical, false);
    private static (string, string, string?, bool) MappedExcluded(string val)
        => (val, "Mapped",   null,      true);
    private static (string, string, string?, bool) Excluded(string val)
        => (val, "Excluded", null,      true);
    private static (string, string, string?, bool) Deferred(string val)
        => (val, "Deferred", null,      false);

    // ── Status guard ────────────────────────────────────────────────────

    [Fact]
    public async Task QualifyAsync_RejectsDraftWorkbookViaReadModel()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") },
            status:    "Draft");

        var sut = CreateSut(db);
        Func<Task> act = () => sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "00"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Draft'*Status='Mapped'*");
    }

    // ── Per-axis happy / non-happy paths ────────────────────────────────

    [Fact]
    public async Task QualifyAsync_Qualified_WhenWacAndRatioAreMapped()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "00"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Qualified);
        decision.IsExcludedFromComps.Should().BeFalse();
        decision.CanonicalValue.Should().Be("ArmsLengthSale");
        decision.Reasons.Should().HaveCount(2);
    }

    [Fact]
    public async Task QualifyAsync_Excluded_WhenWacIsOperatorExcluded()
    {
        // Memory-flagged: 458-61A-217(1) is an exempt-transfer code an
        // operator-marked Excluded. WAC axis exclusion overrides
        // anything else.
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Excluded("458-61A-217(1)") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-217(1)", "00"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Excluded);
        decision.IsExcludedFromComps.Should().BeTrue();
        decision.CanonicalValue.Should().BeNull();
    }

    [Fact]
    public async Task QualifyAsync_Excluded_WhenRatioIsOperatorExcluded()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Excluded("99") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "99"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Excluded);
        decision.IsExcludedFromComps.Should().BeTrue();
        decision.CanonicalValue.Should().BeNull();
    }

    [Fact]
    public async Task QualifyAsync_Deferred_WhenWacIsDeferred()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Deferred("458-61A-303") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-303", "00"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Deferred);
        decision.IsExcludedFromComps.Should().BeTrue();
    }

    [Fact]
    public async Task QualifyAsync_Deferred_WhenRatioIsDeferred()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Deferred("27") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "27"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Deferred);
        decision.IsExcludedFromComps.Should().BeTrue();
    }

    [Fact]
    public async Task QualifyAsync_Unknown_WhenWacNotInWorkbook()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("UNKNOWN-WAC", "00"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Unknown);
        decision.IsExcludedFromComps.Should().BeTrue();
        decision.Reasons.Should().Contain(r => r.Contains("UNKNOWN-WAC") && r.Contains("not in workbook"));
    }

    [Fact]
    public async Task QualifyAsync_Unknown_WhenRatioNotInWorkbook()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "999-NEW-RATIO"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Unknown);
        decision.IsExcludedFromComps.Should().BeTrue();
    }

    [Fact]
    public async Task QualifyAsync_MissingCode_WhenWacBlank()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);

        // Test all three "blank" shapes that map to MissingCode.
        foreach (var blank in new[] { (string?)null, string.Empty, "   " })
        {
            var decision = await sut.QualifyAsync(
                county.Id, wbId,
                new SalesQualificationSource(blank, "00"));

            decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.MissingCode);
            decision.IsExcludedFromComps.Should().BeTrue();
            decision.Reasons.Should().Contain(r => r.Contains("wac_cd=<missing>"));
        }
    }

    [Fact]
    public async Task QualifyAsync_MissingCode_WhenRatioBlank()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);

        foreach (var blank in new[] { (string?)null, string.Empty, "   " })
        {
            var decision = await sut.QualifyAsync(
                county.Id, wbId,
                new SalesQualificationSource("458-61A-203(1)", blank));

            decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.MissingCode);
            decision.IsExcludedFromComps.Should().BeTrue();
            decision.Reasons.Should().Contain(r => r.Contains("sl_ratio_type_cd=<missing>"));
        }
    }

    // ── Contract-violation defense (lock prevents these, transform pins) ─

    [Fact]
    public void Qualify_Throws_WhenWorkbookDecisionIsNeedsReview()
    {
        // Defensive: if a NeedsReview row ever leaks past the lock guard
        // (upstream contract drift), the transform must surface loudly
        // rather than silently picking a side. Test the pure function
        // directly with a synthetic snapshot.
        var snapshot = BuildSnapshot(
            wacRows:   new (string, string, string?, bool)[] { ("458-61A-203(1)", "NeedsReview", null,             false) },
            ratioRows: new (string, string, string?, bool)[] { ("00",            "Mapped",      "Conventional",   false) });

        Action act = () => SalesQualificationTransform.Qualify(
            snapshot,
            new SalesQualificationSource("458-61A-203(1)", "00"));

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*NeedsReview*upstream contract drift*");
    }

    [Fact]
    public void Qualify_Throws_WhenWorkbookDecisionIsInProgress()
    {
        var snapshot = BuildSnapshot(
            wacRows:   new (string, string, string?, bool)[] { ("458-61A-203(1)", "Mapped",     "ArmsLengthSale", false) },
            ratioRows: new (string, string, string?, bool)[] { ("00",            "InProgress", null,             false) });

        Action act = () => SalesQualificationTransform.Qualify(
            snapshot,
            new SalesQualificationSource("458-61A-203(1)", "00"));

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*InProgress*upstream contract drift*");
    }

    // ── Reason format provenance ────────────────────────────────────────

    [Fact]
    public async Task QualifyAsync_PreservesWacProvenanceReason()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "00"));

        // wac axis is index 0 (deterministic order: wac first, ratio second).
        decision.Reasons[0].Should().Be(
            "wac_cd=458-61A-203(1) operator-mapped (canonical: ArmsLengthSale)");
    }

    [Fact]
    public async Task QualifyAsync_PreservesRatioTypeProvenanceReason()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
            ratioRows: new[] { Excluded("99") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "99"));

        // ratio axis is index 1.
        decision.Reasons[1].Should().Be("sl_ratio_type_cd=99 operator-excluded");
    }

    // ── Memory-flagged scenario ─────────────────────────────────────────

    [Fact]
    public async Task QualifyAsync_DoesNotAutoExcludeMemoryFlaggedWac()
    {
        // Memory directive: "WacCd bug blocks all comps." The transform
        // must not auto-exclude any WAC code; it can only obey the
        // operator's IsExcluded / ReviewStatus values. Pin: an
        // operator-mapped exempt-transfer-LIKE WAC stays Qualified
        // because the operator's decision was Mapped + IsExcluded=false.
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[]
            {
                // The operator made an INTENTIONAL Mapped decision on
                // a code that *looks* like an exempt transfer. The
                // transform must trust the operator.
                Mapped("458-61A-203(1)", "ArmsLengthSale"),
            },
            ratioRows: new[] { Mapped("00", "Conventional") });

        var sut = CreateSut(db);
        var decision = await sut.QualifyAsync(
            county.Id, wbId,
            new SalesQualificationSource("458-61A-203(1)", "00"));

        decision.DecisionStatus.Should().Be(SalesQualificationDecisionStatus.Qualified);
        decision.IsExcludedFromComps.Should().BeFalse();
        decision.CanonicalValue.Should().Be("ArmsLengthSale");
    }

    // ── Mapped-workbook-only / read-only contract ───────────────────────

    [Fact]
    public async Task QualifyAsync_UsesMappedWorkbookOnly()
    {
        // Sanity: every non-Mapped workbook status surfaces the read
        // model's Status='Mapped' guard.
        var nonMappedStatuses = new[] { "Draft", "InProgress", "Approved", "Archived", "Locked" };

        foreach (var status in nonMappedStatuses)
        {
            await using var db = CreateContext($"sqt-{Guid.NewGuid()}-{status}");
            var (county, conn, batch) = await SeedScopeAsync(db);
            var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
                wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale") },
                ratioRows: new[] { Mapped("00", "Conventional") },
                status:    status);

            var sut = CreateSut(db);
            Func<Task> act = () => sut.QualifyAsync(
                county.Id, wbId,
                new SalesQualificationSource("458-61A-203(1)", "00"));

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage($"*Status='{status}'*Status='Mapped'*");
        }
    }

    [Fact]
    public async Task QualifyAsync_DoesNotMutateWorkbook()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[] { Mapped("458-61A-203(1)", "ArmsLengthSale"), Excluded("458-61A-217(1)") },
            ratioRows: new[] { Mapped("00", "Conventional"), Deferred("27") });

        // Snapshot the workbook + columns + values BEFORE running.
        var preWb        = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbId);
        var preColumns   = await db.SyncMappingColumns.AsNoTracking().Where(c => c.WorkbookId == wbId).ToListAsync();
        var preColIds    = preColumns.Select(c => c.Id).ToList();
        var preValues    = await db.SyncMappingCodeValues.AsNoTracking().Where(v => preColIds.Contains(v.MappingColumnId)).ToListAsync();

        var sut = CreateSut(db);

        // Run a few qualifications, mixing scenarios that exercise every
        // per-axis branch.
        await sut.QualifyAsync(county.Id, wbId, new SalesQualificationSource("458-61A-203(1)", "00"));
        await sut.QualifyAsync(county.Id, wbId, new SalesQualificationSource("458-61A-217(1)", "00"));
        await sut.QualifyAsync(county.Id, wbId, new SalesQualificationSource("458-61A-203(1)", "27"));
        await sut.QualifyAsync(county.Id, wbId, new SalesQualificationSource("UNKNOWN", "00"));
        await sut.QualifyAsync(county.Id, wbId, new SalesQualificationSource(null, null));

        // Compare post-state to pre-state.
        var postWb     = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbId);
        var postValues = await db.SyncMappingCodeValues.AsNoTracking().Where(v => preColIds.Contains(v.MappingColumnId)).ToListAsync();

        postWb.Status.Should().Be(preWb.Status);
        postWb.UpdatedAt.Should().Be(preWb.UpdatedAt);
        postValues.Should().HaveCount(preValues.Count);
        foreach (var pre in preValues)
        {
            var post = postValues.Single(v => v.Id == pre.Id);
            post.IsExcluded.Should().Be(pre.IsExcluded);
            post.ReviewStatus.Should().Be(pre.ReviewStatus);
            post.CanonicalValue.Should().Be(pre.CanonicalValue);
        }
    }

    // ── Combined-axis precedence (defensive over the policy table) ──────

    [Fact]
    public async Task QualifyAsync_CombinedNonQualified_PrecedenceIsExcludedThenDeferredThenUnknownThenMissing()
    {
        // Comps are opt-in. Among the non-Qualified statuses, Excluded
        // wins, then Deferred, then Unknown, then MissingCode. Pin the
        // chain so a future "should Unknown trump Deferred?" tweak
        // surfaces in the test suite.
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            wacRows:   new[]
            {
                Mapped("458-61A-203(1)", "ArmsLengthSale"),
                Excluded("458-61A-217(1)"),
                Deferred("458-61A-303"),
            },
            ratioRows: new[]
            {
                Mapped("00", "Conventional"),
                Excluded("99"),
                Deferred("27"),
            });

        var sut = CreateSut(db);

        // Excluded > Deferred
        (await sut.QualifyAsync(county.Id, wbId,
            new SalesQualificationSource("458-61A-217(1)", "27"))).DecisionStatus
            .Should().Be(SalesQualificationDecisionStatus.Excluded);

        // Excluded > Unknown
        (await sut.QualifyAsync(county.Id, wbId,
            new SalesQualificationSource("458-61A-217(1)", "999-UNKNOWN"))).DecisionStatus
            .Should().Be(SalesQualificationDecisionStatus.Excluded);

        // Excluded > MissingCode
        (await sut.QualifyAsync(county.Id, wbId,
            new SalesQualificationSource("458-61A-217(1)", null))).DecisionStatus
            .Should().Be(SalesQualificationDecisionStatus.Excluded);

        // Deferred > Unknown
        (await sut.QualifyAsync(county.Id, wbId,
            new SalesQualificationSource("458-61A-303", "999-UNKNOWN"))).DecisionStatus
            .Should().Be(SalesQualificationDecisionStatus.Deferred);

        // Deferred > MissingCode
        (await sut.QualifyAsync(county.Id, wbId,
            new SalesQualificationSource("458-61A-303", null))).DecisionStatus
            .Should().Be(SalesQualificationDecisionStatus.Deferred);

        // Unknown > MissingCode
        (await sut.QualifyAsync(county.Id, wbId,
            new SalesQualificationSource("999-UNKNOWN", null))).DecisionStatus
            .Should().Be(SalesQualificationDecisionStatus.Unknown);
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task QualifyAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var sut = CreateSut(db);

        Func<Task> act = () => sut.QualifyAsync(
            Guid.Empty, Guid.NewGuid(),
            new SalesQualificationSource("any", "any"));

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task QualifyAsync_RejectsEmptyWorkbookId()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var sut = CreateSut(db);

        Func<Task> act = () => sut.QualifyAsync(
            Guid.NewGuid(), Guid.Empty,
            new SalesQualificationSource("any", "any"));

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookId*");
    }

    [Fact]
    public async Task QualifyAsync_RejectsNullSource()
    {
        await using var db = CreateContext($"sqt-{Guid.NewGuid()}");
        var sut = CreateSut(db);

        Func<Task> act = () => sut.QualifyAsync(
            Guid.NewGuid(), Guid.NewGuid(),
            source: null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    // ── Helpers for the pure-function tests ─────────────────────────────

    /// <summary>
    /// Build a synthetic <see cref="SyncMappingWorkbookSnapshot"/>
    /// directly, bypassing the DbContext. Lets us exercise
    /// <see cref="SalesQualificationTransform.Qualify"/> against shapes
    /// the C6 lock service would normally prevent (e.g.
    /// <c>NeedsReview</c> rows leaking past the read model).
    /// </summary>
    private static SyncMappingWorkbookSnapshot BuildSnapshot(
        IEnumerable<(string Value, string ReviewStatus, string? CanonicalValue, bool IsExcluded)> wacRows,
        IEnumerable<(string Value, string ReviewStatus, string? CanonicalValue, bool IsExcluded)> ratioRows)
    {
        var wacDict = new Dictionary<string, SyncMappingCodeDecision>(StringComparer.Ordinal);
        foreach (var (value, status, canonical, excluded) in wacRows)
        {
            wacDict[value] = new SyncMappingCodeDecision(
                CodeValueId: Guid.NewGuid(), SourceValue: value, SourceLabel: null, ObservedCount: 1,
                CanonicalValue: canonical, ReviewStatus: status, IsExcluded: excluded);
        }
        var ratioDict = new Dictionary<string, SyncMappingCodeDecision>(StringComparer.Ordinal);
        foreach (var (value, status, canonical, excluded) in ratioRows)
        {
            ratioDict[value] = new SyncMappingCodeDecision(
                CodeValueId: Guid.NewGuid(), SourceValue: value, SourceLabel: null, ObservedCount: 1,
                CanonicalValue: canonical, ReviewStatus: status, IsExcluded: excluded);
        }

        var wacCol = new SyncMappingColumnDecision(
            MappingColumnId: Guid.NewGuid(),
            MappingLane:     "Sales",
            SourceSchema:    Schema,
            SourceTable:     Table,
            SourceColumn:    WacColumn,
            CanonicalTarget: "canonical.SaleQualification",
            ReviewStatus:    "Mapped",
            CodeValues:      wacDict);

        var ratioCol = new SyncMappingColumnDecision(
            MappingColumnId: Guid.NewGuid(),
            MappingLane:     "Sales",
            SourceSchema:    Schema,
            SourceTable:     Table,
            SourceColumn:    RatioColumn,
            CanonicalTarget: "canonical.RatioStudyType",
            ReviewStatus:    "Mapped",
            CodeValues:      ratioDict);

        return new SyncMappingWorkbookSnapshot(
            WorkbookId:     Guid.NewGuid(),
            CountyId:       Guid.NewGuid(),
            SourceConnectionId: Guid.NewGuid(),
            ProfileBatchId: Guid.NewGuid(),
            Name:           "synthetic",
            Columns:        new[] { wacCol, ratioCol });
    }
}
