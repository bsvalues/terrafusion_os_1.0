using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C51-PII-B: operator-curated manifest declaring per-table
/// and per-column PII classifications for the PACS schema catalog.
///
/// <para>The manifest is the implementation of the C51-PII-A policy
/// (`docs/sync/pacs-schema-pii-classification-manifest-policy.md`).
/// It does NOT introduce a new <see cref="PiiClassification"/> enum
/// — the C48-B enum (None / Indirect / Direct) is the binding shape.</para>
///
/// <para>Per HG-PII-1: there is no auto-discovery, no glob, no
/// heuristic. The catalog reads PII metadata only from this
/// operator-supplied manifest at an explicitly-configured path.</para>
///
/// <para>Per HG-PII-2: un-annotated coverage is asserted via
/// <see cref="TableExhaustiveFlags"/>. A table named in that set
/// asserts "every column on this table not in <see cref="ColumnEntries"/>
/// is None"; un-listed tables leave un-annotated columns as None
/// without exhaustiveness assertion. Consumers with stricter stances
/// fail closed for non-exhaustive tables.</para>
///
/// <para>Per HG-PII-3: catalog-build callers MUST decide explicitly
/// whether to require a manifest via
/// <see cref="LivePacsSchemaSourceOptions.RequirePiiManifest"/>.
/// Backwards-compat bridge: when <see cref="LivePacsSchemaSourceOptions.PiiManifestPath"/>
/// is null, the catalog continues to apply the C48-B None default;
/// engaging the manifest path triggers strict HG-PII-2 / 3 behavior.</para>
/// </summary>
/// <param name="ManifestPath">
/// Source path the manifest was loaded from. HG6 source-traceable.
/// </param>
/// <param name="ManifestVersion">
/// Operator-controlled semver-shaped string.
/// </param>
/// <param name="ManifestEvent">
/// Free-text identifier for the tagging pass the manifest describes
/// (e.g. <c>"Benton-2026-PACS-PII-tagging-pass-1"</c>).
/// </param>
/// <param name="TableExhaustiveFlags">
/// Set of table names where the operator asserts the column entries
/// in <see cref="ColumnEntries"/> cover every column on that table —
/// any un-annotated column is None. Per HG-PII-2 the loader MUST
/// validate every name in this set exists in the catalog.
/// </param>
/// <param name="TableEntries">
/// Operator-declared per-table classification assignments.
/// </param>
/// <param name="ColumnEntries">
/// Operator-declared per-column classification assignments. A column
/// entry overrides the parent table's classification (or the
/// absence of one).
/// </param>
public sealed record PacsPiiManifest(
    string ManifestPath,
    string ManifestVersion,
    string ManifestEvent,
    IReadOnlySet<string> TableExhaustiveFlags,
    IReadOnlyList<PacsPiiTableEntry> TableEntries,
    IReadOnlyList<PacsPiiColumnEntry> ColumnEntries);

/// <summary>
/// Slice C51-PII-B: per-table PII classification entry.
/// </summary>
/// <param name="TableName">PACS table name (case-sensitive match).</param>
/// <param name="Classification">
/// PII level. Any value of <see cref="PiiClassification"/> is allowed
/// (None included — the operator may explicitly assert a table is
/// non-PII). The loader does not reject any enum value here.
/// </param>
/// <param name="Reason">
/// Operator-readable rationale. Required (non-null, non-empty);
/// the manifest loader rejects empty Reason for audit-trail integrity.
/// </param>
public sealed record PacsPiiTableEntry(
    string TableName,
    PiiClassification Classification,
    string Reason);

/// <summary>
/// Slice C51-PII-B: per-column PII classification entry.
/// </summary>
/// <param name="TableName">
/// PACS table name the column belongs to (case-sensitive).
/// </param>
/// <param name="ColumnName">PACS column name (case-sensitive).</param>
/// <param name="Classification">PII level.</param>
/// <param name="Reason">
/// Operator-readable rationale. Required (non-null, non-empty).
/// </param>
public sealed record PacsPiiColumnEntry(
    string TableName,
    string ColumnName,
    PiiClassification Classification,
    string Reason);
