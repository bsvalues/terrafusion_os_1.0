using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C22-B / C23-B: read-only loader that produces a proposed
/// review CSV by joining a workbook's Deferred code-values against
/// a PACS dictionary table.
///
/// <para>The original C22-B implementation was hardcoded to
/// <c>property_val.property_use_cd</c> ↔ <c>dbo.property_use</c>.
/// C23-B generalized the service to take a
/// <see cref="DictionaryLoaderTargetConfig"/> so the same M1-M5
/// machinery can drive every PACS-dictionary-backed lane (property_use,
/// imprv_det_class, land_soil, imprv_det_meth, imprv_det_sub_class,
/// nbhd_codes…). Per the C22-A / C23-A policies, the service:</para>
///
/// <list type="bullet">
/// <item>NEVER calls <c>SaveChangesAsync</c> against the workbook.</item>
/// <item>NEVER mutates PACS.</item>
/// <item>Applies the M1-M5 mismatch rules in the policies:
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
///   handled by the CLI dispatcher.</item>
/// </list>
/// </summary>
public interface IDictionaryLoaderService
{
    /// <summary>
    /// Run the loader against a workbook + a PACS dictionary read.
    /// Returns proposed CSV rows + classification counts. The
    /// service does not write the CSV to disk — the caller
    /// (CLI dispatcher) handles file output so the service stays
    /// pure.
    /// </summary>
    Task<DictionaryLoaderResult> ProposeReviewCsvAsync(
        Guid countyId,
        Guid workbookId,
        DictionaryLoaderTargetConfig target,
        DictionaryColumnConfig dictionaryColumns,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-loader target configuration. Identifies the workbook source
/// triple (schema/table/column) being driven against the named PACS
/// dictionary table, plus the canonical-target vocabulary used for
/// M5 fallback values.
///
/// <para>Hardcoding any of these in the service was the C22-B
/// shortcut. C23-B externalizes them so the next dictionary
/// (imprv_det_class) is a Program.cs config branch, not a new service
/// class.</para>
/// </summary>
/// <param name="WorkbookSourceSchema">
/// Source schema of the workbook column being mapped — typically
/// <c>"dbo"</c>.
/// </param>
/// <param name="WorkbookSourceTable">
/// Source table of the workbook column — e.g. <c>"property_val"</c>
/// or <c>"imprv_detail"</c>.
/// </param>
/// <param name="WorkbookSourceColumn">
/// Source column of the workbook column — e.g. <c>"property_use_cd"</c>
/// or <c>"imprv_det_class_cd"</c>.
/// </param>
/// <param name="PacsDictionarySchema">
/// PACS dictionary schema — typically <c>"dbo"</c>.
/// </param>
/// <param name="PacsDictionaryTable">
/// PACS dictionary table name — e.g. <c>"property_use"</c> or
/// <c>"imprv_det_class"</c>. Must be allowlisted in
/// <see cref="TerraFusion.Tools.SyncAtlas.CliArgs.IsAllowedPacsDictionaryTable"/>.
/// </param>
/// <param name="CanonicalTargetName">
/// The canonical-target vocabulary string the loader uses for the M5
/// fallback canonical_value (when the dictionary has no description
/// column). E.g. <c>"PropertyUse"</c> or <c>"ImprvDetailClass"</c>.
/// Operator can rephrase per row at the C22-C / C23-C apply pass.
/// </param>
public sealed record DictionaryLoaderTargetConfig(
    string WorkbookSourceSchema,
    string WorkbookSourceTable,
    string WorkbookSourceColumn,
    string PacsDictionarySchema,
    string PacsDictionaryTable,
    string CanonicalTargetName);

/// <summary>
/// Per-county configuration of which columns in the PACS dictionary
/// table carry the code / description / active / year semantics.
/// Populated from the C22-A / C23-A "live inspection required" gate
/// outputs. The policies explicitly forbid hardcoding these column
/// names — different PACS deployments shape these tables differently.
/// </summary>
/// <param name="CodeColumn">
/// The dictionary column whose value matches workbook
/// <c>SyncMappingCodeValue.SourceValue</c>. PACS commonly names this
/// after the workbook column (e.g. <c>property_use_cd</c>,
/// <c>imprv_det_class_cd</c>).
/// </param>
/// <param name="DescriptionColumn">
/// The human-readable description column (e.g.
/// <c>property_use_desc</c>, <c>imprv_det_class_desc</c>). Used as
/// the proposed <c>canonical_value</c> for M5 clean-match rows.
/// <c>null</c> when the dictionary has no description column; the
/// loader proposes <c>"{CanonicalTargetName}:{code}"</c> as the
/// canonical value in that case.
/// </param>
/// <param name="ActiveFlagColumn">
/// Column carrying the active / inactive indicator. <c>null</c>
/// when the dictionary has no active flag (M4 cannot fire).
/// </param>
/// <param name="ActiveFlagPredicate">
/// Operator-supplied predicate string interpreted by the loader's
/// internal active-row helper. Examples: <c>"inactive_dt IS NULL"</c>,
/// <c>"active_flag = 'Y'"</c>, <c>"sys_flag &lt;&gt; 'I'"</c>.
/// <c>null</c> when no active flag applies.
/// </param>
/// <param name="YearColumn">
/// Column carrying the year/version when the dictionary is
/// year-keyed. <c>null</c> when the dictionary is universe-wide.
/// Per D0-D, year-keyed dictionaries should be filtered to
/// <c>pacs_system.appr_yr</c> by default.
/// </param>
public sealed record DictionaryColumnConfig(
    string CodeColumn,
    string? DescriptionColumn,
    string? ActiveFlagColumn,
    string? ActiveFlagPredicate,
    string? YearColumn);

/// <summary>
/// Loader output: proposed CSV rows + classification counts +
/// pre-state confirmation. Caller (CLI) writes the CSV to
/// <c>backend/artifacts/sync-atlas/&lt;slice&gt;/&lt;run-id&gt;/&lt;table&gt;-proposed-review.csv</c>.
/// </summary>
public sealed record DictionaryLoaderResult(
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
    DictionaryRowClassification Classification);

/// <summary>The M1-M5 classification per row.</summary>
public enum DictionaryRowClassification
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
