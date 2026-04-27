using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities.Sync.Mapping;

/// <summary>
/// Slice C2: one row per source column the operator has chosen to
/// canonically map (or explicitly defer) inside a
/// <see cref="SyncMappingWorkbook"/>. Mirrors the columns surfaced by
/// the C1 Mapping Workbook seed — but unlike the seed (which is a static
/// markdown artifact), this row is durable, reviewable, and updateable.
///
/// <para>Identity: <see cref="WorkbookId"/> + (<see cref="SourceSchema"/>,
/// <see cref="SourceTable"/>, <see cref="SourceColumn"/>) is the natural
/// key. The unique index on the EF configuration prevents the same column
/// from being added twice to one workbook.</para>
///
/// <para>The optional <see cref="CodeCandidateId"/> back-pointer is set
/// when the column was promoted from a <c>SyncProfileCodeCandidate</c>
/// row by the C1 seed; if the operator manually adds a column the
/// profiler didn't flag, the back-pointer stays null and the column
/// lives on its own evidence (whatever <see cref="DistinctCount"/> /
/// <see cref="DistinctRatio"/> the operator records). Not enforced as
/// a foreign key — a candidate row deletion (e.g. profile cleanup)
/// must not cascade-delete reviewed mapping decisions.</para>
///
/// <para><see cref="MappingLane"/> reflects the C1 seed's recommended
/// lanes ("Valuation classification", "Sales qualification",
/// "Improvement detail / Benton Method", "Land classification",
/// "Neighborhood / economic area") plus an "Other" escape valve.
/// String-typed for forward-compat. Required.</para>
///
/// <para><see cref="CanonicalTarget"/> is the operator's free-form
/// pointer to the canonical lane's destination — typically a canonical
/// table.column name, but kept loose because Slice C3+ owns canonical
/// schema authoring and the workbook should not assume final shape.</para>
///
/// <para><see cref="ReviewStatus"/>: <c>NeedsReview</c> (default —
/// nothing decided), <c>InProgress</c> (operator working on it),
/// <c>Mapped</c> (decision recorded; canonical target set; ready to
/// be consumed by C3+), <c>Excluded</c> (column reviewed, intentionally
/// not mapped — e.g. PII free-text), <c>Deferred</c> (decision parked,
/// needs more info or assessor input).</para>
/// </summary>
public sealed class SyncMappingColumn
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Denormalized for direct county-scoped queries; matches Workbook.CountyId.</summary>
    public Guid CountyId { get; set; }

    public Guid WorkbookId { get; set; }
    public SyncMappingWorkbook Workbook { get; set; } = null!;

    /// <summary>Optional pointer back to the SyncProfileCodeCandidate this column came from.</summary>
    public Guid? CodeCandidateId { get; set; }

    public string SourceSchema { get; set; } = "dbo";
    public string SourceTable { get; set; } = null!;
    public string SourceColumn { get; set; } = null!;

    /// <summary>
    /// One of: Valuation, Sales, Improvement, Land, Neighborhood, Other.
    /// Required. Max 64 chars.
    /// </summary>
    public string MappingLane { get; set; } = null!;

    /// <summary>
    /// Free-text canonical destination, e.g. "canonical.PropertyUseCode" or
    /// "Sales.QualificationFlag". Loose because canonical schema is owned
    /// by Slice C3+; the workbook records the operator's intent without
    /// pinning the final canonical name.
    /// </summary>
    public string? CanonicalTarget { get; set; }

    /// <summary>Snapshot of the candidate's distinct count at workbook-creation time.</summary>
    public int? DistinctCount { get; set; }

    /// <summary>Snapshot of the candidate's distinct ratio at workbook-creation time.</summary>
    public decimal? DistinctRatio { get; set; }

    /// <summary>
    /// NeedsReview / InProgress / Mapped / Excluded / Deferred.
    /// Default <c>NeedsReview</c>. Max 32 chars.
    /// </summary>
    public string ReviewStatus { get; set; } = "NeedsReview";

    /// <summary>Operator notes about this specific column; max 4000 chars.</summary>
    public string? Notes { get; set; }

    public ICollection<SyncMappingCodeValue> CodeValues { get; set; } = new List<SyncMappingCodeValue>();

    // FISMA-required audit fields — auto-populated by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
