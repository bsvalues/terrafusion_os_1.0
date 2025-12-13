// =============================================================================
// SpecLock Ops Endpoints (MACHINE MODE)
// =============================================================================
// Exposes /ops/speclock for ops tooling to inspect manifest.
// Includes ETag for caching and conditional GET.
// =============================================================================

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Maps operational endpoints for SpecLock inspection.
/// </summary>
public static class SpecLockOpsEndpoints
{
    /// <summary>
    /// GET /ops/speclock
    /// Returns the raw manifest JSON (as built by scripts/speclock-manifest.py).
    /// Includes ETag based on sha256(rawJson) so ops tooling can cache.
    /// </summary>
    public static IEndpointRouteBuilder MapSpecLockOps(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/ops");

        // NOTE: Lock this down with your auth policy if needed:
        // group.RequireAuthorization("OpsOnly");
        // We intentionally do not assume policy names.

        group.MapGet("/speclock", async (HttpContext ctx, ISpecLockManifestLoader loader, CancellationToken ct) =>
        {
            try
            {
                var (manifest, raw) = await loader.LoadAsync(ct);

                // ETag = sha256(raw)
                var etag = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
                ctx.Response.Headers.ETag = $"\"{etag}\"";
                ctx.Response.Headers["X-TF-SpecLock-Index"] = manifest.IndexSha256;
                ctx.Response.Headers["X-TF-SpecLock-GeneratedAt"] = manifest.GeneratedAt;
                ctx.Response.Headers.CacheControl = "no-store";

                // Conditional GET
                var ifNoneMatch = ctx.Request.Headers.IfNoneMatch.ToString().Trim('\"');
                if (string.Equals(ifNoneMatch, etag, StringComparison.OrdinalIgnoreCase))
                    return Results.StatusCode(StatusCodes.Status304NotModified);

                return Results.Text(raw, "application/json; charset=utf-8");
            }
            catch (FileNotFoundException)
            {
                return Results.Problem(
                    title: "SpecLock manifest not found",
                    detail: "Run: python scripts/speclock-manifest.py",
                    statusCode: StatusCodes.Status404NotFound);
            }
        })
        .WithName("GetSpecLockManifest")
        .WithTags("Ops", "SpecLock")
        .Produces<string>(StatusCodes.Status200OK, "application/json")
        .Produces(StatusCodes.Status304NotModified)
        .Produces(StatusCodes.Status404NotFound);

        return app;
    }
}
