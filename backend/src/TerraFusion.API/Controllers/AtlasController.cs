using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraAtlas — Parcel geometry and layer endpoints for R1.
/// Write-lane: atlas. County isolation enforced on all queries.
/// </summary>
[ApiController]
[Route("api/atlas")]
[Authorize]
public class AtlasController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<AtlasController> _logger;

    public AtlasController(TerraFusionDbContext db, ILogger<AtlasController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── County Isolation Helper ──────────────────────────────────────

    private Guid? GetCountyId()
    {
        var claim = User.FindFirst("countyId")?.Value;
        if (Guid.TryParse(claim, out var id)) return id;
        return null;
    }

    // ── Available Layers (static for R1) ─────────────────────────────

    private static readonly string[] DefaultLayers = ["boundary", "zoning", "flood", "aerial", "parcels"];
    private static readonly Regex ParcelIdPattern = new("^[A-Za-z0-9._-]{1,50}$", RegexOptions.Compiled);

    private static bool IsValidParcelId(string parcelId)
    {
        return !string.IsNullOrWhiteSpace(parcelId) && ParcelIdPattern.IsMatch(parcelId);
    }

    // ── GET /api/atlas/parcels/{parcelId} ────────────────────────────

    /// <summary>
    /// Return parcel geometry, centroid, area, and zoning.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetParcelGeometry(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = GetCountyId();
        if (countyId is null)
            return Forbid();

        var property = await _db.Properties
            .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
            .Select(p => new
            {
                p.ParcelId,
                p.Address,
                p.PropertyType,
                p.CountyId,
            })
            .FirstOrDefaultAsync();

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        // R1: geometry derived from parcel data available in the Property table.
        // Real GIS backend would supply WKT polygons; for R1 we return a
        // representative centroid computed from the county's geographic center
        // plus a deterministic offset from a stable parcelId hash.
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(parcelId));
        var latSeed = BitConverter.ToUInt32(hashBytes, 0);
        var lngSeed = BitConverter.ToUInt32(hashBytes, 4);
        var latOffset = (latSeed % 1000) / 100_000.0;
        var lngOffset = (lngSeed % 1000) / 100_000.0;

        // Benton County, WA approximate center
        const double baseLat = 46.23;
        const double baseLng = -119.20;
        var centroidLat = Math.Round(baseLat + latOffset, 6);
        var centroidLng = Math.Round(baseLng + lngOffset, 6);

        // Synthetic area from parcel class (SFR ≈ 7500–10000 sqft)
        var areaSqft = 7500 + (int)(latSeed % 5000);
        var areaAcres = Math.Round(areaSqft / 43560.0, 3);

        // Derive zoning from PropertyType
        var zoning = property.PropertyType switch
        {
            "SFR" or "Residential" => "R-1",
            "MFR" or "Multi-Family" => "R-2",
            "Commercial" => "C-1",
            "Industrial" => "I-1",
            _ => "R-1",
        };

        return Ok(new
        {
            parcelId = property.ParcelId,
            geometry = $"POLYGON(({centroidLng - 0.001} {centroidLat - 0.001}, {centroidLng + 0.001} {centroidLat - 0.001}, {centroidLng + 0.001} {centroidLat + 0.001}, {centroidLng - 0.001} {centroidLat + 0.001}, {centroidLng - 0.001} {centroidLat - 0.001}))",
            centroid = new { lat = centroidLat, lng = centroidLng },
            areaSqft,
            areaAcres,
            zoning,
            layers = DefaultLayers,
        });
    }

    // ── GET /api/atlas/parcels/{parcelId}/layers ─────────────────────

    /// <summary>
    /// Return available layer list for a parcel.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}/layers")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetParcelLayers(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = GetCountyId();
        if (countyId is null)
            return Forbid();

        var exists = await _db.Properties
            .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

        if (!exists)
            return NotFound(new { error = "Parcel not found" });

        return Ok(new
        {
            parcelId,
            layers = DefaultLayers.Select(l => new
            {
                id = l,
                name = l switch
                {
                    "boundary" => "Parcel Boundary",
                    "zoning" => "Zoning Districts",
                    "flood" => "FEMA Flood Zones",
                    "aerial" => "Aerial Imagery (2025)",
                    "parcels" => "All Parcels",
                    _ => l,
                },
                available = true,
            }),
        });
    }
}
