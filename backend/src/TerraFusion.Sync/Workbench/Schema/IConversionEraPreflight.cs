using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C50-CONV-D: per-call-site era preflight per the C50-CONV-C
/// policy
/// (<c>docs/sync/pacs-schema-conversion-era-consumer-migration-policy.md</c>).
/// The era-domain analog of <see cref="IDictionaryLoaderPreflight"/>:
/// pure function over the catalog state, no I/O, no caching, no
/// logging. Caller is responsible for translating <see
/// cref="ConversionEraPreflightOutcome.Fail"/> into a thrown
/// <see cref="System.InvalidOperationException"/> and
/// <see cref="ConversionEraPreflightOutcome.Warn"/> into a logged
/// message.
///
/// <para>Era resolution precedence (per C50-CONV-C):</para>
/// <list type="number">
/// <item>Column-level annotation in the manifest →
/// <see cref="ConversionEraPreflightProvenance.ColumnEntry"/>.</item>
/// <item>Table-level annotation in the manifest →
/// <see cref="ConversionEraPreflightProvenance.TableEntryInherited"/>.</item>
/// <item>Manifest engaged but no annotation for this catalog item →
/// era is <see cref="PacsConversionEra.Unknown"/>;
/// <see cref="ConversionEraPreflightProvenance.ManifestEngagedNoEntry"/>.</item>
/// <item>Manifest not engaged (no <c>ConversionManifestPath</c>
/// configured) → era is the C48-B legacy default
/// <see cref="PacsConversionEra.Both"/>;
/// <see cref="ConversionEraPreflightProvenance.ManifestNotEngaged"/>.</item>
/// </list>
///
/// <para>Per HG-CONV-3: stance MUST be explicit. The enum has no
/// Unspecified / Default member; the implementation rejects zero /
/// undefined values with <see cref="System.ArgumentException"/>.</para>
/// </summary>
public interface IConversionEraPreflight
{
    /// <summary>
    /// Validates that the catalog records an era for the (table,
    /// columns) shape that satisfies the caller-declared stance.
    /// Returns a structured result; caller MUST throw on Fail and
    /// SHOULD log on Warn per the C50-CONV-C policy.
    /// </summary>
    /// <param name="catalog">PACS schema catalog. Required.</param>
    /// <param name="tableName">Source table name. Required.</param>
    /// <param name="columnNames">
    /// Source column names. Required (non-null, non-empty); pass a
    /// single-element array for a single column. The result reports
    /// the worst-era cell across all named columns, matching the
    /// "single combined result" binding in C50-CONV-C.
    /// </param>
    /// <param name="stance">
    /// Per-call-site stance. Caller MUST pick. Zero / undefined
    /// values rejected with ArgumentException (HG-CONV-3).
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    Task<ConversionEraPreflightResult> ValidateAsync(
        IPacsSchemaCatalog catalog,
        string tableName,
        System.Collections.Generic.IReadOnlyList<string> columnNames,
        ConversionEraPreflightStance stance,
        CancellationToken ct);
}

/// <summary>
/// Slice C50-CONV-D: per-call-site era stance per the C50-CONV-C
/// policy (HG-CONV-3). No default — caller MUST pick.
/// </summary>
public enum ConversionEraPreflightStance
{
    /// <summary>
    /// Loader requires post-2017 operational data. Acceptable matched
    /// eras: <see cref="PacsConversionEra.Post2017"/> and
    /// <see cref="PacsConversionEra.Both"/>. Pre2017 → Fail. Unknown
    /// → Fail. Caller MUST throw on Fail.
    /// </summary>
    RequirePost2017OrBoth = 1,

    /// <summary>
    /// Loader is OK with pre-2017-only data (e.g., a historical
    /// research surface). Any era except
    /// <see cref="PacsConversionEra.Unknown"/> is acceptable. Unknown
    /// → Fail (the loader cannot proceed without knowing what era
    /// the data is from). Caller MUST throw on Fail.
    /// </summary>
    AllowPre2017 = 2,

    /// <summary>
    /// Diagnostic / browsing stance. Every era is acceptable,
    /// including Unknown. Production consumers SHOULD pick
    /// <see cref="RequirePost2017OrBoth"/> or
    /// <see cref="AllowPre2017"/> instead.
    /// </summary>
    AllowAny = 3,
}

/// <summary>
/// Slice C50-CONV-D: outcome of an era preflight validation.
/// </summary>
public enum ConversionEraPreflightOutcome
{
    /// <summary>
    /// The matched era is acceptable under the caller's stance.
    /// Caller proceeds with no behavior change.
    /// </summary>
    Pass = 1,

    /// <summary>
    /// Era is acceptable but a non-fatal diagnostic applied (reserved
    /// for future use such as composite-mismatch warnings; the
    /// C50-CONV-C policy reserves this slot but the C50-CONV-D
    /// implementation does not currently emit Warn).
    /// </summary>
    Warn = 2,

    /// <summary>
    /// Era is unacceptable under the caller's stance. Caller MUST
    /// throw <see cref="System.InvalidOperationException"/> with
    /// <see cref="ConversionEraPreflightResult.Message"/>.
    /// </summary>
    Fail = 3,
}

/// <summary>
/// Slice C50-CONV-D: where the resolved era came from. Surfaces in
/// the structured message per the C50-CONV-C binding format.
/// </summary>
public enum ConversionEraPreflightProvenance
{
    /// <summary>The manifest's column-level annotation applied.</summary>
    ColumnEntry = 1,

    /// <summary>The manifest's table-level annotation applied to a column without its own annotation.</summary>
    TableEntryInherited = 2,

    /// <summary>Manifest engaged but no annotation; era is Unknown.</summary>
    ManifestEngagedNoEntry = 3,

    /// <summary>Manifest not engaged; era is the C48-B Both default.</summary>
    ManifestNotEngaged = 4,
}

/// <summary>
/// Slice C50-CONV-D: structured era-preflight result.
/// </summary>
/// <param name="Outcome">Pass / Warn / Fail.</param>
/// <param name="Message">
/// Structured message naming the (table, columns), stance, matched
/// era, provenance, and reason per the C50-CONV-C binding format.
/// Empty string on <see cref="ConversionEraPreflightOutcome.Pass"/>.
/// </param>
/// <param name="MatchedEra">
/// The era resolved from the catalog. Always populated, including
/// on Fail (Fail under RequirePost2017OrBoth still reports the
/// matched Pre2017 / Unknown era so the caller can re-emit it).
/// </param>
/// <param name="Provenance">Where the matched era came from.</param>
public sealed record ConversionEraPreflightResult(
    ConversionEraPreflightOutcome Outcome,
    string Message,
    PacsConversionEra MatchedEra,
    ConversionEraPreflightProvenance Provenance)
{
    /// <summary>Pass result.</summary>
    public static ConversionEraPreflightResult Pass(
        PacsConversionEra era,
        ConversionEraPreflightProvenance provenance) =>
        new(ConversionEraPreflightOutcome.Pass, string.Empty, era, provenance);

    /// <summary>Warning result; caller logs and proceeds.</summary>
    public static ConversionEraPreflightResult Warn(
        string message,
        PacsConversionEra era,
        ConversionEraPreflightProvenance provenance) =>
        new(ConversionEraPreflightOutcome.Warn, message, era, provenance);

    /// <summary>Fail result; caller MUST throw.</summary>
    public static ConversionEraPreflightResult Fail(
        string message,
        PacsConversionEra era,
        ConversionEraPreflightProvenance provenance) =>
        new(ConversionEraPreflightOutcome.Fail, message, era, provenance);
}
