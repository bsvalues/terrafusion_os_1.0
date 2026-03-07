using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Benton County PILT calculator — Payment In Lieu of Taxes.
/// Extracted from quarantine: terra-pilt-production/pilt-calculator.ts +
/// piltCalculationEngine.ts. Uses real Benton County levy rates, land classifications,
/// school district assessed values, and proportional distribution algorithm.
/// </summary>
public class PiltService : IPiltService
{
  private readonly ITerraFusionDbContext _db;
  private readonly ILogger<PiltService> _logger;

  public PiltService(ITerraFusionDbContext db, ILogger<PiltService> logger)
  {
    _db = db;
    _logger = logger;
  }

  // ── Benton County Standard Levy Rates (per $1,000 AV) ──
  // Source: quarantine BentonCountyPiltCalculator.STANDARD_LEVY_RATES
  private static readonly Dictionary<string, (string Type, decimal Rate)> BentonLevyDistricts = new()
  {
    ["current-expense"] = ("county", 0.900m),
    ["health-district"] = ("special", 0.025m),
    ["indigent-soldier"] = ("special", 0.01125m),
    ["road-district"] = ("county", 1.200m),
    ["port-of-benton"] = ("port", 0.340m),
    ["rural-library"] = ("library", 0.280m),
    ["kiona-benton-sd52"] = ("school", 2.100m),
    ["prosser-sd116"] = ("school", 4.200m),
    ["richland-sd400"] = ("school", 4.100m),
    ["prosser-hospital"] = ("hospital", 0.320m),
  };

  private static readonly Dictionary<string, string> DistrictDisplayNames = new()
  {
    ["current-expense"] = "Current Expense",
    ["health-district"] = "Health District",
    ["indigent-soldier"] = "Indigent Soldier",
    ["road-district"] = "Road District",
    ["port-of-benton"] = "Port of Benton",
    ["rural-library"] = "Rural Library",
    ["kiona-benton-sd52"] = "Kiona-Benton SD #52",
    ["prosser-sd116"] = "Prosser SD #116",
    ["richland-sd400"] = "Richland SD #400",
    ["prosser-hospital"] = "Prosser Hospital",
  };

  // ── Land Classification Values (Benton County assessor data) ──
  // Source: quarantine BentonCountyPiltCalculator.LAND_VALUES
  private static readonly List<PiltLandClassificationDto> BentonLandClassifications = new()
  {
    new() { Type = "dryland", Unit = "acre", AcresOrFeet = 34322.64, RatePerUnit = 224m, TotalValue = 34322.64m * 224m },
    new() { Type = "irrigable", Unit = "acre", AcresOrFeet = 92497.71, RatePerUnit = 2636m, TotalValue = 92497.71m * 2636m },
    new() { Type = "lesser_riverfront", Unit = "linear_foot", AcresOrFeet = 128978, RatePerUnit = 50m, TotalValue = 128978m * 50m },
    new() { Type = "prime_riverfront", Unit = "linear_foot", AcresOrFeet = 30672, RatePerUnit = 1965m, TotalValue = 30672m * 1965m },
    new() { Type = "rural_residential", Unit = "acre", AcresOrFeet = 590.5, RatePerUnit = 35870m, TotalValue = 590.5m * 35870m },
    new() { Type = "town_plats", Unit = "acre", AcresOrFeet = 644, RatePerUnit = 122470m, TotalValue = 644m * 122470m },
  };

  // Total federal acres in Benton County (Hanford Reservation + BLM + Fish & Wildlife)
  private const int BentonFederalAcres = 586_000;

  // ── School district land-area assessed values ──
  // Source: quarantine BentonCountyPiltCalculator.calculateKionaBentonAssessedValue etc.
  private static decimal KionaBentonAV => 8547m * 224m + 642m * 2636m;      // Dryland + irrigable
  private static decimal ProsserSDAV => 15352m * 224m + 5132m * 2636m;       // Dryland + irrigable
  private static decimal ProsserHospitalAV => 15455m * 224m + 2951m * 2636m; // Dryland + irrigable

  private static decimal TotalAssessedValue =>
      BentonLandClassifications.Sum(lc => lc.TotalValue);

  public async Task<PiltStatusDto> GetStatusAsync(Guid countyId)
  {
    _logger.LogInformation("PILT status requested for county {CountyId}", countyId);

    var totalPayments = CalculateTotalPiltDue(TotalAssessedValue);
    var districtCount = BentonLevyDistricts.Count;
    var avgRate = BentonLevyDistricts.Values.Average(d => d.Rate);

    await Task.CompletedTask;

    return new PiltStatusDto
    {
      Status = "active",
      FiscalYear = DateTime.UtcNow.Year,
      TotalPayments = Math.Round(totalPayments, 2),
      Districts = districtCount,
      FederalAcres = BentonFederalAcres,
      AverageRate = Math.Round(avgRate, 5),
    };
  }

  public async Task<List<PiltDistrictDto>> GetDistrictsAsync(Guid countyId)
  {
    _logger.LogInformation("PILT districts requested for county {CountyId}", countyId);
    await Task.CompletedTask;

    var totalAV = TotalAssessedValue;

    return BentonLevyDistricts.Select(kv =>
    {
      var av = GetDistrictAssessedValue(kv.Key, totalAV);
      return new PiltDistrictDto
      {
        Id = kv.Key,
        Name = DistrictDisplayNames.GetValueOrDefault(kv.Key, kv.Key),
        Type = kv.Value.Type,
        LevyRate = kv.Value.Rate,
        AssessedValue = Math.Round(av, 2),
        PiltDue = Math.Round(av * kv.Value.Rate / 1000m, 2),
      };
    })
    .OrderByDescending(d => d.PiltDue)
    .ToList();
  }

  public async Task<List<PiltReceiptDto>> GetReceiptsAsync(Guid countyId, int? fiscalYear)
  {
    _logger.LogInformation("PILT receipts requested for county {CountyId}, year {FiscalYear}", countyId, fiscalYear);

    // Receipts from TaxLevies marked as PILT
    var query = _db.TaxLevies
        .Where(tl => tl.CountyId == countyId)
        .AsNoTracking();

    if (fiscalYear.HasValue)
      query = query.Where(tl => tl.TaxYear == fiscalYear.Value);

    var levies = await query
        .OrderByDescending(tl => tl.TaxYear)
        .Take(50)
        .Select(tl => new PiltReceiptDto
        {
          Id = tl.Id.ToString(),
          FiscalYear = tl.TaxYear,
          Source = "Federal",
          Amount = tl.LevyAmount,
          Status = "processed",
          CreatedAt = tl.EffectiveDate,
        })
        .ToListAsync();

    // If no DB records exist, return a reference receipt from the calculator
    if (!levies.Any())
    {
      var year = fiscalYear ?? DateTime.UtcNow.Year;
      levies.Add(new PiltReceiptDto
      {
        Id = $"pilt-ref-{year}",
        FiscalYear = year,
        Source = "Federal (calculated reference)",
        Amount = Math.Round(CalculateTotalPiltDue(TotalAssessedValue), 2),
        Status = "reference",
        CreatedAt = DateTime.UtcNow,
      });
    }

    return levies;
  }

  public async Task<PiltReceiptDto> CreateReceiptAsync(PiltCreateReceiptRequest request, Guid countyId, string userId)
  {
    _logger.LogInformation("PILT receipt creation by {UserId} for county {CountyId}, year {Year}",
        userId, countyId, request.FiscalYear);

    var receipt = new PiltReceiptDto
    {
      Id = $"pilt-{Guid.NewGuid():N}",
      FiscalYear = request.FiscalYear,
      Source = request.Source,
      Amount = request.Amount,
      Status = "pending",
      CreatedAt = DateTime.UtcNow,
    };

    await Task.CompletedTask;
    return receipt;
  }

  public async Task<PiltCalculationResultDto> CalculateAsync(string receiptId, PiltCalculateRequest? request, Guid countyId)
  {
    _logger.LogInformation("PILT calculation for receipt {ReceiptId} in county {CountyId}", receiptId, countyId);

    var totalAV = TotalAssessedValue;
    var districts = BentonLevyDistricts.ToList();
    var totalPilt = CalculateTotalPiltDue(totalAV);

    // Assessed-value-weighted proportional distribution (from quarantine MathematicallyCorrectPiltEngine)
    var distributions = districts.Select(kv =>
    {
      var districtAV = GetDistrictAssessedValue(kv.Key, totalAV);
      var piltAmount = districtAV * kv.Value.Rate / 1000m;
      var percentage = totalPilt > 0 ? Math.Round(piltAmount / totalPilt * 100, 2) : 0;

      return new PiltDistributionDto
      {
        DistrictId = kv.Key,
        DistrictName = DistrictDisplayNames.GetValueOrDefault(kv.Key, kv.Key),
        Amount = Math.Round(piltAmount, 2),
        Percentage = percentage,
      };
    })
    .OrderByDescending(d => d.Amount)
    .ToList();

    // Banker's rounding correction: adjust largest district for rounding error
    var distributionSum = distributions.Sum(d => d.Amount);
    var roundingError = Math.Round(totalPilt, 2) - distributionSum;
    if (roundingError != 0 && distributions.Count > 0)
    {
      distributions[0].Amount += roundingError;
    }

    await Task.CompletedTask;

    return new PiltCalculationResultDto
    {
      CalculationId = $"calc-{Guid.NewGuid():N}",
      ReceiptId = receiptId,
      FiscalYear = DateTime.UtcNow.Year,
      TotalAmount = Math.Round(totalPilt, 2),
      Distributions = distributions,
      Status = "calculated",
    };
  }

  public async Task<PiltCalculationResultDto> ApproveAsync(string calculationId, Guid countyId, string userId)
  {
    _logger.LogInformation("PILT calculation {CalculationId} approved by {UserId}", calculationId, userId);

    // Re-calculate and mark as approved
    var result = await CalculateAsync(calculationId, null, countyId);
    result.CalculationId = calculationId;
    result.Status = "approved";
    return result;
  }

  public async Task<PiltReportDto> GetReportAsync(int year, Guid countyId)
  {
    _logger.LogInformation("PILT report for year {Year}, county {CountyId}", year, countyId);

    var totalAV = TotalAssessedValue;
    var totalPilt = CalculateTotalPiltDue(totalAV);

    var districts = await GetDistrictsAsync(countyId);

    await Task.CompletedTask;

    return new PiltReportDto
    {
      Year = year,
      TotalAssessedValue = Math.Round(totalAV, 2),
      TotalPiltDue = Math.Round(totalPilt, 2),
      Districts = districts,
      LandClassifications = BentonLandClassifications.ToList(),
      Certification = new PiltCertificationDto
      {
        AssessorName = "Bill Spencer",
        TreasurerName = "Ken Spencer",
        Date = DateTime.UtcNow.ToString("MMMM d, yyyy"),
        TotalAssessedValue = Math.Round(totalAV, 2),
      },
    };
  }

  // ── Private Helpers ───────────────────────────────────────────

  /// <summary>
  /// Get district-specific assessed value. School districts and Prosser Hospital
  /// have land-area-based assessed values; others use the total county AV.
  /// Source: quarantine BentonCountyPiltCalculator methods.
  /// </summary>
  private static decimal GetDistrictAssessedValue(string districtId, decimal totalAV)
  {
    return districtId switch
    {
      "kiona-benton-sd52" => KionaBentonAV,
      "prosser-sd116" => ProsserSDAV,
      "prosser-hospital" => ProsserHospitalAV,
      "richland-sd400" => totalAV - KionaBentonAV - ProsserSDAV - ProsserHospitalAV,
      _ => totalAV,
    };
  }

  /// <summary>
  /// Calculate total PILT due across all districts.
  /// Each district: assessed_value × levy_rate / 1000.
  /// </summary>
  private static decimal CalculateTotalPiltDue(decimal totalAV)
  {
    return BentonLevyDistricts.Sum(kv =>
    {
      var av = GetDistrictAssessedValue(kv.Key, totalAV);
      return av * kv.Value.Rate / 1000m;
    });
  }
}
