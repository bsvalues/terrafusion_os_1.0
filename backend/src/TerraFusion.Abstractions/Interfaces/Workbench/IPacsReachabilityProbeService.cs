using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces.Workbench;

/// <summary>
/// Slice OPS-1-A-2: PACS connection probe contract for the Sync
/// Readiness Console question 1 ("Is Harris PACS reachable?"). Pure
/// connection-open / connection-close; no metadata is queried.
///
/// <para>HG3 read-only at the strongest interpretation: this service
/// MUST NOT execute any SQL beyond what an open / close cycle
/// implies. No SELECT, no metadata pull, no schema introspection.
/// The only effect on the PACS server is the brief connection
/// session itself.</para>
///
/// <para>Secrets policy: the probe resolves passwords through the
/// existing <c>ISecretResolver</c> seam (the same pipeline the
/// SyncAtlas CLI uses). The probe never echoes the resolved password
/// or any connection-string fragment back to its caller; the result
/// carries a sanitized server / database identifier and a structured
/// reachable / unreachable verdict.</para>
/// </summary>
public interface IPacsReachabilityProbeService
{
    /// <summary>
    /// Open the configured SqlConnection for the given county-scoped
    /// source connection, then close. Returns a structured result
    /// reflecting whether the open succeeded.
    /// </summary>
    /// <param name="countyId">Required scope.</param>
    /// <param name="sourceConnectionId">
    /// The <c>SyncSourceConnection</c> to probe; looked up county-
    /// scoped at the implementation seam.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    Task<PacsReachabilityProbeResult> ProbeAsync(
        Guid countyId,
        Guid sourceConnectionId,
        CancellationToken ct);
}

/// <summary>
/// Sanitized probe result. Contains no secrets, no connection-string
/// fragments, no SQL. The <c>Server</c> / <c>Database</c> values are
/// the same metadata the operator already sees in the SyncAtlas
/// CLI's stdout — the connection pointer, not the connection
/// secret.
/// </summary>
/// <param name="Reachable">Whether the open succeeded.</param>
/// <param name="ServerLabel">"server,port" or empty when unknown.</param>
/// <param name="DatabaseLabel">Database name or empty when unknown.</param>
/// <param name="ProbedAtUtc">Timestamp of the probe attempt.</param>
/// <param name="ErrorCategory">
/// Sanitized error class on failure: "AuthFailed", "Timeout",
/// "ConnectionRefused", "Other", or null on success. Never carries
/// the underlying exception's message verbatim — the message could
/// embed the connection string.
/// </param>
public sealed record PacsReachabilityProbeResult(
    bool Reachable,
    string ServerLabel,
    string DatabaseLabel,
    DateTime ProbedAtUtc,
    string? ErrorCategory);
