using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-1 (B1): default <see cref="IRatioQualificationPolicy"/>
/// implementation backed by <c>doctrine_tf.tf_doctrine_ratio_policy</c>.
///
/// <para>Registered Singleton so the rule cache persists across
/// requests. Because the underlying <c>TerraFusionDbContext</c> is
/// Scoped, this service uses <see cref="IServiceScopeFactory"/> to
/// create a transient scope on first DB read.</para>
///
/// <para>Year-aware lookup: rule with the smallest year window
/// covering <paramref>saleYear</paramref> wins. NULL EffectiveEndYear
/// is treated as +infinity. Ties broken by most-recently-approved
/// (then most-recently-created).</para>
/// </summary>
public sealed class RatioQualificationPolicy : IRatioQualificationPolicy
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RatioQualificationPolicy> _logger;

    // (county, studyName) → rules. ConcurrentDictionary so the
    // Singleton is thread-safe across concurrent requests.
    private readonly ConcurrentDictionary<(string County, string StudyName),
        IReadOnlyList<TfDoctrineRatioPolicy>> _cache = new();

    public RatioQualificationPolicy(
        IServiceScopeFactory scopeFactory,
        ILogger<RatioQualificationPolicy> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<RatioPolicyEvaluation> EvaluateAsync(
        string county,
        string studyName,
        int saleYear,
        string? code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(county))
            throw new ArgumentException("County is required.", nameof(county));
        if (string.IsNullOrWhiteSpace(studyName))
            throw new ArgumentException("StudyName is required.", nameof(studyName));

        var rules = await GetRulesAsync(county, studyName, cancellationToken).ConfigureAwait(false);

        // Filter to rules whose year window covers saleYear.
        // Rank by window narrowness (most-specific wins).
        var match = rules
            .Where(r => saleYear >= r.EffectiveStartYear
                     && (r.EffectiveEndYear == null || saleYear <= r.EffectiveEndYear))
            .OrderBy(r => (r.EffectiveEndYear ?? int.MaxValue) - r.EffectiveStartYear)
            .ThenByDescending(r => r.ApprovedAt ?? r.CreatedAt)
            .FirstOrDefault();

        if (match is null)
        {
            return new RatioPolicyEvaluation(
                Reviewed: false,
                Qualified: false,
                Code: code,
                StudyName: studyName,
                RuleId: null,
                EvidenceSource: null);
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return new RatioPolicyEvaluation(
                Reviewed: false,
                Qualified: false,
                Code: code,
                StudyName: studyName,
                RuleId: match.RuleId,
                EvidenceSource: match.EvidenceSource);
        }

        var trimmed = code.Trim();
        var qualifiedCodes = SplitCsv(match.QualifiedCodesCsv);
        var excludedCodes = SplitCsv(match.ExcludedCodesCsv);

        var excluded = excludedCodes.Contains(trimmed, StringComparer.Ordinal);
        var inQualifiedSet = !excluded
            && qualifiedCodes.Contains(trimmed, StringComparer.Ordinal);

        return new RatioPolicyEvaluation(
            Reviewed: true,
            Qualified: inQualifiedSet,
            Code: code,
            StudyName: studyName,
            RuleId: match.RuleId,
            EvidenceSource: match.EvidenceSource);
    }

    /// <summary>
    /// Drop the cached rule list. Next <see cref="EvaluateAsync"/>
    /// call reloads from EF. Call after re-running the seeder.
    /// </summary>
    public void InvalidateCache() => _cache.Clear();

    // ── private ────────────────────────────────────────────────────

    private async Task<IReadOnlyList<TfDoctrineRatioPolicy>> GetRulesAsync(
        string county,
        string studyName,
        CancellationToken cancellationToken)
    {
        var key = (county, studyName);
        if (_cache.TryGetValue(key, out var cached))
            return cached;

        // Open a transient scope for the Scoped DbContext. The
        // policy service itself is Singleton.
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var rules = await db.TfDoctrineRatioPolicies
            .AsNoTracking()
            .Where(r => r.County == county && r.StudyName == studyName)
            .OrderBy(r => r.EffectiveStartYear)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        _logger.LogDebug(
            "Loaded {Count} doctrine rules for ({County}, {Study})",
            rules.Count, county, studyName);

        _cache[key] = rules;
        return rules;
    }

    private static string[] SplitCsv(string csv) =>
        string.IsNullOrWhiteSpace(csv)
            ? Array.Empty<string>()
            : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
