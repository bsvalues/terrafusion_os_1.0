using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsAttribute;

/// <summary>
/// Slice E2-A (ATTR-POP-1): populator for
/// <c>canonical_tf.attribute_definition</c>.
///
/// <para>Single-tier (canonical-only) slice — dictionary data has
/// no truth-qualification axis. Reads PACS <c>dbo.attribute</c> and
/// upserts canonical_tf.attribute_definition rows keyed
/// <c>(CountyId, IAttrId)</c>. Idempotent by design: the natural
/// key's unique index drives upsert behaviour.</para>
///
/// <para>Per Block-C v1.5 contract: this populator covers family-
/// grain definitions only. If the imprv_attr quarantine doesn't
/// drain after a populator run, value-grain resolution
/// (<c>dbo.imprv_attr_val</c>) is a future slice — those rows
/// would also write attribute_definition entries with synthesized
/// IAttrId derived from <c>(imprv_attr_id, imprv_attr_val_cd)</c>.</para>
/// </summary>
public interface IPacsAttributePopulator
{
    Task<PacsAttributePopulatorResult> PopulateAsync(
        IPacsAttributeSource source,
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice E2-A (ATTR-POP-1): outcome of one populator run.</summary>
public sealed record PacsAttributePopulatorResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int RowsConsidered { get; init; }
    public required int RowsInserted { get; init; }
    public required int RowsUpdated { get; init; }
    public required int RowsSoftRetired { get; init; }
    public required int InactiveSkipped { get; init; }

    public string? ErrorSummary { get; init; }
}
