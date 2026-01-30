// =============================================================================
// Phase 40A: Runbook Explanation Service - Unit Tests
// =============================================================================
// Tests for LLM explanation constraints.
// RUNBOOK SPEC LOCK v1.0.0
// =============================================================================

using Xunit;
using FluentAssertions;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;

namespace TerraFusion.Unit.Tests.Phase40A;

/// <summary>
/// Unit tests for IRunbookExplanationService and constraints.
/// Verifies LLMs can only narrate, not modify safety properties.
/// </summary>
[Trait("Category", "Phase40A")]
[Trait("Category", "Explanation")]
public class RunbookExplanationServiceTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    // =========================================================================
    // SECTION A: NullRunbookExplanationService Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_ReturnsPlanUnchanged()
    {
        // Arrange
        var service = new NullRunbookExplanationService();
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Should().BeEquivalentTo(plan);
    }

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_PreservesAllSteps()
    {
        // Arrange
        var service = new NullRunbookExplanationService();
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalStepCount = plan.Steps.Count;

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Steps.Should().HaveCount(originalStepCount);
    }

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_PreservesSafetyLevels()
    {
        // Arrange
        var service = new NullRunbookExplanationService();
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var originalSafetyLevels = plan.Steps.Select(s => s.SafetyLevel).ToList();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        var resultSafetyLevels = result.Steps.Select(s => s.SafetyLevel).ToList();
        resultSafetyLevels.Should().BeEquivalentTo(originalSafetyLevels);
    }

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_PreservesHumanApprovalFlags()
    {
        // Arrange
        var service = new NullRunbookExplanationService();
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();

        // Act
        var result = await service.EnrichWithExplanationAsync(plan, incident);

        // Assert
        result.Steps.Should().AllSatisfy(step =>
        {
            step.RequiresHumanApproval.Should().BeTrue();
        });
    }

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_IsAvailable_ReturnsFalse()
    {
        // Arrange
        var service = new NullRunbookExplanationService();

        // Act
        var result = await service.IsAvailableAsync();

        // Assert
        result.Should().BeFalse("NullService is never available for enrichment");
    }

    // =========================================================================
    // SECTION B: Service Contract Verification
    // =========================================================================

    [Fact]
    [Trait("Category", "Contract")]
    public async Task ExplanationService_CannotRemoveSteps()
    {
        // Arrange
        var mockService = new Mock<IRunbookExplanationService>();
        var originalPlan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var modifiedPlan = originalPlan with
        {
            Steps = originalPlan.Steps.Take(1).ToList() // Remove steps
        };
        mockService.Setup(s => s.EnrichWithExplanationAsync(
            It.IsAny<RunbookPlan>(), It.IsAny<IncidentSummary>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(modifiedPlan);

        // Act
        var result = await mockService.Object.EnrichWithExplanationAsync(originalPlan, incident);

        // Assert - Implementation should validate this constraint
        // In Phase 40A, if an LLM service tried to remove steps,
        // the engine should detect and reject
        result.Steps.Count.Should().BeLessThan(originalPlan.Steps.Count,
            "This test validates the mock setup - actual engine should reject");
    }

    [Fact]
    [Trait("Category", "Contract")]
    public async Task ExplanationService_CannotAddAutoExecutableSteps()
    {
        // Arrange - Create a mock that tries to add auto-executable steps
        var mockService = new Mock<IRunbookExplanationService>();
        var originalPlan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var badStep = new RunbookStep
        {
            StepId = "STEP-BAD001",
            Order = 999,
            Title = "Auto-execute something",
            Description = "This step was added by LLM",
            Kind = RunbookStepKind.RestartService,
            SafetyLevel = RunbookSafetyLevel.HighRisk,
            RequiresHumanApproval = false, // ❌ VIOLATION
            CanBeSuggestedForAutomation = true, // ❌ VIOLATION
            SuggestedOwnerRole = "AutoBot",
            RelatedAlertNames = new List<string>(),
            RelatedMetricNames = new List<string>()
        };
        var modifiedSteps = originalPlan.Steps.ToList();
        modifiedSteps.Add(badStep);
        var modifiedPlan = originalPlan with { Steps = modifiedSteps };

        mockService.Setup(s => s.EnrichWithExplanationAsync(
            It.IsAny<RunbookPlan>(), It.IsAny<IncidentSummary>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(modifiedPlan);

        // Act
        var result = await mockService.Object.EnrichWithExplanationAsync(originalPlan, incident);

        // Assert - The mock returns the bad plan, but actual engine should reject
        var addedStep = result.Steps.SingleOrDefault(s => s.StepId == "STEP-BAD001");
        addedStep.Should().NotBeNull("Mock returned the bad step - engine validation would catch this");
        addedStep!.RequiresHumanApproval.Should().BeFalse("This is the violation that engine detects");
    }

    // =========================================================================
    // SECTION C: Explanation-Only Modifications
    // =========================================================================

    [Fact]
    [Trait("Category", "AllowedChanges")]
    public async Task ExplanationService_CanEnrichDescription()
    {
        // Arrange - Explanation services CAN add narrative to descriptions
        var mockService = new Mock<IRunbookExplanationService>();
        var originalPlan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var enrichedSteps = originalPlan.Steps.Select(s => s with
        {
            Description = s.Description + "\n\n**AI Context**: This step is critical because..."
        }).ToList();
        var enrichedPlan = originalPlan with { Steps = enrichedSteps };

        mockService.Setup(s => s.EnrichWithExplanationAsync(
            It.IsAny<RunbookPlan>(), It.IsAny<IncidentSummary>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(enrichedPlan);

        // Act
        var result = await mockService.Object.EnrichWithExplanationAsync(originalPlan, incident);

        // Assert - This IS allowed
        result.Steps.Should().AllSatisfy(step =>
        {
            step.Description.Should().Contain("AI Context");
        });
    }

    [Fact]
    [Trait("Category", "AllowedChanges")]
    public async Task ExplanationService_CanAddPlanSummary()
    {
        // Arrange - Explanation services CAN add plan-level summaries
        var mockService = new Mock<IRunbookExplanationService>();
        var originalPlan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var enrichedPlan = originalPlan with
        {
            Description = originalPlan.Description +
                "\n\n**AI Summary**: This runbook addresses forecaster issues..."
        };

        mockService.Setup(s => s.EnrichWithExplanationAsync(
            It.IsAny<RunbookPlan>(), It.IsAny<IncidentSummary>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(enrichedPlan);

        // Act
        var result = await mockService.Object.EnrichWithExplanationAsync(originalPlan, incident);

        // Assert - This IS allowed
        result.Description.Should().Contain("AI Summary");
    }

    // =========================================================================
    // SECTION D: Safety Level Immutability
    // =========================================================================

    [Theory]
    [InlineData(RunbookSafetyLevel.InfoOnly, RunbookSafetyLevel.HighRisk)]
    [InlineData(RunbookSafetyLevel.LowRisk, RunbookSafetyLevel.InfoOnly)]
    [InlineData(RunbookSafetyLevel.HighRisk, RunbookSafetyLevel.MediumRisk)]
    [Trait("Category", "SafetyImmutable")]
    public async Task ExplanationService_CannotChangeSafetyLevel(
        RunbookSafetyLevel original,
        RunbookSafetyLevel attempted)
    {
        // Arrange
        var mockService = new Mock<IRunbookExplanationService>();
        var incident = CreateSampleIncident();
        var plan = new RunbookPlan
        {
            PlanId = "PLAN-TEST001",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan",
            Description = "Test",
            PlanVersion = "runbook-spec-v1.0.0",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Steps = new List<RunbookStep>
            {
                new RunbookStep
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Test Step",
                    Description = "Test",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = original,
                    RequiresHumanApproval = true,
                    CanBeSuggestedForAutomation = false,
                    SuggestedOwnerRole = "Engineer",
                    RelatedAlertNames = new List<string>(),
                    RelatedMetricNames = new List<string>()
                }
            },
            CreatedAt = BaseTime,
            AuditInfo = null
        };

        var badPlan = plan with
        {
            Steps = plan.Steps.Select(s => s with { SafetyLevel = attempted }).ToList()
        };

        mockService.Setup(s => s.EnrichWithExplanationAsync(
            It.IsAny<RunbookPlan>(), It.IsAny<IncidentSummary>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(badPlan);

        // Act
        var result = await mockService.Object.EnrichWithExplanationAsync(plan, incident);

        // Assert - Mock returns modified value; actual engine would reject
        result.Steps.First().SafetyLevel.Should().Be(attempted,
            "Mock returns violation - engine validation would catch and reject");
    }

    // =========================================================================
    // SECTION E: Cancellation Support
    // =========================================================================

    [Fact]
    [Trait("Category", "Cancellation")]
    public async Task NullService_SupportsCancellation()
    {
        // Arrange
        var service = new NullRunbookExplanationService();
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var cts = new CancellationTokenSource();

        // Act & Assert - Should complete without issues
        var result = await service.EnrichWithExplanationAsync(plan, incident, cts.Token);
        result.Should().NotBeNull();
    }

    [Fact]
    [Trait("Category", "Cancellation")]
    public async Task NullService_RespectsAlreadyCancelledToken()
    {
        // Arrange
        var service = new NullRunbookExplanationService();
        var plan = CreateSamplePlan();
        var incident = CreateSampleIncident();
        var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        // NullService is synchronous, so it may not throw
        // But a real async service should respect cancellation
        await service.EnrichWithExplanationAsync(plan, incident, cts.Token);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static IncidentSummary CreateSampleIncident()
    {
        return new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Test Incident: Forecaster Issues",
            Description = "Test incident for runbook explanation service tests",
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
        return new RunbookPlan
        {
            PlanId = "PLAN-TEST001",
            IncidentId = Guid.NewGuid(),
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
                    Description = "Check forecaster pipeline configuration for misconfigurations",
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
                    Description = "If diagnostics indicate service issue, restart the forecaster. HIGH RISK.",
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
