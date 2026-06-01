using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-DOCTRINE-1 (B1): operator-facing read + admin surface for
/// the doctrine layer. Today's scope: ratio-qualification policy.
/// Future: improvement universe, property classification, etc.
///
/// <para>Endpoints:</para>
/// <list type="bullet">
///   <item><c>GET /api/sync/doctrine/policy/ratio</c> —
///   list all rules (filterable by county / study).</item>
///   <item><c>GET /api/sync/doctrine/policy/ratio/evaluate</c> —
///   resolve a (county, study, year, code) tuple. Useful for
///   operator-side spot-checks before B2 promoter consumes this.</item>
///   <item><c>POST /api/sync/doctrine/policy/ratio/seed</c> —
///   re-run the idempotent Benton seed and invalidate the policy
///   service cache. Returns the count of newly-inserted rules.</item>
/// </list>
/// </summary>
[ApiController]
[Route("api/sync/doctrine/policy")]
[Authorize]
public class DoctrinePolicyController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrinePolicyController> _logger;

    public DoctrinePolicyController(
        TerraFusionDbContext db,
        ILogger<DoctrinePolicyController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// List ratio-policy rules. Optional filters by county and study.
    /// </summary>
    [HttpGet("ratio")]
    public async Task<IActionResult> ListRatioRules(
        [FromQuery] string? county,
        [FromQuery] string? study,
        CancellationToken cancellationToken = default)
    {
        var query = _db.TfDoctrineRatioPolicies.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(county))
            query = query.Where(r => r.County == county);
        if (!string.IsNullOrWhiteSpace(study))
            query = query.Where(r => r.StudyName == study);

        var rules = await query
            .OrderBy(r => r.County)
            .ThenBy(r => r.StudyName)
            .ThenBy(r => r.EffectiveStartYear)
            .Select(r => new
            {
                r.RuleId,
                r.County,
                r.StudyName,
                r.EffectiveStartYear,
                r.EffectiveEndYear,
                r.SourceField,
                r.QualifiedCodesCsv,
                r.ExcludedCodesCsv,
                r.SqlFragment,
                r.Reason,
                r.EvidenceSource,
                r.Confidence,
                r.ApprovedBy,
                r.ApprovedAt,
                r.Notes,
            })
            .ToListAsync(cancellationToken);

        return Ok(new { count = rules.Count, rules });
    }

    /// <summary>
    /// Evaluate a single (county, study, year, code) tuple against
    /// the doctrine. Operator spot-check tool.
    /// </summary>
    [HttpGet("ratio/evaluate")]
    public async Task<IActionResult> EvaluateRatio(
        [FromServices] IRatioQualificationPolicy policy,
        [FromQuery] string county,
        [FromQuery] string study,
        [FromQuery] int year,
        [FromQuery] string? code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(county))
            return BadRequest(new { error = "Query parameter 'county' is required." });
        if (string.IsNullOrWhiteSpace(study))
            return BadRequest(new { error = "Query parameter 'study' is required." });

        var result = await policy.EvaluateAsync(
            county, study, year, code, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Re-run the idempotent Benton seed (existing rules with the
    /// same RuleId are no-ops; new rules are inserted). Invalidates
    /// the policy-service in-memory cache so the next evaluate call
    /// reloads from the DB.
    /// </summary>
    [HttpPost("ratio/seed")]
    public async Task<IActionResult> SeedRatio(
        [FromServices] DoctrineRatioPolicySeeder seeder,
        [FromServices] IRatioQualificationPolicy policy,
        CancellationToken cancellationToken = default)
    {
        var added = await seeder.SeedAsync(cancellationToken);

        // Invalidate cache. Cast through interface — only the default
        // impl exposes InvalidateCache; this is best-effort.
        if (policy is RatioQualificationPolicy rqp)
            rqp.InvalidateCache();

        return Ok(new
        {
            inserted = added,
            note = added == 0
                ? "All seed rules already present; cache invalidated."
                : $"Inserted {added} new rule(s); cache invalidated.",
        });
    }

    // ────────────────────────────────────────────────────────────────
    // SYNC-DOCTRINE-4: property-universe doctrine endpoints.
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// List property-universe rules. Optional filters by county and
    /// universe code. Mirrors the ratio endpoint shape.
    /// </summary>
    [HttpGet("universe")]
    public async Task<IActionResult> ListUniverseRules(
        [FromQuery] string? county,
        [FromQuery] string? universe,
        CancellationToken cancellationToken = default)
    {
        var query = _db.TfDoctrinePropertyUniverses.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(county))
            query = query.Where(r => r.County == county);
        if (!string.IsNullOrWhiteSpace(universe))
            query = query.Where(r => r.UniverseCode == universe);

        var rules = await query
            .OrderBy(r => r.County)
            .ThenBy(r => r.Precedence)
            .Select(r => new
            {
                r.RuleId,
                r.County,
                r.EffectiveStartYear,
                r.EffectiveEndYear,
                r.Precedence,
                r.UniverseCode,
                r.PropTypeCdCsv,
                r.PropertyUseCdCsv,
                r.PropertyUseMode,
                r.AgApplyValue,
                r.AgUseCdCsv,
                r.RequiresLegacyMarker,
                r.LegacyMarkerType,
                r.LegacyMarkerValue,
                r.Reason,
                r.EvidenceSource,
                r.Confidence,
                r.ActiveFlag,
                r.ApprovedBy,
                r.ApprovedAt,
                r.Notes,
            })
            .ToListAsync(cancellationToken);

        return Ok(new { count = rules.Count, rules });
    }

    /// <summary>
    /// Spot-check the universe classifier. Pass the same property-
    /// level signals the truth promoter would consult and observe
    /// which rule fires.
    /// </summary>
    [HttpGet("universe/classify")]
    public async Task<IActionResult> ClassifyUniverse(
        [FromServices] IPropertyUniverseClassifier classifier,
        [FromQuery] string county,
        [FromQuery] int year,
        [FromQuery(Name = "prop_type_cd")] string? propTypeCd,
        [FromQuery(Name = "property_use_cd")] string? propertyUseCd,
        [FromQuery(Name = "ag_apply")] string? agApply,
        [FromQuery(Name = "ag_use_cd")] string? agUseCd,
        [FromQuery(Name = "has_legacy_marker")] bool hasLegacyMarker = false,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(county))
            return BadRequest(new { error = "Query parameter 'county' is required." });
        if (year <= 0)
            return BadRequest(new { error = "Query parameter 'year' must be positive." });

        var input = new UniverseClassifierInput(
            county, year, propTypeCd, propertyUseCd, agApply, agUseCd, hasLegacyMarker);
        var result = await classifier.ClassifyAsync(input, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// List per-universe attribute-dictionary entries. Optional
    /// filters by county and universe.
    /// </summary>
    [HttpGet("universe/attribute-dictionary")]
    public async Task<IActionResult> ListAttributeDictionary(
        [FromQuery] string? county,
        [FromQuery] string? universe,
        CancellationToken cancellationToken = default)
    {
        var query = _db.TfDoctrineAttributeDictionaries.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(county))
            query = query.Where(e => e.County == county);
        if (!string.IsNullOrWhiteSpace(universe))
            query = query.Where(e => e.UniverseCode == universe);

        var entries = await query
            .OrderBy(e => e.County)
            .ThenBy(e => e.UniverseCode)
            .ThenBy(e => e.ImprvAttrId)
            .ThenBy(e => e.IAttrValCd)
            .Select(e => new
            {
                e.DictionaryRowId,
                e.County,
                e.UniverseCode,
                e.EffectiveStartYear,
                e.EffectiveEndYear,
                e.ImprvAttrId,
                e.IAttrValCd,
                e.AttributeDescription,
                e.AttributeGroup,
                e.SourceTable,
                e.SourceKey,
                e.Reason,
                e.EvidenceSource,
                e.Confidence,
                e.ActiveFlag,
                e.ApprovedBy,
                e.ApprovedAt,
            })
            .ToListAsync(cancellationToken);

        return Ok(new { count = entries.Count, entries });
    }

    /// <summary>
    /// Re-run the idempotent universe + attribute-dictionary seeders.
    /// Invalidates the classifier and per-universe dictionary caches.
    /// </summary>
    [HttpPost("universe/seed")]
    public async Task<IActionResult> SeedUniverse(
        [FromServices] DoctrinePropertyUniverseSeeder universeSeeder,
        [FromServices] DoctrineAttributeDictionarySeeder dictSeeder,
        [FromServices] IPropertyUniverseClassifier classifier,
        [FromServices] IPerUniverseAttributeDictionary dictionary,
        CancellationToken cancellationToken = default)
    {
        var universeAdded = await universeSeeder.SeedAsync(cancellationToken);
        var dictAdded = await dictSeeder.SeedAsync(cancellationToken);

        if (classifier is PropertyUniverseClassifier puc) puc.InvalidateCache();
        if (dictionary is PerUniverseAttributeDictionary pad) pad.InvalidateCache();

        return Ok(new
        {
            universeRulesInserted = universeAdded,
            attributeDictionaryEntriesInserted = dictAdded,
            note = "Caches invalidated; classifier reads next call rebuild from DB.",
        });
    }

    /// <summary>
    /// SYNC-DOCTRINE-4-IMPL-V5: backfill universe classification onto
    /// existing <c>truth_pacs.imprv_current</c> rows that were
    /// promoted before the current rule set fired correctly. Use
    /// dryRun=true first to inspect transition counts before
    /// committing.
    /// </summary>
    [HttpPost("universe/backfill")]
    public async Task<IActionResult> BackfillUniverse(
        [FromServices] IPacsImprvUniverseBackfillService svc,
        [FromBody] BackfillRequestDto? body,
        CancellationToken cancellationToken = default)
    {
        var county = string.IsNullOrWhiteSpace(body?.County) ? "benton-wa" : body!.County!;
        var dryRun = body?.DryRun ?? false;
        var maxRows = body?.MaxRows;
        var onlyNullUniverse = body?.OnlyNullUniverse ?? false;

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(county, dryRun, maxRows, onlyNullUniverse),
            cancellationToken);
        return Ok(result);
    }

    public sealed record BackfillRequestDto(
        string? County,
        bool? DryRun,
        int? MaxRows,
        bool? OnlyNullUniverse);

    /// <summary>
    /// SYNC-DOCTRINE-4-IMPL-V6: forward backfilled universe values
    /// from <c>truth_pacs.imprv_current</c> onto matching
    /// <c>canonical_tf.tf_improvement</c> rows. Use after
    /// <c>POST .../universe/backfill</c> brings truth current.
    /// </summary>
    [HttpPost("universe/backfill-canonical")]
    public async Task<IActionResult> BackfillCanonicalUniverse(
        [FromServices] IPacsImprvUniverseBackfillService svc,
        [FromBody] CanonicalBackfillRequestDto? body,
        CancellationToken cancellationToken = default)
    {
        var dryRun = body?.DryRun ?? false;
        var maxRows = body?.MaxRows;

        var result = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(dryRun, maxRows),
            cancellationToken);
        return Ok(result);
    }

    public sealed record CanonicalBackfillRequestDto(
        bool? DryRun,
        int? MaxRows);

    /// <summary>
    /// SYNC-DOCTRINE-4-IMPL-V7: read-only profile of the canonical-
    /// layer imprv_attr quarantine cohort. Returns a
    /// (UniverseCode, ImprvAttrId, IAttrValCd) histogram so the
    /// operator can decide which codes are real (add to
    /// attribute_definition) vs noise. Does NOT auto-seed any
    /// dictionary — pure evidence production.
    /// </summary>
    [HttpGet("quarantine/imprv-attr/profile")]
    public async Task<IActionResult> ProfileImprvAttrQuarantine(
        [FromServices] IImprvAttrQuarantineProfiler profiler,
        [FromQuery(Name = "universe")] string? universeFilter = null,
        [FromQuery(Name = "reason")] string? reasonFilter = null,
        [FromQuery(Name = "max_cells")] int? maxCells = null,
        CancellationToken cancellationToken = default)
    {
        var result = await profiler.ProfileAsync(
            new ImprvAttrQuarantineProfileRequest(universeFilter, reasonFilter, maxCells),
            cancellationToken);
        return Ok(result);
    }

    // ────────────────────────────────────────────────────────────────
    // SYNC-DOCTRINE-5: sales qualification codes doctrine endpoints.
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// List sales-qualification doctrine rules. Optional filters by
    /// surface and source field. Mirrors the ratio/universe endpoint
    /// shapes.
    /// </summary>
    [HttpGet("sales-qualification")]
    public async Task<IActionResult> ListSalesQualificationRules(
        [FromQuery] string? surface,
        [FromQuery(Name = "source_field")] string? sourceField,
        CancellationToken cancellationToken = default)
    {
        var query = _db.TfDoctrineSalesQualificationCodes.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(surface))
            query = query.Where(r => r.SurfaceCode == surface);
        if (!string.IsNullOrWhiteSpace(sourceField))
            query = query.Where(r => r.SourceField == sourceField);

        var rules = await query
            .OrderBy(r => r.SurfaceCode)
            .ThenBy(r => r.EffectiveStartYear)
            .Select(r => new
            {
                r.RuleId,
                r.SurfaceCode,
                r.SourceField,
                r.EffectiveStartYear,
                r.EffectiveEndYear,
                r.QualifiedCodesJson,
                r.EvidenceSource,
                r.Confidence,
                r.ActiveFlag,
            })
            .ToListAsync(cancellationToken);

        return Ok(new { count = rules.Count, rules });
    }

    /// <summary>
    /// SYNC-DOCTRINE-5: audit report comparing the doctrine rows
    /// against the PacsSaleTruthPromoter snapshot. Read-only.
    /// </summary>
    [HttpGet("sales-qualification/audit")]
    public async Task<IActionResult> AuditSalesQualification(
        [FromServices] IDoctrineSalesAuditService audit,
        CancellationToken cancellationToken = default)
    {
        var report = await audit.AuditAsync(cancellationToken);
        return Ok(report);
    }

    /// <summary>
    /// SYNC-DOCTRINE-5: re-run the idempotent sales-qualification
    /// seeder. Existing rows with matching deterministic RuleIds are
    /// no-ops; new rows are inserted. Deactivated rules are NOT
    /// reactivated (soft-disable is sticky).
    /// </summary>
    [HttpPost("sales-qualification/seed")]
    public async Task<IActionResult> SeedSalesQualification(
        [FromServices] SalesQualificationCodesSeeder seeder,
        CancellationToken cancellationToken = default)
    {
        var added = await seeder.SeedAsync(cancellationToken);
        return Ok(new
        {
            inserted = added,
            note = added == 0
                ? "All seed rules already present."
                : $"Inserted {added} new rule(s).",
        });
    }
}
