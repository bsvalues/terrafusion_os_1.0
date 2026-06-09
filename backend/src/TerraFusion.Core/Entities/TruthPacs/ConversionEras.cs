using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice G1 (v1.10): closed vocabulary for the
/// <c>ConversionEra</c> column on <c>truth_pacs.*</c> and (later)
/// <c>canonical_tf.*</c> rows.
///
/// <para>Per the v1.0 PACS conversion caveat (acknowledged in
/// <c>docs/pacs/block-c-contract-v1.md</c> §1, the
/// sales-ratio-queries.md amendment, and
/// <c>blocks-d-through-h-design.md</c> §G): Benton County's PACS
/// instance had a data conversion event before 2017. Sales codes,
/// improvement attributes, and assessment vocabulary captured on
/// pre-conversion rows have semantics that may differ from
/// post-conversion records.</para>
///
/// <para><b>Three frozen values:</b>
/// <list type="bullet">
///   <item><see cref="PreConversion2017"/> — row was captured
///   under the pre-2017 vocabulary. Semantically distinct from
///   post-conversion data; ratio studies and qualification
///   transforms should treat with care.</item>
///   <item><see cref="PostConversion"/> — row was captured under
///   the current vocabulary. Default era for all read endpoints
///   per v1.10 §3.</item>
///   <item><see cref="Unknown"/> — era could not be determined
///   from the underlying data. Reserved for canonical-layer
///   rows whose contributing truth rows disagree. Truth-layer
///   rows do NOT use this value because every truth row has a
///   year column that disambiguates.</item>
/// </list>
/// </para>
///
/// <para>Adding a new era is intentionally a code change.
/// There is no runtime extensibility hook — the vocabulary is
/// closed by design.</para>
/// </summary>
public static class ConversionEras
{
    /// <summary>
    /// Captured under the pre-2017 PACS vocabulary. Semantic
    /// drift from current vocabulary; downstream consumers
    /// should not treat the row's coded fields as if they had
    /// post-conversion meaning.
    /// </summary>
    public const string PreConversion2017 = "PRE_CONVERSION_2017";

    /// <summary>
    /// Captured under the current (post-2017) vocabulary. Default
    /// era for read endpoints per v1.10 §3.
    /// </summary>
    public const string PostConversion = "POST_CONVERSION";

    /// <summary>
    /// Era could not be determined. Reserved for canonical-layer
    /// rows whose contributing truth rows disagree on era.
    /// Truth-layer rows do not emit this value.
    /// </summary>
    public const string Unknown = "UNKNOWN";

    /// <summary>
    /// The conversion-cutoff year. Rows with a tax / valuation
    /// year strictly less than this are
    /// <see cref="PreConversion2017"/>; rows with year greater
    /// than or equal are <see cref="PostConversion"/>.
    /// </summary>
    public const short CutoverYear = 2018;

    /// <summary>
    /// Computes the truth-layer era for a row based on its
    /// year column (<c>PropValYr</c> for sales / improvements
    /// / land / WSDOR, <c>OwnerTaxYr</c> for owners). Truth
    /// rows always resolve to either
    /// <see cref="PreConversion2017"/> or
    /// <see cref="PostConversion"/>; <see cref="Unknown"/> is
    /// reserved for canonical layer.
    /// </summary>
    /// <param name="year">PACS year column value (1900..2100 expected).</param>
    public static string FromYear(short year) =>
        year < CutoverYear ? PreConversion2017 : PostConversion;

    /// <summary>
    /// All currently-recognized era values. Any value outside
    /// this set is a doctrine violation when written to a
    /// <c>ConversionEra</c> column.
    /// </summary>
    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        PreConversion2017,
        PostConversion,
        Unknown,
    };

    /// <summary>
    /// True iff <paramref name="value"/> is a recognized era.
    /// Use at the boundary of any code that writes to
    /// <c>ConversionEra</c>.
    /// </summary>
    public static bool IsKnown(string value) =>
        !string.IsNullOrEmpty(value) && All.Contains(value);

    /// <summary>
    /// Slice G2 (v1.11): majority-of-underlying-truth resolution
    /// rule for canonical-layer rows. Walks the contributing truth
    /// rows' eras and returns:
    ///
    /// <list type="bullet">
    ///   <item>the single agreed-upon era if every non-null
    ///   contributor returns the same value;</item>
    ///   <item><see cref="Unknown"/> if contributors disagree, if
    ///   the sequence is empty, or if every contributor is null.</item>
    /// </list>
    ///
    /// <para>Today every truth → canonical projection is 1:1, so
    /// callers pass a single-element sequence and the helper returns
    /// that era unchanged. The helper exists so that future N:1
    /// projections (multi-source canonical rows, e.g. ArcGIS geometry
    /// joined with PACS attributes on tf_parcel) can adopt the same
    /// resolution rule without re-touching every projector.</para>
    ///
    /// <para>Doctrine: a non-empty sequence containing both null and
    /// known values is treated as "the known values are the
    /// contributors"; the null entries are ignored. If the only
    /// values present are null, the result is <see cref="Unknown"/>.</para>
    /// </summary>
    /// <param name="contributors">
    /// Era values from each contributing truth row. Null entries
    /// (e.g. pre-G1 rows that haven't been re-promoted) are skipped.
    /// </param>
    public static string MajorityOfTruth(IEnumerable<string?> contributors)
    {
        if (contributors is null) return Unknown;

        string? agreed = null;
        var hasAny = false;
        foreach (var era in contributors)
        {
            if (era is null) continue;
            if (!IsKnown(era)) continue; // ignore unknown vocab tokens
            if (!hasAny)
            {
                agreed = era;
                hasAny = true;
            }
            else if (agreed != era)
            {
                return Unknown;
            }
        }
        return hasAny ? agreed! : Unknown;
    }
}
