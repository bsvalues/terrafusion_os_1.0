using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraLevy — levy rate lookup and bill calculator for Benton County WA.
///
/// Ownership rule: this controller owns all levy arithmetic endpoints.
///   ForgeController — appraiser valuation decisions only.
///   SyncController  — sync/ETL triggers only.
///   LevyController  — levy rates, tax areas, and bill calculation.
///
/// All arithmetic uses decimal throughout — no float promotion.
/// Data source: pacs_levy_rates and pacs_levy_tax_area_assocs (seeded from PACS dbo.levy
/// and dbo.tax_area_fund_assoc via PacsDataSeeder.SeedLevyRatesAsync / SeedLevyTaxAreaAssocsAsync).
/// </summary>
[ApiController]
[Route("api/levy")]
public class LevyController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<LevyController> _logger;

    public LevyController(TerraFusionDbContext db, ILogger<LevyController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    // ── Levy rates ─────────────────────────────────────────────────────────

    /// <summary>
    /// Returns all certified levy codes and rates for a given tax year.
    ///
    /// Each row is one levy code (taxing authority + fund) with its rate per $1,000 AV.
    /// For 2026, Benton County has 48 levy codes across cities, fire districts,
    /// school districts, state school, road, county, library, hospital, and port.
    /// </summary>
    [HttpGet("rates")]
    public async Task<IActionResult> GetRates(
        [FromQuery] int year = 2026,
        CancellationToken ct = default)
    {
        var rates = await _db.PacsLevyRates
            .Where(r => r.Year == year)
            .OrderBy(r => r.LevyCd)
            .Select(r => new
            {
                r.LevyCd,
                r.LevyTypeCd,
                r.LevyDescription,
                r.LevyRate,
                r.TaxDistrictId,
                r.IncludeInCertification
            })
            .ToListAsync(ct);

        _logger.LogInformation("[Levy] GetRates: year={Year} count={Count}", year, rates.Count);

        return Ok(new
        {
            year,
            count = rates.Count,
            rates
        });
    }

    // ── Tax areas ──────────────────────────────────────────────────────────

    /// <summary>
    /// Returns distinct tax area numbers with their associated levy code count for a year.
    ///
    /// Each tax area is a combination of taxing authorities that applies to a group of parcels.
    /// Benton County has several hundred active tax areas.
    ///
    /// Optional <paramref name="search"/> filters by tax area number substring.
    /// </summary>
    [HttpGet("tax-areas")]
    public async Task<IActionResult> GetTaxAreas(
        [FromQuery] int    year   = 2026,
        [FromQuery] string search = "",
        CancellationToken ct = default)
    {
        var query = _db.PacsLevyTaxAreaAssocs
            .Where(a => a.Year == year && a.TaxAreaNumber != null);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(a => a.TaxAreaNumber!.Contains(search));

        var taxAreas = await query
            .GroupBy(a => a.TaxAreaNumber)
            .Select(g => new
            {
                taxAreaNumber  = g.Key,
                levyCodeCount  = g.Count()
            })
            .OrderBy(x => x.taxAreaNumber)
            .ToListAsync(ct);

        _logger.LogInformation(
            "[Levy] GetTaxAreas: year={Year} search={Search} count={Count}",
            year, search, taxAreas.Count);

        return Ok(new
        {
            year,
            count = taxAreas.Count,
            taxAreas
        });
    }

    // ── Bill calculator ────────────────────────────────────────────────────

    /// <summary>
    /// Calculates the itemized levy bill for a parcel in a given tax area.
    ///
    /// Formula (WA State standard):
    ///   amount = (assessedValue / 1000) * levyRate
    ///   totalLevy = SUM(amount) for all levy codes in the tax area for the year
    ///
    /// All arithmetic is performed in decimal — no float promotion.
    ///
    /// Returns 404 if the tax area number has no levy assignments for the requested year.
    /// Returns 200 with all amounts = 0 if assessedValue = 0 (not an error).
    /// </summary>
    [HttpGet("calculate")]
    public async Task<IActionResult> Calculate(
        [FromQuery] string  taxAreaNumber,
        [FromQuery] decimal assessedValue,
        [FromQuery] int     year = 2026,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(taxAreaNumber))
            return BadRequest(new { error = "taxAreaNumber is required" });

        // Find all levy codes that apply to this tax area for the year.
        var assocs = await _db.PacsLevyTaxAreaAssocs
            .Where(a => a.Year == year
                     && a.TaxAreaNumber == taxAreaNumber.Trim())
            .ToListAsync(ct);

        if (assocs.Count == 0)
        {
            _logger.LogWarning(
                "[Levy] Calculate: TaxArea {TaxArea} not found for year {Year}",
                taxAreaNumber, year);
            return NotFound(new
            {
                error = $"TaxArea {taxAreaNumber} not found for year {year}"
            });
        }

        // Load the matching levy rates keyed by (TaxDistrictId, LevyCd).
        var districtIds = assocs.Select(a => a.TaxDistrictId).Distinct().ToList();
        var levyCds     = assocs.Select(a => a.LevyCd).Distinct().ToList();

        var rateMap = await _db.PacsLevyRates
            .Where(r => r.Year == year
                     && districtIds.Contains(r.TaxDistrictId)
                     && levyCds.Contains(r.LevyCd))
            .ToDictionaryAsync(r => (r.TaxDistrictId, r.LevyCd), ct);

        // Compute breakdown — one row per levy code found in the assoc table.
        var breakdown = new List<object>();
        decimal totalLevy = 0m;

        foreach (var assoc in assocs.OrderBy(a => a.LevyCd))
        {
            decimal rate   = 0m;
            string? desc   = null;
            string? typecd = null;

            if (rateMap.TryGetValue((assoc.TaxDistrictId, assoc.LevyCd), out var levyRate))
            {
                rate   = levyRate.LevyRate;
                desc   = levyRate.LevyDescription;
                typecd = levyRate.LevyTypeCd;
            }

            // WA State levy arithmetic — always decimal, never double.
            decimal amount = assessedValue == 0m ? 0m
                : Math.Round(assessedValue / 1_000m * rate, 2, MidpointRounding.AwayFromZero);

            totalLevy += amount;

            breakdown.Add(new
            {
                levyCd          = assoc.LevyCd,
                levyTypeCd      = typecd,
                levyDescription = desc,
                levyRate        = rate,
                amount
            });
        }

        _logger.LogInformation(
            "[Levy] Calculate: taxArea={Area} year={Year} av={AV} total={Total} lines={N}",
            taxAreaNumber, year, assessedValue, totalLevy, breakdown.Count);

        return Ok(new
        {
            taxAreaNumber  = taxAreaNumber.Trim(),
            assessedValue,
            year,
            totalLevy      = Math.Round(totalLevy, 2, MidpointRounding.AwayFromZero),
            breakdown
        });
    }
}
