using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsImprv;

/// <summary>Slice C1-A: source-side abstraction for PACS imprv rows.</summary>
public interface IPacsImprvSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceImprv> StreamImprvsAsync(CancellationToken cancellationToken);
}
