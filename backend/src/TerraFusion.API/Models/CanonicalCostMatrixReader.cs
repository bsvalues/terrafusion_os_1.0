// ---------------------------------------------------------------------------
// COMPILE STUB — CanonicalCostMatrixReader
// Declared in TerraFusion.Core.CostForge namespace (same as controllers' using).
// Lives in TerraFusion.API to access TerraFusion.Data.TerraFusionDbContext
// without creating a circular project reference.
// ---------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.Core.CostForge;

/// <summary>
/// Reads the latest primary CostMatrix rows for a given county from the database.
/// "Primary" means MatrixType != "SecondaryFeature".
/// </summary>
public static class CanonicalCostMatrixReader
{
    /// <summary>
    /// Returns all primary CostMatrix rows for the most recent MatrixYear that
    /// matches the given county name or county-id string.
    /// Returns an empty list when no data is seeded.
    /// </summary>
    public static Task<List<CostMatrix>> LoadLatestPrimaryRowsAsync(
        TerraFusionDbContext db,
        string? countyIdentifier,
        CancellationToken cancellationToken = default)
    {
        return LoadCoreAsync(db, countyIdentifier, cancellationToken);
    }

    private static async Task<List<CostMatrix>> LoadCoreAsync(
        TerraFusionDbContext db,
        string? countyIdentifier,
        CancellationToken cancellationToken)
    {
        var query = db.CostMatrices
            .AsNoTracking()
            .Where(m => m.MatrixType != "SecondaryFeature");

        if (!string.IsNullOrWhiteSpace(countyIdentifier))
        {
            // Support both county name and county Guid string
            if (Guid.TryParse(countyIdentifier, out var countyId))
                query = query.Where(m => m.CountyId == countyId);
            else
                query = query.Where(m => m.County == countyIdentifier);
        }

        var latestYear = await query.MaxAsync(m => (int?)m.MatrixYear, cancellationToken);
        if (latestYear is null)
            return new List<CostMatrix>();

        return await query
            .Where(m => m.MatrixYear == latestYear.Value)
            .ToListAsync(cancellationToken);
    }
}
