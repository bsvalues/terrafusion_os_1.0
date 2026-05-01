using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C51-PII-B: read-only source for a
/// <see cref="PacsPiiManifest"/>. Pure I/O abstraction; no catalog
/// logic. The default implementation
/// (<see cref="JsonFilePacsPiiManifestSource"/>) reads from a single
/// operator-supplied JSON file at an explicit path
/// (HG-PII-1: no glob, no walk).
///
/// <para>Implementations MUST fail closed (throw) on:</para>
/// <list type="bullet">
/// <item>Missing file (when caller required a manifest).</item>
/// <item>Malformed JSON / YAML.</item>
/// <item>Manifest entries with empty / whitespace
/// <c>Reason</c> values (audit-trail integrity).</item>
/// <item>Duplicate entries for the same (table) or
/// (table, column) tuple — manifests are deterministic.</item>
/// <item>Invalid <see cref="PiiClassification"/> values (must be
/// None, Indirect, or Direct).</item>
/// </list>
///
/// <para>Validation of <c>TableExhaustiveFlags</c> against the
/// catalog is the responsibility of the caller (the
/// <see cref="LivePacsSchemaSource"/>), not this interface; the
/// source does not have catalog access.</para>
/// </summary>
public interface IPacsPiiManifestSource
{
    /// <summary>
    /// Reads and validates the manifest. Returns the parsed
    /// manifest, or <c>null</c> when no manifest is configured
    /// (e.g., the JSON-file source was constructed with <c>null</c>
    /// path). Throws on parse / validation failure.
    /// </summary>
    Task<PacsPiiManifest?> ReadAsync(CancellationToken ct);
}
