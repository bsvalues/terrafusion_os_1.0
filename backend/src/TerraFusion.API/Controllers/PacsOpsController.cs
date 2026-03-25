// =============================================================================
// PACS Ops Controller - /ops/pacs/proof Endpoint
// =============================================================================
// Authoritative PACS contract proof endpoint.
// Returns deterministic JSON proving PACS compliance status.
// Governed by pacscontract.v1 SpecLock.
// =============================================================================

using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.PACS;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Operations endpoints for PACS contract proof and diagnostics.
/// </summary>
[ApiController]
[Route("ops/pacs")]
[Produces("application/json")]
public class PacsOpsController : ControllerBase
{
    private readonly IServiceProvider _services;
    private readonly ILogger<PacsOpsController> _logger;

    private const string ContractName = "pacscontract.v1";
    private const string ContractVersion = "1.0.0";
    private const string SpecLockPath = "docs/spec-lock/locks/pacscontract/pacscontract.v1/speclock.spec.json";

    // Adapter is resolved lazily per-request so that a missing PACS connection
    // string (PacsSqlAdapter throws in constructor) does not crash DI activation
    // and cause HTTP 500. Instead the try/catch in each action method handles it.
    // Mirrors PacsController pattern.
    public PacsOpsController(
        IServiceProvider services,
        ILogger<PacsOpsController> logger)
    {
        _services = services ?? throw new ArgumentNullException(nameof(services));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Returns deterministic PACS contract proof.
    /// </summary>
    /// <remarks>
    /// <para>This endpoint proves PACS contract compliance by validating:</para>
    /// <list type="bullet">
    ///   <item>Database connectivity (pacs_oltp required, CIAPS optional)</item>
    ///   <item>Required views existence (vw_TerraFusion_*)</item>
    ///   <item>Required indexes existence (warning only)</item>
    ///   <item>Health check procedure execution</item>
    /// </list>
    /// <para><b>No side effects. No retries. Deterministic ordering. Fail-fast on violation.</b></para>
    /// </remarks>
    /// <response code="200">Contract proof (may indicate failures in payload)</response>
    /// <response code="503">PACS adapter not available</response>
    [HttpGet("proof")]
    [AllowAnonymous] // Ops endpoints should be accessible for monitoring
    [ProducesResponseType(typeof(PacsProofResponse), 200)]
    [ProducesResponseType(503)]
    public async Task<IActionResult> GetProof(CancellationToken cancellationToken)
    {
        var startTime = DateTime.UtcNow;

        IPacsAdapter adapter;
        try
        {
            adapter = _services.GetRequiredService<IPacsAdapter>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("PACS adapter not available for proof: {Message}", ex.Message);
            return Ok(new PacsProofResponse
            {
                Enabled = false,
                Contract = new ContractInfo
                {
                    Name = ContractName,
                    Version = ContractVersion,
                    ManifestSha256 = ComputeManifestHash()
                },
                Databases = new DatabaseStatus { PacsOltp = "not_configured", Ciaps = "not_configured" },
                Views = new ViewStatus
                {
                    VwTerraFusionPropertyCore = "unknown",
                    VwTerraFusionPropertyOwnership = "unknown",
                    VwTerraFusionAssessmentHistory = "unknown"
                },
                Indexes = new IndexStatus
                {
                    IxTerraFusionPropertyGeoId = "unknown",
                    IxTerraFusionPropertyValPropYear = "unknown",
                    IxTerraFusionSitusProperty = "unknown"
                },
                Procedures = new ProcedureStatus { SpTerraFusionHealthCheck = "unknown" },
                HealthCheckExecution = "not_attempted",
                LastVerifiedUtc = DateTime.UtcNow,
                LatencyMs = 0,
                ReadOnly = true,
                ContractValid = false,
                Errors = new[] { "PACS adapter not available. Check server logs for details." },
                Warnings = Array.Empty<string>()
            });
        }

        try
        {
            _logger.LogInformation("PACS proof requested at {Timestamp}", startTime);

            // Get contract proof from adapter (no retries, fail-fast)
            var proof = await adapter.ValidateContractAsync(cancellationToken);
            var connectionStatus = await adapter.GetConnectionStatusAsync(cancellationToken);

            var latencyMs = (DateTime.UtcNow - startTime).TotalMilliseconds;

            // Build deterministic response
            var response = new PacsProofResponse
            {
                Enabled = true,
                Contract = new ContractInfo
                {
                    Name = ContractName,
                    Version = ContractVersion,
                    ManifestSha256 = ComputeManifestHash()
                },
                DbName = connectionStatus.DatabaseName ?? "unknown",
                Server = connectionStatus.ServerName ?? "unknown",
                Databases = new DatabaseStatus
                {
                    PacsOltp = proof.DatabaseConnection.Passed ? "reachable" : "unreachable",
                    Ciaps = "optional" // CIAPS is optional per pacscontract.v1
                },
                Views = new ViewStatus
                {
                    VwTerraFusionPropertyCore = GetViewStatus(proof, "vw_TerraFusion_Property_Core"),
                    VwTerraFusionPropertyOwnership = GetViewStatus(proof, "vw_TerraFusion_Property_Ownership"),
                    VwTerraFusionAssessmentHistory = GetViewStatus(proof, "vw_TerraFusion_Assessment_History")
                },
                Indexes = new IndexStatus
                {
                    IxTerraFusionPropertyGeoId = GetIndexStatus(proof, "IX_TerraFusion_Property_GeoID"),
                    IxTerraFusionPropertyValPropYear = GetIndexStatus(proof, "IX_TerraFusion_PropertyVal_PropYear"),
                    IxTerraFusionSitusProperty = GetIndexStatus(proof, "IX_TerraFusion_Situs_Property")
                },
                Procedures = new ProcedureStatus
                {
                    SpTerraFusionHealthCheck = proof.HealthCheckProcedure.Passed ? "ok" : "missing"
                },
                HealthCheckExecution = proof.HealthCheckExecution.Passed ? "passed" : "failed",
                LastVerifiedUtc = DateTime.UtcNow,
                LatencyMs = (int)Math.Round(latencyMs),
                ReadOnly = true, // pacscontract.v1 enforces read-only
                ContractValid = proof.IsValid,
                Errors = proof.Errors,
                Warnings = proof.Warnings
            };

            _logger.LogInformation(
                "PACS proof completed: valid={Valid}, latency={Latency}ms, errors={ErrorCount}",
                proof.IsValid, latencyMs, proof.Errors.Count);

            return Ok(response);
        }
        catch (PacsContractViolationException ex)
        {
            _logger.LogError(ex, "PACS contract violation during proof: {ErrorCode}", ex.ErrorCode);

            // Return proof showing violation (not 503)
            return Ok(new PacsProofResponse
            {
                Enabled = true,
                Contract = new ContractInfo
                {
                    Name = ContractName,
                    Version = ContractVersion,
                    ManifestSha256 = ComputeManifestHash()
                },
                Databases = new DatabaseStatus
                {
                    PacsOltp = "unreachable",
                    Ciaps = "unknown"
                },
                Views = new ViewStatus
                {
                    VwTerraFusionPropertyCore = "unknown",
                    VwTerraFusionPropertyOwnership = "unknown",
                    VwTerraFusionAssessmentHistory = "unknown"
                },
                Indexes = new IndexStatus
                {
                    IxTerraFusionPropertyGeoId = "unknown",
                    IxTerraFusionPropertyValPropYear = "unknown",
                    IxTerraFusionSitusProperty = "unknown"
                },
                Procedures = new ProcedureStatus
                {
                    SpTerraFusionHealthCheck = "unknown"
                },
                HealthCheckExecution = "not_attempted",
                LastVerifiedUtc = DateTime.UtcNow,
                LatencyMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds,
                ReadOnly = true,
                ContractValid = false,
                Errors = new[] { $"{ex.ErrorCode}: {ex.Message}" },
                Warnings = Array.Empty<string>()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during PACS proof");
            return StatusCode(503, new { error = "PACS adapter unavailable", details = ex.Message });
        }
    }

    /// <summary>
    /// Quick connectivity check (liveness, not full proof).
    /// </summary>
    [HttpGet("ping")]
    [AllowAnonymous]
    public async Task<IActionResult> Ping(CancellationToken cancellationToken)
    {
        try
        {
            var adapter = _services.GetRequiredService<IPacsAdapter>();
            var status = await adapter.GetConnectionStatusAsync(cancellationToken);
            return Ok(new
            {
                pacs = status.IsConnected ? "ok" : "unreachable",
                latency_ms = status.LatencyMs,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                pacs = "error",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Look up a property by geo_id (parcel ID) from PACS.
    /// Returns core property data + ownership from the contract views.
    /// </summary>
    [HttpGet("property/{geoId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProperty(string geoId, CancellationToken cancellationToken)
    {
        try
        {
            var adapter = _services.GetRequiredService<IPacsAdapter>();
            var property = await adapter.GetPropertyByGeoIdAsync(geoId, cancellationToken);
            if (property == null)
                return NotFound(new { error = $"No property found for geo_id '{geoId}'" });

            PacsPropertyOwnership? ownership = null;
            try
            {
                ownership = await adapter.GetOwnershipAsync(property.PropId, cancellationToken);
            }
            catch
            {
                // Ownership lookup is non-critical
            }

            return Ok(new
            {
                propId = property.PropId,
                geoId = (property.GeoId ?? string.Empty).Trim(),
                address = FormatAddress(property),
                ownerName = (ownership?.OwnerName ?? "N/A").Trim(),
                assessedValue = property.AssessedVal ?? 0m,
                marketValue = property.MarketVal ?? 0m,
                landValue = property.LandVal ?? 0m,
                improvementValue = property.ImprvVal ?? 0m,
                propertyType = (property.PropTypeCd ?? "Unknown").Trim(),
                legalDescription = (property.LegalDesc ?? string.Empty).Trim(),
                appraisalYear = property.ApprYear,
                lastModified = property.LastModified,
                source = "pacs_oltp",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error looking up property {GeoId}", geoId);
            return StatusCode(503, new { error = "PACS lookup failed", details = ex.Message });
        }
    }

    /// <summary>
    /// List properties with pagination from PACS contract views.
    /// </summary>
    [HttpGet("properties")]
    [AllowAnonymous]
    public async Task<IActionResult> ListProperties(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        if (pageSize > 100) pageSize = 100;
        if (page < 1) page = 1;

        try
        {
            var adapter = _services.GetRequiredService<IPacsAdapter>();
            var result = await adapter.GetPropertiesAsync(page, pageSize, cancellationToken);
            return Ok(new
            {
                items = result.Items.Select(p => new
                {
                    propId = p.PropId,
                    geoId = (p.GeoId ?? string.Empty).Trim(),
                    address = FormatAddress(p),
                    assessedValue = p.AssessedVal ?? 0m,
                    marketValue = p.MarketVal ?? 0m,
                    propertyType = (p.PropTypeCd ?? "Unknown").Trim(),
                }),
                page,
                pageSize,
                totalCount = result.TotalCount,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing PACS properties");
            return StatusCode(503, new { error = "PACS listing failed", details = ex.Message });
        }
    }

    private static string FormatAddress(PacsPropertyCore p)
    {
        var parts = new[] { p.SitusAddr, p.SitusCity, "WA", p.SitusZip }
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!.Trim());
        return string.Join(", ", parts);
    }

    private static string GetViewStatus(PacsContractProof proof, string viewName)
    {
        if (!proof.RequiredViews.Passed)
        {
            // Check if this specific view is mentioned in errors
            if (proof.RequiredViews.Details?.Contains(viewName) == true)
            {
                return "missing";
            }
        }
        return proof.RequiredViews.Passed ? "ok" : "unknown";
    }

    private static string GetIndexStatus(PacsContractProof proof, string indexName)
    {
        if (!proof.RequiredIndexes.Passed)
        {
            if (proof.RequiredIndexes.Details?.Contains(indexName) == true)
            {
                return "missing";
            }
        }
        return proof.RequiredIndexes.Passed ? "ok" : "unknown";
    }

    private static string ComputeManifestHash()
    {
        try
        {
            // Try to compute actual hash if file exists
            var basePath = AppContext.BaseDirectory;
            var specPath = Path.Combine(basePath, "..", "..", "..", "..", "..", "..", SpecLockPath);

            if (System.IO.File.Exists(specPath))
            {
                using var sha256 = SHA256.Create();
                using var stream = System.IO.File.OpenRead(specPath);
                var hash = sha256.ComputeHash(stream);
                return Convert.ToHexString(hash).ToLowerInvariant();
            }

            // Return placeholder if file not found (dev environment)
            return "speclock-not-found-in-runtime";
        }
        catch
        {
            return "hash-computation-failed";
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs (deterministic JSON structure)
// ═══════════════════════════════════════════════════════════════════════════

/// <summary>
/// PACS contract proof response.
/// </summary>
public sealed class PacsProofResponse
{
    public bool Enabled { get; init; }
    public ContractInfo Contract { get; init; } = new();
    public string DbName { get; init; } = "unknown";
    public string Server { get; init; } = "unknown";
    public DatabaseStatus Databases { get; init; } = new();
    public ViewStatus Views { get; init; } = new();
    public IndexStatus Indexes { get; init; } = new();
    public ProcedureStatus Procedures { get; init; } = new();
    public string HealthCheckExecution { get; init; } = "not_attempted";
    public DateTime LastVerifiedUtc { get; init; }
    public int LatencyMs { get; init; }
    public bool ReadOnly { get; init; }
    public bool ContractValid { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Warnings { get; init; } = Array.Empty<string>();
}

public sealed class ContractInfo
{
    public string Name { get; init; } = string.Empty;
    public string Version { get; init; } = string.Empty;
    public string ManifestSha256 { get; init; } = string.Empty;
}

public sealed class DatabaseStatus
{
    public string PacsOltp { get; init; } = "unknown";
    public string Ciaps { get; init; } = "unknown";
}

public sealed class ViewStatus
{
    public string VwTerraFusionPropertyCore { get; init; } = "unknown";
    public string VwTerraFusionPropertyOwnership { get; init; } = "unknown";
    public string VwTerraFusionAssessmentHistory { get; init; } = "unknown";
}

public sealed class IndexStatus
{
    public string IxTerraFusionPropertyGeoId { get; init; } = "unknown";
    public string IxTerraFusionPropertyValPropYear { get; init; } = "unknown";
    public string IxTerraFusionSitusProperty { get; init; } = "unknown";
}

public sealed class ProcedureStatus
{
    public string SpTerraFusionHealthCheck { get; init; } = "unknown";
}
