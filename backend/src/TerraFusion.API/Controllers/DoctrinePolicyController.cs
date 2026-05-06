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
[AllowAnonymous]
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
}
