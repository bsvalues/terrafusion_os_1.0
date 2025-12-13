// =============================================================================
// PublicProofEndpoints.cs (PHASE A: PROOF)
// =============================================================================
// Public citizen-verifiable proof endpoint.
// GET /public/proof/{receiptId} → Returns receipt + speclock_proof + verified
// =============================================================================

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Public proof endpoint mappings for citizen-verifiable receipts.
/// </summary>
public static class PublicProofEndpoints
{
    /// <summary>
    /// Maps the /public/proof/{receiptId} endpoint for receipt verification.
    /// </summary>
    public static IEndpointRouteBuilder MapPublicProof(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/public")
            .WithTags("PublicProof")
            .WithOpenApi();

        group.MapGet("/proof/{receiptId}", async (
            string receiptId,
            IPublicReceiptProofService proof,
            CancellationToken ct) =>
        {
            var result = await proof.BuildProofAsync(receiptId, ct);
            
            if (result == PublicProofResult.NotFound)
                return Results.NotFound(new { error = "receipt_not_found", receiptId });
            
            if (result is PublicProofResult.InvalidReceipt ir)
                return Results.BadRequest(new { error = "invalid_receipt", receiptId, details = ir.Details });
            
            if (result is PublicProofResult.Ok ok)
                return Results.Json(ok.Payload, contentType: "application/json; charset=utf-8");
            
            return Results.StatusCode(500);
        })
        .WithName("GetPublicProof")
        .WithDescription("Returns citizen-verifiable receipt proof with speclock manifest snapshot")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        return app;
    }
}
