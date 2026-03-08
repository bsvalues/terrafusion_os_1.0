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
    [Authorize]
    public class PiltController : ControllerBase
    {
        private readonly ILogger<PiltController> _logger;

        public PiltController(ILogger<PiltController> logger)
        {
            _logger = logger;
        }

        private ActionResult BuildPostR1DisabledResponse(string operation)
        {
            HttpContext.Response.Headers["X-R1-Scope"] = "Post-R1";

            _logger.LogWarning(
                "PILT endpoint {Operation} was invoked, but the backend remains Post-R1 and is intentionally disabled",
                operation);

            var problem = new ProblemDetails
            {
                Title = "PILT backend is not enabled for R1",
                Detail = "The current PILT API was serving hardcoded placeholder data. It is intentionally disabled until a real county-scoped implementation ships.",
                Status = StatusCodes.Status501NotImplemented,
                Type = "https://terrafusion.local/problems/pilt-post-r1"
            };

            problem.Extensions["scope"] = "Post-R1";
            problem.Extensions["operation"] = operation;

            return StatusCode(StatusCodes.Status501NotImplemented, problem);
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
            return BuildPostR1DisabledResponse(nameof(GetStatus));
        }

        [HttpGet("districts")]
        public IActionResult GetDistricts()
        {
            return BuildPostR1DisabledResponse(nameof(GetDistricts));
        }

        [HttpGet("receipts")]
        public IActionResult GetReceipts([FromQuery] int? fiscalYear)
        {
            return BuildPostR1DisabledResponse(nameof(GetReceipts));
        }

        public record CreateReceiptRequest(int FiscalYear, string Source, decimal Amount);

        [HttpPost("receipts")]
        public IActionResult CreateReceipt([FromBody] CreateReceiptRequest request)
        {
            return BuildPostR1DisabledResponse(nameof(CreateReceipt));
        }

        [HttpPost("calculate/{receiptId}")]
        public IActionResult Calculate(string receiptId, [FromBody] CalculationRequest? request)
        {
            return BuildPostR1DisabledResponse(nameof(Calculate));
        }

        [HttpPost("approve/{calculationId}")]
        public IActionResult Approve(string calculationId)
        {
            return BuildPostR1DisabledResponse(nameof(Approve));
        }

        [HttpGet("reports/{year:int}")]
        public IActionResult GetReport(int year)
        {
            return BuildPostR1DisabledResponse(nameof(GetReport));
        }
    }
}
