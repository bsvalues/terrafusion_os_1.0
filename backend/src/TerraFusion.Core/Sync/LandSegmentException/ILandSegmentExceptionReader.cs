using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.LandSegmentException;

/// <summary>
/// Slice F4: read-only canonical exception list over
/// <c>canonical_tf.tf_land</c>. Per
/// <c>docs/pacs/blocks-d-through-h-design.md</c> §F.4:
/// surfaces land segments whose canonical row carries
/// data anomalies that block downstream ratio / valuation
/// work, so an operator can triage them without running
/// raw SQL.
///
/// <para>v1 anomaly taxonomy (closed; doctrine-frozen):
/// <list type="bullet">
///   <item><see cref="ReasonMissingMarketVal"/> —
///   <c>LandSegMarketVal IS NULL</c>.</item>
///   <item><see cref="ReasonMissingArea"/> —
///   <c>SizeAcres IS NULL</c> OR <c>SizeAcres = 0</c>.</item>
///   <item><see cref="ReasonMissingTypeCd"/> —
///   <c>LandSegTypeCd IS NULL</c> or empty.</item>
///   <item><see cref="ReasonMissingStateCd"/> —
///   <c>LandSegStateCd IS NULL</c> or empty.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit
/// table mutations. <c>countyId</c> isolation enforced by the
/// caller (the controller resolves the principal's claim and
/// passes it here verbatim).</para>
/// </summary>
public interface ILandSegmentExceptionReader
{
    /// <summary>Reason token: market value is null.</summary>
    public const string ReasonMissingMarketVal = "MissingMarketVal";

    /// <summary>Reason token: acreage is null or zero.</summary>
    public const string ReasonMissingArea = "MissingArea";

    /// <summary>Reason token: land segment type code is null/empty.</summary>
    public const string ReasonMissingTypeCd = "MissingTypeCd";

    /// <summary>Reason token: land segment state code is null/empty.</summary>
    public const string ReasonMissingStateCd = "MissingStateCd";

    /// <summary>
    /// Slice G3 (v1.12) parity: special <c>era</c> token that
    /// bypasses the conversion-era filter entirely. Returns rows
    /// regardless of their <c>ConversionEra</c> column (including
    /// <c>NULL</c>). Used for audit / migration sweeps; not the
    /// default.
    /// </summary>
    public const string EraAll = "ALL";

    /// <summary>
    /// Default upper bound on the result set. The endpoint is
    /// designed for an operator triage panel, not bulk export;
    /// keep a hard ceiling to avoid pulling the entire table.
    /// </summary>
    public const int DefaultMaxResults = 200;

    /// <summary>
    /// Hard ceiling for <c>maxResults</c>. Anything above this
    /// gets clamped down by the controller; the reader does not
    /// enforce the clamp — it trusts its caller.
    /// </summary>
    public const int AbsoluteMaxResults = 1000;

    /// <summary>
    /// Returns up to <paramref name="maxResults"/> land-segment
    /// exception items for the given county, filtered by
    /// conversion era. Each item bundles all anomalies for a
    /// single segment into one row with a comma-joined
    /// <c>ExceptionReasons</c> string.
    /// </summary>
    /// <param name="countyId">Sovereign-county scope.</param>
    /// <param name="era">
    /// Conversion-era filter per Block-C contract v1.12 §2.
    /// Null resolves to <see cref="Entities.TruthPacs.ConversionEras.PostConversion"/>.
    /// Recognized values: <c>POST_CONVERSION</c>,
    /// <c>PRE_CONVERSION_2017</c>, <c>UNKNOWN</c>,
    /// <see cref="EraAll"/>. Unrecognized values throw
    /// <see cref="ArgumentException"/>.
    /// </param>
    /// <param name="maxResults">
    /// Upper bound on returned items. Defaults to
    /// <see cref="DefaultMaxResults"/>.
    /// </param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<IReadOnlyList<LandSegmentExceptionItem>> GetExceptionsAsync(
        Guid countyId,
        string? era = null,
        int? maxResults = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice F4: a single exception row. Bundles every anomaly
/// for one canonical land segment into a comma-joined
/// <see cref="ExceptionReasons"/> string so an operator panel
/// can render it as one row instead of one-per-reason.
/// </summary>
public sealed record LandSegmentExceptionItem
{
    public required Guid TfLandId { get; init; }
    public required Guid TfParcelId { get; init; }
    public string? LandSegTypeCd { get; init; }
    public string? LandSegStateCd { get; init; }
    public decimal? AreaAcres { get; init; }
    public decimal? LandSegMarketVal { get; init; }

    /// <summary>
    /// Comma-joined list of reason tokens (see
    /// <c>ILandSegmentExceptionReader.Reason*</c> constants).
    /// Order is stable: MarketVal, Area, TypeCd, StateCd, so the
    /// string is comparable across runs.
    /// </summary>
    public required string ExceptionReasons { get; init; }
}
