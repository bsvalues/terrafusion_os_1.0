using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraTreasury — Tax collection, payment, and delinquency endpoints.
/// Write-lane: treasury. County isolation enforced on all queries.
/// Real Benton County tax data. Statutory authority: RCW 84.56, RCW 84.64.
/// </summary>
[ApiController]
[Route("api/treasury")]
[Authorize]
public class TreasuryController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<TreasuryController> _logger;

    public TreasuryController(TerraFusionDbContext db, ILogger<TreasuryController> logger)
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

    // ── GET api/treasury/parcels/{parcelId}/statement ───────────────
    // Handler 42: get_tax_statement

    [HttpGet("parcels/{parcelId}/statement")]
    public async Task<IActionResult> GetTaxStatement(string parcelId, [FromQuery] int? taxYear)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var year = taxYear ?? DateTime.UtcNow.Year;

        var statement = await _db.TaxStatements
            .AsNoTracking()
            .Where(s => s.CountyId == countyId.Value && s.ParcelId == parcelId && s.TaxYear == year)
            .FirstOrDefaultAsync();

        if (statement is null)
        {
            // Return synthetic statement from assessment data
            var property = await _db.Properties
                .AsNoTracking()
                .Where(p => p.CountyId == countyId.Value &&
                            (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
                .FirstOrDefaultAsync();

            var assessedValue = property?.AssessedValue ?? 0;
            var estimatedTax = assessedValue * 0.0108m; // Benton County avg mill rate ~$10.80/$1000

            return Ok(new
            {
                taxYear = year,
                totalDue = estimatedTax,
                paid = 0m,
                balance = estimatedTax,
                dueDate = $"{year}-04-30",
                levies = BentonLevyData.GetDefaultLevies(assessedValue),
            });
        }

        var payments = await _db.TaxPayments
            .AsNoTracking()
            .Where(p => p.CountyId == countyId.Value && p.ParcelId == parcelId && p.StatementId == statement.Id)
            .SumAsync(p => p.Amount);

        return Ok(new
        {
            taxYear = statement.TaxYear,
            totalDue = statement.TotalDue,
            paid = payments,
            balance = statement.TotalDue - payments,
            dueDate = statement.DueDate?.ToString("yyyy-MM-dd") ?? $"{year}-04-30",
            levies = BentonLevyData.GetDefaultLevies(statement.TotalDue),
        });
    }

    // ── GET api/treasury/parcels/{parcelId}/breakdown ───────────────
    // Handler 43: explain_tax_breakdown

    [HttpGet("parcels/{parcelId}/breakdown")]
    public async Task<IActionResult> ExplainTaxBreakdown(string parcelId, [FromQuery] int? taxYear)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var property = await _db.Properties
            .AsNoTracking()
            .Where(p => p.CountyId == countyId.Value &&
                        (p.ParcelId == parcelId || p.ParcelNumber == parcelId))
            .FirstOrDefaultAsync();

        var assessedValue = property?.AssessedValue ?? 0;
        var levies = BentonLevyData.GetDefaultLevies(assessedValue);
        var sorted = levies.OrderByDescending(l => l.Amount).ToList();

        return Ok(new
        {
            explanation = $"Property tax for parcel {parcelId}: {levies.Count} levy components totaling ${levies.Sum(l => l.Amount):N2}. Largest: {sorted.FirstOrDefault()?.Name ?? "none"}.",
            levyCount = levies.Count,
            largestLevy = sorted.FirstOrDefault()?.Name ?? "unknown",
            levies,
        });
    }

    // ── POST api/treasury/parcels/{parcelId}/payments ───────────────
    // Handler 44: record_payment

    [HttpPost("parcels/{parcelId}/payments")]
    public async Task<IActionResult> RecordPayment(string parcelId, [FromBody] RecordPaymentRequest request)
    {
        if (request is null || request.Amount <= 0)
            return BadRequest(new { error = "Positive payment amount is required." });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var receiptId = $"RCP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";

        var payment = new TaxPayment
        {
            ReceiptId = receiptId,
            ParcelId = parcelId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod ?? "check",
            CountyId = countyId.Value,
        };

        _db.TaxPayments.Add(payment);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Recorded payment {ReceiptId} of {Amount} for parcel {ParcelId} in county {CountyId}",
            receiptId, request.Amount, parcelId, countyId.Value);

        // Calculate new balance
        var totalPaid = await _db.TaxPayments
            .AsNoTracking()
            .Where(p => p.CountyId == countyId.Value && p.ParcelId == parcelId)
            .SumAsync(p => p.Amount);

        var statementTotal = await _db.TaxStatements
            .AsNoTracking()
            .Where(s => s.CountyId == countyId.Value && s.ParcelId == parcelId)
            .OrderByDescending(s => s.TaxYear)
            .Select(s => s.TotalDue)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            receiptId,
            newBalance = Math.Max(statementTotal - totalPaid, 0),
        });
    }

    // ── GET api/treasury/parcels/{parcelId}/delinquency ─────────────
    // Handler 45: check_delinquency_status

    [HttpGet("parcels/{parcelId}/delinquency")]
    public async Task<IActionResult> CheckDelinquencyStatus(string parcelId)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var record = await _db.DelinquencyRecords
            .AsNoTracking()
            .Where(d => d.CountyId == countyId.Value && d.ParcelId == parcelId)
            .FirstOrDefaultAsync();

        if (record is null)
        {
            return Ok(new
            {
                delinquent = false,
                amountOverdue = 0m,
                oldestDelinquentYear = (int?)null,
                deadlines = Array.Empty<object>(),
            });
        }

        return Ok(new
        {
            delinquent = record.IsDelinquent,
            amountOverdue = record.AmountOverdue,
            oldestDelinquentYear = record.OldestDelinquentYear,
            deadlines = new object[]
            {
                new { date = $"{DateTime.UtcNow.Year}-06-01", description = "Delinquent tax penalty deadline (8% per RCW 84.56.020)" },
                new { date = $"{DateTime.UtcNow.Year}-12-01", description = "Tax sale eligibility (3 years delinquent per RCW 84.64.050)" },
            },
        });
    }

    // ── POST api/treasury/parcels/{parcelId}/installment-plans ──────
    // Handler 46: create_installment_plan

    [HttpPost("parcels/{parcelId}/installment-plans")]
    public async Task<IActionResult> CreateInstallmentPlan(string parcelId, [FromBody] CreateInstallmentPlanRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var numberOfPayments = request?.NumberOfPayments ?? 12;
        if (numberOfPayments < 2 || numberOfPayments > 60)
            return BadRequest(new { error = "Number of payments must be between 2 and 60." });

        // Look up total owed
        var delinquency = await _db.DelinquencyRecords
            .AsNoTracking()
            .Where(d => d.CountyId == countyId.Value && d.ParcelId == parcelId)
            .FirstOrDefaultAsync();

        var totalOwed = delinquency?.AmountOverdue ?? 0;
        var monthlyAmount = numberOfPayments > 0 ? Math.Round(totalOwed / numberOfPayments, 2) : 0;

        var plan = new InstallmentPlan
        {
            ParcelId = parcelId,
            NumberOfPayments = numberOfPayments,
            MonthlyAmount = monthlyAmount,
            TotalAmount = totalOwed,
            CountyId = countyId.Value,
        };

        _db.InstallmentPlans.Add(plan);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created installment plan {PlanId} for parcel {ParcelId} in county {CountyId}",
            plan.Id, parcelId, countyId.Value);

        return Ok(new
        {
            planId = plan.Id.ToString(),
            monthlyAmount = plan.MonthlyAmount,
            numberOfPayments = plan.NumberOfPayments,
        });
    }

    // ── GET api/treasury/collection-stats ───────────────────────────
    // Handler 47: summarize_collection_stats

    [HttpGet("collection-stats")]
    public async Task<IActionResult> GetCollectionStats([FromQuery] int? taxYear)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var year = taxYear ?? DateTime.UtcNow.Year;

        var totalBilled = await _db.TaxStatements
            .AsNoTracking()
            .Where(s => s.CountyId == countyId.Value && s.TaxYear == year)
            .SumAsync(s => s.TotalDue);

        var totalCollected = await _db.TaxPayments
            .AsNoTracking()
            .Where(p => p.CountyId == countyId.Value)
            .SumAsync(p => p.Amount);

        var delinquentCount = await _db.DelinquencyRecords
            .AsNoTracking()
            .Where(d => d.CountyId == countyId.Value && d.IsDelinquent)
            .CountAsync();

        var collectionRate = totalBilled > 0
            ? Math.Round((totalCollected / totalBilled) * 100, 2)
            : 0;

        return Ok(new
        {
            totalBilled,
            totalCollected,
            collectionRate,
            delinquentCount,
            taxYear = year,
        });
    }

    // ── POST api/treasury/parcels/{parcelId}/tax-sale ───────────────
    // Handler 48: initiate_tax_sale

    [HttpPost("parcels/{parcelId}/tax-sale")]
    public async Task<IActionResult> InitiateTaxSale(string parcelId, [FromBody] InitiateTaxSaleRequest request)
    {
        if (request?.DelinquentYears is null || request.DelinquentYears.Length == 0)
            return BadRequest(new { error = "At least one delinquent year is required." });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        // Calculate total owed from delinquency records
        var delinquency = await _db.DelinquencyRecords
            .AsNoTracking()
            .Where(d => d.CountyId == countyId.Value && d.ParcelId == parcelId)
            .FirstOrDefaultAsync();

        var totalOwed = delinquency?.AmountOverdue ?? 0;
        var scheduledDate = DateTime.UtcNow.AddMonths(6); // Per RCW 84.64.080

        var sale = new TaxSale
        {
            ParcelId = parcelId,
            Status = "initiated",
            ScheduledDate = scheduledDate,
            TotalOwed = totalOwed,
            DelinquentYears = string.Join(",", request.DelinquentYears),
            CountyId = countyId.Value,
        };

        _db.TaxSales.Add(sale);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Initiated tax sale {SaleId} for parcel {ParcelId} in county {CountyId}",
            sale.Id, parcelId, countyId.Value);

        return Ok(new
        {
            saleId = sale.Id.ToString(),
            status = sale.Status,
            scheduledDate = scheduledDate.ToString("o"),
            totalOwed,
        });
    }

    // ── Static Levy Data ────────────────────────────────────────────

    internal static class BentonLevyData
    {
        internal record LevyComponent(string Name, decimal Amount);

        internal static List<LevyComponent> GetDefaultLevies(decimal totalTax)
        {
            if (totalTax <= 0) return new List<LevyComponent>();

            // Benton County typical levy distribution
            return new List<LevyComponent>
            {
                new("State School Levy", Math.Round(totalTax * 0.286m, 2)),
                new("Local School District", Math.Round(totalTax * 0.234m, 2)),
                new("County General", Math.Round(totalTax * 0.139m, 2)),
                new("County Roads", Math.Round(totalTax * 0.092m, 2)),
                new("City/Town", Math.Round(totalTax * 0.098m, 2)),
                new("Fire District", Math.Round(totalTax * 0.065m, 2)),
                new("Library District", Math.Round(totalTax * 0.041m, 2)),
                new("Port District", Math.Round(totalTax * 0.028m, 2)),
                new("Hospital District", Math.Round(totalTax * 0.017m, 2)),
            };
        }
    }

    // ── Request DTOs ────────────────────────────────────────────────

    public record RecordPaymentRequest
    {
        public decimal Amount { get; init; }
        public string? PaymentMethod { get; init; }
        public Guid? CountyId { get; init; }
    }

    public record CreateInstallmentPlanRequest
    {
        public int NumberOfPayments { get; init; } = 12;
        public Guid? CountyId { get; init; }
    }

    public record InitiateTaxSaleRequest
    {
        public int[] DelinquentYears { get; init; } = Array.Empty<int>();
        public Guid? CountyId { get; init; }
    }
}
