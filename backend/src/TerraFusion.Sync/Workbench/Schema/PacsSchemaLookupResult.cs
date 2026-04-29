namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: typed lookup result for
/// <see cref="IPacsSchemaCatalog"/> queries. Per
/// <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c> Hard Guard 7
/// (HG7 Failure surfaces explicitly), a reader querying for an
/// unknown table, column, or dictionary receives this typed result
/// — never a <c>null</c>, never an empty string, never a silent
/// fallback.
///
/// <para>The catalog refuses to lie about its coverage. If
/// <see cref="HasValue"/> is <c>false</c>, <see cref="Reason"/>
/// describes why (not-in-catalog, ambiguous-conversion-era,
/// version-mismatch, etc.) so the reader can branch
/// deterministically instead of guessing.</para>
/// </summary>
/// <typeparam name="T">
/// The catalog record type the lookup is for (<see cref="PacsTable"/>,
/// <see cref="PacsColumn"/>, or <see cref="PacsDictionary"/>).
/// </typeparam>
public readonly record struct PacsSchemaLookupResult<T> where T : class
{
    /// <summary>
    /// <c>true</c> when the lookup found the requested entity;
    /// <see cref="Value"/> is non-null in that case.
    /// </summary>
    public bool HasValue { get; }

    /// <summary>
    /// The found entity. <c>null</c> when <see cref="HasValue"/> is
    /// <c>false</c>.
    /// </summary>
    public T? Value { get; }

    /// <summary>
    /// Reason classification when <see cref="HasValue"/> is
    /// <c>false</c>. Stable string values (<c>"not-found"</c>,
    /// <c>"ambiguous-conversion-era"</c>, etc.) callers can branch
    /// on. Empty when <see cref="HasValue"/> is <c>true</c>.
    /// </summary>
    public string Reason { get; }

    private PacsSchemaLookupResult(bool hasValue, T? value, string reason)
    {
        HasValue = hasValue;
        Value = value;
        Reason = reason;
    }

    /// <summary>
    /// Constructs a hit result wrapping the found entity.
    /// </summary>
    public static PacsSchemaLookupResult<T> Found(T value) =>
        new(true, value, string.Empty);

    /// <summary>
    /// Constructs a typed miss result with a stable
    /// <paramref name="reason"/> classification.
    /// </summary>
    public static PacsSchemaLookupResult<T> Miss(string reason) =>
        new(false, null, reason);

    /// <summary>
    /// Stable miss reason: the requested entity is not present in
    /// the catalog at all.
    /// </summary>
    public const string ReasonNotFound = "not-found";

    /// <summary>
    /// Stable miss reason: the entity is present but its conversion
    /// era is <see cref="PacsConversionEra.Unknown"/> and the caller
    /// declared an era requirement that cannot be satisfied.
    /// </summary>
    public const string ReasonAmbiguousConversionEra = "ambiguous-conversion-era";

    /// <summary>
    /// Stable miss reason: the entity is present but its conversion
    /// era is incompatible with the caller's <c>RequireEra</c>
    /// declaration.
    /// </summary>
    public const string ReasonConversionEraMismatch = "conversion-era-mismatch";
}
