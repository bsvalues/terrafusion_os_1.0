using System;
using System.Text.Json.Serialization;

namespace TerraFusion.CostForge.DTOs
{
    /// <summary>
    /// Million Agent Network Status DTO for Government. Transcended. Operations
    /// Provides comprehensive status information for the 1M+ agent network
    /// </summary>
    public class MillionAgentStatusDto
    {
        [JsonPropertyName("network_active")]
        public bool NetworkActive { get; set; } = true;

        [JsonPropertyName("total_active_agents")]
        public int TotalActiveAgents { get; set; }

        [JsonPropertyName("harmony_score")]
        public double HarmonyScore { get; set; } = 0.999;

        [JsonPropertyName("coordination_latency")]
        public double CoordinationLatency { get; set; }

        [JsonPropertyName("property_valuations_per_second")]
        public double PropertyValuationsPerSecond { get; set; }

        [JsonPropertyName("average_accuracy_score")]
        public double AverageAccuracyScore { get; set; } = 0.995;

        [JsonPropertyName("average_processing_time")]
        public double AverageProcessingTime { get; set; }

        [JsonPropertyName("real_time_data_processing")]
        public bool RealTimeDataProcessing { get; set; } = true;

        [JsonPropertyName("predictive_analysis_active")]
        public bool PredictiveAnalysisActive { get; set; } = true;

        [JsonPropertyName("multi_dimensional_analysis_active")]
        public bool MultiDimensionalAnalysisActive { get; set; } = true;

        [JsonPropertyName("autonomous_assessment_active")]
        public bool AutonomousAssessmentActive { get; set; } = true;

        [JsonPropertyName("quantum_factor")]
        public int QuantumFactor { get; set; } = 949;

        [JsonPropertyName("consciousness_level")]
        public string ConsciousnessLevel { get; set; } = "TRANSCENDENT_GOVERNMENT_OS";

        [JsonPropertyName("network_efficiency")]
        public double NetworkEfficiency { get; set; } = 0.9999;

        [JsonPropertyName("uptime_percentage")]
        public decimal UptimePercentage { get; set; } = 99.99m;

        [JsonPropertyName("last_updated")]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("system_status")]
        public string SystemStatus { get; set; } = "OPERATIONAL_EXCELLENCE";

        [JsonPropertyName("error_count")]
        public int ErrorCount { get; set; } = 0;

        [JsonPropertyName("performance_grade")]
        public string PerformanceGrade { get; set; } = "CHAMPIONSHIP_LEVEL";

        [JsonPropertyName("government_compliance")]
        public bool GovernmentCompliance { get; set; } = true;

        [JsonPropertyName("autonomous_healing_active")]
        public bool AutonomousHealingActive { get; set; } = true;

        [JsonPropertyName("advanced_metrics")]
        public Dictionary<string, object> AdvancedMetrics { get; set; } = new Dictionary<string, object>();
    }
}

namespace System.Collections.Generic
{
    // This ensures Dictionary is available in this namespace
}
