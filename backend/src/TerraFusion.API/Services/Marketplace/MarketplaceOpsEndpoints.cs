// =============================================================================
// MarketplaceOpsEndpoints.cs (PHASE B: MARKETPLACE)
// =============================================================================
// Ops endpoints for plugin admission evidence and debugging.
// POST /ops/plugins/admission - Evaluate plugin admission request
// =============================================================================

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace TerraFusion.API.Services.Marketplace;

/// <summary>
/// Marketplace ops endpoint mappings for plugin admission debugging.
/// </summary>
public static class MarketplaceOpsEndpoints
{
    /// <summary>
    /// Maps the /ops/plugins/* endpoints for plugin admission.
    /// </summary>
    public static IEndpointRouteBuilder MapMarketplaceOps(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/ops/plugins")
            .WithTags("MarketplaceOps")
            .WithOpenApi();

        // POST /ops/plugins/admission - Evaluate plugin admission
        group.MapPost("/admission", async (
            PluginAdmissionRequest req,
            IPluginAdmissionService svc,
            CancellationToken ct) =>
        {
            var decision = await svc.EvaluateAsync(req, ct);
            return Results.Json(decision);
        })
        .WithName("EvaluatePluginAdmission")
        .WithDescription("Evaluate plugin admission request against PluginLock permissions")
        .Produces(StatusCodes.Status200OK);

        // GET /ops/plugins/permissions/{pluginId} - Get plugin permissions
        group.MapGet("/permissions/{pluginId}", async (
            string pluginId,
            IPluginAdmissionService svc,
            CancellationToken ct) =>
        {
            var perms = await svc.LoadPermissionsAsync(pluginId, ct);
            if (perms == null)
                return Results.NotFound(new { error = "plugin_not_found", pluginId });
            return Results.Json(perms);
        })
        .WithName("GetPluginPermissions")
        .WithDescription("Get PluginLock permissions for a plugin")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // GET /ops/plugins/health - Marketplace admission health
        group.MapGet("/health", () => Results.Json(new
        {
            status = "healthy",
            service = "PluginAdmissionService",
            timestamp = DateTime.UtcNow.ToString("o")
        }))
        .WithName("MarketplaceHealth")
        .WithDescription("Check marketplace admission service health")
        .Produces(StatusCodes.Status200OK);

        return app;
    }
}
