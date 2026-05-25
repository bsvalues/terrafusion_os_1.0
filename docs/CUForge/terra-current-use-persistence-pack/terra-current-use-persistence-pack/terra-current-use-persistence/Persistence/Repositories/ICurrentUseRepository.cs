using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Repositories;

public interface ICurrentUseRepository
{
    Task<CurrentUseClassification?> GetActiveClassificationAsync(
        Guid countyId,
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseEvidenceItem>> GetEvidenceAsync(
        Guid countyId,
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseTimelineEvent>> GetTimelineAsync(
        Guid countyId,
        Guid parcelId,
        CancellationToken cancellationToken);

    Task AddRollbackCalculationAsync(
        RollbackCalculation calculation,
        CancellationToken cancellationToken);

    Task AddTimelineEventAsync(
        CurrentUseTimelineEvent timelineEvent,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
