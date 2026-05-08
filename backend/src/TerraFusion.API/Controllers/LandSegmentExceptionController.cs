using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.LandSegmentException;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice F4: read-only land-segment exception list endpoint
/// per <c>docs/pacs/blocks-d-through-h-design.md</c> §F.4.
///
/// <para><c>GET /api/land/exceptions?era={string?}&amp;maxResults={int?}</c></para>
///
/// <para>Surfaces canonical land segments whose data carries
/// anomalies (missing market value, missing/zero acreage,
/// missing type code, missing state code). Each row bundles all
/// matching anomalies into a comma-joined
/// <c>ExceptionReasons</c> string.</para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if the request is unauthenticated (handled by
///   <c>[Authorize]</c>).</item>
///   <item>403 if the caller's <c>countyId</c> claim is missing —
///   sovereign-county isolation requires a county scope; the
///   endpoint refuses to operate without one rather than leak a
///   global view.</item>
///   <item>400 if <c>era</c> is an unrecognized token.</item>
///   <item>200 with a typed item array when authorized.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit
/// table mutations, no PII surfaced. Empty result sets return
/// 200 with an empty array.</para>
/// </summary>
[ApiController]
[Route("api/land")]
public sealed class LandSegmentExceptionController : ControllerBase
{
    private readonly ILandSegmentExceptionReader _reader;
    private readonly ILogger<LandSegmentExceptionController> _logger;

    public LandSegmentExceptionController(
        ILandSegmentExceptionReader reader,
        ILogger<LandSegmentExceptionController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    /// <summary>
    /// Doctrine-frozen set of valid <c>era</c> tokens. Mirrors
    /// <see cref="SalesRatioStudyController"/> v1.12.
    /// </summary>
    private static readonly IReadOnlySet<string> ValidEraValues =
        new HashSet<string>
        {
            ConversionEras.PostConversion,
            ConversionEras.PreConversion2017,
            ConversionEras.Unknown,
            ILandSegmentExceptionReader.EraAll,
        };

    [HttpGet("exceptions")]
    [Authorize]
    public async Task<IActionResult> GetExceptions(
        [FromQuery] string? era = null,
        [FromQuery] int? maxResults = null,
        CancellationToken ct = default)
    {
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning(
                "[LandSegmentException] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        if (!TryNormalizeEra(era, out var resolvedEra, out var eraFail))
            return eraFail!;

        var resolvedMax = ClampMaxResults(maxResults);
        var items = await _reader
            .GetExceptionsAsync(principalCountyId.Value, resolvedEra, resolvedMax, ct)
            .ConfigureAwait(false);

        return Ok(new
        {
            countyId = principalCountyId.Value,
            era = resolvedEra,
            maxResults = resolvedMax,
            count = items.Count,
            items,
        });
    }

    /// <summary>
    /// Clamps caller-supplied <c>maxResults</c> to the
    /// reader's <c>[1, AbsoluteMaxResults]</c> range. Null
    /// resolves to the reader's default.
    /// </summary>
    private static int ClampMaxResults(int? maxResults)
    {
        if (maxResults is null)
        {
            return ILandSegmentExceptionReader.DefaultMaxResults;
        }
        var v = maxResults.Value;
        if (v <= 0) return ILandSegmentExceptionReader.DefaultMaxResults;
        if (v > ILandSegmentExceptionReader.AbsoluteMaxResults)
        {
            return ILandSegmentExceptionReader.AbsoluteMaxResults;
        }
        return v;
    }

    /// <summary>
    /// Mirrors
    /// <see cref="SalesRatioStudyController"/>'s era normalizer —
    /// null/whitespace resolves to
    /// <see cref="ConversionEras.PostConversion"/>; unknown
    /// values produce 400 with the valid-values list.
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
                "[LandSegmentException] invalid era token: {Era}", trimmed);
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
    /// Mirrors <c>SalesRatioStudyController.ResolveCountyClaim</c>.
    /// Narrow trust surface: Guid claim only, no county-name
    /// fallback.
    /// </summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
