using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;

namespace TerraFusion.CurrentUse.Services;

/// <summary>
/// Calculates rollback taxes per RCW 84.33.140 / 84.34.108.
/// Rollback = sum of (MarketValue - CurrentUseValue) for each year in the rollback window,
/// plus interest at WAC 458-30-590 inflation rates, plus 20% penalty (unless exception applies).
/// Interest rates sourced from: https://app.leg.wa.gov/wac/default.aspx?cite=458-30-590
/// </summary>
public class RollbackCalculationService : IRollbackCalculationService
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<RollbackCalculationService> _logger;

    // Penalty exceptions per RCW
    private static readonly Dictionary<string, string> PenaltyExceptions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["DEATH"] = "Owner death — RCW 84.33.140(6)(a)",
        ["GOVT_ACQUISITION"] = "Government acquisition — RCW 84.33.140(6)(b)",
        ["TRADE_LAND_CONSERVATION"] = "Trade for conservation — RCW 84.34.108(6)(a)",
        ["FORCED_SALE"] = "Forced sale (condemnation) — RCW 84.34.108(6)(b)",
        ["TRANSFER_TO_GOVT"] = "Transfer to government entity — RCW 84.34.108(6)(c)",
    };

    public RollbackCalculationService(CurrentUseDbContext db, ILogger<RollbackCalculationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<RollbackResult> CalculateAsync(RollbackCalculationRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Calculating rollback for parcel {ParcelId}, code {Code}, years {Start}-{End}",
            request.ParcelId, request.ClassificationCode, request.EnrollmentYear, request.RemovalYear);

        // Fetch interest rates from DB
        var rates = await _db.InterestRates
            .Where(r => r.Year >= request.EnrollmentYear && r.Year <= request.RemovalYear)
            .ToDictionaryAsync(r => r.Year, r => r.Rate, ct);

        var yearBreakdowns = new List<YearBreakdown>();
        decimal totalRollbackTax = 0;
        decimal totalInterest = 0;

        // RCW specifies rollback for up to 7 years (DFL) or 10 years (CUFA/CUOS/CUTL)
        int maxYears = request.ClassificationCode.Equals("DFL", StringComparison.OrdinalIgnoreCase) ? 7 : 10;
        int startYear = Math.Max(request.EnrollmentYear, request.RemovalYear - maxYears + 1);

        for (int year = startYear; year <= request.RemovalYear; year++)
        {
            var marketValue = request.MarketValues.TryGetValue(year.ToString(), out var mv) ? mv : 0;
            var cuValue = request.CurrentUseValues.TryGetValue(year.ToString(), out var cuv) ? cuv : 0;
            var difference = Math.Max(0, marketValue - cuValue);

            // Interest compounds from the year of the tax to the removal year
            var rate = rates.TryGetValue(year, out var r) ? r : 0.02440m; // Default to latest WAC 458-30-590 rate (2025: 2.44%)
            int yearsOfInterest = request.RemovalYear - year;
            decimal interestAmount = 0;

            // Simple interest per year (WA DOR method)
            for (int i = 0; i < yearsOfInterest; i++)
            {
                int interestYear = year + i + 1;
                var yearRate = rates.TryGetValue(interestYear, out var yr) ? yr : rate;
                interestAmount += difference * yearRate;
            }

            var subtotal = difference + interestAmount;
            totalRollbackTax += difference;
            totalInterest += interestAmount;

            yearBreakdowns.Add(new YearBreakdown(
                year, marketValue, cuValue, difference, rate, interestAmount, subtotal
            ));
        }

        // 20% penalty unless exception applies
        bool penaltyExceptionApplied = false;
        string? exceptionCode = null;
        decimal totalPenalty = totalRollbackTax * 0.20m;

        if (!string.IsNullOrWhiteSpace(request.PenaltyExceptionCode))
        {
            var code = request.PenaltyExceptionCode.Replace("_", "").Replace("-", "");
            if (PenaltyExceptions.Keys.Any(k => k.Replace("_", "").Equals(code, StringComparison.OrdinalIgnoreCase)))
            {
                penaltyExceptionApplied = true;
                exceptionCode = request.PenaltyExceptionCode;
                totalPenalty = 0;
                _logger.LogInformation("Penalty exception applied: {Code}", request.PenaltyExceptionCode);
            }
        }

        var grandTotal = totalRollbackTax + totalInterest + totalPenalty;

        return new RollbackResult(
            totalRollbackTax, totalInterest, totalPenalty, grandTotal,
            yearBreakdowns, totalPenalty > 0, penaltyExceptionApplied, exceptionCode
        );
    }
}
