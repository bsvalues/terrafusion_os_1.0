using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesRatioStudy;

namespace TerraFusion.API.Helpers;

/// <summary>
/// Slice G3 (v1.12): shared helper for normalizing the
/// <c>era</c> query-string parameter on canonical-tf read
/// endpoints.
///
/// <para>Per Block-G G3 spec: every canonical read endpoint that
/// queries an entity carrying a <c>ConversionEra</c> column accepts
/// an <c>era</c> query parameter. Null/whitespace defaults to
/// <see cref="ConversionEras.PostConversion"/> (the documented
/// default per v1.10 Section 3). Unrecognized tokens produce a 400 with
/// the valid-values list. The special <see cref="ISalesRatioStudyReader.EraAll"/>
/// token bypasses the era filter entirely.</para>
///
/// <para>This helper is shared across
/// <c>SalesRatioStudyController</c>, <c>TfSalesController</c>,
/// <c>ParcelOwnerController</c>, and <c>ParcelWsdorController</c> --
/// the spec asked for extraction once 3+ controllers shared the
/// same validation. The era predicate itself stays in each reader
/// because each entity's <c>ConversionEra</c> column lives in a
/// different EF entity type (no shared base type to predicate on).</para>
/// </summary>
public static class EraQueryHelper
{
    /// <summary>
    /// Doctrine-frozen set of valid era query tokens.
    /// </summary>
    public static readonly IReadOnlySet<string> ValidEraValues =
        new HashSet<string>
        {
            ConversionEras.PostConversion,
            ConversionEras.PreConversion2017,
            ConversionEras.Unknown,
            ISalesRatioStudyReader.EraAll,
        };

    /// <summary>
    /// Normalizes the <paramref name="era"/> query parameter.
    /// Null/whitespace -> POST_CONVERSION. Unknown token -> 400 with
    /// the valid-values list. Recognized tokens (trimmed) -> echoed back.
    /// </summary>
    public static bool TryNormalizeEra(
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
            resolvedEra = string.Empty;
            failureResult = new BadRequestObjectResult(new
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
}
