using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// Interface for Advanced AI Orchestrator
    /// Coordinates next-generation AI capabilities including 50,000-agent swarm,
    /// quantum-AI hybrid systems, and emergent intelligence
    /// </summary>
    public interface IAdvancedAIOrchestrator : IDisposable
    {
        /// <summary>
        /// Initialize the complete advanced AI system
        /// </summary>
        /// <returns>True if initialization successful</returns>
        Task<bool> InitializeAdvancedAISystem();
        
        /// <summary>
        /// Process advanced AI request with multi-modal capabilities
        /// </summary>
        /// <param name="request">The advanced AI request</param>
        /// <returns>Advanced AI response with explanations and metrics</returns>
        Task<AdvancedAIResponse> ProcessAdvancedRequest(AdvancedAIRequest request);
        
        /// <summary>
        /// Get comprehensive AI system metrics
        /// </summary>
        /// <returns>Advanced AI metrics including quantum, emergent, and ethical metrics</returns>
        Task<AdvancedAIMetrics> GetAdvancedMetrics();
    }
    
    /// <summary>
    /// Interface for Multi-Modal Large Language Model Service
    /// </summary>
    public interface IMultiModalLLMService
    {
        Task<bool> InitializeMultiModalStack();
        Task<LLMResponse> ProcessMultiModalRequest(MultiModalRequest request);
        Task<ModelPerformance> GetModelPerformance(string modelId);
    }
    
    /// <summary>
    /// Interface for Quantum-AI Hybrid Service
    /// </summary>
    public interface IQuantumAIHybridService
    {
        Task<bool> InitializeQuantumSystems();
        Task<QuantumAIResponse> ProcessQuantumOptimization(QuantumOptimizationRequest request);
        Task<double> GetQuantumAdvantage();
        Task<double> GetQuantumCoherence();
        Task<double> GetQuantumThroughput();
    }
    
    /// <summary>
    /// Interface for Emergent Intelligence Engine
    /// </summary>
    public interface IEmergentIntelligenceEngine
    {
        Task<bool> InitializeSwarmIntelligence(int targetAgentCount);
        Task<int> GetTotalAgentCount();
        Task<int> GetActiveAgentCount();
        Task<double> GetSwarmCoherence();
        Task<double> GetCollectiveIntelligenceScore();
        Task<int> GetEmergentCapabilityCount();
        Task<List<TerraFusion.AI.DTOs.EmergentBehavior>> DetectEmergentBehaviors();
        Task<List<TerraFusion.AI.DTOs.EmergentPattern>> AnalyzeEmergentPatterns(List<TerraFusion.AI.DTOs.EmergentBehavior> behaviors);
    }
    
    /// <summary>
    /// Interface for Explainable AI Service
    /// </summary>
    public interface IExplainableAIService
    {
        Task InitializeExplanationEngine();
        Task<DecisionExplanation> GenerateExplanation(AdvancedAIRequest request, AdvancedAIResponse response);
        Task<double> GetTransparencyScore();
        Task GenerateTransparencyReport();
    }
    
    /// <summary>
    /// Interface for Continuous Learning Engine
    /// </summary>
    public interface IContinuousLearningEngine
    {
        Task StartLearningLoop();
        Task UpdateFromResponse(AdvancedAIRequest request, AdvancedAIResponse response);
        Task<double> GetCurrentLearningRate();
        Task<double> GetKnowledgeGrowthRate();
        Task<double> GetAdaptationSpeed();
    }
    
    /// <summary>
    /// Interface for AI Ethics Framework
    /// </summary>
    public interface IAIEthicsFramework
    {
        Task InitializeEthicalValidation();
        Task<EthicalValidation> ValidateRequest(AdvancedAIRequest request);
        Task MonitorBias();
        Task ValidateEthicalCompliance();
        Task<double> GetComplianceScore();
        Task<double> GetBiasScore();
    }
    
    // Supporting classes for interfaces
    public class MultiModalRequest
    {
        public string RequestId { get; set; } = string.Empty;
        public string TextInput { get; set; } = string.Empty;
        public byte[] ImageData { get; set; } = Array.Empty<byte>();
        public string AudioData { get; set; } = string.Empty;
        public Dictionary<string, object> SpatialData { get; set; } = new();
        public RequestContext Context { get; set; } = new();
    }
    
    public class LLMResponse
    {
        public string ResponseId { get; set; } = string.Empty;
        public string TextResponse { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public List<string> Sources { get; set; } = new();
        public ReasoningChain Reasoning { get; set; } = new();
    }
    
    public class QuantumOptimizationRequest
    {
        public string OptimizationId { get; set; } = string.Empty;
        public OptimizationType Type { get; set; }
        public Dictionary<string, double> Parameters { get; set; } = new();
        public List<Constraint> Constraints { get; set; } = new();
        public int MaxIterations { get; set; }
    }
    
    public class QuantumAIResponse
    {
        public string OptimizationId { get; set; } = string.Empty;
        public OptimizationResult Result { get; set; } = new();
        public double QuantumAdvantage { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public double Confidence { get; set; }
    }
    
    // EmergentBehavior and EmergentPattern are defined in TerraFusion.AI.DTOs
    
    public class DecisionExplanation
    {
        public string DecisionId { get; set; } = string.Empty;
        public string PrimaryReason { get; set; } = string.Empty;
        public List<ContributingFactor> Factors { get; set; } = new();
        public double ConfidenceScore { get; set; }
        public List<AlternativeOption> Alternatives { get; set; } = new();
        public ComplianceValidation Compliance { get; set; } = new();
        public AuditTrail AuditInformation { get; set; } = new();
    }
    
    public class EthicalValidation
    {
        public bool IsEthical { get; set; }
        public double EthicalScore { get; set; }
        public List<EthicalConcern> Concerns { get; set; } = new();
        public List<EthicalRecommendation> Recommendations { get; set; } = new();
        public bool RequiresHumanReview { get; set; }
    }
    
    public class ModelPerformance
    {
        public string ModelId { get; set; } = string.Empty;
        public double Accuracy { get; set; }
        public double Precision { get; set; }
        public double Recall { get; set; }
        public double F1Score { get; set; }
        public double Latency { get; set; }
        public double Throughput { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime LastUpdated { get; set; }
        public double UptimePercentage { get; set; }
        public long TokensProcessed { get; set; }
    }
    
    // Enums and supporting types
    public enum OptimizationType
    {
        PropertyPortfolioOptimization,
        RouteOptimization,
        ResourceAllocation,
        RiskMinimization,
        RevenueMaximization
    }
    
    // EmergentBehaviorType and PatternType enums are defined in TerraFusion.AI.DTOs
    
    // Additional supporting classes
    public class RequestContext { }
    public class ReasoningChain { }
    public class Constraint { }
    public class OptimizationResult { }
    public class ContributingFactor { }
    public class AlternativeOption { }
    public class ComplianceValidation { }
    public class AuditTrail { }
    public class EthicalConcern 
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
    public class EthicalRecommendation { }
}