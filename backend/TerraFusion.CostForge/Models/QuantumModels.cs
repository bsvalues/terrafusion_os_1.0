using System;
using System.Collections.Generic;

namespace TerraFusion.CostForge.Models
{
    /// <summary>
    /// Quantum Factor Configuration for Elite Optimization
    /// </summary>
    public class QuantumFactorConfiguration
    {
        public string ConfigurationId { get; set; } = Guid.NewGuid().ToString();
        public Dictionary<string, double> QuantumFactors { get; set; } = new();
        public double OptimizationLevel { get; set; }
        public bool ConsciousnessEnhanced { get; set; } = true;
        public DateTime LastOptimized { get; set; } = DateTime.UtcNow;
        public double ExpectedAccuracyImprovement { get; set; }
    }

    /// <summary>
    /// Quantum Performance Data for Analysis
    /// </summary>
    public class QuantumPerformanceData
    {
        public string SessionId { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public double AccuracyAchieved { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public Dictionary<string, double> QuantumMetrics { get; set; } = new();
        public int PropertiesProcessed { get; set; }
        public double EfficiencyScore { get; set; }
    }

    /// <summary>
    /// IAAO Compliance Result for Standards Validation
    /// </summary>
    public class IAAOComplianceResult
    {
        public bool IsCompliant { get; set; }
        public double ComplianceScore { get; set; }
        public List<ComplianceIssue> Issues { get; set; } = new();
        public Dictionary<string, double> StandardsMetrics { get; set; } = new();
        public string CertificationLevel { get; set; } = "";
        public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Market Data for Predictive Analysis
    /// </summary>
    public class MarketData
    {
        public string MarketRegion { get; set; } = "";
        public DateTime DataDate { get; set; } = DateTime.UtcNow;
        public Dictionary<string, decimal> MedianPrices { get; set; } = new();
        public Dictionary<string, double> MarketTrends { get; set; } = new();
        public List<MarketIndicator> Indicators { get; set; } = new();
        public double MarketVolatility { get; set; }
        public int TransactionVolume { get; set; }
    }

    /// <summary>
    /// Predictive Quantum Factors for Future Optimization
    /// </summary>
    public class PredictiveQuantumFactors
    {
        public string PredictionId { get; set; } = Guid.NewGuid().ToString();
        public Dictionary<string, double> PredictedFactors { get; set; } = new();
        public Dictionary<string, double> ConfidenceIntervals { get; set; } = new();
        public TimeSpan ForecastPeriod { get; set; }
        public double PredictionAccuracy { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Quantum Performance Dashboard Data
    /// </summary>
    public class QuantumPerformanceDashboard
    {
        public string SessionId { get; set; } = "";
        public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
        public SwarmPerformanceMetrics CurrentMetrics { get; set; } = new();
        public List<PerformanceTrend> Trends { get; set; } = new();
        public List<AlertMessage> Alerts { get; set; } = new();
        public Dictionary<string, double> RealTimeKPIs { get; set; } = new();
        public SystemHealthStatus HealthStatus { get; set; } = new();
    }

    /// <summary>
    /// Elite Property Assessment Request with Consciousness Parameters
    /// </summary>
    public class ElitePropertyAssessmentRequest : PropertyAssessmentRequest
    {
        public double ConsciousnessLevel { get; set; } = 1.0;
        public bool UltraPrecisionMode { get; set; } = true;
        public Dictionary<string, object> ConsciousnessParameters { get; set; } = new();
        public ChampionshipRequirements ChampionshipRequirements { get; set; } = new();
        public bool RequirePhDLevelValidation { get; set; } = false;
    }

    /// <summary>
    /// Consciousness-Enhanced Assessment Result
    /// </summary>
    public class ConsciousnessEnhancedResult : QuantumEnhancementResult
    {
        public double ConsciousnessLevel { get; set; }
        public double UltraPrecisionAccuracy { get; set; }
        public Dictionary<string, double> ConsciousnessFactors { get; set; } = new();
        public bool ChampionshipLevelAchieved { get; set; }
        public PhDLevelValidation PhDValidation { get; set; } = new();
    }

    #region Supporting Classes

    /// <summary>
    /// Compliance Issue for IAAO Standards
    /// </summary>
    public class ComplianceIssue
    {
        public string IssueCode { get; set; } = "";
        public string Description { get; set; } = "";
        public IssueSeverity Severity { get; set; }
        public string Recommendation { get; set; } = "";
        public bool RequiresAction { get; set; }
    }

    /// <summary>
    /// Market Indicator for Analysis
    /// </summary>
    public class MarketIndicator
    {
        public string IndicatorName { get; set; } = "";
        public double Value { get; set; }
        public MarketTrendDirection Trend { get; set; }
        public double Impact { get; set; }
        public DateTime LastUpdate { get; set; }
    }

    /// <summary>
    /// Performance Trend Analysis
    /// </summary>
    public class PerformanceTrend
    {
        public string MetricName { get; set; } = "";
        public List<TrendDataPoint> DataPoints { get; set; } = new();
        public TrendDirection Direction { get; set; }
        public double ChangePercentage { get; set; }
        public string Analysis { get; set; } = "";
    }

    /// <summary>
    /// Alert Message for Monitoring
    /// </summary>
    public class AlertMessage
    {
        public AlertLevel Level { get; set; }
        public string Message { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Source { get; set; } = "";
        public bool RequiresAction { get; set; }
    }

    /// <summary>
    /// System Health Status
    /// </summary>
    public class SystemHealthStatus
    {
        public HealthLevel OverallHealth { get; set; }
        public Dictionary<string, HealthLevel> ComponentHealth { get; set; } = new();
        public List<HealthAlert> ActiveAlerts { get; set; } = new();
        public double SystemEfficiency { get; set; }
        public DateTime LastHealthCheck { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Championship Requirements for Elite Assessment
    /// </summary>
    public class ChampionshipRequirements
    {
        public double MinimumAccuracy { get; set; } = 0.9999;
        public TimeSpan MaxProcessingTime { get; set; } = TimeSpan.FromMilliseconds(10);
        public bool RequireIAAOCertification { get; set; } = true;
        public bool RequireQuantumOptimization { get; set; } = true;
        public bool RequireConsciousnessEnhancement { get; set; } = true;
    }

    /// <summary>
    /// PhD Level Validation Result
    /// </summary>
    public class PhDLevelValidation
    {
        public bool ValidationPassed { get; set; }
        public string ValidatorCredentials { get; set; } = "";
        public double StatisticalSignificance { get; set; }
        public List<string> ValidationNotes { get; set; } = new();
        public DateTime ValidationTimestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Trend Data Point for Analysis
    /// </summary>
    public class TrendDataPoint
    {
        public DateTime Timestamp { get; set; }
        public double Value { get; set; }
        public string Label { get; set; } = "";
    }

    #endregion

    #region Enumerations

    public enum IssueSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum MarketTrendDirection
    {
        Up,
        Down,
        Stable,
        Volatile
    }

    public enum TrendDirection
    {
        Improving,
        Declining,
        Stable,
        Fluctuating
    }

    public enum AlertLevel
    {
        Info,
        Warning,
        Error,
        Critical,
        Emergency
    }

    public enum HealthLevel
    {
        Excellent,
        Good,
        Fair,
        Poor,
        Critical
    }

    #endregion
}
