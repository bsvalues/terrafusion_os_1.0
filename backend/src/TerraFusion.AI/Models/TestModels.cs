/*
 * ═══════════════════════════════════════════════════════════════
 * TEST MODELS - Stub Types for Integration Tests
 * TerraFusion.AI - Elite Government AI Integration
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using System;
using System.Collections.Generic;

namespace TerraFusion.AI.Models
{
    /// <summary>
    /// Stub models for integration tests - to be implemented with full API layer
    /// </summary>

    // Note: AIMessageRequest/Response and MessageContext are defined in AIMessageModels.cs

    public class PropertyAnalysisRequest
    {
        // Back-compat and tests expect PropertyId
        public string PropertyId { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public bool IncludeComparables { get; set; }
        public bool IncludeMarketTrends { get; set; }
    }

    public class PropertyAnalysis
    {
        public string PropertyId { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public decimal EstimatedValue { get; set; }
        public decimal CurrentAssessment { get; set; }
        public decimal AIValuation { get; set; }
        public decimal ValuationConfidence { get; set; }
        public int ComparableSales { get; set; }
        public int ProcessingTimeMs { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<AnalysisInsight> Insights { get; set; } = new();
        public IAAOComplianceMetrics? IAAOCompliance { get; set; }
    }

    public class HealthStatus
    {
        public bool IsHealthy { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metrics { get; set; } = new();
        public Dictionary<string, object> Services { get; set; } = new();
    }

    public class AISwarmStatus
    {
        public string CountyId { get; set; } = string.Empty;
        public int ActiveAgents { get; set; }
        public double UtilizationPercent { get; set; }
        public int QuantumOptimizationFactor { get; set; }
        public decimal AccuracyScore { get; set; }
        public int AverageResponseTimeMs { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime LastUpdate { get; set; }
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;
    }

    public class AIRecommendation
    {
        public decimal Confidence { get; set; }
        public string Priority { get; set; } = string.Empty; // "HIGH" | "MEDIUM" | "LOW"
        public List<string> ActionItems { get; set; } = new();
    }

    public class AnalysisInsight
    {
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
    }

    public class IAAOComplianceMetrics
    {
        public bool IsCompliant { get; set; }
        public decimal COD { get; set; } // Coefficient of Dispersion
        public decimal PRD { get; set; } // Price-Related Differential
        public decimal AssessmentLevel { get; set; } // Median ratio
    }
}
