using System;

namespace TerraFusion.Core.Entities.TruthArcGis;

/// <summary>
/// Slice D2: supp-aware-validated current ArcGIS parcel polygon.
///
/// <para>The middle layer of Block D's GIS doctrine — collapses
/// raw <c>legacy_arcgis_raw.parcel_geom</c> rows to
/// latest-per-<c>(CountyId, ArcGisObjectId)</c>, with a geometry
/// validity gate to filter malformed WKT before canonical
/// projection.</para>
///
/// <para>Two invariants hold by construction:
/// <list type="number">
///   <item>For any <c>(CountyId, ArcGisObjectId)</c> tuple, only
///   the row from the most-recent COMPLETED landing batch is
///   present. Older landings stay in <c>legacy_arcgis_raw</c> for
///   audit but do not promote.</item>
///   <item>Lineage to the source raw row is preserved
///   (<see cref="SourceLandedRowId"/> +
///   <see cref="LandingLoadBatchId"/>) so any truth row can be
///   traced back to its raw origin without ambiguity.</item>
/// </list>
/// </para>
///
/// <para>Doctrine: this is NOT canonical. Crosswalk to
/// <c>canonical_tf.tf_parcel</c> via APN happens at canonical
/// layer (D3 — <c>gis_tf.tf_parcel_geom</c>), with
/// <c>source_xref</c> entries of <c>TfEntityType="geom_parcel"</c>.
/// truth_arcgis.parcel_geom_current is a stepping stone, not a
/// destination.</para>
/// </summary>
public sealed class TruthArcGisParcelGeomCurrent
{
    public Guid TruthParcelGeomId { get; set; } = Guid.NewGuid();

    // ── ArcGIS-side identity (the supp-aware-validated 2-key) ────
    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// FeatureService OBJECTID. Unique with <see cref="CountyId"/>
    /// at the truth layer (latest-per-tuple wins).
    /// </summary>
    public long ArcGisObjectId { get; set; }

    // ── Attributes (preserved verbatim from raw) ──────────────────
    public string? ArcGisApn { get; set; }

    public string GeomWkt { get; set; } = string.Empty;
    public double CentroidLat { get; set; }
    public double CentroidLon { get; set; }
    public double AreaSqFt { get; set; }
    public string SourceServiceUrl { get; set; } = string.Empty;

    // ── Lineage (the doctrine's traceback) ────────────────────────
    /// <summary>FK-style pointer to <c>legacy_arcgis_raw.parcel_geom.LandedRowId</c>.</summary>
    public Guid SourceLandedRowId { get; set; }

    /// <summary>The D1 landing LoadBatch this truth row was promoted from.</summary>
    public Guid LandingLoadBatchId { get; set; }

    /// <summary>The D2 truth-promotion LoadBatch.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
