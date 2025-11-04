using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.DTOs;
using TerraFusion.API.Services;
using TerraFusion.Core.Services.Interfaces;
using Xunit;

namespace TerraFusion.Tests.Unit;

/// <summary>
/// Unit tests for the 3-6-9-12 Cognitive Framework Service
/// Tests the core logic without dependencies on external services
/// </summary>
public class CognitiveFrameworkServiceUnitTest
{
    private readonly Mock<IAuditLogger> _mockAuditLogger;
    private readonly Mock<ILogger<CognitiveFrameworkService>> _mockLogger;
    private readonly CognitiveFrameworkService _service;

    public CognitiveFrameworkServiceUnitTest()
    {
        _mockAuditLogger = new Mock<IAuditLogger>();
        _mockLogger = new Mock<ILogger<CognitiveFrameworkService>>();
        _service = new CognitiveFrameworkService(_mockAuditLogger.Object, _mockLogger.Object);
    }

    #region TIER 1 Tests (3-Phase Individual Tasks)

    [Fact]
    public async Task ClassifyTask_SimpleBugFix_ShouldReturnTier1()
    {
        // Arrange - Simple individual task
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Fix login button color",
            Description = "Change login button from blue to green",
            EstimatedHours = 1,
            RequiredSkills = new[] { "CSS" },
            StakeholderCount = 1,
            SystemsAffected = 1,
            RiskLevel = "Low",
            OrganizationalScope = "Individual"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Tier.Should().Be(1, "Simple tasks with low complexity should be classified as TIER 1");
        result.Phases.Should().HaveCount(3, "TIER 1 uses the 3-phase Individual workflow");
        result.Phases.Should().Contain(p => p.Name == "UNDERSTAND");
        result.Phases.Should().Contain(p => p.Name == "BUILD");
        result.Phases.Should().Contain(p => p.Name == "VALIDATE");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(85, "Simple tasks should have high confidence");
    }

    #endregion

    #region TIER 2 Tests (6-Phase Team Tasks)

    [Fact]
    public async Task ClassifyTask_FeatureImplementation_ShouldReturnTier2()
    {
        // Arrange - Team-level feature development
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Implement property search API",
            Description = "Build RESTful API for property search with filters, pagination, and validation",
            EstimatedHours = 25,
            RequiredSkills = new[] { "C#", ".NET", "Entity Framework", "Testing" },
            StakeholderCount = 3,
            SystemsAffected = 2,
            RiskLevel = "Medium",
            OrganizationalScope = "Team"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Tier.Should().Be(2, "Complex team tasks should be classified as TIER 2");
        result.Phases.Should().HaveCount(6, "TIER 2 uses the 6-phase Team workflow");
        result.Phases.Should().Contain(p => p.Name == "CLARIFY");
        result.Phases.Should().Contain(p => p.Name == "RESEARCH");
        result.Phases.Should().Contain(p => p.Name == "DESIGN");
        result.Phases.Should().Contain(p => p.Name == "BUILD");
        result.Phases.Should().Contain(p => p.Name == "VERIFY");
        result.Phases.Should().Contain(p => p.Name == "OPERATE");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(90, "Team tasks require higher confidence");
    }

    [Fact]
    public async Task GenerateExecutionPlan_Tier2Task_ShouldOptimizeForTeamCollaboration()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Implement 3-6-9 Cognitive Framework",
            Tier = 2,
            CognitiveLoadTarget = 6
        };

        // Act
        var result = await _service.GeneratePhaseExecutionPlanAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Phases.Should().HaveCount(6, "TIER 2 should have exactly 6 phases");
        result.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(6, "Should respect Miller's Law cognitive load limits");
        result.ParallelizationOpportunities.Should().NotBeEmpty("Team tasks should have parallelization opportunities");
        result.TeamSynchronizationPoints.Should().NotBeEmpty("Team tasks need synchronization points");
    }

    #endregion

    #region TIER 3 Tests (9-Phase Platform Tasks)

    [Fact]
    public async Task ClassifyTask_PlatformMigration_ShouldReturnTier3()
    {
        // Arrange - Platform-level system changes
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Migrate TerraFusion to .NET 8",
            Description = "Upgrade entire platform from .NET 6 to .NET 8 with performance optimizations",
            EstimatedHours = 200,
            RequiredSkills = new[] { ".NET 8", "Migration", "Performance", "Testing", "DevOps" },
            StakeholderCount = 8,
            SystemsAffected = 15,
            RiskLevel = "High",
            OrganizationalScope = "Platform"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Tier.Should().Be(3, "Platform-wide changes should be classified as TIER 3");
        result.Phases.Should().HaveCount(9, "TIER 3 uses the 9-phase Platform workflow");
        result.Phases.Should().Contain(p => p.Name == "ENVISION");
        result.Phases.Should().Contain(p => p.Name == "ARCHITECT");
        result.Phases.Should().Contain(p => p.Name == "INTEGRATE");
        result.Phases.Should().Contain(p => p.Name == "SECURE");
        result.Phases.Should().Contain(p => p.Name == "OPTIMIZE");
        result.Phases.Should().Contain(p => p.Name == "VALIDATE");
        result.Phases.Should().Contain(p => p.Name == "DEPLOY");
        result.Phases.Should().Contain(p => p.Name == "MONITOR");
        result.Phases.Should().Contain(p => p.Name == "TRANSCEND");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(95, "Platform tasks require very high confidence");
    }

    #endregion

    #region TIER 4 Tests (12-Phase Organizational Transformation)

    [Fact]
    public async Task ClassifyTask_OrganizationalTransformation_ShouldReturnTier4()
    {
        // Arrange - Revolutionary 12-phase organizational transformation
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Transform Washington State County Assessment Operations with AI",
            Description = "Deploy TerraFusion OS across 39 counties with 50,000+ AI agents for autonomous government operations",
            EstimatedHours = 5000,
            RequiredSkills = new[] { "Government", "AI", "Change Management", "Policy", "Training", "Compliance" },
            StakeholderCount = 500,
            SystemsAffected = 100,
            RiskLevel = "Critical",
            OrganizationalScope = "Multi-County Government Transformation"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert - This validates our revolutionary 12-phase tier!
        result.Should().NotBeNull();
        result.Tier.Should().Be(4, "Massive organizational transformations should be classified as TIER 4");
        result.Phases.Should().HaveCount(12, "TIER 4 uses the revolutionary 12-phase Organizational workflow");
        result.Phases.Should().Contain(p => p.Name == "ILLUMINATE");
        result.Phases.Should().Contain(p => p.Name == "MOBILIZE");
        result.Phases.Should().Contain(p => p.Name == "STRATEGIZE");
        result.Phases.Should().Contain(p => p.Name == "ARCHITECT");
        result.Phases.Should().Contain(p => p.Name == "VALIDATE");
        result.Phases.Should().Contain(p => p.Name == "DEPLOY");
        result.Phases.Should().Contain(p => p.Name == "INTEGRATE");
        result.Phases.Should().Contain(p => p.Name == "OPTIMIZE");
        result.Phases.Should().Contain(p => p.Name == "MONITOR");
        result.Phases.Should().Contain(p => p.Name == "GOVERN");
        result.Phases.Should().Contain(p => p.Name == "EVOLVE");
        result.Phases.Should().Contain(p => p.Name == "TRANSCEND");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(97, "Organizational transformation requires maximum confidence");
    }

    [Fact]
    public async Task GenerateExecutionPlan_Tier4Task_ShouldOrchestrateMassiveTransformation()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Deploy Government.Transcended Operating System",
            Tier = 4,
            CognitiveLoadTarget = 3 // Maximum cognitive load reduction for transformation scale
        };

        // Act
        var result = await _service.GeneratePhaseExecutionPlanAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Phases.Should().HaveCount(12, "TIER 4 should have exactly 12 phases");
        result.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(3, "Massive transformations need minimal cognitive load per phase");
        result.ParallelizationOpportunities.Should().HaveCountGreaterThan(8, "Organizational transformation requires massive parallelization");
        result.OrganizationalChangeManagement.Should().NotBeEmpty("TIER 4 requires change management framework");
        result.GovernanceFramework.Should().NotBeEmpty("TIER 4 requires governance framework");
    }

    #endregion

    #region Confidence Gate Tests

    [Fact]
    public async Task EvaluateConfidenceGate_HighComplexityTask_ShouldRequireHighConfidence()
    {
        // Arrange
        var request = new ConfidenceGateRequest
        {
            TaskComplexity = 9,
            StakeholderCount = 50,
            RiskLevel = "Critical"
        };

        // Act
        var result = await _service.EvaluateConfidenceGateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.RequiredConfidence.Should().BeGreaterOrEqualTo(95, "High complexity tasks need high confidence");
        result.RecommendedActions.Should().NotBeEmpty("Should provide confidence-building recommendations");
    }

    [Theory]
    [InlineData("Low", 1, 1, 85)]      // Simple tasks -> 85% confidence
    [InlineData("Medium", 5, 10, 90)]  // Team tasks -> 90% confidence
    [InlineData("High", 15, 50, 95)]   // Platform tasks -> 95% confidence
    [InlineData("Critical", 100, 500, 97)] // Organizational tasks -> 97% confidence
    public async Task EvaluateConfidenceGate_VariousComplexities_ShouldScaleConfidenceRequirements(
        string riskLevel, int systemsAffected, int stakeholderCount, int expectedMinConfidence)
    {
        // Arrange
        var request = new ConfidenceGateRequest
        {
            TaskComplexity = systemsAffected,
            StakeholderCount = stakeholderCount,
            RiskLevel = riskLevel
        };

        // Act
        var result = await _service.EvaluateConfidenceGateAsync(request);

        // Assert
        result.RequiredConfidence.Should().BeGreaterOrEqualTo(expectedMinConfidence,
            $"Risk level {riskLevel} should require at least {expectedMinConfidence}% confidence");
    }

    #endregion

    #region Cognitive Load Optimization Tests

    [Fact]
    public async Task GenerateExecutionPlan_ShouldRespectMillersLaw()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Complex Software Development Task",
            Tier = 2,
            CognitiveLoadTarget = 7 // Miller's Law: 7±2 items
        };

        // Act
        var result = await _service.GeneratePhaseExecutionPlanAsync(request);

        // Assert
        result.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(7,
            "Should respect Miller's Law for optimal cognitive performance");

        // Each phase should have manageable complexity
        foreach (var phase in result.Phases)
        {
            phase.EstimatedComplexity.Should().BeLessOrEqualTo(5,
                $"Phase {phase.Name} should have manageable complexity");
        }
    }

    #endregion
}

/// <summary>
/// Mock audit logger for testing
/// </summary>
public class MockAuditLogger : IAuditLogger
{
    public async Task LogSystemEventAsync(string eventType, string description, object? data = null)
    {
        // Mock implementation - just return completed task
        await Task.CompletedTask;
    }

    public async Task LogUserActionAsync(string userId, string action, string resource, object? metadata = null)
    {
        // Mock implementation - just return completed task
        await Task.CompletedTask;
    }

    public async Task LogSecurityEventAsync(string eventType, string userId, string? ipAddress, object? details = null)
    {
        // Mock implementation - just return completed task
        await Task.CompletedTask;
    }

    public async Task LogComplianceEventAsync(string regulation, string eventType, object data, bool isCompliant = true)
    {
        // Mock implementation - just return completed task
        await Task.CompletedTask;
    }

    public async Task LogPerformanceMetricAsync(string metricName, double value, string? userId = null, Dictionary<string, object>? tags = null)
    {
        // Mock implementation - just return completed task
        await Task.CompletedTask;
    }
}
