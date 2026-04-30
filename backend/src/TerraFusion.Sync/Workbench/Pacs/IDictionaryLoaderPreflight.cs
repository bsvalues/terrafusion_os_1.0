using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Sync.Workbench.Schema;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C49-FK-D: dictionary-loader preflight FK validation. The
/// first authorized consumer of the C49-FK-B foreign-key edge data
/// per the C49-FK-C policy.
///
/// <para>Given a <see cref="IPacsSchemaCatalog"/>, a
/// <see cref="DictionaryLoaderTargetConfig"/>, a
/// <see cref="DictionaryColumnConfig"/>, and a caller-declared
/// <see cref="DictionaryLoaderPreflightStance"/>, the preflight
/// asks: "is there a Declared or Exported FK from
/// <c>WorkbookSourceTable.WorkbookSourceColumn</c> to
/// <c>PacsDictionaryTable.CodeColumn</c>?"</para>
///
/// <list type="bullet">
/// <item>Match found AND the matched edge has confidence
/// <see cref="PacsForeignKeyConfidence.Declared"/> or
/// <see cref="PacsForeignKeyConfidence.Exported"/> →
/// <see cref="DictionaryLoaderPreflightOutcome.Pass"/>.</item>
/// <item>Match NOT found and stance is
/// <see cref="DictionaryLoaderPreflightStance.RequiredFk"/> →
/// <see cref="DictionaryLoaderPreflightOutcome.Fail"/> with a
/// structured message naming the missing edge. Caller is expected
/// to throw <see cref="System.InvalidOperationException"/> per the
/// C49-FK-C policy.</item>
/// <item>Match NOT found and stance is
/// <see cref="DictionaryLoaderPreflightStance.AdvisoryFk"/> →
/// <see cref="DictionaryLoaderPreflightOutcome.Warn"/> with the
/// same message; caller logs the warning and proceeds.</item>
/// </list>
///
/// <para>Per HG-FK-2 (advisory-only):
/// <see cref="PacsForeignKeyConfidence.InferredByName"/> edges are
/// NEVER returned by this method's lookup path — the preflight
/// uses <see cref="IPacsSchemaCatalog.TryGetDeclaredForeignKeysFor"/>
/// which already excludes them. An InferredByName edge that names
/// the same source/target shape is treated identically to a
/// missing edge.</para>
///
/// <para>Per HG-FK-3 (stance must be explicit): there is no default
/// stance. The caller MUST pick <see cref="DictionaryLoaderPreflightStance.RequiredFk"/>
/// or <see cref="DictionaryLoaderPreflightStance.AdvisoryFk"/>; the
/// enum has no "Unknown" / "Unspecified" sentinel.</para>
/// </summary>
public interface IDictionaryLoaderPreflight
{
    /// <summary>
    /// Validates that the catalog contains a declared or exported FK
    /// edge matching the dictionary loader's expected shape.
    /// </summary>
    Task<DictionaryLoaderPreflightResult> ValidateAsync(
        IPacsSchemaCatalog catalog,
        DictionaryLoaderTargetConfig target,
        DictionaryColumnConfig columns,
        DictionaryLoaderPreflightStance stance,
        CancellationToken ct);
}

/// <summary>
/// Slice C49-FK-D: per-call-site stance per the C49-FK-C policy
/// (HG-FK-3). No default — caller MUST pick.
/// </summary>
public enum DictionaryLoaderPreflightStance
{
    /// <summary>
    /// The loader cannot run without this FK being present as
    /// Declared or Exported. Missing FK produces
    /// <see cref="DictionaryLoaderPreflightOutcome.Fail"/>; caller
    /// MUST throw on Fail.
    /// </summary>
    RequiredFk = 1,

    /// <summary>
    /// The loader benefits from FK metadata but can run without
    /// it. Missing FK produces
    /// <see cref="DictionaryLoaderPreflightOutcome.Warn"/>; caller
    /// logs and proceeds with no behavior change.
    /// </summary>
    AdvisoryFk = 2,
}

/// <summary>
/// Slice C49-FK-D: outcome of a preflight validation.
/// </summary>
public enum DictionaryLoaderPreflightOutcome
{
    /// <summary>
    /// The catalog returned a Declared or Exported FK matching the
    /// expected shape. <see cref="DictionaryLoaderPreflightResult.MatchedEdge"/>
    /// is non-null.
    /// </summary>
    Pass = 1,

    /// <summary>
    /// No matching declared/exported FK found, but the stance was
    /// <see cref="DictionaryLoaderPreflightStance.AdvisoryFk"/>.
    /// Caller logs <see cref="DictionaryLoaderPreflightResult.Message"/>
    /// and proceeds.
    /// </summary>
    Warn = 2,

    /// <summary>
    /// No matching declared/exported FK found, and the stance was
    /// <see cref="DictionaryLoaderPreflightStance.RequiredFk"/>.
    /// Caller MUST throw with
    /// <see cref="DictionaryLoaderPreflightResult.Message"/>.
    /// </summary>
    Fail = 3,
}

/// <summary>
/// Slice C49-FK-D: structured preflight result.
/// </summary>
/// <param name="Outcome">Pass / Warn / Fail.</param>
/// <param name="Message">
/// Structured message naming the (SourceTable, SourceColumns,
/// TargetTable) triple per the C49-FK-C policy. Empty string on
/// <see cref="DictionaryLoaderPreflightOutcome.Pass"/>.
/// </param>
/// <param name="MatchedEdge">
/// The catalog edge that satisfied the preflight, when
/// <see cref="Outcome"/> is <see cref="DictionaryLoaderPreflightOutcome.Pass"/>.
/// <c>null</c> otherwise.
/// </param>
public sealed record DictionaryLoaderPreflightResult(
    DictionaryLoaderPreflightOutcome Outcome,
    string Message,
    PacsForeignKey? MatchedEdge)
{
    /// <summary>Pass result with the matched edge.</summary>
    public static DictionaryLoaderPreflightResult Pass(PacsForeignKey edge) =>
        new(DictionaryLoaderPreflightOutcome.Pass, string.Empty, edge);

    /// <summary>Warning (advisory FK missing); caller logs and proceeds.</summary>
    public static DictionaryLoaderPreflightResult Warn(string message) =>
        new(DictionaryLoaderPreflightOutcome.Warn, message, null);

    /// <summary>Fail (required FK missing); caller MUST throw.</summary>
    public static DictionaryLoaderPreflightResult Fail(string message) =>
        new(DictionaryLoaderPreflightOutcome.Fail, message, null);
}
