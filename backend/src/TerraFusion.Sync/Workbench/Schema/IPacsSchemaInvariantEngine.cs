using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C53-CONS-B: invariant engine that evaluates the C53-CONS-A
/// invariant set against catalog metadata and produces a
/// <see cref="PacsSchemaInvariantReport"/>.
///
/// <para>The engine is a pure function over the catalog data —
/// no I/O, no mutation. Per the C53-CONS-A policy, the engine
/// runs at catalog-build time and (per HG7 fail-closed) the
/// catalog build aborts when any Error row appears in the report.</para>
///
/// <para>Existing per-slice integrity checks remain in place as a
/// backstop; the engine is additive. C53-CONS-C may consolidate
/// those checks into the engine in a future slice.</para>
///
/// <para>This C53-CONS-B implementation evaluates catalog-only
/// invariant categories (TBL-*, COL-*, DICT-*, FK-*). Manifest
/// categories (CONV-*, PII-*, OVR-*, XREF-*) and the Advisory tier
/// are deferred to C53-CONS-C; the engine produces zero rows for
/// those codes today.</para>
/// </summary>
public interface IPacsSchemaInvariantEngine
{
    /// <summary>
    /// Evaluate the invariant set against the supplied catalog
    /// data. Returns a report (zero Error rows on a clean catalog).
    /// </summary>
    /// <param name="tables">All catalog tables.</param>
    /// <param name="columns">All catalog columns.</param>
    /// <param name="dictionaries">All catalog dictionaries.</param>
    /// <param name="suppressInvariants">
    /// Optional set of invariant codes to demote one severity level
    /// (Error → Warning, Warning → Advisory). Codes not in the set
    /// run at their declared severity. <c>null</c> means no
    /// suppression.
    /// </param>
    PacsSchemaInvariantReport Evaluate(
        IReadOnlyList<PacsTable> tables,
        IReadOnlyList<PacsColumn> columns,
        IReadOnlyList<PacsDictionary> dictionaries,
        IReadOnlySet<string>? suppressInvariants);
}
