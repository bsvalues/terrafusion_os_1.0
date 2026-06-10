using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Corpus;

namespace TerraFusion.Data.Services.Workbench.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: queries PACS / ArcGIS for the per-lane baseline
/// row count and TerraFusion canonical for the matching count.
///
/// <para>The PACS-side queries mirror the same row population each
/// lane drains:</para>
/// <list type="bullet">
///   <item><b>parcel</b>: distinct <c>prop_id</c> from
///   <c>dbo.property</c> joined to <c>dbo.property_val</c> at the
///   working year, filtered <c>prop_type_cd='R'</c>. The truth
///   promoter only keeps R-typed parcels with a working-year
///   <c>property_val</c> row, so the baseline must mirror that
///   doctrine (a historical R-typed prop_id without a working-year
///   property_val row is not a spine candidate).</item>
///   <item><b>owner-wsdor</b>: distinct <c>owner_id</c> from
///   <c>dbo.owner</c> + WPOV count for the working year. We aggregate
///   into one count: <c>distinct owner_id + wash_prop_owner_val(@yr)</c>
///   to reconcile against canonical <c>tf_owner + tf_assessment_wsdor</c>.</item>
///   <item><b>improvement</b>: <c>dbo.imprv</c> filtered by
///   <c>prop_val_yr=@yr</c>.</item>
///   <item><b>land</b>: <c>dbo.land_detail</c> joined to
///   <c>dbo.property</c> and <c>dbo.property_val</c>, filtered
///   <c>prop_type_cd='R' AND ld.sup_num=0 AND pv.prop_val_yr=@yr</c>.
///   The land drain only lands sup_num=0 segments tied to working-year
///   R-typed spine parcels, so the baseline mirrors that population
///   rather than counting every <c>land_detail</c> row at
///   <c>prop_val_yr=@yr</c>.</item>
///   <item><b>sales</b>: <c>dbo.sale</c> doctrine-qualified count
///   (<c>sl_county_ratio_cd IN ('100','0') OR sl_ratio_type_cd='00'</c>)
///   per the SYNC-DOCTRINE-3 seal.</item>
///   <item><b>geometry</b>: ArcGIS feature service
///   <c>?where=1=1&amp;returnCountOnly=true</c> against
///   <c>ArcGis:FeatureServiceUrl</c>.</item>
/// </list>
///
/// <para>Failures are <i>diagnostic, not fatal</i>: PACS unreachable
/// or ArcGIS misconfigured returns <c>Outcome=Unreachable</c> with
/// <c>Notes</c>; the orchestrator records that as <c>Investigate</c>
/// instead of throwing.</para>
///
/// <para>SYNC-COMPLETE-2-RECONCILIATION-POLICY-FIX (2026-05-11):
/// parcel + land queries swapped to the doctrine-filtered joined form.
/// See <see cref="CorpusReconciliationPolicy"/> for the policy-side
/// rationale.</para>
/// </summary>
public sealed class PacsBaselineReconciler : IPacsBaselineReconciler
{
    private const int CommandTimeoutSec = 600;

    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory? _httpClientFactory;
    private readonly ILogger<PacsBaselineReconciler> _logger;

    public PacsBaselineReconciler(
        TerraFusionDbContext db,
        IConfiguration configuration,
        ILogger<PacsBaselineReconciler> logger,
        IHttpClientFactory? httpClientFactory = null)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(logger);
        _db = db;
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<PacsBaselineResult> QueryAsync(
        string lane,
        short workingYear,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(lane))
            return new PacsBaselineResult(PacsBaselineOutcome.UnknownLane, 0,
                "Lane name is required.");

        // Geometry uses ArcGIS, not PACS.
        if (string.Equals(lane, CorpusReconciliationPolicy.LaneGeometry, StringComparison.OrdinalIgnoreCase))
            return await QueryArcGisCountAsync(cancellationToken).ConfigureAwait(false);

        var pacsCs = _configuration.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return new PacsBaselineResult(PacsBaselineOutcome.Unreachable, 0,
                "ConnectionStrings:PacsConnection is not configured.");

        try
        {
            return lane switch
            {
                CorpusReconciliationPolicy.LaneParcel =>
                    await QueryParcelAsync(pacsCs, workingYear, cancellationToken).ConfigureAwait(false),
                CorpusReconciliationPolicy.LaneOwnerWsdor =>
                    await QueryOwnerWsdorAsync(pacsCs, workingYear, cancellationToken).ConfigureAwait(false),
                CorpusReconciliationPolicy.LaneImprovement =>
                    await QueryImprovementAsync(pacsCs, workingYear, cancellationToken).ConfigureAwait(false),
                CorpusReconciliationPolicy.LaneLand =>
                    await QueryLandAsync(pacsCs, workingYear, cancellationToken).ConfigureAwait(false),
                CorpusReconciliationPolicy.LaneSales =>
                    await QuerySalesAsync(pacsCs, cancellationToken).ConfigureAwait(false),
                _ => new PacsBaselineResult(PacsBaselineOutcome.UnknownLane, 0,
                    $"Unknown lane: '{lane}'."),
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "PacsBaselineReconciler: lane={Lane} query failed; recording Unreachable.", lane);
            return new PacsBaselineResult(PacsBaselineOutcome.Unreachable, 0,
                $"PACS query failed: {ex.GetType().Name}: {ex.Message}");
        }
    }

    public async Task<long> CountTfCanonicalAsync(
        string lane,
        short workingYear,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(lane)) return 0L;

        return lane switch
        {
            CorpusReconciliationPolicy.LaneParcel =>
                await _db.TfParcels.CountAsync(cancellationToken).ConfigureAwait(false),

            // owner+wsdor aggregation: tf_owner deduped count + tf_assessment_wsdor for year.
            CorpusReconciliationPolicy.LaneOwnerWsdor =>
                await _db.TfOwners.CountAsync(cancellationToken).ConfigureAwait(false)
                + await _db.TfAssessmentWsdors
                    .Where(w => w.AssessmentYear == workingYear)
                    .CountAsync(cancellationToken).ConfigureAwait(false),

            CorpusReconciliationPolicy.LaneImprovement =>
                await _db.TfImprovements.CountAsync(cancellationToken).ConfigureAwait(false),

            CorpusReconciliationPolicy.LaneLand =>
                await _db.TfLands.CountAsync(cancellationToken).ConfigureAwait(false),

            CorpusReconciliationPolicy.LaneSales =>
                await _db.TfSales
                    .Where(s => s.DorRatioQualified || s.CountyRatioQualified)
                    .CountAsync(cancellationToken).ConfigureAwait(false),

            CorpusReconciliationPolicy.LaneGeometry =>
                await _db.TfParcelGeoms.CountAsync(cancellationToken).ConfigureAwait(false),

            _ => 0L,
        };
    }

    // ── PACS queries (per lane) ─────────────────────────────────────

    /// <summary>
    /// Parcel lane reconciles against the doctrine-filtered spine
    /// population: distinct <c>prop_id</c> across <c>dbo.property</c>
    /// inner-joined to <c>dbo.property_val</c> at the working year,
    /// filtered <c>prop_type_cd='R'</c>. This matches the row
    /// population the parcel-spine truth promoter actually lands —
    /// historical R-typed prop_ids without a working-year property_val
    /// row are correctly excluded by the promoter.
    /// </summary>
    private async Task<PacsBaselineResult> QueryParcelAsync(string cs, short yr, CancellationToken ct)
    {
        const string sql =
            "SELECT COUNT(DISTINCT p.prop_id) FROM dbo.property p " +
            "INNER JOIN dbo.property_val pv ON p.prop_id = pv.prop_id " +
            "WHERE p.prop_type_cd = 'R' AND pv.prop_val_yr = @yr";
        var count = await ExecuteScalarLongAsync(
            cs, sql, ct, ("@yr", (object)(int)yr)).ConfigureAwait(false);
        return new PacsBaselineResult(
            PacsBaselineOutcome.Ok, count,
            $"Doctrine-filtered: distinct prop_id where prop_type_cd='R' AND " +
            $"property_val(@yr={yr}) exists. Compared against tf_parcel.");
    }

    /// <summary>
    /// Owner-WSDOR aggregation: distinct owner_id (deduped owner
    /// canonical) plus wash_prop_owner_val rows for the working year
    /// (WSDOR canonical population). One number compared to
    /// <c>tf_owner.Count + tf_assessment_wsdor(@yr).Count</c>.
    /// </summary>
    private async Task<PacsBaselineResult> QueryOwnerWsdorAsync(string cs, short yr, CancellationToken ct)
    {
        var ownerSql =
            "SELECT COUNT(DISTINCT owner_id) FROM dbo.owner " +
            "WHERE sup_num = 0 AND owner_tax_yr >= 2018";
        var ownerCount = await ExecuteScalarLongAsync(cs, ownerSql, ct).ConfigureAwait(false);

        var wpovSql = "SELECT COUNT(*) FROM dbo.wash_prop_owner_val WHERE prop_val_yr = @yr";
        var wpovCount = await ExecuteScalarLongAsync(
            cs, wpovSql, ct, ("@yr", (object)(int)yr)).ConfigureAwait(false);

        var total = ownerCount + wpovCount;
        return new PacsBaselineResult(
            PacsBaselineOutcome.Ok, total,
            $"Aggregated: distinct owner_id ({ownerCount}) + wash_prop_owner_val(@yr={yr}) ({wpovCount}). " +
            "Compared against tf_owner + tf_assessment_wsdor(@yr).");
    }

    private async Task<PacsBaselineResult> QueryImprovementAsync(string cs, short yr, CancellationToken ct)
    {
        const string sql = "SELECT COUNT(*) FROM dbo.imprv WHERE prop_val_yr = @yr";
        var count = await ExecuteScalarLongAsync(cs, sql, ct, ("@yr", (object)(int)yr)).ConfigureAwait(false);
        return new PacsBaselineResult(PacsBaselineOutcome.Ok, count, null);
    }

    /// <summary>
    /// Land lane reconciles against the doctrine-filtered land
    /// population: <c>dbo.land_detail</c> joined to <c>dbo.property</c>
    /// + <c>dbo.property_val</c>, filtered
    /// <c>p.prop_type_cd='R' AND ld.sup_num=0 AND pv.prop_val_yr=@yr</c>.
    /// The land drain only lands sup_num=0 segments tied to working-year
    /// R-typed spine parcels, so the baseline mirrors that population
    /// rather than counting every <c>land_detail</c> row at
    /// <c>prop_val_yr=@yr</c>.
    /// </summary>
    private async Task<PacsBaselineResult> QueryLandAsync(string cs, short yr, CancellationToken ct)
    {
        const string sql =
            "SELECT COUNT(*) FROM dbo.land_detail ld " +
            "INNER JOIN dbo.property p ON p.prop_id = ld.prop_id " +
            "INNER JOIN dbo.property_val pv " +
            "  ON pv.prop_id = ld.prop_id AND pv.prop_val_yr = ld.prop_val_yr " +
            "WHERE p.prop_type_cd = 'R' AND ld.sup_num = 0 AND pv.prop_val_yr = @yr";
        var count = await ExecuteScalarLongAsync(
            cs, sql, ct, ("@yr", (object)(int)yr)).ConfigureAwait(false);
        return new PacsBaselineResult(
            PacsBaselineOutcome.Ok, count,
            $"Doctrine-filtered: land_detail rows where prop_type_cd='R' AND " +
            $"sup_num=0 AND prop_val_yr={yr}. Compared against tf_land.");
    }

    /// <summary>
    /// Sales doctrine-qualified count per SYNC-DOCTRINE-3:
    /// <c>sl_county_ratio_cd IN ('100','0') OR sl_ratio_type_cd='00'</c>.
    /// </summary>
    private async Task<PacsBaselineResult> QuerySalesAsync(string cs, CancellationToken ct)
    {
        const string sql =
            "SELECT COUNT(*) FROM dbo.sale " +
            "WHERE sl_county_ratio_cd IN ('100','0') OR sl_ratio_type_cd = '00'";
        var count = await ExecuteScalarLongAsync(cs, sql, ct).ConfigureAwait(false);
        return new PacsBaselineResult(PacsBaselineOutcome.Ok, count, null);
    }

    private async Task<PacsBaselineResult> QueryArcGisCountAsync(CancellationToken ct)
    {
        var url = _configuration["ArcGis:FeatureServiceUrl"];
        if (string.IsNullOrWhiteSpace(url))
            return new PacsBaselineResult(PacsBaselineOutcome.Unreachable, 0,
                "ArcGis:FeatureServiceUrl is not configured; cannot reconcile geometry lane.");

        if (_httpClientFactory is null)
            return new PacsBaselineResult(PacsBaselineOutcome.Unreachable, 0,
                "IHttpClientFactory is not registered; cannot reach ArcGIS feature service.");

        try
        {
            var queryUrl = url.TrimEnd('/') + "/query?where=1%3D1&returnCountOnly=true&f=json";
            using var http = _httpClientFactory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(60);
            var response = await http.GetAsync(queryUrl, ct).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("count", out var countEl) &&
                countEl.TryGetInt64(out var cnt))
            {
                return new PacsBaselineResult(PacsBaselineOutcome.Ok, cnt, null);
            }
            return new PacsBaselineResult(PacsBaselineOutcome.Unreachable, 0,
                "ArcGIS feature service response did not contain a numeric 'count' property.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "PacsBaselineReconciler: ArcGIS feature service unreachable.");
            return new PacsBaselineResult(PacsBaselineOutcome.Unreachable, 0,
                $"ArcGIS feature service unreachable: {ex.GetType().Name}: {ex.Message}");
        }
    }

    // ── Scalar helper ───────────────────────────────────────────────

    private static async Task<long> ExecuteScalarLongAsync(
        string cs,
        string sql,
        CancellationToken ct,
        params (string Name, object Value)[] parameters)
    {
        await using var conn = new SqlConnection(cs);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = CommandTimeoutSec };
        foreach (var (name, value) in parameters)
            cmd.Parameters.AddWithValue(name, value);
        var raw = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return raw switch
        {
            null => 0L,
            DBNull => 0L,
            long l => l,
            int i => i,
            decimal d => (long)d,
            _ => Convert.ToInt64(raw),
        };
    }
}
