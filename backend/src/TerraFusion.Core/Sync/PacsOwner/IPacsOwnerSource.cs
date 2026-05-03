using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsOwner;

/// <summary>
/// Slice B1-B: source-side abstraction for PACS owner rows.
/// </summary>
public interface IPacsOwnerSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceOwner> StreamOwnersAsync(
        CancellationToken cancellationToken);
}
