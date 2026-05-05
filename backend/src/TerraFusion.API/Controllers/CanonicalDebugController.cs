using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Sync.PacsPropSuppAssoc;
using TerraFusion.Core.Sync.PacsSale;
using TerraFusion.Core.Sync.PacsSalePipeline;
using TerraFusion.Data;
using TerraFusion.Data.Services.PacsSources;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-POP-2 debug + diagnostic surface. Active in Development only;
/// guarded write/destructive endpoints additionally require the
/// <c>ALLOW_DESTRUCTIVE_DEBUG</c> env var. See
/// <c>docs/sync/sync-pop-2-findings.md</c> for the arc this controller
/// supports.
///
/// Endpoint posture:
///   GET  canonical-counts                — read-only, safe in any env
///   GET  sync-pop-2/pacs-table-columns   — read-only INFORMATION_SCHEMA query
///   POST sync-pop-2/run-chain            — proof-run; writes legacy_pacs_raw
///   POST sync-pop-2/truncate-raw-landing — DESTRUCTIVE, env-guarded
///
/// The doctrine-clean alternative for production landing is the existing
/// <c>POST /api/sync/sales/run</c> (S2-B + S3); this controller exists
/// purely for the SYNC-POP-2 proof and ongoing diagnostic work until
/// the proper operator UI lands.
/// </summary>
[ApiController]
[Route("api/debug")]
[AllowAnonymous]
public class CanonicalDebugController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<CanonicalDebugController> _logger;

    public CanonicalDebugController(TerraFusionDbContext db, ILogger<CanonicalDebugController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("canonical-counts")]
    public async Task<IActionResult> GetCanonicalCounts()
    {
        try
        {
            var canonicalTf = new
            {
                tfParcels = await _db.TfParcels.CountAsync(),
                tfSales = await _db.TfSales.CountAsync(),
                tfOwners = await _db.TfOwners.CountAsync(),
                tfParcelOwnerLinks = await _db.TfParcelOwnerLinks.CountAsync(),
                tfAssessmentWsdor = await _db.TfAssessmentWsdors.CountAsync(),
                tfImprovements = await _db.TfImprovements.CountAsync(),
                tfImprovementFeatures = await _db.TfImprovementFeatures.CountAsync(),
                tfLands = await _db.TfLands.CountAsync(),
                dictNeighborhoods = await _db.DictNeighborhoods.CountAsync(),
                attributeDefinitions = await _db.AttributeDefinitions.CountAsync(),
            };

            var gisTf = new
            {
                tfParcelGeoms = await _db.TfParcelGeoms.CountAsync(),
            };

            var truthPacs = new
            {
                truthPacsSales = await _db.TruthPacsSales.CountAsync(),
                truthPacsOwnerCurrents = await _db.TruthPacsOwnerCurrents.CountAsync(),
                truthPacsWashPropOwnerVals = await _db.TruthPacsWashPropOwnerVals.CountAsync(),
                truthPacsImprvCurrents = await _db.TruthPacsImprvCurrents.CountAsync(),
                truthPacsLandCurrents = await _db.TruthPacsLandCurrents.CountAsync(),
            };

            var truthArcGis = new
            {
                truthArcGisParcelGeomCurrents = await _db.TruthArcGisParcelGeomCurrents.CountAsync(),
            };

            var legacyPacsRaw = new
            {
                legacyPacsRawSales = await _db.LegacyPacsRawSales.CountAsync(),
                legacyPacsRawAccounts = await _db.LegacyPacsRawAccounts.CountAsync(),
                legacyPacsRawOwners = await _db.LegacyPacsRawOwners.CountAsync(),
                legacyPacsRawImprvs = await _db.LegacyPacsRawImprvs.CountAsync(),
            };

            var operatorWorkbench = new
            {
                comparableSales = await _db.ComparableSales.CountAsync(),
                canonicalSaleQualifications = await _db.CanonicalSaleQualifications.CountAsync(),
                properties = await _db.Properties.CountAsync(),
                counties = await _db.Counties.CountAsync(),
            };

            return Ok(new
            {
                timestamp = DateTime.UtcNow,
                canonicalTf,
                gisTf,
                truthPacs,
                truthArcGis,
                legacyPacsRaw,
                operatorWorkbench,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute canonical counts");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <summary>
    /// SYNC-POP-2: drains live Harris PACS into the doctrine pipeline.
    /// Runs S1 (sales → legacy_pacs_raw.sale), S2-A (prop_supp_assoc →
    /// legacy_pacs_raw.prop_supp_assoc), S2-B (truth_pacs.sale promotion)
    /// and S3 (canonical_tf.tf_sale projection) as one chain.
    ///
    /// <para>Uses <c>ConnectionStrings:PacsConnection</c> for the SQL
    /// Server source. Operator name from the request body, defaults to
    /// <c>"sync-pop-2-debug"</c>. Returns the per-stage outcomes.</para>
    ///
    /// <para>Temporary debug surface; remove or convert to a permanent
    /// ops endpoint once the population path is verified.</para>
    /// </summary>
    [HttpPost("sync-pop-2/run-chain")]
    public async Task<IActionResult> RunSyncPop2(
        [FromServices] IPacsSaleLandingService saleSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsSaleSyncRunner runner,
        [FromServices] IConfiguration config,
        [FromBody] SyncPop2Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
        {
            return StatusCode(500, new
            {
                error = "ConnectionStrings:PacsConnection is required for SYNC-POP-2.",
                hint  = "Set TF_DEV_PACS_PASSWORD env var and ensure pacs_oltp is reachable on localhost,1433.",
            });
        }

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "sync-pop-2-debug"
            : request.OperatorName.Trim();

        try
        {
            _logger.LogInformation("[SyncPop2] Starting full S1 → S2-A → S2-B → S3 chain. operator={Op}", operatorName);

            // ── S1: PACS sales → legacy_pacs_raw.sale ─────────────────
            var saleSrc = new SqlServerPacsSaleSource(pacsCs, topN: request?.TopN);
            _logger.LogInformation("[SyncPop2] S1 LandSalesAsync starting from {Db}", saleSrc.SourceFileOrDatabase);
            var s1 = await saleSvc.LandSalesAsync(saleSrc, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop2] S1 status={Status} rowsLanded={Rows} batchId={Batch}",
                s1.Status, s1.RowsLanded, s1.LoadBatchId);

            if (!string.Equals(s1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new
                {
                    stage = "S1",
                    status = s1.Status,
                    rowsLanded = s1.RowsLanded,
                    error = s1.ErrorSummary,
                });
            }

            // ── S2-A: PACS prop_supp_assoc → legacy_pacs_raw.prop_supp_assoc
            // Use the dedicated SuppTopN if caller specified one, else
            // null (full drain post-2018) — needed so the truth-promotion
            // gate can resolve every (PropId, PropValYr) the sale batch
            // references.
            var assocSrc = new SqlServerPacsPropSuppAssocSource(pacsCs, topN: request?.SuppTopN);
            _logger.LogInformation("[SyncPop2] S2-A LandPropSuppAssocsAsync starting");
            var s2a = await assocSvc.LandPropSuppAssocsAsync(assocSrc, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop2] S2-A status={Status} rowsLanded={Rows} batchId={Batch}",
                s2a.Status, s2a.RowsLanded, s2a.LoadBatchId);

            if (!string.Equals(s2a.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new
                {
                    stage = "S2-A",
                    status = s2a.Status,
                    rowsLanded = s2a.RowsLanded,
                    error = s2a.ErrorSummary,
                    s1Result = s1,
                });
            }

            // ── S2-B + S3: truth promotion + canonical projection ────
            _logger.LogInformation("[SyncPop2] S2-B + S3 RunAsync chaining {Sale} + {Assoc}", s1.LoadBatchId, s2a.LoadBatchId);
            var chain = await runner.RunAsync(s1.LoadBatchId, s2a.LoadBatchId, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop2] S2-B+S3 status={Status} truthBatch={Truth} canonicalBatch={Canonical} promoted={Promoted} projected={Projected}",
                chain.Status, chain.TruthPromotionLoadBatchId, chain.CanonicalPromotionLoadBatchId,
                chain.SalesPromoted, chain.SalesProjected);

            return Ok(new
            {
                operatorName,
                s1 = new { s1.Status, s1.LoadBatchId, s1.RowsLanded, s1.StaleCodeViolations, s1.Pre2018Count, s1.Post2018Count, s1.UnknownDateCount },
                s2a = new { s2a.Status, s2a.LoadBatchId, s2a.RowsLanded, s2a.DuplicateKeyViolations, s2a.DistinctYears },
                chain = new
                {
                    chain.Status,
                    chain.TruthPromotionLoadBatchId,
                    chain.CanonicalPromotionLoadBatchId,
                    chain.SalesPromoted,
                    chain.SalesProjected,
                    chain.SalesQuarantined,
                },
                next = "Curl /api/debug/canonical-counts to verify non-zero rows in legacy_pacs_raw.sale, truth_pacs.sale, canonical_tf.tf_sale.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SyncPop2] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor on the load batch.</param>
    /// <param name="TopN">Sale row cap for proof runs. null = full drain.</param>
    /// <param name="SuppTopN">PropSuppAssoc row cap. null = full drain
    /// (recommended even with bounded TopN — the supp index must cover
    /// every (prop_id, prop_val_yr) tuple the sale batch references for
    /// the truth-promotion gate to find matches).</param>
    public sealed record SyncPop2Request(string? OperatorName, int? TopN, int? SuppTopN);

    /// <summary>
    /// SYNC-POP-2 helper: introspects a Harris PACS source table to see
    /// which columns actually exist. Used to reconcile doctrine fixture
    /// assumptions against real PACS schema.
    /// </summary>
    [HttpGet("sync-pop-2/pacs-table-columns")]
    public async Task<IActionResult> PacsTableColumns(
        [FromQuery] string table,
        [FromServices] IConfiguration config,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "PacsConnection missing." });
        if (string.IsNullOrWhiteSpace(table) || !System.Text.RegularExpressions.Regex.IsMatch(table, "^[a-zA-Z_][a-zA-Z0-9_]*$"))
            return BadRequest(new { error = "table must be a simple identifier." });

        var sql = @"
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @t
            ORDER BY ORDINAL_POSITION";
        try
        {
            await using var conn = new Microsoft.Data.SqlClient.SqlConnection(pacsCs);
            await conn.OpenAsync(cancellationToken);
            await using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@t", table);
            var cols = new List<object>();
            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await rdr.ReadAsync(cancellationToken))
            {
                cols.Add(new
                {
                    name = rdr.GetString(0),
                    type = rdr.GetString(1),
                    maxLength = rdr.IsDBNull(2) ? (int?)null : rdr.GetInt32(2),
                    nullable = rdr.GetString(3),
                });
            }
            return Ok(new { table = $"dbo.{table}", columns = cols });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <summary>
    /// SYNC-POP-2 proof-run helper: TRUNCATES legacy_pacs_raw.sale and
    /// related batch / gate-result tables for a clean re-run. ENV-GUARDED:
    /// requires <c>ALLOW_DESTRUCTIVE_DEBUG=true</c>. Returns 403 otherwise.
    ///
    /// <para>Doctrine: this is a strictly destructive surface used during
    /// SYNC-POP-* proof iterations. Once the operator UI lands its own
    /// "reset / re-land batch" flow, remove this endpoint entirely. Do
    /// NOT enable the env var in any environment whose data the doctrine
    /// considers authoritative.</para>
    /// </summary>
    [HttpPost("sync-pop-2/truncate-raw-landing")]
    public async Task<IActionResult> TruncateRawLanding(CancellationToken cancellationToken = default)
    {
        if (!string.Equals(
            Environment.GetEnvironmentVariable("ALLOW_DESTRUCTIVE_DEBUG"),
            "true", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403, new
            {
                error = "Destructive debug endpoint disabled.",
                hint  = "Set ALLOW_DESTRUCTIVE_DEBUG=true in the running process env to enable.",
            });
        }

        const string sql = @"
            TRUNCATE TABLE
              legacy_pacs_raw.sale,
              legacy_pacs_raw.prop_supp_assoc,
              sync_bridge.load_batch,
              sync_bridge.promotion_gate_result
            RESTART IDENTITY CASCADE;";
        try
        {
            await _db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            _logger.LogWarning("[SyncPop2] DESTRUCTIVE: truncated legacy_pacs_raw + sync_bridge tables (env-guarded).");
            return Ok(new { applied = true, message = "Truncated legacy_pacs_raw.sale, prop_supp_assoc, sync_bridge.load_batch, promotion_gate_result." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Truncate failed");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    // SYNC-POP-2 finding #6 schema widening (SlCountyRatioCd→10, WacCd→32)
    // is now applied via the proper EF migration
    // 20260504_WidenLegacyPacsRawSaleCodeColumns. The one-shot HTTP helper
    // that was here during the proof run has been retired.
}
