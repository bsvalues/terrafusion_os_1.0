using System.Collections.ObjectModel;

namespace TerraFusion.Core.Counties;

/// <summary>
/// Canonical, persistence-independent identity for a Washington county.
/// The persisted <c>County.Id</c> remains the runtime GUID authority; this
/// record supplies stable public keys used to locate that existing row.
/// </summary>
public sealed record WashingtonCountyIdentity(
    string Key,
    string Slug,
    string Name,
    string FipsCode)
{
    public string State => "WA";
    public string CountyCode => FipsCode[2..];
}

/// <summary>
/// The canonical 39-county Washington identity registry.
/// Unknown values never select a default county.
/// </summary>
public static class WashingtonCountyRegistry
{
    private static readonly ReadOnlyCollection<WashingtonCountyIdentity> CountyList =
        Array.AsReadOnly(
        new[]
        {
            County("Adams", "53001"),
            County("Asotin", "53003"),
            County("Benton", "53005"),
            County("Chelan", "53007"),
            County("Clallam", "53009"),
            County("Clark", "53011"),
            County("Columbia", "53013"),
            County("Cowlitz", "53015"),
            County("Douglas", "53017"),
            County("Ferry", "53019"),
            County("Franklin", "53021"),
            County("Garfield", "53023"),
            County("Grant", "53025"),
            County("Grays Harbor", "53027"),
            County("Island", "53029"),
            County("Jefferson", "53031"),
            County("King", "53033"),
            County("Kitsap", "53035"),
            County("Kittitas", "53037"),
            County("Klickitat", "53039"),
            County("Lewis", "53041"),
            County("Lincoln", "53043"),
            County("Mason", "53045"),
            County("Okanogan", "53047"),
            County("Pacific", "53049"),
            County("Pend Oreille", "53051"),
            County("Pierce", "53053"),
            County("San Juan", "53055"),
            County("Skagit", "53057"),
            County("Skamania", "53059"),
            County("Snohomish", "53061"),
            County("Spokane", "53063"),
            County("Stevens", "53065"),
            County("Thurston", "53067"),
            County("Wahkiakum", "53069"),
            County("Walla Walla", "53071"),
            County("Whatcom", "53073"),
            County("Whitman", "53075"),
            County("Yakima", "53077"),
        });

    private static readonly IReadOnlyDictionary<string, WashingtonCountyIdentity> AliasIndex =
        BuildAliasIndex();

    public static IReadOnlyList<WashingtonCountyIdentity> Counties => CountyList;

    public static bool TryResolve(string? value, out WashingtonCountyIdentity identity)
    {
        identity = null!;
        return !string.IsNullOrWhiteSpace(value)
            && AliasIndex.TryGetValue(value.Trim(), out identity!);
    }

    private static WashingtonCountyIdentity County(string name, string fipsCode)
    {
        var nameSlug = name.ToLowerInvariant().Replace(' ', '-');
        return new WashingtonCountyIdentity(
            Key: $"wa-{nameSlug}",
            Slug: $"{nameSlug}-wa",
            Name: name,
            FipsCode: fipsCode);
    }

    private static IReadOnlyDictionary<string, WashingtonCountyIdentity> BuildAliasIndex()
    {
        var aliases = new Dictionary<string, WashingtonCountyIdentity>(StringComparer.OrdinalIgnoreCase);

        foreach (var county in CountyList)
        {
            AddAlias(aliases, county.Key, county);
            AddAlias(aliases, county.Slug, county);
            AddAlias(aliases, county.Name, county);
            AddAlias(aliases, $"{county.Name} County", county);
            AddAlias(aliases, county.FipsCode, county);
            AddAlias(aliases, county.CountyCode, county);
        }

        return new ReadOnlyDictionary<string, WashingtonCountyIdentity>(aliases);
    }

    private static void AddAlias(
        IDictionary<string, WashingtonCountyIdentity> aliases,
        string alias,
        WashingtonCountyIdentity county)
    {
        if (aliases.TryGetValue(alias, out var existing) && existing != county)
        {
            throw new InvalidOperationException(
                $"Washington county alias '{alias}' is ambiguous between '{existing.Name}' and '{county.Name}'.");
        }

        aliases[alias] = county;
    }
}
