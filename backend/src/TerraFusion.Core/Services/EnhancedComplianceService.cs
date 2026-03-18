// LEV-010 — Enhanced Compliance Service
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Enhanced compliance layer on top of <see cref="LevyComplianceService"/>.
    /// Adds compliance history tracking, remediation suggestions,
    /// and multi-year trend analysis for WA property tax limits.
    /// </summary>
    public class EnhancedComplianceService
    {
        private readonly LevyComplianceService _complianceService;

        public EnhancedComplianceService(LevyComplianceService complianceService)
        {
            _complianceService = complianceService;
        }

        /// <summary>
        /// Retrieve the compliance history for a district across multiple years.
        /// </summary>
        /// <param name="districtId">Tax district identifier.</param>
        /// <param name="startYear">First year of the range (inclusive).</param>
        /// <param name="endYear">Last year of the range (inclusive).</param>
        /// <returns>Yearly compliance snapshots.</returns>
        public Task<List<ComplianceHistoryEntry>> GetComplianceHistoryAsync(
            int districtId, int startYear, int endYear)
        {
            // Stub — production impl queries EF Core
            var history = new List<ComplianceHistoryEntry>();
            for (int year = startYear; year <= endYear; year++)
            {
                history.Add(new ComplianceHistoryEntry
                {
                    DistrictId = districtId,
                    TaxYear = year,
                    WasCompliant = true,
                    CheckedAt = DateTime.UtcNow
                });
            }
            return Task.FromResult(history);
        }

        /// <summary>
        /// Generate remediation suggestions when a compliance check fails.
        /// </summary>
        /// <param name="result">The failing compliance result.</param>
        /// <returns>Ordered list of remediation actions.</returns>
        public Task<List<RemediationSuggestion>> GetRemediationsAsync(ComplianceResult result)
        {
            var suggestions = new List<RemediationSuggestion>();

            if (!result.PassesAggregateLimit)
                suggestions.Add(new RemediationSuggestion
                {
                    Priority = 1,
                    Title = "Reduce aggregate rate",
                    Description = "Aggregate rate exceeds $5.90/$1,000. Consider prorating among overlapping districts per RCW 84.52.010."
                });

            if (!result.Passes1PercentCap)
                suggestions.Add(new RemediationSuggestion
                {
                    Priority = 2,
                    Title = "Levy exceeds 1% cap",
                    Description = "Proposed levy exceeds highest lawful levy. Reduce levy amount or seek voter-approved lid lift per RCW 84.55.050."
                });

            if (!result.PassesDistrictLimit)
                suggestions.Add(new RemediationSuggestion
                {
                    Priority = 3,
                    Title = "District statutory limit exceeded",
                    Description = $"Rate exceeds the {result.ApplicableDistrictLimit:F4}/$1,000 limit for {result.DistrictType} districts."
                });

            if (!result.PassesConstitutionalLimit)
                suggestions.Add(new RemediationSuggestion
                {
                    Priority = 1,
                    Title = "Constitutional limit exceeded",
                    Description = "Aggregate rate exceeds $10.00/$1,000 constitutional maximum (Article VII, Section 2). Immediate correction required."
                });

            return Task.FromResult(suggestions);
        }

        /// <summary>
        /// Analyze compliance trends for a district over time.
        /// </summary>
        public Task<ComplianceTrendAnalysis> AnalyzeTrendsAsync(int districtId, int years = 5)
        {
            // Stub
            var analysis = new ComplianceTrendAnalysis
            {
                DistrictId = districtId,
                YearsAnalyzed = years,
                ComplianceRate = 1.0m,
                Trend = "Stable",
                RiskLevel = "Low",
                AnalyzedAt = DateTime.UtcNow
            };
            return Task.FromResult(analysis);
        }
    }

    /// <summary>Yearly compliance snapshot for a district.</summary>
    public class ComplianceHistoryEntry
    {
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        public bool WasCompliant { get; set; }
        public string Details { get; set; } = string.Empty;
        public DateTime CheckedAt { get; set; }
    }

    /// <summary>Suggested action to achieve compliance.</summary>
    public class RemediationSuggestion
    {
        public int Priority { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>Multi-year compliance trend analysis result.</summary>
    public class ComplianceTrendAnalysis
    {
        public int DistrictId { get; set; }
        public int YearsAnalyzed { get; set; }
        /// <summary>Fraction of years that were compliant (0.0 - 1.0).</summary>
        public decimal ComplianceRate { get; set; }
        public string Trend { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = string.Empty;
        public DateTime AnalyzedAt { get; set; }
    }
}
