using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C54-MULTI-B: read-only set of catalog instances keyed by
/// the <see cref="PacsCatalogIdentity"/> composite primary key
/// <c>(CountyId, SourceConnectionId)</c>. Per the C54-MULTI-A policy
/// (`docs/sync/pacs-schema-multi-county-catalog-policy.md`), the set
/// has NO implicit-default surface — every consumer MUST pass an
/// explicit identity to look up a catalog.
///
/// <para>HG3 read-only at runtime: the set is built once at startup
/// and never mutates. HG7 fail-closed: missing identities surface
/// via typed <see cref="PacsSchemaLookupResult{T}"/> Miss results,
/// never null, never silent fallback.</para>
///
/// <para>Per ISOL-3 there is NO stale-active fallback. A miss is
/// a miss; consumers branch deterministically on
/// <see cref="PacsSchemaLookupResult{T}.HasValue"/>.</para>
/// </summary>
public interface IPacsSchemaCatalogSet
{
    /// <summary>
    /// Returns the catalog instance for the given identity. Returns
    /// a typed Miss result with reason <c>"not-found"</c> when no
    /// matching instance is registered. Never returns null; never
    /// throws on a clean miss.
    /// </summary>
    /// <param name="countyId">Operator county identifier; non-empty.</param>
    /// <param name="sourceConnectionId">
    /// Source connection identifier; non-empty.
    /// </param>
    PacsSchemaLookupResult<IPacsSchemaCatalog> TryGetCatalog(
        string countyId,
        string sourceConnectionId);

    /// <summary>
    /// All catalog instances in the set. Read-only; safe to
    /// enumerate concurrently. Order is stable across calls but
    /// not guaranteed to match registration order.
    /// </summary>
    IReadOnlyCollection<IPacsSchemaCatalog> Catalogs { get; }

    /// <summary>
    /// All registered identities in the set. Diagnostic surface
    /// for "what catalogs am I holding?" queries.
    /// </summary>
    IReadOnlyCollection<PacsCatalogIdentity> Identities { get; }
}
