using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;
using TerraFusion.Data.Entities;

namespace TerraFusion.Analytics.Services
{
    /// <summary>
    /// Property analytics service with strict county isolation.
    /// Provides valuation trends, comparables analysis, and AI-powered insights.
    /// </summary>
    public class PropertyAnalyticsService : IPropertyAnalyticsService
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<PropertyAnalyticsService> _logger;
        private readonly IAISwarmCoordinator _aiCoordinator;

        public PropertyAnalyticsService(
            TerraFusionDbContext context,
            ILogger<PropertyAnalyticsService> logger,
            IAISwarmCoordinator aiCoordinator)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _aiCoordinator = aiCoordinator ?? throw new ArgumentNullException(nameof(aiCoordinator));
        }

        /// <summary>
        /// Get property valuation trends for a specific county over time period.
        /// CRITICAL: Always filters by countyCode - prevents cross-county data leaks.
        /// </summary>
        public async Task<PropertyValuationTrends> GetValuationTrendsAsync(
            Guid countyCode,
            DateTime startDate,
            DateTime endDate)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            _logger.LogInformation(
                "Fetching property valuation trends for county {CountyId} from {StartDate} to {EndDate}",
                countyCode, startDate, endDate);

            // COUNTY ISOLATION: Filter by CountyId in WHERE clause
            var properties = await _context.Properties
                .Where(p => p.CountyId == countyCode
                    && p.LastAssessmentDate >= startDate
                    && p.LastAssessmentDate <= endDate)
                .Include(p => p.Assessments)
                .ToListAsync();

            if (!properties.Any())
            {
                _logger.LogWarning("No properties found for county {CountyId} in date range", countyCode);
                return new PropertyValuationTrends { CountyId = countyCode, TrendData = new List<TrendDataPoint>() };
            }

            // Calculate monthly average valuations
            var monthlyTrends = properties
                .SelectMany(p => p.Assessments)
                .GroupBy(a => new { Year = a.AssessmentDate.Year, Month = a.AssessmentDate.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new TrendDataPoint
                {
                    Date = new DateTime(g.Key.Year, g.Key.Month, 1),
                    AverageValuation = g.Average(a => a.AssessedValue),
                    PropertyCount = g.Select(a => a.PropertyId).Distinct().Count(),
                    MedianValuation = CalculateMedian(g.Select(a => a.AssessedValue))
                })
                .ToList();

            // Calculate year-over-year growth
            var trends = new PropertyValuationTrends
            {
                CountyId = countyCode,
                StartDate = startDate,
                EndDate = endDate,
                TrendData = monthlyTrends,
                YearOverYearGrowth = CalculateYoYGrowth(monthlyTrends),
                TotalPropertiesAnalyzed = properties.Count
            };

            // Get AI-powered insights (swarm analysis)
            trends.AIInsights = await GetAIInsightsAsync(countyCode, trends);

            _logger.LogInformation(
                "Calculated valuation trends for county {CountyId}: {PropertyCount} properties, {DataPoints} data points",
                countyCode, properties.Count, monthlyTrends.Count);

            return trends;
        }

        /// <summary>
        /// Get comparable properties for valuation analysis.
        /// COUNTY ISOLATION: Only returns comparables within same county.
        /// </summary>
        public async Task<ComparablePropertiesResult> GetComparablePropertiesAsync(
            Guid countyCode,
            string parcelId,
            int maxResults = 10)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            _logger.LogInformation(
                "Finding comparable properties for parcel {ParcelId} in county {CountyId}",
                parcelId, countyCode);

            // Get target property (COUNTY ISOLATED)
            var targetProperty = await _context.Properties
                .Where(p => p.CountyId == countyCode && p.ParcelId == parcelId)
                .Include(p => p.PropertyAttributes)
                .FirstOrDefaultAsync();

            if (targetProperty == null)
            {
                _logger.LogWarning("Target property {ParcelId} not found in county {CountyId}", parcelId, countyCode);
                return new ComparablePropertiesResult { CountyId = countyCode, Comparables = new List<ComparableProperty>() };
            }

            // Find comparables within same county
            // COUNTY ISOLATION: WHERE clause includes CountyId filter
            var comparables = await _context.Properties
                .Where(p => p.CountyId == countyCode  // CRITICAL: County isolation
                    && p.ParcelId != parcelId
                    && p.PropertyType == targetProperty.PropertyType
                    && p.SquareFootage >= targetProperty.SquareFootage * 0.8
                    && p.SquareFootage <= targetProperty.SquareFootage * 1.2
                    && p.YearBuilt >= targetProperty.YearBuilt - 10
                    && p.YearBuilt <= targetProperty.YearBuilt + 10)
                .Include(p => p.PropertyAttributes)
                .Include(p => p.Assessments.OrderByDescending(a => a.AssessmentDate).Take(1))
                .Take(maxResults * 2) // Get extra for filtering
                .ToListAsync();

            // Calculate similarity scores and rank
            var rankedComparables = comparables
                .Select(p => new ComparableProperty
                {
                    PropertyId = p.PropertyId,
                    ParcelId = p.ParcelId,
                    CountyId = p.CountyId,
                    Address = p.Address,
                    AssessedValue = p.Assessments.FirstOrDefault()?.AssessedValue ?? 0,
                    SimilarityScore = CalculateSimilarityScore(targetProperty, p),
                    SquareFootage = p.SquareFootage,
                    YearBuilt = p.YearBuilt,
                    PropertyType = p.PropertyType
                })
                .OrderByDescending(c => c.SimilarityScore)
                .Take(maxResults)
                .ToList();

            // Get AI adjustment recommendations
            var aiRecommendations = await GetAIAdjustmentRecommendationsAsync(countyCode, targetProperty, rankedComparables);

            var result = new ComparablePropertiesResult
            {
                CountyId = countyCode,
                TargetPropertyId = targetProperty.PropertyId,
                TargetParcelId = parcelId,
                Comparables = rankedComparables,
                AIRecommendations = aiRecommendations
            };

            _logger.LogInformation(
                "Found {Count} comparable properties for parcel {ParcelId} in county {CountyId}",
                rankedComparables.Count, parcelId, countyCode);

            return result;
        }

        /// <summary>
        /// Get property assessment accuracy metrics for county.
        /// COUNTY ISOLATION: Metrics calculated only for specified county.
        /// </summary>
        public async Task<AssessmentAccuracyMetrics> GetAssessmentAccuracyAsync(Guid countyCode)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            _logger.LogInformation("Calculating assessment accuracy for county {CountyId}", countyCode);

            // Get recent assessments with sales data (COUNTY ISOLATED)
            var assessmentsWithSales = await _context.Assessments
                .Where(a => a.Property.CountyId == countyCode  // CRITICAL: County isolation via navigation property
                    && a.AssessmentDate >= DateTime.UtcNow.AddYears(-1)
                    && a.Property.Sales.Any(s => s.SaleDate >= a.AssessmentDate
                        && s.SaleDate <= a.AssessmentDate.AddMonths(6)))
                .Include(a => a.Property)
                    .ThenInclude(p => p.Sales)
                .ToListAsync();

            if (!assessmentsWithSales.Any())
            {
                _logger.LogWarning("No assessments with sales data found for county {CountyId}", countyCode);
                return new AssessmentAccuracyMetrics { CountyId = countyCode, InsufficientData = true };
            }

            // Calculate accuracy metrics
            var accuracyData = assessmentsWithSales.Select(a =>
            {
                var sale = a.Property.Sales
                    .Where(s => s.SaleDate >= a.AssessmentDate && s.SaleDate <= a.AssessmentDate.AddMonths(6))
                    .OrderBy(s => s.SaleDate)
                    .FirstOrDefault();

                if (sale == null) return null;

                var ratio = (double)a.AssessedValue / (double)sale.SalePrice;
                return new { Ratio = ratio, Assessment = a, Sale = sale };
            })
            .Where(x => x != null)
            .ToList();

            var metrics = new AssessmentAccuracyMetrics
            {
                CountyId = countyCode,
                TotalAssessments = accuracyData.Count,
                MedianRatio = CalculateMedian(accuracyData.Select(x => x.Ratio)),
                MeanRatio = accuracyData.Average(x => x.Ratio),
                CoefficientOfDispersion = CalculateCOD(accuracyData.Select(x => x.Ratio)),
                PriceRelatedDifferential = CalculatePRD(accuracyData),
                WithinIAAOStandards = false // Will be set below
            };

            // IAAO standards: Median ratio 0.90-1.10, COD < 15%, PRD 0.98-1.03
            metrics.WithinIAAOStandards =
                metrics.MedianRatio >= 0.90 && metrics.MedianRatio <= 1.10 &&
                metrics.CoefficientOfDispersion < 15.0 &&
                metrics.PriceRelatedDifferential >= 0.98 && metrics.PriceRelatedDifferential <= 1.03;

            _logger.LogInformation(
                "Assessment accuracy for county {CountyId}: Median={Median:F3}, COD={COD:F2}%, PRD={PRD:F3}, IAAO={IAAO}",
                countyCode, metrics.MedianRatio, metrics.CoefficientOfDispersion, metrics.PriceRelatedDifferential, metrics.WithinIAAOStandards);

            return metrics;
        }

        #region Private Helper Methods

        private decimal CalculateMedian(IEnumerable<decimal> values)
        {
            var sorted = values.OrderBy(v => v).ToList();
            if (!sorted.Any()) return 0;

            int count = sorted.Count;
            if (count % 2 == 0)
                return (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
            return sorted[count / 2];
        }

        private double CalculateMedian(IEnumerable<double> values)
        {
            var sorted = values.OrderBy(v => v).ToList();
            if (!sorted.Any()) return 0;

            int count = sorted.Count;
            if (count % 2 == 0)
                return (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
            return sorted[count / 2];
        }

        private decimal CalculateYoYGrowth(List<TrendDataPoint> trends)
        {
            if (trends.Count < 13) return 0; // Need at least 13 months for YoY

            var currentYearAvg = trends.TakeLast(12).Average(t => t.AverageValuation);
            var previousYearAvg = trends.SkipLast(12).TakeLast(12).Average(t => t.AverageValuation);

            if (previousYearAvg == 0) return 0;
            return ((currentYearAvg - previousYearAvg) / previousYearAvg) * 100;
        }

        private double CalculateSimilarityScore(Property target, Property comparable)
        {
            double score = 100.0;

            // Square footage similarity (40% weight)
            var sqftDiff = Math.Abs(target.SquareFootage - comparable.SquareFootage);
            score -= (sqftDiff / (double)target.SquareFootage) * 40.0;

            // Year built similarity (30% weight)
            var yearDiff = Math.Abs(target.YearBuilt - comparable.YearBuilt);
            score -= (yearDiff / 10.0) * 3.0; // 10 years = 30 points

            // Property type exact match (20% weight) - already filtered
            score -= 0; // Same property type guaranteed

            // Location proximity (10% weight) - simplified
            score -= 10.0; // Placeholder for geographic distance calculation

            return Math.Max(0, score);
        }

        private double CalculateCOD(IEnumerable<double> ratios)
        {
            var ratioList = ratios.ToList();
            if (!ratioList.Any()) return 0;

            var median = CalculateMedian(ratioList);
            var absoluteDeviations = ratioList.Select(r => Math.Abs(r - median));
            var avgAbsoluteDeviation = absoluteDeviations.Average();

            return (avgAbsoluteDeviation / median) * 100.0;
        }

        private double CalculatePRD(List<dynamic> accuracyData)
        {
            if (!accuracyData.Any()) return 0;

            var meanRatio = accuracyData.Average(x => (double)x.Ratio);
            var weightedMeanRatio = accuracyData.Sum(x => (double)x.Assessment.AssessedValue) /
                                   accuracyData.Sum(x => (double)x.Sale.SalePrice);

            return meanRatio / weightedMeanRatio;
        }

        private async Task<AIPropertyInsights> GetAIInsightsAsync(Guid countyCode, PropertyValuationTrends trends)
        {
            // Integrate with TerraFusion Consciousness Engine for AI-powered insights
            var swarmRequest = new AISwarmRequest
            {
                CountyId = countyCode,
                AnalysisType = "ValuationTrends",
                Data = trends,
                SwarmSize = 100 // 100 AI agents
            };

            var swarmResult = await _aiCoordinator.CoordinateAnalysisAsync(swarmRequest);

            return new AIPropertyInsights
            {
                Confidence = swarmResult.Confidence,
                Insights = swarmResult.Insights,
                Recommendations = swarmResult.Recommendations,
                SwarmSize = swarmResult.AgentsUsed
            };
        }

        private async Task<List<AIAdjustmentRecommendation>> GetAIAdjustmentRecommendationsAsync(
            Guid countyCode,
            Property target,
            List<ComparableProperty> comparables)
        {
            var swarmRequest = new AISwarmRequest
            {
                CountyId = countyCode,
                AnalysisType = "ComparableAdjustments",
                Data = new { Target = target, Comparables = comparables },
                SwarmSize = 50
            };

            var swarmResult = await _aiCoordinator.CoordinateAnalysisAsync(swarmRequest);

            return swarmResult.Adjustments;
        }

        #endregion
    }
}
