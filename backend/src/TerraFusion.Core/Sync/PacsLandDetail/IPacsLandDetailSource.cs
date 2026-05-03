using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsLandDetail;

/// <summary>Slice L1: source-side abstraction for PACS land_detail rows.</summary>
public interface IPacsLandDetailSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceLandDetail> StreamLandDetailsAsync(
        CancellationToken cancellationToken);
}
