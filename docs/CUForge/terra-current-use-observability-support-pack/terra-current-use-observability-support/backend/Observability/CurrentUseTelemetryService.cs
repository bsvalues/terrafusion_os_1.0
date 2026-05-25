using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Observability;

public interface ICurrentUseTelemetryService
{
    void RecordMetric(CurrentUseMetricDto metric);
    void RecordError(CurrentUseErrorDto error);
    IReadOnlyList<CurrentUseMetricDto> GetRecentMetrics();
    IReadOnlyList<CurrentUseErrorDto> GetRecentErrors();
}

public sealed class CurrentUseTelemetryService : ICurrentUseTelemetryService
{
    private static readonly List<CurrentUseMetricDto> Metrics = new();
    private static readonly List<CurrentUseErrorDto> Errors = new();

    public void RecordMetric(CurrentUseMetricDto metric)
    {
        Metrics.Add(metric);
        if (Metrics.Count > 500)
        {
            Metrics.RemoveAt(0);
        }
    }

    public void RecordError(CurrentUseErrorDto error)
    {
        Errors.Add(error);
        if (Errors.Count > 500)
        {
            Errors.RemoveAt(0);
        }
    }

    public IReadOnlyList<CurrentUseMetricDto> GetRecentMetrics()
    {
        return Metrics.OrderByDescending(x => x.RecordedAt).Take(100).ToArray();
    }

    public IReadOnlyList<CurrentUseErrorDto> GetRecentErrors()
    {
        return Errors.OrderByDescending(x => x.OccurredAt).Take(100).ToArray();
    }
}
