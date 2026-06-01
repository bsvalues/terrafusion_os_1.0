using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-004: Levy calculator compatibility surface.
/// Provides formula-based rate calculation, bill impact analysis, and
/// historical rate comparisons backed by the native TerraLevy tables.
/// </summary>
[ApiController]
[Route("api/levy/calculator")]
[Authorize]
public sealed class LevyCalculatorController : ControllerBase
{
    private readonly LevyDbContext _db;
    private readonly ILogger<LevyCalculatorController> _logger;

    public LevyCalculatorController(
        LevyDbContext db,
        ILogger<LevyCalculatorController> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public sealed record CalculateRateRequest(
        [Required] string DistrictId,
        string? DistrictName,
        [Required] string DistrictType,
        [Range(0.01, double.MaxValue)] double AssessedValue,
        [Range(0.01, double.MaxValue)] double LevyAmount,
        string? CountyId);

    public sealed record BillImpactRequest(
        string? DistrictId,
        string? DistrictType,
        [Range(0.01, double.MaxValue)] double AssessedValue,
        double? CurrentRate,
        double? ProposedRate,
        double? CurrentLevyAmount,
        double? ProposedLevyAmount);

    public sealed record RateComparisonItem(
        int TaxYear,
        decimal Rate,
        decimal LevyAmount,
        decimal AssessedValue,
        string DistrictName,
        string? MeasureName,
        DateTime EffectiveDate);

    private static decimal ResolveStatutoryLimit(string? districtType)
    {
        var normalized = districtType?.Trim().ToLowerInvariant() ?? string.Empty;

        return normalized switch
        {
            "county" or "county-regular" => 3.60m,
            "county-roads" or "road" or "road district" => 2.25m,
            "city" or "town" => 3.375m,
            "school" or "school-district" or "school district" => 5.90m,
            "fire" or "fire-district" or "fire district" => 1.50m,
            "library" or "library-district" or "library district" => 0.50m,
            "hospital" or "hospital-district" or "hospital district" => 0.75m,
            "port" or "port-district" => 0.45m,
            "cemetery" or "cemetery-district" => 0.1125m,
            _ => 10.00m,
        };
    }

    private IQueryable<TerraFusion.Levy.Models.LevyRate> BuildDistrictRateQuery(string districtId)
    {
        var query = _db.LevyRates
            .AsNoTracking()
            .Include(rate => rate.District)
            .Include(rate => rate.LevyMeasure)
            .AsQueryable();

        if (Guid.TryParse(districtId, out var districtGuid))
        {
            query = query.Where(rate =>
                rate.DistrictId == districtGuid ||
                (rate.District != null && rate.District.DistrictCode == districtId));
        }
        else
        {
            query = query.Where(rate => rate.District != null && rate.District.DistrictCode == districtId);
        }

        return query;
    }

    /// <summary>
    /// Calculate the levy rate for a given district, assessed value, and levy amount.
    /// </summary>
    [HttpPost("calculate-rate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CalculateRate(
        [FromBody] CalculateRateRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var calculatedRate = Math.Round((decimal)request.LevyAmount / (decimal)request.AssessedValue * 1000m, 6);
        var statutoryLimit = ResolveStatutoryLimit(request.DistrictType);
        var latestFiledRate = await BuildDistrictRateQuery(request.DistrictId)
            .OrderByDescending(rate => rate.EffectiveDate)
            .Select(rate => (decimal?)rate.Rate)
            .FirstOrDefaultAsync(cancellationToken);

        _logger.LogInformation(
            "LEV-004: Calculator rate requested for district={DistrictId}, assessedValue={AssessedValue}, levyAmount={LevyAmount}",
            request.DistrictId,
            request.AssessedValue,
            request.LevyAmount);

        return Ok(new
        {
            districtId = request.DistrictId,
            districtName = string.IsNullOrWhiteSpace(request.DistrictName) ? request.DistrictId : request.DistrictName,
            districtType = request.DistrictType,
            assessedValue = request.AssessedValue,
            levyAmount = request.LevyAmount,
            calculatedRate,
            statutoryLimit,
            isCompliant = calculatedRate <= statutoryLimit,
            latestFiledRate,
            varianceFromLatestFiledRate = latestFiledRate.HasValue ? calculatedRate - latestFiledRate.Value : (decimal?)null,
            source = "formula: levyAmount / assessedValue * 1000",
            generatedAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Calculate the tax bill impact of a proposed levy change on a property.
    /// </summary>
    [HttpPost("bill-impact")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BillImpact(
        [FromBody] BillImpactRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        double? currentRate = request.CurrentRate;
        if (!currentRate.HasValue && request.CurrentLevyAmount.HasValue)
        {
            currentRate = request.CurrentLevyAmount.Value / request.AssessedValue * 1000d;
        }

        double? proposedRate = request.ProposedRate;
        if (!proposedRate.HasValue && request.ProposedLevyAmount.HasValue)
        {
            proposedRate = request.ProposedLevyAmount.Value / request.AssessedValue * 1000d;
        }

        if (!currentRate.HasValue && !string.IsNullOrWhiteSpace(request.DistrictId))
        {
            currentRate = (double?)await BuildDistrictRateQuery(request.DistrictId)
                .OrderByDescending(rate => rate.EffectiveDate)
                .Select(rate => (decimal?)rate.Rate)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (!currentRate.HasValue || !proposedRate.HasValue)
        {
            return BadRequest(new
            {
                error = "missing_rate_inputs",
                message = "Provide currentRate/currentLevyAmount and proposedRate/proposedLevyAmount, or provide districtId so the current filed rate can be resolved.",
            });
        }

        var currentTax = request.AssessedValue / 1000d * currentRate.Value;
        var proposedTax = request.AssessedValue / 1000d * proposedRate.Value;
        var delta = proposedTax - currentTax;
        var statutoryLimit = ResolveStatutoryLimit(request.DistrictType);

        _logger.LogInformation(
            "LEV-004: Calculator bill impact requested for district={DistrictId}, assessedValue={AssessedValue}",
            request.DistrictId ?? "<none>",
            request.AssessedValue);

        return Ok(new
        {
            districtId = request.DistrictId,
            districtType = request.DistrictType,
            assessedValue = request.AssessedValue,
            currentRate = Math.Round(currentRate.Value, 6),
            proposedRate = Math.Round(proposedRate.Value, 6),
            currentAnnualTax = Math.Round(currentTax, 2),
            proposedAnnualTax = Math.Round(proposedTax, 2),
            delta = Math.Round(delta, 2),
            deltaPct = currentTax != 0 ? Math.Round(delta / currentTax * 100d, 2) : 0d,
            statutoryLimit,
            proposedRateCompliant = (decimal)proposedRate.Value <= statutoryLimit,
            generatedAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Compare levy rates across years for a specific tax district.
    /// </summary>
    [HttpGet("rate-comparison/{districtId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RateComparison(
        string districtId,
        CancellationToken cancellationToken)
    {
        var rows = await BuildDistrictRateQuery(districtId)
            .OrderByDescending(rate => rate.EffectiveDate)
            .ToListAsync(cancellationToken);

        var comparison = rows
            .GroupBy(rate => rate.EffectiveDate.Year)
            .Select(group =>
            {
                var latest = group.OrderByDescending(rate => rate.EffectiveDate).First();
                return new RateComparisonItem(
                    TaxYear: latest.EffectiveDate.Year,
                    Rate: latest.Rate,
                    LevyAmount: latest.LevyAmount,
                    AssessedValue: latest.AssessedValue,
                    DistrictName: latest.District?.Name ?? districtId,
                    MeasureName: latest.LevyMeasure?.Name,
                    EffectiveDate: latest.EffectiveDate);
            })
            .OrderByDescending(item => item.TaxYear)
            .ToList();

        _logger.LogInformation(
            "LEV-004: Calculator rate comparison requested for district={DistrictId}, years={YearCount}",
            districtId,
            comparison.Count);

        return Ok(new
        {
            districtId,
            count = comparison.Count,
            items = comparison,
            source = "LevyRates",
        });
    }
}
