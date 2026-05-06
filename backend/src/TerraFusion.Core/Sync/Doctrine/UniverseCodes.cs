using System.Collections.Generic;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: closed vocabulary for the
/// <c>UniverseCode</c> column on <c>truth_pacs.imprv_current</c>,
/// <c>canonical_tf.tf_improvement</c>, and any per-universe lookup
/// in <c>doctrine_tf.tf_doctrine_attribute_dictionary</c>.
///
/// <para>Six real universes plus the <c>UNKNOWN</c> sentinel. The
/// classifier never silently coerces an unmatched row into
/// <c>REAL_RESIDENTIAL</c> — it returns <see cref="Unknown"/> with a
/// quarantine-reason detail. See
/// <c>docs/sync/sync-doctrine-4-improvement-universe-design.md</c>
/// §"Locked universe set".</para>
///
/// <para>Adding a new universe is intentionally a code change. The
/// classifier, dictionary, and quarantine taxonomy must be reviewed
/// jointly before a new universe lands; there is no runtime
/// extensibility hook.</para>
/// </summary>
public static class UniverseCodes
{
    /// <summary>
    /// Real-property residential improvements. The default real bucket
    /// after higher-precedence rules fail. <c>prop_type_cd = 'R'</c>
    /// AND <c>ag_apply &lt;&gt; 'T'</c>.
    /// </summary>
    public const string RealResidential = "REAL_RESIDENTIAL";

    /// <summary>
    /// Real-property non-residential. Broad commercial bucket for
    /// initial seed; tighten <c>property_use_cd</c> against profiling
    /// distribution after first drain.
    /// </summary>
    public const string RealCommercial = "REAL_COMMERCIAL";

    /// <summary>
    /// Mobile-home universe. <c>prop_type_cd = 'MH'</c>. Real but not
    /// stick-built; PACS attribute namespace genuinely diverges from
    /// stick-built residential.
    /// </summary>
    public const string MobileHome = "MOBILE_HOME";

    /// <summary>
    /// Agricultural / current-use / open-space / conversion. Wins over
    /// residential / commercial when <c>ag_apply = 'T'</c> regardless
    /// of prop_type_cd. Future split into AG/OSP/CNV is out of scope
    /// per design doc §"Out of scope".
    /// </summary>
    public const string AgCurrentUse = "AG_CURRENT_USE";

    /// <summary>
    /// Business personal property. <c>prop_type_cd ∈ {'P', 'B'}</c>.
    /// Distinct attribute schedules from real property.
    /// </summary>
    public const string PersonalProperty = "PERSONAL_PROPERTY";

    /// <summary>
    /// Pre-2017 PACS conversion-legacy rows. Conservative: only fires
    /// when current PACS domain rules can't classify confidently AND
    /// an explicit legacy marker is present. Wins over all other
    /// universes when fired.
    /// </summary>
    public const string ConversionLegacy = "CONVERSION_LEGACY";

    /// <summary>
    /// Sentinel for rows that match no rule. NEVER seeded; only
    /// written by the classifier when no rule fires. Paired with a
    /// <see cref="UniverseQuarantineReasons"/> detail.
    /// </summary>
    public const string Unknown = "UNKNOWN";

    /// <summary>
    /// All six real universes (excludes <see cref="Unknown"/>). Use
    /// for seeding loops, distribution audits, and dictionary
    /// per-universe queries.
    /// </summary>
    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        RealResidential,
        RealCommercial,
        MobileHome,
        AgCurrentUse,
        PersonalProperty,
        ConversionLegacy,
    };

    /// <summary>
    /// All universes including the UNKNOWN sentinel. Use at boundaries
    /// validating input from external callers.
    /// </summary>
    public static IReadOnlySet<string> AllIncludingUnknown { get; } = new HashSet<string>
    {
        RealResidential,
        RealCommercial,
        MobileHome,
        AgCurrentUse,
        PersonalProperty,
        ConversionLegacy,
        Unknown,
    };

    /// <summary>True iff <paramref name="value"/> is a recognized universe code (any of the seven).</summary>
    public static bool IsKnown(string? value) =>
        !string.IsNullOrEmpty(value) && AllIncludingUnknown.Contains(value);
}
