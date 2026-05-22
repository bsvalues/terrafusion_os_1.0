using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;

namespace TerraFusion.CurrentUse.Services;

public class InterestService : IInterestService
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<InterestService> _logger;

    public InterestService(CurrentUseDbContext db, ILogger<InterestService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<InterestRateDto>> GetRatesAsync(CancellationToken ct = default)
    {
        return await _db.InterestRates
            .OrderBy(r => r.Year)
            .Select(r => new InterestRateDto(r.Year, r.Rate, r.Source, r.EffectiveDate.ToString("yyyy-MM-dd")))
            .ToListAsync(ct);
    }

    public async Task<InterestCalcResult> CalculateAsync(decimal principal, int startYear, int endYear, CancellationToken ct = default)
    {
        _logger.LogInformation("Calculating interest: principal={Principal}, years {Start}-{End}", principal, startYear, endYear);

        var rates = await _db.InterestRates
            .Where(r => r.Year >= startYear && r.Year <= endYear)
            .OrderBy(r => r.Year)
            .ToListAsync(ct);

        var breakdown = new List<InterestYearBreakdown>();
        decimal cumulative = 0;
        decimal totalInterest = 0;

        for (int year = startYear; year <= endYear; year++)
        {
            var rate = rates.FirstOrDefault(r => r.Year == year)?.Rate ?? 0.06m;
            var yearInterest = principal * rate;
            totalInterest += yearInterest;
            cumulative += yearInterest;

            breakdown.Add(new InterestYearBreakdown(year, rate, yearInterest, cumulative));
        }

        return new InterestCalcResult(principal, totalInterest, principal + totalInterest, startYear, endYear, breakdown);
    }
}
