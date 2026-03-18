// LEV-013 — Historical Rate Service
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Stores and retrieves historical levy rates for WA tax districts.
    /// Provides year-over-year change calculations and trend data
    /// for analysis and forecasting.
    /// </summary>
    public class HistoricalRateService
    {
        /// <summary>
        /// Retrieve historical rates for a district across a year range.
        /// </summary>
        /// <param name="districtId">Tax district identifier.</param>
        /// <param name="startYear">Start of range (inclusive).</param>
        /// <param name="endYear">End of range (inclusive).</param>
        /// <returns>Ordered list of historical rate entries.</returns>
        public Task<List<HistoricalRateEntry>> GetHistoricalRatesAsync(
            int districtId, int startYear, int endYear)
        {
            // Stub — production impl queries LevyRate table via EF Core
            var entries = new List<HistoricalRateEntry>();
            for (int year = startYear; year <= endYear; year++)
            {
                entries.Add(new HistoricalRateEntry
                {
                    DistrictId = districtId,
                    TaxYear = year,
                    RatePerThousand = 0m,
                    LevyAmount = 0m,
                    AssessedValue = 0m
                });
            }
            return Task.FromResult(entries);
        }

        /// <summary>
        /// Calculate year-over-year rate changes for a district.
        /// </summary>
        public Task<List<YearOverYearChange>> GetYearOverYearChangesAsync(
            int districtId, int startYear, int endYear)
        {
            // Stub
            var changes = new List<YearOverYearChange>();
            for (int year = startYear + 1; year <= endYear; year++)
            {
                changes.Add(new YearOverYearChange
                {
                    DistrictId = districtId,
                    TaxYear = year,
                    PriorRate = 0m,
                    CurrentRate = 0m,
                    AbsoluteChange = 0m,
                    PercentChange = 0m
                });
            }
            return Task.FromResult(changes);
        }

        /// <summary>
        /// Get trend data suitable for charting (rates over time).
        /// </summary>
        public Task<TrendData> GetTrendDataAsync(int districtId, int years = 10)
        {
            var endYear = DateTime.Now.Year;
            var startYear = endYear - years + 1;

            var trend = new TrendData
            {
                DistrictId = districtId,
                StartYear = startYear,
                EndYear = endYear,
                DataPoints = Enumerable.Range(startYear, years)
                    .Select(y => new TrendDataPoint { Year = y, Rate = 0m, Levy = 0m })
                    .ToList(),
                AverageRate = 0m,
                MinRate = 0m,
                MaxRate = 0m
            };
            return Task.FromResult(trend);
        }

        /// <summary>
        /// Record a historical rate entry (used during import or year-end certification).
        /// </summary>
        public Task RecordRateAsync(HistoricalRateEntry entry)
        {
            // Stub — production impl persists via EF Core
            return Task.CompletedTask;
        }
    }

    /// <summary>A single historical rate record for a district-year.</summary>
    public class HistoricalRateEntry
    {
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        public decimal RatePerThousand { get; set; }
        public decimal LevyAmount { get; set; }
        public decimal AssessedValue { get; set; }
    }

    /// <summary>Year-over-year rate change for a district.</summary>
    public class YearOverYearChange
    {
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        public decimal PriorRate { get; set; }
        public decimal CurrentRate { get; set; }
        public decimal AbsoluteChange { get; set; }
        public decimal PercentChange { get; set; }
    }

    /// <summary>Time-series trend data for charting.</summary>
    public class TrendData
    {
        public int DistrictId { get; set; }
        public int StartYear { get; set; }
        public int EndYear { get; set; }
        public List<TrendDataPoint> DataPoints { get; set; } = new();
        public decimal AverageRate { get; set; }
        public decimal MinRate { get; set; }
        public decimal MaxRate { get; set; }
    }

    /// <summary>Single data point in a trend series.</summary>
    public class TrendDataPoint
    {
        public int Year { get; set; }
        public decimal Rate { get; set; }
        public decimal Levy { get; set; }
    }
}
