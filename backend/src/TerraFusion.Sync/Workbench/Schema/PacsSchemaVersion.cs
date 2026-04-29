using System;
using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: version stamp for one materialized
/// <c>pacs_schema_catalog</c>. Per
/// <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c> Hard Guard 4
/// (HG4 Versioned), two catalogs of differing
/// <see cref="PacsSchemaVersion"/> MUST NOT be silently interchanged.
/// Readers that pin to a specific version fail closed when run
/// against a different one.
///
/// <para>Future canonical landing rows MAY pin
/// <see cref="PacsSchemaVersion"/> alongside <c>SourceWorkbookId</c>
/// for full provenance — this is an open question deferred from
/// C48-A.</para>
/// </summary>
/// <param name="TylerRelease">
/// Tyler release identifier when discoverable from the schema source
/// (e.g. <c>"PACS 9.0.4.2"</c>); <c>null</c> when not declared. The
/// catalog does NOT infer Tyler release from filenames or partial
/// content.
/// </param>
/// <param name="SourceFileHashes">
/// Map of source-file path to SHA-256 digest. Two catalogs ingested
/// from byte-identical source files share this map; any drift in
/// any source file produces a different version.
/// </param>
/// <param name="IngestedAt">
/// UTC timestamp at which the catalog was constructed. Used as a
/// tiebreaker when source-file hashes match across builds.
/// </param>
/// <param name="ConversionManifestHash">
/// SHA-256 digest of the 2017 conversion manifest that was paired
/// with this version. Required by HG5; if no manifest is supplied,
/// the source MUST surface this explicitly (the catalog records the
/// well-known empty-manifest sentinel hash).
/// </param>
public sealed record PacsSchemaVersion(
    string? TylerRelease,
    IReadOnlyDictionary<string, string> SourceFileHashes,
    DateTime IngestedAt,
    string ConversionManifestHash);
