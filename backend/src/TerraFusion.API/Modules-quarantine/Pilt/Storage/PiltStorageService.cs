using Microsoft.Extensions.Logging;
using TerraFusion.API.Modules.Pilt.Routes;

namespace TerraFusion.API.Modules.Pilt.Storage;

/// <summary>
/// Storage-layer contract for PILT payment persistence.
/// </summary>
public interface IPiltStorageService
{
    /// <summary>Persist a new PILT payment record.</summary>
    Task<PiltPaymentResponse> StorePaymentAsync(PiltPaymentRequest request, CancellationToken ct = default);

    /// <summary>Retrieve a single payment by its identifier.</summary>
    Task<PiltPaymentResponse?> GetPaymentAsync(Guid id, CancellationToken ct = default);

    /// <summary>List all payments visible to the current county context.</summary>
    Task<IReadOnlyList<PiltPaymentResponse>> ListPaymentsAsync(CancellationToken ct = default);

    /// <summary>Retrieve aggregate summary statistics.</summary>
    Task<PiltSummaryResponse> GetSummaryAsync(CancellationToken ct = default);
}

/// <summary>
/// Stub implementation of <see cref="IPiltStorageService"/>.
/// Uses EF Core DbContext pattern — currently returns placeholder data
/// until the full persistence layer is wired up.
/// Owner suite: TerraDais.
/// </summary>
public sealed class PiltStorageService : IPiltStorageService
{
    private readonly ILogger<PiltStorageService> _logger;

    // In-memory placeholder store until EF Core DbContext is wired.
    private static readonly List<PiltPaymentResponse> _store = new();
    private static readonly object _lock = new();

    public PiltStorageService(ILogger<PiltStorageService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<PiltPaymentResponse> StorePaymentAsync(PiltPaymentRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Storing PILT payment for entity {EntityName}, parcel {ParcelId}, tax year {TaxYear}",
            request.PayingEntityName, request.ParcelId, request.TaxYear);

        var now = DateTime.UtcNow;
        var record = new PiltPaymentResponse(
            Id: Guid.NewGuid(),
            PayingEntityName: request.PayingEntityName,
            PayingEntityType: request.PayingEntityType,
            ParcelId: request.ParcelId,
            TaxYear: request.TaxYear,
            PaymentAmount: request.PaymentAmount,
            PaymentDate: request.PaymentDate,
            FederalProgramCode: request.FederalProgramCode,
            CountyId: "BENTON", // Placeholder — resolved from county context at runtime
            Status: "Recorded",
            Notes: request.Notes,
            CreatedAt: now,
            UpdatedAt: now);

        lock (_lock)
        {
            _store.Add(record);
        }

        return Task.FromResult(record);
    }

    /// <inheritdoc />
    public Task<PiltPaymentResponse?> GetPaymentAsync(Guid id, CancellationToken ct = default)
    {
        _logger.LogInformation("Retrieving PILT payment {PaymentId}", id);

        PiltPaymentResponse? result;
        lock (_lock)
        {
            result = _store.FirstOrDefault(p => p.Id == id);
        }

        return Task.FromResult(result);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<PiltPaymentResponse>> ListPaymentsAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Listing all PILT payments");

        IReadOnlyList<PiltPaymentResponse> snapshot;
        lock (_lock)
        {
            snapshot = _store.ToList().AsReadOnly();
        }

        return Task.FromResult(snapshot);
    }

    /// <inheritdoc />
    public Task<PiltSummaryResponse> GetSummaryAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Computing PILT payment summary");

        PiltSummaryResponse summary;
        lock (_lock)
        {
            var amountByType = _store
                .GroupBy(p => p.PayingEntityType)
                .ToDictionary(g => g.Key, g => g.Sum(p => p.PaymentAmount));

            summary = new PiltSummaryResponse(
                TotalPayments: _store.Count,
                TotalAmount: _store.Sum(p => p.PaymentAmount),
                DistinctEntities: _store.Select(p => p.PayingEntityName).Distinct().Count(),
                DistinctParcels: _store.Select(p => p.ParcelId).Distinct().Count(),
                AmountByEntityType: amountByType);
        }

        return Task.FromResult(summary);
    }
}
