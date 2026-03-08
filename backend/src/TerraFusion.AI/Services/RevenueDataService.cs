using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;
using TerraFusion.Data;

namespace TerraFusion.AI.Services;

/// <summary>
/// Revenue data service backed by real property assessment and tax data
/// from TerraFusionDbContext. Queries Properties and PropertyAssessments
/// to derive assessed values grouped by month for revenue analysis.
/// </summary>
public class RevenueDataService : IRevenueDataService
{
    private readonly TerraFusionDbContext _dbContext;
    private readonly ILogger<RevenueDataService> _logger;

    public RevenueDataService(TerraFusionDbContext dbContext, ILogger<RevenueDataService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<object> GetRevenueDataAsync()
    {
        _logger.LogInformation("Querying aggregate revenue data from property assessments");

        var activeAssessments = await _dbContext.PropertyAssessments
            .Where(pa => pa.IsActive)
            .ToListAsync();

        var totalAssessedValue = activeAssessments.Sum(a => a.AssessedValue);
        var totalMarketValue = activeAssessments.Sum(a => a.MarketValue);
        var assessmentCount = activeAssessments.Count;

        // Compute year-over-year growth from assessment history
        var currentYear = DateTime.UtcNow.Year;
        var currentYearTotal = activeAssessments
            .Where(a => a.AssessmentDate.Year == currentYear)
            .Sum(a => a.AssessedValue);
        var previousYearTotal = activeAssessments
            .Where(a => a.AssessmentDate.Year == currentYear - 1)
            .Sum(a => a.AssessedValue);

        var growth = previousYearTotal > 0
            ? (double)((currentYearTotal - previousYearTotal) / previousYearTotal)
            : 0.0;

        return new
        {
            Revenue = (double)totalAssessedValue,
            Growth = growth,
            TotalMarketValue = (double)totalMarketValue,
            AssessmentCount = assessmentCount
        };
    }

    public async Task<List<RevenueData>> GetHistoricalRevenueDataAsync(string jurisdiction, int months)
    {
        _logger.LogInformation("Querying historical revenue data for {Jurisdiction}, last {Months} months",
            jurisdiction, months);

        var cutoffDate = DateTime.UtcNow.AddMonths(-months);

        // Query real property assessments grouped by month
        var assessments = await _dbContext.PropertyAssessments
            .Where(pa => pa.IsActive && pa.AssessmentDate >= cutoffDate)
            .ToListAsync();

        if (!assessments.Any())
        {
            _logger.LogWarning("No assessment data found for {Jurisdiction} in last {Months} months; returning computed estimates",
                jurisdiction, months);

            // Fall back to property-count-based estimates if no assessment date data
            var totalProperties = await _dbContext.Properties.CountAsync();
            var data = new List<RevenueData>();
            for (int i = 0; i < months; i++)
            {
                var monthDate = DateTime.UtcNow.AddMonths(-i);
                data.Add(new RevenueData
                {
                    Jurisdiction = jurisdiction,
                    Date = new DateTime(monthDate.Year, monthDate.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                    Amount = totalProperties * 3500m / 12, // Estimated annual per-parcel revenue / 12
                    Category = "Property Tax",
                    Source = "Estimated"
                });
            }
            return data;
        }

        // Group assessments by year-month and compute monthly revenue
        var monthlyData = assessments
            .GroupBy(a => new { a.AssessmentDate.Year, a.AssessmentDate.Month })
            .OrderByDescending(g => g.Key.Year)
            .ThenByDescending(g => g.Key.Month)
            .Select(g => new RevenueData
            {
                Jurisdiction = jurisdiction,
                Date = new DateTime(g.Key.Year, g.Key.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                Amount = g.Sum(a => a.AssessedValue),
                Category = "Property Tax",
                Source = "Assessment"
            })
            .ToList();

        // Ensure we have data for the requested number of months (fill gaps)
        var result = new List<RevenueData>();
        for (int i = 0; i < months; i++)
        {
            var targetDate = DateTime.UtcNow.AddMonths(-i);
            var targetYear = targetDate.Year;
            var targetMonth = targetDate.Month;

            var existing = monthlyData.FirstOrDefault(d => d.Date.Year == targetYear && d.Date.Month == targetMonth);
            if (existing != null)
            {
                result.Add(existing);
            }
            else
            {
                // Interpolate from nearest available month
                var nearest = monthlyData.OrderBy(d => Math.Abs((d.Date - targetDate).TotalDays)).FirstOrDefault();
                result.Add(new RevenueData
                {
                    Jurisdiction = jurisdiction,
                    Date = new DateTime(targetYear, targetMonth, 1, 0, 0, 0, DateTimeKind.Utc),
                    Amount = nearest?.Amount ?? 0m,
                    Category = "Property Tax",
                    Source = "Interpolated"
                });
            }
        }

        _logger.LogInformation("Retrieved {Count} monthly revenue records for {Jurisdiction}", result.Count, jurisdiction);
        return result;
    }
}
