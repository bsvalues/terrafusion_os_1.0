using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Services
{
    /// <summary>
    /// Deterministic levy calculation service.
    /// Legacy AI/quantum field names remain for compatibility, but no governed
    /// optimization model is wired behind this service.
    /// </summary>
    public class LevyCalculationService : ILevyCalculationService
    {
        private readonly LevyDbContext _context;
        private readonly ILogger<LevyCalculationService> _logger;
        private const decimal BaseCompatibilityConfidence = 0.72m;
        private const decimal MaxCompatibilityConfidence = 0.84m;

        public LevyCalculationService(
            LevyDbContext context,
            ILogger<LevyCalculationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public Task<LevyRateCalculationResult> CalculateOptimalRateAsync(
            LevyMeasure measure,
            bool useQuantumOptimization = true)
        {
            _logger.LogInformation(
                "Calculating recommended rate for levy measure {MeasureId} ({MeasureName}) in deterministic compatibility mode. RequestedQuantumOptimization={QuantumRequested}",
                measure.Id, measure.Name, useQuantumOptimization);

            // Base calculation: target amount / assessed value
            var baseRate = measure.TotalAssessedValue > 0
                ? measure.TargetAmount / measure.TotalAssessedValue
                : 0m;

            var calculatedAmount = baseRate * measure.TotalAssessedValue;

            var confidenceScore = CalculateRateConfidence(measure, baseRate);

            // Check statutory limits
            var exceedsLimit = measure.MaximumRate.HasValue && baseRate > measure.MaximumRate.Value;
            var recommendedRate = exceedsLimit && measure.MaximumRate.HasValue
                ? measure.MaximumRate.Value
                : baseRate;

            return Task.FromResult(new LevyRateCalculationResult
            {
                CalculatedRate = baseRate,
                LevyAmount = calculatedAmount,
                AiOptimalRate = recommendedRate,
                ConfidenceScore = confidenceScore,
                QuantumOptimized = false,
                RecommendationReason = exceedsLimit
                    ? "Base rate exceeded the statutory cap and was reduced to the maximum allowed rate."
                    : "Base rate derived from target amount and assessed value; no governed optimization model is wired.",
                CalculationDetails = new Dictionary<string, object>
                {
                    ["targetAmount"] = measure.TargetAmount,
                    ["assessedValue"] = measure.TotalAssessedValue,
                    ["baseRate"] = baseRate,
                    ["optimizationMode"] = "deterministic_rate_cap_only",
                    ["requestedQuantumOptimization"] = useQuantumOptimization,
                    ["governedOptimizationAvailable"] = false,
                    ["exceedsLimit"] = exceedsLimit,
                    ["maximumRate"] = measure.MaximumRate ?? 0m
                }
            });
        }

        public async Task<decimal> CalculateLevyAmountAsync(decimal assessedValue, decimal rate)
        {
            await Task.CompletedTask;
            return assessedValue * rate;
        }

        public async Task<DistrictLevyTotal> CalculateDistrictTotalAsync(Guid districtId, int levyYear)
        {
            _logger.LogInformation(
                "Calculating district total levy for district {DistrictId}, year {LevyYear}",
                districtId, levyYear);

            var district = await _context.Districts
                .Include(d => d.LevyMeasures)
                .FirstOrDefaultAsync(d => d.Id == districtId);

            if (district == null)
            {
                throw new ArgumentException($"District {districtId} not found", nameof(districtId));
            }

            // Get all active levy measures for this district and year
            var activeMeasures = district.LevyMeasures
                .Where(m => m.LevyYear == levyYear && m.Status == "Active")
                .ToList();

            // Calculate rates for each measure
            var breakdown = new List<LevyMeasureBreakdown>();
            decimal totalRate = 0m;
            decimal totalAmount = 0m;

            foreach (var measure in activeMeasures)
            {
                var calculation = await CalculateOptimalRateAsync(measure, useQuantumOptimization: false);
                var amount = await CalculateLevyAmountAsync(district.TotalAssessedValue, calculation.AiOptimalRate);

                breakdown.Add(new LevyMeasureBreakdown
                {
                    MeasureId = measure.Id,
                    MeasureName = measure.Name,
                    LevyType = measure.LevyType,
                    Rate = calculation.AiOptimalRate,
                    Amount = amount,
                    PercentageOfTotal = 0m // Will calculate after total known
                });

                totalRate += calculation.AiOptimalRate;
                totalAmount += amount;
            }

            // Update percentages
            foreach (var item in breakdown)
            {
                item.PercentageOfTotal = totalAmount > 0 ? (item.Amount / totalAmount) * 100 : 0m;
            }

            // Project collection using a conservative administrative default.
            var collectionRate = 0.98m;
            var projectedRevenue = totalAmount * collectionRate;

            return new DistrictLevyTotal
            {
                DistrictId = district.Id,
                DistrictName = district.Name,
                LevyYear = levyYear,
                TotalAssessedValue = district.TotalAssessedValue,
                TotalLevyRate = totalRate,
                TotalLevyAmount = totalAmount,
                MeasureBreakdown = breakdown,
                ProjectedCollectionRate = collectionRate,
                ProjectedNetRevenue = projectedRevenue
            };
        }

        public async Task<LevyComplianceResult> ValidateRateComplianceAsync(
            LevyMeasure measure,
            decimal proposedRate)
        {
            await Task.CompletedTask;
            var result = new LevyComplianceResult
            {
                ProposedRate = proposedRate,
                MaximumAllowedRate = measure.MaximumRate ?? decimal.MaxValue,
                StatutoryLimit = measure.MaximumRate ?? decimal.MaxValue
            };

            // Check if rate exceeds maximum
            if (measure.MaximumRate.HasValue && proposedRate > measure.MaximumRate.Value)
            {
                result.IsCompliant = false;
                result.ComplianceLevel = "NON_COMPLIANT";
                result.Violations.Add($"Proposed rate {proposedRate:F6} exceeds maximum allowed rate {measure.MaximumRate.Value:F6}");
            }
            else if (measure.MaximumRate.HasValue && proposedRate > measure.MaximumRate.Value * 0.9m)
            {
                // Warning if within 90% of limit
                result.IsCompliant = true;
                result.ComplianceLevel = "WARNING";
                result.Warnings.Add($"Proposed rate is within 10% of statutory maximum");
            }
            else
            {
                result.IsCompliant = true;
                result.ComplianceLevel = "COMPLIANT";
            }

            // Check if subject to limit
            if (measure.SubjectToLimit && !measure.MaximumRate.HasValue)
            {
                result.Warnings.Add("Measure is subject to statutory limits but no maximum rate is defined");
            }

            _logger.LogInformation(
                "Rate compliance validation: Measure {MeasureId}, Proposed {ProposedRate:F6}, Result {ComplianceLevel}",
                measure.Id, proposedRate, result.ComplianceLevel);

            return result;
        }

        public async Task<decimal> CalculateProjectedRevenueAsync(
            decimal levyAmount,
            decimal collectionRate)
        {
            await Task.CompletedTask;
            // Ensure collection rate is within valid range
            if (collectionRate < 0 || collectionRate > 1)
            {
                throw new ArgumentException("Collection rate must be between 0 and 1", nameof(collectionRate));
            }

            return levyAmount * collectionRate;
        }

        public async Task<List<LevyScenarioAnalysis>> AnalyzeScenariosAsync(
            LevyMeasure measure,
            List<decimal> rateVariations)
        {
            _logger.LogInformation(
                "Analyzing {ScenarioCount} scenarios for levy measure {MeasureId}",
                rateVariations.Count, measure.Id);

            var scenarios = new List<LevyScenarioAnalysis>();

            foreach (var rate in rateVariations)
            {
                var levyAmount = await CalculateLevyAmountAsync(measure.TotalAssessedValue, rate);
                var collectionRate = EstimateCollectionRate(rate, measure);
                var projectedRevenue = await CalculateProjectedRevenueAsync(levyAmount, collectionRate);
                var riskLevel = AssessRiskLevel(rate, measure);
                var confidence = CalculateScenarioConfidence(rate, measure);

                scenarios.Add(new LevyScenarioAnalysis
                {
                    ScenarioName = $"Rate {rate:F6} ({GetScenarioLabel(rate, measure)})",
                    Rate = rate,
                    LevyAmount = levyAmount,
                    ProjectedRevenue = projectedRevenue,
                    CollectionRate = collectionRate,
                    AiConfidenceScore = confidence,
                    RiskLevel = riskLevel,
                    AiInsights = new Dictionary<string, object>
                    {
                        ["analysisMode"] = "deterministic_heuristic",
                        ["governedOptimizationAvailable"] = false,
                        ["complianceStatus"] = rate <= (measure.MaximumRate ?? decimal.MaxValue) ? "COMPLIANT" : "EXCEEDS_LIMIT",
                        ["revenueGap"] = measure.TargetAmount - projectedRevenue,
                        ["revenueGapPercentage"] = measure.TargetAmount > 0 ? ((measure.TargetAmount - projectedRevenue) / measure.TargetAmount) * 100 : 0
                    }
                });
            }

            return scenarios.OrderByDescending(s => s.AiConfidenceScore).ToList();
        }

        #region Private Helper Methods

        /// <summary>
        /// Estimate confidence from the available inputs, without implying a governed optimization model.
        /// </summary>
        private decimal CalculateRateConfidence(LevyMeasure measure, decimal baseRate)
        {
            var confidence = BaseCompatibilityConfidence;

            if (measure.TotalAssessedValue > 0)
            {
                confidence += 0.05m;
            }

            if (measure.TargetAmount > 0 && baseRate > 0)
            {
                confidence += 0.03m;
            }

            if (measure.MaximumRate.HasValue)
            {
                confidence += 0.02m;
            }
            else if (measure.SubjectToLimit)
            {
                confidence -= 0.05m;
            }

            return Math.Clamp(confidence, 0.55m, MaxCompatibilityConfidence);
        }

        /// <summary>
        /// Estimate collection rate based on levy characteristics.
        /// </summary>
        private decimal EstimateCollectionRate(decimal rate, LevyMeasure measure)
        {
            // Higher rates typically have slightly lower collection rates
            var baseCollectionRate = 0.98m;

            if (rate > 0.002m) // Above 0.2% rate
            {
                baseCollectionRate -= 0.01m; // Slight decrease for higher rates
            }

            return Math.Max(0.95m, baseCollectionRate); // Minimum 95%
        }

        /// <summary>
        /// Assess risk level for a proposed rate.
        /// </summary>
        private string AssessRiskLevel(decimal rate, LevyMeasure measure)
        {
            if (!measure.MaximumRate.HasValue)
            {
                return "LOW";
            }

            var percentOfMax = rate / measure.MaximumRate.Value;

            return percentOfMax switch
            {
                > 1.0m => "CRITICAL",
                > 0.95m => "HIGH",
                > 0.85m => "MEDIUM",
                _ => "LOW"
            };
        }

        /// <summary>
        /// Calculate AI confidence score for scenario.
        /// </summary>
        private decimal CalculateScenarioConfidence(decimal rate, LevyMeasure measure)
        {
            var baseConfidence = BaseCompatibilityConfidence;

            // Increase confidence if rate is within statutory limits
            if (measure.MaximumRate.HasValue && rate <= measure.MaximumRate.Value)
            {
                baseConfidence += 0.05m;
            }

            if (measure.SubjectToLimit && !measure.MaximumRate.HasValue)
            {
                baseConfidence -= 0.05m;
            }

            return Math.Clamp(baseConfidence, 0.55m, MaxCompatibilityConfidence);
        }

        /// <summary>
        /// Get scenario label based on rate characteristics.
        /// </summary>
        private string GetScenarioLabel(decimal rate, LevyMeasure measure)
        {
            if (!measure.MaximumRate.HasValue)
            {
                return "Standard";
            }

            var percentOfMax = (rate / measure.MaximumRate.Value) * 100;

            return percentOfMax switch
            {
                > 100 => "Above Limit",
                > 95 => "Near Maximum",
                > 75 => "Conservative",
                > 50 => "Moderate",
                _ => "Minimal"
            };
        }

        #endregion
    }
}
