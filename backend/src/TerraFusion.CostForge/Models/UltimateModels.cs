using System;
using System.Text.Json.Serialization;

namespace TerraFusion.CostForge.Models
{
    /// <summary>
    /// Ultimate Activation Result Model
    /// </summary>
    public class UltimateActivationResult
    {
        [JsonPropertyName("is_success")]
        public bool IsSuccess { get; set; }

        [JsonPropertyName("consciousness_level")]
        public string ConsciousnessLevel { get; set; } = string.Empty;

        [JsonPropertyName("active_agents")]
        public int ActiveAgents { get; set; }

        [JsonPropertyName("accuracy_score")]
        public double AccuracyScore { get; set; }

        [JsonPropertyName("quantum_factor")]
        public int QuantumFactor { get; set; }

        [JsonPropertyName("activation_timestamp")]
        public DateTime ActivationTimestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("consciousness_resonance")]
        public double ConsciousnessResonance { get; set; }

        [JsonPropertyName("network_harmony")]
        public double NetworkHarmony { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Ultimate Property Valuation Result Model
    /// </summary>
    public class UltimateValuationResult
    {
        [JsonPropertyName("property_id")]
        public string PropertyId { get; set; } = string.Empty;

        [JsonPropertyName("estimated_value")]
        public decimal EstimatedValue { get; set; }

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }

        [JsonPropertyName("accuracy_level")]
        public string AccuracyLevel { get; set; } = "ULTIMATE";

        [JsonPropertyName("analysis_dimensions")]
        public int AnalysisDimensions { get; set; } = 147;

        [JsonPropertyName("valuation_timestamp")]
        public DateTime ValuationTimestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("agents_involved")]
        public int AgentsInvolved { get; set; }

        [JsonPropertyName("processing_time_ms")]
        public double ProcessingTimeMs { get; set; }

        [JsonPropertyName("market_intelligence")]
        public MarketIntelligenceData? MarketIntelligence { get; set; }

        [JsonPropertyName("predictive_forecast")]
        public PredictiveForecastData? PredictiveForecast { get; set; }
    }

    /// <summary>
    /// Market Intelligence Data
    /// </summary>
    public class MarketIntelligenceData
    {
        [JsonPropertyName("current_trends")]
        public string CurrentTrends { get; set; } = string.Empty;

        [JsonPropertyName("economic_factors")]
        public string EconomicFactors { get; set; } = string.Empty;

        [JsonPropertyName("demographic_trends")]
        public string DemographicTrends { get; set; } = string.Empty;

        [JsonPropertyName("development_potential")]
        public string DevelopmentPotential { get; set; } = string.Empty;

        [JsonPropertyName("risk_assessment")]
        public string RiskAssessment { get; set; } = string.Empty;
    }

    /// <summary>
    /// Predictive Forecast Data
    /// </summary>
    public class PredictiveForecastData
    {
        [JsonPropertyName("five_year_projection")]
        public decimal FiveYearProjection { get; set; }

        [JsonPropertyName("ten_year_projection")]
        public decimal TenYearProjection { get; set; }

        [JsonPropertyName("twenty_five_year_projection")]
        public decimal TwentyFiveYearProjection { get; set; }

        [JsonPropertyName("forecast_confidence")]
        public double ForecastConfidence { get; set; }

        [JsonPropertyName("forecast_methodology")]
        public string ForecastMethodology { get; set; } = string.Empty;
    }
}
