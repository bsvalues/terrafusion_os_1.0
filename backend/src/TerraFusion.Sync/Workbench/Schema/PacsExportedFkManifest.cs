using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C52-OVR-B: operator-curated manifest declaring Exported-
/// confidence FK edges for the PACS schema catalog.
///
/// <para>The manifest is the implementation of the C52-OVR-A policy
/// (`docs/sync/pacs-schema-exported-fk-override-manifest-policy.md`).
/// It does NOT introduce new FK types — entries are translated into
/// <see cref="PacsForeignKey"/> records with
/// <see cref="PacsForeignKeyConfidence.Exported"/> and
/// <see cref="PacsForeignKeySource.ExportFile"/>.</para>
///
/// <para>Per HG-OVR-1: there is no auto-discovery, no glob, no
/// auto-promotion of InferredByName edges. The catalog reads
/// Exported metadata only from this operator-supplied manifest at
/// an explicitly-configured path.</para>
///
/// <para>Per HG-OVR-2: Exported edges NEVER override engine-Declared
/// edges. When a manifest entry shape-matches a Declared edge, the
/// catalog drops the Exported entry; engine reality wins.</para>
///
/// <para>Per HG-OVR-3: catalog-build callers MUST decide explicitly
/// whether to require a manifest via
/// <see cref="LivePacsSchemaSourceOptions.RequireExportedFkManifest"/>.
/// Backwards-compat bridge: when
/// <see cref="LivePacsSchemaSourceOptions.ExportedFkManifestPath"/>
/// is null, the catalog continues to behave exactly as C49-FK-B
/// established.</para>
/// </summary>
/// <param name="ManifestPath">Source path. HG6 source-traceable.</param>
/// <param name="ManifestVersion">Operator-controlled semver-shaped string.</param>
/// <param name="ManifestEvent">
/// Free-text identifier for the promotion pass (e.g.
/// <c>"Benton-2026-FK-promotion-pass-1"</c>).
/// </param>
/// <param name="Edges">Operator-declared FK promotion entries.</param>
public sealed record PacsExportedFkManifest(
    string ManifestPath,
    string ManifestVersion,
    string ManifestEvent,
    IReadOnlyList<PacsExportedFkEntry> Edges);

/// <summary>
/// Slice C52-OVR-B: per-edge entry in an Exported FK manifest.
/// </summary>
/// <param name="ConstraintName">
/// Operator-supplied constraint name. Required (non-null, non-empty).
/// Used as the constraint identifier in the resulting
/// <see cref="PacsForeignKey"/>; must be unique across the manifest.
/// </param>
/// <param name="SourceTable">
/// PACS source table name (case-sensitive match).
/// </param>
/// <param name="SourceColumns">
/// Ordered list of source column names; ordinal-stable. Must have
/// the same arity as <see cref="TargetColumns"/>.
/// </param>
/// <param name="TargetTable">
/// PACS target table name (case-sensitive match).
/// </param>
/// <param name="TargetColumns">
/// Ordered list of target column names; ordinal-stable.
/// </param>
/// <param name="Reason">
/// Operator-readable rationale. Required (non-null, non-empty).
/// </param>
/// <param name="AuditedBy">
/// Optional operator name / signature for audit posture.
/// </param>
/// <param name="AuditedOnUtc">
/// Optional ISO-8601 UTC timestamp string carried verbatim.
/// </param>
public sealed record PacsExportedFkEntry(
    string ConstraintName,
    string SourceTable,
    IReadOnlyList<string> SourceColumns,
    string TargetTable,
    IReadOnlyList<string> TargetColumns,
    string Reason,
    string? AuditedBy,
    string? AuditedOnUtc);
