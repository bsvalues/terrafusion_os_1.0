using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C50-CONV-B: operator-curated manifest declaring per-table
/// and per-column conversion era for the PACS schema catalog.
///
/// <para>The manifest is the implementation of the C50-CONV-A
/// policy (`docs/sync/pacs-schema-conversion-manifest-policy.md`).
/// It does NOT introduce a new <see cref="PacsConversionEra"/>
/// enum — the C48-B enum (Unknown / Pre2017 / Post2017 / Both) is
/// the binding shape per the C50-CONV-A1 corrigendum.</para>
///
/// <para>Per HG-CONV-1: there is no auto-discovery, no glob, no
/// heuristic. The catalog reads conversion-era only from this
/// operator-supplied manifest at an explicitly-configured path.</para>
///
/// <para>Per HG-CONV-2: <see cref="PacsConversionEra.Unknown"/> is
/// a sentinel. It MUST NOT appear as the era of any
/// <see cref="PacsConversionTableEntry"/> or
/// <see cref="PacsConversionColumnEntry"/>; the manifest loader
/// fails closed if it does. Un-annotated catalog items receive
/// <see cref="PacsConversionEra.Unknown"/> when a manifest IS
/// engaged, never any silent default.</para>
///
/// <para>Per HG-CONV-3: catalog-build callers MUST decide
/// explicitly whether to require a manifest via
/// <see cref="LivePacsSchemaSourceOptions.RequireConversionManifest"/>.
/// There is no defaulted-on-omission engagement. For backwards
/// compatibility with C48-B / C49-FK call sites that have not
/// engaged the manifest layer yet (no path configured), the
/// catalog continues to apply the C48-B default
/// (<see cref="PacsConversionEra.Both"/>); engaging the manifest
/// path triggers strict HG-CONV-2/3 behavior. Tightening the
/// default is deferred to a future C50-CONV-B-FOLLOWUP slice.</para>
/// </summary>
/// <param name="ManifestPath">
/// Source path the manifest was loaded from. HG6 source-traceable;
/// surfaces in the catalog version's
/// <c>ConversionManifestHash</c> stamp.
/// </param>
/// <param name="ManifestVersion">
/// Operator-controlled semver-shaped string. Used for
/// version-stamp / HG4 surfaces; not parsed for ordering.
/// </param>
/// <param name="ConversionEvent">
/// Free-text identifier for the conversion event the manifest
/// describes (e.g. <c>"Benton-2017-Harris-PACS-9.0-conversion"</c>).
/// </param>
/// <param name="TableEntries">
/// Operator-declared per-table era assignments. Order is preserved
/// for diagnostic surfaces; lookup is by table name (case-sensitive,
/// per Harris PACS catalog ordinal-stable convention).
/// </param>
/// <param name="ColumnEntries">
/// Operator-declared per-column era assignments. A column entry
/// overrides the parent table's era assignment (or the absence of
/// one).
/// </param>
public sealed record PacsConversionManifest(
    string ManifestPath,
    string ManifestVersion,
    string ConversionEvent,
    IReadOnlyList<PacsConversionTableEntry> TableEntries,
    IReadOnlyList<PacsConversionColumnEntry> ColumnEntries);

/// <summary>
/// Slice C50-CONV-B: per-table conversion-era assignment from the
/// manifest. <see cref="Era"/> MUST be Pre2017, Post2017, or Both;
/// Unknown is rejected at load time per HG-CONV-2.
/// </summary>
/// <param name="TableName">PACS table name (case-sensitive match).</param>
/// <param name="Era">Conversion era. Never Unknown.</param>
/// <param name="Reason">
/// Operator-readable rationale for the assignment. Required
/// (non-null, non-empty); the manifest loader rejects empty Reason
/// to keep the audit trail honest.
/// </param>
/// <param name="LastWriteEvidence">
/// Optional path to evidence (e.g. a SQL probe artifact) backing
/// the assignment. Carried verbatim into surfaces that report on
/// the manifest; not validated by the loader.
/// </param>
public sealed record PacsConversionTableEntry(
    string TableName,
    PacsConversionEra Era,
    string Reason,
    string? LastWriteEvidence);

/// <summary>
/// Slice C50-CONV-B: per-column conversion-era assignment from the
/// manifest. <see cref="Era"/> MUST be Pre2017, Post2017, or Both;
/// Unknown is rejected at load time per HG-CONV-2.
/// </summary>
/// <param name="TableName">
/// PACS table name the column belongs to (case-sensitive match).
/// </param>
/// <param name="ColumnName">
/// PACS column name (case-sensitive match).
/// </param>
/// <param name="Era">Conversion era. Never Unknown.</param>
/// <param name="Reason">
/// Operator-readable rationale. Required (non-null, non-empty).
/// </param>
/// <param name="LastWriteEvidence">
/// Optional path to evidence backing the assignment.
/// </param>
public sealed record PacsConversionColumnEntry(
    string TableName,
    string ColumnName,
    PacsConversionEra Era,
    string Reason,
    string? LastWriteEvidence);
