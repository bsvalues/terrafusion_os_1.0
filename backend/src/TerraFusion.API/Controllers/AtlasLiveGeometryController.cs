using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/atlas-live/geometry")]
public sealed class AtlasLiveGeometryController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<AtlasLiveGeometryController> _logger;

    public AtlasLiveGeometryController(
        TerraFusionDbContext db,
        ILogger<AtlasLiveGeometryController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("parcels")]
    public async Task<IActionResult> GetParcelGeometry(
        [FromQuery] Guid countyId,
        [FromQuery] int taxYear,
        [FromQuery] string? studyId = null,
        [FromQuery] string? segmentId = null,
        [FromQuery] string? neighborhoodCode = null,
        [FromQuery] int limit = 5000,
        CancellationToken ct = default)
    {
        if (countyId == Guid.Empty)
        {
            return BadRequest(new { error = "countyId must be a non-empty Guid." });
        }

        if (limit <= 0) limit = 5000;
        if (limit > 10000) limit = 10000;

        var rows = await _db.TfParcelGeoms
            .AsNoTracking()
            .Where(g => g.CountyId == countyId && g.IsActive && g.GeomWkt != "")
            .OrderBy(g => g.ArcGisObjectId)
            .Take(limit)
            .Select(g => new
            {
                g.TfParcelGeomId,
                g.TfParcelId,
                g.CountyId,
                g.ArcGisObjectId,
                g.ArcGisApn,
                g.GeomWkt,
                g.CentroidLat,
                g.CentroidLon,
                g.AreaSqFt,
                g.SourceServiceUrl,
                g.LastSyncedAt,
            })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        var features = new List<object>(rows.Count);
        var skippedInvalidWkt = 0;
        foreach (var row in rows)
        {
            if (!TryParsePolygonWkt(row.GeomWkt, out var coordinates))
            {
                skippedInvalidWkt += 1;
                continue;
            }

            features.Add(new
            {
                type = "Feature",
                geometry = new
                {
                    type = "Polygon",
                    coordinates,
                },
                properties = new
                {
                    parcelId = row.ArcGisApn ?? row.TfParcelId?.ToString() ?? row.TfParcelGeomId.ToString(),
                    tfParcelId = row.TfParcelId,
                    tfParcelGeomId = row.TfParcelGeomId,
                    countyId = row.CountyId,
                    arcGisObjectId = row.ArcGisObjectId,
                    neighborhoodCode,
                    assessedValue = 0,
                    propertyClass = (string?)null,
                    areaAcres = row.AreaSqFt > 0 ? Math.Round(row.AreaSqFt / 43560d, 6) : (double?)null,
                    yearBuilt = (int?)null,
                    situsAddress = (string?)null,
                    primaryUse = (string?)null,
                    saleDate = (string?)null,
                    salePrice = 0,
                    qualDecision = (string?)null,
                    ratio = (double?)null,
                    nbhdMedianRatio = (double?)null,
                    ratioDeviation = (double?)null,
                    isOutlier = false,
                    geometrySource = "syncDerivedGeometry",
                    dbTable = "gis_tf.tf_parcel_geom",
                    sourceServiceUrl = row.SourceServiceUrl,
                    lastSyncedAt = row.LastSyncedAt,
                },
            });
        }

        if (skippedInvalidWkt > 0)
        {
            _logger.LogInformation(
                "[AtlasLiveGeometry] skipped {Count} invalid WKT rows for countyId={CountyId}",
                skippedInvalidWkt,
                countyId);
        }

        if (ControllerContext.HttpContext is not null)
        {
            Response.ContentType = "application/geo+json";
        }
        return Ok(new
        {
            outlines = (object?)null,
            parcels = new
            {
                type = "FeatureCollection",
                features,
            },
            source = new
            {
                classification = "syncDerivedGeometry",
                dbTable = "gis_tf.tf_parcel_geom",
                ownerLane = "Atlas",
                countyId,
                taxYear,
                studyId,
                segmentId,
                neighborhoodCode,
                productionProofAllowed = false,
                operationalProofAllowed = false,
            },
        });
    }

    private static bool TryParsePolygonWkt(string wkt, out double[][][] coordinates)
    {
        coordinates = Array.Empty<double[][]>();

        var trimmed = wkt.Trim();
        if (!trimmed.StartsWith("POLYGON", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var start = trimmed.IndexOf("((", StringComparison.Ordinal);
        var end = trimmed.LastIndexOf("))", StringComparison.Ordinal);
        if (start < 0 || end <= start)
        {
            return false;
        }

        var ringText = trimmed[(start + 2)..end];
        var rings = ringText.Split(new[] { "),(" }, StringSplitOptions.RemoveEmptyEntries);
        var parsedRings = new List<double[][]>(rings.Length);

        foreach (var ring in rings)
        {
            var points = new List<double[]>();
            foreach (var rawPoint in ring.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = rawPoint.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2) continue;
                if (!double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var lon)) continue;
                if (!double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var lat)) continue;
                points.Add(new[] { lon, lat });
            }

            if (points.Count < 3)
            {
                continue;
            }

            var first = points[0];
            var last = points[^1];
            if (first[0] != last[0] || first[1] != last[1])
            {
                points.Add(new[] { first[0], first[1] });
            }

            parsedRings.Add(points.ToArray());
        }

        if (parsedRings.Count == 0)
        {
            return false;
        }

        coordinates = parsedRings.ToArray();
        return true;
    }
}
