using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Payment In Lieu of Taxes (PILT) Controller
    /// Provides county-isolated PILT distribution data for federal land payments.
    ///
    /// R1 Status: Reference data backed by county-isolated seed values.
    /// Full DB persistence (PiltReceipt, PiltDistrict entities) deferred to R2.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PiltController : ControllerBase
    {
        private readonly ILogger<PiltController> _logger;

        public PiltController(ILogger<PiltController> logger)
        {
            _logger = logger;
        }

        // ====================================================================
        // County isolation helper — reads countyId/countyCode from JWT claims
        // ====================================================================
        private string? GetCountyFromClaims()
        {
            return User.FindFirst("countyCode")?.Value?.Trim()
                ?? User.FindFirst("countyId")?.Value?.Trim();
        }

        private bool IsCountyAuthorized(string requestedCounty)
        {
            var claim = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(claim)) return false;
            return string.Equals(claim, requestedCounty, StringComparison.OrdinalIgnoreCase);
        }

        // ====================================================================
        // DTOs
        // ====================================================================
        public record PiltStatusResponse(
            string Status,
            int FiscalYear,
            decimal TotalPayments,
            int Districts,
            int FederalAcres,
            decimal AverageRate,
            string CountyCode
        );

        public record District(string Id, string Name, string Type, string CountyCode);
        public record Receipt(string Id, int FiscalYear, string Source, decimal Amount, string Status, string CountyCode);
        public record CalculationRequest(string ReceiptId, Dictionary<string, decimal>? Weights);
        public record Distribution(string DistrictId, decimal Amount);
        public record CalculationResult(string CalculationId, string ReceiptId, int FiscalYear, decimal TotalAmount, List<Distribution> Distributions, string Status);
        public record CreateReceiptRequest(int FiscalYear, string Source, decimal Amount);

        // ====================================================================
        // Benton County reference data (R1 seed — R2 will move to DB)
        // ====================================================================
        private static readonly Dictionary<string, PiltStatusResponse> CountyPiltData = new(StringComparer.OrdinalIgnoreCase)
        {
            ["benton"] = new PiltStatusResponse("pilt-ready", DateTime.UtcNow.Year, 2_800_000m, 20, 586_000, 4.78m, "benton"),
        };

        private static readonly Dictionary<string, List<District>> CountyDistricts = new(StringComparer.OrdinalIgnoreCase)
        {
            ["benton"] = new List<District>
            {
                new("sd-001", "Kennewick School District", "School", "benton"),
                new("sd-002", "Richland School District", "School", "benton"),
                new("fd-001", "Fire District 1", "Fire", "benton"),
                new("fd-002", "Fire District 2", "Fire", "benton"),
            },
        };

        private static readonly Dictionary<string, List<Receipt>> CountyReceipts = new(StringComparer.OrdinalIgnoreCase)
        {
            ["benton"] = new List<Receipt>
            {
                new("rcpt-2025-0001", DateTime.UtcNow.Year, "USDOI-BLM", 1_800_000m, "received", "benton"),
                new("rcpt-2025-0002", DateTime.UtcNow.Year, "USDA-FS", 1_000_000m, "received", "benton"),
            },
        };

        // ====================================================================
        // Endpoints
        // ====================================================================

        [HttpGet("status")]
        [RequiresPermission("read:pilt")]
        public ActionResult<PiltStatusResponse> GetStatus()
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            if (!CountyPiltData.TryGetValue(county, out var data))
                return NotFound(new { error = $"No PILT data for county '{county}'" });

            _logger.LogInformation("PILT status requested for county={County}", county);
            return Ok(data);
        }

        [HttpGet("districts")]
        [RequiresPermission("read:pilt")]
        public IActionResult GetDistricts()
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            if (!CountyDistricts.TryGetValue(county, out var districts))
                return Ok(new { count = 0, districts = Array.Empty<District>() });

            return Ok(new { count = districts.Count, districts });
        }

        [HttpGet("receipts")]
        [RequiresPermission("read:pilt")]
        public IActionResult GetReceipts([FromQuery] int? fiscalYear)
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            var year = fiscalYear ?? DateTime.UtcNow.Year;

            if (!CountyReceipts.TryGetValue(county, out var allReceipts))
                return Ok(new { count = 0, receipts = Array.Empty<Receipt>() });

            var receipts = allReceipts.Where(r => r.FiscalYear == year).ToList();
            return Ok(new { count = receipts.Count, receipts });
        }

        [HttpPost("receipts")]
        [RequiresPermission("write:pilt")]
        public IActionResult CreateReceipt([FromBody] CreateReceiptRequest request)
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            if (request is null || request.FiscalYear <= 2000 || string.IsNullOrWhiteSpace(request.Source) || request.Amount <= 0)
                return BadRequest(new { error = "Invalid receipt request" });

            var id = $"rcpt-{request.FiscalYear}-{Guid.NewGuid().ToString("N")[..6]}";
            var receipt = new Receipt(id, request.FiscalYear, request.Source, request.Amount, "received", county);
            _logger.LogInformation("Created receipt {Id} for {Amount} from {Source} county={County}", id, request.Amount, request.Source, county);
            return Created($"/api/pilt/receipts/{id}", receipt);
        }

        [HttpPost("calculate/{receiptId}")]
        [RequiresPermission("write:pilt")]
        public IActionResult Calculate(string receiptId, [FromBody] CalculationRequest? request)
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            if (string.IsNullOrWhiteSpace(receiptId))
                return BadRequest(new { error = "receiptId is required" });

            if (!CountyReceipts.TryGetValue(county, out var receipts))
                return NotFound(new { error = $"No receipts for county '{county}'" });

            var receipt = receipts.FirstOrDefault(r => r.Id == receiptId);
            var amount = receipt?.Amount ?? 2_800_000m;

            if (!CountyDistricts.TryGetValue(county, out var districts))
                return NotFound(new { error = $"No districts for county '{county}'" });

            var districtIds = districts.Select(d => d.Id).ToArray();
            List<Distribution> distributions;
            if (request?.Weights is { Count: > 0 })
            {
                var totalWeight = request.Weights.Values.Sum();
                distributions = request.Weights
                    .Select(kvp => new Distribution(kvp.Key, Math.Round(amount * (kvp.Value / (totalWeight == 0 ? 1 : totalWeight)), 2)))
                    .ToList();
            }
            else
            {
                var per = Math.Round(amount / districtIds.Length, 2);
                distributions = districtIds.Select(d => new Distribution(d, per)).ToList();
            }

            var result = new CalculationResult(
                CalculationId: $"calc-{Guid.NewGuid().ToString("N")[..8]}",
                ReceiptId: receiptId,
                FiscalYear: DateTime.UtcNow.Year,
                TotalAmount: amount,
                Distributions: distributions,
                Status: "calculated"
            );

            _logger.LogInformation("PILT calculation {CalcId} for receipt {ReceiptId} county={County}", result.CalculationId, receiptId, county);
            return Ok(result);
        }

        [HttpPost("approve/{calculationId}")]
        [RequiresPermission("write:pilt")]
        public IActionResult Approve(string calculationId)
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            if (string.IsNullOrWhiteSpace(calculationId))
                return BadRequest(new { error = "calculationId is required" });

            _logger.LogInformation("PILT approval {CalcId} county={County}", calculationId, county);
            return Ok(new { calculationId, status = "approved", approvedAt = DateTime.UtcNow, countyCode = county });
        }

        [HttpGet("reports/{year:int}")]
        [RequiresPermission("read:pilt")]
        public IActionResult GetReport(int year)
        {
            var county = GetCountyFromClaims();
            if (string.IsNullOrWhiteSpace(county))
                return Unauthorized(new { error = "County context required" });

            if (!CountyPiltData.TryGetValue(county, out var data))
                return NotFound(new { error = $"No PILT data for county '{county}'" });

            var summary = new
            {
                year,
                countyCode = county,
                totalPayments = data.TotalPayments,
                districts = data.Districts,
                federalAcres = data.FederalAcres,
                averageRate = data.AverageRate,
            };
            return Ok(new { summary, generatedAt = DateTime.UtcNow });
        }
    }
}
