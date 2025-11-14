using TerraFusion.API.Interfaces;
using TerraFusion.API.Services;
using AbstractionsInterface = TerraFusion.Abstractions.Interfaces;
using ApiPerf = TerraFusion.API.Interfaces;

namespace TerraFusion.API.Services;

/// <summary>
/// Adapter to bridge TerraFusion.API.Interfaces.IPerformanceMonitor to TerraFusion.Abstractions.Interfaces.IPerformanceMonitor.
/// Allows the PerformanceMonitorService to be injected as both interface types.
/// </summary>
public class PerformanceMonitorAdapter : AbstractionsInterface.IPerformanceMonitor
{
    private readonly IPerformanceMonitor _apiPerformanceMonitor;

    public PerformanceMonitorAdapter(IPerformanceMonitor apiPerformanceMonitor)
    {
        _apiPerformanceMonitor = apiPerformanceMonitor;
    }

    public IDisposable StartActivity(string activityName, string? context = null)
    {
        return _apiPerformanceMonitor.StartActivity(activityName, context);
    }

    public async Task<AbstractionsInterface.PerformanceMonitoringResult> StartPerformanceMonitoringAsync(
        AbstractionsInterface.PerformanceMonitoringRequest request,
        CancellationToken cancellationToken = default)
    {
        // Map from Abstractions types to API types
        var apiRequest = new PerformanceMonitoringRequest
        {
            SystemIdentifier = request.SystemIdentifier,
            Configuration = new MonitoringConfiguration
            {
                SamplingInterval = request.Configuration.SamplingInterval,
                RealTimeAlerts = request.Configuration.RealTimeAlerts,
                AlertThreshold = request.Configuration.AlertThreshold,
                PredictiveAnalytics = request.Configuration.PredictiveAnalytics,
                CustomSettings = request.Configuration.CustomSettings
            },
            MetricTypes = request.MetricTypes.Select(mt => (PerformanceMetricType)mt).ToList(),
            QuantumEnhanced = request.QuantumEnhanced,
            MonitoringDuration = request.MonitoringDuration
        };

        var apiResult = await _apiPerformanceMonitor.StartPerformanceMonitoringAsync(apiRequest, cancellationToken);
        return MapToAbstractionsResult(apiResult);
    }

    public async Task<AbstractionsInterface.PerformanceMetrics> GetPerformanceMetricsAsync(
        string monitoringSessionId,
        AbstractionsInterface.MetricsParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var apiParameters = new MetricsParameters
        {
            StartTime = parameters.StartTime,
            EndTime = parameters.EndTime,
            Aggregation = (MetricsAggregation)parameters.Aggregation,
            SpecificMetrics = parameters.SpecificMetrics.Select(sm => (PerformanceMetricType)sm).ToList(),
            IncludeHistoricalTrends = parameters.IncludeHistoricalTrends
        };

        var apiMetrics = await _apiPerformanceMonitor.GetPerformanceMetricsAsync(monitoringSessionId, apiParameters, cancellationToken);
        return MapToAbstractionsMetrics(apiMetrics);
    }

    public async Task<AbstractionsInterface.PredictivePerformanceResult> GeneratePerformancePredictionsAsync(
        string sessionId,
        AbstractionsInterface.PredictionParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var apiParameters = new PredictionParameters
        {
            PredictionHorizon = parameters.PredictionHorizon,
            ConfidenceLevel = parameters.ConfidenceLevel,
            IncludeAnomalyDetection = parameters.IncludeAnomalyDetection,
            QuantumEnhanced = parameters.QuantumEnhanced,
            ModelParameters = parameters.ModelParameters
        };

        var apiResult = await _apiPerformanceMonitor.GeneratePerformancePredictionsAsync(sessionId, apiParameters, cancellationToken);
        return MapToAbstractionsPredictiveResult(apiResult);
    }

    public async Task<AbstractionsInterface.PerformanceValidationResult> ValidateChampionshipPerformanceAsync(
        string sessionId,
        AbstractionsInterface.ChampionshipStandards standards,
        CancellationToken cancellationToken = default)
    {
        var apiStandards = new ChampionshipStandards
        {
            MinResponseTime = standards.MinResponseTime,
            MaxErrorRate = standards.MaxErrorRate,
            MinThroughput = standards.MinThroughput,
            MinAvailability = standards.MinAvailability,
            MaxCpuUtilization = standards.MaxCpuUtilization,
            CustomStandards = standards.CustomStandards
        };

        var apiResult = await _apiPerformanceMonitor.ValidateChampionshipPerformanceAsync(sessionId, apiStandards, cancellationToken);
        return MapToAbstractionsValidationResult(apiResult);
    }

    public async Task<AbstractionsInterface.PerformanceReport> StopPerformanceMonitoringAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        var apiReport = await _apiPerformanceMonitor.StopPerformanceMonitoringAsync(sessionId, cancellationToken);
        return MapToAbstractionsReport(apiReport);
    }

    public async Task<AbstractionsInterface.ElitePerformanceMetrics> GetElitePerformanceMetricsAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        var apiMetrics = await _apiPerformanceMonitor.GetElitePerformanceMetricsAsync(sessionId, cancellationToken);
        return MapToAbstractionsEliteMetrics(apiMetrics);
    }

    #region Mapping Methods

    private static AbstractionsInterface.PerformanceMonitoringResult MapToAbstractionsResult(PerformanceMonitoringResult apiResult)
    {
        return new AbstractionsInterface.PerformanceMonitoringResult
        {
            SessionId = apiResult.SessionId,
            MonitoringStarted = apiResult.MonitoringStarted,
            StartedAt = apiResult.StartedAt,
            Status = new AbstractionsInterface.MonitoringStatus
            {
                State = (AbstractionsInterface.MonitoringState)apiResult.Status.State,
                OverallHealthScore = apiResult.Status.OverallHealthScore,
                ActiveMonitors = apiResult.Status.ActiveMonitors,
                AlertsEnabled = apiResult.Status.AlertsEnabled,
                LastHealthCheck = apiResult.Status.LastHealthCheck
            },
            MonitoredComponents = apiResult.MonitoredComponents
        };
    }

    private static AbstractionsInterface.PerformanceMetrics MapToAbstractionsMetrics(PerformanceMetrics apiMetrics)
    {
        return new AbstractionsInterface.PerformanceMetrics
        {
            SessionId = apiMetrics.SessionId,
            System = new AbstractionsInterface.SystemPerformanceMetrics
            {
                CpuUtilization = apiMetrics.System.CpuUtilization,
                MemoryUtilization = apiMetrics.System.MemoryUtilization,
                DiskUtilization = apiMetrics.System.DiskUtilization,
                SystemLoad = apiMetrics.System.SystemLoad,
                ProcessCount = apiMetrics.System.ProcessCount,
                ThreadCount = apiMetrics.System.ThreadCount,
                CustomMetrics = apiMetrics.System.CustomMetrics
            },
            Application = new AbstractionsInterface.ApplicationPerformanceMetrics
            {
                ResponseTime = apiMetrics.Application.ResponseTime,
                Throughput = apiMetrics.Application.Throughput,
                ErrorRate = apiMetrics.Application.ErrorRate,
                SuccessRate = apiMetrics.Application.SuccessRate,
                ConcurrentUsers = apiMetrics.Application.ConcurrentUsers,
                ActiveSessions = apiMetrics.Application.ActiveSessions,
                EndpointMetrics = apiMetrics.Application.EndpointMetrics
            },
            Database = new AbstractionsInterface.DatabasePerformanceMetrics
            {
                QueryExecutionTime = apiMetrics.Database.QueryExecutionTime,
                ConnectionPoolUtilization = apiMetrics.Database.ConnectionPoolUtilization,
                ActiveConnections = apiMetrics.Database.ActiveConnections,
                TransactionThroughput = apiMetrics.Database.TransactionThroughput,
                LockWaitTime = apiMetrics.Database.LockWaitTime,
                QueryMetrics = apiMetrics.Database.QueryMetrics
            },
            Network = new AbstractionsInterface.NetworkPerformanceMetrics
            {
                Latency = apiMetrics.Network.Latency,
                Bandwidth = apiMetrics.Network.Bandwidth,
                PacketLoss = apiMetrics.Network.PacketLoss,
                Jitter = apiMetrics.Network.Jitter,
                BytesTransmitted = apiMetrics.Network.BytesTransmitted,
                BytesReceived = apiMetrics.Network.BytesReceived
            },
            Quantum = new AbstractionsInterface.QuantumPerformanceMetrics
            {
                QuantumOptimizationFactor = apiMetrics.Quantum.QuantumOptimizationFactor,
                CoherenceTime = apiMetrics.Quantum.CoherenceTime,
                EntanglementEfficiency = apiMetrics.Quantum.EntanglementEfficiency,
                QuantumGatesExecuted = apiMetrics.Quantum.QuantumGatesExecuted,
                QuantumSupremacyActive = apiMetrics.Quantum.QuantumSupremacyActive
            },
            MeasuredAt = apiMetrics.MeasuredAt
        };
    }

    private static AbstractionsInterface.PredictivePerformanceResult MapToAbstractionsPredictiveResult(PredictivePerformanceResult apiResult)
    {
        return new AbstractionsInterface.PredictivePerformanceResult
        {
            PredictionSuccessful = apiResult.PredictionSuccessful,
            Predictions = apiResult.Predictions.Select(p => new AbstractionsInterface.PerformancePrediction
            {
                MetricType = (AbstractionsInterface.PerformanceMetricType)p.MetricType,
                PredictedTime = p.PredictedTime,
                PredictedValue = p.PredictedValue,
                ConfidenceScore = p.ConfidenceScore,
                LowerBound = p.LowerBound,
                UpperBound = p.UpperBound
            }).ToList(),
            PredictedAnomalies = apiResult.PredictedAnomalies.Select(a => new AbstractionsInterface.PerformanceAnomaly
            {
                PredictedTime = a.PredictedTime,
                Severity = (AbstractionsInterface.AnomalySeverity)a.Severity,
                Description = a.Description,
                ProbabilityScore = a.ProbabilityScore,
                ImpactedComponents = a.ImpactedComponents
            }).ToList(),
            Recommendations = apiResult.Recommendations.Select(r => new AbstractionsInterface.OptimizationRecommendation
            {
                RecommendationType = r.RecommendationType,
                Description = r.Description,
                ExpectedImprovement = r.ExpectedImprovement,
                Priority = r.Priority,
                ImplementationSteps = r.ImplementationSteps,
                Type = r.Type,
                EstimatedImpact = r.EstimatedImpact,
                Implementation = r.Implementation,
                AutoApprove = r.AutoApprove,
                ImpactScore = r.ImpactScore,
                Title = r.Title
            }).ToList(),
            GeneratedAt = apiResult.GeneratedAt
        };
    }

    private static AbstractionsInterface.PerformanceValidationResult MapToAbstractionsValidationResult(PerformanceValidationResult apiResult)
    {
        return new AbstractionsInterface.PerformanceValidationResult
        {
            MeetsChampionshipStandards = apiResult.MeetsChampionshipStandards,
            OverallComplianceScore = apiResult.OverallComplianceScore,
            Validations = apiResult.Validations.Select(v => new AbstractionsInterface.StandardValidation
            {
                StandardName = v.StandardName,
                Passed = v.Passed,
                ActualValue = v.ActualValue,
                RequiredValue = v.RequiredValue,
                CompliancePercentage = v.CompliancePercentage
            }).ToList(),
            PerformanceGaps = apiResult.PerformanceGaps.Select(g => new AbstractionsInterface.PerformanceGap
            {
                Component = g.Component,
                GapDescription = g.GapDescription,
                GapSeverity = g.GapSeverity,
                ImprovementActions = g.ImprovementActions
            }).ToList(),
            Grade = (AbstractionsInterface.ChampionshipGrade)apiResult.Grade
        };
    }

    private static AbstractionsInterface.PerformanceReport MapToAbstractionsReport(PerformanceReport apiReport)
    {
        return new AbstractionsInterface.PerformanceReport
        {
            SessionId = apiReport.SessionId,
            MonitoringDuration = apiReport.MonitoringDuration,
            Summary = new AbstractionsInterface.PerformanceSummary
            {
                AverageResponseTime = apiReport.Summary.AverageResponseTime,
                PeakThroughput = apiReport.Summary.PeakThroughput,
                OverallAvailability = apiReport.Summary.OverallAvailability,
                SystemHealthScore = apiReport.Summary.SystemHealthScore,
                TotalIncidents = apiReport.Summary.TotalIncidents,
                PerformanceGrade = (AbstractionsInterface.ChampionshipGrade)apiReport.Summary.PerformanceGrade
            },
            HistoricalMetrics = apiReport.HistoricalMetrics.Select(MapToAbstractionsMetrics).ToList(),
            Incidents = apiReport.Incidents.Select(i => new AbstractionsInterface.PerformanceIncident
            {
                OccurredAt = i.OccurredAt,
                Severity = (AbstractionsInterface.IncidentSeverity)i.Severity,
                Description = i.Description,
                Duration = i.Duration,
                AffectedComponents = i.AffectedComponents,
                Resolution = i.Resolution
            }).ToList(),
            KeyInsights = apiReport.KeyInsights,
            GeneratedAt = apiReport.GeneratedAt
        };
    }

    private static AbstractionsInterface.ElitePerformanceMetrics MapToAbstractionsEliteMetrics(ApiPerf.ElitePerformanceMetrics apiMetrics)
    {
        return new AbstractionsInterface.ElitePerformanceMetrics
        {
            SessionId = apiMetrics.SessionId,
            OverallPerformanceScore = apiMetrics.OverallPerformanceScore,
            SystemMetrics = new AbstractionsInterface.SystemPerformanceMetrics
            {
                CpuUtilization = apiMetrics.SystemMetrics.CpuUtilization,
                MemoryUtilization = apiMetrics.SystemMetrics.MemoryUtilization,
                DiskUtilization = apiMetrics.SystemMetrics.DiskUtilization,
                SystemLoad = apiMetrics.SystemMetrics.SystemLoad,
                ProcessCount = apiMetrics.SystemMetrics.ProcessCount,
                ThreadCount = apiMetrics.SystemMetrics.ThreadCount,
                CustomMetrics = apiMetrics.SystemMetrics.CustomMetrics
            },
            ApplicationMetrics = new AbstractionsInterface.ApplicationPerformanceMetrics
            {
                ResponseTime = apiMetrics.ApplicationMetrics.ResponseTime,
                Throughput = apiMetrics.ApplicationMetrics.Throughput,
                ErrorRate = apiMetrics.ApplicationMetrics.ErrorRate,
                SuccessRate = apiMetrics.ApplicationMetrics.SuccessRate,
                ConcurrentUsers = apiMetrics.ApplicationMetrics.ConcurrentUsers,
                ActiveSessions = apiMetrics.ApplicationMetrics.ActiveSessions,
                EndpointMetrics = apiMetrics.ApplicationMetrics.EndpointMetrics
            },
            QuantumMetrics = new AbstractionsInterface.QuantumPerformanceMetrics
            {
                QuantumOptimizationFactor = apiMetrics.QuantumMetrics.QuantumOptimizationFactor,
                CoherenceTime = apiMetrics.QuantumMetrics.CoherenceTime,
                EntanglementEfficiency = apiMetrics.QuantumMetrics.EntanglementEfficiency,
                QuantumGatesExecuted = apiMetrics.QuantumMetrics.QuantumGatesExecuted,
                QuantumSupremacyActive = apiMetrics.QuantumMetrics.QuantumSupremacyActive
            },
            PerformanceGrade = (AbstractionsInterface.ChampionshipGrade)apiMetrics.PerformanceGrade,
            EliteRecommendations = apiMetrics.EliteRecommendations.Select(r => new AbstractionsInterface.OptimizationRecommendation
            {
                RecommendationType = r.RecommendationType,
                Description = r.Description,
                ExpectedImprovement = r.ExpectedImprovement,
                Priority = r.Priority,
                ImplementationSteps = r.ImplementationSteps,
                Type = r.Type,
                EstimatedImpact = r.EstimatedImpact,
                Implementation = r.Implementation,
                AutoApprove = r.AutoApprove,
                ImpactScore = r.ImpactScore,
                Title = r.Title
            }).ToList(),
            MeasuredAt = apiMetrics.MeasuredAt
        };
    }

    #endregion
}
