using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Public parcel data endpoints for the Benton County GIS home-screen map.
/// AllowAnonymous: the home screen renders before auth; only aggregate non-PII data returned.
/// </summary>
[ApiController]
[Route("api/benton-county")]
[AllowAnonymous]
public class BentonCountyGisController : ControllerBase
{
    /// <summary>Benton County WA sovereign ID — matches seed data and JWT countyId claim.</summary>
    public static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<BentonCountyGisController> _logger;

    public BentonCountyGisController(TerraFusionDbContext db, ILogger<BentonCountyGisController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Returns up to <paramref name="limit"/> parcels for the Benton County map parcel layer.
    /// Returns parcel metadata only — no PII fields (OwnerSSN excluded).
    /// </summary>
    [HttpGet("parcels")]
    public async Task<IActionResult> GetParcels([FromQuery] int limit = 500)
    {
        limit = Math.Clamp(limit, 1, 500);

        try
        {
            var parcels = await _db.Properties
                .Where(p => p.CountyId == BentonCountyId)
                .OrderBy(p => p.ParcelNumber)
                .Take(limit)
                .Select(p => new
                {
                    parcelNumber = p.ParcelNumber,
                    address = p.Address,
                    ownerName = p.OwnerName,
                    assessedValue = p.AssessedValue,
                    propertyType = p.PropertyType,
                })
                .ToListAsync();

            return Ok(parcels);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load Benton County parcels for map");
            return StatusCode(503, new { error = "Parcel data temporarily unavailable" });
        }
    }
}
