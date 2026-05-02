using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Sync.PacsOwnerWsdorPipeline;
using Xunit;

namespace TerraFusion.Unit.Tests.Pipeline;

/// <summary>
/// Controller tests for <c>POST /api/sync/owner-wsdor/run</c>.
/// Mirrors the SalesPipelineControllerTests pattern: auth gating,
/// input validation, and the "REFUSED is 200, not 400" doctrine.
/// </summary>
public sealed class OwnerWsdorPipelineControllerTests
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private static OwnerWsdorPipelineController BuildController(
        IPacsOwnerWsdorSyncRunner runner,
        Guid? principalCountyClaim,
        string? userName = null)
    {
        var ctrl = new OwnerWsdorPipelineController(
            runner, NullLogger<OwnerWsdorPipelineController>.Instance);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        if (!string.IsNullOrEmpty(userName))
        {
            identity.AddClaim(new Claim(ClaimTypes.Name, userName));
        }
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };
        return ctrl;
    }

    private static PacsOwnerWsdorSyncRunResult CompletedResult() => new()
    {
        Status = "COMPLETED",
        TruthOwnerLoadBatchId = Guid.NewGuid(),
        TruthOwnerStatus = "COMPLETED",
        OwnersConsidered = 5, OwnersPromoted = 5,
        OwnerRejectedNoSuppPointer = 0, OwnerRejectedStaleSupNum = 0,
        OwnerRejectedNoAccount = 0, OwnerPctCompletenessViolations = 0,
        TruthWsdorLoadBatchId = Guid.NewGuid(),
        TruthWsdorStatus = "COMPLETED",
        WsdorRowsConsidered = 5, WsdorRowsPromoted = 5,
        WsdorRejectedNoSuppPointer = 0, WsdorRejectedStaleSupNum = 0,
        CanonicalOwnerLoadBatchId = Guid.NewGuid(),
        CanonicalOwnerStatus = "COMPLETED",
        OwnersProjected = 5, LinksProjected = 5, OwnerRowsQuarantined = 0,
        CanonicalWsdorLoadBatchId = Guid.NewGuid(),
        CanonicalWsdorStatus = "COMPLETED",
        WsdorRowsProjected = 5, WsdorRowsQuarantined = 0,
        WsdorRejectedNoParcelXref = 0, WsdorRejectedNoOwnerXref = 0,
        WsdorRejectedBothMissing = 0,
    };

    private static OwnerWsdorPipelineRunRequest ValidRequest() => new()
    {
        OwnerLoadBatchId = Guid.NewGuid(),
        AccountLoadBatchId = Guid.NewGuid(),
        SuppAssocLoadBatchId = Guid.NewGuid(),
        WpovLoadBatchId = Guid.NewGuid(),
    };

    [Fact]
    public async Task Returns_200_OnHappyPath_WithCombinedResult()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(ValidRequest());

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<PacsOwnerWsdorSyncRunResult>().Subject;
        body.Status.Should().Be("COMPLETED");
        body.OwnersPromoted.Should().Be(5);
        body.WsdorRowsProjected.Should().Be(5);
    }

    [Fact]
    public async Task Returns_400_WhenOwnerBatchIdEmpty()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var req = ValidRequest() with { OwnerLoadBatchId = Guid.Empty };
        var result = await ctrl.RunPipeline(req);

        result.Should().BeOfType<BadRequestObjectResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_400_WhenAccountBatchIdEmpty()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var req = ValidRequest() with { AccountLoadBatchId = Guid.Empty };
        var result = await ctrl.RunPipeline(req);

        result.Should().BeOfType<BadRequestObjectResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_400_WhenSuppBatchIdEmpty()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var req = ValidRequest() with { SuppAssocLoadBatchId = Guid.Empty };
        var result = await ctrl.RunPipeline(req);

        result.Should().BeOfType<BadRequestObjectResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_400_WhenWpovBatchIdEmpty()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var req = ValidRequest() with { WpovLoadBatchId = Guid.Empty };
        var result = await ctrl.RunPipeline(req);

        result.Should().BeOfType<BadRequestObjectResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_400_WhenRequestBodyNull()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(null!);
        result.Should().BeOfType<BadRequestObjectResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_403_WhenCountyClaimMissing()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, principalCountyClaim: null);

        var result = await ctrl.RunPipeline(ValidRequest());

        result.Should().BeOfType<ForbidResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_200_OnTruthOwnerRefused_WithStatusInBody()
    {
        // Doctrine: REFUSED is a recorded outcome, not a 400.
        var refused = CompletedResult() with
        {
            Status = "TRUTH_OWNER_REFUSED",
            TruthOwnerStatus = "REFUSED",
            OwnersPromoted = 0,
            TruthWsdorLoadBatchId = Guid.Empty,
            TruthWsdorStatus = "NOT_RUN",
            CanonicalOwnerLoadBatchId = Guid.Empty,
            CanonicalOwnerStatus = "NOT_RUN",
            CanonicalWsdorLoadBatchId = Guid.Empty,
            CanonicalWsdorStatus = "NOT_RUN",
            ErrorSummary = "saleBatch=FAILED",
        };
        var runner = new RecordingRunner(refused);
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(ValidRequest());

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<PacsOwnerWsdorSyncRunResult>().Subject;
        body.Status.Should().Be("TRUTH_OWNER_REFUSED");
        body.TruthWsdorStatus.Should().Be("NOT_RUN");
        body.CanonicalOwnerStatus.Should().Be("NOT_RUN");
        body.CanonicalWsdorStatus.Should().Be("NOT_RUN");
    }

    [Fact]
    public async Task OperatorName_FromUserName_PassedToRunner()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA, userName: "alice@assessor");

        await ctrl.RunPipeline(ValidRequest());

        runner.LastOperator.Should().Be("alice@assessor");
    }

    [Fact]
    public async Task OperatorName_FallsBackToCountyId_WhenUserNameMissing()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA, userName: null);

        await ctrl.RunPipeline(ValidRequest());

        runner.LastOperator.Should().Be($"operator:{CountyA}");
    }

    private sealed class RecordingRunner : IPacsOwnerWsdorSyncRunner
    {
        private readonly PacsOwnerWsdorSyncRunResult _result;
        public bool WasCalled { get; private set; }
        public string? LastOperator { get; private set; }
        public RecordingRunner(PacsOwnerWsdorSyncRunResult result) => _result = result;
        public Task<PacsOwnerWsdorSyncRunResult> RunAsync(
            Guid ownerLoadBatchId, Guid accountLoadBatchId,
            Guid suppAssocLoadBatchId, Guid wpovLoadBatchId,
            string operatorName, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }
}
