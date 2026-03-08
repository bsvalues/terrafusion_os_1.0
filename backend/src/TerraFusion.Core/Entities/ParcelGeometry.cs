using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Stores GIS geometry data for a parcel.
/// Dual-mode storage:
///   - PostgreSQL/PostGIS: Native geometry + centroid_point columns (GiST indexed)
///   - SQLite: GeoJSON TEXT + centroid_lat/lng doubles (Haversine fallback)
/// Both paths always populated for seamless provider switching.
/// </summary>
public class ParcelGeometry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    /// <summary>GeoJSON geometry string (Polygon/MultiPolygon). TEXT column. Always populated.</summary>
    public string? GeoJson { get; set; }

    /// <summary>Centroid latitude (WGS84). Used for Haversine queries on SQLite.</summary>
    public double? CentroidLat { get; set; }

    /// <summary>Centroid longitude (WGS84). Used for Haversine queries on SQLite.</summary>
    public double? CentroidLng { get; set; }

    // ── PostGIS Native Geometry (R3.0) ──────────────────────────────
    // These are populated on PostgreSQL only. Ignored by EF on SQLite.

    /// <summary>Native PostGIS geometry (Polygon/MultiPolygon, SRID 4326). Null on SQLite.</summary>
    public Geometry? NativeGeometry { get; set; }

    /// <summary>Native PostGIS centroid point (SRID 4326). Enables ST_DWithin queries. Null on SQLite.</summary>
    public Point? CentroidPoint { get; set; }

    // ── Standard Fields ─────────────────────────────────────────────

    /// <summary>Parcel area in square feet.</summary>
    public double? AreaSqft { get; set; }

    /// <summary>Parcel area in acres.</summary>
    public double? AreaAcres { get; set; }

    /// <summary>Zoning classification code (e.g., R-1, C-2, AG).</summary>
    [StringLength(50)]
    public string? ZoningCode { get; set; }

    /// <summary>Human-readable zoning description.</summary>
    [StringLength(200)]
    public string? ZoningDescription { get; set; }

    /// <summary>SRID / coordinate reference system (default 4326 = WGS84).</summary>
    public int Srid { get; set; } = 4326;

    /// <summary>Source of geometry data (e.g., "county_assessor", "usgs", "manual").</summary>
    [StringLength(100)]
    public string? Source { get; set; }

    /// <summary>Date geometry was last updated from source.</summary>
    public DateTime? SourceDate { get; set; }

    // FISMA audit fields (auto-populated)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
