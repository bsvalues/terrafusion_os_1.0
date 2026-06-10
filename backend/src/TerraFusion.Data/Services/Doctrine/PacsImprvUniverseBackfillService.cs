using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V5: default
/// <see cref="IPacsImprvUniverseBackfillService"/> implementation.
///
/// <para>Process per call:</para>
/// <list type="number">
///   <item>Snapshot the active rule-id set so we can detect rows
///   carrying stale (inactive) UniverseRuleId values.</item>
///   <item>Page through <c>truth_pacs.imprv_current</c> rows that
///   match the request scope.</item>
///   <item>For each page: load property + property_val + land_detail
///   for the page's prop_ids, run the classifier, compute the new
///   universe value, compare to the old one, UPDATE if changed.</item>
///   <item>Aggregate transitions for audit; return.</item>
/// </list>
///
/// <para>Service is registered Scoped because it uses
/// <see cref="TerraFusionDbContext"/>. The classifier dependency
/// is Singleton.</para>
/// </summary>
public sealed class PacsImprvUniverseBackfillService : IPacsImprvUniverseBackfillService
{
    private const int PageSize = 500;
    private const string DefaultCountyTag = "benton-wa";
    private static readonly DateTime LegacyMarkerCutoff =
        new(2017, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;
    private readonly IPropertyUniverseClassifier _classifier;
    private readonly ILogger<PacsImprvUniverseBackfillService> _logger;

    public PacsImprvUniverseBackfillService(
        TerraFusionDbContext db,
        IPropertyUniverseClassifier classifier,
        ILogger<PacsImprvUniverseBackfillService> logger)
    {
        _db = db;
        _classifier = classifier;
        _logger = logger;
    }

    public async Task<ImprvUniverseBackfillResult> BackfillAsync(
        ImprvUniverseBackfillRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Snapshot the active rule ids so we can detect "stale"
            // (rows whose UniverseRuleId is no longer active) — the
            // V2-deactivated V1 GUIDs are the canonical example.
            var activeRuleIds = await _db.TfDoctrinePropertyUniverses
                .Where(r => r.County == request.County && r.ActiveFlag)
                .Select(r => r.RuleId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var activeSet = new HashSet<Guid>(activeRuleIds);

            // Build the candidate query.
            var query = _db.TruthPacsImprvCurrents.AsQueryable();
            if (request.OnlyNullUniverse)
            {
                query = query.Where(t => t.UniverseCode == null);
            }
            // We can't easily express "ruleId not in active set" in
            // SQL because the active set lives in memory. Solution:
            // pull rows with NULL UniverseCode OR with a non-null
            // UniverseRuleId; filter the active-rule case in code.
            else
            {
                query = query.Where(t =>
                    t.UniverseCode == null
                    || t.UniverseRuleId == null
                    || (t.UniverseRuleId != null && true));  // expanded below
            }

            query = query.OrderBy(t => t.PromotedAt);
            if (request.MaxRows.HasValue) query = query.Take(request.MaxRows.Value);

            var allCandidates = await query.ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            // Filter in memory: keep rows whose universe is null OR
            // whose UniverseRuleId is non-null but not in the active set.
            // (When OnlyNullUniverse=true the EF clause already filtered.)
            var candidates = request.OnlyNullUniverse
                ? allCandidates
                : allCandidates.Where(t =>
                    t.UniverseCode == null
                    || (t.UniverseRuleId.HasValue && !activeSet.Contains(t.UniverseRuleId.Value))
                  ).ToList();

            var rowsScanned = candidates.Count;
            var rowsUnchanged = 0;
            var rowsUpdated = 0;
            var rowsCouldNotClassify = 0;
            var transitions = new Dictionary<string, int>(StringComparer.Ordinal);

            // Page through candidates so the property / property_val /
            // land_detail lookups stay bounded in memory.
            for (var offset = 0; offset < candidates.Count; offset += PageSize)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var page = candidates.Skip(offset).Take(PageSize).ToList();
                var pagePropIds = page.Select(t => t.PropId).Distinct().ToList();

                // Load classifier inputs for the page.
                var properties = await _db.LegacyPacsRawProperties
                    .Where(p => pagePropIds.Contains(p.PropId))
                    .Select(p => new { p.PropId, p.PropTypeCd, p.PropCreateDt, p.LandedAt })
                    .ToListAsync(cancellationToken).ConfigureAwait(false);
                var latestPropertyByPropId = properties
                    .GroupBy(p => p.PropId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(p => p.LandedAt).First());

                var propertyVals = await _db.LegacyPacsRawPropertyVals
                    .Where(pv => pagePropIds.Contains(pv.PropId))
                    .Select(pv => new { pv.PropId, pv.PropValYr, pv.SupNum,
                                        pv.PropertyUseCd, pv.LandedAt })
                    .ToListAsync(cancellationToken).ConfigureAwait(false);
                var propertyUseCdByKey = propertyVals
                    .GroupBy(pv => (pv.PropId, pv.PropValYr, pv.SupNum))
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(pv => pv.LandedAt).First().PropertyUseCd);

                var landDetails = await _db.LegacyPacsRawLandDetails
                    .Where(l => pagePropIds.Contains(l.PropId))
                    .Select(l => new { l.PropId, l.PropValYr, l.AgApply, l.AgUseCd, l.LandedAt })
                    .ToListAsync(cancellationToken).ConfigureAwait(false);
                var agSignalByKey = new Dictionary<(int PropId, short PropValYr),
                    (string? AgApply, string? AgUseCd)>();
                foreach (var grp in landDetails.GroupBy(l => (l.PropId, l.PropValYr)))
                {
                    var rows = grp.OrderByDescending(l => l.LandedAt).ToList();
                    var anyT = rows.Any(r =>
                        !string.IsNullOrEmpty(r.AgApply) &&
                        (r.AgApply.Equals("T", StringComparison.OrdinalIgnoreCase) ||
                         r.AgApply.Equals("Y", StringComparison.OrdinalIgnoreCase)));
                    var anyF = rows.Any(r =>
                        !string.IsNullOrEmpty(r.AgApply) &&
                        (r.AgApply.Equals("F", StringComparison.OrdinalIgnoreCase) ||
                         r.AgApply.Equals("N", StringComparison.OrdinalIgnoreCase)));
                    var agApply = anyT ? "T" : (anyF ? "F" : (string?)null);
                    var agUseCd = rows
                        .Where(r =>
                            !string.IsNullOrEmpty(r.AgApply) &&
                            (r.AgApply.Equals("T", StringComparison.OrdinalIgnoreCase) ||
                             r.AgApply.Equals("Y", StringComparison.OrdinalIgnoreCase)) &&
                            !string.IsNullOrEmpty(r.AgUseCd))
                        .Select(r => r.AgUseCd)
                        .FirstOrDefault()
                        ?? rows.Select(r => r.AgUseCd).FirstOrDefault(c => !string.IsNullOrEmpty(c));
                    agSignalByKey[grp.Key] = (agApply, agUseCd);
                }

                // Per-row classification.
                foreach (var truth in page)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    if (!latestPropertyByPropId.TryGetValue(truth.PropId, out var property))
                    {
                        rowsCouldNotClassify++;
                        Bump(transitions, $"{truth.UniverseCode ?? "(null)"} → could-not-classify");
                        continue;
                    }

                    var hasLegacyMarker = property.PropCreateDt.HasValue
                        && property.PropCreateDt.Value < LegacyMarkerCutoff;
                    propertyUseCdByKey.TryGetValue(
                        (truth.PropId, truth.PropValYr, truth.SupNum), out var propertyUseCd);
                    agSignalByKey.TryGetValue((truth.PropId, truth.PropValYr), out var agSignal);

                    var input = new UniverseClassifierInput(
                        County: request.County,
                        PropValYr: truth.PropValYr,
                        PropTypeCd: property.PropTypeCd,
                        PropertyUseCd: propertyUseCd,
                        AgApply: agSignal.AgApply,
                        AgUseCd: agSignal.AgUseCd,
                        HasLegacyMarker: hasLegacyMarker);

                    var classification = await _classifier.ClassifyAsync(input, cancellationToken)
                        .ConfigureAwait(false);

                    var oldUniverse = truth.UniverseCode ?? "(null)";
                    var newUniverse = classification.UniverseCode;

                    if (string.Equals(oldUniverse, newUniverse, StringComparison.Ordinal)
                        && truth.UniverseRuleId == classification.RuleId)
                    {
                        rowsUnchanged++;
                        Bump(transitions, $"{oldUniverse} → unchanged");
                        continue;
                    }

                    Bump(transitions, $"{oldUniverse} → {newUniverse}");

                    if (!request.DryRun)
                    {
                        truth.UniverseCode = classification.UniverseCode;
                        truth.UniverseRuleId = classification.RuleId;
                        truth.UniverseConfidence = classification.Confidence;
                        truth.UniverseReason = classification.Reason;
                        rowsUpdated++;
                    }
                    else
                    {
                        // Dry-run: count what would have updated.
                        rowsUpdated++;
                    }
                }

                if (!request.DryRun)
                    await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            _logger.LogInformation(
                "[Backfill:imprv-universe] county={County} dryRun={DryRun} scanned={Scanned} updated={Updated} unchanged={Unchanged} couldNotClassify={CouldNot}",
                request.County, request.DryRun, rowsScanned, rowsUpdated, rowsUnchanged, rowsCouldNotClassify);

            return new ImprvUniverseBackfillResult
            {
                Status = "COMPLETED",
                DryRun = request.DryRun,
                RowsScanned = rowsScanned,
                RowsUnchanged = rowsUnchanged,
                RowsUpdated = rowsUpdated,
                RowsCouldNotClassify = rowsCouldNotClassify,
                Transitions = transitions,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "[Backfill:imprv-universe] FAILED for county {County}", request.County);
            return new ImprvUniverseBackfillResult
            {
                Status = "FAILED",
                DryRun = request.DryRun,
                RowsScanned = 0,
                RowsUnchanged = 0,
                RowsUpdated = 0,
                RowsCouldNotClassify = 0,
                Transitions = new Dictionary<string, int>(),
                ErrorSummary = $"{ex.GetType().Name}: {ex.Message}",
            };
        }
    }

    public async Task<CanonicalUniverseBackfillResult> BackfillCanonicalAsync(
        CanonicalUniverseBackfillRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Load all canonical improvement rows. Bound by MaxRows.
            var canonicalQuery = _db.TfImprovements.AsQueryable();
            if (request.MaxRows.HasValue)
                canonicalQuery = canonicalQuery.Take(request.MaxRows.Value);
            var canonicals = await canonicalQuery.ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            if (canonicals.Count == 0)
            {
                return new CanonicalUniverseBackfillResult
                {
                    Status = "COMPLETED",
                    DryRun = request.DryRun,
                    CanonicalRowsScanned = 0,
                    CanonicalRowsUpdated = 0,
                    CanonicalRowsAlreadyMatched = 0,
                    CanonicalRowsWithoutTruth = 0,
                    Transitions = new Dictionary<string, int>(),
                };
            }

            var canonicalIds = canonicals.Select(c => c.TfImprovementId).ToList();

            // Pre-fetch SourceXrefs for all canonical rows in one query.
            var xrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == "improvement"
                            && canonicalIds.Contains(x.TfEntityId))
                .Select(x => new { x.TfEntityId, x.SourceKeyJson })
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // Parse SourceKeyJson into 4-keys, indexed by canonical id.
            var keyByCanonical = new Dictionary<Guid, (int PropId, short PropValYr, short SupNum, long ImprvId)>();
            foreach (var x in xrefs)
            {
                if (TryParseImprvKey(x.SourceKeyJson, out var key))
                    keyByCanonical[x.TfEntityId] = key;
            }

            // Pre-fetch all truth rows for the relevant prop_ids in one query,
            // then index by 4-key (latest PromotedAt wins on duplicates).
            var imprvPropIds = keyByCanonical.Values.Select(k => k.PropId).Distinct().ToList();
            var truthRows = await _db.TruthPacsImprvCurrents
                .Where(t => imprvPropIds.Contains(t.PropId))
                .Select(t => new
                {
                    t.PropId, t.PropValYr, t.SupNum, t.ImprvId,
                    t.UniverseCode, t.UniverseRuleId,
                    t.UniverseConfidence, t.UniverseReason,
                    t.PromotedAt,
                })
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var truthByKey = truthRows
                .GroupBy(t => (t.PropId, t.PropValYr, t.SupNum, t.ImprvId))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(t => t.PromotedAt).First());

            var scanned = 0;
            var updated = 0;
            var alreadyMatched = 0;
            var withoutTruth = 0;
            var transitions = new Dictionary<string, int>(StringComparer.Ordinal);

            foreach (var canonical in canonicals)
            {
                cancellationToken.ThrowIfCancellationRequested();
                scanned++;

                if (!keyByCanonical.TryGetValue(canonical.TfImprovementId, out var key))
                {
                    // No SourceXref for this canonical row — should not
                    // happen per the canonical-imprv-source-xref-coverage
                    // gate, but be defensive.
                    withoutTruth++;
                    continue;
                }

                if (!truthByKey.TryGetValue(key, out var truth))
                {
                    // SourceXref points to a truth row that no longer
                    // exists (e.g. the prop_id was removed from PACS).
                    // Treat as orphan; don't touch the canonical row.
                    withoutTruth++;
                    continue;
                }

                // Already matched?
                if (string.Equals(canonical.UniverseCode, truth.UniverseCode, StringComparison.Ordinal)
                    && canonical.UniverseRuleId == truth.UniverseRuleId)
                {
                    alreadyMatched++;
                    continue;
                }

                var oldU = canonical.UniverseCode ?? "(null)";
                var newU = truth.UniverseCode ?? "(null)";
                Bump(transitions, $"{oldU} → {newU}");

                if (!request.DryRun)
                {
                    canonical.UniverseCode = truth.UniverseCode;
                    canonical.UniverseRuleId = truth.UniverseRuleId;
                    canonical.UniverseConfidence = truth.UniverseConfidence;
                    canonical.UniverseReason = truth.UniverseReason;
                    canonical.UpdatedAt = DateTime.UtcNow;
                }
                updated++;
            }

            if (!request.DryRun)
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "[Backfill:imprv-universe-canonical] dryRun={DryRun} scanned={Scanned} updated={Updated} alreadyMatched={Matched} withoutTruth={NoTruth}",
                request.DryRun, scanned, updated, alreadyMatched, withoutTruth);

            return new CanonicalUniverseBackfillResult
            {
                Status = "COMPLETED",
                DryRun = request.DryRun,
                CanonicalRowsScanned = scanned,
                CanonicalRowsUpdated = updated,
                CanonicalRowsAlreadyMatched = alreadyMatched,
                CanonicalRowsWithoutTruth = withoutTruth,
                Transitions = transitions,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "[Backfill:imprv-universe-canonical] FAILED");
            return new CanonicalUniverseBackfillResult
            {
                Status = "FAILED",
                DryRun = request.DryRun,
                CanonicalRowsScanned = 0,
                CanonicalRowsUpdated = 0,
                CanonicalRowsAlreadyMatched = 0,
                CanonicalRowsWithoutTruth = 0,
                Transitions = new Dictionary<string, int>(),
                ErrorSummary = $"{ex.GetType().Name}: {ex.Message}",
            };
        }
    }

    /// <summary>
    /// Parse the canonical projector's SourceKeyJson shape — emitted as
    /// `{"prop_id":..., "prop_val_yr":..., "sup_num":..., "imprv_id":...}`
    /// per <c>PacsImprvCanonicalProjector</c>.
    /// </summary>
    private static bool TryParseImprvKey(
        string sourceKeyJson,
        out (int PropId, short PropValYr, short SupNum, long ImprvId) key)
    {
        key = default;
        if (string.IsNullOrEmpty(sourceKeyJson)) return false;

        try
        {
            using var doc = JsonDocument.Parse(sourceKeyJson);
            var root = doc.RootElement;
            if (!root.TryGetProperty("prop_id", out var pidEl)) return false;
            if (!root.TryGetProperty("prop_val_yr", out var yrEl)) return false;
            if (!root.TryGetProperty("sup_num", out var supEl)) return false;
            if (!root.TryGetProperty("imprv_id", out var imprvEl)) return false;

            key = (
                pidEl.GetInt32(),
                (short)yrEl.GetInt32(),
                (short)supEl.GetInt32(),
                imprvEl.GetInt64());
            return true;
        }
        catch (JsonException) { return false; }
    }

    private static void Bump(Dictionary<string, int> map, string key) =>
        map[key] = map.TryGetValue(key, out var c) ? c + 1 : 1;
}
