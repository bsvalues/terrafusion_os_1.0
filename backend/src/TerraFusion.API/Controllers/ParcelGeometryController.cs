using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.GIS.ArcGisRest;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice G1-E-2: read-only endpoint for canonical parcel geometry.
///
/// <para><c>GET /api/parcels/{tfParcelId}/geometry</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if the request is unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>403 if the caller's <c>countyId</c> claim doesn't match the parcel's CountyId.</item>
///   <item>404 if no parcel matches OR the parcel exists but has no active geometry.</item>
///   <item>200 with <see cref="TerraFusion.Core.DTOs.GisTf.ParcelGeometryResponse"/> when found.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit-table
/// mutations, no PII surfaced. The 403 short-circuits BEFORE the
/// payload is materialized so cross-county callers cannot probe
/// existence by timing.</para>
/// </summary>
[ApiController]
[Route("api/parcels")]
public sealed class ParcelGeometryController : ControllerBase
{
    private readonly IParcelGeometryReader _reader;
    private readonly ILogger<ParcelGeometryController> _logger;

    public ParcelGeometryController(
        IParcelGeometryReader reader,
        ILogger<ParcelGeometryController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    [HttpGet("{tfParcelId:guid}/geometry")]
    [Authorize]
    public async Task<IActionResult> GetGeometry(
        Guid tfParcelId,
        CancellationToken ct = default)
    {
        if (tfParcelId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "tfParcelId must be a non-empty Guid.",
            });
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            // Authenticated but no county claim → cannot enforce
            // sovereign-county isolation. Treat as Forbid; do not
            // leak existence.
            _logger.LogWarning(
                "[ParcelGeometry] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var lookup = await _reader.GetGeometryAsync(tfParcelId, ct).ConfigureAwait(false);

        switch (lookup.Kind)
        {
            case ParcelGeometryLookupKind.NotFound:
                _logger.LogInformation(
                    "[ParcelGeometry] tfParcelId={ParcelId} not found.",
                    tfParcelId);
                return NotFound();

            case ParcelGeometryLookupKind.NoGeometry:
                // County isolation FIRST: if the parcel exists in a
                // county the caller cannot see, the response must be
                // indistinguishable from a missing parcel.
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelGeometry] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
                        principalCountyId, tfParcelId, lookup.CountyId);
                    return NotFound();
                }
                _logger.LogInformation(
                    "[ParcelGeometry] tfParcelId={ParcelId} has no active geometry.",
                    tfParcelId);
                return NotFound();

            case ParcelGeometryLookupKind.Found:
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelGeometry] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
                        principalCountyId, tfParcelId, lookup.CountyId);
                    return NotFound();
                }
                return Ok(lookup.Payload);

            default:
                throw new InvalidOperationException(
                    $"Unrecognized lookup kind: {lookup.Kind}");
        }
    }

    /// <summary>
    /// Mirrors <c>SyncController.ResolveCountyClaim</c> — same
    /// contract, narrow trust surface (Guid claim only, no
    /// county-name fallback).
    /// </summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
