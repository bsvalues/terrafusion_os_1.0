using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Canonical GIS geometry for a parcel, sourced from the Benton County
/// ArcGIS FeatureServer (Parcels_and_Assess layer).
///
/// The sync engine is the ONLY writer.  All other services read-only.
/// ArcGIS is never called at request time — only from ArcGisSyncService.
/// Join key: ParcelId == PACS GeoId / ArcGIS Parcel_ID field.
/// </summary>
[Table("GisParcelGeometries")]
public class GisParcelGeometry
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>PACS GeoId / ArcGIS Parcel_ID  e.g. "101843020102012"</summary>
    [Required]
    [MaxLength(20)]
    public string ParcelId { get; set; } = "";

    // ── Centroid (WGS-84, converted from State Plane 2927) ───────────────
    /// <summary>Latitude of parcel centroid in WGS-84.</summary>
    public double? CentroidLat { get; set; }

    /// <summary>Longitude of parcel centroid in WGS-84.</summary>
    public double? CentroidLng { get; set; }

    // ── Parcel polygon (simplified ring JSON) ───────────────────────────
    /// <summary>
    /// JSON array of [lng, lat] coordinate pairs forming the outer ring
    /// of the parcel polygon in WGS-84.
    /// Stored as TEXT; parsed at read time.
    /// Null when ArcGIS returns a multi-ring geometry that wasn't simplified.
    /// </summary>
    [MaxLength(65535)]
    public string? RingJson { get; set; }

    // ── Area ─────────────────────────────────────────────────────────────
    public double? AreaSqFt { get; set; }
    public double? AreaAcres { get; set; }

    // ── Assessor-side fields (ArcGIS mirrors what PACS publishes) ────────
    [MaxLength(70)]
    public string? OwnerName { get; set; }

    [MaxLength(255)]
    public string? LegalDescription { get; set; }

    [MaxLength(173)]
    public string? SitusAddress { get; set; }

    [MaxLength(23)]
    public string? TaxCodeArea { get; set; }

    [MaxLength(100)]
    public string? NeighborhoodName { get; set; }

    [MaxLength(10)]
    public string? NeighborhoodCode { get; set; }

    public double? AppraisedValue { get; set; }
    public double? LandValue { get; set; }
    public double? ImprovementValue { get; set; }
    public double? AgUseValue { get; set; }

    /// <summary>Year built from ArcGIS/PACS mirror.</summary>
    public short? YearBuilt { get; set; }

    [MaxLength(10)]
    public string? PrimaryUse { get; set; }

    [MaxLength(10)]
    public string? ExemptTypeCode { get; set; }

    // ── Document / sketch links ──────────────────────────────────────────
    /// <summary>URL path to the scanned parcel image (recorded document).</summary>
    [MaxLength(100)]
    public string? ImageUrl { get; set; }

    /// <summary>URL path to the parcel sketch file.</summary>
    [MaxLength(50)]
    public string? SketchUrl { get; set; }

    [MaxLength(255)]
    public string? DocumentNumber { get; set; }

    /// <summary>ArcGIS base-correction flag: Yes | No | Research Needed</summary>
    [MaxLength(20)]
    public string? BaseCorrected { get; set; }

    // ── Sync metadata ────────────────────────────────────────────────────
    /// <summary>ArcGIS GlobalID from the source record.</summary>
    [MaxLength(38)]
    public string? ArcGisGlobalId { get; set; }

    /// <summary>ArcGIS OBJECTID from the source record.</summary>
    public int? ArcGisObjectId { get; set; }

    /// <summary>Timestamp of last successful sync from ArcGIS.</summary>
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Source layer version captured at sync time (dataLastEditDate ms epoch).</summary>
    public long? SourceVersionMs { get; set; }
}
