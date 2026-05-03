using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsAccount;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice B1-A acceptance tests. Mirrors the S1/S2-A pattern; proves
/// the four B1-A promotion gates and the doctrine invariants:
///  - LoadBatch is opened with SourceFamily = PACS_OLTP
///  - every landed row carries non-empty load_batch_id and source_query_hash
///  - acct_id uniqueness invariant is enforced via the
///    account-acct-id-uniqueness gate (FAIL on duplicate)
///  - PII (DL number, email, names) lands verbatim — redaction is
///    canonical-layer's job, not raw-layer's
///  - confidential + web_suppression counts are surfaced via the
///    pii-flags-recorded gate
///  - empty source still records all four gates
///  - failing source marks load_batch FAILED with no partial rows
/// </summary>
public sealed class PacsAccountLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsAccountLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b1a-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private PacsAccountLandingService BuildService()
        => new(_db, NullLogger<PacsAccountLandingService>.Instance);

    private static FakeAccountSource Source(params PacsSourceAccount[] rows)
        => new(rows);

    private static PacsSourceAccount Account(
        long acctId = 1,
        string? fileAs = "Smith, John",
        string? first = "John",
        string? last = "Smith",
        string? dlNum = null,
        string? dlState = null,
        string? email = null,
        bool webSupp = false,
        bool confidential = false)
        => new(acctId, fileAs, first, last, dlNum, dlState, email, webSupp, confidential);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesPass()
    {
        var src = Source(
            Account(acctId: 1, fileAs: "Smith, John", first: "John", last: "Smith"),
            Account(acctId: 2, fileAs: "Acme Corp", first: null, last: null),
            Account(acctId: 3, fileAs: "Doe, Jane", first: "Jane", last: "Doe"));

        var result = await BuildService().LandAccountsAsync(src, "b1a-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(3);
        result.DuplicateAcctIdViolations.Should().Be(0);
        result.ConfidentialCount.Should().Be(0);
        result.WebSuppressedCount.Should().Be(0);

        (await _db.LegacyPacsRawAccounts.CountAsync()).Should().Be(3);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);
        batch.Status.Should().Be("COMPLETED");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "account-distribution",
            "account-acct-id-uniqueness",
            "provenance-coverage",
            "account-pii-flags-recorded",
        });
        gates.Where(g => g.GateName == "account-acct-id-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateAcctId_TripsUniquenessGate_ToFail()
    {
        var src = Source(
            Account(acctId: 7, fileAs: "first row"),
            Account(acctId: 7, fileAs: "duplicate"),
            Account(acctId: 8, fileAs: "third row"));

        var result = await BuildService().LandAccountsAsync(src, "b1a-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateAcctIdViolations.Should().Be(1,
            "acct_id=7 appears twice → 1 violated key");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "account-acct-id-uniqueness");
        gate.Status.Should().Be("FAIL");
        gate.Expected.Should().Be("0");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Account(1), Account(2), Account(3));

        var result = await BuildService().LandAccountsAsync(src, "b1a-test");

        var rows = await _db.LegacyPacsRawAccounts.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task PII_IsLandedVerbatim_AtRawLayer()
    {
        // Doctrine: the raw layer keeps everything; the canonical
        // layer redacts. The S1/S2-A pattern preserves source data
        // verbatim, and B1-A continues that pattern even for PII.
        var src = Source(Account(
            acctId: 1,
            fileAs: "Smith, John",
            first: "John",
            last: "Smith",
            dlNum: "WDL-1234567",
            dlState: "WA",
            email: "john@example.com",
            confidential: false));

        await BuildService().LandAccountsAsync(src, "b1a-test");

        var row = await _db.LegacyPacsRawAccounts.SingleAsync();
        row.DlNum.Should().Be("WDL-1234567");
        row.DlState.Should().Be("WA");
        row.EmailAddr.Should().Be("john@example.com");
        row.FirstName.Should().Be("John");
        row.LastName.Should().Be("Smith");
    }

    [Fact]
    public async Task RedactionFlags_AreCounted_BothFlavors()
    {
        var src = Source(
            Account(1, confidential: true,  webSupp: false),
            Account(2, confidential: false, webSupp: true),
            Account(3, confidential: true,  webSupp: true),
            Account(4, confidential: false, webSupp: false));

        var result = await BuildService().LandAccountsAsync(src, "b1a-test");

        result.ConfidentialCount.Should().Be(2);
        result.WebSuppressedCount.Should().Be(2);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "account-pii-flags-recorded");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("confidential=2");
        gate.Detail.Should().Contain("webSuppressed=2");
        gate.Detail.Should().Contain("total=4");
    }

    [Fact]
    public async Task DistributionGate_RecordsRowAndFlagSummary()
    {
        var src = Source(
            Account(1, confidential: true),
            Account(2),
            Account(3, webSupp: true));

        await BuildService().LandAccountsAsync(src, "b1a-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "account-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("rows=3");
        gate.Detail.Should().Contain("confidential=1");
        gate.Detail.Should().Contain("webSuppressed=1");
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandAccountsAsync(src, "b1a-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");

        (await _db.LegacyPacsRawAccounts.CountAsync()).Should().Be(0);
        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4);
        gates.Where(g => g.GateName == "account-acct-id-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_AndDoesNotPersistRows()
    {
        var src = new ThrowingAccountSource(
            new InvalidOperationException("simulated source failure"));

        var result = await BuildService().LandAccountsAsync(src, "b1a-test");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated source failure");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("InvalidOperationException");

        (await _db.LegacyPacsRawAccounts.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ErrorSummary_IsSanitized_NoStackTraces_NoPii()
    {
        // The doctrine: error_summary holds Type + Message only.
        // No stack traces (in structured logs only). No PII. The
        // exception message itself is part of the contract — we
        // verify it doesn't accumulate context.
        var src = new ThrowingAccountSource(
            new InvalidOperationException("boom"));

        var result = await BuildService().LandAccountsAsync(src, "b1a-test");
        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();

        batch.ErrorSummary.Should().Be("InvalidOperationException: boom");
        batch.ErrorSummary.Should().NotContain("at ");
        batch.ErrorSummary.Should().NotContain("\n");
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Account(1));
        var src2 = Source(Account(2));

        var r1 = await BuildService().LandAccountsAsync(src1, "b1a-test");
        var r2 = await BuildService().LandAccountsAsync(src2, "b1a-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
        b1.SourceQueryHash.Should().NotBeEmpty();
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInB1A()
    {
        var src = Source(Account(1));
        await BuildService().LandAccountsAsync(src, "b1a-test");

        // B1-A is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfSales.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(0);
        (await _db.TruthPacsSales.CountAsync()).Should().Be(0);
        // No source_xref entry either; canonical lineage is later layers.
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task OrganizationAccount_LandsWithNullPersonNames()
    {
        // PACS allows account rows for organizations with null
        // first_name / last_name; only file_as_name is the display.
        var src = Source(Account(
            acctId: 99, fileAs: "Acme Corporation",
            first: null, last: null));

        await BuildService().LandAccountsAsync(src, "b1a-test");

        var row = await _db.LegacyPacsRawAccounts.SingleAsync();
        row.FileAsName.Should().Be("Acme Corporation");
        row.FirstName.Should().BeNull();
        row.LastName.Should().BeNull();
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeAccountSource : IPacsAccountSource
    {
        private readonly IReadOnlyList<PacsSourceAccount> _rows;
        public FakeAccountSource(IEnumerable<PacsSourceAccount> rows)
            => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT acct_id, file_as_name, first_name, last_name, dl_num, dl_state, email_addr, web_suppression, confidential_flag FROM dbo.account";

        public async IAsyncEnumerable<PacsSourceAccount> StreamAccountsAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            foreach (var r in _rows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return r;
                await Task.Yield();
            }
        }
    }

    private sealed class ThrowingAccountSource : IPacsAccountSource
    {
        private readonly Exception _ex;
        public ThrowingAccountSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceAccount> StreamAccountsAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            await Task.Yield();
            throw _ex;
#pragma warning disable CS0162
            yield break;
#pragma warning restore CS0162
        }
    }
}
