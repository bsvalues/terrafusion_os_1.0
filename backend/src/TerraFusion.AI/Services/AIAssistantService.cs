using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TerraFusion.AI.Models;
using TerraFusion.AI.Interfaces;
using TerraFusion.Consciousness.Interfaces;
using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// AI Assistant Service providing county-scoped governed assistance.
    /// </summary>
    public interface IAIAssistantService
    {
        Task<AIAssistantResponse> ProcessMessageAsync(AIAssistantRequest request);
        Task<AISwarmHealthStatus> GetSwarmStatusAsync(string countyId);
        Task<List<AIRecommendation>> GetRecommendationsAsync(string countyId, string? context);
        Task<PropertyAnalysisResult> AnalyzePropertyAsync(string parcelId, string countyId);
    }

    public class AIAssistantService : IAIAssistantService
    {
        private readonly ILogger<AIAssistantService> _logger;
        private readonly IConsciousnessEngine _consciousnessEngine;
        private readonly IPropertyValuationService _valuationService;
        private readonly IComplianceService _complianceService;

        public AIAssistantService(
            ILogger<AIAssistantService> logger,
            IConsciousnessEngine consciousnessEngine,
            IPropertyValuationService valuationService,
            IComplianceService complianceService)
        {
            _logger = logger;
            _consciousnessEngine = consciousnessEngine;
            _valuationService = valuationService;
            _complianceService = complianceService;
        }

        public async Task<AIAssistantResponse> ProcessMessageAsync(AIAssistantRequest request)
        {
            _logger.LogInformation(
                "Processing AI message for county {CountyId}, role {EmployeeRole}",
                request.CountyId,
                request.EmployeeRole);

            await Task.CompletedTask;

            var taskType = DetermineTaskType(request.Message);
            var suggestions = taskType switch
            {
                "property_analysis" => new List<string>
                {
                    "Open TerraForge for governed valuation work",
                    "Open TerraAtlas for parcel and map evidence",
                },
                "compliance_check" => new List<string>
                {
                    "Open TerraDossier for packet and evidence review",
                    "Use Pilot for governed execution",
                },
                "workflow_automation" => new List<string>
                {
                    "Open TerraDais for governed queue work",
                    "Use Pilot for any action that changes county state",
                },
                _ => new List<string>
                {
                    "Open TerraDais for governed queue work",
                    "Use Pilot for governed actions",
                },
            };

            return new AIAssistantResponse
            {
                MessageId = Guid.NewGuid().ToString(),
                Content =
                    $"Assistant automation is not operational on this route. Your request for {request.CountyId} ({request.EmployeeRole}) was received, but no governed AI execution or evidence-backed analysis is available from api/AIAssistant/message.",
                Confidence = 0.0,
                Suggestions = suggestions,
                Metadata = new Dictionary<string, object>
                {
                    { "mode", "compatibility" },
                    { "countyId", request.CountyId },
                    { "employeeRole", request.EmployeeRole },
                    { "taskType", taskType },
                },
                Timestamp = DateTime.UtcNow,
                Status = "compatibility",
            };
        }

        public async Task<AISwarmHealthStatus> GetSwarmStatusAsync(string countyId)
        {
            var status = await _consciousnessEngine.GetSwarmHealthAsync(countyId);

            return new AISwarmHealthStatus
            {
                CountyId = countyId,
                ActiveAgents = status.ActiveAgents,
                SwarmActivity = status.ActivityLevel,
                QuantumOptimizationFactor = 0,
                ResponseTime = status.AvgResponseTimeMs,
                AccuracyScore = status.AccuracyScore,
                ConsciousnessLevel = status.ConsciousnessLevel,
                LastUpdate = DateTime.UtcNow
            };
        }

        public async Task<List<AIRecommendation>> GetRecommendationsAsync(string countyId, string? context)
        {
            _logger.LogInformation("Generating AI recommendations for {CountyId}", countyId);
            await Task.CompletedTask;
            return new List<AIRecommendation>();
        }

        public async Task<PropertyAnalysisResult> AnalyzePropertyAsync(string parcelId, string countyId)
        {
            await Task.CompletedTask;
            _logger.LogWarning(
                "AnalyzePropertyAsync({ParcelId}, {CountyId}) is running in compatibility mode; no governed assistant property analysis is available on this route",
                parcelId,
                countyId);

            return new PropertyAnalysisResult
            {
                ParcelId = parcelId,
                CountyId = countyId,
                ValuationConfidence = 0,
                MarketTrend = "unavailable",
                ComplianceStatus = "unavailable",
                AIRecommendations = new List<string>
                {
                    "Governed property analysis is unavailable on api/AIAssistant/analyze-property.",
                    "Use TerraForge, TerraAtlas, or Pilot for evidence-backed parcel work.",
                },
                ComparablesCount = 0,
                AccuracyScore = 0,
                QuantumOptimized = false,
                AnalysisTimestamp = DateTime.UtcNow
            };
        }

        private string DetermineTaskType(string message)
        {
            var lowerMessage = message.ToLowerInvariant();

            if (lowerMessage.Contains("property") || lowerMessage.Contains("parcel") ||
                lowerMessage.Contains("assessment") || lowerMessage.Contains("valuation"))
                return "property_analysis";

            if (lowerMessage.Contains("compliance") || lowerMessage.Contains("audit") ||
                lowerMessage.Contains("security") || lowerMessage.Contains("fisma"))
                return "compliance_check";

            if (lowerMessage.Contains("workflow") || lowerMessage.Contains("automate") ||
                lowerMessage.Contains("optimize") || lowerMessage.Contains("task"))
                return "workflow_automation";

            return "general";
        }

    }

    #region Models

    public class AIAssistantRequest
    {
        public required string CountyId { get; set; }
        public required string EmployeeRole { get; set; }
        public required string Message { get; set; }
        public Dictionary<string, object> Context { get; set; } = new();
    }

    public class AIAssistantResponse
    {
        public string MessageId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public List<string> Suggestions { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // AISwarmStatus removed - using the one from IAISwarmOrchestrator.cs interface file

    public class AIRecommendation
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Priority { get; set; }
        public double Confidence { get; set; }
        public string Category { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
    }

    public class PropertyAnalysisResult
    {
        public string ParcelId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public double ValuationConfidence { get; set; }
        public string MarketTrend { get; set; } = string.Empty;
        public string ComplianceStatus { get; set; } = string.Empty;
        public List<string> AIRecommendations { get; set; } = new();
        public int ComparablesCount { get; set; }
        public double AccuracyScore { get; set; }
        public bool QuantumOptimized { get; set; }
        public DateTime AnalysisTimestamp { get; set; }
    }

    #endregion
}
