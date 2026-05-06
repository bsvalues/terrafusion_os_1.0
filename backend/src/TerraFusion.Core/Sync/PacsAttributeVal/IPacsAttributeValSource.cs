using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsAttributeVal;

/// <summary>
/// Slice E2-B (ATTR-POP-2): source-side abstraction for PACS
/// value-grain attribute dictionary rows.
/// </summary>
public interface IPacsAttributeValSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceAttributeVal> StreamAttributeValsAsync(
        CancellationToken cancellationToken);
}
