namespace TerraFusion.Core.Configuration;

/// <summary>
/// Slice D3: opt-in flag for the legacy
/// <c>TerraFusion.API.Services.ArcGisSyncService</c>
/// BackgroundService.
///
/// <para>The legacy service hardcodes a Benton County
/// FeatureServer URL, polls every 6 hours, and writes to
/// <c>GisParcelGeometries</c> — a table that lives outside the
/// 5-schema doctrine. As of v1.8 (Block-D close), the canonical
/// path is:
///
/// <code>
///   D1 ArcGisRawLandingService
///       ↓
///   legacy_arcgis_raw.parcel_geom
///       ↓
///   D2 ArcGisTruthPromotionService
///       ↓
///   truth_arcgis.parcel_geom_current
///       ↓
///   D3 ArcGisCanonicalProjector
///       ↓
///   gis_tf.tf_parcel_geom (+ source_xref TfEntityType="geom_parcel")
/// </code>
/// </para>
///
/// <para>The legacy service is preserved in code for rollback /
/// reference but is <b>NOT registered by default</b> after v1.8.
/// To re-enable for emergency rollback, set:
/// <code>
///   appsettings: "LegacyArcGisSync:Enabled": true
///   env var:     TF_ENABLE_LEGACY_ARCGIS_SYNC=true
/// </code>
/// Either flag opts the legacy hosted service back into the
/// container.</para>
///
/// <para>Per the user's "no broken windows / no parallel truth
/// paths" rule, the doctrine path is the only authority. The
/// legacy table (<c>GisParcelGeometries</c>) and BackgroundService
/// remain in source-control history so a future cleanup slice
/// can decommission them after confirming the doctrine path
/// covers all operator workflows.</para>
/// </summary>
public sealed class LegacyArcGisSyncOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "LegacyArcGisSync";

    /// <summary>
    /// When <c>true</c>, registers the legacy
    /// <c>TerraFusion.API.Services.ArcGisSyncService</c>
    /// BackgroundService. <c>false</c> by default per Block-D
    /// contract v1.8.
    /// </summary>
    public bool Enabled { get; set; } = false;
}
