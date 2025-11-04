using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.DTOs;
using TerraFusion.API.Services;
using TerraFusion.Core.Services.Interfaces;
using Xunit;

namespace TerraFusion.Tests.CognitiveFramework;

/// <summary>
/// Simple test to validate our revolutionary 3-6-9-12 Cognitive Framework works correctly
/// Tests the core logic of task classification across all 4 tiers
/// </summary>
public class CognitiveFrameworkValidationTest
{
    private readonly CognitiveFrameworkService _service;

    public CognitiveFrameworkValidationTest()
    {
        var mockAuditLogger = new Mock<IAuditLogger>();
        var mockLogger = new Mock<ILogger<CognitiveFrameworkService>>();
        _service = new CognitiveFrameworkService(mockAuditLogger.Object, mockLogger.Object);
    }

    [Fact]
    public async Task Validate_Tier1_IndividualTask_3Phases()
    {
        // Arrange - Simple individual task
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Fix button color",
            Description = "Change button from blue to green",
            EstimatedHours = 1,
            RequiredSkills = new[] { "CSS" },
            StakeholderCount = 1,
            SystemsAffected = 1,
            RiskLevel = "Low",
            OrganizationalScope = "Individual"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert - TIER 1: 3-Phase Individual Pattern
        result.Should().NotBeNull();
        result.Tier.Should().Be(1);
        result.Phases.Should().HaveCount(3);
        result.Phases[0].Name.Should().Be("UNDERSTAND");
        result.Phases[1].Name.Should().Be("BUILD");
        result.Phases[2].Name.Should().Be("VALIDATE");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(85);
    }

    [Fact]
    public async Task Validate_Tier2_TeamTask_6Phases()
    {
        // Arrange - Team-level feature
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Implement search API",
            Description = "Build RESTful API with filters and pagination",
            EstimatedHours = 25,
            RequiredSkills = new[] { "C#", ".NET", "API Design" },
            StakeholderCount = 3,
            SystemsAffected = 2,
            RiskLevel = "Medium",
            OrganizationalScope = "Team"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert - TIER 2: 6-Phase Team Pattern
        result.Should().NotBeNull();
        result.Tier.Should().Be(2);
        result.Phases.Should().HaveCount(6);
        result.Phases[0].Name.Should().Be("CLARIFY");
        result.Phases[1].Name.Should().Be("RESEARCH");
        result.Phases[2].Name.Should().Be("DESIGN");
        result.Phases[3].Name.Should().Be("BUILD");
        result.Phases[4].Name.Should().Be("VERIFY");
        result.Phases[5].Name.Should().Be("OPERATE");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(90);
    }

    [Fact]
    public async Task Validate_Tier3_PlatformTask_9Phases()
    {
        // Arrange - Platform migration
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Platform Migration to .NET 8",
            Description = "Upgrade entire platform with performance optimizations",
            EstimatedHours = 200,
            RequiredSkills = new[] { ".NET 8", "Migration", "Performance" },
            StakeholderCount = 8,
            SystemsAffected = 15,
            RiskLevel = "High",
            OrganizationalScope = "Platform"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert - TIER 3: 9-Phase Platform Pattern
        result.Should().NotBeNull();
        result.Tier.Should().Be(3);
        result.Phases.Should().HaveCount(9);
        result.Phases[0].Name.Should().Be("ENVISION");
        result.Phases[1].Name.Should().Be("ARCHITECT");
        result.Phases[2].Name.Should().Be("INTEGRATE");
        result.Phases[3].Name.Should().Be("SECURE");
        result.Phases[4].Name.Should().Be("OPTIMIZE");
        result.Phases[5].Name.Should().Be("VALIDATE");
        result.Phases[6].Name.Should().Be("DEPLOY");
        result.Phases[7].Name.Should().Be("MONITOR");
        result.Phases[8].Name.Should().Be("TRANSCEND");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(95);
    }

    [Fact]
    public async Task Validate_Tier4_OrganizationalTransformation_12Phases()
    {
        // Arrange - Revolutionary organizational transformation (our new tier!)
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Transform State Government with AI",
            Description = "Deploy autonomous AI across 39 counties with 50,000+ agents",
            EstimatedHours = 5000,
            RequiredSkills = new[] { "AI", "Government", "Change Management" },
            StakeholderCount = 500,
            SystemsAffected = 100,
            RiskLevel = "Critical",
            OrganizationalScope = "Multi-County Government Transformation"
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert - TIER 4: 12-Phase Organizational Transformation Pattern
        result.Should().NotBeNull();
        result.Tier.Should().Be(4);
        result.Phases.Should().HaveCount(12);
        result.Phases[0].Name.Should().Be("ILLUMINATE");
        result.Phases[1].Name.Should().Be("MOBILIZE");
        result.Phases[2].Name.Should().Be("STRATEGIZE");
        result.Phases[3].Name.Should().Be("ARCHITECT");
        result.Phases[4].Name.Should().Be("VALIDATE");
        result.Phases[5].Name.Should().Be("DEPLOY");
        result.Phases[6].Name.Should().Be("INTEGRATE");
        result.Phases[7].Name.Should().Be("OPTIMIZE");
        result.Phases[8].Name.Should().Be("MONITOR");
        result.Phases[9].Name.Should().Be("GOVERN");
        result.Phases[10].Name.Should().Be("EVOLVE");
        result.Phases[11].Name.Should().Be("TRANSCEND");
        result.ConfidenceGate.Should().BeGreaterOrEqualTo(97);
    }

    [Fact]
    public async Task Validate_CognitiveLoadOptimization_MillersLaw()
    {
        // Arrange - Test Miller's Law cognitive optimization
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Test Cognitive Load Optimization",
            Tier = 2,
            CognitiveLoadTarget = 7 // Miller's Law: 7±2
        };

        // Act
        var result = await _service.GeneratePhaseExecutionPlanAsync(request);

        // Assert - Should respect cognitive load limits
        result.Should().NotBeNull();
        result.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(7);
        result.Phases.Should().HaveCount(6); // TIER 2 = 6 phases

        // Each phase should have manageable complexity
        foreach (var phase in result.Phases)
        {
            phase.EstimatedComplexity.Should().BeLessOrEqualTo(5);
        }
    }

    [Theory]
    [InlineData("Low", 1, 1, 1)]      // Simple → TIER 1
    [InlineData("Medium", 5, 3, 2)]   // Team → TIER 2
    [InlineData("High", 15, 8, 3)]    // Platform → TIER 3
    [InlineData("Critical", 100, 50, 4)] // Organizational → TIER 4
    public async Task Validate_TierClassification_Algorithm(
        string riskLevel, int systemsAffected, int stakeholderCount, int expectedTier)
    {
        // Arrange
        var request = new TaskClassificationRequest
        {
            TaskTitle = $"Test Task for Tier {expectedTier}",
            Description = $"Task with {riskLevel} risk affecting {systemsAffected} systems",
            EstimatedHours = expectedTier * 50,
            RequiredSkills = new[] { "Test Skill" },
            StakeholderCount = stakeholderCount,
            SystemsAffected = systemsAffected,
            RiskLevel = riskLevel,
            OrganizationalScope = expectedTier switch
            {
                1 => "Individual",
                2 => "Team",
                3 => "Platform",
                4 => "Multi-County Government Transformation",
                _ => "Unknown"
            }
        };

        // Act
        var result = await _service.ClassifyTaskAsync(request);

        // Assert - Validate tier classification algorithm
        result.Tier.Should().Be(expectedTier,
            $"Task with {riskLevel} risk, {systemsAffected} systems, {stakeholderCount} stakeholders should be TIER {expectedTier}");

        var expectedPhaseCount = expectedTier * 3; // 3, 6, 9, 12 phases
        result.Phases.Should().HaveCount(expectedPhaseCount);
    }
}

/// <summary>
/// Mock audit logger implementation for testing
/// </summary>
public class TestAuditLogger : IAuditLogger
{
    public async System.Threading.Tasks.Task LogSystemEventAsync(string eventType, string description, object? data = null)
        => await System.Threading.Tasks.Task.CompletedTask;

    public async System.Threading.Tasks.Task LogUserActionAsync(string userId, string action, string resource, object? metadata = null)
        => await System.Threading.Tasks.Task.CompletedTask;

    public async System.Threading.Tasks.Task LogSecurityEventAsync(string eventType, string userId, string? ipAddress, object? details = null)
        => await System.Threading.Tasks.Task.CompletedTask;

    public async System.Threading.Tasks.Task LogComplianceEventAsync(string regulation, string eventType, object data, bool isCompliant = true)
        => await System.Threading.Tasks.Task.CompletedTask;

    public async System.Threading.Tasks.Task LogPerformanceMetricAsync(string metricName, double value, string? userId = null, Dictionary<string, object>? tags = null)
        => await System.Threading.Tasks.Task.CompletedTask;
}
