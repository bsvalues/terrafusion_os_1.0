using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;
using TerraFusion.Levy.Entities;

namespace TerraFusion.Analytics.Services
{
    /// <summary>
    /// Tax analytics service with strict county isolation.
    /// Integrates with TerraLevy for tax levy calculations and rate analysis.
    /// </summary>
    public class TaxAnalyticsService : ITaxAnalyticsService
    {
        private readonly TerraFusionDbContext _context;
        private readonly TerraLevyDbContext _levyContext;
        private readonly ILogger<TaxAnalyticsService> _logger;
        private readonly IAISwarmCoordinator _aiCoordinator;

        public TaxAnalyticsService(
            TerraFusionDbContext context,
            TerraLevyDbContext levyContext,
            ILogger<TaxAnalyticsService> logger,
            IAISwarmCoordinator aiCoordinator)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _levyContext = levyContext ?? throw new ArgumentNullException(nameof(levyContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _aiCoordinator = aiCoordinator ?? throw new ArgumentNullException(nameof(aiCoordinator));
        }

        /// <summary>
        /// Get tax levy analysis for a specific county and assessment year.
        /// CRITICAL: Always filters by countyCode - prevents cross-county data leaks.
        /// </summary>
        public async Task<TaxLevyAnalysis> GetLevyAnalysisAsync(
            Guid countyCode,
            int assessmentYear)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            if (assessmentYear < 2000 || assessmentYear > DateTime.UtcNow.Year + 1)
                throw new ArgumentException("Invalid assessment year", nameof(assessmentYear));

            _logger.LogInformation(
                "Fetching tax levy analysis for county {CountyId}, year {Year}",
                countyCode, assessmentYear);

            // Get levy data from TerraLevy database (COUNTY ISOLATED)
            var levyRecords = await _levyContext.TaxLevies
                .Where(l => l.CountyId == countyCode  // CRITICAL: County isolation
                    && l.AssessmentYear == assessmentYear)
                .Include(l => l.TaxingDistrict)
                .ToListAsync();

            if (!levyRecords.Any())
            {
                _logger.LogWarning("No levy records found for county {CountyId}, year {Year}",
                    countyCode, assessmentYear);
                return new TaxLevyAnalysis
                {
                    CountyId = countyCode,
                    AssessmentYear = assessmentYear,
                    InsufficientData = true
                };
            }

            // Calculate levy statistics
            var totalLevy = levyRecords.Sum(l => l.LevyAmount);
            var totalAssessedValue = levyRecords.Sum(l => l.AssessedValueBase);

            // Get property count for county (COUNTY ISOLATED)
            var propertyCount = await _context.Properties
                .Where(p => p.CountyId == countyCode)  // CRITICAL: County isolation
                .CountAsync();

            // Calculate effective tax rates by district
            var districtRates = levyRecords
                .GroupBy(l => l.TaxingDistrict)
                .Select(g => new TaxDistrictRate
                {
                    DistrictName = g.Key.DistrictName,
                    DistrictCode = g.Key.DistrictCode,
                    TotalLevy = g.Sum(l => l.LevyAmount),
                    TotalAssessedValue = g.Sum(l => l.AssessedValueBase),
                    EffectiveRate = (g.Sum(l => l.LevyAmount) / g.Sum(l => l.AssessedValueBase)) * 1000, // Per $1000
                    PropertyCount = g.Count()
                })
                .OrderByDescending(d => d.TotalLevy)
                .ToList();

            // Get historical comparison (COUNTY ISOLATED)
            var previousYearData = await GetLevyAnalysisAsync(countyCode, assessmentYear - 1);

            decimal yearOverYearChange = 0;
            if (!previousYearData.InsufficientData && previousYearData.TotalLevyAmount > 0)
            {
                yearOverYearChange = ((totalLevy - previousYearData.TotalLevyAmount) / previousYearData.TotalLevyAmount) * 100;
            }

            var analysis = new TaxLevyAnalysis
            {
                CountyId = countyCode,
                AssessmentYear = assessmentYear,
                TotalLevyAmount = totalLevy,
                TotalAssessedValue = totalAssessedValue,
                AverageEffectiveRate = (totalLevy / totalAssessedValue) * 1000,
                PropertyCount = propertyCount,
                DistrictRates = districtRates,
                YearOverYearChange = yearOverYearChange,
                InsufficientData = false
            };

            // Get AI-powered insights
            analysis.AIInsights = await GetTaxAIInsightsAsync(countyCode, analysis);

            _logger.LogInformation(
                "Tax levy analysis for county {CountyId}: Total=${TotalLevy:N0}, Rate={Rate:F2} per $1000, YoY={YoY:F2}%",
                countyCode, totalLevy, analysis.AverageEffectiveRate, yearOverYearChange);

            return analysis;
        }

        /// <summary>
        /// Get tax rate comparison across multiple assessment years for a county.
        /// COUNTY ISOLATION: Only returns data for specified county.
        /// </summary>
        public async Task<TaxRateComparison> GetRateComparisonAsync(
            Guid countyCode,
            int startYear,
            int endYear)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            _logger.LogInformation(
                "Fetching tax rate comparison for county {CountyId} from {StartYear} to {EndYear}",
                countyCode, startYear, endYear);

            // Get levy data for year range (COUNTY ISOLATED)
            var levyData = await _levyContext.TaxLevies
                .Where(l => l.CountyId == countyCode  // CRITICAL: County isolation
                    && l.AssessmentYear >= startYear
                    && l.AssessmentYear <= endYear)
                .Include(l => l.TaxingDistrict)
                .ToListAsync();

            if (!levyData.Any())
            {
                _logger.LogWarning(
                    "No levy data found for county {CountyId} in year range {StartYear}-{EndYear}",
                    countyCode, startYear, endYear);
                return new TaxRateComparison
                {
                    CountyId = countyCode,
                    YearlyRates = new List<YearlyRateData>()
                };
            }

            // Calculate yearly rate trends
            var yearlyRates = levyData
                .GroupBy(l => l.AssessmentYear)
                .OrderBy(g => g.Key)
                .Select(g => new YearlyRateData
                {
                    Year = g.Key,
                    TotalLevy = g.Sum(l => l.LevyAmount),
                    TotalAssessedValue = g.Sum(l => l.AssessedValueBase),
                    EffectiveRate = (g.Sum(l => l.LevyAmount) / g.Sum(l => l.AssessedValueBase)) * 1000,
                    DistrictCount = g.Select(l => l.TaxingDistrictId).Distinct().Count()
                })
                .ToList();

            // Calculate trend statistics
            var rateChanges = new List<decimal>();
            for (int i = 1; i < yearlyRates.Count; i++)
            {
                var change = ((yearlyRates[i].EffectiveRate - yearlyRates[i - 1].EffectiveRate) /
                             yearlyRates[i - 1].EffectiveRate) * 100;
                rateChanges.Add(change);
            }

            var comparison = new TaxRateComparison
            {
                CountyId = countyCode,
                StartYear = startYear,
                EndYear = endYear,
                YearlyRates = yearlyRates,
                AverageAnnualChange = rateChanges.Any() ? rateChanges.Average() : 0,
                TotalChangePercent = yearlyRates.Count > 1
                    ? ((yearlyRates.Last().EffectiveRate - yearlyRates.First().EffectiveRate) /
                       yearlyRates.First().EffectiveRate) * 100
                    : 0
            };

            _logger.LogInformation(
                "Tax rate comparison for county {CountyId}: {YearCount} years, Average change={AvgChange:F2}%",
                countyCode, yearlyRates.Count, comparison.AverageAnnualChange);

            return comparison;
        }

        /// <summary>
        /// Get tax burden distribution analysis for a county.
        /// Shows how tax burden is distributed across property value ranges.
        /// COUNTY ISOLATION: Scoped to single county.
        /// </summary>
        public async Task<TaxBurdenDistribution> GetTaxBurdenDistributionAsync(
            Guid countyCode,
            int assessmentYear)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            _logger.LogInformation(
                "Analyzing tax burden distribution for county {CountyId}, year {Year}",
                countyCode, assessmentYear);

            // Get properties with tax data (COUNTY ISOLATED)
            var properties = await _context.Properties
                .Where(p => p.CountyId == countyCode  // CRITICAL: County isolation
                    && p.Assessments.Any(a => a.AssessmentYear == assessmentYear))
                .Include(p => p.Assessments.Where(a => a.AssessmentYear == assessmentYear))
                .ToListAsync();

            if (!properties.Any())
            {
                _logger.LogWarning("No properties found for county {CountyId}, year {Year}",
                    countyCode, assessmentYear);
                return new TaxBurdenDistribution
                {
                    CountyId = countyCode,
                    AssessmentYear = assessmentYear,
                    InsufficientData = true
                };
            }

            // Define value ranges (brackets)
            var valueBrackets = new[]
            {
                new { Min = 0m, Max = 200000m, Label = "$0-$200K" },
                new { Min = 200000m, Max = 400000m, Label = "$200K-$400K" },
                new { Min = 400000m, Max = 600000m, Label = "$400K-$600K" },
                new { Min = 600000m, Max = 1000000m, Label = "$600K-$1M" },
                new { Min = 1000000m, Max = decimal.MaxValue, Label = "$1M+" }
            };

            // Get effective tax rate (simplified - would need actual levy data per property)
            var avgTaxRate = await GetAverageCountyTaxRateAsync(countyCode, assessmentYear);

            // Calculate distribution across brackets
            var distribution = valueBrackets.Select(bracket =>
            {
                var propertiesInBracket = properties
                    .Where(p =>
                    {
                        var assessment = p.Assessments.FirstOrDefault();
                        return assessment != null &&
                               assessment.AssessedValue >= bracket.Min &&
                               assessment.AssessedValue < bracket.Max;
                    })
                    .ToList();

                var totalValue = propertiesInBracket.Sum(p => p.Assessments.First().AssessedValue);
                var totalTax = totalValue * avgTaxRate / 1000; // Rate is per $1000

                return new TaxBracketData
                {
                    ValueRange = bracket.Label,
                    MinValue = bracket.Min,
                    MaxValue = bracket.Max,
                    PropertyCount = propertiesInBracket.Count,
                    TotalAssessedValue = totalValue,
                    TotalTaxBurden = totalTax,
                    AverageTaxPerProperty = propertiesInBracket.Any()
                        ? totalTax / propertiesInBracket.Count
                        : 0,
                    PercentOfProperties = properties.Count > 0
                        ? (decimal)propertiesInBracket.Count / properties.Count * 100
                        : 0,
                    PercentOfTaxBurden = 0 // Will calculate below
                };
            }).ToList();

            // Calculate percent of total tax burden
            var totalTaxBurden = distribution.Sum(d => d.TotalTaxBurden);
            foreach (var bracket in distribution)
            {
                bracket.PercentOfTaxBurden = totalTaxBurden > 0
                    ? (bracket.TotalTaxBurden / totalTaxBurden) * 100
                    : 0;
            }

            var result = new TaxBurdenDistribution
            {
                CountyId = countyCode,
                AssessmentYear = assessmentYear,
                TotalProperties = properties.Count,
                TotalAssessedValue = properties.Sum(p => p.Assessments.First().AssessedValue),
                TotalTaxBurden = totalTaxBurden,
                Brackets = distribution,
                InsufficientData = false
            };

            _logger.LogInformation(
                "Tax burden distribution for county {CountyId}: {PropertyCount} properties, Total tax=${TotalTax:N0}",
                countyCode, properties.Count, totalTaxBurden);

            return result;
        }

        #region Private Helper Methods

        private async Task<decimal> GetAverageCountyTaxRateAsync(Guid countyCode, int assessmentYear)
        {
            var levyData = await _levyContext.TaxLevies
                .Where(l => l.CountyId == countyCode && l.AssessmentYear == assessmentYear)
                .ToListAsync();

            if (!levyData.Any()) return 10.0m; // Default fallback rate

            var totalLevy = levyData.Sum(l => l.LevyAmount);
            var totalValue = levyData.Sum(l => l.AssessedValueBase);

            return totalValue > 0 ? (totalLevy / totalValue) * 1000 : 10.0m;
        }

        private async Task<AITaxInsights> GetTaxAIInsightsAsync(Guid countyCode, TaxLevyAnalysis analysis)
        {
            var swarmRequest = new AISwarmRequest
            {
                CountyId = countyCode,
                AnalysisType = "TaxLevyAnalysis",
                Data = analysis,
                SwarmSize = 50
            };

            var swarmResult = await _aiCoordinator.CoordinateAnalysisAsync(swarmRequest);

            return new AITaxInsights
            {
                Confidence = swarmResult.Confidence,
                Insights = swarmResult.Insights,
                Recommendations = swarmResult.Recommendations,
                SwarmSize = swarmResult.AgentsUsed
            };
        }

        #endregion
    }
}
