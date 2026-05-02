using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.GIS.ArcGisRest;

namespace TerraFusion.Data.Services.GisTf;

/// <summary>
/// Slice G1-E-1: closes the APN crosswalk between
/// <c>gis_tf.tf_parcel_geom</c> and <c>canonical_tf.tf_parcel</c>.
///
/// <para>Algorithm (per pass, per county):
/// 1. Load all active <c>tf_parcel_geom</c> rows for the county.
/// 2. Load all <c>tf_parcel</c> rows for the same county, indexed by
///    case-insensitive trimmed <c>parcel_number</c>.
/// 3. For each unlinked geom row with a non-empty APN:
///    - 0 matches → NoMatch
///    - 1 match   → close the link (set TfParcelId, UpdatedAt)
///    - 2+ matches → Ambiguous; leave unlinked, log warning.
/// 4. Record a <c>gis-tf:crosswalk-closure</c> promotion gate.
/// </para>
///
/// <para>Cross-county matches are impossible by construction (the
/// parcel index is filtered to the same CountyId). The doctrine's
/// county-isolation invariant is preserved.</para>
/// </summary>
public sealed class ArcGisCrosswalkService : IArcGisCrosswalkService
{
    private const string GateName = "gis-tf:crosswalk-closure";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ArcGisCrosswalkService> _logger;

    public ArcGisCrosswalkService(
        TerraFusionDbContext db,
        ILogger<ArcGisCrosswalkService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ArcGisCrosswalkResult> CloseCrosswalkAsync(
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        var geoms = await _db.TfParcelGeoms
            .Where(g => g.CountyId == countyId && g.IsActive)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var considered = geoms.Count;
        var alreadyClosed = geoms.Count(g => g.TfParcelId.HasValue);
        var pending = geoms.Where(g => !g.TfParcelId.HasValue).ToList();

        if (pending.Count == 0)
        {
            await RecordGateAsync(countyId, considered, alreadyClosed,
                newlyClosed: 0, noMatch: 0, ambiguous: 0, missingApn: 0,
                cancellationToken).ConfigureAwait(false);

            return new ArcGisCrosswalkResult
            {
                CountyId = countyId,
                Considered = considered,
                AlreadyClosed = alreadyClosed,
                NewlyClosed = 0,
                NoMatch = 0,
                Ambiguous = 0,
                MissingApn = 0,
            };
        }

        // Index PACS parcels for this county by normalized APN. Group
        // so we can detect 2+ matches without a second query per row.
        var parcels = await _db.TfParcels
            .Where(p => p.CountyId == countyId && p.ParcelNumber != null)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var byApn = parcels
            .Where(p => !string.IsNullOrWhiteSpace(p.ParcelNumber))
            .GroupBy(p => Normalize(p.ParcelNumber!))
            .ToDictionary(g => g.Key, g => g.ToList());

        var newlyClosed = 0;
        var noMatch = 0;
        var ambiguous = 0;
        var missingApn = 0;
        var now = DateTime.UtcNow;

        foreach (var geom in pending)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (string.IsNullOrWhiteSpace(geom.ArcGisApn))
            {
                missingApn++;
                continue;
            }

            var key = Normalize(geom.ArcGisApn);
            if (!byApn.TryGetValue(key, out var candidates) || candidates.Count == 0)
            {
                noMatch++;
                continue;
            }

            if (candidates.Count > 1)
            {
                ambiguous++;
                _logger.LogWarning(
                    "ArcGIS crosswalk: {Count} tf_parcel rows match APN '{Apn}' in county {CountyId}; leaving unlinked.",
                    candidates.Count, geom.ArcGisApn, countyId);
                continue;
            }

            geom.TfParcelId = candidates[0].TfParcelId;
            geom.UpdatedAt = now;
            newlyClosed++;
        }

        if (newlyClosed > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        await RecordGateAsync(countyId, considered, alreadyClosed,
            newlyClosed, noMatch, ambiguous, missingApn,
            cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "ArcGIS crosswalk closure for county {CountyId}: considered={Considered} alreadyClosed={AlreadyClosed} newlyClosed={NewlyClosed} noMatch={NoMatch} ambiguous={Ambiguous} missingApn={MissingApn}",
            countyId, considered, alreadyClosed, newlyClosed, noMatch, ambiguous, missingApn);

        return new ArcGisCrosswalkResult
        {
            CountyId = countyId,
            Considered = considered,
            AlreadyClosed = alreadyClosed,
            NewlyClosed = newlyClosed,
            NoMatch = noMatch,
            Ambiguous = ambiguous,
            MissingApn = missingApn,
        };
    }

    /// <summary>
    /// Normalize APNs for case-insensitive matching. PACS parcel
    /// numbers are typically already canonical, but ArcGIS values may
    /// arrive with surrounding whitespace or mixed case from
    /// operator-edited attribute tables.
    /// </summary>
    private static string Normalize(string apn) => apn.Trim().ToUpperInvariant();

    private async Task RecordGateAsync(
        Guid countyId,
        int considered,
        int alreadyClosed,
        int newlyClosed,
        int noMatch,
        int ambiguous,
        int missingApn,
        CancellationToken cancellationToken)
    {
        // The gate is recorded against a synthetic load_batch dedicated
        // to crosswalk-closure passes. This keeps the doctrine clean:
        // every promotion_gate_result still has a load_batch parent,
        // even when the operation is a maintenance pass rather than a
        // source ingest.
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-crosswalk",
            SourceFileOrDatabase = $"county:{countyId}",
            SourceQueryHash = string.Empty,
            Operator = "crosswalk-service",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            RowsExtracted = considered,
            RowsPromoted = newlyClosed,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var unresolved = noMatch + ambiguous + missingApn;
        var status = unresolved == 0 && considered > 0
            ? "PASS"
            : (newlyClosed > 0 || considered == 0 ? "WARN" : "FAIL");

        var detail = $"considered={considered} alreadyClosed={alreadyClosed} " +
                     $"newlyClosed={newlyClosed} noMatch={noMatch} " +
                     $"ambiguous={ambiguous} missingApn={missingApn}";

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = GateName,
            GateStage = "ARCH",
            Status = status,
            Expected = considered.ToString(CultureInfo.InvariantCulture),
            Actual = (alreadyClosed + newlyClosed).ToString(CultureInfo.InvariantCulture),
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
