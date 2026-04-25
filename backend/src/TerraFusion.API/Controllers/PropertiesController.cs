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

            return Ok(property);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property {PropertyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    private ActionResult? TryResolveCountyId(Guid? requestedCountyId, out Guid countyId)
    {
        countyId = Guid.Empty;
        var claim = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(claim) || !Guid.TryParse(claim, out countyId))
            return BadRequest("County authentication required — include a valid countyId claim.");

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

            // Enrich with CAMA data not available on the base Property entity
            var cama = await _db.CamaCharacteristics
                .AsNoTracking()
                .Where(c => c.ParcelId == parcelNumber)
                .OrderByDescending(c => c.TaxYear)
                .Select(c => new {
                    c.SquareFeet,
                    c.BasementSqft,
                    c.GarageSqft,
                    c.YearBuilt,
                    c.Bedrooms,
                    c.Bathrooms,
                    c.LandAreaSqft,
                })
                .FirstOrDefaultAsync();

            if (cama != null)
            {
                // SquareFeet in CamaCharacteristic = GLA (above-grade finished area, USPAP-compliant).
                // Basement and garage are separate — must NOT be summed into GLA.
                if (property.SquareFeet is null or 0 && cama.SquareFeet > 0)
                    property.SquareFeet = cama.SquareFeet;               // GLA proxy
                if (property.GrossLivingArea is null or 0 && cama.SquareFeet > 0)
                    property.GrossLivingArea = cama.SquareFeet;          // explicit GLA column
                if (cama.BasementSqft is > 0)
                    property.BasementSqft = cama.BasementSqft;
                if (cama.GarageSqft is > 0)
                    property.GarageSqft = cama.GarageSqft;
                if (property.YearBuilt is null or 0 && cama.YearBuilt is > 0)
                    property.YearBuilt = cama.YearBuilt;
                if (property.Bedrooms is null && cama.Bedrooms is > 0)
                    property.Bedrooms = cama.Bedrooms;
                if (property.Bathrooms is null && cama.Bathrooms is > 0)
                    property.Bathrooms = cama.Bathrooms;
                if (property.LandAcres is null or 0 && cama.LandAreaSqft is > 0)
                    property.LandAcres = Math.Round(cama.LandAreaSqft.Value / 43560m, 4);
            }

            // Enrich legal description — GIS (varchar 255, ArcGIS-synced) as quick fallback
            if (string.IsNullOrEmpty(property.LegalDescription))
            {
                var gisLegal = await _db.GisParcelGeometries
                    .AsNoTracking()
                    .Where(g => g.ParcelId == parcelNumber && !string.IsNullOrEmpty(g.LegalDescription))
                    .Select(g => g.LegalDescription)
                    .FirstOrDefaultAsync();
                if (!string.IsNullOrEmpty(gisLegal))
                    property.LegalDescription = gisLegal;
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

    /// <summary>
    /// Returns sketch data for a parcel — building improvements with detail segments.
    /// Joins: GeoId → PacsParcel → PacsImprovement (latest PropValYear, SupNum=0) → PacsImprovementDetail.
    /// Also pulls GisParcelGeometry.SketchUrl for scanned sketch image display.
    /// Returns empty buildings array (not 404) when parcel has no PACS improvements.
    /// </summary>
    [HttpGet("parcel/{parcelNumber}/sketch")]
    public async Task<IActionResult> GetParcelSketch(string parcelNumber)
    {
        try
        {
            var pacsParcel = await _db.PacsParcel
                .AsNoTracking()
                .Where(p => p.GeoId == parcelNumber)
                .Select(p => new { p.Id })
                .FirstOrDefaultAsync();

            if (pacsParcel == null)
                return Ok(new { parcelNumber, sketchUrl = (string?)null, buildings = Array.Empty<object>() });

            var allImprovements = await _db.PacsImprovements
                .AsNoTracking()
                .Where(i => i.ParcelId == pacsParcel.Id && i.SupNum == 0)
                .Select(i => new
                {
                    i.Id,
                    i.PacsImprvId,
                    i.PropValYear,
                    i.ImprvTypeCode,
                    i.ImprvDesc,
                    i.BuildingName,
                    i.BuildingNumber,
                    i.PrimaryImprv,
                })
                .ToListAsync();

            if (!allImprovements.Any())
                return Ok(new { parcelNumber, sketchUrl = (string?)null, buildings = Array.Empty<object>() });

            var latestYear = allImprovements.Max(i => i.PropValYear);
            var improvements = allImprovements.Where(i => i.PropValYear == latestYear).ToList();
            var improvementIds = improvements.Select(i => i.Id).ToList();

            var details = await _db.PacsImprovementDetails
                .AsNoTracking()
                .Where(d => improvementIds.Contains(d.ImprovementId) && d.SupNum == 0)
                .OrderBy(d => d.ImprovementId)
                .ThenBy(d => d.SeqNum)
                .Select(d => new
                {
                    d.ImprovementId,
                    d.ImprvDetTypeCd,
                    d.ImprvDetDesc,
                    d.ImprvDetArea,
                    d.SketchArea,
                    d.CalcArea,
                    d.ConditionCode,
                    d.YearBuilt,
                    d.Length,
                    d.Width,
                    d.NumStories,
                    d.SketchCommands,
                })
                .ToListAsync();

            var sketchUrl = await _db.GisParcelGeometries
                .AsNoTracking()
                .Where(g => g.ParcelId == parcelNumber)
                .Select(g => g.SketchUrl)
                .FirstOrDefaultAsync();

            var buildings = improvements.Select((imprv, idx) =>
            {
                var segs = details
                    .Where(d => d.ImprovementId == imprv.Id)
                    .Select((d, si) => new
                    {
                        id = $"s{si + 1}",
                        label = !string.IsNullOrWhiteSpace(d.ImprvDetDesc)
                            ? d.ImprvDetDesc
                            : d.ImprvDetTypeCd ?? $"Seg {si + 1}",
                        typeCode = d.ImprvDetTypeCd,
                        sqft = (double)(d.SketchArea ?? d.ImprvDetArea ?? d.CalcArea ?? 0m),
                        conditionCode = d.ConditionCode,
                        length = d.Length.HasValue ? (double?)((double)d.Length.Value) : null,
                        width = d.Width.HasValue ? (double?)((double)d.Width.Value) : null,
                        yearBuilt = d.YearBuilt.HasValue ? (int?)((int)d.YearBuilt.Value) : null,
                        numStories = d.NumStories,
                        hasSketchCommands = !string.IsNullOrWhiteSpace(d.SketchCommands),
                    })
                    .ToList();

                var totalSqft = segs.Sum(s => s.sqft);
                var yearBuilt = segs.Select(s => s.yearBuilt).FirstOrDefault(y => y is > 0) ?? 0;

                return (object)new
                {
                    buildingId = $"B{imprv.PacsImprvId:D3}",
                    label = !string.IsNullOrWhiteSpace(imprv.BuildingName) ? imprv.BuildingName
                           : !string.IsNullOrWhiteSpace(imprv.ImprvDesc) ? imprv.ImprvDesc
                           : $"Building {idx + 1}",
                    typeCode = imprv.ImprvTypeCode,
                    isPrimary = imprv.PrimaryImprv == "Y",
                    totalSqft,
                    yearBuilt,
                    segments = segs,
                };
            }).ToList();

            return Ok(new { parcelNumber, sketchUrl, buildings });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sketch for parcel {ParcelNumber}", parcelNumber);
            return StatusCode(500, "Internal server error");
        }
    }
}
