using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Workbench;

/// <summary>
/// SYNC-WORKBENCH-H: evidence-packet builder for a committed
/// decision row.
///
/// <para>The packet is the assessor's legal record of a single
/// <see cref="TerraFusion.Core.Entities.Workbench.WorkbenchCommit"/>.
/// It is reproducible: re-running the build for the same commit
/// against the same HMAC key produces a byte-identical ZIP. The ZIP
/// embeds a top-level <c>manifest.json</c> whose
/// <c>signature.hex</c> is HMAC-SHA256 over the manifest JSON with
/// the signature hex blanked out — verifiers reproduce the
/// computation by re-zeroing the field.</para>
///
/// <para><b>Boundary invariant</b>: this service is read-only. It
/// never mutates triage rows, link rows, or doctrine surfaces. It
/// pulls from <c>tf_workbench.WorkbenchCommit</c> and
/// <c>tf_workbench.WorkbenchCommitDecisionLink</c> only.</para>
/// </summary>
public interface IEvidencePacketService
{
    /// <summary>
    /// Build the evidence packet for the given commit.
    /// </summary>
    Task<EvidencePacketResult> BuildAsync(
        Guid commitId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Build only the <c>manifest.json</c> bytes for the given
    /// commit (the same JSON that would be embedded in the ZIP).
    /// Useful for verification without downloading the full
    /// packet.
    /// </summary>
    Task<EvidenceManifestResult> BuildManifestAsync(
        Guid commitId,
        CancellationToken cancellationToken = default);
}

/// <summary>Discriminator over evidence-service outcomes mapped 1:1 to HTTP status by the controller.</summary>
public enum EvidencePacketOutcome
{
    Ok,
    NotFound,
    ConfigurationError,
}

/// <summary>
/// Result of <see cref="IEvidencePacketService.BuildAsync"/>.
/// </summary>
public sealed record EvidencePacketResult(
    EvidencePacketOutcome Outcome,
    string? ErrorMessage,
    string? FileName,
    byte[]? ZipContent,
    string? ManifestSignatureHex);

/// <summary>
/// Result of <see cref="IEvidencePacketService.BuildManifestAsync"/>.
/// </summary>
public sealed record EvidenceManifestResult(
    EvidencePacketOutcome Outcome,
    string? ErrorMessage,
    string? FileName,
    byte[]? ManifestJson);

/// <summary>
/// Closed vocabulary for evidence packet entry filenames so tests
/// can reference them by symbol.
/// </summary>
public static class EvidencePacketEntries
{
    public const string Manifest = "manifest.json";
    public const string Decisions = "decisions.csv";
    public const string UniverseDistribution = "universe-distribution.csv";
    public const string RatioDistribution = "ratio-distribution.csv";
    public const string AuditTrail = "audit-trail.csv";
}
