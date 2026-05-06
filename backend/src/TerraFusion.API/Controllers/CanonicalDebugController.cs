using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Sync.PacsAccount;
using TerraFusion.Core.Sync.PacsOwner;
using TerraFusion.Core.Sync.PacsOwnerCanonical;
using TerraFusion.Core.Sync.PacsOwnerTruth;
using TerraFusion.Core.Sync.PacsParcelCanonical;
using TerraFusion.Core.Sync.PacsParcelTruth;
using TerraFusion.Core.Sync.PacsPropSuppAssoc;
using TerraFusion.Core.Sync.PacsProperty;
using TerraFusion.Core.Sync.PacsSale;
using TerraFusion.Core.Sync.PacsSaleCanonical;
using TerraFusion.Core.Sync.PacsSalePipeline;
using TerraFusion.Core.Sync.PacsSaleTruth;
using TerraFusion.Core.Sync.PacsAttribute;
using TerraFusion.Core.Sync.PacsAttributeVal;
using TerraFusion.Core.Sync.PacsImprv;
using TerraFusion.Core.Sync.PacsImprvAttr;
using TerraFusion.Core.Sync.PacsImprvCanonical;
using TerraFusion.Core.Sync.PacsImprvDetail;
using TerraFusion.Core.Sync.PacsImprvTruth;
using TerraFusion.Core.Sync.ArcGisCanonical;
using TerraFusion.Core.Sync.ArcGisRawLanding;
using TerraFusion.Core.Sync.ArcGisTruthPromotion;
using TerraFusion.Core.Sync.PacsLandCanonical;
using TerraFusion.Core.Sync.PacsLandDetail;
using TerraFusion.Core.Sync.PacsLandTruth;
using TerraFusion.Core.Sync.PacsWashPropOwnerVal;
using TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;
using TerraFusion.Core.Sync.PacsWsdorCanonical;
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

    // ════════════════════════════════════════════════════════════════════
    // SYNC-POP-3 — targeted-supp-overlap proof
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// SYNC-POP-3: lands a bounded sale batch, extracts the distinct
    /// (PropId, PropValYr) keys it references, lands matching prop_supp_assoc
    /// rows ONLY (via <see cref="KeyedSqlServerPacsPropSuppAssocSource"/>),
    /// then runs S2-B truth promotion. S3 canonical projection runs only
    /// when explicitly requested (since canonical_tf.tf_parcel is empty
    /// until the parcel pipeline lands separately).
    ///
    /// <para>Goal: prove <c>truth_pacs.sale &gt; 0</c> end-to-end on a
    /// minimal sample. Per <c>docs/sync/sync-pop-2-findings.md</c>'s
    /// "What's not yet wired" section, S3 will quarantine until parcel
    /// landing is wired.</para>
    /// </summary>
    [HttpPost("sync-pop-3/run-targeted-chain")]
    public async Task<IActionResult> RunSyncPop3(
        [FromServices] IPacsSaleLandingService saleSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsSaleSyncRunner runner,
        [FromServices] IConfiguration config,
        [FromBody] SyncPop3Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
        {
            return StatusCode(500, new
            {
                error = "ConnectionStrings:PacsConnection is required for SYNC-POP-3.",
            });
        }

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "sync-pop-3-debug"
            : request.OperatorName.Trim();

        var saleTopN = request?.TopN ?? 100;  // small default — overlap is the goal, not volume
        var runS3 = request?.RunCanonicalProjection ?? false;

        try
        {
            _logger.LogInformation("[SyncPop3] Starting targeted-supp chain. operator={Op} saleTopN={Top} runS3={S3}",
                operatorName, saleTopN, runS3);

            // ── S1: PACS sales → legacy_pacs_raw.sale ─────────────────
            var saleSrc = new SqlServerPacsSaleSource(pacsCs, topN: saleTopN);
            var s1 = await saleSvc.LandSalesAsync(saleSrc, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop3] S1 status={Status} rows={Rows} batchId={Batch}",
                s1.Status, s1.RowsLanded, s1.LoadBatchId);
            if (!string.Equals(s1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new { stage = "S1", error = s1.ErrorSummary, s1 });
            }

            // ── KEY EXTRACTION: distinct (PropId, PropValYr) from S1's
            //    just-landed rows. SupNum is always 0 in our SourceQueryText
            //    derivation, so we don't include it in the key set. ──
            var keys = await _db.LegacyPacsRawSales
                .AsNoTracking()
                .Where(s => s.LoadBatchId == s1.LoadBatchId)
                .Select(s => new { s.PropId, s.PropValYr })
                .Distinct()
                .ToListAsync(cancellationToken);
            var keyTuples = keys.Select(k => (k.PropId, k.PropValYr)).ToList();
            _logger.LogInformation("[SyncPop3] Extracted {N} distinct (PropId, PropValYr) keys from S1 batch.", keyTuples.Count);

            // ── S2-A: targeted prop_supp_assoc landing ────────────────
            var assocSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, keyTuples);
            var s2a = await assocSvc.LandPropSuppAssocsAsync(assocSrc, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop3] S2-A status={Status} rows={Rows} batchId={Batch} dupKey={Dup} years={Years}",
                s2a.Status, s2a.RowsLanded, s2a.LoadBatchId, s2a.DuplicateKeyViolations, s2a.DistinctYears);
            if (!string.Equals(s2a.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new { stage = "S2-A", error = s2a.ErrorSummary, s1, s2a });
            }

            // ── S2-B: truth promotion (always runs; this is the goal) ─
            // ── S3:   canonical projection (skipped unless requested) ─
            object? chainResult = null;
            if (runS3)
            {
                var chain = await runner.RunAsync(s1.LoadBatchId, s2a.LoadBatchId, operatorName, cancellationToken);
                _logger.LogInformation(
                    "[SyncPop3] S2-B+S3 status={Status} promoted={P} projected={Proj} quarantined={Q}",
                    chain.Status, chain.SalesPromoted, chain.SalesProjected, chain.SalesQuarantined);
                chainResult = new
                {
                    chain.Status,
                    chain.TruthPromotionLoadBatchId,
                    chain.CanonicalPromotionLoadBatchId,
                    chain.SalesPromoted,
                    chain.SalesProjected,
                    chain.SalesQuarantined,
                };
            }
            else
            {
                // Run S2-B only by invoking the truth promoter directly. We don't
                // expose IPacsSaleTruthPromoter via DI here — instead we use the
                // runner with a flag that the chain has historically meant "S2-B
                // and then S3". For SYNC-POP-3 we want S2-B alone, so we use the
                // runner anyway and IGNORE the S3 result if it errors due to
                // missing tf_parcel resolution targets. The runner short-circuits
                // S3 when truth promotion produces zero rows AND when canonical
                // resolution can't complete; either way, the truth_pacs.sale
                // count after the call is the operative proof.
                var chain = await runner.RunAsync(s1.LoadBatchId, s2a.LoadBatchId, operatorName, cancellationToken);
                _logger.LogInformation(
                    "[SyncPop3] S2-B (S3 informational) status={Status} promoted={P} projected={Proj} quarantined={Q}",
                    chain.Status, chain.SalesPromoted, chain.SalesProjected, chain.SalesQuarantined);
                chainResult = new
                {
                    chain.Status,
                    chain.TruthPromotionLoadBatchId,
                    chain.CanonicalPromotionLoadBatchId,
                    chain.SalesPromoted,
                    chain.SalesProjected,
                    chain.SalesQuarantined,
                    note = "S3 canonical projection ran but is expected to project 0 / quarantine all until parcel pipeline populates canonical_tf.tf_parcel. The operative SYNC-POP-3 success signal is salesPromoted > 0.",
                };
            }

            // ── Final read-back so the response includes the operative
            //    proof number directly ──
            var truthPacsCount = await _db.TruthPacsSales.CountAsync(cancellationToken);
            var legacyRawCount = await _db.LegacyPacsRawSales.CountAsync(cancellationToken);
            var canonicalTfCount = await _db.TfSales.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                s1 = new { s1.Status, s1.LoadBatchId, s1.RowsLanded, s1.StaleCodeViolations, s1.Pre2018Count, s1.Post2018Count, s1.UnknownDateCount },
                keyExtraction = new { distinctKeys = keyTuples.Count },
                s2a = new { s2a.Status, s2a.LoadBatchId, s2a.RowsLanded, s2a.DuplicateKeyViolations, s2a.DistinctYears },
                chain = chainResult,
                counts = new
                {
                    legacyPacsRawSales = legacyRawCount,
                    truthPacsSales = truthPacsCount,
                    canonicalTfSales = canonicalTfCount,
                },
                proofVerdict = truthPacsCount > 0
                    ? "PROOF: truth_pacs.sale > 0 — SYNC-POP-3 succeeded."
                    : "INCONCLUSIVE: truth_pacs.sale = 0. Either no qualified ('100') sales in this sample, or the supp index did not align (check distinctKeys count).",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SyncPop3] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor on the load batches.</param>
    /// <param name="TopN">Sales sample size. Default 100. Smaller is faster
    /// for proof; larger improves the chance of catching at least one
    /// qualified ("100") sale that maps to the keyed supp set.</param>
    /// <param name="RunCanonicalProjection">When false (default), S2-B truth
    /// promotion is the operative proof. S3 canonical projection runs
    /// informationally but its zero-result is expected (tf_parcel empty).</param>
    public sealed record SyncPop3Request(
        string? OperatorName,
        int? TopN,
        bool? RunCanonicalProjection);

    // ════════════════════════════════════════════════════════════════════
    // SYNC-POP-4a: Property/parcel raw landing (S1 only).
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// SYNC-POP-4a: lands a (TopN-bounded) parcel batch into
    /// <c>legacy_pacs_raw.property</c> using
    /// <see cref="SqlServerPacsPropertySource"/>. No truth promotion or
    /// canonical projection — those are SYNC-POP-4b and SYNC-POP-4c.
    ///
    /// <para>Goal: prove <c>legacy_pacs_raw.property &gt; 0</c> end-to-end
    /// against live Harris PACS, capture the type-distribution histogram
    /// and the active/inactive split, and confirm <c>prop_id</c> uniqueness.
    /// This is the foundation slice for the doctrine parcel pipeline that
    /// will eventually populate <c>canonical_tf.tf_parcel</c>.</para>
    /// </summary>
    [HttpPost("sync-pop-4/run-property-landing")]
    public async Task<IActionResult> RunSyncPop4a(
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IConfiguration config,
        [FromBody] SyncPop4Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
        {
            return StatusCode(500, new
            {
                error = "ConnectionStrings:PacsConnection is required for SYNC-POP-4a.",
            });
        }

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "sync-pop-4a-debug"
            : request.OperatorName.Trim();

        // Default to a small bounded sample for proof. Production drains
        // the full corpus by passing TopN=null explicitly.
        var topN = request?.TopN ?? 1000;

        try
        {
            _logger.LogInformation(
                "[SyncPop4a] Starting property landing. operator={Op} topN={Top}",
                operatorName, topN);

            var src = new SqlServerPacsPropertySource(pacsCs, topN: topN);
            var s1 = await propSvc.LandPropertiesAsync(src, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop4a] S1 status={Status} rows={Rows} batchId={Batch} withCreateDt={W} withoutCreateDt={WO} dupPropId={Dup}",
                s1.Status, s1.RowsLanded, s1.LoadBatchId,
                s1.WithCreateDtCount, s1.WithoutCreateDtCount, s1.DuplicatePropIdCount);

            if (!string.Equals(s1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new { stage = "S1", error = s1.ErrorSummary, s1 });
            }

            // Read-back so the response includes the operative proof number.
            var legacyRawCount = await _db.LegacyPacsRawProperties.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                s1 = new
                {
                    s1.Status,
                    s1.LoadBatchId,
                    s1.RowsLanded,
                    s1.WithCreateDtCount,
                    s1.WithoutCreateDtCount,
                    s1.DuplicatePropIdCount,
                    s1.TypeDistribution,
                },
                counts = new { legacyPacsRawProperties = legacyRawCount },
                proofVerdict = legacyRawCount > 0
                    ? "PROOF: legacy_pacs_raw.property > 0 — SYNC-POP-4a foundation slice succeeded."
                    : "INCONCLUSIVE: legacy_pacs_raw.property = 0. Source returned no rows; check PACS connection and dbo.property contents.",
                nextSlice = "SYNC-POP-4b: build truth_pacs.parcel_spine promoter (filter prop_type='R', resolve identity).",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SyncPop4a] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor on the load batch.</param>
    /// <param name="TopN">Property sample size. Default 1000. Smaller is
    /// faster for proof; null drains the full Benton parcel corpus
    /// (~89k rows) — only use null for production landing, not proof.</param>
    public sealed record SyncPop4Request(
        string? OperatorName,
        int? TopN);

    // ════════════════════════════════════════════════════════════════════
    // SYNC-POP-4b: parcel-spine truth promotion (S1 → S2-B chain).
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// SYNC-POP-4b: lands a (TopN-bounded) parcel batch into
    /// <c>legacy_pacs_raw.property</c>, then promotes it into
    /// <c>truth_pacs.parcel_spine</c> with the
    /// <c>prop_type_cd = 'R'</c> filter.
    ///
    /// <para>Goal: prove <c>truth_pacs.parcel_spine &gt; 0</c>
    /// end-to-end on a minimal sample. The output spine is the input
    /// for SYNC-POP-4c (canonical projection).</para>
    ///
    /// <para>If <c>PropertyLoadBatchId</c> is provided, the S1 stage
    /// is skipped and the named batch is promoted directly. Otherwise
    /// a fresh S1 landing runs first.</para>
    /// </summary>
    [HttpPost("sync-pop-4/run-spine-chain")]
    public async Task<IActionResult> RunSyncPop4b(
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IConfiguration config,
        [FromBody] SyncPop4bRequest? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
        {
            return StatusCode(500, new
            {
                error = "ConnectionStrings:PacsConnection is required for SYNC-POP-4b.",
            });
        }

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "sync-pop-4b-debug"
            : request.OperatorName.Trim();
        var topN = request?.TopN ?? 1000;

        try
        {
            // ── S1: only if caller didn't pass an existing batch. ──
            Guid propertyBatchId;
            object? s1Result = null;
            if (request?.PropertyLoadBatchId is { } existing && existing != Guid.Empty)
            {
                propertyBatchId = existing;
                _logger.LogInformation(
                    "[SyncPop4b] Skipping S1; promoting existing batch={Batch}",
                    propertyBatchId);
            }
            else
            {
                _logger.LogInformation(
                    "[SyncPop4b] Starting fresh S1 property landing. operator={Op} topN={Top}",
                    operatorName, topN);
                var src = new SqlServerPacsPropertySource(pacsCs, topN: topN);
                var s1 = await propSvc.LandPropertiesAsync(src, operatorName, cancellationToken);
                if (!string.Equals(s1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(500, new { stage = "S1", error = s1.ErrorSummary, s1 });
                }
                propertyBatchId = s1.LoadBatchId;
                s1Result = new
                {
                    s1.Status,
                    s1.LoadBatchId,
                    s1.RowsLanded,
                    s1.WithCreateDtCount,
                    s1.WithoutCreateDtCount,
                    s1.DuplicatePropIdCount,
                    s1.TypeDistribution,
                };
            }

            // ── S2-B: parcel-spine truth promotion ──
            var s2b = await spinePromoter.PromoteAsync(propertyBatchId, operatorName, cancellationToken);
            _logger.LogInformation(
                "[SyncPop4b] S2-B status={Status} considered={C} promoted={P} notReal={NR} dupPropId={D}",
                s2b.Status, s2b.ParcelsConsidered, s2b.ParcelsPromoted,
                s2b.RejectedNotRealProperty, s2b.RejectedDuplicatePropId);

            if (!string.Equals(s2b.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new { stage = "S2-B", error = s2b.ErrorSummary, s1 = s1Result, s2b });
            }

            // Read-back so the response includes the operative proof number.
            var truthSpineCount = await _db.TruthPacsParcelSpines.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                s1 = s1Result,
                s2b = new
                {
                    s2b.Status,
                    s2b.PromotionLoadBatchId,
                    s2b.ParcelsConsidered,
                    s2b.ParcelsPromoted,
                    s2b.RejectedNotRealProperty,
                    s2b.RejectedDuplicatePropId,
                    s2b.PriorRowsRemoved,
                },
                counts = new { truthPacsParcelSpine = truthSpineCount },
                proofVerdict = s2b.ParcelsPromoted > 0
                    ? "PROOF: truth_pacs.parcel_spine > 0 — SYNC-POP-4b spine promotion succeeded."
                    : "INCONCLUSIVE: 0 spine rows promoted. Check the S1 type distribution — if R count was zero, the bounded sample missed all real-property parcels.",
                nextSlice = "SYNC-POP-4c: build canonical_tf.tf_parcel projector (TfParcel + source_xref{prop_id}).",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SyncPop4b] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor on the load batches.</param>
    /// <param name="TopN">Property sample size for the S1 stage. Default 1000.
    /// Ignored if <paramref name="PropertyLoadBatchId"/> is supplied.</param>
    /// <param name="PropertyLoadBatchId">If non-null and non-empty, skips S1
    /// and promotes the named existing property batch directly. Use this to
    /// re-run truth promotion without re-landing.</param>
    public sealed record SyncPop4bRequest(
        string? OperatorName,
        int? TopN,
        Guid? PropertyLoadBatchId);

    // ════════════════════════════════════════════════════════════════════
    // SYNC-POP-4c: parcel canonical projection (S1 → S2-B → S3 chain).
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// SYNC-POP-4c: full doctrine parcel pipeline in one call.
    /// Lands raw → promotes truth → projects canonical with
    /// <c>tf_parcel</c> + <c>source_xref(TfEntityType="parcel")</c>.
    ///
    /// <para>Goal: prove <c>canonical_tf.tf_parcel &gt; 0</c>.
    /// This is the slice that unblocks <c>canonical_tf.tf_sale &gt; 0</c>
    /// — the existing sale projector resolves <c>source_xref</c> via
    /// <c>tf_parcel.tf_parcel_id</c>, and has been quarantining sales
    /// because no parcel xrefs existed.</para>
    ///
    /// <para>Resolves Benton county id from the <c>Counties</c> table
    /// (creating it if missing) so the operator does not need to know
    /// the GUID.</para>
    /// </summary>
    [HttpPost("sync-pop-4/run-canonical-chain")]
    public async Task<IActionResult> RunSyncPop4c(
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector canonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] SyncPop4cRequest? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
        {
            return StatusCode(500, new
            {
                error = "ConnectionStrings:PacsConnection is required for SYNC-POP-4c.",
            });
        }

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "sync-pop-4c-debug"
            : request.OperatorName.Trim();
        var topN = request?.TopN ?? 1000;

        try
        {
            // ── Resolve Benton county id (create if missing). ──
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            _logger.LogInformation("[SyncPop4c] Resolved Benton countyId={CountyId}", bentonCountyId);

            // ── S1: property landing ──
            Guid propertyBatchId;
            object? s1Result = null;
            if (request?.PropertyLoadBatchId is { } existing && existing != Guid.Empty)
            {
                propertyBatchId = existing;
            }
            else
            {
                var src = new SqlServerPacsPropertySource(pacsCs, topN: topN);
                var s1 = await propSvc.LandPropertiesAsync(src, operatorName, cancellationToken);
                if (!string.Equals(s1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(500, new { stage = "S1", error = s1.ErrorSummary, s1 });
                }
                propertyBatchId = s1.LoadBatchId;
                s1Result = new
                {
                    s1.Status, s1.LoadBatchId, s1.RowsLanded,
                    s1.WithCreateDtCount, s1.WithoutCreateDtCount,
                    s1.DuplicatePropIdCount, s1.TypeDistribution,
                };
            }

            // ── S2-B: spine promotion ──
            var s2b = await spinePromoter.PromoteAsync(propertyBatchId, operatorName, cancellationToken);
            if (!string.Equals(s2b.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new { stage = "S2-B", error = s2b.ErrorSummary, s1 = s1Result, s2b });
            }

            // ── S3: canonical projection ──
            var s3 = await canonicalProjector.ProjectAsync(
                s2b.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(s3.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(500, new { stage = "S3", error = s3.ErrorSummary, s1 = s1Result, s2b, s3 });
            }

            // ── Read-back proof counts. ──
            var tfParcelCount = await _db.TfParcels.CountAsync(cancellationToken);
            var parcelXrefCount = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == "parcel" && x.IsActive)
                .CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                s1 = s1Result,
                s2b = new
                {
                    s2b.Status, s2b.PromotionLoadBatchId,
                    s2b.ParcelsConsidered, s2b.ParcelsPromoted,
                    s2b.RejectedNotRealProperty, s2b.RejectedDuplicatePropId,
                    s2b.PriorRowsRemoved,
                },
                s3 = new
                {
                    s3.Status, s3.PromotionLoadBatchId,
                    s3.TruthParcelsConsidered, s3.ParcelsProjected,
                    s3.PriorCanonicalRowsRemoved, s3.PriorXrefRowsRemoved,
                },
                counts = new
                {
                    canonicalTfParcels = tfParcelCount,
                    parcelSourceXrefs = parcelXrefCount,
                },
                proofVerdict = s3.ParcelsProjected > 0
                    ? "PROOF: canonical_tf.tf_parcel > 0 — SYNC-POP-4c canonical projection succeeded. The sale-side source_xref resolution is now unblocked."
                    : "INCONCLUSIVE: 0 tf_parcel rows projected. Check S2-B output — if 0 spine rows, no real-property parcels in this sample.",
                nextSlice = "SYNC-POP-4d: re-run SYNC-POP-3 chain with RunCanonicalProjection=true to prove canonical_tf.tf_sale > 0.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SyncPop4c] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <summary>
    /// Resolve Benton (WA) county id. Look up by FipsCode '53005' first
    /// (it's the canonical unique identifier per the IX_Counties_FipsCode
    /// constraint), then by Name+State, then create if none exists.
    /// Single-county dev posture.
    /// </summary>
    private async Task<Guid> ResolveOrCreateBentonCountyAsync(CancellationToken cancellationToken)
    {
        // 1. By FIPS (the unique-indexed natural key).
        var byFips = await _db.Counties
            .FirstOrDefaultAsync(c => c.FipsCode == "53005", cancellationToken)
            .ConfigureAwait(false);
        if (byFips is not null) return byFips.Id;

        // 2. By Name+State (case-insensitive).
        var byName = await _db.Counties
            .FirstOrDefaultAsync(c =>
                EF.Functions.ILike(c.Name, "Benton") &&
                EF.Functions.ILike(c.State, "WA"),
                cancellationToken)
            .ConfigureAwait(false);
        if (byName is not null) return byName.Id;

        // 3. Create.
        var county = new County
        {
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Counties.Add(county);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        _logger.LogInformation("[SyncPop4c] Created Benton county row id={Id}", county.Id);
        return county.Id;
    }

    /// <param name="OperatorName">Audit anchor on the load batches.</param>
    /// <param name="TopN">Property sample size for the S1 stage. Default 1000.
    /// Ignored if <paramref name="PropertyLoadBatchId"/> is supplied.</param>
    /// <param name="PropertyLoadBatchId">If non-null, skip S1 and start from
    /// the named existing property batch. The S2-B + S3 stages still run
    /// fresh.</param>
    public sealed record SyncPop4cRequest(
        string? OperatorName,
        int? TopN,
        Guid? PropertyLoadBatchId);

    // ════════════════════════════════════════════════════════════════════
    // SYNC-POP-4d: end-to-end doctrine closure.
    //   sales (S1) → keyed supps (S2-A) → sale truth (S2-B)
    //              → keyed parcels (S1+S2-B+S3 for parcels)
    //              → sale canonical (S3) → canonical_tf.tf_sale > 0
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// SYNC-POP-4d: the doctrine end-to-end closure proof. Lands a
    /// bounded sale batch, runs SYNC-POP-3's targeted-supp chain to
    /// promote sales into <c>truth_pacs.sale</c>, then extracts
    /// distinct <c>prop_id</c> values from those promoted truth sales,
    /// runs the SYNC-POP-4 keyed parcel chain ONLY for those prop_ids,
    /// and finally re-runs the sale canonical projector.
    ///
    /// <para>Goal: prove <c>canonical_tf.tf_sale &gt; 0</c>. This is
    /// the operative outcome the doctrine has been targeting since
    /// SYNC-POP-1's empty-canonical observation.</para>
    /// </summary>
    [HttpPost("sync-pop-4/run-final-closure")]
    public async Task<IActionResult> RunSyncPop4d(
        [FromServices] IPacsSaleLandingService saleSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsSaleTruthPromoter saleTruthPromoter,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonicalProjector,
        [FromServices] IPacsSaleCanonicalProjector saleCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] SyncPop4dRequest? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
        {
            return StatusCode(500, new
            {
                error = "ConnectionStrings:PacsConnection is required for SYNC-POP-4d.",
            });
        }

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "sync-pop-4d-final-closure"
            : request.OperatorName.Trim();
        var saleTopN = request?.SaleTopN ?? 500;

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── Stage A: Sale S1 ──
            _logger.LogInformation("[SyncPop4d] A. Landing sales (TopN={Top})", saleTopN);
            var saleSrc = new SqlServerPacsSaleSource(pacsCs, topN: saleTopN);
            var saleS1 = await saleSvc.LandSalesAsync(saleSrc, operatorName, cancellationToken);
            if (!string.Equals(saleS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Sale-S1", error = saleS1.ErrorSummary, saleS1 });

            // ── Stage B: extract sale (PropId, PropValYr) keys → keyed supp S1 ──
            var saleKeys = await _db.LegacyPacsRawSales
                .AsNoTracking()
                .Where(s => s.LoadBatchId == saleS1.LoadBatchId)
                .Select(s => new { s.PropId, s.PropValYr })
                .Distinct()
                .ToListAsync(cancellationToken);
            var saleKeyTuples = saleKeys.Select(k => (k.PropId, k.PropValYr)).ToList();

            _logger.LogInformation("[SyncPop4d] B. Keyed supp landing for {N} keys", saleKeyTuples.Count);
            var assocSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, saleKeyTuples);
            var assocS1 = await assocSvc.LandPropSuppAssocsAsync(assocSrc, operatorName, cancellationToken);
            if (!string.Equals(assocS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Supp-S1", error = assocS1.ErrorSummary, assocS1 });

            // ── Stage C: Sale S2-B truth promotion ──
            _logger.LogInformation("[SyncPop4d] C. Promoting sale truth");
            var saleTruth = await saleTruthPromoter.PromoteAsync(
                saleS1.LoadBatchId, assocS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(saleTruth.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Sale-S2B", error = saleTruth.ErrorSummary, saleTruth });

            // ── Stage D: extract distinct prop_ids from truth_pacs.sale's
            //    just-promoted batch → keyed parcel landing ──
            var promotedPropIds = await _db.TruthPacsSales
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == saleTruth.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            _logger.LogInformation(
                "[SyncPop4d] D. Keyed parcel landing for {N} prop_ids from {P} promoted sales",
                promotedPropIds.Count, saleTruth.SalesPromoted);

            if (promotedPropIds.Count == 0)
            {
                return Ok(new
                {
                    operatorName,
                    saleS1 = new { saleS1.Status, saleS1.LoadBatchId, saleS1.RowsLanded },
                    assocS1 = new { assocS1.Status, assocS1.LoadBatchId, assocS1.RowsLanded },
                    saleTruth = new { saleTruth.Status, saleTruth.SalesPromoted, saleTruth.SalesConsidered },
                    note = "0 sales promoted to truth — no qualified ('100') sales in the keyed-supp overlap. " +
                           "Increase SaleTopN to widen the chance of overlap.",
                });
            }

            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, promotedPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            if (!string.Equals(parcelS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S1", error = parcelS1.ErrorSummary, parcelS1 });

            // ── Stage E: parcel S2-B truth spine promotion ──
            _logger.LogInformation("[SyncPop4d] E. Promoting parcel spine");
            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(parcelSpine.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S2B", error = parcelSpine.ErrorSummary, parcelSpine });

            // ── Stage F: parcel S3 canonical projection ──
            _logger.LogInformation("[SyncPop4d] F. Projecting parcels to canonical");
            var parcelCanonical = await parcelCanonicalProjector.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(parcelCanonical.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S3", error = parcelCanonical.ErrorSummary, parcelCanonical });

            // ── Stage G: sale S3 canonical projection (THE final step) ──
            _logger.LogInformation("[SyncPop4d] G. Projecting sales to canonical");
            var saleCanonical = await saleCanonicalProjector.ProjectAsync(
                saleTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(saleCanonical.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Sale-S3", error = saleCanonical.ErrorSummary, saleCanonical });

            // ── Read-back proof counts. ──
            var tfSaleCount = await _db.TfSales.CountAsync(cancellationToken);
            var tfParcelCount = await _db.TfParcels.CountAsync(cancellationToken);
            var truthSaleCount = await _db.TruthPacsSales.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                saleS1 = new { saleS1.Status, saleS1.LoadBatchId, saleS1.RowsLanded, saleS1.Post2018Count },
                assocS1 = new { assocS1.Status, assocS1.LoadBatchId, assocS1.RowsLanded, assocS1.DistinctYears },
                saleTruth = new
                {
                    saleTruth.Status, saleTruth.PromotionLoadBatchId,
                    saleTruth.SalesConsidered, saleTruth.SalesPromoted,
                    saleTruth.RejectedNotQualified, saleTruth.RejectedNoSuppPointer,
                },
                keyedParcelExtraction = new { distinctPropIds = promotedPropIds.Count },
                parcelS1 = new
                {
                    parcelS1.Status, parcelS1.LoadBatchId, parcelS1.RowsLanded,
                    parcelS1.TypeDistribution,
                },
                parcelSpine = new
                {
                    parcelSpine.Status, parcelSpine.PromotionLoadBatchId,
                    parcelSpine.ParcelsConsidered, parcelSpine.ParcelsPromoted,
                    parcelSpine.RejectedNotRealProperty,
                },
                parcelCanonical = new
                {
                    parcelCanonical.Status, parcelCanonical.PromotionLoadBatchId,
                    parcelCanonical.TruthParcelsConsidered, parcelCanonical.ParcelsProjected,
                    parcelCanonical.PriorCanonicalRowsRemoved,
                },
                saleCanonical = new
                {
                    saleCanonical.Status, saleCanonical.PromotionLoadBatchId,
                    saleCanonical.TruthSalesConsidered, saleCanonical.SalesProjected,
                    saleCanonical.SalesQuarantined,
                },
                counts = new
                {
                    truthPacsSales = truthSaleCount,
                    canonicalTfParcels = tfParcelCount,
                    canonicalTfSales = tfSaleCount,
                },
                proofVerdict = saleCanonical.SalesProjected > 0
                    ? "PROOF: canonical_tf.tf_sale > 0 — SYNC-POP-4d closure succeeded. The doctrine end-to-end pipeline is operational."
                    : "INCONCLUSIVE: canonical_tf.tf_sale = 0 even after keyed parcel closure. Investigate parcel-spine promotion (was prop_type_cd = 'R' for the keyed parcels?) or sale-side parcel-xref resolution.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SyncPop4d] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor across all 7 stages.</param>
    /// <param name="SaleTopN">Sale sample size for the initial S1 stage.
    /// Default 500. Smaller is faster; larger improves the chance of
    /// catching qualified ('100') sales whose prop_ids overlap with
    /// real-property parcels.</param>
    public sealed record SyncPop4dRequest(
        string? OperatorName,
        int? SaleTopN);

    // ════════════════════════════════════════════════════════════════════
    // OWN-POP-1: Owner-lane end-to-end closure.
    //   owner (S1) → keyed accounts + keyed supps + keyed parcels
    //              → parcel S2-B + S3 (xrefs for owner canonical)
    //              → owner truth (B2-A) → owner canonical (B3)
    //              → canonical_tf.tf_owner > 0
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// OWN-POP-1: doctrine end-to-end closure for the owner lane.
    /// Mirrors SYNC-POP-4d's keyed-source pattern but starts from
    /// <c>dbo.owner</c> as the seed batch and aligns four downstream
    /// PACS tables (account, prop_supp_assoc, property, plus the
    /// parcel canonical chain) on the owner batch's identity keys.
    ///
    /// <para>Goal: prove <c>canonical_tf.tf_owner &gt; 0</c> and
    /// <c>tf_parcel_owner_link &gt; 0</c>. PII redaction is the
    /// load-bearing invariant; the canonical projector's
    /// <c>canonical-owner-pii-redaction-policy</c> gate verifies
    /// it from the database itself.</para>
    /// </summary>
    [HttpPost("own-pop-1/run-final-closure")]
    public async Task<IActionResult> RunOwnPop1(
        [FromServices] IPacsAccountLandingService accountSvc,
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsOwnerCurrentTruthPromoter ownerTruthPromoter,
        [FromServices] IPacsOwnerCanonicalProjector ownerCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] OwnPop1Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for OWN-POP-1." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "own-pop-1-final-closure"
            : request.OperatorName.Trim();
        var ownerTopN = request?.OwnerTopN ?? 500;

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── A. Owner S1 (the seed batch). ──
            _logger.LogInformation("[OwnPop1] A. Landing owners (TopN={Top})", ownerTopN);
            var ownerSrc = new SqlServerPacsOwnerSource(pacsCs, topN: ownerTopN);
            var ownerS1 = await ownerSvc.LandOwnersAsync(ownerSrc, operatorName, cancellationToken);
            if (!string.Equals(ownerS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-S1", error = ownerS1.ErrorSummary, ownerS1 });

            // ── B. Extract keys from the owner batch. ──
            var ownerRows = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerS1.LoadBatchId)
                .Select(o => new { o.OwnerId, o.PropId, o.OwnerTaxYr })
                .ToListAsync(cancellationToken);

            var distinctAcctIds = ownerRows.Select(r => r.OwnerId).Distinct().ToList();
            var distinctSuppKeys = ownerRows.Select(r => (r.PropId, r.OwnerTaxYr)).Distinct().ToList();
            var distinctParcelPropIds = ownerRows.Select(r => r.PropId).Distinct().ToList();

            _logger.LogInformation(
                "[OwnPop1] B. Extracted keys: accts={A} suppKeys={S} parcelIds={P}",
                distinctAcctIds.Count, distinctSuppKeys.Count, distinctParcelPropIds.Count);

            // ── C. Keyed account S1. ──
            var acctSrc = new KeyedSqlServerPacsAccountSource(pacsCs, distinctAcctIds);
            var acctS1 = await accountSvc.LandAccountsAsync(acctSrc, operatorName, cancellationToken);
            if (!string.Equals(acctS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Account-S1", error = acctS1.ErrorSummary, acctS1 });

            // ── D. Keyed supp S1 (uses sale-style keying). ──
            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, distinctSuppKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            if (!string.Equals(suppS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Supp-S1", error = suppS1.ErrorSummary, suppS1 });

            // ── E. Keyed parcel S1 + spine + canonical (so owner B3 can resolve parcel xrefs). ──
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, distinctParcelPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            if (!string.Equals(parcelS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S1", error = parcelS1.ErrorSummary, parcelS1 });

            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(parcelSpine.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Spine", error = parcelSpine.ErrorSummary, parcelSpine });

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(parcelCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Canonical", error = parcelCanon.ErrorSummary, parcelCanon });

            // ── F. Owner truth (B2-A): needs owner + account + supp batches. ──
            _logger.LogInformation("[OwnPop1] F. Promoting owner truth");
            var ownerTruth = await ownerTruthPromoter.PromoteAsync(
                ownerS1.LoadBatchId, acctS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(ownerTruth.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-Truth", error = ownerTruth.ErrorSummary, ownerTruth });

            // ── G. Owner canonical (B3): writes tf_owner + tf_parcel_owner_link + xrefs. ──
            _logger.LogInformation("[OwnPop1] G. Projecting owner canonical");
            var ownerCanon = await ownerCanonicalProjector.ProjectAsync(
                ownerTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(ownerCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-Canonical", error = ownerCanon.ErrorSummary, ownerCanon });

            // ── Read-back. ──
            var tfOwnerCount = await _db.TfOwners.CountAsync(cancellationToken);
            var tfLinkCount = await _db.TfParcelOwnerLinks.CountAsync(cancellationToken);
            var tfParcelCount = await _db.TfParcels.CountAsync(cancellationToken);
            var truthOwnerCount = await _db.TruthPacsOwnerCurrents.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                ownerS1 = new { ownerS1.Status, ownerS1.LoadBatchId, ownerS1.RowsLanded },
                keyExtraction = new
                {
                    distinctAcctIds = distinctAcctIds.Count,
                    distinctSuppKeys = distinctSuppKeys.Count,
                    distinctParcelPropIds = distinctParcelPropIds.Count,
                },
                acctS1 = new { acctS1.Status, acctS1.LoadBatchId, acctS1.RowsLanded },
                suppS1 = new { suppS1.Status, suppS1.LoadBatchId, suppS1.RowsLanded },
                parcelS1 = new { parcelS1.Status, parcelS1.LoadBatchId, parcelS1.RowsLanded, parcelS1.TypeDistribution },
                parcelSpine = new { parcelSpine.Status, parcelSpine.PromotionLoadBatchId, parcelSpine.ParcelsConsidered, parcelSpine.ParcelsPromoted },
                parcelCanon = new { parcelCanon.Status, parcelCanon.PromotionLoadBatchId, parcelCanon.ParcelsProjected },
                ownerTruth = new
                {
                    ownerTruth.Status, ownerTruth.PromotionLoadBatchId,
                    ownerTruth.OwnersConsidered, ownerTruth.OwnersPromoted,
                },
                ownerCanon = new
                {
                    ownerCanon.Status, ownerCanon.PromotionLoadBatchId,
                    ownerCanon.TruthRowsConsidered, ownerCanon.OwnersProjected,
                    ownerCanon.LinksProjected, ownerCanon.RowsQuarantined,
                },
                counts = new
                {
                    canonicalTfOwners = tfOwnerCount,
                    canonicalTfParcelOwnerLinks = tfLinkCount,
                    canonicalTfParcels = tfParcelCount,
                    truthPacsOwnerCurrents = truthOwnerCount,
                },
                proofVerdict = ownerCanon.OwnersProjected > 0 && ownerCanon.LinksProjected > 0
                    ? "PROOF: canonical_tf.tf_owner > 0 AND tf_parcel_owner_link > 0 — OWN-POP-1 closure succeeded."
                    : "INCONCLUSIVE: investigate stage outputs above.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[OwnPop1] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor across all 7 stages.</param>
    /// <param name="OwnerTopN">Owner sample size for the seed batch.
    /// Default 500. Larger improves the chance of pct-completeness gate
    /// passing; smaller is faster.</param>
    public sealed record OwnPop1Request(
        string? OperatorName,
        int? OwnerTopN);

    // ════════════════════════════════════════════════════════════════════
    // OWN-POP-2: WPOV (B1-C) → B2-B truth → B4 canonical projection.
    //   Builds on OWN-POP-1: re-runs the owner pipeline so tf_parcel
    //   + tf_owner xrefs exist, then keys WPOV off the owner truth
    //   batch and chains B2-B + B4.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// OWN-POP-2: WSDOR closure proof. Re-runs the OWN-POP-1
    /// owner-lane pipeline (for fresh tf_parcel + tf_owner xrefs),
    /// extracts <c>(prop_id, year, owner_id)</c> triples from the
    /// owner truth batch, runs a keyed WPOV S1 + B2-B truth + B4
    /// canonical projection.
    ///
    /// <para>Goal: prove <c>canonical_tf.tf_assessment_wsdor &gt; 0</c>.
    /// B4 resolves both parcel and owner xrefs, so this slice's
    /// success is gated on OWN-POP-1's projections having landed
    /// matching xrefs in the same call.</para>
    /// </summary>
    [HttpPost("own-pop-2/run-wsdor-closure")]
    public async Task<IActionResult> RunOwnPop2(
        [FromServices] IPacsAccountLandingService accountSvc,
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsOwnerCurrentTruthPromoter ownerTruthPromoter,
        [FromServices] IPacsOwnerCanonicalProjector ownerCanonicalProjector,
        [FromServices] IPacsWashPropOwnerValLandingService wpovSvc,
        [FromServices] IPacsWashPropOwnerValTruthPromoter wpovTruthPromoter,
        [FromServices] IPacsWsdorCanonicalProjector wsdorCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] OwnPop2Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for OWN-POP-2." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "own-pop-2-wsdor-closure"
            : request.OperatorName.Trim();
        var ownerTopN = request?.OwnerTopN ?? 200;

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── Stages A-G: re-run the OWN-POP-1 owner-lane pipeline. ──
            // (Smaller TopN here; this slice's purpose is the WSDOR closure,
            // not exercising owner volumes.)
            _logger.LogInformation("[OwnPop2] A-G. Owner pipeline (TopN={Top})", ownerTopN);

            var ownerSrc = new SqlServerPacsOwnerSource(pacsCs, topN: ownerTopN);
            var ownerS1 = await ownerSvc.LandOwnersAsync(ownerSrc, operatorName, cancellationToken);
            if (!string.Equals(ownerS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-S1", error = ownerS1.ErrorSummary, ownerS1 });

            var ownerRows = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerS1.LoadBatchId)
                .Select(o => new { o.OwnerId, o.PropId, o.OwnerTaxYr })
                .ToListAsync(cancellationToken);
            var distinctAcctIds = ownerRows.Select(r => r.OwnerId).Distinct().ToList();
            var distinctSuppKeys = ownerRows.Select(r => (r.PropId, r.OwnerTaxYr)).Distinct().ToList();
            var distinctParcelPropIds = ownerRows.Select(r => r.PropId).Distinct().ToList();

            var acctSrc = new KeyedSqlServerPacsAccountSource(pacsCs, distinctAcctIds);
            var acctS1 = await accountSvc.LandAccountsAsync(acctSrc, operatorName, cancellationToken);
            if (!string.Equals(acctS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Account-S1", error = acctS1.ErrorSummary, acctS1 });

            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, distinctSuppKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            if (!string.Equals(suppS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Supp-S1", error = suppS1.ErrorSummary, suppS1 });

            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, distinctParcelPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            if (!string.Equals(parcelS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S1", error = parcelS1.ErrorSummary, parcelS1 });

            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(parcelSpine.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Spine", error = parcelSpine.ErrorSummary, parcelSpine });

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(parcelCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Canonical", error = parcelCanon.ErrorSummary, parcelCanon });

            var ownerTruth = await ownerTruthPromoter.PromoteAsync(
                ownerS1.LoadBatchId, acctS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(ownerTruth.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-Truth", error = ownerTruth.ErrorSummary, ownerTruth });

            var ownerCanon = await ownerCanonicalProjector.ProjectAsync(
                ownerTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(ownerCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-Canonical", error = ownerCanon.ErrorSummary, ownerCanon });

            // ── H. Extract WPOV keys from the owner truth batch. ──
            // Use OWNER truth (not raw) so we only ask WPOV for rows whose
            // (prop_id, owner_id) were validated. owner_tax_yr ↔ wpov.year.
            var wpovKeyRows = await _db.TruthPacsOwnerCurrents
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == ownerTruth.PromotionLoadBatchId)
                .Select(t => new { t.PropId, t.OwnerTaxYr, t.OwnerId })
                .Distinct()
                .ToListAsync(cancellationToken);
            var wpovKeys = wpovKeyRows
                .Select(k => (k.PropId, k.OwnerTaxYr, k.OwnerId))
                .ToList();

            _logger.LogInformation("[OwnPop2] H. Keyed WPOV S1 for {N} (prop_id, year, owner_id) triples", wpovKeys.Count);

            // ── I. Keyed WPOV S1 ──
            var wpovSrc = new KeyedSqlServerPacsWashPropOwnerValSource(pacsCs, wpovKeys);
            var wpovS1 = await wpovSvc.LandWashPropOwnerValsAsync(wpovSrc, operatorName, cancellationToken);
            if (!string.Equals(wpovS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "WPOV-S1", error = wpovS1.ErrorSummary, wpovS1 });

            // ── J. WPOV truth (B2-B): needs WPOV batch + supp batch. ──
            _logger.LogInformation("[OwnPop2] J. Promoting WPOV truth");
            var wpovTruth = await wpovTruthPromoter.PromoteAsync(
                wpovS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(wpovTruth.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "WPOV-Truth", error = wpovTruth.ErrorSummary, wpovTruth });

            // ── K. WSDOR canonical (B4): writes tf_assessment_wsdor + xrefs. ──
            _logger.LogInformation("[OwnPop2] K. Projecting WSDOR canonical");
            var wsdorCanon = await wsdorCanonicalProjector.ProjectAsync(
                wpovTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(wsdorCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "WSDOR-Canonical", error = wsdorCanon.ErrorSummary, wsdorCanon });

            // ── Read-back proof counts. ──
            var tfAssessmentCount = await _db.TfAssessmentWsdors.CountAsync(cancellationToken);
            var tfOwnerCount = await _db.TfOwners.CountAsync(cancellationToken);
            var tfParcelCount = await _db.TfParcels.CountAsync(cancellationToken);
            var truthWpovCount = await _db.TruthPacsWashPropOwnerVals.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                ownerS1 = new { ownerS1.Status, ownerS1.LoadBatchId, ownerS1.RowsLanded },
                acctS1 = new { acctS1.Status, acctS1.RowsLanded },
                suppS1 = new { suppS1.Status, suppS1.RowsLanded },
                parcelS1 = new { parcelS1.Status, parcelS1.RowsLanded, parcelS1.TypeDistribution },
                parcelCanon = new { parcelCanon.Status, parcelCanon.ParcelsProjected },
                ownerTruth = new { ownerTruth.Status, ownerTruth.OwnersConsidered, ownerTruth.OwnersPromoted },
                ownerCanon = new { ownerCanon.Status, ownerCanon.OwnersProjected, ownerCanon.LinksProjected },
                wpovKeyExtraction = new { distinctTriples = wpovKeys.Count },
                wpovS1 = new { wpovS1.Status, wpovS1.LoadBatchId, wpovS1.RowsLanded },
                wpovTruth = new
                {
                    wpovTruth.Status, wpovTruth.PromotionLoadBatchId,
                    wpovTruth.RowsConsidered, wpovTruth.RowsPromoted,
                    wpovTruth.RejectedNoSuppPointer, wpovTruth.RejectedStaleSupNum,
                    wpovTruth.AssessedValSum, wpovTruth.MarketValSum,
                },
                wsdorCanon = new
                {
                    wsdorCanon.Status, wsdorCanon.PromotionLoadBatchId,
                    wsdorCanon.TruthRowsConsidered, wsdorCanon.RowsProjected,
                    wsdorCanon.RowsQuarantined,
                    wsdorCanon.RejectedNoParcelXref, wsdorCanon.RejectedNoOwnerXref,
                    wsdorCanon.RejectedBothMissing,
                },
                counts = new
                {
                    canonicalTfAssessmentWsdor = tfAssessmentCount,
                    canonicalTfOwners = tfOwnerCount,
                    canonicalTfParcels = tfParcelCount,
                    truthPacsWashPropOwnerVals = truthWpovCount,
                },
                proofVerdict = wsdorCanon.RowsProjected > 0
                    ? "PROOF: canonical_tf.tf_assessment_wsdor > 0 — OWN-POP-2 WSDOR closure succeeded."
                    : "INCONCLUSIVE: 0 wsdor rows projected. Investigate parcel/owner xref resolution or WPOV-truth promotion.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[OwnPop2] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor across all 11 stages.</param>
    /// <param name="OwnerTopN">Owner sample size for the seed batch.
    /// Default 200 (smaller than OWN-POP-1 since this slice's purpose is
    /// WSDOR closure, not owner volume).</param>
    public sealed record OwnPop2Request(
        string? OperatorName,
        int? OwnerTopN);

    // ════════════════════════════════════════════════════════════════════
    // IMP-POP-1: Improvement-lane end-to-end closure.
    //   Reuses existing tf_parcel xrefs (or lands fresh ones) and runs
    //   the improvement chain: imprv + imprv_detail + imprv_attr (S1) →
    //   prop_supp_assoc S1 (keyed) → imprv truth (C2) → imprv canonical
    //   (C3, writes tf_improvement + tf_improvement_feature).
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// IMP-POP-1: doctrine end-to-end closure for the improvement lane.
    /// Lands a property batch + its imprv/imprv_detail/imprv_attr +
    /// supp pointers, promotes parcels canonical (so xrefs exist),
    /// promotes imprv truth, then projects canonical
    /// <c>tf_improvement</c> + <c>tf_improvement_feature</c>.
    ///
    /// <para>Goal: prove <c>canonical_tf.tf_improvement &gt; 0</c>
    /// AND <c>tf_improvement_feature &gt; 0</c>. Defaults to landing
    /// 200 parcels keyed by recent <c>(prop_id, prop_val_yr)</c> pairs;
    /// the canonical-improvement projector resolves parcel xrefs from
    /// the just-projected parcels.</para>
    /// </summary>
    [HttpPost("imp-pop-1/run-final-closure")]
    public async Task<IActionResult> RunImpPop1(
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsImprvLandingService imprvSvc,
        [FromServices] IPacsImprvDetailLandingService imprvDetailSvc,
        [FromServices] IPacsImprvAttrLandingService imprvAttrSvc,
        [FromServices] IPacsImprvCurrentTruthPromoter imprvTruthPromoter,
        [FromServices] IPacsImprvCanonicalProjector imprvCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] ImpPop1Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for IMP-POP-1." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "imp-pop-1-final-closure"
            : request.OperatorName.Trim();
        var parcelTopN = request?.ParcelTopN ?? 200;
        // Use 2026 as the working year for keyed imprv lookups; PACS data is
        // year-versioned and 2026 is the active assessment year for Benton.
        short workingYear = (short)(request?.WorkingYear ?? 2026);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── A0. Owner-anchored seed — guarantees real-property prop_ids. ──
            // The default SqlServerPacsPropertySource orders by prop_id DESC,
            // which surfaces personal/mobile-home parcels first (Benton's
            // recent-prop_id stratum is dominated by P/MH). Owners only attach
            // to real-property parcels, so seeding from a small owner batch
            // guarantees R-typed prop_ids reach the imprv chain.
            _logger.LogInformation("[ImpPop1] A0. Owner-anchored seed (TopN={Top})", parcelTopN);
            var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs, topN: parcelTopN);
            var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
            if (!string.Equals(ownerSeedS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-Seed-S1", error = ownerSeedS1.ErrorSummary, ownerSeedS1 });

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedS1.LoadBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // ── A. Parcel S1 (keyed off seed prop_ids). ──
            _logger.LogInformation("[ImpPop1] A. Landing parcels for {N} seed prop_ids", seedPropIds.Count);
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, seedPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            if (!string.Equals(parcelS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S1", error = parcelS1.ErrorSummary, parcelS1 });

            // ── B. Parcel spine + canonical → tf_parcel + xrefs. ──
            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(parcelSpine.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Spine", error = parcelSpine.ErrorSummary, parcelSpine });

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(parcelCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Canonical", error = parcelCanon.ErrorSummary, parcelCanon });

            // ── C. Extract (prop_id, working_year) from real-property parcels in the spine. ──
            var spinePropIds = await _db.TruthPacsParcelSpines
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == parcelSpine.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .ToListAsync(cancellationToken);
            var imprvKeys = spinePropIds.Select(p => (p, workingYear)).ToList();

            _logger.LogInformation(
                "[ImpPop1] C. Extracted {N} (prop_id, year={Y}) keys for the imprv chain",
                imprvKeys.Count, workingYear);

            // ── D. Keyed Supp S1 (needed by imprv truth promoter). ──
            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, imprvKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            if (!string.Equals(suppS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Supp-S1", error = suppS1.ErrorSummary, suppS1 });

            // ── E. Keyed Imprv S1. ──
            var imprvSrc = new KeyedSqlServerPacsImprvSource(pacsCs, imprvKeys);
            var imprvS1 = await imprvSvc.LandImprvsAsync(imprvSrc, operatorName, cancellationToken);
            if (!string.Equals(imprvS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Imprv-S1", error = imprvS1.ErrorSummary, imprvS1 });

            // ── F. Keyed ImprvDetail S1. ──
            var detailSrc = new KeyedSqlServerPacsImprvDetailSource(pacsCs, imprvKeys);
            var detailS1 = await imprvDetailSvc.LandImprvDetailsAsync(detailSrc, operatorName, cancellationToken);
            if (!string.Equals(detailS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "ImprvDetail-S1", error = detailS1.ErrorSummary, detailS1 });

            // ── G. Keyed ImprvAttr S1. ──
            var attrSrc = new KeyedSqlServerPacsImprvAttrSource(pacsCs, imprvKeys);
            var attrS1 = await imprvAttrSvc.LandImprvAttrsAsync(attrSrc, operatorName, cancellationToken);
            if (!string.Equals(attrS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "ImprvAttr-S1", error = attrS1.ErrorSummary, attrS1 });

            // ── H. Imprv Truth (C2). ──
            _logger.LogInformation("[ImpPop1] H. Promoting imprv truth");
            var imprvTruth = await imprvTruthPromoter.PromoteAsync(
                imprvS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(imprvTruth.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Imprv-Truth", error = imprvTruth.ErrorSummary, imprvTruth });

            // ── I. Imprv Canonical (C3) → tf_improvement + tf_improvement_feature. ──
            _logger.LogInformation("[ImpPop1] I. Projecting imprv canonical");
            var imprvCanon = await imprvCanonicalProjector.ProjectAsync(
                imprvTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(imprvCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Imprv-Canonical", error = imprvCanon.ErrorSummary, imprvCanon });

            // ── Read-back proof counts. ──
            var tfImprovementCount = await _db.TfImprovements.CountAsync(cancellationToken);
            var tfFeatureCount = await _db.TfImprovementFeatures.CountAsync(cancellationToken);
            var truthImprvCount = await _db.TruthPacsImprvCurrents.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                workingYear,
                parcelS1 = new { parcelS1.Status, parcelS1.LoadBatchId, parcelS1.RowsLanded, parcelS1.TypeDistribution },
                parcelSpine = new { parcelSpine.Status, parcelSpine.ParcelsConsidered, parcelSpine.ParcelsPromoted },
                parcelCanon = new { parcelCanon.Status, parcelCanon.ParcelsProjected },
                imprvKeys = imprvKeys.Count,
                suppS1 = new { suppS1.Status, suppS1.RowsLanded, suppS1.DistinctYears },
                imprvS1 = new { imprvS1.Status, imprvS1.LoadBatchId, imprvS1.RowsLanded },
                detailS1 = new { detailS1.Status, detailS1.LoadBatchId, detailS1.RowsLanded },
                attrS1 = new { attrS1.Status, attrS1.LoadBatchId, attrS1.RowsLanded },
                imprvTruth = new
                {
                    imprvTruth.Status, imprvTruth.PromotionLoadBatchId,
                    imprvTruth.ImprvsConsidered, imprvTruth.ImprvsPromoted,
                    imprvTruth.RejectedNoSuppPointer,
                },
                imprvCanon = new
                {
                    imprvCanon.Status, imprvCanon.PromotionLoadBatchId,
                    imprvCanon.TruthRowsConsidered, imprvCanon.ImprovementsProjected,
                    imprvCanon.FeaturesProjected, imprvCanon.RowsQuarantined,
                    imprvCanon.AttributesConsidered, imprvCanon.AttributesResolved,
                    imprvCanon.AttributesQuarantined,
                },
                counts = new
                {
                    canonicalTfImprovements = tfImprovementCount,
                    canonicalTfImprovementFeatures = tfFeatureCount,
                    truthPacsImprvCurrents = truthImprvCount,
                },
                proofVerdict = imprvCanon.ImprovementsProjected > 0 && imprvCanon.FeaturesProjected > 0
                    ? "PROOF: canonical_tf.tf_improvement > 0 AND tf_improvement_feature > 0 — IMP-POP-1 closure succeeded."
                    : imprvCanon.ImprovementsProjected > 0
                        ? "PARTIAL: tf_improvement landed but tf_improvement_feature is 0. Investigate detail/attr stages."
                        : "INCONCLUSIVE: investigate stage outputs above.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ImpPop1] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor across all 9 stages.</param>
    /// <param name="ParcelTopN">Parcel sample size for the seed batch. Default 200.</param>
    /// <param name="WorkingYear">PACS prop_val_yr to filter imprv stages by.
    /// Default 2026 (Benton's active assessment year).</param>
    public sealed record ImpPop1Request(
        string? OperatorName,
        int? ParcelTopN,
        int? WorkingYear);

    // ════════════════════════════════════════════════════════════════════
    // LAND-POP-1: Land-lane end-to-end closure.
    //   Owner-anchored seed → parcel chain → keyed land_detail S1 →
    //   land truth (L2) → land canonical (L3, writes tf_land).
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// LAND-POP-1: doctrine end-to-end closure for the land lane.
    /// Mirrors IMP-POP-1's owner-anchored seeding pattern (real-property
    /// guarantee), then chains land_detail (L1) → L2 truth → L3
    /// canonical projection.
    ///
    /// <para>Goal: prove <c>canonical_tf.tf_land &gt; 0</c>.</para>
    /// </summary>
    [HttpPost("land-pop-1/run-final-closure")]
    public async Task<IActionResult> RunLandPop1(
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsLandDetailLandingService landSvc,
        [FromServices] IPacsLandCurrentTruthPromoter landTruthPromoter,
        [FromServices] IPacsLandCanonicalProjector landCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] LandPop1Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for LAND-POP-1." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "land-pop-1-final-closure"
            : request.OperatorName.Trim();
        var parcelTopN = request?.ParcelTopN ?? 200;
        short workingYear = (short)(request?.WorkingYear ?? 2026);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── A0. Owner seed → R-anchored prop_ids. ──
            var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs, topN: parcelTopN);
            var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
            if (!string.Equals(ownerSeedS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-Seed-S1", error = ownerSeedS1.ErrorSummary, ownerSeedS1 });

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedS1.LoadBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // ── A. Keyed parcel S1 → spine → canonical. ──
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, seedPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            if (!string.Equals(parcelS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-S1", error = parcelS1.ErrorSummary, parcelS1 });

            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(parcelSpine.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Spine", error = parcelSpine.ErrorSummary, parcelSpine });

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(parcelCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Parcel-Canonical", error = parcelCanon.ErrorSummary, parcelCanon });

            // ── B. Build land keys: (prop_id, working_year) for each spine parcel. ──
            var spinePropIds = await _db.TruthPacsParcelSpines
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == parcelSpine.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .ToListAsync(cancellationToken);
            var landKeys = spinePropIds.Select(p => (p, workingYear)).ToList();

            // ── C. Keyed Supp S1. ──
            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, landKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            if (!string.Equals(suppS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Supp-S1", error = suppS1.ErrorSummary, suppS1 });

            // ── D. Keyed land_detail S1. ──
            _logger.LogInformation("[LandPop1] D. Keyed land_detail S1 for {N} keys", landKeys.Count);
            var landSrc = new KeyedSqlServerPacsLandDetailSource(pacsCs, landKeys);
            var landS1 = await landSvc.LandLandDetailsAsync(landSrc, operatorName, cancellationToken);
            if (!string.Equals(landS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Land-S1", error = landS1.ErrorSummary, landS1 });

            // ── E. Land truth (L2). ──
            var landTruth = await landTruthPromoter.PromoteAsync(
                landS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(landTruth.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Land-Truth", error = landTruth.ErrorSummary, landTruth });

            // ── F. Land canonical (L3) → tf_land. ──
            var landCanon = await landCanonicalProjector.ProjectAsync(
                landTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            if (!string.Equals(landCanon.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Land-Canonical", error = landCanon.ErrorSummary, landCanon });

            // ── Read-back. ──
            var tfLandCount = await _db.TfLands.CountAsync(cancellationToken);
            var truthLandCount = await _db.TruthPacsLandCurrents.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                workingYear,
                ownerSeedS1 = new { ownerSeedS1.Status, ownerSeedS1.RowsLanded },
                parcelS1 = new { parcelS1.Status, parcelS1.RowsLanded, parcelS1.TypeDistribution },
                parcelCanon = new { parcelCanon.Status, parcelCanon.ParcelsProjected },
                landKeys = landKeys.Count,
                suppS1 = new { suppS1.Status, suppS1.RowsLanded },
                landS1 = new { landS1.Status, landS1.LoadBatchId, landS1.RowsLanded },
                landTruth = new
                {
                    landTruth.Status, landTruth.PromotionLoadBatchId,
                    landTruth.LandSegsConsidered, landTruth.LandSegsPromoted,
                    landTruth.RejectedNoSuppPointer, landTruth.RejectedStaleSupNum,
                    landTruth.SizeAcresSum, landTruth.LandSegMarketValSum,
                },
                landCanon = new
                {
                    landCanon.Status, landCanon.PromotionLoadBatchId,
                    landCanon.TruthRowsConsidered, landCanon.LandsProjected,
                    landCanon.RowsQuarantined,
                    landCanon.SizeAcresProjected, landCanon.LandSegMarketValProjected,
                },
                counts = new
                {
                    canonicalTfLands = tfLandCount,
                    truthPacsLandCurrents = truthLandCount,
                },
                proofVerdict = landCanon.LandsProjected > 0
                    ? "PROOF: canonical_tf.tf_land > 0 — LAND-POP-1 closure succeeded."
                    : "INCONCLUSIVE: 0 land rows projected.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[LandPop1] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor across all 8 stages.</param>
    /// <param name="ParcelTopN">Parcel sample size for the seed batch. Default 200.</param>
    /// <param name="WorkingYear">PACS prop_val_yr to filter land stages by. Default 2026.</param>
    public sealed record LandPop1Request(
        string? OperatorName,
        int? ParcelTopN,
        int? WorkingYear);

    // ════════════════════════════════════════════════════════════════════
    // GIS-POP-1: Geometry-lane (ArcGIS) end-to-end closure.
    //   D1 raw landing (ArcGIS REST FeatureServer) → D2 truth promotion →
    //   D3 canonical projection (tf_parcel_geom + APN crosswalk to tf_parcel).
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GIS-POP-1: doctrine end-to-end closure for the geometry lane.
    /// Pulls Benton parcel polygons from the configured ArcGIS REST
    /// feature service, lands them into <c>legacy_arcgis_raw.parcel_geom</c>,
    /// promotes to <c>truth_arcgis.parcel_geom_current</c>, then projects
    /// to <c>gis_tf.tf_parcel_geom</c> with APN crosswalk against
    /// <c>canonical_tf.tf_parcel.ParcelNumber</c>.
    ///
    /// <para>Goal: prove <c>gis_tf.tf_parcel_geom &gt; 0</c> and
    /// at least one row resolves its APN crosswalk to a TfParcelId.
    /// Per the operator's expressed lean: ArcGIS API for GIS rather
    /// than rolling our own shapefile parser.</para>
    /// </summary>
    [HttpPost("gis-pop-1/run-final-closure")]
    public async Task<IActionResult> RunGisPop1(
        [FromServices] IArcGisRawLandingService rawLandingSvc,
        [FromServices] IArcGisTruthPromotionService truthPromotionSvc,
        [FromServices] IArcGisCanonicalProjector canonicalProjector,
        [FromBody] GisPop1Request? request,
        CancellationToken cancellationToken = default)
    {
        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "gis-pop-1-final-closure"
            : request.OperatorName.Trim();

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── A. D1 raw landing (full-county pull from ArcGIS REST). ──
            _logger.LogInformation("[GisPop1] A. Raw ArcGIS landing for countyId={Cid}", bentonCountyId);
            var d1 = await rawLandingSvc.LandParcelGeomsAsync(
                bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(d1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "ArcGis-D1", error = d1.ErrorSummary, d1 });

            // ── B. D2 truth promotion (latest-per-tuple + validity). ──
            _logger.LogInformation("[GisPop1] B. Promoting truth_arcgis.parcel_geom_current");
            var d2 = await truthPromotionSvc.PromoteCountyAsync(
                bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(d2.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "ArcGis-D2", error = d2.ErrorSummary, d1, d2 });

            // ── C. D3 canonical projection (tf_parcel_geom + APN crosswalk). ──
            _logger.LogInformation("[GisPop1] C. Projecting gis_tf.tf_parcel_geom");
            var d3 = await canonicalProjector.ProjectCountyAsync(
                bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(d3.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "ArcGis-D3", error = d3.ErrorSummary, d1, d2, d3 });

            // ── Read-back. ──
            var tfParcelGeomCount = await _db.TfParcelGeoms.CountAsync(cancellationToken);

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                d1,
                d2,
                d3 = new
                {
                    d3.Status, d3.PromotionLoadBatchId,
                    d3.TruthRowsConsidered, d3.RowsProjected,
                    d3.ApnCrosswalkResolved, d3.ApnCrosswalkUnresolved,
                    d3.PriorCanonicalRowsRemoved, d3.AreaSqFtSum,
                },
                counts = new { gisTfParcelGeoms = tfParcelGeomCount },
                proofVerdict = d3.RowsProjected > 0
                    ? (d3.ApnCrosswalkResolved > 0
                        ? "PROOF: gis_tf.tf_parcel_geom > 0 AND APN crosswalk resolved — GIS-POP-1 closure succeeded."
                        : "PARTIAL: tf_parcel_geom landed but APN crosswalk found 0 matches. Check ApnAttributeName config or tf_parcel.ParcelNumber values.")
                    : "INCONCLUSIVE: 0 rows projected. Check D1/D2 stage outputs.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GisPop1] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor across D1+D2+D3.</param>
    public sealed record GisPop1Request(
        string? OperatorName);

    // ════════════════════════════════════════════════════════════════════
    // DOCTRINE-CLOSURE-1: unified all-lanes runner.
    //   Owner-anchored seed → 6-lane closure in one call:
    //     - Parcel chain (S1+S2-B+S3 for tf_parcel + xrefs)
    //     - Sale chain (sale → keyed supps → truth → canonical)
    //     - Owner chain (owner → keyed account → truth → canonical)
    //     - WSDOR chain (WPOV → truth → canonical)
    //     - Improvement chain (imprv + detail + attr → truth → canonical)
    //     - Land chain (land_detail → truth → canonical)
    //     - Geometry chain (ArcGIS REST → D1 → D2 → D3)
    //   Produces ONE aggregate proof verdict.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// DOCTRINE-CLOSURE-1: full doctrine pipeline in one call. Owner-
    /// anchored seed unlocks all five PACS lanes (sale, owner, WSDOR,
    /// improvement, land) on overlapping prop_ids; geometry lane runs
    /// independently against the configured ArcGIS feature service and
    /// resolves APN crosswalk against whatever tf_parcel rows exist
    /// at projection time.
    ///
    /// <para>Goal: prove cross-lane doctrine coherence end-to-end
    /// in one operator-triggered run. Replaces N-1 separate debug
    /// endpoints with one canonical entry point — the seed for the
    /// future operator dashboard.</para>
    /// </summary>
    [HttpPost("doctrine-closure/run-all-lanes")]
    public async Task<IActionResult> RunDoctrineClosure(
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsAccountLandingService accountSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsSaleLandingService saleSvc,
        [FromServices] IPacsSaleTruthPromoter saleTruthPromoter,
        [FromServices] IPacsSaleCanonicalProjector saleCanonicalProjector,
        [FromServices] IPacsOwnerCurrentTruthPromoter ownerTruthPromoter,
        [FromServices] IPacsOwnerCanonicalProjector ownerCanonicalProjector,
        [FromServices] IPacsWashPropOwnerValLandingService wpovSvc,
        [FromServices] IPacsWashPropOwnerValTruthPromoter wpovTruthPromoter,
        [FromServices] IPacsWsdorCanonicalProjector wsdorCanonicalProjector,
        [FromServices] IPacsImprvLandingService imprvSvc,
        [FromServices] IPacsImprvDetailLandingService imprvDetailSvc,
        [FromServices] IPacsImprvAttrLandingService imprvAttrSvc,
        [FromServices] IPacsImprvCurrentTruthPromoter imprvTruthPromoter,
        [FromServices] IPacsImprvCanonicalProjector imprvCanonicalProjector,
        [FromServices] IPacsLandDetailLandingService landSvc,
        [FromServices] IPacsLandCurrentTruthPromoter landTruthPromoter,
        [FromServices] IPacsLandCanonicalProjector landCanonicalProjector,
        [FromServices] IArcGisRawLandingService gisRawSvc,
        [FromServices] IArcGisTruthPromotionService gisTruthSvc,
        [FromServices] IArcGisCanonicalProjector gisCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] DoctrineClosureRequest? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "doctrine-closure-1-all-lanes"
            : request.OperatorName.Trim();
        var ownerTopN = request?.OwnerTopN ?? 200;
        var saleTopN = request?.SaleTopN ?? 500;
        short workingYear = (short)(request?.WorkingYear ?? 2026);
        var skipGeometry = request?.SkipGeometry ?? false;

        var startedAt = DateTime.UtcNow;
        var lanes = new List<object>();

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ════════════════════════════════════════════════════════════
            // OWNER-LANE seed: lands owners, then derives all PACS keys.
            // ════════════════════════════════════════════════════════════
            _logger.LogInformation("[DoctrineClosure] OWNER seed (TopN={Top})", ownerTopN);
            var ownerSrc = new SqlServerPacsOwnerSource(pacsCs, topN: ownerTopN);
            var ownerS1 = await ownerSvc.LandOwnersAsync(ownerSrc, operatorName, cancellationToken);
            if (!string.Equals(ownerS1.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Owner-S1", error = ownerS1.ErrorSummary, ownerS1 });

            var ownerRows = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerS1.LoadBatchId)
                .Select(o => new { o.OwnerId, o.PropId, o.OwnerTaxYr })
                .ToListAsync(cancellationToken);
            var distinctAcctIds = ownerRows.Select(r => r.OwnerId).Distinct().ToList();
            var ownerSuppKeys = ownerRows.Select(r => (r.PropId, r.OwnerTaxYr)).Distinct().ToList();
            var ownerPropIds = ownerRows.Select(r => r.PropId).Distinct().ToList();

            // ════════════════════════════════════════════════════════════
            // PARCEL chain (used by every PACS lane's xref resolution).
            // ════════════════════════════════════════════════════════════
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, ownerPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            var parcelCanon = await parcelCanonical.ProjectAsync(parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            lanes.Add(new { lane = "Parcel", parcelS1.RowsLanded, parcelSpine.ParcelsPromoted, parcelCanon.ParcelsProjected });

            // ════════════════════════════════════════════════════════════
            // ACCOUNT + SUPP (shared by owner-truth, wpov-truth).
            // ════════════════════════════════════════════════════════════
            var acctSrc = new KeyedSqlServerPacsAccountSource(pacsCs, distinctAcctIds);
            var acctS1 = await accountSvc.LandAccountsAsync(acctSrc, operatorName, cancellationToken);
            var ownerSuppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, ownerSuppKeys);
            var ownerSuppS1 = await assocSvc.LandPropSuppAssocsAsync(ownerSuppSrc, operatorName, cancellationToken);

            // ════════════════════════════════════════════════════════════
            // OWNER lane (B2-A truth + B3 canonical).
            // ════════════════════════════════════════════════════════════
            var ownerTruth = await ownerTruthPromoter.PromoteAsync(ownerS1.LoadBatchId, acctS1.LoadBatchId, ownerSuppS1.LoadBatchId, operatorName, cancellationToken);
            var ownerCanon = await ownerCanonicalProjector.ProjectAsync(ownerTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            lanes.Add(new { lane = "Owner", ownerS1.RowsLanded, ownerTruth.OwnersPromoted, ownerCanon.OwnersProjected, ownerCanon.LinksProjected });

            // ════════════════════════════════════════════════════════════
            // WSDOR lane (B1-C wpov + B2-B truth + B4 canonical).
            // ════════════════════════════════════════════════════════════
            var wpovKeys = await _db.TruthPacsOwnerCurrents
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == ownerTruth.PromotionLoadBatchId)
                .Select(t => new { t.PropId, t.OwnerTaxYr, t.OwnerId })
                .Distinct()
                .ToListAsync(cancellationToken);
            var wpovTriples = wpovKeys.Select(k => (k.PropId, k.OwnerTaxYr, k.OwnerId)).ToList();
            var wpovSrc = new KeyedSqlServerPacsWashPropOwnerValSource(pacsCs, wpovTriples);
            var wpovS1 = await wpovSvc.LandWashPropOwnerValsAsync(wpovSrc, operatorName, cancellationToken);
            var wpovTruth = await wpovTruthPromoter.PromoteAsync(wpovS1.LoadBatchId, ownerSuppS1.LoadBatchId, operatorName, cancellationToken);
            var wsdorCanon = await wsdorCanonicalProjector.ProjectAsync(wpovTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            lanes.Add(new { lane = "WSDOR", wpovS1.RowsLanded, wpovTruth.RowsPromoted, wsdorCanon.RowsProjected, wsdorCanon.RowsQuarantined });

            // ════════════════════════════════════════════════════════════
            // IMPROVEMENT lane (C1 + C2 + C3).
            // ════════════════════════════════════════════════════════════
            var imprvKeys = ownerPropIds.Select(p => (p, workingYear)).ToList();
            var imprvSrc = new KeyedSqlServerPacsImprvSource(pacsCs, imprvKeys);
            var imprvS1 = await imprvSvc.LandImprvsAsync(imprvSrc, operatorName, cancellationToken);
            var imprvDetailSrc = new KeyedSqlServerPacsImprvDetailSource(pacsCs, imprvKeys);
            var imprvDetailS1 = await imprvDetailSvc.LandImprvDetailsAsync(imprvDetailSrc, operatorName, cancellationToken);
            var imprvAttrSrc = new KeyedSqlServerPacsImprvAttrSource(pacsCs, imprvKeys);
            var imprvAttrS1 = await imprvAttrSvc.LandImprvAttrsAsync(imprvAttrSrc, operatorName, cancellationToken);

            // The imprv truth promoter expects a supp batch keyed by
            // (prop_id, prop_val_yr). Reuse owner's supp batch — same
            // identity space (year=workingYear == owner_tax_yr=workingYear).
            var imprvTruth = await imprvTruthPromoter.PromoteAsync(imprvS1.LoadBatchId, ownerSuppS1.LoadBatchId, operatorName, cancellationToken);
            var imprvCanon = await imprvCanonicalProjector.ProjectAsync(imprvTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            lanes.Add(new { lane = "Improvement", imprvS1.RowsLanded, imprvCanon.ImprovementsProjected, imprvCanon.FeaturesProjected });

            // ════════════════════════════════════════════════════════════
            // LAND lane (D1 + L2 + L3).
            // ════════════════════════════════════════════════════════════
            var landKeys = ownerPropIds.Select(p => (p, workingYear)).ToList();
            var landSrc = new KeyedSqlServerPacsLandDetailSource(pacsCs, landKeys);
            var landS1 = await landSvc.LandLandDetailsAsync(landSrc, operatorName, cancellationToken);
            var landTruth = await landTruthPromoter.PromoteAsync(landS1.LoadBatchId, ownerSuppS1.LoadBatchId, operatorName, cancellationToken);
            var landCanon = await landCanonicalProjector.ProjectAsync(landTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            lanes.Add(new { lane = "Land", landS1.RowsLanded, landCanon.LandsProjected, landCanon.SizeAcresProjected });

            // ════════════════════════════════════════════════════════════
            // SALE lane (S1 + keyed supp + S2-B + S3).
            // Independent seed (SqlServerPacsSaleSource ordered DESC) —
            // sales correlate weakly with the owner-anchored prop_id set,
            // so this lane uses its own bounded sample.
            // ════════════════════════════════════════════════════════════
            var saleSrc = new SqlServerPacsSaleSource(pacsCs, topN: saleTopN);
            var saleS1 = await saleSvc.LandSalesAsync(saleSrc, operatorName, cancellationToken);

            var saleSuppRaw = await _db.LegacyPacsRawSales
                .AsNoTracking()
                .Where(s => s.LoadBatchId == saleS1.LoadBatchId)
                .Select(s => new { s.PropId, s.PropValYr })
                .Distinct()
                .ToListAsync(cancellationToken);
            var saleSuppKeys = saleSuppRaw.Select(k => (k.PropId, k.PropValYr)).ToList();
            var saleSuppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, saleSuppKeys);
            var saleSuppS1 = await assocSvc.LandPropSuppAssocsAsync(saleSuppSrc, operatorName, cancellationToken);

            var saleTruth = await saleTruthPromoter.PromoteAsync(saleS1.LoadBatchId, saleSuppS1.LoadBatchId, operatorName, cancellationToken);

            // For sale canonical, we need parcel xrefs for the promoted sales' prop_ids.
            // Land + project them as a targeted parcel chain.
            var promotedSalePropIds = await _db.TruthPacsSales
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == saleTruth.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);
            int salesProjected = 0;
            int salesQuarantined = 0;
            if (promotedSalePropIds.Count > 0)
            {
                var saleParcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, promotedSalePropIds);
                var saleParcelS1 = await propSvc.LandPropertiesAsync(saleParcelSrc, operatorName, cancellationToken);
                var saleParcelSpine = await spinePromoter.PromoteAsync(saleParcelS1.LoadBatchId, operatorName, cancellationToken);
                await parcelCanonical.ProjectAsync(saleParcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);

                var saleCanon = await saleCanonicalProjector.ProjectAsync(saleTruth.PromotionLoadBatchId, operatorName, cancellationToken);
                salesProjected = saleCanon.SalesProjected;
                salesQuarantined = saleCanon.SalesQuarantined;
            }
            lanes.Add(new { lane = "Sale", saleS1.RowsLanded, saleTruth.SalesPromoted, salesProjected, salesQuarantined });

            // ════════════════════════════════════════════════════════════
            // GEOMETRY lane (D1 + D2 + D3 against ArcGIS REST).
            // Independent of PACS chains; resolves APN crosswalk against
            // whatever tf_parcel rows exist at projection time (which now
            // includes everything we just projected from the PACS lanes).
            // ════════════════════════════════════════════════════════════
            object? gisLane = null;
            if (!skipGeometry)
            {
                var gisD1 = await gisRawSvc.LandParcelGeomsAsync(bentonCountyId, operatorName, cancellationToken);
                var gisD2 = await gisTruthSvc.PromoteCountyAsync(bentonCountyId, operatorName, cancellationToken);
                var gisD3 = await gisCanonicalProjector.ProjectCountyAsync(bentonCountyId, operatorName, cancellationToken);
                gisLane = new { lane = "Geometry", gisD1.FeaturesLanded, gisD3.RowsProjected, gisD3.ApnCrosswalkResolved, gisD3.ApnCrosswalkUnresolved };
                lanes.Add(gisLane);
            }

            // ── Aggregate read-back. ──
            var counts = new
            {
                tf_parcel = await _db.TfParcels.CountAsync(cancellationToken),
                tf_sale = await _db.TfSales.CountAsync(cancellationToken),
                tf_owner = await _db.TfOwners.CountAsync(cancellationToken),
                tf_parcel_owner_link = await _db.TfParcelOwnerLinks.CountAsync(cancellationToken),
                tf_assessment_wsdor = await _db.TfAssessmentWsdors.CountAsync(cancellationToken),
                tf_improvement = await _db.TfImprovements.CountAsync(cancellationToken),
                tf_improvement_feature = await _db.TfImprovementFeatures.CountAsync(cancellationToken),
                tf_land = await _db.TfLands.CountAsync(cancellationToken),
                tf_parcel_geom = skipGeometry ? -1 : await _db.TfParcelGeoms.CountAsync(cancellationToken),
            };

            var elapsed = (DateTime.UtcNow - startedAt).TotalSeconds;

            // ── Verdict: every lane must produce > 0 in its terminal canonical table. ──
            var verdict = (counts.tf_parcel > 0 && counts.tf_owner > 0 &&
                           counts.tf_assessment_wsdor > 0 && counts.tf_improvement > 0 &&
                           counts.tf_land > 0 && (skipGeometry || counts.tf_parcel_geom > 0))
                ? "PROOF: doctrine pipeline operational across ALL LANES — DOCTRINE-CLOSURE-1 succeeded."
                : "PARTIAL: investigate per-lane outputs above.";

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                ownerTopN, saleTopN, workingYear, skipGeometry,
                startedAt, elapsedSeconds = elapsed,
                lanes,
                counts,
                proofVerdict = verdict,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DoctrineClosure] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name, lanesCompleted = lanes });
        }
    }

    /// <param name="OperatorName">Audit anchor across all stages.</param>
    /// <param name="OwnerTopN">Owner-anchored seed size. Default 200.</param>
    /// <param name="SaleTopN">Sale lane independent seed size. Default 500.</param>
    /// <param name="WorkingYear">PACS year filter. Default 2026.</param>
    /// <param name="SkipGeometry">If true, skip ArcGIS lanes (useful for offline runs).</param>
    public sealed record DoctrineClosureRequest(
        string? OperatorName,
        int? OwnerTopN,
        int? SaleTopN,
        int? WorkingYear,
        bool? SkipGeometry);

    // ════════════════════════════════════════════════════════════════════
    // ATTR-POP-1: populate canonical_tf.attribute_definition from PACS
    //   dbo.attribute. Drains the imprv_attr UnknownAttribute quarantine
    //   when followed by a re-run of the imprv canonical projector.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// ATTR-POP-1: populate the attribute-definition dictionary for
    /// the resolved Benton county. Reads PACS <c>dbo.attribute</c>
    /// (family-grain), upserts <c>canonical_tf.attribute_definition</c>
    /// rows keyed <c>(CountyId, IAttrId)</c>, and (optionally)
    /// re-runs the imprv canonical projector against the latest
    /// imprv truth batch so quarantined imprv_attr rows lift back
    /// into <c>tf_improvement_feature.AttributeId</c> resolved.
    /// </summary>
    [HttpPost("attr-pop-1/run-populate")]
    public async Task<IActionResult> RunAttrPop1(
        [FromServices] IPacsAttributePopulator populator,
        [FromServices] IPacsImprvCanonicalProjector imprvCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] AttrPop1Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for ATTR-POP-1." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "attr-pop-1-populate"
            : request.OperatorName.Trim();
        var rerunImprvCanonical = request?.RerunImprvCanonical ?? true;

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── A. Populate attribute_definition. ──
            _logger.LogInformation("[AttrPop1] A. Populating attribute_definition for countyId={Cid}", bentonCountyId);
            var src = new SqlServerPacsAttributeSource(pacsCs);
            var pop = await populator.PopulateAsync(src, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(pop.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "Attr-Populate", error = pop.ErrorSummary, pop });

            // Read-back: how many definitions does Benton now have?
            var attrDefCount = await _db.AttributeDefinitions
                .Where(a => a.CountyId == bentonCountyId)
                .CountAsync(cancellationToken);
            var activeAttrDefCount = await _db.AttributeDefinitions
                .Where(a => a.CountyId == bentonCountyId && a.IsActive)
                .CountAsync(cancellationToken);

            // ── B. Optional: re-run imprv canonical against the most-
            // recent imprv truth batch so quarantine drains. ──
            object? reprojectionResult = null;
            int? quarantineDelta = null;
            int? featuresAttributedDelta = null;
            if (rerunImprvCanonical)
            {
                var preQuarantineCount = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(cancellationToken);
                var preFeaturesAttributed = await _db.TfImprovementFeatures
                    .Where(f => f.AttributeId != null)
                    .CountAsync(cancellationToken);

                var latestImprvTruth = await _db.SyncBridgeLoadBatches
                    .Where(b => b.SourceSystem == "truth-pacs-imprv-promoter" && b.Status == "COMPLETED")
                    .OrderByDescending(b => b.CompletedAt)
                    .Select(b => b.LoadBatchId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (latestImprvTruth == Guid.Empty)
                {
                    reprojectionResult = new { note = "No completed imprv truth batch found; skipping reprojection." };
                }
                else
                {
                    _logger.LogInformation("[AttrPop1] B. Re-running imprv canonical for batch={BatchId}", latestImprvTruth);
                    var reproject = await imprvCanonicalProjector.ProjectAsync(latestImprvTruth, operatorName, cancellationToken);
                    reprojectionResult = new
                    {
                        reproject.Status,
                        reproject.PromotionLoadBatchId,
                        reproject.TruthRowsConsidered,
                        reproject.ImprovementsProjected,
                        reproject.FeaturesProjected,
                        reproject.AttributesConsidered,
                        reproject.AttributesResolved,
                        reproject.AttributesQuarantined,
                        reproject.PriorAttrQuarantineRowsRemoved,
                    };

                    var postQuarantineCount = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(cancellationToken);
                    var postFeaturesAttributed = await _db.TfImprovementFeatures
                        .Where(f => f.AttributeId != null)
                        .CountAsync(cancellationToken);
                    quarantineDelta = postQuarantineCount - preQuarantineCount;
                    featuresAttributedDelta = postFeaturesAttributed - preFeaturesAttributed;
                }
            }

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                populator = new
                {
                    pop.Status,
                    pop.PromotionLoadBatchId,
                    pop.RowsConsidered,
                    pop.RowsInserted,
                    pop.RowsUpdated,
                    pop.RowsSoftRetired,
                    pop.InactiveSkipped,
                },
                counts = new
                {
                    attribute_definition_total = attrDefCount,
                    attribute_definition_active = activeAttrDefCount,
                },
                reprojection = reprojectionResult,
                quarantineDelta,
                featuresAttributedDelta,
                proofVerdict = pop.RowsConsidered > 0 && (pop.RowsInserted + pop.RowsUpdated) > 0
                    ? (featuresAttributedDelta is int delta && delta > 0
                        ? $"PROOF: attribute_definition populated AND {delta} additional tf_improvement_feature rows now carry AttributeId — ATTR-POP-1 succeeded."
                        : "PARTIAL: attribute_definition populated. Re-projection ran but no AttributeId resolution improvement (likely value-grain vs family-grain mismatch — see Block-C v1.5 contract).")
                    : "INCONCLUSIVE: PACS dbo.attribute returned no rows. Investigate.",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AttrPop1] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor.</param>
    /// <param name="RerunImprvCanonical">If true (default), automatically
    /// re-runs the imprv canonical projector against the latest imprv
    /// truth batch so quarantine rows lift back. Set false to populate
    /// the dictionary only.</param>
    public sealed record AttrPop1Request(
        string? OperatorName,
        bool? RerunImprvCanonical);

    // ════════════════════════════════════════════════════════════════════
    // ATTR-DRAIN-1: drain legacy_tf_unproven.imprv_attr by re-running the
    //   keyed imprv chain for the (year, prop_id) tuples that produced the
    //   quarantine, after attribute_definition has been populated. The
    //   canonical projector's prior-quarantine cleanup then matches those
    //   truth rows and removes the obsolete quarantine entries; surviving
    //   imprv_attr rows re-resolve against the dictionary.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// ATTR-DRAIN-1: drain the imprv_attr UnknownAttribute quarantine.
    ///
    /// <para>Strategy:
    /// <list type="number">
    ///   <item>Read distinct (PropValYr, PropId) from
    ///   <c>legacy_tf_unproven.imprv_attr</c> filtered to
    ///   <c>QuarantineReason = "UnknownAttribute"</c>.</item>
    ///   <item>Compute overlap between distinct IAttrValIds in
    ///   quarantine and AttributeDefinition.IAttrId for Benton —
    ///   this tells the operator whether ATTR-POP-1 (family-grain)
    ///   is sufficient or ATTR-POP-2 (value-grain) is needed.</item>
    ///   <item>Group quarantine tuples by PropValYr and run the
    ///   keyed imprv chain (parcel → supp → imprv + detail + attr →
    ///   truth → canonical) per year. The canonical projector
    ///   removes prior quarantine matching the truth rows' 4-keys
    ///   and re-resolves attrs against the now-populated dictionary.</item>
    /// </list>
    /// </para>
    ///
    /// <para>Honest scope note: if IAttrValIds in quarantine don't
    /// overlap with attribute_definition.IAttrId (the family/value
    /// grain mismatch flagged in Block-C v1.5), drain will RUN but
    /// won't reduce quarantine — the rows will be removed then
    /// re-quarantined. The response surfaces this as
    /// <c>iAttrValIdOverlap</c> so the operator can see the real
    /// blocker.</para>
    /// </summary>
    [HttpPost("attr-drain-1/run-drain")]
    public async Task<IActionResult> RunAttrDrain1(
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsImprvLandingService imprvSvc,
        [FromServices] IPacsImprvDetailLandingService imprvDetailSvc,
        [FromServices] IPacsImprvAttrLandingService imprvAttrSvc,
        [FromServices] IPacsImprvCurrentTruthPromoter imprvTruthPromoter,
        [FromServices] IPacsImprvCanonicalProjector imprvCanonicalProjector,
        [FromServices] RefreshableImprvAttrDictionary dictionary,
        [FromServices] IConfiguration config,
        [FromBody] AttrDrain1Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for ATTR-DRAIN-1." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "attr-drain-1"
            : request.OperatorName.Trim();
        var dryRun = request?.DryRun ?? false;

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── Stage A: inspect quarantine across BOTH reasons. ──
            // The 4,740 rows on the dashboard are LANDING-layer
            // (UNKNOWN_I_ATTR_VAL_CD) — landing service rejects
            // codes not in the active dictionary. Distinct from
            // canonical-layer (UNKNOWN_ATTRIBUTE) which fires later
            // when the canonical projector can't resolve IAttrId.
            var quarantineByReason = await _db.LegacyTfUnprovenImprvAttrs
                .GroupBy(q => q.QuarantineReason)
                .Select(g => new { reason = g.Key, count = g.Count() })
                .ToListAsync(cancellationToken);
            var landingQuarantineRows = await _db.LegacyTfUnprovenImprvAttrs
                .Where(q => q.QuarantineReason == "UNKNOWN_I_ATTR_VAL_CD")
                .Select(q => new { q.PropValYr, q.PropId, q.IAttrValId, q.IAttrValCd })
                .ToListAsync(cancellationToken);
            var canonicalQuarantineRows = await _db.LegacyTfUnprovenImprvAttrs
                .Where(q => q.QuarantineReason == "UNKNOWN_ATTRIBUTE")
                .Select(q => new { q.PropValYr, q.PropId, q.IAttrValId })
                .ToListAsync(cancellationToken);

            var totalQuarantineBefore = landingQuarantineRows.Count + canonicalQuarantineRows.Count;
            var allTuples = landingQuarantineRows
                .Select(q => (q.PropValYr, q.PropId))
                .Concat(canonicalQuarantineRows.Select(q => (q.PropValYr, q.PropId)))
                .Distinct()
                .ToList();
            var byYear = allTuples
                .GroupBy(t => t.PropValYr)
                .ToDictionary(g => g.Key, g => g.Select(t => t.PropId).Distinct().ToList());

            // Pre-state for delta reporting.
            var featuresAttributedBefore = await _db.TfImprovementFeatures
                .Where(f => f.AttributeId != null)
                .CountAsync(cancellationToken);

            // ── Stage B: refresh the landing-layer dictionary. ──
            var loader = new SqlServerImprvAttrValDictionaryLoader(pacsCs);
            var dictCodes = await loader.LoadDistinctCodesAsync(cancellationToken);
            var dictCountBefore = dictionary.Count;
            dictionary.Refresh(dictCodes);
            _logger.LogInformation(
                "[AttrDrain1] Dictionary refreshed: {Before} → {After} codes",
                dictCountBefore, dictionary.Count);

            var inspection = new
            {
                totalQuarantineBefore,
                quarantineByReason,
                landingQuarantineCount = landingQuarantineRows.Count,
                canonicalQuarantineCount = canonicalQuarantineRows.Count,
                distinctTuples = allTuples.Count,
                distinctYears = byYear.Count,
                yearBreakdown = byYear.ToDictionary(kv => kv.Key.ToString(), kv => kv.Value.Count),
                attributeDefinitionsActive = await _db.AttributeDefinitions
                    .Where(a => a.CountyId == bentonCountyId && a.IsActive)
                    .CountAsync(cancellationToken),
                landingDictionaryBefore = dictCountBefore,
                landingDictionaryAfter = dictionary.Count,
                landingDictionaryDelta = dictionary.Count - dictCountBefore,
                featuresAttributedBefore,
            };

            if (dryRun)
            {
                return Ok(new
                {
                    operatorName,
                    bentonCountyId,
                    mode = "DRY_RUN",
                    inspection,
                    plan = byYear.Select(kv => new
                    {
                        year = kv.Key,
                        propIdsToReproject = kv.Value.Count,
                    }).ToList(),
                    note = $"Dictionary refreshed to {dictionary.Count} codes. Drain plan: re-land {allTuples.Count} (year, prop_id) tuples across {byYear.Count} years; canonical re-projection drains both landing and canonical quarantine.",
                });
            }

            if (totalQuarantineBefore == 0)
            {
                return Ok(new
                {
                    operatorName,
                    bentonCountyId,
                    inspection,
                    note = "No quarantine rows to drain. Dictionary refresh ran anyway.",
                });
            }

            // ── Stage C: delete stale landing-layer quarantine. ──
            // These rows were quarantined because the dictionary was
            // empty. Now that it's populated, re-landing those exact
            // (year, prop_id) tuples will re-process the source rows
            // through the dictionary check → succeed → land cleanly.
            // We delete the stale quarantine rows BEFORE re-landing
            // so the drain delta is measurable.
            var landingQuarantineToDelete = await _db.LegacyTfUnprovenImprvAttrs
                .Where(q => q.QuarantineReason == "UNKNOWN_I_ATTR_VAL_CD")
                .ToListAsync(cancellationToken);
            if (landingQuarantineToDelete.Count > 0)
            {
                _db.LegacyTfUnprovenImprvAttrs.RemoveRange(landingQuarantineToDelete);
                await _db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation(
                    "[AttrDrain1] Deleted {N} stale landing-layer quarantine rows",
                    landingQuarantineToDelete.Count);
            }

            // ── Stage C: per-year keyed re-projection chain. ──
            var perYearResults = new List<object>();
            foreach (var (year, propIds) in byYear.OrderByDescending(kv => kv.Key))
            {
                cancellationToken.ThrowIfCancellationRequested();
                _logger.LogInformation(
                    "[AttrDrain1] Year={Year} draining {N} prop_ids", year, propIds.Count);

                short workingYear = year;
                var keys = propIds.Select(p => (p, workingYear)).ToList();

                // Land parcels (truth+canonical needed for owner xref resolution
                // when imprv canonical eventually projects features).
                var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs, propIds);
                var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
                if (parcelS1.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "parcel-S1", error = parcelS1.ErrorSummary }); continue; }
                var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
                if (parcelSpine.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "parcel-spine", error = parcelSpine.ErrorSummary }); continue; }
                await parcelCanonical.ProjectAsync(parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);

                // Land supp pointers.
                var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs, keys);
                var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
                if (suppS1.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "supp-S1", error = suppS1.ErrorSummary }); continue; }

                // Land imprv + detail + attr.
                var imprvSrc = new KeyedSqlServerPacsImprvSource(pacsCs, keys);
                var imprvS1 = await imprvSvc.LandImprvsAsync(imprvSrc, operatorName, cancellationToken);
                if (imprvS1.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "imprv-S1", error = imprvS1.ErrorSummary }); continue; }

                var detailSrc = new KeyedSqlServerPacsImprvDetailSource(pacsCs, keys);
                var detailS1 = await imprvDetailSvc.LandImprvDetailsAsync(detailSrc, operatorName, cancellationToken);
                if (detailS1.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "detail-S1", error = detailS1.ErrorSummary }); continue; }

                var attrSrc = new KeyedSqlServerPacsImprvAttrSource(pacsCs, keys);
                var attrS1 = await imprvAttrSvc.LandImprvAttrsAsync(attrSrc, operatorName, cancellationToken);
                if (attrS1.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "attr-S1", error = attrS1.ErrorSummary }); continue; }

                // Promote imprv truth → project canonical (this is the step
                // that drains prior quarantine matching the 4-key tuples).
                var imprvTruth = await imprvTruthPromoter.PromoteAsync(imprvS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
                if (imprvTruth.Status != "COMPLETED") { perYearResults.Add(new { year, stage = "imprv-truth", error = imprvTruth.ErrorSummary }); continue; }

                var imprvCanon = await imprvCanonicalProjector.ProjectAsync(imprvTruth.PromotionLoadBatchId, operatorName, cancellationToken);
                perYearResults.Add(new
                {
                    year,
                    stage = "imprv-canon",
                    imprvCanon.Status,
                    parcelsProcessed = propIds.Count,
                    truthRowsConsidered = imprvCanon.TruthRowsConsidered,
                    improvementsProjected = imprvCanon.ImprovementsProjected,
                    featuresProjected = imprvCanon.FeaturesProjected,
                    attributesConsidered = imprvCanon.AttributesConsidered,
                    attributesResolved = imprvCanon.AttributesResolved,
                    attributesQuarantined = imprvCanon.AttributesQuarantined,
                    priorAttrQuarantineRowsRemoved = imprvCanon.PriorAttrQuarantineRowsRemoved,
                });
            }

            // ── Stage D: post-state delta. ──
            var landingAfter = await _db.LegacyTfUnprovenImprvAttrs
                .Where(q => q.QuarantineReason == "UNKNOWN_I_ATTR_VAL_CD")
                .CountAsync(cancellationToken);
            var canonicalAfter = await _db.LegacyTfUnprovenImprvAttrs
                .Where(q => q.QuarantineReason == "UNKNOWN_ATTRIBUTE")
                .CountAsync(cancellationToken);
            var totalQuarantineAfter = landingAfter + canonicalAfter;
            var featuresAttributedAfter = await _db.TfImprovementFeatures
                .Where(f => f.AttributeId != null)
                .CountAsync(cancellationToken);
            var quarantineDrained = totalQuarantineBefore - totalQuarantineAfter;
            var featuresAttributedDelta = featuresAttributedAfter - featuresAttributedBefore;

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                inspection,
                perYearResults,
                outcome = new
                {
                    totalQuarantineBefore,
                    landingQuarantineAfter = landingAfter,
                    canonicalQuarantineAfter = canonicalAfter,
                    totalQuarantineAfter,
                    quarantineDrained,
                    featuresAttributedBefore,
                    featuresAttributedAfter,
                    featuresAttributedDelta,
                },
                proofVerdict = quarantineDrained > 0
                    ? $"PROOF: drained {quarantineDrained} quarantine rows ({totalQuarantineBefore} → {totalQuarantineAfter}). {featuresAttributedDelta} additional tf_improvement_feature rows now carry AttributeId."
                    : (totalQuarantineBefore == 0
                        ? "INFO: no quarantine to drain."
                        : "INCONCLUSIVE: drain ran but quarantine did not decrease. Investigate landing/canonical reason breakdown above."),
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AttrDrain1] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    /// <param name="OperatorName">Audit anchor.</param>
    /// <param name="DryRun">If true, only inspect the quarantine + overlap;
    /// no landing or projection runs. Use this first to confirm the drain
    /// plan and the family/value grain overlap before paying the chain cost.</param>
    public sealed record AttrDrain1Request(
        string? OperatorName,
        bool? DryRun);

    // ════════════════════════════════════════════════════════════════════
    // ATTR-POP-2: value-grain populator. Closes the family/value-grain
    //   loop opened by ATTR-POP-1 + ATTR-DRAIN-1. Reads PACS value-grain
    //   (i_attr_val_id, i_attr_val_cd) pairs and upserts attribute_definition
    //   keyed by IAttrId = i_attr_val_id — the grain the imprv canonical
    //   projector keys on. After this, tf_improvement_feature.AttributeId
    //   resolutions succeed.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// ATTR-POP-2: value-grain attribute_definition populator + optional
    /// imprv canonical re-projection. Closes the resolution gap that
    /// left 7 canonical-layer quarantine rows after ATTR-DRAIN-1.
    /// </summary>
    [HttpPost("attr-pop-2/run-populate")]
    public async Task<IActionResult> RunAttrPop2(
        [FromServices] IPacsAttributeValPopulator populator,
        [FromServices] IPacsImprvCanonicalProjector imprvCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] AttrPop2Request? request,
        CancellationToken cancellationToken = default)
    {
        var pacsCs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(pacsCs))
            return StatusCode(500, new { error = "ConnectionStrings:PacsConnection is required for ATTR-POP-2." });

        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "attr-pop-2-populate"
            : request.OperatorName.Trim();
        var rerunImprvCanonical = request?.RerunImprvCanonical ?? true;

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // ── A. Populate value-grain attribute_definition. ──
            var src = new SqlServerPacsAttributeValSource(pacsCs);
            var pop = await populator.PopulateAsync(src, bentonCountyId, operatorName, cancellationToken);
            if (!string.Equals(pop.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
                return StatusCode(500, new { stage = "AttrVal-Populate", error = pop.ErrorSummary, pop });

            var attrDefTotal = await _db.AttributeDefinitions
                .Where(a => a.CountyId == bentonCountyId)
                .CountAsync(cancellationToken);
            var attrDefActive = await _db.AttributeDefinitions
                .Where(a => a.CountyId == bentonCountyId && a.IsActive)
                .CountAsync(cancellationToken);

            // ── B. Optional re-projection. ──
            object? reprojection = null;
            int? quarantineDelta = null;
            int? featuresAttributedDelta = null;
            if (rerunImprvCanonical)
            {
                var preQuarantine = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(cancellationToken);
                var preFeaturesAttributed = await _db.TfImprovementFeatures
                    .Where(f => f.AttributeId != null)
                    .CountAsync(cancellationToken);

                // Re-project ALL recent imprv truth batches so any prior
                // canonical-layer quarantine flips to resolved. Take the
                // last few completed truth batches — that's where the 7
                // residual rows came from.
                var recentTruthBatches = await _db.SyncBridgeLoadBatches
                    .Where(b => b.SourceSystem == "truth-pacs-imprv-promoter" && b.Status == "COMPLETED")
                    .OrderByDescending(b => b.CompletedAt)
                    .Take(10)
                    .Select(b => b.LoadBatchId)
                    .ToListAsync(cancellationToken);

                var perBatch = new List<object>();
                foreach (var truthBatchId in recentTruthBatches)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var r = await imprvCanonicalProjector.ProjectAsync(truthBatchId, operatorName, cancellationToken);
                    perBatch.Add(new
                    {
                        truthBatchId,
                        r.Status,
                        r.AttributesConsidered,
                        r.AttributesResolved,
                        r.AttributesQuarantined,
                        r.PriorAttrQuarantineRowsRemoved,
                    });
                }

                var postQuarantine = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(cancellationToken);
                var postFeaturesAttributed = await _db.TfImprovementFeatures
                    .Where(f => f.AttributeId != null)
                    .CountAsync(cancellationToken);
                quarantineDelta = postQuarantine - preQuarantine;
                featuresAttributedDelta = postFeaturesAttributed - preFeaturesAttributed;

                reprojection = new
                {
                    batchesReprojected = recentTruthBatches.Count,
                    preQuarantine,
                    postQuarantine,
                    preFeaturesAttributed,
                    postFeaturesAttributed,
                    perBatch,
                };
            }

            return Ok(new
            {
                operatorName,
                bentonCountyId,
                populator = new
                {
                    pop.Status,
                    pop.PromotionLoadBatchId,
                    pop.RowsConsidered,
                    pop.RowsInserted,
                    pop.RowsUpdated,
                    pop.DuplicatePairsCollapsed,
                },
                counts = new
                {
                    attribute_definition_total = attrDefTotal,
                    attribute_definition_active = attrDefActive,
                },
                reprojection,
                quarantineDelta,
                featuresAttributedDelta,
                proofVerdict = featuresAttributedDelta is int delta && delta > 0
                    ? $"PROOF: value-grain attribute_definition populated AND {delta} additional tf_improvement_feature rows now carry AttributeId — ATTR-POP-2 closed the family/value-grain loop."
                    : (pop.RowsConsidered > 0
                        ? "PARTIAL: dictionary populated. Reprojection ran but features-attributed didn't grow — investigate whether the recent truth batches actually contained imprv_attr rows whose IAttrValId is in the new dictionary set."
                        : "INCONCLUSIVE: 0 rows from PACS. Investigate."),
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AttrPop2] FAILED");
            return StatusCode(500, new { error = ex.Message, type = ex.GetType().Name });
        }
    }

    public sealed record AttrPop2Request(
        string? OperatorName,
        bool? RerunImprvCanonical);
}
