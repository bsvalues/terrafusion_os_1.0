// =============================================================================
// Phase 40B: Azure OpenAI Explainer Integration Tests
// =============================================================================
// Tests for the enrichment service with various LLM response scenarios.
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
/// Integration-style tests for Azure OpenAI runbook explanation service.
/// Verifies full enrichment flow with mocked HTTP responses.
/// </summary>
[Trait("Category", "Phase40B")]
[Trait("Category", "AzureOpenAI")]
public class AzureOpenAiExplainerTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    // =========================================================================
    // SECTION A: Successful Enrichment Flow
    // =========================================================================

    [Fact]
    [Trait("Category", "EnrichmentFlow")]
    public async Task EnrichAsync_SuccessfulEnrichment_UpdatesTitlesAndDescriptions()
    {
        // Arrange
        var enrichedSteps = new[]
        {
            new
            {
                StepId = "STEP-000001",
                Title = "📊 Monitor Atlas Forecaster Dashboard",
                Description = "Navigate to the Atlas dashboard to verify the current status of the forecaster service. Check for any warning indicators, stale data flags, or connectivity issues that may indicate why forecasts are not being generated."
            },
            new
            {
                StepId = "STEP-000002",
                Title = "⚙️ Review Pipeline Configuration Settings",
                Description = "Examine the forecaster pipeline configuration to ensure all data sources are properly connected, refresh intervals are correctly set, and there are no misconfigurations in the prediction model parameters."
            },
            new
            {
                StepId = "STEP-000003",
                Title = "🔄 Restart Forecaster Service (High-Risk)",
                Description = "If diagnostic steps indicate a service-level issue rather than a configuration problem, perform a controlled restart of the forecaster service. This should only be done after confirming active jobs can be safely interrupted."
            }
        };

        var (service, handler) = CreateServiceWithEnrichedResponse(enrichedSteps);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Titles and descriptions should be enriched
        result.Steps[0].Title.Should().Contain("📊", "first step should have enriched title with emoji");
        result.Steps[0].Description.Should().Contain("forecaster service", "description should be enriched");
        result.Steps[1].Title.Should().Contain("⚙️", "second step should have enriched title");
        result.Steps[2].Title.Should().Contain("High-Risk", "third step should note risk level");

        // Assert - Immutable fields preserved
        result.Steps[0].SafetyLevel.Should().Be(RunbookSafetyLevel.InfoOnly);
        result.Steps[2].SafetyLevel.Should().Be(RunbookSafetyLevel.HighRisk);
    }

    [Fact]
    [Trait("Category", "EnrichmentFlow")]
    public async Task EnrichAsync_LLMCallsMadeWithCorrectEndpoint()
    {
        // Arrange
        var (service, handler) = CreateServiceWithEnrichedResponse(CreateDefaultEnrichedSteps());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Verify HTTP request made correctly
        handler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(req =>
                req.Method == HttpMethod.Post &&
                req.RequestUri!.ToString().Contains("openai.azure.com") &&
                req.RequestUri.ToString().Contains("chat/completions")),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    [Trait("Category", "EnrichmentFlow")]
    public async Task EnrichAsync_LLMRequestIncludesApiKey()
    {
        // Arrange
        var (service, handler) = CreateServiceWithEnrichedResponse(CreateDefaultEnrichedSteps());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Verify API key header
        handler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(req =>
                req.Headers.Contains("api-key")),
            ItExpr.IsAny<CancellationToken>());
    }

    // =========================================================================
    // SECTION B: Prompt Content Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "PromptContent")]
    public async Task EnrichAsync_PromptIncludesIncidentContext()
    {
        // Arrange
        HttpRequestMessage? capturedRequest = null;
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(CreateSuccessResponse(CreateDefaultEnrichedSteps()));

        var httpClient = new HttpClient(handler.Object);
        var options = CreateDefaultOptions();
        var service = new AzureOpenAiRunbookExplanationService(
            httpClient, options, Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>());

        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        incident = incident with { Title = "Test Incident: Forecaster Stale for Benton County" };

        // Act
        await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        capturedRequest.Should().NotBeNull();
        var content = await capturedRequest!.Content!.ReadAsStringAsync();
        content.Should().Contain("Forecaster", "prompt should include incident title");
    }

    [Fact]
    [Trait("Category", "PromptContent")]
    public async Task EnrichAsync_PromptIncludesAllSteps()
    {
        // Arrange
        HttpRequestMessage? capturedRequest = null;
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(CreateSuccessResponse(CreateDefaultEnrichedSteps()));

        var httpClient = new HttpClient(handler.Object);
        var options = CreateDefaultOptions();
        var service = new AzureOpenAiRunbookExplanationService(
            httpClient, options, Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>());

        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        capturedRequest.Should().NotBeNull();
        var content = await capturedRequest!.Content!.ReadAsStringAsync();
        content.Should().Contain("STEP-000001");
        content.Should().Contain("STEP-000002");
        content.Should().Contain("STEP-000003");
    }

    // =========================================================================
    // SECTION C: Response Parsing Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "ResponseParsing")]
    public async Task EnrichAsync_HandlesMarkdownWrappedJson()
    {
        // Arrange - LLM returns JSON wrapped in markdown code block
        var steps = CreateDefaultEnrichedSteps();
        var content = $"Here is the enriched JSON:\n\n```json\n{JsonSerializer.Serialize(steps)}\n```\n\nI hope this helps!";
        var response = new
        {
            choices = new[]
            {
                new { message = new { content = content } }
            }
        };

        var (service, _) = CreateServiceWithMockResponse(JsonSerializer.Serialize(response));
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Should parse successfully despite markdown wrapper
        result.Steps.Should().HaveCount(3);
    }

    [Fact]
    [Trait("Category", "ResponseParsing")]
    public async Task EnrichAsync_HandlesUnwrappedJsonArray()
    {
        // Arrange - LLM returns raw JSON array without code block
        var (service, _) = CreateServiceWithEnrichedResponse(CreateDefaultEnrichedSteps());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Steps.Should().HaveCount(3);
    }

    // =========================================================================
    // SECTION D: Options Configuration Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task Options_IsConfiguredForAzureOpenAi_TrueWhenAllSet()
    {
        // Arrange
        var options = new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-key"
        };

        // Assert
        options.IsConfiguredForAzureOpenAi.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task Options_IsConfiguredForAzureOpenAi_FalseWhenEndpointMissing()
    {
        // Arrange
        var options = new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-key"
        };

        // Assert
        options.IsConfiguredForAzureOpenAi.Should().BeFalse();
    }

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task Options_IsConfiguredForAzureOpenAi_FalseWhenDeploymentMissing()
    {
        // Arrange
        var options = new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "",
            AzureOpenAiApiKey = "test-key"
        };

        // Assert
        options.IsConfiguredForAzureOpenAi.Should().BeFalse();
    }

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task Options_IsConfiguredForAzureOpenAi_FalseWhenApiKeyMissing()
    {
        // Arrange
        var options = new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = ""
        };

        // Assert
        options.IsConfiguredForAzureOpenAi.Should().BeFalse();
    }

    [Fact]
    [Trait("Category", "Configuration")]
    public async Task Options_DefaultValues_AreReasonable()
    {
        // Arrange
        var options = new RunbookExplanationOptions();

        // Assert
        options.MaxTokens.Should().Be(2000, "default max tokens should be 2000");
        options.Temperature.Should().BeApproximately(0.3, 0.01, "default temperature should be 0.3 for consistency");
        options.Timeout.Should().Be(TimeSpan.FromSeconds(30), "default timeout should be 30 seconds");
    }

    // =========================================================================
    // SECTION E: Concurrency and Multiple Calls
    // =========================================================================

    [Fact]
    [Trait("Category", "Concurrency")]
    public async Task EnrichAsync_MultipleCallsAreIndependent()
    {
        // Arrange
        var enrichedSteps1 = new[]
        {
            new { StepId = "STEP-000001", Title = "Plan1 Step1", Description = "Plan1 Description1" },
            new { StepId = "STEP-000002", Title = "Plan1 Step2", Description = "Plan1 Description2" },
            new { StepId = "STEP-000003", Title = "Plan1 Step3", Description = "Plan1 Description3" }
        };

        var enrichedSteps2 = new[]
        {
            new { StepId = "STEP-000001", Title = "Plan2 Step1", Description = "Plan2 Description1" },
            new { StepId = "STEP-000002", Title = "Plan2 Step2", Description = "Plan2 Description2" },
            new { StepId = "STEP-000003", Title = "Plan2 Step3", Description = "Plan2 Description3" }
        };

        var callCount = 0;
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() =>
            {
                var steps = Interlocked.Increment(ref callCount) == 1 ? enrichedSteps1 : enrichedSteps2;
                return CreateSuccessResponse(steps);
            });

        var httpClient = new HttpClient(handler.Object);
        var options = CreateDefaultOptions();
        var service = new AzureOpenAiRunbookExplanationService(
            httpClient, options, Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>());

        var plan1 = CreateSamplePlan();
        var plan2 = CreateSamplePlan();
        var incident1 = CreateSampleIncident();
        var incident2 = CreateSampleIncident();

        // Act
        var result1 = await service.EnrichWithExplanationAsync(plan1, incident1);
        var result2 = await service.EnrichWithExplanationAsync(plan2, incident2);

        // Assert - Results should be from different calls
        result1.Steps[0].Title.Should().Contain("Plan1");
        result2.Steps[0].Title.Should().Contain("Plan2");
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static IOptions<RunbookExplanationOptions> CreateDefaultOptions()
    {
        return Options.Create(new RunbookExplanationOptions
        {
            Enabled = true,
            AzureOpenAiEndpoint = "https://test.openai.azure.com/",
            AzureOpenAiDeploymentName = "gpt-4o",
            AzureOpenAiApiKey = "test-api-key",
            MaxTokens = 2000,
            Temperature = 0.3,
            Timeout = TimeSpan.FromSeconds(30)
        });
    }

    private static object[] CreateDefaultEnrichedSteps()
    {
        return new object[]
        {
            new { StepId = "STEP-000001", Title = "Enriched Step 1", Description = "Enriched Description 1" },
            new { StepId = "STEP-000002", Title = "Enriched Step 2", Description = "Enriched Description 2" },
            new { StepId = "STEP-000003", Title = "Enriched Step 3", Description = "Enriched Description 3" }
        };
    }

    private static HttpResponseMessage CreateSuccessResponse(object[] steps)
    {
        var response = new
        {
            choices = new[]
            {
                new { message = new { content = JsonSerializer.Serialize(steps) } }
            }
        };

        return new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent(JsonSerializer.Serialize(response))
        };
    }

    private static (AzureOpenAiRunbookExplanationService service, Mock<HttpMessageHandler> handler)
        CreateServiceWithEnrichedResponse(object[] enrichedSteps)
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(CreateSuccessResponse(enrichedSteps));

        var httpClient = new HttpClient(handler.Object);
        var options = CreateDefaultOptions();
        var logger = Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>();

        var service = new AzureOpenAiRunbookExplanationService(httpClient, options, logger);
        return (service, handler);
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
        var options = CreateDefaultOptions();
        var logger = Mock.Of<ILogger<AzureOpenAiRunbookExplanationService>>();

        var service = new AzureOpenAiRunbookExplanationService(httpClient, options, logger);
        return (service, handler);
    }

    private static IncidentSummary CreateSampleIncident()
    {
        return new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Test Incident: Forecaster Issues",
            Description = "Test incident for Azure OpenAI explainer tests",
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
