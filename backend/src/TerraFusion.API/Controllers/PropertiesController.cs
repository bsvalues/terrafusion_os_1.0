using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.API.Security;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;
    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly ILogger<PropertiesController> _logger;

    public PropertiesController(IPropertyService propertyService, TerraFusion.Data.TerraFusionDbContext db, ILogger<PropertiesController> logger)
    {
        _propertyService = propertyService;
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<PropertyDto>>> GetProperties(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] Guid? countyId = null)
    {
        try
        {
            var countyAccessFailure = TryResolveCountyId(countyId, out var effectiveCountyId);
            if (countyAccessFailure is not null)
                return countyAccessFailure;

            // Guid.Empty means no JWT claim — dev/OS-module anonymous mode: do not filter by county
            Guid? filterCountyId = effectiveCountyId == Guid.Empty ? null : effectiveCountyId;
            var properties = await _propertyService.GetPropertiesAsync(page, pageSize, search, filterCountyId);
            await EnrichFromPacsAsync(properties.Items);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving properties — returning empty result");
            return Ok(new { items = Array.Empty<object>(), totalCount = 0, page, pageSize });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PropertyDto>> GetProperty(Guid id)
    {
        try
        {
            var countyAccessFailure = TryResolveCountyId(null, out var countyId);
            if (countyAccessFailure is not null)
                return countyAccessFailure;

            var property = await _propertyService.GetPropertyByIdAsync(id, countyId);
            if (property == null)
                return NotFound();

            await EnrichFromPacsAsync(new[] { property });
            return Ok(property);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property {PropertyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Enriches PropertyDtos with real assessed/market/land/improvement values from
    /// PacsValuations when the Properties table has zeros (import gap).
    /// Joins: PropertyDto.ParcelNumber = PacsParcel.GeoId → PacsParcel.Id = PacsValuation.ParcelId
    /// Uses SupNum=0 (working layer) and latest PropValYear per parcel.
    /// </summary>
    private async Task EnrichFromPacsAsync(IEnumerable<PropertyDto> items)
    {
        var list = items.Where(p => p.AssessedValue == 0 && !string.IsNullOrEmpty(p.ParcelNumber)).ToList();
        if (list.Count == 0) return;

        var parcelNumbers = list.Select(p => p.ParcelNumber!).Distinct().ToList();

        // Step 1: resolve geo_id → parcel_id (in-memory join avoids GroupBy translation issues
        //         that cause EF to materialize the full PacsValuation entity including hood_cd)
        var parcels = await _db.PacsParcel
            .AsNoTracking()
            .Where(p => p.GeoId != null && parcelNumbers.Contains(p.GeoId))
            .Select(p => new { p.Id, GeoId = p.GeoId! })
            .ToListAsync();

        if (parcels.Count == 0) return;

        var parcelIdToGeoId = parcels.ToDictionary(p => p.Id, p => p.GeoId);
        var parcelIds = parcelIdToGeoId.Keys.ToList();

        // Step 2: fetch only the columns we need from pacs_valuations — no hood_cd
        var rawVals = await _db.PacsValuations
            .AsNoTracking()
            .Where(v => v.SupNum == 0 && parcelIds.Contains(v.ParcelId))
            .Select(v => new
            {
                v.ParcelId,
                v.PropValYear,
                v.AssessedVal,
                v.Market,
                LandVal = (v.LandHstdVal ?? 0m) + (v.LandNonHstdVal ?? 0m),
                ImprvVal = v.ImprvVal ?? 0m,
            })
            .ToListAsync();

        // Step 3: latest year per parcel, joined back to geo_id — all in memory
        var pacsValues = rawVals
            .GroupBy(v => v.ParcelId)
            .Select(g => g.OrderByDescending(v => v.PropValYear).First())
            .Where(v => parcelIdToGeoId.ContainsKey(v.ParcelId))
            .ToDictionary(v => parcelIdToGeoId[v.ParcelId], v => v);

        foreach (var item in list)
        {
            if (pacsValues.TryGetValue(item.ParcelNumber!, out var pacs))
            {
                item.AssessedValue = pacs.AssessedVal ?? 0m;
                item.MarketValue = pacs.Market ?? 0m;
                item.LandValue = pacs.LandVal;
                item.ImprovementValue = pacs.ImprvVal;
            }
        }
    }

    private ActionResult? TryResolveCountyId(Guid? requestedCountyId, out Guid countyId)
    {
        countyId = Guid.Empty;
        var claim = User.FindFirst("countyId")?.Value?.Trim();
        // No auth claim present (OS module dev mode) — allow access with no county filter.
        if (string.IsNullOrWhiteSpace(claim) || !Guid.TryParse(claim, out countyId))
            return null;

        if (requestedCountyId.HasValue && requestedCountyId.Value != countyId)
            return Forbid();

        return null;
    }

    [HttpGet("parcel/{parcelNumber}")]
    public async Task<ActionResult<PropertyDto>> GetPropertyByParcel(string parcelNumber)
    {
        try
        {
            var countyAccessFailure = TryResolveCountyId(null, out var countyId);
            if (countyAccessFailure is not null)
                return countyAccessFailure;

            var property = await _propertyService.GetPropertyByParcelAsync(parcelNumber, countyId);
            if (property == null)
                return NotFound();

            await EnrichFromPacsAsync(new[] { property });

            // Enrich with CAMA data not available on the base Property entity
            var cama = await _db.CamaCharacteristics
                .AsNoTracking()
                .Where(c => c.ParcelId == parcelNumber)
                .OrderByDescending(c => c.TaxYear)
                .Select(c => new {
                    c.SquareFeet,
                    c.YearBuilt,
                    c.Bedrooms,
                    c.Bathrooms,
                    c.LandAreaSqft,
                })
                .FirstOrDefaultAsync();

            if (cama != null)
            {
                if (property.SquareFeet is null or 0 && cama.SquareFeet > 0)
                    property.SquareFeet = cama.SquareFeet;
                if (property.YearBuilt is null or 0 && cama.YearBuilt is > 0)
                    property.YearBuilt = cama.YearBuilt;
                if (property.Bedrooms is null && cama.Bedrooms is > 0)
                    property.Bedrooms = cama.Bedrooms;
                if (property.Bathrooms is null && cama.Bathrooms is > 0)
                    property.Bathrooms = cama.Bathrooms;
                if (property.LandAcres is null or 0 && cama.LandAreaSqft is > 0)
                    property.LandAcres = Math.Round(cama.LandAreaSqft.Value / 43560m, 4);
            }

            // Enrich Neighborhood, UseCode, TaxDistrict from PACS tables
            var pacsIdStr = await _db.Properties
                .AsNoTracking()
                .Where(p => p.ParcelNumber == parcelNumber)
                .Select(p => p.PropertyId)
                .FirstOrDefaultAsync();

            if (int.TryParse(pacsIdStr, out var pacsPropId) && pacsPropId > 0)
            {
                var profile = await _db.PacsPropertyProfiles
                    .AsNoTracking()
                    .Where(p => p.PacsPropId == pacsPropId)
                    .OrderByDescending(p => p.PropValYear)
                    .Select(p => new { p.NeighborhoodCode, p.PropertyUseCd })
                    .FirstOrDefaultAsync();

                if (profile != null)
                {
                    if (string.IsNullOrEmpty(property.Neighborhood) && !string.IsNullOrEmpty(profile.NeighborhoodCode))
                        property.Neighborhood = profile.NeighborhoodCode;
                    if (string.IsNullOrEmpty(property.PropertyUseCode) && !string.IsNullOrEmpty(profile.PropertyUseCd))
                        property.PropertyUseCode = profile.PropertyUseCd;
                }

                var taxArea = await _db.PacsTaxAreas
                    .AsNoTracking()
                    .Where(t => t.PacsPropId == pacsPropId)
                    .Select(t => new { t.TaxAreaNumber, t.TaxAreaDescription, t.TaxYear })
                    .ToListAsync()
                    .ContinueWith(r => r.Result.OrderByDescending(t => t.TaxYear).FirstOrDefault());

                if (taxArea != null)
                {
                    if (string.IsNullOrEmpty(property.TaxDistrictCode) && !string.IsNullOrEmpty(taxArea.TaxAreaNumber))
                        property.TaxDistrictCode = taxArea.TaxAreaNumber;
                    if (string.IsNullOrEmpty(property.TaxDistrictName) && !string.IsNullOrEmpty(taxArea.TaxAreaDescription))
                        property.TaxDistrictName = taxArea.TaxAreaDescription;
                }
            }

            return Ok(property);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property by parcel {ParcelNumber}", parcelNumber);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}/valuations")]
    public async Task<ActionResult<IEnumerable<ValuationDto>>> GetPropertyValuations(Guid id)
    {
        try
        {
            var countyAccessFailure = TryResolveCountyId(null, out var countyId);
            if (countyAccessFailure is not null)
                return countyAccessFailure;

            var property = await _propertyService.GetPropertyByIdAsync(id, countyId);
            if (property == null)
                return NotFound();

            var valuations = await _propertyService.GetPropertyValuationsAsync(id, countyId);
            return Ok(valuations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving valuations for property {PropertyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/valuations")]
    public async Task<ActionResult<ValuationDto>> CreateValuation(Guid id, CreateValuationDto createDto)
    {
        try
        {
            var countyAccessFailure = TryResolveCountyId(null, out var countyId);
            if (countyAccessFailure is not null)
                return countyAccessFailure;

            var property = await _propertyService.GetPropertyByIdAsync(id, countyId);
            if (property == null)
                return NotFound();

            createDto.PropertyId = id;
            var valuation = await _propertyService.CreateValuationAsync(createDto);
            return CreatedAtAction(nameof(GetPropertyValuations), new { id }, valuation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating valuation for property {PropertyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<PropertyStatsDto>> GetPropertyStats()
    {
        try
        {
            var countyAccessFailure = TryResolveCountyId(null, out var countyId);
            if (countyAccessFailure is not null)
                return countyAccessFailure;

            var stats = await _propertyService.GetPropertyStatsAsync(countyId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property statistics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Returns recent activity events for a parcel.
    /// Stub: returns empty list until activity tracking is implemented.
    /// </summary>
    [HttpGet("parcel/{parcelNumber}/activity")]
    public IActionResult GetParcelActivity(string parcelNumber)
    {
        _logger.LogDebug("Activity requested for parcel {ParcelNumber} — returning stub empty list", parcelNumber);
        return Ok(new { items = Array.Empty<object>(), total = 0 });
    }
}
