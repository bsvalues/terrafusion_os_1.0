// =============================================================================
// Phase 40B: Runbook Explainer Immutability Tests
// =============================================================================
// EXPLAINER SPEC LOCK v1.0.0
// Tests that verify LLM cannot modify immutable fields.
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
/// Tests verifying immutability constraints for runbook explanation service.
/// EXPLAINER SPEC LOCK v1.0.0 - LLM is narrator only.
/// </summary>
[Trait("Category", "Phase40B")]
[Trait("Category", "Immutability")]
public class RunbookExplainerImmutabilityTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    // =========================================================================
    // SECTION A: Plan-Level Immutability
    // =========================================================================

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesPlanId()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalPlanId = plan.PlanId;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.PlanId.Should().Be(originalPlanId, "PlanId is immutable");
    }

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesIncidentId()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalIncidentId = plan.IncidentId;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.IncidentId.Should().Be(originalIncidentId, "IncidentId is immutable");
    }

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesSeverity()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalSeverity = plan.OverallSeverity;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.OverallSeverity.Should().Be(originalSeverity, "OverallSeverity is immutable");
    }

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesPlanVersion()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalVersion = plan.PlanVersion;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.PlanVersion.Should().Be(originalVersion, "PlanVersion is immutable");
    }

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesImpactedCountyIds()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalCountyIds = plan.ImpactedCountyIds.ToList();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.ImpactedCountyIds.Should().BeEquivalentTo(originalCountyIds, "ImpactedCountyIds is immutable");
    }

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesCreatedAt()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalCreatedAt = plan.CreatedAt;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.CreatedAt.Should().Be(originalCreatedAt, "CreatedAt is immutable");
    }

    [Fact]
    [Trait("Category", "PlanImmutability")]
    public async Task EnrichAsync_PreservesAuditInfo()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.AuditInfo.Should().BeEquivalentTo(plan.AuditInfo, "AuditInfo is immutable");
    }

    // =========================================================================
    // SECTION B: Step-Level Immutability
    // =========================================================================

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesStepCount()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalStepCount = plan.Steps.Count;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Steps.Should().HaveCount(originalStepCount, "Step count must be preserved");
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesAllStepIds()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalStepIds = plan.Steps.Select(s => s.StepId).ToList();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        var resultStepIds = result.Steps.Select(s => s.StepId).ToList();
        resultStepIds.Should().BeEquivalentTo(originalStepIds, "StepIds are immutable");
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesAllSafetyLevels()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalSafetyLevels = plan.Steps.Select(s => (s.StepId, s.SafetyLevel)).ToList();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        foreach (var (stepId, expectedLevel) in originalSafetyLevels)
        {
            var resultStep = result.Steps.First(s => s.StepId == stepId);
            resultStep.SafetyLevel.Should().Be(expectedLevel,
                $"SafetyLevel for step {stepId} is immutable");
        }
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesAllStepKinds()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalKinds = plan.Steps.Select(s => (s.StepId, s.Kind)).ToList();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        foreach (var (stepId, expectedKind) in originalKinds)
        {
            var resultStep = result.Steps.First(s => s.StepId == stepId);
            resultStep.Kind.Should().Be(expectedKind,
                $"Kind for step {stepId} is immutable");
        }
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesAllHumanApprovalFlags()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - All steps must still require human approval
        result.Steps.Should().AllSatisfy(step =>
        {
            step.RequiresHumanApproval.Should().BeTrue(
                $"RequiresHumanApproval for step {step.StepId} is immutable");
        });
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesAllAutomationFlags()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - All steps must still not be suggested for automation
        result.Steps.Should().AllSatisfy(step =>
        {
            step.CanBeSuggestedForAutomation.Should().BeFalse(
                $"CanBeSuggestedForAutomation for step {step.StepId} is immutable");
        });
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesStepOrder()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalOrders = plan.Steps.Select(s => (s.StepId, s.Order)).ToList();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        foreach (var (stepId, expectedOrder) in originalOrders)
        {
            var resultStep = result.Steps.First(s => s.StepId == stepId);
            resultStep.Order.Should().Be(expectedOrder,
                $"Order for step {stepId} is immutable");
        }
    }

    [Fact]
    [Trait("Category", "StepImmutability")]
    public async Task EnrichAsync_PreservesRelatedAlertNames()
    {
        // Arrange
        var (service, _) = CreateServiceWithMockResponse(CreateEnrichedStepsResponse());
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        for (int i = 0; i < plan.Steps.Count; i++)
        {
            result.Steps[i].RelatedAlertNames.Should().BeEquivalentTo(
                plan.Steps[i].RelatedAlertNames,
                $"RelatedAlertNames for step {i} is immutable");
        }
    }

    // =========================================================================
    // SECTION C: Enrichment Validation
    // =========================================================================

    [Fact]
    [Trait("Category", "Enrichment")]
    public async Task EnrichAsync_CanModifyStepDescriptions()
    {
        // Arrange
        var enrichedResponse = CreateEnrichedStepsResponse(
            description: "ENRICHED: This is a much better description with more detail.");
        var (service, _) = CreateServiceWithMockResponse(enrichedResponse);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Descriptions CAN be modified
        result.Steps.Should().Contain(s => s.Description.Contains("ENRICHED"),
            "LLM is allowed to enrich descriptions");
    }

    [Fact]
    [Trait("Category", "Enrichment")]
    public async Task EnrichAsync_CanModifyStepTitles()
    {
        // Arrange
        var enrichedResponse = CreateEnrichedStepsResponse(
            title: "ENRICHED: Better Title");
        var (service, _) = CreateServiceWithMockResponse(enrichedResponse);
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert - Titles CAN be modified
        result.Steps.Should().Contain(s => s.Title.Contains("ENRICHED"),
            "LLM is allowed to enrich titles");
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

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

    private static string CreateEnrichedStepsResponse(
        string? title = null,
        string? description = null)
    {
        var steps = new[]
        {
            new
            {
                StepId = "STEP-000001",
                Title = title ?? "Check Atlas Dashboard",
                Description = description ?? "Navigate to Atlas dashboard and verify forecaster status"
            },
            new
            {
                StepId = "STEP-000002",
                Title = title ?? "Review Pipeline Configuration",
                Description = description ?? "Check forecaster pipeline configuration"
            },
            new
            {
                StepId = "STEP-000003",
                Title = title ?? "Restart Forecaster Service",
                Description = description ?? "If diagnostics indicate service issue, restart the forecaster"
            }
        };

        var response = new
        {
            choices = new[]
            {
                new
                {
                    message = new
                    {
                        content = JsonSerializer.Serialize(steps)
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
            Description = "Test incident for immutability tests",
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
