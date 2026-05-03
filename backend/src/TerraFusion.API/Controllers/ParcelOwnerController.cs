using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsOwnerCanonical;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice B5: read-only endpoint for canonical parcel ownership.
///
/// <para><c>GET /api/parcels/{tfParcelId}/owner-current?taxYear=...</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>400 on missing / empty <c>tfParcelId</c> or non-positive <c>taxYear</c>.</item>
///   <item>403 when the caller has no <c>countyId</c> claim (cannot enforce isolation).</item>
///   <item>404 when no parcel matches OR the parcel exists but has no link rows for the year.</item>
///   <item>404 (NOT 403) on cross-county access — existence must not leak.</item>
///   <item>200 with <see cref="TerraFusion.Core.DTOs.CanonicalTf.ParcelOwnerCurrentResponse"/> when found.</item>
/// </list>
/// </para>
///
/// <para>The payload's <c>DisplayName</c> already reflects the
/// canonical PII redaction (confidential rows show
/// <c>"[Confidential]"</c>). The <c>WebSuppression</c> flag is
/// surfaced but NOT honored at this layer; downstream public-facing
/// services must filter on it before serving anonymous consumers.</para>
/// </summary>
[ApiController]
[Route("api/parcels")]
public sealed class ParcelOwnerController : ControllerBase
{
    private readonly ITfParcelOwnerReader _reader;
    private readonly ILogger<ParcelOwnerController> _logger;

    public ParcelOwnerController(
        ITfParcelOwnerReader reader,
        ILogger<ParcelOwnerController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    [HttpGet("{tfParcelId:guid}/owner-current")]
    [Authorize]
    public async Task<IActionResult> GetOwnerCurrent(
        Guid tfParcelId,
        [FromQuery] short taxYear,
        CancellationToken ct = default)
    {
        if (tfParcelId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "tfParcelId must be a non-empty Guid.",
            });
        }
        if (taxYear <= 0)
        {
            return BadRequest(new
            {
                error = "taxYear must be a positive year value.",
                hint = "Pass the calendar year, e.g. 2026.",
                taxYear,
            });
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning(
                "[ParcelOwner] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var lookup = await _reader
            .GetOwnersAsync(tfParcelId, taxYear, ct)
            .ConfigureAwait(false);

        switch (lookup.Kind)
        {
            case ParcelOwnerLookupKind.NotFound:
                _logger.LogInformation(
                    "[ParcelOwner] tfParcelId={ParcelId} taxYear={TaxYear} not found.",
                    tfParcelId, taxYear);
                return NotFound();

            case ParcelOwnerLookupKind.NoOwners:
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelOwner] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
                        principalCountyId, tfParcelId, lookup.CountyId);
                    return NotFound();
                }
                _logger.LogInformation(
                    "[ParcelOwner] tfParcelId={ParcelId} taxYear={TaxYear} has no canonical owners.",
                    tfParcelId, taxYear);
                return NotFound();

            case ParcelOwnerLookupKind.Found:
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelOwner] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
                        principalCountyId, tfParcelId, lookup.CountyId);
                    return NotFound();
                }
                return Ok(lookup.Payload);

            default:
                throw new InvalidOperationException(
                    $"Unrecognized lookup kind: {lookup.Kind}");
        }
    }

    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
