using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: read-only audit of the sales qualification
/// doctrine. Compares the rules in
/// <c>doctrine_tf.tf_doctrine_sales_qualification_codes</c> against
/// the hardcoded behavior of
/// <see cref="TerraFusion.Data.Services.TruthPacs.PacsSaleTruthPromoter"/>
/// (captured by a static snapshot — see
/// <see cref="PacsSaleTruthPromoterSnapshot"/>) and emits an
/// operator-readable report covering doctrine state, promoter
/// alignment, and year-awareness presence.
///
/// <para>Surfaces three things:</para>
/// <list type="bullet">
///   <item><c>doctrineState</c> — totalRules, activeRules, full
///   row dump.</item>
///   <item><c>promoterAlignment</c> — does the promoter's hardcoded
///   filter agree with what the doctrine says is qualified for that
///   surface? Surfaces discrepancies as actionable findings.</item>
///   <item><c>yearAwarenessCheck</c> — confirms the post-2017 DOR,
///   pre-2017 DOR, and post-2018 COUNTY rules are all PRESENT (or
///   reports MISSING).</item>
/// </list>
/// </summary>
public interface IDoctrineSalesAuditService
{
    Task<DoctrineSalesAuditReport> AuditAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Year-aware lookup: return all ACTIVE doctrine rules whose
    /// year window covers <paramref name="propValYr"/>.
    /// Optionally narrow by surface (DOR_RATIO | COUNTY_RATIO).
    /// Used by tests to verify pre-2017 vs post-2017 year boundaries
    /// and by operators to spot-check applicability.
    /// </summary>
    Task<IReadOnlyList<DoctrineRuleView>> LookupRulesForYearAsync(
        short propValYr,
        string? surface = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Snapshot of <c>PacsSaleTruthPromoter</c>'s current hardcoded
/// behavior, captured here so the audit can reason about it without
/// grepping the promoter's source at runtime AND without modifying
/// the promoter to expose a constant. Update this snapshot whenever
/// the promoter's qualification surface changes.
/// </summary>
/// <remarks>
/// As of SYNC-DOCTRINE-2 (B2): the promoter no longer has a single
/// hardcoded code list — it consults <c>IRatioQualificationPolicy</c>
/// for both DOR_RATIO and COUNTY_INTERNAL_RATIO and promotes the
/// sale if either qualifies. The "promoter alignment" check
/// therefore reduces to: does the promoter still consult both
/// surfaces against the right columns (sl_ratio_type_cd for DOR,
/// sl_county_ratio_cd for COUNTY)? This snapshot captures that
/// answer for audit comparison.
///
/// <para>Pre-D2 the promoter hardcoded sl_county_ratio_cd='100';
/// the audit uses that historical fact to recognize the snapshot's
/// "DOR_RATIO via sl_county_ratio_cd → ['100']" surface, which
/// remains the doctrine's post-2017 expectation today.</para>
/// </remarks>
public static class PacsSaleTruthPromoterSnapshot
{
    /// <summary>
    /// The PACS column the promoter (historically + per the
    /// post-2017 DOR convention) treats as the DOR_RATIO surface.
    /// </summary>
    public const string DorRatioColumn = "sl_county_ratio_cd";

    /// <summary>
    /// The hardcoded code-set the promoter (pre-D2 directly, post-D2
    /// via IRatioQualificationPolicy + DoctrineRatioPolicySeeder)
    /// treats as DOR_RATIO-qualified for that column.
    /// </summary>
    public static IReadOnlyList<string> DorRatioCodes { get; } = new[] { "100" };

    /// <summary>
    /// The PACS column the promoter consults for the COUNTY_RATIO
    /// surface (post-D2: via IRatioQualificationPolicy.EvaluateAsync
    /// against COUNTY_INTERNAL_RATIO).
    /// </summary>
    public const string CountyRatioColumn = "sl_ratio_type_cd";
}

/// <summary>
/// SYNC-DOCTRINE-5: report shape returned by
/// <see cref="IDoctrineSalesAuditService.AuditAsync"/>.
/// </summary>
public sealed record DoctrineSalesAuditReport(
    DateTime AuditedAt,
    DoctrineStateView DoctrineState,
    PromoterAlignmentView PromoterAlignment,
    YearAwarenessCheckView YearAwarenessCheck,
    IReadOnlyList<string> OperatorActionableNotes);

public sealed record DoctrineStateView(
    bool TableExists,
    int TotalRules,
    int ActiveRules,
    IReadOnlyList<DoctrineRuleView> Rules);

public sealed record DoctrineRuleView(
    Guid RuleId,
    string SurfaceCode,
    string SourceField,
    short EffectiveStartYear,
    short? EffectiveEndYear,
    IReadOnlyList<string> QualifiedCodes,
    string Confidence,
    bool ActiveFlag);

public sealed record PromoterAlignmentView(
    string PacsSaleTruthPromoterColumn,
    IReadOnlyList<string> PacsSaleTruthPromoterCodes,
    bool AlignedWithDoctrine,
    IReadOnlyList<string> Discrepancies);

public sealed record YearAwarenessCheckView(
    string Post2017DorRule,
    string Pre2017DorRule,
    string Post2018CountyRule);
