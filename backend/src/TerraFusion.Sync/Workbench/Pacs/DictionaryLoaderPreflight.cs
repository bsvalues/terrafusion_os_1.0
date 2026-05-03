using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Sync.Workbench.Schema;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C49-FK-D: default <see cref="IDictionaryLoaderPreflight"/>
/// implementation. Pure function over the catalog state — no I/O,
/// no caching, no logging. The caller is responsible for translating
/// <see cref="DictionaryLoaderPreflightOutcome.Fail"/> into a thrown
/// exception and <see cref="DictionaryLoaderPreflightOutcome.Warn"/>
/// into a logged message per the C49-FK-C policy.
///
/// <para>Hard guards observed (HG-FK-1 / HG-FK-2 / HG-FK-3):</para>
/// <list type="bullet">
/// <item>Lookup uses
/// <see cref="IPacsSchemaCatalog.TryGetDeclaredForeignKeysFor"/>,
/// which excludes <see cref="PacsForeignKeyConfidence.InferredByName"/>
/// edges. An InferredByName edge that names the same shape is
/// treated as missing.</item>
/// <item>Stance is required (no default); the enum has no
/// Unspecified sentinel.</item>
/// <item>The result type carries the structured message naming
/// the (SourceTable, SourceColumns, TargetTable) triple so the
/// caller can re-emit it verbatim in throws / logs.</item>
/// </list>
/// </summary>
public sealed class DictionaryLoaderPreflight : IDictionaryLoaderPreflight
{
    /// <inheritdoc />
    public Task<DictionaryLoaderPreflightResult> ValidateAsync(
        IPacsSchemaCatalog catalog,
        DictionaryLoaderTargetConfig target,
        DictionaryColumnConfig columns,
        DictionaryLoaderPreflightStance stance,
        CancellationToken ct)
    {
        if (catalog is null) throw new ArgumentNullException(nameof(catalog));
        if (target  is null) throw new ArgumentNullException(nameof(target));
        if (columns is null) throw new ArgumentNullException(nameof(columns));
        if (!Enum.IsDefined(typeof(DictionaryLoaderPreflightStance), stance) || (int)stance == 0)
        {
            // HG-FK-3: stance must be explicit. Reject 0 / undefined.
            throw new ArgumentException(
                $"Preflight stance must be explicitly RequiredFk or AdvisoryFk; got '{stance}'. " +
                "Default-on-omission is forbidden by HG-FK-3.",
                nameof(stance));
        }

        // Expected FK shape:
        //   SourceTable     = WorkbookSourceTable          (e.g. "property_val")
        //   SourceColumns   = [WorkbookSourceColumn]       (e.g. ["property_use_cd"])
        //   TargetTable     = PacsDictionaryTable          (e.g. "property_use")
        //   TargetColumns   = [columns.CodeColumn]         (e.g. ["property_use_cd"])
        var expectedSource     = target.WorkbookSourceTable;
        var expectedSourceCols = new[] { target.WorkbookSourceColumn };
        var expectedTarget     = target.PacsDictionaryTable;
        var expectedTargetCols = new[] { columns.CodeColumn };

        var lookup = catalog.TryGetDeclaredForeignKeysFor(expectedSource);
        if (!lookup.HasValue || lookup.Value is null)
        {
            // Source table itself is unknown. The C48-G missing-table path
            // surfaces this elsewhere (in DictionaryConfigFromCatalog.Build).
            // Preflight returns a structured result either way so the
            // caller can decide; same fail/warn semantics apply.
            return Task.FromResult(BuildMissingResult(stance, expectedSource, expectedSourceCols, expectedTarget,
                detail: $"source table not in catalog (lookup reason: '{lookup.Reason}')"));
        }

        // Match by (SourceColumns, TargetTable). Ordinal-stable comparison
        // for composite-aware matching; arity must match exactly.
        PacsForeignKey? matched = null;
        foreach (var fk in lookup.Value)
        {
            if (!string.Equals(fk.TargetTable, expectedTarget, StringComparison.Ordinal))
            {
                continue;
            }
            if (fk.SourceColumns.Count != expectedSourceCols.Length)
            {
                continue;
            }
            bool sourceColumnsMatch = true;
            for (int i = 0; i < expectedSourceCols.Length; i++)
            {
                if (!string.Equals(fk.SourceColumns[i], expectedSourceCols[i], StringComparison.Ordinal))
                {
                    sourceColumnsMatch = false;
                    break;
                }
            }
            if (!sourceColumnsMatch)
            {
                continue;
            }

            // Found a match. The lookup already excluded InferredByName,
            // so confidence is guaranteed Declared or Exported.
            matched = fk;
            break;
        }

        if (matched is null)
        {
            return Task.FromResult(BuildMissingResult(stance, expectedSource, expectedSourceCols, expectedTarget,
                detail: $"no Declared or Exported FK matches the expected (source columns, target table) shape"));
        }

        return Task.FromResult(DictionaryLoaderPreflightResult.Pass(matched));
    }

    private static DictionaryLoaderPreflightResult BuildMissingResult(
        DictionaryLoaderPreflightStance stance,
        string expectedSource,
        string[] expectedSourceCols,
        string expectedTarget,
        string detail)
    {
        var sourceColsJoined = string.Join(", ", expectedSourceCols);
        return stance == DictionaryLoaderPreflightStance.RequiredFk
            ? DictionaryLoaderPreflightResult.Fail(
                $"[DictionaryLoaderPreflight] Required FK missing for " +
                $"'{expectedSource}({sourceColsJoined}) → {expectedTarget}'. " +
                $"Detail: {detail}. " +
                $"Declare the constraint in PACS or supply it via an operator-supplied Exported FK file " +
                $"(per C49-FK-A). The loader will not run without this edge present.")
            : DictionaryLoaderPreflightResult.Warn(
                $"[DictionaryLoaderPreflight] Advisory FK absent for " +
                $"'{expectedSource}({sourceColsJoined}) → {expectedTarget}'. " +
                $"Detail: {detail}. " +
                $"Loader will proceed; consider declaring the constraint in PACS or supplying " +
                $"an Exported FK file for stronger guarantees.");
    }
}
