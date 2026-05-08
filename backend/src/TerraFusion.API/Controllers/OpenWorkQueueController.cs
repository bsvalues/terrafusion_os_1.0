using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Sync.OpenWork;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice F1: read-only endpoint for the open-work / pending-appraisal
/// queue.
///
/// <para><c>GET /api/parcels/open-work?year={int}&amp;maxResults={int}</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>400 on missing / non-positive <c>year</c> or out-of-range <c>maxResults</c>.</item>
///   <item>403 when the caller has no <c>countyId</c> claim — sovereign isolation requires it.</item>
///   <item>200 with <see cref="OpenWorkResponse"/>; <c>Items</c> is empty if nothing is pending.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no writes, no audit-table mutations,
/// no PII. Result count is bounded by <c>maxResults</c> (default 100,
/// max 1000); the response's <c>Truncated</c> flag tells the caller
/// whether the backlog is larger than what was returned.</para>
///
/// <para>Mirrors <c>ParcelGeometryController</c>'s county-claim
/// resolution: only the Guid form of <c>countyId</c> is trusted; no
/// county-name fallback.</para>
/// </summary>
[ApiController]
[Route("api/parcels")]
public sealed class OpenWorkQueueController : ControllerBase
{
    /// <summary>Default page size when the caller omits maxResults.</summary>
    public const int DefaultMaxResults = 100;

    /// <summary>Hard upper bound. Larger requests are 400.</summary>
    public const int HardMaxResults = 1000;

    private readonly IOpenWorkReader _reader;
    private readonly ILogger<OpenWorkQueueController> _logger;

    public OpenWorkQueueController(
        IOpenWorkReader reader,
        ILogger<OpenWorkQueueController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    [HttpGet("open-work")]
    [Authorize]
    public async Task<IActionResult> GetOpenWork(
        [FromQuery] short year,
        [FromQuery] int? maxResults = null,
        CancellationToken ct = default)
    {
        if (year <= 0)
        {
            return BadRequest(new
            {
                error = "year must be a positive assessment year.",
                hint = "Pass the calendar year, e.g. 2026.",
                year,
            });
        }

        var effectiveMax = maxResults ?? DefaultMaxResults;
        if (effectiveMax <= 0 || effectiveMax > HardMaxResults)
        {
            return BadRequest(new
            {
                error = $"maxResults must be in (0, {HardMaxResults}].",
                maxResults = effectiveMax,
            });
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            // Authenticated but no county claim → cannot enforce
            // sovereign-county isolation. Treat as Forbid; do not
            // leak existence.
            _logger.LogWarning(
                "[OpenWork] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var result = await _reader
            .GetOpenWorkAsync(principalCountyId.Value, year, effectiveMax, ct)
            .ConfigureAwait(false);

        var body = new OpenWorkResponse
        {
            CountyId = principalCountyId.Value,
            AssessmentYear = year,
            Count = result.Items.Count,
            Truncated = result.Truncated,
            Items = result.Items,
        };

        if (result.Truncated)
        {
            _logger.LogInformation(
                "[OpenWork] county={CountyId} year={Year} returned {Count} (truncated; backlog larger than maxResults={Max}).",
                principalCountyId, year, body.Count, effectiveMax);
        }

        return Ok(body);
    }

    /// <summary>
    /// Mirrors <c>ParcelGeometryController.ResolveCountyClaim</c> —
    /// same contract, narrow trust surface (Guid claim only, no
    /// county-name fallback).
    /// </summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
