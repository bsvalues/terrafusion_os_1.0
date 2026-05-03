using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice G4 (v1.13): shared promotion-gate helper that records the
/// pre-conversion-row share for a truth-promotion batch.
///
/// <para>The gate is informational, not blocking. Per Block-C contract
/// v1.13 §2 the era column is provenance, not validation — the
/// promoter still completes COMPLETED regardless of the share. The
/// gate raises <c>WARN</c> when the share exceeds
/// <see cref="PreConversionShareWarnThreshold"/> so operators can
/// notice when an inbound batch is dominated by pre-2017-conversion
/// rows (whose coded fields have semantically distinct meaning).</para>
///
/// <para>Naming convention: <c>truth-pacs-{lane}-pre-conversion-share</c>
/// where <c>{lane}</c> is one of <c>sale</c>, <c>owner</c>,
/// <c>wpov</c>, <c>imprv</c>, <c>land</c>. The gate name pattern is
/// frozen by doctrine v1.13 §3.</para>
/// </summary>
public static class ConversionEraGate
{
    /// <summary>
    /// Slice G4 (v1.13): doctrine-frozen WARN threshold. A batch
    /// whose pre-conversion share is strictly greater than this
    /// fraction trips the WARN gate. The default (5%) is suitable
    /// for current-year promotions; historical-backfill batches
    /// will trip it by design and operators will acknowledge the
    /// WARN explicitly.
    ///
    /// <para>This is intentionally a code constant rather than a
    /// runtime-configurable knob in v1.13. Future v1.x bumps may
    /// promote it to <c>IOptions&lt;PromotionGateOptions&gt;</c>
    /// once operators have field experience with the default.</para>
    /// </summary>
    public const decimal PreConversionShareWarnThreshold = 0.05m;

    /// <summary>
    /// Doctrine-frozen prefix for the gate name. Combined with the
    /// lane id and <see cref="GateSuffix"/> to produce e.g.
    /// <c>truth-pacs-sale-pre-conversion-share</c>.
    /// </summary>
    public const string GateNamePrefix = "truth-pacs";

    /// <summary>
    /// Doctrine-frozen suffix for the gate name.
    /// </summary>
    public const string GateNameSuffix = "pre-conversion-share";

    /// <summary>The five lane identifiers that participate in G4.</summary>
    public static class Lanes
    {
        public const string Sale = "sale";
        public const string Owner = "owner";
        public const string Wpov = "wpov";
        public const string Imprv = "imprv";
        public const string Land = "land";
    }

    /// <summary>
    /// Composes the doctrine-frozen gate name for a lane.
    /// </summary>
    public static string GateNameFor(string lane) =>
        $"{GateNamePrefix}-{lane}-{GateNameSuffix}";

    /// <summary>
    /// Slice G4 (v1.13): records the pre-conversion-share gate for a
    /// truth-promotion batch. Adds a <see cref="PromotionGateResult"/>
    /// row to the supplied DbContext but does NOT call
    /// <c>SaveChangesAsync</c> — the caller batches the save with its
    /// other end-of-promotion gate writes for fewer round-trips.
    /// </summary>
    /// <param name="db">The TerraFusion DbContext.</param>
    /// <param name="batch">The promotion LoadBatch this gate belongs to.</param>
    /// <param name="lane">One of <see cref="Lanes"/>.</param>
    /// <param name="totalPromoted">
    /// Total rows promoted in this batch (denominator). Zero is
    /// allowed and resolves to <c>PASS</c> with a 0% share.
    /// </param>
    /// <param name="preConversionPromoted">
    /// Subset of promoted rows whose <c>ConversionEra</c> resolved to
    /// <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.PreConversion2017"/>
    /// (numerator).
    /// </param>
    public static void AddShareGate(
        TerraFusionDbContext db,
        LoadBatch batch,
        string lane,
        int totalPromoted,
        int preConversionPromoted)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(batch);
        ArgumentException.ThrowIfNullOrEmpty(lane);
        if (preConversionPromoted < 0)
            throw new ArgumentOutOfRangeException(
                nameof(preConversionPromoted),
                "pre-conversion count must be non-negative");
        if (preConversionPromoted > totalPromoted)
            throw new ArgumentOutOfRangeException(
                nameof(preConversionPromoted),
                $"pre-conversion count ({preConversionPromoted}) cannot " +
                $"exceed total promoted ({totalPromoted})");

        var share = totalPromoted == 0
            ? 0m
            : (decimal)preConversionPromoted / totalPromoted;

        var status = share > PreConversionShareWarnThreshold ? "WARN" : "PASS";

        db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = GateNameFor(lane),
            GateStage = "RAW_TO_TRUTH",
            Status = status,
            Expected = string.Format(
                CultureInfo.InvariantCulture,
                "<= {0:P2}",
                PreConversionShareWarnThreshold),
            Actual = string.Format(CultureInfo.InvariantCulture, "{0:P2}", share),
            Detail = string.Format(
                CultureInfo.InvariantCulture,
                "preConversion={0} total={1} threshold={2:P2}",
                preConversionPromoted,
                totalPromoted,
                PreConversionShareWarnThreshold),
            ExecutedAt = DateTime.UtcNow,
        });
    }
}
