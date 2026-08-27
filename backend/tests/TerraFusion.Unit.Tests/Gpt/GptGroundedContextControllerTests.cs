using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services.Gpt;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedContextControllerTests
{
    [Fact]
    public async Task AuthenticatedRouteInvokesCanonicalConsumerWithClaimCounty()
    {
        var request = Request();
        var result = new GptGroundedContextResult
        {
            SchemaVersion = "1.0.0",
            CountyId = "42",
            DatasetKey = "rag-dataset:7",
            Status = "NO_RELEVANT_CONTEXT",
            Citations = Array.Empty<GptGroundedCitation>(),
            TraceId = "trace-controller-001",
        };
        var consumer = new Mock<IGptGroundedContextConsumer>(MockBehavior.Strict);
        consumer.Setup(candidate => candidate.ConsumeAsync(
                request,
                42,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GptGroundedContextConsumption(
                true,
                GptGroundedContextConsumerFailure.None,
                result,
                Array.Empty<GptGroundedContextViolation>(),
                "module",
                "module",
                "schema",
                "schema",
                null));
        var controller = Controller(consumer.Object);

        var response = await controller.GetGroundedContext(request);

        var ok = response.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(result);
        consumer.VerifyAll();
    }

    [Fact]
    public async Task DisabledRuntimeReturnsUnavailableWithoutCallingRagOrProvider()
    {
        var controller = Controller(groundedContextConsumer: null);

        var response = await controller.GetGroundedContext(Request());

        response.Result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task MissingCountyClaimReturnsCanonicalCountyContextDenial()
    {
        var request = Request();
        var denial = new GptGroundedContextResult
        {
            SchemaVersion = "1.0.0",
            CountyId = request.CountyId,
            DatasetKey = request.DatasetKey,
            Status = "DENIED",
            DenialCode = "COUNTY_CONTEXT_MISSING",
            Citations = Array.Empty<GptGroundedCitation>(),
            TraceId = request.TraceId,
        };
        var consumer = new Mock<IGptGroundedContextConsumer>(MockBehavior.Strict);
        consumer.Setup(candidate => candidate.ConsumeAsync(
                request,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GptGroundedContextConsumption(
                true,
                GptGroundedContextConsumerFailure.None,
                denial,
                Array.Empty<GptGroundedContextViolation>(),
                "module",
                "module",
                "schema",
                "schema",
                null));
        var controller = Controller(consumer.Object, includeCountyClaim: false);

        var response = await controller.GetGroundedContext(request);

        response.Result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeSameAs(denial);
        consumer.VerifyAll();
    }

    private static GPTController Controller(
        IGptGroundedContextConsumer? groundedContextConsumer,
        bool includeCountyClaim = true)
    {
        var controller = new GPTController(
            Mock.Of<IGPTConfigurationService>(),
            Mock.Of<IGPTOrchestrationService>(),
            Mock.Of<IRAGService>(),
            NullLogger<GPTController>.Instance,
            groundedContextConsumer: groundedContextConsumer);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    includeCountyClaim
                        ? new[] { new Claim("CountyId", "42") }
                        : Array.Empty<Claim>(),
                    "unit-test")),
            },
        };
        return controller;
    }

    private static GptGroundedContextRequest Request() => new()
    {
        SchemaVersion = "1.0.0",
        CountyId = "42",
        DatasetKey = "rag-dataset:7",
        QueryText = "How is this classified?",
        TopK = 2,
        ScoreThreshold = 0.7m,
        TraceId = "trace-controller-001",
    };
}
