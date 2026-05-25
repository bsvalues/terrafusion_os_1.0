using TerraFusion.Modules.CurrentUse.Audit;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Trace;

public sealed class CurrentUseTraceAuditSink : ICurrentUseAuditSink
{
    private readonly ICurrentUseTraceService _traceService;

    public CurrentUseTraceAuditSink(ICurrentUseTraceService traceService)
    {
        _traceService = traceService;
    }

    public async Task EmitAsync(CurrentUseAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        await _traceService.AppendAsync(
            new AppendCurrentUseTraceEventDto(
                auditEvent.CountyId,
                auditEvent.ParcelId,
                null,
                null,
                CurrentUseTraceAction.RollbackCalculationRun,
                auditEvent.UserId,
                auditEvent.UserId,
                auditEvent.Explanation ?? auditEvent.Action,
                auditEvent.CalculationVersion,
                Array.Empty<Guid>(),
                null),
            cancellationToken);
    }
}
