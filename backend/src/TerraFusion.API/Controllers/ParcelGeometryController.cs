using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Security;
using TerraFusion.API.Services.Atlas;
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
    private readonly AtlasProjectionConsumer? _atlasProjectionConsumer;

    public ParcelGeometryController(
        IParcelGeometryReader reader,
        ILogger<ParcelGeometryController> logger,
        AtlasProjectionConsumer? atlasProjectionConsumer = null)
    {
        _reader = reader;
        _logger = logger;
        _atlasProjectionConsumer = atlasProjectionConsumer;
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
    /// Returns the exact-hash, local-sovereign Atlas projection for canonical
    /// parcel geometry. Disabled configuration is reported as unavailable;
    /// cross-county and missing parcels are indistinguishable 404 responses.
    /// </summary>
    [HttpGet("{parcelNumber}/atlas-projection")]
    [Authorize]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetAtlasProjection(
        string parcelNumber,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(parcelNumber) || parcelNumber.Length > 50)
        {
            return BadRequest(new
            {
                error = "parcelNumber must contain 1-50 characters.",
            });
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null || principalCountyId.Value == Guid.Empty)
        {
            _logger.LogWarning(
                "[AtlasProjection] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        if (_atlasProjectionConsumer is null)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Canonical Atlas projection is unavailable.");
        }

        try
        {
            var projection = await _atlasProjectionConsumer
                .ProjectAsync(principalCountyId.Value, parcelNumber, ct)
                .ConfigureAwait(false);

            return projection.Outcome switch
            {
                AtlasProjectionConsumerOutcome.NotFound => NotFound(),
                AtlasProjectionConsumerOutcome.Unavailable => Content(
                    projection.NormalizedFeatureJson!,
                    "application/json"),
                AtlasProjectionConsumerOutcome.Polygon => Content(
                    projection.NormalizedFeatureJson!,
                    "application/json"),
                _ => throw new InvalidOperationException(
                    $"Unrecognized Atlas projection outcome: {projection.Outcome}"),
            };
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (AtlasProjectionConsumerException exception)
        {
            _logger.LogWarning(
                exception,
                "[AtlasProjection] canonical projection failed closed for parcel {ParcelId} and trace {TraceId}.",
                parcelNumber,
                HttpContext.TraceIdentifier);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Canonical Atlas projection failed contract validation.");
        }
    }

    // ────────────────────────────────────────────────────────────
    // Slice D4-Neighbors:
    //   GET /api/parcels/{tfParcelId}/neighbors
    //   ?radiusFeet=<float, default 500.0, max 50000>
    //   &maxResults=<int,   default 50,     max 500>
    //
    // Contract:
    //   - 401 if unauthenticated (handled by [Authorize])
    //   - 403 if no countyId claim is present
    //   - 400 on Guid.Empty or invalid radiusFeet/maxResults
    //   - 404 if anchor parcel not found OR has no active geometry
    //   - 404 (NOT 403) on cross-county anchor — existence MUST NOT
    //     leak across county boundaries
    //   - 200 with ParcelNeighborResponse otherwise (Neighbors may
    //     be empty when radiusFeet=0 or no candidate qualifies)
    //
    // Implementation: in-memory haversine over centroids stored on
    // tf_parcel_geom rows in the SAME CountyId as the anchor. PostGIS
    // not required.
    // ────────────────────────────────────────────────────────────
    private const double DefaultRadiusFeet = 500.0;
    private const double MaxRadiusFeet = 50_000.0;
    private const int DefaultMaxResults = 50;
    private const int MaxMaxResults = 500;

    [HttpGet("{tfParcelId:guid}/neighbors")]
    [Authorize]
    public async Task<IActionResult> GetNeighbors(
        Guid tfParcelId,
        [FromQuery] double? radiusFeet = null,
        [FromQuery] int? maxResults = null,
        CancellationToken ct = default)
    {
        if (tfParcelId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "tfParcelId must be a non-empty Guid.",
            });
        }

        // Validate query params before consulting principal/db so
        // misuse never leaks county-existence timing.
        var effectiveRadius = radiusFeet ?? DefaultRadiusFeet;
        if (double.IsNaN(effectiveRadius) || double.IsInfinity(effectiveRadius) || effectiveRadius < 0d)
        {
            return BadRequest(new
            {
                error = "radiusFeet must be a finite, non-negative number.",
            });
        }
        if (effectiveRadius > MaxRadiusFeet)
        {
            effectiveRadius = MaxRadiusFeet;
        }

        var effectiveMax = maxResults ?? DefaultMaxResults;
        if (effectiveMax < 0)
        {
            return BadRequest(new
            {
                error = "maxResults must be a non-negative integer.",
            });
        }
        if (effectiveMax > MaxMaxResults)
        {
            effectiveMax = MaxMaxResults;
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning(
                "[ParcelGeometry/Neighbors] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var lookup = await _reader
            .GetNeighborsAsync(tfParcelId, effectiveRadius, effectiveMax, ct)
            .ConfigureAwait(false);

        switch (lookup.Kind)
        {
            case ParcelGeometryLookupKind.NotFound:
                _logger.LogInformation(
                    "[ParcelGeometry/Neighbors] anchor tfParcelId={ParcelId} not found.",
                    tfParcelId);
                return NotFound();

            case ParcelGeometryLookupKind.NoGeometry:
                // County isolation FIRST — same doctrine as the
                // /geometry endpoint: do not distinguish "exists in
                // another county" from "missing".
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelGeometry/Neighbors] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
                        principalCountyId, tfParcelId, lookup.CountyId);
                    return NotFound();
                }
                _logger.LogInformation(
                    "[ParcelGeometry/Neighbors] anchor tfParcelId={ParcelId} has no active geometry.",
                    tfParcelId);
                return NotFound();

            case ParcelGeometryLookupKind.Found:
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelGeometry/Neighbors] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
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
