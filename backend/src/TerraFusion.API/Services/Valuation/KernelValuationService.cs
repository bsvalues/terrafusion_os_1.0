using System.Text.Json;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Core.DTOs.Kernel;

namespace TerraFusion.API.Services.Valuation;

/// <summary>
/// Thrown when a kernel subprocess fails during a Forge valuation compute chain.
/// Carries the typed <see cref="FailureMode"/> so callers can distinguish timeout,
/// missing-executable, kernel-reported-error, etc. and respond appropriately.
/// </summary>
public sealed class KernelValuationException : Exception
{
    public KernelFailureMode? FailureMode { get; }
    public KernelValuationException(string message, KernelFailureMode? mode, Exception? inner = null)
        : base(message, inner) => FailureMode = mode;
}

public class KernelValuationService : IKernelValuationService
{
    private readonly ICostKernelClient _costClient;
    private readonly IValuationKernelClient _valuationClient;
    private readonly ILogger<KernelValuationService> _logger;

    private static readonly JsonElement EmptyAttributes = JsonDocument.Parse("{}").RootElement;

    public KernelValuationService(
        ICostKernelClient costClient,
        IValuationKernelClient valuationClient,
        ILogger<KernelValuationService> logger)
    {
        _costClient = costClient;
        _valuationClient = valuationClient;
        _logger = logger;
    }

    public async Task<KernelCostApproachResponse> ComputeCostWithKernelAsync(
        KernelCostApproachRequest request,
        CancellationToken ct = default)
    {
        // 1. Cost kernel
        var costPayload = new CostKernelPayload(
            Subject: new CostSubject(request.ParcelId,
                new CostAttributes(request.Sqft, request.Quality, request.Condition)),
            Tables: new CostTables(request.BaseRate, request.Modifiers));

        var costResult = await _costClient.CalculateCostAsync(costPayload, ct);

        if (!costResult.Success || costResult.Data == null)
        {
            _logger.LogError(
                "Cost kernel failed for {ParcelId}: mode={FailureMode} msg={ErrorMessage}",
                request.ParcelId, costResult.FailureMode, costResult.ErrorMessage);
            throw new KernelValuationException(
                $"Cost kernel failed for {request.ParcelId}: {costResult.ErrorMessage}",
                costResult.FailureMode);
        }

        // 2. Valuation kernel — takes cost breakdown as input
        var valPayload = new ValuationKernelPayload(
            Subject: new ValuationSubject(request.ParcelId, EmptyAttributes),
            CostBreakdown: new ValuationCostBreakdown(
                costResult.Data.ReplacementCost,
                costResult.Data.Depreciation,
                costResult.Data.Rcnld),
            Model: new ValuationModel(
                request.LandValue,
                (request.NeighborhoodFactor.HasValue || request.LocationFactor.HasValue)
                    ? new AdjustmentFactors(request.NeighborhoodFactor, request.LocationFactor)
                    : null));

        var valResult = await _valuationClient.ValuateAsync(valPayload, ct);

        if (!valResult.Success || valResult.Data == null)
        {
            _logger.LogError(
                "Valuation kernel failed for {ParcelId}: mode={FailureMode} msg={ErrorMessage}",
                request.ParcelId, valResult.FailureMode, valResult.ErrorMessage);
            throw new KernelValuationException(
                $"Valuation kernel failed for {request.ParcelId}: {valResult.ErrorMessage}",
                valResult.FailureMode);
        }

        _logger.LogDebug(
            "Kernel compute succeeded for {ParcelId}: rcnld={Rcnld} total={TotalValue} costMs={CostMs} valMs={ValMs}",
            request.ParcelId, costResult.Data.Rcnld, valResult.Data.TotalValue,
            costResult.DurationMs, valResult.DurationMs);

        // 3. Compose domain response
        return new KernelCostApproachResponse(
            ParcelId: request.ParcelId,
            ReplacementCost: costResult.Data.ReplacementCost,
            Depreciation: costResult.Data.Depreciation,
            Rcnld: costResult.Data.Rcnld,
            LandValue: valResult.Data.Components.Land,
            BuildingValue: valResult.Data.Components.Building,
            TotalValue: valResult.Data.TotalValue,
            Provenance: new KernelProvenance(
                CostKernelHash: costResult.AuditEvent?.Hash ?? "unknown",
                ValuationKernelHash: valResult.AuditEvent?.Hash ?? "unknown",
                CostInputHash: costResult.InputHash,
                ValuationInputHash: valResult.InputHash,
                CostDurationMs: costResult.DurationMs,
                ValuationDurationMs: valResult.DurationMs,
                CostAuditEventId: costResult.AuditEvent?.EventId ?? "",
                ValuationAuditEventId: valResult.AuditEvent?.EventId ?? "",
                CostKernelBinarySha256: costResult.KernelBinarySha256,
                ValuationKernelBinarySha256: valResult.KernelBinarySha256));
    }
}
