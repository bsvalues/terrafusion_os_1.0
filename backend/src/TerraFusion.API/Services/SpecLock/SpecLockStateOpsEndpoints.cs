// SpecLock State Mesh Ops Endpoints
// Provides /ops/speclock/state/proof for federated state verification
// Part of TerraFusion OS governance infrastructure

using System.Security.Cryptography;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// State Mesh operations endpoints for federated county quorum verification.
/// Returns SHA256 proofs for state authorities and TSS artifacts.
/// </summary>
public static class SpecLockStateOpsEndpoints
{
    /// <summary>
    /// Maps the /ops/speclock/state endpoints for state mesh verification.
    /// </summary>
    public static IEndpointRouteBuilder MapSpecLockStateOps(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/ops/speclock/state").WithTags("SpecLockStateOps");

        // GET /ops/speclock/state/proof
        // Returns SHA256 hashes of all state mesh artifacts for verification
        group.MapGet("/proof", (IFileProvider files) =>
        {
            string ComputeSha256(string path)
            {
                var fi = files.GetFileInfo(path);
                if (!fi.Exists) return "";
                using var stream = fi.CreateReadStream();
                using var hasher = SHA256.Create();
                return Convert.ToHexString(hasher.ComputeHash(stream)).ToLowerInvariant();
            }

            var authPath = "docs/spec-lock/AUTHORITIES.state.json";
            var pubPath = "artifacts/speclock/tss/state/group.pub";
            var sigPath = "artifacts/speclock/tss/state/manifest.sig";
            var proofPath = "artifacts/speclock/tss/state/manifest.proof.json";

            var payload = new
            {
                scope = "state_mesh",
                authorities = new { path = authPath, sha256 = ComputeSha256(authPath) },
                tssGroupPublicKey = new { path = pubPath, sha256 = ComputeSha256(pubPath) },
                tssSignature = new { path = sigPath, sha256 = ComputeSha256(sigPath) },
                tssProof = new { path = proofPath, sha256 = ComputeSha256(proofPath) }
            };

            return Results.Json(payload);
        })
        .WithName("GetStateMeshProof")
        .WithDescription("Returns SHA256 proofs for state mesh authorities and TSS artifacts")
        .Produces(200);

        return app;
    }
}
