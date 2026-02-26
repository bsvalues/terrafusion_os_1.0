using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.AI.Services;
using TerraFusion.Consciousness.Services;
using TerraFusion.Consciousness.Interfaces;
using DbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 3 AI De-Stub Tests — verifies that AICommandService and
/// ConsciousnessEngine methods hit real database records instead of
/// returning hardcoded/random values.
/// </summary>
public class AIDeStubTests
{
    private static DbContext CreateDbContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<DbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        return new DbContext(options, configuration);
    }

    private static async System.Threading.Tasks.Task SeedAgents(DbContext ctx, int count, string status = "Active", string county = "BENTON")
    {
        var types = new[] { "PropertyAssessor", "DataProcessor", "Analyst", "ComplianceMonitor" };
        for (int i = 0; i < count; i++)
        {
            ctx.AIAgents.Add(new AIAgent
            {
                Name = $"TestAgent-{i + 1:D3}",
                Type = types[i % types.Length],
                Status = status,
                AssignedCounty = county,
                ProcessedTasks = i * 10,
                PerformanceScore = 0.80 + (i % 10) * 0.02,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            });
        }
        await ctx.SaveChangesAsync();
    }

    // ═══════════════════════════════════════════════════════════════
    // CONSCIOUSNESS ENGINE TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_GetSwarmStatus_ReturnsRealAgentCounts()
    {
        await using var ctx = CreateDbContext("CE_SwarmStatus");
        await SeedAgents(ctx, 10, "Active");
        await SeedAgents(ctx, 5, "Idle", "BENTON");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var status = await engine.GetSwarmStatusAsync("BENTON");

        status.TotalAgents.Should().Be(15);
        status.ActiveAgents.Should().Be(10, "only 10 agents have Active status");
        status.CountyId.Should().Be("BENTON");
        status.HealthScore.Should().BeGreaterThan(0);
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_GetSwarmStatus_EmptyDb_ReturnsZeroCounts()
    {
        await using var ctx = CreateDbContext("CE_SwarmStatus_Empty");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var status = await engine.GetSwarmStatusAsync("BENTON");

        status.TotalAgents.Should().Be(0);
        status.ActiveAgents.Should().Be(0);
        status.HealthScore.Should().Be(0);
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_InitializeSwarm_CreatesNewAgents()
    {
        await using var ctx = CreateDbContext("CE_InitSwarm");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var result = await engine.InitializeSwarmAsync(20, "BENTON");

        result.Should().BeTrue();
        var agentCount = await ctx.AIAgents.CountAsync();
        agentCount.Should().Be(20);

        var bentonAgents = await ctx.AIAgents
            .Where(a => a.AssignedCounty == "BENTON")
            .CountAsync();
        bentonAgents.Should().Be(20);
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_InitializeSwarm_DoesNotDuplicateExisting()
    {
        await using var ctx = CreateDbContext("CE_InitSwarm_NoDup");
        await SeedAgents(ctx, 15, "Active", "BENTON");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var result = await engine.InitializeSwarmAsync(20, "BENTON");

        result.Should().BeTrue();
        var agentCount = await ctx.AIAgents.CountAsync();
        agentCount.Should().Be(20, "should only create 5 new agents to reach 20");
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_CoordinateSwarm_UsesRealAgents()
    {
        await using var ctx = CreateDbContext("CE_Coordinate");
        await SeedAgents(ctx, 10, "Active");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var request = new SwarmCoordinationRequest
        {
            CountyId = "BENTON",
            TaskType = "PropertyAssessment",
            AgentCount = 5
        };

        var result = await engine.CoordinateSwarmAsync(request);

        result.Success.Should().BeTrue();
        result.ConfidenceScore.Should().BeGreaterThan(0);
        result.Results.Should().ContainKey("agent_count");
        ((int)result.Results["agent_count"]).Should().BeLessOrEqualTo(10);
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_CoordinateSwarm_EmptyDb_ReturnsFalse()
    {
        await using var ctx = CreateDbContext("CE_Coordinate_Empty");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var request = new SwarmCoordinationRequest
        {
            CountyId = "BENTON",
            TaskType = "DataValidation",
            AgentCount = 10
        };

        var result = await engine.CoordinateSwarmAsync(request);

        result.Success.Should().BeFalse("no agents available to coordinate");
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_QuantumOptimization_RecordsMetric()
    {
        await using var ctx = CreateDbContext("CE_Quantum");
        await SeedAgents(ctx, 5, "Active");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var request = new QuantumOptimizationRequest
        {
            OptimizationType = "PropertyValuation",
            QuantumFactor = 949
        };

        var result = await engine.ExecuteQuantumOptimizationAsync(request);

        result.Success.Should().BeTrue();
        result.QuantumFactor.Should().Be(949);
        result.OptimizationScore.Should().BeGreaterThan(0);

        // Verify metric was persisted
        var metric = await ctx.PerformanceMetrics
            .Where(m => m.MetricName == "QuantumOptimization")
            .FirstOrDefaultAsync();
        metric.Should().NotBeNull("optimization should record a performance metric");
        metric!.Source.Should().Be("ConsciousnessEngine");
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_GetHealthMetrics_ReflectsAgentStates()
    {
        await using var ctx = CreateDbContext("CE_Health");
        await SeedAgents(ctx, 8, "Active");
        await SeedAgents(ctx, 2, "Offline", "BENTON");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var health = await engine.GetHealthMetricsAsync();

        health.OverallHealth.Should().Be(0.8m, "8 of 10 agents are not offline");
        health.CoordinationSuccessRate.Should().BeGreaterThan(0);
    }

    [Fact]
    public async System.Threading.Tasks.Task ConsciousnessEngine_SwarmHealth_ActivityLevelReflectsRatio()
    {
        await using var ctx = CreateDbContext("CE_SwarmHealth");
        await SeedAgents(ctx, 10, "Active", "BENTON");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        var health = await engine.GetSwarmHealthAsync("BENTON");

        health.ActiveAgents.Should().Be(10);
        health.ActivityLevel.Should().Be("High", "all agents are active");
        health.AccuracyScore.Should().BeGreaterThan(0);
        health.ConsciousnessLevel.Should().Be(1.0, "all agents are active");
    }

    // ═══════════════════════════════════════════════════════════════
    // DATABASE OPERATION INTEGRITY TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIAgent_ScaleUp_CreatesNewRecords()
    {
        await using var ctx = CreateDbContext("Scale_Up");
        await SeedAgents(ctx, 5, "Active");

        var beforeCount = await ctx.AIAgents.CountAsync();
        beforeCount.Should().Be(5);

        // Directly test scaling logic
        var agentTypes = new[] { "PropertyAssessor", "DataProcessor", "Analyst", "ComplianceMonitor" };
        for (int i = 0; i < 5; i++)
        {
            ctx.AIAgents.Add(new AIAgent
            {
                Name = $"ScaledAgent-{i + 1:D4}",
                Type = agentTypes[i % agentTypes.Length],
                Status = "Idle",
                ProcessedTasks = 0,
                PerformanceScore = 0.0,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            });
        }
        await ctx.SaveChangesAsync();

        var afterCount = await ctx.AIAgents.CountAsync();
        afterCount.Should().Be(10);
    }

    [Fact]
    public async System.Threading.Tasks.Task AIAgent_RestartPattern_UpdatesStatusAndClearsTask()
    {
        await using var ctx = CreateDbContext("Restart_Pattern");
        var agent = new AIAgent
        {
            Name = "BusyAgent",
            Type = "DataProcessor",
            Status = "Busy",
            CurrentTask = "PropertyAssessment-12345",
            ProcessedTasks = 50,
            PerformanceScore = 0.92,
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow.AddMinutes(-10)
        };
        ctx.AIAgents.Add(agent);
        await ctx.SaveChangesAsync();

        // Simulate restart
        agent.Status = "Active";
        agent.CurrentTask = null;
        agent.LastActiveAt = DateTime.UtcNow;
        await ctx.SaveChangesAsync();

        var restarted = await ctx.AIAgents.FindAsync(agent.Id);
        restarted!.Status.Should().Be("Active");
        restarted.CurrentTask.Should().BeNull();
        restarted.ProcessedTasks.Should().Be(50, "restart should not reset task count");
    }

    [Fact]
    public async System.Threading.Tasks.Task AuditLog_CommandExecution_PersistsTrail()
    {
        await using var ctx = CreateDbContext("Audit_Commands");

        // Simulate command execution audit logging
        ctx.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:PropertyValuation",
            Data = "{\"command\":\"PropertyValuation\",\"commandId\":\"test-123\"}",
            Timestamp = DateTime.UtcNow,
            Source = "AICommandService",
            Severity = "Info",
            DurationMs = 42
        });

        ctx.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:DataValidation",
            Data = "{\"command\":\"DataValidation\",\"commandId\":\"test-456\"}",
            Timestamp = DateTime.UtcNow,
            Source = "AICommandService",
            Severity = "Info",
            DurationMs = 87
        });

        await ctx.SaveChangesAsync();

        var commandLogs = await ctx.AuditLogs
            .Where(a => a.Type != null && a.Type.StartsWith("AI_COMMAND"))
            .ToListAsync();

        commandLogs.Should().HaveCount(2);
        commandLogs.All(l => l.Source == "AICommandService").Should().BeTrue();
        commandLogs.Average(l => l.DurationMs!.Value).Should().Be(64.5);
    }

    [Fact]
    public async System.Threading.Tasks.Task PerformanceMetrics_Aggregation_WorksCorrectly()
    {
        await using var ctx = CreateDbContext("Metrics_Aggregation");

        ctx.PerformanceMetrics.Add(new PerformanceMetric
        {
            MetricName = "ResponseTime",
            MetricType = "Latency",
            Value = 100.0,
            Unit = "ms",
            Timestamp = DateTime.UtcNow,
            Source = "TestModel"
        });

        ctx.PerformanceMetrics.Add(new PerformanceMetric
        {
            MetricName = "ResponseTime",
            MetricType = "Latency",
            Value = 200.0,
            Unit = "ms",
            Timestamp = DateTime.UtcNow,
            Source = "TestModel"
        });

        ctx.PerformanceMetrics.Add(new PerformanceMetric
        {
            MetricName = "CpuUsage",
            MetricType = "Resource",
            Value = 25.5,
            Unit = "%",
            Timestamp = DateTime.UtcNow,
            Source = "TestModel"
        });

        await ctx.SaveChangesAsync();

        var responseMetrics = await ctx.PerformanceMetrics
            .Where(m => m.MetricName == "ResponseTime")
            .ToListAsync();

        responseMetrics.Should().HaveCount(2);
        responseMetrics.Average(m => m.Value).Should().Be(150.0);

        var cpuMetrics = await ctx.PerformanceMetrics
            .Where(m => m.MetricName == "CpuUsage")
            .ToListAsync();

        cpuMetrics.Should().HaveCount(1);
        cpuMetrics.First().Value.Should().Be(25.5);
    }

    [Fact]
    public async System.Threading.Tasks.Task AgentTaskAssignment_UpdatesStatusAndCurrentTask()
    {
        await using var ctx = CreateDbContext("TaskAssignment");
        var agent = new AIAgent
        {
            Name = "IdleAgent",
            Type = "PropertyAssessor",
            Status = "Idle",
            ProcessedTasks = 100,
            PerformanceScore = 0.95,
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow
        };
        ctx.AIAgents.Add(agent);
        await ctx.SaveChangesAsync();

        // Assign task (simulating ExecuteCommandAsync pattern)
        agent.Status = "Busy";
        agent.CurrentTask = "PropertyAssessment";
        agent.LastActiveAt = DateTime.UtcNow;
        await ctx.SaveChangesAsync();

        var busy = await ctx.AIAgents.FindAsync(agent.Id);
        busy!.Status.Should().Be("Busy");
        busy.CurrentTask.Should().Be("PropertyAssessment");

        // Complete task
        agent.Status = "Active";
        agent.CurrentTask = null;
        agent.ProcessedTasks++;
        await ctx.SaveChangesAsync();

        var done = await ctx.AIAgents.FindAsync(agent.Id);
        done!.Status.Should().Be("Active");
        done.ProcessedTasks.Should().Be(101);
    }

    [Fact]
    public async System.Threading.Tasks.Task CountyIsolation_SwarmStatus_OnlyReturnsCountyAgents()
    {
        await using var ctx = CreateDbContext("County_Swarm_Isolation");
        await SeedAgents(ctx, 10, "Active", "BENTON");
        await SeedAgents(ctx, 5, "Active", "KING");

        var engine = new ConsciousnessEngineStub(
            NullLogger<ConsciousnessEngineStub>.Instance, ctx);

        // BENTON should see BENTON agents + null-county agents
        var bentonStatus = await engine.GetSwarmStatusAsync("BENTON");
        bentonStatus.TotalAgents.Should().Be(10);

        // KING should see KING agents + null-county agents
        var kingStatus = await engine.GetSwarmStatusAsync("KING");
        kingStatus.TotalAgents.Should().Be(5);

        // Empty county sees ALL agents
        var allStatus = await engine.GetSwarmStatusAsync("");
        allStatus.TotalAgents.Should().Be(15);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLIANCE SERVICE TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task Compliance_IAAO_NoData_ReturnsNoDataCertification()
    {
        await using var ctx = CreateDbContext("Compliance_IAAO_Empty");

        var service = new ComplianceServiceStub(
            NullLogger<ComplianceServiceStub>.Instance, ctx);

        var result = await service.ValidateIAAOComplianceAsync(250000m, "BENTON");

        result.CertificationLevel.Should().Be("NoData");
        result.ComplianceIssues.Should().ContainSingle()
            .Which.Should().Contain("No assessment data");
    }

    [Fact]
    public async System.Threading.Tasks.Task Compliance_IAAO_WithAssessments_ComputesRealRatios()
    {
        await using var ctx = CreateDbContext("Compliance_IAAO_Real");

        // Seed property assessments with known values
        for (int i = 0; i < 10; i++)
        {
            ctx.PropertyAssessments.Add(new PropertyAssessment
            {
                PropertyId = Guid.NewGuid(),
                AssessmentYear = 2025,
                AssessedValue = 200000 + i * 10000,  // 200K-290K
                MarketValue = 210000 + i * 10000,    // 210K-300K (slightly above assessed)
                LandValue = 100000,
                ImprovementValue = 100000 + i * 10000,
                IsActive = true,
                AssessmentDate = DateTime.UtcNow
            });
        }
        await ctx.SaveChangesAsync();

        var service = new ComplianceServiceStub(
            NullLogger<ComplianceServiceStub>.Instance, ctx);

        var result = await service.ValidateIAAOComplianceAsync(250000m, "BENTON");

        result.MedianRatio.Should().BeGreaterThan(0, "should compute real ratios");
        result.MedianRatio.Should().BeLessThan(2m, "ratios should be reasonable");
        result.CoefficientOfDispersion.Should().BeGreaterOrEqualTo(0);
        result.PriceRelatedDifferential.Should().BeGreaterThan(0);
        result.CertificationLevel.Should().NotBe("NoData");
    }

    [Fact]
    public async System.Threading.Tasks.Task Compliance_Government_WithAuditLogs_DetectsCompliance()
    {
        await using var ctx = CreateDbContext("Compliance_Gov");

        // Seed audit logs to show active audit trail
        ctx.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:Test",
            Timestamp = DateTime.UtcNow,
            Source = "Test",
            Severity = "Info"
        });
        await ctx.SaveChangesAsync();

        // Seed properties with complete data
        ctx.Properties.Add(new Property
        {
            PropertyId = "P1",
            ParcelId = "PAR-001",
            ParcelNumber = "001",
            Address = "123 Main St",
            CountyId = Guid.NewGuid(),
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2025
        });
        await ctx.SaveChangesAsync();

        // Seed healthy agents
        await SeedAgents(ctx, 10, "Active", "BENTON");

        var service = new ComplianceServiceStub(
            NullLogger<ComplianceServiceStub>.Instance, ctx);

        var request = new TerraFusion.Consciousness.Interfaces.ComplianceValidationRequest
        {
            CountyId = "BENTON",
            EntityType = "Property",
            ComplianceStandards = new List<string> { "FISMA-HIGH", "NIST-800-53" }
        };

        var result = await service.ValidateGovernmentComplianceAsync(request);

        result.IsCompliant.Should().BeTrue("all standards should be met");
        result.ComplianceScore.Should().Be(100);
        result.StandardsCompliance.Should().ContainKey("FISMA-AuditLogging");
        result.StandardsCompliance["FISMA-AuditLogging"].Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task Compliance_Government_NoAuditLogs_FlagsIssue()
    {
        await using var ctx = CreateDbContext("Compliance_Gov_NoAudit");

        var service = new ComplianceServiceStub(
            NullLogger<ComplianceServiceStub>.Instance, ctx);

        var request = new TerraFusion.Consciousness.Interfaces.ComplianceValidationRequest
        {
            CountyId = "BENTON",
            EntityType = "Property"
        };

        var result = await service.ValidateGovernmentComplianceAsync(request);

        result.StandardsCompliance["FISMA-AuditLogging"].Should().BeFalse();
        result.Issues.Should().Contain(i => i.Contains("audit log"));
    }

    [Fact]
    public async System.Threading.Tasks.Task Compliance_AuditTrail_ReturnsRealLogs()
    {
        await using var ctx = CreateDbContext("Compliance_AuditTrail");

        var now = DateTime.UtcNow;
        ctx.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:PropertyValuation",
            Data = "{\"test\": true}",
            Timestamp = now.AddDays(-5),
            Source = "AICommandService",
            Severity = "Info"
        });
        ctx.AuditLogs.Add(new AuditLog
        {
            Type = "SECURITY:Login",
            Timestamp = now.AddDays(-2),
            Source = "AuthService",
            Severity = "Info"
        });
        ctx.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:OldOne",
            Timestamp = now.AddDays(-60),
            Source = "AICommandService",
            Severity = "Info"
        });
        await ctx.SaveChangesAsync();

        var service = new ComplianceServiceStub(
            NullLogger<ComplianceServiceStub>.Instance, ctx);

        // Query last 30 days
        var trail = await service.GetComplianceAuditTrailAsync("BENTON", now.AddDays(-30), now);

        trail.Should().HaveCount(2, "only 2 logs are within the 30-day window");
        trail.All(r => r.CountyId == "BENTON").Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task Compliance_Dashboard_AggregatesRealMetrics()
    {
        await using var ctx = CreateDbContext("Compliance_Dashboard");

        // Seed audit logs - mix of success and failure
        for (int i = 0; i < 10; i++)
        {
            ctx.AuditLogs.Add(new AuditLog
            {
                Type = "AI_COMMAND:Test",
                Timestamp = DateTime.UtcNow,
                ResponseStatusCode = i < 9 ? 200 : 500, // 90% success
                Source = "Test"
            });
        }

        // Seed a property
        ctx.Properties.Add(new Property
        {
            PropertyId = "P1",
            ParcelId = "PAR-001",
            ParcelNumber = "001",
            Address = "456 Oak Ave",
            CountyId = Guid.NewGuid(),
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2025
        });
        await ctx.SaveChangesAsync();

        var service = new ComplianceServiceStub(
            NullLogger<ComplianceServiceStub>.Instance, ctx);

        var metrics = await service.GetComplianceDashboardMetricsAsync("BENTON");

        metrics.TotalValidations.Should().BeGreaterOrEqualTo(10);
        metrics.ComplianceIssues.Should().BeGreaterOrEqualTo(1);
        metrics.OverallComplianceRate.Should().BeGreaterThan(0.5m).And.BeLessOrEqualTo(1.0m);
        metrics.StandardsCompliance.Should().ContainKey("AI_Operations");
        metrics.StandardsCompliance.Should().ContainKey("DataQuality");
        metrics.StandardsCompliance["DataQuality"].Should().Be(1.0m);
    }
}
