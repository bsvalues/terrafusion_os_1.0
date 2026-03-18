// LEV-014 — Historical Analysis Service (AI-Powered)
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TerraFusion.AI.Analysis
{
    /// <summary>
    /// Statistical analysis of historical levy rates.
    /// Provides descriptive statistics, moving averages, and anomaly detection
    /// for WA property tax rate time series.
    /// </summary>
    public class HistoricalAnalysisService
    {
        /// <summary>
        /// Compute descriptive statistics for a set of historical rates.
        /// </summary>
        /// <param name="rates">Ordered list of (year, rate) pairs.</param>
        /// <returns>Statistics including mean, median, std dev, min, max.</returns>
        public Task<RateStatistics> ComputeStatisticsAsync(
            List<(int Year, decimal Rate)> rates)
        {
            if (rates.Count == 0)
                return Task.FromResult(RateStatistics.Empty());

            var values = rates.Select(r => (double)r.Rate).ToList();
            var mean = values.Average();
            var sorted = values.OrderBy(v => v).ToList();
            var median = sorted.Count % 2 == 0
                ? (sorted[sorted.Count / 2 - 1] + sorted[sorted.Count / 2]) / 2.0
                : sorted[sorted.Count / 2];
            var variance = values.Sum(v => (v - mean) * (v - mean)) / values.Count;
            var stdDev = Math.Sqrt(variance);

            return Task.FromResult(new RateStatistics
            {
                Count = rates.Count,
                Mean = Math.Round((decimal)mean, 6),
                Median = Math.Round((decimal)median, 6),
                StdDev = Math.Round((decimal)stdDev, 6),
                Min = rates.Min(r => r.Rate),
                Max = rates.Max(r => r.Rate),
                MinYear = rates.OrderBy(r => r.Rate).First().Year,
                MaxYear = rates.OrderByDescending(r => r.Rate).First().Year
            });
        }

        /// <summary>
        /// Calculate a simple moving average over the rate series.
        /// </summary>
        /// <param name="rates">Ordered (year, rate) pairs.</param>
        /// <param name="window">Window size for the moving average.</param>
        public Task<List<MovingAveragePoint>> ComputeMovingAverageAsync(
            List<(int Year, decimal Rate)> rates, int window = 3)
        {
            var points = new List<MovingAveragePoint>();
            for (int i = window - 1; i < rates.Count; i++)
            {
                var windowRates = rates.Skip(i - window + 1).Take(window);
                var avg = windowRates.Average(r => r.Rate);
                points.Add(new MovingAveragePoint
                {
                    Year = rates[i].Year,
                    ActualRate = rates[i].Rate,
                    MovingAverage = Math.Round(avg, 6)
                });
            }
            return Task.FromResult(points);
        }

        /// <summary>
        /// Detect anomalous rate changes using z-score analysis.
        /// A year-over-year change exceeding the threshold (default 2 sigma)
        /// is flagged as an anomaly.
        /// </summary>
        /// <param name="rates">Ordered (year, rate) pairs.</param>
        /// <param name="zThreshold">Z-score threshold for anomaly detection.</param>
        public Task<List<RateAnomaly>> DetectAnomaliesAsync(
            List<(int Year, decimal Rate)> rates, double zThreshold = 2.0)
        {
            var anomalies = new List<RateAnomaly>();
            if (rates.Count < 3) return Task.FromResult(anomalies);

            var changes = new List<(int Year, double Change)>();
            for (int i = 1; i < rates.Count; i++)
            {
                var change = (double)(rates[i].Rate - rates[i - 1].Rate);
                changes.Add((rates[i].Year, change));
            }

            var mean = changes.Average(c => c.Change);
            var stdDev = Math.Sqrt(changes.Sum(c => (c.Change - mean) * (c.Change - mean)) / changes.Count);

            if (stdDev < 0.0001) return Task.FromResult(anomalies);

            foreach (var (year, change) in changes)
            {
                var zScore = (change - mean) / stdDev;
                if (Math.Abs(zScore) > zThreshold)
                {
                    anomalies.Add(new RateAnomaly
                    {
                        Year = year,
                        Change = Math.Round((decimal)change, 6),
                        ZScore = Math.Round(zScore, 2),
                        Severity = Math.Abs(zScore) > 3 ? "High" : "Medium"
                    });
                }
            }

            return Task.FromResult(anomalies);
        }
    }

    /// <summary>Descriptive statistics for a rate series.</summary>
    public class RateStatistics
    {
        public int Count { get; set; }
        public decimal Mean { get; set; }
        public decimal Median { get; set; }
        public decimal StdDev { get; set; }
        public decimal Min { get; set; }
        public decimal Max { get; set; }
        public int MinYear { get; set; }
        public int MaxYear { get; set; }

        public static RateStatistics Empty() => new();
    }

    /// <summary>A single moving average data point.</summary>
    public class MovingAveragePoint
    {
        public int Year { get; set; }
        public decimal ActualRate { get; set; }
        public decimal MovingAverage { get; set; }
    }

    /// <summary>An anomalous rate change detected by z-score analysis.</summary>
    public class RateAnomaly
    {
        public int Year { get; set; }
        public decimal Change { get; set; }
        public double ZScore { get; set; }
        public string Severity { get; set; } = string.Empty;
    }
}
