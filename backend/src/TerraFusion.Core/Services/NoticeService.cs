using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public sealed record GenerateNoticeCommand(
    string TemplateId,
    string? ParcelId,
    string? DeliveryMethod,
    IReadOnlyDictionary<string, string>? Fields);

public interface INoticeService
{
    Task<Notice> CreateAsync(Notice entity);
    Task<Notice> CreateAsync(Guid countyId, GenerateNoticeCommand request, string? createdBy = null, DateTime? utcNow = null);
    Task<Notice> CreateLevyCertificationNoticeAsync(Guid countyId, int taxYear, string? deliveryMethod, IReadOnlyDictionary<string, string>? fields, string? createdBy = null, DateTime? utcNow = null);
    Task<Notice?> GetLatestLevyCertificationNoticeAsync(Guid countyId, int taxYear);
    Task<Notice?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<Notice>> GetByIdsAsync(IEnumerable<Guid> ids, Guid countyId);
    Task<List<Notice>> GetByParcelAsync(string parcelId, Guid countyId);
    Task<Notice> UpdateStatusAsync(Guid id, string status, Guid countyId);
}

public class NoticeService : INoticeService
{
    private static readonly Dictionary<string, HashSet<string>> ValidTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["generated"] = new(StringComparer.OrdinalIgnoreCase) { "queued_for_mailing", "sent", "failed", "sealed" },
        ["queued_for_mailing"] = new(StringComparer.OrdinalIgnoreCase) { "sent", "failed", "sealed" },
        ["sent"] = new(StringComparer.OrdinalIgnoreCase) { "sealed" },
        ["failed"] = new(StringComparer.OrdinalIgnoreCase) { "generated", "queued_for_mailing", "sent" },
        ["sealed"] = new(StringComparer.OrdinalIgnoreCase),
    };

    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<NoticeService> _logger;

    public NoticeService(ITerraFusionDbContext context, ILogger<NoticeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Notice> CreateAsync(Notice entity)
    {
        var now = DateTime.UtcNow;
        PrepareForCreate(entity, now);

        _context.Notices.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created notice {NoticeId} for parcel {ParcelId} in county {CountyId}, template {TemplateId}, delivery {DeliveryMethod}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.TemplateId, entity.DeliveryMethod);

        return entity;
    }

    public Task<Notice> CreateAsync(Guid countyId, GenerateNoticeCommand request, string? createdBy = null, DateTime? utcNow = null)
    {
        var entity = new Notice
        {
            ParcelId = request.ParcelId ?? string.Empty,
            TemplateId = request.TemplateId,
            DeliveryMethod = request.DeliveryMethod ?? "mail",
            Status = "generated",
            Fields = request.Fields is not null ? JsonSerializer.Serialize(request.Fields) : null,
            CountyId = countyId,
            RcwReference = ResolveRcwReference(request.TemplateId),
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
        };

        return CreateAsync(entity);
    }

    public async Task<Notice> CreateLevyCertificationNoticeAsync(
        Guid countyId,
        int taxYear,
        string? deliveryMethod,
        IReadOnlyDictionary<string, string>? fields,
        string? createdBy = null,
        DateTime? utcNow = null)
    {
        if (taxYear <= 0)
        {
            taxYear = await _context.LevyCertifications
                .AsNoTracking()
                .Where(c => c.CountyId == countyId)
                .OrderByDescending(c => c.TaxYear)
                .Select(c => c.TaxYear)
                .FirstOrDefaultAsync();
        }

        if (taxYear <= 0)
            throw new InvalidOperationException($"No canonical levy certifications exist for county {countyId}.");

        var steps = await _context.CertificationSteps
            .AsNoTracking()
            .Where(s => s.CountyId == countyId && s.TaxYear == taxYear)
            .ToListAsync();
        var assessorSignoff = steps.FirstOrDefault(s => string.Equals(s.StepCode, "ASSESSOR_SIGNOFF", StringComparison.OrdinalIgnoreCase));
        if (assessorSignoff is null || !IsCompletedStatus(assessorSignoff.Status))
            throw new InvalidOperationException($"ASSESSOR_SIGNOFF must be completed before a levy certification notice can be generated for tax year {taxYear}.");

        var levyCertifications = await _context.LevyCertifications
            .AsNoTracking()
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear)
            .Select(c => new
            {
                c.CertifiedLevy,
                c.LevyRate,
                c.WasReduced,
            })
            .ToListAsync();

        if (levyCertifications.Count == 0)
            throw new KeyNotFoundException($"No canonical levy certifications found for county {countyId} tax year {taxYear}.");

        var countyName = await _context.Counties
            .AsNoTracking()
            .Where(c => c.Id == countyId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync()
            ?? countyId.ToString();

        var mergedFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (fields is not null)
        {
            foreach (var pair in fields)
                mergedFields[pair.Key] = pair.Value;
        }

        mergedFields["countyName"] = countyName;
        mergedFields["taxYear"] = taxYear.ToString();
        mergedFields["districtCount"] = levyCertifications.Count.ToString();
        mergedFields["reducedDistrictCount"] = levyCertifications.Count(c => c.WasReduced).ToString();
        mergedFields["totalCertifiedLevy"] = levyCertifications.Sum(c => c.CertifiedLevy).ToString("0.00");
        mergedFields["averageLevyRate"] = levyCertifications.Average(c => c.LevyRate).ToString("0.000000");
        mergedFields["assessorSignedBy"] = assessorSignoff.CompletedBy ?? string.Empty;
        mergedFields["assessorSignedAt"] = assessorSignoff.CompletedAt?.ToString("o") ?? string.Empty;

        return await CreateAsync(
            countyId,
            new GenerateNoticeCommand(
                "LEVY_RATE",
                $"COUNTY-LEVY-{taxYear}",
                deliveryMethod ?? "mail",
                mergedFields),
            createdBy,
            utcNow);
    }

    public async Task<Notice?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.Notices
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.CountyId == countyId);
    }

    public async Task<List<Notice>> GetByIdsAsync(IEnumerable<Guid> ids, Guid countyId)
    {
        var noticeIds = ids
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        if (noticeIds.Length == 0)
            return [];

        return await _context.Notices
            .Where(n => n.CountyId == countyId && noticeIds.Contains(n.Id))
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notice?> GetLatestLevyCertificationNoticeAsync(Guid countyId, int taxYear)
    {
        return await _context.Notices
            .AsNoTracking()
            .Where(n => n.CountyId == countyId &&
                n.TemplateId == "LEVY_RATE" &&
                n.ParcelId == BuildLevyNoticeParcelId(taxYear))
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync();
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

        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException("Notice status is required.", nameof(status));

        var normalizedStatus = status.Trim();
        if (!string.Equals(entity.Status, normalizedStatus, StringComparison.OrdinalIgnoreCase) &&
            ValidTransitions.TryGetValue(entity.Status, out var allowed) &&
            !allowed.Contains(normalizedStatus))
        {
            throw new InvalidOperationException(
                $"Invalid notice status transition from '{entity.Status}' to '{normalizedStatus}' for Notice {id}.");
        }

        entity.Status = normalizedStatus;
        entity.UpdatedAt = DateTime.UtcNow;

        if (string.Equals(normalizedStatus, "sent", StringComparison.OrdinalIgnoreCase))
            entity.SentAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Updated notice {NoticeId} status to {Status} in county {CountyId}",
            id, status, countyId);

        return entity;
    }

    private static void PrepareForCreate(Notice entity, DateTime now)
    {
        if (entity.Id == Guid.Empty)
            entity.Id = Guid.NewGuid();

        entity.DeliveryMethod = string.IsNullOrWhiteSpace(entity.DeliveryMethod) ? "mail" : entity.DeliveryMethod;
        entity.Status = string.IsNullOrWhiteSpace(entity.Status) ? "generated" : entity.Status;
        entity.CreatedAt = entity.CreatedAt == default ? now : entity.CreatedAt;
        entity.UpdatedAt = now;
    }

    private static string? ResolveRcwReference(string? templateId) => templateId?.Trim().ToUpperInvariant() switch
    {
        "VALUE_CHANGE" => "RCW 84.40.045",
        "EXEMPTION_APPROVAL" => "RCW 84.36.381",
        "EXEMPTION_DENIAL" => "RCW 84.36.381",
        "APPEAL_HEARING" => "RCW 84.48",
        "LEVY_RATE" => "RCW 84.52",
        "CURRENT_USE_REMOVAL" => "RCW 84.34",
        _ => null,
    };

    private static string BuildLevyNoticeParcelId(int taxYear) => $"COUNTY-LEVY-{taxYear}";

    private static bool IsCompletedStatus(string? status) =>
        string.Equals(status, "complete", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, "completed", StringComparison.OrdinalIgnoreCase);
}
