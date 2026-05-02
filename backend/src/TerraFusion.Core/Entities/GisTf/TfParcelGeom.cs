using System;

namespace TerraFusion.Core.Entities.GisTf;

/// <summary>
/// Slice G1-A: TerraFusion canonical parcel geometry.
///
/// <para>Per <c>docs/plans/terrafusion-90-day-execution-plan.md</c> §4
/// (Block D, GIS sub-block): this is the canonical landing surface for
/// parcel polygons sourced from county ArcGIS REST feature services.
/// No custom shapefile parsing — ArcGIS REST is the locked source of
/// geometric truth.</para>
///
/// <para>Per the doctrine: every row in <c>gis_tf.tf_parcel_geom</c>
/// MUST eventually have a corresponding <c>sync_bridge.source_xref</c>
/// entry with <c>SourceFamily = "ARCGIS_REST"</c>. v1 (this slice)
/// lands the schema only; <c>source_xref</c> insertion is wired in
/// G1-B/G1-C when the adapter and source-family enum extension
/// materialize.</para>
///
/// <para><see cref="TfParcelId"/> is nullable to allow crosswalk-pending
/// state: ArcGIS rows can land before their PACS-side <see cref="TfParcelId"/>
/// is resolved (and vice versa). The crosswalk is closed by APN match
/// in G1-C; rows that fail to crosswalk after that pass are quarantined
/// to <c>legacy_tf_unproven.unresolved_arcgis_parcel</c>.</para>
///
/// <para><see cref="GeomWkt"/> is stored as text (Well-Known Text) for
/// portability across SQLite (dev) and PostgreSQL (prod). PostGIS-native
/// geometry is a Phase 2 migration; for v1 we only need centroid + area
/// for proximity queries, which are pre-computed at sync time.</para>
/// </summary>
public sealed class TfParcelGeom
{
    public Guid TfParcelGeomId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Cross-link to <see cref="CanonicalTf.TfParcel"/>. Nullable to
    /// permit crosswalk-pending state — set when the APN/parcel-number
    /// match closes during sync.
    /// </summary>
    public Guid? TfParcelId { get; set; }

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// ArcGIS feature primary key (OBJECTID). Stable per feature
    /// service; combined with <see cref="CountyId"/> forms the natural
    /// uniqueness key for an ArcGIS-sourced parcel polygon.
    /// </summary>
    public long ArcGisObjectId { get; set; }

    /// <summary>
    /// County-readable parcel number from ArcGIS attributes. Used as
    /// the crosswalk key against <see cref="CanonicalTf.TfParcel.ParcelNumber"/>.
    /// </summary>
    public string? ArcGisApn { get; set; }

    /// <summary>
    /// Polygon as Well-Known Text. Portable across SQLite/Postgres.
    /// Postgres-native PostGIS geometry is a Phase 2 migration.
    /// </summary>
    public string GeomWkt { get; set; } = string.Empty;

    /// <summary>Pre-computed centroid latitude (WGS84).</summary>
    public double CentroidLat { get; set; }

    /// <summary>Pre-computed centroid longitude (WGS84).</summary>
    public double CentroidLon { get; set; }

    /// <summary>Pre-computed polygon area in square feet.</summary>
    public double AreaSqFt { get; set; }

    /// <summary>
    /// ArcGIS feature service URL this row was sourced from. Recorded
    /// as provenance even though the v1 schema doesn't yet require a
    /// <c>source_xref</c> entry.
    /// </summary>
    public string SourceServiceUrl { get; set; } = string.Empty;

    /// <summary>UTC timestamp of the last successful sync of this row.</summary>
    public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft-delete flag. ArcGIS features that disappear from the source
    /// service are flagged inactive rather than hard-deleted, to
    /// preserve historical lineage.
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
