using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Models;

namespace TerraFusion.CurrentUse.Services;

public class ClassificationService : IClassificationService
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<ClassificationService> _logger;

    public ClassificationService(CurrentUseDbContext db, ILogger<ClassificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ClassificationsResponse> ListAsync(
        string? status, string? classificationCode, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Classifications.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrWhiteSpace(classificationCode))
            query = query.Where(c => c.ClassificationCode == classificationCode);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.EnrollmentDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ClassificationDto(
                c.Id,
                c.ParcelId,
                c.ClassificationCode,
                c.Description,
                c.EnrollmentDate.ToString("yyyy-MM-dd"),
                c.Status,
                c.Acreage,
                c.CurrentMarketValue,
                c.CurrentUseValue,
                c.TaxSavings,
                c.CountyId
            ))
            .ToListAsync(ct);

        return new ClassificationsResponse(total, page, pageSize, items);
    }

    public async Task<ClassificationDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Classifications.FindAsync(new object[] { id }, ct);
        if (c == null) return null;

        return new ClassificationDto(
            c.Id, c.ParcelId, c.ClassificationCode, c.Description,
            c.EnrollmentDate.ToString("yyyy-MM-dd"), c.Status,
            c.Acreage, c.CurrentMarketValue, c.CurrentUseValue, c.TaxSavings, c.CountyId
        );
    }

    public async Task<ClassificationDto> CreateAsync(ClassificationCreateRequest request, CancellationToken ct = default)
    {
        var entity = new Classification
        {
            ParcelId = request.ParcelId,
            ClassificationCode = request.ClassificationCode,
            Description = request.Description,
            EnrollmentDate = request.EnrollmentDate,
            Acreage = request.Acreage,
            CurrentMarketValue = request.CurrentMarketValue,
            CurrentUseValue = request.CurrentUseValue,
            TaxSavings = request.CurrentMarketValue.HasValue && request.CurrentUseValue.HasValue
                ? (request.CurrentMarketValue.Value - request.CurrentUseValue.Value) * 0.01m // Approximate mill rate
                : null,
            Status = "Active",
            CountyId = "benton"
        };

        _db.Classifications.Add(entity);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Classification created: {ParcelId} / {Code}", entity.ParcelId, entity.ClassificationCode);

        return new ClassificationDto(
            entity.Id, entity.ParcelId, entity.ClassificationCode, entity.Description,
            entity.EnrollmentDate.ToString("yyyy-MM-dd"), entity.Status,
            entity.Acreage, entity.CurrentMarketValue, entity.CurrentUseValue, entity.TaxSavings, entity.CountyId
        );
    }
}
