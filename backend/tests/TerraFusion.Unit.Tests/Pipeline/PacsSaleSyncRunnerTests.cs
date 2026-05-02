using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Sync.PacsSaleCanonical;
using TerraFusion.Core.Sync.PacsSalePipeline;
using TerraFusion.Core.Sync.PacsSaleTruth;
using TerraFusion.Data.Services.Pipeline;
using Xunit;

namespace TerraFusion.Unit.Tests.Pipeline;

/// <summary>
/// Sync-runner orchestration tests: stage-skipping on non-COMPLETED
/// upstream, combined-status mapping, lineage of both batch ids.
/// Stubs the truth promoter and canonical projector so we exercise
/// only the runner's wiring + decision logic.
/// </summary>
public sealed class PacsSaleSyncRunnerTests
{
    private static readonly Guid SaleBatch =
        Guid.Parse("aa000000-0000-0000-0000-000000000001");
    private static readonly Guid SuppBatch =
        Guid.Parse("aa000000-0000-0000-0000-000000000002");

    private static PacsSaleSyncRunner Build(
        IPacsSaleTruthPromoter truth,
        IPacsSaleCanonicalProjector canonical)
        => new(truth, canonical, NullLogger<PacsSaleSyncRunner>.Instance);

    [Fact]
    public async Task BothStagesCompleted_ReturnsCombinedSuccess()
    {
        var truthBatch = Guid.NewGuid();
        var canonicalBatch = Guid.NewGuid();
        var truth = new StubTruthPromoter(new PacsSaleTruthPromotionResult
        {
            PromotionLoadBatchId = truthBatch,
            Status = "COMPLETED",
            SalesConsidered = 10,
            SalesPromoted = 8,
            RejectedNotQualified = 1,
            RejectedNoSuppPointer = 1,
            RejectedStaleSupNum = 0,
            RejectedStaleAxis = 0,
            PriorRowsRemoved = 0,
        });
        var canonical = new StubCanonicalProjector(new PacsSaleCanonicalResult
        {
            PromotionLoadBatchId = canonicalBatch,
            Status = "COMPLETED",
            TruthSalesConsidered = 8,
            SalesProjected = 7,
            SalesQuarantined = 1,
            PriorCanonicalRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
        });

        var result = await Build(truth, canonical)
            .RunAsync(SaleBatch, SuppBatch, "op-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthPromotionLoadBatchId.Should().Be(truthBatch);
        result.TruthStatus.Should().Be("COMPLETED");
        result.SalesConsidered.Should().Be(10);
        result.SalesPromoted.Should().Be(8);
        result.CanonicalPromotionLoadBatchId.Should().Be(canonicalBatch);
        result.CanonicalStatus.Should().Be("COMPLETED");
        result.SalesProjected.Should().Be(7);
        result.SalesQuarantined.Should().Be(1);

        canonical.WasCalled.Should().BeTrue();
        canonical.LastInputBatchId.Should().Be(truthBatch,
            "canonical stage takes the truth-promotion batch id, not the original sale batch");
    }

    [Fact]
    public async Task TruthRefused_ShortCircuits_CanonicalNotRun()
    {
        var truth = new StubTruthPromoter(new PacsSaleTruthPromotionResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "REFUSED",
            SalesConsidered = 0,
            SalesPromoted = 0,
            RejectedNotQualified = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedStaleAxis = 0,
            PriorRowsRemoved = 0,
            ErrorSummary = "saleBatch=FAILED",
        });
        var canonical = new StubCanonicalProjector(new PacsSaleCanonicalResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "COMPLETED",
            TruthSalesConsidered = 0,
            SalesProjected = 0,
            SalesQuarantined = 0,
            PriorCanonicalRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
        });

        var result = await Build(truth, canonical)
            .RunAsync(SaleBatch, SuppBatch, "op-test");

        result.Status.Should().Be("TRUTH_REFUSED");
        result.CanonicalStatus.Should().Be("NOT_RUN");
        result.CanonicalPromotionLoadBatchId.Should().Be(Guid.Empty);
        result.ErrorSummary.Should().Contain("saleBatch=FAILED");

        canonical.WasCalled.Should().BeFalse(
            "the canonical stage MUST NOT run when truth refused");
    }

    [Fact]
    public async Task TruthFailed_ShortCircuits_CanonicalNotRun()
    {
        var truth = new StubTruthPromoter(new PacsSaleTruthPromotionResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "FAILED",
            SalesConsidered = 0,
            SalesPromoted = 0,
            RejectedNotQualified = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedStaleAxis = 0,
            PriorRowsRemoved = 0,
            ErrorSummary = "InvalidOperationException: kaboom",
        });
        var canonical = new StubCanonicalProjector(new PacsSaleCanonicalResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "COMPLETED",
            TruthSalesConsidered = 0,
            SalesProjected = 0,
            SalesQuarantined = 0,
            PriorCanonicalRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
        });

        var result = await Build(truth, canonical)
            .RunAsync(SaleBatch, SuppBatch, "op-test");

        result.Status.Should().Be("TRUTH_FAILED");
        result.CanonicalStatus.Should().Be("NOT_RUN");
        canonical.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task CanonicalRefused_AfterTruthCompleted_ReportsCanonicalRefused()
    {
        var truth = new StubTruthPromoter(new PacsSaleTruthPromotionResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "COMPLETED",
            SalesConsidered = 5,
            SalesPromoted = 5,
            RejectedNotQualified = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedStaleAxis = 0,
            PriorRowsRemoved = 0,
        });
        var canonical = new StubCanonicalProjector(new PacsSaleCanonicalResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "REFUSED",
            TruthSalesConsidered = 0,
            SalesProjected = 0,
            SalesQuarantined = 0,
            PriorCanonicalRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
            ErrorSummary = "truth promotion batch=NOT_FOUND",
        });

        var result = await Build(truth, canonical)
            .RunAsync(SaleBatch, SuppBatch, "op-test");

        result.Status.Should().Be("CANONICAL_REFUSED");
        result.TruthStatus.Should().Be("COMPLETED");
        result.CanonicalStatus.Should().Be("REFUSED");
    }

    [Fact]
    public async Task CanonicalFailed_AfterTruthCompleted_ReportsCanonicalFailed()
    {
        var truth = new StubTruthPromoter(new PacsSaleTruthPromotionResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "COMPLETED",
            SalesConsidered = 5,
            SalesPromoted = 5,
            RejectedNotQualified = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedStaleAxis = 0,
            PriorRowsRemoved = 0,
        });
        var canonical = new StubCanonicalProjector(new PacsSaleCanonicalResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "FAILED",
            TruthSalesConsidered = 0,
            SalesProjected = 0,
            SalesQuarantined = 0,
            PriorCanonicalRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
            ErrorSummary = "JsonException: bad lineage",
        });

        var result = await Build(truth, canonical)
            .RunAsync(SaleBatch, SuppBatch, "op-test");

        result.Status.Should().Be("CANONICAL_FAILED");
        result.ErrorSummary.Should().Contain("bad lineage");
    }

    [Fact]
    public async Task OperatorName_FlowsToBothStages()
    {
        var truth = new StubTruthPromoter(new PacsSaleTruthPromotionResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "COMPLETED",
            SalesConsidered = 0,
            SalesPromoted = 0,
            RejectedNotQualified = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedStaleAxis = 0,
            PriorRowsRemoved = 0,
        });
        var canonical = new StubCanonicalProjector(new PacsSaleCanonicalResult
        {
            PromotionLoadBatchId = Guid.NewGuid(),
            Status = "COMPLETED",
            TruthSalesConsidered = 0,
            SalesProjected = 0,
            SalesQuarantined = 0,
            PriorCanonicalRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
        });

        await Build(truth, canonical).RunAsync(SaleBatch, SuppBatch, "alice@assessor");

        truth.LastOperator.Should().Be("alice@assessor");
        canonical.LastOperator.Should().Be("alice@assessor");
    }

    // ── Stubs ──────────────────────────────────────────────────────

    private sealed class StubTruthPromoter : IPacsSaleTruthPromoter
    {
        private readonly PacsSaleTruthPromotionResult _result;
        public string? LastOperator { get; private set; }
        public StubTruthPromoter(PacsSaleTruthPromotionResult result) => _result = result;
        public Task<PacsSaleTruthPromotionResult> PromoteAsync(
            Guid saleLoadBatchId, Guid suppAssocLoadBatchId,
            string operatorName, CancellationToken cancellationToken = default)
        {
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }

    private sealed class StubCanonicalProjector : IPacsSaleCanonicalProjector
    {
        private readonly PacsSaleCanonicalResult _result;
        public bool WasCalled { get; private set; }
        public Guid LastInputBatchId { get; private set; }
        public string? LastOperator { get; private set; }
        public StubCanonicalProjector(PacsSaleCanonicalResult result) => _result = result;
        public Task<PacsSaleCanonicalResult> ProjectAsync(
            Guid truthPromotionLoadBatchId, string operatorName,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            LastInputBatchId = truthPromotionLoadBatchId;
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }
}
