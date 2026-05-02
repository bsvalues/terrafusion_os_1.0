using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsPropSuppAssoc;

/// <summary>
/// Slice S2-A: source-side abstraction for PACS
/// <c>prop_supp_assoc</c> rows. Mirrors
/// <see cref="TerraFusion.Core.Sync.PacsSale.IPacsSaleSource"/>'s
/// shape: a stable source identifier, a query-text fingerprint, and
/// an async stream of rows.
/// </summary>
public interface IPacsPropSuppAssocSource
{
    /// <summary>Source system display name (e.g. <c>"JCHARRISPACS"</c>).</summary>
    string SourceSystem { get; }

    /// <summary>Logical source database (e.g. <c>"pacs_oltp"</c>).</summary>
    string SourceFileOrDatabase { get; }

    /// <summary>
    /// Query text the source ran. Hashed into <c>source_query_hash</c>
    /// by the landing service.
    /// </summary>
    string SourceQueryText { get; }

    /// <summary>Streams rows lazily so a full-county pull doesn't load into memory.</summary>
    IAsyncEnumerable<PacsSourcePropSuppAssoc> StreamPropSuppAssocsAsync(
        CancellationToken cancellationToken);
}
