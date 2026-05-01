using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C52-OVR-B: read-only source for a
/// <see cref="PacsExportedFkManifest"/>. Pure I/O abstraction; no
/// catalog logic. The default implementation
/// (<see cref="JsonFilePacsExportedFkManifestSource"/>) reads from
/// a single operator-supplied JSON file at an explicit path
/// (HG-OVR-1: no glob, no walk).
///
/// <para>Implementations MUST fail closed on:</para>
/// <list type="bullet">
/// <item>Missing file (when caller required a manifest).</item>
/// <item>Malformed JSON.</item>
/// <item>Empty / whitespace ConstraintName, SourceTable,
/// TargetTable, or Reason values.</item>
/// <item>Empty SourceColumns or TargetColumns lists.</item>
/// <item>SourceColumns.Count != TargetColumns.Count.</item>
/// <item>Duplicate ConstraintName values within the manifest.</item>
/// </list>
/// </summary>
public interface IPacsExportedFkManifestSource
{
    /// <summary>
    /// Reads and validates the manifest. Returns the parsed
    /// manifest, or <c>null</c> when no manifest is configured.
    /// Throws on parse / validation failure.
    /// </summary>
    Task<PacsExportedFkManifest?> ReadAsync(CancellationToken ct);
}
