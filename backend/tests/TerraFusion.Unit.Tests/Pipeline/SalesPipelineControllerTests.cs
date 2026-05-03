using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Sync.PacsSalePipeline;
using Xunit;

namespace TerraFusion.Unit.Tests.Pipeline;

/// <summary>
/// Controller tests for <c>POST /api/sync/sales/run</c>. Covers
/// auth gating, input validation, and the doctrine of "REFUSED is
/// 200, not 400" (refusals are doctrine outcomes, not transport
/// errors — the body's Status field is the caller's signal).
/// </summary>
public sealed class SalesPipelineControllerTests
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private static SalesPipelineController BuildController(
        IPacsSaleSyncRunner runner,
        Guid? principalCountyClaim,
        string? userName = null)
    {
        var ctrl = new SalesPipelineController(
            runner, NullLogger<SalesPipelineController>.Instance);

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

    private static PacsSaleSyncRunResult CompletedResult() => new()
    {
        Status = "COMPLETED",
        TruthPromotionLoadBatchId = Guid.NewGuid(),
        TruthStatus = "COMPLETED",
        SalesConsidered = 3,
        SalesPromoted = 3,
        RejectedNotQualified = 0,
        RejectedNoSuppPointer = 0,
        RejectedStaleSupNum = 0,
        RejectedStaleAxis = 0,
        CanonicalPromotionLoadBatchId = Guid.NewGuid(),
        CanonicalStatus = "COMPLETED",
        SalesProjected = 3,
        SalesQuarantined = 0,
    };

    [Fact]
    public async Task Returns_200_OnHappyPath_WithCombinedResult()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<PacsSaleSyncRunResult>().Subject;
        body.Status.Should().Be("COMPLETED");
        body.SalesPromoted.Should().Be(3);
    }

    [Fact]
    public async Task Returns_400_WhenSaleBatchIdEmpty()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.Empty,
            SuppAssocLoadBatchId = Guid.NewGuid(),
        });

        result.Should().BeOfType<BadRequestObjectResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_400_WhenSuppBatchIdEmpty()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.Empty,
        });

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

        var result = await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
        });

        result.Should().BeOfType<ForbidResult>();
        runner.WasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_200_OnTruthRefused_WithStatusInBody()
    {
        // Doctrine: REFUSED is a recorded outcome, not a 400.
        var refusedResult = CompletedResult() with
        {
            Status = "TRUTH_REFUSED",
            TruthStatus = "REFUSED",
            SalesConsidered = 0,
            SalesPromoted = 0,
            CanonicalPromotionLoadBatchId = Guid.Empty,
            CanonicalStatus = "NOT_RUN",
            SalesProjected = 0,
            ErrorSummary = "saleBatch=FAILED",
        };
        var runner = new RecordingRunner(refusedResult);
        var ctrl = BuildController(runner, CountyA);

        var result = await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<PacsSaleSyncRunResult>().Subject;
        body.Status.Should().Be("TRUTH_REFUSED");
        body.CanonicalStatus.Should().Be("NOT_RUN");
        body.ErrorSummary.Should().Contain("saleBatch=FAILED");
    }

    [Fact]
    public async Task OperatorName_FromUserName_PassedToRunner()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA, userName: "alice@assessor");

        await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
        });

        runner.LastOperator.Should().Be("alice@assessor");
    }

    [Fact]
    public async Task OperatorName_FallsBackToCountyId_WhenUserNameMissing()
    {
        var runner = new RecordingRunner(CompletedResult());
        var ctrl = BuildController(runner, CountyA, userName: null);

        await ctrl.RunPipeline(new SalesPipelineRunRequest
        {
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
        });

        runner.LastOperator.Should().Be($"operator:{CountyA}");
    }

    private sealed class RecordingRunner : IPacsSaleSyncRunner
    {
        private readonly PacsSaleSyncRunResult _result;
        public bool WasCalled { get; private set; }
        public string? LastOperator { get; private set; }
        public RecordingRunner(PacsSaleSyncRunResult result) => _result = result;
        public Task<PacsSaleSyncRunResult> RunAsync(
            Guid saleLoadBatchId, Guid suppAssocLoadBatchId,
            string operatorName, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            LastOperator = operatorName;
            return Task.FromResult(_result);
        }
    }
}
