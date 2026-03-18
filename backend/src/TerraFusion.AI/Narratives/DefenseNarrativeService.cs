using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.AI.Narratives;

/// <summary>
/// Request model for generating a BOE defense narrative.
/// </summary>
public class DefenseNarrativeRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public decimal CurrentValue { get; set; }
    public decimal PetitionerValue { get; set; }
    public string AppealBasis { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public int TaxYear { get; set; }
}

/// <summary>
/// Structured defense narrative output for BOE defense packets.
/// </summary>
public class DefenseNarrative
{
    public string SubjectDescription { get; set; } = string.Empty;
    public string MarketAnalysis { get; set; } = string.Empty;
    public string ApproachReconciliation { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public string ParcelId { get; set; } = string.Empty;
}

/// <summary>
/// LLM-powered defense narrative generation for BOE defense packets.
/// Takes parcel data + valuation evidence, produces structured narrative sections.
/// </summary>
public interface IDefenseNarrativeService
{
    /// <summary>
    /// Generate a structured defense narrative for a BOE appeal.
    /// </summary>
    Task<DefenseNarrative> GenerateAsync(
        string parcelId,
        DefenseNarrativeRequest request,
        CancellationToken ct = default);
}

/// <summary>
/// Stub implementation of defense narrative generation.
/// Produces placeholder narratives; real LLM integration comes in a later phase.
/// </summary>
public class DefenseNarrativeService : IDefenseNarrativeService
{
    public Task<DefenseNarrative> GenerateAsync(
        string parcelId,
        DefenseNarrativeRequest request,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var valueDiff = request.CurrentValue - request.PetitionerValue;
        var pctDiff = request.CurrentValue > 0
            ? Math.Round((valueDiff / request.CurrentValue) * 100, 1)
            : 0;

        var narrative = new DefenseNarrative
        {
            ParcelId = parcelId,
            GeneratedAt = DateTime.UtcNow,

            SubjectDescription =
                $"The subject property ({parcelId}) is a {request.PropertyType} " +
                $"located at {request.PropertyAddress}. The property is currently " +
                $"assessed at {request.CurrentValue:C0} for tax year {request.TaxYear}. " +
                $"The petitioner has requested a reduction to {request.PetitionerValue:C0}, " +
                $"a difference of {valueDiff:C0} ({pctDiff}%).",

            MarketAnalysis =
                $"Market analysis for the area surrounding {request.PropertyAddress} " +
                $"indicates current assessed values are consistent with recent comparable sales. " +
                $"The assessor's office has identified sufficient market evidence supporting " +
                $"the current valuation of {request.CurrentValue:C0}.",

            ApproachReconciliation =
                $"The cost approach, sales comparison approach, and income approach " +
                $"(where applicable) have been reconciled. The petitioner's basis for appeal " +
                $"is stated as: \"{request.AppealBasis}\". The reconciled value supports the " +
                $"current assessment.",

            Conclusion =
                $"Based on the evidence presented, the assessor's office recommends that " +
                $"the current assessed value of {request.CurrentValue:C0} for parcel {parcelId} " +
                $"be sustained. The petitioner's requested value of {request.PetitionerValue:C0} " +
                $"is not supported by the available market data.",
        };

        return Task.FromResult(narrative);
    }
}
