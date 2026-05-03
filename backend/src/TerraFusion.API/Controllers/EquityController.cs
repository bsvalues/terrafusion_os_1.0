/*
 * EquityController
 *
 * Single HTTP surface for CostForge v2 equity metrics. All stratum views
 * (Triage, Audit, Rollup, Calibration preview) fetch from here.
 *
 * @version 1.0.0 - Track 1 (CostForge Benton Method v2)
 */

using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/equity")]
public class EquityController : ControllerBase
{
    private static readonly string[] ValidStrata = new[]
    {
        "none", "county", "neighborhood", "city", "type", "vintage", "condition", "grade"
    };

    private readonly IEquityMetricService _equity;
    private readonly IRollupService _rollup;
    private readonly IBentonCustomMetricService _custom;
    private readonly ILogger<EquityController> _logger;

    public EquityController(
        IEquityMetricService equity,
        IRollupService rollup,
        IBentonCustomMetricService custom,
        ILogger<EquityController> logger)
    {
        _equity = equity;
        _rollup = rollup;
        _custom = custom;
        _logger = logger;
    }

    /// <summary>
    /// Get equity metrics stratified by the given dimension.
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics(
        [FromQuery] Guid countyId,
        [FromQuery] int taxYear,
        [FromQuery] string by = "none",
        [FromQuery] string? segment = null,
        CancellationToken ct = default)
    {
        if (countyId == Guid.Empty)
            return BadRequest(new { error = "countyId is required" });
        if (taxYear < 2000 || taxYear > 2100)
            return BadRequest(new { error = "taxYear must be between 2000 and 2100" });
        if (!ValidStrata.Contains(by.ToLowerInvariant()))
            return BadRequest(new
            {
                error = $"Invalid stratum '{by}'",
                validStrata = ValidStrata
            });

        try
        {
            var groups = await _equity.GetMetricsAsync(countyId, taxYear, by, segment, ct);
            return Ok(new
            {
                countyId,
                taxYear,
                stratum = by,
                segment,
                groupCount = groups.Count,
                groups
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "EquityController.GetMetrics failed: countyId={CountyId} taxYear={TaxYear} by={By}",
                countyId, taxYear, by);
            return StatusCode(500, new { error = "equity metrics computation failed", detail = ex.Message });
        }
    }

    /// <summary>
    /// Rollup metrics by geographic/type/vintage/grade stratum.
    /// </summary>
    [HttpGet("rollup")]
    public async Task<IActionResult> GetRollup(
        [FromQuery] Guid countyId,
        [FromQuery] int taxYear,
        [FromQuery] string by = "city",
        CancellationToken ct = default)
    {
        if (countyId == Guid.Empty)
            return BadRequest(new { error = "countyId is required" });
        if (taxYear < 2000 || taxYear > 2100)
            return BadRequest(new { error = "taxYear must be between 2000 and 2100" });

        try
        {
            var result = await _rollup.GetRollupAsync(countyId, taxYear, by, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "EquityController.GetRollup failed: countyId={CountyId} taxYear={TaxYear} by={By}",
                countyId, taxYear, by);
            return StatusCode(500, new { error = "rollup computation failed", detail = ex.Message });
        }
    }

    // ── Track 3: Benton custom metrics beyond IAAO ──

    [HttpGet("deciles")]
    public async Task<IActionResult> GetDeciles(
        [FromQuery] Guid countyId, [FromQuery] int taxYear,
        [FromQuery] string by = "none", [FromQuery] string? segment = null,
        CancellationToken ct = default)
    {
        return Ok(await _custom.GetDecilesAsync(countyId, taxYear, by, segment, ct));
    }

    [HttpGet("stratified-cod")]
    public async Task<IActionResult> GetStratifiedCod(
        [FromQuery] Guid countyId, [FromQuery] int taxYear,
        [FromQuery] string by = "none", [FromQuery] string? segment = null,
        [FromQuery] string splitBy = "vintage",
        CancellationToken ct = default)
    {
        try
        {
            return Ok(await _custom.GetStratifiedCodAsync(countyId, taxYear, by, segment, splitBy, ct));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("condition-bias")]
    public async Task<IActionResult> GetConditionBias(
        [FromQuery] Guid countyId, [FromQuery] int taxYear,
        [FromQuery] string by = "none", [FromQuery] string? segment = null,
        CancellationToken ct = default)
    {
        return Ok(await _custom.GetConditionBiasAsync(countyId, taxYear, by, segment, ct));
    }

    [HttpGet("segment-drift")]
    public async Task<IActionResult> GetSegmentDrift(
        [FromQuery] Guid countyId, [FromQuery] int taxYear,
        [FromQuery] string by = "none", [FromQuery] string? segment = null,
        CancellationToken ct = default)
    {
        return Ok(await _custom.GetSegmentDriftAsync(countyId, taxYear, by, segment, ct));
    }

    [HttpGet("grade-drift")]
    public async Task<IActionResult> GetGradeDrift(
        [FromQuery] Guid countyId, [FromQuery] int taxYear,
        [FromQuery] string by = "none", [FromQuery] string? segment = null,
        CancellationToken ct = default)
    {
        return Ok(await _custom.GetGradeDriftAsync(countyId, taxYear, by, segment, ct));
    }
}
