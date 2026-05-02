using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Slice G1-B: closed vocabulary for
/// <see cref="LoadBatch.SourceFamily"/>.
///
/// <para>The doctrine treats <c>SourceFamily</c> as a closed enum stored
/// as varchar(64) for forward-compatibility. Values are defined here as
/// <c>const string</c> so consumers reference them by name rather than
/// by literal — typos become compile errors instead of bad data.</para>
///
/// <para>Adding a new family is intentionally a code change: the
/// vocabulary must be reviewed against the provenance doctrine before
/// it lands in <c>load_batch.source_family</c>. There is no runtime
/// extensibility hook by design.</para>
/// </summary>
public static class SourceFamilies
{
    // ── PACS family (operator-of-record source)─────────────────────
    /// <summary>Live PACS OLTP database — primary source of truth.</summary>
    public const string PacsOltp = "PACS_OLTP";

    /// <summary>PACS backup restore (e.g. nightly .bak file).</summary>
    public const string PacsBackup = "PACS_BACKUP";

    /// <summary>CamaCloud cloud-sync mirror of PACS_OLTP.</summary>
    public const string CamaCloud = "CAMACLOUD";

    /// <summary>PACS spatial-data attachments (separate from polygons).</summary>
    public const string PacsSpatial = "PACS_SPATIAL";

    /// <summary>PACS list/lookup loader source (CSV/Excel imports).</summary>
    public const string PacsLists = "PACS_LISTS";

    /// <summary>PACS schema-as-code from the SQL Server Database Project.</summary>
    public const string PacsDbProject = "PACS_DBPROJECT";

    /// <summary>PACS Sync Service operational database (CamaCloud bridge).</summary>
    public const string PacsSyncServiceDb = "PACS_SYNCSERVICE_DB";

    /// <summary>Public-access read-mirror of PACS (web_internet_benton).</summary>
    public const string WebInternetBenton = "WEB_INTERNET_BENTON";

    // ── Adjacent Tyler-family / county systems ─────────────────────
    /// <summary>TA AppSvr — secondary Tyler-family system at Benton.</summary>
    public const string TaAppSvr = "TAAPPSVR";

    /// <summary>ProVal historical valuation conversion footnote.</summary>
    public const string ProVal = "PROVAL";

    /// <summary>Ascend historical tax conversion footnote.</summary>
    public const string Ascend = "ASCEND";

    /// <summary>CIAPS — county integration / appraiser portal.</summary>
    public const string Ciaps = "CIAPS";

    /// <summary>Benton DynLoader — third-party building-permit import.</summary>
    public const string BentonDynLoader = "BENTON_DYNLOADER";

    // ── GIS family (Slice G1-B) ────────────────────────────────────
    /// <summary>
    /// ArcGIS REST feature service — county parcel polygons.
    /// Per <c>docs/plans/terrafusion-90-day-execution-plan.md</c> §4
    /// (Block D / GIS sub-block): no shapefile parsing, ArcGIS REST is
    /// the locked source of geometric truth.
    /// </summary>
    public const string ArcGisRest = "ARCGIS_REST";

    // ── Catch-alls ─────────────────────────────────────────────────
    /// <summary>Pre-doctrine legacy data with unknown lineage.</summary>
    public const string LegacyUnknown = "LEGACY_UNKNOWN";

    /// <summary>
    /// All currently-recognized source family values. Any value
    /// outside this set is a doctrine violation when written to
    /// <see cref="LoadBatch.SourceFamily"/>.
    /// </summary>
    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        PacsOltp,
        PacsBackup,
        CamaCloud,
        PacsSpatial,
        PacsLists,
        PacsDbProject,
        PacsSyncServiceDb,
        WebInternetBenton,
        TaAppSvr,
        ProVal,
        Ascend,
        Ciaps,
        BentonDynLoader,
        ArcGisRest,
        LegacyUnknown,
    };

    /// <summary>
    /// True iff <paramref name="value"/> is a recognized source family.
    /// Use at the boundary of any code that writes to
    /// <see cref="LoadBatch.SourceFamily"/>.
    /// </summary>
    public static bool IsKnown(string value) =>
        !string.IsNullOrEmpty(value) && All.Contains(value);
}
