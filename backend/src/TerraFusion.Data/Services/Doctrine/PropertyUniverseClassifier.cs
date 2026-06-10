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
/// SYNC-DOCTRINE-4: default <see cref="IPropertyUniverseClassifier"/>
/// backed by <c>doctrine_tf.tf_doctrine_property_universe</c>.
///
/// <para>Registered Singleton; uses <see cref="IServiceScopeFactory"/>
/// to read the rule table on cache miss. Same lifetime/cache pattern
/// as <see cref="RatioQualificationPolicy"/> (B1).</para>
///
/// <para>Match algorithm (per design doc §"Locked precedence"):
/// for each county, walk active rules whose effective year window
/// covers <c>input.PropValYr</c>, ordered by <c>Precedence ASC</c>;
/// return the first rule whose predicates all match. If
/// <c>RequiresLegacyMarker</c> is true the rule fires only when
/// <c>input.HasLegacyMarker</c> is also true.</para>
/// </summary>
public sealed class PropertyUniverseClassifier : IPropertyUniverseClassifier
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PropertyUniverseClassifier> _logger;

    private readonly ConcurrentDictionary<string, IReadOnlyList<TfDoctrinePropertyUniverse>>
        _cache = new(StringComparer.OrdinalIgnoreCase);

    public PropertyUniverseClassifier(
        IServiceScopeFactory scopeFactory,
        ILogger<PropertyUniverseClassifier> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<UniverseClassification> ClassifyAsync(
        UniverseClassifierInput input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        if (string.IsNullOrWhiteSpace(input.County))
            throw new ArgumentException("County is required.", nameof(input));

        var rules = await GetRulesAsync(input.County, cancellationToken).ConfigureAwait(false);

        // Filter: active, year window covers input.PropValYr.
        var candidates = rules
            .Where(r => r.ActiveFlag)
            .Where(r => input.PropValYr >= r.EffectiveStartYear
                     && (r.EffectiveEndYear == null || input.PropValYr <= r.EffectiveEndYear))
            .OrderBy(r => r.Precedence)
            .ThenBy(r => r.RuleId);

        foreach (var rule in candidates)
        {
            if (!RuleMatches(rule, input)) continue;

            // Conversion-legacy uncertainty: rule fired but the marker
            // is the weakest available form (HasLegacyMarker = true is
            // currently the only signal we accept; future revisions
            // could downgrade based on marker source).
            string? quarantineHint = null;
            if (rule.UniverseCode == UniverseCodes.ConversionLegacy
                && rule.Confidence == "LOW")
            {
                quarantineHint = UniverseQuarantineReasons.LegacyClassificationUncertain;
            }

            return new UniverseClassification(
                UniverseCode: rule.UniverseCode,
                RuleId: rule.RuleId,
                Confidence: rule.Confidence,
                Reason: rule.Reason,
                QuarantineReasonHint: quarantineHint);
        }

        // No rule fired → UNKNOWN sentinel.
        var diagnostic = $"no rule matched (prop_type_cd={input.PropTypeCd ?? "NULL"}, " +
                         $"property_use_cd={input.PropertyUseCd ?? "NULL"}, " +
                         $"ag_apply={input.AgApply ?? "NULL"}, year={input.PropValYr})";
        return new UniverseClassification(
            UniverseCode: UniverseCodes.Unknown,
            RuleId: null,
            Confidence: "LOW",
            Reason: diagnostic,
            QuarantineReasonHint: UniverseQuarantineReasons.UnknownUniverse);
    }

    public void InvalidateCache(string? county = null)
    {
        if (county is null) _cache.Clear();
        else _cache.TryRemove(county, out _);
    }

    // ── private ────────────────────────────────────────────────────────

    private async Task<IReadOnlyList<TfDoctrinePropertyUniverse>> GetRulesAsync(
        string county, CancellationToken cancellationToken)
    {
        if (_cache.TryGetValue(county, out var cached)) return cached;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var rules = await db.TfDoctrinePropertyUniverses
            .AsNoTracking()
            .Where(r => r.County == county)
            .OrderBy(r => r.Precedence)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        _logger.LogDebug(
            "PropertyUniverseClassifier: loaded {Count} rules for county {County}",
            rules.Count, county);

        _cache[county] = rules;
        return rules;
    }

    private static bool RuleMatches(TfDoctrinePropertyUniverse rule, UniverseClassifierInput input)
    {
        // Legacy marker gate.
        if (rule.RequiresLegacyMarker && !input.HasLegacyMarker) return false;

        // prop_type_cd: CSV match (wildcard if CSV null/empty).
        if (!CsvMatches(rule.PropTypeCdCsv, input.PropTypeCd, includeOnEmpty: true)) return false;

        // property_use_cd: respect PropertyUseMode.
        if (!PropertyUseMatches(rule.PropertyUseMode, rule.PropertyUseCdCsv, input.PropertyUseCd))
            return false;

        // ag_apply: NULL on rule = wildcard. Otherwise exact match.
        if (!string.IsNullOrEmpty(rule.AgApplyValue))
        {
            if (!string.Equals(rule.AgApplyValue, input.AgApply, StringComparison.OrdinalIgnoreCase))
                return false;
        }

        // ag_use_cd: CSV match (wildcard if CSV null/empty).
        if (!CsvMatches(rule.AgUseCdCsv, input.AgUseCd, includeOnEmpty: true)) return false;

        return true;
    }

    private static bool PropertyUseMatches(string mode, string? csv, string? value)
    {
        if (string.IsNullOrWhiteSpace(mode) || string.Equals(mode, "ANY", StringComparison.OrdinalIgnoreCase))
            return true;

        var codes = SplitCsv(csv);
        if (codes.Length == 0) return true; // empty CSV = wildcard regardless of mode

        // INCLUDE/EXCLUDE require a non-null value to compare against
        // the CSV. NULL value → rule does not match (defensive). This
        // matters for the broad commercial seed rule: a row whose
        // property_use_cd is missing must NOT be silently labelled
        // commercial just because EXCLUDE tested NULL ∉ residential
        // codes. The classifier falls through to the broader residential
        // rule (which uses PropertyUseMode='ANY') instead.
        if (string.IsNullOrEmpty(value)) return false;

        var present = codes.Any(c => string.Equals(c, value, StringComparison.OrdinalIgnoreCase));

        return mode.Equals("INCLUDE", StringComparison.OrdinalIgnoreCase) ? present
             : mode.Equals("EXCLUDE", StringComparison.OrdinalIgnoreCase) ? !present
             : true; // unknown mode = treat as ANY (defensive)
    }

    private static bool CsvMatches(string? csv, string? value, bool includeOnEmpty)
    {
        var codes = SplitCsv(csv);
        if (codes.Length == 0) return includeOnEmpty;
        if (string.IsNullOrEmpty(value)) return false;
        return codes.Any(c => string.Equals(c, value, StringComparison.OrdinalIgnoreCase));
    }

    private static string[] SplitCsv(string? csv) =>
        string.IsNullOrWhiteSpace(csv)
            ? Array.Empty<string>()
            : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
