using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;
    private readonly ILogger<PropertiesController> _logger;

    public PropertiesController(IPropertyService propertyService, ILogger<PropertiesController> logger)
    {
        _propertyService = propertyService;
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

            var properties = await _propertyService.GetPropertiesAsync(page, pageSize, search, effectiveCountyId);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving properties");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    [RequiresPermission("read:properties")]
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
            return Forbid();

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
}
