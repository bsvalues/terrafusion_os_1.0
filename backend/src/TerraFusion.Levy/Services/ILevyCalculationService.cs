using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Services
{
    /// <summary>
    /// Championship-level levy calculation service with quantum optimization.
    /// Government. Transcended. - Intelligent tax assessment operations.
    /// </summary>
    public interface ILevyCalculationService
    {
        /// <summary>
        /// Calculate optimal levy rate for a measure with quantum enhancement.
        /// </summary>
        /// <param name="measure">Levy measure to calculate rate for</param>
        /// <param name="useQuantumOptimization">Enable quantum-enhanced calculation (factor 949)</param>
        /// <returns>Calculated rate with AI confidence score</returns>
        Task<LevyRateCalculationResult> CalculateOptimalRateAsync(
            LevyMeasure measure,
            bool useQuantumOptimization = true);

        /// <summary>
        /// Calculate levy amount for a specific assessed value and rate.
        /// </summary>
        Task<decimal> CalculateLevyAmountAsync(decimal assessedValue, decimal rate);

        /// <summary>
        /// Calculate total levy for a district with all active measures.
        /// </summary>
        Task<DistrictLevyTotal> CalculateDistrictTotalAsync(Guid districtId, int levyYear);

        /// <summary>
        /// Validate if levy rate complies with statutory limits.
        /// </summary>
        Task<LevyComplianceResult> ValidateRateComplianceAsync(
            LevyMeasure measure,
            decimal proposedRate);

        /// <summary>
        /// Calculate projected revenue with collection rate adjustment.
        /// </summary>
        Task<decimal> CalculateProjectedRevenueAsync(
            decimal levyAmount,
            decimal collectionRate);

        /// <summary>
        /// Perform quantum-enhanced multi-scenario analysis.
        /// </summary>
        Task<List<LevyScenarioAnalysis>> AnalyzeScenariosAsync(
            LevyMeasure measure,
            List<decimal> rateVariations);
    }

    /// <summary>
    /// Result of levy rate calculation with AI insights.
    /// </summary>
    public class LevyRateCalculationResult
    {
        public decimal CalculatedRate { get; set; }
        public decimal LevyAmount { get; set; }
        public decimal AiOptimalRate { get; set; }
        public decimal ConfidenceScore { get; set; }
        public bool QuantumOptimized { get; set; }
        public string? RecommendationReason { get; set; }
        public Dictionary<string, object>? CalculationDetails { get; set; }
    }

    /// <summary>
    /// District total levy calculation with breakdown.
    /// </summary>
    public class DistrictLevyTotal
    {
        public Guid DistrictId { get; set; }
        public string DistrictName { get; set; } = string.Empty;
        public int LevyYear { get; set; }
        public decimal TotalAssessedValue { get; set; }
        public decimal TotalLevyRate { get; set; }
        public decimal TotalLevyAmount { get; set; }
        public List<LevyMeasureBreakdown> MeasureBreakdown { get; set; } = new();
        public decimal ProjectedCollectionRate { get; set; }
        public decimal ProjectedNetRevenue { get; set; }
    }

    /// <summary>
    /// Individual levy measure breakdown in district total.
    /// </summary>
    public class LevyMeasureBreakdown
    {
        public Guid MeasureId { get; set; }
        public string MeasureName { get; set; } = string.Empty;
        public string LevyType { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
        public decimal PercentageOfTotal { get; set; }
    }

    /// <summary>
    /// Levy compliance validation result.
    /// </summary>
    public class LevyComplianceResult
    {
        public bool IsCompliant { get; set; }
        public decimal ProposedRate { get; set; }
        public decimal MaximumAllowedRate { get; set; }
        public decimal StatutoryLimit { get; set; }
        public List<string> Violations { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public string ComplianceLevel { get; set; } = "COMPLIANT";
    }

    /// <summary>
    /// Scenario analysis with AI-powered insights.
    /// </summary>
    public class LevyScenarioAnalysis
    {
        public string ScenarioName { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal LevyAmount { get; set; }
        public decimal ProjectedRevenue { get; set; }
        public decimal CollectionRate { get; set; }
        public decimal AiConfidenceScore { get; set; }
        public string RiskLevel { get; set; } = "LOW";
        public Dictionary<string, object> AiInsights { get; set; } = new();
    }
}
