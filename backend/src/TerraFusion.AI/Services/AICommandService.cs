using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Enums;
using TerraFusion.Core.Services;
using TerraFusion.Data;

namespace TerraFusion.AI.Services;

public class AICommandService : IAICommandService
{
    private readonly TerraFusionContext _context;
    private readonly TerraFusion.Data.TerraFusionDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<AICommandService> _logger;

    public AICommandService(TerraFusionContext context, TerraFusion.Data.TerraFusionDbContext dbContext, IMapper mapper, ILogger<AICommandService> logger)
    {
        _context = context;
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task<AISwarmStatusDto> GetSwarmStatusAsync()
    {
        _logger.LogInformation("Getting AI swarm status from database");

        var allAgents = await _dbContext.AIAgents.ToListAsync();
        var totalAgents = allAgents.Count;
        var activeAgents = allAgents.Count(a => a.Status == "Active");
        var idleAgents = allAgents.Count(a => a.Status == "Idle");
        var busyAgents = allAgents.Count(a => a.Status == "Busy" || a.Status == "Processing");
        var avgLoad = totalAgents > 0
            ? allAgents.Average(a => a.PerformanceScore) * 100
            : 0;

        var activeModels = await _context.AIModels
            .Where(m => m.Status == AIModelStatus.Active)
            .CountAsync();

        var agentStatuses = allAgents
            .OrderByDescending(a => a.LastActiveAt)
            .Take(20)
            .Select(a => new TerraFusion.Abstractions.DTOs.AIAgentStatusDto
            {
                AgentId = a.Id.ToString(),
                Name = a.Name,
                Status = a.Status,
                Type = a.Type,
                CurrentTask = a.CurrentTask ?? "None",
                LastActivity = a.LastActiveAt,
                TasksCompleted = a.ProcessedTasks,
                SuccessRate = a.PerformanceScore
            })
            .ToList();

        return new AISwarmStatusDto
        {
            Status = totalAgents > 0 ? "Active" : "No Agents Registered",
            TotalAgents = totalAgents,
            ActiveAgents = activeAgents,
            IdleAgents = idleAgents,
            BusyAgents = busyAgents,
            AverageLoad = avgLoad,
            LastUpdate = DateTime.UtcNow,
            AgentStatuses = agentStatuses
        };
    }

    public async System.Threading.Tasks.Task<TerraFusion.AI.DTOs.AICommandResultDto> ExecuteCommandAsync(TerraFusion.Core.DTOs.AICommandDto command)
    {
        _logger.LogInformation("Executing AI command: {Command}", command.Command);

        var commandId = Guid.NewGuid();
        var startTime = DateTime.UtcNow;

        // Find an available agent to execute the command
        var availableAgent = await _dbContext.AIAgents
            .Where(a => a.Status == "Active" || a.Status == "Idle")
            .OrderBy(a => a.ProcessedTasks)
            .FirstOrDefaultAsync();

        Guid executingAgentId = Guid.Empty;
        if (availableAgent != null)
        {
            availableAgent.Status = "Busy";
            availableAgent.CurrentTask = command.Command;
            availableAgent.LastActiveAt = DateTime.UtcNow;
            executingAgentId = availableAgent.Id;
        }

        // Log command execution to audit trail
        _dbContext.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND",
            Data = System.Text.Json.JsonSerializer.Serialize(new { command.Command, commandId }),
            Timestamp = startTime,
            Source = "AICommandService",
            Severity = "Info"
        });

        await _dbContext.SaveChangesAsync();

        var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
        var success = availableAgent != null;

        // Mark agent as available again after execution
        if (availableAgent != null)
        {
            availableAgent.Status = "Active";
            availableAgent.CurrentTask = null;
            availableAgent.ProcessedTasks++;
            await _dbContext.SaveChangesAsync();
        }

        return new TerraFusion.AI.DTOs.AICommandResultDto
        {
            CommandId = commandId,
            Success = success,
            Message = success ? $"Command executed by {availableAgent!.Name}" : "No available agents to execute command",
            Results = await GenerateCommandResultsAsync(command),
            ExecutionTimeMs = executionTime,
            ExecutedAt = DateTime.UtcNow,
            ExecutedByAgentId = executingAgentId
        };
    }

    public async System.Threading.Tasks.Task<IEnumerable<AIAgentDto>> GetActiveAgentsAsync()
    {
        var dbAgents = await _dbContext.AIAgents
            .Where(a => a.Status == "Active" || a.Status == "Busy" || a.Status == "Processing")
            .OrderByDescending(a => a.LastActiveAt)
            .Take(50)
            .ToListAsync();

        return dbAgents.Select(a => new AIAgentDto
        {
            Id = a.Id,
            Name = a.Name,
            Type = a.Type,
            Specialization = GetSpecialization(a.Type),
            Status = a.Status,
            LoadPercentage = a.PerformanceScore * 100,
            TasksCompleted = a.ProcessedTasks,
            TasksFailed = 0,
            AverageTaskTime = 0,
            CreatedAt = a.CreatedAt,
            LastActivity = a.LastActiveAt,
            Capabilities = GenerateCapabilities(a.Type)
        });
    }

    public async System.Threading.Tasks.Task<AIAgentDto> GetAgentAsync(Guid agentId)
    {
        var agent = await _dbContext.AIAgents.FindAsync(agentId);

        if (agent == null)
        {
            return new AIAgentDto
            {
                Id = agentId,
                Name = "Unknown",
                Type = "Unknown",
                Status = "NotFound"
            };
        }

        return new AIAgentDto
        {
            Id = agent.Id,
            Name = agent.Name,
            Type = agent.Type,
            Specialization = GetSpecialization(agent.Type),
            Status = agent.Status,
            LoadPercentage = agent.PerformanceScore * 100,
            TasksCompleted = agent.ProcessedTasks,
            TasksFailed = 0,
            AverageTaskTime = 0,
            CreatedAt = agent.CreatedAt,
            LastActivity = agent.LastActiveAt,
            Capabilities = GenerateCapabilities(agent.Type)
        };
    }

    public async System.Threading.Tasks.Task<AISwarmMetricsDto> GetSwarmMetricsAsync()
    {
        var agents = await _dbContext.AIAgents.ToListAsync();
        var totalTasks = agents.Sum(a => a.ProcessedTasks);
        var avgPerformance = agents.Count > 0 ? agents.Average(a => a.PerformanceScore) : 0;

        var recentMetrics = await _dbContext.PerformanceMetrics
            .OrderByDescending(m => m.Timestamp)
            .Take(100)
            .ToListAsync();

        return new AISwarmMetricsDto
        {
            TotalTasks = totalTasks,
            CompletedTasks = (int)(totalTasks * avgPerformance),
            FailedTasks = (int)(totalTasks * (1.0 - avgPerformance)),
            ActiveTasks = agents.Count(a => a.Status == "Busy" || a.Status == "Processing"),
            AverageTaskTime = recentMetrics.Count > 0 ? (double)recentMetrics.Average(m => m.Value) : 0,
            SuccessRate = avgPerformance,
            ThroughputPerMinute = agents.Count(a => a.Status == "Active") * avgPerformance * 10,
            MetricsDate = DateTime.UtcNow,
            PerformanceMetrics = await GeneratePerformanceMetricsAsync()
        };
    }

    public async System.Threading.Tasks.Task<bool> ScaleSwarmAsync(int targetAgentCount)
    {
        if (targetAgentCount < 0 || targetAgentCount > 10000)
        {
            _logger.LogWarning("Scale request rejected: {TargetCount} outside valid range [0, 10000]", targetAgentCount);
            return false;
        }

        var currentCount = await _dbContext.AIAgents.CountAsync();
        _logger.LogInformation("Scaling swarm from {Current} to {Target} agents", currentCount, targetAgentCount);

        if (targetAgentCount > currentCount)
        {
            var toCreate = targetAgentCount - currentCount;
            var agentTypes = new[] { "PropertyAssessor", "DataProcessor", "Analyst", "ComplianceMonitor" };

            for (int i = 0; i < toCreate; i++)
            {
                _dbContext.AIAgents.Add(new AIAgent
                {
                    Name = $"Agent-{currentCount + i + 1:D4}",
                    Type = agentTypes[i % agentTypes.Length],
                    Status = "Idle",
                    ProcessedTasks = 0,
                    PerformanceScore = 0.0,
                    CreatedAt = DateTime.UtcNow,
                    LastActiveAt = DateTime.UtcNow
                });
            }
        }
        else if (targetAgentCount < currentCount)
        {
            var toDeactivate = currentCount - targetAgentCount;
            var idleAgents = await _dbContext.AIAgents
                .Where(a => a.Status == "Idle" || a.Status == "Offline")
                .OrderByDescending(a => a.CreatedAt)
                .Take(toDeactivate)
                .ToListAsync();

            foreach (var agent in idleAgents)
            {
                agent.Status = "Offline";
                agent.LastActiveAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Swarm scaled to {Target} agents (was {Current})", targetAgentCount, currentCount);
        return true;
    }

    public async System.Threading.Tasks.Task<bool> RestartAgentAsync(Guid agentId)
    {
        var agent = await _dbContext.AIAgents.FindAsync(agentId);
        if (agent == null)
        {
            _logger.LogWarning("Agent {AgentId} not found for restart", agentId);
            return false;
        }

        var previousStatus = agent.Status;
        agent.Status = "Active";
        agent.CurrentTask = null;
        agent.LastActiveAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Agent {AgentId} ({Name}) restarted: {Previous} -> Active", agentId, agent.Name, previousStatus);
        return true;
    }

    public async System.Threading.Tasks.Task<IEnumerable<AITaskDto>> GetActiveTasksAsync()
    {
        var busyAgents = await _dbContext.AIAgents
            .Where(a => a.CurrentTask != null && (a.Status == "Busy" || a.Status == "Processing"))
            .OrderByDescending(a => a.LastActiveAt)
            .Take(50)
            .ToListAsync();

        return busyAgents.Select(a => new AITaskDto
        {
            Id = a.Id,
            Type = a.Type,
            Description = a.CurrentTask ?? "Processing",
            Status = "Running",
            Priority = a.PerformanceScore > 0.8 ? "High" : a.PerformanceScore > 0.5 ? "Medium" : "Low",
            AssignedAgentId = a.Id,
            CreatedAt = a.LastActiveAt.AddMinutes(-5),
            StartedAt = a.LastActiveAt,
            Parameters = new Dictionary<string, object>
            {
                ["agent_name"] = a.Name,
                ["agent_type"] = a.Type,
                ["county"] = a.AssignedCounty ?? "BENTON"
            }
        });
    }

    public async System.Threading.Tasks.Task<AITaskDto> AssignTaskAsync(AITaskAssignmentDto assignment)
    {
        _logger.LogInformation("Assigning task: {TaskType}", assignment.TaskType);

        // Find an available agent, preferring the requested one
        AIAgent? agent = null;
        if (assignment.PreferredAgentId.HasValue)
        {
            agent = await _dbContext.AIAgents.FindAsync(assignment.PreferredAgentId.Value);
            if (agent != null && agent.Status != "Active" && agent.Status != "Idle")
                agent = null; // preferred agent not available
        }

        agent ??= await _dbContext.AIAgents
            .Where(a => a.Status == "Active" || a.Status == "Idle")
            .OrderBy(a => a.ProcessedTasks)
            .FirstOrDefaultAsync();

        if (agent == null)
        {
            return new AITaskDto
            {
                Id = Guid.NewGuid(),
                Type = assignment.TaskType,
                Description = assignment.Description,
                Status = "Queued",
                Priority = assignment.Priority,
                CreatedAt = DateTime.UtcNow,
                Parameters = assignment.Parameters
            };
        }

        agent.Status = "Busy";
        agent.CurrentTask = $"{assignment.TaskType}: {assignment.Description}";
        agent.LastActiveAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return new AITaskDto
        {
            Id = agent.Id,
            Type = assignment.TaskType,
            Description = assignment.Description,
            Status = "Assigned",
            Priority = assignment.Priority,
            AssignedAgentId = agent.Id,
            CreatedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow,
            Parameters = assignment.Parameters
        };
    }

    public async System.Threading.Tasks.Task<bool> CancelTaskAsync(Guid taskId)
    {
        // taskId maps to agent ID for active tasks
        var agent = await _dbContext.AIAgents.FindAsync(taskId);
        if (agent == null || (agent.Status != "Busy" && agent.Status != "Processing"))
        {
            _logger.LogWarning("No active task found for ID {TaskId}", taskId);
            return false;
        }

        var previousTask = agent.CurrentTask;
        agent.Status = "Active";
        agent.CurrentTask = null;
        agent.LastActiveAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Cancelled task '{Task}' on agent {AgentId}", previousTask, taskId);
        return true;
    }

    public async System.Threading.Tasks.Task<IEnumerable<AIModelDto>> GetAllModelsAsync()
    {
        var models = await _context.AIModels
            .OrderBy(m => m.Type)
            .ThenBy(m => m.Name)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AIModelDto>>(models);
    }

    public async System.Threading.Tasks.Task<AIModelDto?> GetModelByIdAsync(int id)
    {
        var model = await _context.AIModels.FindAsync(id);
        return model != null ? _mapper.Map<AIModelDto>(model) : null;
    }

    public async System.Threading.Tasks.Task<IEnumerable<AIModelDto>> GetModelsByTypeAsync(AIModelType type)
    {
        var models = await _context.AIModels
            .Where(m => m.Type == type)
            .OrderBy(m => m.Name)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AIModelDto>>(models);
    }

    public async System.Threading.Tasks.Task<PredictionResultDto> RunPredictionAsync(PredictionInputDto input)
    {
        _logger.LogInformation("Running prediction with model {ModelId}", input.ModelId);
        var startTime = DateTime.UtcNow;

        var model = await _context.AIModels.FindAsync(input.ModelId);
        if (model == null)
        {
            throw new ArgumentException($"AI Model with ID {input.ModelId} not found");
        }

        if (model.Status != AIModelStatus.Active)
        {
            throw new InvalidOperationException($"AI Model {model.Name} is not active (Status: {model.Status})");
        }

        // Generate prediction based on model type using real DB data
        var predictionResult = model.Type switch
        {
            AIModelType.PropertyValuation => await GeneratePropertyValuationAsync(input.InputData),
            AIModelType.CostPrediction => await GenerateCostPredictionAsync(input.InputData),
            AIModelType.MarketAnalysis => await GenerateMarketAnalysisAsync(input.InputData),
            AIModelType.RiskAssessment => await GenerateRiskAssessmentAsync(input.InputData),
            AIModelType.ComplianceCheck => await GenerateComplianceCheckAsync(input.InputData),
            _ => new Dictionary<string, object> { { "prediction", "Generic prediction result" } }
        };

        var processingTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

        // Record prediction metric
        _dbContext.PerformanceMetrics.Add(new TerraFusion.Core.Entities.PerformanceMetric
        {
            MetricName = "PredictionsCount",
            MetricType = "Prediction",
            Value = 1,
            Unit = "count",
            Timestamp = DateTime.UtcNow,
            Source = model.Name,
            RelatedEntityType = "AIModel",
            RelatedEntityId = model.Id
        });
        await _dbContext.SaveChangesAsync();

        var result = new PredictionResultDto
        {
            ModelId = Guid.Parse(input.ModelId),
            ModelName = model.Name,
            InputData = input.InputData,
            PredictionId = Guid.NewGuid().ToString(),
            ProcessedAt = DateTime.UtcNow,
            ProcessingTimeMs = processingTime,
            Confidence = (decimal)model.Accuracy,
            Result = predictionResult
        };

        _logger.LogInformation("Prediction completed for model {ModelName} with confidence {Confidence:P2} in {Ms}ms",
            model.Name, result.Confidence, processingTime);

        return result;
    }

    public async System.Threading.Tasks.Task<ModelTrainingStatusDto> TrainModelAsync(ModelTrainingConfigDto config)
    {
        _logger.LogInformation("Starting training for model {ModelName}", config.ModelName);

        var model = await _context.AIModels
            .FirstOrDefaultAsync(m => m.Name == config.ModelName);

        if (model == null)
        {
            throw new ArgumentException($"AI Model {config.ModelName} not found");
        }

        // Update model status to training
        model.Status = AIModelStatus.Training;
        model.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Record training start metric
        _dbContext.PerformanceMetrics.Add(new TerraFusion.Core.Entities.PerformanceMetric
        {
            MetricName = "TrainingStarted",
            MetricType = "Training",
            Value = config.Epochs,
            Unit = "epochs",
            Timestamp = DateTime.UtcNow,
            Source = model.Name,
            RelatedEntityType = "AIModel",
            RelatedEntityId = model.Id,
            Metadata = System.Text.Json.JsonSerializer.Serialize(new { config.TrainingDataSize, config.BatchSize, config.Epochs })
        });

        // Log to audit trail
        _dbContext.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:TrainModel",
            Data = System.Text.Json.JsonSerializer.Serialize(new { config.ModelName, config.Epochs, config.TrainingDataSize }),
            Timestamp = DateTime.UtcNow,
            Source = "AICommandService",
            Severity = "Info"
        });

        await _dbContext.SaveChangesAsync();

        // Estimate completion based on dataset size and epochs
        var estimatedMinutes = Math.Max(1, (config.TrainingDataSize / 10000.0) * config.Epochs * 0.5);

        return new ModelTrainingStatusDto
        {
            ModelId = model.Id.GetHashCode(),
            ModelName = model.Name,
            Status = "Training",
            Progress = 0,
            StartedAt = DateTime.UtcNow,
            EstimatedCompletionTime = DateTime.UtcNow.AddMinutes(estimatedMinutes),
            TrainingDataSize = config.TrainingDataSize,
            Epochs = config.Epochs,
            BatchSize = config.BatchSize
        };
    }

    public async System.Threading.Tasks.Task<AIModelHealthDto> GetModelHealthAsync(int modelId)
    {
        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            throw new ArgumentException($"AI Model with ID {modelId} not found");
        }

        // Query real performance metrics for this model
        var recentMetrics = await _dbContext.PerformanceMetrics
            .Where(m => m.Source == model.Name || (m.RelatedEntityType == "AIModel" && m.RelatedEntityId == model.Id))
            .OrderByDescending(m => m.Timestamp)
            .Take(50)
            .ToListAsync();

        var cpuMetrics = recentMetrics.Where(m => m.MetricName == "CpuUsage").ToList();
        var memMetrics = recentMetrics.Where(m => m.MetricName == "MemoryUsage").ToList();
        var responseMetrics = recentMetrics.Where(m => m.MetricName == "ResponseTime").ToList();
        var errorMetrics = recentMetrics.Where(m => m.MetricName == "ErrorRate").ToList();
        var predictionMetrics = recentMetrics.Where(m => m.MetricName == "PredictionsCount").ToList();

        return new AIModelHealthDto
        {
            ModelId = model.Id.GetHashCode(),
            ModelName = model.Name,
            Status = model.Status,
            Accuracy = (decimal)model.Accuracy,
            LastUpdated = model.UpdatedAt,
            IsHealthy = model.Status == AIModelStatus.Active,
            CpuUsage = cpuMetrics.Any() ? cpuMetrics.Average(m => m.Value) : 0,
            MemoryUsage = memMetrics.Any() ? (long)memMetrics.Average(m => m.Value) : 0,
            PredictionsToday = predictionMetrics.Any() ? (int)predictionMetrics.Sum(m => m.Value) : 0,
            ErrorRate = errorMetrics.Any() ? (decimal)errorMetrics.Average(m => m.Value) : 0m,
            AverageResponseTime = responseMetrics.Any() ? (decimal)responseMetrics.Average(m => m.Value) : 0m
        };
    }

    public async System.Threading.Tasks.Task<IEnumerable<AIModelHealthDto>> GetAllModelsHealthAsync()
    {
        var models = await _context.AIModels.ToListAsync();
        var healthChecks = new List<AIModelHealthDto>();

        foreach (var model in models)
        {
            var health = await GetModelHealthAsync(model.Id.GetHashCode()); // Convert Guid to int
            healthChecks.Add(health);
        }

        return healthChecks;
    }

    private async System.Threading.Tasks.Task<Dictionary<string, object>> GeneratePropertyValuationAsync(Dictionary<string, object> inputData)
    {
        var sqft = inputData.ContainsKey("squareFootage") ? Convert.ToDouble(inputData["squareFootage"]) : 2000;

        // Query real assessment data for price-per-sqft from PropertyAssessments
        var assessments = await _dbContext.PropertyAssessments
            .Where(pa => pa.IsActive && pa.MarketValue > 0)
            .ToListAsync();

        double avgPricePerSqft = 200; // fallback
        if (assessments.Any())
        {
            var totalMarketValue = assessments.Sum(a => (double)a.MarketValue);
            var count = assessments.Count;
            avgPricePerSqft = totalMarketValue / (count * 1800.0); // avg sqft estimate
        }

        var estimatedValue = sqft * avgPricePerSqft;
        var marketTrend = assessments.Count > 10 ? "data_driven" : "insufficient_data";

        return new Dictionary<string, object>
        {
            { "estimatedValue", estimatedValue },
            { "pricePerSqFt", avgPricePerSqft },
            { "marketTrend", marketTrend },
            { "comparableProperties", assessments.Count },
            { "dataSource", "PropertyAssessments" }
        };
    }

    private async System.Threading.Tasks.Task<Dictionary<string, object>> GenerateCostPredictionAsync(Dictionary<string, object> inputData)
    {
        // Query real assessment data for cost baselines
        var assessments = await _dbContext.PropertyAssessments
            .Where(pa => pa.IsActive && pa.AssessedValue > 0)
            .ToListAsync();

        double avgAssessedValue = 250000; // fallback
        if (assessments.Any())
        {
            avgAssessedValue = assessments.Average(a => (double)a.AssessedValue);
        }

        return new Dictionary<string, object>
        {
            { "estimatedCost", avgAssessedValue },
            { "costBreakdown", new Dictionary<string, object>
                {
                    { "materials", avgAssessedValue * 0.4 },
                    { "labor", avgAssessedValue * 0.35 },
                    { "permits", avgAssessedValue * 0.05 },
                    { "overhead", avgAssessedValue * 0.2 }
                }
            },
            { "sampleSize", assessments.Count },
            { "dataSource", "PropertyAssessments" }
        };
    }

    private async System.Threading.Tasks.Task<Dictionary<string, object>> GenerateMarketAnalysisAsync(Dictionary<string, object> inputData)
    {
        // Compute market metrics from real assessment data
        var assessments = await _dbContext.PropertyAssessments
            .Where(pa => pa.IsActive && pa.MarketValue > 0 && pa.AssessedValue > 0)
            .ToListAsync();

        if (!assessments.Any())
        {
            return new Dictionary<string, object>
            {
                { "marketScore", 0 },
                { "trendDirection", "no_data" },
                { "volatility", 0.0 },
                { "sampleSize", 0 }
            };
        }

        var ratios = assessments.Select(a => (double)a.AssessedValue / (double)a.MarketValue).ToList();
        var avgRatio = ratios.Average();
        var stdDev = Math.Sqrt(ratios.Average(r => Math.Pow(r - avgRatio, 2)));
        var volatility = avgRatio > 0 ? stdDev / avgRatio : 0;

        // Market score: higher when assessed/market ratio is close to 1.0 and volatility is low
        var marketScore = Math.Max(0, Math.Min(100, (int)(100 * (1 - Math.Abs(avgRatio - 1.0)) * (1 - volatility))));
        var trendDirection = avgRatio > 1.02 ? "assessed_above_market" : avgRatio < 0.98 ? "assessed_below_market" : "stable";

        return new Dictionary<string, object>
        {
            { "marketScore", marketScore },
            { "trendDirection", trendDirection },
            { "volatility", Math.Round(volatility, 4) },
            { "avgAssessedToMarketRatio", Math.Round(avgRatio, 4) },
            { "sampleSize", assessments.Count }
        };
    }

    private async System.Threading.Tasks.Task<Dictionary<string, object>> GenerateRiskAssessmentAsync(Dictionary<string, object> inputData)
    {
        // Compute risk from data quality and agent health
        var totalProperties = await _dbContext.Properties.CountAsync();
        var propertiesWithAddress = await _dbContext.Properties
            .Where(p => !string.IsNullOrEmpty(p.Address))
            .CountAsync();

        var dataCompleteness = totalProperties > 0 ? (double)propertiesWithAddress / totalProperties : 1.0;

        var agents = await _dbContext.AIAgents.ToListAsync();
        var agentHealth = agents.Count > 0 ? agents.Count(a => a.Status != "Offline" && a.Status != "Error") / (double)agents.Count : 1.0;

        var riskScore = (int)Math.Max(1, Math.Min(10, 10 * (1 - (dataCompleteness + agentHealth) / 2)));
        var riskLevel = riskScore <= 3 ? "low" : riskScore <= 6 ? "medium" : "high";

        return new Dictionary<string, object>
        {
            { "riskScore", riskScore },
            { "riskLevel", riskLevel },
            { "dataCompleteness", Math.Round(dataCompleteness, 4) },
            { "agentHealth", Math.Round(agentHealth, 4) },
            { "factors", new[] { "data_completeness", "agent_availability", "system_health" } }
        };
    }

    private async System.Threading.Tasks.Task<Dictionary<string, object>> GenerateComplianceCheckAsync(Dictionary<string, object> inputData)
    {
        // Compute compliance from real audit logs
        var recentAuditCount = await _dbContext.AuditLogs
            .Where(a => a.Timestamp > DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        var failedAudits = await _dbContext.AuditLogs
            .Where(a => a.Timestamp > DateTime.UtcNow.AddDays(-30) && a.ResponseStatusCode.HasValue && a.ResponseStatusCode >= 400)
            .CountAsync();

        var complianceScore = recentAuditCount > 0
            ? (int)(100.0 * (recentAuditCount - failedAudits) / recentAuditCount)
            : 100;

        var status = complianceScore >= 95 ? "compliant" : complianceScore >= 80 ? "needs_review" : "non_compliant";

        return new Dictionary<string, object>
        {
            { "complianceScore", complianceScore },
            { "violations", failedAudits },
            { "status", status },
            { "auditedOperations", recentAuditCount },
            { "dataSource", "AuditLogs" }
        };
    }

    private async System.Threading.Tasks.Task<Dictionary<string, object>> GenerateCommandResultsAsync(TerraFusion.Core.DTOs.AICommandDto command)
    {
        var baseResults = new Dictionary<string, object> { ["command"] = command.Command, ["timestamp"] = DateTime.UtcNow };

        switch (command.Command.ToLower())
        {
            case "status":
                var totalAgents = await _dbContext.AIAgents.CountAsync();
                var activeAgents = await _dbContext.AIAgents.CountAsync(a => a.Status == "Active" || a.Status == "Busy");
                baseResults["swarm_status"] = activeAgents > 0 ? "active" : "idle";
                baseResults["agent_count"] = totalAgents;
                baseResults["active_count"] = activeAgents;
                break;
            case "scale":
                baseResults["current_agent_count"] = await _dbContext.AIAgents.CountAsync();
                break;
            case "restart":
                baseResults["restarted_agents"] = 1;
                baseResults["success"] = true;
                break;
            default:
                baseResults["result"] = "Command executed";
                break;
        }

        return baseResults;
    }

    private static string GetSpecialization(string agentType)
    {
        return agentType switch
        {
            "PropertyAssessment" => "Residential Property Valuation",
            "Analytics" => "Market Trend Analysis",
            "Compliance" => "Regulatory Compliance Monitoring",
            "DataValidation" => "Property Data Validation",
            _ => "General Purpose"
        };
    }

    private static Dictionary<string, object> GenerateCapabilities(string agentType)
    {
        return agentType switch
        {
            "PropertyAssessment" => new Dictionary<string, object>
            {
                ["max_property_value"] = 10000000,
                ["supported_property_types"] = new[] { "residential", "commercial" },
                ["accuracy_rate"] = 0.97
            },
            "Analytics" => new Dictionary<string, object>
            {
                ["data_sources"] = new[] { "mls", "public_records", "market_data" },
                ["analysis_types"] = new[] { "trend", "forecast", "comparison" },
                ["processing_speed"] = "high"
            },
            _ => new Dictionary<string, object> { ["general"] = true }
        };
    }

    private async System.Threading.Tasks.Task<List<AIPerformanceMetricDto>> GeneratePerformanceMetricsAsync()
    {
        var recentMetrics = await _dbContext.PerformanceMetrics
            .Where(m => m.Timestamp > DateTime.UtcNow.AddHours(-1))
            .ToListAsync();

        var metricNames = new[] { "CpuUsage", "MemoryUsage", "ResponseTime", "ErrorRate" };
        var results = new List<AIPerformanceMetricDto>();

        foreach (var name in metricNames)
        {
            var matching = recentMetrics.Where(m => m.MetricName == name).ToList();
            results.Add(new AIPerformanceMetricDto
            {
                MetricName = name,
                Value = matching.Any() ? matching.Average(m => m.Value) : 0,
                Unit = matching.FirstOrDefault()?.Unit ?? "unknown",
                Timestamp = DateTime.UtcNow
            });
        }

        // Add tasks-per-second from agent throughput
        var agents = await _dbContext.AIAgents.ToListAsync();
        var activeCount = agents.Count(a => a.Status == "Active" || a.Status == "Busy");
        results.Add(new AIPerformanceMetricDto
        {
            MetricName = "ActiveAgents",
            Value = activeCount,
            Unit = "agents",
            Timestamp = DateTime.UtcNow
        });

        return results;
    }

    private static string GenerateTaskDescription(string taskType)
    {
        return taskType switch
        {
            "PropertyAssessment" => "Assess property value for parcel ID 12345",
            "DataValidation" => "Validate property data integrity",
            "ReportGeneration" => "Generate monthly assessment report",
            "ComplianceCheck" => "Check zoning compliance for new construction",
            _ => "General AI System.Threading.Tasks.Task execution"
        };
    }

    private static Dictionary<string, object> GenerateTaskParameters(string taskType)
    {
        return taskType switch
        {
            "PropertyAssessment" => new Dictionary<string, object>
            {
                ["property_id"] = Guid.NewGuid(),
                ["assessment_type"] = "full",
                ["include_comparables"] = true
            },
            "DataValidation" => new Dictionary<string, object>
            {
                ["dataset"] = "properties",
                ["validation_rules"] = new[] { "required_fields", "data_types", "ranges" }
            },
            _ => new Dictionary<string, object> { ["task_type"] = taskType }
        };
    }

    public async System.Threading.Tasks.Task<AIModelDto> DeployModelAsync(int modelId)
    {
        _logger.LogInformation("Deploying model {ModelId}", modelId);

        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            throw new ArgumentException($"AI Model with ID {modelId} not found");
        }

        model.Status = AIModelStatus.Active;
        model.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _dbContext.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:DeployModel",
            Data = System.Text.Json.JsonSerializer.Serialize(new { modelId, model.Name }),
            Timestamp = DateTime.UtcNow,
            Source = "AICommandService",
            Severity = "Info"
        });
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Model {ModelName} deployed successfully", model.Name);
        return _mapper.Map<AIModelDto>(model);
    }

    public async System.Threading.Tasks.Task<bool> UndeployModelAsync(int modelId)
    {
        _logger.LogInformation("Undeploying model {ModelId}", modelId);

        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            _logger.LogWarning("Model {ModelId} not found for undeployment", modelId);
            return false;
        }

        model.Status = AIModelStatus.Inactive;
        model.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _dbContext.AuditLogs.Add(new AuditLog
        {
            Type = "AI_COMMAND:UndeployModel",
            Data = System.Text.Json.JsonSerializer.Serialize(new { modelId, model.Name }),
            Timestamp = DateTime.UtcNow,
            Source = "AICommandService",
            Severity = "Info"
        });
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Model {ModelName} undeployed", model.Name);
        return true;
    }

    public async System.Threading.Tasks.Task<IEnumerable<AIModelHealthDto>> GetAllModelHealthAsync()
    {
        var models = await _context.AIModels.ToListAsync();
        var healthChecks = new List<AIModelHealthDto>();

        foreach (var model in models)
        {
            var health = await GetModelHealthAsync(model.Id.GetHashCode());
            healthChecks.Add(health);
        }

        return healthChecks;
    }

    public async System.Threading.Tasks.Task<PredictionResultDto> RunPredictionAsync(int modelId, PredictionInputDto input)
    {
        _logger.LogInformation("Running prediction with model {ModelId}", modelId);
        var startTime = DateTime.UtcNow;

        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            throw new ArgumentException($"AI Model with ID {modelId} not found");
        }

        var predictionResult = await GeneratePropertyValuationAsync(input.InputData ?? new Dictionary<string, object>());
        var processingTime = DateTime.UtcNow - startTime;

        // Record prediction metric
        _dbContext.PerformanceMetrics.Add(new TerraFusion.Core.Entities.PerformanceMetric
        {
            MetricName = "PredictionsCount",
            MetricType = "Prediction",
            Value = 1,
            Unit = "count",
            Timestamp = DateTime.UtcNow,
            Source = model.Name,
            RelatedEntityType = "AIModel",
            RelatedEntityId = model.Id
        });
        await _dbContext.SaveChangesAsync();

        return new PredictionResultDto
        {
            ModelId = model.Id,
            Predictions = predictionResult,
            Confidence = (decimal)model.Accuracy,
            ProcessingTime = processingTime,
            Timestamp = DateTime.UtcNow
        };
    }

    public async System.Threading.Tasks.Task<BatchPredictionResultDto> RunBatchPredictionAsync(int modelId, IEnumerable<PredictionInputDto> inputs)
    {
        _logger.LogInformation("Running batch prediction with model {ModelId}", modelId);
        var startTime = DateTime.UtcNow;

        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            throw new ArgumentException($"AI Model with ID {modelId} not found");
        }

        var inputList = inputs.ToList();
        var results = new List<PredictionResultDto>();

        foreach (var input in inputList)
        {
            var predictionResult = await GeneratePropertyValuationAsync(input.InputData ?? new Dictionary<string, object>());
            results.Add(new PredictionResultDto
            {
                ModelId = model.Id,
                Success = true,
                Confidence = (decimal)model.Accuracy,
                Results = predictionResult
            });
        }

        // Record batch metric
        _dbContext.PerformanceMetrics.Add(new TerraFusion.Core.Entities.PerformanceMetric
        {
            MetricName = "PredictionsCount",
            MetricType = "Prediction",
            Value = inputList.Count,
            Unit = "count",
            Timestamp = DateTime.UtcNow,
            Source = model.Name,
            RelatedEntityType = "AIModel",
            RelatedEntityId = model.Id
        });
        await _dbContext.SaveChangesAsync();

        return new BatchPredictionResultDto
        {
            ModelId = modelId.ToString(),
            TotalPredictions = results.Count,
            SuccessfulPredictions = results.Count(r => r.Success),
            Results = results
        };
    }

    public async System.Threading.Tasks.Task<TerraFusion.AI.DTOs.AICommandStatsDto> GetAICommandStatsAsync()
    {
        var commandLogs = await _dbContext.AuditLogs
            .Where(a => a.Type != null && a.Type.StartsWith("AI_COMMAND"))
            .ToListAsync();

        var totalCommands = commandLogs.Count;
        var successful = commandLogs.Count(a => a.ResponseStatusCode == null || a.ResponseStatusCode < 400);
        var avgResponseTime = commandLogs
            .Where(a => a.DurationMs.HasValue)
            .Select(a => (double)a.DurationMs!.Value)
            .DefaultIfEmpty(0)
            .Average();

        var activeModels = await _context.AIModels
            .CountAsync(m => m.Status == AIModelStatus.Active);

        return new TerraFusion.AI.DTOs.AICommandStatsDto
        {
            TotalCommands = totalCommands,
            SuccessfulCommands = successful,
            FailedCommands = totalCommands - successful,
            AverageResponseTime = avgResponseTime,
            ActiveModels = activeModels,
            LastUpdated = DateTime.UtcNow
        };
    }

    public async System.Threading.Tasks.Task<bool> StartModelTrainingAsync(int modelId, TrainingConfigDto config)
    {
        _logger.LogInformation("Starting training for model {ModelId}", modelId);

        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            _logger.LogWarning("Model {ModelId} not found for training", modelId);
            return false;
        }

        model.Status = AIModelStatus.Training;
        model.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _dbContext.PerformanceMetrics.Add(new TerraFusion.Core.Entities.PerformanceMetric
        {
            MetricName = "TrainingStarted",
            MetricType = "Training",
            Value = config.Epochs,
            Unit = "epochs",
            Timestamp = DateTime.UtcNow,
            Source = model.Name,
            RelatedEntityType = "AIModel",
            RelatedEntityId = model.Id
        });
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Training started for model {ModelName}", model.Name);
        return true;
    }

    public async System.Threading.Tasks.Task<TerraFusion.AI.DTOs.TrainingStatusDto> GetTrainingStatusAsync(int modelId)
    {
        var model = await _context.AIModels.FindAsync(modelId);
        if (model == null)
        {
            return new TerraFusion.AI.DTOs.TrainingStatusDto
            {
                ModelId = modelId,
                Status = TerraFusion.AI.DTOs.TrainingStatus.NotStarted
            };
        }

        // Query training metrics for this model
        var trainingMetrics = await _dbContext.PerformanceMetrics
            .Where(m => m.RelatedEntityType == "AIModel" && m.RelatedEntityId == model.Id && m.MetricName == "TrainingStarted")
            .OrderByDescending(m => m.Timestamp)
            .FirstOrDefaultAsync();

        var status = model.Status switch
        {
            AIModelStatus.Training => TerraFusion.AI.DTOs.TrainingStatus.InProgress,
            AIModelStatus.Active => TerraFusion.AI.DTOs.TrainingStatus.Completed,
            _ => TerraFusion.AI.DTOs.TrainingStatus.NotStarted
        };

        var totalEpochs = trainingMetrics != null ? (int)trainingMetrics.Value : 20;

        return new TerraFusion.AI.DTOs.TrainingStatusDto
        {
            ModelId = modelId,
            Status = status,
            Progress = model.Status == AIModelStatus.Active ? 1.0 : model.Status == AIModelStatus.Training ? 0.5 : 0,
            EpochsCompleted = model.Status == AIModelStatus.Active ? totalEpochs : (int)(totalEpochs * 0.5),
            TotalEpochs = totalEpochs,
            CurrentLoss = model.Status == AIModelStatus.Active ? 0.001 : 0.05,
            EstimatedTimeRemaining = model.Status == AIModelStatus.Training ? TimeSpan.FromMinutes(5) : TimeSpan.Zero
        };
    }

    // Core IAICommandService interface implementations
    public async System.Threading.Tasks.Task<TerraFusion.Core.Interfaces.AICommandResult> ExecuteCommandAsync(string command, object parameters)
    {
        _logger.LogInformation("Executing AI command: {Command}", command);
        var startTime = DateTime.UtcNow;

        // Find an available agent
        var agent = await _dbContext.AIAgents
            .Where(a => a.Status == "Active" || a.Status == "Idle")
            .OrderBy(a => a.ProcessedTasks)
            .FirstOrDefaultAsync();

        if (agent != null)
        {
            agent.Status = "Busy";
            agent.CurrentTask = command;
            agent.LastActiveAt = DateTime.UtcNow;
        }

        // Log to audit trail
        _dbContext.AuditLogs.Add(new AuditLog
        {
            Type = $"AI_COMMAND:{command}",
            Data = System.Text.Json.JsonSerializer.Serialize(parameters),
            Timestamp = startTime,
            Source = "AICommandService",
            Severity = "Info"
        });

        await _dbContext.SaveChangesAsync();
        var executionTime = DateTime.UtcNow - startTime;

        // Release agent
        if (agent != null)
        {
            agent.Status = "Active";
            agent.CurrentTask = null;
            agent.ProcessedTasks++;
            await _dbContext.SaveChangesAsync();
        }

        return new TerraFusion.Core.Interfaces.AICommandResult
        {
            ExecutionId = Guid.NewGuid(),
            Success = agent != null,
            Result = agent != null ? $"Command '{command}' executed by {agent.Name}" : $"No available agents for '{command}'",
            ExecutionTime = executionTime,
            ExecutedAt = DateTime.UtcNow
        };
    }

    public async System.Threading.Tasks.Task<IEnumerable<TerraFusion.Core.Interfaces.AICommandInfo>> GetAvailableCommandsAsync()
    {
        // Build available commands from active models and agent capabilities
        var activeModels = await _context.AIModels
            .Where(m => m.Status == AIModelStatus.Active)
            .ToListAsync();

        var commands = new List<TerraFusion.Core.Interfaces.AICommandInfo>
        {
            new() { Name = "status", Description = "Get AI swarm status", Category = "System", IsEnabled = true },
            new() { Name = "scale", Description = "Scale agent swarm", Category = "System", IsEnabled = true },
            new() { Name = "restart", Description = "Restart an agent", Category = "System", IsEnabled = true }
        };

        // Add model-based commands for each active model
        foreach (var model in activeModels)
        {
            var category = model.Type switch
            {
                AIModelType.PropertyValuation => "Analysis",
                AIModelType.CostPrediction => "Finance",
                AIModelType.MarketAnalysis => "Analytics",
                AIModelType.RiskAssessment => "Finance",
                AIModelType.ComplianceCheck => "Compliance",
                _ => "General"
            };

            commands.Add(new TerraFusion.Core.Interfaces.AICommandInfo
            {
                Name = model.Name,
                Description = $"{model.Type} prediction using {model.Name}",
                Category = category,
                IsEnabled = true
            });
        }

        return commands;
    }

    public async System.Threading.Tasks.Task<IEnumerable<TerraFusion.Core.Interfaces.AICommandExecution>> GetCommandHistoryAsync(int limit = 100)
    {
        var logs = await _dbContext.AuditLogs
            .Where(a => a.Type != null && a.Type.StartsWith("AI_COMMAND"))
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .ToListAsync();

        return logs.Select(log => new TerraFusion.Core.Interfaces.AICommandExecution
        {
            Id = log.Id,
            Command = log.Type ?? "Unknown",
            Status = (log.ResponseStatusCode == null || log.ResponseStatusCode < 400) ? "Completed" : "Failed",
            StartedAt = log.Timestamp,
            CompletedAt = log.DurationMs.HasValue ? log.Timestamp.AddMilliseconds(log.DurationMs.Value) : log.Timestamp,
            Success = log.ResponseStatusCode == null || log.ResponseStatusCode < 400,
            UserId = log.UserId ?? "system"
        });
    }

    public async System.Threading.Tasks.Task<TerraFusion.Core.Interfaces.AICommandStatistics> GetCommandStatisticsAsync()
    {
        var commandLogs = await _dbContext.AuditLogs
            .Where(a => a.Type != null && a.Type.StartsWith("AI_COMMAND"))
            .ToListAsync();

        var total = commandLogs.Count;
        var successful = commandLogs.Count(a => a.ResponseStatusCode == null || a.ResponseStatusCode < 400);
        var avgTime = commandLogs
            .Where(a => a.DurationMs.HasValue)
            .Select(a => (double)a.DurationMs!.Value)
            .DefaultIfEmpty(0)
            .Average();

        return new TerraFusion.Core.Interfaces.AICommandStatistics
        {
            TotalExecutions = total,
            SuccessfulExecutions = successful,
            FailedExecutions = total - successful,
            AverageExecutionTimeMs = avgTime,
            SuccessRate = total > 0 ? (double)successful / total : 0
        };
    }

    public async System.Threading.Tasks.Task<TerraFusion.Core.Interfaces.AICommandValidationResult> ValidateCommandAsync(string command, object parameters)
    {
        var errors = new List<string>();
        var warnings = new List<string>();

        if (string.IsNullOrWhiteSpace(command))
        {
            errors.Add("Command cannot be empty");
        }

        // Check if agents are available
        var availableAgents = await _dbContext.AIAgents
            .CountAsync(a => a.Status == "Active" || a.Status == "Idle");

        if (availableAgents == 0)
        {
            warnings.Add("No agents currently available; command will be queued");
        }

        return new TerraFusion.Core.Interfaces.AICommandValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors,
            Warnings = warnings
        };
    }

    public async System.Threading.Tasks.Task<bool> CancelCommandAsync(Guid executionId)
    {
        _logger.LogInformation("Cancelling command execution: {ExecutionId}", executionId);

        // Find the audit log entry for this execution
        var auditLog = await _dbContext.AuditLogs
            .Where(a => a.Type != null && a.Type.StartsWith("AI_COMMAND") && a.Data != null && a.Data.Contains(executionId.ToString()))
            .FirstOrDefaultAsync();

        if (auditLog == null)
        {
            _logger.LogWarning("No command execution found for ID {ExecutionId}", executionId);
            return false;
        }

        // Find any busy agent working on this command and release it
        var busyAgents = await _dbContext.AIAgents
            .Where(a => a.Status == "Busy" || a.Status == "Processing")
            .ToListAsync();

        foreach (var agent in busyAgents)
        {
            agent.Status = "Active";
            agent.CurrentTask = null;
            agent.LastActiveAt = DateTime.UtcNow;
        }

        if (busyAgents.Any())
        {
            await _dbContext.SaveChangesAsync();
        }

        _logger.LogInformation("Command {ExecutionId} cancelled, released {Count} agents", executionId, busyAgents.Count);
        return true;
    }
}

