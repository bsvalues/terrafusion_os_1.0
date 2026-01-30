// =============================================================================
// Phase 40B: Runbook Explainer Error Handling Tests
// =============================================================================
// Tests for graceful degradation when LLM service is unavailable or returns errors.
// =============================================================================

using Xunit;
using FluentAssertions;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;

namespace TerraFusion.Unit.Tests.Phase40B;

/// <summary>
/// Tests verifying error handling and graceful degradation for runbook explanation service.
/// On any error, the original plan MUST be returned unchanged.
/// </summary>
[Trait("Category", "Phase40B")]
[Trait("Category", "ErrorHandling")]
public class RunbookExplainerErrorHandlingTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    // =========================================================================
    // SECTION A: Service Disabled/Unconfigured
    // =========================================================================

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task EnrichAsync_WhenServiceDisabled_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var options = Options.Create(new RunbookExplanationOptions
        {
            Enabled = false
        });
        var service = CreateServiceWithOptions(options);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Plan should be returned exactly as-is
        result.Should().BeSameAs(plan, "disabled service should return original plan");
    }

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task EnrichAsync_WhenApiKeyMissing_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var options = Options.Create(new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "", // Missing
        });
        var service = CreateServiceWithOptions(options);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeSameAs(plan, "unconfigured service should return original plan");
    }

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task EnrichAsync_WhenEndpointMissing_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var options = Options.Create(new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "", // Missing
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-key",
        });
        var service = CreateServiceWithOptions(options);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeSameAs(plan, "unconfigured service should return original plan");
    }

    // =========================================================================
    // SECTION B: HTTP Error Responses
    // =========================================================================

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden)]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.BadGateway)]
    [Trait("Category", "HttpErrors")]
    public async Task EnrichAsync_WhenApiReturnsError_ReturnsOriginalPlanUnchanged(HttpStatusCode statusCode)
    {
        // Arrange
        var (service, _) = CreateServiceWithErrorResponse(statusCode);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalPlanJson = JsonSerializer.Serialize(plan);

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        var resultJson = JsonSerializer.Serialize(result);
        resultJson.Should().Be(originalPlanJson,
            $"HTTP {(int)statusCode} should return original plan unchanged");
    }

    [Fact]
    [Trait("Category", "HttpErrors")]
    public async Task EnrichAsync_WhenRateLimited_ReturnsOriginalPlanUnchanged()
    {
        // Arrange - Azure returns 429 with Retry-After
        var (service, _) = CreateServiceWithErrorResponse(
            HttpStatusCode.TooManyRequests,
            "{\"error\": {\"code\": \"429\", \"message\": \"Rate limited\"}}");
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.PlanId.Should().Be(plan.PlanId, "rate limited response should preserve original");
        result.Steps.Count.Should().Be(plan.Steps.Count, "step count should be preserved");
    }

    // =========================================================================
    // SECTION C: Malformed Responses
    // =========================================================================

    [Fact]
    [Trait("Category", "MalformedResponse")]
    public async Task EnrichAsync_WhenResponseNotJson_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse("This is not JSON at all!");
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan, "malformed response should return original plan");
    }

    [Fact]
    [Trait("Category", "MalformedResponse")]
    public async Task EnrichAsync_WhenResponseMissingChoices_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var response = JsonSerializer.Serialize(new { id = "123", model = "gpt-4o" });
        var (service, _) = CreateServiceWithMockResponse(response);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan, "response without choices should return original plan");
    }

    [Fact]
    [Trait("Category", "MalformedResponse")]
    public async Task EnrichAsync_WhenContentNotStepsArray_ReturnsOriginalPlanUnchanged()
    {
        // Arrange - Content is not an array of steps
        var response = CreateAzureResponse("{ \"foo\": \"bar\" }");
        var (service, _) = CreateServiceWithMockResponse(response);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan, "invalid content format should return original plan");
    }

    [Fact]
    [Trait("Category", "MalformedResponse")]
    public async Task EnrichAsync_WhenStepCountMismatch_ReturnsOriginalPlanUnchanged()
    {
        // Arrange - LLM returns wrong number of steps (should be caught as error)
        var steps = new[]
        {
            new { StepId = "STEP-000001", Title = "Only One Step", Description = "Missing other steps" }
        };
        var response = CreateAzureResponse(JsonSerializer.Serialize(steps));
        var (service, _) = CreateServiceWithMockResponse(response);
        var plan = CreateSamplePlan(); // Has 3 steps
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Should still preserve original since merge by StepId
        result.Steps.Count.Should().Be(3, "original step count should be preserved");
    }

    // =========================================================================
    // SECTION D: Network/Timeout Errors
    // =========================================================================

    [Fact]
    [Trait("Category", "NetworkErrors")]
    public async Task EnrichAsync_WhenNetworkException_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var (service, _) = CreateServiceWithException(new HttpRequestException("Network unreachable"));
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan, "network exception should return original plan");
    }

    [Fact]
    [Trait("Category", "NetworkErrors")]
    public async Task EnrichAsync_WhenTaskCanceled_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var (service, _) = CreateServiceWithException(new TaskCanceledException("Operation timed out"));
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan, "timeout should return original plan");
    }

    [Fact]
    [Trait("Category", "NetworkErrors")]
    public async Task EnrichAsync_WhenOperationCanceled_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var (service, _) = CreateServiceWithException(new OperationCanceledException("Cancelled"));
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan, "cancellation should return original plan");
    }

    // =========================================================================
    // SECTION E: Edge Cases
    // =========================================================================

    [Fact]
    [Trait("Category", "EdgeCases")]
    public async Task EnrichAsync_WhenPlanHasNoSteps_ReturnsOriginalPlanUnchanged()
    {
        // Arrange
        var response = CreateAzureResponse("[]");
        var (service, _) = CreateServiceWithMockResponse(response);
        var plan = CreateSamplePlan();
        plan = plan with { Steps = new List<RunbookStep>() };
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Steps.Should().BeEmpty();
        result.PlanId.Should().Be(plan.PlanId);
    }

    [Fact]
    [Trait("Category", "EdgeCases")]
    public async Task EnrichAsync_WhenResponseContainsCodeBlock_ParsesCorrectly()
    {
        // Arrange - LLM sometimes wraps JSON in markdown code blocks
        var steps = new[]
        {
            new { StepId = "STEP-000001", Title = "Title 1", Description = "Description 1" },
            new { StepId = "STEP-000002", Title = "Title 2", Description = "Description 2" },
            new { StepId = "STEP-000003", Title = "Title 3", Description = "Description 3" }
        };
        var content = $"```json\n{JsonSerializer.Serialize(steps)}\n```";
        var response = CreateAzureResponse(content);
        var (service, _) = CreateServiceWithMockResponse(response);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Should successfully parse despite code block wrapper
        result.Steps.Should().HaveCount(3);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static AzureOpenAiRunbookExplanationService CreateServiceWithOptions(
        IOptions<RunbookExplanationOptions> options)
    {
        var handler = new Mock<HttpMessageHandler>();
        var httpClient = new HttpClient(handler.Object);
        var logger = Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>();
        return new AzureOpenAiRunbookExplanationService(httpClient, options, logger);
    }

    private static (AzureOpenAiRunbookExplanationService service, Mock<HttpMessageHandler> handler)
        CreateServiceWithMockResponse(string responseJson)
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(responseJson)
            });

        var httpClient = new HttpClient(handler.Object);
        var options = Options.Create(new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-api-key",
            MaxTokens = 2000,
            Temperature = 0.3,
            Timeout = TimeSpan.FromSeconds(30)
        });
        var logger = Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>();

        var service = new AzureOpenAiRunbookExplanationService(httpClient, options, logger);
        return (service, handler);
    }

    private static (AzureOpenAiRunbookExplanationService service, Mock<HttpMessageHandler> handler)
        CreateServiceWithErrorResponse(HttpStatusCode statusCode, string? body = null)
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(body ?? "{\"error\": \"test error\"}")
            });

        var httpClient = new HttpClient(handler.Object);
        var options = Options.Create(new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-api-key",
            MaxTokens = 2000,
            Temperature = 0.3,
            Timeout = TimeSpan.FromSeconds(30)
        });
        var logger = Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>();

        var service = new AzureOpenAiRunbookExplanationService(httpClient, options, logger);
        return (service, handler);
    }

    private static (AzureOpenAiRunbookExplanationService service, Mock<HttpMessageHandler> handler)
        CreateServiceWithException(Exception exception)
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(exception);

        var httpClient = new HttpClient(handler.Object);
        var options = Options.Create(new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-api-key",
            MaxTokens = 2000,
            Temperature = 0.3,
            Timeout = TimeSpan.FromSeconds(30)
        });
        var logger = Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>();

        var service = new AzureOpenAiRunbookExplanationService(httpClient, options, logger);
        return (service, handler);
    }

    private static string CreateAzureResponse(string content)
    {
        var response = new
        {
            choices = new[]
            {
                new
                {
                    message = new
                    {
                        content = content
                    }
                }
            }
        };

        return JsonSerializer.Serialize(response);
    }

    private static IncidentSummary CreateSampleIncident()
    {
        return new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Test Incident: Forecaster Issues",
            Description = "Test incident for error handling tests",
            OverallSeverity = IncidentSeverity.Warning,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastStale",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "warning"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = $"AtlasForecastStale-{Guid.NewGuid():N}"
                }
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };
    }

    private static RunbookPlan CreateSamplePlan()
    {
        var incidentId = Guid.NewGuid();
        return new RunbookPlan
        {
            PlanId = $"RUNBOOK-{incidentId:N}",
            IncidentId = incidentId,
            Title = "Test Plan: Forecaster Issues",
            Description = "Runbook for handling forecaster-related alerts",
            PlanVersion = "runbook-spec-v1.0.0",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Steps = new List<RunbookStep>
            {
                new RunbookStep
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Check Atlas Dashboard",
                    Description = "Navigate to Atlas dashboard and verify forecaster status",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = true,
                    CanBeSuggestedForAutomation = false,
                    SuggestedOwnerRole = "SRE Engineer",
                    RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                    RelatedMetricNames = new List<string> { "atlas_forecast_age_minutes" }
                },
                new RunbookStep
                {
                    StepId = "STEP-000002",
                    Order = 2,
                    Title = "Review Pipeline Configuration",
                    Description = "Check forecaster pipeline configuration",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = true,
                    CanBeSuggestedForAutomation = false,
                    SuggestedOwnerRole = "DevOps Engineer",
                    RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                    RelatedMetricNames = new List<string>()
                },
                new RunbookStep
                {
                    StepId = "STEP-000003",
                    Order = 3,
                    Title = "Restart Forecaster Service",
                    Description = "If diagnostics indicate service issue, restart the forecaster",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.HighRisk,
                    RequiresHumanApproval = true,
                    CanBeSuggestedForAutomation = false,
                    SuggestedOwnerRole = "Senior SRE",
                    RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                    RelatedMetricNames = new List<string>()
                }
            },
            CreatedAt = BaseTime,
            AuditInfo = new RunbookAuditInfo
            {
                EngineVersion = "1.0.0-test",
                GenerationDurationMs = 42,
                AppliedTemplates = new List<string> { "AtlasForecastStale" }
            }
        };
    }
}
