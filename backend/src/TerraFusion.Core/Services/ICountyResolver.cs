namespace TerraFusion.Core.Services;

/// <summary>
/// Resolves a county identifier that may be either a Guid string or a human-readable
/// county code/name (e.g. "benton") into the canonical County Guid.
///
/// All public API boundaries should accept a string and resolve via this service.
/// Internal service signatures (entities, repositories) remain Guid-typed.
/// </summary>
public interface ICountyResolver
{
    /// <summary>
    /// Resolve a county identifier to its canonical Guid.
    /// Accepts: Guid string ("19190019-1919-..."), county code/slug ("benton",
    /// case-insensitive), or county name ("Benton"). Match precedence:
    /// 1. Guid.TryParse succeeds and a County row with that Id exists → return it
    /// 2. Name match case-insensitive → return that County.Id
    /// 3. Throw CountyNotFoundException
    /// </summary>
    /// <exception cref="CountyNotFoundException">No county matches the input.</exception>
    Task<Guid> ResolveAsync(string countyIdOrCode, CancellationToken ct = default);

    /// <summary>
    /// Non-throwing variant. Returns null when no county matches.
    /// </summary>
    Task<Guid?> TryResolveAsync(string countyIdOrCode, CancellationToken ct = default);
}

public class CountyNotFoundException : Exception
{
    public string Input { get; }

    public CountyNotFoundException(string input)
        : base($"No county matches '{input}'. Accepted forms: Guid (e.g. '19190019-...') or county name ('benton').")
    {
        Input = input;
    }
}
