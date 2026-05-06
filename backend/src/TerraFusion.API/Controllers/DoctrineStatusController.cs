using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Operator-facing read-only doctrine status surface.
///
/// <para>Aggregates the data the operator dashboard needs to render
/// the doctrine pipeline's state at any point in time:
/// <list type="bullet">
///   <item>Per-table canonical counts (the "what's in the system" pane)</item>
///   <item>Per-lane last-completed-batch timestamps (the "freshness" pane)</item>
///   <item>Recent gate failures (the "what's broken" pane)</item>
///   <item>Quarantine totals (the "what's preserved-but-unresolved" pane)</item>
/// </list>
/// </para>
///
/// <para>This is a read-only endpoint — no canonical state changes.
/// Intended to be polled by the operator dashboard at a low cadence
/// (e.g. every 30s) and rendered as a live status board. Distinct
/// from the closure trigger endpoints under <c>/api/debug/*</c>.</para>
/// </summary>
[ApiController]
[Route("api/sync/doctrine")]
[AllowAnonymous]
public class DoctrineStatusController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrineStatusController> _logger;

    public DoctrineStatusController(TerraFusionDbContext db, ILogger<DoctrineStatusController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Single-call doctrine state snapshot. Returns canonical counts,
    /// per-lane last-completed-batch info, recent gate failures, and
    /// quarantine totals.
    /// </summary>
    [HttpGet("state")]
    public async Task<IActionResult> GetDoctrineState(
        [FromQuery] int recentGateLimit = 25,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // ── Canonical counts (one row per terminal-canonical table). ──
            var canonical = new
            {
                tf_parcel = await _db.TfParcels.CountAsync(cancellationToken),
                tf_sale = await _db.TfSales.CountAsync(cancellationToken),
                tf_owner = await _db.TfOwners.CountAsync(cancellationToken),
                tf_parcel_owner_link = await _db.TfParcelOwnerLinks.CountAsync(cancellationToken),
                tf_assessment_wsdor = await _db.TfAssessmentWsdors.CountAsync(cancellationToken),
                tf_improvement = await _db.TfImprovements.CountAsync(cancellationToken),
                tf_improvement_feature = await _db.TfImprovementFeatures.CountAsync(cancellationToken),
                tf_land = await _db.TfLands.CountAsync(cancellationToken),
                tf_parcel_geom = await _db.TfParcelGeoms.CountAsync(cancellationToken),
            };

            // ── Truth and raw counts (the audit substrate). ──
            var truth = new
            {
                truth_pacs_sale = await _db.TruthPacsSales.CountAsync(cancellationToken),
                truth_pacs_parcel_spine = await _db.TruthPacsParcelSpines.CountAsync(cancellationToken),
                truth_pacs_owner_current = await _db.TruthPacsOwnerCurrents.CountAsync(cancellationToken),
                truth_pacs_wash_prop_owner_val = await _db.TruthPacsWashPropOwnerVals.CountAsync(cancellationToken),
                truth_pacs_imprv_current = await _db.TruthPacsImprvCurrents.CountAsync(cancellationToken),
                truth_pacs_land_current = await _db.TruthPacsLandCurrents.CountAsync(cancellationToken),
            };

            var raw = new
            {
                legacy_pacs_raw_sale = await _db.LegacyPacsRawSales.CountAsync(cancellationToken),
                legacy_pacs_raw_property = await _db.LegacyPacsRawProperties.CountAsync(cancellationToken),
                legacy_pacs_raw_prop_supp_assoc = await _db.LegacyPacsRawPropSuppAssocs.CountAsync(cancellationToken),
                legacy_pacs_raw_account = await _db.LegacyPacsRawAccounts.CountAsync(cancellationToken),
                legacy_pacs_raw_owner = await _db.LegacyPacsRawOwners.CountAsync(cancellationToken),
                legacy_pacs_raw_wash_prop_owner_val = await _db.LegacyPacsRawWashPropOwnerVals.CountAsync(cancellationToken),
                legacy_pacs_raw_imprv = await _db.LegacyPacsRawImprvs.CountAsync(cancellationToken),
                legacy_pacs_raw_imprv_detail = await _db.LegacyPacsRawImprvDetails.CountAsync(cancellationToken),
                legacy_pacs_raw_imprv_attr = await _db.LegacyPacsRawImprvAttrs.CountAsync(cancellationToken),
                legacy_pacs_raw_land_detail = await _db.LegacyPacsRawLandDetails.CountAsync(cancellationToken),
            };

            // ── Quarantine totals (the "preserved but unresolved" surface). ──
            var quarantine = new
            {
                legacy_tf_unproven_sale = await _db.LegacyTfUnprovenSales.CountAsync(cancellationToken),
                legacy_tf_unproven_owner_current = await _db.LegacyTfUnprovenOwnerCurrents.CountAsync(cancellationToken),
                legacy_tf_unproven_wash_prop_owner_val = await _db.LegacyTfUnprovenWashPropOwnerVals.CountAsync(cancellationToken),
                legacy_tf_unproven_imprv_current = await _db.LegacyTfUnprovenImprvCurrents.CountAsync(cancellationToken),
                legacy_tf_unproven_imprv_attr = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(cancellationToken),
                legacy_tf_unproven_land_current = await _db.LegacyTfUnprovenLandCurrents.CountAsync(cancellationToken),
            };

            // ── Per-source-family last-completed batch (freshness signal). ──
            // Group on SourceSystem because that's the per-promoter/-projector
            // identifier; LoadBatch.Status="COMPLETED" filters out failed/in-progress.
            var lastCompleted = await _db.SyncBridgeLoadBatches
                .Where(b => b.Status == "COMPLETED" && b.CompletedAt != null)
                .GroupBy(b => b.SourceSystem)
                .Select(g => new
                {
                    sourceSystem = g.Key,
                    lastCompletedAt = g.Max(b => b.CompletedAt),
                    rowsExtracted = g.OrderByDescending(b => b.CompletedAt).Select(b => b.RowsExtracted).FirstOrDefault(),
                    rowsPromoted = g.OrderByDescending(b => b.CompletedAt).Select(b => b.RowsPromoted).FirstOrDefault(),
                })
                .ToListAsync(cancellationToken);

            // ── Aggregate batch outcomes (over all time). ──
            var batchOutcomeSummary = await _db.SyncBridgeLoadBatches
                .GroupBy(b => b.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync(cancellationToken);

            // ── Recent gate failures (the "what's broken" pane). ──
            // FAIL/WARN within the last N rows surfaces actionable issues.
            var recentGateFailures = await _db.SyncBridgePromotionGateResults
                .Where(g => g.Status == "FAIL" || g.Status == "WARN")
                .OrderByDescending(g => g.ExecutedAt)
                .Take(recentGateLimit)
                .Select(g => new
                {
                    g.LoadBatchId,
                    g.GateName,
                    g.GateStage,
                    g.Status,
                    g.Expected,
                    g.Actual,
                    g.Detail,
                    g.ExecutedAt,
                })
                .ToListAsync(cancellationToken);

            // ── Aggregate gate counts (PASS/FAIL/WARN totals across history). ──
            var gateOutcomeSummary = await _db.SyncBridgePromotionGateResults
                .GroupBy(g => g.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync(cancellationToken);

            // ── Counties bound to TerraFusion (the multi-county readout). ──
            var counties = await _db.Counties
                .Select(c => new { c.Id, c.Name, c.State, c.FipsCode })
                .ToListAsync(cancellationToken);

            // ── Verdict: is the doctrine pipeline operational right now? ──
            // Simple heuristic: every terminal canonical table has > 0 rows.
            var operational =
                canonical.tf_parcel > 0 &&
                canonical.tf_owner > 0 &&
                canonical.tf_assessment_wsdor > 0 &&
                canonical.tf_improvement > 0 &&
                canonical.tf_land > 0 &&
                canonical.tf_parcel_geom > 0;

            return Ok(new
            {
                snapshotAt = DateTime.UtcNow,
                operational,
                summary = new
                {
                    canonicalRowsTotal =
                        canonical.tf_parcel + canonical.tf_sale + canonical.tf_owner +
                        canonical.tf_parcel_owner_link + canonical.tf_assessment_wsdor +
                        canonical.tf_improvement + canonical.tf_improvement_feature +
                        canonical.tf_land + canonical.tf_parcel_geom,
                    quarantineRowsTotal =
                        quarantine.legacy_tf_unproven_sale +
                        quarantine.legacy_tf_unproven_owner_current +
                        quarantine.legacy_tf_unproven_wash_prop_owner_val +
                        quarantine.legacy_tf_unproven_imprv_current +
                        quarantine.legacy_tf_unproven_imprv_attr +
                        quarantine.legacy_tf_unproven_land_current,
                    countiesBound = counties.Count,
                },
                canonical,
                truth,
                raw,
                quarantine,
                lastCompleted,
                batchOutcomeSummary,
                gateOutcomeSummary,
                recentGateFailures,
                counties,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DoctrineStatus] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <summary>
    /// Per-batch detail drilldown. Returns the full LoadBatch row + all
    /// its gate results. Used by the operator UI when a row in the
    /// recent-gate-failures pane is clicked.
    /// </summary>
    [HttpGet("batch/{loadBatchId:guid}")]
    public async Task<IActionResult> GetBatchDetail(
        Guid loadBatchId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var batch = await _db.SyncBridgeLoadBatches
                .Where(b => b.LoadBatchId == loadBatchId)
                .Select(b => new
                {
                    b.LoadBatchId,
                    b.SourceFamily,
                    b.SourceSystem,
                    b.SourceFileOrDatabase,
                    b.SourceQueryHash,
                    b.Operator,
                    b.Status,
                    b.StartedAt,
                    b.CompletedAt,
                    b.RowsExtracted,
                    b.RowsPromoted,
                    b.ErrorSummary,
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (batch is null)
                return NotFound(new { error = $"LoadBatch {loadBatchId} not found." });

            var gates = await _db.SyncBridgePromotionGateResults
                .Where(g => g.LoadBatchId == loadBatchId)
                .OrderBy(g => g.ExecutedAt)
                .Select(g => new
                {
                    g.GateName,
                    g.GateStage,
                    g.Status,
                    g.Expected,
                    g.Actual,
                    g.Detail,
                    g.ExecutedAt,
                })
                .ToListAsync(cancellationToken);

            return Ok(new { batch, gates });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DoctrineStatus] Batch detail FAILED for {Id}", loadBatchId);
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <summary>
    /// Per-lane health summary. Light-weight read for dashboards that
    /// only need the per-lane row counts and freshness, not the full
    /// state snapshot.
    /// </summary>
    [HttpGet("lanes")]
    public async Task<IActionResult> GetLaneHealth(CancellationToken cancellationToken = default)
    {
        try
        {
            var lanes = new[]
            {
                new
                {
                    lane = "parcel",
                    canonicalCount = await _db.TfParcels.CountAsync(cancellationToken),
                    truthCount = await _db.TruthPacsParcelSpines.CountAsync(cancellationToken),
                    rawCount = await _db.LegacyPacsRawProperties.CountAsync(cancellationToken),
                    quarantineCount = 0,
                },
                new
                {
                    lane = "sale",
                    canonicalCount = await _db.TfSales.CountAsync(cancellationToken),
                    truthCount = await _db.TruthPacsSales.CountAsync(cancellationToken),
                    rawCount = await _db.LegacyPacsRawSales.CountAsync(cancellationToken),
                    quarantineCount = await _db.LegacyTfUnprovenSales.CountAsync(cancellationToken),
                },
                new
                {
                    lane = "owner",
                    canonicalCount = await _db.TfOwners.CountAsync(cancellationToken),
                    truthCount = await _db.TruthPacsOwnerCurrents.CountAsync(cancellationToken),
                    rawCount = await _db.LegacyPacsRawOwners.CountAsync(cancellationToken),
                    quarantineCount = await _db.LegacyTfUnprovenOwnerCurrents.CountAsync(cancellationToken),
                },
                new
                {
                    lane = "wsdor",
                    canonicalCount = await _db.TfAssessmentWsdors.CountAsync(cancellationToken),
                    truthCount = await _db.TruthPacsWashPropOwnerVals.CountAsync(cancellationToken),
                    rawCount = await _db.LegacyPacsRawWashPropOwnerVals.CountAsync(cancellationToken),
                    quarantineCount = await _db.LegacyTfUnprovenWashPropOwnerVals.CountAsync(cancellationToken),
                },
                new
                {
                    lane = "improvement",
                    canonicalCount = await _db.TfImprovements.CountAsync(cancellationToken),
                    truthCount = await _db.TruthPacsImprvCurrents.CountAsync(cancellationToken),
                    rawCount = await _db.LegacyPacsRawImprvs.CountAsync(cancellationToken),
                    quarantineCount = await _db.LegacyTfUnprovenImprvCurrents.CountAsync(cancellationToken),
                },
                new
                {
                    lane = "land",
                    canonicalCount = await _db.TfLands.CountAsync(cancellationToken),
                    truthCount = await _db.TruthPacsLandCurrents.CountAsync(cancellationToken),
                    rawCount = await _db.LegacyPacsRawLandDetails.CountAsync(cancellationToken),
                    quarantineCount = await _db.LegacyTfUnprovenLandCurrents.CountAsync(cancellationToken),
                },
                new
                {
                    lane = "geometry",
                    canonicalCount = await _db.TfParcelGeoms.CountAsync(cancellationToken),
                    truthCount = -1, // not tracked separately at query time
                    rawCount = -1,
                    quarantineCount = 0,
                },
            };

            return Ok(new { snapshotAt = DateTime.UtcNow, lanes });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DoctrineStatus] Lane health FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }
}
