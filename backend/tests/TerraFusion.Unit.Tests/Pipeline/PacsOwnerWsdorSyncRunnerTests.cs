using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Sync.PacsOwnerCanonical;
using TerraFusion.Core.Sync.PacsOwnerTruth;
using TerraFusion.Core.Sync.PacsOwnerWsdorPipeline;
using TerraFusion.Core.Sync.PacsWsdorCanonical;
using TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;
using TerraFusion.Data.Services.Pipeline;
using Xunit;

namespace TerraFusion.Unit.Tests.Pipeline;

/// <summary>
/// Block B operator-trigger orchestration tests. Stubs the four
/// stage services and exercises the runner's wiring + decision
/// logic — short-circuit on non-COMPLETED upstream, lineage of all
/// four batch ids, status-mapping per stage.
/// </summary>
public sealed class PacsOwnerWsdorSyncRunnerTests
{
    private static readonly Guid OwnerBatch = Guid.Parse("aa000000-0000-0000-0000-000000000001");
    private static readonly Guid AccountBatch = Guid.Parse("aa000000-0000-0000-0000-000000000002");
    private static readonly Guid SuppBatch = Guid.Parse("aa000000-0000-0000-0000-000000000003");
    private static readonly Guid WpovBatch = Guid.Parse("aa000000-0000-0000-0000-000000000004");

    private static PacsOwnerWsdorSyncRunner Build(
        IPacsOwnerCurrentTruthPromoter ownerTruth,
        IPacsWashPropOwnerValTruthPromoter wsdorTruth,
        IPacsOwnerCanonicalProjector ownerCanon,
        IPacsWsdorCanonicalProjector wsdorCanon)
        => new(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon,
            NullLogger<PacsOwnerWsdorSyncRunner>.Instance);

    private static PacsOwnerCurrentTruthResult OwnerTruth(string status, Guid? batchId = null)
        => new()
        {
            PromotionLoadBatchId = batchId ?? Guid.NewGuid(),
            Status = status,
            OwnersConsidered = 5,
            OwnersPromoted = status == "COMPLETED" ? 5 : 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedNoAccount = 0,
            PctCompletenessViolations = 0,
            PriorRowsRemoved = 0,
            ErrorSummary = status != "COMPLETED" ? "stub-summary" : null,
        };

    private static PacsWashPropOwnerValTruthResult WsdorTruth(string status, Guid? batchId = null)
        => new()
        {
            PromotionLoadBatchId = batchId ?? Guid.NewGuid(),
            Status = status,
            RowsConsidered = 5,
            RowsPromoted = status == "COMPLETED" ? 5 : 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            AssessedValSum = 0m,
            MarketValSum = 0m,
            PriorRowsRemoved = 0,
            ErrorSummary = status != "COMPLETED" ? "stub-summary" : null,
        };

    private static PacsOwnerCanonicalResult OwnerCanonical(string status, Guid? batchId = null)
        => new()
        {
            PromotionLoadBatchId = batchId ?? Guid.NewGuid(),
            Status = status,
            TruthRowsConsidered = 5,
            OwnersProjected = status == "COMPLETED" ? 5 : 0,
            LinksProjected = status == "COMPLETED" ? 5 : 0,
            RowsQuarantined = 0,
            PriorOwnersRemoved = 0,
            PriorLinksRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
            ErrorSummary = status != "COMPLETED" ? "stub-summary" : null,
        };

    private static PacsWsdorCanonicalResult WsdorCanonical(string status, Guid? batchId = null)
        => new()
        {
            PromotionLoadBatchId = batchId ?? Guid.NewGuid(),
            Status = status,
            TruthRowsConsidered = 5,
            RowsProjected = status == "COMPLETED" ? 5 : 0,
            RowsQuarantined = 0,
            RejectedNoParcelXref = 0,
            RejectedNoOwnerXref = 0,
            RejectedBothMissing = 0,
            PriorRowsRemoved = 0,
            PriorQuarantineRowsRemoved = 0,
            ErrorSummary = status != "COMPLETED" ? "stub-summary" : null,
        };

    [Fact]
    public async Task AllFourStagesCompleted_ReturnsCombinedSuccess()
    {
        var truthOwnerBatch = Guid.NewGuid();
        var truthWsdorBatch = Guid.NewGuid();
        var canonOwnerBatch = Guid.NewGuid();
        var canonWsdorBatch = Guid.NewGuid();

        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth("COMPLETED", truthOwnerBatch));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth("COMPLETED", truthWsdorBatch));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical("COMPLETED", canonOwnerBatch));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical("COMPLETED", canonWsdorBatch));

        var result = await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "op-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthOwnerLoadBatchId.Should().Be(truthOwnerBatch);
        result.TruthWsdorLoadBatchId.Should().Be(truthWsdorBatch);
        result.CanonicalOwnerLoadBatchId.Should().Be(canonOwnerBatch);
        result.CanonicalWsdorLoadBatchId.Should().Be(canonWsdorBatch);

        wsdorCanon.LastInputBatchId.Should().Be(truthWsdorBatch,
            "stage 4 takes the truth-wsdor batch id (from stage 2)");
        ownerCanon.LastInputBatchId.Should().Be(truthOwnerBatch,
            "stage 3 takes the truth-owner batch id (from stage 1)");
    }

    [Theory]
    [InlineData("REFUSED", "TRUTH_OWNER_REFUSED")]
    [InlineData("FAILED", "TRUTH_OWNER_FAILED")]
    public async Task TruthOwnerNonCompleted_ShortCircuits_Stages2Through4NotRun(
        string ownerTruthStatus, string expectedStatus)
    {
        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth(ownerTruthStatus));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth("COMPLETED"));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical("COMPLETED"));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical("COMPLETED"));

        var result = await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "op-test");

        result.Status.Should().Be(expectedStatus);
        result.TruthWsdorStatus.Should().Be("NOT_RUN");
        result.CanonicalOwnerStatus.Should().Be("NOT_RUN");
        result.CanonicalWsdorStatus.Should().Be("NOT_RUN");

        wsdorTruth.WasCalled.Should().BeFalse();
        ownerCanon.WasCalled.Should().BeFalse();
        wsdorCanon.WasCalled.Should().BeFalse();
    }

    [Theory]
    [InlineData("REFUSED", "TRUTH_WSDOR_REFUSED")]
    [InlineData("FAILED", "TRUTH_WSDOR_FAILED")]
    public async Task TruthWsdorNonCompleted_ShortCircuits_Stages3Through4NotRun(
        string wsdorTruthStatus, string expectedStatus)
    {
        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth("COMPLETED"));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth(wsdorTruthStatus));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical("COMPLETED"));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical("COMPLETED"));

        var result = await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "op-test");

        result.Status.Should().Be(expectedStatus);
        result.CanonicalOwnerStatus.Should().Be("NOT_RUN");
        result.CanonicalWsdorStatus.Should().Be("NOT_RUN");

        wsdorTruth.WasCalled.Should().BeTrue();
        ownerCanon.WasCalled.Should().BeFalse();
        wsdorCanon.WasCalled.Should().BeFalse();
    }

    [Theory]
    [InlineData("REFUSED", "CANONICAL_OWNER_REFUSED")]
    [InlineData("FAILED", "CANONICAL_OWNER_FAILED")]
    public async Task CanonicalOwnerNonCompleted_ShortCircuits_Stage4NotRun(
        string ownerCanonStatus, string expectedStatus)
    {
        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth("COMPLETED"));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth("COMPLETED"));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical(ownerCanonStatus));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical("COMPLETED"));

        var result = await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "op-test");

        result.Status.Should().Be(expectedStatus);
        result.CanonicalWsdorStatus.Should().Be("NOT_RUN");

        ownerCanon.WasCalled.Should().BeTrue();
        wsdorCanon.WasCalled.Should().BeFalse(
            "B4 cannot run unless B3 completed (B4's owner xref index needs B3's writes)");
    }

    [Theory]
    [InlineData("REFUSED", "CANONICAL_WSDOR_REFUSED")]
    [InlineData("FAILED", "CANONICAL_WSDOR_FAILED")]
    public async Task CanonicalWsdorNonCompleted_ReportsTopLevelStatus(
        string wsdorCanonStatus, string expectedStatus)
    {
        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth("COMPLETED"));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth("COMPLETED"));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical("COMPLETED"));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical(wsdorCanonStatus));

        var result = await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "op-test");

        result.Status.Should().Be(expectedStatus);
        result.CanonicalWsdorStatus.Should().Be(wsdorCanonStatus);

        // Stages 1-3 still completed and reported.
        result.TruthOwnerStatus.Should().Be("COMPLETED");
        result.TruthWsdorStatus.Should().Be("COMPLETED");
        result.CanonicalOwnerStatus.Should().Be("COMPLETED");
    }

    [Fact]
    public async Task OperatorName_FlowsToAllFourStages()
    {
        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth("COMPLETED"));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth("COMPLETED"));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical("COMPLETED"));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical("COMPLETED"));

        await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "alice@assessor");

        ownerTruth.LastOperator.Should().Be("alice@assessor");
        wsdorTruth.LastOperator.Should().Be("alice@assessor");
        ownerCanon.LastOperator.Should().Be("alice@assessor");
        wsdorCanon.LastOperator.Should().Be("alice@assessor");
    }

    [Fact]
    public async Task ErrorSummary_PropagatesFrom_FirstFailedStage()
    {
        var ownerTruth = new StubOwnerTruthPromoter(OwnerTruth("FAILED"));
        var wsdorTruth = new StubWsdorTruthPromoter(WsdorTruth("COMPLETED"));
        var ownerCanon = new StubOwnerCanonicalProjector(OwnerCanonical("COMPLETED"));
        var wsdorCanon = new StubWsdorCanonicalProjector(WsdorCanonical("COMPLETED"));

        var result = await Build(ownerTruth, wsdorTruth, ownerCanon, wsdorCanon)
            .RunAsync(OwnerBatch, AccountBatch, SuppBatch, WpovBatch, "op-test");

        result.ErrorSummary.Should().Be("stub-summary",
            "the truth-owner stage's error summary surfaces");
    }

    // ── Stubs ──────────────────────────────────────────────────────

    private sealed class StubOwnerTruthPromoter : IPacsOwnerCurrentTruthPromoter
    {
        private readonly PacsOwnerCurrentTruthResult _result;
        public string? LastOperator { get; private set; }
        public StubOwnerTruthPromoter(PacsOwnerCurrentTruthResult result) => _result = result;
        public Task<PacsOwnerCurrentTruthResult> PromoteAsync(
            Guid ownerLoadBatchId, Guid accountLoadBatchId, Guid suppAssocLoadBatchId,
            string operatorName, CancellationToken cancellationToken = default)
        {
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }

    private sealed class StubWsdorTruthPromoter : IPacsWashPropOwnerValTruthPromoter
    {
        private readonly PacsWashPropOwnerValTruthResult _result;
        public bool WasCalled { get; private set; }
        public string? LastOperator { get; private set; }
        public StubWsdorTruthPromoter(PacsWashPropOwnerValTruthResult result) => _result = result;
        public Task<PacsWashPropOwnerValTruthResult> PromoteAsync(
            Guid wpovLoadBatchId, Guid suppAssocLoadBatchId,
            string operatorName, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }

    private sealed class StubOwnerCanonicalProjector : IPacsOwnerCanonicalProjector
    {
        private readonly PacsOwnerCanonicalResult _result;
        public bool WasCalled { get; private set; }
        public Guid LastInputBatchId { get; private set; }
        public string? LastOperator { get; private set; }
        public StubOwnerCanonicalProjector(PacsOwnerCanonicalResult result) => _result = result;
        public Task<PacsOwnerCanonicalResult> ProjectAsync(
            Guid truthPromotionLoadBatchId, string operatorName,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            LastInputBatchId = truthPromotionLoadBatchId;
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }

    private sealed class StubWsdorCanonicalProjector : IPacsWsdorCanonicalProjector
    {
        private readonly PacsWsdorCanonicalResult _result;
        public bool WasCalled { get; private set; }
        public Guid LastInputBatchId { get; private set; }
        public string? LastOperator { get; private set; }
        public StubWsdorCanonicalProjector(PacsWsdorCanonicalResult result) => _result = result;
        public Task<PacsWsdorCanonicalResult> ProjectAsync(
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
