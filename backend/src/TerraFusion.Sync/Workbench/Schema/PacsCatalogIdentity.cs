using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C54-MULTI-B: catalog instance identity per the C54-MULTI-A
/// policy. Primary key is the
/// <c>(CountyId, SourceConnectionId)</c> composite — supports the
/// real case of one county running multiple source connections
/// (live + staging during a conversion).
///
/// <para><see cref="PacsRelease"/> and <see cref="SchemaVersionHash"/>
/// are secondary identity surfaces: they do not key the lookup, but
/// let consumers verify "I'm holding the catalog instance I think I
/// am" before acting.</para>
/// </summary>
/// <param name="CountyId">
/// Operator-supplied county identifier. Non-empty; case-sensitive
/// (e.g. <c>"WA-Benton"</c>).
/// </param>
/// <param name="SourceConnectionId">
/// Operator-supplied identifier for the legacy DB connection
/// (matches a <c>SyncSourceConnection</c> row's id). Non-empty.
/// </param>
/// <param name="PacsRelease">
/// PACS vendor release label (e.g. <c>"Harris PACS 9.0.4.2"</c>);
/// <c>null</c> when not declared by the operator. Mirrors
/// <see cref="PacsSchemaVersion.PacsRelease"/>.
/// </param>
/// <param name="SchemaVersionHash">
/// Deterministic SHA-256 hash (lower-hex) over the catalog's
/// <see cref="PacsSchemaVersion.SourceFileHashes"/> +
/// <see cref="PacsSchemaVersion.ConversionManifestHash"/>. Used for
/// quick-equality checks across lookups; computed by
/// <see cref="DeriveFromCatalog"/>.
/// </param>
public sealed record PacsCatalogIdentity(
    string CountyId,
    string SourceConnectionId,
    string? PacsRelease,
    string SchemaVersionHash)
{
    /// <summary>
    /// Derive an identity for an already-built catalog. The
    /// <paramref name="countyId"/> and
    /// <paramref name="sourceConnectionId"/> come from the operator
    /// (they are not implicitly derivable from the catalog itself);
    /// the version-hash is computed deterministically from the
    /// catalog's <see cref="PacsSchemaVersion"/>.
    /// </summary>
    public static PacsCatalogIdentity DeriveFromCatalog(
        string countyId,
        string sourceConnectionId,
        IPacsSchemaCatalog catalog)
    {
        if (string.IsNullOrWhiteSpace(countyId))
            throw new ArgumentException("CountyId must be non-empty.", nameof(countyId));
        if (string.IsNullOrWhiteSpace(sourceConnectionId))
            throw new ArgumentException("SourceConnectionId must be non-empty.", nameof(sourceConnectionId));
        if (catalog is null)
            throw new ArgumentNullException(nameof(catalog));

        return new PacsCatalogIdentity(
            CountyId:           countyId,
            SourceConnectionId: sourceConnectionId,
            PacsRelease:        catalog.Version.PacsRelease,
            SchemaVersionHash:  ComputeSchemaVersionHash(catalog.Version));
    }

    /// <summary>
    /// Computes a deterministic SHA-256 hash over the catalog's
    /// version surface. Stable across runs as long as the
    /// SourceFileHashes map and the ConversionManifestHash are
    /// stable. Lowercase hex; 64 chars.
    /// </summary>
    public static string ComputeSchemaVersionHash(PacsSchemaVersion version)
    {
        if (version is null) throw new ArgumentNullException(nameof(version));
        var sb = new StringBuilder();
        foreach (var kv in version.SourceFileHashes.OrderBy(kv => kv.Key, StringComparer.Ordinal))
        {
            sb.Append(kv.Key).Append('=').Append(kv.Value).Append(';');
        }
        sb.Append("conv=").Append(version.ConversionManifestHash);
        return ToHex(SHA256.HashData(Encoding.UTF8.GetBytes(sb.ToString())));
    }

    private static string ToHex(byte[] bytes)
    {
        var hex = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes)
        {
            hex.Append(b.ToString("x2"));
        }
        return hex.ToString();
    }
}
