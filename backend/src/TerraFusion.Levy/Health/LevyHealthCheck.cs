using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Health;

/// <summary>
/// Health check for the Levy module database.
/// Verifies:
///   1. Database connectivity
///   2. At least one active district exists (seed integrity)
///   3. IPD reference data is seeded for the current tax year
///   4. Levy rates exist for the current year
/// </summary>
public sealed class LevyHealthCheck : IHealthCheck
{
    private readonly LevyDbContext _db;

    public LevyHealthCheck(LevyDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>();
        var currentYear = DateTime.UtcNow.Year;

        try
        {
            // 1. Database connectivity
            var canConnect = await _db.Database.CanConnectAsync(cancellationToken);
            if (!canConnect)
            {
                return HealthCheckResult.Unhealthy("Cannot connect to Levy database",
                    data: new Dictionary<string, object> { ["database"] = "unreachable" });
            }
            data["database"] = "connected";

            // 2. District seed integrity
            var districtCount = await _db.Districts
                .CountAsync(d => d.IsActive, cancellationToken);
            data["active_districts"] = districtCount;

            // 3. IPD reference data for current year
            var ipdSeeded = await _db.ReferenceSources
                .AnyAsync(r => r.SourceType == ReferenceSourceType.Ipd
                            && r.TaxYear == currentYear
                            && r.IsActive, cancellationToken);
            data["ipd_seeded_current_year"] = ipdSeeded;

            // 4. Levy rates for current year
            var rateCount = await _db.LevyRates
                .CountAsync(r => r.EffectiveDate.Year == currentYear, cancellationToken);
            data["levy_rates_current_year"] = rateCount;

            // Determine health status
            if (districtCount == 0 && rateCount == 0)
            {
                return HealthCheckResult.Degraded(
                    "Levy database connected but no districts or rates seeded",
                    data: data);
            }

            if (!ipdSeeded)
            {
                return HealthCheckResult.Degraded(
                    $"IPD reference data not seeded for tax year {currentYear}. " +
                    "Limit factor will fall back to statutory cap 1.01.",
                    data: data);
            }

            return HealthCheckResult.Healthy("Levy module operational", data: data);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "Levy health check failed",
                exception: ex,
                data: data);
        }
    }
}
