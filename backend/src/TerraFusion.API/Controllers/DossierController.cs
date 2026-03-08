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



  // ── Dossier Document & Evidence Registry (read-only) ─────────────

  public sealed record DocumentSearchRequest(
      string? Query,
      string? Type,
      string? Status,
      string? ParcelId,
      int? Limit,
      int? Offset);

  public sealed record EvidenceSearchRequest(
      string? ParcelId,
      string? EvidenceType,
      string? Integrity,
      int? Limit,
      int? Offset);

  [HttpPost("documents/search")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> SearchDocuments([FromBody] DocumentSearchRequest? request)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var normalizedParcelId = NormalizeOptionalParcelId(request?.ParcelId);
    if (request?.ParcelId is { Length: > 0 } && normalizedParcelId is null)
      return BadRequest(new { error = "Invalid parcelId format" });

    var query = request?.Query?.Trim();
    var typeFilter = NormalizeFilter(request?.Type);
    var statusFilter = NormalizeFilter(request?.Status);
    var limit = NormalizeLimit(request?.Limit);
    var offset = NormalizeOffset(request?.Offset);

    var documents = await BuildDocumentIndexAsync(countyId.Value);
    var filtered = documents
        .Where(d => normalizedParcelId is null || d.ParcelId.Equals(normalizedParcelId, StringComparison.OrdinalIgnoreCase))
        .Where(d => string.IsNullOrWhiteSpace(query)
            || d.Name.Contains(query, StringComparison.OrdinalIgnoreCase)
            || d.Id.Contains(query, StringComparison.OrdinalIgnoreCase))
        .Where(d => typeFilter is null || d.Type.Equals(typeFilter, StringComparison.OrdinalIgnoreCase))
        .Where(d => statusFilter is null || d.Status.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
        .ToList();

    var total = filtered.Count;
    var page = filtered.Skip(offset).Take(limit).ToList();

    return Ok(new
    {
      results = page.Select(d => new
      {
        id = d.Id,
        name = d.Name,
        type = d.Type,
        parcelId = d.ParcelId,
        uploadedBy = d.UploadedBy,
        uploadedAt = d.UploadedAt,
        size = d.Size,
        status = d.Status,
        custodyChain = d.CustodyChain,
        mimeType = d.MimeType,
        hash = d.Hash,
      }),
      total,
      hasMore = offset + page.Count < total,
    });
  }

  [HttpGet("documents/{id}")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetDocument(string id)
  {
    if (string.IsNullOrWhiteSpace(id))
      return BadRequest(new { error = "Document id is required" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var document = await FindDocumentAsync(countyId.Value, id.Trim());
    if (document is null)
      return NotFound(new { error = "Document not found" });

    return Ok(new
    {
      id = document.Id,
      name = document.Name,
      type = document.Type,
      parcelId = document.ParcelId,
      uploadedBy = document.UploadedBy,
      uploadedAt = document.UploadedAt,
      size = document.Size,
      status = document.Status,
      custodyChain = document.CustodyChain,
      mimeType = document.MimeType,
      hash = document.Hash,
    });
  }

  [HttpPost("evidence/search")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> SearchEvidence([FromBody] EvidenceSearchRequest? request)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var normalizedParcelId = NormalizeOptionalParcelId(request?.ParcelId);
    if (request?.ParcelId is { Length: > 0 } && normalizedParcelId is null)
      return BadRequest(new { error = "Invalid parcelId format" });

    var evidenceTypeFilter = NormalizeFilter(request?.EvidenceType);
    var integrityFilter = NormalizeFilter(request?.Integrity);
    var limit = NormalizeLimit(request?.Limit);
    var offset = NormalizeOffset(request?.Offset);

    var evidenceItems = await BuildEvidenceIndexAsync(countyId.Value);
    var filtered = evidenceItems
        .Where(e => normalizedParcelId is null || e.ParcelId.Equals(normalizedParcelId, StringComparison.OrdinalIgnoreCase))
        .Where(e => evidenceTypeFilter is null || e.EvidenceType.Equals(evidenceTypeFilter, StringComparison.OrdinalIgnoreCase))
        .Where(e => integrityFilter is null || e.Integrity.Equals(integrityFilter, StringComparison.OrdinalIgnoreCase))
        .ToList();

    var total = filtered.Count;
    var page = filtered.Skip(offset).Take(limit).ToList();

    return Ok(new
    {
      results = page.Select(e => new
      {
        id = e.Id,
        title = e.Title,
        parcelId = e.ParcelId,
        evidenceType = e.EvidenceType,
        createdBy = e.CreatedBy,
        createdAt = e.CreatedAt,
        integrity = e.Integrity,
        chainLength = e.ChainLength,
        lastAction = e.LastAction,
      }),
      total,
      hasMore = offset + page.Count < total,
    });
  }

  [HttpGet("evidence/{evidenceId}/chain")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetChainOfCustody(string evidenceId)
  {
    if (string.IsNullOrWhiteSpace(evidenceId))
      return BadRequest(new { error = "Evidence id is required" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var chain = await BuildChainOfCustody(countyId.Value, evidenceId.Trim());
    if (chain is null)
      return NotFound(new { error = "Evidence item not found" });

    return Ok(chain.Select(eventItem => new
    {
      timestamp = eventItem.Timestamp,
      actor = eventItem.Actor,
      action = eventItem.Action,
      hash = eventItem.Hash,
    }));
  }

  [HttpGet("stats")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetStats()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var documents = await BuildDocumentIndexAsync(countyId.Value);
    var evidenceItems = await BuildEvidenceIndexAsync(countyId.Value);

    return Ok(new
    {
      totalDocuments = documents.Count,
      activeDocuments = documents.Count(d => d.Status.Equals("active", StringComparison.OrdinalIgnoreCase)),
      sealedRecords = documents.Count(d => d.Status.Equals("sealed", StringComparison.OrdinalIgnoreCase)),
      archivedDocuments = documents.Count(d => d.Status.Equals("archived", StringComparison.OrdinalIgnoreCase)),
      documentTypes = documents.Select(d => d.Type).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
      totalEvidence = evidenceItems.Count,
      verifiedEvidence = evidenceItems.Count(e => e.Integrity.Equals("verified", StringComparison.OrdinalIgnoreCase)),
      pendingEvidence = evidenceItems.Count(e => e.Integrity.Equals("pending", StringComparison.OrdinalIgnoreCase)),
      disputedEvidence = evidenceItems.Count(e => e.Integrity.Equals("disputed", StringComparison.OrdinalIgnoreCase)),
    });
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

  // ══════════════════════════════════════════════════════════════
  // WAVE 13 — Real Benton County Document Management
  // Source: terra-flow-production quarantine + WA Secretary of State
  //         Local Government CORE Retention Schedule (assessor records)
  // ══════════════════════════════════════════════════════════════

  // ── GET /api/dossier/document-types ──────────────────────────

  /// <summary>
  /// Real assessor document types sourced from Benton County operations
  /// and the quarantined terra-flow-production validation schema.
  /// Each type includes accepted file extensions, retention class, and
  /// whether the document enters the chain-of-custody on intake.
  /// </summary>
  [HttpGet("document-types")]
  public IActionResult GetDocumentTypes()
  {
    Response.Headers["X-Dossier-Source"] = "benton-real-document-types-fy2025";
    return Ok(new
    {
      county = "benton",
      state = "WA",
      sourceNote = "terra-flow-production quarantine + WA CORE retention schedule",
      total = BentonDocumentData.DocumentTypes.Length,
      documentTypes = BentonDocumentData.DocumentTypes,
    });
  }

  // ── GET /api/dossier/retention-schedule ──────────────────────

  /// <summary>
  /// WA Secretary of State Local Government CORE retention schedule
  /// for county assessor records. Each entry cites the applicable
  /// Records Retention Schedule (RRS) identifier and WA RCW authority.
  /// </summary>
  [HttpGet("retention-schedule")]
  public IActionResult GetRetentionSchedule()
  {
    Response.Headers["X-Dossier-Source"] = "wa-sos-core-retention-schedule";
    return Ok(new
    {
      authority = "WA Secretary of State, Local Government Common Records Retention Schedule (CORE)",
      applicableTo = "County Assessor",
      state = "WA",
      total = BentonDocumentData.RetentionSchedule.Length,
      schedule = BentonDocumentData.RetentionSchedule,
    });
  }

  // ── GET /api/dossier/evidence-categories ─────────────────────

  /// <summary>
  /// Evidence categories used in Benton County property assessment.
  /// Each category includes integrity requirements, typical sources,
  /// and the minimum chain-of-custody depth for audit compliance.
  /// </summary>
  [HttpGet("evidence-categories")]
  public IActionResult GetEvidenceCategories()
  {
    Response.Headers["X-Dossier-Source"] = "benton-real-evidence-categories-fy2025";
    return Ok(new
    {
      county = "benton",
      state = "WA",
      total = BentonDocumentData.EvidenceCategories.Length,
      categories = BentonDocumentData.EvidenceCategories,
    });
  }

  // ── GET /api/dossier/packet-templates ────────────────────────

  /// <summary>
  /// Assessment packet templates defining which documents are required
  /// for each packet type (BOE appeal, certification, exemption review, etc.).
  /// Used by TerraDossier to generate compliance-ready document bundles.
  /// </summary>
  [HttpGet("packet-templates")]
  public IActionResult GetPacketTemplates()
  {
    Response.Headers["X-Dossier-Source"] = "benton-real-packet-templates-fy2025";
    return Ok(new
    {
      county = "benton",
      state = "WA",
      total = BentonDocumentData.PacketTemplates.Length,
      templates = BentonDocumentData.PacketTemplates,
    });
  }

  // ── POST /api/dossier/classify-document ──────────────────────

  public sealed record DocumentClassifyRequest(string? Filename, string? Description);

  /// <summary>
  /// Auto-classify a document by filename and/or description.
  /// Returns the matched document type, evidence category,
  /// suggested retention class, and confidence score.
  /// </summary>
  [HttpPost("classify-document")]
  public IActionResult ClassifyDocument([FromBody] DocumentClassifyRequest request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required" });

    var input = $"{request.Filename ?? ""} {request.Description ?? ""}".Trim();
    if (string.IsNullOrWhiteSpace(input))
      return BadRequest(new { error = "At least one of filename or description is required" });

    Response.Headers["X-Dossier-Source"] = "benton-real-document-classifier-fy2025";

    var classification = ClassifyDocumentInput(input);
    return Ok(classification);
  }

  // ── GET /api/dossier/parcels/{parcelId}/packet/{packetType} ──

  /// <summary>
  /// Generate a document packet manifest for a parcel.
  /// Composes the required document checklist for the given packet type,
  /// checks which documents are on record, and returns a completeness score.
  /// </summary>
  [HttpGet("parcels/{parcelId}/packet/{packetType}")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetPacketManifest(string parcelId, string packetType)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var template = BentonDocumentData.PacketTemplates
        .FirstOrDefault(t => t.PacketType.Equals(packetType, StringComparison.OrdinalIgnoreCase));
    if (template is null)
      return NotFound(new { error = $"Unknown packet type: {packetType}" });

    var property = await _db.Properties
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    var notes = await _db.DossierNotes
        .AsNoTracking()
        .Where(n => n.ParcelId == parcelId && n.CountyId == countyId.Value)
        .Select(n => new { n.NoteType, n.CreatedAt })
        .ToListAsync();

    // Build checklist: for each required doc type, check if we have evidence
    var checklist = template.RequiredDocumentTypes.Select(requiredType =>
    {
      var found = false;
      DateTime? foundAt = null;

      // Check property data as a source (casefile, valuation worksheet always exist)
      if (requiredType.Equals("report", StringComparison.OrdinalIgnoreCase) ||
          requiredType.Equals("appraisal", StringComparison.OrdinalIgnoreCase))
      {
        found = true;
        foundAt = property.AssessmentDate;
      }

      // Check notes for matching document types
      if (!found)
      {
        var matchingNote = notes.FirstOrDefault(n =>
            MapDocumentType(n.NoteType).Equals(requiredType, StringComparison.OrdinalIgnoreCase));
        if (matchingNote is not null)
        {
          found = true;
          foundAt = matchingNote.CreatedAt;
        }
      }

      return new
      {
        documentType = requiredType,
        required = true,
        found,
        foundAt,
        status = found ? "satisfied" : "missing",
      };
    }).ToList();

    var satisfied = checklist.Count(c => c.found);
    var total = checklist.Count;
    var completeness = total > 0 ? Math.Round((double)satisfied / total * 100, 1) : 0.0;

    Response.Headers["X-Dossier-Source"] = "benton-real-packet-manifest-fy2025";

    return Ok(new
    {
      parcelId,
      packetType = template.PacketType,
      packetName = template.Name,
      description = template.Description,
      generatedAt = DateTime.UtcNow,
      completeness = $"{completeness}%",
      satisfied,
      total,
      checklist,
      correlationId = GetOrCreateCorrelationId(),
    });
  }

  // ── Classification Engine ────────────────────────────────────

  internal static object ClassifyDocumentInput(string input)
  {
    var lower = input.ToLowerInvariant();

    // Priority-ordered keyword rules
    foreach (var rule in ClassificationRules)
    {
      if (rule.Keywords.Any(kw => lower.Contains(kw)))
      {
        return new
        {
          documentType = rule.DocumentType,
          evidenceCategory = rule.EvidenceCategory,
          retentionClass = rule.RetentionClass,
          confidence = rule.Confidence,
          matchedRule = rule.RuleName,
        };
      }
    }

    // Default fallback
    return new
    {
      documentType = "other",
      evidenceCategory = "regulatory",
      retentionClass = "standard-6yr",
      confidence = 0.3,
      matchedRule = "default-fallback",
    };
  }

  private sealed record ClassificationRule(
      string RuleName,
      string[] Keywords,
      string DocumentType,
      string EvidenceCategory,
      string RetentionClass,
      double Confidence);

  private static readonly ClassificationRule[] ClassificationRules =
  [
    new("deed-transfer", ["deed", "warranty deed", "quit claim", "conveyance"],
        "deed", "deed-transfer", "permanent", 0.95),
    new("lien-record", ["lien", "encumbrance"],
        "lien", "regulatory", "permanent", 0.91),
    new("mortgage-record", ["mortgage", "trust deed"],
        "mortgage", "regulatory", "permanent", 0.90),
    new("appeal-petition", ["appeal", "petition", "boe", "board of equalization", "hearing"],
        "appeal", "appeal-evidence", "appeal-10yr", 0.92),
    new("field-inspection", ["inspection", "field visit", "site visit", "physical review"],
        "inspection_report", "field-inspection", "working-6yr", 0.88),
    new("photo-evidence", ["photo", "photograph", "image", "picture", "aerial"],
        "photo", "photo-evidence", "life-of-property", 0.90),
    new("survey-record", ["survey", "boundary"],
        "survey", "plat-survey", "permanent", 0.93),
    new("plat-record", ["plat", "subdivision", "lot line"],
        "plat", "plat-survey", "permanent", 0.92),
    new("appraisal-report", ["appraisal", "valuation", "cost approach", "market value", "assessed"],
        "appraisal", "cost-analysis", "working-6yr", 0.87),
    new("comparable-sale", ["comparable", "comp sale", "sales comparison", "market comp"],
        "comparable_analysis", "comparable-sale", "working-6yr", 0.85),
    new("income-analysis", ["income", "rental", "cap rate", "capitalization", "gim", "gross income"],
        "income_analysis", "income-analysis", "working-6yr", 0.84),
    new("tax-record", ["tax", "tax bill", "levy", "assessment roll", "tax statement"],
        "tax_record", "regulatory", "assessment-roll-perm", 0.88),
    new("easement-record", ["easement", "right of way", "access", "utility easement"],
        "easement", "regulatory", "permanent", 0.91),
    new("exemption-form", ["exemption", "senior", "disabled", "nonprofit", "current use"],
        "exemption", "regulatory", "exemption-6yr-post", 0.86),
    new("permit-document", ["permit", "building permit", "construction", "remodel"],
        "permit", "regulatory", "working-6yr", 0.83),
    new("correspondence", ["letter", "notice", "correspondence", "email", "memo"],
        "correspondence", "regulatory", "correspondence-6yr", 0.80),
    new("sketch-drawing", ["sketch", "floor plan", "drawing", "blueprint", "layout"],
        "sketch", "field-inspection", "life-of-property", 0.82),
  ];

  // ── Static Reference Data ────────────────────────────────────

  internal static class BentonDocumentData
  {
    // Document types sourced from terra-flow-production quarantine
    // validation.py _get_document_validation_template() + extended
    // with real WA county assessor document types
    internal sealed record DocumentTypeEntry(
        string Type, string Label, string Description,
        string[] AcceptedExtensions, string RetentionClass,
        bool EntersCustodyChain);

    internal static readonly DocumentTypeEntry[] DocumentTypes =
    [
      new("deed", "Deed", "Property ownership transfer document",
          [".pdf", ".tif", ".tiff"], "permanent", true),
      new("mortgage", "Mortgage / Trust Deed", "Lending instrument recorded against property",
          [".pdf", ".tif"], "permanent", true),
      new("lien", "Lien", "Financial encumbrance against property",
          [".pdf", ".tif"], "permanent", true),
      new("easement", "Easement", "Right-of-way or access encumbrance",
          [".pdf", ".tif"], "permanent", true),
      new("plat", "Plat Map", "Recorded subdivision plat",
          [".pdf", ".tif", ".tiff", ".dwg"], "permanent", true),
      new("survey", "Boundary Survey", "Licensed surveyor boundary determination",
          [".pdf", ".tif", ".dwg"], "permanent", true),
      new("tax_record", "Tax Record", "Assessment roll or tax statement entry",
          [".pdf", ".xls", ".xlsx", ".csv"], "assessment-roll-perm", true),
      new("appeal", "Appeal Petition", "Board of Equalization appeal filing",
          [".pdf", ".doc", ".docx"], "appeal-10yr", true),
      new("photo", "Property Photograph", "Field inspection imagery",
          [".jpg", ".jpeg", ".png", ".tif", ".heic"], "life-of-property", false),
      new("appraisal", "Appraisal / Valuation Report", "Cost, sales, or income approach worksheet",
          [".pdf", ".xls", ".xlsx"], "working-6yr", true),
      new("inspection_report", "Field Inspection Report", "On-site property condition assessment",
          [".pdf", ".doc", ".docx"], "working-6yr", true),
      new("comparable_analysis", "Comparable Sales Analysis", "Sales comparison approach documentation",
          [".pdf", ".xls", ".xlsx"], "working-6yr", true),
      new("income_analysis", "Income Approach Analysis", "Rental income capitalization worksheet",
          [".pdf", ".xls", ".xlsx"], "working-6yr", true),
      new("exemption", "Exemption Application", "Senior, disabled, nonprofit, or current use exemption",
          [".pdf", ".doc", ".docx"], "exemption-6yr-post", true),
      new("permit", "Building Permit", "Construction or remodel permit documentation",
          [".pdf", ".doc", ".docx"], "working-6yr", false),
      new("correspondence", "Correspondence", "Letters, notices, and memos",
          [".pdf", ".doc", ".docx", ".msg"], "correspondence-6yr", false),
      new("sketch", "Property Sketch", "Floor plan or building layout drawing",
          [".pdf", ".dwg", ".png", ".jpg"], "life-of-property", false),
      new("other", "Other Document", "Uncategorized supporting documentation",
          [".pdf", ".doc", ".docx", ".jpg", ".png", ".tif"], "standard-6yr", false),
    ];

    // WA Secretary of State Local Government CORE Retention Schedule
    // for County Assessor records (GS-series + AS-series identifiers)
    internal sealed record RetentionEntry(
        string RetentionClass, string Label, string Period,
        string Authority, string Notes);

    internal static readonly RetentionEntry[] RetentionSchedule =
    [
      new("permanent", "Permanent Records",
          "Permanent",
          "WA RCW 40.14.060; GS50-03-01",
          "Deeds, plats, surveys, easements, liens, mortgages — recorded instruments"),
      new("assessment-roll-perm", "Assessment Roll Records",
          "Permanent",
          "WA RCW 84.40.340; AS50-01A-01",
          "Annual assessment rolls, tax roll certifications, and roll summaries"),
      new("appeal-10yr", "Appeal Records",
          "10 years after final disposition",
          "WA RCW 84.08; AS50-01A-04",
          "BOE petitions, decisions, hearing records, and appeal correspondence"),
      new("working-6yr", "Working Papers — Appraisal",
          "6 years",
          "WA RCW 40.14.070; GS50-05A-15",
          "Appraisal worksheets, cost schedules, field notes, comp analysis, income approach workpapers"),
      new("exemption-6yr-post", "Exemption Records",
          "6 years after exemption expires",
          "WA RCW 84.36; AS50-01A-06",
          "Senior, disabled, nonprofit, and current use exemption applications and renewals"),
      new("correspondence-6yr", "General Correspondence",
          "6 years",
          "WA RCW 40.14.070; GS2010-003",
          "Letters, notices, memos, and routine office correspondence"),
      new("life-of-property", "Life-of-Property Records",
          "Life of property + 6 years",
          "WA RCW 40.14.070; GS50-05A-10",
          "Property photographs, sketches, and physical condition documentation"),
      new("standard-6yr", "Standard Retention",
          "6 years",
          "WA RCW 40.14.070; GS50-05A-15",
          "Uncategorized supporting documentation and miscellaneous records"),
    ];

    // Evidence categories for property assessment dossier management
    internal sealed record EvidenceCategoryEntry(
        string Category, string Label, string Description,
        string IntegrityRequirement, int MinCustodyDepth,
        string[] TypicalSources);

    internal static readonly EvidenceCategoryEntry[] EvidenceCategories =
    [
      new("field-inspection", "Field Inspection Evidence",
          "On-site observations, measurements, and condition assessments",
          "verified", 3, ["County Assessor", "Field Appraiser", "Inspector"]),
      new("comparable-sale", "Comparable Sales Data",
          "Arms-length transactions used in sales comparison approach",
          "verified", 2, ["MLS", "County Auditor", "Excise Tax Affidavit"]),
      new("cost-analysis", "Cost Approach Evidence",
          "Replacement/reproduction cost data and depreciation schedules",
          "verified", 2, ["Marshall & Swift", "CostForge", "County Cost Tables"]),
      new("income-analysis", "Income Approach Evidence",
          "Rental income, vacancy rates, and capitalization data",
          "verified", 2, ["Property Owner", "Market Survey", "CoStar"]),
      new("market-data", "General Market Data",
          "Market trends, area analysis, and economic indicators",
          "pending", 1, ["DOR", "Census Bureau", "BLS", "Local MLS"]),
      new("appeal-evidence", "Appeal / BOE Evidence",
          "Documents supporting or defending assessed value at hearing",
          "verified", 4, ["Petitioner", "County Assessor", "BOE Clerk"]),
      new("photo-evidence", "Photographic Evidence",
          "Dated imagery of property condition, improvements, or damage",
          "verified", 3, ["County Assessor", "Field Appraiser", "Aerial Provider"]),
      new("deed-transfer", "Deed / Transfer Records",
          "Ownership transfer documents establishing chain of title",
          "verified", 3, ["County Auditor (Recording)", "Title Company"]),
      new("plat-survey", "Plat / Survey Evidence",
          "Licensed survey data, subdivision plats, and boundary determinations",
          "verified", 3, ["Licensed Surveyor", "County Planning", "WSDOT"]),
      new("regulatory", "Regulatory / Compliance Documents",
          "Government correspondence, permits, exemptions, and tax records",
          "pending", 2, ["County Assessor", "DOR", "Building Department"]),
    ];

    // Assessment packet templates
    internal sealed record PacketTemplateEntry(
        string PacketType, string Name, string Description,
        string[] RequiredDocumentTypes, string Authority,
        string Notes);

    internal static readonly PacketTemplateEntry[] PacketTemplates =
    [
      new("annual-assessment", "Annual Assessment Packet",
          "Standard property assessment documentation for annual revaluation cycle",
          ["appraisal", "inspection_report", "photo", "comparable_analysis"],
          "WA RCW 84.41.030",
          "Required for each property during revaluation cycle; includes cost, sales, or income approach evidence"),
      new("boe-appeal-defense", "BOE Appeal Defense Packet",
          "Complete evidence package for Board of Equalization hearing defense",
          ["appraisal", "comparable_analysis", "photo", "inspection_report", "correspondence", "report"],
          "WA RCW 84.08.130",
          "Assembled when taxpayer files appeal; must include all three approaches to value if available"),
      new("certification-roll", "Certification Roll Packet",
          "Assessment roll certification documentation for county legislative authority",
          ["tax_record", "report", "correspondence"],
          "WA RCW 84.40.320",
          "Annual certification package submitted to county legislative authority by July 15"),
      new("exemption-review", "Exemption Review Packet",
          "Documentation for exemption eligibility determination and renewal",
          ["exemption", "correspondence", "report"],
          "WA RCW 84.36",
          "Assembled for each exemption application; senior/disabled require income verification"),
      new("new-construction", "New Construction Packet",
          "Documentation for newly constructed or substantially remodeled property",
          ["permit", "inspection_report", "photo", "appraisal", "sketch"],
          "WA RCW 84.40.030",
          "Triggered by building permit completion; field inspection required before value determination"),
      new("revaluation-cycle", "Revaluation Cycle Packet",
          "Physical inspection cycle documentation (WA 4-year cycle requirement)",
          ["inspection_report", "photo", "sketch", "comparable_analysis", "appraisal"],
          "WA RCW 84.41.030",
          "Each property must be physically inspected at least once per 4-year cycle"),
    ];
  }

  // ══════════════════════════════════════════════════════════════
  // WAVE 24 — Persistent Document Management + Evidence Chain
  // Replaces synthesized-only document/evidence indexes with real
  // DB-backed entities while keeping synthesized views for backward compat.
  // ══════════════════════════════════════════════════════════════

  // ── Document CRUD ────────────────────────────────────────────

  public sealed record RegisterDocumentRequest(
      string ParcelId,
      string Name,
      string DocumentType,
      string MimeType,
      long SizeBytes,
      string ContentHash,
      string? Description,
      string? RetentionClass,
      string? StoragePath);

  /// <summary>
  /// Register a new document for a parcel. Creates persistent document metadata record.
  /// </summary>
  [HttpPost("documents")]
  [RequiresPermission("write:dossier")]
  public async Task<IActionResult> RegisterDocument([FromBody] RegisterDocumentRequest? request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required" });

    if (string.IsNullOrWhiteSpace(request.ParcelId) || !IsValidParcelId(request.ParcelId.Trim()))
      return BadRequest(new { error = "Invalid parcelId format" });

    if (string.IsNullOrWhiteSpace(request.Name))
      return BadRequest(new { error = "Document name is required" });

    if (request.Name.Length > 200)
      return BadRequest(new { error = "Document name must be at most 200 characters" });

    if (string.IsNullOrWhiteSpace(request.DocumentType))
      return BadRequest(new { error = "Document type is required" });

    if (string.IsNullOrWhiteSpace(request.MimeType))
      return BadRequest(new { error = "Mime type is required" });

    if (request.SizeBytes < 0)
      return BadRequest(new { error = "SizeBytes must be non-negative" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var parcelId = request.ParcelId.Trim();
    var property = await _db.Properties
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    var entersCustody = BentonDocumentData.DocumentTypes
        .FirstOrDefault(t => t.Type.Equals(request.DocumentType, StringComparison.OrdinalIgnoreCase))
        ?.EntersCustodyChain ?? false;

    var document = new DossierDocument
    {
      ParcelId = parcelId,
      Name = request.Name.Trim(),
      DocumentType = request.DocumentType.Trim(),
      MimeType = request.MimeType.Trim(),
      SizeBytes = request.SizeBytes,
      ContentHash = request.ContentHash?.Trim() ?? "",
      Description = request.Description?.Trim(),
      RetentionClass = request.RetentionClass?.Trim(),
      StoragePath = request.StoragePath?.Trim(),
      EntersCustodyChain = entersCustody,
      CountyId = countyId.Value,
      UploadedBy = User.Identity?.Name ?? "system",
    };

    _db.DossierDocuments.Add(document);
    await _db.SaveChangesAsync();

    _logger.LogInformation("Document {DocumentId} registered for parcel {ParcelId}", document.Id, parcelId);

    return CreatedAtAction(nameof(GetPersistentDocument), new { id = document.Id }, new
    {
      id = document.Id,
      parcelId = document.ParcelId,
      name = document.Name,
      documentType = document.DocumentType,
      status = document.Status,
      uploadedBy = document.UploadedBy,
      uploadedAt = document.UploadedAt,
      correlationId = GetOrCreateCorrelationId(),
    });
  }

  /// <summary>
  /// Get a persistent document record by ID.
  /// </summary>
  [HttpGet("documents/persistent/{id}")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetPersistentDocument(string id)
  {
    if (!Guid.TryParse(id, out var documentId))
      return BadRequest(new { error = "Invalid document id" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var document = await _db.DossierDocuments
        .AsNoTracking()
        .FirstOrDefaultAsync(d => d.Id == documentId && d.CountyId == countyId.Value);
    if (document is null)
      return NotFound(new { error = "Document not found" });

    return Ok(new
    {
      id = document.Id,
      parcelId = document.ParcelId,
      name = document.Name,
      documentType = document.DocumentType,
      status = document.Status,
      mimeType = document.MimeType,
      sizeBytes = document.SizeBytes,
      contentHash = document.ContentHash,
      storagePath = document.StoragePath,
      description = document.Description,
      retentionClass = document.RetentionClass,
      entersCustodyChain = document.EntersCustodyChain,
      uploadedBy = document.UploadedBy,
      uploadedAt = document.UploadedAt,
      createdAt = document.CreatedAt,
      updatedAt = document.UpdatedAt,
    });
  }

  public sealed record UpdateDocumentStatusRequest(string Status, string? Reason);

  /// <summary>
  /// Update document status (active → sealed → archived). Append-only status transitions.
  /// </summary>
  [HttpPatch("documents/persistent/{id}/status")]
  [RequiresPermission("write:dossier")]
  public async Task<IActionResult> UpdateDocumentStatus(string id, [FromBody] UpdateDocumentStatusRequest? request)
  {
    if (!Guid.TryParse(id, out var documentId))
      return BadRequest(new { error = "Invalid document id" });

    if (request is null || string.IsNullOrWhiteSpace(request.Status))
      return BadRequest(new { error = "Status is required" });

    var newStatus = request.Status.Trim().ToLowerInvariant();
    if (newStatus is not ("active" or "sealed" or "archived"))
      return BadRequest(new { error = "Status must be one of: active, sealed, archived" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var document = await _db.DossierDocuments
        .FirstOrDefaultAsync(d => d.Id == documentId && d.CountyId == countyId.Value);
    if (document is null)
      return NotFound(new { error = "Document not found" });

    // Validate transition: active → sealed → archived (no backward transitions)
    var validTransitions = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
      ["active"] = new[] { "sealed", "archived" },
      ["sealed"] = new[] { "archived" },
      ["archived"] = Array.Empty<string>(),
    };

    if (!validTransitions.TryGetValue(document.Status, out var allowed) ||
        !allowed.Contains(newStatus, StringComparer.OrdinalIgnoreCase))
      return BadRequest(new { error = $"Cannot transition from '{document.Status}' to '{newStatus}'" });

    document.Status = newStatus;
    document.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    _logger.LogInformation("Document {DocumentId} status updated to {Status}", document.Id, newStatus);

    return Ok(new
    {
      id = document.Id,
      status = document.Status,
      updatedAt = document.UpdatedAt,
      correlationId = GetOrCreateCorrelationId(),
    });
  }

  /// <summary>
  /// List persistent documents for a parcel (county-isolated).
  /// </summary>
  [HttpGet("parcels/{parcelId}/documents")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> ListParcelDocuments(string parcelId, [FromQuery] int? limit, [FromQuery] int? offset)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var effectiveLimit = NormalizeLimit(limit);
    var effectiveOffset = NormalizeOffset(offset);

    var query = _db.DossierDocuments
        .AsNoTracking()
        .Where(d => d.ParcelId == parcelId && d.CountyId == countyId.Value)
        .OrderByDescending(d => d.UploadedAt);

    var total = await query.CountAsync();
    var documents = await query
        .Skip(effectiveOffset)
        .Take(effectiveLimit)
        .Select(d => new
        {
          id = d.Id,
          name = d.Name,
          documentType = d.DocumentType,
          status = d.Status,
          mimeType = d.MimeType,
          sizeBytes = d.SizeBytes,
          uploadedBy = d.UploadedBy,
          uploadedAt = d.UploadedAt,
        })
        .ToListAsync();

    return Ok(new
    {
      results = documents,
      total,
      hasMore = effectiveOffset + documents.Count < total,
    });
  }

  // ── Evidence CRUD ────────────────────────────────────────────

  public sealed record RegisterEvidenceRequest(
      string ParcelId,
      string Title,
      string EvidenceType,
      Guid? DocumentId);

  /// <summary>
  /// Register a new evidence item for a parcel. Creates initial "created" custody event.
  /// </summary>
  [HttpPost("evidence")]
  [RequiresPermission("write:dossier")]
  public async Task<IActionResult> RegisterEvidence([FromBody] RegisterEvidenceRequest? request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required" });

    if (string.IsNullOrWhiteSpace(request.ParcelId) || !IsValidParcelId(request.ParcelId.Trim()))
      return BadRequest(new { error = "Invalid parcelId format" });

    if (string.IsNullOrWhiteSpace(request.Title))
      return BadRequest(new { error = "Evidence title is required" });

    if (request.Title.Length > 200)
      return BadRequest(new { error = "Title must be at most 200 characters" });

    if (string.IsNullOrWhiteSpace(request.EvidenceType))
      return BadRequest(new { error = "Evidence type is required" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var parcelId = request.ParcelId.Trim();
    var property = await _db.Properties
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    // Validate DocumentId if provided
    if (request.DocumentId.HasValue)
    {
      var doc = await _db.DossierDocuments
          .AsNoTracking()
          .FirstOrDefaultAsync(d => d.Id == request.DocumentId.Value && d.CountyId == countyId.Value);
      if (doc is null)
        return BadRequest(new { error = "Referenced document not found" });
    }

    var actor = User.Identity?.Name ?? "system";
    var evidence = new DossierEvidence
    {
      ParcelId = parcelId,
      Title = request.Title.Trim(),
      EvidenceType = request.EvidenceType.Trim(),
      DocumentId = request.DocumentId,
      CountyId = countyId.Value,
      CreatedBy = actor,
    };

    _db.DossierEvidenceItems.Add(evidence);

    // Create initial custody event
    var custodyEvent = new DossierCustodyEvent
    {
      EvidenceId = evidence.Id,
      Action = "created",
      Actor = actor,
      Hash = ComputeSha256($"evidence:{evidence.Id:N}:{evidence.CreatedAt:O}:{parcelId}"),
      CountyId = countyId.Value,
    };

    _db.DossierCustodyEvents.Add(custodyEvent);
    await _db.SaveChangesAsync();

    _logger.LogInformation("Evidence {EvidenceId} registered for parcel {ParcelId}", evidence.Id, parcelId);

    return CreatedAtAction(nameof(GetPersistentEvidence), new { id = evidence.Id }, new
    {
      id = evidence.Id,
      parcelId = evidence.ParcelId,
      title = evidence.Title,
      evidenceType = evidence.EvidenceType,
      integrity = evidence.Integrity,
      createdBy = evidence.CreatedBy,
      createdAt = evidence.CreatedAt,
      correlationId = GetOrCreateCorrelationId(),
    });
  }

  /// <summary>
  /// Get a persistent evidence record by ID.
  /// </summary>
  [HttpGet("evidence/persistent/{id}")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetPersistentEvidence(string id)
  {
    if (!Guid.TryParse(id, out var evidenceId))
      return BadRequest(new { error = "Invalid evidence id" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var evidence = await _db.DossierEvidenceItems
        .AsNoTracking()
        .FirstOrDefaultAsync(e => e.Id == evidenceId && e.CountyId == countyId.Value);
    if (evidence is null)
      return NotFound(new { error = "Evidence item not found" });

    var chainLength = await _db.DossierCustodyEvents
        .AsNoTracking()
        .CountAsync(c => c.EvidenceId == evidenceId);

    return Ok(new
    {
      id = evidence.Id,
      parcelId = evidence.ParcelId,
      title = evidence.Title,
      evidenceType = evidence.EvidenceType,
      integrity = evidence.Integrity,
      documentId = evidence.DocumentId,
      createdBy = evidence.CreatedBy,
      createdAt = evidence.CreatedAt,
      chainLength,
    });
  }

  /// <summary>
  /// List persistent evidence items for a parcel (county-isolated).
  /// </summary>
  [HttpGet("parcels/{parcelId}/evidence/persistent")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> ListParcelEvidence(string parcelId, [FromQuery] int? limit, [FromQuery] int? offset)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var effectiveLimit = NormalizeLimit(limit);
    var effectiveOffset = NormalizeOffset(offset);

    var query = _db.DossierEvidenceItems
        .AsNoTracking()
        .Where(e => e.ParcelId == parcelId && e.CountyId == countyId.Value)
        .OrderByDescending(e => e.CreatedAt);

    var total = await query.CountAsync();
    var evidence = await query
        .Skip(effectiveOffset)
        .Take(effectiveLimit)
        .Select(e => new
        {
          id = e.Id,
          title = e.Title,
          evidenceType = e.EvidenceType,
          integrity = e.Integrity,
          documentId = e.DocumentId,
          createdBy = e.CreatedBy,
          createdAt = e.CreatedAt,
        })
        .ToListAsync();

    return Ok(new
    {
      results = evidence,
      total,
      hasMore = effectiveOffset + evidence.Count < total,
    });
  }

  // ── Custody Chain Operations ─────────────────────────────────

  public sealed record AddCustodyEventRequest(string Action, string? Notes);

  /// <summary>
  /// Add a custody event to an evidence item (append-only). Updates integrity status.
  /// </summary>
  [HttpPost("evidence/persistent/{id}/custody")]
  [RequiresPermission("write:dossier")]
  public async Task<IActionResult> AddCustodyEvent(string id, [FromBody] AddCustodyEventRequest? request)
  {
    if (!Guid.TryParse(id, out var evidenceId))
      return BadRequest(new { error = "Invalid evidence id" });

    if (request is null || string.IsNullOrWhiteSpace(request.Action))
      return BadRequest(new { error = "Action is required" });

    var action = request.Action.Trim().ToLowerInvariant();
    var validActions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
      "verified", "transferred", "sealed", "disputed", "hash-verified", "reviewed"
    };

    if (!validActions.Contains(action))
      return BadRequest(new { error = $"Invalid action. Must be one of: {string.Join(", ", validActions)}" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var evidence = await _db.DossierEvidenceItems
        .FirstOrDefaultAsync(e => e.Id == evidenceId && e.CountyId == countyId.Value);
    if (evidence is null)
      return NotFound(new { error = "Evidence item not found" });

    var actor = User.Identity?.Name ?? "system";

    // Get previous hash for chain integrity
    var previousEvent = await _db.DossierCustodyEvents
        .AsNoTracking()
        .Where(c => c.EvidenceId == evidenceId)
        .OrderByDescending(c => c.Timestamp)
        .FirstOrDefaultAsync();

    var newHash = ComputeSha256(
        $"custody:{evidenceId:N}:{action}:{DateTime.UtcNow:O}:{previousEvent?.Hash ?? "genesis"}");

    var custodyEvent = new DossierCustodyEvent
    {
      EvidenceId = evidenceId,
      Action = action,
      Actor = actor,
      Hash = newHash,
      Notes = request.Notes?.Trim(),
      CountyId = countyId.Value,
    };

    _db.DossierCustodyEvents.Add(custodyEvent);

    // Update evidence integrity based on action
    if (action is "verified" or "hash-verified")
      evidence.Integrity = "verified";
    else if (action is "disputed")
      evidence.Integrity = "disputed";

    await _db.SaveChangesAsync();

    var chainLength = await _db.DossierCustodyEvents
        .AsNoTracking()
        .CountAsync(c => c.EvidenceId == evidenceId);

    _logger.LogInformation("Custody event '{Action}' added to evidence {EvidenceId}", action, evidenceId);

    return Ok(new
    {
      eventId = custodyEvent.Id,
      evidenceId,
      action = custodyEvent.Action,
      actor = custodyEvent.Actor,
      hash = custodyEvent.Hash,
      timestamp = custodyEvent.Timestamp,
      chainLength,
      integrity = evidence.Integrity,
      correlationId = GetOrCreateCorrelationId(),
    });
  }

  /// <summary>
  /// Get full custody chain for a persistent evidence item.
  /// </summary>
  [HttpGet("evidence/persistent/{id}/chain")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetPersistentCustodyChain(string id)
  {
    if (!Guid.TryParse(id, out var evidenceId))
      return BadRequest(new { error = "Invalid evidence id" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var evidence = await _db.DossierEvidenceItems
        .AsNoTracking()
        .FirstOrDefaultAsync(e => e.Id == evidenceId && e.CountyId == countyId.Value);
    if (evidence is null)
      return NotFound(new { error = "Evidence item not found" });

    var events = await _db.DossierCustodyEvents
        .AsNoTracking()
        .Where(c => c.EvidenceId == evidenceId)
        .OrderBy(c => c.Timestamp)
        .Select(c => new
        {
          id = c.Id,
          action = c.Action,
          actor = c.Actor,
          hash = c.Hash,
          notes = c.Notes,
          timestamp = c.Timestamp,
        })
        .ToListAsync();

    return Ok(new
    {
      evidenceId,
      title = evidence.Title,
      integrity = evidence.Integrity,
      chainLength = events.Count,
      events,
    });
  }

  // ── Packet Operations ────────────────────────────────────────

  public sealed record CreatePacketRequest(string ParcelId, string PacketType);

  /// <summary>
  /// Create an assessment packet from a template. Links matching documents and computes completeness.
  /// </summary>
  [HttpPost("packets")]
  [RequiresPermission("write:dossier")]
  public async Task<IActionResult> CreatePacket([FromBody] CreatePacketRequest? request)
  {
    if (request is null)
      return BadRequest(new { error = "Request body is required" });

    if (string.IsNullOrWhiteSpace(request.ParcelId) || !IsValidParcelId(request.ParcelId.Trim()))
      return BadRequest(new { error = "Invalid parcelId format" });

    if (string.IsNullOrWhiteSpace(request.PacketType))
      return BadRequest(new { error = "Packet type is required" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var parcelId = request.ParcelId.Trim();
    var packetType = request.PacketType.Trim();

    var template = BentonDocumentData.PacketTemplates
        .FirstOrDefault(t => t.PacketType.Equals(packetType, StringComparison.OrdinalIgnoreCase));
    if (template is null)
      return BadRequest(new { error = $"Unknown packet type: {packetType}" });

    var property = await _db.Properties
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    // Find matching persistent documents for this parcel
    var parcelDocuments = await _db.DossierDocuments
        .AsNoTracking()
        .Where(d => d.ParcelId == parcelId && d.CountyId == countyId.Value && d.Status != "archived")
        .ToListAsync();

    var actor = User.Identity?.Name ?? "system";
    var packet = new DossierPacket
    {
      ParcelId = parcelId,
      PacketType = template.PacketType,
      Name = $"{template.Name} - {parcelId}",
      CountyId = countyId.Value,
      CreatedBy = actor,
      TotalRequired = template.RequiredDocumentTypes.Length,
    };

    var satisfiedCount = 0;
    foreach (var requiredType in template.RequiredDocumentTypes)
    {
      var matchingDoc = parcelDocuments
          .FirstOrDefault(d => d.DocumentType.Equals(requiredType, StringComparison.OrdinalIgnoreCase));

      var satisfied = matchingDoc is not null;
      if (satisfied) satisfiedCount++;

      var item = new DossierPacketItem
      {
        PacketId = packet.Id,
        DocumentType = requiredType,
        DocumentId = matchingDoc?.Id,
        Required = true,
        Satisfied = satisfied,
        SatisfiedAt = satisfied ? matchingDoc!.UploadedAt : null,
      };

      packet.Items.Add(item);
    }

    packet.SatisfiedCount = satisfiedCount;
    packet.CompletenessPercent = packet.TotalRequired > 0
        ? Math.Round((double)satisfiedCount / packet.TotalRequired * 100, 1)
        : 0;

    if (packet.CompletenessPercent >= 100)
      packet.Status = "complete";

    _db.DossierPackets.Add(packet);
    await _db.SaveChangesAsync();

    _logger.LogInformation("Packet {PacketId} created for parcel {ParcelId} ({PacketType})", packet.Id, parcelId, packetType);

    return CreatedAtAction(nameof(GetPacket), new { id = packet.Id }, new
    {
      id = packet.Id,
      parcelId = packet.ParcelId,
      packetType = packet.PacketType,
      name = packet.Name,
      status = packet.Status,
      completeness = $"{packet.CompletenessPercent}%",
      satisfied = packet.SatisfiedCount,
      total = packet.TotalRequired,
      items = packet.Items.Select(i => new
      {
        documentType = i.DocumentType,
        required = i.Required,
        satisfied = i.Satisfied,
        documentId = i.DocumentId,
        satisfiedAt = i.SatisfiedAt,
      }),
      correlationId = GetOrCreateCorrelationId(),
    });
  }

  /// <summary>
  /// Get a persistent packet record with its items.
  /// </summary>
  [HttpGet("packets/{id}")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> GetPacket(string id)
  {
    if (!Guid.TryParse(id, out var packetId))
      return BadRequest(new { error = "Invalid packet id" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var packet = await _db.DossierPackets
        .AsNoTracking()
        .Include(p => p.Items)
        .FirstOrDefaultAsync(p => p.Id == packetId && p.CountyId == countyId.Value);
    if (packet is null)
      return NotFound(new { error = "Packet not found" });

    return Ok(new
    {
      id = packet.Id,
      parcelId = packet.ParcelId,
      packetType = packet.PacketType,
      name = packet.Name,
      status = packet.Status,
      completeness = $"{packet.CompletenessPercent}%",
      satisfied = packet.SatisfiedCount,
      total = packet.TotalRequired,
      createdBy = packet.CreatedBy,
      createdAt = packet.CreatedAt,
      updatedAt = packet.UpdatedAt,
      items = packet.Items.Select(i => new
      {
        id = i.Id,
        documentType = i.DocumentType,
        required = i.Required,
        satisfied = i.Satisfied,
        documentId = i.DocumentId,
        satisfiedAt = i.SatisfiedAt,
      }),
    });
  }

  /// <summary>
  /// List packets for a parcel (county-isolated).
  /// </summary>
  [HttpGet("parcels/{parcelId}/packets")]
  [RequiresPermission("read:dossier")]
  public async Task<IActionResult> ListParcelPackets(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var packets = await _db.DossierPackets
        .AsNoTracking()
        .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
        .OrderByDescending(p => p.CreatedAt)
        .Select(p => new
        {
          id = p.Id,
          packetType = p.PacketType,
          name = p.Name,
          status = p.Status,
          completeness = p.CompletenessPercent,
          satisfied = p.SatisfiedCount,
          total = p.TotalRequired,
          createdAt = p.CreatedAt,
        })
        .ToListAsync();

    return Ok(new
    {
      results = packets,
      total = packets.Count,
    });
  }

  // ── Read-only Dossier Registry Helpers ───────────────────────

  private sealed record DossierDocumentIndexItem(
      string Id,
      string Name,
      string Type,
      string ParcelId,
      string UploadedBy,
      DateTime UploadedAt,
      string Size,
      string Status,
      int CustodyChain,
      string? MimeType,
      string Hash);

  private sealed record DossierEvidenceIndexItem(
      string Id,
      string Title,
      string ParcelId,
      string EvidenceType,
      string CreatedBy,
      DateTime CreatedAt,
      string Integrity,
      int ChainLength,
      string LastAction);

  private sealed record ChainEventItem(DateTime Timestamp, string Actor, string Action, string Hash);

  private static string? NormalizeOptionalParcelId(string? parcelId)
  {
    if (string.IsNullOrWhiteSpace(parcelId))
      return null;

    var normalized = parcelId.Trim();
    return IsValidParcelId(normalized) ? normalized : null;
  }

  private static int NormalizeLimit(int? limit)
  {
    if (limit is null or <= 0)
      return 50;

    return Math.Min(limit.Value, 100);
  }

  private static int NormalizeOffset(int? offset)
  {
    return offset is > 0 ? offset.Value : 0;
  }

  private static string? NormalizeFilter(string? filter)
  {
    if (string.IsNullOrWhiteSpace(filter) || filter.Equals("all", StringComparison.OrdinalIgnoreCase))
      return null;

    return filter.Trim();
  }

  private async Task<List<DossierDocumentIndexItem>> BuildDocumentIndexAsync(Guid countyId)
  {
    var properties = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId)
        .Select(p => new
        {
          p.ParcelId,
          p.ParcelNumber,
          p.Address,
          p.AssessmentDate,
          p.LastUpdated,
          p.PropertyType,
          p.AssessedValue,
        })
        .ToListAsync();

    var notes = await _db.DossierNotes
        .AsNoTracking()
        .Where(n => n.CountyId == countyId)
        .Select(n => new
        {
          n.Id,
          n.ParcelId,
          n.NoteType,
          n.CreatedAt,
          n.CreatedBy,
          n.Content,
        })
        .ToListAsync();

    var documents = new List<DossierDocumentIndexItem>(properties.Count * 2 + notes.Count);

    foreach (var property in properties)
    {
      var casefileTimestamp = property.LastUpdated > property.AssessmentDate
          ? property.LastUpdated
          : property.AssessmentDate;

      documents.Add(new DossierDocumentIndexItem(
          Id: $"doc-casefile-{property.ParcelId.ToLowerInvariant()}",
          Name: $"Casefile summary - {property.ParcelId}",
          Type: "report",
          ParcelId: property.ParcelId,
          UploadedBy: "County Assessor",
          UploadedAt: casefileTimestamp,
          Size: "42 KB",
          Status: "active",
          CustodyChain: 3,
          MimeType: "application/pdf",
          Hash: ComputeSha256($"casefile:{property.ParcelId}:{casefileTimestamp:O}:{property.AssessedValue}")));

      documents.Add(new DossierDocumentIndexItem(
          Id: $"doc-valuation-{property.ParcelId.ToLowerInvariant()}",
          Name: $"Valuation worksheet - {property.ParcelId}",
          Type: "appraisal",
          ParcelId: property.ParcelId,
          UploadedBy: "CostForge",
          UploadedAt: property.AssessmentDate,
          Size: "28 KB",
          Status: "active",
          CustodyChain: 2,
          MimeType: "application/pdf",
          Hash: ComputeSha256($"valuation:{property.ParcelId}:{property.AssessmentDate:O}:{property.PropertyType}")));
    }

    foreach (var note in notes)
    {
      var noteTypeLabel = HumanizeToken(note.NoteType);
      var noteDocumentType = MapDocumentType(note.NoteType);
      var noteStatus = MapDocumentStatus(note.NoteType);
      var sizeKb = Math.Max(8, (int)Math.Ceiling(Math.Max(note.Content.Length, 64) / 32.0));

      documents.Add(new DossierDocumentIndexItem(
          Id: $"doc-note-{note.Id:N}",
          Name: $"{noteTypeLabel} - {note.ParcelId}",
          Type: noteDocumentType,
          ParcelId: note.ParcelId,
          UploadedBy: string.IsNullOrWhiteSpace(note.CreatedBy) ? "County Staff" : note.CreatedBy,
          UploadedAt: note.CreatedAt,
          Size: $"{sizeKb} KB",
          Status: noteStatus,
          CustodyChain: noteStatus.Equals("sealed", StringComparison.OrdinalIgnoreCase) ? 4 : 2,
          MimeType: "text/plain",
          Hash: ComputeSha256($"note-document:{note.Id:N}:{note.CreatedAt:O}:{note.Content}")));
    }

    // Include persistent documents (Wave 24)
    await AppendPersistentDocumentsAsync(countyId, documents);

    return documents
        .OrderByDescending(d => d.UploadedAt)
        .ThenBy(d => d.Name, StringComparer.OrdinalIgnoreCase)
        .ToList();
  }

  /// <summary>
  /// Append persistent DossierDocuments to the unified index alongside synthesized entries.
  /// </summary>
  private async System.Threading.Tasks.Task AppendPersistentDocumentsAsync(Guid countyId, List<DossierDocumentIndexItem> documents)
  {
    var persistent = await _db.DossierDocuments
        .AsNoTracking()
        .Where(d => d.CountyId == countyId)
        .Select(d => new
        {
          d.Id,
          d.ParcelId,
          d.Name,
          d.DocumentType,
          d.Status,
          d.MimeType,
          d.SizeBytes,
          d.ContentHash,
          d.UploadedBy,
          d.UploadedAt,
          d.EntersCustodyChain,
        })
        .ToListAsync();

    foreach (var doc in persistent)
    {
      var sizeLabel = doc.SizeBytes >= 1048576
          ? $"{doc.SizeBytes / 1048576} MB"
          : $"{Math.Max(1, doc.SizeBytes / 1024)} KB";

      documents.Add(new DossierDocumentIndexItem(
          Id: $"pdoc-{doc.Id:N}",
          Name: doc.Name,
          Type: doc.DocumentType,
          ParcelId: doc.ParcelId,
          UploadedBy: string.IsNullOrWhiteSpace(doc.UploadedBy) ? "County Staff" : doc.UploadedBy,
          UploadedAt: doc.UploadedAt,
          Size: sizeLabel,
          Status: doc.Status,
          CustodyChain: doc.EntersCustodyChain ? 1 : 0,
          MimeType: doc.MimeType,
          Hash: doc.ContentHash));
    }
  }

  private async Task<List<DossierEvidenceIndexItem>> BuildEvidenceIndexAsync(Guid countyId)
  {
    var properties = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId)
        .Select(p => new
        {
          p.ParcelId,
          p.AssessmentDate,
          p.LastUpdated,
        })
        .ToListAsync();

    var notes = await _db.DossierNotes
        .AsNoTracking()
        .Where(n => n.CountyId == countyId)
        .Select(n => new
        {
          n.Id,
          n.ParcelId,
          n.NoteType,
          n.CreatedAt,
          n.CreatedBy,
          n.Content,
        })
        .ToListAsync();

    var evidenceItems = new List<DossierEvidenceIndexItem>(properties.Count + notes.Count);

    foreach (var property in properties)
    {
      var snapshotTimestamp = property.LastUpdated > property.AssessmentDate
          ? property.LastUpdated
          : property.AssessmentDate;

      evidenceItems.Add(new DossierEvidenceIndexItem(
          Id: $"evid-snapshot-{property.ParcelId.ToLowerInvariant()}",
          Title: $"Parcel evidence snapshot - {property.ParcelId}",
          ParcelId: property.ParcelId,
          EvidenceType: "field-inspection",
          CreatedBy: "County Assessor",
          CreatedAt: snapshotTimestamp,
          Integrity: "verified",
          ChainLength: 3,
          LastAction: "hash-verified"));
    }

    foreach (var note in notes)
    {
      evidenceItems.Add(new DossierEvidenceIndexItem(
          Id: $"evid-note-{note.Id:N}",
          Title: $"{HumanizeToken(note.NoteType)} evidence - {note.ParcelId}",
          ParcelId: note.ParcelId,
          EvidenceType: MapEvidenceType(note.NoteType),
          CreatedBy: string.IsNullOrWhiteSpace(note.CreatedBy) ? "County Staff" : note.CreatedBy,
          CreatedAt: note.CreatedAt,
          Integrity: MapIntegrityStatus(note.NoteType, note.CreatedBy, note.Content),
          ChainLength: 2,
          LastAction: note.NoteType.Replace('_', '-').ToLowerInvariant()));
    }

    // Include persistent evidence items (Wave 24)
    var persistentEvidence = await _db.DossierEvidenceItems
        .AsNoTracking()
        .Where(e => e.CountyId == countyId)
        .Select(e => new { e.Id, e.ParcelId, e.Title, e.EvidenceType, e.CreatedBy, e.CreatedAt, e.Integrity })
        .ToListAsync();

    foreach (var pe in persistentEvidence)
    {
      var chainLen = await _db.DossierCustodyEvents
          .AsNoTracking()
          .CountAsync(c => c.EvidenceId == pe.Id);

      var lastEvt = await _db.DossierCustodyEvents
          .AsNoTracking()
          .Where(c => c.EvidenceId == pe.Id)
          .OrderByDescending(c => c.Timestamp)
          .Select(c => c.Action)
          .FirstOrDefaultAsync();

      evidenceItems.Add(new DossierEvidenceIndexItem(
          Id: $"pevid-{pe.Id:N}",
          Title: pe.Title,
          ParcelId: pe.ParcelId,
          EvidenceType: pe.EvidenceType,
          CreatedBy: string.IsNullOrWhiteSpace(pe.CreatedBy) ? "County Staff" : pe.CreatedBy,
          CreatedAt: pe.CreatedAt,
          Integrity: pe.Integrity,
          ChainLength: chainLen,
          LastAction: lastEvt ?? "created"));
    }

    return evidenceItems
        .OrderByDescending(e => e.CreatedAt)
        .ThenBy(e => e.Title, StringComparer.OrdinalIgnoreCase)
        .ToList();
  }

  private async Task<DossierDocumentIndexItem?> FindDocumentAsync(Guid countyId, string id)
  {
    var documents = await BuildDocumentIndexAsync(countyId);
    return documents.FirstOrDefault(d => d.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
  }

  private async Task<List<ChainEventItem>?> BuildChainOfCustody(Guid countyId, string evidenceId)
  {
    if (evidenceId.StartsWith("evid-snapshot-", StringComparison.OrdinalIgnoreCase))
    {
      var parcelId = evidenceId["evid-snapshot-".Length..];
      var property = await _db.Properties
          .AsNoTracking()
          .Where(p => p.CountyId == countyId && p.ParcelId.ToLower() == parcelId.ToLower())
          .Select(p => new
          {
            p.ParcelId,
            p.AssessmentDate,
            p.LastUpdated,
          })
          .FirstOrDefaultAsync();

      if (property is null)
        return null;

      var createdAt = property.LastUpdated > property.AssessmentDate
          ? property.LastUpdated
          : property.AssessmentDate;

      return
      [
          new ChainEventItem(
                    property.AssessmentDate,
                    "County Assessor",
                    "Captured parcel assessment snapshot",
                    ComputeSha256($"chain:snapshot:captured:{property.ParcelId}:{property.AssessmentDate:O}")),
                new ChainEventItem(
                    createdAt,
                    "TerraDossier",
                    "Generated evidence snapshot",
                    ComputeSha256($"chain:snapshot:generated:{property.ParcelId}:{createdAt:O}")),
                new ChainEventItem(
                    createdAt.AddMinutes(5),
                    "TerraTrace",
                    "Verified evidence hash",
                    ComputeSha256($"chain:snapshot:verified:{property.ParcelId}:{createdAt.AddMinutes(5):O}")),
            ];
    }

    if (!evidenceId.StartsWith("evid-note-", StringComparison.OrdinalIgnoreCase))
      return null;

    var suffix = evidenceId["evid-note-".Length..];
    if (!Guid.TryParseExact(suffix, "N", out var noteId))
      return null;

    var note = await _db.DossierNotes
        .AsNoTracking()
        .Where(n => n.CountyId == countyId && n.Id == noteId)
        .Select(n => new
        {
          n.Id,
          n.NoteType,
          n.CreatedAt,
          n.CreatedBy,
          n.Content,
        })
        .FirstOrDefaultAsync();

    if (note is null)
      return null;

    var author = string.IsNullOrWhiteSpace(note.CreatedBy) ? "County Staff" : note.CreatedBy;
    return
    [
        new ChainEventItem(
                note.CreatedAt,
                author,
                $"Recorded {HumanizeToken(note.NoteType)}",
                ComputeSha256($"chain:note:recorded:{note.Id:N}:{note.CreatedAt:O}:{note.Content}")),
            new ChainEventItem(
                note.CreatedAt.AddMinutes(2),
                "TerraDossier",
                "Linked note into parcel casefile",
                ComputeSha256($"chain:note:linked:{note.Id:N}:{note.CreatedAt.AddMinutes(2):O}")),
        ];
  }

  private static string MapDocumentType(string noteType)
  {
    var normalized = noteType.Trim().ToLowerInvariant();
    if (normalized.Contains("photo"))
      return "photo";
    if (normalized.Contains("appeal"))
      return "appeal";
    if (normalized.Contains("inspection"))
      return "report";
    if (normalized.Contains("appraisal") || normalized.Contains("valuation"))
      return "appraisal";
    if (normalized.Contains("correspondence") || normalized.Contains("letter"))
      return "correspondence";
    if (normalized.Contains("sketch"))
      return "sketch";

    return "report";
  }

  private static string MapDocumentStatus(string noteType)
  {
    var normalized = noteType.Trim().ToLowerInvariant();
    if (normalized.Contains("sealed"))
      return "sealed";
    if (normalized.Contains("archived"))
      return "archived";

    return "active";
  }

  private static string MapEvidenceType(string noteType)
  {
    var normalized = noteType.Trim().ToLowerInvariant();
    if (normalized.Contains("market") || normalized.Contains("sale"))
      return "market-data";
    if (normalized.Contains("inspection") || normalized.Contains("field"))
      return "field-inspection";
    if (normalized.Contains("cost") || normalized.Contains("appraisal") || normalized.Contains("valuation"))
      return "cost-analysis";
    if (normalized.Contains("income"))
      return "income-analysis";
    if (normalized.Contains("appeal"))
      return "appeal-evidence";

    return "regulatory";
  }

  private static string MapIntegrityStatus(string noteType, string createdBy, string content)
  {
    var normalized = noteType.Trim().ToLowerInvariant();
    if (normalized.Contains("dispute"))
      return "disputed";
    if (ClassifyAuthorKind(createdBy) == "system" || content.Length >= 64)
      return "verified";

    return "pending";
  }

  private static string HumanizeToken(string value)
  {
    if (string.IsNullOrWhiteSpace(value))
      return "Casefile";

    var words = value
        .Replace('-', ' ')
        .Replace('_', ' ')
        .Split(' ', StringSplitOptions.RemoveEmptyEntries)
        .Select(word => word.Length == 1
            ? char.ToUpperInvariant(word[0]).ToString()
            : $"{char.ToUpperInvariant(word[0])}{word[1..].ToLowerInvariant()}");

    return string.Join(' ', words);
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
}
