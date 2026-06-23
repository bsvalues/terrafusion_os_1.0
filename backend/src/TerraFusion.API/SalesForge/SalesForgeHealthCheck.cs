using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.SalesForge;

/// <summary>
/// Health check for the SalesForge subsystem.
/// Verifies:
/// 1. Database connectivity (ComparableSales table accessible)
/// 2. Data freshness (sales exist for current tax year window)
/// 3. Service availability (OLS + SaleQualification services registered)
/// </summary>
public sealed class SalesForgeHealthCheck : IHealthCheck
{
    private readonly TerraFusionDbContext _db;
    private readonly IServiceProvider _services;

    public SalesForgeHealthCheck(TerraFusionDbContext db, IServiceProvider services)
    {
        _db = db;
        _services = services;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>();

        try
        {
            // 1. Database connectivity
            var canConnect = await _db.Database.CanConnectAsync(cancellationToken);
            if (!canConnect)
            {
                return HealthCheckResult.Unhealthy("Cannot connect to database", data: data);
            }
            data["database"] = "connected";

            // 2. Data freshness — check that ComparableSales has data
            var totalSales = await _db.ComparableSales.CountAsync(cancellationToken);
            data["totalSales"] = totalSales;

            if (totalSales == 0)
            {
                return HealthCheckResult.Degraded("No comparable sales in database", data: data);
            }

            // 3. Check current year window (taxYear and taxYear-1)
            var currentYear = DateTime.Now.Year;
            var recentSales = await _db.ComparableSales
                .Where(s => s.SalesYear >= currentYear - 2)
                .CountAsync(cancellationToken);
            data["recentSales"] = recentSales;
            data["windowStart"] = currentYear - 2;
            data["windowEnd"] = currentYear;

            if (recentSales == 0)
            {
                return HealthCheckResult.Degraded(
                    $"No sales in {currentYear - 2}–{currentYear} window",
                    data: data);
            }

            // 4. Service availability
            var olsService = _services.GetService<Services.IOlsRegressionService>();
            var qualService = _services.GetService<Services.ISaleQualificationService>();
            data["olsServiceRegistered"] = olsService != null;
            data["qualServiceRegistered"] = qualService != null;

            if (olsService == null || qualService == null)
            {
                return HealthCheckResult.Degraded("One or more SalesForge services not registered", data: data);
            }

            // 5. Qualification distribution (sanity check)
            var qualifiedCount = await _db.ComparableSales
                .Where(s => s.QualificationDecision == "qualified" || s.QualificationRecommendation == "qualified")
                .CountAsync(cancellationToken);
            data["qualifiedSales"] = qualifiedCount;
            var qualifiedRatio = totalSales > 0 ? (double)qualifiedCount / totalSales : 0;
            data["qualifiedRatio"] = Math.Round(qualifiedRatio, 3);

            return HealthCheckResult.Healthy("SalesForge operational", data: data);
        }
        catch (Exception ex)
        {
            data["exception"] = ex.Message;
            return HealthCheckResult.Unhealthy("SalesForge health check failed", ex, data);
        }
    }
}
