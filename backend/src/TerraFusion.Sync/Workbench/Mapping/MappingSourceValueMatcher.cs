using System;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C12 — single source of truth for matching operator-supplied
/// <c>source_value</c> strings against stored
/// <see cref="Core.Entities.Sync.Mapping.SyncMappingCodeValue.SourceValue"/>
/// rows.
///
/// <para>Background: PACS sources frequently store fixed-width
/// <c>char(N)</c> codes that arrive with trailing spaces — e.g.
/// <c>sl_ratio_type_cd</c>'s <c>"00   "</c> (byte_len=5). Operators
/// type the natural unpadded form (<c>"00"</c>). C9-A's policy was
/// "exact-after-trim" but the original C9-B implementation only
/// trimmed the OPERATOR side; this slice extends the trim to BOTH
/// sides so the natural input matches.</para>
///
/// <para>Crucial invariants this class preserves:
/// <list type="bullet">
/// <item><see cref="Normalize"/> only trims standard leading/trailing
/// whitespace (<see cref="string.Trim()"/>) — internal whitespace
/// is preserved verbatim, so <c>"A B"</c> never matches <c>"AB"</c>.</item>
/// <item>The matcher is read-only: callers never assign the
/// normalized value back to the entity. The stored <see cref="
/// Core.Entities.Sync.Mapping.SyncMappingCodeValue.SourceValue"/>
/// must remain byte-for-byte identical to what the C3 loader
/// originally materialized — operators expect to see the same source
/// representation in exports / read-model output that PACS gave them.</item>
/// <item>Comparisons are case-significant (PACS code semantics).
/// The natural-key uniqueness on
/// <c>(MappingColumnId, SourceValue)</c> is per-stored-string, so a
/// single column can legitimately contain two rows whose trimmed
/// forms collide (e.g. <c>"00"</c> and <c>"00 "</c>); the matcher's
/// callers must detect that and surface an explicit ambiguity error
/// rather than silently picking one.</item>
/// </list>
/// </para>
/// </summary>
internal static class MappingSourceValueMatcher
{
    /// <summary>
    /// Standard leading/trailing-whitespace trim. Returns
    /// <see cref="string.Empty"/> when <paramref name="value"/> is
    /// <c>null</c> so callers can pipe nullable inputs through without
    /// a guard.
    /// </summary>
    public static string Normalize(string? value)
        => value is null ? string.Empty : value.Trim();

    /// <summary>
    /// True iff <paramref name="storedSourceValue"/> and
    /// <paramref name="operatorSourceValue"/> are
    /// case-significantly equal after both sides are trimmed of
    /// standard whitespace. Internal whitespace is NOT collapsed.
    /// </summary>
    public static bool MatchesAfterTrim(string? storedSourceValue, string? operatorSourceValue)
        => string.Equals(
            Normalize(storedSourceValue),
            Normalize(operatorSourceValue),
            StringComparison.Ordinal);

    /// <summary>
    /// Builds the standard ambiguous-match error message used by
    /// both single-row edit and batch edit when more than one stored
    /// row trim-equals the operator's input. The message names every
    /// distinct stored representation so the operator can see exactly
    /// which rows collided and decide how to clean the data.
    /// </summary>
    public static string BuildAmbiguousMatchMessage(
        string sourceSchema,
        string sourceTable,
        string sourceColumn,
        string operatorSourceValue,
        System.Collections.Generic.IEnumerable<string?> ambiguousStoredValues)
    {
        var rendered = string.Join(
            ", ",
            System.Linq.Enumerable.Select(
                ambiguousStoredValues,
                v => v is null ? "(null)" : $"'{v}'"));
        return
            $"Source value '{operatorSourceValue}' is ambiguous in column " +
            $"{sourceSchema}.{sourceTable}.{sourceColumn} — multiple stored " +
            $"rows trim-equal: [{rendered}]. Resolve the duplicate stored " +
            "values before editing.";
    }
}
