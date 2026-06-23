namespace TerraFusion.Core.Entities;

/// <summary>
/// Marker contract for entities whose audit provenance is stamped automatically by
/// the AuditableEntityInterceptor (WS-3 / AU-2). Property signatures match the audit
/// fields already present on entities such as <see cref="PropertyAssessment"/>:
/// CreatedBy is required (defaults to "system"), UpdatedBy is nullable until first write.
///
/// Apply this interface ONLY to entities that already carry all four fields. Adding it
/// to a new entity opts that entity into automatic stamping + audit-row emission.
/// </summary>
public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
    string CreatedBy { get; set; }
    string? UpdatedBy { get; set; }
}
