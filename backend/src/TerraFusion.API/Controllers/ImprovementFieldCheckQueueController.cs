using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.ImprovementFieldCheck;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Block F3: read-only endpoint for the improvement field-check
/// triage queue. Surfaces canonical improvements that need a
/// physical re-verification visit — most usefully the rows where
/// SYNC-DOCTRINE-4 has classified the universe but per-component
/// features are still blank or not yet linked to a canonical
/// dictionary attribute.
///
/// <para><c>GET /api/improvements/field-check-queue</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if the request is unauthenticated (handled by
///   <c>[Authorize]</c>).</item>
///   <item>403 if the caller's <c>countyId</c> claim is missing
///   (cannot enforce sovereign-county isolation).</item>
///   <item>400 if <c>era</c> is non-empty and not in the doctrine
///   set (POST_CONVERSION / PRE_CONVERSION_2017 / UNKNOWN / ALL).</item>
///   <item>400 if <c>universe</c> is non-empty and not in
///   <see cref="UniverseCodes.AllIncludingUnknown"/>.</item>
///   <item>200 with a typed list body when authorized.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit-table
/// mutations, no PII surfaced. Empty queue returns 200 with an
/// empty <c>items</c> list (operator gets a clean "nothing to do
/// right now" view, not a 404).</para>
/// </summary>
[ApiController]
[Route("api/improvements")]
public sealed class ImprovementFieldCheckQueueController : ControllerBase
{
    /// <summary>
    /// G3 doctrine-frozen valid era tokens. Mirrors the same set
    /// declared on <c>SalesRatioStudyController</c>; the doctrine
    /// extraction to a shared helper hasn't landed on this branch
    /// yet, so F3 re-declares the set in the same shape.
    /// </summary>
    private static readonly IReadOnlySet<string> ValidEraValues =
        new HashSet<string>
        {
            ConversionEras.PostConversion,
            ConversionEras.PreConversion2017,
            ConversionEras.Unknown,
            IImprovementFieldCheckReader.EraAll,
        };

    private readonly IImprovementFieldCheckReader _reader;
    private readonly ILogger<ImprovementFieldCheckQueueController> _logger;

    public ImprovementFieldCheckQueueController(
        IImprovementFieldCheckReader reader,
        ILogger<ImprovementFieldCheckQueueController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    /// <summary>
    /// F3: read the field-check queue for the caller's county.
    /// </summary>
    [HttpGet("field-check-queue")]
    [Authorize]
    public async Task<IActionResult> GetFieldCheckQueue(
        [FromQuery] string? universe = null,
        [FromQuery] string? era = null,
        [FromQuery] bool missingFeaturesOnly = false,
        [FromQuery] short? minYearBuilt = null,
        [FromQuery] short? maxYearBuilt = null,
        [FromQuery] int? maxResults = null,
        CancellationToken ct = default)
    {
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning(
                "[ImprovementFieldCheckQueue] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var resolvedUniverse = string.IsNullOrWhiteSpace(universe) ? null : universe.Trim();
        if (resolvedUniverse is not null && !UniverseCodes.IsKnown(resolvedUniverse))
        {
            _logger.LogWarning(
                "[ImprovementFieldCheckQueue] invalid universe token: {Universe}",
                universe);
            return BadRequest(new
            {
                error = "invalid universe",
                validValues = UniverseCodes.AllIncludingUnknown,
            });
        }

        if (!TryNormalizeEra(era, out var resolvedEra, out var eraFail))
            return eraFail!;

        var items = await _reader
            .GetFieldCheckQueueAsync(
                principalCountyId.Value,
                resolvedUniverse,
                resolvedEra,
                missingFeaturesOnly,
                minYearBuilt,
                maxYearBuilt,
                maxResults,
                ct)
            .ConfigureAwait(false);

        return Ok(new
        {
            countyId = principalCountyId.Value,
            universe = resolvedUniverse,
            era = resolvedEra,
            missingFeaturesOnly,
            minYearBuilt,
            maxYearBuilt,
            maxResults = items.Count,
            items,
        });
    }

    /// <summary>
    /// G3 (v1.12): normalizes the <c>era</c> query parameter.
    /// Null/whitespace resolves to <see cref="ConversionEras.PostConversion"/>
    /// (the documented default). Unrecognized values produce 400 with
    /// the valid value list. Returns the resolved string for echo.
    /// </summary>
    private bool TryNormalizeEra(
        string? era,
        out string resolvedEra,
        out IActionResult? failureResult)
    {
        if (string.IsNullOrWhiteSpace(era))
        {
            resolvedEra = ConversionEras.PostConversion;
            failureResult = null;
            return true;
        }

        var trimmed = era.Trim();
        if (!ValidEraValues.Contains(trimmed))
        {
            _logger.LogWarning(
                "[ImprovementFieldCheckQueue] invalid era token: {Era}", trimmed);
            resolvedEra = string.Empty;
            failureResult = BadRequest(new
            {
                error = "invalid era",
                validValues = ValidEraValues,
            });
            return false;
        }

        resolvedEra = trimmed;
        failureResult = null;
        return true;
    }

    /// <summary>
    /// Mirrors <c>SalesRatioStudyController.ResolveCountyClaim</c> —
    /// Guid claim only, no county-name fallback.
    /// </summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
