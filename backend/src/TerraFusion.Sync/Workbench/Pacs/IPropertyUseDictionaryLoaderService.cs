using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C22-B: read-only loader that produces a proposed review
/// CSV by joining the workbook's Deferred property_use_cd
/// code-values against PACS's <c>dbo.property_use</c> dictionary.
///
/// <para>Per <c>docs/sync/property-use-dictionary-loader-policy.md</c>
/// (C22-A), the service:
/// <list type="bullet">
/// <item>NEVER calls <c>SaveChangesAsync</c> against the workbook.</item>
/// <item>NEVER mutates PACS.</item>
/// <item>Applies the M1-M5 mismatch rules in the policy:
///   <list type="bullet">
///     <item>M1 — workbook code missing from dictionary → Deferred + integrity note</item>
///     <item>M2 — dictionary code unobserved in workbook → not in CSV</item>
///     <item>M3 — duplicate dictionary code → Deferred + ambiguity note</item>
///     <item>M4 — inactive dictionary row → Deferred + inactive note</item>
///     <item>M5 — clean match (active, unambiguous) → proposed Mapped</item>
///   </list>
/// </item>
/// <item>Emits RFC 4180-quoted CSV per the C17-A2 / C19-B / C20-A
///   precedent; commas and quotes in dictionary descriptions are
///   handled.</item>
/// </list>
/// </para>
/// </summary>
public interface IPropertyUseDictionaryLoaderService
{
    /// <summary>
    /// Run the loader against a workbook + a PACS dictionary read.
    /// Returns proposed CSV rows + classification counts. The
    /// service does not write the CSV to disk — the caller
    /// (CLI dispatcher) handles file output so the service stays
    /// pure.
    /// </summary>
    Task<PropertyUseDictionaryLoaderResult> ProposeReviewCsvAsync(
        Guid countyId,
        Guid workbookId,
        PropertyUseDictionaryColumnConfig dictionaryColumns,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-county configuration of which columns in
/// <c>dbo.property_use</c> carry the code / description / active /
/// year semantics. Populated from the C22-A "live inspection
/// required" gate output. C22-A explicitly forbids hardcoding
/// these column names.
/// </summary>
/// <param name="CodeColumn">
/// The dictionary column whose value matches workbook
/// <c>SyncMappingCodeValue.SourceValue</c> for property_use_cd.
/// PACS commonly names this <c>property_use_cd</c>.
/// </param>
/// <param name="DescriptionColumn">
/// The human-readable description column (e.g. <c>property_use_desc</c>).
/// Used as the proposed <c>canonical_value</c> for M5 clean-match
/// rows. <c>null</c> when the dictionary has no description column;
/// the loader proposes the code itself as the canonical value in
/// that case (operator can rephrase during C22-C review).
/// </param>
/// <param name="ActiveFlagColumn">
/// Column carrying the active / inactive indicator. <c>null</c>
/// when the dictionary has no active flag (M4 cannot fire).
/// </param>
/// <param name="ActiveFlagPredicate">
/// Operator-supplied predicate string interpreted by the loader's
/// <see cref="IsRowActive"/> helper. Examples:
/// <c>"inactive_dt IS NULL"</c>, <c>"active_flag = 'Y'"</c>,
/// <c>"sys_flag &lt;&gt; 'I'"</c>. <c>null</c> when no active flag
/// applies.
/// </param>
/// <param name="YearColumn">
/// Column carrying the year/version when the dictionary is
/// year-keyed. <c>null</c> when the dictionary is universe-wide.
/// Per D0-D, year-keyed dictionaries should be filtered to
/// <c>pacs_system.appr_yr</c> by default.
/// </param>
public sealed record PropertyUseDictionaryColumnConfig(
    string CodeColumn,
    string? DescriptionColumn,
    string? ActiveFlagColumn,
    string? ActiveFlagPredicate,
    string? YearColumn);

/// <summary>
/// Loader output: proposed CSV rows + classification counts +
/// pre-state confirmation. Caller (CLI) writes the CSV to
/// <c>backend/artifacts/sync-atlas/c22-b/&lt;run-id&gt;/property-use-review.csv</c>.
/// </summary>
public sealed record PropertyUseDictionaryLoaderResult(
    Guid WorkbookId,
    int WorkbookDeferredRows,
    int DictionaryRowsRead,
    int M1WorkbookCodeMissingFromDictionary,
    int M2DictionaryCodeUnobservedInWorkbook,
    int M3DuplicateDictionaryCode,
    int M4InactiveDictionaryRow,
    int M5CleanMatch,
    IReadOnlyList<ProposedReviewCsvRow> ProposedRows);

/// <summary>
/// One proposed CSV row in the C11-A grammar shape. Caller serializes
/// these to the actual CSV file with RFC 4180 quoting applied.
/// </summary>
public sealed record ProposedReviewCsvRow(
    string Scope,
    string SourceSchema,
    string SourceTable,
    string SourceColumn,
    string SourceValue,
    string ReviewStatus,
    string? CanonicalTarget,
    string? CanonicalValue,
    bool? CanonicalValueNull,
    bool? IsExcluded,
    string Notes,
    PropertyUseClassification Classification);

/// <summary>The M1-M5 classification per row.</summary>
public enum PropertyUseClassification
{
    /// <summary>M1: workbook code observed but missing from dictionary.</summary>
    WorkbookCodeMissingFromDictionary = 1,
    /// <summary>M3: multiple dictionary rows with the same code; ambiguous.</summary>
    DuplicateDictionaryCode = 3,
    /// <summary>M4: dictionary row exists but is inactive.</summary>
    InactiveDictionaryRow = 4,
    /// <summary>M5: clean active unambiguous match.</summary>
    CleanMatch = 5,
}
