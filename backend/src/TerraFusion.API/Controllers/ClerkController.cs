using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraClerk — County Clerk recording and title chain endpoints.
/// Write-lane: clerk. County isolation enforced on all queries.
/// Real Benton County recording fee data per RCW 36.18.010.
/// </summary>
[ApiController]
[Route("api/clerk")]
[Authorize]
public class ClerkController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ClerkController> _logger;

    public ClerkController(TerraFusionDbContext db, ILogger<ClerkController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── County Isolation Helper ──────────────────────────────────────

    private async Task<Guid?> ResolveCountyIdAsync()
    {
        var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
        if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
            return directCountyId;

        var countyCodeClaim = User.FindFirst("countyCode")?.Value?.Trim();
        var nameCandidates = BuildCountyNameCandidates(countyIdClaim, countyCodeClaim);
        var fipsCandidates = BuildFipsCandidates(countyIdClaim, countyCodeClaim);

        IQueryable<County> countyQuery = _db.Counties.AsNoTracking();

        if (nameCandidates.Length > 0 && fipsCandidates.Length > 0)
        {
            countyQuery = countyQuery.Where(c =>
                nameCandidates.Contains(c.Name) ||
                (c.FipsCode != null && fipsCandidates.Contains(c.FipsCode)));
        }
        else if (nameCandidates.Length > 0)
        {
            countyQuery = countyQuery.Where(c => nameCandidates.Contains(c.Name));
        }
        else if (fipsCandidates.Length > 0)
        {
            countyQuery = countyQuery.Where(c => c.FipsCode != null && fipsCandidates.Contains(c.FipsCode));
        }
        else
        {
            return null;
        }

        var county = await countyQuery.Select(c => c.Id).FirstOrDefaultAsync();
        return county == Guid.Empty ? null : county;
    }

    private static string[] BuildCountyNameCandidates(params string?[] claims)
    {
        var candidates = new HashSet<string>(StringComparer.Ordinal);
        foreach (var claim in claims)
        {
            if (string.IsNullOrWhiteSpace(claim)) continue;
            var trimmed = claim.Trim();
            candidates.Add(trimmed);
            candidates.Add(trimmed.ToUpperInvariant());
            candidates.Add(trimmed.ToLowerInvariant());
            if (trimmed.Length > 0)
                candidates.Add(char.ToUpperInvariant(trimmed[0]) + trimmed[1..].ToLowerInvariant());
        }
        return candidates.ToArray();
    }

    private static string[] BuildFipsCandidates(params string?[] claims)
    {
        var candidates = new HashSet<string>(StringComparer.Ordinal);
        foreach (var claim in claims)
        {
            if (string.IsNullOrWhiteSpace(claim)) continue;
            var trimmed = claim.Trim();
            if (trimmed.All(char.IsDigit) && trimmed.Length is >= 1 and <= 5)
            {
                candidates.Add(trimmed);
                candidates.Add(trimmed.PadLeft(3, '0'));
            }
        }
        return candidates.ToArray();
    }

    // ── GET api/clerk/documents ─────────────────────────────────────
    // Handler 36: search_recorded_documents

    [HttpGet("documents")]
    public async Task<IActionResult> SearchDocuments(
        [FromQuery] string? county,
        [FromQuery] string? parcelId,
        [FromQuery] string? grantor,
        [FromQuery] string? grantee,
        [FromQuery] string? type)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var query = _db.ClerkDocuments
            .AsNoTracking()
            .Where(d => d.CountyId == countyId.Value);

        if (!string.IsNullOrWhiteSpace(parcelId))
            query = query.Where(d => d.ParcelId == parcelId);
        if (!string.IsNullOrWhiteSpace(grantor))
            query = query.Where(d => d.Grantor.Contains(grantor));
        if (!string.IsNullOrWhiteSpace(grantee))
            query = query.Where(d => d.Grantee.Contains(grantee));
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(d => d.DocumentType == type);

        var documents = await query
            .OrderByDescending(d => d.RecordedAt)
            .Take(100)
            .Select(d => new
            {
                id = d.Id.ToString(),
                type = d.DocumentType,
                recordedDate = d.RecordedAt.ToString("o"),
                grantor = d.Grantor,
                grantee = d.Grantee,
            })
            .ToListAsync();

        var totalCount = await query.CountAsync();

        return Ok(new { documents, totalCount });
    }

    // ── GET api/clerk/parcels/{parcelId}/title-chain ────────────────
    // Handler 37: get_title_chain

    [HttpGet("parcels/{parcelId}/title-chain")]
    public async Task<IActionResult> GetTitleChain(string parcelId)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var chain = await _db.TitleChainEntries
            .AsNoTracking()
            .Where(t => t.CountyId == countyId.Value && t.ParcelId == parcelId)
            .OrderBy(t => t.TransferDate)
            .Select(t => new
            {
                documentId = t.DocumentId.ToString(),
                type = t.TransferType,
                date = t.TransferDate.ToString("o"),
                from = t.FromParty,
                to = t.ToParty,
            })
            .ToListAsync();

        return Ok(new { chain });
    }

    // ── GET api/clerk/fees ──────────────────────────────────────────
    // Handler 38: explain_recording_fees
    // Static Benton County fee schedule per RCW 36.18.010

    [HttpGet("fees")]
    [AllowAnonymous]
    public IActionResult GetRecordingFees(
        [FromQuery] string? county,
        [FromQuery] string? type,
        [FromQuery] int? pages)
    {
        var docType = type ?? "deed";
        var pageCount = pages ?? 1;

        var fee = BentonRecordingFees.Lookup(docType);
        var totalFee = fee.BaseFee + (fee.PerPageFee * Math.Max(pageCount - 1, 0));

        return Ok(new
        {
            baseFee = fee.BaseFee,
            perPageFee = fee.PerPageFee,
            totalFee,
            statuteRef = fee.StatuteRef,
        });
    }

    // ── POST api/clerk/documents ────────────────────────────────────
    // Handler 39: record_document

    [HttpPost("documents")]
    public async Task<IActionResult> RecordDocument([FromBody] RecordDocumentRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.DocumentType))
            return BadRequest(new { error = "Document type is required." });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var fee = BentonRecordingFees.Lookup(request.DocumentType);
        var recordingNumber = $"REC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";

        var doc = new ClerkDocument
        {
            RecordingNumber = recordingNumber,
            DocumentType = request.DocumentType,
            ParcelId = request.ParcelId,
            Grantor = request.Grantor ?? string.Empty,
            Grantee = request.Grantee ?? string.Empty,
            Consideration = request.Consideration,
            Fees = fee.BaseFee,
            CountyId = countyId.Value,
        };

        _db.ClerkDocuments.Add(doc);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Recorded document {RecordingNumber} for parcel {ParcelId} in county {CountyId}",
            recordingNumber, request.ParcelId, countyId.Value);

        return Ok(new
        {
            documentId = doc.Id.ToString(),
            recordingNumber = doc.RecordingNumber,
            recordedAt = doc.RecordedAt.ToString("o"),
            fees = doc.Fees,
        });
    }

    // ── POST api/clerk/liens/{lienId}/release ───────────────────────
    // Handler 40: release_lien

    [HttpPost("liens/{lienId}/release")]
    public async Task<IActionResult> ReleaseLien(string lienId, [FromBody] ReleaseLienRequest? request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        if (!Guid.TryParse(lienId, out var lienGuid))
            return BadRequest(new { error = "Invalid lien ID format." });

        var lien = await _db.ClerkLiens
            .Where(l => l.Id == lienGuid && l.CountyId == countyId.Value)
            .FirstOrDefaultAsync();

        if (lien is null)
            return NotFound(new { error = $"Lien '{lienId}' not found." });

        lien.Status = "released";
        lien.ReleasedAt = DateTime.UtcNow;
        lien.ReleaseReason = request?.Reason ?? "satisfied";
        await _db.SaveChangesAsync();

        _logger.LogInformation("Released lien {LienId} in county {CountyId}", lienId, countyId.Value);

        return Ok(new
        {
            status = lien.Status,
            releasedAt = lien.ReleasedAt?.ToString("o"),
        });
    }

    // ── GET api/clerk/parcels/{parcelId}/recordings/summary ─────────
    // Handler 41: summarize_parcel_recordings

    [HttpGet("parcels/{parcelId}/recordings/summary")]
    public async Task<IActionResult> SummarizeParcelRecordings(string parcelId)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var docs = await _db.ClerkDocuments
            .AsNoTracking()
            .Where(d => d.CountyId == countyId.Value && d.ParcelId == parcelId)
            .ToListAsync();

        var totalRecordings = docs.Count;
        var documentTypes = docs
            .GroupBy(d => d.DocumentType)
            .ToDictionary(g => g.Key, g => g.Count());

        var summary = totalRecordings > 0
            ? $"Recording summary for parcel {parcelId}: {totalRecordings} documents on file. Types: {string.Join(", ", documentTypes.Select(kv => $"{kv.Key} ({kv.Value})"))}"
            : $"Recording summary for parcel {parcelId}: 0 documents on file.";

        return Ok(new { summary, totalRecordings, documentTypes });
    }

    // ── Static Data ─────────────────────────────────────────────────

    internal static class BentonRecordingFees
    {
        internal record FeeEntry(decimal BaseFee, decimal PerPageFee, string StatuteRef);

        private static readonly Dictionary<string, FeeEntry> _fees = new(StringComparer.OrdinalIgnoreCase)
        {
            ["deed"]            = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["warranty_deed"]   = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["quit_claim_deed"] = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["mortgage"]        = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["deed_of_trust"]   = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["lien"]            = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["lien_release"]    = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["easement"]        = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["plat"]            = new(217.00m, 1.00m, "RCW 36.18.010"),
            ["power_of_attorney"] = new(108.50m, 1.00m, "RCW 36.18.010"),
            ["lis_pendens"]     = new(108.50m, 1.00m, "RCW 36.18.010"),
        };

        internal static FeeEntry Lookup(string documentType)
            => _fees.GetValueOrDefault(documentType, new FeeEntry(108.50m, 1.00m, "RCW 36.18.010"));
    }

    // ── Request DTOs ────────────────────────────────────────────────

    public record RecordDocumentRequest
    {
        [StringLength(50)]
        public string? ParcelId { get; init; }
        [Required] [StringLength(50)]
        public string DocumentType { get; init; } = string.Empty;
        [StringLength(200)]
        public string? Grantor { get; init; }
        [StringLength(200)]
        public string? Grantee { get; init; }
        [Range(0, (double)decimal.MaxValue)]
        public decimal Consideration { get; init; }
        public Guid? CountyId { get; init; }
    }

    public record ReleaseLienRequest
    {
        [StringLength(200)]
        public string? Reason { get; init; }
        public Guid? CountyId { get; init; }
    }
}
