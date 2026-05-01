using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C53-CONS-B: severity level for one
/// <see cref="PacsSchemaInvariantResult"/>. Per the C53-CONS-A
/// policy, Error fails the build closed by default; Warning and
/// Advisory surface in the report only.
/// </summary>
public enum PacsSchemaInvariantSeverity
{
    /// <summary>Informational; never fails the build.</summary>
    Advisory = 1,

    /// <summary>Likely operator issue; surfaces in the report; build succeeds.</summary>
    Warning = 2,

    /// <summary>Catalog correctness compromised; build fails closed by default.</summary>
    Error = 3,
}

/// <summary>
/// Slice C53-CONS-B: one invariant result row produced by
/// <see cref="IPacsSchemaInvariantEngine"/>.
/// </summary>
/// <param name="Severity">Error / Warning / Advisory.</param>
/// <param name="Code">
/// Stable invariant code (e.g. <c>"TBL-002"</c>, <c>"FK-003"</c>).
/// Codes are versioned via <see cref="PacsSchemaInvariantReport.InvariantSetVersion"/>.
/// </param>
/// <param name="Message">Human-readable description.</param>
/// <param name="TableName">Locator (when applicable). <c>null</c> otherwise.</param>
/// <param name="ColumnName">
/// Column-level locator. When set, <see cref="TableName"/> MUST also be set.
/// </param>
/// <param name="Provenance">
/// HG6-source-traceable pointer back to the catalog record / manifest path.
/// </param>
public sealed record PacsSchemaInvariantResult(
    PacsSchemaInvariantSeverity Severity,
    string Code,
    string Message,
    string? TableName,
    string? ColumnName,
    string Provenance);

/// <summary>
/// Slice C53-CONS-B: full invariant report produced for one
/// catalog build. Versioned per the C53-CONS-A policy so consumers
/// may pin to a specific invariant-set revision.
/// </summary>
/// <param name="InvariantSetVersion">
/// Semver-shaped version of the invariant set. Bumps on every
/// future addition / removal of an invariant code.
/// </param>
/// <param name="ProducedAtUtc">UTC timestamp the report was produced.</param>
/// <param name="Results">Ordered list of result rows.</param>
public sealed record PacsSchemaInvariantReport(
    string InvariantSetVersion,
    DateTime ProducedAtUtc,
    IReadOnlyList<PacsSchemaInvariantResult> Results)
{
    /// <summary>Filter to Error rows.</summary>
    public IEnumerable<PacsSchemaInvariantResult> Errors =>
        Results.Where(r => r.Severity == PacsSchemaInvariantSeverity.Error);

    /// <summary>Filter to Warning rows.</summary>
    public IEnumerable<PacsSchemaInvariantResult> Warnings =>
        Results.Where(r => r.Severity == PacsSchemaInvariantSeverity.Warning);

    /// <summary>Filter to Advisory rows.</summary>
    public IEnumerable<PacsSchemaInvariantResult> Advisories =>
        Results.Where(r => r.Severity == PacsSchemaInvariantSeverity.Advisory);

    /// <summary>True when no Error rows are present.</summary>
    public bool IsClean => !Errors.Any();
}
