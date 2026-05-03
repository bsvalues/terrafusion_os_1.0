using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
    private readonly IConfiguration? _configuration;

    public CountyRowsController(
        TerraFusionDbContext db,
        ILogger<CountyRowsController> logger,
        IConfiguration? configuration = null)
    {
        _db = db;
        _logger = logger;
        _configuration = configuration;
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

    [HttpGet("runtime-lineage")]
    public async Task<IActionResult> GetRuntimeLineage(
        string countyToken,
        CancellationToken ct = default)
    {
        var county = await ResolveCountyAsync(countyToken, ct);
        if (county is null)
            return NotFound(new { county = countyToken, error = "County not found." });

        var propertyCount = await _db.Properties
            .AsNoTracking()
            .CountAsync(p => p.CountyId == county.Id, ct);
        var comparableSaleCount = await _db.ComparableSales
            .AsNoTracking()
            .CountAsync(s => s.CountyId == county.Id, ct);
        var pacsParcelCount = await _db.PacsParcel
            .AsNoTracking()
            .CountAsync(p => p.CountyId == county.Id, ct);
        var pacsParcelIds = _db.PacsParcel
            .AsNoTracking()
            .Where(p => p.CountyId == county.Id)
            .Select(p => p.Id);
        var pacsSaleCount = await _db.PacsSales
            .AsNoTracking()
            .CountAsync(s => pacsParcelIds.Contains(s.ParcelId), ct);
        var canonicalSaleQualificationCount = await _db.CanonicalSaleQualifications
            .AsNoTracking()
            .CountAsync(q => q.CountyId == county.Id, ct);

        var devSeedersSkipped = DevSeedersSkipped();
        var classification = ClassifyRuntimeLineage(
            propertyCount,
            comparableSaleCount,
            pacsParcelCount,
            pacsSaleCount,
            canonicalSaleQualificationCount);

        return Ok(new
        {
            county = county.Name,
            countyId = county.Id,
            runtimeLineageClassification = classification,
            databaseProvider = _db.Database.ProviderName,
            developmentSeedersSkipped = devSeedersSkipped,
            runtimeMockDataEnabled = ConfigBool("Development:EnableMockData"),
            eliteOperationsMockDataEnabled = ConfigBool("EliteOperations:MockDataEnabled"),
            canonicalRuntime = new
            {
                properties = propertyCount,
                comparableSales = comparableSaleCount,
                canonicalSaleQualifications = canonicalSaleQualificationCount,
            },
            sourceMirror = new
            {
                pacsParcels = pacsParcelCount,
                pacsSales = pacsSaleCount,
            },
            posture = new
            {
                noSilentFallback = true,
                exposesCountsOnly = true,
                containsOwnerOrPartyPii = false,
            },
        });
    }

    private bool ConfigBool(string key) =>
        bool.TryParse(_configuration?[key], out var value) && value;

    private static bool DevSeedersSkipped()
    {
        var envValue = Environment.GetEnvironmentVariable("TF_SKIP_DEV_SEEDERS")?.Trim();
        var argSkipped = Environment.GetCommandLineArgs()
            .Any(arg => string.Equals(arg, "--skip-dev-seeders", StringComparison.OrdinalIgnoreCase));

        return argSkipped ||
               string.Equals(envValue, "true", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(envValue, "1", StringComparison.OrdinalIgnoreCase);
    }

    private static string ClassifyRuntimeLineage(
        int propertyCount,
        int comparableSaleCount,
        int pacsParcelCount,
        int pacsSaleCount,
        int canonicalSaleQualificationCount)
    {
        if (propertyCount <= 0 && comparableSaleCount <= 0)
            return "no_runtime_rows";

        if (pacsParcelCount > 0 &&
            propertyCount > 0 &&
            pacsSaleCount > 0 &&
            comparableSaleCount > 0 &&
            canonicalSaleQualificationCount > 0)
            return "pacs_mirror_canonicalized_runtime";

        if (pacsParcelCount > 0 && propertyCount > 0)
            return "pacs_mirror_projected_runtime_partial";

        return "canonical_runtime_rows_without_source_mirror_proof";
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
