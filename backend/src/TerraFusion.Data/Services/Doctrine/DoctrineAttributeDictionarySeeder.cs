using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: per-universe attribute-dictionary seeder.
///
/// <para>Initial seed is intentionally empty per the design doc
/// §"Out of scope": "initial seed deferred until a profiling drain
/// produces per-universe code distributions". The seeder is wired
/// up so the operator can populate per-universe entries via a
/// future POST endpoint or by editing
/// <see cref="BuildSeedEntries"/> directly.</para>
///
/// <para>Idempotent over deterministic
/// <see cref="TfDoctrineAttributeDictionary.DictionaryRowId"/>.
/// Inserting zero rows is the expected initial outcome.</para>
/// </summary>
public sealed class DoctrineAttributeDictionarySeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrineAttributeDictionarySeeder> _logger;

    public DoctrineAttributeDictionarySeeder(
        TerraFusionDbContext db,
        ILogger<DoctrineAttributeDictionarySeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<int> SeedAsync(CancellationToken cancellationToken = default)
    {
        var seed = BuildSeedEntries();
        if (seed.Count == 0)
        {
            _logger.LogDebug(
                "DoctrineAttributeDictionarySeeder: no entries seeded (initial empty seed); " +
                "operator will populate after profiling drain.");
            return 0;
        }

        var existingIds = await _db.TfDoctrineAttributeDictionaries
            .Select(e => e.DictionaryRowId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var existingSet = new HashSet<Guid>(existingIds);

        var added = 0;
        foreach (var entry in seed)
        {
            if (existingSet.Contains(entry.DictionaryRowId)) continue;
            _db.TfDoctrineAttributeDictionaries.Add(entry);
            added++;
        }

        if (added > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation(
                "DoctrineAttributeDictionarySeeder: inserted {Added} entries; existing {Existing}",
                added, existingSet.Count);
        }

        return added;
    }

    /// <summary>
    /// Empty by design. Tighten by adding deterministic-GUID
    /// entries here once a profiling drain produces per-universe
    /// code distributions; or the operator can drive population
    /// through a future admin endpoint.
    /// </summary>
    private static IReadOnlyList<TfDoctrineAttributeDictionary> BuildSeedEntries() =>
        Array.Empty<TfDoctrineAttributeDictionary>();
}
