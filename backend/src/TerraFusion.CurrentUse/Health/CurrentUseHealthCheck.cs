using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;

namespace TerraFusion.CurrentUse.Health;

/// <summary>
/// Health check for the CurrentUse module.
/// Verifies database connectivity, schema existence, and seed data integrity.
/// </summary>
public class CurrentUseHealthCheck : IHealthCheck
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<CurrentUseHealthCheck> _logger;

    public CurrentUseHealthCheck(CurrentUseDbContext db, ILogger<CurrentUseHealthCheck> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Database connectivity
            if (!await _db.Database.CanConnectAsync(cancellationToken))
            {
                return HealthCheckResult.Unhealthy("Cannot connect to CurrentUse database");
            }

            // 2. Interest rates exist (seed data integrity)
            var rateCount = await _db.InterestRates.CountAsync(cancellationToken);
            if (rateCount == 0)
            {
                return HealthCheckResult.Degraded("No interest rates found — seed data may be missing");
            }

            // 3. Check for current year rate
            var currentYear = DateTime.UtcNow.Year;
            var hasCurrentRate = await _db.InterestRates
                .AnyAsync(r => r.Year == currentYear, cancellationToken);

            var data = new Dictionary<string, object>
            {
                ["interestRateCount"] = rateCount,
                ["hasCurrentYearRate"] = hasCurrentRate,
                ["classificationCount"] = await _db.Classifications.CountAsync(cancellationToken),
                ["activeRemovalCount"] = await _db.Removals.CountAsync(r => r.Status == "Pending", cancellationToken)
            };

            if (!hasCurrentRate)
            {
                return HealthCheckResult.Degraded(
                    $"No interest rate for {currentYear} — rate updates may be needed",
                    data: data);
            }

            return HealthCheckResult.Healthy("CurrentUse module operational", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CurrentUse health check failed");
            return HealthCheckResult.Unhealthy("CurrentUse health check exception", ex);
        }
    }
}
