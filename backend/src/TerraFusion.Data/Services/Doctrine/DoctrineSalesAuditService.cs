using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: default <see cref="IDoctrineSalesAuditService"/>
/// implementation. Reads
/// <c>doctrine_tf.tf_doctrine_sales_qualification_codes</c> and the
/// <see cref="PacsSaleTruthPromoterSnapshot"/> static surface to
/// produce an operator-readable audit report.
///
/// <para>Pure read-only — never mutates the doctrine table. Safe to
/// invoke at any time without side effects.</para>
/// </summary>
public sealed class DoctrineSalesAuditService : IDoctrineSalesAuditService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrineSalesAuditService> _logger;

    public DoctrineSalesAuditService(
        TerraFusionDbContext db,
        ILogger<DoctrineSalesAuditService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DoctrineSalesAuditReport> AuditAsync(
        CancellationToken cancellationToken = default)
    {
        var rules = await _db.TfDoctrineSalesQualificationCodes
            .AsNoTracking()
            .OrderBy(r => r.SurfaceCode)
            .ThenBy(r => r.EffectiveStartYear)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var ruleViews = rules
            .Select(r => new DoctrineRuleView(
                r.RuleId,
                r.SurfaceCode,
                r.SourceField,
                r.EffectiveStartYear,
                r.EffectiveEndYear,
                ParseQualifiedCodes(r.QualifiedCodesJson),
                r.Confidence,
                r.ActiveFlag))
            .ToList();

        var doctrineState = new DoctrineStateView(
            TableExists: true,
            TotalRules: rules.Count,
            ActiveRules: rules.Count(r => r.ActiveFlag),
            Rules: ruleViews);

        var alignment = ComputePromoterAlignment(rules);
        var yearCheck = ComputeYearAwareness(rules);
        var notes = BuildOperatorNotes(alignment, yearCheck);

        _logger.LogDebug(
            "DoctrineSalesAuditService.AuditAsync: total={Total} active={Active} aligned={Aligned}",
            rules.Count, doctrineState.ActiveRules, alignment.AlignedWithDoctrine);

        return new DoctrineSalesAuditReport(
            AuditedAt: DateTime.UtcNow,
            DoctrineState: doctrineState,
            PromoterAlignment: alignment,
            YearAwarenessCheck: yearCheck,
            OperatorActionableNotes: notes);
    }

    public async Task<IReadOnlyList<DoctrineRuleView>> LookupRulesForYearAsync(
        short propValYr,
        string? surface = null,
        CancellationToken cancellationToken = default)
    {
        var query = _db.TfDoctrineSalesQualificationCodes
            .AsNoTracking()
            .Where(r => r.ActiveFlag
                     && r.EffectiveStartYear <= propValYr
                     && (r.EffectiveEndYear == null || r.EffectiveEndYear >= propValYr));

        if (!string.IsNullOrWhiteSpace(surface))
            query = query.Where(r => r.SurfaceCode == surface);

        var matches = await query
            .OrderBy(r => r.SurfaceCode)
            .ThenBy(r => r.EffectiveStartYear)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return matches
            .Select(r => new DoctrineRuleView(
                r.RuleId, r.SurfaceCode, r.SourceField,
                r.EffectiveStartYear, r.EffectiveEndYear,
                ParseQualifiedCodes(r.QualifiedCodesJson),
                r.Confidence, r.ActiveFlag))
            .ToList();
    }

    /// <summary>
    /// Compute the promoter-vs-doctrine alignment view.
    ///
    /// <para>Promoter snapshot (per
    /// <see cref="PacsSaleTruthPromoterSnapshot"/>): treats column
    /// <c>sl_county_ratio_cd</c> as the DOR_RATIO surface and
    /// considers <c>['100']</c> qualified.</para>
    ///
    /// <para>Alignment rule: there must exist an ACTIVE doctrine rule
    /// with <c>SurfaceCode='DOR_RATIO'</c> AND
    /// <c>SourceField='sl_county_ratio_cd'</c> AND its qualified-code
    /// set must equal the snapshot's code set. If no such rule
    /// exists, OR if the doctrine's qualified codes diverge from the
    /// snapshot, that is a discrepancy.</para>
    /// </summary>
    private static PromoterAlignmentView ComputePromoterAlignment(
        IReadOnlyList<TfDoctrineSalesQualificationCode> rules)
    {
        var promoterCol = PacsSaleTruthPromoterSnapshot.DorRatioColumn;
        var promoterCodes = PacsSaleTruthPromoterSnapshot.DorRatioCodes;
        var discrepancies = new List<string>();

        var activeDorRulesForCol = rules
            .Where(r => r.ActiveFlag
                     && r.SurfaceCode == "DOR_RATIO"
                     && r.SourceField == promoterCol)
            .ToList();

        if (activeDorRulesForCol.Count == 0)
        {
            discrepancies.Add(
                $"PacsSaleTruthPromoter snapshot uses column '{promoterCol}' as DOR_RATIO surface, " +
                "but no active doctrine rule exists for (DOR_RATIO, " + promoterCol + "). " +
                "Run the seeder to populate, or operator must add a rule.");

            return new PromoterAlignmentView(
                PacsSaleTruthPromoterColumn: promoterCol,
                PacsSaleTruthPromoterCodes: promoterCodes,
                AlignedWithDoctrine: false,
                Discrepancies: discrepancies);
        }

        // Union of every active rule's qualified codes for this surface
        // across all year windows. Promoter alignment passes iff the
        // promoter's snapshot codes are a SUBSET of that union (i.e.
        // the doctrine recognizes everything the promoter qualifies).
        var doctrineCodes = activeDorRulesForCol
            .SelectMany(r => ParseQualifiedCodes(r.QualifiedCodesJson))
            .ToHashSet(StringComparer.Ordinal);

        var missing = promoterCodes
            .Where(c => !doctrineCodes.Contains(c))
            .ToList();

        var aligned = missing.Count == 0;
        if (!aligned)
        {
            discrepancies.Add(
                $"PacsSaleTruthPromoter qualifies codes [{string.Join(",", missing)}] " +
                $"on column '{promoterCol}', but no active doctrine rule covers them. " +
                "Either tighten the promoter or extend doctrine.");
        }

        return new PromoterAlignmentView(
            PacsSaleTruthPromoterColumn: promoterCol,
            PacsSaleTruthPromoterCodes: promoterCodes,
            AlignedWithDoctrine: aligned,
            Discrepancies: discrepancies);
    }

    /// <summary>
    /// Determine PRESENT / MISSING for the three locked rules.
    /// PRESENT requires an ACTIVE rule covering the year window.
    /// </summary>
    private static YearAwarenessCheckView ComputeYearAwareness(
        IReadOnlyList<TfDoctrineSalesQualificationCode> rules)
    {
        bool HasActive(string surface, string col, short startYear, short? endYear)
            => rules.Any(r => r.ActiveFlag
                              && r.SurfaceCode == surface
                              && r.SourceField == col
                              && r.EffectiveStartYear == startYear
                              && r.EffectiveEndYear == endYear);

        var post2017Dor = HasActive("DOR_RATIO", "sl_county_ratio_cd", 2017, null);
        var pre2017Dor  = HasActive("DOR_RATIO", "sl_county_ratio_cd", 1990, 2016);
        var post2018Cnty = HasActive("COUNTY_RATIO", "sl_ratio_type_cd", 2018, null);

        return new YearAwarenessCheckView(
            Post2017DorRule: post2017Dor ? "PRESENT" : "MISSING",
            Pre2017DorRule:  pre2017Dor  ? "PRESENT" : "MISSING",
            Post2018CountyRule: post2018Cnty ? "PRESENT" : "MISSING");
    }

    private static List<string> BuildOperatorNotes(
        PromoterAlignmentView alignment,
        YearAwarenessCheckView yearCheck)
    {
        var notes = new List<string>();

        // Always include the alignment-statement so the operator gets
        // a single-line summary regardless of pass/fail.
        var codes = string.Join(",", alignment.PacsSaleTruthPromoterCodes
            .Select(c => $"'{c}'"));
        notes.Add(
            $"PacsSaleTruthPromoter currently uses [{codes}] for column " +
            $"{alignment.PacsSaleTruthPromoterColumn}; this " +
            (alignment.AlignedWithDoctrine
                ? "aligns with DOR_RATIO post-2017 doctrine."
                : "does NOT align with doctrine — see discrepancies."));

        foreach (var d in alignment.Discrepancies)
            notes.Add(d);

        if (yearCheck.Post2017DorRule == "MISSING")
            notes.Add("Year-awareness gap: post-2017 DOR_RATIO rule MISSING. Run seeder.");
        if (yearCheck.Pre2017DorRule == "MISSING")
            notes.Add("Year-awareness gap: pre-2017 DOR_RATIO rule MISSING. Run seeder.");
        if (yearCheck.Post2018CountyRule == "MISSING")
            notes.Add("Year-awareness gap: post-2018 COUNTY_RATIO rule MISSING. Run seeder.");

        return notes;
    }

    /// <summary>
    /// Parse a <c>QualifiedCodesJson</c> string into an immutable
    /// list. Returns empty on parse failure (defensive — operator
    /// could enter malformed JSON via raw SQL update).
    /// </summary>
    private static IReadOnlyList<string> ParseQualifiedCodes(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Array.Empty<string>();

        try
        {
            var arr = JsonSerializer.Deserialize<string[]>(json);
            return arr ?? Array.Empty<string>();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }
}
