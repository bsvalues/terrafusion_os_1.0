using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsPropertyVal;

/// <summary>SYNC-DOCTRINE-4-IMPL-V4: PACS <c>property_val</c> source contract.</summary>
public interface IPacsPropertyValSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourcePropertyVal> StreamPropertyValsAsync(
        CancellationToken cancellationToken);
}
