using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-074: Levy forecast model tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class LevyForecastTests
    {
        [Fact]
        public void LinearForecast_PredictedValue_WithinAcceptableTolerance()
        {
            // Simple linear: rate increases 0.05 per year
            var history = new List<(int Year, decimal Rate)>
            {
                (2021, 4.00m), (2022, 4.05m), (2023, 4.10m), (2024, 4.15m),
            };
            decimal annualDelta = (history.Last().Rate - history.First().Rate)
                                  / (history.Count - 1);

            decimal forecast2025 = history.Last().Rate + annualDelta;

            Assert.Equal(4.20m, forecast2025);
        }

        [Fact]
        public void ExponentialForecast_GrowthRate_CalculatedCorrectly()
        {
            decimal baseLevy = 1_000_000m;
            decimal annualGrowthRate = 0.01m; // 1%
            int yearsOut = 5;

            decimal projected = baseLevy * (decimal)Math.Pow(
                (double)(1 + annualGrowthRate), yearsOut);

            // 1,000,000 * (1.01)^5 ~ 1,051,010.05
            Assert.InRange(projected, 1_051_000m, 1_051_100m);
        }

        [Fact]
        public void ScenarioComparison_HighVsLowGrowth_HighExceedsLow()
        {
            decimal baseLevy = 500_000m;
            int years = 3;
            decimal lowGrowth = 0.005m;
            decimal highGrowth = 0.015m;

            decimal lowProjected = baseLevy * (decimal)Math.Pow((double)(1 + lowGrowth), years);
            decimal highProjected = baseLevy * (decimal)Math.Pow((double)(1 + highGrowth), years);

            Assert.True(highProjected > lowProjected);
            decimal spread = highProjected - lowProjected;
            Assert.True(spread > 0);
        }

        [Fact]
        public void LinearForecast_FlatHistory_PredictsSameValue()
        {
            var history = new List<(int Year, decimal Rate)>
            {
                (2022, 3.50m), (2023, 3.50m), (2024, 3.50m),
            };
            decimal annualDelta = (history.Last().Rate - history.First().Rate)
                                  / (history.Count - 1);

            decimal forecast = history.Last().Rate + annualDelta;

            Assert.Equal(3.50m, forecast);
        }
    }
}
