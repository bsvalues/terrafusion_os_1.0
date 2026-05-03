// ---------------------------------------------------------------------------
// COMPILE STUBS — TerraFusion.API.Models (legacy missing types)
// ---------------------------------------------------------------------------
// These types were removed or moved but some controllers still reference them.
// Stubs allow the API project to compile.
// ---------------------------------------------------------------------------

namespace TerraFusion.API.Models;

/// <summary>
/// Generic error response for 503 / fault responses.
/// Used by ProductionPACSIntegrationController and ElitePerformanceMonitoringController.
/// </summary>
public sealed class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public string[]? Details { get; set; }
}

/// <summary>
/// Status payload returned by the production PACS integration bridge.
/// Legacy endpoint — always returns 503 in the normal TerraFusion runtime.
/// </summary>
public sealed class ProductionIntegrationStatus
{
    public string Status { get; set; } = "legacy-production-pacs-bridge-disabled";
    public string Source { get; set; } = "production-pacs-controller-truth-gate";
}

/// <summary>
/// Result payload for the PACS emergency protocol endpoint.
/// Legacy endpoint — always returns 503 in the normal TerraFusion runtime.
/// </summary>
public sealed class EmergencyProtocolResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Source { get; set; } = "production-pacs-controller-truth-gate";
}
