using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsLandDetail;

/// <summary>
/// Slice L1: PACS land_detail raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The
/// <c>land-detail-key-uniqueness</c> gate enforces source-side
/// 4-key uniqueness so the truth_pacs.land_current promoter (L2)
/// can safely use <c>(prop_val_yr, sup_num, prop_id, land_seg_id)</c>
/// as a join key.</para>
/// </summary>
public interface IPacsLandDetailLandingService
{
    Task<PacsLandDetailLandingResult> LandLandDetailsAsync(
        IPacsLandDetailSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice L1: outcome of one landing run.</summary>
public sealed record PacsLandDetailLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of (PropValYr, SupNum, PropId, LandSegId) tuples that
    /// appeared more than once. Doctrine: must be 0 for the
    /// <c>land-detail-key-uniqueness</c> gate to PASS.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Land-segment-type histogram (SFR, AG, CMRCL, etc).</summary>
    public required IReadOnlyDictionary<string, int> TypeCdHistogram { get; init; }

    /// <summary>Aggregate sum of <c>SizeAcres</c> over all landed rows.</summary>
    public required decimal SizeAcresSum { get; init; }

    /// <summary>Aggregate sum of <c>LandSegMarketVal</c> over all landed rows.</summary>
    public required decimal LandSegMarketValSum { get; init; }

    public string? ErrorSummary { get; init; }
}
