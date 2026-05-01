using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C54-MULTI-C: helper for vetted cross-county manifest reuse
/// per the C54-MULTI-A policy
/// (`docs/sync/pacs-schema-multi-county-catalog-policy.md`,
/// "Manifest sharing" section).
///
/// <para>The workflow this helper supports:</para>
/// <list type="number">
/// <item>Operator authors a manifest for catalog identity A
/// (e.g. PII tagging for Benton's chg_of_owner.grantor_cv).</item>
/// <item>Operator decides the same shape applies to catalog
/// identity B (e.g. Yakima also has chg_of_owner.grantor_cv with
/// the same Direct PII semantics).</item>
/// <item>Operator invokes one of this class's methods to copy A's
/// manifest into B's path, parse the copy via the appropriate
/// JsonFile* manifest source (which validates the wire format),
/// and receive a <see cref="PacsCatalogManifestShareReceipt"/>
/// they file as the audit record.</item>
/// <item>Operator sets
/// <see cref="PacsCatalogSetEntry.AllowSharedManifestPath"/>=true
/// on both A and B's catalog-set entries (or, more cleanly, sets
/// distinct paths and accepts the helper-driven copy as the
/// authoritative split). Either way, the next catalog build runs
/// the per-manifest validation against EACH catalog's own table /
/// column set, so a manifest that references tables present in A
/// but not B fails closed at B's build.</item>
/// </list>
///
/// <para>Hard guards:</para>
/// <list type="bullet">
/// <item>Copy is always to a NEW path. The helper does not modify
/// the source file.</item>
/// <item>Manifest format validation runs after copy: any malformed
/// manifest throws before the receipt is returned.</item>
/// <item>Receipt carries SHA-256 hashes of both source and target
/// bytes. Operators may compare hashes across multiple shares to
/// detect drift.</item>
/// <item>The helper does NOT enforce ISOL-1 by itself — that's a
/// catalog-set build-time concern. The receipt is the audit
/// signal the operator files alongside their
/// <c>AllowSharedManifestPath=true</c> opt-in.</item>
/// </list>
/// </summary>
public static class PacsCatalogManifestSharingHelper
{
    /// <summary>
    /// Share a conversion-era manifest. The wire format is
    /// validated via <see cref="JsonFilePacsConversionManifestSource"/>
    /// after the copy; any malformed JSON / missing required field
    /// throws.
    /// </summary>
    public static Task<PacsCatalogManifestShareReceipt> ShareConversionManifestAsync(
        string sourcePath,
        string targetPath,
        PacsCatalogIdentity sourceIdentity,
        PacsCatalogIdentity targetIdentity,
        CancellationToken ct) =>
        ShareInternalAsync(
            kind: "conversion",
            sourcePath, targetPath, sourceIdentity, targetIdentity,
            validate: async path =>
            {
                var src = new JsonFilePacsConversionManifestSource(path);
                _ = await src.ReadAsync(ct).ConfigureAwait(false);
            });

    /// <summary>
    /// Share a PII-classification manifest. Validated via
    /// <see cref="JsonFilePacsPiiManifestSource"/> after the copy.
    /// </summary>
    public static Task<PacsCatalogManifestShareReceipt> SharePiiManifestAsync(
        string sourcePath,
        string targetPath,
        PacsCatalogIdentity sourceIdentity,
        PacsCatalogIdentity targetIdentity,
        CancellationToken ct) =>
        ShareInternalAsync(
            kind: "pii",
            sourcePath, targetPath, sourceIdentity, targetIdentity,
            validate: async path =>
            {
                var src = new JsonFilePacsPiiManifestSource(path);
                _ = await src.ReadAsync(ct).ConfigureAwait(false);
            });

    /// <summary>
    /// Share an exported FK override manifest. Validated via
    /// <see cref="JsonFilePacsExportedFkManifestSource"/> after the
    /// copy.
    /// </summary>
    public static Task<PacsCatalogManifestShareReceipt> ShareExportedFkManifestAsync(
        string sourcePath,
        string targetPath,
        PacsCatalogIdentity sourceIdentity,
        PacsCatalogIdentity targetIdentity,
        CancellationToken ct) =>
        ShareInternalAsync(
            kind: "exported-fk",
            sourcePath, targetPath, sourceIdentity, targetIdentity,
            validate: async path =>
            {
                var src = new JsonFilePacsExportedFkManifestSource(path);
                _ = await src.ReadAsync(ct).ConfigureAwait(false);
            });

    private static async Task<PacsCatalogManifestShareReceipt> ShareInternalAsync(
        string kind,
        string sourcePath,
        string targetPath,
        PacsCatalogIdentity sourceIdentity,
        PacsCatalogIdentity targetIdentity,
        Func<string, Task> validate)
    {
        if (string.IsNullOrWhiteSpace(sourcePath))
            throw new ArgumentException("Source path must be non-empty.", nameof(sourcePath));
        if (string.IsNullOrWhiteSpace(targetPath))
            throw new ArgumentException("Target path must be non-empty.", nameof(targetPath));
        if (sourceIdentity is null) throw new ArgumentNullException(nameof(sourceIdentity));
        if (targetIdentity is null) throw new ArgumentNullException(nameof(targetIdentity));

        if (string.Equals(sourcePath, targetPath, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"Source and target paths are identical ('{sourcePath}'). " +
                "Sharing requires distinct paths so each catalog has its own manifest file.",
                nameof(targetPath));
        }

        if (!File.Exists(sourcePath))
        {
            throw new FileNotFoundException(
                $"[PacsCatalogManifestSharingHelper] Source manifest '{sourcePath}' does not exist.",
                sourcePath);
        }

        // Hash source bytes BEFORE copy so the receipt reflects the
        // source content the operator chose to share.
        byte[] sourceBytes = await File.ReadAllBytesAsync(sourcePath).ConfigureAwait(false);
        string sourceSha = ComputeSha256(sourceBytes);

        // Ensure target's parent directory exists, then copy.
        var targetDir = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }
        await File.WriteAllBytesAsync(targetPath, sourceBytes).ConfigureAwait(false);

        // Hash target bytes after the copy. Should equal source for
        // a clean copy; surfaced separately so callers can detect
        // any in-flight modification.
        byte[] targetBytes = await File.ReadAllBytesAsync(targetPath).ConfigureAwait(false);
        string targetSha = ComputeSha256(targetBytes);

        // Validate the wire format via the appropriate manifest
        // source. Any malformed JSON / missing required field
        // throws here, BEFORE the receipt is built — the operator
        // sees the failure as the share did not complete.
        await validate(targetPath).ConfigureAwait(false);

        return new PacsCatalogManifestShareReceipt(
            ManifestKind:          kind,
            SourcePath:            sourcePath,
            TargetPath:            targetPath,
            SourceSha256:          sourceSha,
            TargetSha256:          targetSha,
            SharedAtUtc:           DateTime.UtcNow,
            SourceCatalogIdentity: sourceIdentity,
            TargetCatalogIdentity: targetIdentity);
    }

    private static string ComputeSha256(byte[] bytes)
    {
        var hash = SHA256.HashData(bytes);
        var sb = new StringBuilder(hash.Length * 2);
        foreach (var b in hash) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}
