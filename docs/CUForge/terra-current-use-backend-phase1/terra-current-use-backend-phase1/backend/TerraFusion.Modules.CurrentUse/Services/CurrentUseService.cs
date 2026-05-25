using TerraFusion.Modules.CurrentUse.Domain;
using TerraFusion.Modules.CurrentUse.Domain.Rollback;
using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Audit;

namespace TerraFusion.Modules.CurrentUse.Services;

public sealed class CurrentUseService : ICurrentUseService
{
    private readonly RollbackCalculator _rollbackCalculator;
    private readonly ICurrentUseAuditSink _auditSink;

    public CurrentUseService(RollbackCalculator rollbackCalculator, ICurrentUseAuditSink auditSink)
    {
        _rollbackCalculator = rollbackCalculator;
        _auditSink = auditSink;
    }

    public Task<CurrentUseOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken cancellationToken)
    {
        var dto = new CurrentUseOverviewDto(
            parcelId,
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            2026,
            ClassificationType.FarmAndAgricultural,
            CurrentUseLifecycleState.ActiveMonitoring,
            18.42m,
            19.18m,
            0.76m,
            42_500m,
            318_000m,
            11_240.55m,
            "Sample Owner",
            "Sample Farm Operator LLC",
            true,
            "CU-GROUP-0091",
            72,
            "MEDIUM",
            new DateOnly(2025, 10, 15),
            new DateOnly(2026, 10, 15));

        return Task.FromResult(dto);
    }

    public Task<IReadOnlyList<CurrentUseEvidenceItemDto>> GetEvidenceAsync(Guid parcelId, CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseEvidenceItemDto> items =
        [
            new(Guid.NewGuid(), parcelId, "FARM_PLAN", "RECEIVED", null, DateTimeOffset.Parse("2025-10-02T00:00:00Z"), null, null, "Five-year farm plan received."),
            new(Guid.NewGuid(), parcelId, "LEASE_AGREEMENT", "REQUESTED", null, null, null, null, "Lease required because owner is not active operator."),
            new(Guid.NewGuid(), parcelId, "INCOME_PROOF", "MISSING", null, null, null, null, "Income proof required for parcel under 20 acres.")
        ];

        return Task.FromResult(items);
    }

    public Task<IReadOnlyList<CurrentUseTimelineEventDto>> GetTimelineAsync(Guid parcelId, CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseTimelineEventDto> events =
        [
            new(Guid.NewGuid(), parcelId, "CLASSIFICATION_CREATED", DateTimeOffset.Parse("2019-04-17T00:00:00Z"), "Assessor Staff", "Farm & Agricultural classification approved.", null),
            new(Guid.NewGuid(), parcelId, "DOCUMENT_RECEIVED", DateTimeOffset.Parse("2025-10-02T00:00:00Z"), "Current Use Desk", "Updated five-year farm plan received.", null),
            new(Guid.NewGuid(), parcelId, "REVIEW_NOTE_ADDED", DateTimeOffset.Parse("2026-03-01T00:00:00Z"), "Current Use Desk", "Parcel placed in monitoring due to missing income proof.", null)
        ];

        return Task.FromResult(events);
    }

    public async Task<RollbackCalculationResultDto> CalculateRollbackAsync(
        RollbackCalculationInputDto input,
        CancellationToken cancellationToken)
    {
        var result = _rollbackCalculator.Calculate(input);

        await _auditSink.EmitAsync(
            new CurrentUseAuditEvent(
                input.CountyId,
                input.ParcelId,
                input.CreatedBy,
                "ROLLBACK_CALCULATION_RUN",
                DateTimeOffset.UtcNow,
                result.CalculationVersion,
                $"Rollback calculation generated. Total due: {result.TotalDue}."),
            cancellationToken);

        return result;
    }
}
