using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        var batchIds = new List<Guid>();
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Owner-anchored seed (real-property prop_ids).
            _logger.LogInformation("[Drain:parcel] Owner seed (TopN={Top}, FullCorpus={Full})", seedTopN, fullCorpus);
            var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN);
            var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
            batchIds.Add(ownerSeedS1.LoadBatchId);
            if (!IsCompleted(ownerSeedS1.Status))
                return await FailLaneAsync(LaneName, "Owner-Seed-S1", ownerSeedS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedS1.LoadBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Keyed parcel S1.
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, seedPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            batchIds.Add(parcelS1.LoadBatchId);
            if (!IsCompleted(parcelS1.Status))
                return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Parcel spine truth.
            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(parcelSpine.PromotionLoadBatchId);
            if (!IsCompleted(parcelSpine.Status))
                return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Parcel canonical → tf_parcel.
            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            batchIds.Add(parcelCanon.PromotionLoadBatchId);
            if (!IsCompleted(parcelCanon.Status))
                return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: parcelS1.RowsLanded,
                rowsPromotedToTruth: parcelSpine.ParcelsPromoted,
                rowsCanonicalized: parcelCanon.ParcelsProjected,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:parcel] FAILED");
            return await FailLaneAsync(LaneName, "Exception", $"{ex.GetType().Name}: {ex.Message}",
                batchIds, startedAt, quarantineBefore, cancellationToken);
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
        var batchIds = new List<Guid>();
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var ownerTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Owner S1 seed.
            _logger.LogInformation("[Drain:owner-wsdor] Owner S1 (TopN={Top}, FullCorpus={Full})", ownerTopN, fullCorpus);
            var ownerSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: ownerTopN);
            var ownerS1 = await ownerSvc.LandOwnersAsync(ownerSrc, operatorName, cancellationToken);
            batchIds.Add(ownerS1.LoadBatchId);
            if (!IsCompleted(ownerS1.Status))
                return await FailLaneAsync(LaneName, "Owner-S1", ownerS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var ownerRows = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerS1.LoadBatchId)
                .Select(o => new { o.OwnerId, o.PropId, o.OwnerTaxYr })
                .ToListAsync(cancellationToken);
            var distinctAcctIds = ownerRows.Select(r => r.OwnerId).Distinct().ToList();
            var distinctSuppKeys = ownerRows.Select(r => (r.PropId, r.OwnerTaxYr)).Distinct().ToList();
            var distinctParcelPropIds = ownerRows.Select(r => r.PropId).Distinct().ToList();

            // Account + supp + parcel chain (xrefs).
            var acctSrc = new KeyedSqlServerPacsAccountSource(pacsCs!, distinctAcctIds);
            var acctS1 = await accountSvc.LandAccountsAsync(acctSrc, operatorName, cancellationToken);
            batchIds.Add(acctS1.LoadBatchId);
            if (!IsCompleted(acctS1.Status))
                return await FailLaneAsync(LaneName, "Account-S1", acctS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, distinctSuppKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            batchIds.Add(suppS1.LoadBatchId);
            if (!IsCompleted(suppS1.Status))
                return await FailLaneAsync(LaneName, "Supp-S1", suppS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, distinctParcelPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            batchIds.Add(parcelS1.LoadBatchId);
            if (!IsCompleted(parcelS1.Status))
                return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(parcelSpine.PromotionLoadBatchId);
            if (!IsCompleted(parcelSpine.Status))
                return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            batchIds.Add(parcelCanon.PromotionLoadBatchId);
            if (!IsCompleted(parcelCanon.Status))
                return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Owner truth + canonical.
            var ownerTruth = await ownerTruthPromoter.PromoteAsync(
                ownerS1.LoadBatchId, acctS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(ownerTruth.PromotionLoadBatchId);
            if (!IsCompleted(ownerTruth.Status))
                return await FailLaneAsync(LaneName, "Owner-Truth", ownerTruth.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var ownerCanon = await ownerCanonicalProjector.ProjectAsync(
                ownerTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            batchIds.Add(ownerCanon.PromotionLoadBatchId);
            if (!IsCompleted(ownerCanon.Status))
                return await FailLaneAsync(LaneName, "Owner-Canonical", ownerCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // WPOV → WSDOR.
            var wpovKeys = await _db.TruthPacsOwnerCurrents
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == ownerTruth.PromotionLoadBatchId)
                .Select(t => new { t.PropId, t.OwnerTaxYr, t.OwnerId })
                .Distinct()
                .ToListAsync(cancellationToken);
            var wpovTriples = wpovKeys.Select(k => (k.PropId, k.OwnerTaxYr, k.OwnerId)).ToList();

            var wpovSrc = new KeyedSqlServerPacsWashPropOwnerValSource(pacsCs!, wpovTriples);
            var wpovS1 = await wpovSvc.LandWashPropOwnerValsAsync(wpovSrc, operatorName, cancellationToken);
            batchIds.Add(wpovS1.LoadBatchId);
            if (!IsCompleted(wpovS1.Status))
                return await FailLaneAsync(LaneName, "WPOV-S1", wpovS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var wpovTruth = await wpovTruthPromoter.PromoteAsync(
                wpovS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(wpovTruth.PromotionLoadBatchId);
            if (!IsCompleted(wpovTruth.Status))
                return await FailLaneAsync(LaneName, "WPOV-Truth", wpovTruth.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var wsdorCanon = await wsdorCanonicalProjector.ProjectAsync(
                wpovTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            batchIds.Add(wsdorCanon.PromotionLoadBatchId);
            if (!IsCompleted(wsdorCanon.Status))
                return await FailLaneAsync(LaneName, "WSDOR-Canonical", wsdorCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // RowsLanded counts the lane's primary landing (owner). RowsPromotedToTruth
            // sums the two truth promotions (owner + WPOV). RowsCanonicalized sums
            // tf_owner + tf_parcel_owner_link + tf_assessment_wsdor projections.
            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: ownerS1.RowsLanded + wpovS1.RowsLanded,
                rowsPromotedToTruth: ownerTruth.OwnersPromoted + wpovTruth.RowsPromoted,
                rowsCanonicalized: ownerCanon.OwnersProjected + ownerCanon.LinksProjected + wsdorCanon.RowsProjected,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:owner-wsdor] FAILED");
            return await FailLaneAsync(LaneName, "Exception", $"{ex.GetType().Name}: {ex.Message}",
                batchIds, startedAt, quarantineBefore, cancellationToken);
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
        var batchIds = new List<Guid>();
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Owner-anchored seed.
            _logger.LogInformation("[Drain:improvement] Owner seed (TopN={Top}, FullCorpus={Full})", seedTopN, fullCorpus);
            var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN);
            var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
            batchIds.Add(ownerSeedS1.LoadBatchId);
            if (!IsCompleted(ownerSeedS1.Status))
                return await FailLaneAsync(LaneName, "Owner-Seed-S1", ownerSeedS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedS1.LoadBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Parcel chain (xrefs).
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, seedPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            batchIds.Add(parcelS1.LoadBatchId);
            if (!IsCompleted(parcelS1.Status))
                return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(parcelSpine.PromotionLoadBatchId);
            if (!IsCompleted(parcelSpine.Status))
                return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            batchIds.Add(parcelCanon.PromotionLoadBatchId);
            if (!IsCompleted(parcelCanon.Status))
                return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Build imprv keys from spine.
            var spinePropIds = await _db.TruthPacsParcelSpines
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == parcelSpine.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .ToListAsync(cancellationToken);
            var imprvKeys = spinePropIds.Select(p => (p, workingYear)).ToList();

            // Supp S1 (truth needs it).
            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, imprvKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            batchIds.Add(suppS1.LoadBatchId);
            if (!IsCompleted(suppS1.Status))
                return await FailLaneAsync(LaneName, "Supp-S1", suppS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // SYNC-DOCTRINE-4-IMPL-V4: PropertyVal S1 (universe classifier
            // reads property_use_cd from these rows). Non-blocking on
            // failure — the truth promoter falls through to NULL
            // property_use_cd which the V2 classifier handles by
            // routing prop_type_cd='R' rows to REAL_RESIDENTIAL.
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

            // SYNC-DOCTRINE-4-IMPL-V4: LandDetail S1 (universe classifier
            // reads ag_apply / ag_use_cd from these rows). Same
            // non-blocking semantics as PropertyVal-S1.
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

            // Imprv S1.
            var imprvSrc = new KeyedSqlServerPacsImprvSource(pacsCs!, imprvKeys);
            var imprvS1 = await imprvSvc.LandImprvsAsync(imprvSrc, operatorName, cancellationToken);
            batchIds.Add(imprvS1.LoadBatchId);
            if (!IsCompleted(imprvS1.Status))
                return await FailLaneAsync(LaneName, "Imprv-S1", imprvS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // ImprvDetail S1.
            var detailSrc = new KeyedSqlServerPacsImprvDetailSource(pacsCs!, imprvKeys);
            var detailS1 = await imprvDetailSvc.LandImprvDetailsAsync(detailSrc, operatorName, cancellationToken);
            batchIds.Add(detailS1.LoadBatchId);
            if (!IsCompleted(detailS1.Status))
                return await FailLaneAsync(LaneName, "ImprvDetail-S1", detailS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // ImprvAttr S1.
            var attrSrc = new KeyedSqlServerPacsImprvAttrSource(pacsCs!, imprvKeys);
            var attrS1 = await imprvAttrSvc.LandImprvAttrsAsync(attrSrc, operatorName, cancellationToken);
            batchIds.Add(attrS1.LoadBatchId);
            if (!IsCompleted(attrS1.Status))
                return await FailLaneAsync(LaneName, "ImprvAttr-S1", attrS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Imprv truth.
            var imprvTruth = await imprvTruthPromoter.PromoteAsync(
                imprvS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(imprvTruth.PromotionLoadBatchId);
            if (!IsCompleted(imprvTruth.Status))
                return await FailLaneAsync(LaneName, "Imprv-Truth", imprvTruth.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Imprv canonical.
            var imprvCanon = await imprvCanonicalProjector.ProjectAsync(
                imprvTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            batchIds.Add(imprvCanon.PromotionLoadBatchId);
            if (!IsCompleted(imprvCanon.Status))
                return await FailLaneAsync(LaneName, "Imprv-Canonical", imprvCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: imprvS1.RowsLanded + detailS1.RowsLanded + attrS1.RowsLanded,
                rowsPromotedToTruth: imprvTruth.ImprvsPromoted,
                rowsCanonicalized: imprvCanon.ImprovementsProjected + imprvCanon.FeaturesProjected,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:improvement] FAILED");
            return await FailLaneAsync(LaneName, "Exception", $"{ex.GetType().Name}: {ex.Message}",
                batchIds, startedAt, quarantineBefore, cancellationToken);
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
        var batchIds = new List<Guid>();
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var seedTopN = fullCorpus ? (int?)null : (topN ?? 200);

            // Owner-anchored seed.
            _logger.LogInformation("[Drain:land] Owner seed (TopN={Top}, FullCorpus={Full})", seedTopN, fullCorpus);
            var ownerSeedSrc = new SqlServerPacsOwnerSource(pacsCs!, topN: seedTopN);
            var ownerSeedS1 = await ownerSvc.LandOwnersAsync(ownerSeedSrc, operatorName, cancellationToken);
            batchIds.Add(ownerSeedS1.LoadBatchId);
            if (!IsCompleted(ownerSeedS1.Status))
                return await FailLaneAsync(LaneName, "Owner-Seed-S1", ownerSeedS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var seedPropIds = await _db.LegacyPacsRawOwners
                .AsNoTracking()
                .Where(o => o.LoadBatchId == ownerSeedS1.LoadBatchId)
                .Select(o => o.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Parcel chain.
            var parcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, seedPropIds);
            var parcelS1 = await propSvc.LandPropertiesAsync(parcelSrc, operatorName, cancellationToken);
            batchIds.Add(parcelS1.LoadBatchId);
            if (!IsCompleted(parcelS1.Status))
                return await FailLaneAsync(LaneName, "Parcel-S1", parcelS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelSpine = await spinePromoter.PromoteAsync(parcelS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(parcelSpine.PromotionLoadBatchId);
            if (!IsCompleted(parcelSpine.Status))
                return await FailLaneAsync(LaneName, "Parcel-Spine", parcelSpine.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            var parcelCanon = await parcelCanonical.ProjectAsync(
                parcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
            batchIds.Add(parcelCanon.PromotionLoadBatchId);
            if (!IsCompleted(parcelCanon.Status))
                return await FailLaneAsync(LaneName, "Parcel-Canonical", parcelCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Land keys.
            var spinePropIds = await _db.TruthPacsParcelSpines
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == parcelSpine.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .ToListAsync(cancellationToken);
            var landKeys = spinePropIds.Select(p => (p, workingYear)).ToList();

            // Supp S1.
            var suppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, landKeys);
            var suppS1 = await assocSvc.LandPropSuppAssocsAsync(suppSrc, operatorName, cancellationToken);
            batchIds.Add(suppS1.LoadBatchId);
            if (!IsCompleted(suppS1.Status))
                return await FailLaneAsync(LaneName, "Supp-S1", suppS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Land S1.
            var landSrc = new KeyedSqlServerPacsLandDetailSource(pacsCs!, landKeys);
            var landS1 = await landSvc.LandLandDetailsAsync(landSrc, operatorName, cancellationToken);
            batchIds.Add(landS1.LoadBatchId);
            if (!IsCompleted(landS1.Status))
                return await FailLaneAsync(LaneName, "Land-S1", landS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Land truth.
            var landTruth = await landTruthPromoter.PromoteAsync(
                landS1.LoadBatchId, suppS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(landTruth.PromotionLoadBatchId);
            if (!IsCompleted(landTruth.Status))
                return await FailLaneAsync(LaneName, "Land-Truth", landTruth.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Land canonical.
            var landCanon = await landCanonicalProjector.ProjectAsync(
                landTruth.PromotionLoadBatchId, operatorName, cancellationToken);
            batchIds.Add(landCanon.PromotionLoadBatchId);
            if (!IsCompleted(landCanon.Status))
                return await FailLaneAsync(LaneName, "Land-Canonical", landCanon.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: landS1.RowsLanded,
                rowsPromotedToTruth: landTruth.LandSegsPromoted,
                rowsCanonicalized: landCanon.LandsProjected,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:land] FAILED");
            return await FailLaneAsync(LaneName, "Exception", $"{ex.GetType().Name}: {ex.Message}",
                batchIds, startedAt, quarantineBefore, cancellationToken);
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
        var batchIds = new List<Guid>();
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);
            var saleTopN = fullCorpus ? (int?)null : (topN ?? 500);

            // Sale S1 (independent seed; sales correlate weakly with the
            // parcel-anchored owner set, so we don't seed off owners).
            _logger.LogInformation("[Drain:sales] Sale S1 (TopN={Top}, FullCorpus={Full})", saleTopN, fullCorpus);
            var saleSrc = new SqlServerPacsSaleSource(pacsCs!, topN: saleTopN);
            var saleS1 = await saleSvc.LandSalesAsync(saleSrc, operatorName, cancellationToken);
            batchIds.Add(saleS1.LoadBatchId);
            if (!IsCompleted(saleS1.Status))
                return await FailLaneAsync(LaneName, "Sale-S1", saleS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Keyed supp S1 from the sale batch's (prop_id, prop_val_yr).
            var saleSuppRaw = await _db.LegacyPacsRawSales
                .AsNoTracking()
                .Where(s => s.LoadBatchId == saleS1.LoadBatchId)
                .Select(s => new { s.PropId, s.PropValYr })
                .Distinct()
                .ToListAsync(cancellationToken);
            var saleSuppKeys = saleSuppRaw.Select(k => (k.PropId, k.PropValYr)).ToList();
            var saleSuppSrc = new KeyedSqlServerPacsPropSuppAssocSource(pacsCs!, saleSuppKeys);
            var saleSuppS1 = await assocSvc.LandPropSuppAssocsAsync(saleSuppSrc, operatorName, cancellationToken);
            batchIds.Add(saleSuppS1.LoadBatchId);
            if (!IsCompleted(saleSuppS1.Status))
                return await FailLaneAsync(LaneName, "Sale-Supp-S1", saleSuppS1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Sale truth.
            var saleTruth = await saleTruthPromoter.PromoteAsync(
                saleS1.LoadBatchId, saleSuppS1.LoadBatchId, operatorName, cancellationToken);
            batchIds.Add(saleTruth.PromotionLoadBatchId);
            if (!IsCompleted(saleTruth.Status))
                return await FailLaneAsync(LaneName, "Sale-Truth", saleTruth.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // Targeted parcel chain for the promoted sales' prop_ids
            // (sale canonical needs parcel xrefs).
            var promotedSalePropIds = await _db.TruthPacsSales
                .AsNoTracking()
                .Where(t => t.PromotionLoadBatchId == saleTruth.PromotionLoadBatchId)
                .Select(t => t.PropId)
                .Distinct()
                .ToListAsync(cancellationToken);

            int salesProjected = 0;
            if (promotedSalePropIds.Count > 0)
            {
                var saleParcelSrc = new KeyedSqlServerPacsPropertySource(pacsCs!, promotedSalePropIds);
                var saleParcelS1 = await propSvc.LandPropertiesAsync(saleParcelSrc, operatorName, cancellationToken);
                batchIds.Add(saleParcelS1.LoadBatchId);
                if (!IsCompleted(saleParcelS1.Status))
                    return await FailLaneAsync(LaneName, "Sale-Parcel-S1", saleParcelS1.ErrorSummary,
                        batchIds, startedAt, quarantineBefore, cancellationToken);

                var saleParcelSpine = await spinePromoter.PromoteAsync(saleParcelS1.LoadBatchId, operatorName, cancellationToken);
                batchIds.Add(saleParcelSpine.PromotionLoadBatchId);
                if (!IsCompleted(saleParcelSpine.Status))
                    return await FailLaneAsync(LaneName, "Sale-Parcel-Spine", saleParcelSpine.ErrorSummary,
                        batchIds, startedAt, quarantineBefore, cancellationToken);

                var saleParcelCanon = await parcelCanonical.ProjectAsync(
                    saleParcelSpine.PromotionLoadBatchId, bentonCountyId, operatorName, cancellationToken);
                batchIds.Add(saleParcelCanon.PromotionLoadBatchId);
                if (!IsCompleted(saleParcelCanon.Status))
                    return await FailLaneAsync(LaneName, "Sale-Parcel-Canonical", saleParcelCanon.ErrorSummary,
                        batchIds, startedAt, quarantineBefore, cancellationToken);

                var saleCanon = await saleCanonicalProjector.ProjectAsync(
                    saleTruth.PromotionLoadBatchId, operatorName, cancellationToken);
                batchIds.Add(saleCanon.PromotionLoadBatchId);
                if (!IsCompleted(saleCanon.Status))
                    return await FailLaneAsync(LaneName, "Sale-Canonical", saleCanon.ErrorSummary,
                        batchIds, startedAt, quarantineBefore, cancellationToken);
                salesProjected = saleCanon.SalesProjected;
            }

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: saleS1.RowsLanded,
                rowsPromotedToTruth: saleTruth.SalesPromoted,
                rowsCanonicalized: salesProjected,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:sales] FAILED");
            return await FailLaneAsync(LaneName, "Exception", $"{ex.GetType().Name}: {ex.Message}",
                batchIds, startedAt, quarantineBefore, cancellationToken);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // GEOMETRY drain — ArcGIS REST → tf_parcel_geom canonical.
    // Independent of the parcel-anchored lanes; APN crosswalk resolves
    // against tf_parcel rows present at projection time.
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Drain the geometry lane. ArcGIS REST D1 raw → D2 truth → D3
    /// canonical (tf_parcel_geom + APN crosswalk). FullCorpus/TopN are
    /// not used — the ArcGIS service pulls the full county feature set.
    /// </summary>
    [HttpPost("geometry")]
    public async Task<IActionResult> DrainGeometry(
        [FromServices] IArcGisRawLandingService rawLandingSvc,
        [FromServices] IArcGisTruthPromotionService truthPromotionSvc,
        [FromServices] IArcGisCanonicalProjector canonicalProjector,
        [FromBody] DoctrineDrainRequest? request,
        CancellationToken cancellationToken = default)
    {
        const string LaneName = "geometry";
        var (operatorName, _, _, _) = NormalizeRequest(request, LaneName);
        var startedAt = DateTime.UtcNow;
        var batchIds = new List<Guid>();
        var quarantineBefore = await CountQuarantineAsync(cancellationToken);

        try
        {
            var bentonCountyId = await ResolveOrCreateBentonCountyAsync(cancellationToken);

            // D1 raw landing.
            _logger.LogInformation("[Drain:geometry] D1 ArcGIS landing for county={Cid}", bentonCountyId);
            var d1 = await rawLandingSvc.LandParcelGeomsAsync(bentonCountyId, operatorName, cancellationToken);
            // ArcGisRawLandingResult exposes a LoadBatchId; record it for audit.
            batchIds.Add(d1.LoadBatchId);
            if (!IsCompleted(d1.Status))
                return await FailLaneAsync(LaneName, "ArcGis-D1", d1.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // D2 truth promotion.
            var d2 = await truthPromotionSvc.PromoteCountyAsync(bentonCountyId, operatorName, cancellationToken);
            batchIds.Add(d2.PromotionLoadBatchId);
            if (!IsCompleted(d2.Status))
                return await FailLaneAsync(LaneName, "ArcGis-D2", d2.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            // D3 canonical projection.
            var d3 = await canonicalProjector.ProjectCountyAsync(bentonCountyId, operatorName, cancellationToken);
            batchIds.Add(d3.PromotionLoadBatchId);
            if (!IsCompleted(d3.Status))
                return await FailLaneAsync(LaneName, "ArcGis-D3", d3.ErrorSummary,
                    batchIds, startedAt, quarantineBefore, cancellationToken);

            return await OkLaneAsync(
                LaneName,
                batchIds,
                rowsLanded: d1.FeaturesLanded,
                rowsPromotedToTruth: d2.RowsPromoted,
                rowsCanonicalized: d3.RowsProjected,
                startedAt,
                quarantineBefore,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Drain:geometry] FAILED");
            return await FailLaneAsync(LaneName, "Exception", $"{ex.GetType().Name}: {ex.Message}",
                batchIds, startedAt, quarantineBefore, cancellationToken);
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

    private static (string OperatorName, short WorkingYear, bool FullCorpus, int? TopN)
        NormalizeRequest(DoctrineDrainRequest? request, string laneName)
    {
        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? $"doctrine-drain-{laneName}"
            : request!.OperatorName!.Trim();
        var workingYear = (short)(request?.WorkingYear ?? 2026);
        var fullCorpus = request?.FullCorpus ?? true;
        var topN = request?.TopN;
        return (operatorName, workingYear, fullCorpus, topN);
    }

    /// <summary>
    /// Resolve Benton (WA) county id by FIPS, then by Name+State, then
    /// create. Mirrors CanonicalDebugController's implementation.
    /// </summary>
    private async Task<Guid> ResolveOrCreateBentonCountyAsync(CancellationToken cancellationToken)
    {
        var byFips = await _db.Counties
            .FirstOrDefaultAsync(c => c.FipsCode == "53005", cancellationToken)
            .ConfigureAwait(false);
        if (byFips is not null) return byFips.Id;

        var byName = await _db.Counties
            .FirstOrDefaultAsync(c =>
                EF.Functions.ILike(c.Name, "Benton") &&
                EF.Functions.ILike(c.State, "WA"),
                cancellationToken)
            .ConfigureAwait(false);
        if (byName is not null) return byName.Id;

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
        _logger.LogInformation("[DoctrineDrain] Created Benton county row id={Id}", county.Id);
        return county.Id;
    }

    private static bool IsCompleted(string? status) =>
        string.Equals(status, "COMPLETED", StringComparison.OrdinalIgnoreCase);

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

    private async Task<IActionResult> FailLaneAsync(
        string lane,
        string failedStage,
        string? errorSummary,
        List<Guid> batchIds,
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
        return new ObjectResult(new
        {
            lane,
            status = "Failed",
            failedStage,
            error = errorSummary,
            batchIds,
            counts = new
            {
                rowsLanded = 0,
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
    /// <param name="FullCorpus">When true (the default), the seed source's TopN
    /// is null (full corpus drain). When false, <paramref name="TopN"/> applies
    /// (or a per-lane safe default if TopN is also null).</param>
    /// <param name="TopN">Override the per-lane safe-default sample size. Only
    /// effective when <paramref name="FullCorpus"/> is false.</param>
    public sealed record DoctrineDrainRequest(
        string? OperatorName,
        int? WorkingYear,
        bool? FullCorpus,
        int? TopN);
}
