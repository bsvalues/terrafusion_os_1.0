using System.Text.Json;
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// WS-1 — a persisted Forge valuation for a parcel+year: the reconciled indicated value with its
/// explanation and approach breakdown (JSON). Audit-stamped via WS-3 (<see cref="IAuditableEntity"/>),
/// county-scoped, and tagged with the engine version for determinism/provenance. Retrievable by
/// (CountyId, TfParcelId, Year). This is Forge's explanation store; the authoritative value column
/// on TfAssessment is written separately through the Forge write-lane.
/// </summary>
public sealed class ParcelValuation : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public Guid TfParcelId { get; set; }
    public int Year { get; set; }
    public string PropertyType { get; set; } = string.Empty;

    /// <summary>Whether the engine produced an authoritative value (false = incomplete inputs).</summary>
    public bool Found { get; set; }

    public decimal IndicatedValue { get; set; }

    /// <summary>JSON-serialized approach breakdown (approach, indicated value, weight, contribution).</summary>
    public string BreakdownJson { get; set; } = "[]";

    public string Explanation { get; set; } = string.Empty;
    public string CalibrationStatus { get; set; } = "NotEvaluated";

    /// <summary>Engine version for reproducibility/provenance.</summary>
    public string EngineVersion { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string? UpdatedBy { get; set; }

    /// <summary>Maps a reconciled <see cref="ValuationResult"/> to a persistable row.</summary>
    public static ParcelValuation FromResult(ValuationResult result, string engineVersion)
        => new()
        {
            CountyId = result.CountyId,
            TfParcelId = result.ParcelId,
            Year = result.Year,
            PropertyType = result.PropertyType,
            Found = result.Found,
            IndicatedValue = result.IndicatedValue,
            BreakdownJson = JsonSerializer.Serialize(result.Breakdown),
            Explanation = result.Explanation,
            CalibrationStatus = result.CalibrationStatus,
            EngineVersion = engineVersion,
        };
}
