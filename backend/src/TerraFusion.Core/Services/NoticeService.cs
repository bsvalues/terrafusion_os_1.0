using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public interface INoticeService
{
    Task<Notice> CreateAsync(Notice entity);
    Task<Notice?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<Notice>> GetByParcelAsync(string parcelId, Guid countyId);
    Task<Notice> UpdateStatusAsync(Guid id, string status, Guid countyId);
}

public class NoticeService : INoticeService
{
    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<NoticeService> _logger;

    public NoticeService(ITerraFusionDbContext context, ILogger<NoticeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Notice> CreateAsync(Notice entity)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _context.Notices.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created notice {NoticeId} for parcel {ParcelId} in county {CountyId}, template {TemplateId}, delivery {DeliveryMethod}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.TemplateId, entity.DeliveryMethod);

        return entity;
    }

    public async Task<Notice?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.Notices
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.CountyId == countyId);
    }

    public async Task<List<Notice>> GetByParcelAsync(string parcelId, Guid countyId)
    {
        return await _context.Notices
            .AsNoTracking()
            .Where(n => n.ParcelId == parcelId && n.CountyId == countyId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notice> UpdateStatusAsync(Guid id, string status, Guid countyId)
    {
        var entity = await _context.Notices
            .FirstOrDefaultAsync(n => n.Id == id && n.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"Notice {id} not found in county {countyId}.");

        entity.Status = status;
        entity.UpdatedAt = DateTime.UtcNow;

        if (status == "sent")
            entity.SentAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Updated notice {NoticeId} status to {Status} in county {CountyId}",
            id, status, countyId);

        return entity;
    }
}
