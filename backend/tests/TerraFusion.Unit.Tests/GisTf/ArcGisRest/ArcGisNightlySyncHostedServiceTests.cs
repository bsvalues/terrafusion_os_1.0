using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;
using TerraFusion.Core.GIS.ArcGisRest;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

/// <summary>
/// Slice G1-D-2: tests for
/// <see cref="ArcGisNightlySyncHostedService"/>. The hosted service
/// is invoked through <see cref="ArcGisNightlySyncHostedService.RunOneCycleAsync"/>
/// directly so we can exercise the loop logic without standing up a
/// PeriodicTimer or wall-clock delay.
/// </summary>
public sealed class ArcGisNightlySyncHostedServiceTests
{
    private static readonly Guid CountyA = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB = Guid.Parse("20200020-2020-2020-2020-202020202020");
    private static readonly Guid CountyC = Guid.Parse("30300030-3030-3030-3030-303030303030");

    private static (ArcGisNightlySyncHostedService service, RecordingSyncService recorder)
        Build(
            IDictionary<string, CountyArcGisOptions>? counties = null,
            ArcGisSyncSchedulerOptions? scheduler = null,
            Func<Guid, ArcGisSyncResult>? perCountyResult = null,
            Func<Guid, Exception>? perCountyThrow = null)
    {
        var arcgisOptions = new ArcGisFeatureServiceOptions
        {
            Counties = counties ?? new Dictionary<string, CountyArcGisOptions>(),
        };
        var schedulerOptions = scheduler ?? new ArcGisSyncSchedulerOptions
        {
            Enabled = true,
            InitialDelay = TimeSpan.Zero,
            Interval = TimeSpan.FromMinutes(5),
            OperatorName = "scheduler-test",
        };

        var recorder = new RecordingSyncService(perCountyResult, perCountyThrow);

        var services = new ServiceCollection();
        services.AddScoped<IArcGisSyncService>(_ => recorder);
        var provider = services.BuildServiceProvider();

        var svc = new ArcGisNightlySyncHostedService(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new StaticOptionsMonitor<ArcGisSyncSchedulerOptions>(schedulerOptions),
            new StaticOptionsMonitor<ArcGisFeatureServiceOptions>(arcgisOptions),
            NullLogger<ArcGisNightlySyncHostedService>.Instance);
        return (svc, recorder);
    }

    [Fact]
    public async Task RunOneCycle_NoCountiesConfigured_DoesNothing()
    {
        var (svc, recorder) = Build();

        var touched = await svc.RunOneCycleAsync(CancellationToken.None);

        touched.Should().Be(0);
        recorder.Calls.Should().BeEmpty();
        svc.CompletedCycles.Should().Be(1);
    }

    [Fact]
    public async Task RunOneCycle_IteratesEveryConfiguredCounty()
    {
        var counties = new Dictionary<string, CountyArcGisOptions>
        {
            [CountyA.ToString()] = new() { ParcelFeatureServiceUrl = "https://a/FeatureServer/0" },
            [CountyB.ToString()] = new() { ParcelFeatureServiceUrl = "https://b/FeatureServer/0" },
            [CountyC.ToString()] = new() { ParcelFeatureServiceUrl = "https://c/FeatureServer/0" },
        };
        var (svc, recorder) = Build(counties);

        var touched = await svc.RunOneCycleAsync(CancellationToken.None);

        touched.Should().Be(3);
        recorder.Calls.Should().HaveCount(3);
        recorder.Calls.Select(c => c.CountyId).Should().BeEquivalentTo(new[]
        {
            CountyA, CountyB, CountyC,
        });
    }

    [Fact]
    public async Task RunOneCycle_OperatorName_FromSchedulerOptions()
    {
        var counties = new Dictionary<string, CountyArcGisOptions>
        {
            [CountyA.ToString()] = new() { ParcelFeatureServiceUrl = "https://a/FeatureServer/0" },
        };
        var scheduler = new ArcGisSyncSchedulerOptions
        {
            Enabled = true,
            OperatorName = "nightly-cron",
        };
        var (svc, recorder) = Build(counties, scheduler);

        await svc.RunOneCycleAsync(CancellationToken.None);

        recorder.Calls.Single().OperatorName.Should().Be("nightly-cron");
    }

    [Fact]
    public async Task RunOneCycle_OneCountyThrows_OthersStillRun()
    {
        var counties = new Dictionary<string, CountyArcGisOptions>
        {
            [CountyA.ToString()] = new() { ParcelFeatureServiceUrl = "https://a/FeatureServer/0" },
            [CountyB.ToString()] = new() { ParcelFeatureServiceUrl = "https://b/FeatureServer/0" },
            [CountyC.ToString()] = new() { ParcelFeatureServiceUrl = "https://c/FeatureServer/0" },
        };
        var (svc, recorder) = Build(
            counties,
            perCountyThrow: id => id == CountyB
                ? new InvalidOperationException("simulated failure")
                : null!);

        var touched = await svc.RunOneCycleAsync(CancellationToken.None);

        touched.Should().Be(3, "every county must be visited even if one throws");
        recorder.Calls.Should().HaveCount(3);
    }

    [Fact]
    public async Task RunOneCycle_MalformedCountyKey_IsSkipped_NotCounted()
    {
        var counties = new Dictionary<string, CountyArcGisOptions>
        {
            [CountyA.ToString()] = new() { ParcelFeatureServiceUrl = "https://a/FeatureServer/0" },
            ["not-a-guid"] = new() { ParcelFeatureServiceUrl = "https://x/FeatureServer/0" },
            [CountyB.ToString()] = new() { ParcelFeatureServiceUrl = "https://b/FeatureServer/0" },
        };
        var (svc, recorder) = Build(counties);

        var touched = await svc.RunOneCycleAsync(CancellationToken.None);

        // Two valid GUIDs visited; malformed key skipped (continue).
        touched.Should().Be(2);
        recorder.Calls.Select(c => c.CountyId).Should().BeEquivalentTo(new[] { CountyA, CountyB });
    }

    [Fact]
    public async Task RunOneCycle_RespectsCancellation_BetweenCounties()
    {
        var counties = new Dictionary<string, CountyArcGisOptions>
        {
            [CountyA.ToString()] = new() { ParcelFeatureServiceUrl = "https://a/FeatureServer/0" },
            [CountyB.ToString()] = new() { ParcelFeatureServiceUrl = "https://b/FeatureServer/0" },
        };
        using var cts = new CancellationTokenSource();
        var (svc, recorder) = Build(
            counties,
            perCountyResult: id =>
            {
                cts.Cancel(); // cancel after first county processes
                return new ArcGisSyncResult
                {
                    LoadBatchId = Guid.NewGuid(),
                    CountyId = id,
                    Status = "COMPLETED",
                    FeaturesFetched = 0,
                    FeaturesUpserted = 0,
                    FeaturesSoftDeleted = 0,
                };
            });

        Func<Task> act = async () => await svc.RunOneCycleAsync(cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        // Exactly one county was processed before cancellation.
        recorder.Calls.Should().HaveCount(1);
    }

    [Fact]
    public async Task RunOneCycle_IncrementsCompletedCycles_OnEachInvocation()
    {
        var counties = new Dictionary<string, CountyArcGisOptions>
        {
            [CountyA.ToString()] = new() { ParcelFeatureServiceUrl = "https://a/FeatureServer/0" },
        };
        var (svc, _) = Build(counties);

        await svc.RunOneCycleAsync(CancellationToken.None);
        await svc.RunOneCycleAsync(CancellationToken.None);
        await svc.RunOneCycleAsync(CancellationToken.None);

        svc.CompletedCycles.Should().Be(3);
    }

    [Fact]
    public void SchedulerOptions_DefaultsAreSafe()
    {
        var opts = new ArcGisSyncSchedulerOptions();

        opts.Enabled.Should().BeFalse(
            "scheduler must default OFF — opt-in only");
        opts.Interval.Should().Be(TimeSpan.FromHours(24));
        opts.InitialDelay.Should().Be(TimeSpan.FromMinutes(2));
        opts.OperatorName.Should().Be("arcgis-scheduler");
        ArcGisSyncSchedulerOptions.SectionName.Should().Be("ArcGisSyncScheduler");
    }

    // ── Test doubles ───────────────────────────────────────────────

    private sealed class RecordingSyncService : IArcGisSyncService
    {
        private readonly Func<Guid, ArcGisSyncResult>? _resultFactory;
        private readonly Func<Guid, Exception>? _throwFactory;
        public List<(Guid CountyId, string OperatorName)> Calls { get; } = new();

        public RecordingSyncService(
            Func<Guid, ArcGisSyncResult>? resultFactory,
            Func<Guid, Exception>? throwFactory)
        {
            _resultFactory = resultFactory;
            _throwFactory = throwFactory;
        }

        public Task<ArcGisSyncResult> SyncCountyAsync(
            Guid countyId, string operatorName, CancellationToken cancellationToken = default)
        {
            Calls.Add((countyId, operatorName));

            var ex = _throwFactory?.Invoke(countyId);
            if (ex is not null)
            {
                throw ex;
            }

            var result = _resultFactory?.Invoke(countyId) ?? new ArcGisSyncResult
            {
                LoadBatchId = Guid.NewGuid(),
                CountyId = countyId,
                Status = "COMPLETED",
                FeaturesFetched = 0,
                FeaturesUpserted = 0,
                FeaturesSoftDeleted = 0,
            };
            return Task.FromResult(result);
        }
    }

    private sealed class StaticOptionsMonitor<T> : IOptionsMonitor<T>
    {
        public StaticOptionsMonitor(T value) => CurrentValue = value;
        public T CurrentValue { get; }
        public T Get(string? name) => CurrentValue;
        public IDisposable? OnChange(Action<T, string?> listener) => null;
    }
}
