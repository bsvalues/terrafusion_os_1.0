using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Property Workbench — Tier-0 unified parcel hub for the OS Shell.
/// Aggregates data from all suites (Forge, Atlas, Dais, Dossier) into
/// the single parcel view at /property/:parcelId.
/// Read-only aggregation layer — each suite owns its write lane.
/// County isolation enforced on all queries.
/// </summary>
[ApiController]
[Route("api/workbench")]
[Authorize]
public class WorkbenchController : ControllerBase
{
  private readonly TerraFusionDbContext _db;
  private readonly ILogger<WorkbenchController> _logger;

  public WorkbenchController(TerraFusionDbContext db, ILogger<WorkbenchController> logger)
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

  // ════════════════════════════════════════════════════════════════════
  //  WAVE 23 — Property Workbench: Unified Parcel API
  //  Tier-0 hub that the OS Shell uses for /property/:parcelId views.
  //  Aggregates across all suite domains into a single response.
  // ════════════════════════════════════════════════════════════════════

  /// <summary>
  /// GET api/workbench/parcel/{parcelId}/summary — Unified parcel summary
  /// pulling data from every suite domain. This is the primary API for the
  /// Property Workbench Summary tab.
  /// </summary>
  [HttpGet("parcel/{parcelId}/summary")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelSummary(string parcelId)
  {
    parcelId = parcelId.Trim();
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
                    (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    // Valuations from Forge domain
    var latestValuation = await _db.Valuations
        .AsNoTracking()
        .Where(v => v.PropertyId == property.Id)
        .OrderByDescending(v => v.CreatedAt)
        .Select(v => new
        {
          v.EstimatedValue,
          v.Method,
          v.Confidence,
          v.CreatedAt,
        })
        .FirstOrDefaultAsync();

    // Notes from Dossier domain
    var noteCount = await _db.DossierNotes
        .Where(n => n.ParcelId == property.ParcelId && n.CountyId == countyId.Value)
        .CountAsync();

    // Assessment history from Forge domain
    var assessmentCount = await _db.PropertyAssessments
        .Where(a => a.PropertyId == property.Id)
        .CountAsync();

    Response.Headers["X-Workbench-Source"] = "unified-parcel-summary";
    return Ok(new
    {
      parcel = new
      {
        parcelId = property.ParcelId,
        parcelNumber = property.ParcelNumber,
        address = property.Address,
        ownerName = property.OwnerName,
        propertyType = property.PropertyType,
        yearBuilt = property.YearBuilt,
      },
      valuation = new
      {
        assessedValue = property.AssessedValue,
        landValue = property.LandValue,
        improvementValue = property.ImprovementValue,
        marketValue = property.MarketValue,
        taxYear = property.TaxYear,
        lastUpdated = property.LastUpdated.ToString("yyyy-MM-dd"),
      },
      forge = latestValuation is not null
          ? new
          {
            lastValuation = new
            {
              estimatedValue = latestValuation.EstimatedValue,
              method = latestValuation.Method,
              confidence = latestValuation.Confidence,
              date = latestValuation.CreatedAt.ToString("yyyy-MM-dd"),
            },
            totalAssessments = assessmentCount,
          }
          : (object)new
          {
            lastValuation = (object?)null,
            totalAssessments = assessmentCount,
          },
      dossier = new
      {
        noteCount,
        hasDocuments = noteCount > 0,
      },
      suites = new
      {
        forge = new { available = true, route = $"/property/{property.ParcelId}/forge" },
        atlas = new { available = true, route = $"/property/{property.ParcelId}/atlas" },
        dais = new { available = true, route = $"/property/{property.ParcelId}/dais" },
        dossier = new { available = true, route = $"/property/{property.ParcelId}/dossier" },
        pilot = new { available = true, route = $"/property/{property.ParcelId}/pilot" },
      },
      source = "Property Workbench — Unified Parcel Summary",
    });
  }

  /// <summary>
  /// GET api/workbench/parcel/{parcelId}/badges — Suite badge data for the
  /// Property Workbench Context Ribbon. Each suite contributes status badges.
  /// </summary>
  [HttpGet("parcel/{parcelId}/badges")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelBadges(string parcelId)
  {
    parcelId = parcelId.Trim();
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
                    (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
        .Select(p => new { p.Id, p.ParcelId, p.AssessedValue, p.MarketValue, p.TaxYear })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    // Forge badge: valuation status
    var hasRecentValuation = await _db.Valuations
        .AnyAsync(v => v.PropertyId == property.Id && v.CreatedAt >= DateTime.UtcNow.AddYears(-1));

    // Dossier badge: document count
    var docCount = await _db.DossierNotes
        .Where(n => n.ParcelId == property.ParcelId && n.CountyId == countyId.Value)
        .CountAsync();

    // Assessment badge: assessment count
    var assessCount = await _db.PropertyAssessments
        .Where(a => a.PropertyId == property.Id)
        .CountAsync();

    Response.Headers["X-Workbench-Source"] = "parcel-badge-provider";
    return Ok(new
    {
      parcelId = property.ParcelId,
      badges = new object[]
      {
        new
        {
          suite = "forge",
          label = hasRecentValuation ? "Valued" : "Needs Review",
          variant = hasRecentValuation ? "success" : "warning",
          tooltip = hasRecentValuation
              ? $"Current valuation on file (TY{property.TaxYear})"
              : "No recent valuation — review recommended",
        },
        new
        {
          suite = "atlas",
          label = "Mapped",
          variant = "info",
          tooltip = "Parcel geometry available in GIS layer",
        },
        new
        {
          suite = "dais",
          label = "Active",
          variant = "info",
          tooltip = "Assessor workflow tracking enabled",
        },
        new
        {
          suite = "dossier",
          label = docCount > 0 ? $"{docCount} Docs" : "No Docs",
          variant = docCount > 0 ? "success" : "neutral",
          tooltip = docCount > 0
              ? $"{docCount} document(s) on file"
              : "No documents attached to this parcel",
        },
      },
      source = "Property Workbench — Badge Provider API",
    });
  }

  /// <summary>
  /// GET api/workbench/parcel/{parcelId}/timeline — Cross-suite activity timeline
  /// showing recent events from all suites for a parcel.
  /// </summary>
  [HttpGet("parcel/{parcelId}/timeline")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelTimeline(string parcelId)
  {
    parcelId = parcelId.Trim();
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
                    (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
        .Select(p => new { p.Id, p.ParcelId, p.CreatedAt })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    var events = new List<object>();

    // Property creation event
    if (property.CreatedAt != default)
    {
      events.Add(new
      {
        date = property.CreatedAt.ToString("yyyy-MM-dd"),
        suite = "os",
        type = "parcel-created",
        description = "Parcel record created in system",
      });
    }

    // Valuation events from Forge
    var valuations = await _db.Valuations
        .AsNoTracking()
        .Where(v => v.PropertyId == property.Id)
        .OrderByDescending(v => v.CreatedAt)
        .Take(5)
        .Select(v => new { v.EstimatedValue, v.Method, v.CreatedAt })
        .ToListAsync();

    foreach (var v in valuations)
    {
      events.Add(new
      {
        date = v.CreatedAt.ToString("yyyy-MM-dd"),
        suite = "forge",
        type = "valuation",
        description = $"Valuation: {v.EstimatedValue:C0} ({v.Method ?? "unknown method"})",
      });
    }

    // Assessment events
    var assessments = await _db.PropertyAssessments
        .AsNoTracking()
        .Where(a => a.PropertyId == property.Id)
        .OrderByDescending(a => a.AssessmentDate)
        .Take(5)
        .Select(a => new { a.AssessmentDate, a.AssessedValue, a.AssessmentYear })
        .ToListAsync();

    foreach (var a in assessments)
    {
      events.Add(new
      {
        date = a.AssessmentDate.ToString("yyyy-MM-dd"),
        suite = "forge",
        type = "assessment",
        description = $"AY{a.AssessmentYear} assessment: {a.AssessedValue:C0}",
      });
    }

    // Dossier note events
    var notes = await _db.DossierNotes
        .AsNoTracking()
        .Where(n => n.ParcelId == property.ParcelId && n.CountyId == countyId.Value)
        .OrderByDescending(n => n.CreatedAt)
        .Take(10)
        .Select(n => new { n.CreatedAt, n.NoteType })
        .ToListAsync();

    foreach (var n in notes)
    {
      events.Add(new
      {
        date = n.CreatedAt.ToString("yyyy-MM-dd"),
        suite = "dossier",
        type = "note",
        description = $"Dossier note ({n.NoteType})",
      });
    }

    // Sort all events by date descending
    var sortedEvents = events
        .OrderByDescending(e => ((dynamic)e).date)
        .Take(25)
        .ToArray();

    Response.Headers["X-Workbench-Source"] = "parcel-timeline";
    return Ok(new
    {
      parcelId = property.ParcelId,
      totalEvents = sortedEvents.Length,
      events = sortedEvents,
      source = "Property Workbench — Cross-Suite Activity Timeline",
    });
  }

  /// <summary>
  /// GET api/workbench/parcel/{parcelId}/compass — Suite Compass navigation data.
  /// Returns available suite tabs with status indicators for the left-rail nav.
  /// </summary>
  [HttpGet("parcel/{parcelId}/compass")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetSuiteCompass(string parcelId)
  {
    parcelId = parcelId.Trim();
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
                    (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
        .Select(p => new { p.Id, p.ParcelId })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    var hasValuation = await _db.Valuations
        .AnyAsync(v => v.PropertyId == property.Id);
    var noteCount = await _db.DossierNotes
        .Where(n => n.ParcelId == property.ParcelId && n.CountyId == countyId.Value)
        .CountAsync();

    Response.Headers["X-Workbench-Source"] = "suite-compass";
    return Ok(new
    {
      parcelId = property.ParcelId,
      tabs = new object[]
      {
        new
        {
          id = "summary",
          label = "Summary",
          icon = "home",
          route = $"/property/{property.ParcelId}",
          status = "active",
          dataAvailable = true,
        },
        new
        {
          id = "forge",
          label = "TerraForge",
          icon = "calculator",
          route = $"/property/{property.ParcelId}/forge",
          status = hasValuation ? "data-available" : "empty",
          dataAvailable = hasValuation,
        },
        new
        {
          id = "atlas",
          label = "TerraAtlas",
          icon = "map",
          route = $"/property/{property.ParcelId}/atlas",
          status = "data-available",
          dataAvailable = true,
        },
        new
        {
          id = "dais",
          label = "TerraDais",
          icon = "clipboard",
          route = $"/property/{property.ParcelId}/dais",
          status = "active",
          dataAvailable = true,
        },
        new
        {
          id = "dossier",
          label = "TerraDossier",
          icon = "folder",
          route = $"/property/{property.ParcelId}/dossier",
          status = noteCount > 0 ? "data-available" : "empty",
          dataAvailable = noteCount > 0,
        },
        new
        {
          id = "pilot",
          label = "TerraPilot",
          icon = "bot",
          route = $"/property/{property.ParcelId}/pilot",
          status = "active",
          dataAvailable = true,
        },
      },
      workModes = WorkbenchData.WorkModes,
      source = "Property Workbench — Suite Compass Navigation",
    });
  }

  /// <summary>
  /// GET api/workbench/search — Cross-suite parcel search.
  /// Searches by parcel ID, address, or owner name. County-isolated.
  /// </summary>
  [HttpGet("search")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> SearchParcels(
      [FromQuery] string q,
      [FromQuery] int limit = 20)
  {
    if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
      return BadRequest(new { error = "Search query must be at least 2 characters" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    q = q.Trim();
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    var results = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
            (p.ParcelId.Contains(q) ||
             p.ParcelNumber.Contains(q) ||
             p.Address.Contains(q) ||
             (p.OwnerName != null && p.OwnerName.Contains(q))))
        .OrderBy(p => p.ParcelId)
        .Take(limit)
        .Select(p => new
        {
          p.ParcelId,
          p.ParcelNumber,
          p.Address,
          p.OwnerName,
          p.PropertyType,
          p.AssessedValue,
          route = "/property/" + p.ParcelId,
        })
        .ToListAsync();

    Response.Headers["X-Workbench-Source"] = "parcel-search";
    return Ok(new
    {
      query = q,
      count = results.Count,
      limit,
      results,
      source = "Property Workbench — Cross-Suite Parcel Search",
    });
  }

  /// <summary>
  /// GET api/workbench/suite-registry — Returns the canonical suite registry
  /// with metadata for OS Shell rendering (icons, routes, status, descriptions).
  /// </summary>
  [HttpGet("suite-registry")]
  [AllowAnonymous]
  public IActionResult GetSuiteRegistry()
  {
    Response.Headers["X-Workbench-Source"] = "suite-registry";
    return Ok(new
    {
      suites = WorkbenchData.Suites,
      totalSuites = WorkbenchData.Suites.Length,
      version = "1.0",
      source = "Property Workbench — Canonical Suite Registry",
    });
  }

  /// <summary>
  /// GET api/workbench/work-modes — Available work modes for the Property Workbench.
  /// Controls UI layout and suite emphasis in the workbench.
  /// </summary>
  [HttpGet("work-modes")]
  [AllowAnonymous]
  public IActionResult GetWorkModes()
  {
    Response.Headers["X-Workbench-Source"] = "work-modes";
    return Ok(new
    {
      modes = WorkbenchData.WorkModes,
      totalModes = WorkbenchData.WorkModes.Length,
      source = "Property Workbench — Work Mode Configuration",
    });
  }

  /// <summary>
  /// GET api/workbench/parcel/{parcelId}/valuation-history — Valuation history
  /// for the Forge tab time-series chart. Returns all assessments and valuations.
  /// </summary>
  [HttpGet("parcel/{parcelId}/valuation-history")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetValuationHistory(string parcelId)
  {
    parcelId = parcelId.Trim();
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value &&
                    (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
        .Select(p => new { p.Id, p.ParcelId, p.AssessedValue, p.TaxYear })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = $"Parcel '{parcelId}' not found in your county." });

    var assessments = await _db.PropertyAssessments
        .AsNoTracking()
        .Where(a => a.PropertyId == property.Id)
        .OrderBy(a => a.AssessmentDate)
        .Select(a => new
        {
          date = a.AssessmentDate.ToString("yyyy-MM-dd"),
          assessedValue = a.AssessedValue,
          landValue = a.LandValue,
          improvementValue = a.ImprovementValue,
          assessmentYear = a.AssessmentYear,
          source = "assessment",
        })
        .ToListAsync();

    var valuations = await _db.Valuations
        .AsNoTracking()
        .Where(v => v.PropertyId == property.Id)
        .OrderBy(v => v.CreatedAt)
        .Select(v => new
        {
          date = v.CreatedAt.ToString("yyyy-MM-dd"),
          estimatedValue = v.EstimatedValue,
          method = v.Method,
          confidence = v.Confidence,
          source = "valuation",
        })
        .ToListAsync();

    Response.Headers["X-Workbench-Source"] = "valuation-history";
    return Ok(new
    {
      parcelId = property.ParcelId,
      currentValue = property.AssessedValue,
      currentTaxYear = property.TaxYear,
      assessments,
      valuations,
      totalRecords = assessments.Count + valuations.Count,
      source = "Property Workbench — Valuation History",
    });
  }

  // ── Workbench Static Data ─────────────────────────────────────────

  internal static class WorkbenchData
  {
    internal static readonly object[] Suites =
    [
      new
      {
        id = "forge",
        name = "TerraForge",
        mission = "Build value",
        description = "Valuation models, comps, CAMA — cost, income, and sales comparison approaches",
        icon = "calculator",
        route = "/forge",
        status = "active",
      },
      new
      {
        id = "atlas",
        name = "TerraAtlas",
        mission = "See the county",
        description = "GIS, maps, spatial analysis — parcel geometry, layers, annotations",
        icon = "map",
        route = "/atlas",
        status = "active",
      },
      new
      {
        id = "dais",
        name = "TerraDais",
        mission = "Operate value",
        description = "Workflows, admin — permits, exemptions, appeals, notices, certification, queues",
        icon = "clipboard",
        route = "/dais",
        status = "active",
      },
      new
      {
        id = "dossier",
        name = "TerraDossier",
        mission = "Prove the decision",
        description = "Evidence, packets — documents, narratives, evidence chain, retention",
        icon = "folder",
        route = "/dossier",
        status = "active",
      },
      new
      {
        id = "gpt",
        name = "TerraGPT",
        mission = "Augment every role",
        description = "AI assistant — GPT configs, RAG datasets, conversations",
        icon = "sparkles",
        route = "/gpt",
        status = "active",
      },
    ];

    internal static readonly object[] WorkModes =
    [
      new
      {
        id = "overview",
        label = "Overview",
        description = "Balanced view across all suites — default landing mode",
        primarySuites = new[] { "summary" },
        icon = "layout-dashboard",
      },
      new
      {
        id = "valuation",
        label = "Valuation",
        description = "Focused on TerraForge — cost/income/sales approaches, comps, adjustments",
        primarySuites = new[] { "forge", "atlas" },
        icon = "calculator",
      },
      new
      {
        id = "mapping",
        label = "Mapping",
        description = "Focused on TerraAtlas — GIS layers, spatial analysis, annotations",
        primarySuites = new[] { "atlas" },
        icon = "map",
      },
      new
      {
        id = "admin",
        label = "Administration",
        description = "Focused on TerraDais — permits, exemptions, appeals, workflows",
        primarySuites = new[] { "dais" },
        icon = "clipboard",
      },
      new
      {
        id = "case",
        label = "Case File",
        description = "Focused on TerraDossier — documents, evidence chain, packet assembly",
        primarySuites = new[] { "dossier" },
        icon = "folder",
      },
    ];
  }
}
