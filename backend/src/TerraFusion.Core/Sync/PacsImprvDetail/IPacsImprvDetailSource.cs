using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsImprvDetail;

/// <summary>Slice C1-B: source-side abstraction for PACS imprv_detail rows.</summary>
public interface IPacsImprvDetailSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceImprvDetail> StreamImprvDetailsAsync(
        CancellationToken cancellationToken);
}
