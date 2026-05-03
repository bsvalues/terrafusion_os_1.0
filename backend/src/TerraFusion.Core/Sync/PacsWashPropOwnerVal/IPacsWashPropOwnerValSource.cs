using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsWashPropOwnerVal;

/// <summary>
/// Slice B1-C: source-side abstraction for PACS
/// <c>wash_prop_owner_val</c> rows. Mirrors B1-B's shape.
/// </summary>
public interface IPacsWashPropOwnerValSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceWashPropOwnerVal> StreamWashPropOwnerValsAsync(
        CancellationToken cancellationToken);
}
