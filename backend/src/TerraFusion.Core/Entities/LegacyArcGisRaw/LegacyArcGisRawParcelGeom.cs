using System;

namespace TerraFusion.Core.Entities.LegacyArcGisRaw;

/// <summary>
/// Slice D1: raw ArcGIS feature-service landing zone for parcel
/// polygons.
///
/// <para>Per <c>docs/pacs/block-d-execution-plan.md</c> §3.1: the
/// first stop in the 5-schema doctrine for ArcGIS-sourced
/// geometry. Each row represents one ArcGIS Feature returned by
/// the per-county FeatureService query, captured verbatim with
/// full provenance — exactly mirroring the
/// <c>LegacyPacsRawImprvDetail</c> shape on the PACS side.</para>
///
/// <para>Identity is the 3-tuple <c>(CountyId, ArcGisObjectId,
/// LoadBatchId)</c>. <c>ArcGisObjectId</c> is the FeatureService
/// OBJECTID — stable per service, not stable across services.
/// Multiple landings of the same OBJECTID across batches yield
/// distinct rows; the truth-promotion (D2) layer collapses them
/// to latest-per-(CountyId, ArcGisObjectId).</para>
///
/// <para><see cref="GeomWkt"/> stores the polygon as Well-Known
/// Text in WGS84 (SRID 4326). Phase-1 design intentionally
/// avoids PostGIS-native geometry (per the locked Block D
/// non-goal in the v1 doctrine). Centroid + area are
/// pre-computed at landing time so D3 / D4 read-models can
/// skip spatial library work.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/>
/// + <see cref="SourceQueryHash"/> + <see cref="SourceRowHash"/>
/// on every landed row, with <c>LoadBatch.SourceFamily =
/// SourceFamilies.ArcGisRest</c>.</para>
/// </summary>
public sealed class LegacyArcGisRawParcelGeom
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── Sovereign-county isolation ────────────────────────────────
    /// <summary>
    /// Required. ArcGIS OBJECTID is per-service — each county's
    /// FeatureService numbers its features independently. Cross-
    /// county uniqueness is on <c>(CountyId, ArcGisObjectId)</c>.
    /// </summary>
    public Guid CountyId { get; set; }

    // ── ArcGIS source identity ────────────────────────────────────
    /// <summary>
    /// FeatureService OBJECTID. Stable within a single service;
    /// the <c>(CountyId, ArcGisObjectId)</c> tuple is the natural
    /// per-feature identity.
    /// </summary>
    public long ArcGisObjectId { get; set; }

    /// <summary>
    /// County-readable parcel number (APN) from the ArcGIS feature
    /// attributes. Used at canonical projection (D3) as the
    /// crosswalk key against <c>tf_parcel.ParcelNumber</c>.
    /// Optional — some services don't carry an APN attribute, in
    /// which case D3 will quarantine the resulting canonical row.
    /// </summary>
    public string? ArcGisApn { get; set; }

    // ── Geometry payload ─────────────────────────────────────────
    /// <summary>
    /// Polygon as Well-Known Text. Required. Stored in WGS84
    /// (EPSG:4326). PostGIS-native geometry storage is deferred
    /// to a Phase-2 migration per
    /// <c>docs/pacs/block-d-execution-plan.md</c> §1.4.
    /// </summary>
    public string GeomWkt { get; set; } = string.Empty;

    /// <summary>Pre-computed centroid latitude (WGS84).</summary>
    public double CentroidLat { get; set; }

    /// <summary>Pre-computed centroid longitude (WGS84).</summary>
    public double CentroidLon { get; set; }

    /// <summary>
    /// Pre-computed polygon area in square feet. Sourced from
    /// the <c>Shape__Area</c> attribute when present in the
    /// FeatureService response; otherwise zero. Equal-area
    /// reprojection of WGS84 polygons client-side is out-of-
    /// scope for v1.
    /// </summary>
    public double AreaSqFt { get; set; }

    /// <summary>
    /// Full FeatureService URL this row was sourced from
    /// (e.g. <c>https://services.arcgis.com/.../Parcels/FeatureServer/0</c>).
    /// Recorded as provenance even though
    /// <see cref="LoadBatchId"/> already carries the same info via
    /// <c>load_batch.SourceFileOrDatabase</c>.
    /// </summary>
    public string SourceServiceUrl { get; set; } = string.Empty;

    // ── Provenance (non-negotiable per the doctrine) ──────────────
    /// <summary>
    /// FK-style pointer to <c>sync_bridge.load_batch.LoadBatchId</c>.
    /// Required. The corresponding batch carries
    /// <c>SourceFamily = SourceFamilies.ArcGisRest</c>.
    /// </summary>
    public Guid LoadBatchId { get; set; }

    /// <summary>
    /// Stable hash of the SELECT (or REST query URL + filters)
    /// that produced this row. Required.
    /// </summary>
    public string SourceQueryHash { get; set; } = string.Empty;

    /// <summary>
    /// Per-row content hash (SHA-256 truncated to 16 hex chars).
    /// Required. Lets D2 detect content changes across batches
    /// without parsing the WKT.
    /// </summary>
    public string SourceRowHash { get; set; } = string.Empty;

    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
