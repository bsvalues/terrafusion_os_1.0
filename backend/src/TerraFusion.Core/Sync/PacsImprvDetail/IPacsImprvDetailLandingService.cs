using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsImprvDetail;

/// <summary>
/// Slice C1-B: PACS imprv_detail raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The
/// <c>imprv-detail-key-uniqueness</c> gate enforces source-side
/// 5-key uniqueness so downstream consumers can safely use
/// <c>(prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id)</c>
/// as a join key.</para>
/// </summary>
public interface IPacsImprvDetailLandingService
{
    Task<PacsImprvDetailLandingResult> LandImprvDetailsAsync(
        IPacsImprvDetailSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice C1-B: outcome of one landing run.</summary>
public sealed record PacsImprvDetailLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of (PropValYr, SupNum, PropId, ImprvId, ImprvDetId)
    /// tuples that appeared more than once.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Detail-type histogram (ATTGAR, BSMT, MA, etc).</summary>
    public required IReadOnlyDictionary<string, int> TypeCdHistogram { get; init; }

    /// <summary>Aggregate sum of <c>ImprvDetVal</c> over all landed rows.</summary>
    public required decimal ImprvDetValSum { get; init; }

    /// <summary>Aggregate sum of <c>ImprvDetArea</c> over all landed rows.</summary>
    public required decimal ImprvDetAreaSum { get; init; }

    public string? ErrorSummary { get; init; }
}
