// =============================================================================
// SpecLock Ops Endpoints (MACHINE MODE + MYTHIC TIER)
// =============================================================================
// Exposes /ops/speclock for ops tooling to inspect manifest.
// Exposes /ops/speclock/proof for cryptographic proof chain (MYTHIC).
// Includes ETag for caching and conditional GET.
// =============================================================================

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Maps operational endpoints for SpecLock inspection.
/// </summary>
public static class SpecLockOpsEndpoints
{
    /// <summary>
    /// GET /ops/speclock - Returns raw manifest JSON
    /// GET /ops/speclock/proof - Returns cryptographic proof chain (MYTHIC)
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

        // ═══════════════════════════════════════════════════════════════
        // GOD-TIER: /ops/speclock/proof
        // Returns manifest + bundle + authority metadata for audit
        // Shows: who signed, time window, quorum status
        // ═══════════════════════════════════════════════════════════════
        group.MapGet("/speclock/proof", async (HttpContext ctx, IFileProvider files, IConfiguration cfg, ISpecLockManifestLoader loader) =>
        {
            var manifestPath = cfg["TF_SPECLOCK_MANIFEST_PATH"] ?? "artifacts/speclock/manifest.json";
            var bundlesPath = cfg["TF_SPECLOCK_BUNDLES_PATH"] ?? "artifacts/speclock/bundles";
            var authoritiesPath = cfg["TF_SPECLOCK_AUTHORITIES_PATH"] ?? "docs/spec-lock/AUTHORITIES.json";

            static string? FileSha256(IFileProvider files, string path)
            {
                var fi = files.GetFileInfo(path);
                if (!fi.Exists) return null;
                using var s = fi.CreateReadStream();
                return Convert.ToHexString(SHA256.HashData(s)).ToLowerInvariant();
            }

            // Load manifest for nbf/exp
            string? nbf = null, exp = null;
            try
            {
                var (manifest, _) = await loader.LoadAsync(ctx.RequestAborted);
                nbf = manifest.NotBefore;
                exp = manifest.ExpiresAt;
            }
            catch { /* ignore */ }

            // Enumerate authority bundles
            var bundles = new List<object>();
            var bundlesDir = files.GetDirectoryContents(bundlesPath);
            if (bundlesDir.Exists)
            {
                foreach (var file in bundlesDir.Where(f => !f.IsDirectory && f.Name.EndsWith(".bundle.json")))
                {
                    var authorityId = file.Name.Replace("manifest.", "").Replace(".bundle.json", "");
                    using var stream = file.CreateReadStream();
                    bundles.Add(new
                    {
                        authorityId,
                        path = Path.Combine(bundlesPath, file.Name),
                        sha256 = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant()
                    });
                }
            }

            // Try to load authorities registry
            object? authorities = null;
            var authFile = files.GetFileInfo(authoritiesPath);
            if (authFile.Exists)
            {
                try
                {
                    using var stream = authFile.CreateReadStream();
                    using var reader = new StreamReader(stream);
                    var json = await reader.ReadToEndAsync();
                    authorities = System.Text.Json.JsonSerializer.Deserialize<object>(json);
                }
                catch { /* ignore */ }
            }

            var payload = new
            {
                manifest = new
                {
                    path = manifestPath,
                    sha256 = FileSha256(files, manifestPath),
                    exists = files.GetFileInfo(manifestPath).Exists,
                    nbf,
                    exp
                },
                bundles,
                authorities,
                configuration = new
                {
                    signatureVerifyEnabled = string.Equals(
                        cfg["TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED"], "true", StringComparison.OrdinalIgnoreCase),
                    quorumMode = string.Equals(
                        cfg["TF_SPECLOCK_QUORUM_MODE"], "true", StringComparison.OrdinalIgnoreCase),
                    timeEnforcement = string.Equals(
                        cfg["TF_SPECLOCK_TIME_ENFORCEMENT"], "true", StringComparison.OrdinalIgnoreCase),
                    guardEnabled = string.Equals(
                        cfg["TF_SPECLOCK_GUARD_ENABLED"], "true", StringComparison.OrdinalIgnoreCase),
                    allowMissing = string.Equals(
                        cfg["TF_SPECLOCK_GUARD_ALLOW_MISSING"], "true", StringComparison.OrdinalIgnoreCase)
                },
                timestamp = DateTime.UtcNow.ToString("O")
            };

            ctx.Response.Headers.CacheControl = "no-store";
            return Results.Json(payload);
        })
        .WithName("GetSpecLockProof")
        .WithTags("Ops", "SpecLock", "GodTier")
        .Produces<object>(StatusCodes.Status200OK, "application/json");

        return app;
    }
}
