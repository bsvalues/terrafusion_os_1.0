using System;
using System.Collections.Generic;

namespace TerraFusion.AI.DTOs
{
    public class AdvancedAIRequest
    {
        public string RequestId { get; set; } = string.Empty;
        public AIRequestType RequestType { get; set; } = AIRequestType.General;
        public string TextInput { get; set; } = string.Empty;
        public byte[] ImageData { get; set; } = Array.Empty<byte>();
        public byte[] AudioData { get; set; } = Array.Empty<byte>();
        public Dictionary<string, object> SpatialData { get; set; } = new();
        public Dictionary<string, object> Context { get; set; } = new();
        public Dictionary<string, object> Parameters { get; set; } = new();
        public string ModelId { get; set; } = string.Empty;
        public int Priority { get; set; } = 1;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public bool RequiresQuantumOptimization { get; set; } = false;
        public string OptimizationType { get; set; } = string.Empty;
        public Dictionary<string, object> OptimizationParameters { get; set; } = new();
        public Dictionary<string, object> Constraints { get; set; } = new();
        public int MaxIterations { get; set; } = 100;
    }

    public class AdvancedAIResponse
    {
        public string RequestId { get; set; } = string.Empty;
        public string ResponseId { get; set; } = Guid.NewGuid().ToString();
        public string RequestType { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> EthicalConcerns { get; set; } = new();
        public string TextResponse { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new();
        public string Reasoning { get; set; } = string.Empty;
        public Dictionary<string, object> Results { get; set; } = new();
        public double Confidence { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public double ProcessingTimeMs { get; set; }
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
        public List<string> Warnings { get; set; } = new();
        public string Explanation { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public QualityMetrics QualityMetrics { get; set; } = new();
        public string ErrorMessage { get; set; } = string.Empty;
        public bool Success { get; set; } = true;
        public string Response { get; set; } = string.Empty;
        public TerraFusion.AI.Interfaces.QuantumAIResponse? QuantumResponse { get; set; }
        public List<TerraFusion.AI.DTOs.EmergentBehavior> EmergentBehaviors { get; set; } = new();
        public List<TerraFusion.Core.DTOs.EmergentPattern> EmergentPatterns { get; set; } = new();

        // Missing properties referenced in controller errors
        public string EthicalValidation { get; set; } = string.Empty;
        public string ModelUsed { get; set; } = string.Empty;
        public List<string> AgentsInvolved { get; set; } = new();
    }

    public class AdvancedAIMetrics
    {
        public int ActiveAgents { get; set; }
        public int TotalAgents { get; set; }
        public double OverallAccuracy { get; set; }
        public double QuantumAdvantage { get; set; }
        public int EmergentCapabilities { get; set; }
        public double EthicalComplianceScore { get; set; }
        public double SwarmCoherence { get; set; }
        public double CollectiveIntelligenceScore { get; set; }
        public double LearningRate { get; set; }
        public double AdaptationSpeed { get; set; }
        public int TotalRequests { get; set; }
        public int SuccessfulRequests { get; set; }
        public int FailedRequests { get; set; }
        public double AverageProcessingTime { get; set; }
        public double AverageConfidence { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public Dictionary<string, int> RequestTypeBreakdown { get; set; } = new();
        public Dictionary<string, double> ModelPerformance { get; set; } = new();
        // AgentUtilization is a metric, not a dictionary
        public double AgentUtilization { get; set; }
    }

    public class QualityMetrics
    {
        public double Accuracy { get; set; }
        public double Precision { get; set; }
        public double Recall { get; set; }
        public double F1Score { get; set; }
        public int ValidationSamples { get; set; }
        public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
    }

    // Supporting classes and enums
    public class PerformanceAnalysis
    {
        public double CpuUsage { get; set; }
        public double MemoryUsage { get; set; }
        public double ResponseTime { get; set; }
        public int ActiveAgents { get; set; }
        public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
    }

    public class OptimizationOpportunity
    {
        public string OpportunityId { get; set; } = Guid.NewGuid().ToString();
        public string Description { get; set; } = string.Empty;
        public double PotentialImprovement { get; set; }
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; } = 1;
    }

    public enum AIRequestType
    {
        General,
        PropertyValuation,
        PolicyImpactAnalysis,
        QuantumOptimization,
        EmergentPatternDetection,
        CrossDomainSynthesis
    }

    public enum AIResponseStatus
    {
        Success,
        Error,
        EthicalRejection
    }
}
