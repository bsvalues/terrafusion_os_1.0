using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsImprvAttr;

/// <summary>Slice C1-C: source-side abstraction for PACS imprv_attr rows.</summary>
public interface IPacsImprvAttrSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceImprvAttr> StreamImprvAttrsAsync(
        CancellationToken cancellationToken);
}
