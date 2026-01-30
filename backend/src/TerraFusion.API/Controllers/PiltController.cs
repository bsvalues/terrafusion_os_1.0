using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class PiltController : ControllerBase
    {
        private readonly ILogger<PiltController> _logger;

        public PiltController(ILogger<PiltController> logger)
        {
            _logger = logger;
        }

        public record PiltStatusResponse
        (
            string Status,
            int FiscalYear,
            decimal TotalPayments,
            int Districts,
            int FederalAcres,
            decimal AverageRate
        );

        public record District(string Id, string Name, string Type);
        public record Receipt(string Id, int FiscalYear, string Source, decimal Amount, string Status);
        public record CalculationRequest(string ReceiptId, Dictionary<string, decimal>? Weights);
        public record Distribution(string DistrictId, decimal Amount);
        public record CalculationResult(string CalculationId, string ReceiptId, int FiscalYear, decimal TotalAmount, List<Distribution> Distributions, string Status);

        [HttpGet("status")]
        public ActionResult<PiltStatusResponse> GetStatus()
        {
            var year = DateTime.UtcNow.Year;
            var response = new PiltStatusResponse(
                Status: "pilt-ready",
                FiscalYear: year,
                TotalPayments: 2800000m,
                Districts: 20,
                FederalAcres: 586000,
                AverageRate: 4.78m
            );
            return Ok(response);
        }

        [HttpGet("districts")]
        public IActionResult GetDistricts()
        {
            var districts = new List<District>
            {
                new("sd-001", "Kennewick School District", "School"),
                new("sd-002", "Richland School District", "School"),
                new("fd-001", "Fire District 1", "Fire"),
                new("fd-002", "Fire District 2", "Fire")
            };
            return Ok(new { count = districts.Count, districts });
        }

        [HttpGet("receipts")]
        public IActionResult GetReceipts([FromQuery] int? fiscalYear)
        {
            var year = fiscalYear ?? DateTime.UtcNow.Year;
            var receipts = new List<Receipt>
            {
                new("rcpt-2025-0001", year, "USDOI-BLM", 1800000m, "received"),
                new("rcpt-2025-0002", year, "USDA-FS", 1000000m, "received")
            };
            return Ok(new { count = receipts.Count, receipts });
        }

        public record CreateReceiptRequest(int FiscalYear, string Source, decimal Amount);

        [HttpPost("receipts")]
        public IActionResult CreateReceipt([FromBody] CreateReceiptRequest request)
        {
            if (request is null || request.FiscalYear <= 2000 || string.IsNullOrWhiteSpace(request.Source) || request.Amount <= 0)
            {
                return BadRequest(new { error = "Invalid receipt request" });
            }
            var id = $"rcpt-{request.FiscalYear}-{Guid.NewGuid().ToString("N")[..6]}";
            var receipt = new Receipt(id, request.FiscalYear, request.Source, request.Amount, "received");
            _logger.LogInformation("Created receipt {Id} for {Amount} from {Source}", id, request.Amount, request.Source);
            return Created($"/api/pilt/receipts/{id}", receipt);
        }

        [HttpPost("calculate/{receiptId}")]
        public IActionResult Calculate(string receiptId, [FromBody] CalculationRequest? request)
        {
            if (string.IsNullOrWhiteSpace(receiptId))
            {
                return BadRequest(new { error = "receiptId is required" });
            }

            // Simulate lookup
            var year = DateTime.UtcNow.Year;
            var amount = 2800000m;

            // Simple equal distribution across four sample districts or by provided weights
            var districts = new[] { "sd-001", "sd-002", "fd-001", "fd-002" };
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
                var per = Math.Round(amount / districts.Length, 2);
                distributions = districts.Select(d => new Distribution(d, per)).ToList();
            }

            var result = new CalculationResult(
                CalculationId: $"calc-{Guid.NewGuid().ToString("N")[..8]}",
                ReceiptId: receiptId,
                FiscalYear: year,
                TotalAmount: amount,
                Distributions: distributions,
                Status: "calculated"
            );

            return Ok(result);
        }

        [HttpPost("approve/{calculationId}")]
        public IActionResult Approve(string calculationId)
        {
            if (string.IsNullOrWhiteSpace(calculationId))
            {
                return BadRequest(new { error = "calculationId is required" });
            }
            return Ok(new { calculationId, status = "approved", approvedAt = DateTime.UtcNow });
        }

        [HttpGet("reports/{year:int}")]
        public IActionResult GetReport(int year)
        {
            var summary = new
            {
                year,
                totalPayments = 2800000m,
                districts = 20,
                federalAcres = 586000,
                averageRate = 4.78m
            };
            return Ok(new { summary, generatedAt = DateTime.UtcNow });
        }
    }
}
