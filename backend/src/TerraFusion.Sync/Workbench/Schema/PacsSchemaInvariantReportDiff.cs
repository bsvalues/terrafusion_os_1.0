using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C53-CONS-E: structured diff between two
/// <see cref="PacsSchemaInvariantReport"/>s. Used by catalog-build
/// CI / audit dashboards to surface "what got better, what got
/// worse" between two builds without eyeballing two JSON dumps.
///
/// <para>Pure function over the in-memory reports; no I/O. Diff
/// is keyed by <c>(Code, TableName, ColumnName)</c> — the natural
/// identity of a result row.</para>
///
/// <para>Three categories of change:</para>
/// <list type="bullet">
/// <item><see cref="Added"/> — rows in current that have no match
/// in previous (regression: a new violation surfaced).</item>
/// <item><see cref="Removed"/> — rows in previous that have no
/// match in current (improvement: a violation was fixed).</item>
/// <item><see cref="SeverityChanged"/> — rows whose
/// <c>(Code, TableName, ColumnName)</c> matches but whose
/// <see cref="PacsSchemaInvariantResult.Severity"/> differs
/// (could be either improvement or regression depending on
/// direction).</item>
/// </list>
///
/// <para>Plus per-severity count deltas
/// (<see cref="ErrorDelta"/>, <see cref="WarningDelta"/>,
/// <see cref="AdvisoryDelta"/>) for header-level dashboards.</para>
/// </summary>
/// <param name="PreviousInvariantSetVersion">
/// Invariant-set version of the previous report. May differ from
/// <see cref="CurrentInvariantSetVersion"/> when the set itself
/// has bumped between builds — surfaces explicitly so consumers
/// can interpret the diff in context.
/// </param>
/// <param name="CurrentInvariantSetVersion">Current report's set version.</param>
/// <param name="PreviousProducedAtUtc">Timestamp of the previous report.</param>
/// <param name="CurrentProducedAtUtc">Timestamp of the current report.</param>
/// <param name="Added">Result rows present in current but not previous.</param>
/// <param name="Removed">Result rows present in previous but not current.</param>
/// <param name="SeverityChanged">Rows where severity flipped between reports.</param>
/// <param name="ErrorDelta">Count delta for Error severity.</param>
/// <param name="WarningDelta">Count delta for Warning severity.</param>
/// <param name="AdvisoryDelta">Count delta for Advisory severity.</param>
public sealed record PacsSchemaInvariantReportDiff(
    string PreviousInvariantSetVersion,
    string CurrentInvariantSetVersion,
    DateTime PreviousProducedAtUtc,
    DateTime CurrentProducedAtUtc,
    IReadOnlyList<PacsSchemaInvariantResult> Added,
    IReadOnlyList<PacsSchemaInvariantResult> Removed,
    IReadOnlyList<PacsSchemaInvariantSeverityChange> SeverityChanged,
    PacsSchemaInvariantCountDelta ErrorDelta,
    PacsSchemaInvariantCountDelta WarningDelta,
    PacsSchemaInvariantCountDelta AdvisoryDelta)
{
    /// <summary>
    /// True when the diff has no Added / Removed / SeverityChanged
    /// rows — i.e. the two reports are equivalent at the
    /// (Code, TableName, ColumnName, Severity) level.
    /// </summary>
    public bool IsUnchanged =>
        Added.Count == 0 &&
        Removed.Count == 0 &&
        SeverityChanged.Count == 0;

    /// <summary>
    /// Compute the diff between two invariant reports.
    /// </summary>
    /// <param name="previous">
    /// The earlier report. May be null on the first build of a
    /// catalog (no prior baseline) — in that case the diff treats
    /// every current row as Added.
    /// </param>
    /// <param name="current">The later report. Required.</param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="current"/> is null.
    /// </exception>
    public static PacsSchemaInvariantReportDiff Compute(
        PacsSchemaInvariantReport? previous,
        PacsSchemaInvariantReport current)
    {
        if (current is null) throw new ArgumentNullException(nameof(current));

        // Null-previous baseline: every current row counts as Added,
        // every count delta runs from zero.
        if (previous is null)
        {
            return new PacsSchemaInvariantReportDiff(
                PreviousInvariantSetVersion: "(none)",
                CurrentInvariantSetVersion: current.InvariantSetVersion,
                PreviousProducedAtUtc: DateTime.MinValue,
                CurrentProducedAtUtc: current.ProducedAtUtc,
                Added: current.Results.ToArray(),
                Removed: Array.Empty<PacsSchemaInvariantResult>(),
                SeverityChanged: Array.Empty<PacsSchemaInvariantSeverityChange>(),
                ErrorDelta: new PacsSchemaInvariantCountDelta(0, current.Errors.Count()),
                WarningDelta: new PacsSchemaInvariantCountDelta(0, current.Warnings.Count()),
                AdvisoryDelta: new PacsSchemaInvariantCountDelta(0, current.Advisories.Count()));
        }

        // Index both reports by (Code, TableName, ColumnName) for
        // quick lookup. We keep the FIRST occurrence under each key
        // when duplicates appear (in practice the engine's invariant
        // codes have unique (Code, table-locator) keys per row, so
        // dupes don't occur, but we're defensive).
        var prevIndex = IndexResults(previous.Results);
        var currIndex = IndexResults(current.Results);

        var added = new List<PacsSchemaInvariantResult>();
        var removed = new List<PacsSchemaInvariantResult>();
        var severityChanged = new List<PacsSchemaInvariantSeverityChange>();

        foreach (var (key, currRow) in currIndex)
        {
            if (!prevIndex.TryGetValue(key, out var prevRow))
            {
                added.Add(currRow);
            }
            else if (prevRow.Severity != currRow.Severity)
            {
                severityChanged.Add(new PacsSchemaInvariantSeverityChange(
                    Code: currRow.Code,
                    TableName: currRow.TableName,
                    ColumnName: currRow.ColumnName,
                    PreviousSeverity: prevRow.Severity,
                    CurrentSeverity: currRow.Severity));
            }
        }

        foreach (var (key, prevRow) in prevIndex)
        {
            if (!currIndex.ContainsKey(key))
            {
                removed.Add(prevRow);
            }
        }

        return new PacsSchemaInvariantReportDiff(
            PreviousInvariantSetVersion: previous.InvariantSetVersion,
            CurrentInvariantSetVersion: current.InvariantSetVersion,
            PreviousProducedAtUtc: previous.ProducedAtUtc,
            CurrentProducedAtUtc: current.ProducedAtUtc,
            Added: added,
            Removed: removed,
            SeverityChanged: severityChanged,
            ErrorDelta: new PacsSchemaInvariantCountDelta(
                Previous: previous.Errors.Count(),
                Current: current.Errors.Count()),
            WarningDelta: new PacsSchemaInvariantCountDelta(
                Previous: previous.Warnings.Count(),
                Current: current.Warnings.Count()),
            AdvisoryDelta: new PacsSchemaInvariantCountDelta(
                Previous: previous.Advisories.Count(),
                Current: current.Advisories.Count()));
    }

    private static Dictionary<DiffKey, PacsSchemaInvariantResult> IndexResults(
        IReadOnlyList<PacsSchemaInvariantResult> rows)
    {
        var index = new Dictionary<DiffKey, PacsSchemaInvariantResult>();
        foreach (var r in rows)
        {
            var key = new DiffKey(r.Code, r.TableName, r.ColumnName);
            if (!index.ContainsKey(key))
            {
                index[key] = r;
            }
        }
        return index;
    }

    private readonly record struct DiffKey(string Code, string? TableName, string? ColumnName);
}

/// <summary>
/// Slice C53-CONS-E: one severity flip in a
/// <see cref="PacsSchemaInvariantReportDiff"/>. The
/// <c>(Code, TableName, ColumnName)</c> matched between the two
/// reports but the severity differs. Useful for surfacing
/// suppression-list changes (Error → Warning) or unsuppressed
/// regressions (Warning → Error).
/// </summary>
public sealed record PacsSchemaInvariantSeverityChange(
    string Code,
    string? TableName,
    string? ColumnName,
    PacsSchemaInvariantSeverity PreviousSeverity,
    PacsSchemaInvariantSeverity CurrentSeverity);

/// <summary>
/// Slice C53-CONS-E: per-severity count delta between two reports.
/// </summary>
/// <param name="Previous">Count in the previous report.</param>
/// <param name="Current">Count in the current report.</param>
public sealed record PacsSchemaInvariantCountDelta(int Previous, int Current)
{
    /// <summary>Current minus previous (positive = regression on this severity).</summary>
    public int Diff => Current - Previous;
}
