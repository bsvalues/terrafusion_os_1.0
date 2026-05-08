using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Helpers;
using TerraFusion.Core.Sync.PacsWsdorCanonical;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice B5': read-only endpoint for canonical WSDOR-grade
/// per-owner assessments.
///
/// <para><c>GET /api/parcels/{tfParcelId}/wsdor-roll?taxYear=...&amp;era=...</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>400 on missing / empty <c>tfParcelId</c>, non-positive
///   <c>taxYear</c>, or unrecognized <c>era</c> token.</item>
///   <item>403 when the caller has no <c>countyId</c> claim.</item>
///   <item>404 when no parcel matches OR the parcel exists but has no WSDOR rows for the year.</item>
///   <item>404 (NOT 403) on cross-county access — existence must not leak.</item>
///   <item>200 with <see cref="TerraFusion.Core.DTOs.CanonicalTf.ParcelWsdorRollResponse"/> when found.</item>
/// </list>
/// </para>
///
/// <para>Slice G3 (v1.12): the optional <c>era</c> query parameter
/// constrains the projected <c>tf_assessment_wsdor</c> rows to a
/// single conversion era. Null defaults to <c>POST_CONVERSION</c>;
/// <c>era=ALL</c> bypasses the filter for audit sweeps.</para>
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
        [FromQuery] string? era = null,
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

        // G3 (v1.12): normalize era query param. Null → POST_CONVERSION;
        // unknown tokens → 400 with the valid-values list.
        if (!EraQueryHelper.TryNormalizeEra(era, out var resolvedEra, out var eraFail))
        {
            _logger.LogWarning("[ParcelWsdor] invalid era token: {Era}", era);
            return eraFail!;
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning(
                "[ParcelWsdor] missing countyId claim on principal; refusing.");
            return Forbid();
        }

        var lookup = await _reader
            .GetWsdorRollAsync(tfParcelId, taxYear, resolvedEra, ct)
            .ConfigureAwait(false);

        switch (lookup.Kind)
        {
            case ParcelWsdorLookupKind.NotFound:
                _logger.LogInformation(
                    "[ParcelWsdor] tfParcelId={ParcelId} taxYear={TaxYear} era={Era} not found.",
                    tfParcelId, taxYear, resolvedEra);
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
                    "[ParcelWsdor] tfParcelId={ParcelId} taxYear={TaxYear} era={Era} has no WSDOR entries.",
                    tfParcelId, taxYear, resolvedEra);
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
