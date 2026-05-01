using System;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C54-MULTI-C: audit-trail record produced by
/// <see cref="PacsCatalogManifestSharingHelper"/> when an operator
/// shares a manifest from one catalog identity to another.
///
/// <para>The receipt is the operator's proof that the share happened
/// deliberately at a specific moment. It carries enough information
/// to reconstruct what was copied, where, and from which source —
/// without holding the manifest content itself (HG1 PII-free
/// applies: receipts are metadata).</para>
/// </summary>
/// <param name="ManifestKind">
/// Which manifest family this receipt is for: <c>"conversion"</c>,
/// <c>"pii"</c>, or <c>"exported-fk"</c>. Stable string values
/// callers may switch on.
/// </param>
/// <param name="SourcePath">
/// Absolute path to the original manifest file (the one being
/// shared FROM). Verbatim from the operator's input.
/// </param>
/// <param name="TargetPath">
/// Absolute path the manifest was copied TO. Verbatim from the
/// operator's input.
/// </param>
/// <param name="SourceSha256">
/// SHA-256 hex digest of the source manifest's bytes at copy time.
/// Lowercase hex; 64 chars.
/// </param>
/// <param name="TargetSha256">
/// SHA-256 hex digest of the target manifest's bytes immediately
/// after copy. Per ISOL-1 the operator may choose to revalidate
/// or modify the target before invoking the next catalog build;
/// this hash captures the post-copy / pre-modify state.
/// </param>
/// <param name="SharedAtUtc">UTC timestamp at which the copy completed.</param>
/// <param name="SourceCatalogIdentity">
/// Identity of the catalog the manifest was authored for.
/// </param>
/// <param name="TargetCatalogIdentity">
/// Identity of the catalog the manifest is being shared to. Per
/// the C54-MULTI-A ISOL-1 binding, the operator MUST set
/// <see cref="PacsCatalogSetEntry.AllowSharedManifestPath"/> on
/// the target's catalog-set entry to acknowledge the share — this
/// receipt is the audit record of the act.
/// </param>
public sealed record PacsCatalogManifestShareReceipt(
    string ManifestKind,
    string SourcePath,
    string TargetPath,
    string SourceSha256,
    string TargetSha256,
    DateTime SharedAtUtc,
    PacsCatalogIdentity SourceCatalogIdentity,
    PacsCatalogIdentity TargetCatalogIdentity);
