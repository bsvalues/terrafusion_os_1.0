using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C51-PII-D: per-call-site PII preflight per the C51-PII-C
/// policy
/// (<c>docs/sync/pacs-schema-pii-consumer-migration-policy.md</c>).
/// The PII-domain analog of <see cref="IConversionEraPreflight"/>:
/// pure function over the catalog state, no I/O, no caching, no
/// logging. Caller is responsible for translating
/// <see cref="PiiClassificationPreflightOutcome.Fail"/> into a thrown
/// <see cref="System.InvalidOperationException"/> and
/// <see cref="PiiClassificationPreflightOutcome.Warn"/> into a
/// logged message.
///
/// <para>Engagement and exhaustiveness state come from the catalog's
/// <see cref="IPacsSchemaCatalog.PiiManifestEngaged"/> property and
/// <see cref="IPacsSchemaCatalog.IsTableExhaustivelyClassified"/>
/// method, surfaced by C51-PII-D.</para>
///
/// <para>Per HG-PII-3: stance MUST be explicit. The enum has no
/// Unspecified / Default member; the implementation rejects zero /
/// undefined values with <see cref="System.ArgumentException"/>.</para>
/// </summary>
public interface IPiiClassificationPreflight
{
    /// <summary>
    /// Validates that the catalog records a classification for the
    /// (table, columns) shape that satisfies the caller-declared
    /// stance. Returns a structured result; caller MUST throw on
    /// Fail per the C51-PII-C policy.
    /// </summary>
    Task<PiiClassificationPreflightResult> ValidateAsync(
        IPacsSchemaCatalog catalog,
        string tableName,
        System.Collections.Generic.IReadOnlyList<string> columnNames,
        PiiClassificationPreflightStance stance,
        CancellationToken ct);
}

/// <summary>
/// Slice C51-PII-D: per-call-site PII stance per the C51-PII-C
/// policy (HG-PII-3). No default — caller MUST pick.
/// </summary>
public enum PiiClassificationPreflightStance
{
    /// <summary>
    /// Surface produces PII-free responses. Pass requires
    /// classification=None AND the table is in TableExhaustiveFlags.
    /// Without exhaustiveness, the loader cannot prove safety →
    /// Fail. Caller MUST throw on Fail.
    /// </summary>
    RequirePiiFreeCanonicalLanding = 1,

    /// <summary>
    /// Surface tolerates Indirect with audit care. Pass on
    /// None / Indirect under engaged manifest. Direct → Fail.
    /// Un-engaged → Fail (cannot tell None from un-tagged-might-
    /// be-Direct).
    /// </summary>
    AllowIndirectWithCare = 2,

    /// <summary>
    /// Surface holds explicit consent / audit posture for Direct.
    /// Pass on any classification under engaged manifest.
    /// Un-engaged → Fail.
    /// </summary>
    AllowDirectWithExplicitConsentAudit = 3,

    /// <summary>
    /// Diagnostic / browsing stance. Every classification accepted,
    /// engaged or not. SHOULD only be used for surfaces that by
    /// definition expose every entry.
    /// </summary>
    AllowAny = 4,
}

/// <summary>
/// Slice C51-PII-D: outcome of a PII preflight validation.
/// </summary>
public enum PiiClassificationPreflightOutcome
{
    /// <summary>Classification acceptable under stance.</summary>
    Pass = 1,

    /// <summary>Reserved for future use; the C51-PII-D implementation does not currently emit Warn.</summary>
    Warn = 2,

    /// <summary>Classification unacceptable; caller MUST throw.</summary>
    Fail = 3,
}

/// <summary>
/// Slice C51-PII-D: structured PII-preflight result.
/// </summary>
/// <param name="Outcome">Pass / Warn / Fail.</param>
/// <param name="Message">
/// Structured message naming the (table, columns), stance, matched
/// classification, engagement, exhaustive flag, and reason per the
/// C51-PII-C binding format. Empty string on Pass.
/// </param>
/// <param name="MatchedClassification">
/// The classification resolved from the catalog. Always populated.
/// </param>
/// <param name="ManifestEngaged">
/// Whether the catalog was built with a PII manifest engaged.
/// </param>
/// <param name="TableExhaustive">
/// Whether the table is in <c>TableExhaustiveFlags</c>. Always
/// false when <see cref="ManifestEngaged"/> is false.
/// </param>
public sealed record PiiClassificationPreflightResult(
    PiiClassificationPreflightOutcome Outcome,
    string Message,
    PiiClassification MatchedClassification,
    bool ManifestEngaged,
    bool TableExhaustive)
{
    public static PiiClassificationPreflightResult Pass(
        PiiClassification classification,
        bool engaged,
        bool exhaustive) =>
        new(PiiClassificationPreflightOutcome.Pass, string.Empty, classification, engaged, exhaustive);

    public static PiiClassificationPreflightResult Fail(
        string message,
        PiiClassification classification,
        bool engaged,
        bool exhaustive) =>
        new(PiiClassificationPreflightOutcome.Fail, message, classification, engaged, exhaustive);
}
