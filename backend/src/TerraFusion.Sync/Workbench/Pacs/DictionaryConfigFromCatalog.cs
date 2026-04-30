using System;
using TerraFusion.Sync.Workbench.Schema;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C48-G: first consumer migration of the
/// <c>pacs_schema_catalog</c>. Builds a
/// <see cref="DictionaryLoaderTargetConfig"/> +
/// <see cref="DictionaryColumnConfig"/> pair from the catalog
/// instead of hand-typed table/column tuples.
///
/// <para>The PACS-side parts of the config (dictionary table name,
/// code column, description column) come from the catalog. Workbook-side
/// parts (source schema/table/column) and per-deployment knobs (active
/// flag, year column) come from the caller — the catalog does not
/// know about workbook structure or per-county active-flag conventions
/// like <c>sys_flag &lt;&gt; 'I'</c>.</para>
///
/// <para>This is a tiny first migration: it replaces the three-line
/// "look at the PACS docs and copy the table+column names into the
/// switch case" workflow inside <c>SyncAtlas/Program.cs</c> with a
/// catalog lookup that fails closed if the dictionary is not present.
/// Future slices migrate the actual SyncAtlas call sites; this slice
/// just ships the helper + an equivalence test proving the helper
/// produces a config bit-for-bit identical to the existing
/// <c>property_use</c> hardcoded config.</para>
///
/// <para>HG observance:</para>
/// <list type="bullet">
/// <item>HG3: helper is pure; no DB writes, no catalog mutation.</item>
/// <item>HG7: missing-dictionary path throws
/// <see cref="InvalidOperationException"/> with the catalog miss
/// reason, not a silent fallback.</item>
/// </list>
/// </summary>
public static class DictionaryConfigFromCatalog
{
    /// <summary>
    /// Builds the loader's per-target config pair from the catalog.
    /// </summary>
    /// <param name="catalog">Live catalog (in-memory or DB-backed).</param>
    /// <param name="dictionaryName">
    /// PACS dictionary table name as it appears in the catalog. The
    /// catalog stores this in <see cref="PacsDictionary.DictionaryName"/>
    /// for entries the live source's heuristic identifies (e.g.
    /// <c>"property_use"</c>, <c>"imprv_det_class"</c>,
    /// <c>"land_type"</c>).
    /// </param>
    /// <param name="workbookSource">
    /// Workbook-side schema/table/column triple identifying the
    /// workbook column being mapped against the dictionary.
    /// Caller-supplied because workbook structure is a Mapping
    /// Workbook concern, not a catalog concern.
    /// </param>
    /// <param name="canonicalTargetName">
    /// Canonical target vocabulary string (e.g. <c>"PropertyUse"</c>).
    /// Caller-supplied; the catalog has no opinion on canonical
    /// taxonomy.
    /// </param>
    /// <param name="activeFlag">
    /// Optional active-flag column + predicate pair. Caller-supplied;
    /// per-deployment quirk (sys_flag conventions vary across
    /// installs).
    /// </param>
    /// <param name="yearColumn">
    /// Optional year column for year-keyed dictionaries.
    /// Caller-supplied; per-deployment.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="catalog"/> or <paramref name="workbookSource"/>
    /// is null.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="dictionaryName"/> or
    /// <paramref name="canonicalTargetName"/> is null/empty.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// The catalog has no entry for <paramref name="dictionaryName"/>.
    /// Surfaces the catalog's typed miss reason. (HG7.)
    /// </exception>
    public static DictionaryConfigBuildResult Build(
        IPacsSchemaCatalog catalog,
        string dictionaryName,
        DictionaryWorkbookSource workbookSource,
        string canonicalTargetName,
        DictionaryActiveFlag? activeFlag = null,
        string? yearColumn = null)
    {
        if (catalog is null) throw new ArgumentNullException(nameof(catalog));
        if (workbookSource is null) throw new ArgumentNullException(nameof(workbookSource));
        if (string.IsNullOrWhiteSpace(dictionaryName))
        {
            throw new ArgumentException("Dictionary name must be non-empty.", nameof(dictionaryName));
        }
        if (string.IsNullOrWhiteSpace(canonicalTargetName))
        {
            throw new ArgumentException("Canonical target name must be non-empty.", nameof(canonicalTargetName));
        }

        var lookup = catalog.TryGetDictionary(dictionaryName);
        if (!lookup.HasValue || lookup.Value is null)
        {
            throw new InvalidOperationException(
                $"[DictionaryConfigFromCatalog] Catalog has no entry for dictionary '{dictionaryName}' (reason: {lookup.Reason}). " +
                "Either the live source's dictionary inference is disabled, the dictionary's table shape doesn't match the C48-F heuristic " +
                "(first column ends in _cd AND second column ends in _desc/_dsc), or the catalog version pre-dates this dictionary's creation.");
        }

        var dict = lookup.Value;

        var target = new DictionaryLoaderTargetConfig(
            WorkbookSourceSchema: workbookSource.SourceSchema,
            WorkbookSourceTable:  workbookSource.SourceTable,
            WorkbookSourceColumn: workbookSource.SourceColumn,
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  dict.DictionaryName,
            CanonicalTargetName:  canonicalTargetName);

        var columns = new DictionaryColumnConfig(
            CodeColumn:           dict.KeyColumn,
            DescriptionColumn:    dict.DescriptionColumn,
            ActiveFlagColumn:     activeFlag?.Column,
            ActiveFlagPredicate:  activeFlag?.Predicate,
            YearColumn:           yearColumn);

        return new DictionaryConfigBuildResult(target, columns);
    }
}

/// <summary>
/// Slice C48-G: result pair from
/// <see cref="DictionaryConfigFromCatalog.Build"/>.
/// </summary>
/// <param name="Target">
/// The full <see cref="DictionaryLoaderTargetConfig"/>: workbook
/// source triple + PACS dictionary table + canonical target name.
/// </param>
/// <param name="Columns">
/// The full <see cref="DictionaryColumnConfig"/>: code/description
/// columns from the catalog + caller-supplied active-flag and year
/// columns.
/// </param>
public sealed record DictionaryConfigBuildResult(
    DictionaryLoaderTargetConfig Target,
    DictionaryColumnConfig Columns);

/// <summary>
/// Slice C48-G: workbook-side schema/table/column triple identifying
/// the workbook column being mapped against a PACS dictionary. The
/// catalog does not know about workbook structure, so this is
/// caller-supplied input to
/// <see cref="DictionaryConfigFromCatalog.Build"/>.
/// </summary>
public sealed record DictionaryWorkbookSource(
    string SourceSchema,
    string SourceTable,
    string SourceColumn);

/// <summary>
/// Slice C48-G: optional active-flag column + operator-supplied
/// predicate pair. Per-deployment quirk because PACS installs vary
/// in active-flag conventions (some use <c>sys_flag &lt;&gt; 'I'</c>,
/// some <c>active_flag = 'Y'</c>, some have no flag at all). The
/// catalog cannot infer the predicate, so it stays caller-supplied.
/// </summary>
public sealed record DictionaryActiveFlag(
    string Column,
    string Predicate);
