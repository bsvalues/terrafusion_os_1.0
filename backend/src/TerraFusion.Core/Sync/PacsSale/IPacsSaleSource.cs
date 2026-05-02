using System.Collections.Generic;
using System.Threading;

namespace TerraFusion.Core.Sync.PacsSale;

/// <summary>
/// Slice S1: source-side abstraction for PACS sale rows.
///
/// <para>The doctrine: the landing service does NOT couple to a
/// specific PACS connection (Dapper, EF, Spatialest, MS-SQL backup,
/// fixture). A source is anything that can stream sale rows and tell
/// the landing service what query produced them. The query text is
/// hashed into <see cref="TerraFusion.Core.Sync.PacsSale.PacsSourceSale"/>'s
/// load batch as <c>source_query_hash</c> so the hash itself is the
/// audit anchor.</para>
/// </summary>
public interface IPacsSaleSource
{
    /// <summary>
    /// Stable display name for the source system (e.g.
    /// <c>"JCHARRISPACS"</c>, <c>"pacs_oltp_backup"</c>). Recorded
    /// on the load batch.
    /// </summary>
    string SourceSystem { get; }

    /// <summary>
    /// Logical source-database name (e.g. <c>"pacs_oltp"</c>).
    /// Recorded on the load batch.
    /// </summary>
    string SourceFileOrDatabase { get; }

    /// <summary>
    /// The query text the source ran. Hashed into
    /// <c>source_query_hash</c> by the landing service.
    /// </summary>
    string SourceQueryText { get; }

    /// <summary>
    /// Streams sale rows. The landing service consumes lazily so a
    /// county's full sale corpus does not need to load into memory.
    /// </summary>
    IAsyncEnumerable<PacsSourceSale> StreamSalesAsync(CancellationToken cancellationToken);
}
