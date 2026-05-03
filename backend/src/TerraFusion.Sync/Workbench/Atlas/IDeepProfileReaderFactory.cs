using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Opens a deep-profile reader session against a <see cref="SyncSourceConnection"/>.
/// Mirrors <see cref="IMetadataReaderFactory"/> so the auth-resolver wiring
/// (Slice B1.6.5 — <see cref="ISecretResolver"/>) is reused unchanged: SQL Auth
/// passwords come from the operator's process environment, never from the
/// entity, never from a repo file.
///
/// <para><b>FIX-B2.7E session lifecycle.</b> The <see cref="DeepProfileOrchestrator"/>
/// opens a fresh session per table rather than sharing one across the batch:
/// when a long-running table operation times out, ADO.NET puts the
/// <c>SqlConnection</c> into a broken state, and every subsequent command
/// on that connection fails with "BeginExecuteReader requires an open and
/// available Connection." Per-table sessions sidestep the cascade entirely
/// — connection pooling makes the open/dispose pair cheap (≈1 ms after the
/// first call). Callers may pass an optional
/// <see cref="DeepProfileTimeoutBudget"/> to bound per-command-class wait
/// times; <c>null</c> resolves to <see cref="DeepProfileTimeoutBudget.Default"/>.</para>
/// </summary>
public interface IDeepProfileReaderFactory
{
    Task<IDeepProfileReaderSession> OpenAsync(
        SyncSourceConnection connection,
        DeepProfileTimeoutBudget? timeoutBudget = null,
        CancellationToken ct = default);
}

/// <summary>
/// Holds an open <see cref="IDeepProfileReader"/> plus the underlying
/// connection. Disposing the session closes the connection.
/// </summary>
public interface IDeepProfileReaderSession : IAsyncDisposable
{
    IDeepProfileReader Reader { get; }
}
