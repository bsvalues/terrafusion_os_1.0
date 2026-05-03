using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsAccount;

/// <summary>
/// Slice B1-A: source-side abstraction for PACS account rows.
/// Mirrors the shape of <c>IPacsSaleSource</c> /
/// <c>IPacsPropSuppAssocSource</c>.
/// </summary>
public interface IPacsAccountSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceAccount> StreamAccountsAsync(
        CancellationToken cancellationToken);
}
