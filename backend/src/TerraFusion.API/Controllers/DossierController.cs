using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.API.DTOs;
using TerraFusion.API.Security;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraDossier — Notes CRUD + Parcel Dossier composition for R1.
/// Write-lane: dossier. County isolation enforced on all queries.
/// </summary>
[ApiController]
[Route("api/dossier")]
[Authorize]
public class DossierController : ControllerBase
{
    private readonly DataDbContext _db;
    private readonly ICostForgeService _costForge;
    private readonly ILogger<DossierController> _logger;
    private static readonly Regex ParcelIdPattern = new("^[A-Za-z0-9._-]{1,50}$", RegexOptions.Compiled);

    public DossierController(DataDbContext db, ICostForgeService costForge, ILogger<DossierController> logger)
    {
        _db = db;
        _costForge = costForge;
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

        return await countyQuery
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync();
    }

    private static string[] BuildCountyNameCandidates(params string?[] claims)
    {
        var candidates = new HashSet<string>(StringComparer.Ordinal);
        foreach (var claim in claims)
        {
            if (string.IsNullOrWhiteSpace(claim))
                continue;

            var trimmed = claim.Trim();
            AddCandidate(candidates, trimmed);

            var withoutSuffix = StripCountySuffix(trimmed);
            AddCandidate(candidates, withoutSuffix);

            var titleCase = ToTitleCaseWords(withoutSuffix);
            AddCandidate(candidates, titleCase);
            AddCandidate(candidates, $"{titleCase} County");
        }

        return candidates.ToArray();
    }

    private static string[] BuildFipsCandidates(params string?[] claims)
    {
        var candidates = new HashSet<string>(StringComparer.Ordinal);
        foreach (var claim in claims)
        {
            if (string.IsNullOrWhiteSpace(claim))
                continue;

            var trimmed = claim.Trim();
            AddCandidate(candidates, trimmed);

            var digitsOnly = new string(trimmed.Where(char.IsDigit).ToArray());
            AddCandidate(candidates, digitsOnly);
        }

        return candidates.ToArray();
    }

    private static string StripCountySuffix(string value)
    {
        return value.EndsWith(" County", StringComparison.OrdinalIgnoreCase)
            ? value[..^7].TrimEnd()
            : value;
    }

    private static string ToTitleCaseWords(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var words = value
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => word.Length == 1
                ? char.ToUpperInvariant(word[0]).ToString()
                : $"{char.ToUpperInvariant(word[0])}{word[1..].ToLowerInvariant()}");

        return string.Join(' ', words);
    }

    private static void AddCandidate(HashSet<string> candidates, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            candidates.Add(value.Trim());
    }

    private static bool IsValidParcelId(string parcelId)
    {
        return !string.IsNullOrWhiteSpace(parcelId) && ParcelIdPattern.IsMatch(parcelId);
    }

    // ── GET /api/dossier/{parcelId}/notes ────────────────────────────

    /// <summary>
    /// List notes for a parcel (county-isolated).
    /// </summary>
    [HttpGet("{parcelId}/notes")]
    [RequiresPermission("read:dossier")]
    public async Task<IActionResult> GetNotes(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        var notes = await _db.DossierNotes
            .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                noteId = n.Id,
                content = n.Content,
                createdAt = n.CreatedAt,
                createdBy = n.CreatedBy,
                type = n.NoteType,
            })
            .ToListAsync();

        return Ok(new { parcelId, notes, total = notes.Count });
    }

    // ── POST /api/dossier/{parcelId}/notes ───────────────────────────

    public record CreateNoteRequest(string Content, string? Type);

    /// <summary>
    /// Create an append-only note for a parcel (county-isolated).
    /// </summary>
    [HttpPost("{parcelId}/notes")]
    [RequiresPermission("write:dossier")]
    public async Task<IActionResult> CreateNote(string parcelId, [FromBody] CreateNoteRequest request)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { error = "Content is required" });

        if (request.Content.Length > 2000)
            return BadRequest(new { error = "Content exceeds 2000 character limit" });

        if (!string.IsNullOrWhiteSpace(request.Type) && request.Type.Length > 50)
            return BadRequest(new { error = "Type exceeds 50 character limit" });

        var parcelExists = await _db.Properties
            .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
        if (!parcelExists)
            return NotFound(new { error = "Parcel not found" });

        var userId = User.FindFirst("sub")?.Value
                  ?? User.FindFirst("userId")?.Value
                  ?? "unknown";

        var note = new DossierNote
        {
            ParcelId = parcelId,
            Content = request.Content,
            NoteType = request.Type ?? "case_note",
            CountyId = countyId.Value,
            CreatedBy = userId,
        };

        _db.DossierNotes.Add(note);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "DossierNote created: {NoteId} for parcel {ParcelId} in county {CountyId}",
            note.Id, parcelId, countyId);

        return Created($"/api/dossier/{parcelId}/notes", new
        {
            noteId = note.Id,
            parcelId,
            createdAt = note.CreatedAt,
        });
    }

    // ── GET /api/dossier/parcels/{parcelId}/casefile ─────────────────

    /// <summary>
    /// Casefile summary for a parcel (county-isolated).
    /// Returns aggregated document/note counts + highlights.
    /// </summary>
    [HttpGet("parcels/{parcelId}/casefile")]
    [RequiresPermission("read:dossier")]
    public async Task<IActionResult> GetCasefile(string parcelId, [FromQuery] string? include)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var contextCountyId = await ResolveCountyIdAsync();
        if (contextCountyId is null)
            return Forbid();

        var parcelExists = await _db.Properties
            .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == contextCountyId.Value);
        if (!parcelExists)
            return NotFound(new { error = "Parcel not found" });

        var notes = await _db.DossierNotes
            .Where(n => n.ParcelId == parcelId && n.CountyId == contextCountyId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        var highlights = notes
            .Take(10)
            .Select(n => $"{n.NoteType}: {(n.Content.Length > 60 ? n.Content[..60] + "..." : n.Content)}")
            .ToList();

        return Ok(new
        {
            summary = $"Casefile for parcel {parcelId}: {notes.Count} note(s) on record.",
            highlights,
            sections = new
            {
                notes = new { count = notes.Count, summary = $"{notes.Count} case note(s)" },
            },
        });
    }

    // ── GET /api/dossier/parcels/{parcelId}/summary ──────────────────

    /// <summary>
    /// Parcel Dossier v0 — composition view aggregating property, cost breakdown,
    /// levy history, and notes summary. County-isolated. Read-only.
    /// </summary>
    [HttpGet("parcels/{parcelId}/summary")]
    [RequiresPermission("read:dossier")]
    [ProducesResponseType(typeof(ParcelDossierDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetParcelSummary(string parcelId, [FromQuery] int levyLimit = 10)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        if (levyLimit < 1) levyLimit = 1;
        if (levyLimit > 100) levyLimit = 100;

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        // ── Property (county-isolated) ──────────────────────────────
        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
            .Select(p => new ParcelPropertySummary
            {
                Id = p.Id,
                ParcelNumber = p.ParcelNumber,
                Address = p.Address,
                OwnerName = p.OwnerName,
                PropertyType = p.PropertyType,
                YearBuilt = p.YearBuilt,
                AssessedValue = p.AssessedValue,
                LandValue = p.LandValue,
                ImprovementValue = p.ImprovementValue,
                MarketValue = p.MarketValue,
                AssessmentDate = p.AssessmentDate,
                TaxYear = p.TaxYear,
            })
            .FirstOrDefaultAsync();

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        // ── CostForge breakdown (graceful fallback) ─────────────────
        CostBreakdownDto? costBreakdown = null;
        try
        {
            costBreakdown = await _costForge.GetCostBreakdownAsync(property.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CostForge breakdown unavailable for property {PropertyId}", property.Id);
        }

        // ── Levy history (county-isolated, last N) ──────────────────
        var levyHistory = await _db.TaxLevies
            .AsNoTracking()
            .Where(t => t.CountyId == countyId.Value && t.IsActive)
            .OrderByDescending(t => t.EffectiveDate)
            .Take(levyLimit)
            .Select(t => new LevyHistorySummary
            {
                TaxLevyId = t.Id,
                TaxingDistrict = t.TaxingDistrict ?? string.Empty,
                TaxRate = (double)t.TaxRate,
                LevyAmount = (double)t.LevyAmount,
                TaxYear = t.TaxYear,
                Purpose = t.Purpose ?? string.Empty,
                EffectiveDate = t.EffectiveDate,
            })
            .ToListAsync();

        // ── Dossier notes summary ───────────────────────────────────
        var noteCount = await _db.DossierNotes
            .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value)
            .CountAsync();

        var latestNoteAt = noteCount > 0
            ? await _db.DossierNotes
                .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value)
                .MaxAsync(n => (DateTime?)n.CreatedAt)
            : null;

        return Ok(new ParcelDossierDto
        {
            ParcelId = parcelId,
            CountyId = countyId.Value,
            Property = property,
            CostBreakdown = costBreakdown,
            LevyHistory = levyHistory,
            Notes = new DossierNotesSummary
            {
                NoteCount = noteCount,
                LatestNoteAt = latestNoteAt,
            },
            GeneratedAtUtc = DateTime.UtcNow,
        });
    }
}
