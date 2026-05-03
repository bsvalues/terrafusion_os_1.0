using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.API.Modules.Pilt.Routes;

/// <summary>
/// Minimal API route group for PILT (Payment In Lieu of Taxes) operations.
/// Owner suite: TerraDais (workflow / state management).
/// </summary>
public static class PiltRoutes
{
    /// <summary>
    /// Maps the <c>/api/pilt</c> route group to the endpoint router.
    /// </summary>
    public static RouteGroupBuilder MapPiltRoutes(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/pilt")
            .WithTags("PILT");

        // GET /api/pilt/payments — list all PILT payments (filtered by county context)
        group.MapGet("/payments", async (IServiceProvider sp) =>
        {
            var service = sp.GetRequiredService<IPiltService>();
            var payments = await service.ListPaymentsAsync();
            return Results.Ok(payments);
        })
        .WithName("ListPiltPayments")
        .WithSummary("List PILT payments for the current county context")
        .Produces(StatusCodes.Status200OK);

        // GET /api/pilt/payments/{id} — get a single PILT payment by ID
        group.MapGet("/payments/{id:guid}", async (Guid id, IServiceProvider sp) =>
        {
            var service = sp.GetRequiredService<IPiltService>();
            var payment = await service.GetPaymentAsync(id);
            return payment is not null
                ? Results.Ok(payment)
                : Results.NotFound();
        })
        .WithName("GetPiltPayment")
        .WithSummary("Retrieve a single PILT payment by identifier")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // POST /api/pilt/payments — create a new PILT payment record
        group.MapPost("/payments", async (PiltPaymentRequest request, IServiceProvider sp) =>
        {
            var service = sp.GetRequiredService<IPiltService>();
            var created = await service.CreatePaymentAsync(request);
            return Results.Created($"/api/pilt/payments/{created.Id}", created);
        })
        .WithName("CreatePiltPayment")
        .WithSummary("Record a new PILT payment")
        .Produces(StatusCodes.Status201Created);

        // PUT /api/pilt/payments/{id} — update an existing PILT payment
        group.MapPut("/payments/{id:guid}", async (Guid id, PiltPaymentRequest request, IServiceProvider sp) =>
        {
            var service = sp.GetRequiredService<IPiltService>();
            var updated = await service.UpdatePaymentAsync(id, request);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound();
        })
        .WithName("UpdatePiltPayment")
        .WithSummary("Update an existing PILT payment record")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // GET /api/pilt/summary — aggregate PILT statistics
        group.MapGet("/summary", async (IServiceProvider sp) =>
        {
            var service = sp.GetRequiredService<IPiltService>();
            var summary = await service.GetSummaryAsync();
            return Results.Ok(summary);
        })
        .WithName("GetPiltSummary")
        .WithSummary("Retrieve aggregate PILT payment statistics")
        .Produces(StatusCodes.Status200OK);

        return group;
    }
}

#region Service contract and DTOs

/// <summary>
/// Service contract for PILT payment operations.
/// </summary>
public interface IPiltService
{
    /// <summary>List all PILT payments visible to the current county context.</summary>
    Task<IReadOnlyList<PiltPaymentResponse>> ListPaymentsAsync(CancellationToken ct = default);

    /// <summary>Get a single PILT payment by its identifier.</summary>
    Task<PiltPaymentResponse?> GetPaymentAsync(Guid id, CancellationToken ct = default);

    /// <summary>Create a new PILT payment record.</summary>
    Task<PiltPaymentResponse> CreatePaymentAsync(PiltPaymentRequest request, CancellationToken ct = default);

    /// <summary>Update an existing PILT payment record.</summary>
    Task<PiltPaymentResponse?> UpdatePaymentAsync(Guid id, PiltPaymentRequest request, CancellationToken ct = default);

    /// <summary>Retrieve aggregate summary statistics for PILT payments.</summary>
    Task<PiltSummaryResponse> GetSummaryAsync(CancellationToken ct = default);
}

/// <summary>Inbound request DTO for creating or updating a PILT payment.</summary>
public sealed record PiltPaymentRequest(
    string PayingEntityName,
    string PayingEntityType,
    string ParcelId,
    int TaxYear,
    decimal PaymentAmount,
    DateTime PaymentDate,
    string? FederalProgramCode,
    string? Notes);

/// <summary>Outbound response DTO for a PILT payment.</summary>
public sealed record PiltPaymentResponse(
    Guid Id,
    string PayingEntityName,
    string PayingEntityType,
    string ParcelId,
    int TaxYear,
    decimal PaymentAmount,
    DateTime PaymentDate,
    string? FederalProgramCode,
    string CountyId,
    string Status,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Aggregate summary of PILT payments.</summary>
public sealed record PiltSummaryResponse(
    int TotalPayments,
    decimal TotalAmount,
    int DistinctEntities,
    int DistinctParcels,
    IReadOnlyDictionary<string, decimal> AmountByEntityType);

#endregion
