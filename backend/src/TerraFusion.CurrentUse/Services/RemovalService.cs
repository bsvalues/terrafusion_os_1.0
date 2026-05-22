using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Models;

namespace TerraFusion.CurrentUse.Services;

public class RemovalService : IRemovalService
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<RemovalService> _logger;

    public RemovalService(CurrentUseDbContext db, ILogger<RemovalService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<RemovalDto>> ListAsync(CancellationToken ct = default)
    {
        return await _db.Removals
            .OrderByDescending(r => r.InitiatedDate)
            .Select(r => new RemovalDto(
                r.Id, r.ParcelId, r.ClassificationCode, r.Reason,
                r.InitiatedDate.ToString("yyyy-MM-dd"), r.Status,
                r.RemovalDate.HasValue ? r.RemovalDate.Value.ToString("yyyy-MM-dd") : null,
                r.RollbackAmount, r.InterestAmount, r.PenaltyAmount, r.TotalDue
            ))
            .ToListAsync(ct);
    }

    public async Task<RemovalDto> InitiateAsync(RemovalInitiateRequest request, CancellationToken ct = default)
    {
        var entity = new Removal
        {
            ParcelId = request.ParcelId,
            ClassificationCode = request.ClassificationCode,
            Reason = request.Reason,
            InitiatedDate = DateOnly.FromDateTime(DateTime.UtcNow),
            RemovalDate = request.RemovalDate,
            Status = "Pending"
        };

        _db.Removals.Add(entity);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Removal initiated for parcel {ParcelId}", entity.ParcelId);

        return new RemovalDto(
            entity.Id, entity.ParcelId, entity.ClassificationCode, entity.Reason,
            entity.InitiatedDate.ToString("yyyy-MM-dd"), entity.Status,
            entity.RemovalDate?.ToString("yyyy-MM-dd"),
            entity.RollbackAmount, entity.InterestAmount, entity.PenaltyAmount, entity.TotalDue
        );
    }
}
