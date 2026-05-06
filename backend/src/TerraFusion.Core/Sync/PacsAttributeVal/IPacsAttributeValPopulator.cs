using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsAttributeVal;

/// <summary>
/// Slice E2-B (ATTR-POP-2): value-grain populator for
/// <c>canonical_tf.attribute_definition</c>.
///
/// <para>Companion to ATTR-POP-1 (family-grain). Reads PACS
/// value-grain dictionary entries (<c>(i_attr_val_id, i_attr_val_cd)</c>
/// pairs) and upserts <c>attribute_definition</c> rows keyed
/// <c>(CountyId, IAttrId)</c> where <c>IAttrId = i_attr_val_id</c>.
/// This is the grain the imprv canonical projector keys on, so
/// after this populator runs, <c>tf_improvement_feature.AttributeId</c>
/// resolutions succeed.</para>
///
/// <para>Idempotent by the same <c>(CountyId, IAttrId)</c> unique
/// index ATTR-POP-1 uses. If a family-grain row from ATTR-POP-1
/// happens to share an integer with a value-grain row, the value-
/// grain row's data wins (that's the grain the projector reads).
/// In practice, family-grain ids and value-grain ids occupy
/// distinct ranges so collision is rare.</para>
/// </summary>
public interface IPacsAttributeValPopulator
{
    Task<PacsAttributeValPopulatorResult> PopulateAsync(
        IPacsAttributeValSource source,
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice E2-B (ATTR-POP-2): outcome of one populator run.</summary>
public sealed record PacsAttributeValPopulatorResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsConsidered { get; init; }
    public required int RowsInserted { get; init; }
    public required int RowsUpdated { get; init; }
    public required int DuplicatePairsCollapsed { get; init; }

    public string? ErrorSummary { get; init; }
}
