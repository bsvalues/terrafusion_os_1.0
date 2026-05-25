namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseHealthStatus
{
    Healthy,
    Degraded,
    Unhealthy
}

public sealed record CurrentUseHealthCheckDto(
    string Component,
    CurrentUseHealthStatus Status,
    string Message,
    DateTimeOffset CheckedAt
);

public sealed record CurrentUseModuleHealthDto(
    string ModuleId,
    CurrentUseHealthStatus Status,
    IReadOnlyList<CurrentUseHealthCheckDto> Checks,
    DateTimeOffset CheckedAt
);

public sealed record CurrentUseMetricDto(
    string MetricName,
    decimal Value,
    string Unit,
    IReadOnlyDictionary<string, string> Tags,
    DateTimeOffset RecordedAt
);

public sealed record CurrentUseErrorDto(
    string ErrorCode,
    string Severity,
    string UserMessage,
    string TechnicalMessage,
    string? CorrelationId,
    DateTimeOffset OccurredAt
);
