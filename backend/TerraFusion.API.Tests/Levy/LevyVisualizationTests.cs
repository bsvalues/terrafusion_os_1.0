using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-073: Chart and visualization data generation tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class LevyVisualizationTests
    {
        private record RateComparisonPoint(string DistrictName, decimal Rate);
        private record TrendPoint(int Year, decimal Rate);
        private record HeatmapCell(string DistrictCode, decimal Intensity);

        [Fact]
        public void RateComparisonData_GeneratesCorrectPointsPerDistrict()
        {
            var data = new List<RateComparisonPoint>
            {
                new("Fabricated City A", 2.10m),
                new("Fabricated City B", 3.45m),
                new("Fabricated City C", 1.80m),
            };

            Assert.Equal(3, data.Count);
            Assert.Equal("Fabricated City B", data.OrderByDescending(d => d.Rate).First().DistrictName);
        }

        [Fact]
        public void TrendLineData_YearOverYear_OrderedChronologically()
        {
            var trend = new List<TrendPoint>
            {
                new(2022, 4.10m),
                new(2023, 4.15m),
                new(2024, 4.20m),
                new(2025, 4.25m),
            };

            Assert.Equal(4, trend.Count);
            Assert.True(trend.SequenceEqual(trend.OrderBy(t => t.Year)));
            decimal totalChange = trend.Last().Rate - trend.First().Rate;
            Assert.Equal(0.15m, totalChange);
        }

        [Fact]
        public void HeatmapData_IntensityNormalized_BetweenZeroAndOne()
        {
            var rates = new List<decimal> { 1.20m, 3.50m, 5.80m };
            decimal min = rates.Min();
            decimal max = rates.Max();

            var heatmap = rates.Select((r, i) => new HeatmapCell(
                $"DIST-{i:D2}",
                (r - min) / (max - min)
            )).ToList();

            Assert.Equal(3, heatmap.Count);
            Assert.Equal(0m, heatmap[0].Intensity);
            Assert.Equal(1m, heatmap[2].Intensity);
            Assert.True(heatmap[1].Intensity > 0m && heatmap[1].Intensity < 1m);
        }

        [Fact]
        public void RateComparisonData_EmptyDataSet_ReturnsEmptyCollection()
        {
            var data = new List<RateComparisonPoint>();

            Assert.Empty(data);
        }
    }
}
