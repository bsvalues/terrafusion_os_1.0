using System;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C54-MULTI-D: identity-checked wrapper around
/// <see cref="PacsSchemaInvariantReportDiff.Compute"/> that enforces
/// the C54-MULTI-A ISOL-4 invariant ("invariant reports are
/// produced per catalog; report diffs compare within the same
/// catalog identity only") at the API surface.
///
/// <para>The underlying C53-CONS-E diff Compute method operates on
/// raw report records and cannot tell whether two reports came
/// from the same catalog identity — it just compares result rows
/// keyed by (Code, TableName, ColumnName). Two reports from
/// different counties may have overlapping row keys (e.g., both
/// catalogs flag <c>chg_of_owner.grantor_cv</c> as Direct PII)
/// even though the comparison is meaningless. C54-MULTI-D's helper
/// rejects mismatched identities at entry, before any diff work
/// runs.</para>
///
/// <para>Pure function over the inputs; no I/O, no mutation.</para>
/// </summary>
public static class PacsSchemaIdentityCheckedReportDiff
{
    /// <summary>
    /// Compute the diff between two invariant reports while
    /// asserting both reports come from the same catalog identity
    /// (matched on the <c>(CountyId, SourceConnectionId)</c>
    /// composite primary key).
    ///
    /// <para><see cref="PacsCatalogIdentity.PacsRelease"/> and
    /// <see cref="PacsCatalogIdentity.SchemaVersionHash"/> are
    /// expected to differ between previous and current — those are
    /// the per-build secondary identity surfaces, and a fresh
    /// build naturally produces a new hash.</para>
    ///
    /// <para>Null-previous-baseline is permitted (analog of
    /// <see cref="PacsSchemaInvariantReportDiff.Compute"/>'s
    /// null-previous behavior): when
    /// <paramref name="previousReport"/> is null, every current
    /// row is reported as Added. <paramref name="previousIdentity"/>
    /// is still required so the helper can confirm the operator
    /// knows which catalog they're establishing the baseline for.</para>
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="previousIdentity"/>,
    /// <paramref name="currentIdentity"/>, or
    /// <paramref name="currentReport"/> is null.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// The two identities have different
    /// <c>(CountyId, SourceConnectionId)</c> primary keys
    /// (ISOL-4 violation).
    /// </exception>
    public static PacsSchemaIdentityCheckedDiff Compute(
        PacsCatalogIdentity previousIdentity,
        PacsSchemaInvariantReport? previousReport,
        PacsCatalogIdentity currentIdentity,
        PacsSchemaInvariantReport currentReport)
    {
        if (previousIdentity is null) throw new ArgumentNullException(nameof(previousIdentity));
        if (currentIdentity is null) throw new ArgumentNullException(nameof(currentIdentity));
        if (currentReport is null) throw new ArgumentNullException(nameof(currentReport));

        if (!string.Equals(previousIdentity.CountyId, currentIdentity.CountyId, StringComparison.Ordinal) ||
            !string.Equals(previousIdentity.SourceConnectionId, currentIdentity.SourceConnectionId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"[PacsSchemaIdentityCheckedReportDiff] Catalog identity mismatch: " +
                $"previous=({previousIdentity.CountyId}, {previousIdentity.SourceConnectionId}); " +
                $"current=({currentIdentity.CountyId}, {currentIdentity.SourceConnectionId}). " +
                $"ISOL-4 (C54-MULTI-A) forbids cross-catalog report diff comparisons.");
        }

        var diff = PacsSchemaInvariantReportDiff.Compute(previousReport, currentReport);
        return new PacsSchemaIdentityCheckedDiff(
            CountyId:           currentIdentity.CountyId,
            SourceConnectionId: currentIdentity.SourceConnectionId,
            PreviousIdentity:   previousIdentity,
            CurrentIdentity:    currentIdentity,
            Diff:               diff);
    }
}

/// <summary>
/// Slice C54-MULTI-D: result of an identity-checked diff. Wraps
/// the underlying <see cref="PacsSchemaInvariantReportDiff"/> with
/// the catalog identity context that the bare diff record lacks.
/// </summary>
/// <param name="CountyId">
/// Primary-key CountyId shared by both reports.
/// </param>
/// <param name="SourceConnectionId">
/// Primary-key SourceConnectionId shared by both reports.
/// </param>
/// <param name="PreviousIdentity">
/// Full identity of the previous report (PacsRelease and
/// SchemaVersionHash may differ from current).
/// </param>
/// <param name="CurrentIdentity">Full identity of the current report.</param>
/// <param name="Diff">
/// The underlying C53-CONS-E diff, computed only after identity
/// validation passes.
/// </param>
public sealed record PacsSchemaIdentityCheckedDiff(
    string CountyId,
    string SourceConnectionId,
    PacsCatalogIdentity PreviousIdentity,
    PacsCatalogIdentity CurrentIdentity,
    PacsSchemaInvariantReportDiff Diff);
