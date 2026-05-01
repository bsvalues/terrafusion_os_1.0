using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C53-CONS-B: default <see cref="IPacsSchemaInvariantEngine"/>
/// implementation. Pure function over catalog data; no I/O. See
/// <c>docs/sync/pacs-schema-consistency-invariants-policy.md</c>
/// for the binding invariant set this implementation enforces.
///
/// <para>Categories implemented in C53-CONS-B: TBL-* / COL-* /
/// DICT-* / FK-*. Manifest categories (CONV-*, PII-*, OVR-*,
/// XREF-*) and the Advisory tier are deferred to C53-CONS-C.</para>
/// </summary>
public sealed class PacsSchemaInvariantEngine : IPacsSchemaInvariantEngine
{
    /// <summary>
    /// Pinned per the C53-CONS-A policy. Bump on any future
    /// invariant-set addition / removal.
    /// </summary>
    public const string InvariantSetVersion = "1.0.0";

    /// <inheritdoc />
    public PacsSchemaInvariantReport Evaluate(
        IReadOnlyList<PacsTable> tables,
        IReadOnlyList<PacsColumn> columns,
        IReadOnlyList<PacsDictionary> dictionaries,
        IReadOnlySet<string>? suppressInvariants)
    {
        if (tables is null) throw new ArgumentNullException(nameof(tables));
        if (columns is null) throw new ArgumentNullException(nameof(columns));
        if (dictionaries is null) throw new ArgumentNullException(nameof(dictionaries));

        var results = new List<PacsSchemaInvariantResult>();

        // Lookup helpers: build once, reuse.
        var tableNames = new HashSet<string>(StringComparer.Ordinal);
        var tablesByName = new Dictionary<string, PacsTable>(StringComparer.Ordinal);
        foreach (var t in tables)
        {
            if (!string.IsNullOrEmpty(t.TableName))
            {
                tableNames.Add(t.TableName);
                if (!tablesByName.ContainsKey(t.TableName))
                {
                    tablesByName[t.TableName] = t;
                }
            }
        }

        var columnsByTable = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
        foreach (var c in columns)
        {
            if (string.IsNullOrEmpty(c.TableName) || string.IsNullOrEmpty(c.ColumnName))
            {
                continue;
            }
            if (!columnsByTable.TryGetValue(c.TableName, out var set))
            {
                set = new HashSet<string>(StringComparer.Ordinal);
                columnsByTable[c.TableName] = set;
            }
            set.Add(c.ColumnName);
        }

        EvaluateTableInvariants(tables, columnsByTable, results);
        EvaluateColumnInvariants(columns, tableNames, results);
        EvaluateDictionaryInvariants(dictionaries, tableNames, columnsByTable, results);
        EvaluateForeignKeyInvariants(tables, tableNames, columnsByTable, results);

        // Apply suppression: demote rows whose Code is in the set.
        // Suppressing Advisory has no effect (already lowest).
        if (suppressInvariants is not null && suppressInvariants.Count > 0)
        {
            for (int i = 0; i < results.Count; i++)
            {
                var r = results[i];
                if (suppressInvariants.Contains(r.Code))
                {
                    var demoted = r.Severity switch
                    {
                        PacsSchemaInvariantSeverity.Error    => PacsSchemaInvariantSeverity.Warning,
                        PacsSchemaInvariantSeverity.Warning  => PacsSchemaInvariantSeverity.Advisory,
                        _                                    => r.Severity,
                    };
                    if (demoted != r.Severity)
                    {
                        results[i] = r with { Severity = demoted };
                    }
                }
            }
        }

        return new PacsSchemaInvariantReport(
            InvariantSetVersion: InvariantSetVersion,
            ProducedAtUtc: DateTime.UtcNow,
            Results: results);
    }

    // ------------------------------------------------------------------
    // TBL-* invariants
    // ------------------------------------------------------------------
    private static void EvaluateTableInvariants(
        IReadOnlyList<PacsTable> tables,
        IReadOnlyDictionary<string, HashSet<string>> columnsByTable,
        List<PacsSchemaInvariantResult> results)
    {
        // TBL-002 setup: detect duplicate table names.
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var duplicates = new HashSet<string>(StringComparer.Ordinal);

        foreach (var t in tables)
        {
            // TBL-001: non-empty TableName
            if (string.IsNullOrEmpty(t.TableName))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "TBL-001",
                    "Catalog table has empty TableName.",
                    TableName: null, ColumnName: null,
                    Provenance: t.ProvenancePath ?? "(unknown)"));
                continue;
            }

            if (!seen.Add(t.TableName))
            {
                duplicates.Add(t.TableName);
            }

            // TBL-003: non-empty ProvenancePath (HG6)
            if (string.IsNullOrEmpty(t.ProvenancePath))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "TBL-003",
                    $"Catalog table '{t.TableName}' has empty ProvenancePath (HG6 source-traceable).",
                    t.TableName, null,
                    Provenance: $"table:{t.TableName}"));
            }

            // TBL-004: zero columns
            if (!columnsByTable.TryGetValue(t.TableName, out var cols) || cols.Count == 0)
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Warning,
                    "TBL-004",
                    $"Catalog table '{t.TableName}' has zero columns; the catalog parser may have missed it.",
                    t.TableName, null,
                    Provenance: t.ProvenancePath ?? $"table:{t.TableName}"));
            }
        }

        // TBL-002: report each duplicated name once.
        foreach (var name in duplicates)
        {
            results.Add(new PacsSchemaInvariantResult(
                PacsSchemaInvariantSeverity.Error,
                "TBL-002",
                $"Catalog has duplicate TableName '{name}'.",
                TableName: name, ColumnName: null,
                Provenance: $"table:{name}"));
        }
    }

    // ------------------------------------------------------------------
    // COL-* invariants
    // ------------------------------------------------------------------
    private static void EvaluateColumnInvariants(
        IReadOnlyList<PacsColumn> columns,
        IReadOnlySet<string> tableNames,
        List<PacsSchemaInvariantResult> results)
    {
        // COL-003 setup: detect duplicate (Table, Column) pairs.
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var duplicates = new HashSet<string>(StringComparer.Ordinal);

        foreach (var c in columns)
        {
            // COL-001: non-empty TableName + ColumnName
            if (string.IsNullOrEmpty(c.TableName) || string.IsNullOrEmpty(c.ColumnName))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "COL-001",
                    "Catalog column has empty TableName or ColumnName.",
                    TableName: c.TableName, ColumnName: c.ColumnName,
                    Provenance: c.ProvenanceLine ?? "(unknown)"));
                continue;
            }

            // COL-002: TableName references existing table
            if (!tableNames.Contains(c.TableName))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "COL-002",
                    $"Catalog column '{c.TableName}.{c.ColumnName}' references unknown table '{c.TableName}'.",
                    c.TableName, c.ColumnName,
                    Provenance: c.ProvenanceLine ?? $"column:{c.TableName}.{c.ColumnName}"));
            }

            // COL-003: dedup
            var key = $"{c.TableName}.{c.ColumnName}";
            if (!seen.Add(key))
            {
                duplicates.Add(key);
            }

            // COL-004: non-empty ProvenanceLine (HG6)
            if (string.IsNullOrEmpty(c.ProvenanceLine))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "COL-004",
                    $"Catalog column '{c.TableName}.{c.ColumnName}' has empty ProvenanceLine (HG6 source-traceable).",
                    c.TableName, c.ColumnName,
                    Provenance: $"column:{c.TableName}.{c.ColumnName}"));
            }

            // COL-005: DictionaryRef points to known table
            if (c.DictionaryRef is not null && !tableNames.Contains(c.DictionaryRef.DictionaryTable))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Warning,
                    "COL-005",
                    $"Column '{c.TableName}.{c.ColumnName}' declares a DictionaryRef pointing at unknown table '{c.DictionaryRef.DictionaryTable}'.",
                    c.TableName, c.ColumnName,
                    Provenance: c.ProvenanceLine ?? $"column:{c.TableName}.{c.ColumnName}"));
            }
        }

        foreach (var key in duplicates)
        {
            var parts = key.Split('.', 2);
            results.Add(new PacsSchemaInvariantResult(
                PacsSchemaInvariantSeverity.Error,
                "COL-003",
                $"Catalog has duplicate column '{key}'.",
                TableName: parts.Length > 0 ? parts[0] : null,
                ColumnName: parts.Length > 1 ? parts[1] : null,
                Provenance: $"column:{key}"));
        }
    }

    // ------------------------------------------------------------------
    // DICT-* invariants
    // ------------------------------------------------------------------
    private static void EvaluateDictionaryInvariants(
        IReadOnlyList<PacsDictionary> dictionaries,
        IReadOnlySet<string> tableNames,
        IReadOnlyDictionary<string, HashSet<string>> columnsByTable,
        List<PacsSchemaInvariantResult> results)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var duplicates = new HashSet<string>(StringComparer.Ordinal);

        foreach (var d in dictionaries)
        {
            // DICT-001: non-empty DictionaryName
            if (string.IsNullOrEmpty(d.DictionaryName))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "DICT-001",
                    "Catalog dictionary has empty DictionaryName.",
                    TableName: null, ColumnName: null,
                    Provenance: d.ProvenancePath ?? "(unknown)"));
                continue;
            }

            if (!seen.Add(d.DictionaryName))
            {
                duplicates.Add(d.DictionaryName);
            }

            // DICT-003: DictionaryName references existing table
            if (!tableNames.Contains(d.DictionaryName))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Error,
                    "DICT-003",
                    $"Catalog dictionary '{d.DictionaryName}' references unknown source table.",
                    TableName: d.DictionaryName, ColumnName: null,
                    Provenance: d.ProvenancePath ?? $"dictionary:{d.DictionaryName}"));
                continue;
            }

            // DICT-004: KeyColumn exists on source table
            if (!string.IsNullOrEmpty(d.KeyColumn))
            {
                if (!columnsByTable.TryGetValue(d.DictionaryName, out var cols) ||
                    !cols.Contains(d.KeyColumn))
                {
                    results.Add(new PacsSchemaInvariantResult(
                        PacsSchemaInvariantSeverity.Error,
                        "DICT-004",
                        $"Dictionary '{d.DictionaryName}' KeyColumn '{d.KeyColumn}' is not a column on its source table.",
                        TableName: d.DictionaryName, ColumnName: d.KeyColumn,
                        Provenance: d.ProvenancePath ?? $"dictionary:{d.DictionaryName}"));
                }
            }

            // DICT-005: missing description column
            if (string.IsNullOrEmpty(d.DescriptionColumn))
            {
                results.Add(new PacsSchemaInvariantResult(
                    PacsSchemaInvariantSeverity.Warning,
                    "DICT-005",
                    $"Dictionary '{d.DictionaryName}' has no DescriptionColumn; consumers may not be able to render lookup values.",
                    TableName: d.DictionaryName, ColumnName: null,
                    Provenance: d.ProvenancePath ?? $"dictionary:{d.DictionaryName}"));
            }
        }

        foreach (var name in duplicates)
        {
            results.Add(new PacsSchemaInvariantResult(
                PacsSchemaInvariantSeverity.Error,
                "DICT-002",
                $"Catalog has duplicate DictionaryName '{name}'.",
                TableName: name, ColumnName: null,
                Provenance: $"dictionary:{name}"));
        }
    }

    // ------------------------------------------------------------------
    // FK-* invariants
    // ------------------------------------------------------------------
    private static void EvaluateForeignKeyInvariants(
        IReadOnlyList<PacsTable> tables,
        IReadOnlySet<string> tableNames,
        IReadOnlyDictionary<string, HashSet<string>> columnsByTable,
        List<PacsSchemaInvariantResult> results)
    {
        // FK-005: dedup constraint names within a single source provenance
        // We use ConstraintName + ProvenanceSource as the dedup key so
        // an Exported edge sharing a name with a (different-shape)
        // Declared edge is allowed; only same-source duplicates fire.
        var seenByProvenance = new HashSet<string>(StringComparer.Ordinal);
        var duplicates = new HashSet<string>(StringComparer.Ordinal);

        // FK-006: track shapes that already have Declared/Exported coverage
        var declaredOrExportedShapes = new HashSet<string>(StringComparer.Ordinal);
        foreach (var t in tables)
        {
            foreach (var fk in t.ForeignKeys)
            {
                if (fk.Confidence == PacsForeignKeyConfidence.Declared ||
                    fk.Confidence == PacsForeignKeyConfidence.Exported)
                {
                    declaredOrExportedShapes.Add(BuildShapeKey(
                        fk.SourceTable, fk.SourceColumns, fk.TargetTable, fk.TargetColumns));
                }
            }
        }

        foreach (var t in tables)
        {
            foreach (var fk in t.ForeignKeys)
            {
                // FK-001: non-empty ConstraintName for Declared / Exported.
                // InferredByName edges legitimately have null ConstraintName
                // (no engine constraint backing them), so the invariant
                // applies only to the promoted-confidence tiers.
                if (string.IsNullOrEmpty(fk.ConstraintName) &&
                    (fk.Confidence == PacsForeignKeyConfidence.Declared ||
                     fk.Confidence == PacsForeignKeyConfidence.Exported))
                {
                    results.Add(new PacsSchemaInvariantResult(
                        PacsSchemaInvariantSeverity.Error,
                        "FK-001",
                        $"Catalog FK with confidence {fk.Confidence} has empty ConstraintName.",
                        TableName: fk.SourceTable, ColumnName: null,
                        Provenance: fk.ProvenancePath ?? "(unknown)"));
                    continue;
                }

                // FK-002: SourceTable + TargetTable exist
                if (!tableNames.Contains(fk.SourceTable))
                {
                    results.Add(new PacsSchemaInvariantResult(
                        PacsSchemaInvariantSeverity.Error,
                        "FK-002",
                        $"FK '{fk.ConstraintName}' references unknown SourceTable '{fk.SourceTable}'.",
                        fk.SourceTable, null,
                        Provenance: fk.ProvenancePath ?? $"fk:{fk.ConstraintName}"));
                }
                if (!tableNames.Contains(fk.TargetTable))
                {
                    results.Add(new PacsSchemaInvariantResult(
                        PacsSchemaInvariantSeverity.Error,
                        "FK-002",
                        $"FK '{fk.ConstraintName}' references unknown TargetTable '{fk.TargetTable}'.",
                        fk.TargetTable, null,
                        Provenance: fk.ProvenancePath ?? $"fk:{fk.ConstraintName}"));
                }

                // FK-003: SourceColumns + TargetColumns exist on respective tables
                if (columnsByTable.TryGetValue(fk.SourceTable, out var sourceCols))
                {
                    foreach (var col in fk.SourceColumns)
                    {
                        if (!sourceCols.Contains(col))
                        {
                            results.Add(new PacsSchemaInvariantResult(
                                PacsSchemaInvariantSeverity.Error,
                                "FK-003",
                                $"FK '{fk.ConstraintName}' SourceColumn '{col}' does not exist on table '{fk.SourceTable}'.",
                                fk.SourceTable, col,
                                Provenance: fk.ProvenancePath ?? $"fk:{fk.ConstraintName}"));
                        }
                    }
                }
                if (columnsByTable.TryGetValue(fk.TargetTable, out var targetCols))
                {
                    foreach (var col in fk.TargetColumns)
                    {
                        if (!targetCols.Contains(col))
                        {
                            results.Add(new PacsSchemaInvariantResult(
                                PacsSchemaInvariantSeverity.Error,
                                "FK-003",
                                $"FK '{fk.ConstraintName}' TargetColumn '{col}' does not exist on table '{fk.TargetTable}'.",
                                fk.TargetTable, col,
                                Provenance: fk.ProvenancePath ?? $"fk:{fk.ConstraintName}"));
                        }
                    }
                }

                // FK-004: composite arity matches
                if (fk.SourceColumns.Count != fk.TargetColumns.Count)
                {
                    results.Add(new PacsSchemaInvariantResult(
                        PacsSchemaInvariantSeverity.Error,
                        "FK-004",
                        $"FK '{fk.ConstraintName}' arity mismatch: SourceColumns.Count={fk.SourceColumns.Count}, TargetColumns.Count={fk.TargetColumns.Count}.",
                        fk.SourceTable, null,
                        Provenance: fk.ProvenancePath ?? $"fk:{fk.ConstraintName}"));
                }

                // FK-005: same constraint name within same provenance source.
                // Skip InferredByName (their ConstraintName is null by design;
                // dedup is meaningless and noisy at that tier).
                if (fk.Confidence != PacsForeignKeyConfidence.InferredByName &&
                    !string.IsNullOrEmpty(fk.ConstraintName))
                {
                    var dedupKey = $"{fk.ProvenanceSource}::{fk.ConstraintName}";
                    if (!seenByProvenance.Add(dedupKey))
                    {
                        duplicates.Add(dedupKey);
                    }
                }

                // FK-006: InferredByName with no Declared/Exported promotion
                if (fk.Confidence == PacsForeignKeyConfidence.InferredByName)
                {
                    var shape = BuildShapeKey(
                        fk.SourceTable, fk.SourceColumns, fk.TargetTable, fk.TargetColumns);
                    if (!declaredOrExportedShapes.Contains(shape))
                    {
                        results.Add(new PacsSchemaInvariantResult(
                            PacsSchemaInvariantSeverity.Warning,
                            "FK-006",
                            $"InferredByName FK '{fk.ConstraintName}' on '{fk.SourceTable}({string.Join(",", fk.SourceColumns)}) → {fk.TargetTable}' has no Declared or Exported promotion (operator may want to promote it via the C52-OVR Exported FK manifest).",
                            fk.SourceTable, null,
                            Provenance: fk.ProvenancePath ?? $"fk:{fk.ConstraintName}"));
                    }
                }
            }
        }

        foreach (var key in duplicates)
        {
            var parts = key.Split("::", 2);
            results.Add(new PacsSchemaInvariantResult(
                PacsSchemaInvariantSeverity.Error,
                "FK-005",
                $"Catalog has duplicate FK ConstraintName within provenance source: '{key}'.",
                TableName: null, ColumnName: null,
                Provenance: parts.Length > 1 ? parts[1] : key));
        }
    }

    private static string BuildShapeKey(
        string sourceTable,
        IReadOnlyList<string> sourceColumns,
        string targetTable,
        IReadOnlyList<string> targetColumns) =>
        $"{sourceTable}({string.Join(",", sourceColumns)})->{targetTable}({string.Join(",", targetColumns)})";
}
