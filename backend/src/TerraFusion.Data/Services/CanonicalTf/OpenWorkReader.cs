using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Abstractions.DTOs.CanonicalTf;
using TerraFusion.Core.Sync.OpenWork;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice F1: EF-backed implementation of <see cref="IOpenWorkReader"/>.
///
/// <para>An open-work parcel is one with NO matching
/// <c>canonical_tf.tf_assessment_wsdor</c> row for the requested year.
/// Implemented as a left-anti-join (<c>Where(... !Any(...))</c>) so
/// EF translates it to a single SQL round-trip.</para>
///
/// <para>Read-only: <c>AsNoTracking()</c>; no writes; no audit
/// mutations. Sovereign-county filtering is mandatory and applied at
/// the lowest possible level — the reader will NEVER project a parcel
/// from a different <see cref="TerraFusion.Core.Entities.CanonicalTf.TfParcel.CountyId"/>.</para>
///
/// <para>Truncation detection: the reader requests
/// <c>maxResults + 1</c> rows. If it gets back more than
/// <c>maxResults</c>, it trims the tail and reports
/// <see cref="OpenWorkResult.Truncated"/>=true.</para>
/// </summary>
public sealed class OpenWorkReader : IOpenWorkReader
{
    private readonly TerraFusionDbContext _db;

    public OpenWorkReader(TerraFusionDbContext db) => _db = db;

    public async Task<OpenWorkResult> GetOpenWorkAsync(
        Guid countyId,
        short year,
        int maxResults,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty || maxResults <= 0)
        {
            return OpenWorkResult.Empty;
        }

        var query =
            from p in _db.TfParcels.AsNoTracking()
            where p.CountyId == countyId
                  && !_db.TfAssessmentWsdors.Any(a =>
                          a.TfParcelId == p.TfParcelId
                          && a.AssessmentYear == year)
            // Two-stage order: rows with a ParcelNumber first, then by
            // ParcelNumber asc. NULLs sort last so the well-identified
            // backlog leads the queue.
            orderby (p.ParcelNumber == null ? 1 : 0),
                    p.ParcelNumber
            select new OpenWorkItem
            {
                TfParcelId = p.TfParcelId,
                GeoId = p.ParcelNumber,
                PendingReason = "MISSING_WSDOR_FOR_YEAR",
            };

        // Pull one extra row to detect truncation without a COUNT(*).
        var rows = await query
            .Take(maxResults + 1)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var truncated = rows.Count > maxResults;
        if (truncated)
        {
            rows.RemoveAt(rows.Count - 1);
        }

        return new OpenWorkResult
        {
            Items = rows,
            Truncated = truncated,
        };
    }
}
