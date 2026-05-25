namespace TerraFusion.Modules.CurrentUse.Audit;

public sealed record CurrentUseAuditEvent(
    Guid CountyId,
    Guid ParcelId,
    string UserId,
    string Action,
    DateTimeOffset Timestamp,
    string? CalculationVersion,
    string? Explanation
);

public interface ICurrentUseAuditSink
{
    Task EmitAsync(CurrentUseAuditEvent auditEvent, CancellationToken cancellationToken);
}

public sealed class NoopCurrentUseAuditSink : ICurrentUseAuditSink
{
    public Task EmitAsync(CurrentUseAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        // Phase 1 placeholder. Replace with TerraTrace append-only sink.
        return Task.CompletedTask;
    }
}
