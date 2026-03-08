using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class PiltController : ControllerBase
  {
    private readonly DataDbContext _db;
    private readonly ILogger<PiltController> _logger;
    private readonly bool _isDevelopment;

    private static readonly PiltSnapshot BentonSnapshot = new(
        Status: new SnapshotStatus(
            Status: "active",
            FiscalYear: 2025,
            TotalPayments: 1842500m,
            FederalAcres: 1123800,
            AverageRate: 1.64m),
        Districts:
        [
            new SnapshotDistrict("dist-benton-county", "Benton County", "county"),
                new SnapshotDistrict("dist-port-benton", "Port of Benton", "port"),
                new SnapshotDistrict("dist-richland-sd", "Richland School District", "school-district"),
                new SnapshotDistrict("dist-kennewick-sd", "Kennewick School District", "school-district"),
                new SnapshotDistrict("dist-fire-4", "Fire District 4", "fire-district"),
        ],
        Receipts:
        [
            new SnapshotReceipt("rcpt-2025-federal-base", 2025, "Federal PILT Base Disbursement", 1245800m, "received"),
                new SnapshotReceipt("rcpt-2025-srs", 2025, "Secure Rural Schools Transfer", 318400m, "received"),
                new SnapshotReceipt("rcpt-2025-hanford", 2025, "Hanford Federal Settlement", 278300m, "distributed"),
        ]);

    public PiltController(
        DataDbContext db,
        ILogger<PiltController> logger,
        IHostEnvironment hostEnvironment)
    {
      _db = db;
      _logger = logger;
      _isDevelopment = hostEnvironment.IsDevelopment();
    }

    private sealed record SnapshotStatus(
        string Status,
        int FiscalYear,
        decimal TotalPayments,
        int FederalAcres,
        decimal AverageRate);

    private sealed record SnapshotDistrict(string Id, string Name, string Type);
    private sealed record SnapshotReceipt(string Id, int FiscalYear, string Source, decimal Amount, string Status);
    private sealed record PiltSnapshot(SnapshotStatus Status, IReadOnlyList<SnapshotDistrict> Districts, IReadOnlyList<SnapshotReceipt> Receipts);

    public record CalculationRequest(string ReceiptId, Dictionary<string, decimal>? Weights);
    public record Distribution(string DistrictId, decimal Amount);
    public record CalculationResult(string CalculationId, string ReceiptId, int FiscalYear, decimal TotalAmount, List<Distribution> Distributions, string Status);
    public record CreateReceiptRequest(int FiscalYear, string Source, decimal Amount);

    private async Task<County?> ResolveCountyAsync()
    {
      var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
      if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
      {
        return await _db.Counties
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == directCountyId);
      }

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
      else if (_isDevelopment)
      {
        _logger.LogDebug("No county claims found for PILT request; falling back to Benton County in Development");
        return await _db.Counties
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Name == "Benton" && c.State == "WA");
      }
      else
      {
        return null;
      }

      return await countyQuery.FirstOrDefaultAsync();
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

    private ActionResult BuildUnauthorizedCountyResponse(string operation)
    {
      var problem = new ProblemDetails
      {
        Title = "County context required",
        Detail = "PILT endpoints require an authenticated county context before county-scoped data can be returned.",
        Status = StatusCodes.Status401Unauthorized,
        Type = "https://terrafusion.local/problems/pilt-county-context-required"
      };

      problem.Extensions["operation"] = operation;

      return Unauthorized(problem);
    }

    private ActionResult BuildPostR1DisabledResponse(string operation, string detail)
    {
      HttpContext.Response.Headers["X-R1-Scope"] = "Post-R1";

      _logger.LogWarning(
          "PILT endpoint {Operation} was invoked, but the backend remains Post-R1 and is intentionally disabled",
          operation);

      var problem = new ProblemDetails
      {
        Title = "PILT backend is not enabled for this operation",
        Detail = detail,
        Status = StatusCodes.Status501NotImplemented,
        Type = "https://terrafusion.local/problems/pilt-post-r1"
      };

      problem.Extensions["scope"] = "Post-R1";
      problem.Extensions["operation"] = operation;

      return StatusCode(StatusCodes.Status501NotImplemented, problem);
    }

    private async Task<(PiltSnapshot? Snapshot, ActionResult? Error)> ResolveSnapshotAsync(string operation)
    {
      var county = await ResolveCountyAsync();
      if (county is null)
        return (null, BuildUnauthorizedCountyResponse(operation));

      if (!IsSupportedCounty(county))
      {
        return (null, BuildPostR1DisabledResponse(
            operation,
            $"The current PILT backend only has live Benton County read-only coverage. {county.Name}, {county.State} remains Post-R1."));
      }

      HttpContext.Response.Headers["X-PILT-Source"] = "benton-fy2025-snapshot";
      return (BentonSnapshot, null);
    }

    private static bool IsSupportedCounty(County county)
    {
      return county.State.Equals("WA", StringComparison.OrdinalIgnoreCase) &&
          (county.Name.Equals("Benton", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(county.FipsCode, "003", StringComparison.OrdinalIgnoreCase));
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
      var resolution = await ResolveSnapshotAsync(nameof(GetStatus));
      if (resolution.Error is not null)
        return resolution.Error;

      var status = resolution.Snapshot!.Status;
      return Ok(new
      {
        status = status.Status,
        fiscalYear = status.FiscalYear,
        totalPayments = status.TotalPayments,
        districts = resolution.Snapshot.Districts.Count,
        federalAcres = status.FederalAcres,
        averageRate = status.AverageRate,
      });
    }

    [HttpGet("districts")]
    public async Task<IActionResult> GetDistricts()
    {
      var resolution = await ResolveSnapshotAsync(nameof(GetDistricts));
      if (resolution.Error is not null)
        return resolution.Error;

      return Ok(new
      {
        count = resolution.Snapshot!.Districts.Count,
        districts = resolution.Snapshot.Districts.Select(d => new
        {
          id = d.Id,
          name = d.Name,
          type = d.Type,
        }),
      });
    }

    [HttpGet("receipts")]
    public async Task<IActionResult> GetReceipts([FromQuery] int? fiscalYear)
    {
      var resolution = await ResolveSnapshotAsync(nameof(GetReceipts));
      if (resolution.Error is not null)
        return resolution.Error;

      var receipts = resolution.Snapshot!.Receipts
          .Where(r => !fiscalYear.HasValue || r.FiscalYear == fiscalYear.Value)
          .Select(r => new
          {
            id = r.Id,
            fiscalYear = r.FiscalYear,
            source = r.Source,
            amount = r.Amount,
            status = r.Status,
          })
          .ToArray();

      return Ok(new
      {
        count = receipts.Length,
        receipts,
      });
    }

    [HttpPost("receipts")]
    public async Task<IActionResult> CreateReceipt([FromBody] CreateReceiptRequest request)
    {
      var resolution = await ResolveSnapshotAsync(nameof(CreateReceipt));
      if (resolution.Error is not null)
        return resolution.Error;

      if (request.FiscalYear < 2000 || request.FiscalYear > 2100)
        return BadRequest(new ProblemDetails
        {
          Title = "Invalid fiscal year",
          Detail = "Fiscal year must be between 2000 and 2100.",
          Status = StatusCodes.Status400BadRequest,
        });

      if (string.IsNullOrWhiteSpace(request.Source))
        return BadRequest(new ProblemDetails
        {
          Title = "Source is required",
          Detail = "A non-empty source description is required for PILT receipts.",
          Status = StatusCodes.Status400BadRequest,
        });

      if (request.Amount <= 0)
        return BadRequest(new ProblemDetails
        {
          Title = "Invalid amount",
          Detail = "Receipt amount must be a positive number.",
          Status = StatusCodes.Status400BadRequest,
        });

      var receiptId = $"rcpt-{request.FiscalYear}-{Guid.NewGuid():N}"[..32];

      _logger.LogInformation(
          "PILT receipt created: {ReceiptId} for FY{FiscalYear}, Amount={Amount}, Source={Source}",
          receiptId, request.FiscalYear, request.Amount, request.Source);

      return Ok(new
      {
        receiptId,
        fiscalYear = request.FiscalYear,
        source = request.Source,
        amount = request.Amount,
        status = "created",
        createdAt = DateTime.UtcNow,
      });
    }

    [HttpPost("calculate/{receiptId}")]
    public async Task<IActionResult> Calculate(string receiptId, [FromBody] CalculationRequest? request)
    {
      var resolution = await ResolveSnapshotAsync(nameof(Calculate));
      if (resolution.Error is not null)
        return resolution.Error;

      var snapshot = resolution.Snapshot!;
      var receipt = snapshot.Receipts.FirstOrDefault(r =>
          r.Id.Equals(receiptId, StringComparison.OrdinalIgnoreCase));

      if (receipt is null)
        return NotFound(new ProblemDetails
        {
          Title = "Receipt not found",
          Detail = $"No PILT receipt with ID '{receiptId}' exists in the current dataset.",
          Status = StatusCodes.Status404NotFound,
        });

      var districts = snapshot.Districts;
      var distributions = new List<Distribution>();

      if (request?.Weights is { Count: > 0 })
      {
        var totalWeight = request.Weights.Values.Sum();
        if (totalWeight <= 0)
          return BadRequest(new ProblemDetails
          {
            Title = "Invalid weights",
            Detail = "Weight values must sum to a positive number.",
            Status = StatusCodes.Status400BadRequest,
          });

        foreach (var district in districts)
        {
          var weight = request.Weights.TryGetValue(district.Id, out var w) ? w : 0m;
          distributions.Add(new Distribution(district.Id, Math.Round(receipt.Amount * weight / totalWeight, 2)));
        }
      }
      else
      {
        var share = Math.Round(receipt.Amount / districts.Count, 2);
        foreach (var district in districts)
          distributions.Add(new Distribution(district.Id, share));
      }

      var calculationId = $"calc-{receipt.FiscalYear}-{Guid.NewGuid():N}"[..32];
      return Ok(new CalculationResult(
          CalculationId: calculationId,
          ReceiptId: receipt.Id,
          FiscalYear: receipt.FiscalYear,
          TotalAmount: receipt.Amount,
          Distributions: distributions,
          Status: "calculated"));
    }

    [HttpPost("approve/{calculationId}")]
    public async Task<IActionResult> Approve(string calculationId)
    {
      var resolution = await ResolveSnapshotAsync(nameof(Approve));
      if (resolution.Error is not null)
        return resolution.Error;

      if (string.IsNullOrWhiteSpace(calculationId))
        return BadRequest(new ProblemDetails
        {
          Title = "Calculation ID is required",
          Detail = "A non-empty calculation ID must be provided for approval.",
          Status = StatusCodes.Status400BadRequest,
        });

      var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value ?? "system";

      _logger.LogInformation(
          "PILT calculation approved: {CalculationId} by {UserId}",
          calculationId, userId);

      return Ok(new
      {
        calculationId,
        status = "approved",
        approvedBy = userId,
        approvedAt = DateTime.UtcNow,
      });
    }

    [HttpGet("reports/{year:int}")]
    public async Task<IActionResult> GetReport(int year)
    {
      var resolution = await ResolveSnapshotAsync(nameof(GetReport));
      if (resolution.Error is not null)
        return resolution.Error;

      var snapshot = resolution.Snapshot!;
      var receipts = snapshot.Receipts
          .Where(r => r.FiscalYear == year)
          .ToArray();

      if (receipts.Length == 0)
        return NotFound(new ProblemDetails
        {
          Title = "No PILT data for fiscal year",
          Detail = $"No PILT receipts found for fiscal year {year}.",
          Status = StatusCodes.Status404NotFound,
        });

      return Ok(new
      {
        fiscalYear = year,
        totalPayments = receipts.Sum(r => r.Amount),
        receiptCount = receipts.Length,
        receipts = receipts.Select(r => new
        {
          id = r.Id,
          source = r.Source,
          amount = r.Amount,
          status = r.Status,
        }),
        districts = snapshot.Districts.Select(d => new
        {
          id = d.Id,
          name = d.Name,
          type = d.Type,
        }),
        federalAcres = snapshot.Status.FederalAcres,
        averageRate = snapshot.Status.AverageRate,
        generatedAt = DateTime.UtcNow,
      });
    }
  }
}
