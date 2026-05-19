using System.Text.Json;
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

        var activeParcels = _db.TfParcels
            .AsNoTracking()
            .Where(p =>
                p.CountyId == county.Id &&
                p.ParcelStatus == "ACTIVE" &&
                p.ParcelNumber != null &&
                p.ParcelNumber != string.Empty);
        var hasWaInitialSeedRows = await activeParcels.AnyAsync(p => p.ConversionEra == "WA_INITIAL_SEED", ct);
        if (hasWaInitialSeedRows)
        {
            var seedParcels = activeParcels.Where(p => p.ConversionEra == "WA_INITIAL_SEED");
            var seedTotal = await seedParcels.CountAsync(ct);
            var seedRows = await seedParcels
                .OrderBy(p => p.ParcelNumber)
                .Skip(safeOffset)
                .Take(safeLimit)
                .Select(p => new
                {
                    parcelId = p.TfParcelId,
                    parcelNumber = p.ParcelNumber,
                    address = p.SitusAddress,
                    propertyType = p.PropertyType,
                    legalDescription = p.LegalDescription,
                    parcelStatus = p.ParcelStatus,
                    currentOwnerId = p.CurrentOwnerId,
                    currentAssessmentId = p.CurrentAssessmentId,
                    updatedAt = p.UpdatedAt,
                })
                .ToListAsync(ct);

            return Ok(new
            {
                county = county.Name,
                countyId = county.Id,
                rowType = "parcels",
                runtimeTable = "canonical_tf.tf_parcel",
                semantics = new
                {
                    countyScoped = true,
                    activeOnly = true,
                    duplicateParcelVersionsCollapsed = true,
                    currentParcelVersion = true,
                    source = "wa_initial_seed_deduped_import",
                },
                total = seedTotal,
                count = seedRows.Count,
                rows = seedRows,
            });
        }

        var distinctParcelNumbers = activeParcels
            .Select(p => p.ParcelNumber!)
            .Distinct();
        var total = await distinctParcelNumbers.CountAsync(ct);
        var pageParcelNumbers = await distinctParcelNumbers
            .OrderBy(parcelNumber => parcelNumber)
            .Skip(safeOffset)
            .Take(safeLimit)
            .ToListAsync(ct);
        var pageRows = pageParcelNumbers.Count == 0
            ? []
            : await activeParcels
                .Where(p => pageParcelNumbers.Contains(p.ParcelNumber!))
                .ToListAsync(ct);
        var rows = pageRows
            .GroupBy(p => p.ParcelNumber)
            .Select(g => g.OrderByDescending(p => p.UpdatedAt).First())
            .OrderBy(p => p.ParcelNumber)
            .Select(p => new
            {
                parcelId = p.TfParcelId,
                parcelNumber = p.ParcelNumber,
                address = p.SitusAddress,
                propertyType = p.PropertyType,
                legalDescription = p.LegalDescription,
                parcelStatus = p.ParcelStatus,
                currentOwnerId = p.CurrentOwnerId,
                currentAssessmentId = p.CurrentAssessmentId,
                updatedAt = p.UpdatedAt,
            })
            .ToList();

        return Ok(new
        {
            county = county.Name,
            countyId = county.Id,
            rowType = "parcels",
            runtimeTable = "canonical_tf.tf_parcel",
            semantics = new
            {
                countyScoped = true,
                activeOnly = true,
                duplicateParcelVersionsCollapsed = true,
                currentParcelVersion = true,
                source = "canonical_tf_runtime_query",
            },
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

        var query = _db.TfSales.AsNoTracking().Where(s => s.CountyId == county.Id);
        var total = await query.CountAsync(ct);
        var sales = await query
            .OrderByDescending(s => s.SlDt)
            .ThenByDescending(s => s.ChgOfOwnerId)
            .Skip(safeOffset)
            .Take(safeLimit)
            .ToListAsync(ct);

        var directParcelIds = sales.Select(s => s.TfParcelId).ToHashSet();
        var directParcels = await _db.TfParcels
            .AsNoTracking()
            .Where(p => directParcelIds.Contains(p.TfParcelId))
            .ToDictionaryAsync(p => p.TfParcelId, ct);

        var saleIds = sales.Select(s => s.TfSaleId).ToHashSet();
        var saleXrefs = await _db.SyncBridgeSourceXrefs
            .AsNoTracking()
            .Where(x => x.TfEntityType == "sale" && x.IsActive && saleIds.Contains(x.TfEntityId))
            .ToListAsync(ct);
        var salePropIds = saleXrefs
            .Select(x => new { x.TfEntityId, PropId = ExtractSourceLong(x.SourceKeyJson, "prop_id") })
            .Where(x => x.PropId.HasValue)
            .ToDictionary(x => x.TfEntityId, x => x.PropId!.Value);
        var requiredPropIds = salePropIds.Values.ToHashSet();
        var lineageParcelXrefs = requiredPropIds.Count == 0
            ? []
            : await _db.SyncBridgeSourceXrefs
                .AsNoTracking()
                .Where(x => x.TfEntityType == "parcel" && x.IsActive && x.SourceKeyJson.Contains("prop_id"))
                .ToListAsync(ct);
        var lineageParcelIds = lineageParcelXrefs
            .Select(x => new { x.TfEntityId, PropId = ExtractSourceLong(x.SourceKeyJson, "prop_id") })
            .Where(x => x.PropId.HasValue && requiredPropIds.Contains(x.PropId.Value))
            .GroupBy(x => x.PropId!.Value)
            .ToDictionary(g => g.Key, g => g.First().TfEntityId);
        var relinkParcelIds = lineageParcelIds.Values.ToHashSet();
        var lineageParcels = await _db.TfParcels
            .AsNoTracking()
            .Where(p => relinkParcelIds.Contains(p.TfParcelId))
            .ToDictionaryAsync(p => p.TfParcelId, ct);

        var rows = sales
            .Select(s =>
            {
                var parcel = ResolveSaleParcel(s.TfParcelId, s.TfSaleId, directParcels, salePropIds, lineageParcelIds, lineageParcels);
                return new
                {
                    id = s.TfSaleId,
                    tfParcelId = s.TfParcelId,
                    parcelNumber = parcel?.ParcelNumber,
                    saleDate = s.SlDt,
                    salePrice = s.SlPrice,
                    adjustedSalePrice = s.AdjSlPrice,
                    saleQualified = s.SaleQualified,
                    chgOfOwnerId = s.ChgOfOwnerId,
                    conversionEra = s.ConversionEra,
                };
            })
            .ToList();

        return Ok(new
        {
            county = county.Name,
            countyId = county.Id,
            rowType = "sales",
            runtimeTable = "canonical_tf.tf_sale",
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

        var canonicalParcelCount = await _db.TfParcels
            .AsNoTracking()
            .CountAsync(p => p.CountyId == county.Id && p.ParcelStatus == "ACTIVE", ct);
        var canonicalSaleCount = await _db.TfSales
            .AsNoTracking()
            .CountAsync(s => s.CountyId == county.Id, ct);
        var canonicalSaleQualificationCount = await _db.CanonicalSaleQualifications
            .AsNoTracking()
            .CountAsync(q => q.CountyId == county.Id, ct);

        var devSeedersSkipped = DevSeedersSkipped();
        var classification = ClassifyRuntimeLineage(
            canonicalParcelCount,
            canonicalSaleCount,
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
                tfParcels = canonicalParcelCount,
                tfSales = canonicalSaleCount,
                canonicalSaleQualifications = canonicalSaleQualificationCount,
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
        int canonicalParcelCount,
        int canonicalSaleCount,
        int canonicalSaleQualificationCount)
    {
        if (canonicalParcelCount <= 0 && canonicalSaleCount <= 0)
            return "no_runtime_rows";

        if (canonicalParcelCount > 0 &&
            canonicalSaleCount > 0 &&
            canonicalSaleQualificationCount > 0)
            return "terrafusion_canonical_runtime_complete";

        if (canonicalParcelCount > 0)
            return "terrafusion_canonical_runtime_partial";

        return "terrafusion_canonical_runtime_unclassified";
    }

    private static TerraFusion.Core.Entities.CanonicalTf.TfParcel? ResolveSaleParcel(
        Guid directTfParcelId,
        Guid tfSaleId,
        IReadOnlyDictionary<Guid, TerraFusion.Core.Entities.CanonicalTf.TfParcel> directParcels,
        IReadOnlyDictionary<Guid, long> salePropIds,
        IReadOnlyDictionary<long, Guid> lineageParcelIds,
        IReadOnlyDictionary<Guid, TerraFusion.Core.Entities.CanonicalTf.TfParcel> lineageParcels)
    {
        if (directParcels.TryGetValue(directTfParcelId, out var directParcel))
            return directParcel;

        if (!salePropIds.TryGetValue(tfSaleId, out var propId))
            return null;
        if (!lineageParcelIds.TryGetValue(propId, out var relinkedParcelId))
            return null;

        return lineageParcels.TryGetValue(relinkedParcelId, out var relinkedParcel)
            ? relinkedParcel
            : null;
    }

    private static long? ExtractSourceLong(string? sourceKeyJson, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(sourceKeyJson)) return null;

        try
        {
            using var document = JsonDocument.Parse(sourceKeyJson);
            if (!document.RootElement.TryGetProperty(propertyName, out var property))
                return null;
            return property.ValueKind switch
            {
                JsonValueKind.Number when property.TryGetInt64(out var value) => value,
                JsonValueKind.String when long.TryParse(property.GetString(), out var value) => value,
                _ => null,
            };
        }
        catch (JsonException)
        {
            return null;
        }
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
