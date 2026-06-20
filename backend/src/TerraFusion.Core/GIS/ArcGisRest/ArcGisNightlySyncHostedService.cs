using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-D-2: nightly cycle for the ArcGIS REST sync.
///
/// <para>For each county configured in
/// <see cref="ArcGisFeatureServiceOptions.Counties"/>, this service
/// opens a fresh DI scope, resolves <see cref="IArcGisSyncService"/>,
/// and invokes <see cref="IArcGisSyncService.SyncCountyAsync"/>. A
/// failure on one county does NOT abort the cycle — each county is
/// isolated.</para>
///
/// <para>The cycle method <see cref="RunOneCycleAsync"/> is exposed
/// so tests can invoke it directly without standing up
/// <see cref="PeriodicTimer"/> or wall-clock delays.</para>
/// </summary>
public sealed class ArcGisNightlySyncHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptionsMonitor<ArcGisSyncSchedulerOptions> _scheduler;
    private readonly IOptionsMonitor<ArcGisFeatureServiceOptions> _arcgis;
    private readonly ILogger<ArcGisNightlySyncHostedService> _logger;

    public ArcGisNightlySyncHostedService(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<ArcGisSyncSchedulerOptions> scheduler,
        IOptionsMonitor<ArcGisFeatureServiceOptions> arcgis,
        ILogger<ArcGisNightlySyncHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _scheduler = scheduler;
        _arcgis = arcgis;
        _logger = logger;
    }

    /// <summary>
    /// Number of cycles completed since process start. Test hook.
    /// </summary>
    public int CompletedCycles { get; private set; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var scheduler = _scheduler.CurrentValue;
        if (!scheduler.Enabled)
        {
            _logger.LogInformation(
                "ArcGIS nightly sync is disabled (ArcGisSyncScheduler:Enabled=false). Hosted service will idle.");
            return;
        }

        try
        {
            if (scheduler.InitialDelay > TimeSpan.Zero)
            {
                await Task.Delay(scheduler.InitialDelay, stoppingToken).ConfigureAwait(false);
            }

            using var timer = new PeriodicTimer(scheduler.Interval);
            do
            {
                await RunOneCycleAsync(stoppingToken).ConfigureAwait(false);
            } while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false));
        }
        catch (OperationCanceledException)
        {
            // Graceful shutdown; expected on host stop.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ArcGIS nightly sync hosted service crashed.");
            throw;
        }
    }

    /// <summary>
    /// Runs one full cycle: iterates every configured county and
    /// invokes <see cref="IArcGisSyncService.SyncCountyAsync"/> for
    /// each in its own DI scope. Returns the count of counties
    /// touched (regardless of per-county success).
    /// </summary>
    public async Task<int> RunOneCycleAsync(CancellationToken cancellationToken)
    {
        var arcgis = _arcgis.CurrentValue;
        var operatorName = _scheduler.CurrentValue.OperatorName;
        var keys = arcgis.Counties.Keys.ToList();

        if (keys.Count == 0)
        {
            _logger.LogInformation(
                "ArcGIS nightly sync cycle: no counties configured; skipping.");
            CompletedCycles++;
            return 0;
        }

        _logger.LogInformation(
            "ArcGIS nightly sync cycle: starting for {Count} counties as operator={Operator}",
            keys.Count, operatorName);

        var touched = 0;
        foreach (var key in keys)
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Config keys are now FIPS codes (e.g. "53005"). The county DB GUID
            // is stored alongside the service config as CountyArcGisOptions.CountyId.
            if (!arcgis.Counties.TryGetValue(key, out var countyOpts) ||
                countyOpts.CountyId is null)
            {
                _logger.LogWarning(
                    "ArcGIS nightly sync: skipping FIPS '{Key}' — no CountyId configured in ArcGisFeatureServices:Counties:{Key}:CountyId.",
                    key);
                continue;
            }

            var fipsCode = key;
            var countyId = countyOpts.CountyId.Value;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sync = scope.ServiceProvider.GetRequiredService<IArcGisSyncService>();
                var result = await sync
                    .SyncCountyAsync(fipsCode, countyId, operatorName, cancellationToken)
                    .ConfigureAwait(false);

                _logger.LogInformation(
                    "ArcGIS nightly sync: county {CountyId} {Status} (fetched={Fetched} upserted={Upserted} softDeleted={SoftDeleted})",
                    countyId, result.Status, result.FeaturesFetched,
                    result.FeaturesUpserted, result.FeaturesSoftDeleted);
            }
            catch (OperationCanceledException)
            {
                throw; // propagate shutdown
            }
            catch (Exception ex)
            {
                // Failure isolation: a single county must not kill
                // the cycle. SyncCountyAsync already turns most
                // failures into FAILED-status results without
                // throwing; this catch is the belt-and-suspenders for
                // anything outside its try/catch (DI scope
                // construction, options resolution, etc.).
                _logger.LogError(ex,
                    "ArcGIS nightly sync: unexpected failure for county {CountyId}; continuing cycle.",
                    countyId);
            }
            finally
            {
                touched++;
            }
        }

        CompletedCycles++;
        return touched;
    }
}
