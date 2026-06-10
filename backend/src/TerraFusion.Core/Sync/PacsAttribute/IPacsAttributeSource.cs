using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsAttribute;

/// <summary>
/// Slice E2-A (ATTR-POP-1): source-side abstraction for PACS
/// <c>attribute</c> dictionary rows. Mirrors the shape of the
/// other <c>IPacs*Source</c> interfaces.
/// </summary>
public interface IPacsAttributeSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceAttribute> StreamAttributesAsync(
        CancellationToken cancellationToken);
}
