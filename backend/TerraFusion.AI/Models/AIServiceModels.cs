using System;
using System.Collections.Generic;

namespace TerraFusion.AI.Models
{
    /// <summary>
    /// AI Swarm Health Status for AIAssistantService
    /// </summary>
    public class AISwarmHealthStatus
    {
        public string CountyId { get; set; } = string.Empty;
        public int ActiveAgents { get; set; }
        public string SwarmActivity { get; set; } = string.Empty;
        public int QuantumOptimizationFactor { get; set; }
        public double ResponseTime { get; set; }
        public double AccuracyScore { get; set; }
        public double ConsciousnessLevel { get; set; }
        public DateTime LastUpdate { get; set; }
    }

    /// <summary>
    /// Consciousness context for AI operations
    /// </summary>
    public class ConsciousnessContext
    {
        public string CountyId { get; set; } = string.Empty;
        public string Task { get; set; } = string.Empty;
        public int AgentCount { get; set; }
        public string UserRole { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public bool QuantumOptimization { get; set; } = true;
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Quantum property valuation result
    /// </summary>
    public class QuantumValuation
    {
        public string ParcelId { get; set; } = string.Empty;
        public decimal EstimatedValue { get; set; }
        public decimal ConfidenceScore { get; set; }
        public string ValuationMethod { get; set; } = string.Empty;
        public DateTime ValuationDate { get; set; }
        public Dictionary<string, object> QuantumFactors { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Comparable property for analysis
    /// </summary>
    public class ComparableProperty
    {
        public string ParcelId { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal SalePrice { get; set; }
        public DateTime SaleDate { get; set; }
        public double SimilarityScore { get; set; }
        public int SquareFootage { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
    }

    /// <summary>
    /// Swarm health status from Consciousness Engine
    /// </summary>
    public class SwarmHealthStatus
    {
        public int ActiveAgents { get; set; }
        public string ActivityLevel { get; set; } = string.Empty;
        public double AvgResponseTimeMs { get; set; }
        public double AccuracyScore { get; set; }
        public double ConsciousnessLevel { get; set; }
    }
}
