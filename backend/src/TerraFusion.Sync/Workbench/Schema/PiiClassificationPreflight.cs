using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C51-PII-D: default <see cref="IPiiClassificationPreflight"/>
/// implementation. Pure function over the catalog state — no I/O,
/// no caching, no logging. The caller is responsible for translating
/// <see cref="PiiClassificationPreflightOutcome.Fail"/> into a thrown
/// exception per the C51-PII-C policy.
///
/// <para>Hard guards observed:</para>
/// <list type="bullet">
/// <item>HG-PII-2: exhaustiveness is consulted via
/// <see cref="IPacsSchemaCatalog.IsTableExhaustivelyClassified"/>.
/// The strictest stance treats non-exhaustive as unverified.</item>
/// <item>HG-PII-3: stance is required, no default; the enum has no
/// Unspecified sentinel and zero / undefined values are rejected at
/// entry.</item>
/// <item>HG1 (catalog stays PII-free): the preflight reads
/// classification metadata; it does not read parcel rows.</item>
/// </list>
///
/// <para>Composite columns: the result reports the worst-PII match
/// (Direct &gt; Indirect &gt; None). The offending column name is
/// surfaced in the structured message when it differs from the
/// first column requested.</para>
/// </summary>
public sealed class PiiClassificationPreflight : IPiiClassificationPreflight
{
    /// <inheritdoc />
    public Task<PiiClassificationPreflightResult> ValidateAsync(
        IPacsSchemaCatalog catalog,
        string tableName,
        IReadOnlyList<string> columnNames,
        PiiClassificationPreflightStance stance,
        CancellationToken ct)
    {
        if (catalog is null)
        {
            throw new ArgumentNullException(nameof(catalog));
        }
        if (string.IsNullOrWhiteSpace(tableName))
        {
            throw new ArgumentException("Table name must be non-empty.", nameof(tableName));
        }
        if (columnNames is null)
        {
            throw new ArgumentNullException(nameof(columnNames));
        }
        if (columnNames.Count == 0)
        {
            throw new ArgumentException("At least one column name is required.", nameof(columnNames));
        }
        if (!Enum.IsDefined(typeof(PiiClassificationPreflightStance), stance) || (int)stance == 0)
        {
            throw new ArgumentException(
                $"PII preflight stance must be explicitly RequirePiiFreeCanonicalLanding, AllowIndirectWithCare, " +
                $"AllowDirectWithExplicitConsentAudit, or AllowAny; got '{stance}'. " +
                "Default-on-omission is forbidden by HG-PII-3.",
                nameof(stance));
        }

        foreach (var columnName in columnNames)
        {
            if (string.IsNullOrWhiteSpace(columnName))
            {
                throw new ArgumentException("Column names must be non-empty.", nameof(columnNames));
            }
        }

        var engaged = catalog.PiiManifestEngaged;
        var exhaustive = catalog.IsTableExhaustivelyClassified(tableName);

        // Resolve worst-PII across composite columns.
        var (firstClass, firstColumn) = ResolveColumnPii(catalog, tableName, columnNames[0]);
        var worstClass = firstClass;
        var worstColumn = firstColumn;
        for (int i = 1; i < columnNames.Count; i++)
        {
            var (cls, col) = ResolveColumnPii(catalog, tableName, columnNames[i]);
            if (PiiSeverity(cls) > PiiSeverity(worstClass))
            {
                worstClass = cls;
                worstColumn = col;
            }
        }

        var (outcomeKind, reason) = MapStanceClassToOutcome(stance, worstClass, engaged, exhaustive);

        if (outcomeKind == PiiClassificationPreflightOutcome.Pass)
        {
            return Task.FromResult(PiiClassificationPreflightResult.Pass(worstClass, engaged, exhaustive));
        }

        var message = BuildMessage(outcomeKind, tableName, columnNames, worstColumn, stance, worstClass, engaged, exhaustive, reason);
        return Task.FromResult(PiiClassificationPreflightResult.Fail(message, worstClass, engaged, exhaustive));
    }

    private static (PiiClassification cls, string column) ResolveColumnPii(
        IPacsSchemaCatalog catalog,
        string tableName,
        string columnName)
    {
        var col = catalog.TryGetColumn(tableName, columnName);
        if (col.HasValue && col.Value is not null)
        {
            return (col.Value.PiiClassification, columnName);
        }
        var t = catalog.TryGetTable(tableName);
        if (t.HasValue && t.Value is not null)
        {
            return (t.Value.PiiClassification, columnName);
        }
        return (PiiClassification.None, columnName);
    }

    private static int PiiSeverity(PiiClassification c) => c switch
    {
        PiiClassification.Direct   => 2,
        PiiClassification.Indirect => 1,
        PiiClassification.None     => 0,
        _ => 0,
    };

    /// <summary>
    /// Apply the C51-PII-C 3-axis outcome table:
    /// stance × classification × engagement-and-exhaustiveness.
    /// </summary>
    private static (PiiClassificationPreflightOutcome outcome, string reason) MapStanceClassToOutcome(
        PiiClassificationPreflightStance stance,
        PiiClassification classification,
        bool engaged,
        bool exhaustive)
    {
        switch (stance)
        {
            case PiiClassificationPreflightStance.AllowAny:
                return (PiiClassificationPreflightOutcome.Pass, "");

            case PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding:
                if (!engaged)
                    return (PiiClassificationPreflightOutcome.Fail,
                        "stance requires PII-free canonical landing; manifest is not engaged so None cannot be treated as verified-safe (HG-PII-3 backwards-compat bridge state)");
                if (!exhaustive)
                    return (PiiClassificationPreflightOutcome.Fail,
                        "stance requires PII-free canonical landing; table is engaged but NOT exhaustively classified (HG-PII-2 — un-tagged columns may be Direct)");
                if (classification != PiiClassification.None)
                    return (PiiClassificationPreflightOutcome.Fail,
                        $"stance requires PII-free canonical landing; matched classification is {classification}, not None");
                return (PiiClassificationPreflightOutcome.Pass, "");

            case PiiClassificationPreflightStance.AllowIndirectWithCare:
                if (!engaged)
                    return (PiiClassificationPreflightOutcome.Fail,
                        "stance allows None or Indirect under engaged manifest; manifest is not engaged so None cannot be distinguished from un-tagged-might-be-Direct");
                if (classification == PiiClassification.Direct)
                    return (PiiClassificationPreflightOutcome.Fail,
                        "stance allows Indirect with care but rejects Direct; matched classification is Direct");
                return (PiiClassificationPreflightOutcome.Pass, "");

            case PiiClassificationPreflightStance.AllowDirectWithExplicitConsentAudit:
                if (!engaged)
                    return (PiiClassificationPreflightOutcome.Fail,
                        "stance allows Direct under engaged manifest with operator-affirmed audit; manifest is not engaged");
                return (PiiClassificationPreflightOutcome.Pass, "");

            default:
                // Defensive — Enum.IsDefined is checked at entry.
                return (PiiClassificationPreflightOutcome.Pass, "");
        }
    }

    /// <summary>
    /// C51-PII-C binding format:
    /// [PiiClassificationPreflight] &lt;Outcome&gt; for '&lt;table&gt;(&lt;columns&gt;)' under &lt;stance&gt;:
    /// matched classification &lt;Classification&gt;, manifest &lt;engagement&gt;, table-exhaustive=&lt;bool&gt;. &lt;reason&gt;
    /// </summary>
    private static string BuildMessage(
        PiiClassificationPreflightOutcome outcome,
        string tableName,
        IReadOnlyList<string> columnNames,
        string offendingColumn,
        PiiClassificationPreflightStance stance,
        PiiClassification classification,
        bool engaged,
        bool exhaustive,
        string reason)
    {
        var columnsJoined = string.Join(", ", columnNames);
        var engagementLabel = engaged ? "engaged" : "not-engaged";
        var offendingNote = columnNames.Count > 1
            ? $" (offending column: '{offendingColumn}')"
            : string.Empty;
        return $"[PiiClassificationPreflight] {outcome} for '{tableName}({columnsJoined})'{offendingNote} under {stance}: " +
               $"matched classification {classification}, manifest {engagementLabel}, table-exhaustive={exhaustive}. {reason}";
    }
}
