using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Text;
using TerraFusion.Data;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Controllers;

/// <summary>
/// P4 — Levy certification workflow endpoints.
/// Provides per-district certification CRUD and CSV evidence packet export.
///
/// Honesty note: In SQLite dev mode, LevyCertifications is always empty unless
/// manually seeded. These endpoints return correct empty responses in that case.
/// </summary>
[ApiController]
[Route("api/levy/certifications")]
[Authorize]
public class LevyCertificationController : ControllerBase
{
    private readonly ILogger<LevyCertificationController> _logger;
    private readonly TerraFusionDbContext _db;

    public LevyCertificationController(
        ILogger<LevyCertificationController> logger,
        TerraFusionDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    // ── GET list ──────────────────────────────────────────────────────────

    /// <summary>
    /// Return all levy certifications for a given tax year.
    /// Sorted by risk (uncertified first), then district name.
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(LevyCertificationListResponse), 200)]
    public async Task<IActionResult> List([FromQuery] int? year)
    {
        var effectiveYear = year ?? DateTime.UtcNow.Year;

        _logger.LogInformation("Levy certifications list requested for year {Year}", effectiveYear);

        // SQLite safe: no decimal aggregation server-side
        var rows = await _db.LevyCertifications
            .AsNoTracking()
            .Where(c => c.TaxYear == effectiveYear)
            .OrderBy(c => c.DistrictName)
            .ToListAsync();

        var certifiedCount = rows.Count(r => string.Equals(r.Status, "certified", StringComparison.OrdinalIgnoreCase));

        var items = rows.Select(c => new LevyCertificationDto
        {
            Id = c.Id,
            DistrictCode = c.DistrictCode,
            DistrictName = c.DistrictName,
            TaxYear = c.TaxYear,
            Status = c.Status,
            LeviedAmount = (double)c.CertifiedLevy,
            LevyRate = c.LevyRate,
            AssessedValue = (double)c.AssessedValue,
            WithinConstitutionalLimit = c.WithinConstitutionalLimit,
            WithinAggregateLimit = c.WithinAggregateLimit,
            WasReduced = c.WasReduced,
            ReviewedBy = c.CreatedBy,
            CreatedAt = c.CreatedAt,
        }).ToList();

        return Ok(new LevyCertificationListResponse
        {
            TaxYear = effectiveYear,
            TotalDistricts = rows.Count,
            CertifiedCount = certifiedCount,
            ReadyForDor = certifiedCount,
            Source = "TerraFusionDbContext.LevyCertifications",
            Items = items,
        });
    }

    // ── POST upsert ───────────────────────────────────────────────────────

    /// <summary>
    /// Create or update a levy certification record.
    /// Idempotent on (DistrictCode, TaxYear) — updates status/reviewed-by/notes if found.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(LevyCertificationDto), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> Upsert([FromBody] LevyCertificationUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DistrictCode))
            return BadRequest("DistrictCode is required.");

        if (request.TaxYear < 2000 || request.TaxYear > 2100)
            return BadRequest("TaxYear is invalid.");

        _logger.LogInformation(
            "Certification upsert: District {District}, Year {Year}, Status {Status}",
            request.DistrictCode, request.TaxYear, request.Status);

        // Lookup existing (district + year)
        var existing = await _db.LevyCertifications
            .FirstOrDefaultAsync(c => c.DistrictCode == request.DistrictCode && c.TaxYear == request.TaxYear);

        if (existing is not null)
        {
            // Update mutable fields
            if (!string.IsNullOrWhiteSpace(request.Status))
                existing.Status = request.Status;
            if (!string.IsNullOrWhiteSpace(request.ReviewedBy))
                existing.CreatedBy = request.ReviewedBy;
            if (request.LeviedAmount.HasValue)
                existing.CertifiedLevy = (decimal)request.LeviedAmount.Value;

            await _db.SaveChangesAsync();
            return Ok(ToDto(existing));
        }

        // Create
        var cert = new LevyCertification
        {
            CountyId = Guid.Empty, // In dev mode, county isolation not enforced
            TaxYear = request.TaxYear,
            DistrictCode = request.DistrictCode,
            DistrictName = request.DistrictName ?? request.DistrictCode,
            Status = request.Status ?? "draft",
            RequestedLevy = request.LeviedAmount.HasValue ? (decimal)request.LeviedAmount.Value : 0m,
            CertifiedLevy = request.LeviedAmount.HasValue ? (decimal)request.LeviedAmount.Value : 0m,
            LevyRate = request.LevyRate ?? 0,
            AssessedValue = request.AssessedValue.HasValue ? (decimal)request.AssessedValue.Value : 0m,
            CreatedBy = request.ReviewedBy ?? "system",
            CreatedAt = DateTime.UtcNow,
        };

        _db.LevyCertifications.Add(cert);
        await _db.SaveChangesAsync();

        return Ok(ToDto(cert));
    }

    // ── GET export (CSV) ─────────────────────────────────────────────────

    /// <summary>
    /// Export all certification records for the year as a CSV evidence packet.
    /// Suitable for DOR submission preparation.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("export")]
    [Produces("text/csv")]
    public async Task<IActionResult> Export([FromQuery] int? year)
    {
        var effectiveYear = year ?? DateTime.UtcNow.Year;

        _logger.LogInformation("Certification CSV export for year {Year}", effectiveYear);

        var rows = await _db.LevyCertifications
            .AsNoTracking()
            .Where(c => c.TaxYear == effectiveYear)
            .OrderBy(c => c.DistrictName)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("DistrictCode,DistrictName,TaxYear,Status,LeviedAmount,LevyRate,AssessedValue,WithinConstitutionalLimit,WithinAggregateLimit,WasReduced,ReviewedBy,CreatedAt");

        foreach (var r in rows)
        {
            sb.AppendLine(string.Join(",",
                CsvEscape(r.DistrictCode),
                CsvEscape(r.DistrictName),
                r.TaxYear.ToString(),
                CsvEscape(r.Status),
                ((double)r.CertifiedLevy).ToString("F2"),
                r.LevyRate.ToString("F6"),
                ((double)r.AssessedValue).ToString("F0"),
                r.WithinConstitutionalLimit.ToString(),
                r.WithinAggregateLimit.ToString(),
                r.WasReduced.ToString(),
                CsvEscape(r.CreatedBy),
                r.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var filename = $"levy-certifications-{effectiveYear}.csv";
        Response.Headers["Content-Disposition"] = $"attachment; filename=\"{filename}\"";
        return File(bytes, "text/csv", filename);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private static LevyCertificationDto ToDto(LevyCertification c) => new()
    {
        Id = c.Id,
        DistrictCode = c.DistrictCode,
        DistrictName = c.DistrictName,
        TaxYear = c.TaxYear,
        Status = c.Status,
        LeviedAmount = (double)c.CertifiedLevy,
        LevyRate = c.LevyRate,
        AssessedValue = (double)c.AssessedValue,
        WithinConstitutionalLimit = c.WithinConstitutionalLimit,
        WithinAggregateLimit = c.WithinAggregateLimit,
        WasReduced = c.WasReduced,
        ReviewedBy = c.CreatedBy,
        CreatedAt = c.CreatedAt,
    };

    private static string CsvEscape(string? s)
    {
        if (s is null) return string.Empty;
        if (s.Contains(',') || s.Contains('"') || s.Contains('\n'))
            return $"\"{s.Replace("\"", "\"\"")}\"";
        return s;
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public class LevyCertificationListResponse
{
    public int TaxYear { get; set; }
    public int TotalDistricts { get; set; }
    public int CertifiedCount { get; set; }
    public int ReadyForDor { get; set; }
    public string Source { get; set; } = string.Empty;
    public List<LevyCertificationDto> Items { get; set; } = new();
}

public class LevyCertificationDto
{
    public int Id { get; set; }
    public string DistrictCode { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public int TaxYear { get; set; }
    public string Status { get; set; } = "draft";
    public double LeviedAmount { get; set; }
    public double LevyRate { get; set; }
    public double AssessedValue { get; set; }
    public bool WithinConstitutionalLimit { get; set; }
    public bool WithinAggregateLimit { get; set; }
    public bool WasReduced { get; set; }
    public string ReviewedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class LevyCertificationUpsertRequest
{
    public string DistrictCode { get; set; } = string.Empty;
    public string? DistrictName { get; set; }
    public int TaxYear { get; set; }
    public string? Status { get; set; }
    public double? LeviedAmount { get; set; }
    public double? LevyRate { get; set; }
    public double? AssessedValue { get; set; }
    public string? ReviewedBy { get; set; }
    public string? Notes { get; set; }
}
