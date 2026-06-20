using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Monitoring;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Sync.Corpus;
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
using TerraFusion.Core.Sync.PacsSaleTruth;
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
using TerraFusion.Core.Sync.PacsPropertyVal;
using TerraFusion.Core.Sync.PacsWashPropOwnerVal;
using TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;
using TerraFusion.Core.Sync.PacsWsdorCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.PacsSources;
using Microsoft.Extensions.Options;
using ArcGisFeatureServiceOptions = TerraFusion.Core.Configuration.ArcGisFeatureServiceOptions;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-COMPLETE-2: single-lane "drain" endpoints. The full-corpus
/// <c>doctrine-closure/run-all-lanes</c> endpoint runs every lane back-
/// to-back in one HTTP call; in production that exceeds curl's 6h
/// timeout. These endpoints expose the same constituent lanes
/// individually so the operator can checkpoint after each one.
///
/// <para>Each endpoint:</para>
/// <list type="bullet">
///   <item>Takes <c>OperatorName</c>, <c>WorkingYear</c>, <c>FullCorpus</c>, <c>TopN</c></item>
///   <item>Lands raw → promotes truth → projects canonical for one lane</item>
///   <item>Returns standardized shape: <c>lane</c>, <c>status</c>, <c>batchIds</c>,
///         <c>counts</c>, <c>durationSec</c>, <c>gateSummary</c>,
///         <c>quarantineDelta</c>, <c>nextRecommendedLane</c></item>
/// </list>
///
/// <para>Recommended order: parcel → owner-wsdor → improvement → land
/// → sales → geometry. Sales and geometry are independent of the
/// parcel-anchored lanes, but running them after land lets the geometry
/// APN crosswalk land against a fully-projected <c>tf_parcel</c>.</para>
///
/// <para>Lane logic is identical to the matching segments inside
/// <c>CanonicalDebugController.RunDoctrineClosure</c>. We do NOT
/// refactor <c>run-all-lanes</c> — it stays as the single-call
/// alternative for environments that can hold the connection.</para>
/// </summary>
[ApiController]
[Route("api/sync/doctrine/drain")]
[AllowAnonymous]
public class DoctrineDrainController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrineDrainController> _logger;

    public DoctrineDrainController(TerraFusionDbContext db, ILogger<DoctrineDrainController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// SYNC-COMPLETE-2-V2: per-lane invocation context for stage-level
    /// resume. Wraps the (LaneResultId, ResumeFromStage, prior BatchIds)
    /// triple and provides:
    /// <list type="bullet">
    ///   <item><see cref="ShouldSkip"/> — true when this stage's index
    ///   in the lane's order is ≤ the resume stage's index.</item>
    ///   <item><see cref="GetPriorBatchId"/> — returns the persisted
    ///   batch id for a skipped stage (by stage-index lookup into the
    ///   prior <c>BatchIdsJson</c>).</item>
    ///   <item><see cref="CheckpointAsync"/> — after a non-skipped
    ///   stage succeeds, persists <c>LastCompletedStage</c> +
    ///   <c>BatchIdsJson</c> back to the lane row. Best-effort: a
    ///   checkpoint failure does NOT fail the lane.</item>
    /// </list>
    /// When <see cref="LaneResultId"/> is null (manual operator curl
    /// without orchestrator threading), every stage runs and no
    /// checkpoints are persisted — same behavior as before V2.
    /// </summary>
    private sealed class StageResumeContext
    {
        private readonly TerraFusionDbContext _db;
        private readonly ILogger _logger;
        public string Lane { get; }
        public Guid? LaneResultId { get; }
        public string? ResumeFromStage { get; }
        private readonly IReadOnlyList<Guid> _priorBatchIds;

        public StageResumeContext(
            TerraFusionDbContext db,
            ILogger logger,
            string lane,
            Guid? laneResultId,
            string? resumeFromStage,
            IReadOnlyList<Guid> priorBatchIds)
        {
            _db = db;
            _logger = logger;
            Lane = lane;
            LaneResultId = laneResultId;
            ResumeFromStage = resumeFromStage;
            _priorBatchIds = priorBatchIds;
        }

        public bool ShouldSkip(string stageName)
            => LaneStageOrder.ShouldSkip(Lane, stageName, ResumeFromStage);

        /// <summary>
        /// Look up the persisted batch id for <paramref name="stageName"/> by
        /// its index in the lane's order. Returns null when the stage is
        /// outside the persisted prefix (e.g., earlier crash didn't get
        /// that far).
        /// </summary>
        public Guid? GetPriorBatchId(string stageName)
        {
            if (!LaneStageOrder.Stages.TryGetValue(Lane, out var order))
                return null;
            var idx = -1;
            for (var i = 0; i < order.Count; i++)
            {
                if (string.Equals(order[i], stageName, StringComparison.OrdinalIgnoreCase))
                {
                    idx = i;
                    break;
                }
            }
            if (idx < 0 || idx >= _priorBatchIds.Count) return null;
            return _priorBatchIds[idx];
        }

        public async System.Threading.Tasks.Task CheckpointAsync(
            string stageName,
            IReadOnlyList<Guid> batchIds,
            CancellationToken ct)
        {
            if (!LaneResultId.HasValue) return;
            try
            {
                var laneRow = await _db.FullCorpusLaneResults
                    .FirstOrDefaultAsync(x => x.LaneResultId == LaneResultId.Value, ct)
                    .ConfigureAwait(false);
                if (laneRow is null) return;
                laneRow.LastCompletedStage = stageName;
                laneRow.BatchIdsJson = JsonSerializer.Serialize(batchIds);
                await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                // Persistence is a hint, not a critical path. Log and
                // continue so the lane itself still completes naturally.
                _logger.LogWarning(ex,
                    "[Drain:{Lane}] Stage checkpoint persist failed for stage={Stage}; continuing without resume hint.",
                    Lane, stageName);
            }
        }
    }

    /// <summary>
    /// SYNC-COMPLETE-2-V2: build the stage-resume context once per lane
    /// invocation. If <paramref name="request"/> supplies a LaneResultId,
    /// loads the prior <c>BatchIdsJson</c> so already-completed stages'
    /// batch ids are available to downstream skipped-stage lookups.
    /// </summary>
    private async Task<StageResumeContext> BuildResumeContextAsync(
        string laneName,
        DoctrineDrainRequest? request,
        CancellationToken ct)
    {
        var laneResultId = request?.LaneResultId;
        var resumeFromStage = request?.ResumeFromStage;
        IReadOnlyList<Guid> priorBatchIds = Array.Empty<Guid>();

        if (laneResultId.HasValue)
        {
            try
            {
                var laneRow = await _db.FullCorpusLaneResults
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.LaneResultId == laneResultId.Value, ct)
                    .ConfigureAwait(false);
                if (laneRow is not null && !string.IsNullOrEmpty(laneRow.BatchIdsJson))
                {
                    var parsed = JsonSerializer.Deserialize<List<Guid>>(laneRow.BatchIdsJson);
                    if (parsed is not null) priorBatchIds = parsed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "[Drain:{Lane}] Failed to load prior BatchIdsJson for laneResultId={Lid}; running lane from start.",
                    laneName, laneResultId);
                resumeFromStage = null;
            }
        }
        else
        {
            // Without a LaneResultId, we have nowhere to load from —
            // resume hint is meaningless. Run from start.
            resumeFromStage = null;
        }

        return new StageResumeContext(_db, _logger, laneName, laneResultId, resumeFromStage, priorBatchIds);
    }

    // ════════════════════════════════════════════════════════════════════
    // PARCEL drain — property landing → parcel truth → tf_parcel canonical.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the parcel lane: owner-anchored seed (R-typed prop_ids) →
    /// keyed property landing (S1) → parcel-spine truth (S2-B) →
    /// canonical_tf.tf_parcel projection (S3).
    /// </summary>
    [HttpPost("parcel")]
    public async Task<IActionResult> DrainParcel(
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IConfiguration config,
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "parcel";
        var (pacsCs, validationError) = ResolveConnectionString(config);
        if (validationError is not null) return validationError;

        var (operatorName, _, fullCorpus, topN) = NormalizeRequest(request, LaneName);
        var startedAt = DateTime.UtcNow;
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);
        // SYNC-COMPLETE-2-V2: build resume context. Initial batchIds
        // start as the persisted prefix when resuming so the final
        // response reports the full lane batch set.
        var resume = await BuildResumeContextAsync(LaneName, request, cancellationToken);
        var batchIds = new List<Guid>();
        for (var i = 0; i < LaneStageOrder.Stages[LaneName].Count; i++)
        {
            var prior = resume.GetPriorBatchId(LaneStageOrder.Stages[LaneName][i]);
            if (prior is null) break;
            batchIds.Add(prior.Value);
        }
        // Track per-stage RowsLanded / counts so the final OkLane
        // response is accurate even if we partially skipped.
        int rowsLanded = 0, rowsPromotedToTruth = 0, rowsCanonicalized = 0;

        try
        {
            var bentonCounty = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var bentonCountyId = bentonCounty.Id;
            var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Stage 1: Owner-Seed-S1.
            Guid ownerSeedBatchId;
            List<int> seedPropIds;
            if (resume.ShouldSkip("Owner-Seed-S1"))
            {
                ownerSeedBatchId = resume.GetPriorBatchId("Owner-Seed-S1")
                    ?? throw new InvalidOperationException("Owner-Seed-S1 batch id missing from prior checkpoint.");
                _logger.LogInformation("[Drain:parcel] SKIP Owner-Seed-S1 (resume from {Stage}); batchId={Bid}",
                    resume.ResumeFromStage, ownerSeedBatchId);
                seedPropIds = await _db.LegacyPacsRawOwners
                    .AsNoTracking()
                    .Where(o => o.LoadBatchId == ownerSeedBatchId)
                    .Select(o => o.PropId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
            }
            else
            {
                _logger.LogInformation("[Drain:parcel] Owner seed (TopN={Top}, FullCorpus={Full})", seedTopN, fullCorpus);
                var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN);
                var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
                batchIds.Add(ownerSeedS1.LoadBatchId);
                if (!IsCompleted(ownerSeedS1.Status))
                    return await FailLaneAsync(LaneName, "Owner-Seed-S1", ownerSeedS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                ownerSeedBatchId = ownerSeedS1.LoadBatchId;
                await resume.CheckpointAsync("Owner-Seed-S1", batchIds, cancellationToken);
                seedPropIds = await _db.LegacyPacsRawOwners
                    .AsNoTracking()
                    .Where(o => o.LoadBatchId == ownerSeedBatchId)
                    .Select(o => o.PropId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
            }

            // Stage 2: Parcel-S1.
            Guid parcelS1BatchId;
            int parcelS1RowsLanded = 0;
            if (resume.ShouldSkip("Parcel-S1"))
            {
                parcelS1BatchId = resume.GetPriorBatchId("Parcel-S1")
                    ?? throw new InvalidOperationException("Parcel-S1 batch id missing from prior checkpoint.");
                _logger.LogInformation("[Drain:parcel] SKIP Parcel-S1; batchId={Bid}", parcelS1BatchId);
            }
            else
            {
                var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, seedPropIds);
                var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
                batchIds.Add(parcelS1.LoadBatchId);
                if (!IsCompleted(parcelS1.Status))
                    return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelS1BatchId = parcelS1.LoadBatchId;
                parcelS1RowsLanded = parcelS1.RowsLanded;
                await resume.CheckpointAsync("Parcel-S1", batchIds, cancellationToken);
            }
            rowsLanded = parcelS1RowsLanded;

            // Stage 3: Parcel-Spine.
            Guid spineBatchId;
            int spineRowsPromoted = 0;
            if (resume.ShouldSkip("Parcel-Spine"))
            {
                spineBatchId = resume.GetPriorBatchId("Parcel-Spine")
                    ?? throw new InvalidOperationException("Parcel-Spine batch id missing from prior checkpoint.");
                _logger.LogInformation("[Drain:parcel] SKIP Parcel-Spine; batchId={Bid}", spineBatchId);
            }
            else
            {
                var parcelSpine = await spinePromoter.PromoteAsync(parcelS1BatchId, operatorName, cancellationToken);
                batchIds.Add(parcelSpine.PromotionLoadBatchId);
                if (!IsCompleted(parcelSpine.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                spineBatchId = parcelSpine.PromotionLoadBatchId;
                spineRowsPromoted = parcelSpine.ParcelsPromoted;
                await resume.CheckpointAsync("Parcel-Spine", batchIds, cancellationToken);
            }
            rowsPromotedToTruth = spineRowsPromoted;

            // Stage 4: Parcel-Canonical.
            int canonProjected = 0;
            if (resume.ShouldSkip("Parcel-Canonical"))
            {
                _logger.LogInformation("[Drain:parcel] SKIP Parcel-Canonical");
            }
            else
            {
                var parcelCanon = await parcelCanonical.ProjectAsync(
                    spineBatchId, bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(parcelCanon.PromotionLoadBatchId);
                if (!IsCompleted(parcelCanon.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                canonProjected = parcelCanon.ParcelsProjected;
                await resume.CheckpointAsync("Parcel-Canonical", batchIds, cancellationToken);
            }
            rowsCanonicalized = canonProjected;

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: rowsLanded,
                rowsPromotedToTruth: rowsPromotedToTruth,
                rowsCanonicalized: rowsCanonicalized,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:parcel] FAILED");
            return await FailLaneAsync(LaneName, "Exception", SerializeExceptionChain(ex),
                batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // OWNER-WSDOR drain — owner+account+supp+WPOV → owner/WSDOR truth →
    // tf_owner / tf_parcel_owner_link / tf_assessment_wsdor canonical.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the owner+WSDOR lane in one call. Re-runs the parcel chain
    /// (so xrefs exist), then owner truth + canonical, then WPOV truth +
    /// WSDOR canonical. Mirrors OWN-POP-2's chain.
    /// </summary>
    [HttpPost("owner-wsdor")]
    public async Task<IActionResult> DrainOwnerWsdor(
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
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "owner-wsdor";
        var (pacsCs, validationError) = ResolveConnectionString(config);
        if (validationError is not null) return validationError;

        var (operatorName, _, fullCorpus, topN) = NormalizeRequest(request, LaneName);
        var startedAt = DateTime.UtcNow;
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);
        // SYNC-COMPLETE-2-V2.
        var resume = await BuildResumeContextAsync(LaneName, request, cancellationToken);
        var batchIds = new List<Guid>();
        for (var i = 0; i < LaneStageOrder.Stages[LaneName].Count; i++)
        {
            var prior = resume.GetPriorBatchId(LaneStageOrder.Stages[LaneName][i]);
            if (prior is null) break;
            batchIds.Add(prior.Value);
        }
        int rowsLanded = 0, rowsPromotedToTruth = 0, rowsCanonicalized = 0;

        try
        {
            var bentonCounty = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var bentonCountyId = bentonCounty.Id;
            var ownerTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Stage 1: Owner-S1.
            Guid ownerS1BatchId;
            int ownerS1RowsLanded = 0;
            if (resume.ShouldSkip("Owner-S1"))
            {
                ownerS1BatchId = resume.GetPriorBatchId("Owner-S1") ?? throw new InvalidOperationException("Owner-S1 batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Owner-S1; batchId={Bid}", ownerS1BatchId);
            }
            else
            {
                _logger.LogInformation("[Drain:owner-wsdor] Owner S1 (TopN={Top}, FullCorpus={Full})", ownerTopN, fullCorpus);
                var ownerSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: ownerTopN);
                var ownerS1 = await ownerSvc.LandOwnersAsync(ownerSrc, operatorName, cancellationToken);
                batchIds.Add(ownerS1.LoadBatchId);
                if (!IsCompleted(ownerS1.Status))
                    return await FailLaneAsync(LaneName, "Owner-S1", ownerS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                ownerS1BatchId = ownerS1.LoadBatchId;
                ownerS1RowsLanded = ownerS1.RowsLanded;
                rowsLanded = ownerS1RowsLanded;
                await resume.CheckpointAsync("Owner-S1", batchIds, cancellationToken);
            }

            // Reload owner rows from the (always-present) Owner-S1 batch
            // for downstream key derivation. This works whether we ran or
            // skipped Owner-S1 since the underlying landing rows persist.
            var ownerRows = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerS1BatchId)
                .Select(o => new { o.OwnerId, o.PropId, o.OwnerTaxYr })
                .ToListAsync(cancellationToken);
            var distinctAcctIds = ownerRows.Select(r => r.OwnerId).Distinct().ToList();
            var distinctSuppKeys = ownerRows.Select(r => (r.PropId, r.OwnerTaxYr)).Distinct().ToList();
            var distinctParcelPropIds = ownerRows.Select(r => r.PropId).Distinct().ToList();

            // Stage 2: Account-S1.
            Guid acctS1BatchId;
            if (resume.ShouldSkip("Account-S1"))
            {
                acctS1BatchId = resume.GetPriorBatchId("Account-S1") ?? throw new InvalidOperationException("Account-S1 batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Account-S1; batchId={Bid}", acctS1BatchId);
            }
            else
            {
                var acctSrc = new KeyedSqlServerPacsAccountSource(pacsCs!, distinctAcctIds);
                var acctS1 = await accountSvc.LandAccountsAsync(acctSrc, operatorName, cancellationToken);
                batchIds.Add(acctS1.LoadBatchId);
                if (!IsCompleted(acctS1.Status))
                    return await FailLaneAsync(LaneName, "Account-S1", acctS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                acctS1BatchId = acctS1.LoadBatchId;
                await resume.CheckpointAsync("Account-S1", batchIds, cancellationToken);
            }

            // Stage 3: Supp-S1.
            Guid suppS1BatchId;
            if (resume.ShouldSkip("Supp-S1"))
            {
                suppS1BatchId = resume.GetPriorBatchId("Supp-S1") ?? throw new InvalidOperationException("Supp-S1 batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Supp-S1; batchId={Bid}", suppS1BatchId);
            }
            else
            {
                var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, distinctSuppKeys);
                var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
                batchIds.Add(suppS1.LoadBatchId);
                if (!IsCompleted(suppS1.Status))
                    return await FailLaneAsync(LaneName, "Supp-S1", suppS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                suppS1BatchId = suppS1.LoadBatchId;
                await resume.CheckpointAsync("Supp-S1", batchIds, cancellationToken);
            }

            // Stage 4: Parcel-S1.
            Guid parcelS1BatchId;
            if (resume.ShouldSkip("Parcel-S1"))
            {
                parcelS1BatchId = resume.GetPriorBatchId("Parcel-S1") ?? throw new InvalidOperationException("Parcel-S1 batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Parcel-S1; batchId={Bid}", parcelS1BatchId);
            }
            else
            {
                var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, distinctParcelPropIds);
                var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
                batchIds.Add(parcelS1.LoadBatchId);
                if (!IsCompleted(parcelS1.Status))
                    return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelS1BatchId = parcelS1.LoadBatchId;
                await resume.CheckpointAsync("Parcel-S1", batchIds, cancellationToken);
            }

            // Stage 5: Parcel-Spine.
            Guid parcelSpineBatchId;
            if (resume.ShouldSkip("Parcel-Spine"))
            {
                parcelSpineBatchId = resume.GetPriorBatchId("Parcel-Spine") ?? throw new InvalidOperationException("Parcel-Spine batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Parcel-Spine; batchId={Bid}", parcelSpineBatchId);
            }
            else
            {
                var parcelSpine = await spinePromoter.PromoteAsync(parcelS1BatchId, operatorName, cancellationToken);
                batchIds.Add(parcelSpine.PromotionLoadBatchId);
                if (!IsCompleted(parcelSpine.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelSpineBatchId = parcelSpine.PromotionLoadBatchId;
                await resume.CheckpointAsync("Parcel-Spine", batchIds, cancellationToken);
            }

            // Stage 6: Parcel-Canonical.
            if (resume.ShouldSkip("Parcel-Canonical"))
            {
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Parcel-Canonical");
            }
            else
            {
                var parcelCanon = await parcelCanonical.ProjectAsync(
                    parcelSpineBatchId, bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(parcelCanon.PromotionLoadBatchId);
                if (!IsCompleted(parcelCanon.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                await resume.CheckpointAsync("Parcel-Canonical", batchIds, cancellationToken);
            }

            // Stage 7: Owner-Truth.
            Guid ownerTruthBatchId;
            int ownerTruthOwnersPromoted = 0;
            if (resume.ShouldSkip("Owner-Truth"))
            {
                ownerTruthBatchId = resume.GetPriorBatchId("Owner-Truth") ?? throw new InvalidOperationException("Owner-Truth batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Owner-Truth; batchId={Bid}", ownerTruthBatchId);
            }
            else
            {
                var ownerTruth = await ownerTruthPromoter.PromoteAsync(
                    ownerS1BatchId, acctS1BatchId, suppS1BatchId, operatorName, cancellationToken);
                batchIds.Add(ownerTruth.PromotionLoadBatchId);
                if (!IsCompleted(ownerTruth.Status))
                    return await FailLaneAsync(LaneName, "Owner-Truth", ownerTruth.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                ownerTruthBatchId = ownerTruth.PromotionLoadBatchId;
                ownerTruthOwnersPromoted = ownerTruth.OwnersPromoted;
                await resume.CheckpointAsync("Owner-Truth", batchIds, cancellationToken);
            }

            // Stage 8: Owner-Canonical.
            int ownerCanonOwnersProjected = 0;
            int ownerCanonLinksProjected = 0;
            if (resume.ShouldSkip("Owner-Canonical"))
            {
                _logger.LogInformation("[Drain:owner-wsdor] SKIP Owner-Canonical");
            }
            else
            {
                var ownerCanon = await ownerCanonicalProjector.ProjectAsync(
                    ownerTruthBatchId, operatorName, cancellationToken);
                batchIds.Add(ownerCanon.PromotionLoadBatchId);
                if (!IsCompleted(ownerCanon.Status))
                    return await FailLaneAsync(LaneName, "Owner-Canonical", ownerCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                ownerCanonOwnersProjected = ownerCanon.OwnersProjected;
                ownerCanonLinksProjected = ownerCanon.LinksProjected;
                await resume.CheckpointAsync("Owner-Canonical", batchIds, cancellationToken);
            }

            // Build WPOV keys from the truth row set (independent of skip).
            var wpovKeys = await _db.TruthPacsOwnerCurrents
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == ownerTruthBatchId)
                .Select(t => new { t.PropId, t.OwnerTaxYr, t.OwnerId })
                .Distinct()
                .ToListAsync(cancellationToken);
            var wpovTriples = wpovKeys.Select(k => (k.PropId, k.OwnerTaxYr, k.OwnerId)).ToList();

            // Stage 9: WPOV-S1.
            Guid wpovS1BatchId;
            int wpovS1RowsLanded = 0;
            if (resume.ShouldSkip("WPOV-S1"))
            {
                wpovS1BatchId = resume.GetPriorBatchId("WPOV-S1") ?? throw new InvalidOperationException("WPOV-S1 batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP WPOV-S1; batchId={Bid}", wpovS1BatchId);
            }
            else
            {
                var wpovSrc = new KeyedSqlServerPacsWashPropOwnerValSource(pacsCs!, wpovTriples);
                var wpovS1 = await wpovSvc.LandWashPropOwnerValsAsync(wpovSrc, operatorName, cancellationToken);
                batchIds.Add(wpovS1.LoadBatchId);
                if (!IsCompleted(wpovS1.Status))
                    return await FailLaneAsync(LaneName, "WPOV-S1", wpovS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                wpovS1BatchId = wpovS1.LoadBatchId;
                wpovS1RowsLanded = wpovS1.RowsLanded;
                rowsLanded = ownerS1RowsLanded + wpovS1RowsLanded;
                await resume.CheckpointAsync("WPOV-S1", batchIds, cancellationToken);
            }

            // Stage 10: WPOV-Truth.
            Guid wpovTruthBatchId;
            int wpovTruthRowsPromoted = 0;
            if (resume.ShouldSkip("WPOV-Truth"))
            {
                wpovTruthBatchId = resume.GetPriorBatchId("WPOV-Truth") ?? throw new InvalidOperationException("WPOV-Truth batch id missing.");
                _logger.LogInformation("[Drain:owner-wsdor] SKIP WPOV-Truth; batchId={Bid}", wpovTruthBatchId);
            }
            else
            {
                var wpovTruth = await wpovTruthPromoter.PromoteAsync(
                    wpovS1BatchId, suppS1BatchId, operatorName, cancellationToken);
                batchIds.Add(wpovTruth.PromotionLoadBatchId);
                if (!IsCompleted(wpovTruth.Status))
                    return await FailLaneAsync(LaneName, "WPOV-Truth", wpovTruth.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                wpovTruthBatchId = wpovTruth.PromotionLoadBatchId;
                wpovTruthRowsPromoted = wpovTruth.RowsPromoted;
                await resume.CheckpointAsync("WPOV-Truth", batchIds, cancellationToken);
            }

            // Stage 11: WSDOR-Canonical.
            int wsdorCanonRowsProjected = 0;
            if (resume.ShouldSkip("WSDOR-Canonical"))
            {
                _logger.LogInformation("[Drain:owner-wsdor] SKIP WSDOR-Canonical");
            }
            else
            {
                var wsdorCanon = await wsdorCanonicalProjector.ProjectAsync(
                    wpovTruthBatchId, operatorName, cancellationToken);
                batchIds.Add(wsdorCanon.PromotionLoadBatchId);
                if (!IsCompleted(wsdorCanon.Status))
                    return await FailLaneAsync(LaneName, "WSDOR-Canonical", wsdorCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                wsdorCanonRowsProjected = wsdorCanon.RowsProjected;
                await resume.CheckpointAsync("WSDOR-Canonical", batchIds, cancellationToken);
            }

            rowsLanded = ownerS1RowsLanded + wpovS1RowsLanded;
            rowsPromotedToTruth = ownerTruthOwnersPromoted + wpovTruthRowsPromoted;
            rowsCanonicalized = ownerCanonOwnersProjected + ownerCanonLinksProjected + wsdorCanonRowsProjected;

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: rowsLanded,
                rowsPromotedToTruth: rowsPromotedToTruth,
                rowsCanonicalized: rowsCanonicalized,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:owner-wsdor] FAILED");
            return await FailLaneAsync(LaneName, "Exception", SerializeExceptionChain(ex),
                batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // IMPROVEMENT drain — imprv + imprv_detail + imprv_attr → imprv truth →
    // tf_improvement / tf_improvement_feature canonical.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the improvement lane. Owner-anchored seed → parcel chain →
    /// keyed imprv/imprv_detail/imprv_attr S1 → imprv truth (C2) →
    /// imprv canonical (C3 → tf_improvement + tf_improvement_feature).
    /// </summary>
    [HttpPost("improvement")]
    public async Task<IActionResult> DrainImprovement(
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
        [FromServices] IPacsLandDetailLandingService landDetailSvc,
        [FromServices] IPacsPropertyValLandingService propertyValSvc,
        [FromServices] IConfiguration config,
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "improvement";
        var (pacsCs, validationError) = ResolveConnectionString(config);
        if (validationError is not null) return validationError;

        var (operatorName, workingYear, fullCorpus, topN) = NormalizeRequest(request, LaneName);
        var startedAt = DateTime.UtcNow;
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);
        // SYNC-COMPLETE-2-V2.
        var resume = await BuildResumeContextAsync(LaneName, request, cancellationToken);
        var batchIds = new List<Guid>();
        for (var i = 0; i < LaneStageOrder.Stages[LaneName].Count; i++)
        {
            var prior = resume.GetPriorBatchId(LaneStageOrder.Stages[LaneName][i]);
            if (prior is null) break;
            batchIds.Add(prior.Value);
        }
        int rowsLanded = 0, rowsPromotedToTruth = 0, rowsCanonicalized = 0;

        try
        {
            var bentonCounty = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var bentonCountyId = bentonCounty.Id;
            var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Stage 1: Owner-Seed-S1.
            Guid ownerSeedBatchId;
            if (resume.ShouldSkip("Owner-Seed-S1"))
            {
                ownerSeedBatchId = resume.GetPriorBatchId("Owner-Seed-S1") ?? throw new InvalidOperationException("Owner-Seed-S1 missing.");
                _logger.LogInformation("[Drain:improvement] SKIP Owner-Seed-S1; batchId={Bid}", ownerSeedBatchId);
            }
            else
            {
                _logger.LogInformation("[Drain:improvement] Owner seed (TopN={Top}, FullCorpus={Full})", seedTopN, fullCorpus);
                var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN);
                var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
                batchIds.Add(ownerSeedS1.LoadBatchId);
                if (!IsCompleted(ownerSeedS1.Status))
                    return await FailLaneAsync(LaneName, "Owner-Seed-S1", ownerSeedS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                ownerSeedBatchId = ownerSeedS1.LoadBatchId;
                await resume.CheckpointAsync("Owner-Seed-S1", batchIds, cancellationToken);
            }

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Stage 2: Parcel-S1.
            Guid parcelS1BatchId;
            if (resume.ShouldSkip("Parcel-S1"))
            {
                parcelS1BatchId = resume.GetPriorBatchId("Parcel-S1") ?? throw new InvalidOperationException("Parcel-S1 missing.");
                _logger.LogInformation("[Drain:improvement] SKIP Parcel-S1; batchId={Bid}", parcelS1BatchId);
            }
            else
            {
                var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, seedPropIds);
                var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
                batchIds.Add(parcelS1.LoadBatchId);
                if (!IsCompleted(parcelS1.Status))
                    return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelS1BatchId = parcelS1.LoadBatchId;
                await resume.CheckpointAsync("Parcel-S1", batchIds, cancellationToken);
            }

            // Stage 3: Parcel-Spine.
            Guid parcelSpineBatchId;
            if (resume.ShouldSkip("Parcel-Spine"))
            {
                parcelSpineBatchId = resume.GetPriorBatchId("Parcel-Spine") ?? throw new InvalidOperationException("Parcel-Spine missing.");
                _logger.LogInformation("[Drain:improvement] SKIP Parcel-Spine; batchId={Bid}", parcelSpineBatchId);
            }
            else
            {
                var parcelSpine = await spinePromoter.PromoteAsync(parcelS1BatchId, operatorName, cancellationToken);
                batchIds.Add(parcelSpine.PromotionLoadBatchId);
                if (!IsCompleted(parcelSpine.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelSpineBatchId = parcelSpine.PromotionLoadBatchId;
                await resume.CheckpointAsync("Parcel-Spine", batchIds, cancellationToken);
            }

            // Stage 4: Parcel-Canonical.
            if (resume.ShouldSkip("Parcel-Canonical"))
            {
                _logger.LogInformation("[Drain:improvement] SKIP Parcel-Canonical");
            }
            else
            {
                var parcelCanon = await parcelCanonical.ProjectAsync(
                    parcelSpineBatchId, bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(parcelCanon.PromotionLoadBatchId);
                if (!IsCompleted(parcelCanon.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                await resume.CheckpointAsync("Parcel-Canonical", batchIds, cancellationToken);
            }

            // Build imprv keys from spine (independent of skip).
            var spinePropIds = await _db.TruthPacsParcelSpines
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == parcelSpineBatchId)
                .Select(t => t.PropId)
                .ToListAsync(cancellationToken);
            var imprvKeys = spinePropIds.Select(p => (p, workingYear)).ToList();

            // Stage 5: Supp-S1.
            Guid suppS1BatchId;
            if (resume.ShouldSkip("Supp-S1"))
            {
                suppS1BatchId = resume.GetPriorBatchId("Supp-S1") ?? throw new InvalidOperationException("Supp-S1 missing.");
                _logger.LogInformation("[Drain:improvement] SKIP Supp-S1; batchId={Bid}", suppS1BatchId);
            }
            else
            {
                var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, imprvKeys);
                var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
                batchIds.Add(suppS1.LoadBatchId);
                if (!IsCompleted(suppS1.Status))
                    return await FailLaneAsync(LaneName, "Supp-S1", suppS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                suppS1BatchId = suppS1.LoadBatchId;
                await resume.CheckpointAsync("Supp-S1", batchIds, cancellationToken);
            }

            // Stage 6: PropertyVal-S1 (non-blocking).
            if (resume.ShouldSkip("PropertyVal-S1"))
            {
                _logger.LogInformation("[Drain:improvement] SKIP PropertyVal-S1");
            }
            else
            {
                var propertyValSrc = new KeyedSqlServerPacsPropertyValSource(pacsCs!, imprvKeys);
                var propertyValS1 = await propertyValSvc.LandPropertyValsAsync(
                    propertyValSrc, operatorName, cancellationToken);
                batchIds.Add(propertyValS1.LoadBatchId);
                if (!IsCompleted(propertyValS1.Status))
                {
                    _logger.LogWarning(
                        "[Drain:improvement] PropertyVal-S1 failed (non-blocking): {Err}. " +
                        "Promoter will pass NULL property_use_cd to classifier.",
                        propertyValS1.ErrorSummary);
                }
                await resume.CheckpointAsync("PropertyVal-S1", batchIds, cancellationToken);
            }

            // Stage 7: LandDetail-S1 (non-blocking).
            if (resume.ShouldSkip("LandDetail-S1"))
            {
                _logger.LogInformation("[Drain:improvement] SKIP LandDetail-S1");
            }
            else
            {
                var landDetailSrc = new KeyedSqlServerPacsLandDetailSource(pacsCs!, imprvKeys);
                var landDetailS1 = await landDetailSvc.LandLandDetailsAsync(
                    landDetailSrc, operatorName, cancellationToken);
                batchIds.Add(landDetailS1.LoadBatchId);
                if (!IsCompleted(landDetailS1.Status))
                {
                    _logger.LogWarning(
                        "[Drain:improvement] LandDetail-S1 failed (non-blocking): {Err}. " +
                        "Promoter will pass NULL ag_apply to classifier.",
                        landDetailS1.ErrorSummary);
                }
                await resume.CheckpointAsync("LandDetail-S1", batchIds, cancellationToken);
            }

            // Stage 8: Imprv-S1.
            Guid imprvS1BatchId;
            int imprvS1RowsLanded = 0;
            if (resume.ShouldSkip("Imprv-S1"))
            {
                imprvS1BatchId = resume.GetPriorBatchId("Imprv-S1") ?? throw new InvalidOperationException("Imprv-S1 missing.");
                _logger.LogInformation("[Drain:improvement] SKIP Imprv-S1; batchId={Bid}", imprvS1BatchId);
            }
            else
            {
                var imprvSrc = new KeyedSqlServerPacsImprvSource(pacsCs!, imprvKeys);
                var imprvS1 = await imprvSvc.LandImprvsAsync(imprvSrc, operatorName, cancellationToken);
                batchIds.Add(imprvS1.LoadBatchId);
                if (!IsCompleted(imprvS1.Status))
                    return await FailLaneAsync(LaneName, "Imprv-S1", imprvS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                imprvS1BatchId = imprvS1.LoadBatchId;
                imprvS1RowsLanded = imprvS1.RowsLanded;
                rowsLanded = imprvS1RowsLanded;
                await resume.CheckpointAsync("Imprv-S1", batchIds, cancellationToken);
            }

            // Stage 9: ImprvDetail-S1.
            int detailS1RowsLanded = 0;
            if (resume.ShouldSkip("ImprvDetail-S1"))
            {
                _logger.LogInformation("[Drain:improvement] SKIP ImprvDetail-S1");
            }
            else
            {
                var detailSrc = new KeyedSqlServerPacsImprvDetailSource(pacsCs!, imprvKeys);
                var detailS1 = await imprvDetailSvc.LandImprvDetailsAsync(detailSrc, operatorName, cancellationToken);
                batchIds.Add(detailS1.LoadBatchId);
                if (!IsCompleted(detailS1.Status))
                    return await FailLaneAsync(LaneName, "ImprvDetail-S1", detailS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                detailS1RowsLanded = detailS1.RowsLanded;
                rowsLanded = imprvS1RowsLanded + detailS1RowsLanded;
                await resume.CheckpointAsync("ImprvDetail-S1", batchIds, cancellationToken);
            }

            // Stage 10: ImprvAttr-S1 (SYNC-COMPLETE-2-V3 year-sliced).
            //
            // Empirically, draining all years of imprv_attr in a single
            // EF-buffered landing call exhausts ChangeTracker memory
            // (~1.9 GB) and saturates postgres I/O before completion at
            // full-corpus scale (~6M imprv_attr rows). Year-slice the
            // stage so each commit covers a single prop_val_yr, keeping
            // the working set bounded and allowing mid-stage resume.
            //
            // Substages are named ImprvAttr-S1-Y{year}. Year list is
            // queried from legacy_pacs_raw.imprv after Imprv-S1 lands
            // (so we only iterate years that actually have improvement
            // rows). The substages slot logically between ImprvDetail-S1
            // and Imprv-Truth — see LaneStageOrder.ShouldSkip.
            //
            // batchIds gets exactly ONE entry appended for the entire
            // ImprvAttr-S1 stage at completion (the last year's batch id,
            // occupying the static ImprvAttr-S1 slot for position-mapping
            // of downstream stages). Per-year batch ids are observable
            // via LoadBatch rows + structured logs.
            int attrS1RowsLanded = 0;
            if (resume.ShouldSkip("ImprvAttr-S1"))
            {
                _logger.LogInformation("[Drain:improvement] SKIP ImprvAttr-S1");
            }
            else
            {
                var yearSliced = await RunYearSlicedImprvAttrStageAsync(
                    imprvAttrSvc, pacsCs!, spinePropIds, resume, batchIds,
                    operatorName, startedAt, quarantineBefore,
                    cancellationToken);
                attrS1RowsLanded = yearSliced.TotalRowsLanded;
                rowsLanded = imprvS1RowsLanded + detailS1RowsLanded + attrS1RowsLanded;
                if (yearSliced.FailureResponse is not null)
                {
                    return yearSliced.FailureResponse;
                }
                if (yearSliced.LastBatchId is { } finalBatchId)
                {
                    // Year-sliced stage completed successfully → record
                    // the parent-stage checkpoint with the final batch
                    // id appended to batchIds. (Per-year batch ids are
                    // intentionally NOT in batchIds; position-mapping
                    // for downstream stages depends on ImprvAttr-S1
                    // occupying exactly one slot.)
                    batchIds.Add(finalBatchId);
                }
                await resume.CheckpointAsync("ImprvAttr-S1", batchIds, cancellationToken);
            }

            // Stage 11: Imprv-Truth.
            Guid imprvTruthBatchId;
            int imprvTruthImprvsPromoted = 0;
            if (resume.ShouldSkip("Imprv-Truth"))
            {
                imprvTruthBatchId = resume.GetPriorBatchId("Imprv-Truth") ?? throw new InvalidOperationException("Imprv-Truth missing.");
                _logger.LogInformation("[Drain:improvement] SKIP Imprv-Truth; batchId={Bid}", imprvTruthBatchId);
            }
            else
            {
                var imprvTruth = await imprvTruthPromoter.PromoteAsync(
                    imprvS1BatchId, suppS1BatchId, operatorName, cancellationToken);
                batchIds.Add(imprvTruth.PromotionLoadBatchId);
                if (!IsCompleted(imprvTruth.Status))
                    return await FailLaneAsync(LaneName, "Imprv-Truth", imprvTruth.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                imprvTruthBatchId = imprvTruth.PromotionLoadBatchId;
                imprvTruthImprvsPromoted = imprvTruth.ImprvsPromoted;
                await resume.CheckpointAsync("Imprv-Truth", batchIds, cancellationToken);
            }

            // Stage 12: Imprv-Canonical.
            int imprvCanonImprovementsProjected = 0;
            int imprvCanonFeaturesProjected = 0;
            if (resume.ShouldSkip("Imprv-Canonical"))
            {
                _logger.LogInformation("[Drain:improvement] SKIP Imprv-Canonical");
            }
            else
            {
                var imprvCanon = await imprvCanonicalProjector.ProjectAsync(
                    imprvTruthBatchId, operatorName, cancellationToken);
                batchIds.Add(imprvCanon.PromotionLoadBatchId);
                if (!IsCompleted(imprvCanon.Status))
                    return await FailLaneAsync(LaneName, "Imprv-Canonical", imprvCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                imprvCanonImprovementsProjected = imprvCanon.ImprovementsProjected;
                imprvCanonFeaturesProjected = imprvCanon.FeaturesProjected;
                await resume.CheckpointAsync("Imprv-Canonical", batchIds, cancellationToken);
            }

            rowsLanded = imprvS1RowsLanded + detailS1RowsLanded + attrS1RowsLanded;
            rowsPromotedToTruth = imprvTruthImprvsPromoted;
            rowsCanonicalized = imprvCanonImprovementsProjected + imprvCanonFeaturesProjected;

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: rowsLanded,
                rowsPromotedToTruth: rowsPromotedToTruth,
                rowsCanonicalized: rowsCanonicalized,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:improvement] FAILED");
            return await FailLaneAsync(LaneName, "Exception", SerializeExceptionChain(ex),
                batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // LAND drain — land_detail → land truth → tf_land canonical.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the land lane. Owner-anchored seed → parcel chain →
    /// keyed land_detail S1 → land truth (L2) → tf_land canonical (L3).
    /// </summary>
    [HttpPost("land")]
    public async Task<IActionResult> DrainLand(
        [FromServices] IPacsOwnerLandingService ownerSvc,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsLandDetailLandingService landSvc,
        [FromServices] IPacsLandCurrentTruthPromoter landTruthPromoter,
        [FromServices] IPacsLandCanonicalProjector landCanonicalProjector,
        [FromServices] IConfiguration config,
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "land";
        var (pacsCs, validationError) = ResolveConnectionString(config);
        if (validationError is not null) return validationError;

        var (operatorName, workingYear, fullCorpus, topN) = NormalizeRequest(request, LaneName);
        var startedAt = DateTime.UtcNow;
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);
        // SYNC-COMPLETE-2-V2.
        var resume = await BuildResumeContextAsync(LaneName, request, cancellationToken);
        var batchIds = new List<Guid>();
        for (var i = 0; i < LaneStageOrder.Stages[LaneName].Count; i++)
        {
            var prior = resume.GetPriorBatchId(LaneStageOrder.Stages[LaneName][i]);
            if (prior is null) break;
            batchIds.Add(prior.Value);
        }
        int rowsLanded = 0, rowsPromotedToTruth = 0, rowsCanonicalized = 0;

        try
        {
            var bentonCounty = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var bentonCountyId = bentonCounty.Id;
            var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Stage 1: Owner-Seed-S1.
            Guid ownerSeedBatchId;
            if (resume.ShouldSkip("Owner-Seed-S1"))
            {
                ownerSeedBatchId = resume.GetPriorBatchId("Owner-Seed-S1") ?? throw new InvalidOperationException("Owner-Seed-S1 missing.");
                _logger.LogInformation("[Drain:land] SKIP Owner-Seed-S1; batchId={Bid}", ownerSeedBatchId);
            }
            else
            {
                _logger.LogInformation("[Drain:land] Owner seed (TopN={Top}, FullCorpus={Full})", seedTopN, fullCorpus);
                var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN);
                var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
                batchIds.Add(ownerSeedS1.LoadBatchId);
                if (!IsCompleted(ownerSeedS1.Status))
                    return await FailLaneAsync(LaneName, "Owner-Seed-S1", ownerSeedS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                ownerSeedBatchId = ownerSeedS1.LoadBatchId;
                await resume.CheckpointAsync("Owner-Seed-S1", batchIds, cancellationToken);
            }

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Stage 2: Parcel-S1.
            Guid parcelS1BatchId;
            if (resume.ShouldSkip("Parcel-S1"))
            {
                parcelS1BatchId = resume.GetPriorBatchId("Parcel-S1") ?? throw new InvalidOperationException("Parcel-S1 missing.");
                _logger.LogInformation("[Drain:land] SKIP Parcel-S1; batchId={Bid}", parcelS1BatchId);
            }
            else
            {
                var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, seedPropIds);
                var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
                batchIds.Add(parcelS1.LoadBatchId);
                if (!IsCompleted(parcelS1.Status))
                    return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelS1BatchId = parcelS1.LoadBatchId;
                await resume.CheckpointAsync("Parcel-S1", batchIds, cancellationToken);
            }

            // Stage 3: Parcel-Spine.
            Guid parcelSpineBatchId;
            if (resume.ShouldSkip("Parcel-Spine"))
            {
                parcelSpineBatchId = resume.GetPriorBatchId("Parcel-Spine") ?? throw new InvalidOperationException("Parcel-Spine missing.");
                _logger.LogInformation("[Drain:land] SKIP Parcel-Spine; batchId={Bid}", parcelSpineBatchId);
            }
            else
            {
                var parcelSpine = await spinePromoter.PromoteAsync(parcelS1BatchId, operatorName, cancellationToken);
                batchIds.Add(parcelSpine.PromotionLoadBatchId);
                if (!IsCompleted(parcelSpine.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                parcelSpineBatchId = parcelSpine.PromotionLoadBatchId;
                await resume.CheckpointAsync("Parcel-Spine", batchIds, cancellationToken);
            }

            // Stage 4: Parcel-Canonical.
            if (resume.ShouldSkip("Parcel-Canonical"))
            {
                _logger.LogInformation("[Drain:land] SKIP Parcel-Canonical");
            }
            else
            {
                var parcelCanon = await parcelCanonical.ProjectAsync(
                    parcelSpineBatchId, bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(parcelCanon.PromotionLoadBatchId);
                if (!IsCompleted(parcelCanon.Status))
                    return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                await resume.CheckpointAsync("Parcel-Canonical", batchIds, cancellationToken);
            }

            // Land keys.
            var spinePropIds = await _db.TruthPacsParcelSpines
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == parcelSpineBatchId)
                .Select(t => t.PropId)
                .ToListAsync(cancellationToken);
            var landKeys = spinePropIds.Select(p => (p, workingYear)).ToList();

            // Stage 5: Supp-S1.
            Guid suppS1BatchId;
            if (resume.ShouldSkip("Supp-S1"))
            {
                suppS1BatchId = resume.GetPriorBatchId("Supp-S1") ?? throw new InvalidOperationException("Supp-S1 missing.");
                _logger.LogInformation("[Drain:land] SKIP Supp-S1; batchId={Bid}", suppS1BatchId);
            }
            else
            {
                var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, landKeys);
                var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
                batchIds.Add(suppS1.LoadBatchId);
                if (!IsCompleted(suppS1.Status))
                    return await FailLaneAsync(LaneName, "Supp-S1", suppS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                suppS1BatchId = suppS1.LoadBatchId;
                await resume.CheckpointAsync("Supp-S1", batchIds, cancellationToken);
            }

            // Stage 6: Land-S1.
            Guid landS1BatchId;
            int landS1RowsLanded = 0;
            if (resume.ShouldSkip("Land-S1"))
            {
                landS1BatchId = resume.GetPriorBatchId("Land-S1") ?? throw new InvalidOperationException("Land-S1 missing.");
                _logger.LogInformation("[Drain:land] SKIP Land-S1; batchId={Bid}", landS1BatchId);
            }
            else
            {
                var landSrc = new KeyedSqlServerPacsLandDetailSource(pacsCs!, landKeys);
                var landS1 = await landSvc.LandLandDetailsAsync(landSrc, operatorName, cancellationToken);
                batchIds.Add(landS1.LoadBatchId);
                if (!IsCompleted(landS1.Status))
                    return await FailLaneAsync(LaneName, "Land-S1", landS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                landS1BatchId = landS1.LoadBatchId;
                landS1RowsLanded = landS1.RowsLanded;
                rowsLanded = landS1RowsLanded;
                await resume.CheckpointAsync("Land-S1", batchIds, cancellationToken);
            }

            // Stage 7: Land-Truth.
            Guid landTruthBatchId;
            int landTruthLandSegsPromoted = 0;
            if (resume.ShouldSkip("Land-Truth"))
            {
                landTruthBatchId = resume.GetPriorBatchId("Land-Truth") ?? throw new InvalidOperationException("Land-Truth missing.");
                _logger.LogInformation("[Drain:land] SKIP Land-Truth; batchId={Bid}", landTruthBatchId);
            }
            else
            {
                var landTruth = await landTruthPromoter.PromoteAsync(
                    landS1BatchId, suppS1BatchId, operatorName, cancellationToken);
                batchIds.Add(landTruth.PromotionLoadBatchId);
                if (!IsCompleted(landTruth.Status))
                    return await FailLaneAsync(LaneName, "Land-Truth", landTruth.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                landTruthBatchId = landTruth.PromotionLoadBatchId;
                landTruthLandSegsPromoted = landTruth.LandSegsPromoted;
                await resume.CheckpointAsync("Land-Truth", batchIds, cancellationToken);
            }

            // Stage 8: Land-Canonical.
            int landCanonLandsProjected = 0;
            if (resume.ShouldSkip("Land-Canonical"))
            {
                _logger.LogInformation("[Drain:land] SKIP Land-Canonical");
            }
            else
            {
                var landCanon = await landCanonicalProjector.ProjectAsync(
                    landTruthBatchId, operatorName, cancellationToken);
                batchIds.Add(landCanon.PromotionLoadBatchId);
                if (!IsCompleted(landCanon.Status))
                    return await FailLaneAsync(LaneName, "Land-Canonical", landCanon.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                landCanonLandsProjected = landCanon.LandsProjected;
                await resume.CheckpointAsync("Land-Canonical", batchIds, cancellationToken);
            }

            rowsLanded = landS1RowsLanded;
            rowsPromotedToTruth = landTruthLandSegsPromoted;
            rowsCanonicalized = landCanonLandsProjected;

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: rowsLanded,
                rowsPromotedToTruth: rowsPromotedToTruth,
                rowsCanonicalized: rowsCanonicalized,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:land] FAILED");
            return await FailLaneAsync(LaneName, "Exception", SerializeExceptionChain(ex),
                batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // SALES drain — sale → keyed supp → sale truth → tf_sale canonical.
    // Independent of the parcel-anchored lanes; uses its own DESC-ordered
    // sale seed, then targets a parcel chain at the promoted sales' prop_ids.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the sales lane. Independent sale seed (DESC sale_id) →
    /// keyed prop_supp_assoc → sale truth → targeted parcel chain
    /// (sale prop_ids) → tf_sale canonical projection.
    /// </summary>
    [HttpPost("sales")]
    public async Task<IActionResult> DrainSales(
        [FromServices] IPacsSaleLandingService saleSvc,
        [FromServices] IPacsPropSuppAssocLandingService assocSvc,
        [FromServices] IPacsSaleTruthPromoter saleTruthPromoter,
        [FromServices] IPacsSaleCanonicalProjector saleCanonicalProjector,
        [FromServices] IPacsPropertyLandingService propSvc,
        [FromServices] IPacsParcelSpineTruthPromoter spinePromoter,
        [FromServices] IPacsParcelCanonicalProjector parcelCanonical,
        [FromServices] IConfiguration config,
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "sales";
        var (pacsCs, validationError) = ResolveConnectionString(config);
        if (validationError is not null) return validationError;

        var (operatorName, _, fullCorpus, topN) = NormalizeRequest(request, LaneName);
        var startedAt = DateTime.UtcNow;
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);
        // SYNC-COMPLETE-2-V2.
        var resume = await BuildResumeContextAsync(LaneName, request, cancellationToken);
        var batchIds = new List<Guid>();
        for (var i = 0; i < LaneStageOrder.Stages[LaneName].Count; i++)
        {
            var prior = resume.GetPriorBatchId(LaneStageOrder.Stages[LaneName][i]);
            if (prior is null) break;
            batchIds.Add(prior.Value);
        }
        int rowsLanded = 0, rowsPromotedToTruth = 0, rowsCanonicalized = 0;

        try
        {
            var bentonCounty = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var bentonCountyId = bentonCounty.Id;
            var saleTopN = fullCorpus ? (int?)null : (topN ?? 500);

            // Stage 1: Sale-S1.
            Guid saleS1BatchId;
            int saleS1RowsLanded = 0;
            if (resume.ShouldSkip("Sale-S1"))
            {
                saleS1BatchId = resume.GetPriorBatchId("Sale-S1") ?? throw new InvalidOperationException("Sale-S1 missing.");
                _logger.LogInformation("[Drain:sales] SKIP Sale-S1; batchId={Bid}", saleS1BatchId);
            }
            else
            {
                _logger.LogInformation("[Drain:sales] Sale S1 (TopN={Top}, FullCorpus={Full})", saleTopN, fullCorpus);
                var saleSrc = new SqlServerPacsSaleSource(pacsCs!, topN: saleTopN);
                var saleS1 = await saleSvc.LandSalesAsync(saleSrc, operatorName, cancellationToken);
                batchIds.Add(saleS1.LoadBatchId);
                if (!IsCompleted(saleS1.Status))
                    return await FailLaneAsync(LaneName, "Sale-S1", saleS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                saleS1BatchId = saleS1.LoadBatchId;
                saleS1RowsLanded = saleS1.RowsLanded;
                rowsLanded = saleS1RowsLanded;
                await resume.CheckpointAsync("Sale-S1", batchIds, cancellationToken);
            }

            // Build supp keys from sale batch (independent of skip).
            var saleSuppRaw = await _db.LegacyPacsRawSales
                .AsNoTracking()
                .Where(s => s.LoadBatchId == saleS1BatchId)
                .Select(s => new { s.PropId, s.PropValYr })
                .Distinct()
                .ToListAsync(cancellationToken);
            var saleSuppKeys = saleSuppRaw.Select(k => (k.PropId, k.PropValYr)).ToList();

            // Stage 2: Sale-Supp-S1.
            Guid saleSuppS1BatchId;
            if (resume.ShouldSkip("Sale-Supp-S1"))
            {
                saleSuppS1BatchId = resume.GetPriorBatchId("Sale-Supp-S1") ?? throw new InvalidOperationException("Sale-Supp-S1 missing.");
                _logger.LogInformation("[Drain:sales] SKIP Sale-Supp-S1; batchId={Bid}", saleSuppS1BatchId);
            }
            else
            {
                var saleSuppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, saleSuppKeys);
                var saleSuppS1 = await assocSvc.LandPropSuppAssocsAsync(saleSuppSrc, operatorName, cancellationToken);
                batchIds.Add(saleSuppS1.LoadBatchId);
                if (!IsCompleted(saleSuppS1.Status))
                    return await FailLaneAsync(LaneName, "Sale-Supp-S1", saleSuppS1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                saleSuppS1BatchId = saleSuppS1.LoadBatchId;
                await resume.CheckpointAsync("Sale-Supp-S1", batchIds, cancellationToken);
            }

            // Stage 3: Sale-Truth.
            Guid saleTruthBatchId;
            int saleTruthSalesPromoted = 0;
            if (resume.ShouldSkip("Sale-Truth"))
            {
                saleTruthBatchId = resume.GetPriorBatchId("Sale-Truth") ?? throw new InvalidOperationException("Sale-Truth missing.");
                _logger.LogInformation("[Drain:sales] SKIP Sale-Truth; batchId={Bid}", saleTruthBatchId);
            }
            else
            {
                var saleTruth = await saleTruthPromoter.PromoteAsync(
                    saleS1BatchId, saleSuppS1BatchId, operatorName, cancellationToken);
                batchIds.Add(saleTruth.PromotionLoadBatchId);
                if (!IsCompleted(saleTruth.Status))
                    return await FailLaneAsync(LaneName, "Sale-Truth", saleTruth.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                saleTruthBatchId = saleTruth.PromotionLoadBatchId;
                saleTruthSalesPromoted = saleTruth.SalesPromoted;
                await resume.CheckpointAsync("Sale-Truth", batchIds, cancellationToken);
            }

            // Targeted parcel chain only when there are promoted sales.
            var promotedSalePropIds = await _db.TruthPacsSales
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == saleTruthBatchId)
                .Select(t => t.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            int salesProjected = 0;
            if (promotedSalePropIds.Count > 0)
            {
                // Stage 4: Sale-Parcel-S1.
                Guid saleParcelS1BatchId;
                if (resume.ShouldSkip("Sale-Parcel-S1"))
                {
                    saleParcelS1BatchId = resume.GetPriorBatchId("Sale-Parcel-S1") ?? throw new InvalidOperationException("Sale-Parcel-S1 missing.");
                    _logger.LogInformation("[Drain:sales] SKIP Sale-Parcel-S1; batchId={Bid}", saleParcelS1BatchId);
                }
                else
                {
                    var saleParcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, promotedSalePropIds);
                    var saleParcelS1 = await propSvc.LandPropertiesAsync(saleParcelSrc, operatorName, cancellationToken);
                    batchIds.Add(saleParcelS1.LoadBatchId);
                    if (!IsCompleted(saleParcelS1.Status))
                        return await FailLaneAsync(LaneName, "Sale-Parcel-S1", saleParcelS1.ErrorSummary,
                            batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                    saleParcelS1BatchId = saleParcelS1.LoadBatchId;
                    await resume.CheckpointAsync("Sale-Parcel-S1", batchIds, cancellationToken);
                }

                // Stage 5: Sale-Parcel-Spine.
                Guid saleParcelSpineBatchId;
                if (resume.ShouldSkip("Sale-Parcel-Spine"))
                {
                    saleParcelSpineBatchId = resume.GetPriorBatchId("Sale-Parcel-Spine") ?? throw new InvalidOperationException("Sale-Parcel-Spine missing.");
                    _logger.LogInformation("[Drain:sales] SKIP Sale-Parcel-Spine; batchId={Bid}", saleParcelSpineBatchId);
                }
                else
                {
                    var saleParcelSpine = await spinePromoter.PromoteAsync(saleParcelS1BatchId, operatorName, cancellationToken);
                    batchIds.Add(saleParcelSpine.PromotionLoadBatchId);
                    if (!IsCompleted(saleParcelSpine.Status))
                        return await FailLaneAsync(LaneName, "Sale-Parcel-Spine", saleParcelSpine.ErrorSummary,
                            batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                    saleParcelSpineBatchId = saleParcelSpine.PromotionLoadBatchId;
                    await resume.CheckpointAsync("Sale-Parcel-Spine", batchIds, cancellationToken);
                }

                // Stage 6: Sale-Parcel-Canonical.
                if (resume.ShouldSkip("Sale-Parcel-Canonical"))
                {
                    _logger.LogInformation("[Drain:sales] SKIP Sale-Parcel-Canonical");
                }
                else
                {
                    var saleParcelCanon = await parcelCanonical.ProjectAsync(
                        saleParcelSpineBatchId, bentonCountyId, operatorName, cancellationToken);
                    batchIds.Add(saleParcelCanon.PromotionLoadBatchId);
                    if (!IsCompleted(saleParcelCanon.Status))
                        return await FailLaneAsync(LaneName, "Sale-Parcel-Canonical", saleParcelCanon.ErrorSummary,
                            batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                    await resume.CheckpointAsync("Sale-Parcel-Canonical", batchIds, cancellationToken);
                }

                // Stage 7: Sale-Canonical.
                if (resume.ShouldSkip("Sale-Canonical"))
                {
                    _logger.LogInformation("[Drain:sales] SKIP Sale-Canonical");
                }
                else
                {
                    var saleCanon = await saleCanonicalProjector.ProjectAsync(
                        saleTruthBatchId, operatorName, cancellationToken);
                    batchIds.Add(saleCanon.PromotionLoadBatchId);
                    if (!IsCompleted(saleCanon.Status))
                        return await FailLaneAsync(LaneName, "Sale-Canonical", saleCanon.ErrorSummary,
                            batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                    salesProjected = saleCanon.SalesProjected;
                    await resume.CheckpointAsync("Sale-Canonical", batchIds, cancellationToken);
                }
            }

            rowsLanded = saleS1RowsLanded;
            rowsPromotedToTruth = saleTruthSalesPromoted;
            rowsCanonicalized = salesProjected;

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: rowsLanded,
                rowsPromotedToTruth: rowsPromotedToTruth,
                rowsCanonicalized: rowsCanonicalized,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:sales] FAILED");
            return await FailLaneAsync(LaneName, "Exception", SerializeExceptionChain(ex),
                batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // GEOMETRY drain — ArcGIS REST → tf_parcel_geom canonical.
    // Independent of the parcel-anchored lanes; APN crosswalk resolves
    // against tf_parcel rows present at projection time.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the geometry lane. ArcGIS REST D1 raw → D2 truth → D3
    /// canonical (tf_parcel_geom + APN crosswalk). TopN bounds the
    /// ArcGIS pull via resultRecordCount; FullCorpus=true clears the cap.
    /// </summary>
    [HttpPost("geometry")]
    public async Task<IActionResult> DrainGeometry(
        [FromServices] IArcGisRawLandingService rawLandingSvc,
        [FromServices] IArcGisTruthPromotionService truthPromotionSvc,
        [FromServices] IArcGisCanonicalProjector canonicalProjector,
        [FromServices] IOptions<ArcGisFeatureServiceOptions> arcGisOptions,
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "geometry";
        var (operatorName, _, fullCorpus, topN) = NormalizeRequest(request, LaneName);

        // Full-corpus guard: operator must explicitly opt in to FullCorpus=true.
        // Null TopN + FullCorpus=false would silently pull ~80k features.
        if (topN is null && !fullCorpus)
        {
            return BadRequest(new
            {
                error = "Geometry drain requires either TopN (bounded slice) or FullCorpus=true (full county). " +
                        "Refusing to run without an explicit slice or full-corpus authorization.",
            });
        }

        // null geomTopN → no resultRecordCount (full-corpus ArcGIS pull).
        var geomTopN = fullCorpus ? (int?)null : topN;
        var startedAt = DateTime.UtcNow;
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);
        // SYNC-COMPLETE-2-V2.
        var resume = await BuildResumeContextAsync(LaneName, request, cancellationToken);
        var batchIds = new List<Guid>();
        for (var i = 0; i < LaneStageOrder.Stages[LaneName].Count; i++)
        {
            var prior = resume.GetPriorBatchId(LaneStageOrder.Stages[LaneName][i]);
            if (prior is null) break;
            batchIds.Add(prior.Value);
        }
        int rowsLanded = 0, rowsPromotedToTruth = 0, rowsCanonicalized = 0;

        try
        {
            var bentonCounty = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var bentonCountyId = bentonCounty.Id;

            // GEOM-005: config is keyed by FIPS code, not GUID.
            // Refuse before any ArcGIS network call if FipsCode is unset or has no config entry.
            if (string.IsNullOrEmpty(bentonCounty.FipsCode))
                return BadRequest(new { error = "Benton county row has no FipsCode — geometry drain refused." });

            var arcGisCounty = arcGisOptions.Value.GetForCounty(bentonCounty.FipsCode);
            if (arcGisCounty is null)
                return NotFound(new { error = $"No ArcGIS config entry for FIPS {bentonCounty.FipsCode}." });

            // GEOM-011: identity guard — if config has an explicit CountyId it must match the DB row.
            if (arcGisCounty.CountyId.HasValue && arcGisCounty.CountyId.Value != bentonCounty.Id)
            {
                return StatusCode(409, new
                {
                    error = $"ArcGIS config CountyId ({arcGisCounty.CountyId}) does not match Benton DB row Id ({bentonCounty.Id}). " +
                            "Resolve identity conflict before running the geometry drain.",
                });
            }

            // GEOM-011: paged when FullCorpus=true or topN exceeds a single ArcGIS page.
            var pageSize = arcGisCounty.PageSize;
            var usePaged = fullCorpus || (geomTopN.HasValue && geomTopN.Value > pageSize);

            // Stage 1: ArcGis-D1.
            int d1FeaturesLanded = 0;
            if (resume.ShouldSkip("ArcGis-D1"))
            {
                _logger.LogInformation("[Drain:geometry] SKIP ArcGis-D1");
            }
            else
            {
                _logger.LogInformation("[Drain:geometry] D1 ArcGIS landing for county={Cid} paged={Paged}", bentonCountyId, usePaged);
                ArcGisRawLandingResult d1;
                if (usePaged)
                    d1 = await rawLandingSvc.LandParcelGeomsPagedAsync(
                        bentonCounty.FipsCode, bentonCountyId, operatorName, pageSize, geomTopN, cancellationToken);
                else
                    d1 = await rawLandingSvc.LandParcelGeomsAsync(
                        bentonCounty.FipsCode, bentonCountyId, operatorName, geomTopN, cancellationToken);
                batchIds.Add(d1.LoadBatchId);
                if (!IsCompleted(d1.Status))
                    return await FailLaneAsync(LaneName, "ArcGis-D1", d1.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                d1FeaturesLanded = d1.FeaturesLanded;
                rowsLanded = d1FeaturesLanded;
                await resume.CheckpointAsync("ArcGis-D1", batchIds, cancellationToken);
            }

            // Stage 2: ArcGis-D2.
            int d2RowsPromoted = 0;
            if (resume.ShouldSkip("ArcGis-D2"))
            {
                _logger.LogInformation("[Drain:geometry] SKIP ArcGis-D2");
            }
            else
            {
                var d2 = await truthPromotionSvc.PromoteCountyAsync(bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(d2.PromotionLoadBatchId);
                if (!IsCompleted(d2.Status))
                    return await FailLaneAsync(LaneName, "ArcGis-D2", d2.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                d2RowsPromoted = d2.RowsPromoted;
                await resume.CheckpointAsync("ArcGis-D2", batchIds, cancellationToken);
            }

            // Stage 3: ArcGis-D3.
            int d3RowsProjected = 0;
            if (resume.ShouldSkip("ArcGis-D3"))
            {
                _logger.LogInformation("[Drain:geometry] SKIP ArcGis-D3");
            }
            else
            {
                var d3 = await canonicalProjector.ProjectCountyAsync(bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(d3.PromotionLoadBatchId);
                if (!IsCompleted(d3.Status))
                    return await FailLaneAsync(LaneName, "ArcGis-D3", d3.ErrorSummary,
                        batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
                d3RowsProjected = d3.RowsProjected;
                await resume.CheckpointAsync("ArcGis-D3", batchIds, cancellationToken);
            }

            rowsLanded = d1FeaturesLanded;
            rowsPromotedToTruth = d2RowsPromoted;
            rowsCanonicalized = d3RowsProjected;

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: rowsLanded,
                rowsPromotedToTruth: rowsPromotedToTruth,
                rowsCanonicalized: rowsCanonicalized,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:geometry] FAILED");
            return await FailLaneAsync(LaneName, "Exception", SerializeExceptionChain(ex),
                batchIds, rowsLanded, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // Helpers — request normalization, county resolution, response shape.
    // ════════════════════════════════════════════════════════════════════

    private static (string? cs, IActionResult? error) ResolveConnectionString(IConfiguration config)
    {
        var cs = config.GetConnectionString("PacsConnection");
        if (string.IsNullOrWhiteSpace(cs))
        {
            return (null, new ObjectResult(new
            {
                error = "ConnectionStrings:PacsConnection is required.",
            })
            { StatusCode = 500 });
        }
        return (cs, null);
    }

    internal static (string OperatorName, short WorkingYear, bool FullCorpus, int? TopN)
        NormalizeRequest(DoctrineDrainRequest? request, string laneName)
    {
        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? $"doctrine-drain-{laneName}"
            : request!.OperatorName!.Trim();
        var workingYear = (short)(request?.WorkingYear ?? 2026);
        var fullCorpus = request?.FullCorpus ?? false;
        var topN = request?.TopN;
        return (operatorName, workingYear, fullCorpus, topN);
    }

    // Anchor GUID matches DatabaseSeeder.BentonCountyId. If ResolveOrCreate falls through
    // to creation, this ID keeps the county row stable across reseeds. ArcGIS config is
    // now keyed by FipsCode ("53005"), not by this GUID.
    private static readonly Guid KnownBentonCountyId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    /// <summary>
    /// Resolve Benton (WA) county id by FIPS, then by Name+State, then
    /// create. Mirrors CanonicalDebugController's implementation.
    /// </summary>
    private async Task<County> ResolveOrCreateBentonCountyAsync(CancellationToken cancellationToken)
    {
        var byFips = await _db.Counties
            .FirstOrDefaultAsync(c => c.FipsCode == "53005", cancellationToken)
            .ConfigureAwait(false);
        if (byFips is not null) return byFips;

        var byName = await _db.Counties
            .FirstOrDefaultAsync(c =>
                EF.Functions.ILike(c.Name, "Benton") &&
                EF.Functions.ILike(c.State, "WA"),
                cancellationToken)
            .ConfigureAwait(false);
        if (byName is not null) return byName;

        var county = new County
        {
            Id = KnownBentonCountyId,
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Counties.Add(county);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        _logger.LogInformation("[DoctrineDrain] Created Benton county row id={Id}", county.Id);
        return county;
    }

    private static bool IsCompleted(string? status) =>
        string.Equals(status, "COMPLETED", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// SYNC-COMPLETE-2-V3: outcome of a year-sliced ImprvAttr-S1 stage.
    /// Exactly one of <see cref="FailureResponse"/> / <see cref="LastBatchId"/>
    /// will be set (mutually exclusive). <see cref="TotalRowsLanded"/> is
    /// the cumulative landed-row count across every year-substage that
    /// ran (skipped years do not contribute).
    /// </summary>
    private sealed class YearSlicedImprvAttrResult
    {
        public Guid? LastBatchId { get; init; }
        public int TotalRowsLanded { get; init; }
        public IActionResult? FailureResponse { get; init; }
    }

    /// <summary>
    /// SYNC-COMPLETE-2-V3: year-slice the <c>ImprvAttr-S1</c> stage of
    /// the improvement lane. Runs one landing batch per distinct
    /// <c>prop_val_yr</c> in <c>legacy_pacs_raw.imprv</c> for the seed
    /// prop_ids, ascending. After each year completes, persists
    /// <c>LastCompletedStage = "ImprvAttr-S1-Y{year}"</c> so a crash
    /// resumes at the next un-completed year.
    ///
    /// <para>Returns a result object whose <c>LastBatchId</c> (the last
    /// year's batch id) is the single representative slot to append to
    /// <c>batchIds</c> for the parent <c>ImprvAttr-S1</c> stage position.
    /// On any year-substage failure, <c>FailureResponse</c> holds the
    /// pre-built <c>FailLaneAsync</c> result and the caller should
    /// propagate it directly.</para>
    ///
    /// <para>Function-preserving: same landing service, same hashing,
    /// same gates, same quarantine semantics. Only the per-call working
    /// set is smaller and resume granularity is finer.</para>
    /// </summary>
    private async Task<YearSlicedImprvAttrResult> RunYearSlicedImprvAttrStageAsync(
        IPacsImprvAttrLandingService imprvAttrSvc,
        string pacsConnectionString,
        IReadOnlyList<int> seedPropIds,
        StageResumeContext resume,
        List<Guid> batchIds,
        string operatorName,
        DateTime startedAt,
        int quarantineBefore,
        CancellationToken cancellationToken)
    {
        const string LaneName = "improvement";

        // Year list: from legacy_pacs_raw.imprv for the seed prop_ids,
        // ascending. Querying the post-Imprv-S1 landing table (rather
        // than PACS directly) is faster and avoids round-tripping to
        // MSSQL just to enumerate years. It guarantees we only iterate
        // years that actually have improvement rows — and therefore
        // potentially imprv_attr rows.
        var years = await _db.LegacyPacsRawImprvs
            .AsNoTracking()
            .Where(i => seedPropIds.Contains(i.PropId))
            .Select(i => i.PropValYr)
            .Distinct()
            .OrderBy(y => y)
            .ToListAsync(cancellationToken);

        if (years.Count == 0)
        {
            // No imprv rows for the seed → nothing to land.
            // Functionally equivalent to the legacy single-call path
            // with an empty key list (zero rows landed, one batch).
            _logger.LogInformation(
                "[Drain:improvement] ImprvAttr-S1 year-list is empty; nothing to land.");
            return new YearSlicedImprvAttrResult
            {
                LastBatchId = null,
                TotalRowsLanded = 0,
                FailureResponse = null,
            };
        }

        _logger.LogInformation(
            "[Drain:improvement] ImprvAttr-S1 year-sliced; years={Count} (range {Min}..{Max})",
            years.Count, years[0], years[^1]);

        Guid? lastBatchId = null;
        var totalRowsLanded = 0;

        foreach (var year in years)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var stageName = LaneStageOrder.FormatImprvAttrYearSubstage(year);
            if (resume.ShouldSkip(stageName))
            {
                _logger.LogInformation(
                    "[Drain:improvement] SKIP {Stage} (resume past it)",
                    stageName);
                continue;
            }

            var yearKeys = seedPropIds.Select(p => (p, (short)year)).ToList();
            var attrSrc = new KeyedSqlServerPacsImprvAttrSource(pacsConnectionString, yearKeys);
            var attrSlice = await imprvAttrSvc.LandImprvAttrsAsync(attrSrc, operatorName, cancellationToken);
            if (!IsCompleted(attrSlice.Status))
            {
                // Per-year failure → fail the lane at this substage so
                // the persisted LastCompletedStage reflects the exact
                // year that failed and resume picks up there.
                var failResponse = await FailLaneAsync(LaneName, stageName, attrSlice.ErrorSummary,
                    batchIds, totalRowsLanded, startedAt, quarantineBefore, cancellationToken);
                return new YearSlicedImprvAttrResult
                {
                    LastBatchId = null,
                    TotalRowsLanded = totalRowsLanded,
                    FailureResponse = failResponse,
                };
            }

            totalRowsLanded += attrSlice.RowsLanded;
            lastBatchId = attrSlice.LoadBatchId;

            _logger.LogInformation(
                "[Drain:improvement] {Stage} OK; batchId={Bid} rowsLanded={Rows}",
                stageName, attrSlice.LoadBatchId, attrSlice.RowsLanded);

            // Persist substage checkpoint without appending the per-year
            // batch id to batchIds — the parent ImprvAttr-S1 slot stays
            // empty until the entire year loop completes, preserving
            // position-mapping for downstream named stages.
            await resume.CheckpointAsync(stageName, batchIds, cancellationToken);
        }

        return new YearSlicedImprvAttrResult
        {
            LastBatchId = lastBatchId,
            TotalRowsLanded = totalRowsLanded,
            FailureResponse = null,
        };
    }

    /// <summary>
    /// Sum of the six quarantine tables exposed by <c>/api/sync/doctrine/state</c>.
    /// </summary>
    private async Task<int> CountQuarantineAsync(CancellationToken cancellationToken)
    {
        var sale = await _db.LegacyTfUnprovenSales.CountAsync(cancellationToken);
        var ownerCurrent = await _db.LegacyTfUnprovenOwnerCurrents.CountAsync(cancellationToken);
        var wpov = await _db.LegacyTfUnprovenWashPropOwnerVals.CountAsync(cancellationToken);
        var imprvCurrent = await _db.LegacyTfUnprovenImprvCurrents.CountAsync(cancellationToken);
        var imprvAttr = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(cancellationToken);
        var landCurrent = await _db.LegacyTfUnprovenLandCurrents.CountAsync(cancellationToken);
        return sale + ownerCurrent + wpov + imprvCurrent + imprvAttr + landCurrent;
    }

    /// <summary>
    /// Aggregate gate results for the supplied batch ids. PASS/FAIL/WARN
    /// counts plus the most recent FAIL/WARN details (cap 10).
    /// </summary>
    private async Task<object> BuildGateSummaryAsync(IReadOnlyList<Guid> batchIds, CancellationToken cancellationToken)
    {
        if (batchIds.Count == 0) return new { totals = Array.Empty<object>(), recentFailures = Array.Empty<object>() };

        var totals = await _db.SyncBridgePromotionGateResults
            .Where(g => batchIds.Contains(g.LoadBatchId))
            .GroupBy(g => g.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync(cancellationToken);

        var recent = await _db.SyncBridgePromotionGateResults
            .Where(g => batchIds.Contains(g.LoadBatchId) && (g.Status == "FAIL" || g.Status == "WARN"))
            .OrderByDescending(g => g.ExecutedAt)
            .Take(10)
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

        return new { totals, recentFailures = recent };
    }

    private static string? NextRecommendedLane(string lane) => lane switch
    {
        "parcel" => "owner-wsdor",
        "owner-wsdor" => "improvement",
        "improvement" => "land",
        "land" => "sales",
        "sales" => "geometry",
        "geometry" => null,
        _ => null,
    };

    // ── PR-8 Prometheus H22: metrics instrumentation ─────────────────────
    //
    // PrometheusConfig defines a meter ("TerraFusion.API") with named
    // counters / histograms but had zero call sites. The lane endpoints
    // converge through OkLaneAsync / FailLaneAsync, so emitting once here
    // covers all 6 lanes (parcel, owner-wsdor, improvement, land, sales,
    // geometry) without touching individual stage services. Per-gate
    // FAIL counts are emitted from the gate summary so dashboards can
    // alert on which gate is firing.

    /// <summary>
    /// Emit lane-completion metrics. Called from <see cref="OkLaneAsync"/>
    /// and <see cref="FailLaneAsync"/>. Status is "success" or "failure"
    /// to match <c>PrometheusConfig.RecordSyncOperation</c> labeling.
    /// </summary>
    internal static void EmitLaneCompletionMetrics(
        string lane,
        bool success,
        double durationSeconds,
        long rowsLanded,
        string? failedStage)
    {
        // Sync surface — connector_name = lane.
        var syncTags = new TagList
        {
            { "connector_name", lane },
            { "status", success ? "success" : "failure" },
        };
        PrometheusConfig.SyncOperationsTotal.Add(1, syncTags);
        PrometheusConfig.SyncDurationSeconds.Record(durationSeconds, syncTags);
        if (rowsLanded > 0)
            PrometheusConfig.SyncRecordsProcessed.Add(rowsLanded, syncTags);

        // ETL surface — source_system = lane (Benton PACS for these 6
        // lanes today; future county sources will overload this label).
        var etlTags = new TagList
        {
            { "source_system", lane },
            { "status", success ? "success" : "failure" },
        };
        PrometheusConfig.EtlRunsTotal.Add(1, etlTags);
        PrometheusConfig.EtlRunDurationSeconds.Record(durationSeconds, etlTags);
        if (rowsLanded > 0)
        {
            var landTags = new TagList
            {
                { "step_id", "land" },
                { "source_system", lane },
            };
            PrometheusConfig.EtlRecordsTotal.Add(rowsLanded, landTags);
        }
        if (!success)
        {
            var failTags = new TagList
            {
                { "step_id", failedStage ?? "Unknown" },
                { "source_system", lane },
            };
            PrometheusConfig.EtlStepFailures.Add(1, failTags);
        }
    }

    /// <summary>
    /// Emit one <c>EtlStepFailures</c> counter increment per FAIL gate so
    /// dashboards can break down by gate name (e.g. WSDOR taxable-min,
    /// truth-pacs-imprv-universe-distribution). PASS gates intentionally
    /// don't emit — no PrometheusConfig metric maps to gate-pass; see PR
    /// body for the divergence note.
    /// </summary>
    private async System.Threading.Tasks.Task EmitGateMetricsAsync(
        string lane,
        IReadOnlyList<Guid> batchIds,
        DateTime emittedAfterUtc,
        CancellationToken cancellationToken)
    {
        if (batchIds.Count == 0) return;
        try
        {
            var failedByName = await _db.SyncBridgePromotionGateResults
                .Where(g =>
                    batchIds.Contains(g.LoadBatchId) &&
                    g.Status == "FAIL" &&
                    g.ExecutedAt >= emittedAfterUtc)
                .GroupBy(g => g.GateName)
                .Select(g => new { name = g.Key, count = g.Count() })
                .ToListAsync(cancellationToken);

            foreach (var row in failedByName)
            {
                var tags = new TagList
                {
                    { "step_id", row.name },
                    { "source_system", lane },
                };
                PrometheusConfig.EtlStepFailures.Add(row.count, tags);
            }
        }
        catch (Exception ex)
        {
            // Metrics emission is best-effort — never fail a lane because
            // the gate aggregation query blew up.
            _logger.LogWarning(ex, "[Drain:{Lane}] gate-metrics emission failed", lane);
        }
    }

    private async Task<IActionResult> OkLaneAsync(
        string lane,
        List<Guid> batchIds,
        int rowsLanded,
        int rowsPromotedToTruth,
        int rowsCanonicalized,
        DateTime startedAt,
        int quarantineBefore,
        CancellationToken cancellationToken)
    {
        var quarantineAfter = await CountQuarantineAsync(cancellationToken);
        var rowsQuarantinedThisLane = Math.Max(0, quarantineAfter - quarantineBefore);
        var gateSummary = await BuildGateSummaryAsync(batchIds, cancellationToken);
        var durationSec = (DateTime.UtcNow - startedAt).TotalSeconds;

        // PR-8 Prometheus H22: emit metrics before the HTTP response.
        EmitLaneCompletionMetrics(
            lane,
            success: true,
            durationSeconds: durationSec,
            rowsLanded: rowsLanded,
            failedStage: null);
        await EmitGateMetricsAsync(lane, batchIds, startedAt, cancellationToken);

        return Ok(new
        {
            lane,
            status = "Succeeded",
            batchIds,
            counts = new
            {
                rowsLanded,
                rowsPromotedToTruth,
                rowsCanonicalized,
                rowsQuarantinedThisLane,
            },
            durationSec,
            gateSummary,
            quarantineDelta = new
            {
                before = quarantineBefore,
                after = quarantineAfter,
                delta = quarantineAfter - quarantineBefore,
            },
            nextRecommendedLane = NextRecommendedLane(lane),
        });
    }

    /// <summary>
    /// PR-3 observability fix #3: walk the full inner-exception chain so
    /// DbUpdateException → SqlException (constraint name, conflicting key)
    /// survives serialization into the lane error summary. The previous
    /// <c>$"{ex.GetType().Name}: {ex.Message}"</c> pattern lost 100% of inner
    /// context — exactly the bug that burned 3 days on the improvement-lane
    /// drain triage.
    /// </summary>
    /// <param name="ex">Exception to serialize.</param>
    /// <param name="maxDepth">Defensive cap on InnerException walks (cycles
    /// shouldn't happen but the bound makes the worst case bounded).</param>
    internal static string SerializeExceptionChain(Exception ex, int maxDepth = 5)
    {
        if (ex is null) return string.Empty;
        var sb = new StringBuilder();
        var current = ex;
        var depth = 0;
        while (current != null && depth < maxDepth)
        {
            if (depth > 0) sb.Append(" || INNER: ");
            sb.Append(current.GetType().Name).Append(": ").Append(current.Message);
            current = current.InnerException;
            depth++;
        }
        // Also include first 4KB of full ToString() so the stack trace is
        // recoverable from the lane row without a separate log lookup.
        var fullDump = ex.ToString();
        if (fullDump.Length > 4096) fullDump = fullDump[..4096] + "... [truncated]";
        sb.Append(" || STACK: ").Append(fullDump);
        return sb.ToString();
    }

    private async Task<IActionResult> FailLaneAsync(
        string lane,
        string failedStage,
        string? errorSummary,
        List<Guid> batchIds,
        int rowsLanded,
        DateTime startedAt,
        int quarantineBefore,
        CancellationToken cancellationToken)
    {
        int quarantineAfter;
        object gateSummary;
        try
        {
            quarantineAfter = await CountQuarantineAsync(cancellationToken);
            gateSummary = await BuildGateSummaryAsync(batchIds, cancellationToken);
        }
        catch (Exception ex)
        {
            // If the diagnostic queries themselves fail, surface a degraded
            // response rather than masking the original lane error.
            _logger.LogWarning(ex, "[Drain:{Lane}] post-failure diagnostics threw", lane);
            quarantineAfter = quarantineBefore;
            gateSummary = new { totals = Array.Empty<object>(), recentFailures = Array.Empty<object>() };
        }

        var durationSec = (DateTime.UtcNow - startedAt).TotalSeconds;

        // PR-8 Prometheus H22: emit metrics before the HTTP response.
        EmitLaneCompletionMetrics(
            lane,
            success: false,
            durationSeconds: durationSec,
            rowsLanded: rowsLanded,
            failedStage: failedStage);
        await EmitGateMetricsAsync(lane, batchIds, startedAt, cancellationToken);

        return new ObjectResult(new
        {
            lane,
            status = "Failed",
            failedStage,
            error = errorSummary,
            batchIds,
            counts = new
            {
                rowsLanded,
                rowsPromotedToTruth = 0,
                rowsCanonicalized = 0,
                rowsQuarantinedThisLane = Math.Max(0, quarantineAfter - quarantineBefore),
            },
            durationSec,
            gateSummary,
            quarantineDelta = new
            {
                before = quarantineBefore,
                after = quarantineAfter,
                delta = quarantineAfter - quarantineBefore,
            },
            nextRecommendedLane = (string?)null,
        })
        { StatusCode = 500 };
    }

    /// <param name="OperatorName">Audit anchor on every batch this lane writes.</param>
    /// <param name="WorkingYear">PACS prop_val_yr filter for the year-grain stages
    /// (improvement, land). Default 2026 — Benton's active assessment year.</param>
    /// <param name="FullCorpus">When true, the seed source's TopN is null
    /// (full corpus drain). When false or omitted (the safe default),
    /// <paramref name="TopN"/> applies (or a per-lane safe default if TopN
    /// is also null: 200 for parcel/owner/improvement/land, 500 for sales).</param>
    /// <param name="TopN">Override the per-lane safe-default sample size. Only
    /// effective when <paramref name="FullCorpus"/> is false.</param>
    /// <param name="LaneResultId">SYNC-COMPLETE-2-V2: when supplied (typically by
    /// the orchestrator's <c>HttpCorpusLaneRunner</c>), the lane endpoint
    /// writes a per-stage checkpoint to the matching
    /// <c>tf_workbench.full_corpus_lane_result</c> row after each successful
    /// stage so a crash mid-lane can resume from the next stage. Manual
    /// operator curls leave this null and get the same behavior as today.</param>
    /// <param name="ResumeFromStage">SYNC-COMPLETE-2-V2: when supplied, the lane
    /// endpoint skips every stage at-or-before this one in the lane's canonical
    /// stage order (see <see cref="TerraFusion.Core.Sync.Corpus.LaneStageOrder"/>),
    /// loading downstream-needed batch ids from the existing lane row's
    /// persisted <c>BatchIdsJson</c>. Ignored when <see cref="LaneResultId"/>
    /// is null (no row to load from). Unknown stage names → no skip
    /// (full lane rerun, which is safe).</param>
    public sealed record DoctrineDrainRequest(
        string? OperatorName,
        int? WorkingYear,
        bool? FullCorpus,
        int? TopN,
        Guid? LaneResultId = null,
        string? ResumeFromStage = null);
}
