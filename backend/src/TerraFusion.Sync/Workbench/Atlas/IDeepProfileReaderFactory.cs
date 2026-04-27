using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Opens a deep-profile reader session against a <see cref="SyncSourceConnection"/>.
/// Mirrors <see cref="IMetadataReaderFactory"/> so the auth-resolver wiring
/// (Slice B1.6.5 — <see cref="ISecretResolver"/>) is reused unchanged: SQL Auth
/// passwords come from the operator's process environment, never from the
/// entity, never from a repo file.
/// </summary>
public interface IDeepProfileReaderFactory
{
    Task<IDeepProfileReaderSession> OpenAsync(SyncSourceConnection connection, CancellationToken ct = default);
}

/// <summary>
/// Holds an open <see cref="IDeepProfileReader"/> plus the underlying
/// connection. Disposing the session closes the connection.
/// </summary>
public interface IDeepProfileReaderSession : IAsyncDisposable
{
    IDeepProfileReader Reader { get; }
}
