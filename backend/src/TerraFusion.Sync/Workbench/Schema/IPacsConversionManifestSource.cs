using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C50-CONV-B: read-only source for a
/// <see cref="PacsConversionManifest"/>. Pure I/O abstraction; no
/// catalog logic. The default implementation
/// (<see cref="JsonFilePacsConversionManifestSource"/>) reads from
/// a single operator-supplied JSON file at an explicit path
/// (HG-CONV-1: no glob, no walk).
///
/// <para>Implementations MUST fail closed (throw) on:</para>
/// <list type="bullet">
/// <item>Missing file (when caller required a manifest).</item>
/// <item>Malformed JSON / YAML.</item>
/// <item>Manifest entries with
/// <see cref="PacsConversionEra.Unknown"/> as the
/// <c>Era</c> value (HG-CONV-2 rejects writing Unknown).</item>
/// <item>Manifest entries with empty / whitespace
/// <c>Reason</c> values (audit trail integrity).</item>
/// <item>Duplicate entries for the same (table) or
/// (table, column) tuple — manifests are deterministic.</item>
/// </list>
/// </summary>
public interface IPacsConversionManifestSource
{
    /// <summary>
    /// Reads and validates the manifest. Returns the parsed
    /// manifest, or <c>null</c> when no manifest is configured for
    /// this source (e.g., the JSON-file source was constructed with
    /// <c>null</c> path). Throws on parse / validation failure.
    /// </summary>
    Task<PacsConversionManifest?> ReadAsync(CancellationToken ct);
}
