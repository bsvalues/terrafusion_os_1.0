using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class PiltController : ControllerBase
  {
    private readonly ILogger<PiltController> _logger;
    private readonly IPiltService _piltService;
    private readonly Data.TerraFusionDbContext _db;

    public PiltController(ILogger<PiltController> logger, IPiltService piltService, Data.TerraFusionDbContext db)
    {
      _logger = logger;
      _piltService = piltService;
      _db = db;
    }

    // ── County Isolation ──────────────────────────────────────────

    private async Task<Guid?> ResolveCountyIdAsync()
    {
      var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
      if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
        return directCountyId;

      var countyCodeClaim = User.FindFirst("countyCode")?.Value?.Trim();
      if (string.IsNullOrWhiteSpace(countyIdClaim) && string.IsNullOrWhiteSpace(countyCodeClaim))
        return null;

      var candidates = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
      if (!string.IsNullOrWhiteSpace(countyIdClaim)) candidates.Add(countyIdClaim);
      if (!string.IsNullOrWhiteSpace(countyCodeClaim)) candidates.Add(countyCodeClaim);

      var candidateArray = candidates.ToArray();
      return await _db.Counties
          .Where(c => candidateArray.Contains(c.Name) || (c.FipsCode != null && candidateArray.Contains(c.FipsCode)))
          .Select(c => (Guid?)c.Id)
          .FirstOrDefaultAsync();
    }

    private string ResolveUserId() =>
        User.FindFirst("userId")?.Value ?? User.FindFirst("sub")?.Value ?? "unknown";

    // ── R2 PILT Endpoints (real Benton County calculator) ────────

    [HttpGet("status")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetStatus()
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var status = await _piltService.GetStatusAsync(countyId.Value);
      return Ok(status);
    }

    [HttpGet("districts")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetDistricts()
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var districts = await _piltService.GetDistrictsAsync(countyId.Value);
      return Ok(new { count = districts.Count, districts });
    }

    [HttpGet("receipts")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetReceipts([FromQuery] int? fiscalYear)
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var receipts = await _piltService.GetReceiptsAsync(countyId.Value, fiscalYear);
      return Ok(new { count = receipts.Count, receipts });
    }

    [HttpPost("receipts")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> CreateReceipt([FromBody] PiltCreateReceiptRequest request)
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var receipt = await _piltService.CreateReceiptAsync(request, countyId.Value, ResolveUserId());
      return CreatedAtAction(nameof(GetReceipts), new { fiscalYear = receipt.FiscalYear }, receipt);
    }

    [HttpPost("calculate/{receiptId}")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> Calculate(string receiptId, [FromBody] PiltCalculateRequest? request)
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var result = await _piltService.CalculateAsync(receiptId, request, countyId.Value);
      return Ok(result);
    }

    [HttpPost("approve/{calculationId}")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> Approve(string calculationId)
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var result = await _piltService.ApproveAsync(calculationId, countyId.Value, ResolveUserId());
      return Ok(result);
    }

    [HttpGet("reports/{year:int}")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetReport(int year)
    {
      var countyId = await ResolveCountyIdAsync();
      if (countyId is null) return Forbid();

      var report = await _piltService.GetReportAsync(year, countyId.Value);
      return Ok(report);
    }
  }
}
