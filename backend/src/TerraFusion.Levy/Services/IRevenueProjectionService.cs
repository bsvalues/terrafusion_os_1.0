using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Services
{
    /// <summary>
    /// AI-powered revenue projection service with predictive analytics.
    /// Government. Transcended. - Quantum-enhanced financial forecasting.
    /// </summary>
    public interface IRevenueProjectionService
    {
        /// <summary>
        /// Generate multi-year revenue projections with AI insights.
        /// </summary>
        Task<List<RevenueProjection>> GenerateProjectionsAsync(
            LevyScenario scenario,
            int yearsToProject,
            bool useQuantumForecasting = true);

        /// <summary>
        /// Calculate growth rate based on historical trends and AI analysis.
        /// </summary>
        Task<decimal> CalculateProjectedGrowthRateAsync(
            string countyId,
            int historicalYears = 5);

        /// <summary>
        /// Assess risk factors for revenue projections.
        /// </summary>
        Task<RiskAssessment> AssessProjectionRisksAsync(
            RevenueProjection projection,
            LevyScenario scenario);

        /// <summary>
        /// Compare multiple scenarios with AI-powered recommendations.
        /// </summary>
        Task<ScenarioComparison> CompareScenariosAsync(
            List<LevyScenario> scenarios,
            int projectionYears);

        /// <summary>
        /// Generate confidence intervals for revenue projections.
        /// </summary>
        Task<ConfidenceInterval> CalculateConfidenceIntervalAsync(
            RevenueProjection projection,
            decimal confidenceLevel = 0.95m);
    }

    /// <summary>
    /// Risk assessment for revenue projections.
    /// </summary>
    public class RiskAssessment
    {
        public string OverallRisk { get; set; } = "LOW";
        public decimal RiskScore { get; set; }
        public List<RiskFactor> IdentifiedRisks { get; set; } = new();
        public Dictionary<string, decimal> RiskBreakdown { get; set; } = new();
        public List<string> MitigationRecommendations { get; set; } = new();
    }

    /// <summary>
    /// Individual risk factor.
    /// </summary>
    public class RiskFactor
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Severity { get; set; } = "LOW";
        public decimal Impact { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Scenario comparison with AI recommendations.
    /// </summary>
    public class ScenarioComparison
    {
        public List<ScenarioSummary> Scenarios { get; set; } = new();
        public ScenarioSummary RecommendedScenario { get; set; } = null!;
        public string RecommendationReason { get; set; } = string.Empty;
        public Dictionary<string, object> ComparisonMetrics { get; set; } = new();
        public decimal AiConfidence { get; set; }
    }

    /// <summary>
    /// Summary of scenario analysis.
    /// </summary>
    public class ScenarioSummary
    {
        public Guid ScenarioId { get; set; }
        public string ScenarioName { get; set; } = string.Empty;
        public string ScenarioType { get; set; } = string.Empty;
        public decimal TotalProjectedRevenue { get; set; }
        public decimal AverageGrowthRate { get; set; }
        public decimal AverageConfidence { get; set; }
        public string RiskLevel { get; set; } = "LOW";
        public int ProjectionYears { get; set; }
    }

    /// <summary>
    /// Confidence interval for revenue projection.
    /// </summary>
    public class ConfidenceInterval
    {
        public decimal ProjectedValue { get; set; }
        public decimal LowerBound { get; set; }
        public decimal UpperBound { get; set; }
        public decimal ConfidenceLevel { get; set; }
        public decimal StandardDeviation { get; set; }
        public string Interpretation { get; set; } = string.Empty;
    }
}
