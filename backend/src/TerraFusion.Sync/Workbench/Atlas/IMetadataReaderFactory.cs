using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Owns the lifetime of a connection + reader pair. Disposing the session closes
/// the underlying connection.
///
/// This bundling exists because <see cref="SqlServerMetadataReader"/> deliberately
/// does NOT own its connection — see B1.3 design notes. The orchestrator uses
/// `await using` on the session and lets the factory worry about close semantics.
/// </summary>
public interface IMetadataReaderSession : IAsyncDisposable
{
    IMetadataReader Reader { get; }
}

/// <summary>
/// Creates and opens a metadata reader from a stored connection profile.
/// Implementations are connector-specific (SqlServer today; ODBC / flat-file later).
/// </summary>
public interface IMetadataReaderFactory
{
    /// <summary>
    /// Open a metadata reader for the given source connection. The returned session
    /// MUST be disposed when the caller is done — it owns the underlying connection.
    /// </summary>
    /// <exception cref="NotSupportedException">
    /// If <see cref="SyncSourceConnection.ConnectionType"/> is not handled by this factory.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// If the connection cannot be opened (auth failure, host unreachable, etc.).
    /// The exception message is safe to surface in <see cref="SyncBatch.FailureMessage"/>.
    /// </exception>
    Task<IMetadataReaderSession> OpenAsync(SyncSourceConnection connection, CancellationToken ct = default);
}
