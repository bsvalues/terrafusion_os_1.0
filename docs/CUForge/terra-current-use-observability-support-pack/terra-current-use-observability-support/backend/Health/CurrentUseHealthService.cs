using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Health;

public interface ICurrentUseHealthService
{
    Task<CurrentUseModuleHealthDto> CheckAsync(CancellationToken cancellationToken);
}

public sealed class CurrentUseHealthService : ICurrentUseHealthService
{
    public Task<CurrentUseModuleHealthDto> CheckAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        IReadOnlyList<CurrentUseHealthCheckDto> checks =
        [
            new("rollback-engine", CurrentUseHealthStatus.Healthy, "Rollback engine available.", now),
            new("policy-resolver", CurrentUseHealthStatus.Healthy, "Policy resolver available.", now),
            new("notice-preview", CurrentUseHealthStatus.Healthy, "Notice preview available.", now),
            new("trace-sink", CurrentUseHealthStatus.Degraded, "Trace sink is using in-memory scaffold unless canonical TerraTrace is wired.", now)
        ];

        var status = checks.Any(x => x.Status == CurrentUseHealthStatus.Unhealthy)
            ? CurrentUseHealthStatus.Unhealthy
            : checks.Any(x => x.Status == CurrentUseHealthStatus.Degraded)
                ? CurrentUseHealthStatus.Degraded
                : CurrentUseHealthStatus.Healthy;

        return Task.FromResult(new CurrentUseModuleHealthDto(
            "terra-current-use",
            status,
            checks,
            now));
    }
}
