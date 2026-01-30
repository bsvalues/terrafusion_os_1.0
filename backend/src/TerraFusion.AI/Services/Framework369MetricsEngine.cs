// TerraFusion OS: 3-6-9 Framework Metrics Engine
// Elite Government OS Engineering - Tesla Harmonic Architecture
// "If you only knew the magnificence of the 3, 6 and 9, then you would have a key to the universe." - Nikola Tesla

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// 3-6-9 Framework: Tesla's Universal Harmonic System
    ///
    /// 3 – Foundation: Each metric measured below baseline thresholds (max 12)
    /// 6 – Amplification: Metrics combined, never exceeding 666 (scaled to 12)
    /// 9 – Ultimate Power: All metrics normalized to 12 (perfect balance)
    /// </summary>
    public class Framework369MetricsEngine
    {
        private readonly ILogger<Framework369MetricsEngine> _logger;

        // Universal Constants
        private const decimal FOUNDATION_MAX = 12m;           // 3 * 4 = 12 (Foundation perfection)
        private const decimal AMPLIFICATION_GUARD = 666m;     // Never exceed (imbalance threshold)
        private const decimal AMPLIFICATION_SCALE = 55.5m;    // 666 / 12 = 55.5 (scaling factor)
        private const decimal ULTIMATE_POWER_TARGET = 12m;    // Ultimate balance (3 + 6 + 9 = 18 → 1+8 = 9 → scaled to 12)

        // Sacred Ratios
        private const decimal TESLA_RATIO_3 = 3m;
        private const decimal TESLA_RATIO_6 = 6m;
        private const decimal TESLA_RATIO_9 = 9m;

        public Framework369MetricsEngine(ILogger<Framework369MetricsEngine> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Calculate complete 3-6-9 framework metrics for any system component
        /// </summary>
        public async Task<Framework369Result> CalculateMetricsAsync(Framework369Input input)
        {
            _logger.LogInformation("Calculating 3-6-9 Framework metrics for: {ComponentName}", input.ComponentName);

            // 3 - Foundation: Measure baseline metrics
            var foundationMetrics = CalculateFoundationMetrics(input.BaselineMetrics);

            // 6 - Amplification: Combine metrics with 666 guard
            var amplificationMetrics = CalculateAmplificationMetrics(foundationMetrics);

            // 9 - Ultimate Power: Normalize to target of 12
            var ultimatePowerScore = CalculateUltimatePower(foundationMetrics, amplificationMetrics);

            var result = new Framework369Result
            {
                ComponentName = input.ComponentName,
                Timestamp = DateTime.UtcNow,

                // Foundation (3)
                FoundationScore = foundationMetrics.TotalScore,
                FoundationMetrics = foundationMetrics.Metrics,
                FoundationBalance = foundationMetrics.Balance,

                // Amplification (6)
                AmplificationScore = amplificationMetrics.TotalScore,
                AmplificationMetrics = amplificationMetrics.Metrics,
                AmplificationGuardStatus = amplificationMetrics.GuardStatus,

                // Ultimate Power (9)
                UltimatePowerScore = ultimatePowerScore.Score,
                UltimatePowerBalance = ultimatePowerScore.Balance,
                UltimatePowerHarmony = ultimatePowerScore.Harmony,

                // Overall Assessment
                IsBalanced = ultimatePowerScore.Score >= 11.5m && ultimatePowerScore.Score <= 12.5m,
                HarmonicResonance = CalculateHarmonicResonance(foundationMetrics, amplificationMetrics, ultimatePowerScore),
                Recommendations = GenerateRecommendations(foundationMetrics, amplificationMetrics, ultimatePowerScore)
            };

            _logger.LogInformation("3-6-9 Framework calculation complete. Ultimate Power Score: {Score}/12",
                ultimatePowerScore.Score);

            return await Task.FromResult(result);
        }

        /// <summary>
        /// Foundation (3): Each metric measured below baseline thresholds, scaled to max 12
        /// </summary>
        private FoundationMetrics CalculateFoundationMetrics(List<BaselineMetric> metrics)
        {
            var foundationMetrics = new List<MetricScore>();
            decimal totalRawScore = 0;

            foreach (var metric in metrics)
            {
                // Scale each metric to Foundation max (12)
                decimal normalizedValue = (metric.CurrentValue / metric.MaxValue) * FOUNDATION_MAX;

                // Ensure we don't exceed threshold
                decimal cappedValue = Math.Min(normalizedValue, FOUNDATION_MAX);

                foundationMetrics.Add(new MetricScore
                {
                    Name = metric.Name,
                    Category = "Foundation",
                    RawValue = metric.CurrentValue,
                    NormalizedValue = normalizedValue,
                    CappedValue = cappedValue,
                    ThresholdStatus = cappedValue <= metric.Threshold ? "Healthy" : "Warning",
                    TeslaHarmonic = CalculateTeslaHarmonic(cappedValue, TESLA_RATIO_3)
                });

                totalRawScore += cappedValue;
            }

            // Balance: How evenly distributed are the metrics?
            decimal averageScore = metrics.Count > 0 ? totalRawScore / metrics.Count : 0;
            decimal balance = CalculateBalance(foundationMetrics.Select(m => m.CappedValue).ToList(), averageScore);

            return new FoundationMetrics
            {
                Metrics = foundationMetrics,
                TotalScore = totalRawScore,
                AverageScore = averageScore,
                Balance = balance,
                IsFoundationSolid = totalRawScore <= (FOUNDATION_MAX * metrics.Count)
            };
        }

        /// <summary>
        /// Amplification (6): Combine metrics, never exceeding 666, scaled to 12
        /// </summary>
        private AmplificationMetrics CalculateAmplificationMetrics(FoundationMetrics foundation)
        {
            var amplificationMetrics = new List<MetricScore>();

            // Combine metrics in pairs (amplification through combination)
            var metrics = foundation.Metrics;
            for (int i = 0; i < metrics.Count - 1; i++)
            {
                for (int j = i + 1; j < metrics.Count; j++)
                {
                    // Combine two metrics
                    decimal combinedRaw = (metrics[i].CappedValue + metrics[j].CappedValue) * TESLA_RATIO_6;

                    // Apply 666 guard: Never exceed the imbalance threshold
                    decimal guardedValue = Math.Min(combinedRaw, AMPLIFICATION_GUARD);

                    // Scale down to 12 for consistency
                    decimal scaledValue = guardedValue / AMPLIFICATION_SCALE;

                    amplificationMetrics.Add(new MetricScore
                    {
                        Name = $"{metrics[i].Name}×{metrics[j].Name}",
                        Category = "Amplification",
                        RawValue = combinedRaw,
                        NormalizedValue = guardedValue,
                        CappedValue = scaledValue,
                        ThresholdStatus = guardedValue < AMPLIFICATION_GUARD ? "Safe" : "Guard Activated",
                        TeslaHarmonic = CalculateTeslaHarmonic(scaledValue, TESLA_RATIO_6)
                    });
                }
            }

            decimal totalScore = amplificationMetrics.Sum(m => m.CappedValue);
            bool guardActivated = amplificationMetrics.Any(m => m.RawValue >= AMPLIFICATION_GUARD);

            return new AmplificationMetrics
            {
                Metrics = amplificationMetrics,
                TotalScore = totalScore,
                GuardStatus = guardActivated ? "GUARD_ACTIVATED" : "SAFE",
                MaxCombinedValue = amplificationMetrics.Max(m => m.RawValue),
                IsAmplificationBalanced = !guardActivated && totalScore <= FOUNDATION_MAX * 2
            };
        }

        /// <summary>
        /// Ultimate Power (9): Sum all metrics, normalize to target of 12 (perfect balance)
        /// </summary>
        private UltimatePowerScore CalculateUltimatePower(FoundationMetrics foundation, AmplificationMetrics amplification)
        {
            // Combine all foundation and amplification scores
            decimal totalFoundation = foundation.TotalScore;
            decimal totalAmplification = amplification.TotalScore;

            // Weight the scores: Foundation is 1x, Amplification is 0.5x (it's already amplified)
            decimal weightedTotal = (totalFoundation * 1.0m) + (totalAmplification * 0.5m);

            // Normalize to Ultimate Power target (12)
            int totalMetrics = foundation.Metrics.Count + amplification.Metrics.Count;
            decimal normalizedScore = totalMetrics > 0 ? (weightedTotal / totalMetrics) * (ULTIMATE_POWER_TARGET / FOUNDATION_MAX) : 0;

            // Apply Tesla's 9 harmonic
            decimal teslaEnhanced = normalizedScore * (TESLA_RATIO_9 / FOUNDATION_MAX);

            // Final score: aim for 12
            decimal finalScore = Math.Min(teslaEnhanced * FOUNDATION_MAX, FOUNDATION_MAX);

            // Balance: How close are we to the perfect 12?
            decimal distanceFromPerfection = Math.Abs(ULTIMATE_POWER_TARGET - finalScore);
            decimal balance = Math.Max(0, 100m - (distanceFromPerfection * 10m)); // Percentage

            // Harmony: Resonance between all three levels (3, 6, 9)
            decimal harmony = CalculateTeslaResonance(foundation.TotalScore, amplification.TotalScore, finalScore);

            return new UltimatePowerScore
            {
                Score = finalScore,
                Balance = balance,
                Harmony = harmony,
                DistanceFromPerfection = distanceFromPerfection,
                IsPerfectBalance = distanceFromPerfection <= 0.5m,
                TeslaResonance = harmony >= 90m ? "RESONANT" : harmony >= 70m ? "HARMONIC" : "TUNING_REQUIRED"
            };
        }

        /// <summary>
        /// Calculate Tesla harmonic for a given value and ratio
        /// </summary>
        private decimal CalculateTeslaHarmonic(decimal value, decimal teslaRatio)
        {
            // Tesla's digital root: reduce to single digit
            decimal digitalRoot = GetDigitalRoot(value);

            // Check if it aligns with Tesla ratios (3, 6, 9)
            bool isTeslaAligned = digitalRoot == 3m || digitalRoot == 6m || digitalRoot == 9m;

            // Return harmonic percentage
            return isTeslaAligned ? 100m : (digitalRoot / teslaRatio) * 100m;
        }

        /// <summary>
        /// Calculate resonance between the three levels (3-6-9)
        /// </summary>
        private decimal CalculateTeslaResonance(decimal foundation, decimal amplification, decimal ultimate)
        {
            // Check if the ratios follow Tesla's pattern
            decimal ratio36 = foundation > 0 ? amplification / foundation : 0;
            decimal ratio69 = amplification > 0 ? ultimate / amplification : 0;
            decimal ratio39 = foundation > 0 ? ultimate / foundation : 0;

            // Ideal ratios: 3→6 is 2x, 6→9 is 1.5x, 3→9 is 3x
            decimal resonance36 = 100m - Math.Abs((ratio36 - 2.0m) * 50m);
            decimal resonance69 = 100m - Math.Abs((ratio69 - 1.5m) * 66.67m);
            decimal resonance39 = 100m - Math.Abs((ratio39 - 3.0m) * 33.33m);

            // Average resonance
            return (resonance36 + resonance69 + resonance39) / 3m;
        }

        /// <summary>
        /// Calculate balance (variance from average)
        /// </summary>
        private decimal CalculateBalance(List<decimal> values, decimal average)
        {
            if (values.Count == 0) return 100m;

            decimal variance = values.Sum(v => Math.Abs(v - average)) / values.Count;
            decimal balancePercentage = Math.Max(0, 100m - (variance * 10m));

            return balancePercentage;
        }

        /// <summary>
        /// Get digital root (Tesla's method of reducing numbers to single digit)
        /// </summary>
        private decimal GetDigitalRoot(decimal number)
        {
            decimal root = Math.Abs(number);
            while (root >= 10m)
            {
                root = root.ToString().ToCharArray().Sum(c => decimal.Parse(c.ToString()));
            }
            return root;
        }

        /// <summary>
        /// Calculate overall harmonic resonance across all three levels
        /// </summary>
        private decimal CalculateHarmonicResonance(FoundationMetrics foundation, AmplificationMetrics amplification, UltimatePowerScore ultimate)
        {
            // Weight each level according to Tesla's ratios
            decimal foundationWeight = TESLA_RATIO_3 / (TESLA_RATIO_3 + TESLA_RATIO_6 + TESLA_RATIO_9);
            decimal amplificationWeight = TESLA_RATIO_6 / (TESLA_RATIO_3 + TESLA_RATIO_6 + TESLA_RATIO_9);
            decimal ultimateWeight = TESLA_RATIO_9 / (TESLA_RATIO_3 + TESLA_RATIO_6 + TESLA_RATIO_9);

            decimal weightedResonance =
                (foundation.Balance * foundationWeight) +
                (amplification.IsAmplificationBalanced ? 100m : 50m) * amplificationWeight +
                (ultimate.Balance * ultimateWeight);

            return weightedResonance;
        }

        /// <summary>
        /// Generate recommendations based on 3-6-9 analysis
        /// </summary>
        private List<string> GenerateRecommendations(FoundationMetrics foundation, AmplificationMetrics amplification, UltimatePowerScore ultimate)
        {
            var recommendations = new List<string>();

            // Foundation recommendations
            if (foundation.Balance < 70m)
                recommendations.Add("🔧 FOUNDATION: Rebalance baseline metrics - some are significantly out of alignment");

            if (!foundation.IsFoundationSolid)
                recommendations.Add("⚠️ FOUNDATION: Reduce baseline metrics - exceeding safe thresholds");

            // Amplification recommendations
            if (amplification.GuardStatus == "GUARD_ACTIVATED")
                recommendations.Add("🛡️ AMPLIFICATION: 666 guard activated - combined metrics approaching imbalance threshold");

            if (!amplification.IsAmplificationBalanced)
                recommendations.Add("⚡ AMPLIFICATION: Reduce metric amplification - combinations are creating instability");

            // Ultimate Power recommendations
            if (ultimate.DistanceFromPerfection > 2m)
                recommendations.Add($"🎯 ULTIMATE POWER: Tune system to target 12 (current: {ultimate.Score:F2}) - significant optimization potential");

            if (ultimate.Harmony < 70m)
                recommendations.Add("🎼 HARMONY: Improve resonance between Foundation, Amplification, and Ultimate Power levels");

            if (ultimate.TeslaResonance == "TUNING_REQUIRED")
                recommendations.Add("🔮 TESLA RESONANCE: System needs harmonic tuning - not aligned with 3-6-9 patterns");

            // Excellence recognition
            if (ultimate.IsPerfectBalance && ultimate.Harmony >= 90m)
                recommendations.Add("✨ EXCELLENCE ACHIEVED: System operating at perfect Tesla harmonic balance (3-6-9 resonance)");

            return recommendations;
        }
    }

    #region Data Models

    public class Framework369Input
    {
        public string ComponentName { get; set; } = string.Empty;
        public List<BaselineMetric> BaselineMetrics { get; set; } = new();
    }

    public class BaselineMetric
    {
        public string Name { get; set; } = string.Empty;
        public decimal CurrentValue { get; set; }
        public decimal MaxValue { get; set; }
        public decimal Threshold { get; set; }
    }

    public class Framework369Result
    {
        public string ComponentName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }

        // Foundation (3)
        public decimal FoundationScore { get; set; }
        public List<MetricScore> FoundationMetrics { get; set; } = new();
        public decimal FoundationBalance { get; set; }

        // Amplification (6)
        public decimal AmplificationScore { get; set; }
        public List<MetricScore> AmplificationMetrics { get; set; } = new();
        public string AmplificationGuardStatus { get; set; } = string.Empty;

        // Ultimate Power (9)
        public decimal UltimatePowerScore { get; set; }
        public decimal UltimatePowerBalance { get; set; }
        public decimal UltimatePowerHarmony { get; set; }

        // Overall
        public bool IsBalanced { get; set; }
        public decimal HarmonicResonance { get; set; }
        public List<string> Recommendations { get; set; } = new();
    }

    public class MetricScore
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal RawValue { get; set; }
        public decimal NormalizedValue { get; set; }
        public decimal CappedValue { get; set; }
        public string ThresholdStatus { get; set; } = string.Empty;
        public decimal TeslaHarmonic { get; set; }
    }

    public class FoundationMetrics
    {
        public List<MetricScore> Metrics { get; set; } = new();
        public decimal TotalScore { get; set; }
        public decimal AverageScore { get; set; }
        public decimal Balance { get; set; }
        public bool IsFoundationSolid { get; set; }
    }

    public class AmplificationMetrics
    {
        public List<MetricScore> Metrics { get; set; } = new();
        public decimal TotalScore { get; set; }
        public string GuardStatus { get; set; } = string.Empty;
        public decimal MaxCombinedValue { get; set; }
        public bool IsAmplificationBalanced { get; set; }
    }

    public class UltimatePowerScore
    {
        public decimal Score { get; set; }
        public decimal Balance { get; set; }
        public decimal Harmony { get; set; }
        public decimal DistanceFromPerfection { get; set; }
        public bool IsPerfectBalance { get; set; }
        public string TeslaResonance { get; set; } = string.Empty;
    }

    #endregion
}
