using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Enums;
using TerraFusion.Core.Services;
// Resolve AICommandDto ambiguity between Core.DTOs and Core.Services
using CmdDto = TerraFusion.Core.DTOs.AICommandDto;
using TerraFusion.Core.Mapping;
using TerraFusion.AI.Services;
using TerraFusion.Data;
using DbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 3 continued — verifies AICommandService and AIEngineService
/// de-stubbed methods use real database queries instead of Random.Shared
/// or hardcoded values.
/// </summary>
public class AIServiceDeStubTests
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

    private static TerraFusionContext CreateTerraFusionContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionContext>()
            .UseInMemoryDatabase(databaseName: databaseName + "_identity")
            .Options;

        return new TerraFusionContext(options);
    }

    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<TerraFusionMappingProfile>();
        }, NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    private static async System.Threading.Tasks.Task SeedAgents(DbContext ctx, int count, string status = "Active")
    {
        var types = new[] { "PropertyAssessor", "DataProcessor", "Analyst", "ComplianceMonitor" };
        for (int i = 0; i < count; i++)
        {
            ctx.AIAgents.Add(new AIAgent
            {
                Name = $"TestAgent-{Guid.NewGuid():N}"[..20],
                Type = types[i % types.Length],
                Status = status,
                AssignedCounty = "BENTON",
                ProcessedTasks = i * 10,
                PerformanceScore = 0.80 + (i % 10) * 0.02,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            });
        }
        await ctx.SaveChangesAsync();
    }

    private static async System.Threading.Tasks.Task SeedPropertyAssessments(DbContext ctx, int count)
    {
        for (int i = 0; i < count; i++)
        {
            ctx.PropertyAssessments.Add(new PropertyAssessment
            {
                PropertyId = Guid.NewGuid(),
                AssessmentYear = 2025,
                AssessedValue = 200000 + i * 10000,
                MarketValue = 210000 + i * 10000,
                LandValue = 100000,
                ImprovementValue = 100000 + i * 10000,
                IsActive = true,
                AssessmentDate = DateTime.UtcNow
            });
        }
        await ctx.SaveChangesAsync();
    }

    private static async System.Threading.Tasks.Task SeedAIModels(TerraFusionContext ctx, int count, AIModelStatus status = AIModelStatus.Active)
    {
        for (int i = 0; i < count; i++)
        {
            ctx.AIModels.Add(new AIModel
            {
                Name = $"TestModel-{i + 1}",
                Version = "1.0",
                Type = AIModelType.PropertyValuation,
                Status = status,
                Accuracy = 0.90m + i * 0.01m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        await ctx.SaveChangesAsync();
    }

    // ═══════════════════════════════════════════════════════════════
    // AICommandService — GetSwarmStatusAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_GetSwarmStatus_ReturnsRealAgentCounts()
    {
        var dbName = nameof(AICommand_GetSwarmStatus_ReturnsRealAgentCounts);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 10, "Active");
        await SeedAgents(ctx, 3, "Idle");
        await SeedAgents(ctx, 2, "Busy");

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var status = await service.GetSwarmStatusAsync();

        status.TotalAgents.Should().Be(15);
        status.ActiveAgents.Should().Be(10);
        status.IdleAgents.Should().Be(3);
        status.BusyAgents.Should().Be(2);
        status.Status.Should().Be("Active");
    }

    [Fact]
    public async System.Threading.Tasks.Task AICommand_GetSwarmStatus_EmptyDb_ReturnsNoAgents()
    {
        var dbName = nameof(AICommand_GetSwarmStatus_EmptyDb_ReturnsNoAgents);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var status = await service.GetSwarmStatusAsync();

        status.TotalAgents.Should().Be(0);
        status.ActiveAgents.Should().Be(0);
        status.Status.Should().Be("No Agents Registered");
    }

    // ═══════════════════════════════════════════════════════════════
    // AICommandService — ExecuteCommandAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_ExecuteCommand_WithAgent_AssignsAndCompletes()
    {
        var dbName = nameof(AICommand_ExecuteCommand_WithAgent_AssignsAndCompletes);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 3, "Active");

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var command = new CmdDto
        {
            Command = "PropertyValuation",
            CommandType = "AI",
            Parameters = "{}",
            TargetAgentType = "PropertyAssessor",
            Result = "",
            CreatedBy = "TestUser",
            ErrorMessage = ""
        };
        var result = await service.ExecuteCommandAsync(command);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("executed by");
        result.ExecutionTimeMs.Should().BeGreaterOrEqualTo(0);
        result.CommandId.Should().NotBeEmpty();

        // Verify audit log was created
        var audit = await ctx.AuditLogs
            .Where(a => a.Type == "AI_COMMAND")
            .FirstOrDefaultAsync();
        audit.Should().NotBeNull();
        audit!.Source.Should().Be("AICommandService");

        // Verify agent was released (back to Active)
        var agents = await ctx.AIAgents.ToListAsync();
        agents.Should().OnlyContain(a => a.Status == "Active");
    }

    [Fact]
    public async System.Threading.Tasks.Task AICommand_ExecuteCommand_NoAgents_ReturnsFalse()
    {
        var dbName = nameof(AICommand_ExecuteCommand_NoAgents_ReturnsFalse);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var command = new CmdDto
        {
            Command = "PropertyValuation",
            CommandType = "AI",
            Parameters = "{}",
            TargetAgentType = "PropertyAssessor",
            Result = "",
            CreatedBy = "TestUser",
            ErrorMessage = ""
        };
        var result = await service.ExecuteCommandAsync(command);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("No available agents");
    }

    // ═══════════════════════════════════════════════════════════════
    // AICommandService — AssignTaskAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_AssignTask_SelectsAvailableAgent()
    {
        var dbName = nameof(AICommand_AssignTask_SelectsAvailableAgent);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 5, "Active");

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var assignment = new AITaskAssignmentDto
        {
            TaskType = "PropertyAssessment",
            Description = "Assess parcel 001",
            Priority = "High"
        };
        var task = await service.AssignTaskAsync(assignment);

        task.Status.Should().Be("Assigned");
        task.AssignedAgentId.Should().NotBeEmpty();
        task.Type.Should().Be("PropertyAssessment");

        // Agent should now be Busy
        var agent = await ctx.AIAgents.FindAsync(task.AssignedAgentId);
        agent.Should().NotBeNull();
        agent!.Status.Should().Be("Busy");
    }

    [Fact]
    public async System.Threading.Tasks.Task AICommand_AssignTask_PreferredAgent_IsUsed()
    {
        var dbName = nameof(AICommand_AssignTask_PreferredAgent_IsUsed);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 5, "Active");

        var preferredAgent = await ctx.AIAgents.FirstAsync();

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var assignment = new AITaskAssignmentDto
        {
            TaskType = "Analysis",
            Description = "Run analysis",
            Priority = "Low",
            PreferredAgentId = preferredAgent.Id
        };
        var task = await service.AssignTaskAsync(assignment);

        task.Status.Should().Be("Assigned");
        task.AssignedAgentId.Should().Be(preferredAgent.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task AICommand_AssignTask_NoAgents_ReturnsQueued()
    {
        var dbName = nameof(AICommand_AssignTask_NoAgents_ReturnsQueued);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var assignment = new AITaskAssignmentDto
        {
            TaskType = "PropertyAssessment",
            Description = "Assess parcel 002",
            Priority = "Medium"
        };
        var task = await service.AssignTaskAsync(assignment);

        task.Status.Should().Be("Queued");
    }

    // ═══════════════════════════════════════════════════════════════
    // AICommandService — ScaleSwarmAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_ScaleSwarm_ScalesUpCorrectly()
    {
        var dbName = nameof(AICommand_ScaleSwarm_ScalesUpCorrectly);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 5, "Active");

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var result = await service.ScaleSwarmAsync(10);
        result.Should().BeTrue();

        var count = await ctx.AIAgents.CountAsync();
        count.Should().Be(10);
    }

    [Fact]
    public async System.Threading.Tasks.Task AICommand_ScaleSwarm_RejectsInvalidCount()
    {
        var dbName = nameof(AICommand_ScaleSwarm_RejectsInvalidCount);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var result = await service.ScaleSwarmAsync(-1);
        result.Should().BeFalse();
    }

    // ═══════════════════════════════════════════════════════════════
    // AICommandService — GetSwarmMetricsAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_GetSwarmMetrics_ReflectsRealData()
    {
        var dbName = nameof(AICommand_GetSwarmMetrics_ReflectsRealData);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 10, "Active");
        await SeedAgents(ctx, 2, "Busy");

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var metrics = await service.GetSwarmMetricsAsync();

        metrics.TotalTasks.Should().BeGreaterOrEqualTo(0);
        metrics.SuccessRate.Should().BeGreaterThan(0);
        metrics.ActiveTasks.Should().Be(2, "2 agents are Busy");
    }

    // ═══════════════════════════════════════════════════════════════
    // AICommandService — RestartAgentAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_RestartAgent_SetsActiveAndClearsTask()
    {
        var dbName = nameof(AICommand_RestartAgent_SetsActiveAndClearsTask);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var agent = new AIAgent
        {
            Name = "StuckAgent",
            Type = "DataProcessor",
            Status = "Busy",
            CurrentTask = "OldTask",
            ProcessedTasks = 50,
            PerformanceScore = 0.92,
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow.AddMinutes(-30)
        };
        ctx.AIAgents.Add(agent);
        await ctx.SaveChangesAsync();

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var result = await service.RestartAgentAsync(agent.Id);
        result.Should().BeTrue();

        var restarted = await ctx.AIAgents.FindAsync(agent.Id);
        restarted!.Status.Should().Be("Active");
        restarted.CurrentTask.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task AICommand_RestartAgent_NotFound_ReturnsFalse()
    {
        var dbName = nameof(AICommand_RestartAgent_NotFound_ReturnsFalse);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var result = await service.RestartAgentAsync(Guid.NewGuid());
        result.Should().BeFalse();
    }

    // ═══════════════════════════════════════════════════════════════
    // AIEngineService — GetEngineStatusAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_GetStatus_ReturnsRealModelAndAgentCounts()
    {
        var dbName = nameof(AIEngine_GetStatus_ReturnsRealModelAndAgentCounts);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 10, "Active");
        await SeedAgents(ctx, 2, "Busy");
        await SeedAIModels(identityCtx, 3, AIModelStatus.Active);
        await SeedAIModels(identityCtx, 1, AIModelStatus.Training);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var status = await service.GetEngineStatusAsync();

        status.ActiveModels.Should().Be(3);
        status.TotalModels.Should().Be(4);
        status.RunningJobs.Should().Be(2, "2 agents are Busy");
        status.Status.Should().Be("Active");
        status.Components.Should().HaveCount(3);
        status.Components.First(c => c.Name == "Training Pipeline").Status.Should().Be("Active");
    }

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_GetStatus_EmptyDb_ReturnsIdle()
    {
        var dbName = nameof(AIEngine_GetStatus_EmptyDb_ReturnsIdle);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var status = await service.GetEngineStatusAsync();

        status.ActiveModels.Should().Be(0);
        status.TotalModels.Should().Be(0);
        status.Status.Should().Be("Idle");
    }

    // ═══════════════════════════════════════════════════════════════
    // AIEngineService — TrainModelAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_TrainModel_UpdatesModelStatusToTraining()
    {
        var dbName = nameof(AIEngine_TrainModel_UpdatesModelStatusToTraining);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        identityCtx.AIModels.Add(new AIModel
        {
            Name = "CostForge-v3",
            Version = "3.0",
            Type = AIModelType.CostPrediction,
            Status = AIModelStatus.Active,
            Accuracy = 0.92m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await identityCtx.SaveChangesAsync();

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var request = new AIModelTrainingRequestDto
        {
            ModelName = "CostForge-v3",
            MaxEpochs = 50,
            LearningRate = 0.001,
            BatchSize = 32
        };

        var result = await service.TrainModelAsync(request);

        result.Status.Should().Be("Running");

        // Verify model status changed in DB
        var model = await identityCtx.AIModels
            .FirstOrDefaultAsync(m => m.Name == "CostForge-v3");
        model!.Status.Should().Be(AIModelStatus.Training);

        // Verify training metric was recorded
        var metric = await ctx.PerformanceMetrics
            .FirstOrDefaultAsync(m => m.MetricName == "TrainingStarted");
        metric.Should().NotBeNull();
        metric!.Source.Should().Be("CostForge-v3");
    }

    // ═══════════════════════════════════════════════════════════════
    // AIEngineService — AnalyzeMarketTrendsAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_AnalyzeMarketTrends_UsesRealAssessments()
    {
        var dbName = nameof(AIEngine_AnalyzeMarketTrends_UsesRealAssessments);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedPropertyAssessments(ctx, 20);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var request = new MarketTrendRequest { Region = "Benton County" };
        var result = await service.AnalyzeMarketTrendsAsync(request);

        result.Region.Should().Be("Benton County");
        result.TrendDirection.Should().BeOneOf("Upward", "Downward", "Stable");
        result.Confidence.Should().BeGreaterThan(0);
        result.MarketFactors.Should().Contain(f => f.Contains("20 properties"));
    }

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_AnalyzeMarketTrends_EmptyDb_ReturnsStable()
    {
        var dbName = nameof(AIEngine_AnalyzeMarketTrends_EmptyDb_ReturnsStable);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var request = new MarketTrendRequest { Region = "Empty" };
        var result = await service.AnalyzeMarketTrendsAsync(request);

        result.TrendDirection.Should().Be("Stable");
        result.Confidence.Should().Be(0);
    }

    // ═══════════════════════════════════════════════════════════════
    // AIEngineService — AssessInvestmentRiskAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_AssessInvestmentRisk_ComputesFromRealData()
    {
        var dbName = nameof(AIEngine_AssessInvestmentRisk_ComputesFromRealData);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        // Seed complete properties
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

        await SeedAgents(ctx, 10, "Active");
        await SeedPropertyAssessments(ctx, 15);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var request = new RiskAssessmentRequest();
        var result = await service.AssessInvestmentRiskAsync(request);

        result.RiskScore.Should().BeGreaterOrEqualTo(0);
        result.OverallRisk.Should().BeOneOf("Low", "Medium", "High", "Critical");
        result.RiskFactors.Should().HaveCount(3);
        result.RiskFactors.Should().Contain(f => f.Factor == "Data Quality");
        result.RiskFactors.Should().Contain(f => f.Factor == "System Health");
        result.RiskFactors.Should().Contain(f => f.Factor == "Market Volatility");
    }

    // ═══════════════════════════════════════════════════════════════
    // AIEngineService — GetAvailableModelsAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_GetAvailableModels_ReturnsRealModels()
    {
        var dbName = nameof(AIEngine_GetAvailableModels_ReturnsRealModels);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAIModels(identityCtx, 5);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var models = await service.GetAvailableModelsAsync();

        models.Should().HaveCount(5);
        models.Should().OnlyContain(m => m.Name.StartsWith("TestModel-"));
    }

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_GetAvailableModels_EmptyDb_ReturnsEmpty()
    {
        var dbName = nameof(AIEngine_GetAvailableModels_EmptyDb_ReturnsEmpty);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var models = await service.GetAvailableModelsAsync();

        models.Should().BeEmpty();
    }

    // ═══════════════════════════════════════════════════════════════
    // AIEngineService — IsAvailableAsync / InitializeAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_IsAvailable_WithAgents_ReturnsTrue()
    {
        var dbName = nameof(AIEngine_IsAvailable_WithAgents_ReturnsTrue);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 5, "Active");

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var available = await service.IsAvailableAsync();
        available.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_IsAvailable_EmptyDb_ReturnsFalse()
    {
        var dbName = nameof(AIEngine_IsAvailable_EmptyDb_ReturnsFalse);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var available = await service.IsAvailableAsync();
        available.Should().BeFalse();
    }

    // ═══════════════════════════════════════════════════════════════
    // CROSS-SERVICE: Verify no Random.Shared leaks
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async System.Threading.Tasks.Task AICommand_SwarmStatus_DeterministicWithSameData()
    {
        var dbName = nameof(AICommand_SwarmStatus_DeterministicWithSameData);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 10, "Active");

        var service = new AICommandService(identityCtx, ctx, CreateMapper(),
            NullLogger<AICommandService>.Instance);

        var status1 = await service.GetSwarmStatusAsync();
        var status2 = await service.GetSwarmStatusAsync();

        // Same database state = same results (no Random.Shared)
        status1.TotalAgents.Should().Be(status2.TotalAgents);
        status1.ActiveAgents.Should().Be(status2.ActiveAgents);
        status1.IdleAgents.Should().Be(status2.IdleAgents);
        status1.BusyAgents.Should().Be(status2.BusyAgents);
    }

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_Status_DeterministicWithSameData()
    {
        var dbName = nameof(AIEngine_Status_DeterministicWithSameData);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedAgents(ctx, 10, "Active");
        await SeedAIModels(identityCtx, 3);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var status1 = await service.GetEngineStatusAsync();
        var status2 = await service.GetEngineStatusAsync();

        // Same database state = same results (no Random.Shared)
        status1.ActiveModels.Should().Be(status2.ActiveModels);
        status1.TotalModels.Should().Be(status2.TotalModels);
        status1.RunningJobs.Should().Be(status2.RunningJobs);
        status1.Status.Should().Be(status2.Status);
    }

    [Fact]
    public async System.Threading.Tasks.Task AIEngine_MarketTrends_DeterministicWithSameData()
    {
        var dbName = nameof(AIEngine_MarketTrends_DeterministicWithSameData);
        await using var ctx = CreateDbContext(dbName);
        await using var identityCtx = CreateTerraFusionContext(dbName);
        await SeedPropertyAssessments(ctx, 20);

        var service = new AIEngineService(
            NullLogger<AIEngineService>.Instance, ctx, identityCtx);

        var request = new MarketTrendRequest { Region = "Test" };
        var result1 = await service.AnalyzeMarketTrendsAsync(request);
        var result2 = await service.AnalyzeMarketTrendsAsync(request);

        // Same database state = same results
        result1.TrendDirection.Should().Be(result2.TrendDirection);
        result1.Confidence.Should().Be(result2.Confidence);
        result1.PredictedGrowth.Should().Be(result2.PredictedGrowth);
    }
}
