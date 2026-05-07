using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V7: default
/// <see cref="IImprvAttrQuarantineProfiler"/>.
///
/// <para>Read-only. Loads the canonical-layer imprv_attr
/// quarantine cohort, builds a histogram keyed by
/// <c>(UniverseCode, ImprvAttrId, IAttrValCd)</c>, and returns it
/// alongside per-universe rollups.</para>
///
/// <para>Filters to <c>QuarantineReason = UNKNOWN_ATTRIBUTE</c>
/// (the canonical-layer attribute quarantine reason — distinct
/// from the landing-layer <c>UNKNOWN_I_ATTR_VAL_CD</c>).</para>
/// </summary>
public sealed class ImprvAttrQuarantineProfiler : IImprvAttrQuarantineProfiler
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ImprvAttrQuarantineProfiler> _logger;

    public ImprvAttrQuarantineProfiler(
        TerraFusionDbContext db,
        ILogger<ImprvAttrQuarantineProfiler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ImprvAttrQuarantineProfileResult> ProfileAsync(
        ImprvAttrQuarantineProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            // Full quarantine cohort (both landing- and canonical-layer reasons).
            // Operator filters via ReasonFilter parameter if needed.
            var allRows = await _db.LegacyTfUnprovenImprvAttrs
                .Select(q => new
                {
                    q.UnprovenRowId,
                    q.UniverseCode,
                    q.IAttrValId,
                    q.IAttrValCd,
                    q.QuarantineReason,
                })
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var totalRows = allRows.Count;

            // Reason rollup across the full cohort (independent of any filter).
            var reasonSummary = allRows
                .GroupBy(r => r.QuarantineReason ?? string.Empty)
                .Select(g => new ReasonRollup(g.Key, g.Count()))
                .OrderByDescending(r => r.Count)
                .ToList();

            // Apply reason filter, then universe filter.
            var scoped = allRows
                .Where(r => string.IsNullOrEmpty(request.ReasonFilter)
                            || string.Equals(r.QuarantineReason, request.ReasonFilter, StringComparison.Ordinal))
                .Where(r => string.IsNullOrEmpty(request.UniverseFilter)
                            || string.Equals(r.UniverseCode, request.UniverseFilter, StringComparison.Ordinal))
                .ToList();

            // Histogram: (UniverseCode, ImprvAttrId, IAttrValCd) → count + sample id
            var cells = scoped
                .GroupBy(r => (r.UniverseCode, ImprvAttrId: r.IAttrValId.ToString(CultureInfo.InvariantCulture), r.IAttrValCd))
                .Select(g => new ImprvAttrQuarantineProfileCell(
                    UniverseCode: g.Key.UniverseCode,
                    ImprvAttrId: g.Key.ImprvAttrId,
                    IAttrValCd: g.Key.IAttrValCd,
                    Count: g.Count(),
                    SampleUnprovenRowId: g.First().UnprovenRowId))
                .OrderByDescending(c => c.Count)
                .ThenBy(c => c.UniverseCode ?? string.Empty, StringComparer.Ordinal)
                .ThenBy(c => c.ImprvAttrId, StringComparer.Ordinal)
                .ThenBy(c => c.IAttrValCd, StringComparer.Ordinal)
                .ToList();

            if (request.MaxCells.HasValue)
                cells = cells.Take(request.MaxCells.Value).ToList();

            // Per-universe rollup.
            var universeSummary = scoped
                .GroupBy(r => r.UniverseCode)
                .Select(g => new UniverseRollup(g.Key, g.Count()))
                .OrderByDescending(u => u.Count)
                .ToList();

            var distinctUniverses = scoped.Select(r => r.UniverseCode).Distinct().Count();
            var distinctCodes = scoped.Select(r => r.IAttrValCd).Distinct().Count();

            _logger.LogInformation(
                "[Profile:imprv-attr-quarantine] total={Total} scoped={Scoped} cells={Cells} universes={Universes} codes={Codes}",
                totalRows, scoped.Count, cells.Count, distinctUniverses, distinctCodes);

            return new ImprvAttrQuarantineProfileResult
            {
                Status = "COMPLETED",
                TotalQuarantineRows = totalRows,
                RowsScopedByFilter = scoped.Count,
                DistinctUniverses = distinctUniverses,
                DistinctCodes = distinctCodes,
                Cells = cells,
                UniverseSummary = universeSummary,
                ReasonSummary = reasonSummary,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "[Profile:imprv-attr-quarantine] FAILED");
            return new ImprvAttrQuarantineProfileResult
            {
                Status = "FAILED",
                TotalQuarantineRows = 0,
                RowsScopedByFilter = 0,
                DistinctUniverses = 0,
                DistinctCodes = 0,
                Cells = Array.Empty<ImprvAttrQuarantineProfileCell>(),
                UniverseSummary = Array.Empty<UniverseRollup>(),
                ReasonSummary = Array.Empty<ReasonRollup>(),
                ErrorSummary = $"{ex.GetType().Name}: {ex.Message}",
            };
        }
    }
}
