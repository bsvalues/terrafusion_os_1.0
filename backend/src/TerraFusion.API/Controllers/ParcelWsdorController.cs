using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsWsdorCanonical;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice B5': read-only endpoint for canonical WSDOR-grade
/// per-owner assessments.
///
/// <para><c>GET /api/parcels/{tfParcelId}/wsdor-roll?taxYear=...</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>400 on missing / empty <c>tfParcelId</c> or non-positive <c>taxYear</c>.</item>
///   <item>403 when the caller has no <c>countyId</c> claim.</item>
///   <item>404 when no parcel matches OR the parcel exists but has no WSDOR rows for the year.</item>
///   <item>404 (NOT 403) on cross-county access — existence must not leak.</item>
///   <item>200 with <see cref="TerraFusion.Core.DTOs.CanonicalTf.ParcelWsdorRollResponse"/> when found.</item>
/// </list>
/// </para>
///
/// <para>Each entry's <c>OwnerDisplayName</c> reflects the canonical
/// PII redaction policy already applied at B3; the reader does NOT
/// re-redact. Aggregate totals across the entry set are included in
/// the envelope for parcel-level audit views.</para>
/// </summary>
[ApiController]
[Route("api/parcels")]
public sealed class ParcelWsdorController : ControllerBase
{
    private readonly ITfParcelWsdorReader _reader;
    private readonly ILogger<ParcelWsdorController> _logger;

    public ParcelWsdorController(
        ITfParcelWsdorReader reader,
        ILogger<ParcelWsdorController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    [HttpGet("{tfParcelId:guid}/wsdor-roll")]
    [Authorize]
    public async Task<IActionResult> GetWsdorRoll(
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
                "[ParcelWsdor] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var lookup = await _reader
            .GetWsdorRollAsync(tfParcelId, taxYear, ct)
            .ConfigureAwait(false);

        switch (lookup.Kind)
        {
            case ParcelWsdorLookupKind.NotFound:
                _logger.LogInformation(
                    "[ParcelWsdor] tfParcelId={ParcelId} taxYear={TaxYear} not found.",
                    tfParcelId, taxYear);
                return NotFound();

            case ParcelWsdorLookupKind.NoEntries:
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelWsdor] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
                        principalCountyId, tfParcelId, lookup.CountyId);
                    return NotFound();
                }
                _logger.LogInformation(
                    "[ParcelWsdor] tfParcelId={ParcelId} taxYear={TaxYear} has no WSDOR entries.",
                    tfParcelId, taxYear);
                return NotFound();

            case ParcelWsdorLookupKind.Found:
                if (lookup.CountyId != principalCountyId.Value)
                {
                    _logger.LogWarning(
                        "[ParcelWsdor] cross-county refused: principal={Principal} parcel={ParcelId} parcelCounty={County}",
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
