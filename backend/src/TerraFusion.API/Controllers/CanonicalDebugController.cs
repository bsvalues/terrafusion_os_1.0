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
}
