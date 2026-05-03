using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C54-MULTI-B: default <see cref="IPacsSchemaCatalogSet"/>
/// implementation. Backed by an immutable dictionary keyed by the
/// <c>(CountyId, SourceConnectionId)</c> composite primary key.
/// Constructed via <see cref="BuildAsync"/> from a list of
/// <see cref="PacsCatalogSetEntry"/> records, where each entry
/// pairs a catalog source with the identity-input the operator
/// declares for it.
///
/// <para>Per the C54-MULTI-A policy, the set:</para>
/// <list type="bullet">
/// <item>Is built once at startup (HG3 read-only).</item>
/// <item>Refuses duplicate primary keys at build time.</item>
/// <item>Refuses two entries declaring the same manifest path
/// unless every entry in the colliding group has
/// <see cref="PacsCatalogSetEntry.AllowSharedManifestPath"/> set
/// to <c>true</c> (ISOL-1 explicit-allow gate).</item>
/// <item>Runs <see cref="PacsSchemaCatalog.BuildAsync"/>
/// independently for each entry so each catalog gets its own
/// engine pass + invariant report (ISOL-4).</item>
/// </list>
/// </summary>
public sealed class PacsSchemaCatalogSet : IPacsSchemaCatalogSet
{
    private readonly IReadOnlyDictionary<(string CountyId, string SourceConnectionId), IPacsSchemaCatalog> _byKey;
    private readonly IReadOnlyCollection<PacsCatalogIdentity> _identities;

    private PacsSchemaCatalogSet(
        IReadOnlyDictionary<(string, string), IPacsSchemaCatalog> byKey,
        IReadOnlyCollection<PacsCatalogIdentity> identities)
    {
        _byKey = byKey;
        _identities = identities;
    }

    /// <inheritdoc />
    public PacsSchemaLookupResult<IPacsSchemaCatalog> TryGetCatalog(
        string countyId,
        string sourceConnectionId)
    {
        if (string.IsNullOrEmpty(countyId) || string.IsNullOrEmpty(sourceConnectionId))
        {
            return PacsSchemaLookupResult<IPacsSchemaCatalog>.Miss(
                PacsSchemaLookupResult<IPacsSchemaCatalog>.ReasonNotFound);
        }

        return _byKey.TryGetValue((countyId, sourceConnectionId), out var catalog)
            ? PacsSchemaLookupResult<IPacsSchemaCatalog>.Found(catalog)
            : PacsSchemaLookupResult<IPacsSchemaCatalog>.Miss(
                PacsSchemaLookupResult<IPacsSchemaCatalog>.ReasonNotFound);
    }

    /// <inheritdoc />
    public IReadOnlyCollection<IPacsSchemaCatalog> Catalogs =>
        (IReadOnlyCollection<IPacsSchemaCatalog>)_byKey.Values;

    /// <inheritdoc />
    public IReadOnlyCollection<PacsCatalogIdentity> Identities => _identities;

    /// <summary>
    /// Builds a catalog set from a list of
    /// <see cref="PacsCatalogSetEntry"/> records. Runs
    /// <see cref="PacsSchemaCatalog.BuildAsync"/> independently for
    /// each entry; refuses duplicate primary keys; refuses shared
    /// manifest paths unless every colliding entry has
    /// <see cref="PacsCatalogSetEntry.AllowSharedManifestPath"/>
    /// set to <c>true</c>.
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="entries"/> is null.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="entries"/> is empty, or any entry has empty
    /// CountyId / SourceConnectionId.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// Two entries share the same primary key, or two entries share
    /// a manifest path without both setting
    /// AllowSharedManifestPath, or any catalog's BuildAsync throws.
    /// </exception>
    public static async Task<PacsSchemaCatalogSet> BuildAsync(
        IReadOnlyList<PacsCatalogSetEntry> entries,
        CancellationToken ct)
    {
        if (entries is null) throw new ArgumentNullException(nameof(entries));
        if (entries.Count == 0)
            throw new ArgumentException("Catalog set must contain at least one entry.", nameof(entries));

        // Validate identity components and primary-key uniqueness.
        var seenKeys = new HashSet<(string, string)>();
        for (int i = 0; i < entries.Count; i++)
        {
            var e = entries[i];
            if (e is null)
                throw new ArgumentException($"Entry at index {i} is null.", nameof(entries));
            if (string.IsNullOrWhiteSpace(e.CountyId))
                throw new ArgumentException($"Entry at index {i} has empty CountyId.", nameof(entries));
            if (string.IsNullOrWhiteSpace(e.SourceConnectionId))
                throw new ArgumentException($"Entry at index {i} has empty SourceConnectionId.", nameof(entries));
            if (e.Source is null)
                throw new ArgumentException($"Entry at index {i} has null Source.", nameof(entries));

            var key = (e.CountyId, e.SourceConnectionId);
            if (!seenKeys.Add(key))
            {
                throw new InvalidOperationException(
                    $"[PacsSchemaCatalogSet] Duplicate catalog identity primary key: " +
                    $"({e.CountyId}, {e.SourceConnectionId}). Two entries cannot share " +
                    $"the same (CountyId, SourceConnectionId) per the C54-MULTI-A policy.");
            }
        }

        // ISOL-1 manifest-path collision check: if two entries
        // declare the same path AND not every colliding entry has
        // AllowSharedManifestPath=true, throw.
        var pathsByEntry = new List<(int Index, string Path, bool Allow)>();
        for (int i = 0; i < entries.Count; i++)
        {
            var e = entries[i];
            if (e.ManifestPaths is null) continue;
            foreach (var p in e.ManifestPaths)
            {
                if (string.IsNullOrWhiteSpace(p)) continue;
                pathsByEntry.Add((i, p, e.AllowSharedManifestPath));
            }
        }

        var pathGroups = pathsByEntry
            .GroupBy(t => t.Path, StringComparer.Ordinal)
            .Where(g => g.Count() > 1);
        foreach (var g in pathGroups)
        {
            // All entries in the colliding group must allow sharing.
            if (g.Any(t => !t.Allow))
            {
                var indices = string.Join(", ", g.Select(t => t.Index));
                throw new InvalidOperationException(
                    $"[PacsSchemaCatalogSet] Manifest path '{g.Key}' is declared by entries [{indices}] " +
                    $"but at least one of them did not set AllowSharedManifestPath=true. " +
                    $"ISOL-1 (C54-MULTI-A) refuses cross-county manifest reuse without explicit per-pair allow flag.");
            }
        }

        // Build each catalog independently. Failure of one entry
        // surfaces as InvalidOperationException with a wrapping note
        // naming the failing identity.
        var byKey = new Dictionary<(string, string), IPacsSchemaCatalog>();
        var identities = new List<PacsCatalogIdentity>();
        foreach (var e in entries)
        {
            IPacsSchemaCatalog catalog;
            try
            {
                catalog = await PacsSchemaCatalog.BuildAsync(e.Source, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"[PacsSchemaCatalogSet] BuildAsync failed for catalog identity " +
                    $"({e.CountyId}, {e.SourceConnectionId}): {ex.Message}",
                    ex);
            }

            byKey[(e.CountyId, e.SourceConnectionId)] = catalog;
            identities.Add(PacsCatalogIdentity.DeriveFromCatalog(
                e.CountyId, e.SourceConnectionId, catalog));
        }

        return new PacsSchemaCatalogSet(byKey, identities);
    }
}

/// <summary>
/// Slice C54-MULTI-B: one entry in a
/// <see cref="PacsSchemaCatalogSet"/> build configuration. Pairs a
/// catalog source with the operator-declared identity components
/// and an optional manifest-path declaration for ISOL-1 collision
/// checks.
/// </summary>
/// <param name="CountyId">
/// Operator county identifier (e.g. <c>"WA-Benton"</c>); non-empty.
/// </param>
/// <param name="SourceConnectionId">
/// Source connection identifier; non-empty.
/// </param>
/// <param name="Source">
/// The catalog source. Will be passed to
/// <see cref="PacsSchemaCatalog.BuildAsync"/> by the catalog set
/// builder.
/// </param>
/// <param name="ManifestPaths">
/// Optional set of manifest paths the source's options carry
/// (conversion manifest, PII manifest, exported FK manifest). Used
/// by the catalog set builder for ISOL-1 cross-entry collision
/// detection. Pass <c>null</c> or empty to skip the check.
/// </param>
/// <param name="AllowSharedManifestPath">
/// When <c>true</c>, this entry consents to sharing manifest paths
/// with other entries (ISOL-1 explicit allow). Per policy, two
/// entries colliding on a manifest path must BOTH set this flag
/// for the build to proceed.
/// </param>
public sealed record PacsCatalogSetEntry(
    string CountyId,
    string SourceConnectionId,
    IPacsSchemaSource Source,
    IReadOnlySet<string>? ManifestPaths = null,
    bool AllowSharedManifestPath = false);
