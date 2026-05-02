using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// County-scoped runtime row contract for June 10 data lineage proofs.
/// Read-only projection over existing operational tables; no Benton fallback.
/// </summary>
[ApiController]
[Route("api/counties/{countyToken}")]
[Produces("application/json")]
public sealed class CountyRowsController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<CountyRowsController> _logger;

    public CountyRowsController(TerraFusionDbContext db, ILogger<CountyRowsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("parcels")]
    public async Task<IActionResult> GetParcels(
        string countyToken,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        CancellationToken ct = default)
    {
        var county = await ResolveCountyAsync(countyToken, ct);
        if (county is null)
            return NotFound(new { county = countyToken, error = "County not found." });

        var safeLimit = Math.Clamp(limit, 1, 500);
        var safeOffset = Math.Max(offset, 0);

        var query = _db.Properties.AsNoTracking().Where(p => p.CountyId == county.Id);
        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderBy(p => p.ParcelId)
            .Skip(safeOffset)
            .Take(safeLimit)
            .Select(p => new
            {
                p.ParcelId,
                p.ParcelNumber,
                p.Address,
                p.PropertyType,
                p.Neighborhood,
                p.SitusCity,
                p.YearBuilt,
                p.AssessedValue,
                p.LandValue,
                p.ImprovementValue,
                p.MarketValue,
                p.TaxYear,
            })
            .ToListAsync(ct);

        return Ok(new
        {
            county = county.Name,
            countyId = county.Id,
            rowType = "parcels",
            total,
            count = rows.Count,
            rows,
        });
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSales(
        string countyToken,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        CancellationToken ct = default)
    {
        var county = await ResolveCountyAsync(countyToken, ct);
        if (county is null)
            return NotFound(new { county = countyToken, error = "County not found." });

        var safeLimit = Math.Clamp(limit, 1, 500);
        var safeOffset = Math.Max(offset, 0);

        var query = _db.ComparableSales.AsNoTracking().Where(s => s.CountyId == county.Id);
        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderByDescending(s => s.SaleDate)
            .ThenBy(s => s.ParcelId)
            .Skip(safeOffset)
            .Take(safeLimit)
            .Select(s => new
            {
                s.Id,
                s.ParcelId,
                s.SaleDate,
                s.SalePrice,
                s.AdjustedSalePrice,
                s.PropertyType,
                s.Neighborhood,
                s.GrossLivingArea,
                s.LotSizeSqft,
                s.YearBuilt,
                s.Condition,
                s.QualityGrade,
                s.SalesYear,
                s.SaleQualification,
                s.QualificationRecommendation,
                s.QualificationDecision,
                s.IsVerified,
            })
            .ToListAsync(ct);

        return Ok(new
        {
            county = county.Name,
            countyId = county.Id,
            rowType = "sales",
            total,
            count = rows.Count,
            rows,
        });
    }

    private async Task<CountyProjection?> ResolveCountyAsync(string countyToken, CancellationToken ct)
    {
        var token = Normalize(countyToken);
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var counties = await _db.Counties.AsNoTracking()
            .Select(c => new CountyProjection(c.Id, c.Name, c.FipsCode))
            .ToListAsync(ct);

        var county = counties.FirstOrDefault(c =>
            Normalize(c.Id.ToString()) == token ||
            Normalize(c.Name) == token ||
            Normalize(StripCountySuffix(c.Name)) == token ||
            Normalize(c.FipsCode) == token);

        if (county is null)
            _logger.LogWarning("County row runtime proof requested unknown county token {CountyToken}", countyToken);

        return county;
    }

    private static string StripCountySuffix(string value) =>
        value.EndsWith(" County", StringComparison.OrdinalIgnoreCase)
            ? value[..^7].Trim()
            : value;

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : new string(value.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());

    private sealed record CountyProjection(Guid Id, string Name, string? FipsCode);
}
