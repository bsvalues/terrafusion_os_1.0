using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.API.DTOs;
using TerraFusion.API.Security;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraDossier — Notes CRUD + composed parcel dossier for R1.
/// Write-lane: dossier. County isolation enforced on all queries.
/// Cross-county requests return 404 (anti-enumeration).
/// DX-01: Development fallback resolves to Benton County when claims absent.
/// </summary>
[ApiController]
[Route("api/dossier")]
[Authorize]
public class DossierController : ControllerBase
{
    private readonly DataDbContext _db;
    private readonly ICostForgeService _costForge;
    private readonly ILogger<DossierController> _logger;
    private readonly bool _isDevelopment;
    private static readonly Regex ParcelIdPattern = new("^[A-Za-z0-9._-]{1,50}$", RegexOptions.Compiled);

    public DossierController(
        DataDbContext db,
        ICostForgeService costForge,
        ILogger<DossierController> logger,
        IHostEnvironment hostEnvironment)
    {
        _db = db;
        _costForge = costForge;
        _logger = logger;
        _isDevelopment = hostEnvironment.IsDevelopment();
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
            // DX-01: In Development, fall back to Benton County when no claims present.
            // Production requires valid claims — no fallback.
            if (_isDevelopment)
            {
                _logger.LogDebug("[DX-01] No county claims found; falling back to Benton County (Development only)");
                return await _db.Counties
                    .AsNoTracking()
                    .Where(c => c.Name == "Benton" && c.State == "WA")
                    .Select(c => (Guid?)c.Id)
                    .FirstOrDefaultAsync();
            }
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

    // ── CX-24: Trace & Evidence Helpers ──────────────────────────

    /// <summary>
    /// Extract or generate a correlation ID for the current request.
    /// Reads inbound X-Correlation-ID (sanitized), falls back to dossier-{Guid}.
    /// Sets the response header so clients can always correlate.
    /// </summary>
    private static readonly Regex CorrelationIdSanitizer = new("^[A-Za-z0-9._-]{1,128}$", RegexOptions.Compiled);

    private string GetOrCreateCorrelationId()
    {
        var inbound = HttpContext.Request.Headers["X-Correlation-ID"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(inbound) && CorrelationIdSanitizer.IsMatch(inbound))
        {
            HttpContext.Response.Headers["X-Correlation-ID"] = inbound;
            return inbound;
        }

        var generated = $"dossier-{Guid.NewGuid():N}";
        HttpContext.Response.Headers["X-Correlation-ID"] = generated;
        return generated;
    }

    /// <summary>
    /// Build stable resource links for a parcel's dossier endpoints.
    /// Relative paths only — no host/scheme, safe for any deployment.
    /// </summary>
    private static DossierResourceLinks BuildResourceLinks(string parcelId, string selfVariant)
    {
        var self = selfVariant switch
        {
            "details" => $"/api/dossier/parcels/{parcelId}/details",
            "evidence" => $"/api/dossier/parcels/{parcelId}/evidence",
            _ => $"/api/dossier/{parcelId}",
        };

        return new DossierResourceLinks(
            Self: self,
            Summary: $"/api/dossier/{parcelId}",
            Details: $"/api/dossier/parcels/{parcelId}/details",
            Notes: $"/api/dossier/{parcelId}/notes",
            Casefile: $"/api/dossier/parcels/{parcelId}/casefile"
        );
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

    // ── GET /api/dossier/{parcelId} ───────────────────────────────────
    // CX-22: Composed parcel dossier v0
    //   Property core + CostForge summary + Levy history + Notes summary
    //   County-isolated: cross-county → 404 (anti-enumeration)

    /// <summary>
    /// Composed parcel dossier (county-isolated).
    /// Returns property core data, CostForge analysis summary,
    /// county levy history, and case notes for a single parcel.
    /// Cross-county requests receive 404 to prevent enumeration.
    /// </summary>
    [HttpGet("{parcelId}")]
    [RequiresPermission("read:dossier")]
    [ProducesResponseType(typeof(ParcelDossierDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ParcelDossierDto>> GetParcelDossier(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        // ── Property core (county-isolated) ──────────────────────
        var property = await _db.Properties
            .AsNoTracking()
            .Include(p => p.County)
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        var dossier = new ParcelDossierDto
        {
            ParcelId = parcelId,
            CountyId = countyId.Value,
            CountyName = property.County?.Name ?? string.Empty,
            Property = new ParcelDossierPropertyDto
            {
                PropertyId = property.Id,
                ParcelNumber = property.ParcelNumber,
                Address = property.Address,
                PropertyType = property.PropertyType,
                YearBuilt = property.YearBuilt,
                AssessedValue = property.AssessedValue,
                LandValue = property.LandValue,
                ImprovementValue = property.ImprovementValue,
                MarketValue = property.MarketValue,
                TaxYear = property.TaxYear,
                AssessmentDate = property.AssessmentDate,
            },
        };

        // ── CostForge summary (best-effort, nullable) ────────────
        try
        {
            var analysis = await _costForge.AnalyzeCostAsync(property.Id);
            if (analysis is not null)
            {
                dossier.CostForge = new ParcelDossierCostForgeSummaryDto
                {
                    TotalCost = analysis.TotalCost,
                    LandValue = analysis.LandValue,
                    ImprovementValue = analysis.ImprovementValue,
                    ConfidenceScore = analysis.ConfidenceScore,
                    AnalysisDate = analysis.AnalysisDate,
                    AnalysisMethod = analysis.AnalysisMethod,
                    ComponentCount = analysis.Components?.Count ?? 0,
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CostForge analysis unavailable for property {PropertyId}", property.Id);
            // CostForge section stays null — non-fatal
        }

        // ── Levy history (county-scoped, most recent 10) ─────────
        var levyQuery = _db.TaxLevies
            .AsNoTracking()
            .Where(t => t.CountyId == countyId.Value && t.IsActive);

        var totalLevies = await levyQuery.CountAsync();
        var recentLevies = await levyQuery
            .OrderByDescending(t => t.EffectiveDate)
            .Take(10)
            .Select(t => new ParcelDossierLevyEntryDto
            {
                TaxLevyId = t.Id,
                TaxingDistrict = t.TaxingDistrict ?? string.Empty,
                TaxRate = t.TaxRate,
                LevyAmount = t.LevyAmount,
                TaxYear = t.TaxYear,
                Purpose = t.Purpose ?? string.Empty,
                EffectiveDate = t.EffectiveDate,
            })
            .ToListAsync();

        dossier.Levies = new ParcelDossierLevySummaryDto
        {
            TotalRecords = totalLevies,
            Recent = recentLevies,
        };

        // ── Notes summary (county-isolated, most recent 5) ───────
        var notesQuery = _db.DossierNotes
            .AsNoTracking()
            .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value);

        var totalNotes = await notesQuery.CountAsync();
        var recentNotes = await notesQuery
            .OrderByDescending(n => n.CreatedAt)
            .Take(5)
            .Select(n => new ParcelDossierNoteEntryDto
            {
                NoteId = n.Id,
                NoteType = n.NoteType,
                Preview = n.Content.Length > 120 ? n.Content.Substring(0, 120) + "..." : n.Content,
                CreatedBy = n.CreatedBy,
                CreatedAt = n.CreatedAt,
            })
            .ToListAsync();

        dossier.Notes = new ParcelDossierNotesSummaryDto
        {
            TotalCount = totalNotes,
            Recent = recentNotes,
        };

        // ── CX-24: Trace metadata ───────────────────────────────
        dossier.CorrelationId = GetOrCreateCorrelationId();

        return Ok(dossier);
    }

    // ── GET /api/dossier/parcels/{parcelId}/details ──────────────────
    // CX-23: Parcel Dossier v1 "details"
    // CX-24: Selective includes (?include=property,valuation,levies,notes)
    //   Deeper view: parameterized limits, PII redaction, cost breakdown,
    //   note headers only (no content), CAMA-ready placeholders.
    //   County-isolated: cross-county → 404 (anti-enumeration)

    /// <summary>
    /// Detailed parcel dossier (county-isolated).
    /// Returns property with CAMA placeholders, cost breakdown categories,
    /// parameterized levy/note limits, and PII-redacted note headers.
    /// Use ?include= to request only specific sections (comma-separated).
    /// Valid sections: property, valuation, levies, notes.
    /// Default (omit include): all sections populated.
    /// Non-requested sections are serialized as null.
    /// </summary>
    [HttpGet("parcels/{parcelId}/details")]
    [RequiresPermission("read:dossier")]
    [ProducesResponseType(typeof(ParcelDossierDetailsDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ParcelDossierDetailsDto>> GetParcelDetails(
        string parcelId,
        [FromQuery] string? include = null,
        [FromQuery] int levyLimit = 10,
        [FromQuery] int noteLimit = 5)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        // Clamp limits to safe bounds
        levyLimit = Math.Clamp(levyLimit, 1, 100);
        noteLimit = Math.Clamp(noteLimit, 1, 20);

        // CX-24: Parse selective includes (default = all sections)
        var sections = ParseIncludes(include);

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        // ── Property (county-isolated) — always loaded for existence check ──
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        // ── Property section (CX-24: only if requested) ──────────
        PropertyDetails? propertyDetails = null;
        if (sections.Contains("property"))
        {
            propertyDetails = new PropertyDetails(
                PropertyId: property.Id,
                ParcelNumber: property.ParcelNumber,
                Address: property.Address,
                PropertyType: property.PropertyType,
                YearBuilt: property.YearBuilt,
                AssessedValue: property.AssessedValue,
                LandValue: property.LandValue,
                ImprovementValue: property.ImprovementValue,
                MarketValue: property.MarketValue,
                TaxYear: property.TaxYear,
                AssessmentDate: property.AssessmentDate,
                ClassCode: null,
                UseCode: null,
                Neighborhood: null
            );
        }

        // ── Valuation breakdown (CX-24: only if requested, best-effort) ──
        ValuationSignals? valuation = null;
        if (sections.Contains("valuation"))
        {
            try
            {
                var breakdown = await _costForge.GetCostBreakdownAsync(property.Id);
                if (breakdown is not null)
                {
                    valuation = new ValuationSignals(
                        TotalValue: breakdown.TotalValue,
                        CategoryCount: breakdown.Categories.Count,
                        Categories: breakdown.Categories
                            .Select(c => new ValuationCategory(c.Name, c.Amount, c.Percentage))
                            .ToList()
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "CostForge breakdown unavailable for property {PropertyId}", property.Id);
            }
        }

        // ── Levy history (CX-24: only if requested) ─────────────
        LevyDetails? levyDetails = null;
        if (sections.Contains("levies"))
        {
            var levyQuery = _db.TaxLevies
                .AsNoTracking()
                .Where(t => t.CountyId == countyId.Value && t.IsActive);

            var totalLevies = await levyQuery.CountAsync();
            var recentLevyData = await levyQuery
                .OrderByDescending(t => t.EffectiveDate)
                .Take(levyLimit)
                .Select(t => new
                {
                    t.Id,
                    TaxingDistrict = t.TaxingDistrict ?? string.Empty,
                    t.TaxRate,
                    t.LevyAmount,
                    t.TaxYear,
                    Purpose = t.Purpose ?? string.Empty,
                    t.EffectiveDate,
                })
                .ToListAsync();

            var recentLevies = recentLevyData
                .Select(t => new LevyEntry(t.Id, t.TaxingDistrict, t.TaxRate,
                    t.LevyAmount, t.TaxYear, t.Purpose, t.EffectiveDate))
                .ToList();

            levyDetails = new LevyDetails(totalLevies, recentLevies.Count, recentLevies);
        }

        // ── Note headers (CX-24: only if requested) ─────────────
        NoteHeaders? noteHeadersResult = null;
        if (sections.Contains("notes"))
        {
            var noteQuery = _db.DossierNotes
                .AsNoTracking()
                .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value);

            var totalNotes = await noteQuery.CountAsync();
            var noteData = await noteQuery
                .OrderByDescending(n => n.CreatedAt)
                .Take(noteLimit)
                .Select(n => new
                {
                    n.Id,
                    n.NoteType,
                    n.CreatedAt,
                    n.CreatedBy,
                })
                .ToListAsync();

            var noteHeaders = noteData
                .Select(n => new NoteHeaderItem(n.Id, n.NoteType, n.CreatedAt,
                    ClassifyAuthorKind(n.CreatedBy)))
                .ToList();

            noteHeadersResult = new NoteHeaders(totalNotes, noteHeaders.Count, noteHeaders);
        }

        var dto = new ParcelDossierDetailsDto(
            ParcelId: parcelId,
            CountyId: countyId.Value,
            GeneratedAt: DateTime.UtcNow,
            PiiRedacted: true,
            Property: propertyDetails,
            Valuation: valuation,
            Levies: levyDetails,
            Notes: noteHeadersResult
        )
        {
            // CX-24: Trace & evidence metadata
            CorrelationId = GetOrCreateCorrelationId(),
            Links = BuildResourceLinks(parcelId, "details"),
        };

        return Ok(dto);
    }

    // ── CX-24: Selective Includes Parser ────────────────────────────────

    private static readonly HashSet<string> AllSections = new(StringComparer.OrdinalIgnoreCase)
    {
        "property", "valuation", "levies", "notes"
    };

    /// <summary>
    /// Parse ?include= query parameter into a set of requested sections.
    /// Returns all sections if include is null/empty or contains no valid names.
    /// </summary>
    private static HashSet<string> ParseIncludes(string? include)
    {
        if (string.IsNullOrWhiteSpace(include))
            return new HashSet<string>(AllSections, StringComparer.OrdinalIgnoreCase);

        var requested = include
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => s.ToLowerInvariant())
            .Where(s => AllSections.Contains(s))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return requested.Count > 0
            ? requested
            : new HashSet<string>(AllSections, StringComparer.OrdinalIgnoreCase);
    }

    // ── GET /api/dossier/parcels/{parcelId}/evidence ─────────────────
    // CX-25: Evidence snapshot for audit handoff.
    //   Self-contained, hash-verifiable, county-isolated.
    //   Composes property, valuation, levy, and note metadata
    //   into a snapshot with SHA-256 content hash.

    /// <summary>
    /// Evidence snapshot for audit/regulatory handoff (county-isolated).
    /// Returns a self-contained evidence document with SHA-256 content
    /// hash for tamper detection. No note content — summary counts only.
    /// </summary>
    /// <remarks>
    /// <para><b>Hash contract:</b> The contentHash is a SHA-256 of the serialized
    /// data fields <em>including snapshotTimestamp</em>. This makes it a
    /// point-in-time snapshot seal, NOT a content-only digest. Two requests
    /// for the same parcel at different times will produce different hashes
    /// even if the underlying data has not changed.</para>
    /// </remarks>
    [HttpGet("parcels/{parcelId}/evidence")]
    [RequiresPermission("read:dossier")]
    [ProducesResponseType(typeof(EvidenceSnapshotDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<EvidenceSnapshotDto>> GetEvidenceSnapshot(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        // ── Property (county-isolated) ────────────────────────────
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        var propertySummary = new EvidencePropertySummary(
            PropertyId: property.Id,
            ParcelNumber: property.ParcelNumber,
            Address: property.Address,
            PropertyType: property.PropertyType,
            AssessedValue: property.AssessedValue,
            LandValue: property.LandValue,
            ImprovementValue: property.ImprovementValue,
            MarketValue: property.MarketValue,
            TaxYear: property.TaxYear,
            AssessmentDate: property.AssessmentDate
        );

        // ── Valuation summary (best-effort) ──────────────────────
        EvidenceValuationSummary? valuationSummary = null;
        try
        {
            var breakdown = await _costForge.GetCostBreakdownAsync(property.Id);
            if (breakdown is not null)
            {
                valuationSummary = new EvidenceValuationSummary(
                    TotalValue: breakdown.TotalValue,
                    CategoryCount: breakdown.Categories.Count
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CostForge unavailable for evidence snapshot {PropertyId}", property.Id);
        }

        // ── Levy summary (county-scoped) ─────────────────────────
        var levyQuery = _db.TaxLevies
            .AsNoTracking()
            .Where(t => t.CountyId == countyId.Value && t.IsActive);

        var totalLevies = await levyQuery.CountAsync();
        var totalLevyAmount = totalLevies > 0
            ? await levyQuery.SumAsync(t => t.LevyAmount)
            : 0m;

        // ── Note summary (county-isolated, no content) ───────────
        var noteQuery = _db.DossierNotes
            .AsNoTracking()
            .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value);

        var totalNotes = await noteQuery.CountAsync();
        var noteTypes = await noteQuery
            .Select(n => n.NoteType)
            .Distinct()
            .OrderBy(t => t)
            .ToArrayAsync();

        // ── Build snapshot (pre-hash) ────────────────────────────
        var correlationId = GetOrCreateCorrelationId();
        var snapshotTimestamp = DateTime.UtcNow;
        var links = BuildResourceLinks(parcelId, "evidence");

        // Compute content hash over the data fields (not the hash itself)
        var hashInput = new
        {
            parcelId,
            countyId = countyId.Value,
            snapshotTimestamp,
            property = propertySummary,
            valuation = valuationSummary,
            levies = new { totalLevies, totalLevyAmount },
            notes = new { totalNotes, noteTypes },
        };
        var contentHash = ComputeSha256(JsonSerializer.Serialize(hashInput, JsonHashOptions));

        var dto = new EvidenceSnapshotDto(
            ParcelId: parcelId,
            CountyId: countyId.Value,
            SnapshotTimestamp: snapshotTimestamp,
            CorrelationId: correlationId,
            ContentHash: contentHash,
            Property: propertySummary,
            Valuation: valuationSummary,
            Levies: new EvidenceLevySummary(totalLevies, totalLevies, totalLevyAmount),
            Notes: new EvidenceNoteSummary(totalNotes, totalNotes, noteTypes),
            Links: links
        );

        return Ok(dto);
    }

    // ── CX-25: Hash Helper ───────────────────────────────────────

    private static readonly JsonSerializerOptions JsonHashOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private static string ComputeSha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Classify note author into a non-PII kind bucket.
    /// "system" for known system prefixes, "human" otherwise.
    /// </summary>
    private static string ClassifyAuthorKind(string createdBy)
    {
        if (string.IsNullOrWhiteSpace(createdBy))
            return "unknown";

        var lower = createdBy.ToLowerInvariant();
        if (lower.StartsWith("system") || lower.StartsWith("auto") ||
            lower.StartsWith("cx") || lower.StartsWith("seed") ||
            lower.StartsWith("bot") || lower.StartsWith("agent"))
            return "system";

        return "human";
    }

    // ── GET /api/dossier/parcels/{parcelId}/assessment-history ────────
    // R2 Wave 4: compare_assessed_value_history
    //   Returns year-over-year assessment values from PropertyAssessments
    //   joined with the Property record. County-isolated.

    /// <summary>
    /// Assessment value history for a parcel (county-isolated).
    /// Returns year-over-year assessed, land, and improvement values
    /// with computed percent-change deltas for trend analysis.
    /// </summary>
    [HttpGet("parcels/{parcelId}/assessment-history")]
    [RequiresPermission("read:dossier")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAssessmentHistory(
        string parcelId,
        [FromQuery] int? fromYear = null,
        [FromQuery] int? toYear = null)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        // Verify parcel exists in caller's county
        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
            .Select(p => new { p.Id, p.ParcelId, p.Address, p.AssessedValue, p.LandValue, p.ImprovementValue, p.TaxYear })
            .FirstOrDefaultAsync();

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        // Query PropertyAssessments for this property
        var query = _db.PropertyAssessments
            .AsNoTracking()
            .Where(a => a.PropertyId == property.Id);

        if (fromYear.HasValue)
            query = query.Where(a => a.AssessmentYear >= fromYear.Value);
        if (toYear.HasValue)
            query = query.Where(a => a.AssessmentYear <= toYear.Value);

        var assessments = await query
            .OrderBy(a => a.AssessmentYear)
            .Select(a => new
            {
                a.AssessmentYear,
                a.AssessedValue,
                a.LandValue,
                a.ImprovementValue,
                a.MarketValue,
                a.AssessmentMethod,
                a.AssessmentDate,
            })
            .ToListAsync();

        // Build year-over-year entries with computed deltas
        var history = new List<object>();
        decimal? prevAssessed = null;

        foreach (var a in assessments)
        {
            decimal? pctChange = null;
            if (prevAssessed.HasValue && prevAssessed.Value != 0)
                pctChange = Math.Round((a.AssessedValue - prevAssessed.Value) / prevAssessed.Value * 100, 2);

            history.Add(new
            {
                year = a.AssessmentYear,
                assessedValue = a.AssessedValue,
                landValue = a.LandValue,
                improvementValue = a.ImprovementValue,
                marketValue = a.MarketValue,
                assessmentMethod = a.AssessmentMethod,
                assessmentDate = a.AssessmentDate,
                yearOverYearPctChange = pctChange,
            });

            prevAssessed = a.AssessedValue;
        }

        // Include current Property record as the "latest" if no assessment matches its year
        if (!assessments.Any(a => a.AssessmentYear == property.TaxYear))
        {
            decimal? pctChange = null;
            if (prevAssessed.HasValue && prevAssessed.Value != 0)
                pctChange = Math.Round((property.AssessedValue - prevAssessed.Value) / prevAssessed.Value * 100, 2);

            history.Add(new
            {
                year = property.TaxYear,
                assessedValue = property.AssessedValue,
                landValue = property.LandValue,
                improvementValue = property.ImprovementValue,
                marketValue = (decimal?)null,
                assessmentMethod = (string?)"current",
                assessmentDate = (DateTime?)null,
                yearOverYearPctChange = pctChange,
            });
        }

        return Ok(new
        {
            parcelId,
            address = property.Address,
            totalYears = history.Count,
            assessments = history,
            correlationId = GetOrCreateCorrelationId(),
        });
    }
}
