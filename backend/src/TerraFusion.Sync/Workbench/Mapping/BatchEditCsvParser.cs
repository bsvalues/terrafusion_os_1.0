using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C11-B: pure CSV parser for the Mapping Workbook batch edit
/// CLI. Takes raw CSV text (UTF-8, RFC 4180 quoting, BOM tolerated)
/// and returns a list of <see cref="BatchEditCsvRow"/> with
/// 1-based <see cref="BatchEditCsvRow.LineNumber"/> for legible
/// error reports, plus a <see cref="BatchEditCsvParseResult.HeaderError"/>
/// when the header row itself is malformed (missing required columns,
/// unknown columns, etc.).
///
/// <para>Design split with the batch edit service: this parser only
/// reports column-presence and per-cell shape errors that can be seen
/// without touching the database. Row-level semantic validation
/// (scope-correct fields, exact-source-row identity, duplicate
/// targets, status guard, county scope) lives in the service so the
/// service can defend itself against any future programmatic caller
/// that constructs <see cref="BatchEditCsvRow"/> values directly.</para>
///
/// <para>Pure: no I/O, no DbContext, no environment access. Easy to
/// unit-test from a string literal.</para>
/// </summary>
public static class BatchEditCsvParser
{
    /// <summary>
    /// Required header columns. Order in the CSV is irrelevant —
    /// columns are resolved by name, not position. Names are
    /// case-insensitive on parse.
    /// </summary>
    public static readonly IReadOnlyList<string> RequiredColumns = new[]
    {
        "scope",
        "source_schema",
        "source_table",
        "source_column",
        "source_value",
        "review_status",
    };

    /// <summary>Optional mutation columns the parser tolerates.</summary>
    public static readonly IReadOnlyList<string> OptionalColumns = new[]
    {
        "canonical_target",
        "canonical_value",
        "canonical_value_null",
        "is_excluded",
        "notes",
    };

    /// <summary>Closed set of valid <c>scope</c> values.</summary>
    public static readonly IReadOnlySet<string> ValidScopes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "column", "code_value" };

    /// <summary>
    /// Parses a complete CSV document. <paramref name="csvText"/> may
    /// contain a UTF-8 BOM; it will be stripped. Empty or whitespace-only
    /// input produces a header-error result.
    /// </summary>
    public static BatchEditCsvParseResult Parse(string csvText)
    {
        ArgumentNullException.ThrowIfNull(csvText);

        // Strip UTF-8 BOM if present.
        if (csvText.Length > 0 && csvText[0] == '﻿')
        {
            csvText = csvText[1..];
        }

        var lines = TokenizeRecords(csvText).ToList();
        if (lines.Count == 0)
        {
            return new BatchEditCsvParseResult(
                HeaderError: "CSV is empty (no header row).",
                Rows: Array.Empty<BatchEditCsvRow>());
        }

        // First record is the header.
        var headerRecord = lines[0];
        var (headerError, headerIndex) = ParseHeader(headerRecord.Fields);
        if (headerError is not null)
        {
            return new BatchEditCsvParseResult(
                HeaderError: headerError,
                Rows: Array.Empty<BatchEditCsvRow>());
        }

        var rows = new List<BatchEditCsvRow>(lines.Count - 1);
        for (var i = 1; i < lines.Count; i++)
        {
            var record = lines[i];
            // Skip wholly-empty records (blank lines between rows are
            // operator-friendly; a row with all empty cells is a typo
            // and produces a row-level error).
            if (record.Fields.All(string.IsNullOrEmpty))
            {
                continue;
            }

            var row = BuildRow(record, headerIndex!);
            rows.Add(row);
        }

        return new BatchEditCsvParseResult(HeaderError: null, Rows: rows);
    }

    // ── Header parse ────────────────────────────────────────────────────

    private static (string? Error, IReadOnlyDictionary<string, int>? HeaderIndex)
        ParseHeader(IReadOnlyList<string> headerFields)
    {
        // Trim + lowercase for resolution. Keep the original-case names
        // around for legible errors.
        var normalized = headerFields.Select(f => f.Trim()).ToList();
        var lower = normalized.Select(f => f.ToLowerInvariant()).ToList();

        // Reject duplicate column names (any case).
        var dup = lower
            .GroupBy(n => n)
            .FirstOrDefault(g => !string.IsNullOrEmpty(g.Key) && g.Count() > 1);
        if (dup is not null)
        {
            return ($"CSV header contains duplicate column '{dup.Key}'.", null);
        }

        // Required columns must all be present.
        var allowed = new HashSet<string>(
            RequiredColumns.Concat(OptionalColumns),
            StringComparer.OrdinalIgnoreCase);

        // Unknown columns rejected — typo defense ("source-value" vs
        // "source_value", "ReviewStatus" vs "review_status").
        foreach (var col in lower)
        {
            if (string.IsNullOrEmpty(col)) continue;
            if (!allowed.Contains(col))
            {
                return ($"CSV header has unknown column '{col}'. Allowed: {string.Join(", ", allowed)}.", null);
            }
        }

        foreach (var required in RequiredColumns)
        {
            if (!lower.Contains(required))
            {
                return ($"CSV header is missing required column '{required}'.", null);
            }
        }

        // Build the name → index map. Empty/null cells in the header
        // (e.g. trailing comma) are skipped.
        var index = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < lower.Count; i++)
        {
            if (string.IsNullOrEmpty(lower[i])) continue;
            index[lower[i]] = i;
        }

        return (null, index);
    }

    // ── Row build ───────────────────────────────────────────────────────

    private static BatchEditCsvRow BuildRow(
        CsvRecord record,
        IReadOnlyDictionary<string, int> headerIndex)
    {
        string? Cell(string name)
        {
            if (!headerIndex.TryGetValue(name, out var idx)) return null;
            if (idx >= record.Fields.Count) return null;
            return record.Fields[idx];
        }

        // Required fields; treat whitespace-only as empty for the
        // identity columns so accidental indentation doesn't change
        // identity matching.
        var scope          = Cell("scope")?.Trim() ?? string.Empty;
        var sourceSchema   = Cell("source_schema")?.Trim() ?? string.Empty;
        var sourceTable    = Cell("source_table")?.Trim() ?? string.Empty;
        var sourceColumn   = Cell("source_column")?.Trim() ?? string.Empty;
        // SourceValue: do NOT trim — the policy says "exact-after-trim
        // matching at the service layer." Pass through the operator's
        // literal cell content so the service can see what was written.
        var sourceValueRaw = Cell("source_value");
        var reviewStatus   = Cell("review_status")?.Trim() ?? string.Empty;

        // Optional mutation fields; null means "header column absent OR
        // cell empty" (the policy's "do not mutate" semantic).
        // canonical_value_null and is_excluded are special-cased — we
        // distinguish "cell present and 'true'/'false'" from "cell empty"
        // to honor the policy's rule.
        var canonicalTarget    = NullIfEmpty(Cell("canonical_target"));
        var canonicalValue     = NullIfEmpty(Cell("canonical_value"));
        var canonicalValueNullRaw = NullIfEmpty(Cell("canonical_value_null"));
        var isExcludedRaw      = NullIfEmpty(Cell("is_excluded"));
        var notes              = NullIfEmpty(Cell("notes"));

        return new BatchEditCsvRow(
            LineNumber:           record.LineNumber,
            Scope:                scope,
            SourceSchema:         sourceSchema,
            SourceTable:          sourceTable,
            SourceColumn:         sourceColumn,
            // Empty cell on a code_value row will surface as a service-
            // layer error (missing source_value). Empty cell on a column
            // row is fine.
            SourceValue:          sourceValueRaw,
            ReviewStatus:         reviewStatus,
            CanonicalTarget:      canonicalTarget,
            CanonicalValue:       canonicalValue,
            CanonicalValueNullRaw: canonicalValueNullRaw,
            IsExcludedRaw:        isExcludedRaw,
            Notes:                notes);
    }

    private static string? NullIfEmpty(string? raw)
    {
        if (raw is null) return null;
        return string.IsNullOrEmpty(raw) ? null : raw;
    }

    // ── RFC 4180 tokenizer ──────────────────────────────────────────────

    /// <summary>
    /// One parsed CSV record (logical row). <see cref="LineNumber"/> is
    /// 1-based and points at the FIRST physical line the record starts
    /// on (records can span multiple physical lines via quoted
    /// newlines). <see cref="Fields"/> is the literal cell content with
    /// quoting unwrapped.
    /// </summary>
    private sealed record CsvRecord(int LineNumber, IReadOnlyList<string> Fields);

    /// <summary>
    /// Walks <paramref name="csvText"/> producing logical records.
    /// Handles double-quote escaping (RFC 4180 §2.5), embedded
    /// newlines inside quoted fields, and bare-CR line endings.
    /// Returns an empty sequence when the input is empty.
    /// </summary>
    private static IEnumerable<CsvRecord> TokenizeRecords(string csvText)
    {
        if (string.IsNullOrEmpty(csvText)) yield break;

        var fields = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;
        var line = 1;
        var recordStartLine = 1;
        var sawAnyContent = false;

        for (var i = 0; i < csvText.Length; i++)
        {
            var ch = csvText[i];

            if (inQuotes)
            {
                if (ch == '"')
                {
                    // Lookahead: doubled quote = literal quote.
                    if (i + 1 < csvText.Length && csvText[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    current.Append(ch);
                    if (ch == '\n') line++;
                }
            }
            else
            {
                switch (ch)
                {
                    case '"':
                        // Quoted-field opening MUST be at the start of a
                        // cell. Anything else is an operator typo and the
                        // service layer will surface it via the literal
                        // cell content; we just preserve it.
                        if (current.Length == 0)
                        {
                            inQuotes = true;
                        }
                        else
                        {
                            current.Append(ch);
                        }
                        break;

                    case ',':
                        fields.Add(current.ToString());
                        current.Clear();
                        sawAnyContent = true;
                        break;

                    case '\r':
                        // Treat CR as the start of a line break — \r\n
                        // collapses cleanly because the \n is consumed
                        // below.
                        if (i + 1 < csvText.Length && csvText[i + 1] == '\n')
                        {
                            i++;
                        }
                        fields.Add(current.ToString());
                        current.Clear();
                        yield return new CsvRecord(recordStartLine, fields.ToList());
                        fields.Clear();
                        line++;
                        recordStartLine = line;
                        sawAnyContent = false;
                        break;

                    case '\n':
                        fields.Add(current.ToString());
                        current.Clear();
                        yield return new CsvRecord(recordStartLine, fields.ToList());
                        fields.Clear();
                        line++;
                        recordStartLine = line;
                        sawAnyContent = false;
                        break;

                    default:
                        current.Append(ch);
                        sawAnyContent = true;
                        break;
                }
            }
        }

        // Trailing record without a terminating newline.
        if (sawAnyContent || current.Length > 0 || fields.Count > 0)
        {
            fields.Add(current.ToString());
            yield return new CsvRecord(recordStartLine, fields);
        }
    }
}

/// <summary>
/// Result of parsing a CSV document via <see cref="BatchEditCsvParser.Parse"/>.
/// <see cref="HeaderError"/> is non-null when the header row is malformed
/// (missing required column, unknown column, duplicate column). When
/// <see cref="HeaderError"/> is non-null, <see cref="Rows"/> is empty —
/// the service treats a header error as a fatal parse error and refuses
/// to look at the row payload.
/// </summary>
public sealed record BatchEditCsvParseResult(
    string? HeaderError,
    IReadOnlyList<BatchEditCsvRow> Rows);

/// <summary>
/// A single CSV row, post-tokenization. Field shapes:
/// <list type="bullet">
/// <item><see cref="LineNumber"/> is 1-based and points at the first
/// physical line of the record (records may span multiple physical
/// lines via quoted newlines).</item>
/// <item><see cref="Scope"/>, <see cref="SourceSchema"/>,
/// <see cref="SourceTable"/>, <see cref="SourceColumn"/>,
/// <see cref="ReviewStatus"/>: trimmed, never null. Empty strings
/// produce service-layer errors.</item>
/// <item><see cref="SourceValue"/>: passed through verbatim (no trim
/// at parse layer). Service trims for matching but reports the raw
/// value back to the operator.</item>
/// <item>Optional mutation fields: <c>null</c> means "operator did not
/// supply" (cell missing or empty); a non-null string is the literal
/// operator-supplied value.</item>
/// <item><see cref="CanonicalValueNullRaw"/> and
/// <see cref="IsExcludedRaw"/>: kept as raw strings so the service
/// can surface "expected 'true' or 'false', got 'yes'" errors with
/// the operator's literal text.</item>
/// </list>
/// </summary>
public sealed record BatchEditCsvRow(
    int LineNumber,
    string Scope,
    string SourceSchema,
    string SourceTable,
    string SourceColumn,
    string? SourceValue,
    string ReviewStatus,
    string? CanonicalTarget,
    string? CanonicalValue,
    string? CanonicalValueNullRaw,
    string? IsExcludedRaw,
    string? Notes);
