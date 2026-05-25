using Microsoft.EntityFrameworkCore;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Repositories;

// Replace AppDbContext with the actual TerraFusion DbContext type.
public sealed class CurrentUseRepository : ICurrentUseRepository
{
    private readonly DbContext _db;

    public CurrentUseRepository(DbContext db)
    {
        _db = db;
    }

    public async Task<CurrentUseClassification?> GetActiveClassificationAsync(
        Guid countyId,
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return await _db.Set<CurrentUseClassification>()
            .AsNoTracking()
            .Where(x => x.CountyId == countyId && x.ParcelId == parcelId && x.Active)
            .OrderByDescending(x => x.UpdatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CurrentUseEvidenceItem>> GetEvidenceAsync(
        Guid countyId,
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return await _db.Set<CurrentUseEvidenceItem>()
            .AsNoTracking()
            .Where(x => x.CountyId == countyId && x.ParcelId == parcelId)
            .OrderBy(x => x.EvidenceType)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CurrentUseTimelineEvent>> GetTimelineAsync(
        Guid countyId,
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return await _db.Set<CurrentUseTimelineEvent>()
            .AsNoTracking()
            .Where(x => x.CountyId == countyId && x.ParcelId == parcelId)
            .OrderByDescending(x => x.EventDate)
            .ToArrayAsync(cancellationToken);
    }

    public async Task AddRollbackCalculationAsync(
        RollbackCalculation calculation,
        CancellationToken cancellationToken)
    {
        await _db.Set<RollbackCalculation>().AddAsync(calculation, cancellationToken);
    }

    public async Task AddTimelineEventAsync(
        CurrentUseTimelineEvent timelineEvent,
        CancellationToken cancellationToken)
    {
        await _db.Set<CurrentUseTimelineEvent>().AddAsync(timelineEvent, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _db.SaveChangesAsync(cancellationToken);
    }
}
