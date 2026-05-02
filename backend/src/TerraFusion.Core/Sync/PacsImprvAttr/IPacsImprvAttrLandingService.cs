using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsImprvAttr;

/// <summary>
/// Slice C1-C: PACS imprv_attr raw landing orchestrator with
/// dictionary cross-check.
///
/// <para>Doctrine: rows whose <c>IAttrValCd</c> is in the dictionary
/// land in <c>legacy_pacs_raw.imprv_attr</c>. Rows whose code is
/// NOT in the dictionary quarantine to
/// <c>legacy_tf_unproven.unresolved_imprv_attr</c> (per the 90-day
/// plan §4 Block C). The <c>imprv-attr-dictionary-coverage</c>
/// gate emits WARN when any rows quarantine — visibility for the
/// operator to investigate without failing the batch.</para>
/// </summary>
public interface IPacsImprvAttrLandingService
{
    Task<PacsImprvAttrLandingResult> LandImprvAttrsAsync(
        IPacsImprvAttrSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice C1-C: outcome of one landing run.</summary>
public sealed record PacsImprvAttrLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsConsidered { get; init; }
    public required int RowsLanded { get; init; }
    public required int RowsQuarantined { get; init; }

    /// <summary>
    /// Count of (PropValYr, SupNum, PropId, ImprvId, ImprvDetId,
    /// IAttrValId) tuples appearing more than once across landed +
    /// quarantined rows combined.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Distinct <c>i_attr_val_cd</c> codes that landed (in dictionary).</summary>
    public required IReadOnlyDictionary<string, int> KnownCodeHistogram { get; init; }

    /// <summary>Distinct codes that quarantined (NOT in dictionary).</summary>
    public required IReadOnlyDictionary<string, int> UnknownCodeHistogram { get; init; }

    public string? ErrorSummary { get; init; }
}
