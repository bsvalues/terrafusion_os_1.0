// =============================================================================
// PACS Controller - /api/pacs Endpoints
// =============================================================================
// Live Harris PACS data endpoints backed by IPacsAdapter (pacscontract.v1).
// Returns 503 when PACS is not yet configured (missing TF_DEV_PACS_* / connection
// string) so the frontend can gracefully fall back to the SQLite dev path.
//
// Phase 33 — PACS Live Integration
// =============================================================================

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.PACS;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Live Harris PACS data endpoints.
/// Backed by <see cref="IPacsAdapter"/> (pacscontract.v1).
/// Returns HTTP 503 when PACS SQL Server is not yet provisioned.
/// </summary>
[ApiController]
[Route("api/pacs")]
[Produces("application/json")]
public class PacsController : ControllerBase
{
    private readonly IServiceProvider _services;
    private readonly ILogger<PacsController> _logger;

    public PacsController(IServiceProvider services, ILogger<PacsController> logger)
    {
        _services = services;
        _logger = logger;
    }

    // ── GET /api/pacs/properties ─────────────────────────────────────────

    /// <summary>
    /// Paginated property list from vw_TerraFusion_Property_Core.
    /// Returns 503 when PACS is not configured.
    /// </summary>
    /// <param name="geoId">
    /// Legacy ProVal/Ascend geo_id for exact-match lookup.
    /// Bound as raw string — leading zeroes and non-numeric values are preserved.
    /// Routes to GetPropertyByGeoIdAsync (WHERE geo_id = @GeoId), not a table scan.
    /// </param>
    /// <param name="search">Free-text in-page filter on address/city (best-effort, not SQL-pushed).</param>
    [HttpGet("properties")]
    [AllowAnonymous]
    public async Task<ActionResult<PacsPropertiesResponse>> GetProperties(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? geoId = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        IPacsAdapter adapter;
        try
        {
            adapter = _services.GetRequiredService<IPacsAdapter>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("PACS adapter not available: {Message}", ex.Message);
            return StatusCode(503, new PacsErrorResponse
            {
                Error = PacsErrorCodes.ConnectionFailed,
                Message = "PACS SQL Server not configured. Set ConnectionStrings:PacsConnection."
            });
        }

        // Cap PACS query at 5s so the endpoint fails fast and the frontend can fall back.
        using var pacsCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        pacsCts.CancelAfter(TimeSpan.FromSeconds(5));

        try
        {
            // ── geo_id exact lookup ───────────────────────────────────────────
            // geo_id is a legacy ProVal/Ascend text identifier. Bind as raw string.
            // Do NOT parse as numeric. Do NOT strip leading zeroes.
            // Route directly to the dedicated adapter method (WHERE geo_id = @GeoId)
            // so TotalCount reflects the filtered result, not the full table count.
            if (!string.IsNullOrWhiteSpace(geoId))
            {
                var prop = await adapter.GetPropertyByGeoIdAsync(geoId.Trim(), pacsCts.Token);
                var mapped = prop is null
                    ? new System.Collections.Generic.List<PacsPropertySummaryDto>()
                    : new System.Collections.Generic.List<PacsPropertySummaryDto>
                      {
                          new()
                          {
                              PropId        = prop.PropId,
                              GeoId         = (prop.GeoId ?? string.Empty).Trim(),
                              Address       = BuildAddress(prop),
                              AssessedValue = (double)(prop.AssessedVal ?? 0m),
                              MarketValue   = (double)(prop.MarketVal ?? 0m),
                              PropertyType  = (prop.PropTypeCd ?? string.Empty).Trim(),
                          }
                      };
                return Ok(new PacsPropertiesResponse
                {
                    Items      = mapped,
                    Page       = 1,
                    PageSize   = pageSize,
                    TotalCount = mapped.Count,
                });
            }

            // ── paginated list with optional SQL-level text search ───────────
            PacsPagedResult<PacsPropertyCore> result;
            if (!string.IsNullOrWhiteSpace(search))
            {
                // Delegate to adapter for server-side GeoId / address search
                result = await adapter.SearchPropertiesAsync(search.Trim(), page, pageSize, pacsCts.Token);
            }
            else
            {
                result = await adapter.GetPropertiesAsync(page, pageSize, pacsCts.Token);
            }

            var mappedPage = result.Items.Select(p => new PacsPropertySummaryDto
            {
                PropId        = p.PropId,
                GeoId         = (p.GeoId ?? string.Empty).Trim(),
                Address       = BuildAddress(p),
                AssessedValue = (double)(p.AssessedVal ?? 0m),
                MarketValue   = (double)(p.MarketVal ?? 0m),
                PropertyType  = (p.PropTypeCd ?? string.Empty).Trim(),
            }).ToList();

            return Ok(new PacsPropertiesResponse
            {
                Items      = mappedPage,
                Page       = result.Page,
                PageSize   = result.PageSize,
                TotalCount = result.TotalCount,
            });
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("PACS properties query timed out after 10s — SQL Server not reachable");
            return StatusCode(503, new PacsErrorResponse
            {
                Error   = PacsErrorCodes.ConnectionFailed,
                Message = "PACS query timed out. SQL Server not provisioned or unreachable.",
            });
        }
        catch (PacsContractViolationException ex)
        {
            _logger.LogWarning("PACS contract violation: {Code} {Message}", ex.ErrorCode, ex.Message);
            return StatusCode(503, new PacsErrorResponse
            {
                Error   = ex.ErrorCode,
                Message = ex.Message,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error reading PACS properties");
            return StatusCode(503, new PacsErrorResponse
            {
                Error   = PacsErrorCodes.ConnectionFailed,
                Message = "PACS query failed. See server logs.",
            });
        }
    }

    // ── GET /api/pacs/health ─────────────────────────────────────────────

    /// <summary>
    /// PACS adapter connectivity status — used by smoke tests.
    /// Returns 200 {"status":"connected"} when PACS is live.
    /// Returns 503 when not configured or unreachable.
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult> GetHealth(CancellationToken ct = default)
    {
        IPacsAdapter adapter;
        try
        {
            adapter = _services.GetRequiredService<IPacsAdapter>();
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { status = "not_configured", detail = ex.Message });
        }

        // Cap health probe at 5s so the endpoint doesn't block on an unreachable SQL Server.
        using var healthCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        healthCts.CancelAfter(TimeSpan.FromSeconds(5));

        try
        {
            var status = await adapter.GetConnectionStatusAsync(healthCts.Token);
            return Ok(new
            {
                status          = status.IsConnected ? "connected" : "degraded",
                latencyMs       = status.LatencyMs,
                lastConnectedAt = status.LastConnectedAt,
            });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(503, new { status = "timeout", detail = "PACS health probe timed out after 5s" });
        }
        catch (PacsContractViolationException ex)
        {
            return StatusCode(503, new { status = "error", error = ex.ErrorCode, detail = ex.Message });
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static string BuildAddress(PacsPropertyCore p)
    {
        var parts = new[] { p.SitusAddr, p.SitusCity, p.SitusZip }
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!.Trim());
        return string.Join(", ", parts);
    }

    // ── response DTOs ─────────────────────────────────────────────────────

    public sealed record PacsPropertySummaryDto
    {
        public int    PropId        { get; init; }
        public string GeoId         { get; init; } = string.Empty;
        public string Address        { get; init; } = string.Empty;
        public double AssessedValue  { get; init; }
        public double MarketValue    { get; init; }
        public string PropertyType   { get; init; } = string.Empty;
    }

    public sealed record PacsPropertiesResponse
    {
        public System.Collections.Generic.List<PacsPropertySummaryDto> Items { get; init; } = new();
        public int Page       { get; init; }
        public int PageSize   { get; init; }
        public int TotalCount { get; init; }
    }

    public sealed record PacsErrorResponse
    {
        public string Error   { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
    }
}
